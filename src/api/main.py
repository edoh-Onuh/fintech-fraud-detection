"""
FastAPI Application - REST API for Fraud Detection System
Provides secure, production-ready API endpoints
"""
from fastapi import FastAPI, Depends, HTTPException, status, Security, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import logging
import time
import os
import jwt

from ..models import XGBoostFraudDetector, EnsembleFraudDetector, ModelRegistry
from ..realtime import Transaction, FraudResult, RealTimeFraudDetector
from ..security import AuthenticationManager, AuthorizationManager, User
from ..monitoring import MetricsCollector, AlertManager, PerformanceMonitor
from ..compliance import AuditLogger, EventType
from .analytics import router as analytics_router
from . import database as db

logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Fraud Detection System API",
    description="Production-grade fraud detection with privacy-preserving AI",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Include routers
app.include_router(analytics_router)

# Security
security = HTTPBearer()
JWT_SECRET = os.environ.get('JWT_SECRET', 'jed24-fraud-detection-secret-key-change-in-prod')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# Global state (in production, use dependency injection)
auth_manager = AuthenticationManager()
authz_manager = AuthorizationManager()
audit_logger = AuditLogger()
metrics_collector = MetricsCollector()
performance_monitor = PerformanceMonitor(metrics_collector)
model_registry = ModelRegistry()
_startup_time = datetime.utcnow()


# Pydantic models for API
class TransactionRequest(BaseModel):
    """Transaction data for fraud detection"""
    transaction_id: str = Field(..., description="Unique transaction ID")
    user_id: str
    merchant_id: str
    amount: float = Field(..., gt=0)
    currency: str = Field(default="USD")
    transaction_type: str = Field(..., description="purchase, withdrawal, or transfer")
    channel: str = Field(..., description="online, mobile, atm, or pos")
    
    # Optional fields
    ip_address: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    device_id: Optional[str] = None
    device_type: Optional[str] = None
    
    class Config:
        schema_extra = {
            "example": {
                "transaction_id": "txn_123456",
                "user_id": "user_789",
                "merchant_id": "merchant_abc",
                "amount": 150.00,
                "currency": "USD",
                "transaction_type": "purchase",
                "channel": "online",
                "ip_address": "192.168.1.1",
                "country": "US",
                "device_id": "device_xyz"
            }
        }


class FraudDetectionResponse(BaseModel):
    """Fraud detection result"""
    transaction_id: str
    fraud_score: float = Field(..., ge=0, le=1)
    is_fraud: bool
    risk_level: str
    decision: str
    top_risk_factors: List[Dict[str, Any]]
    processing_time_ms: float
    model_version: Optional[str] = None


class LoginRequest(BaseModel):
    """Login credentials"""
    username: str
    password: str


class LoginResponse(BaseModel):
    """Login response"""
    access_token: str
    token_type: str = "bearer"
    user_id: str
    username: str
    roles: List[str]


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    timestamp: str
    version: str
    system_health: Dict[str, Any]


# Dependency functions
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> User:
    """Validate JWT token and return current user"""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get('sub')
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        user = auth_manager.users.get(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


async def require_role(required_roles: List[str]):
    """Dependency to require specific roles"""
    async def check_role(user: User = Depends(get_current_user)):
        if not user.has_any_role(required_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires one of roles: {required_roles}"
            )
        return user
    return check_role


# Middleware for metrics and audit
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all API requests"""
    start_time = time.time()
    
    # Process request
    response = await call_next(request)
    
    # Calculate processing time
    processing_time = (time.time() - start_time) * 1000
    
    # Record metrics
    metrics_collector.increment_counter('api_requests_total')
    metrics_collector.record_metric('api_request_duration_ms', processing_time)
    
    # Add headers
    response.headers['X-Process-Time'] = f"{processing_time:.2f}ms"
    
    return response


# API Endpoints

@app.get("/", tags=["General"])
async def root():
    """Root endpoint"""
    return {
        "message": "Fraud Detection System API",
        "version": "1.0.0",
        "documentation": "/docs"
    }


@app.get("/health", tags=["General"])
async def health_check():
    """Health check — backed by persistent DB stats"""
    stats = db.get_transaction_stats(days=9999)
    total = stats["total_transactions"]
    fraud = stats["fraud_detected"]
    fraud_rate = round(fraud / total * 100, 2) if total > 0 else 0
    uptime_s = (datetime.utcnow() - _startup_time).total_seconds()
    hours = int(uptime_s // 3600)
    minutes = int((uptime_s % 3600) // 60)
    return {
        "status": "healthy",
        "total_predictions": total,
        "fraud_rate": fraud_rate,
        "uptime": f"{hours}h {minutes}m",
    }


@app.post("/auth/login", response_model=LoginResponse, tags=["Authentication"])
async def login(credentials: LoginRequest):
    """Authenticate user and create session"""
    user = auth_manager.authenticate(credentials.username, credentials.password)
    
    if not user:
        # Log failed attempt
        audit_logger.log_event(
            event_type=EventType.USER_LOGIN,
            user_id=credentials.username,
            status="failure"
        )
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    # Create JWT token
    payload = {
        'sub': user.user_id,
        'username': user.username,
        'roles': user.roles,
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
    }
    access_token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    # Persist login event
    db.update_last_login(user.user_id)
    db.save_audit_event("user_login", user_id=user.user_id, status="success")
    
    return LoginResponse(
        access_token=access_token,
        user_id=user.user_id,
        username=user.username,
        roles=user.roles
    )


@app.post("/auth/logout", tags=["Authentication"])
async def logout(user: User = Depends(get_current_user)):
    """Logout and revoke session"""
    # Revoke session (would need session_id in real implementation)
    audit_logger.log_event(
        event_type=EventType.USER_LOGOUT,
        user_id=user.user_id,
        status="success"
    )
    
    return {"message": "Logged out successfully"}


@app.post(
    "/detect/fraud",
    response_model=FraudDetectionResponse,
    tags=["Fraud Detection"]
)
async def detect_fraud(
    transaction_req: TransactionRequest,
    user: User = Depends(get_current_user)
):
    """
    Detect fraud in a transaction
    
    Requires authentication and 'fraud_detection:execute' permission
    """
    # Check permission
    if not authz_manager.check_permission(user, "fraud_detection", "execute"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    # Convert to Transaction object
    transaction = Transaction(
        transaction_id=transaction_req.transaction_id,
        user_id=transaction_req.user_id,
        merchant_id=transaction_req.merchant_id,
        amount=transaction_req.amount,
        currency=transaction_req.currency,
        timestamp=datetime.now(),
        transaction_type=transaction_req.transaction_type,
        channel=transaction_req.channel,
        ip_address=transaction_req.ip_address,
        country=transaction_req.country,
        city=transaction_req.city,
        device_id=transaction_req.device_id,
        device_type=transaction_req.device_type
    )
    
    # Get active model
    model = model_registry.get_model()
    
    if not model:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No model available"
        )
    
    # Create detector
    detector = RealTimeFraudDetector(model=model)
    
    # Detect fraud
    result = await detector.detect_fraud(transaction)
    
    # Persist transaction + result to DB (durable, atomic)
    db.save_transaction({
        "transaction_id": transaction.transaction_id,
        "user_id": transaction.user_id,
        "merchant_id": transaction.merchant_id,
        "amount": transaction.amount,
        "currency": transaction.currency,
        "transaction_type": transaction.transaction_type,
        "channel": transaction.channel,
        "country": transaction.country,
        "city": transaction.city,
        "fraud_score": result.fraud_score,
        "is_fraud": result.is_fraud,
        "risk_level": result.risk_level,
        "decision": result.decision,
        "model_version": result.model_version,
        "processing_time_ms": result.processing_time_ms,
        "risk_factors": result.top_risk_factors,
    })
    db.save_audit_event(
        "fraud_detection", user_id=user.user_id,
        resource=f"transaction_{transaction.transaction_id}",
        action="detect", status="success",
        metadata={"fraud_score": result.fraud_score, "decision": result.decision}
    )
    
    # Also keep in-memory metrics for Prometheus
    performance_monitor.record_prediction(
        fraud_score=result.fraud_score,
        is_fraud=result.is_fraud,
        processing_time_ms=result.processing_time_ms,
        model_version=result.model_version or "unknown"
    )
    
    return FraudDetectionResponse(
        transaction_id=result.transaction_id,
        fraud_score=result.fraud_score,
        is_fraud=result.is_fraud,
        risk_level=result.risk_level,
        decision=result.decision,
        top_risk_factors=result.top_risk_factors,
        processing_time_ms=result.processing_time_ms,
        model_version=result.model_version
    )


@app.get("/metrics", tags=["Monitoring"])
async def get_metrics(user: User = Depends(get_current_user)):
    """
    Get dashboard metrics — reads from persistent DB
    
    Requires 'reports:read' permission
    """
    if not authz_manager.check_permission(user, "reports", "read"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    return db.get_transaction_stats(days=30)


@app.get("/metrics/prometheus", tags=["Monitoring"])
async def get_prometheus_metrics():
    """
    Get metrics in Prometheus format
    
    Public endpoint for Prometheus scraping
    """
    return JSONResponse(
        content=metrics_collector.export_prometheus_format(),
        media_type="text/plain"
    )


@app.get("/audit/events", tags=["Compliance"])
async def get_audit_events(
    user_id: Optional[str] = None,
    event_type: Optional[str] = None,
    limit: int = 100,
    user: User = Depends(get_current_user)
):
    """
    Query audit events
    
    Requires 'audit:read' permission or admin role
    """
    if not user.has_role("admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required"
        )
    
    events = db.get_audit_events(
        limit=limit,
        user_id=user_id,
        event_type=event_type if event_type else None
    )
    
    return {
        "count": len(events),
        "events": events
    }


@app.get("/models", tags=["Models"])
async def list_models(user: User = Depends(get_current_user)):
    """
    List registered models
    
    Requires 'models:read' permission
    """
    if not authz_manager.check_permission(user, "models", "read"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    models = model_registry.list_models()
    
    return {
        "count": len(models),
        "models": models
    }


# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions"""
    metrics_collector.increment_counter('api_errors_total')
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.status_code,
                "message": exc.detail,
                "timestamp": datetime.now().isoformat()
            }
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle all other exceptions"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    metrics_collector.increment_counter('api_errors_total')
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": 500,
                "message": "Internal server error",
                "timestamp": datetime.now().isoformat()
            }
        }
    )


# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize system on startup"""
    logger.info("Starting Fraud Detection System API")
    
    # Initialize persistent database (ACID-compliant SQLite)
    db.init_db()
    global _startup_time
    _startup_time = datetime.utcnow()
    
    # Load trained models
    try:
        from pathlib import Path
        models_dir = Path("models")
        
        if models_dir.exists():
            # Load XGBoost model
            xgb_model = XGBoostFraudDetector(version="1.0.0")
            xgb_model.load_model(str(models_dir))
            model_registry.register_model(xgb_model, set_active=True)
            logger.info("Loaded XGBoost model")
            
            # Load Ensemble model
            ensemble_model = EnsembleFraudDetector(version="1.0.0")
            ensemble_model.load_model(str(models_dir))
            model_registry.register_model(ensemble_model)
            logger.info("Loaded Ensemble model")
            
            logger.info(f"Models loaded: {len(model_registry.list_models())}")
        else:
            logger.warning("No models directory found. Run initialization script first.")
    except Exception as e:
        logger.error(f"Error loading models: {e}")
    
    # Register default users (persisted to DB + in-memory auth)
    from passlib.context import CryptContext
    _pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
    for user_cfg in [
        {"user_id": "admin_user", "username": "admin", "email": "admin@example.com", "password": "admin123", "roles": ["admin", "analyst"]},
        {"user_id": "demo_user", "username": "demo", "email": "demo@example.com", "password": "demo123", "roles": ["analyst"]},
    ]:
        try:
            auth_manager.register_user(**user_cfg)
            # Also persist to DB for durability
            db.upsert_user(
                user_cfg["user_id"], user_cfg["username"], user_cfg["email"],
                _pwd.hash(user_cfg["password"]), user_cfg["roles"]
            )
            logger.info(f"User created: {user_cfg['username']}")
        except ValueError:
            logger.info(f"User already exists: {user_cfg['username']}")
        except Exception as e:
            logger.error(f"Failed to create user {user_cfg['username']}: {type(e).__name__}: {e}")
    
    # Log startup
    audit_logger.log_event(
        event_type=EventType.SYSTEM_ERROR,  # Using as generic system event
        user_id="system",
        action="startup",
        status="success"
    )


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down Fraud Detection System API")
    
    # Log shutdown
    audit_logger.log_event(
        event_type=EventType.SYSTEM_ERROR,  # Using as generic system event
        user_id="system",
        action="shutdown",
        status="success"
    )


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
