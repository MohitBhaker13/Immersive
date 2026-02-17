"""
Google OAuth Authentication Module
Handles Google OAuth 2.0 flow without Emergent's managed auth
"""

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import os
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional

class GoogleOAuthHandler:
    def __init__(self, client_id: str):
        self.client_id = client_id
        
    def verify_token(self, token: str) -> dict:
        """
        Verify Google ID token and extract user info
        
        Args:
            token: Google ID token from frontend
            
        Returns:
            dict with user info: email, name, picture, sub (Google user ID)
            
        Raises:
            ValueError: If token is invalid
        """
        try:
            # Verify the token
            idinfo = id_token.verify_oauth2_token(
                token, 
                google_requests.Request(), 
                self.client_id
            )
            
            # Verify issuer
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong issuer.')
            
            # Extract user info
            return {
                'sub': idinfo['sub'],  # Google user ID
                'email': idinfo['email'],
                'name': idinfo.get('name', ''),
                'picture': idinfo.get('picture', ''),
                'email_verified': idinfo.get('email_verified', False),
            }
            
        except ValueError as e:
            raise ValueError(f'Invalid token: {str(e)}')
    
    def generate_session_token(self) -> str:
        """Generate a secure session token"""
        return secrets.token_urlsafe(32)
    
    def create_session_expiry(self, days: int = 7) -> datetime:
        """Create session expiry datetime"""
        return datetime.now(timezone.utc) + timedelta(days=days)


# Initialize handler
google_oauth = GoogleOAuthHandler(
    client_id=os.getenv('GOOGLE_CLIENT_ID', '')
)
