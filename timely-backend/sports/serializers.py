# sports/serializers.py
from rest_framework import serializers
from .models import Sport


class SportSerializer(serializers.ModelSerializer):
    """Serializer for Sport model"""
    
    class Meta:
        model = Sport
        fields = ['id', 'name', 'description', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_name(self, value):
        """Validate sport name"""
        if not value or not value.strip():
            raise serializers.ValidationError("Sport name cannot be empty")
        return value.strip()
