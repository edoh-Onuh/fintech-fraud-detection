"""
Tests for security components
"""
import pytest
from src.security import (
    EncryptionManager,
    AuthenticationManager,
    AuthorizationManager
)


class TestEncryption:
    """Tests for encryption"""
    
    def test_symmetric_encryption(self):
        """Test symmetric encryption/decryption"""
        manager = EncryptionManager()
        
        plaintext = "sensitive data"
        encrypted = manager.encrypt_symmetric(plaintext)
        decrypted = manager.decrypt_symmetric(encrypted)
        
        assert encrypted != plaintext
        assert decrypted == plaintext
    
    def test_asymmetric_encryption(self):
        """Test asymmetric encryption/decryption"""
        manager = EncryptionManager()
        
        plaintext = "secret message"
        encrypted = manager.encrypt_asymmetric(plaintext)
        decrypted = manager.decrypt_asymmetric(encrypted)
        
        assert encrypted != plaintext
        assert decrypted == plaintext
    
    def test_hashing(self):
        """Test data hashing"""
        manager = EncryptionManager()
        
        data = "password123"
        hash1 = manager.hash_data(data)
        hash2 = manager.hash_data(data)
        
        assert hash1 == hash2  # Same input = same hash
        assert len(hash1) > 0


class TestAuthentication:
    """Tests for authentication"""
    
    def test_user_registration(self):
        """Test user registration"""
        auth = AuthenticationManager()
        
        user = auth.register_user(
            user_id="test1",
            username="testuser",
            email="test@example.com",
            password="password123",
            roles=["analyst"]
        )
        
        assert user.username == "testuser"
        assert user.user_id == "test1"
        assert "analyst" in user.roles
    
    def test_authentication_success(self):
        """Test successful authentication"""
        auth = AuthenticationManager()
        
        auth.register_user(
            user_id="test2",
            username="testuser2",
            email="test2@example.com",
            password="password123"
        )
        
        user = auth.authenticate("testuser2", "password123")
        
        assert user is not None
        assert user.username == "testuser2"
    
    def test_authentication_failure(self):
        """Test failed authentication"""
        auth = AuthenticationManager()
        
        auth.register_user(
            user_id="test3",
            username="testuser3",
            email="test3@example.com",
            password="password123"
        )
        
        user = auth.authenticate("testuser3", "wrongpassword")
        
        assert user is None
    
    def test_session_creation(self):
        """Test session creation"""
        auth = AuthenticationManager()
        
        user = auth.register_user(
            user_id="test4",
            username="testuser4",
            email="test4@example.com",
            password="password123"
        )
        
        session_id = auth.create_session(user)
        
        assert session_id is not None
        assert len(session_id) > 0


class TestAuthorization:
    """Tests for authorization"""
    
    def test_permission_check(self):
        """Test permission checking"""
        authz = AuthorizationManager()
        auth = AuthenticationManager()
        
        user = auth.register_user(
            user_id="test5",
            username="admin_user",
            email="admin@example.com",
            password="password123",
            roles=["admin"]
        )
        
        has_permission = authz.check_permission(
            user,
            resource="fraud_detection",
            action="execute"
        )
        
        assert has_permission  # Admin should have all permissions
    
    def test_role_permissions(self):
        """Test role-based permissions"""
        authz = AuthorizationManager()
        
        analyst_role = authz.roles.get("analyst")
        
        assert analyst_role is not None
        assert analyst_role.has_permission("fraud_detection:read")
        assert analyst_role.has_permission("fraud_detection:execute")
