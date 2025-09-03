from django.contrib import admin
from .models import Album, MediaAsset, Media

@admin.action(description="Approve selected media")
def approve_media(modeladmin, request, queryset):
	updated = queryset.update(is_approved=True)
	modeladmin.message_user(request, f"Approved {updated} media items")

@admin.action(description="Reject selected media")
def reject_media(modeladmin, request, queryset):
	updated = queryset.update(is_approved=False)
	modeladmin.message_user(request, f"Rejected {updated} media items")

@admin.register(Album)
class AlbumAdmin(admin.ModelAdmin):
	list_display = ["title", "event", "fixture", "is_public", "created_by", "created_at"]
	list_filter = ["is_public", "event", "created_at"]
	search_fields = ["title", "event__name", "fixture__id", "created_by__email"]
	ordering = ["-created_at"]

@admin.register(MediaAsset)
class MediaAssetAdmin(admin.ModelAdmin):
	list_display = ["album", "kind", "caption", "is_public", "uploaded_by", "uploaded_at"]
	list_filter = ["kind", "is_public", "uploaded_at"]
	search_fields = ["album__title", "caption", "uploaded_by__email"]
	ordering = ["-uploaded_at"]

@admin.register(Media)
class MediaAdmin(admin.ModelAdmin):
	list_display = ["event", "media_type", "caption", "is_approved", "created_at"]
	list_filter = ["media_type", "is_approved", "created_at"]
	search_fields = ["event__name", "caption"]
	ordering = ["-created_at"]
	actions = [approve_media, reject_media]
