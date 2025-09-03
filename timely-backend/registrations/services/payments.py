"""
Payment services for registrations using Stripe (test mode)
"""
import stripe
from django.conf import settings
from django.utils import timezone
from ..models import Registration, RegistrationPaymentLog


# Configure Stripe (test mode)
stripe.api_key = getattr(settings, 'STRIPE_SECRET_KEY', 'sk_test_your_test_key_here')


def create_payment_intent(registration: Registration) -> dict:
    """
    Create a Stripe payment intent for registration fee.
    
    Args:
        registration: Registration instance
        
    Returns:
        dict: Payment intent data including client_secret
    """
    try:
        # Create payment intent
        intent = stripe.PaymentIntent.create(
            amount=registration.fee_cents,
            currency=getattr(settings, 'STRIPE_CURRENCY', 'aud'),
            metadata={
                'registration_id': str(registration.id),
                'event_id': str(registration.event.id),
                'user_id': str(registration.user.id),
            },
            description=f"Registration fee for {registration.event.name}",
        )
        
        # Log the payment intent
        RegistrationPaymentLog.objects.create(
            registration=registration,
            provider='stripe',
            provider_ref=intent.id,
            kind='intent',
            amount_cents=registration.fee_cents,
            status=intent.status,
        )
        
        return {
            'client_secret': intent.client_secret,
            'payment_intent_id': intent.id,
            'amount': intent.amount,
            'currency': intent.currency,
        }
        
    except stripe.error.StripeError as e:
        # Log the error
        RegistrationPaymentLog.objects.create(
            registration=registration,
            provider='stripe',
            provider_ref='',
            kind='intent',
            amount_cents=registration.fee_cents,
            status='failed',
        )
        raise Exception(f"Payment intent creation failed: {str(e)}")


def confirm_payment(registration: Registration, client_secret: str) -> dict:
    """
    Confirm payment for registration (simulate success in test mode).
    
    Args:
        registration: Registration instance
        client_secret: Stripe client secret
        
    Returns:
        dict: Payment confirmation data
    """
    try:
        # In test mode, we'll simulate a successful payment
        # In production, you would verify the payment with Stripe
        
        # Update registration payment status
        registration.payment_status = 'paid'
        registration.save()
        
        # Log the payment confirmation
        RegistrationPaymentLog.objects.create(
            registration=registration,
            provider='stripe',
            provider_ref=client_secret,  # In real implementation, this would be the payment intent ID
            kind='confirm',
            amount_cents=registration.fee_cents,
            status='succeeded',
        )
        
        # Update registration status if payment was the only requirement
        if registration.status == 'pending' and registration.payment_status == 'paid':
            # Registration is ready for organizer approval
            pass
        
        return {
            'success': True,
            'payment_status': 'paid',
            'amount_paid': registration.fee_cents,
            'currency': getattr(settings, 'STRIPE_CURRENCY', 'aud'),
            'payment_date': timezone.now().isoformat(),
        }
        
    except Exception as e:
        # Log the error
        RegistrationPaymentLog.objects.create(
            registration=registration,
            provider='stripe',
            provider_ref=client_secret,
            kind='confirm',
            amount_cents=registration.fee_cents,
            status='failed',
        )
        raise Exception(f"Payment confirmation failed: {str(e)}")


def get_payment_status(registration: Registration) -> dict:
    """
    Get current payment status for registration.
    
    Args:
        registration: Registration instance
        
    Returns:
        dict: Payment status information
    """
    latest_payment = registration.payment_logs.filter(
        kind='confirm'
    ).order_by('-created_at').first()
    
    return {
        'payment_status': registration.payment_status,
        'amount_cents': registration.fee_cents,
        'amount_dollars': registration.fee_dollars,
        'currency': getattr(settings, 'STRIPE_CURRENCY', 'aud'),
        'last_payment_date': latest_payment.created_at if latest_payment else None,
        'requires_payment': registration.fee_cents > 0,
    }


def refund_payment(registration: Registration, reason: str = '') -> dict:
    """
    Refund payment for registration (test mode simulation).
    
    Args:
        registration: Registration instance
        reason: Reason for refund
        
    Returns:
        dict: Refund confirmation data
    """
    try:
        # In test mode, simulate refund
        # In production, you would process actual refund with Stripe
        
        # Log the refund
        RegistrationPaymentLog.objects.create(
            registration=registration,
            provider='stripe',
            provider_ref=f"refund_{registration.id}_{timezone.now().timestamp()}",
            kind='refund',
            amount_cents=registration.fee_cents,
            status='succeeded',
        )
        
        # Update registration status
        registration.payment_status = 'unpaid'
        registration.save()
        
        return {
            'success': True,
            'refund_amount': registration.fee_cents,
            'currency': getattr(settings, 'STRIPE_CURRENCY', 'aud'),
            'refund_date': timezone.now().isoformat(),
            'reason': reason,
        }
        
    except Exception as e:
        raise Exception(f"Refund failed: {str(e)}")