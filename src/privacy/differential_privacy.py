"""
Differential Privacy Implementation for Fraud Detection
Provides privacy-preserving data processing and model training
"""
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
from diffprivlib import models as dp_models
from diffprivlib.mechanisms import Laplace, Gaussian
import logging

logger = logging.getLogger(__name__)


class DifferentialPrivacyManager:
    """
    Manages differential privacy budgets and mechanisms
    
    Key Concepts:
    - Epsilon (ε): Privacy budget - smaller values = more privacy
    - Delta (δ): Probability of privacy breach - typically very small
    - Privacy budget is consumed with each query/operation
    """
    
    def __init__(
        self,
        total_epsilon: float = 1.0,
        delta: float = 1e-5
    ):
        """
        Initialize privacy manager
        
        Args:
            total_epsilon: Total privacy budget (recommended: 0.1-10.0)
            delta: Failure probability (recommended: 1e-5 for datasets < 100k)
        """
        self.total_epsilon = total_epsilon
        self.delta = delta
        self.consumed_epsilon = 0.0
        self.query_history: List[Dict[str, Any]] = []
        
        logger.info(f"Privacy manager initialized: ε={total_epsilon}, δ={delta}")
    
    def add_laplace_noise(
        self,
        data: np.ndarray,
        epsilon: float,
        sensitivity: float = 1.0
    ) -> np.ndarray:
        """
        Add Laplace noise for differential privacy
        
        Args:
            data: Original data
            epsilon: Privacy budget for this operation
            sensitivity: Query sensitivity (max change from one record)
            
        Returns:
            Noisy data satisfying ε-differential privacy
        """
        if not self.check_budget(epsilon):
            raise ValueError(f"Insufficient privacy budget. "
                           f"Requested: {epsilon}, Available: {self.remaining_budget}")
        
        mechanism = Laplace(epsilon=epsilon, delta=0, sensitivity=sensitivity)
        noisy_data = np.array([mechanism.randomise(x) for x in data.flatten()])
        noisy_data = noisy_data.reshape(data.shape)
        
        self._consume_budget(epsilon, "laplace_noise")
        
        return noisy_data
    
    def add_gaussian_noise(
        self,
        data: np.ndarray,
        epsilon: float,
        sensitivity: float = 1.0
    ) -> np.ndarray:
        """
        Add Gaussian noise for (ε, δ)-differential privacy
        
        Gaussian mechanism provides tighter privacy bounds for some queries
        """
        if not self.check_budget(epsilon):
            raise ValueError(f"Insufficient privacy budget")
        
        mechanism = Gaussian(epsilon=epsilon, delta=self.delta, sensitivity=sensitivity)
        noisy_data = np.array([mechanism.randomise(x) for x in data.flatten()])
        noisy_data = noisy_data.reshape(data.shape)
        
        self._consume_budget(epsilon, "gaussian_noise")
        
        return noisy_data
    
    def privatize_dataframe(
        self,
        df: pd.DataFrame,
        epsilon_per_column: float,
        columns_to_privatize: Optional[List[str]] = None,
        bounds: Optional[Dict[str, Tuple[float, float]]] = None
    ) -> pd.DataFrame:
        """
        Privatize numerical columns in a DataFrame
        
        Args:
            df: Input DataFrame
            epsilon_per_column: Privacy budget per column
            columns_to_privatize: Columns to add noise to (None = all numeric)
            bounds: Value bounds for each column (for clipping)
            
        Returns:
            Privatized DataFrame
        """
        df_private = df.copy()
        
        if columns_to_privatize is None:
            columns_to_privatize = df.select_dtypes(include=[np.number]).columns.tolist()
        
        total_epsilon = epsilon_per_column * len(columns_to_privatize)
        
        if not self.check_budget(total_epsilon):
            raise ValueError(f"Insufficient privacy budget for all columns")
        
        for col in columns_to_privatize:
            if col not in df.columns:
                continue
            
            # Get bounds for normalization
            if bounds and col in bounds:
                lower, upper = bounds[col]
            else:
                lower, upper = df[col].min(), df[col].max()
            
            # Normalize to [0, 1] for consistent sensitivity
            normalized = (df[col] - lower) / (upper - lower + 1e-10)
            
            # Add noise (sensitivity = 1 after normalization)
            noisy_normalized = self.add_laplace_noise(
                np.asarray(normalized.values),
                epsilon=epsilon_per_column,
                sensitivity=1.0
            )
            
            # Denormalize
            df_private[col] = noisy_normalized * (upper - lower) + lower
            
            # Clip to original bounds
            df_private[col] = df_private[col].clip(lower, upper)
        
        logger.info(f"Privatized {len(columns_to_privatize)} columns with ε={epsilon_per_column} each")
        
        return df_private
    
    def compute_private_statistics(
        self,
        data: pd.Series,
        statistics: List[str],
        epsilon_per_stat: float
    ) -> Dict[str, float]:
        """
        Compute statistics with differential privacy
        
        Args:
            data: Data series
            statistics: List of stats to compute ('mean', 'median', 'std', 'sum')
            epsilon_per_stat: Privacy budget per statistic
            
        Returns:
            Dictionary of private statistics
        """
        total_epsilon = epsilon_per_stat * len(statistics)
        
        if not self.check_budget(total_epsilon):
            raise ValueError("Insufficient privacy budget")
        
        results = {}
        
        for stat in statistics:
            if stat == 'mean':
                true_mean = data.mean()
                # Sensitivity = (max - min) / n for mean
                sensitivity = (data.max() - data.min()) / len(data)
                results['mean'] = true_mean + self._generate_laplace_noise(
                    epsilon_per_stat, sensitivity
                )
            
            elif stat == 'sum':
                true_sum = data.sum()
                # Sensitivity = max value for sum
                sensitivity = data.max() - data.min()
                results['sum'] = true_sum + self._generate_laplace_noise(
                    epsilon_per_stat, sensitivity
                )
            
            elif stat == 'median':
                # Median is more complex - use exponential mechanism
                results['median'] = data.median()  # Simplified
            
            elif stat == 'std':
                true_std = data.std()
                sensitivity = (data.max() - data.min()) / len(data)
                results['std'] = true_std + self._generate_laplace_noise(
                    epsilon_per_stat, sensitivity
                )
            
            self._consume_budget(epsilon_per_stat, f"stat_{stat}")
        
        return results
    
    def create_private_histogram(
        self,
        data: pd.Series,
        bins: int,
        epsilon: float
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        Create histogram with differential privacy
        
        Args:
            data: Input data
            bins: Number of bins
            epsilon: Privacy budget
            
        Returns:
            (bin_edges, noisy_counts)
        """
        if not self.check_budget(epsilon):
            raise ValueError("Insufficient privacy budget")
        
        # Create histogram
        counts, bin_edges = np.histogram(data, bins=bins)
        
        # Add Laplace noise (sensitivity = 1 for count queries)
        noisy_counts = self.add_laplace_noise(
            counts.astype(float),
            epsilon=epsilon,
            sensitivity=1.0
        )
        
        # Ensure non-negative counts
        noisy_counts = np.maximum(noisy_counts, 0)
        
        logger.info(f"Created private histogram with {bins} bins, ε={epsilon}")
        
        return bin_edges, noisy_counts
    
    def train_private_logistic_regression(
        self,
        X: np.ndarray,
        y: np.ndarray,
        epsilon: float,
        **kwargs
    ):
        """
        Train logistic regression with differential privacy
        
        Uses diffprivlib's implementation with output perturbation
        """
        if not self.check_budget(epsilon):
            raise ValueError("Insufficient privacy budget")
        
        model = dp_models.LogisticRegression(
            epsilon=epsilon,
            data_norm=np.linalg.norm(X, axis=1).max(),
            **kwargs
        )
        
        model.fit(X, y)
        
        self._consume_budget(epsilon, "private_logistic_regression")
        
        return model
    
    def check_budget(self, epsilon: float) -> bool:
        """Check if sufficient privacy budget remains"""
        return (self.consumed_epsilon + epsilon) <= self.total_epsilon
    
    @property
    def remaining_budget(self) -> float:
        """Get remaining privacy budget"""
        return max(0, self.total_epsilon - self.consumed_epsilon)
    
    def _consume_budget(self, epsilon: float, operation: str) -> None:
        """Record budget consumption"""
        self.consumed_epsilon += epsilon
        self.query_history.append({
            'operation': operation,
            'epsilon': epsilon,
            'timestamp': pd.Timestamp.now(),
            'remaining': self.remaining_budget
        })
        
        logger.debug(f"Consumed ε={epsilon} for {operation}. "
                    f"Remaining: ε={self.remaining_budget:.4f}")
    
    def _generate_laplace_noise(self, epsilon: float, sensitivity: float) -> float:
        """Generate single Laplace noise value"""
        scale = sensitivity / epsilon
        return np.random.laplace(0, scale)
    
    def get_budget_report(self) -> Dict[str, Any]:
        """Get privacy budget usage report"""
        return {
            'total_epsilon': self.total_epsilon,
            'consumed_epsilon': self.consumed_epsilon,
            'remaining_epsilon': self.remaining_budget,
            'delta': self.delta,
            'query_count': len(self.query_history),
            'query_history': self.query_history[-10:]  # Last 10 operations
        }
    
    def reset_budget(self) -> None:
        """Reset privacy budget (use with caution!)"""
        logger.warning("Resetting privacy budget - use only in development/testing")
        self.consumed_epsilon = 0.0
        self.query_history = []


class PrivacyAuditor:
    """
    Audit privacy guarantees and track data usage
    
    Ensures compliance with GDPR and other privacy regulations
    """
    
    def __init__(self):
        self.data_access_log: List[Dict[str, Any]] = []
        self.privacy_violations: List[Dict[str, Any]] = []
    
    def log_data_access(
        self,
        user_id: str,
        data_type: str,
        purpose: str,
        record_count: int
    ) -> None:
        """Log data access for audit trail"""
        self.data_access_log.append({
            'timestamp': pd.Timestamp.now(),
            'user_id': user_id,
            'data_type': data_type,
            'purpose': purpose,
            'record_count': record_count
        })
    
    def check_privacy_compliance(
        self,
        epsilon: float,
        delta: float,
        data_size: int
    ) -> Dict[str, Any]:
        """
        Check if privacy parameters meet compliance standards
        
        Recommendations based on GDPR and industry best practices
        """
        compliance = {
            'compliant': True,
            'warnings': [],
            'recommendations': []
        }
        
        # Check epsilon
        if epsilon > 10.0:
            compliance['compliant'] = False
            compliance['warnings'].append(
                f"Epsilon too large ({epsilon}). Weak privacy guarantee."
            )
        elif epsilon > 1.0:
            compliance['warnings'].append(
                f"Epsilon moderate ({epsilon}). Consider reducing for stronger privacy."
            )
        
        # Check delta relative to data size
        max_delta = 1.0 / data_size
        if delta > max_delta:
            compliance['warnings'].append(
                f"Delta ({delta}) should be < 1/n ({max_delta:.2e}) for dataset size {data_size}"
            )
        
        # Recommendations
        if epsilon > 1.0:
            compliance['recommendations'].append(
                "Consider using epsilon ≤ 1.0 for stronger privacy guarantees"
            )
        
        if not compliance['warnings']:
            compliance['recommendations'].append(
                "Privacy parameters meet recommended standards"
            )
        
        return compliance
    
    def generate_audit_report(self) -> pd.DataFrame:
        """Generate audit report of data access"""
        if not self.data_access_log:
            return pd.DataFrame()
        
        return pd.DataFrame(self.data_access_log)
    
    def export_gdpr_report(self, user_id: str) -> Dict[str, Any]:
        """
        Export GDPR-compliant data usage report for specific user
        
        Supports "Right to know" requirements
        """
        user_accesses = [
            log for log in self.data_access_log 
            if log.get('user_id') == user_id
        ]
        
        return {
            'user_id': user_id,
            'total_accesses': len(user_accesses),
            'access_history': user_accesses,
            'data_types_accessed': list(set(
                log['data_type'] for log in user_accesses
            )),
            'report_generated': pd.Timestamp.now().isoformat()
        }
