# public/cache.py
from django.core.cache import cache
from typing import Any, Optional
import json


def get_cached_data(key: str, default: Any = None) -> Optional[Any]:
    """Get cached data with fallback"""
    try:
        return cache.get(key, default)
    except Exception:
        return default


def set_cached_data(key: str, data: Any, timeout: int = 60) -> bool:
    """Set cached data with timeout"""
    try:
        cache.set(key, data, timeout)
        return True
    except Exception:
        return False


def get_home_data() -> dict:
    """Get cached home page data"""
    return get_cached_data('public_home_data', {
        'heroEvents': [],
        'news': [],
        'highlights': {'ticketsSold': 0, 'upcomingCount': 0}
    })


def set_home_data(data: dict, timeout: int = 60) -> bool:
    """Cache home page data"""
    return set_cached_data('public_home_data', data, timeout)


def get_news_data() -> dict:
    """Get cached news data"""
    return get_cached_data('public_news_data', {'results': [], 'count': 0})


def set_news_data(data: dict, timeout: int = 60) -> bool:
    """Cache news data"""
    return set_cached_data('public_news_data', data, timeout)
