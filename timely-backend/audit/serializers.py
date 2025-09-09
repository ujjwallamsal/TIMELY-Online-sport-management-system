"""
Serializers for audit log API and CSV export
"""
from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer for audit log API responses"""
    
    actor_email = serializers.ReadOnlyField()
    target_display = serializers.ReadOnlyField()
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id',
            'actor_id',
            'actor_email',
            'action',
            'action_display',
            'target_type',
            'target_id',
            'target_display',
            'meta',
            'ip_address',
            'user_agent',
            'created_at',
        ]
        read_only_fields = fields


class AuditLogExportSerializer(serializers.ModelSerializer):
    """Serializer for CSV export of audit logs"""
    
    actor_email = serializers.ReadOnlyField()
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    target_display = serializers.ReadOnlyField()
    
    class Meta:
        model = AuditLog
        fields = [
            'id',
            'actor_email',
            'action',
            'action_display',
            'target_type',
            'target_id',
            'target_display',
            'ip_address',
            'user_agent',
            'created_at',
        ]
    
    def to_representation(self, instance):
        """Customize representation for CSV export"""
        data = super().to_representation(instance)
        
        # Format timestamps for CSV
        if data['created_at']:
            data['created_at'] = instance.created_at.strftime('%Y-%m-%d %H:%M:%S')
        
        # Flatten meta data for CSV
        if instance.meta:
            meta_str = ', '.join([f"{k}: {v}" for k, v in instance.meta.items()])
            data['meta'] = meta_str
        else:
            data['meta'] = ''
        
        return data
