"""
Media storage utilities for file validation and safe path generation.
Handles file type checking, size validation, and secure upload paths.
"""
import os
import mimetypes
from typing import Tuple
from django.core.files.uploadedfile import UploadedFile
from django.conf import settings


# File type configurations
ALLOWED_IMAGE_TYPES = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
}

ALLOWED_VIDEO_TYPES = {
    'video/mp4': ['.mp4'],
    'video/webm': ['.webm'],
}

ALLOWED_TYPES = {**ALLOWED_IMAGE_TYPES, **ALLOWED_VIDEO_TYPES}

# Size limits (in bytes)
MAX_IMAGE_SIZE = getattr(settings, 'MAX_IMAGE_SIZE', 10 * 1024 * 1024)  # 10MB
MAX_VIDEO_SIZE = getattr(settings, 'MAX_VIDEO_SIZE', 100 * 1024 * 1024)  # 100MB


def validate_media_file(file: UploadedFile) -> Tuple[str, str]:
    """
    Validate uploaded media file for type and size.
    
    Args:
        file: Uploaded file object
        
    Returns:
        Tuple of (kind, mime_type)
        
    Raises:
        ValueError: If file is invalid
    """
    if not file:
        raise ValueError("No file provided")
    
    # Check file size
    file_size = file.size
    if file_size == 0:
        raise ValueError("File is empty")
    
    # Get file extension
    file_name = file.name.lower()
    file_ext = os.path.splitext(file_name)[1]
    
    # Detect MIME type
    mime_type, _ = mimetypes.guess_type(file_name)
    if not mime_type:
        # Fallback: try to detect from file content
        file.seek(0)
        header = file.read(1024)
        file.seek(0)
        
        if header.startswith(b'\xff\xd8\xff'):
            mime_type = 'image/jpeg'
        elif header.startswith(b'\x89PNG'):
            mime_type = 'image/png'
        elif header.startswith(b'RIFF') and b'WEBP' in header:
            mime_type = 'image/webp'
        elif header.startswith(b'\x00\x00\x00\x18ftypmp41'):
            mime_type = 'video/mp4'
        elif header.startswith(b'\x1a\x45\xdf\xa3'):
            mime_type = 'video/webm'
        else:
            raise ValueError(f"Unsupported file type: {file_name}")
    
    # Validate MIME type and extension
    if mime_type not in ALLOWED_TYPES:
        raise ValueError(f"Unsupported MIME type: {mime_type}")
    
    if file_ext not in ALLOWED_TYPES[mime_type]:
        raise ValueError(f"File extension {file_ext} doesn't match MIME type {mime_type}")
    
    # Determine media kind
    if mime_type in ALLOWED_IMAGE_TYPES:
        kind = 'photo'
        max_size = MAX_IMAGE_SIZE
    elif mime_type in ALLOWED_VIDEO_TYPES:
        kind = 'video'
        max_size = MAX_VIDEO_SIZE
    else:
        raise ValueError(f"Unknown media type: {mime_type}")
    
    # Check file size
    if file_size > max_size:
        size_mb = max_size / (1024 * 1024)
        raise ValueError(f"File too large. Maximum size for {kind}s is {size_mb:.0f}MB")
    
    return kind, mime_type


def get_safe_filename(filename: str) -> str:
    """
    Generate a safe filename by removing dangerous characters.
    
    Args:
        filename: Original filename
        
    Returns:
        Safe filename
    """
    # Remove path separators and other dangerous characters
    safe_chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-_"
    safe_filename = ''.join(c for c in filename if c in safe_chars)
    
    # Ensure filename is not empty
    if not safe_filename:
        safe_filename = "media_file"
    
    # Limit length
    if len(safe_filename) > 100:
        name, ext = os.path.splitext(safe_filename)
        safe_filename = name[:95] + ext
    
    return safe_filename


def get_upload_path(instance, filename: str) -> str:
    """
    Generate upload path for media files.
    
    Args:
        instance: MediaItem instance
        filename: Original filename
        
    Returns:
        Safe upload path
    """
    # Get safe filename
    safe_filename = get_safe_filename(filename)
    
    # Generate path based on date and media type
    from django.utils import timezone
    now = timezone.now()
    
    path_parts = [
        'media',
        str(now.year),
        f"{now.month:02d}",
        f"{now.day:02d}",
        instance.kind,
        safe_filename
    ]
    
    return os.path.join(*path_parts)


def get_thumbnail_path(instance, filename: str) -> str:
    """
    Generate upload path for thumbnail files.
    
    Args:
        instance: MediaItem instance
        filename: Original filename
        
    Returns:
        Safe thumbnail path
    """
    # Get safe filename
    safe_filename = get_safe_filename(filename)
    
    # Generate path for thumbnails
    from django.utils import timezone
    now = timezone.now()
    
    path_parts = [
        'media',
        'thumbnails',
        str(now.year),
        f"{now.month:02d}",
        f"{now.day:02d}",
        safe_filename
    ]
    
    return os.path.join(*path_parts)
