# api/v1/filters.py
import django_filters
from django.db.models import Q
from django.utils import timezone
from events.models import Event
from registrations.models import Registration
from fixtures.models import Fixture
from results.models import Result
from accounts.models import User
from venues.models import Venue


class EventFilter(django_filters.FilterSet):
    """Filter for events"""
    status = django_filters.ChoiceFilter(choices=Event.Status.choices)
    sport = django_filters.NumberFilter(field_name='sport__id')
    venue = django_filters.NumberFilter(field_name='venue__id')
    date_from = django_filters.DateFilter(field_name='start_date', lookup_expr='gte')
    date_to = django_filters.DateFilter(field_name='start_date', lookup_expr='lte')
    created_by = django_filters.NumberFilter(field_name='created_by__id')
    
    class Meta:
        model = Event
        fields = ['status', 'sport', 'venue', 'date_from', 'date_to', 'created_by']


class RegistrationFilter(django_filters.FilterSet):
    """Filter for registrations"""
    status = django_filters.ChoiceFilter(choices=Registration.Status.choices)
    type = django_filters.ChoiceFilter(choices=Registration.Type.choices)
    event = django_filters.NumberFilter(field_name='event__id')
    applicant = django_filters.NumberFilter(field_name='applicant__id')
    team = django_filters.NumberFilter(field_name='team__id')
    submitted_from = django_filters.DateTimeFilter(field_name='submitted_at', lookup_expr='gte')
    submitted_to = django_filters.DateTimeFilter(field_name='submitted_at', lookup_expr='lte')
    
    class Meta:
        model = Registration
        fields = ['status', 'type', 'event', 'applicant', 'team', 'submitted_from', 'submitted_to']


class FixtureFilter(django_filters.FilterSet):
    """Filter for fixtures"""
    event = django_filters.NumberFilter(field_name='event__id')
    venue = django_filters.NumberFilter(field_name='venue__id')
    status = django_filters.ChoiceFilter(choices=Fixture.Status.choices)
    phase = django_filters.ChoiceFilter(choices=Fixture.Phase.choices)
    date_from = django_filters.DateTimeFilter(field_name='start_at', lookup_expr='gte')
    date_to = django_filters.DateTimeFilter(field_name='start_at', lookup_expr='lte')
    round = django_filters.NumberFilter(field_name='round')
    
    class Meta:
        model = Fixture
        fields = ['event', 'venue', 'status', 'phase', 'date_from', 'date_to', 'round']


class ResultFilter(django_filters.FilterSet):
    """Filter for results"""
    event = django_filters.NumberFilter(field_name='fixture__event__id')
    fixture = django_filters.NumberFilter(field_name='fixture__id')
    finalized = django_filters.BooleanFilter(method='filter_finalized')
    date_from = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    date_to = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    missing_score = django_filters.BooleanFilter(method='filter_missing_score')
    
    class Meta:
        model = Result
        fields = ['event', 'fixture', 'finalized', 'date_from', 'date_to', 'missing_score']
    
    def filter_finalized(self, queryset, name, value):
        """Filter by finalization status"""
        if value:
            return queryset.filter(finalized_at__isnull=False)
        else:
            return queryset.filter(finalized_at__isnull=True)
    
    def filter_missing_score(self, queryset, name, value):
        """Filter for results with missing scores"""
        if value:
            return queryset.filter(
                Q(home_score__isnull=True) | Q(away_score__isnull=True)
            )
        else:
            return queryset.filter(
                home_score__isnull=False,
                away_score__isnull=False
            )


class UserFilter(django_filters.FilterSet):
    """Filter for users"""
    role = django_filters.ChoiceFilter(choices=User.Role.choices)
    is_verified = django_filters.BooleanFilter(field_name='is_verified')
    is_active = django_filters.BooleanFilter(field_name='is_active')
    search = django_filters.CharFilter(method='filter_search')
    
    class Meta:
        model = User
        fields = ['role', 'is_verified', 'is_active', 'search']
    
    def filter_search(self, queryset, name, value):
        """Search across multiple fields"""
        return queryset.filter(
            Q(email__icontains=value) |
            Q(first_name__icontains=value) |
            Q(last_name__icontains=value) |
            Q(username__icontains=value)
        )


class VenueFilter(django_filters.FilterSet):
    """Filter for venues"""
    capacity_min = django_filters.NumberFilter(field_name='capacity', lookup_expr='gte')
    capacity_max = django_filters.NumberFilter(field_name='capacity', lookup_expr='lte')
    search = django_filters.CharFilter(method='filter_search')
    
    class Meta:
        model = Venue
        fields = ['capacity_min', 'capacity_max', 'search']
    
    def filter_search(self, queryset, name, value):
        """Search across name and address"""
        return queryset.filter(
            Q(name__icontains=value) |
            Q(address__icontains=value)
        )
