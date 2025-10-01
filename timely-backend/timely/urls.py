# timely/urls.py
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from timely.core.views import SiteIndexView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),
    path("", SiteIndexView, name="site-index"),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Catch-all route for React frontend (public site only)
urlpatterns += [
    re_path(r"^(?!admin/|api/|static/|media/|ws/).*$",
            TemplateView.as_view(template_name="index.html")),
]

