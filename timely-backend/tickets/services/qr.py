# tickets/services/qr.py
"""
QR code service for ticket generation
"""
import hashlib
from typing import Dict, Any
from django.conf import settings


def generate_qr_payload(ticket_id: int, order_id: int, serial: str) -> str:
    """
    Generate signed QR payload string for ticket
    
    Args:
        ticket_id: Ticket ID
        order_id: Order ID
        serial: Ticket serial number
        
    Returns:
        Signed QR payload string
    """
    # Create payload data
    payload_data = f"TKT:{ticket_id}:{order_id}:{serial}"
    
    # Create hash for verification
    hash_input = f"{payload_data}:{settings.SECRET_KEY}"
    hash_value = hashlib.sha256(hash_input.encode()).hexdigest()[:16]
    
    return f"{payload_data}:{hash_value}"


def verify_qr_payload(qr_payload: str) -> Dict[str, Any]:
    """
    Verify QR payload and extract ticket information
    
    Args:
        qr_payload: QR payload string to verify
        
    Returns:
        Dict with verification results and ticket data
    """
    result = {
        'valid': False,
        'ticket_id': None,
        'order_id': None,
        'serial': None,
        'error': None
    }
    
    try:
        # Split payload and hash
        if ':' not in qr_payload:
            result['error'] = "Invalid payload format"
            return result
        
        parts = qr_payload.split(':')
        if len(parts) != 5:
            result['error'] = "Invalid payload structure"
            return result
        
        prefix, ticket_id, order_id, serial, hash_value = parts
        
        # Verify prefix
        if prefix != 'TKT':
            result['error'] = "Invalid ticket prefix"
            return result
        
        # Verify hash
        payload_data = f"TKT:{ticket_id}:{order_id}:{serial}"
        expected_hash_input = f"{payload_data}:{settings.SECRET_KEY}"
        expected_hash = hashlib.sha256(expected_hash_input.encode()).hexdigest()[:16]
        
        if hash_value != expected_hash:
            result['error'] = "Invalid hash signature"
            return result
        
        # Extract data
        result['valid'] = True
        result['ticket_id'] = int(ticket_id)
        result['order_id'] = int(order_id)
        result['serial'] = serial
        
    except (ValueError, IndexError) as e:
        result['error'] = f"Payload parsing error: {str(e)}"
    
    return result


def create_ticket_data(ticket) -> Dict[str, Any]:
    """
    Create ticket data for QR code generation
    
    Args:
        ticket: Ticket instance
        
    Returns:
        Dict with ticket data for QR code
    """
    return {
        'ticket_id': ticket.id,
        'serial': ticket.serial,
        'order_id': ticket.order.id,
        'event_name': ticket.order.event.name,
        'ticket_type': ticket.ticket_type.name,
        'price': ticket.ticket_type.price_dollars,
        'currency': ticket.ticket_type.currency,
        'issued_at': ticket.issued_at.isoformat(),
        'status': ticket.status,
        'qr_payload': ticket.qr_payload
    }


def generate_validation_url(ticket_id: int) -> str:
    """
    Generate validation URL for ticket
    
    Args:
        ticket_id: Ticket ID
        
    Returns:
        Validation URL
    """
    # This would be used for ticket validation endpoints
    return f"/api/tickets/{ticket_id}/validate/"


def create_offline_payload(ticket) -> str:
    """
    Create offline validation payload for ticket scanning
    
    Args:
        ticket: Ticket instance
        
    Returns:
        Offline validation payload
    """
    # Create a more compact payload for offline validation
    data = {
        'id': ticket.id,
        'serial': ticket.serial,
        'event': ticket.order.event.id,
        'type': ticket.ticket_type.id,
        'issued': ticket.issued_at.timestamp()
    }
    
    # Create hash for offline verification
    data_string = f"{data['id']}:{data['serial']}:{data['event']}:{data['type']}:{data['issued']}"
    hash_input = f"{data_string}:{settings.SECRET_KEY}"
    hash_value = hashlib.sha256(hash_input.encode()).hexdigest()[:12]
    
    return f"OFF:{data_string}:{hash_value}"
