# tickets/models.py
from __future__ import annotations

import uuid
import qrcode
from io import BytesIO
from django.db import models
from django.utils import timezone
from django.core.files import File
from django.core.files.base import ContentFile
from django.conf import settings

from events.models import Event
from accounts.models import User


class TicketType(models.Model):
    """Different types of tickets for an event"""
    class Category(models.TextChoices):
        GENERAL = "GENERAL", "General Admission"
        VIP = "VIP", "VIP Access"
        PREMIUM = "PREMIUM", "Premium Experience"
        STUDENT = "STUDENT", "Student Discount"
        SENIOR = "SENIOR", "Senior Citizen"
        CHILD = "CHILD", "Child Ticket"
        FAMILY = "FAMILY", "Family Package"
        GROUP = "GROUP", "Group Discount"

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="ticket_types")
    name = models.CharField(max_length=100, help_text="Ticket type name (e.g., 'VIP Pass', 'General Admission')")
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.GENERAL)
    description = models.TextField(help_text="Detailed description of what this ticket includes")
    
    # Pricing
    price_cents = models.PositiveIntegerField(help_text="Price in cents (e.g., 2500 = $25.00)")
    currency = models.CharField(max_length=3, default="USD", help_text="Currency code")
    
    # Availability
    total_quantity = models.PositiveIntegerField(help_text="Total tickets available")
    sold_quantity = models.PositiveIntegerField(default=0, help_text="Number of tickets sold")
    max_per_order = models.PositiveIntegerField(default=10, help_text="Maximum tickets per order")
    
    # Timing
    sale_start = models.DateTimeField(help_text="When ticket sales begin")
    sale_end = models.DateTimeField(help_text="When ticket sales end")
    
    # Features
    includes_seating = models.BooleanField(default=False, help_text="Does this ticket include assigned seating?")
    includes_amenities = models.BooleanField(default=False, help_text="Does this ticket include special amenities?")
    is_transferable = models.BooleanField(default=True, help_text="Can this ticket be transferred to another person?")
    
    # Status
    is_active = models.BooleanField(default=True, help_text="Is this ticket type currently available?")
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["event", "price_cents"]
        indexes = [
            models.Index(fields=["event", "is_active"]),
            models.Index(fields=["sale_start", "sale_end"]),
            models.Index(fields=["category", "is_active"]),
        ]

    def __str__(self) -> str:
        return f"{self.event.name} - {self.name}"

    @property
    def price_dollars(self) -> float:
        """Get price in dollars"""
        return self.price_cents / 100

    @property
    def available_quantity(self) -> int:
        """Get remaining available tickets"""
        return self.total_quantity - self.sold_quantity

    @property
    def is_available(self) -> bool:
        """Check if tickets are currently available for purchase"""
        now = timezone.now()
        return (
            self.is_active and
            self.available_quantity > 0 and
            self.sale_start <= now <= self.sale_end
        )

    @property
    def is_sold_out(self) -> bool:
        """Check if all tickets are sold"""
        return self.available_quantity <= 0

    def can_purchase(self, quantity: int) -> bool:
        """Check if a specific quantity can be purchased"""
        return (
            self.is_available and
            quantity <= self.available_quantity and
            quantity <= self.max_per_order
        )


class TicketOrder(models.Model):
    """Order containing multiple tickets"""
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending Payment"
        PAID = "PAID", "Payment Confirmed"
        CANCELLED = "CANCELLED", "Order Cancelled"
        REFUNDED = "REFUNDED", "Order Refunded"
        EXPIRED = "EXPIRED", "Payment Expired"

    class PaymentProvider(models.TextChoices):
        STRIPE = "STRIPE", "Stripe"
        PAYPAL = "PAYPAL", "PayPal"
        CASH = "CASH", "Cash Payment"
        BANK_TRANSFER = "BANK_TRANSFER", "Bank Transfer"

    # Order details
    order_number = models.CharField(max_length=20, unique=True, help_text="Unique order number")
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="ticket_orders")
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="ticket_orders")
    
    # Status and timing
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField(help_text="When the order expires if not paid")
    
    # Payment details
    payment_provider = models.CharField(max_length=20, choices=PaymentProvider.choices, null=True, blank=True)
    provider_reference = models.CharField(max_length=255, null=True, blank=True, help_text="Payment provider's reference ID")
    payment_amount_cents = models.PositiveIntegerField(help_text="Total amount paid in cents")
    payment_currency = models.CharField(max_length=3, default="USD")
    payment_date = models.DateTimeField(null=True, blank=True, help_text="When payment was confirmed")
    
    # Customer details
    customer_name = models.CharField(max_length=255, help_text="Full name of ticket holder")
    customer_email = models.EmailField(help_text="Email for ticket delivery")
    customer_phone = models.CharField(max_length=20, null=True, blank=True, help_text="Phone number for contact")
    
    # Notes
    notes = models.TextField(blank=True, help_text="Additional notes for the order")

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["customer", "status"]),
            models.Index(fields=["event", "status"]),
            models.Index(fields=["order_number"]),
            models.Index(fields=["payment_provider", "provider_reference"]),
        ]

    def __str__(self) -> str:
        return f"Order {self.order_number} - {self.customer_name}"

    def save(self, *args, **kwargs):
        if not self.order_number:
            # Generate unique order number
            self.order_number = f"TIX-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    @property
    def payment_amount_dollars(self) -> float:
        """Get payment amount in dollars"""
        return self.payment_amount_cents / 100

    @property
    def is_expired(self) -> bool:
        """Check if order has expired"""
        return timezone.now() > self.expires_at

    @property
    def can_cancel(self) -> bool:
        """Check if order can be cancelled"""
        return self.status in [self.Status.PENDING, self.Status.PAID]

    @property
    def total_tickets(self) -> int:
        """Get total number of tickets in this order"""
        return self.tickets.count()

    def mark_paid(self, provider: str, reference: str, amount_cents: int):
        """Mark order as paid"""
        self.status = self.Status.PAID
        self.payment_provider = provider
        self.provider_reference = reference
        self.payment_amount_cents = amount_cents
        self.payment_date = timezone.now()
        self.save()

        # Update ticket type sold quantities
        for ticket in self.tickets.all():
            ticket_type = ticket.ticket_type
            ticket_type.sold_quantity += 1
            ticket_type.save()

    def cancel(self):
        """Cancel the order"""
        if self.status == self.Status.PAID:
            # Refund logic would go here
            pass
        
        self.status = self.Status.CANCELLED
        self.save()


class Ticket(models.Model):
    """Individual ticket within an order"""
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        USED = "USED", "Used"
        CANCELLED = "CANCELLED", "Cancelled"
        EXPIRED = "EXPIRED", "Expired"

    # Ticket details
    ticket_id = models.CharField(max_length=50, unique=True, help_text="Unique ticket identifier")
    order = models.ForeignKey(TicketOrder, on_delete=models.CASCADE, related_name="tickets")
    ticket_type = models.ForeignKey(TicketType, on_delete=models.CASCADE, related_name="tickets")
    
    # Status and timing
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE, db_index=True)
    issued_at = models.DateTimeField(auto_now_add=True)
    used_at = models.DateTimeField(null=True, blank=True, help_text="When the ticket was used")
    expires_at = models.DateTimeField(help_text="When the ticket expires")
    
    # Ticket holder details
    holder_name = models.CharField(max_length=255, help_text="Name of the person who will use this ticket")
    holder_email = models.EmailField(help_text="Email of the ticket holder")
    
    # Seating (if applicable)
    seat_number = models.CharField(max_length=20, null=True, blank=True, help_text="Assigned seat number")
    section = models.CharField(max_length=50, null=True, blank=True, help_text="Seating section")
    
    # QR Code
    qr_code = models.ImageField(upload_to="ticket_qr_codes/", null=True, blank=True, help_text="QR code for ticket validation")
    
    # Validation
    validation_hash = models.CharField(max_length=64, unique=True, help_text="Hash for ticket validation")
    
    # Notes
    notes = models.TextField(blank=True, help_text="Additional notes for this ticket")

    class Meta:
        ordering = ["order", "issued_at"]
        indexes = [
            models.Index(fields=["ticket_id"]),
            models.Index(fields=["order", "status"]),
            models.Index(fields=["ticket_type", "status"]),
            models.Index(fields=["validation_hash"]),
        ]

    def __str__(self) -> str:
        return f"Ticket {self.ticket_id} - {self.holder_name}"

    def save(self, *args, **kwargs):
        if not self.ticket_id:
            # Generate unique ticket ID
            self.ticket_id = f"TKT-{uuid.uuid4().hex[:12].upper()}"
        
        if not self.validation_hash:
            # Generate validation hash
            self.validation_hash = uuid.uuid4().hex
        
        if not self.expires_at:
            # Set expiration to event end time
            self.expires_at = self.order.event.end_date
        
        super().save(*args, **kwargs)
        
        # Generate QR code if not exists
        if not self.qr_code:
            self.generate_qr_code()

    def generate_qr_code(self):
        """Generate QR code for the ticket"""
        # Create QR code data
        qr_data = {
            'ticket_id': self.ticket_id,
            'validation_hash': self.validation_hash,
            'event': self.order.event.name,
            'holder': self.holder_name,
            'type': self.ticket_type.name
        }
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(str(qr_data))
        qr.make(fit=True)
        
        # Create image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Save to BytesIO
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        
        # Save to model
        filename = f"ticket_{self.ticket_id}_qr.png"
        self.qr_code.save(filename, ContentFile(buffer.getvalue()), save=False)

    @property
    def is_valid(self) -> bool:
        """Check if ticket is valid for use"""
        now = timezone.now()
        return (
            self.status == self.Status.ACTIVE and
            now <= self.expires_at and
            not self.is_expired
        )

    @property
    def is_expired(self) -> bool:
        """Check if ticket has expired"""
        return timezone.now() > self.expires_at

    def use_ticket(self):
        """Mark ticket as used"""
        if self.is_valid:
            self.status = self.Status.USED
            self.used_at = timezone.now()
            self.save()
            return True
        return False

    def cancel_ticket(self):
        """Cancel the ticket"""
        self.status = self.Status.CANCELLED
        self.save()

    def get_qr_code_url(self) -> str:
        """Get URL for the QR code image"""
        if self.qr_code:
            return self.qr_code.url
        return ""

    def get_ticket_pdf_url(self) -> str:
        """Get URL for downloadable ticket PDF"""
        # This would be implemented with a PDF generation service
        return f"/api/tickets/{self.ticket_id}/pdf/"


class PaymentRecord(models.Model):
    """Record of payment transactions"""
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SUCCEEDED = "SUCCEEDED", "Succeeded"
        FAILED = "FAILED", "Failed"
        CANCELLED = "CANCELLED", "Cancelled"
        REFUNDED = "REFUNDED", "Refunded"

    # Payment details
    order = models.ForeignKey(TicketOrder, on_delete=models.CASCADE, related_name="payment_records")
    provider = models.CharField(max_length=20, choices=TicketOrder.PaymentProvider.choices)
    provider_reference = models.CharField(max_length=255, help_text="Payment provider's reference ID")
    
    # Amount and currency
    amount_cents = models.PositiveIntegerField(help_text="Payment amount in cents")
    currency = models.CharField(max_length=3, default="USD")
    
    # Status and timing
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    processed_at = models.DateTimeField(null=True, blank=True, help_text="When payment was processed")
    
    # Provider response data
    provider_data = models.JSONField(default=dict, help_text="Raw response data from payment provider")
    
    # Error information
    error_message = models.TextField(blank=True, help_text="Error message if payment failed")
    error_code = models.CharField(max_length=100, blank=True, help_text="Error code from payment provider")

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["order", "status"]),
            models.Index(fields=["provider", "provider_reference"]),
            models.Index(fields=["status", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"Payment {self.provider_reference} - {self.order.order_number}"

    @property
    def amount_dollars(self) -> float:
        """Get amount in dollars"""
        return self.amount_cents / 100

    def mark_succeeded(self, processed_at=None):
        """Mark payment as succeeded"""
        self.status = self.Status.SUCCEEDED
        self.processed_at = processed_at or timezone.now()
        self.save()

    def mark_failed(self, error_message="", error_code=""):
        """Mark payment as failed"""
        self.status = self.Status.FAILED
        self.error_message = error_message
        self.error_code = error_code
        self.save()
