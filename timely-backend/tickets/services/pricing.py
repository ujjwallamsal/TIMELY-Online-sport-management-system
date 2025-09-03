# tickets/services/pricing.py
"""
Pricing service for ticket calculations
"""
from typing import Dict, List, Tuple
from decimal import Decimal


def calculate_order_total(ticket_items: List[Dict]) -> Tuple[int, str]:
    """
    Calculate total price for ticket order items
    
    Args:
        ticket_items: List of dicts with 'ticket_type_id' and 'qty'
        
    Returns:
        Tuple of (total_cents, currency)
    """
    from ..models import TicketType
    
    total_cents = 0
    currency = 'USD'
    
    for item in ticket_items:
        ticket_type_id = item['ticket_type_id']
        quantity = item['qty']
        
        try:
            ticket_type = TicketType.objects.get(id=ticket_type_id)
            currency = ticket_type.currency  # Use currency from first ticket type
            
            # Calculate subtotal for this item
            subtotal_cents = ticket_type.price_cents * quantity
            total_cents += subtotal_cents
            
        except TicketType.DoesNotExist:
            raise ValueError(f"Ticket type {ticket_type_id} not found")
    
    return total_cents, currency


def calculate_fees(total_cents: int, currency: str = 'USD') -> Dict[str, int]:
    """
    Calculate processing fees (stub for test mode)
    
    Args:
        total_cents: Base amount in cents
        currency: Currency code
        
    Returns:
        Dict with fee breakdown
    """
    # In test mode, no fees applied
    # TODO: Implement real fee calculation for production
    return {
        'processing_fee_cents': 0,
        'service_fee_cents': 0,
        'total_fees_cents': 0,
        'final_total_cents': total_cents
    }


def apply_discounts(total_cents: int, discount_code: str = None) -> Dict[str, int]:
    """
    Apply discounts to order total (stub for test mode)
    
    Args:
        total_cents: Base amount in cents
        discount_code: Optional discount code
        
    Returns:
        Dict with discount breakdown
    """
    # In test mode, no discounts applied
    # TODO: Implement real discount logic for production
    return {
        'discount_amount_cents': 0,
        'discount_code': discount_code,
        'final_total_cents': total_cents
    }


def validate_inventory(ticket_items: List[Dict]) -> Dict[str, any]:
    """
    Validate that sufficient inventory exists for order
    
    Args:
        ticket_items: List of dicts with 'ticket_type_id' and 'qty'
        
    Returns:
        Dict with validation results
    """
    from ..models import TicketType
    
    validation_results = {
        'valid': True,
        'errors': [],
        'warnings': []
    }
    
    for item in ticket_items:
        ticket_type_id = item['ticket_type_id']
        quantity = item['qty']
        
        try:
            ticket_type = TicketType.objects.get(id=ticket_type_id)
            
            # Check if ticket type is on sale
            if not ticket_type.on_sale:
                validation_results['valid'] = False
                validation_results['errors'].append(
                    f"Ticket type '{ticket_type.name}' is not currently on sale"
                )
                continue
            
            # Check availability
            if not ticket_type.can_purchase(quantity):
                validation_results['valid'] = False
                validation_results['errors'].append(
                    f"Insufficient inventory for '{ticket_type.name}'. "
                    f"Requested: {quantity}, Available: {ticket_type.available_quantity}"
                )
            
            # Check if low inventory warning
            if ticket_type.available_quantity <= 5:
                validation_results['warnings'].append(
                    f"Low inventory for '{ticket_type.name}': {ticket_type.available_quantity} remaining"
                )
                
        except TicketType.DoesNotExist:
            validation_results['valid'] = False
            validation_results['errors'].append(f"Ticket type {ticket_type_id} not found")
    
    return validation_results


def format_price(cents: int, currency: str = 'USD') -> str:
    """
    Format price in cents to display string
    
    Args:
        cents: Price in cents
        currency: Currency code
        
    Returns:
        Formatted price string
    """
    dollars = cents / 100
    
    if currency == 'USD':
        return f"${dollars:.2f}"
    elif currency == 'EUR':
        return f"€{dollars:.2f}"
    elif currency == 'GBP':
        return f"£{dollars:.2f}"
    else:
        return f"{dollars:.2f} {currency}"
