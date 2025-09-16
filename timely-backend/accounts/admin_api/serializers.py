# accounts/admin_api/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError

User = get_user_model()


class AdminUserSerializer(serializers.ModelSerializer):
    """Serializer for admin user management"""
    
    password = serializers.CharField(write_only=True, required=False)
    full_name = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 'full_name',
            'role', 'is_active', 'is_verified', 'email_verified',
            'phone_number', 'date_of_birth', 'address', 'city', 'state',
            'postal_code', 'country', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_verified', 'email_verified']
    
    def get_full_name(self, obj):
        """Get user's full name"""
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        return obj.email
    
    def validate_password(self, value):
        """Validate password strength"""
        if value:
            try:
                validate_password(value)
            except ValidationError as e:
                raise serializers.ValidationError(list(e.messages))
        return value
    
    def validate_email(self, value):
        """Validate email uniqueness"""
        if self.instance and self.instance.email == value:
            return value
        
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email already exists.")
        return value
    
    def validate_username(self, value):
        """Validate username uniqueness"""
        if self.instance and self.instance.username == value:
            return value
        
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("User with this username already exists.")
        return value
    
    def create(self, validated_data):
        """Create user with hashed password"""
        password = validated_data.pop('password', None)
        user = User.objects.create(**validated_data)
        
        if password:
            user.set_password(password)
            user.save()
        
        return user
    
    def update(self, instance, validated_data):
        """Update user with optional password change"""
        password = validated_data.pop('password', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        
        instance.save()
        return instance


class AdminUserListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for user lists"""
    
    full_name = serializers.SerializerMethodField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 'full_name',
            'role', 'role_display', 'is_active', 'is_verified', 'email_verified',
            'created_at', 'last_login'
        ]
    
    def get_full_name(self, obj):
        """Get user's full name"""
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        return obj.email


class AdminUserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new users"""
    
    password = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = [
            'email', 'username', 'first_name', 'last_name', 'password',
            'role', 'is_active', 'phone_number', 'date_of_birth',
            'address', 'city', 'state', 'postal_code', 'country'
        ]
    
    def validate_password(self, value):
        """Validate password strength"""
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value
    
    def validate_email(self, value):
        """Validate email uniqueness"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email already exists.")
        return value
    
    def validate_username(self, value):
        """Validate username uniqueness"""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("User with this username already exists.")
        return value
    
    def create(self, validated_data):
        """Create user with hashed password"""
        password = validated_data.pop('password')
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user
