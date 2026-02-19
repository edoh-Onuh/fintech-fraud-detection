"""
Transaction Seeder — Generates realistic financial transactions for JED 24
Populates the database with synthetic but plausible transaction data so
analytics dashboards show meaningful information from the first request.

Runs once on startup if the DB is empty.
"""
import random
import uuid
import logging
from datetime import datetime, timedelta
from typing import List, Dict

from . import database as db

logger = logging.getLogger(__name__)

# ─── Seed configuration ─────────────────────────────────────────────

SEED_COUNT = 350  # Number of transactions to generate
SEED_DAYS = 30     # Spread across the last N days

# Realistic merchant / country / currency sets
MERCHANTS = [
    ("Amazon UK", "online", "GB", "London", "GBP"),
    ("Tesco PLC", "pos", "GB", "Manchester", "GBP"),
    ("Sainsbury's", "pos", "GB", "Birmingham", "GBP"),
    ("ASOS Online", "online", "GB", "London", "GBP"),
    ("Deliveroo", "online", "GB", "London", "GBP"),
    ("TfL Oyster", "pos", "GB", "London", "GBP"),
    ("Amazon US", "online", "US", "Seattle", "USD"),
    ("Walmart Inc", "pos", "US", "New York", "USD"),
    ("Target Corp", "pos", "US", "Chicago", "USD"),
    ("Uber Rides", "online", "US", "San Francisco", "USD"),
    ("Apple Store", "online", "US", "Cupertino", "USD"),
    ("Stripe Inc", "online", "US", "San Francisco", "USD"),
    ("Jumia Nigeria", "online", "NG", "Lagos", "NGN"),
    ("MTN Airtime", "mobile", "NG", "Lagos", "NGN"),
    ("Dangote Group", "pos", "NG", "Abuja", "NGN"),
    ("Flutterwave", "online", "NG", "Lagos", "NGN"),
    ("Paystack Store", "online", "NG", "Lagos", "NGN"),
    ("Zalando DE", "online", "DE", "Berlin", "EUR"),
    ("Lidl Europe", "pos", "DE", "Munich", "EUR"),
    ("Carrefour FR", "pos", "FR", "Paris", "EUR"),
    ("FNAC France", "online", "FR", "Lyon", "EUR"),
    ("Rakuten JP", "online", "JP", "Tokyo", "JPY"),
    ("7-Eleven JP", "pos", "JP", "Osaka", "JPY"),
    ("MercadoLibre", "online", "BR", "São Paulo", "BRL"),
    ("Flipkart IN", "online", "IN", "Mumbai", "INR"),
    ("Shoprite ZA", "pos", "ZA", "Johannesburg", "ZAR"),
]

TRANSACTION_TYPES = ["purchase", "withdrawal", "transfer", "payment"]
CHANNELS = ["online", "pos", "atm", "mobile"]
RISK_FACTORS_POOL = [
    {"feature": "amount_zscore", "description": "Unusually high amount", "importance": 0.35},
    {"feature": "velocity_1h", "description": "Multiple transactions in short window", "importance": 0.28},
    {"feature": "geo_anomaly", "description": "Transaction from unusual location", "importance": 0.25},
    {"feature": "merchant_risk", "description": "High-risk merchant category", "importance": 0.20},
    {"feature": "channel_mismatch", "description": "Channel differs from user pattern", "importance": 0.18},
    {"feature": "time_anomaly", "description": "Transaction at unusual hour", "importance": 0.15},
    {"feature": "device_new", "description": "First time using this device", "importance": 0.12},
    {"feature": "cross_border", "description": "Cross-border transaction", "importance": 0.22},
    {"feature": "round_amount", "description": "Suspiciously round amount", "importance": 0.10},
    {"feature": "card_not_present", "description": "Card-not-present transaction", "importance": 0.14},
]


# ─── Amount distributions per currency ──────────────────────────────
# (min, typical_max, rare_max) — shapes realistic amount ranges
CURRENCY_AMOUNTS = {
    "GBP": (1.50, 500, 8_000),
    "USD": (2.00, 600, 10_000),
    "EUR": (1.80, 550, 9_000),
    "NGN": (200, 150_000, 2_000_000),
    "JPY": (150, 80_000, 500_000),
    "BRL": (5, 3_000, 50_000),
    "INR": (50, 25_000, 200_000),
    "ZAR": (15, 5_000, 80_000),
}

USER_IDS = [f"user_{i:04d}" for i in range(1, 51)]  # 50 unique users


# ─── Generator ───────────────────────────────────────────────────────

def _random_amount(currency: str) -> float:
    """Generate realistic transaction amount for a given currency."""
    lo, typical, rare = CURRENCY_AMOUNTS.get(currency, (1, 500, 5000))
    # 90% of transactions are within typical range, 10% are high-value
    if random.random() < 0.90:
        amount = random.uniform(lo, typical)
    else:
        amount = random.uniform(typical, rare)
    return round(amount, 2)


def _random_timestamp(days: int) -> str:
    """Random datetime string within the last N days, ISO format."""
    offset_seconds = random.randint(0, days * 86400)
    ts = datetime.utcnow() - timedelta(seconds=offset_seconds)
    return ts.strftime("%Y-%m-%d %H:%M:%S")


def _score_fraud(amount: float, currency: str, channel: str,
                 country: str, tx_type: str) -> dict:
    """
    Deterministic fraud scoring heuristic (no ML model needed for seeding).
    Returns fraud_score (0-1), is_fraud, risk_level, decision, risk_factors.
    """
    score = 0.0
    factors = []

    # High amount bump
    _, typical, _ = CURRENCY_AMOUNTS.get(currency, (1, 500, 5000))
    if amount > typical * 0.8:
        bump = min(0.3, (amount / typical - 0.8) * 0.3)
        score += bump
        factors.append({"feature": "amount_zscore",
                        "description": "Unusually high amount",
                        "importance": round(bump, 3)})

    # Cross-border / unusual geo
    if country not in ("GB", "US"):
        geo_risk = random.uniform(0.05, 0.15)
        score += geo_risk
        factors.append({"feature": "cross_border",
                        "description": f"Transaction from {country}",
                        "importance": round(geo_risk, 3)})

    # ATM withdrawals are riskier
    if channel == "atm":
        atm_risk = random.uniform(0.05, 0.12)
        score += atm_risk
        factors.append({"feature": "channel_mismatch",
                        "description": "ATM channel risk",
                        "importance": round(atm_risk, 3)})

    # Transfer type risk
    if tx_type == "transfer":
        xfer_risk = random.uniform(0.03, 0.10)
        score += xfer_risk
        factors.append({"feature": "velocity_1h",
                        "description": "Transfer risk indicator",
                        "importance": round(xfer_risk, 3)})

    # Random noise — simulates model uncertainty
    noise = random.gauss(0, 0.08)
    score = max(0.0, min(1.0, score + noise))

    # Inject ~7% explicit fraud
    force_fraud = random.random() < 0.07
    if force_fraud:
        score = random.uniform(0.75, 0.98)
        factors = random.sample(RISK_FACTORS_POOL, k=random.randint(2, 4))

    is_fraud = score >= 0.7
    if score < 0.3:
        risk_level, decision = "low", "approved"
    elif score < 0.7:
        risk_level, decision = "medium", "approved"
    else:
        risk_level, decision = "high", "blocked"

    return {
        "fraud_score": round(score, 4),
        "is_fraud": is_fraud,
        "risk_level": risk_level,
        "decision": decision,
        "risk_factors": factors,
    }


def generate_transactions(count: int = SEED_COUNT,
                          days: int = SEED_DAYS) -> List[Dict]:
    """Build a list of realistic seed transactions."""
    txns: List[Dict] = []
    for _ in range(count):
        merchant_name, default_channel, country, city, currency = random.choice(MERCHANTS)

        # Occasionally override channel (e.g. someone paying ATM for an online merchant)
        channel = default_channel if random.random() < 0.85 else random.choice(CHANNELS)
        tx_type = random.choice(TRANSACTION_TYPES)
        amount = _random_amount(currency)

        scoring = _score_fraud(amount, currency, channel, country, tx_type)

        txns.append({
            "transaction_id": f"seed_{uuid.uuid4().hex[:12]}",
            "user_id": random.choice(USER_IDS),
            "merchant_id": merchant_name,
            "amount": amount,
            "currency": currency,
            "transaction_type": tx_type,
            "channel": channel,
            "country": country,
            "city": city,
            "model_version": "seeder-v1.0",
            "processing_time_ms": round(random.uniform(12, 85), 1),
            "created_at": _random_timestamp(days),
            **scoring,
        })
    return txns


# ─── Entry point ─────────────────────────────────────────────────────

def seed_if_empty():
    """
    Check DB for existing transactions. If empty, seed with realistic data.
    Safe to call on every startup — idempotent.
    """
    stats = db.get_transaction_stats(days=9999)
    if stats["total_transactions"] > 0:
        logger.info(f"DB already has {stats['total_transactions']} transactions — skipping seed")
        return

    logger.info(f"Empty database detected — seeding {SEED_COUNT} transactions …")
    txns = generate_transactions()

    for tx in txns:
        try:
            db.save_transaction(tx)
        except Exception as e:
            logger.warning(f"Seed transaction failed: {e}")

    final = db.get_transaction_stats(days=9999)
    logger.info(
        f"Seeding complete: {final['total_transactions']} transactions, "
        f"{final['fraud_detected']} flagged as fraud"
    )
