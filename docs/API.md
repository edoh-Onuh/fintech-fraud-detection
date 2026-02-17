# API Reference

## Base URL
```
http://localhost:8000
```

## Authentication

All protected endpoints require Bearer token authentication:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/endpoint
```

---

## Endpoints

### Authentication

#### POST /auth/login
Authenticate user and obtain access token.

**Request Body:**
```json
{
  "username": "demo",
  "password": "demo123"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhb...",
  "token_type": "bearer",
  "user_id": "demo_user",
  "username": "demo",
  "roles": ["analyst"]
}
```

#### POST /auth/logout
Logout and invalidate token.

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

---

### Fraud Detection

#### POST /detect/fraud
Detect fraud in a transaction.

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "transaction_id": "txn_123456",
  "user_id": "user_789",
  "merchant_id": "merchant_abc",
  "amount": 150.00,
  "currency": "GBP",
  "transaction_type": "purchase",
  "channel": "online",
  "ip_address": "192.168.1.1",
  "country": "UK",
  "device_id": "device_xyz"
}
```

**Response:**
```json
{
  "transaction_id": "txn_123456",
  "fraud_score": 0.234,
  "is_fraud": false,
  "risk_level": "low",
  "decision": "approve",
  "top_risk_factors": [
    {
      "feature": "amount",
      "contribution": 0.05
    },
    {
      "feature": "time_since_last_transaction",
      "contribution": -0.02
    }
  ],
  "processing_time_ms": 45.23,
  "model_version": "XGBoostFraudDetector_1.0.0"
}
```

**Decision Logic:**
- `fraud_score >= 0.9` → `decision: decline` (high risk)
- `0.5 <= fraud_score < 0.9` → `decision: review` (medium risk)
- `fraud_score < 0.5` → `decision: approve` (low risk)

---

### Monitoring

#### GET /health
System health check.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-31T10:30:00Z",
  "version": "1.0.0",
  "system_health": {
    "total_predictions": 15234,
    "fraud_detected": 305,
    "fraud_rate": 0.02,
    "processing_time_stats": {
      "mean": 42.5,
      "p99": 95.3
    },
    "status": "healthy"
  }
}
```

#### GET /metrics
Get system metrics (requires authentication).

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "metrics": {
    "counters": {
      "predictions_total": 15234,
      "fraud_detected_total": 305,
      "api_requests_total": 18500
    },
    "gauges": {
      "model_accuracy": 0.975,
      "model_precision": 0.962,
      "model_recall": 0.942
    }
  },
  "system_health": { /* Same as /health */ }
}
```

#### GET /metrics/prometheus
Prometheus-compatible metrics endpoint (public).

**Response:**
```
# TYPE predictions_total counter
predictions_total 15234
# TYPE fraud_detected_total counter
fraud_detected_total 305
# TYPE model_accuracy gauge
model_accuracy 0.975
```

---

### Compliance

#### GET /audit/events
Query audit events (admin only).

**Headers:**
```
Authorization: Bearer ADMIN_TOKEN
```

**Query Parameters:**
- `user_id` (optional): Filter by user
- `event_type` (optional): Filter by event type
- `limit` (optional, default=100): Maximum events to return

**Response:**
```json
{
  "count": 10,
  "events": [
    {
      "event_id": "a1b2c3d4",
      "event_type": "fraud_detection",
      "user_id": "user_123",
      "timestamp": "2026-01-31T10:25:00Z",
      "resource": "transaction_txn_123",
      "action": "detect",
      "status": "success",
      "metadata": {
        "fraud_score": 0.234,
        "decision": "approve"
      }
    }
  ]
}
```

**Event Types:**
- `user_login`
- `user_logout`
- `fraud_detection`
- `model_prediction`
- `data_access`
- `config_change`

---

### Models

#### GET /models
List registered models (requires authentication).

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "count": 2,
  "models": [
    {
      "key": "XGBoostFraudDetector_1.0.0",
      "is_active": true,
      "model_name": "XGBoostFraudDetector",
      "version": "1.0.0",
      "is_trained": true,
      "feature_count": 35,
      "metadata": {
        "accuracy": 0.975,
        "auc_roc": 0.982,
        "training_samples": 8000
      }
    }
  ]
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": {
    "code": 401,
    "message": "Invalid or expired token",
    "timestamp": "2026-01-31T10:30:00Z"
  }
}
```

### 403 Forbidden
```json
{
  "error": {
    "code": 403,
    "message": "Insufficient permissions",
    "timestamp": "2026-01-31T10:30:00Z"
  }
}
```

### 404 Not Found
```json
{
  "error": {
    "code": 404,
    "message": "Resource not found",
    "timestamp": "2026-01-31T10:30:00Z"
  }
}
```

### 500 Internal Server Error
```json
{
  "error": {
    "code": 500,
    "message": "Internal server error",
    "timestamp": "2026-01-31T10:30:00Z"
  }
}
```

---

## Rate Limiting

- **Default**: 100 requests/minute per IP
- **Burst**: 5000 requests/hour per IP
- Headers returned:
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Time until limit reset

---

## Interactive Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## Examples

### Python Example
```python
import requests

# Login
response = requests.post(
    "http://localhost:8000/auth/login",
    json={"username": "demo", "password": "demo123"}
)
token = response.json()["access_token"]

# Detect fraud
response = requests.post(
    "http://localhost:8000/detect/fraud",
    headers={"Authorization": f"Bearer {token}"},
    json={
        "transaction_id": "txn_001",
        "user_id": "user_001",
        "merchant_id": "merchant_001",
        "amount": 150.0,
        "currency": "USD",
        "transaction_type": "purchase",
        "channel": "online"
    }
)
result = response.json()
print(f"Fraud Score: {result['fraud_score']}")
```

### cURL Example
```bash
# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "demo", "password": "demo123"}'

# Detect fraud
curl -X POST http://localhost:8000/detect/fraud \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "txn_001",
    "user_id": "user_001",
    "merchant_id": "merchant_001",
    "amount": 150.0,
    "currency": "USD",
    "transaction_type": "purchase",
    "channel": "online"
  }'
```
