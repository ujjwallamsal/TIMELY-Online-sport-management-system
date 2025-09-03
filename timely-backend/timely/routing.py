from django.urls import re_path
from events.consumers import EventConsumer, NotificationConsumer
from accounts.consumers import UserConsumer

# Import fixtures routing
from fixtures.routing import websocket_urlpatterns as fixtures_websocket_urlpatterns

websocket_urlpatterns = [
    re_path(r'ws/events/(?P<event_id>\w+)/$', EventConsumer.as_asgi()),
    re_path(r'ws/notifications/$', NotificationConsumer.as_asgi()),
    re_path(r'ws/user/$', UserConsumer.as_asgi()),
] + fixtures_websocket_urlpatterns
