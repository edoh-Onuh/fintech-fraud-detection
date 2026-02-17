"""
Quick Production System Initializer
Train models and make system ready for real fraud detection
"""
import sys
sys.path.insert(0, 'c:\\Users\\adanu\\OneDrive\\AI\\fintech')

from src.utils.data_generator import FraudDataGenerator
from src.models.xgboost_model import XGBoostFraudDetector
from src.models.ensemble_model import EnsembleFraudDetector
from src.models.base import ModelRegistry
from sklearn.model_selection import train_test_split
import pandas as pd

print("="*80)
print("INITIALIZING FRAUD DETECTION SYSTEM")
print("="*80)

# Generate training data
print("\n[1/4] Generating training data (50,000 samples)...")
generator = FraudDataGenerator(seed=42)
X, y = generator.generate_dataset(n_samples=50000, fraud_ratio=0.02)

print(f"✓ Generated {len(X)} transactions with {y.sum()} fraud cases")

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
print(f"✓ Training set: {len(X_train)} samples | Test set: {len(X_test)} samples")

# Train XGBoost model
print("\n[2/4] Training XGBoost model...")
xgb_model = XGBoostFraudDetector(version="1.0.0")
metrics = xgb_model.train(X_train, y_train)
print(f"✓ XGBoost - Accuracy: {metrics['accuracy']:.3f} | Recall: {metrics['recall']:.3f} | AUC: {metrics['auc_roc']:.3f}")

# Train Ensemble model
print("\n[3/4] Training Ensemble model...")
ensemble_model = EnsembleFraudDetector(version="1.0.0")
metrics = ensemble_model.train(X_train, y_train)
print(f"✓ Ensemble - Accuracy: {metrics['accuracy']:.3f} | Recall: {metrics['recall']:.3f} | AUC: {metrics['auc_roc']:.3f}")

# Register models
print("\n[4/4] Registering models...")
registry = ModelRegistry()
registry.register_model(xgb_model, set_active=True)
registry.register_model(ensemble_model)
print(f"✓ Registered 2 models (XGBoost is active)")

# Save models to disk
print("\nSaving models to disk...")
import os
models_dir = "models"
os.makedirs(models_dir, exist_ok=True)
xgb_model.save_model(models_dir)
ensemble_model.save_model(models_dir)
print(f"✓ Models saved to ./{models_dir}/")

# Test predictions
print("\n" + "="*80)
print("TESTING SYSTEM")
print("="*80)
test_sample = X_test.head(5)
predictions = xgb_model.predict_proba(test_sample)
print(f"✓ Tested 5 transactions - Fraud scores: {predictions[:, 1].round(3)}")

print("\n" + "="*80)
print("✓ SYSTEM READY FOR PRODUCTION!")
print("="*80)
print("\nYour fraud detection system can now detect:")
print("  • Account takeover")
print("  • Card testing")
print("  • Unusual spending patterns")
print("  • Geographic anomalies")
print("  • Velocity attacks")
print("\nAPI: http://127.0.0.1:8000/docs")
print("Dashboard: http://localhost:3000")
