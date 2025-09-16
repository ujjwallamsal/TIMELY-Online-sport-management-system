from django.urls import re_path
from events.consumers import EventConsumer, NotificationConsumer
from accounts.consumers import UserConsumer
from realtime.consumers import AdminConsumer, OrganizerConsumer, PublicConsumer, AthleteConsumer, CoachConsumer, SpectatorConsumer

# Import fixtures routing
from fixtures.routing import websocket_urlpatterns as fixtures_websocket_urlpatterns

websocket_urlpatterns = [
    # Existing consumers
    re_path(r'ws/events/(?P<event_id>\w+)/$', EventConsumer.as_asgi()),
    re_path(r'ws/notifications/$', NotificationConsumer.as_asgi()),
    re_path(r'ws/user/$', UserConsumer.as_asgi()),
    
    # Role-based realtime consumers
    re_path(r'ws/admin/$', AdminConsumer.as_asgi()),
    re_path(r'ws/organizer/$', OrganizerConsumer.as_asgi()),
    re_path(r'ws/athlete/$', AthleteConsumer.as_asgi()),
    re_path(r'ws/coach/$', CoachConsumer.as_asgi()),
    re_path(r'ws/spectator/$', SpectatorConsumer.as_asgi()),
    re_path(r'ws/public/$', PublicConsumer.as_asgi()),
    re_path(r'ws/content/public/$', PublicConsumer.as_asgi()),
] + fixtures_websocket_urlpatterns
