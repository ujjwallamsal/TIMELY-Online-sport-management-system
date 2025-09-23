# api/filters.py - API Filters
import django_filters
from django.db.models import Q
from events.models import Event
from venues.models import Venue
from registrations.models import Registration
from fixtures.models import Fixture
from results.models import Result


class EventFilter(django_filters.FilterSet):
    """Event filtering"""
    status = django_filters.ChoiceFilter(choices=Event.Status.choices)
    sport = django_filters.CharFilter(field_name='sport', lookup_expr='icontains')
    venue = django_filters.CharFilter(field_name='venue__name', lookup_expr='icontains')
    start_date = django_filters.DateFilter(field_name='start_datetime', lookup_expr='gte')
    end_date = django_filters.DateFilter(field_name='end_datetime', lookup_expr='lte')
    visibility = django_filters.ChoiceFilter(choices=[('PUBLIC', 'Public'), ('PRIVATE', 'Private')])
    
    class Meta:
        model = Event
        fields = ['status', 'sport', 'venue', 'start_date', 'end_date', 'visibility']


class VenueFilter(django_filters.FilterSet):
    """Venue filtering"""
    capacity_min = django_filters.NumberFilter(field_name='capacity', lookup_expr='gte')
    capacity_max = django_filters.NumberFilter(field_name='capacity', lookup_expr='lte')
    has_parking = django_filters.BooleanFilter(field_name='facilities__has_parking')
    has_catering = django_filters.BooleanFilter(field_name='facilities__has_catering')
    
    class Meta:
        model = Venue
        fields = ['capacity_min', 'capacity_max', 'has_parking', 'has_catering']


class RegistrationFilter(django_filters.FilterSet):
    """Registration filtering"""
    status = django_filters.ChoiceFilter(choices=Registration.Status.choices)
    type = django_filters.ChoiceFilter(choices=Registration.Type.choices)
    event = django_filters.NumberFilter(field_name='event__id')
    applicant = django_filters.CharFilter(field_name='applicant__email', lookup_expr='icontains')
    submitted_after = django_filters.DateTimeFilter(field_name='submitted_at', lookup_expr='gte')
    submitted_before = django_filters.DateTimeFilter(field_name='submitted_at', lookup_expr='lte')
    
    class Meta:
        model = Registration
        fields = ['status', 'type', 'event', 'applicant', 'submitted_after', 'submitted_before']


class FixtureFilter(django_filters.FilterSet):
    """Fixture filtering"""
    event = django_filters.NumberFilter(field_name='event__id')
    venue = django_filters.NumberFilter(field_name='venue__id')
    status = django_filters.ChoiceFilter(choices=Fixture.Status.choices)
    phase = django_filters.ChoiceFilter(choices=Fixture.Phase.choices)
    start_after = django_filters.DateTimeFilter(field_name='start_at', lookup_expr='gte')
    start_before = django_filters.DateTimeFilter(field_name='start_at', lookup_expr='lte')
    
    class Meta:
        model = Fixture
        fields = ['event', 'venue', 'status', 'phase', 'start_after', 'start_before']


class ResultFilter(django_filters.FilterSet):
    """Result filtering"""
    fixture = django_filters.NumberFilter(field_name='fixture__id')
    event = django_filters.NumberFilter(field_name='fixture__event__id')
    is_finalized = django_filters.BooleanFilter(field_name='finalized_at', lookup_expr='isnull', exclude=True)
    entered_after = django_filters.DateTimeFilter(field_name='entered_at', lookup_expr='gte')
    entered_before = django_filters.DateTimeFilter(field_name='entered_at', lookup_expr='lte')
    
    class Meta:
        model = Result
        fields = ['fixture', 'event', 'is_finalized', 'entered_after', 'entered_before']