# venues/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VenueViewSet, VenueSlotViewSet

router = DefaultRouter()
router.register(r'venues', VenueViewSet)
router.register(r'slots', VenueSlotViewSet)

urlpatterns = [
    path('', include(router.urls)),
]