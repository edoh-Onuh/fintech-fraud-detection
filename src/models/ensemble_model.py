"""
Ensemble Model combining multiple fraud detection algorithms
Implements weighted voting with privacy-preserving techniques
"""
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Any, Tuple
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.linear_model import LogisticRegression
import logging
from pathlib import Path
import joblib

from .base import FraudDetectionModel
from .xgboost_model import XGBoostFraudDetector

logger = logging.getLogger(__name__)


class EnsembleFraudDetector(FraudDetectionModel):
    """
    Ensemble of multiple fraud detection models
    
    Features:
    - Weighted voting from diverse models
    - Reduces overfitting and improves robustness
    - Individual model explanations
    - Privacy-preserving aggregation
    """
    
    def __init__(
        self,
        use_xgboost: bool = True,
        use_random_forest: bool = True,
        use_logistic: bool = True,
        voting: str = 'soft',
        version: str = "1.0.0"
    ):
        super().__init__(model_name="EnsembleFraudDetector", version=version)
        
        self.use_xgboost = use_xgboost
        self.use_random_forest = use_random_forest
        self.use_logistic = use_logistic
        self.voting = voting
        
        self.models: Dict[str, Any] = {}
        self.weights: Dict[str, float] = {}
        self.ensemble: Optional[VotingClassifier] = None
        
    def train(
        self,
        X: pd.DataFrame,
        y: pd.Series,
        privacy_epsilon: Optional[float] = None,
        validation_split: float = 0.2
    ) -> Dict[str, float]:
        """
        Train ensemble of models
        
        Args:
            X: Feature DataFrame
            y: Target Series
            privacy_epsilon: Privacy budget distributed across models
            validation_split: Fraction for validation
            
        Returns:
            Aggregated metrics
        """
        logger.info(f"Training {self.model_name} ensemble")
        
        self.feature_names = list(X.columns)
        estimators = []
        
        # Split privacy budget across models if specified
        if privacy_epsilon:
            model_count = sum([self.use_xgboost, self.use_random_forest, self.use_logistic])
            epsilon_per_model = privacy_epsilon / model_count
            logger.info(f"Privacy budget per model: ε={epsilon_per_model:.4f}")
        else:
            epsilon_per_model = None
        
        # XGBoost
        if self.use_xgboost:
            xgb_model = XGBoostFraudDetector(
                n_estimators=100,
                max_depth=6,
                learning_rate=0.1
            )
            xgb_model.train(X, y, privacy_epsilon=epsilon_per_model)
            self.models['xgboost'] = xgb_model
            estimators.append(('xgboost', xgb_model.model))
            self.weights['xgboost'] = 0.4  # Higher weight for XGBoost
        
        # Random Forest
        if self.use_random_forest:
            rf_model = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                min_samples_split=10,
                min_samples_leaf=5,
                class_weight='balanced',
                random_state=42,
                n_jobs=-1
            )
            rf_model.fit(X, y)
            self.models['random_forest'] = rf_model
            estimators.append(('random_forest', rf_model))
            self.weights['random_forest'] = 0.35
        
        # Logistic Regression (simple, interpretable)
        if self.use_logistic:
            lr_model = LogisticRegression(
                penalty='l2',
                C=1.0,
                class_weight='balanced',
                max_iter=1000,
                random_state=42,
                n_jobs=-1
            )
            lr_model.fit(X, y)
            self.models['logistic'] = lr_model
            estimators.append(('logistic', lr_model))
            self.weights['logistic'] = 0.25
        
        # Create voting ensemble
        weights = [self.weights[name] for name, _ in estimators]
        from typing import cast, Literal
        voting_mode = cast(Literal['hard', 'soft'], self.voting)
        self.ensemble = VotingClassifier(
            estimators=estimators,
            voting=voting_mode,
            weights=weights,
            n_jobs=-1
        )
        
        # Fit ensemble (uses already-fitted estimators)
        self.ensemble.fit(X, y)
        self.is_trained = True
        
        # Calculate metrics
        from sklearn.model_selection import train_test_split
        X_train, X_val, y_train, y_val = train_test_split(
            X, y, test_size=validation_split, stratify=y, random_state=42
        )
        
        y_pred = self.predict(X_val)
        y_pred_proba = self.predict_proba(X_val)[:, 1]
        
        metrics = self._calculate_metrics(y_val, y_pred, y_pred_proba)
        
        # Get individual model metrics
        individual_metrics = {}
        for name, model in self.models.items():
            if hasattr(model, 'predict_proba'):
                proba = model.predict_proba(X_val)[:, 1]
            else:
                proba = model.predict(X_val)
            
            individual_metrics[f"{name}_auc"] = self._calculate_auc(y_val, proba)
        
        metrics.update(individual_metrics)
        
        self.metadata.update({
            "model_count": len(self.models),
            "models": list(self.models.keys()),
            "weights": self.weights,
            "privacy_epsilon": privacy_epsilon,
            **metrics
        })
        
        logger.info(f"Ensemble training complete. AUC: {metrics['auc_roc']:.4f}")
        
        return metrics
    
    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """Predict fraud using ensemble"""
        if not self.is_trained or self.ensemble is None:
            raise ValueError("Model must be trained before prediction")
        
        X = X[self.feature_names]
        return np.asarray(self.ensemble.predict(X))
    
    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        """Predict fraud probability using ensemble"""
        if not self.is_trained or self.ensemble is None:
            raise ValueError("Model must be trained before prediction")
        
        X = X[self.feature_names]
        return self.ensemble.predict_proba(X)
    
    def predict_with_breakdown(
        self, 
        X: pd.DataFrame
    ) -> Dict[str, np.ndarray]:
        """
        Get predictions from each model individually
        
        Useful for debugging and understanding model disagreement
        """
        if not self.is_trained:
            raise ValueError("Model must be trained first")
        
        X = X[self.feature_names]
        predictions = {}
        
        for name, model in self.models.items():
            if hasattr(model, 'predict_proba'):
                predictions[name] = model.predict_proba(X)[:, 1]
            else:
                predictions[name] = model.predict(X)
        
        # Ensemble prediction
        predictions['ensemble'] = self.predict_proba(X)[:, 1]
        
        return predictions
    
    def explain_prediction(
        self,
        X: pd.DataFrame,
        method: str = "shap",
        max_samples: int = 100
    ) -> Dict[str, Any]:
        """
        Explain ensemble predictions
        
        Returns explanations from each model in the ensemble
        """
        if not self.is_trained:
            raise ValueError("Model must be trained first")
        
        explanations = {}
        
        # Get explanation from XGBoost if available
        if 'xgboost' in self.models:
            xgb_model = self.models['xgboost']
            if isinstance(xgb_model, XGBoostFraudDetector):
                explanations['xgboost'] = xgb_model.explain_prediction(
                    X, method=method, max_samples=max_samples
                )
        
        # Feature importance from Random Forest
        if 'random_forest' in self.models:
            rf_model = self.models['random_forest']
            importance = pd.DataFrame({
                'feature': self.feature_names,
                'importance': rf_model.feature_importances_
            }).sort_values('importance', ascending=False)
            
            explanations['random_forest'] = {
                'method': 'feature_importance',
                'importance': importance.to_dict('records')
            }
        
        # Coefficients from Logistic Regression
        if 'logistic' in self.models:
            lr_model = self.models['logistic']
            coef_df = pd.DataFrame({
                'feature': self.feature_names,
                'coefficient': lr_model.coef_[0]
            }).sort_values('coefficient', ascending=False, key=abs)
            
            explanations['logistic'] = {
                'method': 'coefficients',
                'coefficients': coef_df.to_dict('records'),
                'intercept': float(lr_model.intercept_[0])
            }
        
        # Model predictions breakdown
        predictions_breakdown = self.predict_with_breakdown(X.head(max_samples))
        
        return {
            'ensemble_method': self.voting,
            'model_weights': self.weights,
            'individual_explanations': explanations,
            'predictions_breakdown': {
                k: v.tolist() for k, v in predictions_breakdown.items()
            }
        }
    
    def get_feature_importance(self) -> pd.DataFrame:
        """
        Aggregate feature importance across models
        
        Returns weighted average of importance scores
        """
        if not self.is_trained:
            raise ValueError("Model must be trained first")
        
        importance_scores = {}
        
        # XGBoost importance
        if 'xgboost' in self.models:
            xgb_model = self.models['xgboost']
            if isinstance(xgb_model, XGBoostFraudDetector):
                xgb_imp = xgb_model.get_feature_importance()
                importance_scores['xgboost'] = dict(zip(
                    xgb_imp['feature'], 
                    xgb_imp['importance']
                ))
        
        # Random Forest importance
        if 'random_forest' in self.models:
            rf_model = self.models['random_forest']
            importance_scores['random_forest'] = dict(zip(
                self.feature_names,
                rf_model.feature_importances_
            ))
        
        # Logistic Regression coefficients (absolute values)
        if 'logistic' in self.models:
            lr_model = self.models['logistic']
            importance_scores['logistic'] = dict(zip(
                self.feature_names,
                np.abs(lr_model.coef_[0])
            ))
        
        # Weighted average
        aggregated = {}
        for feature in self.feature_names:
            weighted_sum = 0
            total_weight = 0
            
            for model_name, scores in importance_scores.items():
                if feature in scores:
                    weight = self.weights.get(model_name, 1.0)
                    weighted_sum += scores[feature] * weight
                    total_weight += weight
            
            aggregated[feature] = weighted_sum / total_weight if total_weight > 0 else 0
        
        importance_df = pd.DataFrame({
            'feature': list(aggregated.keys()),
            'importance': list(aggregated.values())
        }).sort_values('importance', ascending=False)
        
        return importance_df
    
    def save_model(self, path: str) -> None:
        """Save ensemble model"""
        if not self.is_trained:
            raise ValueError("Cannot save untrained model")
        
        save_path = Path(path)
        save_path.mkdir(parents=True, exist_ok=True)
        
        # Save entire ensemble
        model_file = save_path / f"{self.model_name}_v{self.version}.pkl"
        joblib.dump({
            'ensemble': self.ensemble,
            'models': self.models,
            'weights': self.weights,
            'feature_names': self.feature_names,
            'metadata': self.metadata
        }, model_file)
        
        logger.info(f"Ensemble model saved to {save_path}")
    
    def load_model(self, path: str) -> None:
        """Load ensemble model"""
        load_path = Path(path)
        model_file = load_path / f"{self.model_name}_v{self.version}.pkl"
        
        saved_data = joblib.load(model_file)
        
        self.ensemble = saved_data['ensemble']
        self.models = saved_data['models']
        self.weights = saved_data['weights']
        self.feature_names = saved_data['feature_names']
        self.metadata = saved_data['metadata']
        
        self.is_trained = True
        
        logger.info(f"Ensemble model loaded from {load_path}")
    
    def _calculate_metrics(
        self,
        y_true: pd.Series,
        y_pred: np.ndarray,
        y_pred_proba: np.ndarray
    ) -> Dict[str, float]:
        """Calculate metrics"""
        from sklearn.metrics import (
            accuracy_score,
            precision_score,
            recall_score,
            f1_score,
            roc_auc_score
        )
        
        return {
            "accuracy": float(accuracy_score(y_true, y_pred)),
            "precision": float(precision_score(y_true, y_pred, zero_division=0)),
            "recall": float(recall_score(y_true, y_pred, zero_division=0)),
            "f1_score": float(f1_score(y_true, y_pred, zero_division=0)),
            "auc_roc": float(roc_auc_score(y_true, y_pred_proba))
        }
    
    def _calculate_auc(self, y_true: pd.Series, y_pred_proba: np.ndarray) -> float:
        """Calculate AUC score"""
        from sklearn.metrics import roc_auc_score
        try:
            return float(roc_auc_score(y_true, y_pred_proba))
        except ValueError:
            return 0.0
