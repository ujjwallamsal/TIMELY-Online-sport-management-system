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
        related_name='payment_intents',
        null=True,
        blank=True
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
        related_name='refunds',
        null=True,
        blank=True
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


class PaymentSettings(models.Model):
    """Centralized payment configuration settings"""
    
    ENVIRONMENT_CHOICES = [
        ('test', 'Test'),
        ('live', 'Live'),
    ]
    
    # Stripe Configuration
    stripe_publishable_key = models.CharField(max_length=255, blank=True, help_text="Stripe publishable key")
    stripe_secret_key = models.CharField(max_length=255, blank=True, help_text="Stripe secret key (encrypted)")
    stripe_webhook_secret = models.CharField(max_length=255, blank=True, help_text="Stripe webhook secret")
    stripe_connect_account_id = models.CharField(max_length=255, blank=True, help_text="Stripe Connect account ID")
    
    # Environment and Status
    environment = models.CharField(max_length=10, choices=ENVIRONMENT_CHOICES, default='test')
    is_active = models.BooleanField(default=True, help_text="Enable payment processing")
    
    # Fees and Tax
    platform_fee_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text="Platform fee percentage")
    tax_rate_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text="Default tax rate percentage")
    
    # Currency and Limits
    default_currency = models.CharField(max_length=3, default='USD')
    minimum_amount_cents = models.PositiveIntegerField(default=50, help_text="Minimum payment amount in cents")
    maximum_amount_cents = models.PositiveIntegerField(default=100000, help_text="Maximum payment amount in cents")
    
    # Features
    enable_refunds = models.BooleanField(default=True)
    enable_partial_refunds = models.BooleanField(default=True)
    enable_offline_payments = models.BooleanField(default=False)
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='updated_payment_settings'
    )
    
    class Meta:
        verbose_name = 'Payment Settings'
        verbose_name_plural = 'Payment Settings'
        indexes = [
            models.Index(fields=['environment', 'is_active']),
        ]
    
    def __str__(self):
        return f"Payment Settings ({self.get_environment_display()})"
    
    def save(self, *args, **kwargs):
        # Only allow one active settings per environment
        if self.is_active:
            PaymentSettings.objects.filter(
                environment=self.environment,
                is_active=True
            ).exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)


class DeliveryEndpoint(models.Model):
    """Track delivery endpoints for notifications and webhooks"""
    
    ENDPOINT_TYPE_CHOICES = [
        ('web_push', 'Web Push'),
        ('email', 'Email'),
        ('sms', 'SMS'),
        ('webhook', 'Webhook'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('failed', 'Failed'),
    ]
    
    name = models.CharField(max_length=100)
    endpoint_type = models.CharField(max_length=20, choices=ENDPOINT_TYPE_CHOICES)
    url = models.URLField(blank=True, help_text="Endpoint URL for webhooks")
    config = models.JSONField(default=dict, help_text="Endpoint configuration")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Failure tracking
    failure_count = models.PositiveIntegerField(default=0)
    last_failure_at = models.DateTimeField(null=True, blank=True)
    last_success_at = models.DateTimeField(null=True, blank=True)
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['endpoint_type', 'status']),
            models.Index(fields=['status', 'failure_count']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_endpoint_type_display()})"


class DeliveryLog(models.Model):
    """Log delivery attempts for notifications and webhooks"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('retrying', 'Retrying'),
    ]
    
    endpoint = models.ForeignKey(DeliveryEndpoint, on_delete=models.CASCADE, related_name='delivery_logs')
    notification = models.ForeignKey(
        'notifications.Notification',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='delivery_logs'
    )
    webhook_event = models.ForeignKey(
        WebhookEvent,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='delivery_logs'
    )
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    response_code = models.PositiveIntegerField(null=True, blank=True)
    response_body = models.TextField(blank=True)
    error_message = models.TextField(blank=True)
    
    # Retry tracking
    retry_count = models.PositiveIntegerField(default=0)
    max_retries = models.PositiveIntegerField(default=3)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['endpoint', 'status']),
            models.Index(fields=['notification', 'status']),
        ]
    
    def __str__(self):
        return f"Delivery {self.id} - {self.get_status_display()}"
