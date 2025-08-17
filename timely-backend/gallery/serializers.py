from rest_framework import serializers
from .models import Album, MediaAsset
from .models import Media

class MediaAssetSerializer(serializers.ModelSerializer):
    share_url = serializers.SerializerMethodField()

    class Meta:
        model = MediaAsset
        fields = [
            "id", "album", "kind", "file", "external_url",
            "caption", "is_public", "uploaded_by", "uploaded_at",
            "share_url",
        ]
        read_only_fields = ["uploaded_by", "uploaded_at", "share_url"]

    def get_share_url(self, obj: MediaAsset) -> str:
        """
        Public URL the frontend can share on social.
        We’ll point to the public media detail endpoint.
        """
        request = self.context.get("request")
        if not request:
            return ""
        return request.build_absolute_uri(f"/api/public/media/{obj.id}/")


class AlbumSerializer(serializers.ModelSerializer):
    assets = MediaAssetSerializer(many=True, read_only=True)
    share_url = serializers.SerializerMethodField()

    class Meta:
        model = Album
        fields = [
            "id", "event", "match", "title", "description", "is_public",
            "created_by", "created_at", "assets", "share_url",
        ]
        read_only_fields = ["created_by", "created_at", "assets", "share_url"]

    def get_share_url(self, obj: Album) -> str:
        request = self.context.get("request")
        if not request:
            return ""

        return request.build_absolute_uri(f"/api/public/albums/{obj.id}/")



class MediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Media
        fields = "__all__"
        read_only_fields = ["uploaded_by", "created_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            validated_data["uploaded_by"] = request.user
        return super().create(validated_data)
