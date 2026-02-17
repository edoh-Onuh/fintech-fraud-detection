"""
Real-time Fraud Detection Engine
Processes transactions in real-time with sub-100ms latency
"""
import asyncio
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, field
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from collections import deque
import logging

logger = logging.getLogger(__name__)


@dataclass
class Transaction:
    """Transaction data model"""
    transaction_id: str
    user_id: str
    merchant_id: str
    amount: float
    currency: str
    timestamp: datetime
    
    # Transaction details
    transaction_type: str  # 'purchase', 'withdrawal', 'transfer'
    channel: str  # 'online', 'mobile', 'atm', 'pos'
    
    # Location
    ip_address: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    
    # Device info
    device_id: Optional[str] = None
    device_type: Optional[str] = None
    
    # Additional context
    is_first_transaction: bool = False
    account_age_days: int = 0
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'transaction_id': self.transaction_id,
            'user_id': self.user_id,
            'merchant_id': self.merchant_id,
            'amount': self.amount,
            'currency': self.currency,
            'timestamp': self.timestamp.isoformat(),
            'transaction_type': self.transaction_type,
            'channel': self.channel,
            'ip_address': self.ip_address,
            'country': self.country,
            'city': self.city,
            'device_id': self.device_id,
            'device_type': self.device_type,
            'is_first_transaction': self.is_first_transaction,
            'account_age_days': self.account_age_days,
            **self.metadata
        }


@dataclass
class FraudResult:
    """Fraud detection result"""
    transaction_id: str
    fraud_score: float
    is_fraud: bool
    risk_level: str  # 'low', 'medium', 'high'
    decision: str  # 'approve', 'review', 'decline'
    
    # Explanation
    top_risk_factors: List[Dict[str, Any]] = field(default_factory=list)
    model_version: Optional[str] = None
    processing_time_ms: float = 0.0
    
    # Action taken
    action_taken: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.now)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'transaction_id': self.transaction_id,
            'fraud_score': self.fraud_score,
            'is_fraud': self.is_fraud,
            'risk_level': self.risk_level,
            'decision': self.decision,
            'top_risk_factors': self.top_risk_factors,
            'model_version': self.model_version,
            'processing_time_ms': self.processing_time_ms,
            'action_taken': self.action_taken,
            'timestamp': self.timestamp.isoformat()
        }


class FeatureExtractor:
    """
    Extract features from transactions in real-time
    
    Generates engineered features for fraud detection
    """
    
    def __init__(self):
        self.user_transaction_history: Dict[str, deque] = {}
        self.merchant_statistics: Dict[str, Dict[str, Any]] = {}
        
    def extract_features(self, transaction: Transaction) -> Dict[str, Any]:
        """
        Extract all features from a transaction
        
        Returns:
            Dictionary of features ready for model input
        """
        features = {}
        
        # Basic transaction features
        features.update(self._extract_transaction_features(transaction))
        
        # Temporal features
        features.update(self._extract_temporal_features(transaction))
        
        # User behavior features
        features.update(self._extract_user_features(transaction))
        
        # Merchant features
        features.update(self._extract_merchant_features(transaction))
        
        # Velocity features (transaction frequency)
        features.update(self._extract_velocity_features(transaction))
        
        # Anomaly features
        features.update(self._extract_anomaly_features(transaction))
        
        return features
    
    def _extract_transaction_features(self, txn: Transaction) -> Dict[str, Any]:
        """Basic transaction attributes"""
        return {
            'amount': txn.amount,
            'amount_log': np.log1p(txn.amount),
            'transaction_type_purchase': 1 if txn.transaction_type == 'purchase' else 0,
            'transaction_type_withdrawal': 1 if txn.transaction_type == 'withdrawal' else 0,
            'transaction_type_transfer': 1 if txn.transaction_type == 'transfer' else 0,
            'channel_online': 1 if txn.channel == 'online' else 0,
            'channel_mobile': 1 if txn.channel == 'mobile' else 0,
            'channel_atm': 1 if txn.channel == 'atm' else 0,
            'channel_pos': 1 if txn.channel == 'pos' else 0,
            'is_first_transaction': int(txn.is_first_transaction),
            'account_age_days': txn.account_age_days,
            'account_age_days_log': np.log1p(txn.account_age_days)
        }
    
    def _extract_temporal_features(self, txn: Transaction) -> Dict[str, Any]:
        """Time-based features"""
        hour = txn.timestamp.hour
        day_of_week = txn.timestamp.weekday()
        
        return {
            'hour': hour,
            'day_of_week': day_of_week,
            'is_weekend': int(day_of_week >= 5),
            'is_night': int(hour < 6 or hour > 22),  # 10 PM - 6 AM
            'is_business_hours': int(9 <= hour <= 17),
            'month': txn.timestamp.month,
            'day_of_month': txn.timestamp.day
        }
    
    def _extract_user_features(self, txn: Transaction) -> Dict[str, Any]:
        """User-specific features"""
        user_history = self.user_transaction_history.get(txn.user_id, deque(maxlen=100))
        
        if not user_history:
            return {
                'user_transaction_count': 0,
                'user_avg_amount': 0,
                'user_std_amount': 0,
                'user_max_amount': 0,
                'user_total_amount_24h': 0
            }
        
        amounts = [t['amount'] for t in user_history]
        timestamps = [t['timestamp'] for t in user_history]
        
        # Calculate statistics
        recent_24h = [
            t['amount'] for t in user_history 
            if (txn.timestamp - t['timestamp']).total_seconds() < 86400
        ]
        
        return {
            'user_transaction_count': len(user_history),
            'user_avg_amount': np.mean(amounts),
            'user_std_amount': np.std(amounts),
            'user_max_amount': np.max(amounts),
            'user_total_amount_24h': sum(recent_24h),
            'user_transaction_count_24h': len(recent_24h)
        }
    
    def _extract_merchant_features(self, txn: Transaction) -> Dict[str, Any]:
        """Merchant-specific features"""
        merchant_stats = self.merchant_statistics.get(txn.merchant_id, {})
        
        return {
            'merchant_avg_amount': merchant_stats.get('avg_amount', 0),
            'merchant_transaction_count': merchant_stats.get('count', 0),
            'merchant_fraud_rate': merchant_stats.get('fraud_rate', 0)
        }
    
    def _extract_velocity_features(self, txn: Transaction) -> Dict[str, Any]:
        """Transaction velocity (frequency) features"""
        user_history = self.user_transaction_history.get(txn.user_id, deque(maxlen=100))
        
        if len(user_history) < 2:
            return {
                'time_since_last_transaction_seconds': 999999,
                'transactions_last_hour': 0,
                'transactions_last_day': 0
            }
        
        last_timestamp = user_history[-1]['timestamp']
        time_since_last = (txn.timestamp - last_timestamp).total_seconds()
        
        one_hour_ago = txn.timestamp - timedelta(hours=1)
        one_day_ago = txn.timestamp - timedelta(days=1)
        
        txn_last_hour = sum(
            1 for t in user_history 
            if t['timestamp'] > one_hour_ago
        )
        txn_last_day = sum(
            1 for t in user_history 
            if t['timestamp'] > one_day_ago
        )
        
        return {
            'time_since_last_transaction_seconds': time_since_last,
            'time_since_last_transaction_minutes': time_since_last / 60,
            'transactions_last_hour': txn_last_hour,
            'transactions_last_day': txn_last_day
        }
    
    def _extract_anomaly_features(self, txn: Transaction) -> Dict[str, Any]:
        """Anomaly detection features"""
        user_history = self.user_transaction_history.get(txn.user_id, deque(maxlen=100))
        
        if not user_history:
            return {
                'amount_deviation_from_avg': 0,
                'is_amount_outlier': 0
            }
        
        amounts = [t['amount'] for t in user_history]
        avg_amount = np.mean(amounts)
        std_amount = np.std(amounts) if len(amounts) > 1 else 0
        
        deviation = (txn.amount - avg_amount) / (std_amount + 1e-10)
        is_outlier = int(abs(deviation) > 3)  # 3 sigma rule
        
        return {
            'amount_deviation_from_avg': deviation,
            'is_amount_outlier': is_outlier,
            'amount_vs_avg_ratio': txn.amount / (avg_amount + 1e-10)
        }
    
    def update_history(self, transaction: Transaction) -> None:
        """Update transaction history for feature extraction"""
        user_id = transaction.user_id
        
        if user_id not in self.user_transaction_history:
            self.user_transaction_history[user_id] = deque(maxlen=100)
        
        self.user_transaction_history[user_id].append({
            'amount': transaction.amount,
            'timestamp': transaction.timestamp,
            'merchant_id': transaction.merchant_id
        })


class RealTimeFraudDetector:
    """
    Real-time fraud detection engine
    
    Processes transactions with minimal latency
    """
    
    def __init__(
        self,
        model,
        feature_extractor: Optional[FeatureExtractor] = None,
        high_risk_threshold: float = 0.9,
        medium_risk_threshold: float = 0.5
    ):
        """
        Initialize real-time detector
        
        Args:
            model: Trained fraud detection model
            feature_extractor: Feature extraction engine
            high_risk_threshold: Threshold for high-risk classification
            medium_risk_threshold: Threshold for medium-risk classification
        """
        self.model = model
        self.feature_extractor = feature_extractor or FeatureExtractor()
        self.high_risk_threshold = high_risk_threshold
        self.medium_risk_threshold = medium_risk_threshold
        
        self.total_transactions = 0
        self.total_fraud_detected = 0
        self.processing_times: deque = deque(maxlen=1000)
        
        logger.info("Real-time fraud detector initialized")
    
    async def detect_fraud(self, transaction: Transaction) -> FraudResult:
        """
        Detect fraud in a single transaction
        
        Args:
            transaction: Transaction to analyze
            
        Returns:
            FraudResult with decision and explanation
        """
        start_time = datetime.now()
        
        try:
            # Extract features
            features = self.feature_extractor.extract_features(transaction)
            
            # Convert to DataFrame for model input
            features_df = pd.DataFrame([features])
            
            # Get prediction
            fraud_score = float(self.model.predict_proba(features_df)[0, 1])
            is_fraud = fraud_score >= self.medium_risk_threshold
            
            # Determine risk level and decision
            if fraud_score >= self.high_risk_threshold:
                risk_level = 'high'
                decision = 'decline'
            elif fraud_score >= self.medium_risk_threshold:
                risk_level = 'medium'
                decision = 'review'
            else:
                risk_level = 'low'
                decision = 'approve'
            
            # Get explanation (top risk factors)
            try:
                explanation = self.model.explain_prediction(features_df, max_samples=1)
                if 'explanations' in explanation and explanation['explanations']:
                    top_features = explanation['explanations'][0]['top_features']
                    risk_factors = [
                        {'feature': k, 'contribution': v}
                        for k, v in list(top_features.items())[:5]
                    ]
                else:
                    risk_factors = []
            except Exception as e:
                logger.warning(f"Could not generate explanation: {e}")
                risk_factors = []
            
            # Calculate processing time
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            self.processing_times.append(processing_time)
            
            # Update statistics
            self.total_transactions += 1
            if is_fraud:
                self.total_fraud_detected += 1
            
            # Update feature history
            self.feature_extractor.update_history(transaction)
            
            result = FraudResult(
                transaction_id=transaction.transaction_id,
                fraud_score=fraud_score,
                is_fraud=is_fraud,
                risk_level=risk_level,
                decision=decision,
                top_risk_factors=risk_factors,
                model_version=self.model.version,
                processing_time_ms=processing_time
            )
            
            logger.info(
                f"Transaction {transaction.transaction_id}: "
                f"Score={fraud_score:.3f}, Decision={decision}, "
                f"Time={processing_time:.1f}ms"
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Error detecting fraud: {e}", exc_info=True)
            # Return safe default (manual review)
            return FraudResult(
                transaction_id=transaction.transaction_id,
                fraud_score=0.5,
                is_fraud=True,
                risk_level='medium',
                decision='review',
                processing_time_ms=(datetime.now() - start_time).total_seconds() * 1000
            )
    
    async def detect_fraud_batch(
        self,
        transactions: List[Transaction]
    ) -> List[FraudResult]:
        """
        Detect fraud in multiple transactions (batch processing)
        
        More efficient than processing one-by-one
        """
        results = []
        
        for transaction in transactions:
            result = await self.detect_fraud(transaction)
            results.append(result)
        
        return results
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get real-time performance metrics"""
        if not self.processing_times:
            return {
                'total_transactions': self.total_transactions,
                'total_fraud_detected': self.total_fraud_detected,
                'fraud_rate': 0.0
            }
        
        processing_times = list(self.processing_times)
        
        return {
            'total_transactions': self.total_transactions,
            'total_fraud_detected': self.total_fraud_detected,
            'fraud_rate': self.total_fraud_detected / max(self.total_transactions, 1),
            'avg_processing_time_ms': np.mean(processing_times),
            'p50_processing_time_ms': np.percentile(processing_times, 50),
            'p95_processing_time_ms': np.percentile(processing_times, 95),
            'p99_processing_time_ms': np.percentile(processing_times, 99),
            'max_processing_time_ms': np.max(processing_times),
            'min_processing_time_ms': np.min(processing_times)
        }


class AdaptiveThresholdManager:
    """
    Manages dynamic fraud detection thresholds
    
    Adjusts thresholds based on feedback and business requirements
    """
    
    def __init__(
        self,
        initial_threshold: float = 0.5,
        target_precision: float = 0.95,
        target_recall: float = 0.90
    ):
        self.threshold = initial_threshold
        self.target_precision = target_precision
        self.target_recall = target_recall
        
        self.feedback_history: List[Dict[str, Any]] = []
        
    def add_feedback(
        self,
        fraud_score: float,
        actual_fraud: bool,
        timestamp: Optional[datetime] = None
    ) -> None:
        """Add feedback from confirmed fraud/legitimate transactions"""
        self.feedback_history.append({
            'fraud_score': fraud_score,
            'actual_fraud': actual_fraud,
            'timestamp': timestamp or datetime.now()
        })
    
    def optimize_threshold(self) -> float:
        """
        Optimize threshold based on feedback
        
        Uses recent feedback to adjust threshold towards target metrics
        """
        if len(self.feedback_history) < 100:
            return self.threshold
        
        # Get recent feedback
        recent = self.feedback_history[-1000:]
        
        scores = np.array([f['fraud_score'] for f in recent])
        actuals = np.array([f['actual_fraud'] for f in recent])
        
        # Try different thresholds
        best_threshold = self.threshold
        best_score = -np.inf
        
        for threshold in np.linspace(0.1, 0.9, 50):
            predictions = scores >= threshold
            
            tp = np.sum((predictions == 1) & (actuals == 1))
            fp = np.sum((predictions == 1) & (actuals == 0))
            fn = np.sum((predictions == 0) & (actuals == 1))
            
            precision = tp / (tp + fp + 1e-10)
            recall = tp / (tp + fn + 1e-10)
            
            # Score based on distance from targets
            precision_diff = abs(precision - self.target_precision)
            recall_diff = abs(recall - self.target_recall)
            
            score = -(precision_diff + recall_diff)  # Minimize difference
            
            if score > best_score:
                best_score = score
                best_threshold = threshold
        
        self.threshold = best_threshold
        logger.info(f"Optimized threshold to {best_threshold:.3f}")
        
        return best_threshold
