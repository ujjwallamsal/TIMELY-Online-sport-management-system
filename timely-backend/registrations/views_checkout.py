"""
Registration checkout views for Stripe integration
"""
import stripe
import logging
from django.conf import settings
from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Registration
from .serializers import RegistrationDetailSerializer
from events.models import Event

logger = logging.getLogger(__name__)

# Configure Stripe
stripe.api_key = getattr(settings, 'STRIPE_SECRET_KEY', '')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def registration_checkout(request):
    """
    Create a Stripe Checkout Session for registration payment
    POST /api/registrations/checkout/
    Body: {event_id: int, documents: [{type: str, file: File}], notes: str}
    Returns: {sessionId: str, checkout_url: str} OR {mode: 'free', registration_id: int}
    """
    event_id = request.data.get('event_id')
    notes = request.data.get('notes', '')
    
    if not event_id:
        return Response({'detail': 'event_id is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        event = Event.objects.get(id=event_id)
    except Event.DoesNotExist:
        return Response({'detail': 'Event not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Check if user is an athlete
    if request.user.role != 'ATHLETE':
        return Response(
            {'detail': 'Only athletes can register for events'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Check if already registered
    existing_registration = Registration.objects.filter(
        event=event,
        applicant_user=request.user
    ).first()
    
    if existing_registration:
        return Response(
            {'detail': 'You are already registered for this event'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Calculate amount from backend (authoritative source)
    fee_cents = event.fee_cents or 0
    
    # Free event - create registration immediately
    if fee_cents == 0:
        with transaction.atomic():
            registration = Registration.objects.create(
                event=event,
                applicant_user=request.user,
                type=Registration.Type.ATHLETE,
                status=Registration.Status.PENDING,
                fee_cents=0,
                payment_status='PAID',  # No payment needed
                docs={'notes': notes} if notes else {}
            )
            
            # Send notifications
            from .services.notifications import send_registration_confirmation, send_organizer_notification
            send_registration_confirmation(registration)
            send_organizer_notification(registration, 'created')
        
        return Response({
            'mode': 'free',
            'registration_id': registration.id,
            'message': 'Registration submitted successfully - awaiting approval'
        }, status=status.HTTP_201_CREATED)
    
    # Paid event - create Stripe checkout session
    # Check if Stripe is configured
    if not stripe.api_key or stripe.api_key in ['', 'sk_test_your_test_key_here', 'sk_test_xxx']:
        # Mock mode for development
        logger.info("Using mock payment mode for registration")
        
        with transaction.atomic():
            registration = Registration.objects.create(
                event=event,
                applicant_user=request.user,
                type=Registration.Type.ATHLETE,
                status=Registration.Status.PENDING,
                fee_cents=fee_cents,
                payment_status='PAID',  # Mock payment
                docs={'notes': notes, 'mock': True} if notes else {'mock': True}
            )
            
            # Send notifications
            from .services.notifications import send_registration_confirmation, send_organizer_notification
            send_registration_confirmation(registration)
            send_organizer_notification(registration, 'created')
        
        return Response({
            'mode': 'mock',
            'registration_id': registration.id,
            'message': 'Payment successful (mock mode) - awaiting approval'
        }, status=status.HTTP_201_CREATED)
    
    # Real Stripe checkout
    try:
        with transaction.atomic():
            # Create pending registration
            registration = Registration.objects.create(
                event=event,
                applicant_user=request.user,
                type=Registration.Type.ATHLETE,
                status=Registration.Status.PENDING,
                fee_cents=fee_cents,
                payment_status='PENDING',
                docs={'notes': notes} if notes else {}
            )
            
            # Create Stripe checkout session
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
            
            # Create idempotency key to prevent duplicates
            idempotency_key = f"reg_{registration.id}_{request.user.id}_{int(registration.submitted_at.timestamp())}"
            
            session = stripe.checkout.Session.create(
                idempotency_key=idempotency_key,
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': f'Registration: {event.name}',
                            'description': f'Event registration fee for {event.name}',
                        },
                        'unit_amount': fee_cents,
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=f"{frontend_url}/registrations/success?registration_id={registration.id}",
                cancel_url=f"{frontend_url}/registrations/create?event={event_id}&cancelled=true",
                customer_email=request.user.email,
                metadata={
                    'registration_id': str(registration.id),
                    'user_id': str(request.user.id),
                    'event_id': str(event.id),
                    'type': 'registration'
                },
                payment_intent_data={
                    'metadata': {
                        'registration_id': str(registration.id),
                        'user_id': str(request.user.id),
                        'event_id': str(event.id),
                        'type': 'registration'
                    }
                }
            )
            
            # Store session ID
            registration.docs = registration.docs or {}
            registration.docs['stripe_session_id'] = session.id
            if notes:
                registration.docs['notes'] = notes
            registration.save(update_fields=['docs'])
            
            logger.info(f"Created Stripe checkout session {session.id} for registration {registration.id}")
            
            return Response({
                'sessionId': session.id,
                'checkout_url': session.url,
                'registration_id': registration.id
            })
    
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating checkout session: {str(e)}")
        return Response(
            {'detail': f'Payment gateway error: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        logger.error(f"Error creating registration checkout: {str(e)}")
        return Response(
            {'detail': 'Failed to create registration checkout'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def registration_success(request):
    """
    Handle successful registration payment
    GET /api/registrations/success/?registration_id=123
    """
    registration_id = request.query_params.get('registration_id')
    
    if not registration_id:
        return Response({'detail': 'registration_id is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        registration = Registration.objects.get(id=registration_id, applicant_user=request.user)
        
        return Response({
            'registration': RegistrationDetailSerializer(registration).data,
            'message': 'Payment successful - awaiting organizer approval'
        })
    except Registration.DoesNotExist:
        return Response({'detail': 'Registration not found'}, status=status.HTTP_404_NOT_FOUND)

