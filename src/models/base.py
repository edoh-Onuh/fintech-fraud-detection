"""
Base ML Model for Fraud Detection
Implements ensemble approach with privacy-preserving techniques
"""
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator
import logging

logger = logging.getLogger(__name__)


class FraudDetectionModel(ABC):
    """Abstract base class for fraud detection models"""
    
    def __init__(self, model_name: str, version: str = "1.0.0"):
        self.model_name = model_name
        self.version = version
        self.is_trained = False
        self.feature_names: List[str] = []
        self.metadata: Dict[str, Any] = {}
        
    @abstractmethod
    def train(
        self, 
        X: pd.DataFrame, 
        y: pd.Series, 
        privacy_epsilon: Optional[float] = None
    ) -> Dict[str, float]:
        """Train the model with optional differential privacy"""
        pass
    
    @abstractmethod
    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """Predict fraud probability"""
        pass
    
    @abstractmethod
    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        """Predict fraud probability with confidence scores"""
        pass
    
    @abstractmethod
    def explain_prediction(
        self, 
        X: pd.DataFrame, 
        method: str = "shap"
    ) -> Dict[str, Any]:
        """Explain individual predictions for regulatory compliance"""
        pass
    
    def get_feature_importance(self) -> pd.DataFrame:
        """Get feature importance scores"""
        raise NotImplementedError("Feature importance not available for this model")
    
    def save_model(self, path: str) -> None:
        """Save model to disk"""
        raise NotImplementedError("Model saving not implemented")
    
    def load_model(self, path: str) -> None:
        """Load model from disk"""
        raise NotImplementedError("Model loading not implemented")
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get model metadata"""
        return {
            "model_name": self.model_name,
            "version": self.version,
            "is_trained": self.is_trained,
            "feature_count": len(self.feature_names),
            "metadata": self.metadata
        }


class ModelRegistry:
    """Registry for managing multiple fraud detection models"""
    
    def __init__(self):
        self.models: Dict[str, FraudDetectionModel] = {}
        self.active_model: Optional[str] = None
        
    def register_model(
        self, 
        model: FraudDetectionModel, 
        set_active: bool = False
    ) -> None:
        """Register a new model"""
        model_key = f"{model.model_name}_{model.version}"
        self.models[model_key] = model
        
        if set_active or not self.active_model:
            self.active_model = model_key
            
        logger.info(f"Registered model: {model_key}")
    
    def get_model(self, model_key: Optional[str] = None) -> Optional[FraudDetectionModel]:
        """Get a model by key or return active model"""
        if model_key:
            return self.models.get(model_key)
        elif self.active_model:
            return self.models.get(self.active_model)
        return None
    
    def set_active_model(self, model_key: str) -> None:
        """Set the active model for predictions"""
        if model_key not in self.models:
            raise ValueError(f"Model {model_key} not found in registry")
        self.active_model = model_key
        logger.info(f"Set active model: {model_key}")
    
    def list_models(self) -> List[Dict[str, Any]]:
        """List all registered models"""
        return [
            {
                "key": key,
                "is_active": key == self.active_model,
                **model.get_model_info()
            }
            for key, model in self.models.items()
        ]
    
    def remove_model(self, model_key: str) -> None:
        """Remove a model from registry"""
        if model_key in self.models:
            del self.models[model_key]
            if self.active_model == model_key:
                self.active_model = None
            logger.info(f"Removed model: {model_key}")


class ModelPerformanceTracker:
    """Track model performance metrics over time"""
    
    def __init__(self):
        self.metrics_history: List[Dict[str, Any]] = []
        
    def log_prediction(
        self,
        prediction: float,
        actual: Optional[bool],
        features: Dict[str, Any],
        model_name: str,
        timestamp: Optional[pd.Timestamp] = None
    ) -> None:
        """Log a prediction for performance tracking"""
        if timestamp is None:
            timestamp = pd.Timestamp.now()
            
        self.metrics_history.append({
            "timestamp": timestamp,
            "model_name": model_name,
            "prediction": prediction,
            "actual": actual,
            "features": features
        })
    
    def calculate_metrics(
        self, 
        window_hours: int = 24
    ) -> Dict[str, float]:
        """Calculate performance metrics for recent predictions"""
        if not self.metrics_history:
            return {}
        
        df = pd.DataFrame(self.metrics_history)
        cutoff = pd.Timestamp.now() - pd.Timedelta(hours=window_hours)
        recent = df[df["timestamp"] > cutoff]
        
        if recent.empty or recent["actual"].isna().all():
            return {"sample_count": len(recent)}
        
        # Filter out records without actual labels
        labeled = recent[recent["actual"].notna()]
        
        if labeled.empty:
            return {"sample_count": len(recent)}
        
        from sklearn.metrics import (
            accuracy_score, 
            precision_score, 
            recall_score, 
            f1_score,
            roc_auc_score
        )
        
        predictions = (labeled["prediction"] > 0.5).astype(int)
        actuals = labeled["actual"].astype(int)
        
        metrics = {
            "sample_count": len(recent),
            "labeled_count": len(labeled),
            "accuracy": accuracy_score(actuals, predictions),
            "precision": precision_score(actuals, predictions, zero_division=0),
            "recall": recall_score(actuals, predictions, zero_division=0),
            "f1_score": f1_score(actuals, predictions, zero_division=0),
        }
        
        try:
            metrics["auc_roc"] = roc_auc_score(actuals, labeled["prediction"])
        except ValueError:
            pass
        
        return metrics
    
    def detect_drift(self, window_hours: int = 24) -> Dict[str, Any]:
        """Detect concept drift in recent predictions"""
        if len(self.metrics_history) < 100:
            return {"drift_detected": False, "reason": "Insufficient data"}
        
        df = pd.DataFrame(self.metrics_history)
        cutoff = pd.Timestamp.now() - pd.Timedelta(hours=window_hours)
        recent = df[df["timestamp"] > cutoff]
        historical = df[df["timestamp"] <= cutoff].tail(len(recent))
        
        if recent.empty or historical.empty:
            return {"drift_detected": False, "reason": "Insufficient data"}
        
        # Compare prediction distributions
        from scipy import stats
        from typing import cast, Any
        # ks_2samp returns a result object, handle as Any to avoid type issues
        ks_result: Any = stats.ks_2samp(
            recent["prediction"].values,
            historical["prediction"].values
        )
        ks_stat, p_value = ks_result
        
        drift_detected = p_value < 0.05
        
        return {
            "drift_detected": drift_detected,
            "ks_statistic": float(ks_stat),
            "p_value": float(p_value),
            "recent_mean_score": recent["prediction"].mean(),
            "historical_mean_score": historical["prediction"].mean(),
            "recommendation": "Retrain model" if drift_detected else "No action needed"
        }
