# tickets/models.py
from __future__ import annotations

import uuid
import hashlib
from django.db import models
from django.utils import timezone
from django.conf import settings
from django.core.validators import MinValueValidator

from events.models import Event
from accounts.models import User


class TicketType(models.Model):
    """Ticket type model for events and fixtures - SRS compliant"""
    
    # Core relationships
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="ticket_types")
    fixture = models.ForeignKey('fixtures.Fixture', on_delete=models.CASCADE, null=True, blank=True, related_name="ticket_types")
    
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
        ordering = ['event', 'fixture', 'price_cents']
        indexes = [
            models.Index(fields=['event', 'fixture', 'on_sale']),
            models.Index(fields=['event', 'on_sale']),
            models.Index(fields=['fixture', 'on_sale']),
        ]
    
    def __str__(self) -> str:
        fixture_str = f" - {self.fixture}" if self.fixture else ""
        return f"{self.event.name}{fixture_str} - {self.name}"
    
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
    
    # Core relationships
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="ticket_orders")
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="ticket_orders")
    fixture = models.ForeignKey('fixtures.Fixture', on_delete=models.CASCADE, null=True, blank=True, related_name="ticket_orders")
    
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
    provider = models.CharField(
        max_length=20,
        choices=Provider.choices,
        default=Provider.STRIPE
    )
    provider_session_id = models.CharField(max_length=255, null=True, blank=True, help_text="Stripe session ID")
    provider_payment_intent = models.CharField(max_length=255, null=True, blank=True, help_text="Stripe payment intent ID")
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['event', 'status']),
            models.Index(fields=['fixture', 'status']),
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
            self.provider_payment_intent = payment_intent
        self.save()
        
        # Issue tickets and update inventory
        for ticket in self.tickets.all():
            ticket_type = ticket.ticket_type
            ticket_type.quantity_sold += 1
            ticket_type.save()
    
    def cancel(self):
        """Cancel the order"""
        self.status = self.Status.CANCELLED
        self.save()


class Ticket(models.Model):
    """Individual ticket model - SRS compliant"""
    
    class Status(models.TextChoices):
        VALID = "valid", "Valid"
        USED = "used", "Used"
        VOID = "void", "Void"
    
    # Core relationships
    order = models.ForeignKey(TicketOrder, on_delete=models.CASCADE, related_name="tickets")
    ticket_type = models.ForeignKey(TicketType, on_delete=models.CASCADE, related_name="tickets")
    
    # Ticket identification
    qr_payload = models.TextField(help_text="QR code payload string")
    serial = models.CharField(max_length=50, unique=True, help_text="Human-readable ticket serial")
    
    # Status
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.VALID,
        db_index=True
    )
    
    # Timing
    issued_at = models.DateTimeField(auto_now_add=True)
    used_at = models.DateTimeField(null=True, blank=True, help_text="When ticket was used")
    
    class Meta:
        ordering = ['order', 'issued_at']
        indexes = [
            models.Index(fields=['order']),
            models.Index(fields=['ticket_type']),
            models.Index(fields=['serial']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self) -> str:
        return f"Ticket {self.serial} - {self.ticket_type.name}"
    
    def save(self, *args, **kwargs):
        if not self.serial:
            # Generate unique serial
            self.serial = f"TKT-{uuid.uuid4().hex[:8].upper()}"
        
        if not self.qr_payload:
            # Generate QR payload
            self.qr_payload = self._generate_qr_payload()
        
        super().save(*args, **kwargs)
    
    def _generate_qr_payload(self) -> str:
        """Generate signed QR payload string"""
        # Create payload data
        payload_data = f"TKT:{self.id}:{self.order.id}:{self.serial}"
        
        # Create hash for verification
        hash_input = f"{payload_data}:{settings.SECRET_KEY}"
        hash_value = hashlib.sha256(hash_input.encode()).hexdigest()[:16]
        
        return f"{payload_data}:{hash_value}"
    
    @property
    def is_valid(self) -> bool:
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