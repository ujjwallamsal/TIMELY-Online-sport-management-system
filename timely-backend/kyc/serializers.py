# kyc/serializers.py
from rest_framework import serializers
from .models import KycProfile, KycDocument


class KycDocumentSerializer(serializers.ModelSerializer):
    """Serializer for KYC document uploads"""
    
    class Meta:
        model = KycDocument
        fields = [
            'id', 'document_type', 'file', 'file_name', 'file_size', 
            'mime_type', 'is_verified', 'verified_at', 'verification_notes',
            'created_at'
        ]
        read_only_fields = [
            'id', 'file_name', 'file_size', 'mime_type', 'is_verified', 
            'verified_at', 'verification_notes', 'created_at'
        ]
    
    def validate_file(self, value):
        """Validate uploaded file"""
        if value:
            # Check file size (max 10MB)
            if value.size > 10 * 1024 * 1024:
                raise serializers.ValidationError("File size cannot exceed 10MB")
            
            # Check file type
            allowed_types = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
            if value.content_type not in allowed_types:
                raise serializers.ValidationError(
                    "Only JPEG, PNG, and PDF files are allowed"
                )
        
        return value


class KycProfileSerializer(serializers.ModelSerializer):
    """Serializer for KYC profile"""
    documents = KycDocumentSerializer(many=True, read_only=True)
    reviewed_by_email = serializers.EmailField(source='reviewed_by.email', read_only=True)
    
    class Meta:
        model = KycProfile
        fields = [
            'status', 'full_name', 'date_of_birth', 'nationality',
            'address', 'city', 'state', 'postal_code', 'country',
            'document_type', 'document_number', 'document_issuer', 'document_expiry',
            'reviewed_by_email', 'reviewed_at', 'review_notes', 'rejection_reason',
            'created_at', 'updated_at', 'submitted_at', 'documents'
        ]
        read_only_fields = [
            'reviewed_by_email', 'reviewed_at', 'review_notes', 'rejection_reason',
            'created_at', 'updated_at', 'submitted_at', 'documents'
        ]
    
    def validate_status(self, value):
        """Validate status changes"""
        if self.instance and self.instance.status in ['verified', 'waived', 'rejected']:
            # Only allow admin to change verified/waived/rejected status
            if not self.context.get('request').user.is_superuser:
                raise serializers.ValidationError(
                    "Only administrators can modify verified KYC profiles"
                )
        return value


class KycProfileCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating KYC profile"""
    
    class Meta:
        model = KycProfile
        fields = [
            'full_name', 'date_of_birth', 'nationality',
            'address', 'city', 'state', 'postal_code', 'country',
            'document_type', 'document_number', 'document_issuer', 'document_expiry'
        ]
    
    def create(self, validated_data):
        """Create KYC profile for the current user"""
        user = self.context['request'].user
        kyc_profile, created = KycProfile.objects.get_or_create(
            user=user,
            defaults=validated_data
        )
        if not created:
            # Update existing profile
            for attr, value in validated_data.items():
                setattr(kyc_profile, attr, value)
            kyc_profile.save()
        return kyc_profile


class KycProfileReviewSerializer(serializers.Serializer):
    """Serializer for admin KYC review"""
    action = serializers.ChoiceField(choices=['approve', 'waive', 'reject'])
    notes = serializers.CharField(required=False, allow_blank=True)
    reason = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, data):
        """Validate review action"""
        action = data.get('action')
        if action == 'reject' and not data.get('reason'):
            raise serializers.ValidationError({
                'reason': 'Rejection reason is required when rejecting KYC'
            })
        return data
