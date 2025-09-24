# timely/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.shortcuts import redirect
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from common.views import HealthView

# Admin site branding
admin.site.site_header = "Timely Sports Management"
admin.site.site_title = "Timely Admin"
admin.site.index_title = "Operations Dashboard"

def redirect_to_docs(request):
    return redirect('/api/docs/')

urlpatterns = [
    # Root redirect to API docs
    path("", redirect_to_docs, name="root"),
    
    # Health check
    path("health/", HealthView.as_view(), name="health"),

    # Django admin
    path("admin/", admin.site.urls),
    
    # API endpoints - Single unified entry point
    path("api/", include("api.urls")),
    
    # OpenAPI / Docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
]

# Serve static files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

