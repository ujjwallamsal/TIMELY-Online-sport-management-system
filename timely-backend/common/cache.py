"""
Cache utilities for Timely API
"""
from functools import wraps
from django.core.cache import cache
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page


def cache_page_seconds(seconds):
    """
    Decorator to cache a view for specified seconds
    Usage: @cache_page_seconds(60) for 60-second cache
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(*args, **kwargs):
            return cache_page(seconds)(view_func)(*args, **kwargs)
        return wrapper
    return decorator


def cache_page_seconds_method(seconds):
    """
    Method decorator for class-based views
    Usage: @method_decorator(cache_page_seconds_method(60), name='dispatch')
    """
    return method_decorator(cache_page(seconds))
