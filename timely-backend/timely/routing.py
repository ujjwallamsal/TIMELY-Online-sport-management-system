from django.urls import re_path
from events.consumers import EventConsumer as EventsEventConsumer, NotificationConsumer
from accounts.consumers import UserConsumer
from realtime.consumers import EventConsumer, AdminConsumer, OrganizerConsumer, PublicConsumer, AthleteConsumer, CoachConsumer, SpectatorConsumer
from teams.consumers import TeamConsumer, PurchaseConsumer

# Import fixtures routing
from fixtures.routing import websocket_urlpatterns as fixtures_websocket_urlpatterns

websocket_urlpatterns = [
    # Event-specific consumers (new)
    re_path(r'ws/events/(?P<event_id>\w+)/stream/$', EventConsumer.as_asgi()),
    
    # Team-specific consumers
    re_path(r'ws/teams/(?P<team_id>\w+)/$', TeamConsumer.as_asgi()),
    
    # Purchase-specific consumers
    re_path(r'ws/purchases/(?P<purchase_id>\w+)/$', PurchaseConsumer.as_asgi()),
    
    # Existing consumers
    re_path(r'ws/events/(?P<event_id>\w+)/$', EventsEventConsumer.as_asgi()),
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
