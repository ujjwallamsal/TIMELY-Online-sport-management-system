from django.urls import re_path
from realtime.consumers import (
    EventConsumer, AdminConsumer, OrganizerConsumer,
    AthleteConsumer, CoachConsumer, SpectatorConsumer, PublicConsumer, UserConsumer
)

websocket_urlpatterns = [
    re_path(r"ws/events/(?P<event_id>\w+)/stream/$", EventConsumer.as_asgi()),
    re_path(r"ws/events/general/stream/$", EventConsumer.as_asgi()),  # General events stream
    re_path(r"ws/admin/$", AdminConsumer.as_asgi()),
    re_path(r"ws/organizer/$", OrganizerConsumer.as_asgi()),
    re_path(r"ws/athlete/$", AthleteConsumer.as_asgi()),
    re_path(r"ws/coach/$", CoachConsumer.as_asgi()),
    re_path(r"ws/spectator/$", SpectatorConsumer.as_asgi()),
    re_path(r"ws/public/$", PublicConsumer.as_asgi()),
    re_path(r"ws/user/$", UserConsumer.as_asgi()),
]