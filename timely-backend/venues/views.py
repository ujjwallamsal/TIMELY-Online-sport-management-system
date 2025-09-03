# venues/views.py
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q

from .models import Venue, VenueSlot
from .serializers import (
    VenueSerializer, VenueListSerializer, VenueSlotSerializer,
    VenueAvailabilitySerializer, VenueConflictCheckSerializer
)
from .permissions import CanManageVenues, CanViewVenues, IsAdminOrOwner
from .services.availability import (
    find_conflicts, check_availability, create_availability_slots,
    validate_slot_data
)


class VenueViewSet(viewsets.ModelViewSet):
    """
    ViewSet for venue CRUD operations.
    """
    queryset = Venue.objects.all()
    permission_classes = [IsAuthenticated, CanViewVenues]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'address']
    filterset_fields = ['capacity']
    ordering_fields = ['name', 'capacity', 'created_at']
    ordering = ['name']

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return VenueListSerializer
        return VenueSerializer

    def get_permissions(self):
        """Return appropriate permissions based on action"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, CanManageVenues]
        else:
            permission_classes = [IsAuthenticated, CanViewVenues]
        
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """Filter venues based on user permissions"""
        queryset = super().get_queryset()
        
        # Non-admin users can only see venues they created
        if not self.request.user.is_staff:
            queryset = queryset.filter(created_by=self.request.user)
        
        return queryset

    @action(detail=True, methods=['get'], url_path='availability')
    def availability(self, request, pk=None):
        """Get venue availability for a date range"""
        venue = self.get_object()
        
        # Get query parameters
        from_date = request.query_params.get('from')
        to_date = request.query_params.get('to')
        
        if not from_date or not to_date:
            return Response(
                {'error': 'from and to date parameters are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from_date = timezone.datetime.fromisoformat(from_date.replace('Z', '+00:00'))
            to_date = timezone.datetime.fromisoformat(to_date.replace('Z', '+00:00'))
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use ISO format.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate date range
        if to_date <= from_date:
            return Response(
                {'error': 'End date must be after start date'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check availability
        availability_data = check_availability(venue.id, from_date, to_date)
        
        if 'error' in availability_data:
            return Response(availability_data, status=status.HTTP_404_NOT_FOUND)
        
        return Response(availability_data)

    @action(detail=True, methods=['post'], url_path='slots')
    def add_slots(self, request, pk=None):
        """Add availability slots to a venue"""
        venue = self.get_object()
        
        slots_data = request.data.get('slots', [])
        if not slots_data:
            return Response(
                {'error': 'slots data is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        created_slots = []
        errors = []
        
        for i, slot_data in enumerate(slots_data):
            # Validate slot data
            validation = validate_slot_data(slot_data)
            if not validation['is_valid']:
                errors.append({
                    'index': i,
                    'errors': validation['errors']
                })
                continue
            
            # Check for conflicts
            conflicts = find_conflicts(
                venue.id,
                slot_data['starts_at'],
                slot_data['ends_at']
            )
            
            if conflicts:
                errors.append({
                    'index': i,
                    'error': 'Slot conflicts with existing slots',
                    'conflicts': conflicts
                })
                continue
            
            # Create slot
            try:
                slot = VenueSlot.objects.create(
                    venue=venue,
                    starts_at=slot_data['starts_at'],
                    ends_at=slot_data['ends_at'],
                    status=slot_data.get('status', VenueSlot.Status.AVAILABLE),
                    reason=slot_data.get('reason', '')
                )
                created_slots.append(VenueSlotSerializer(slot).data)
            except Exception as e:
                errors.append({
                    'index': i,
                    'error': str(e)
                })
        
        response_data = {
            'created_slots': created_slots,
            'errors': errors
        }
        
        if errors:
            return Response(response_data, status=status.HTTP_207_MULTI_STATUS)
        
        return Response(response_data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='check-conflicts')
    def check_conflicts(self, request):
        """Check for conflicts with a proposed slot"""
        serializer = VenueConflictCheckSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        
        conflicts = find_conflicts(
            data['venue_id'],
            data['starts_at'],
            data['ends_at'],
            data.get('exclude_slot_id')
        )
        
        return Response({
            'has_conflicts': len(conflicts) > 0,
            'conflicts': conflicts
        })


class VenueSlotViewSet(viewsets.ModelViewSet):
    """
    ViewSet for venue slot operations.
    """
    queryset = VenueSlot.objects.all()
    serializer_class = VenueSlotSerializer
    permission_classes = [IsAuthenticated, IsAdminOrOwner]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['venue', 'status']
    ordering_fields = ['starts_at', 'ends_at']
    ordering = ['starts_at']

    def get_queryset(self):
        """Filter slots based on user permissions"""
        queryset = super().get_queryset()
        
        # Non-admin users can only see slots for venues they created
        if not self.request.user.is_staff:
            queryset = queryset.filter(venue__created_by=self.request.user)
        
        return queryset

    def update(self, request, *args, **kwargs):
        """Update a venue slot with conflict checking"""
        instance = self.get_object()
        
        # Check for conflicts if time is being changed
        if 'starts_at' in request.data or 'ends_at' in request.data:
            starts_at = request.data.get('starts_at', instance.starts_at)
            ends_at = request.data.get('ends_at', instance.ends_at)
            
            conflicts = find_conflicts(
                instance.venue.id,
                starts_at,
                ends_at,
                exclude_slot_id=instance.id
            )
            
            if conflicts:
                return Response({
                    'error': 'Update would create conflicts',
                    'conflicts': conflicts
                }, status=status.HTTP_409_CONFLICT)
        
        return super().update(request, *args, **kwargs)