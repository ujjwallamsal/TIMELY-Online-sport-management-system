"""
Thumbnail generation service using Pillow.
Creates thumbnails for uploaded images with fallback to original.
"""
import os
from typing import Optional
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.conf import settings

try:
    from PIL import Image, ImageOps
    PILLOW_AVAILABLE = True
except ImportError:
    PILLOW_AVAILABLE = False

# Thumbnail configuration
THUMBNAIL_SIZE = getattr(settings, 'MEDIA_THUMBNAIL_SIZE', (300, 300))
THUMBNAIL_QUALITY = getattr(settings, 'MEDIA_THUMBNAIL_QUALITY', 85)


def create_thumbnail(image_file, size: tuple = THUMBNAIL_SIZE, quality: int = THUMBNAIL_QUALITY) -> Optional[ContentFile]:
    """
    Create a thumbnail for an image file.
    
    Args:
        image_file: Image file object
        size: Thumbnail size tuple (width, height)
        quality: JPEG quality (1-100)
        
    Returns:
        ContentFile with thumbnail data, or None if Pillow unavailable
    """
    if not PILLOW_AVAILABLE:
        return None
    
    try:
        # Open the image
        image = Image.open(image_file)
        
        # Convert to RGB if necessary (for JPEG output)
        if image.mode in ('RGBA', 'LA', 'P'):
            # Create white background for transparent images
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
            image = background
        elif image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Create thumbnail
        thumbnail = ImageOps.fit(image, size, Image.Resampling.LANCZOS)
        
        # Save to bytes
        from io import BytesIO
        thumb_io = BytesIO()
        thumbnail.save(thumb_io, format='JPEG', quality=quality, optimize=True)
        thumb_io.seek(0)
        
        return ContentFile(thumb_io.getvalue(), name='thumbnail.jpg')
        
    except Exception as e:
        # Log error but don't fail the upload
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to create thumbnail: {e}")
        return None


def generate_thumbnail_for_media(media_item) -> bool:
    """
    Generate thumbnail for a media item if it's an image.
    
    Args:
        media_item: MediaItem instance
        
    Returns:
        True if thumbnail was created, False otherwise
    """
    if media_item.kind != 'photo' or not media_item.file:
        return False
    
    if not PILLOW_AVAILABLE:
        return False
    
    try:
        # Open the file
        with media_item.file.open('rb') as f:
            thumbnail_data = create_thumbnail(f)
        
        if thumbnail_data:
            # Save thumbnail
            thumbnail_name = f"thumb_{media_item.id}.jpg"
            media_item.thumbnail.save(thumbnail_name, thumbnail_data, save=True)
            return True
            
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to generate thumbnail for media {media_item.id}: {e}")
    
    return False


def get_thumbnail_url(media_item) -> Optional[str]:
    """
    Get thumbnail URL for a media item.
    Returns original file URL if no thumbnail available.
    
    Args:
        media_item: MediaItem instance
        
    Returns:
        Thumbnail URL or original file URL
    """
    if media_item.thumbnail:
        return media_item.thumbnail.url
    elif media_item.kind == 'photo' and media_item.file:
        return media_item.file.url
    else:
        return None


def cleanup_old_thumbnails():
    """
    Clean up orphaned thumbnail files.
    This can be run as a management command or scheduled task.
    """
    if not PILLOW_AVAILABLE:
        return
    
    try:
        from .models import MediaItem
        
        # Get all media items with thumbnails
        media_with_thumbs = MediaItem.objects.exclude(thumbnail__isnull=True).exclude(thumbnail='')
        
        # Check which thumbnails are orphaned
        for media in media_with_thumbs:
            if media.thumbnail and default_storage.exists(media.thumbnail.name):
                # Thumbnail exists and is linked to media item
                continue
            else:
                # Orphaned thumbnail, clean up
                if media.thumbnail:
                    try:
                        default_storage.delete(media.thumbnail.name)
                    except:
                        pass
                    media.thumbnail = None
                    media.save(update_fields=['thumbnail'])
                    
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to cleanup thumbnails: {e}")
