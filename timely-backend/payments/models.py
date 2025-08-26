# payments/models.py
from __future__ import annotations
import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


class PaymentIntent(models.Model):
    class Status(models.TextChoices):
        REQUIRES_PAYMENT_METHOD = "requires_payment_method", "Requires Payment Method"
        REQUIRES_CONFIRMATION = "requires_confirmation", "Requires Confirmation"
        REQUIRES_ACTION = "requires_action", "Requires Action"
        PROCESSING = "processing", "Processing"
        REQUIRES_CAPTURE = "requires_capture", "Requires Capture"
        CANCELED = "canceled", "Canceled"
        SUCCEEDED = "succeeded", "Succeeded"
    
    # Stripe Information
    stripe_payment_intent_id = models.CharField(max_length=255, unique=True)
    stripe_customer_id = models.CharField(max_length=255, blank=True)
    
    # Payment Details
    amount_cents = models.PositiveIntegerField()
    currency = models.CharField(max_length=3, default='AUD')
    status = models.CharField(max_length=30, choices=Status.choices)
    
    # Registration Reference
    registration = models.ForeignKey(
        'registrations.Registration',
        on_delete=models.CASCADE,
        related_name='payment_intents'
    )
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    client_secret = models.CharField(max_length=255, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['stripe_payment_intent_id']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['registration', 'status']),
        ]
    
    def __str__(self):
        return f"Payment {self.stripe_payment_intent_id} - {self.registration}"
    
    @property
    def amount_dollars(self):
        return self.amount_cents / 100


class WebhookEvent(models.Model):
    """Track Stripe webhook events for debugging and audit"""
    stripe_event_id = models.CharField(max_length=255, unique=True)
    event_type = models.CharField(max_length=100)
    api_version = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField()
    received_at = models.DateTimeField(auto_now_add=True)
    
    # Event data
    data = models.JSONField()
    processed = models.BooleanField(default=False)
    processing_error = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-received_at']
        indexes = [
            models.Index(fields=['stripe_event_id']),
            models.Index(fields=['event_type', 'processed']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"Webhook {self.stripe_event_id} - {self.event_type}"


class Refund(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SUCCEEDED = "succeeded", "Succeeded"
        FAILED = "failed", "Failed"
        CANCELED = "canceled", "Canceled"
    
    # Stripe Information
    stripe_refund_id = models.CharField(max_length=255, unique=True)
    stripe_payment_intent_id = models.CharField(max_length=255)
    
    # Refund Details
    amount_cents = models.PositiveIntegerField()
    currency = models.CharField(max_length=3, default='AUD')
    reason = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices)
    
    # Registration Reference
    registration = models.ForeignKey(
        'registrations.Registration',
        on_delete=models.CASCADE,
        related_name='refunds'
    )
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['stripe_refund_id']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['registration', 'status']),
        ]
    
    def __str__(self):
        return f"Refund {self.stripe_refund_id} - {self.registration}"
    
    @property
    def amount_dollars(self):
        return self.amount_cents / 100
