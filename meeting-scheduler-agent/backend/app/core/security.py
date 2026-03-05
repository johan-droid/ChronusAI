"""
Token encryption and decryption using Fernet (AES-128-CBC).
All OAuth tokens are encrypted at rest.
"""
from cryptography.fernet import Fernet

from app.config import get_settings


settings = get_settings()


class TokenEncryptor:
    """Handles encryption and decryption of OAuth tokens."""
    
    def __init__(self, key: bytes | None = None):
        """
        Initialize the encryptor with a Fernet key.
        
        Args:
            key: Fernet key bytes. If None, uses ENCRYPTION_KEY from settings.
        """
        if key is None:
            key = settings.ENCRYPTION_KEY.encode()
        
        self.fernet = Fernet(key)
    
    def encrypt(self, token: str) -> str:
        """
        Encrypt a token string.
        
        Args:
            token: Plain text token to encrypt.
            
        Returns:
            Encrypted token as base64-encoded string.
        """
        return self.fernet.encrypt(token.encode()).decode()
    
    def decrypt(self, encrypted_token: str) -> str:
        """
        Decrypt an encrypted token.
        
        Args:
            encrypted_token: Encrypted token to decrypt.
            
        Returns:
            Decrypted plain text token.
        """
        return self.fernet.decrypt(encrypted_token.encode()).decode()


# Global instance for use throughout the application
token_encryptor = TokenEncryptor()
