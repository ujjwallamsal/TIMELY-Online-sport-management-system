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
            'type', 'team_name', 'status', 'payment_status', 'fee_dollars',
            'submitted_at', 'user_name'
        ]


class RegistrationDetailSerializer(serializers.ModelSerializer):
    """Serializer for registration detail views"""
    
    event_name = serializers.CharField(source='event.name', read_only=True)
    event_sport = serializers.CharField(source='event.sport', read_only=True)
    event_start_date = serializers.DateTimeField(source='event.start_datetime', read_only=True)
    event_end_date = serializers.DateTimeField(source='event.end_datetime', read_only=True)
    event_location = serializers.CharField(source='event.location', read_only=True)
    division_name = serializers.CharField(source='division.name', read_only=True)
    user_name = serializers.CharField(source='user.email', read_only=True)
    decided_by_name = serializers.CharField(source='decided_by.email', read_only=True)
    fee_dollars = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    documents = RegistrationDocumentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Registration
        fields = [
            'id', 'event_name', 'event_sport', 'event_start_date', 'event_end_date',
            'event_location', 'division_name', 'type', 'team_name', 'team_manager_name',
            'team_contact', 'status', 'payment_status', 'fee_dollars', 'user_name',
            'submitted_at', 'decided_at', 'decided_by_name', 'reason', 'documents'
        ]


class RegistrationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating registrations"""
    
    class Meta:
        model = Registration
        fields = [
            'event', 'division', 'type', 'team_name', 'team_manager_name', 'team_contact'
        ]
    
    def validate(self, data):
        """Validate registration data"""
        event = data.get('event')
        division = data.get('division')
        reg_type = data.get('type')
        team_name = data.get('team_name')
        
        # Check if event is published and within registration window
        if not event.lifecycle_status == 'published':
            raise serializers.ValidationError("Event is not published")
        
        now = timezone.now()
        if event.registration_open_at and now < event.registration_open_at:
            raise serializers.ValidationError("Registration is not yet open")
        
        if event.registration_close_at and now > event.registration_close_at:
            raise serializers.ValidationError("Registration is closed")
        
        # Validate division belongs to event
        if division and division.event != event:
            raise serializers.ValidationError("Division does not belong to this event")
        
        # Validate team registration requirements
        if reg_type == 'team' and not team_name:
            raise serializers.ValidationError("Team name is required for team registrations")
        
        # Set fee from event
        data['fee_cents'] = event.fee_cents
        
        return data
    
    def create(self, validated_data):
        """Create registration with user from context"""
        validated_data['user'] = self.context['request'].user
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