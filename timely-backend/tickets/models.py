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


class TicketType(models.Model):
    """Ticket type model for different ticket categories"""
    
    name = models.CharField(max_length=100, help_text="Ticket type name")
    description = models.TextField(blank=True, help_text="Ticket type description")
    event_id = models.PositiveIntegerField(help_text="Event ID")
    fixture_id = models.PositiveIntegerField(null=True, blank=True, help_text="Fixture ID")
    price_cents = models.PositiveIntegerField(help_text="Price in cents")
    currency = models.CharField(max_length=3, default='USD')
    quantity_total = models.PositiveIntegerField(help_text="Total quantity available")
    quantity_sold = models.PositiveIntegerField(default=0, help_text="Quantity sold")
    on_sale = models.BooleanField(default=True, help_text="Whether tickets are on sale")
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['event_id']),
            models.Index(fields=['fixture_id']),
            models.Index(fields=['on_sale']),
        ]
    
    def __str__(self):
        return f"{self.name} - Event {self.event_id}"
    
    @property
    def price_dollars(self):
        """Get price in dollars"""
        return self.price_cents / 100
    
    @property
    def available_quantity(self):
        """Get available quantity"""
        return max(0, self.quantity_total - self.quantity_sold)
    
    def can_purchase(self, quantity):
        """Check if quantity can be purchased"""
        return self.on_sale and self.available_quantity >= quantity


class TicketOrder(models.Model):
    """Ticket order model for ticketing system"""
    
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"
        FAILED = "failed", "Failed"
        REFUNDED = "refunded", "Refunded"
    
    class Provider(models.TextChoices):
        STRIPE = "stripe", "Stripe"
        OFFLINE = "offline", "Offline"
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="ticket_orders")
    event_id = models.PositiveIntegerField(help_text="Event ID")
    fixture_id = models.PositiveIntegerField(null=True, blank=True, help_text="Fixture ID")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    total_cents = models.PositiveIntegerField(help_text="Total amount in cents")
    currency = models.CharField(max_length=3, default='USD')
    payment_provider = models.CharField(max_length=20, choices=Provider.choices, default=Provider.STRIPE)
    provider_session_id = models.CharField(max_length=255, blank=True, help_text="Payment provider session ID")
    provider_payment_intent_id = models.CharField(max_length=255, blank=True, help_text="Payment provider intent ID")
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['event_id', 'status']),
            models.Index(fields=['provider_payment_intent_id']),
        ]
    
    def __str__(self):
        return f"TicketOrder {self.id} - {self.user.email} - {self.status}"
    
    @property
    def total_dollars(self):
        """Get total in dollars"""
        return self.total_cents / 100


class Ticket(models.Model):
    """Simplified ticket model for ticketing system"""
    
    class Status(models.TextChoices):
        VALID = "valid", "Valid"
        USED = "used", "Used"
        VOID = "void", "Void"
    
    order = models.ForeignKey(TicketOrder, on_delete=models.CASCADE, related_name="tickets")
    ticket_type = models.ForeignKey('TicketType', on_delete=models.CASCADE, related_name="tickets")
    serial = models.CharField(max_length=50, unique=True, help_text="Unique ticket serial number")
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.VALID, db_index=True)
    
    # QR code data
    qr_payload = models.TextField(help_text="QR code payload string")
    
    # Audit fields
    issued_at = models.DateTimeField(auto_now_add=True)
    used_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-issued_at']
        indexes = [
            models.Index(fields=['order']),
            models.Index(fields=['serial']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"Ticket {self.serial} - Event {self.order.event_id}"
    
    def save(self, *args, **kwargs):
        if not self.serial:
            # Generate unique serial
            self.serial = f"TKT-{uuid.uuid4().hex[:8].upper()}"
        
        # Use serial as the unique identifier
        
        if not self.qr_payload:
            # Generate QR payload
            self.qr_payload = self._generate_qr_payload()
        
        super().save(*args, **kwargs)
    
    def _generate_qr_payload(self):
        """Generate signed QR payload string"""
        # Create payload data
        payload_data = f"TKT:{self.id}:{self.order.id}:{self.serial}"
        
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
