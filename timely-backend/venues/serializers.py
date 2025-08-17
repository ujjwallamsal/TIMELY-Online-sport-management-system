# venues/serializers.py
from __future__ import annotations
from rest_framework import serializers
from .models import Venue

class VenueSerializer(serializers.ModelSerializer):
    facilities_list = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Venue
        fields = [
            "id", "name", "address", "city", "state", "country",
            "capacity", "indoor", "facilities", "facilities_list",
            "latitude", "longitude", "notes", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "facilities_list"]

    def get_facilities_list(self, obj: Venue) -> list[str]:
        return obj.facilities_list()
