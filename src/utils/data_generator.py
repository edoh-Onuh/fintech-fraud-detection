"""
Sample Data Generator for Testing
Generates synthetic fraud detection datasets
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Tuple
import logging

logger = logging.getLogger(__name__)


class FraudDataGenerator:
    """
    Generates synthetic fraud detection data
    
    Creates realistic transaction patterns with fraud examples
    """
    
    def __init__(self, seed: int = 42):
        np.random.seed(seed)
        self.seed = seed
        
    def generate_dataset(
        self,
        n_samples: int = 10000,
        fraud_ratio: float = 0.02
    ) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Generate synthetic fraud detection dataset
        
        Args:
            n_samples: Number of transactions to generate
            fraud_ratio: Percentage of fraudulent transactions
            
        Returns:
            Tuple of (features DataFrame, labels Series)
        """
        n_fraud = int(n_samples * fraud_ratio)
        n_legitimate = n_samples - n_fraud
        
        # Generate legitimate transactions
        legitimate = self._generate_legitimate_transactions(n_legitimate)
        legitimate['is_fraud'] = 0
        
        # Generate fraudulent transactions
        fraud = self._generate_fraudulent_transactions(n_fraud)
        fraud['is_fraud'] = 1
        
        # Combine and shuffle
        data = pd.concat([legitimate, fraud], ignore_index=True)
        data = data.sample(frac=1, random_state=self.seed).reset_index(drop=True)
        
        # Split features and labels
        y = data['is_fraud']
        X = data.drop('is_fraud', axis=1)
        
        logger.info(f"Generated {n_samples} transactions ({n_fraud} fraud, {n_legitimate} legitimate)")
        
        return X, y
    
    def _generate_legitimate_transactions(self, n: int) -> pd.DataFrame:
        """Generate normal transaction patterns"""
        data = {
            # Transaction basics
            'amount': np.random.lognormal(mean=3.5, sigma=1.2, size=n),
            'amount_log': np.random.normal(3.5, 1.2, n),
            
            # Transaction types (mostly purchases)
            'transaction_type_purchase': np.random.choice([0, 1], n, p=[0.2, 0.8]),
            'transaction_type_withdrawal': np.random.choice([0, 1], n, p=[0.9, 0.1]),
            'transaction_type_transfer': np.random.choice([0, 1], n, p=[0.9, 0.1]),
            
            # Channels (mostly online and pos)
            'channel_online': np.random.choice([0, 1], n, p=[0.4, 0.6]),
            'channel_mobile': np.random.choice([0, 1], n, p=[0.7, 0.3]),
            'channel_atm': np.random.choice([0, 1], n, p=[0.9, 0.1]),
            'channel_pos': np.random.choice([0, 1], n, p=[0.6, 0.4]),
            
            # User behavior
            'is_first_transaction': np.random.choice([0, 1], n, p=[0.95, 0.05]),
            'account_age_days': np.random.exponential(scale=365, size=n),
            'account_age_days_log': np.random.exponential(scale=5.5, size=n),
            
            # Temporal features (mostly business hours)
            'hour': np.random.choice(range(24), n, p=self._hour_distribution()),
            'day_of_week': np.random.randint(0, 7, n),
            'is_weekend': np.random.choice([0, 1], n, p=[0.7, 0.3]),
            'is_night': np.random.choice([0, 1], n, p=[0.9, 0.1]),
            'is_business_hours': np.random.choice([0, 1], n, p=[0.3, 0.7]),
            'month': np.random.randint(1, 13, n),
            'day_of_month': np.random.randint(1, 29, n),
            
            # User history
            'user_transaction_count': np.random.poisson(lam=20, size=n),
            'user_avg_amount': np.random.lognormal(3.0, 1.0, n),
            'user_std_amount': np.random.lognormal(2.0, 0.8, n),
            'user_max_amount': np.random.lognormal(4.0, 1.2, n),
            'user_total_amount_24h': np.random.lognormal(3.5, 1.5, n),
            'user_transaction_count_24h': np.random.poisson(lam=3, size=n),
            
            # Merchant features
            'merchant_avg_amount': np.random.lognormal(3.2, 1.0, n),
            'merchant_transaction_count': np.random.poisson(lam=100, size=n),
            'merchant_fraud_rate': np.random.beta(1, 99, n),  # Low fraud rate
            
            # Velocity features
            'time_since_last_transaction_seconds': np.random.exponential(scale=3600, size=n),
            'time_since_last_transaction_minutes': np.random.exponential(scale=60, size=n),
            'transactions_last_hour': np.random.poisson(lam=1, size=n),
            'transactions_last_day': np.random.poisson(lam=5, size=n),
            
            # Anomaly features
            'amount_deviation_from_avg': np.random.normal(0, 1, n),
            'is_amount_outlier': np.random.choice([0, 1], n, p=[0.95, 0.05]),
            'amount_vs_avg_ratio': np.random.lognormal(0, 0.5, n)
        }
        
        return pd.DataFrame(data)
    
    def _generate_fraudulent_transactions(self, n: int) -> pd.DataFrame:
        """Generate fraudulent transaction patterns"""
        data = {
            # Higher amounts for fraud
            'amount': np.random.lognormal(mean=4.5, sigma=1.5, size=n),
            'amount_log': np.random.normal(4.5, 1.5, n),
            
            # Transaction types
            'transaction_type_purchase': np.random.choice([0, 1], n, p=[0.1, 0.9]),
            'transaction_type_withdrawal': np.random.choice([0, 1], n, p=[0.7, 0.3]),
            'transaction_type_transfer': np.random.choice([0, 1], n, p=[0.8, 0.2]),
            
            # More online fraud
            'channel_online': np.random.choice([0, 1], n, p=[0.2, 0.8]),
            'channel_mobile': np.random.choice([0, 1], n, p=[0.5, 0.5]),
            'channel_atm': np.random.choice([0, 1], n, p=[0.8, 0.2]),
            'channel_pos': np.random.choice([0, 1], n, p=[0.7, 0.3]),
            
            # Often first transactions
            'is_first_transaction': np.random.choice([0, 1], n, p=[0.5, 0.5]),
            'account_age_days': np.random.exponential(scale=90, size=n),  # Newer accounts
            'account_age_days_log': np.random.exponential(scale=4.0, size=n),
            
            # Odd hours
            'hour': np.random.choice(range(24), n, p=self._fraud_hour_distribution()),
            'day_of_week': np.random.randint(0, 7, n),
            'is_weekend': np.random.choice([0, 1], n, p=[0.4, 0.6]),
            'is_night': np.random.choice([0, 1], n, p=[0.4, 0.6]),  # More at night
            'is_business_hours': np.random.choice([0, 1], n, p=[0.7, 0.3]),
            'month': np.random.randint(1, 13, n),
            'day_of_month': np.random.randint(1, 29, n),
            
            # Less transaction history
            'user_transaction_count': np.random.poisson(lam=5, size=n),
            'user_avg_amount': np.random.lognormal(2.5, 1.2, n),
            'user_std_amount': np.random.lognormal(2.5, 1.0, n),
            'user_max_amount': np.random.lognormal(3.5, 1.5, n),
            'user_total_amount_24h': np.random.lognormal(4.0, 1.8, n),
            'user_transaction_count_24h': np.random.poisson(lam=8, size=n),  # High velocity
            
            # Risky merchants
            'merchant_avg_amount': np.random.lognormal(3.8, 1.2, n),
            'merchant_transaction_count': np.random.poisson(lam=50, size=n),
            'merchant_fraud_rate': np.random.beta(5, 20, n),  # Higher fraud rate
            
            # High velocity
            'time_since_last_transaction_seconds': np.random.exponential(scale=600, size=n),
            'time_since_last_transaction_minutes': np.random.exponential(scale=10, size=n),
            'transactions_last_hour': np.random.poisson(lam=5, size=n),
            'transactions_last_day': np.random.poisson(lam=15, size=n),
            
            # Anomalous amounts
            'amount_deviation_from_avg': np.random.normal(2, 1.5, n),  # Higher deviation
            'is_amount_outlier': np.random.choice([0, 1], n, p=[0.3, 0.7]),
            'amount_vs_avg_ratio': np.random.lognormal(1.0, 1.0, n)  # Higher ratios
        }
        
        return pd.DataFrame(data)
    
    def _hour_distribution(self) -> np.ndarray:
        """Generate realistic hourly transaction distribution"""
        # More transactions during business hours
        probs = np.array([
            0.01, 0.01, 0.01, 0.01, 0.01, 0.02,  # 0-5 AM
            0.03, 0.04, 0.05, 0.06, 0.07, 0.08,  # 6-11 AM
            0.08, 0.08, 0.07, 0.06, 0.05, 0.05,  # 12-5 PM
            0.06, 0.06, 0.05, 0.04, 0.03, 0.02   # 6-11 PM
        ])
        return probs / probs.sum()
    
    def _fraud_hour_distribution(self) -> np.ndarray:
        """Generate fraud hourly distribution (more at odd hours)"""
        probs = np.array([
            0.06, 0.06, 0.06, 0.06, 0.05, 0.04,  # 0-5 AM (more fraud)
            0.03, 0.03, 0.03, 0.04, 0.04, 0.05,  # 6-11 AM
            0.05, 0.05, 0.05, 0.04, 0.04, 0.04,  # 12-5 PM
            0.04, 0.04, 0.05, 0.06, 0.06, 0.06   # 6-11 PM (more fraud)
        ])
        return probs / probs.sum()


def generate_sample_dataset(output_path: str = "data/fraud_dataset.csv"):
    """
    Generate and save a sample dataset
    
    Args:
        output_path: Path to save the dataset
    """
    generator = FraudDataGenerator()
    X, y = generator.generate_dataset(n_samples=10000, fraud_ratio=0.02)
    
    # Combine features and labels
    data = X.copy()
    data['is_fraud'] = y
    
    # Save to CSV
    data.to_csv(output_path, index=False)
    
    logger.info(f"Sample dataset saved to {output_path}")
    print(f"Dataset generated: {len(data)} transactions")
    print(f"Fraud cases: {y.sum()} ({y.mean()*100:.2f}%)")
    print(f"Saved to: {output_path}")


if __name__ == "__main__":
    generate_sample_dataset()
