"""
Tests for privacy-preserving techniques
"""
import pytest
import numpy as np
import pandas as pd
from src.privacy import (
    DifferentialPrivacyManager,
    PIIDetector,
    DataAnonymizer,
    KAnonymity
)


class TestDifferentialPrivacy:
    """Tests for differential privacy"""
    
    def test_privacy_manager_initialization(self):
        """Test privacy manager initialization"""
        manager = DifferentialPrivacyManager(total_epsilon=1.0, delta=1e-5)
        
        assert manager.total_epsilon == 1.0
        assert manager.delta == 1e-5
        assert manager.consumed_epsilon == 0.0
    
    def test_laplace_noise(self):
        """Test Laplace noise addition"""
        manager = DifferentialPrivacyManager(total_epsilon=1.0)
        data = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
        
        noisy_data = manager.add_laplace_noise(data, epsilon=0.1, sensitivity=1.0)
        
        assert len(noisy_data) == len(data)
        assert not np.array_equal(data, noisy_data)  # Should be different
        assert manager.consumed_epsilon > 0
    
    def test_privacy_budget_tracking(self):
        """Test privacy budget consumption"""
        manager = DifferentialPrivacyManager(total_epsilon=1.0)
        
        data = np.array([1.0, 2.0, 3.0])
        manager.add_laplace_noise(data, epsilon=0.5)
        
        assert manager.consumed_epsilon == 0.5
        assert manager.remaining_budget == 0.5
    
    def test_budget_exceeded(self):
        """Test budget exceeded error"""
        manager = DifferentialPrivacyManager(total_epsilon=0.5)
        data = np.array([1.0, 2.0, 3.0])
        
        with pytest.raises(ValueError):
            manager.add_laplace_noise(data, epsilon=1.0)  # Exceeds budget


class TestPIIDetection:
    """Tests for PII detection"""
    
    def test_pii_detector(self):
        """Test PII detection in DataFrame"""
        detector = PIIDetector()
        
        df = pd.DataFrame({
            'customer_name': ['John Doe', 'Jane Smith'],
            'email': ['john@example.com', 'jane@example.com'],
            'phone': ['555-1234', '555-5678'],
            'amount': [100.0, 200.0]
        })
        
        pii_columns = detector.detect_pii_columns(df)
        
        assert 'email' in pii_columns
        assert len(pii_columns['email']) > 0


class TestDataAnonymization:
    """Tests for data anonymization"""
    
    def test_tokenization(self):
        """Test tokenization"""
        anonymizer = DataAnonymizer()
        
        data = pd.Series(['user1', 'user2', 'user1', 'user3'])
        tokenized = anonymizer.tokenize(data, prefix="USER")
        
        assert len(tokenized) == len(data)
        assert tokenized[0] == tokenized[2]  # Same value = same token
        assert tokenized[0] != tokenized[1]  # Different values = different tokens
    
    def test_hashing(self):
        """Test hashing"""
        anonymizer = DataAnonymizer()
        
        data = pd.Series(['sensitive1', 'sensitive2'])
        hashed = anonymizer.hash_column(data)
        
        assert len(hashed) == len(data)
        assert all(len(h) == 64 for h in hashed)  # SHA-256 produces 64 char hex
    
    def test_masking(self):
        """Test data masking"""
        anonymizer = DataAnonymizer()
        
        data = pd.Series(['1234567890'])
        masked = anonymizer.mask_data(data, visible_start=2, visible_end=2)
        
        assert masked[0] == '12******90'


class TestKAnonymity:
    """Tests for k-anonymity"""
    
    def test_k_anonymity_check(self):
        """Test k-anonymity checking"""
        df = pd.DataFrame({
            'age': [25, 25, 25, 30, 30, 35],
            'zipcode': ['12345', '12345', '12345', '67890', '67890', '11111'],
            'salary': [50000, 55000, 52000, 60000, 62000, 70000]
        })
        
        result = KAnonymity.check_k_anonymity(
            df,
            quasi_identifiers=['age', 'zipcode'],
            k=2
        )
        
        assert 'k_anonymous' in result
        assert result['k'] == 2
