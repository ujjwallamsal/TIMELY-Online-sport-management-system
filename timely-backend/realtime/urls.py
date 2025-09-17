# realtime/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # SSE fallback endpoints
    path('events/<str:event_id>/stream/', views.EventStreamView.as_view(), name='event_stream'),
    path('events/<str:event_id>/stream/results/', views.EventStreamResultsView.as_view(), name='event_stream_results'),
    path('events/<str:event_id>/stream/schedule/', views.EventStreamScheduleView.as_view(), name='event_stream_schedule'),
    path('events/<str:event_id>/stream/announcements/', views.EventStreamAnnouncementsView.as_view(), name='event_stream_announcements'),
]
