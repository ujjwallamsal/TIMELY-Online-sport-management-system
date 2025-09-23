# accounts/serializers.py
from __future__ import annotations

from django.contrib.auth import get_user_model
from django.core.validators import EmailValidator
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from .models import User, UserRole, EmailVerificationToken, PasswordResetToken, RoleRequest
from common.models import AuditLog


User = get_user_model()
_HAS_EMAIL_VERIFIED = any(f.name == "email_verified" for f in User._meta.get_fields())
_HAS_EMAIL_TOKEN = any(f.name == "email_token" for f in User._meta.get_fields())


# ------------ Core user ------------

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "role",
            "is_active",
            "is_staff",
            "date_joined",
            "email_verified",
        ]
        read_only_fields = ["id", "is_staff", "date_joined", "email_verified"]


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["first_name", "last_name"]
        extra_kwargs = {f: {"required": False, "allow_blank": True} for f in fields}


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate_email(self, value):
        return value.lower().strip()


class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["email", "password", "first_name", "last_name", "role"]
        extra_kwargs = {"role": {"required": False}}

    def validate_email(self, value):
        value = value.lower().strip()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email already registered.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        role = validated_data.get("role") or getattr(User.Role, "SPECTATOR", "SPECTATOR")
        user = User.objects.create_user(password=password, role=role, **validated_data)
        return user


# ------------ Flows: email verify + password reset ------------

class EmailVerificationRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(validators=[EmailValidator()])

    def validate(self, attrs):
        email = attrs["email"].strip().lower()
        try:
            self.user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don’t leak whether an email exists
            self.user = None
        return attrs

    def save(self):
        if self.user and _HAS_EMAIL_TOKEN:
            self.user.email_token = new_token(16)
            self.user.save(update_fields=["email_token"])
            return {"token": self.user.email_token}
        # In dev, still return a shape
        return {"token": ""}


class EmailVerificationConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    token = serializers.CharField()

    def validate(self, attrs):
        email = attrs["email"].strip().lower()
        token = attrs["token"].strip()
        try:
            self.user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({"email": "Unknown email"})
        if not _HAS_EMAIL_TOKEN or self.user.email_token != token:
            raise serializers.ValidationError({"token": "Invalid token"})
        return attrs

    def save(self):
        updates = []
        if _HAS_EMAIL_VERIFIED:
            self.user.email_verified = True
            updates.append("email_verified")
        if _HAS_EMAIL_TOKEN:
            self.user.email_token = ""
            updates.append("email_token")
        if updates:
            self.user.save(update_fields=updates)
        return {"verified": True}


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(validators=[EmailValidator()])

    def validate(self, attrs):
        email = attrs["email"].strip().lower()
        try:
            self.user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don’t leak existence
            self.user = None
        return attrs

    def save(self):
        token = ""
        if self.user and _HAS_EMAIL_TOKEN:
            token = new_token(16)
            self.user.email_token = token
            self.user.save(update_fields=["email_token"])
        return {"token": token}


class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8, write_only=True)

    def validate(self, attrs):
        email = attrs["email"].strip().lower()
        token = attrs["token"].strip()
        try:
            self.user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError({"email": "Unknown email"})
        if not _HAS_EMAIL_TOKEN or self.user.email_token != token:
            raise serializers.ValidationError({"token": "Invalid token"})
        return attrs

    def save(self):
        pwd = self.validated_data["new_password"]
        self.user.set_password(pwd)
        updates = ["password"]
        if _HAS_EMAIL_TOKEN:
            self.user.email_token = ""
            updates.append("email_token")
        self.user.save(update_fields=updates)
        return {"reset": True}


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration - SPECTATOR ONLY"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['email', 'password', 'password_confirm', 'first_name', 'last_name']
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }
    
    def validate_email(self, value):
        """Validate email uniqueness"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate_password_confirm(self, value):
        """Validate password confirmation"""
        password = self.initial_data.get('password')
        if password and value and password != value:
            raise serializers.ValidationError("Passwords don't match.")
        return value
    
    def validate_password(self, value):
        """Validate password strength"""
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value
    
    def validate(self, data):
        """Validate registration data - enforce spectator-only"""
        # Remove any role fields that might be sent
        if 'role' in data:
            data.pop('role')
        if 'is_staff' in data:
            data.pop('is_staff')
        if 'is_superuser' in data:
            data.pop('is_superuser')
        
        return data
    
    def create(self, validated_data):
        """Create user with validated data - always SPECTATOR"""
        validated_data.pop('password_confirm')
        # Force role to SPECTATOR
        validated_data['role'] = User.Role.SPECTATOR
        user = User.objects.create_user(**validated_data)
        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login - accepts email or username"""
    email = serializers.CharField()  # Changed from EmailField to accept username too
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        """Validate login credentials - try email first, then username"""
        email_or_username = attrs.get('email')
        password = attrs.get('password')
        
        if email_or_username and password:
            user = None
            
            # Try to authenticate with email or username
            # The EmailOrUsernameModelBackend handles both cases with the username parameter
            user = authenticate(request=self.context.get('request'), username=email_or_username, password=password)
            
            if not user:
                raise serializers.ValidationError("Invalid email/username or password.")
            if not user.is_active:
                raise serializers.ValidationError("User account is disabled.")
            attrs['user'] = user
        else:
            raise serializers.ValidationError("Must include email/username and password.")
        
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile data"""
    full_name = serializers.ReadOnlyField()
    display_name = serializers.ReadOnlyField()
    is_verified = serializers.ReadOnlyField()
    primary_role_display = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 'full_name', 'display_name',
            'is_active', 'email_verified', 'date_joined', 'last_login',
            'phone_number', 'date_of_birth', 'address', 'city', 'state', 'postal_code',
            'country', 'profile_picture', 'bio', 'website', 'role', 'primary_role_display',
            'created_at', 'updated_at', 'is_verified'
        ]
        read_only_fields = ['id', 'email', 'is_active', 'email_verified', 'date_joined', 
                           'last_login', 'created_at', 'updated_at']


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile"""
    
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone_number', 'date_of_birth',
            'address', 'city', 'state', 'postal_code', 'country',
            'profile_picture', 'bio', 'website'
        ]
    
    def validate_phone_number(self, value):
        """Validate phone number format"""
        if value:
            from .models import User
            phone_regex = User.phone_regex
            if not phone_regex.regex.match(value):
                raise serializers.ValidationError("Invalid phone number format.")
        return value


class UserRoleSerializer(serializers.ModelSerializer):
    """Serializer for user roles"""
    role_type_display = serializers.CharField(source='get_role_type_display', read_only=True)
    
    class Meta:
        model = UserRole
        fields = [
            'id', 'role_type', 'role_type_display', 'is_primary', 'is_active',
            'can_manage_events', 'can_manage_teams', 'can_manage_users',
            'can_manage_fixtures', 'can_manage_results', 'can_manage_payments',
            'can_manage_content', 'can_view_reports', 'context_type', 'context_id',
            'assigned_at', 'expires_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'assigned_at', 'created_at', 'updated_at']


class UserRoleAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for assigning roles to users"""
    
    class Meta:
        model = UserRole
        fields = [
            'role_type', 'is_primary', 'can_manage_events', 'can_manage_teams',
            'can_manage_users', 'can_manage_fixtures', 'can_manage_results',
            'can_manage_payments', 'can_manage_content', 'can_view_reports',
            'context_type', 'context_id', 'expires_at'
        ]
    
    def validate(self, attrs):
        """Validate role assignment"""
        if attrs.get('is_primary'):
            # Check if user already has a primary role
            user = self.context.get('user')
            if user and UserRole.objects.filter(user=user, is_primary=True, is_active=True).exists():
                raise serializers.ValidationError("User already has a primary role.")
        return attrs


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for password change"""
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True)
    
    def validate_current_password(self, value):
        """Validate current password"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value
    
    def validate_new_password_confirm(self, value):
        """Validate password confirmation"""
        new_password = self.initial_data.get('new_password')
        if new_password and value and new_password != value:
            raise serializers.ValidationError("New passwords don't match.")
        return value
    
    def validate_new_password(self, value):
        """Validate new password strength"""
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for password reset request"""
    email = serializers.EmailField()
    
    def validate_email(self, value):
        """Validate email exists"""
        if not User.objects.filter(email=value, is_active=True).exists():
            raise serializers.ValidationError("No active user found with this email.")
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for password reset confirmation"""
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8)
    new_password_confirm = serializers.CharField(write_only=True)
    
    def validate_new_password_confirm(self, value):
        """Validate password confirmation"""
        new_password = self.initial_data.get('new_password')
        if new_password and value and new_password != value:
            raise serializers.ValidationError("New passwords don't match.")
        return value
    
    def validate_new_password(self, value):
        """Validate new password strength"""
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value


class EmailVerificationSerializer(serializers.Serializer):
    """Serializer for email verification"""
    token = serializers.CharField()


class UserListSerializer(serializers.ModelSerializer):
    """Serializer for listing users (admin only)"""
    full_name = serializers.ReadOnlyField()
    primary_role_display = serializers.ReadOnlyField()
    roles_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'first_name', 'last_name', 'is_active',
            'email_verified', 'role', 'primary_role_display', 'date_joined',
            'last_login', 'roles_count', 'created_at'
        ]
        read_only_fields = ['id', 'email', 'date_joined', 'last_login', 'created_at']
    
    def get_roles_count(self, obj):
        """Get count of active roles"""
        return obj.roles.filter(is_active=True).count()


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer for audit logs"""
    actor_display = serializers.CharField(source='actor.display_name', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'actor', 'actor_display', 'action', 'action_display',
            'target_type', 'target_id', 'target_description', 'details', 'ip_address',
            'user_agent', 'timestamp'
        ]
        read_only_fields = ['id', 'actor', 'timestamp']


class UserRoleUpdateSerializer(serializers.Serializer):
    """Serializer for updating user role (admin only)"""
    role = serializers.ChoiceField(choices=User.Role.choices)
    
    def validate_role(self, value):
        """Validate role choice"""
        if value not in dict(User.Role.choices):
            raise serializers.ValidationError("Invalid role choice.")
        return value


# ===== ROLE REQUEST SERIALIZERS =====

class RoleRequestSerializer(serializers.ModelSerializer):
    """Serializer for role requests"""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_display_name = serializers.CharField(source='user.display_name', read_only=True)
    requested_role_display = serializers.CharField(source='get_requested_role_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    reviewed_by_email = serializers.EmailField(source='reviewed_by.email', read_only=True)
    
    class Meta:
        model = RoleRequest
        fields = [
            'id', 'user', 'user_email', 'user_display_name', 'requested_role', 
            'requested_role_display', 'status', 'status_display', 'note',
            'organization_name', 'organization_website', 'coaching_experience', 
            'sport_discipline', 'reviewed_by_email', 'reviewed_at', 
            'review_notes', 'rejection_reason', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'user_email', 'user_display_name', 'requested_role_display',
            'status_display', 'reviewed_by_email', 'reviewed_at', 'review_notes',
            'rejection_reason', 'created_at', 'updated_at'
        ]
    
    def validate_requested_role(self, value):
        """Validate requested role - no ADMIN requests allowed"""
        if value == 'ADMIN':
            raise serializers.ValidationError(
                "Admin role cannot be requested. Only backend superusers can be admins."
            )
        return value


class RoleRequestCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating role requests"""
    
    class Meta:
        model = RoleRequest
        fields = [
            'requested_role', 'note', 'organization_name', 'organization_website',
            'coaching_experience', 'sport_discipline'
        ]
    
    def validate_requested_role(self, value):
        """Validate requested role - no ADMIN requests allowed"""
        if value == 'ADMIN':
            raise serializers.ValidationError(
                "Admin role cannot be requested. Only backend superusers can be admins."
            )
        return value
    
    def validate(self, data):
        """Validate role-specific fields"""
        requested_role = data.get('requested_role')
        
        if requested_role == 'ORGANIZER':
            if not data.get('organization_name'):
                raise serializers.ValidationError({
                    'organization_name': 'Organization name is required for Organizer role'
                })
        elif requested_role == 'COACH':
            if not data.get('coaching_experience'):
                raise serializers.ValidationError({
                    'coaching_experience': 'Coaching experience is required for Coach role'
                })
        elif requested_role == 'ATHLETE':
            if not data.get('sport_discipline'):
                raise serializers.ValidationError({
                    'sport_discipline': 'Sport discipline is required for Athlete role'
                })
        
        return data


class RoleRequestReviewSerializer(serializers.Serializer):
    """Serializer for admin role request review"""
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    notes = serializers.CharField(required=False, allow_blank=True)
    reason = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, data):
        """Validate review action"""
        action = data.get('action')
        if action == 'reject' and not data.get('reason'):
            raise serializers.ValidationError({
                'reason': 'Rejection reason is required when rejecting role request'
            })
        return data


class UserProfileWithKycSerializer(serializers.ModelSerializer):
    """Extended user profile serializer with KYC status and pending role request"""
    kyc_status = serializers.CharField(source='kyc_profile.status', read_only=True)
    pending_role_request = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 'full_name',
            'display_name', 'role', 'is_active', 'email_verified', 'date_joined',
            'last_login', 'kyc_status', 'pending_role_request'
        ]
        read_only_fields = [
            'id', 'email', 'username', 'role', 'is_active', 'email_verified',
            'date_joined', 'last_login', 'kyc_status', 'pending_role_request'
        ]
    
    def get_pending_role_request(self, obj):
        """Get the user's pending role request"""
        from accounts.models import RoleRequest
        pending_request = obj.role_requests.filter(status=RoleRequest.Status.PENDING).first()
        if pending_request:
            return RoleRequestSerializer(pending_request).data
        return None
