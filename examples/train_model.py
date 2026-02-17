"""
Example: Train and deploy fraud detection model
"""
import sys
sys.path.append('..')

from src.models import XGBoostFraudDetector, EnsembleFraudDetector, ModelRegistry
from src.utils.data_generator import FraudDataGenerator
from src.privacy import DifferentialPrivacyManager
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def main():
    """Train a fraud detection model"""
    
    print("=" * 60)
    print("Fraud Detection Model Training Example")
    print("=" * 60)
    
    # 1. Generate sample data
    print("\n[1/4] Generating synthetic fraud detection data...")
    generator = FraudDataGenerator()
    X, y = generator.generate_dataset(n_samples=10000, fraud_ratio=0.02)
    print(f"  ✓ Generated {len(X)} transactions")
    print(f"  ✓ Fraud cases: {y.sum()} ({y.mean()*100:.2f}%)")
    
    # 2. Train XGBoost model
    print("\n[2/4] Training XGBoost model...")
    xgb_model = XGBoostFraudDetector(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1
    )
    
    metrics = xgb_model.train(X, y, privacy_epsilon=None)
    print(f"  ✓ Training complete")
    print(f"  ✓ AUC-ROC: {metrics['auc_roc']:.4f}")
    print(f"  ✓ F1 Score: {metrics['f1_score']:.4f}")
    print(f"  ✓ Precision: {metrics['precision']:.4f}")
    print(f"  ✓ Recall: {metrics['recall']:.4f}")
    
    # 3. Train with differential privacy
    print("\n[3/4] Training with differential privacy (ε=1.0)...")
    xgb_private = XGBoostFraudDetector(version="1.0.0-private")
    
    metrics_private = xgb_private.train(
        X, y,
        privacy_epsilon=1.0  # Privacy budget
    )
    print(f"  ✓ Private training complete")
    print(f"  ✓ AUC-ROC: {metrics_private['auc_roc']:.4f}")
    print(f"  ✓ F1 Score: {metrics_private['f1_score']:.4f}")
    print(f"  ℹ Trade-off: {(metrics['auc_roc'] - metrics_private['auc_roc'])*100:.2f}% accuracy loss for privacy")
    
    # 4. Train ensemble model
    print("\n[4/4] Training ensemble model...")
    ensemble = EnsembleFraudDetector()
    
    ensemble_metrics = ensemble.train(X, y)
    print(f"  ✓ Ensemble training complete")
    print(f"  ✓ AUC-ROC: {ensemble_metrics['auc_roc']:.4f}")
    print(f"  ✓ F1 Score: {ensemble_metrics['f1_score']:.4f}")
    
    # 5. Model explanations
    print("\n[5/4] Generating model explanations...")
    sample = X.head(1)
    explanation = xgb_model.explain_prediction(sample)
    
    if 'explanations' in explanation:
        top_features = explanation['explanations'][0]['top_features']
        print(f"  ✓ Top risk factors:")
        for feature, contribution in list(top_features.items())[:5]:
            print(f"    - {feature}: {contribution:+.4f}")
    
    # 6. Feature importance
    print("\n[6/4] Top 10 most important features:")
    importance = xgb_model.get_feature_importance().head(10)
    for i, (idx, row) in enumerate(importance.iterrows(), 1):
        print(f"  {i}. {row['feature']}: {row['importance']:.4f}")
    
    # 7. Register models
    print("\n[7/4] Registering models...")
    registry = ModelRegistry()
    registry.register_model(xgb_model, set_active=True)
    registry.register_model(ensemble)
    
    print(f"  ✓ Registered {len(registry.list_models())} models")
    print(f"  ✓ Active model: {registry.active_model}")
    
    print("\n" + "=" * 60)
    print("Training complete! Models ready for deployment.")
    print("=" * 60)
    
    return xgb_model, ensemble


if __name__ == "__main__":
    model, ensemble = main()
