"""
Unit tests for fraud detection models
"""
import pytest
import numpy as np
import pandas as pd
from src.models import XGBoostFraudDetector, EnsembleFraudDetector, ModelRegistry
from src.utils.data_generator import FraudDataGenerator


@pytest.fixture
def sample_data():
    """Generate sample dataset for testing"""
    generator = FraudDataGenerator(seed=42)
    X, y = generator.generate_dataset(n_samples=1000, fraud_ratio=0.02)
    return X, y


class TestXGBoostModel:
    """Tests for XGBoost fraud detector"""
    
    def test_model_initialization(self):
        """Test model can be initialized"""
        model = XGBoostFraudDetector()
        assert model.model_name == "XGBoostFraudDetector"
        assert not model.is_trained
    
    def test_model_training(self, sample_data):
        """Test model training"""
        X, y = sample_data
        model = XGBoostFraudDetector(n_estimators=10)
        
        metrics = model.train(X, y)
        
        assert model.is_trained
        assert 'auc_roc' in metrics
        assert 'accuracy' in metrics
        assert metrics['auc_roc'] > 0.5  # Better than random
    
    def test_model_prediction(self, sample_data):
        """Test model predictions"""
        X, y = sample_data
        model = XGBoostFraudDetector(n_estimators=10)
        model.train(X, y)
        
        predictions = model.predict(X.head(10))
        
        assert len(predictions) == 10
        assert all(p in [0, 1] for p in predictions)
    
    def test_model_prediction_proba(self, sample_data):
        """Test probability predictions"""
        X, y = sample_data
        model = XGBoostFraudDetector(n_estimators=10)
        model.train(X, y)
        
        probas = model.predict_proba(X.head(10))
        
        assert probas.shape == (10, 2)
        assert all(0 <= p <= 1 for row in probas for p in row)
    
    def test_model_with_privacy(self, sample_data):
        """Test model training with differential privacy"""
        X, y = sample_data
        model = XGBoostFraudDetector(n_estimators=10)
        
        metrics = model.train(X, y, privacy_epsilon=1.0)
        
        assert model.is_trained
        assert metrics['auc_roc'] > 0  # Should still work


class TestEnsembleModel:
    """Tests for ensemble fraud detector"""
    
    def test_ensemble_initialization(self):
        """Test ensemble initialization"""
        model = EnsembleFraudDetector()
        assert model.model_name == "EnsembleFraudDetector"
    
    def test_ensemble_training(self, sample_data):
        """Test ensemble training"""
        X, y = sample_data
        model = EnsembleFraudDetector()
        
        metrics = model.train(X, y)
        
        assert model.is_trained
        assert len(model.models) > 0
        assert 'auc_roc' in metrics


class TestModelRegistry:
    """Tests for model registry"""
    
    def test_registry_initialization(self):
        """Test registry initialization"""
        registry = ModelRegistry()
        assert len(registry.models) == 0
    
    def test_register_model(self, sample_data):
        """Test model registration"""
        X, y = sample_data
        model = XGBoostFraudDetector(n_estimators=10)
        model.train(X, y)
        
        registry = ModelRegistry()
        registry.register_model(model, set_active=True)
        
        assert len(registry.models) == 1
        assert registry.active_model is not None
    
    def test_get_active_model(self, sample_data):
        """Test getting active model"""
        X, y = sample_data
        model = XGBoostFraudDetector(n_estimators=10)
        model.train(X, y)
        
        registry = ModelRegistry()
        registry.register_model(model, set_active=True)
        
        active = registry.get_model()
        assert active is not None
        assert active.is_trained
