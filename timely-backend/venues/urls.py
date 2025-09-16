# venues/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VenueViewSet, VenueSlotViewSet

router = DefaultRouter()
router.register(r'', VenueViewSet, basename='venue')

urlpatterns = [
    path('', include(router.urls)),
    
    # Venue slots endpoints
    path('<int:venue_pk>/slots/', VenueSlotViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='venue-slots-list'),
    
    path('<int:venue_pk>/slots/<int:pk>/', VenueSlotViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='venue-slots-detail'),
]