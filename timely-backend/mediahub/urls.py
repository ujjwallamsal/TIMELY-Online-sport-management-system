"""
Media Hub URL configuration.
Routes all media-related endpoints under /api/media/.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router for ViewSets
router = DefaultRouter()
router.register(r'', views.MediaItemViewSet, basename='media')

urlpatterns = [
    # Public media endpoints (must come before router to avoid conflicts)
    path('public/', views.PublicMediaViewSet.as_view({'get': 'list'}), name='media-public-list'),
    path('public/<int:pk>/', views.PublicMediaViewSet.as_view({'get': 'retrieve'}), name='media-public-detail'),
    # Share endpoints
    path('share/<int:pk>/', views.MediaShareViewSet.as_view({'get': 'retrieve'}), name='media-share'),
    # Include router URLs (must come last)
    path('', include(router.urls)),
]
