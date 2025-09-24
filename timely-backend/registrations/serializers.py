from rest_framework import serializers
from django.utils import timezone
from .models import Registration, RegistrationDocument, RegistrationPaymentLog
from events.models import Event, Division
from accounts.models import User


class RegistrationDocumentSerializer(serializers.ModelSerializer):
    """Serializer for registration documents"""
    
    class Meta:
        model = RegistrationDocument
        fields = [
            'id', 'doc_type', 'file', 'uploaded_at', 
            'approved_by', 'approved_at', 'note'
        ]
        read_only_fields = ['id', 'uploaded_at', 'approved_by', 'approved_at']


class RegistrationListSerializer(serializers.ModelSerializer):
    """Serializer for registration list views"""
    
    event_name = serializers.CharField(source='event.name', read_only=True)
    event_sport = serializers.CharField(source='event.sport', read_only=True)
    event_start_date = serializers.DateTimeField(source='event.start_datetime', read_only=True)
    division_name = serializers.CharField(source='division.name', read_only=True)
    user_name = serializers.CharField(source='user.email', read_only=True)
    fee_dollars = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = Registration
        fields = [
            'id', 'event_name', 'event_sport', 'event_start_date', 'division_name',
            'type', 'team', 'status', 'fee_dollars',
            'submitted_at', 'user_name'
        ]


class RegistrationDetailSerializer(serializers.ModelSerializer):
    """Serializer for registration detail views"""
    
    documents = RegistrationDocumentSerializer(many=True, read_only=True)
    applicant_name = serializers.SerializerMethodField()
    team_name = serializers.SerializerMethodField()
    user_id = serializers.IntegerField(source='applicant_user.id', read_only=True)
    team_id = serializers.IntegerField(source='applicant_team.id', read_only=True)
    
    class Meta:
        model = Registration
        fields = [
            'id', 'event', 'type', 'applicant_user', 'applicant_name', 'user_id',
            'applicant_team', 'team_name', 'team_id', 'status', 'docs',
            'submitted_at', 'decided_at', 'decided_by', 'reason', 'documents'
        ]
    
    def get_applicant_name(self, obj):
        """Get applicant name from new fields"""
        if obj.applicant_user:
            return obj.applicant_user.full_name
        elif obj.applicant_team:
            return obj.applicant_team.name
        # Fallback to legacy fields
        elif obj.applicant:
            return obj.applicant.full_name
        elif obj.team:
            return obj.team.name
        return "Unknown"
    
    def get_team_name(self, obj):
        """Get team name from new fields"""
        if obj.applicant_team:
            return obj.applicant_team.name
        # Fallback to legacy field
        elif obj.team:
            return obj.team.name
        return None


class RegistrationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating registrations"""
    user_id = serializers.IntegerField(write_only=True, required=False)
    team_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = Registration
        fields = [
            'event', 'type', 'user_id', 'team_id', 'docs'
        ]
    
    def validate(self, data):
        """Validate registration data"""
        event = data.get('event')
        reg_type = data.get('type')
        user_id = data.get('user_id')
        team_id = data.get('team_id')
        
        # Check if event is published and within registration window
        if event.status != 'published':
            raise serializers.ValidationError("Event is not published")
        
        now = timezone.now()
        if event.registration_open_at and now < event.registration_open_at:
            raise serializers.ValidationError("Registration is not yet open")
        
        if event.registration_close_at and now > event.registration_close_at:
            raise serializers.ValidationError("Registration is closed")
        
        # Validate registration requirements
        if reg_type == Registration.Type.TEAM:
            if not team_id:
                raise serializers.ValidationError("team_id is required for team registrations")
            # Validate team exists
            try:
                from teams.models import Team
                team = Team.objects.get(id=team_id)
                data['applicant_team'] = team
            except Team.DoesNotExist:
                raise serializers.ValidationError("Team not found")
        elif reg_type == Registration.Type.ATHLETE:
            if not user_id:
                raise serializers.ValidationError("user_id is required for athlete registrations")
            # Validate user exists
            try:
                from accounts.models import User
                user = User.objects.get(id=user_id)
                data['applicant_user'] = user
            except User.DoesNotExist:
                raise serializers.ValidationError("User not found")
        
        elif reg_type == Registration.Type.SPECTATOR:
            # Spectator creates a placeholder registration without applicant entities.
            data['applicant_user'] = None
            data['applicant_team'] = None

        return data
    
    def create(self, validated_data):
        """Create registration with proper applicant fields"""
        # Remove the write-only fields
        validated_data.pop('user_id', None)
        validated_data.pop('team_id', None)
        
        # Set fee_cents from event if not provided
        if 'fee_cents' not in validated_data and validated_data.get('event'):
            validated_data['fee_cents'] = validated_data['event'].fee_cents
            
        return super().create(validated_data)


class RegistrationWithdrawSerializer(serializers.Serializer):
    """Serializer for withdrawing registrations"""
    
    reason = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, data):
        """Validate withdrawal"""
        registration = self.context['registration']
        
        if registration.status in ['rejected', 'withdrawn']:
            raise serializers.ValidationError("Cannot withdraw a registration that is already rejected or withdrawn")
        
        return data


class RegistrationStatusActionSerializer(serializers.Serializer):
    """Serializer for status actions (approve, reject, waitlist)"""
    
    reason = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, data):
        """Validate status action"""
        registration = self.context['registration']
        action = self.context['action']
        
        if action == 'approve':
            if registration.status != 'pending':
                raise serializers.ValidationError("Can only approve pending registrations")
            
            # Check if required documents are present
            required_docs = ['id_card', 'medical_clearance']
            uploaded_docs = set(registration.documents.values_list('doc_type', flat=True))
            missing_docs = set(required_docs) - uploaded_docs
            
            if missing_docs:
                raise serializers.ValidationError(f"Missing required documents: {', '.join(missing_docs)}")
        
        elif action == 'reject':
            if registration.status in ['rejected', 'withdrawn']:
                raise serializers.ValidationError("Cannot reject a registration that is already rejected or withdrawn")
        
        elif action == 'waitlist':
            if registration.status in ['rejected', 'withdrawn']:
                raise serializers.ValidationError("Cannot waitlist a registration that is already rejected or withdrawn")
        
        return data


class RegistrationDocumentUploadSerializer(serializers.ModelSerializer):
    """Serializer for uploading registration documents"""
    
    class Meta:
        model = RegistrationDocument
        fields = ['doc_type', 'file', 'note']
    
    def validate_file(self, value):
        """Validate uploaded file"""
        # Check file size (max 10MB)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("File size cannot exceed 10MB")
        
        return value
    
    def create(self, validated_data):
        """Create document with registration from context"""
        validated_data['registration'] = self.context['registration']
        return super().create(validated_data)


class PaymentIntentSerializer(serializers.Serializer):
    """Serializer for creating payment intents"""
    
    def validate(self, data):
        """Validate payment intent creation"""
        registration = self.context['registration']
        
        if registration.payment_status == 'paid':
            raise serializers.ValidationError("Registration is already paid")
        
        if registration.fee_cents == 0:
            raise serializers.ValidationError("No payment required for this registration")
        
        return data


class PaymentConfirmSerializer(serializers.Serializer):
    """Serializer for confirming payments"""
    
    client_secret = serializers.CharField()
    
    def validate(self, data):
        """Validate payment confirmation"""
        registration = self.context['registration']
        
        if registration.payment_status == 'paid':
            raise serializers.ValidationError("Registration is already paid")
        
        return data


class RegistrationPaymentLogSerializer(serializers.ModelSerializer):
    """Serializer for payment logs"""
    
    class Meta:
        model = RegistrationPaymentLog
        fields = [
            'id', 'provider', 'provider_ref', 'kind', 
            'amount_cents', 'status', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']