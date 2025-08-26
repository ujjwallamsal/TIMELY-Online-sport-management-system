from django.urls import re_path
from events.consumers import EventConsumer, NotificationConsumer
from accounts.consumers import UserConsumer

websocket_urlpatterns = [
    re_path(r'ws/events/(?P<event_id>\w+)/$', EventConsumer.as_asgi()),
    # Matches consumer removed for now to avoid import error; re-add when model/consumer exists
    re_path(r'ws/notifications/$', NotificationConsumer.as_asgi()),
    re_path(r'ws/user/$', UserConsumer.as_asgi()),
]
