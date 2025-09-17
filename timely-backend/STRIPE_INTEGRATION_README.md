# Stripe Ticket Integration

This document describes the comprehensive Stripe integration for ticket purchasing and management in the Timely sports events management system.

## Overview

The Stripe integration provides:
- **Secure Payment Processing**: Stripe PaymentIntents for ticket purchases
- **Webhook Handling**: Automatic order processing on payment success
- **QR Code Generation**: PNG/SVG QR codes for ticket validation
- **Email Receipts**: Automated confirmation emails with ticket details
- **Ticket Verification**: Gate scanning and validation system

## API Endpoints

### Payment Processing

#### Create Checkout Session
```
POST /api/tickets/stripe/checkout/
```

**Request Body:**
```json
{
  "event_id": 1,
  "fixture_id": 2,  // optional
  "items": [
    {
      "ticket_type_id": 1,
      "qty": 2
    }
  ]
}
```

**Response:**
```json
{
  "order_id": 123,
  "client_secret": "pi_xxx_secret_xxx",
  "payment_intent_id": "pi_xxx",
  "total_cents": 5000,
  "currency": "usd",
  "status": "requires_payment_method",
  "tickets": [
    {
      "id": 456,
      "serial": "TKT-ABC12345",
      "ticket_type_name": "General Admission",
      "price_cents": 2500
    }
  ]
}
```

#### Webhook Handler
```
POST /api/tickets/webhook/
```

Handles Stripe webhook events:
- `payment_intent.succeeded` - Process successful payments
- `payment_intent.payment_failed` - Handle failed payments
- `payment_intent.canceled` - Handle canceled payments
- `charge.dispute.created` - Handle disputes

### Ticket Management

#### Get User Tickets
```
GET /api/me/tickets/
```

**Query Parameters:**
- `event_id` - Filter by event
- `status` - Filter by ticket status (valid, used, void)

**Response:**
```json
{
  "tickets": [
    {
      "id": 456,
      "serial": "TKT-ABC12345",
      "ticket_type_name": "General Admission",
      "event_name": "Championship Game",
      "status": "valid",
      "issued_at": "2024-01-01T12:00:00Z",
      "used_at": null,
      "order_status": "paid",
      "fixture_info": {
        "id": 2,
        "starts_at": "2024-01-15T14:00:00Z",
        "ends_at": "2024-01-15T16:00:00Z"
      }
    }
  ],
  "count": 1
}
```

### QR Code Generation

#### Get QR Code Image
```
GET /api/tickets/{id}/qr/image/
```

**Query Parameters:**
- `format` - Image format (png, svg)
- `size` - Image size in pixels (default: 200)

**Response:** Binary image data (PNG or SVG)

#### Get QR Code Data
```
GET /api/tickets/{id}/qr/data/
```

**Response:**
```json
{
  "ticket_id": 456,
  "serial": "TKT-ABC12345",
  "qr_payload": "TKT:456:123:TKT-ABC12345:hash",
  "qr_png_url": "/api/tickets/456/qr/image/?format=png",
  "qr_svg_url": "/api/tickets/456/qr/image/?format=svg",
  "status": "valid",
  "event_name": "Championship Game",
  "ticket_type_name": "General Admission",
  "issued_at": "2024-01-01T12:00:00Z",
  "used_at": null
}
```

### Ticket Verification

#### Verify Ticket by QR Code
```
GET /api/tickets/verify/?code=TKT:456:123:TKT-ABC12345:hash
```

**Response:**
```json
{
  "ticket_id": 456,
  "serial": "TKT-ABC12345",
  "status": "valid",
  "is_valid": true,
  "event_name": "Championship Game",
  "ticket_type_name": "General Admission",
  "issued_at": "2024-01-01T12:00:00Z",
  "used_at": null,
  "order_id": 123,
  "user_email": "user@example.com",
  "user_name": "John Doe"
}
```

#### Check-in Ticket
```
POST /api/tickets/{id}/checkin/
```

**Response:**
```json
{
  "message": "Ticket checked in successfully",
  "ticket": {
    "id": 456,
    "serial": "TKT-ABC12345",
    "ticket_type_name": "General Admission",
    "event_name": "Championship Game",
    "used_at": "2024-01-15T14:30:00Z"
  }
}
```

## Configuration

### Environment Variables

```bash
# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email Configuration
DEFAULT_FROM_EMAIL=noreply@timely.local
FRONTEND_URL=http://localhost:5173

# Django Settings
DEBUG=True
SECRET_KEY=your-secret-key
```

### Django Settings

```python
# Stripe Configuration
STRIPE_PUBLISHABLE_KEY = os.environ.get('STRIPE_PUBLISHABLE_KEY')
STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET')

# Email Configuration
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'  # Development
DEFAULT_FROM_EMAIL = 'noreply@timely.local'
FRONTEND_URL = 'http://localhost:5173'
```

## Installation

### 1. Install Dependencies

```bash
pip install -r requirements-stripe.txt
```

### 2. Configure Stripe

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe dashboard
3. Set up webhook endpoints pointing to `/api/tickets/webhook/`
4. Configure webhook events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled`

### 3. Database Migration

```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. Create Email Templates

The system uses Django templates for email formatting. Templates are located in:
- `templates/tickets/email/purchase_confirmation.html`
- `templates/tickets/email/purchase_confirmation.txt`

## Usage Examples

### Frontend Integration

#### 1. Create Checkout Session

```javascript
const createCheckout = async (eventId, items) => {
  const response = await fetch('/api/tickets/stripe/checkout/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      event_id: eventId,
      items: items
    })
  });
  
  const data = await response.json();
  return data.client_secret;
};
```

#### 2. Process Payment with Stripe

```javascript
import { loadStripe } from '@stripe/stripe-js';

const stripe = await loadStripe('pk_test_...');

const { error } = await stripe.confirmPayment({
  clientSecret: clientSecret,
  confirmParams: {
    return_url: 'https://your-site.com/tickets/success',
  },
});
```

#### 3. Display User Tickets

```javascript
const getMyTickets = async () => {
  const response = await fetch('/api/me/tickets/', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  return data.tickets;
};
```

#### 4. Generate QR Code

```javascript
const getQRCode = (ticketId, format = 'png') => {
  return `/api/tickets/${ticketId}/qr/image/?format=${format}&size=200`;
};

// Display QR code
<img src={getQRCode(ticket.id)} alt="Ticket QR Code" />
```

#### 5. Verify Ticket (Gate Scanning)

```javascript
const verifyTicket = async (qrCode) => {
  const response = await fetch(`/api/tickets/verify/?code=${qrCode}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  return data;
};
```

### Python Integration

#### 1. Create Checkout Session

```python
import requests

def create_checkout(event_id, items):
    response = requests.post(
        'http://localhost:8000/api/tickets/stripe/checkout/',
        json={
            'event_id': event_id,
            'items': items
        },
        headers={'Authorization': f'Bearer {token}'}
    )
    return response.json()
```

#### 2. Process Webhook

```python
import stripe
from django.http import HttpResponse

@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError:
        return HttpResponse(status=400)
    
    # Handle the event
    if event['type'] == 'payment_intent.succeeded':
        # Process successful payment
        pass
    
    return HttpResponse(status=200)
```

## Testing

### 1. Run Test Script

```bash
python test_stripe_integration.py
```

### 2. Test with Stripe Test Cards

Use Stripe test card numbers:
- **Success**: `4242424242424242`
- **Decline**: `4000000000000002`
- **3D Secure**: `4000002500003155`

### 3. Test Webhook Locally

Use Stripe CLI to forward webhooks:

```bash
stripe listen --forward-to localhost:8000/api/tickets/webhook/
```

## Security Considerations

### 1. Webhook Security
- Always verify webhook signatures
- Use HTTPS in production
- Validate webhook payloads

### 2. QR Code Security
- QR codes contain signed payloads
- Validate signatures on verification
- Use secure random serial numbers

### 3. Payment Security
- Never store payment details
- Use Stripe's secure payment methods
- Implement proper error handling

## Error Handling

### Common Error Responses

```json
{
  "error": "Not enough tickets available",
  "detail": "Only 5 tickets remaining for General Admission"
}
```

```json
{
  "error": "Payment processing error",
  "detail": "Invalid payment method"
}
```

```json
{
  "error": "Permission denied",
  "detail": "You do not have permission to verify this ticket"
}
```

## Monitoring and Logging

### 1. Payment Logs
- All payment attempts are logged
- Webhook events are tracked
- Failed payments are recorded

### 2. Ticket Usage
- QR code scans are logged
- Check-in events are tracked
- Invalid attempts are recorded

### 3. Email Delivery
- Email sending is logged
- Failed deliveries are tracked
- Bounce handling is implemented

## Troubleshooting

### Common Issues

1. **Webhook Not Receiving Events**
   - Check webhook URL configuration
   - Verify signature validation
   - Check network connectivity

2. **QR Code Not Generating**
   - Check qrcode library installation
   - Verify ticket data integrity
   - Check image format support

3. **Email Not Sending**
   - Check email backend configuration
   - Verify SMTP settings
   - Check template rendering

4. **Payment Failing**
   - Check Stripe API keys
   - Verify webhook configuration
   - Check order status updates

## Support

For issues with the Stripe integration:
1. Check the logs for error messages
2. Verify configuration settings
3. Test with Stripe test mode
4. Contact support with specific error details

## Future Enhancements

- [ ] Mobile app integration
- [ ] Offline ticket validation
- [ ] Advanced analytics
- [ ] Multi-currency support
- [ ] Subscription tickets
- [ ] Group bookings
- [ ] Refund automation
