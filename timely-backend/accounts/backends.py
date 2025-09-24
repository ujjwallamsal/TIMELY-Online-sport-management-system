"""
Custom authentication backends for the accounts app.
"""

from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q

User = get_user_model()


class EmailOrUsernameModelBackend(ModelBackend):
    """
    Custom authentication backend that allows users to authenticate
    using either their email address or username.
    """
    
    def authenticate(self, request, email_or_username=None, password=None, **kwargs):
        """
        Authenticate user using email or username.
        
        Args:
            request: The request object
            email_or_username: Email address or username to authenticate
            password: User's password
            **kwargs: Additional keyword arguments
            
        Returns:
            User object if authentication successful, None otherwise
        """
        if email_or_username is None or password is None:
            return None
        
        try:
            # Try to find the user by email or username
            user = User.objects.get(
                Q(email=email_or_username) | Q(username=email_or_username)
            )
        except User.DoesNotExist:
            return None
        
        # Check password and user can authenticate
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        
        return None
    
    def get_user(self, user_id):
        """
        Get user by ID.
        
        Args:
            user_id: User's primary key
            
        Returns:
            User object if found, None otherwise
        """
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None