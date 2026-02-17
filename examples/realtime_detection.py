"""
Example: Real-time fraud detection
"""
import sys
import asyncio
from datetime import datetime
sys.path.append('..')

from src.models import XGBoostFraudDetector
from src.realtime import Transaction, RealTimeFraudDetector
from src.utils.data_generator import FraudDataGenerator
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def main():
    """Demonstrate real-time fraud detection"""
    
    print("=" * 60)
    print("Real-Time Fraud Detection Demo")
    print("=" * 60)
    
    # 1. Train a quick model
    print("\n[1/3] Training model...")
    generator = FraudDataGenerator()
    X, y = generator.generate_dataset(n_samples=5000)
    
    model = XGBoostFraudDetector(n_estimators=50)
    model.train(X, y)
    print("  ✓ Model trained")
    
    # 2. Create detector
    print("\n[2/3] Initializing real-time detector...")
    detector = RealTimeFraudDetector(model=model)
    print("  ✓ Detector ready")
    
    # 3. Simulate transactions
    print("\n[3/3] Processing transactions...")
    
    transactions = [
        Transaction(
            transaction_id=f"txn_{i}",
            user_id="user_123",
            merchant_id="merchant_abc",
            amount=amount,
            currency="USD",
            timestamp=datetime.now(),
            transaction_type="purchase",
            channel="online",
            country="US"
        )
        for i, amount in enumerate([50.0, 150.0, 2000.0, 45.0, 5000.0])
    ]
    
    print("\nTransaction Results:")
    print("-" * 80)
    
    for txn in transactions:
        result = await detector.detect_fraud(txn)
        
        status_icon = "🚨" if result.is_fraud else "✅"
        
        print(f"\n{status_icon} Transaction {txn.transaction_id}")
        print(f"   Amount: ${txn.amount:,.2f}")
        print(f"   Fraud Score: {result.fraud_score:.3f}")
        print(f"   Risk Level: {result.risk_level.upper()}")
        print(f"   Decision: {result.decision.upper()}")
        print(f"   Processing Time: {result.processing_time_ms:.2f}ms")
        
        if result.top_risk_factors:
            print(f"   Top Risk Factors:")
            for factor in result.top_risk_factors[:3]:
                print(f"     - {factor['feature']}: {factor['contribution']:+.4f}")
    
    # 4. Performance metrics
    print("\n" + "-" * 80)
    print("\nPerformance Metrics:")
    metrics = detector.get_performance_metrics()
    print(f"  Total Transactions: {metrics['total_transactions']}")
    print(f"  Fraud Detected: {metrics['total_fraud_detected']}")
    print(f"  Fraud Rate: {metrics['fraud_rate']*100:.2f}%")
    print(f"  Avg Processing Time: {metrics['avg_processing_time_ms']:.2f}ms")
    print(f"  P95 Processing Time: {metrics['p95_processing_time_ms']:.2f}ms")
    print(f"  P99 Processing Time: {metrics['p99_processing_time_ms']:.2f}ms")
    
    print("\n" + "=" * 60)
    print("Demo complete!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
