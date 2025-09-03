# fixtures/routing.py
"""
WebSocket routing for fixtures.
Minimal routing for fixtures:event:{event_id} groups.
"""

from django.urls import re_path
from .consumers import FixturesConsumer

websocket_urlpatterns = [
    re_path(r'ws/fixtures/events/(?P<event_id>\w+)/$', FixturesConsumer.as_asgi()),
]
