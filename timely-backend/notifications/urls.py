from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    NotificationViewSet,
    AnnouncementView,
    MessageThreadViewSet,
    MessageViewSet,
)

# Create routers
notifications_router = DefaultRouter()
notifications_router.register(r"", NotificationViewSet, basename="notifications")

messages_router = DefaultRouter()
messages_router.register(r"threads", MessageThreadViewSet, basename="message-threads")
messages_router.register(r"messages", MessageViewSet, basename="messages")

urlpatterns = [
    # Notifications endpoints mounted at /api/notifications/
    path("", include(notifications_router.urls)),
    path("announce/", AnnouncementView.as_view(), name="announcement"),
    
    # Messaging endpoints mounted at /api/notifications/messages/
    path("messages/", include(messages_router.urls)),
]