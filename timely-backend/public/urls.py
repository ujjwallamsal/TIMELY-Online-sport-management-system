# public/urls.py
from django.urls import path
from . import views

app_name = 'public'

urlpatterns = [
    # Home page aggregated data
    path('home/', views.public_home, name='home'),
    
    # Events
    path('events/', views.public_events_list, name='events-list'),
    path('events/<int:event_id>/', views.public_event_detail, name='event-detail'),
    path('events/<int:event_id>/fixtures/', views.public_event_fixtures, name='event-fixtures'),
    path('events/<int:event_id>/results/', views.public_event_results, name='event-results'),
    
    # News
    path('news/', views.public_news_list, name='news-list'),
]
