from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PageViewSet, NewsViewSet, BannerViewSet

router = DefaultRouter()
router.register(r'pages', PageViewSet)
router.register(r'news', NewsViewSet)
router.register(r'banners', BannerViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

