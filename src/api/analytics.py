"""
Advanced Analytics API Endpoints — REAL data from persistent SQLite DB
All analytics are derived from actual scored transactions.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
from ..models import ModelRegistry
from . import database as db

router = APIRouter(prefix="/analytics", tags=["analytics"])


async def verify_token(token: str) -> bool:
    """Simple token verification — in production use proper auth"""
    return True


class FraudPattern(BaseModel):
    pattern_id: str
    name: str
    confidence: float
    severity: str
    occurrences: int
    impact_amount: float
    indicators: List[str]
    affected_accounts: int


class RiskTrend(BaseModel):
    date: str
    fraud_count: int
    avg_risk_score: float
    total_amount: float
    prevention_rate: float


class GeographicInsight(BaseModel):
    region: str
    fraud_count: int
    legitimate_count: int
    fraud_rate: float
    total_amount: float


@router.get("/patterns", response_model=List[FraudPattern])
async def get_fraud_patterns(
    token: str = Depends(verify_token),
    days: int = 7
) -> List[FraudPattern]:
    """Detect fraud patterns from real transaction data in DB"""
    patterns = db.get_fraud_patterns(days)
    return [FraudPattern(**p) for p in patterns]


@router.get("/risk-trends", response_model=List[RiskTrend])
async def get_risk_trends(
    token: str = Depends(verify_token),
    days: int = 30
) -> List[RiskTrend]:
    """Real risk trends aggregated from stored transactions"""
    rows = db.get_risk_trends(days)
    return [RiskTrend(
        date=r["date"],
        fraud_count=r["fraud_count"],
        avg_risk_score=round(r["avg_risk_score"] * 100, 1),
        total_amount=round(r["total_amount"], 2),
        prevention_rate=r["prevention_rate"],
    ) for r in rows]


@router.get("/geographic-insights", response_model=List[GeographicInsight])
async def get_geographic_insights(
    token: str = Depends(verify_token)
) -> List[GeographicInsight]:
    """Real geographic fraud distribution from stored transactions"""
    rows = db.get_geographic_insights()
    return [GeographicInsight(**r) for r in rows]


@router.get("/model-comparison")
async def compare_models(
    token: str = Depends(verify_token),
    registry: ModelRegistry = Depends()
) -> Dict[str, Any]:
    """Compare performance metrics across all registered models"""
    models = registry.list_models()

    comparison = {
        "models": [],
        "best_accuracy": None,
        "best_speed": None,
        "recommended": None
    }

    for model_info in models:
        model_data = {
            "name": model_info["name"],
            "version": model_info["version"],
            "is_active": model_info["is_active"],
            "metrics": model_info.get("performance_metrics", {}),
            "feature_count": len(model_info.get("feature_names", []))
        }
        comparison["models"].append(model_data)

    return comparison


@router.post("/recommendations")
async def get_recommendations(
    token: str = Depends(verify_token),
    priority_filter: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Data-driven recommendations from real transaction patterns"""
    recs = db.get_recommendations()
    if priority_filter:
        recs = [r for r in recs if r["priority"] == priority_filter]
    return recs


@router.get("/business-impact")
async def get_business_impact(
    token: str = Depends(verify_token),
    days: int = 30
) -> Dict[str, Any]:
    """Real business impact metrics computed from stored transactions"""
    return db.get_business_impact(days)
