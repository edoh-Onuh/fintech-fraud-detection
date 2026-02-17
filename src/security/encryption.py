"""
Encryption and Cryptography Module
Provides end-to-end encryption for sensitive data
"""
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import base64
import os
import json
import hashlib
from typing import Dict, Any, Optional, List
import logging
import os
from typing import Dict, Optional, Tuple, Any
import logging

logger = logging.getLogger(__name__)


class EncryptionManager:
    """
    Manages encryption and decryption operations
    
    Provides multiple encryption methods:
    - Symmetric encryption (AES-256)
    - Asymmetric encryption (RSA-2048)
    - Field-level encryption for databases
    """
    
    def __init__(self, secret_key: Optional[bytes] = None):
        """
        Initialize encryption manager
        
        Args:
            secret_key: Base64-encoded Fernet key (generated if None)
        """
        if secret_key:
            self.fernet_key = secret_key
        else:
            self.fernet_key = Fernet.generate_key()
        
        self.fernet = Fernet(self.fernet_key)
        
        # Generate RSA keypair
        self.private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        self.public_key = self.private_key.public_key()
        
        logger.info("Encryption manager initialized with AES-256 and RSA-2048")
    
    def encrypt_symmetric(self, plaintext: str) -> str:
        """
        Encrypt data using symmetric encryption (Fernet/AES-256)
        
        Args:
            plaintext: Data to encrypt
            
        Returns:
            Base64-encoded encrypted data
        """
        encrypted = self.fernet.encrypt(plaintext.encode())
        return base64.b64encode(encrypted).decode()
    
    def decrypt_symmetric(self, ciphertext: str) -> str:
        """
        Decrypt symmetric encrypted data
        
        Args:
            ciphertext: Base64-encoded encrypted data
            
        Returns:
            Decrypted plaintext
        """
        encrypted = base64.b64decode(ciphertext.encode())
        decrypted = self.fernet.decrypt(encrypted)
        return decrypted.decode()
    
    def encrypt_asymmetric(self, plaintext: str) -> str:
        """
        Encrypt data using RSA public key
        
        Suitable for small data (< 245 bytes for 2048-bit key)
        """
        encrypted = self.public_key.encrypt(
            plaintext.encode(),
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        return base64.b64encode(encrypted).decode()
    
    def decrypt_asymmetric(self, ciphertext: str) -> str:
        """Decrypt RSA encrypted data"""
        encrypted = base64.b64decode(ciphertext.encode())
        decrypted = self.private_key.decrypt(
            encrypted,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        return decrypted.decode()
    
    def encrypt_field(self, value: Any) -> Optional[str]:
        """
        Encrypt a database field value
        
        Converts to string, encrypts, and returns base64-encoded string
        """
        if value is None:
            return None
        
        return self.encrypt_symmetric(str(value))
    
    def decrypt_field(self, encrypted_value: Optional[str]) -> Optional[str]:
        """Decrypt a database field value"""
        if encrypted_value is None:
            return None
        
        return self.decrypt_symmetric(encrypted_value)
    
    def hash_data(self, data: str) -> str:
        """
        One-way hash using SHA-256
        
        Useful for storing passwords or creating data fingerprints
        """
        digest = hashes.Hash(hashes.SHA256(), backend=default_backend())
        digest.update(data.encode())
        return base64.b64encode(digest.finalize()).decode()
    
    def get_public_key_pem(self) -> str:
        """Export public key in PEM format"""
        pem = self.public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
        return pem.decode()
    
    def get_private_key_pem(self, password: Optional[bytes] = None) -> str:
        """
        Export private key in PEM format
        
        Args:
            password: Optional password to encrypt the private key
        """
        if password:
            encryption_algorithm = serialization.BestAvailableEncryption(password)
        else:
            encryption_algorithm = serialization.NoEncryption()
        
        pem = self.private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=encryption_algorithm
        )
        return pem.decode()
    
    def get_fernet_key(self) -> str:
        """Get the Fernet key (for backup/recovery)"""
        return base64.b64encode(self.fernet_key).decode()


class SecureDataVault:
    """
    Secure storage for sensitive data
    
    Provides encrypted storage with access logging
    """
    
    def __init__(self, encryption_manager: EncryptionManager):
        self.encryption_manager = encryption_manager
        self.vault: Dict[str, str] = {}
        self.access_log: list = []
        
    def store(self, key: str, value: str, user_id: Optional[str] = None) -> None:
        """
        Store data securely
        
        Args:
            key: Unique identifier
            value: Data to store
            user_id: User storing the data (for audit)
        """
        encrypted_value = self.encryption_manager.encrypt_symmetric(value)
        self.vault[key] = encrypted_value
        
        self._log_access('store', key, user_id)
        logger.info(f"Stored encrypted data with key: {key}")
    
    def retrieve(self, key: str, user_id: Optional[str] = None) -> Optional[str]:
        """
        Retrieve and decrypt data
        
        Args:
            key: Data identifier
            user_id: User retrieving the data (for audit)
            
        Returns:
            Decrypted data or None if not found
        """
        encrypted_value = self.vault.get(key)
        
        if encrypted_value is None:
            logger.warning(f"Key not found: {key}")
            return None
        
        decrypted_value = self.encryption_manager.decrypt_symmetric(encrypted_value)
        self._log_access('retrieve', key, user_id)
        
        return decrypted_value
    
    def delete(self, key: str, user_id: Optional[str] = None) -> bool:
        """
        Delete data from vault
        
        Args:
            key: Data identifier
            user_id: User deleting the data
            
        Returns:
            True if deleted, False if not found
        """
        if key in self.vault:
            del self.vault[key]
            self._log_access('delete', key, user_id)
            logger.info(f"Deleted key: {key}")
            return True
        
        return False
    
    def _log_access(self, action: str, key: str, user_id: Optional[str]) -> None:
        """Log access for audit trail"""
        from datetime import datetime
        
        self.access_log.append({
            'timestamp': datetime.now().isoformat(),
            'action': action,
            'key': key,
            'user_id': user_id or 'system'
        })
    
    def get_access_log(self, key: Optional[str] = None) -> list:
        """
        Get access log
        
        Args:
            key: Filter by specific key (None = all accesses)
            
        Returns:
            List of access log entries
        """
        if key:
            return [log for log in self.access_log if log['key'] == key]
        return self.access_log.copy()


class TokenManager:
    """
    Manages secure tokens for authentication and data access
    
    Provides JWT-like token generation with expiration
    """
    
    def __init__(self, secret_key: str):
        self.secret_key = secret_key
        self.tokens: Dict[str, Dict[str, Any]] = {}
        
    def generate_token(
        self,
        user_id: str,
        scopes: Optional[List[str]] = None,
        expires_in_seconds: int = 3600
    ) -> str:
        """
        Generate a secure access token
        
        Args:
            user_id: User identifier
            scopes: Permissions/scopes for the token
            expires_in_seconds: Token lifetime
            
        Returns:
            Secure token string
        """
        from datetime import datetime, timedelta
        import secrets
        
        token = secrets.token_urlsafe(32)
        
        self.tokens[token] = {
            'user_id': user_id,
            'scopes': scopes or [],
            'created_at': datetime.now(),
            'expires_at': datetime.now() + timedelta(seconds=expires_in_seconds)
        }
        
        logger.info(f"Generated token for user {user_id}")
        return token
    
    def validate_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Validate a token
        
        Returns token data if valid, None if invalid/expired
        """
        from datetime import datetime
        
        token_data = self.tokens.get(token)
        
        if not token_data:
            return None
        
        if datetime.now() > token_data['expires_at']:
            del self.tokens[token]
            logger.warning(f"Expired token attempted: {token[:8]}...")
            return None
        
        return token_data
    
    def revoke_token(self, token: str) -> bool:
        """
        Revoke a token
        
        Returns True if revoked, False if not found
        """
        if token in self.tokens:
            del self.tokens[token]
            logger.info(f"Revoked token: {token[:8]}...")
            return True
        
        return False
    
    def cleanup_expired_tokens(self) -> int:
        """
        Remove expired tokens
        
        Returns number of tokens removed
        """
        from datetime import datetime
        
        expired = [
            token for token, data in self.tokens.items()
            if datetime.now() > data['expires_at']
        ]
        
        for token in expired:
            del self.tokens[token]
        
        if expired:
            logger.info(f"Cleaned up {len(expired)} expired tokens")
        
        return len(expired)


class SecureConfigManager:
    """
    Manages sensitive configuration securely
    
    Encrypts configuration values at rest
    """
    
    def __init__(self, encryption_manager: EncryptionManager):
        self.encryption_manager = encryption_manager
        self.config: Dict[str, str] = {}
        self.sensitive_keys = set()
        
    def set(self, key: str, value: str, sensitive: bool = False) -> None:
        """
        Set configuration value
        
        Args:
            key: Configuration key
            value: Configuration value
            sensitive: Whether to encrypt the value
        """
        if sensitive:
            self.config[key] = self.encryption_manager.encrypt_symmetric(value)
            self.sensitive_keys.add(key)
        else:
            self.config[key] = value
        
    def get(self, key: str, default: Optional[str] = None) -> Optional[str]:
        """
        Get configuration value
        
        Automatically decrypts if sensitive
        """
        value = self.config.get(key, default)
        
        if value and key in self.sensitive_keys:
            return self.encryption_manager.decrypt_symmetric(value)
        
        return value
    
    def delete(self, key: str) -> bool:
        """Delete configuration key"""
        if key in self.config:
            del self.config[key]
            self.sensitive_keys.discard(key)
            return True
        return False
    
    def export_config(self, include_sensitive: bool = False) -> Dict[str, str]:
        """
        Export configuration
        
        Args:
            include_sensitive: Whether to include (encrypted) sensitive values
            
        Returns:
            Configuration dictionary
        """
        if include_sensitive:
            return self.config.copy()
        
        return {
            k: v for k, v in self.config.items()
            if k not in self.sensitive_keys
        }
