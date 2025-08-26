# registrations/serializers.py
from __future__ import annotations
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Registration
# from .models import Registration, Document
from events.serializers import DivisionSerializer

User = get_user_model()

# Document serializers temporarily commented out for migration
# class DocumentSerializer(serializers.ModelSerializer):
#     file_size_mb = serializers.ReadOnlyField()
#     secure_url = serializers.ReadOnlyField()
#     
#     class Meta:
#         model = Document
#         fields = [
#             'id', 'document_type', 'title', 'description', 'file', 
#             'original_filename', 'file_size', 'file_size_mb', 'content_type',
#             'status', 'review_notes', 'secure_url', 'uploaded_at', 'updated_at'
#         ]
#         read_only_fields = [
#             'id', 'file_size', 'content_type', 'status', 'review_notes',
#             'uploaded_at', 'updated_at', 'original_filename'
#         ]
#     
#     def create(self, validated_data):
#         # Extract file metadata
#         file = validated_data['file']
#         validated_data['original_filename'] = file.name
#         validated_data['file_size'] = file.size
#         validated_data['content_type'] = file.content_type
#         return super().create(validated_data)

class RegistrationSerializer(serializers.ModelSerializer):
    # documents = DocumentSerializer(many=True, read_only=True)  # Temporarily commented out
    division_detail = DivisionSerializer(source='division', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    event_name = serializers.CharField(source='event.name', read_only=True)
    
    # Calculated fields
    is_team_registration = serializers.ReadOnlyField()
    team_size = serializers.ReadOnlyField()
    required_documents_complete = serializers.ReadOnlyField()
    can_be_approved = serializers.ReadOnlyField()
    
    # Payment fields
    payment_status_display = serializers.ReadOnlyField()
    payment_amount_dollars = serializers.ReadOnlyField()
    
    class Meta:
        model = Registration
        fields = [
            'id', 'event', 'event_name', 'user', 'user_name', 'user_email',
            'division', 'division_detail', 'registration_type', 'team_name', 'team_members',
            'status', 'kyc_status', 'emergency_contact_name', 'emergency_contact_phone', 
            'emergency_contact_relationship', 'medical_conditions', 'dietary_requirements',
            'is_paid', 'payment_reference', 'stripe_payment_intent_id', 'payment_amount_cents',
            'payment_currency', 'payment_date', 'payment_status_display', 'payment_amount_dollars',
            'reviewed_by', 'reviewed_at', 'rejection_reason', 'organizer_notes', 
            'created_at', 'updated_at', 'is_team_registration', 'team_size', 
            'required_documents_complete', 'can_be_approved'
        ]
        read_only_fields = [
            'id', 'user', 'reviewed_by', 'reviewed_at', 'created_at', 'updated_at',
            'stripe_payment_intent_id', 'payment_amount_cents', 'payment_currency', 'payment_date'
        ]

    def validate(self, data):
        # Validate team registration
        if data.get('registration_type') == Registration.RegistrationType.TEAM:
            if not data.get('team_name'):
                raise serializers.ValidationError({
                    'team_name': 'Team name is required for team registrations'
                })
            if not data.get('team_members'):
                raise serializers.ValidationError({
                    'team_members': 'Team members list is required for team registrations'
                })
        
        # Validate emergency contact
        required_contact_fields = ['emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship']
        for field in required_contact_fields:
            if not data.get(field):
                raise serializers.ValidationError({
                    field: f'{field.replace("_", " ").title()} is required'
                })
        
        return data

    def create(self, validated_data):
        # Set the user from request context
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['user'] = request.user
        else:
            raise serializers.ValidationError('Authentication required for registration')
        
        return super().create(validated_data)

class RegistrationCreateSerializer(RegistrationSerializer):
    """Serializer for creating registrations with simplified fields"""
    class Meta(RegistrationSerializer.Meta):
        fields = [
            'event', 'division', 'registration_type', 'team_name', 'team_members',
            'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship',
            'medical_conditions', 'dietary_requirements'
        ]

class RegistrationUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating registration status (organizer only)"""
    class Meta:
        model = Registration
        fields = ['status', 'rejection_reason', 'organizer_notes', 'is_paid']
    
    def update(self, instance, validated_data):
        # Set reviewer information
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if 'status' in validated_data and validated_data['status'] != instance.status:
                instance.reviewed_by = request.user
                instance.reviewed_at = timezone.now()
        
        return super().update(instance, validated_data)

class RegistrationListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for registration lists"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    event_name = serializers.CharField(source='event.name', read_only=True)
    division_name = serializers.CharField(source='division.name', read_only=True)
    documents_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Registration
        fields = [
            'id', 'event_name', 'user_name', 'user_email', 'division_name',
            'registration_type', 'team_name', 'status', 'is_paid',
            'documents_count', 'created_at'
        ]
    
    def get_documents_count(self, obj):
        # return obj.documents.count()  # Temporarily disabled
        return 0

# Document upload serializer temporarily commented out for migration
# class DocumentUploadSerializer(serializers.ModelSerializer):
#     """Serializer for document uploads"""
#     class Meta:
#         model = Document
#         fields = ['document_type', 'title', 'description', 'file']
#     
#     def create(self, validated_data):
#         # Extract file metadata
#         file = validated_data['file']
#         validated_data['original_filename'] = file.name
#         validated_data['file_size'] = file.size
#         validated_data['content_type'] = file.content_type
#         return super().create(validated_data)
