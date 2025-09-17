# tickets/services/qr_service.py
import qrcode
import qrcode.image.svg
from io import BytesIO
import base64
from typing import Dict, Any, Tuple
import logging

logger = logging.getLogger(__name__)


class QRCodeService:
    """Service for generating QR codes for tickets"""
    
    def __init__(self):
        self.qr_factory = qrcode.image.svg.SvgPathImage
    
    def generate_qr_png(self, data: str, size: int = 200) -> bytes:
        """Generate QR code as PNG bytes"""
        try:
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(data)
            qr.make(fit=True)
            
            img = qr.make_image(fill_color="black", back_color="white")
            
            # Resize if needed
            if size != 200:
                img = img.resize((size, size))
            
            # Convert to bytes
            buffer = BytesIO()
            img.save(buffer, format='PNG')
            return buffer.getvalue()
            
        except Exception as e:
            logger.error(f"Failed to generate QR PNG: {str(e)}")
            raise Exception(f"QR code generation failed: {str(e)}")
    
    def generate_qr_svg(self, data: str, size: int = 200) -> str:
        """Generate QR code as SVG string"""
        try:
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(data)
            qr.make(fit=True)
            
            img = qr.make_image(image_factory=self.qr_factory)
            
            # Get SVG string
            svg_buffer = BytesIO()
            img.save(svg_buffer)
            svg_string = svg_buffer.getvalue().decode('utf-8')
            
            # Add size attributes if needed
            if size != 200:
                svg_string = svg_string.replace(
                    'width="200"', f'width="{size}"'
                ).replace(
                    'height="200"', f'height="{size}"'
                )
            
            return svg_string
            
        except Exception as e:
            logger.error(f"Failed to generate QR SVG: {str(e)}")
            raise Exception(f"QR code generation failed: {str(e)}")
    
    def generate_qr_base64(self, data: str, size: int = 200, format: str = 'png') -> str:
        """Generate QR code as base64 string"""
        try:
            if format.lower() == 'png':
                qr_bytes = self.generate_qr_png(data, size)
                return base64.b64encode(qr_bytes).decode('utf-8')
            elif format.lower() == 'svg':
                svg_string = self.generate_qr_svg(data, size)
                return base64.b64encode(svg_string.encode('utf-8')).decode('utf-8')
            else:
                raise ValueError("Format must be 'png' or 'svg'")
                
        except Exception as e:
            logger.error(f"Failed to generate QR base64: {str(e)}")
            raise Exception(f"QR code generation failed: {str(e)}")
    
    def create_ticket_qr_data(self, ticket_id: int, order_id: int, serial: str) -> str:
        """Create QR code data string for ticket"""
        return f"TKT:{ticket_id}:{order_id}:{serial}"
    
    def validate_qr_data(self, qr_data: str) -> Dict[str, Any]:
        """Validate and parse QR code data"""
        try:
            parts = qr_data.split(':')
            if len(parts) != 4 or parts[0] != 'TKT':
                return {
                    'valid': False,
                    'error': 'Invalid QR code format'
                }
            
            ticket_id = int(parts[1])
            order_id = int(parts[2])
            serial = parts[3]
            
            return {
                'valid': True,
                'ticket_id': ticket_id,
                'order_id': order_id,
                'serial': serial
            }
            
        except (ValueError, IndexError) as e:
            return {
                'valid': False,
                'error': f'Invalid QR code data: {str(e)}'
            }
    
    def generate_ticket_qr_png(self, ticket_id: int, order_id: int, serial: str, size: int = 200) -> bytes:
        """Generate QR code PNG for a specific ticket"""
        qr_data = self.create_ticket_qr_data(ticket_id, order_id, serial)
        return self.generate_qr_png(qr_data, size)
    
    def generate_ticket_qr_svg(self, ticket_id: int, order_id: int, serial: str, size: int = 200) -> str:
        """Generate QR code SVG for a specific ticket"""
        qr_data = self.create_ticket_qr_data(ticket_id, order_id, serial)
        return self.generate_qr_svg(qr_data, size)
    
    def generate_ticket_qr_base64(self, ticket_id: int, order_id: int, serial: str, size: int = 200, format: str = 'png') -> str:
        """Generate QR code base64 for a specific ticket"""
        qr_data = self.create_ticket_qr_data(ticket_id, order_id, serial)
        return self.generate_qr_base64(qr_data, size, format)


# Global service instance
qr_service = QRCodeService()
