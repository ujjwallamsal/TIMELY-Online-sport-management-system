from django.utils.deprecation import MiddlewareMixin

class PublicEndpointMiddleware(MiddlewareMixin):
    """
    Middleware that marks public endpoints to bypass authentication.
    """
    
    def process_request(self, request):
        # List of public endpoint patterns
        public_patterns = [
            '/api/public/',
            '/api/events/',
            '/api/matches/',
            '/api/results/',
            '/api/accounts/auth/login/',
            '/api/accounts/auth/register/',
        ]
        
        # Check if this is a public endpoint
        path = request.path_info
        if any(path.startswith(pattern) for pattern in public_patterns):
            # Mark the request as public
            request.is_public_endpoint = True
        else:
            request.is_public_endpoint = False
        
        return None
