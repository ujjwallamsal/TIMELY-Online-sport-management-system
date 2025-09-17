# tickets/models.py
from __future__ import annotations

import uuid
import hashlib
from django.db import models
from django.utils import timezone
from django.conf import settings
from django.core.validators import MinValueValidator

# from events.models import Event  # Temporarily commented out
from accounts.models import User


class Purchase(models.Model):
    """Simplified purchase model for ticketing system"""
    
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"
        FAILED = "failed", "Failed"
        REFUNDED = "refunded", "Refunded"
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="purchases")
    event_id = models.PositiveIntegerField(help_text="Event ID")
    intent_id = models.CharField(max_length=255, unique=True, help_text="Stripe PaymentIntent ID")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    amount = models.PositiveIntegerField(help_text="Amount in cents")
    currency = models.CharField(max_length=3, default='USD')
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['event_id', 'status']),
            models.Index(fields=['intent_id']),
        ]
    
    def __str__(self):
        return f"Purchase {self.id} - {self.user.email} - {self.status}"
    
    @property
    def amount_dollars(self):
        """Get amount in dollars"""
        return self.amount / 100


class Ticket(models.Model):
    """Simplified ticket model for ticketing system"""
    
    class Status(models.TextChoices):
        VALID = "valid", "Valid"
        USED = "used", "Used"
        VOID = "void", "Void"
    
    purchase = models.ForeignKey(Purchase, on_delete=models.CASCADE, related_name="tickets")
    code = models.CharField(max_length=50, unique=True, help_text="Unique ticket code")
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.VALID, db_index=True)
    
    # QR code data
    qr_payload = models.TextField(help_text="QR code payload string")
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    used_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['purchase']),
            models.Index(fields=['code']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"Ticket {self.code} - Event {self.purchase.event_id}"
    
    def save(self, *args, **kwargs):
        if not self.code:
            # Generate unique code
            self.code = f"TKT-{uuid.uuid4().hex[:8].upper()}"
        
        if not self.qr_payload:
            # Generate QR payload
            self.qr_payload = self._generate_qr_payload()
        
        super().save(*args, **kwargs)
    
    def _generate_qr_payload(self):
        """Generate signed QR payload string"""
        # Create payload data
        payload_data = f"TKT:{self.id}:{self.purchase.id}:{self.code}"
        
        # Create hash for verification
        hash_input = f"{payload_data}:{settings.SECRET_KEY}"
        hash_value = hashlib.sha256(hash_input.encode()).hexdigest()[:16]
        
        return f"{payload_data}:{hash_value}"
    
    @property
    def is_valid(self):
        """Check if ticket is valid for use"""
        return self.status == self.Status.VALID
    
    def use_ticket(self):
        """Mark ticket as used"""
        if self.is_valid:
            self.status = self.Status.USED
            self.used_at = timezone.now()
            self.save()
            return True
        return False
    
    def void_ticket(self):
        """Void the ticket"""
        self.status = self.Status.VOID
        self.save()


class TicketType(models.Model):
    """Ticket type model for events and fixtures - SRS compliant"""
    
    # Core relationships
    event_id = models.PositiveIntegerField(help_text="Event ID")
    fixture_id = models.PositiveIntegerField(null=True, blank=True, help_text="Fixture ID")
    
    # Basic information
    name = models.CharField(max_length=200, help_text="Ticket type name")
    description = models.TextField(blank=True, help_text="Ticket description")
    
    # Pricing
    price_cents = models.PositiveIntegerField(
        validators=[MinValueValidator(0)],
        help_text="Price in cents"
    )
    currency = models.CharField(max_length=3, default='USD', help_text="Currency code")
    
    # Inventory
    quantity_total = models.PositiveIntegerField(
        validators=[MinValueValidator(0)],
        help_text="Total quantity available"
    )
    quantity_sold = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Quantity sold"
    )
    
    # Sale status
    on_sale = models.BooleanField(default=True, help_text="Whether tickets are on sale")
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['event_id', 'fixture_id', 'price_cents']
        indexes = [
            models.Index(fields=['event_id', 'fixture_id', 'on_sale']),
            models.Index(fields=['event_id', 'on_sale']),
            models.Index(fields=['fixture_id', 'on_sale']),
        ]
    
    def __str__(self) -> str:
        fixture_str = f" - Fixture {self.fixture_id}" if self.fixture_id else ""
        return f"Event {self.event_id}{fixture_str} - {self.name}"
    
    @property
    def price_dollars(self) -> float:
        """Get price in dollars"""
        return self.price_cents / 100
    
    @property
    def available_quantity(self) -> int:
        """Get remaining available tickets"""
        return self.quantity_total - self.quantity_sold
    
    @property
    def is_available(self) -> bool:
        """Check if tickets are available for purchase"""
        return self.on_sale and self.available_quantity > 0
    
    def can_purchase(self, quantity: int) -> bool:
        """Check if a specific quantity can be purchased"""
        return self.is_available and quantity <= self.available_quantity


class TicketOrder(models.Model):
    """Ticket order model - SRS compliant"""
    
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"
        FAILED = "failed", "Failed"
        REFUNDED = "refunded", "Refunded"
        CANCELLED = "cancelled", "Cancelled"
    
    class Provider(models.TextChoices):
        STRIPE = "stripe", "Stripe"
        PAYPAL = "paypal", "PayPal"
        OFFLINE = "offline", "Offline Bank Transfer"
    
    # Core relationships
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="ticket_orders")
    event_id = models.PositiveIntegerField(help_text="Event ID")
    fixture_id = models.PositiveIntegerField(null=True, blank=True, help_text="Fixture ID")
    
    # Financial
    total_cents = models.PositiveIntegerField(
        validators=[MinValueValidator(0)],
        help_text="Total amount in cents"
    )
    currency = models.CharField(max_length=3, default='USD', help_text="Currency code")
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True
    )
    
    # Payment provider
    payment_provider = models.CharField(
        max_length=20,
        choices=Provider.choices,
        default=Provider.STRIPE
    )
    provider_session_id = models.CharField(max_length=255, null=True, blank=True, help_text="Payment provider session ID")
    provider_payment_intent_id = models.CharField(max_length=255, null=True, blank=True, help_text="Payment provider payment intent ID")
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['event_id', 'status']),
            models.Index(fields=['fixture_id', 'status']),
            models.Index(fields=['provider_session_id']),
        ]
    
    def __str__(self) -> str:
        return f"Order {self.id} - {self.user.email} - {self.status}"
    
    @property
    def total_dollars(self) -> float:
        """Get total in dollars"""
        return self.total_cents / 100
    
    @property
    def can_cancel(self) -> bool:
        """Check if order can be cancelled"""
        return self.status in [self.Status.PENDING, self.Status.PAID]
    
    def mark_paid(self, session_id: str = None, payment_intent: str = None):
        """Mark order as paid and issue tickets"""
        self.status = self.Status.PAID
        if session_id:
            self.provider_session_id = session_id
        if payment_intent:
            self.provider_payment_intent_id = payment_intent
        self.save()
        
        # Issue tickets and update inventory
        for ticket in self.tickets.all():
            ticket_type = ticket.ticket_type
            ticket_type.quantity_sold += 1
            ticket_type.save()
    
    def cancel(self):
        """Cancel the order and rollback inventory"""
        if self.status == self.Status.PAID:
            # Rollback inventory for paid orders
            for ticket in self.tickets.all():
                ticket_type = ticket.ticket_type
                ticket_type.quantity_sold = max(0, ticket_type.quantity_sold - 1)
                ticket_type.save()
                # Void the ticket
                ticket.void_ticket()
        
        self.status = self.Status.CANCELLED
        self.save()
    
    def refund(self, amount_cents: int = None, reason: str = ""):
        """Refund the order and void tickets"""
        if self.status != self.Status.PAID:
            raise ValueError("Only paid orders can be refunded")
        
        # Void all tickets
        for ticket in self.tickets.all():
            ticket.void_ticket()
        
        # Rollback inventory
        for ticket in self.tickets.all():
            ticket_type = ticket.ticket_type
            ticket_type.quantity_sold = max(0, ticket_type.quantity_sold - 1)
            ticket_type.save()
        
        self.status = self.Status.REFUNDED
        self.save()
        
        # Create refund record
        Refund.objects.create(
            order=self,
            amount_cents=amount_cents or self.total_cents,
            currency=self.currency,
            reason=reason,
            processed_by=None  # Will be set by the view
        )


class Refund(models.Model):
    """Refund model for ticket orders"""
    
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSED = "processed", "Processed"
        FAILED = "failed", "Failed"
        CANCELLED = "cancelled", "Cancelled"
    
    # Core relationships
    order = models.ForeignKey(TicketOrder, on_delete=models.CASCADE, related_name="refunds")
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="processed_refunds"
    )
    
    # Financial
    amount_cents = models.PositiveIntegerField(
        validators=[MinValueValidator(0)],
        help_text="Refund amount in cents"
    )
    currency = models.CharField(max_length=3, default='USD', help_text="Currency code")
    
    # Status and reason
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True
    )
    reason = models.TextField(help_text="Refund reason")
    
    # Provider details
    provider_refund_id = models.CharField(
        max_length=255, 
        null=True, 
        blank=True, 
        help_text="Payment provider refund ID"
    )
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['order', 'status']),
            models.Index(fields=['status']),
            models.Index(fields=['processed_by']),
        ]
    
    def __str__(self) -> str:
        return f"Refund {self.id} - Order {self.order.id} - {self.status}"
    
    @property
    def amount_dollars(self) -> float:
        """Get refund amount in dollars"""
        return self.amount_cents / 100
    
    def mark_processed(self, provider_refund_id: str = None):
        """Mark refund as processed"""
        self.status = self.Status.PROCESSED
        self.processed_at = timezone.now()
        if provider_refund_id:
            self.provider_refund_id = provider_refund_id
        self.save()
    
    def mark_failed(self):
        """Mark refund as failed"""
        self.status = self.Status.FAILED
        self.save()
    
    def cancel(self):
        """Cancel the refund"""
        self.status = self.Status.CANCELLED
        self.save()
