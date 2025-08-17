from django.contrib import admin
from .models import Album, MediaAsset

@admin.register(Album)
class AlbumAdmin(admin.ModelAdmin):
    list_display = ("title", "event", "match", "is_public", "created_by", "created_at")
    list_filter = ("is_public", "event")
    search_fields = ("title", "description", "event__name")

@admin.register(MediaAsset)
class MediaAssetAdmin(admin.ModelAdmin):
    list_display = ("album", "kind", "is_public", "uploaded_by", "uploaded_at")
    list_filter = ("kind", "is_public", "album__event")
    search_fields = ("caption", "album__title")
