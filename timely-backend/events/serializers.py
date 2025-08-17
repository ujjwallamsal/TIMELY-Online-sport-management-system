from rest_framework import serializers
from .models import Event
from venues.serializers import VenueSerializer

class EventSerializer(serializers.ModelSerializer):
    venue_detail = VenueSerializer(source="venue", read_only=True)

    class Meta:
        model = Event
        fields = [
            "id","name","sport_type","start_date","end_date",
            "venue","venue_detail","status","eligibility_notes","created_by"
        ]
        read_only_fields = ["id","created_by"]

    def create(self, validated):
        validated["created_by"] = self.context["request"].user if self.context["request"].user.is_authenticated else None
        return super().create(validated)
