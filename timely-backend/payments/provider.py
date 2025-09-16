# payments/provider.py
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from django.conf import settings
from django.http import HttpRequest


class PaymentProvider(ABC):
    """Abstract base class for payment providers"""
    
    @abstractmethod
    def create_session(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a payment session for an order.
        
        Args:
            order_data: Dictionary containing order information
            
        Returns:
            Dictionary containing session data (e.g., checkout_url, session_id)
        """
        pass
    
    @abstractmethod
    def refund(self, order_data: Dict[str, Any], amount_cents: int) -> Dict[str, Any]:
        """
        Process a refund for an order.
        
        Args:
            order_data: Dictionary containing order information
            amount_cents: Amount to refund in cents
            
        Returns:
            Dictionary containing refund data
        """
        pass
    
    @abstractmethod
    def verify_webhook(self, request: HttpRequest) -> bool:
        """
        Verify webhook signature from payment provider.
        
        Args:
            request: Django HttpRequest object
            
        Returns:
            True if webhook is valid, False otherwise
        """
        pass
    
    @abstractmethod
    def process_webhook(self, request: HttpRequest) -> Dict[str, Any]:
        """
        Process webhook from payment provider.
        
        Args:
            request: Django HttpRequest object
            
        Returns:
            Dictionary containing processed webhook data
        """
        pass
    
    @abstractmethod
    def get_payment_status(self, payment_id: str) -> Dict[str, Any]:
        """
        Get payment status from provider.
        
        Args:
            payment_id: Payment ID from provider
            
        Returns:
            Dictionary containing payment status
        """
        pass


class PaymentProviderFactory:
    """Factory for creating payment provider instances"""
    
    _providers = {}
    _providers_registered = False
    
    @classmethod
    def _ensure_providers_registered(cls):
        """Ensure providers are registered (lazy loading)"""
        if not cls._providers_registered:
            from .stripe_gateway import StripeProvider
            from .paypal_gateway import PayPalProvider
            from .offline_gateway import OfflineProvider
            
            cls.register_provider('stripe', StripeProvider)
            cls.register_provider('paypal', PayPalProvider)
            cls.register_provider('offline', OfflineProvider)
            cls._providers_registered = True
    
    @classmethod
    def register_provider(cls, name: str, provider_class):
        """Register a payment provider"""
        cls._providers[name] = provider_class
    
    @classmethod
    def get_provider(cls, name: str) -> PaymentProvider:
        """Get a payment provider instance"""
        cls._ensure_providers_registered()
        if name not in cls._providers:
            raise ValueError(f"Unknown payment provider: {name}")
        
        return cls._providers[name]()
    
    @classmethod
    def get_available_providers(cls) -> list:
        """Get list of available providers"""
        cls._ensure_providers_registered()
        return list(cls._providers.keys())


