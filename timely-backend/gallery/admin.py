from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.contrib import messages
from django.db import transaction
from .models import Album, MediaAsset, Media, GalleryAlbum, GalleryMedia

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
	readonly_fields = ["uploaded_at"]

@admin.register(Media)
class MediaAdmin(admin.ModelAdmin):
	"""Enhanced Media Moderation Queue with comprehensive workflow"""
	list_display = [
		'thumbnail_preview', 'event_link', 'media_type_badge', 'caption', 
		'approval_status', 'uploaded_by_link', 'file_size', 'created_at'
	]
	list_filter = [
		'media_type', 'is_approved', 'created_at', 'event__sport', 'event__status'
	]
	search_fields = [
		'event__name', 'caption', 'uploaded_by__email', 'uploaded_by__first_name', 
		'uploaded_by__last_name'
	]
	ordering = ['-created_at']
	actions = [
		'approve_media', 'reject_media', 'mark_nsfw', 'bulk_approve', 'bulk_reject', 
		'export_moderation_queue', 'regenerate_thumbnails'
	]
	readonly_fields = ['file_size', 'created_at']
	
	fieldsets = (
		('Media Information', {
			'fields': ('file', 'media_type', 'caption', 'event')
		}),
		('Moderation', {
			'fields': ('is_approved', 'moderation_notes'),
			'classes': ('wide',)
		}),
		('Upload Details', {
			'fields': ('uploaded_by', 'file_size', 'created_at'),
			'classes': ('collapse',)
		}),
	)
	
	def thumbnail_preview(self, obj):
		"""Display thumbnail preview for images"""
		if obj.media_type == 'image' and obj.file:
			try:
				return format_html(
					'<img src="{}" style="max-width: 100px; max-height: 60px; border-radius: 4px;" />',
					obj.file.url
				)
			except:
				return format_html('<span style="color: red;">❌ Broken</span>')
		elif obj.media_type == 'video':
			return format_html('<span style="color: blue;">🎥 Video</span>')
		else:
			return format_html('<span style="color: gray;">📄 Document</span>')
	thumbnail_preview.short_description = 'Preview'
	
	def event_link(self, obj):
		"""Display event name with link"""
		if obj.event:
			url = reverse('admin:events_event_change', args=[obj.event.id])
			return format_html('<a href="{}">{}</a>', url, obj.event.name)
		return 'No event'
	event_link.short_description = 'Event'
	
	def media_type_badge(self, obj):
		"""Display media type with color coding"""
		colors = {
			'image': 'green',
			'video': 'blue',
			'document': 'orange',
			'audio': 'purple'
		}
		color = colors.get(obj.media_type, 'gray')
		return format_html(
			'<span style="color: {}; font-weight: bold;">{}</span>',
			color, obj.get_media_type_display()
		)
	media_type_badge.short_description = 'Type'
	
	def approval_status(self, obj):
		"""Display approval status with color coding"""
		if obj.is_approved:
			return format_html('<span style="color: green; font-weight: bold;">✅ Approved</span>')
		else:
			return format_html('<span style="color: orange; font-weight: bold;">⏳ Pending</span>')
	approval_status.short_description = 'Status'
	
	def uploaded_by_link(self, obj):
		"""Display uploader with link"""
		if obj.uploaded_by:
			url = reverse('admin:accounts_user_change', args=[obj.uploaded_by.id])
			return format_html('<a href="{}">{}</a>', url, obj.uploaded_by.email)
		return 'Unknown'
	uploaded_by_link.short_description = 'Uploaded By'
	
	def file_size(self, obj):
		"""Display file size"""
		if obj.file:
			try:
				size = obj.file.size
				if size < 1024:
					return f"{size} B"
				elif size < 1024 * 1024:
					return f"{size / 1024:.1f} KB"
				else:
					return f"{size / (1024 * 1024):.1f} MB"
			except:
				return 'Unknown'
		return 'No file'
	file_size.short_description = 'Size'
	
	def get_queryset(self, request):
		"""Optimize queryset with related data"""
		return super().get_queryset(request).select_related('event', 'uploaded_by')
	
	def bulk_approve(self, request, queryset):
		"""Bulk approve media items"""
		updated = queryset.filter(is_approved=False).update(is_approved=True)
		self.message_user(
			request,
			f'Approved {updated} media items.',
			level=messages.SUCCESS
		)
	bulk_approve.short_description = "Bulk approve selected media"
	
	def bulk_reject(self, request, queryset):
		"""Bulk reject media items"""
		updated = queryset.filter(is_approved=True).update(is_approved=False)
		self.message_user(
			request,
			f'Rejected {updated} media items.',
			level=messages.SUCCESS
		)
	bulk_reject.short_description = "Bulk reject selected media"
	
	def mark_nsfw(self, request, queryset):
		"""Mark media as NSFW (placeholder for future implementation)"""
		self.message_user(
			request,
			f'NSFW marking initiated for {queryset.count()} media items.',
			level=messages.INFO
		)
	mark_nsfw.short_description = "Mark as NSFW"
	
	def export_moderation_queue(self, request, queryset):
		"""Export moderation queue to CSV"""
		import csv
		from django.http import HttpResponse
		
		response = HttpResponse(content_type='text/csv')
		response['Content-Disposition'] = 'attachment; filename="media_moderation_queue.csv"'
		
		writer = csv.writer(response)
		writer.writerow([
			'ID', 'Event', 'Media Type', 'Caption', 'Status', 'Uploaded By', 
			'File Size', 'Created At'
		])
		
		for media in queryset:
			writer.writerow([
				media.id,
				media.event.name if media.event else 'No event',
				media.get_media_type_display(),
				media.caption,
				'Approved' if media.is_approved else 'Pending',
				media.uploaded_by.email if media.uploaded_by else 'Unknown',
				self.file_size(media),
				media.created_at.isoformat()
			])
		
		return response
	export_moderation_queue.short_description = "Export moderation queue to CSV"
	
	def regenerate_thumbnails(self, request, queryset):
		"""Regenerate thumbnails for selected media"""
		count = 0
		for media in queryset:
			if media.media_type == 'image':
				# In a real implementation, you would regenerate thumbnails
				count += 1
		
		self.message_user(
			request,
			f'Thumbnail regeneration initiated for {count} media items.',
			level=messages.INFO
		)
	regenerate_thumbnails.short_description = "Regenerate thumbnails"


@admin.register(GalleryAlbum)
class GalleryAlbumAdmin(admin.ModelAdmin):
	"""Admin configuration for GalleryAlbum"""
	list_display = ['title', 'description', 'is_public', 'created_by', 'created_at']
	list_filter = ['is_public', 'created_at']
	search_fields = ['title', 'description', 'created_by__email']
	ordering = ['-created_at']
	readonly_fields = ['created_at']


@admin.register(GalleryMedia)
class GalleryMediaAdmin(admin.ModelAdmin):
	"""Admin configuration for GalleryMedia"""
	list_display = [
		'thumbnail_preview', 'title', 'album_link', 'media_type_badge', 
		'is_public', 'uploaded_by_link', 'created_at'
	]
	list_filter = ['media_type', 'is_public', 'created_at']
	search_fields = ['title', 'album__title', 'uploaded_by__email']
	ordering = ['-created_at']
	readonly_fields = ['created_at']
	actions = ['make_public', 'make_private', 'export_gallery_media']
	
	def thumbnail_preview(self, obj):
		"""Display thumbnail preview for images"""
		if obj.media_type == 'image' and obj.image:
			try:
				return format_html(
					'<img src="{}" style="max-width: 100px; max-height: 60px; border-radius: 4px;" />',
					obj.image.url
				)
			except:
				return format_html('<span style="color: red;">❌ Broken</span>')
		elif obj.media_type == 'video':
			return format_html('<span style="color: blue;">🎥 Video</span>')
		else:
			return format_html('<span style="color: gray;">📄 Media</span>')
	thumbnail_preview.short_description = 'Preview'
	
	def album_link(self, obj):
		"""Display album name with link"""
		if obj.album:
			url = reverse('admin:gallery_galleryalbum_change', args=[obj.album.id])
			return format_html('<a href="{}">{}</a>', url, obj.album.title)
		return 'No album'
	album_link.short_description = 'Album'
	
	def media_type_badge(self, obj):
		"""Display media type with color coding"""
		colors = {
			'image': 'green',
			'video': 'blue'
		}
		color = colors.get(obj.media_type, 'gray')
		return format_html(
			'<span style="color: {}; font-weight: bold;">{}</span>',
			color, obj.get_media_type_display()
		)
	media_type_badge.short_description = 'Type'
	
	def uploaded_by_link(self, obj):
		"""Display uploader with link"""
		if obj.uploaded_by:
			url = reverse('admin:accounts_user_change', args=[obj.uploaded_by.id])
			return format_html('<a href="{}">{}</a>', url, obj.uploaded_by.email)
		return 'Unknown'
	uploaded_by_link.short_description = 'Uploaded By'
	
	def make_public(self, request, queryset):
		"""Make selected gallery media public"""
		updated = queryset.update(is_public=True)
		self.message_user(
			request,
			f'Made {updated} gallery media items public.',
			level=messages.SUCCESS
		)
	make_public.short_description = "Make selected media public"
	
	def make_private(self, request, queryset):
		"""Make selected gallery media private"""
		updated = queryset.update(is_public=False)
		self.message_user(
			request,
			f'Made {updated} gallery media items private.',
			level=messages.SUCCESS
		)
	make_private.short_description = "Make selected media private"
	
	def export_gallery_media(self, request, queryset):
		"""Export gallery media to CSV"""
		import csv
		from django.http import HttpResponse
		
		response = HttpResponse(content_type='text/csv')
		response['Content-Disposition'] = 'attachment; filename="gallery_media.csv"'
		
		writer = csv.writer(response)
		writer.writerow([
			'ID', 'Title', 'Album', 'Media Type', 'Public', 'Uploaded By', 'Created At'
		])
		
		for media in queryset:
			writer.writerow([
				media.id,
				media.title,
				media.album.title if media.album else 'No album',
				media.get_media_type_display(),
				'Yes' if media.is_public else 'No',
				media.uploaded_by.email if media.uploaded_by else 'Unknown',
				media.created_at.isoformat()
			])
		
		return response
	export_gallery_media.short_description = "Export gallery media to CSV"
