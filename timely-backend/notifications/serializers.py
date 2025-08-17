from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = "__all__"

class NotificationSerializer(serializers.ModelSerializer):
    is_read = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ["id", "recipient", "title", "body", "read_at", "is_read", "created_at"]
        read_only_fields = ["id", "read_at", "created_at"]

    def get_is_read(self, obj):
        return bool(getattr(obj, "read_at", None))
