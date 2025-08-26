# accounts/serializers.py
from __future__ import annotations

from django.contrib.auth import get_user_model
from django.core.validators import EmailValidator
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.utils import timezone
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from .models import User, UserRole, EmailVerificationToken, PasswordResetToken, AuditLog


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
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, style={'input_type': 'password'})
    
    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name', 'password', 'password_confirm',
            'role'
        ]
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': False},
            'last_name': {'required': False},
            'role': {'required': False, 'default': 'SPECTATOR'}
        }
    
    def validate_email(self, value):
        """Validate email format and uniqueness"""
        try:
            validate_email(value)
        except ValidationError:
            raise serializers.ValidationError("Enter a valid email address.")
        
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        
        return value.lower()
    
    def validate(self, data):
        """Validate password confirmation"""
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Passwords do not match.")
        return data
    
    def create(self, validated_data):
        """Create new user"""
        validated_data.pop('password_confirm')
        role = validated_data.get('role', 'SPECTATOR')
        
        # Create user with the specified role
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=role
        )
        
        # Log user creation
        AuditLog.log_action(
            user=user,
            action=AuditLog.ActionType.CREATE,
            resource_type='User',
            resource_id=str(user.id),
            details={'email': user.email, 'method': 'registration', 'role': role}
        )
        
        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    email = serializers.EmailField()
    password = serializers.CharField(style={'input_type': 'password'})
    
    def validate(self, data):
        """Validate login credentials"""
        email = data.get('email', '').lower()
        password = data.get('password', '')
        
        if email and password:
            # Django's ModelBackend expects the USERNAME_FIELD kwarg name to be
            # "username" even if the underlying field is email. Since our
            # custom User sets USERNAME_FIELD = "email", we should pass the
            # value via the "username" parameter for compatibility.
            user = authenticate(username=email, password=password)
            if user:
                if not user.is_active:
                    raise serializers.ValidationError("User account is disabled.")
                data['user'] = user
                # Best-effort audit; do not fail auth if audit table isn't present
                try:
                    AuditLog.log_action(
                        user=user,
                        action=AuditLog.ActionType.LOGIN,
                        resource_type='User',
                        resource_id=str(user.id),
                        details={'email': user.email, 'method': 'email_password'}
                    )
                except Exception:
                    pass
                return data
            else:
                raise serializers.ValidationError("Invalid email or password.")
        else:
            raise serializers.ValidationError("Must include email and password.")
        
        return data


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile display and update"""
    email = serializers.EmailField(read_only=True)
    email_verified = serializers.BooleanField(read_only=True)
    date_joined = serializers.DateTimeField(read_only=True)
    last_login = serializers.DateTimeField(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'role', 'email_verified',
            'phone_number', 'date_of_birth', 'address', 'city', 'state',
            'postal_code', 'country', 'profile_picture', 'bio', 'website',
            'social_media', 'preferences', 'date_joined', 'last_login',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'email', 'email_verified', 'date_joined', 'last_login', 'created_at', 'updated_at']
    
    def update(self, instance, validated_data):
        """Update user profile with audit logging"""
        old_data = {
            'first_name': instance.first_name,
            'last_name': instance.last_name,
            'phone_number': instance.phone_number,
            'address': instance.address,
            'city': instance.city,
            'state': instance.state,
            'postal_code': instance.postal_code,
            'country': instance.country,
            'bio': instance.bio,
            'website': instance.website,
        }
        
        # Update user
        user = super().update(instance, validated_data)
        
        # Log profile update
        AuditLog.log_action(
            user=self.context['request'].user,
            action=AuditLog.ActionType.UPDATE,
            resource_type='UserProfile',
            resource_id=str(user.id),
            details={
                'old_data': old_data,
                'new_data': validated_data,
                'updated_fields': list(validated_data.keys())
            }
        )
        
        return user


class UserRoleSerializer(serializers.ModelSerializer):
    """Serializer for user roles"""
    role_type_display = serializers.CharField(source='get_role_type_display', read_only=True)
    assigned_by_display = serializers.CharField(source='assigned_by.display_name', read_only=True)
    
    class Meta:
        model = UserRole
        fields = [
            'id', 'role_type', 'role_type_display', 'is_primary', 'context_type',
            'context_id', 'assigned_by', 'assigned_by_display', 'assigned_at',
            'expires_at', 'is_active', 'created_at', 'updated_at',
            'can_manage_events', 'can_manage_teams', 'can_manage_users',
            'can_manage_fixtures', 'can_manage_results', 'can_manage_payments',
            'can_manage_content', 'can_view_reports'
        ]
        read_only_fields = ['id', 'assigned_by', 'assigned_by_display', 'assigned_at', 'created_at', 'updated_at']


class UserRoleAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for assigning roles to users"""
    user_email = serializers.EmailField(write_only=True)
    role_type = serializers.ChoiceField(choices=UserRole.RoleType.choices)
    
    class Meta:
        model = UserRole
        fields = [
            'user_email', 'role_type', 'is_primary', 'context_type', 'context_id',
            'expires_at', 'can_manage_events', 'can_manage_teams', 'can_manage_users',
            'can_manage_fixtures', 'can_manage_results', 'can_manage_payments',
            'can_manage_content', 'can_view_reports'
        ]
    
    def validate_user_email(self, value):
        """Validate user exists"""
        try:
            user = User.objects.get(email=value.lower())
            return user
        except User.DoesNotExist:
            raise serializers.ValidationError("User with this email does not exist.")
    
    def validate(self, data):
        """Validate role assignment"""
        user = data['user_email']  # This is actually the user object now
        role_type = data['role_type']
        context_type = data.get('context_type')
        context_id = data.get('context_id')
        
        # Check if role already exists
        existing_role = UserRole.objects.filter(
            user=user,
            role_type=role_type,
            context_type=context_type,
            context_id=context_id,
            is_active=True
        ).first()
        
        if existing_role:
            raise serializers.ValidationError("User already has this role in this context.")
        
        # If setting as primary, remove other primary roles
        if data.get('is_primary', False):
            UserRole.objects.filter(user=user, is_primary=True).update(is_primary=False)
        
        return data
    
    def create(self, validated_data):
        """Create user role with audit logging"""
        user = validated_data.pop('user_email')
        
        role = UserRole.objects.create(
            user=user,
            assigned_by=self.context['request'].user,
            **validated_data
        )
        
        # Log role assignment
        AuditLog.log_action(
            user=self.context['request'].user,
            action=AuditLog.ActionType.ROLE_ASSIGNMENT,
            resource_type='UserRole',
            resource_id=str(role.id),
            details={
                'assigned_user': user.email,
                'role_type': role.role_type,
                'context_type': role.context_type,
                'context_id': role.context_id,
                'permissions': {
                    'can_manage_events': role.can_manage_events,
                    'can_manage_teams': role.can_manage_teams,
                    'can_manage_users': role.can_manage_users,
                    'can_manage_fixtures': role.can_manage_fixtures,
                    'can_manage_results': role.can_manage_results,
                    'can_manage_payments': role.can_manage_payments,
                    'can_manage_content': role.can_manage_content,
                    'can_view_reports': role.can_view_reports,
                }
            }
        )
        
        return role


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for password change"""
    current_password = serializers.CharField(style={'input_type': 'password'})
    new_password = serializers.CharField(min_length=8, style={'input_type': 'password'})
    new_password_confirm = serializers.CharField(style={'input_type': 'password'})
    
    def validate_current_password(self, value):
        """Validate current password"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value
    
    def validate(self, data):
        """Validate password confirmation"""
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError("New passwords do not match.")
        return data


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for password reset request"""
    email = serializers.EmailField()
    
    def validate_email(self, value):
        """Validate email exists"""
        if not User.objects.filter(email=value.lower(), is_active=True).exists():
            raise serializers.ValidationError("No active user found with this email address.")
        return value.lower()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for password reset confirmation"""
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8, style={'input_type': 'password'})
    new_password_confirm = serializers.CharField(style={'input_type': 'password'})
    
    def validate(self, data):
        """Validate token and password confirmation"""
        token = data['token']
        new_password = data['new_password']
        new_password_confirm = data['new_password_confirm']
        
        # Validate token
        try:
            reset_token = PasswordResetToken.objects.get(
                token=token,
                is_used=False,
                expires_at__gt=timezone.now()
            )
            data['reset_token'] = reset_token
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError("Invalid or expired reset token.")
        
        # Validate password confirmation
        if new_password != new_password_confirm:
            raise serializers.ValidationError("Passwords do not match.")
        
        return data


class EmailVerificationSerializer(serializers.Serializer):
    """Serializer for email verification"""
    token = serializers.CharField()
    
    def validate_token(self, value):
        """Validate verification token"""
        try:
            verification_token = EmailVerificationToken.objects.get(
                token=value,
                is_used=False,
                expires_at__gt=timezone.now()
            )
            return verification_token
        except EmailVerificationToken.DoesNotExist:
            raise serializers.ValidationError("Invalid or expired verification token.")


class UserListSerializer(serializers.ModelSerializer):
    """Serializer for user list display (admin use)"""
    roles = serializers.SerializerMethodField()
    is_verified = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'is_active', 'is_verified',
            'date_joined', 'last_login', 'roles'
        ]
    
    def get_roles(self, obj):
        """Get user's primary role"""
        primary_role = getattr(obj, 'roles', None)
        if hasattr(primary_role, 'filter'):
            role = primary_role.filter(is_active=True).first()
            if role:
                return {
                    'role_type': role.role_type,
                    'is_primary': role.is_primary,
                }
        return None

    def get_is_verified(self, obj):
        return bool(getattr(obj, 'email_verified', False))


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer for audit logs"""
    user_email = serializers.CharField(source='user.email', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_email', 'action', 'action_display', 'resource_type',
            'resource_id', 'details', 'ip_address', 'user_agent', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'user_email', 'action_display', 'created_at']
