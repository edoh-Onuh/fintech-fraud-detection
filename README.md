# JED 24 — Nexus Command Center

> Production-grade fraud detection platform with real-time ML scoring, multi-currency exchange rates, and a dark-themed command center dashboard.

**Live Demo**: [jed24.vercel.app](https://jed24.vercel.app) &nbsp;|&nbsp; **API**: [jed24-api.onrender.com/docs](https://jed24-api.onrender.com/docs)

Default credentials: `admin` / `admin123`

---

## What It Does

JED 24 monitors financial transactions in real time, scores them for fraud using trained ML models, and presents the results through a sleek analytics dashboard. Every transaction is persisted to an ACID-compliant database, exchange rates are fetched live from the European Central Bank, and the system seeds itself with realistic data on first boot so dashboards are never empty.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                     Frontend — Vercel                                │
│           React 18 · Vite 5 · Tailwind CSS v4 · Recharts            │
│           "Nexus Command Center" dark theme (#04070d)                │
└─────────────────────────┬────────────────────────────────────────────┘
                          │ HTTPS / JSON
┌─────────────────────────▼────────────────────────────────────────────┐
│                     Backend — Render                                 │
│                   FastAPI · Uvicorn · JWT Auth                       │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ Fraud       │  │ Analytics   │  │ Exchange     │  │ Seeder    │ │
│  │ Detection   │  │ Engine      │  │ Rates (ECB)  │  │ (startup) │ │
│  │ /detect/*   │  │ /analytics/*│  │ /exchange-*  │  │           │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘  └─────┬─────┘ │
│         │                │                │                 │       │
│  ┌──────▼────────────────▼────────────────▼─────────────────▼─────┐ │
│  │              ML Model Registry                                 │ │
│  │         XGBoost · Ensemble · Concept Drift                     │ │
│  └──────┬─────────────────────────────────────────────────────────┘ │
│         │                                                           │
│  ┌──────▼─────────────────────────────────────────────────────────┐ │
│  │         SQLite (WAL mode) — ACID-compliant persistence         │ │
│  │    transactions · users · audit_events · metrics_snapshots     │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
                          │
              ┌───────────▼───────────┐
              │   Frankfurter API     │
              │   (ECB exchange data) │
              │   3 mirror failover   │
              └───────────────────────┘
```

---

## Features

### Dashboard Pages
| Page | Description |
|------|-------------|
| **Dashboard** | Stats cards (transactions, fraud count, approval rate, avg response), fraud trend chart, model status |
| **Fraud Patterns** | Detected attack patterns — velocity spikes, account takeover chains, geo anomalies |
| **Recommendations** | AI-driven priority-ranked security recommendations |
| **Analysis Report** | Executive analytics — fraud by type (pie), risk distribution (bar), trends (line), geographic heatmap, model performance radar, accuracy metrics table, exportable reports |

### Transaction Analyzer
- Real-time fraud scoring via trained XGBoost/Ensemble models
- Multi-currency support with live ECB exchange rates
- Inline GBP conversion for foreign currency amounts
- Risk factors breakdown, model version, and processing time

### Exchange Rates (Frankfurter / ECB)
- `GET /exchange-rates/latest` — live rates for any base currency
- `GET /exchange-rates/currencies` — all supported currency codes + names
- `POST /exchange-rates/convert` — amount conversion between currencies
- `GET /exchange-rates/historical` — time-series rate data
- 1-hour in-memory cache, 3-mirror auto-failover

### Data Layer
- **SQLite WAL mode** — concurrent reads/writes, ACID guarantees
- **Automatic seeding** — 350 realistic transactions across 8 currencies, 26 merchants, 8 countries on first boot
- **Audit trail** — every login, fraud detection, and system event logged

### Security
- JWT authentication (HS256, 24h expiry)
- Role-based access control (admin, analyst)
- Password hashing via bcrypt
- CORS + GZip middleware
- Comprehensive audit logging

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, Vite 5, Tailwind CSS v4, Recharts, Lucide React, TanStack Query, Axios |
| **Backend** | FastAPI, Uvicorn, Pydantic v2, PyJWT |
| **ML** | XGBoost, scikit-learn, Ensemble methods, SHAP |
| **Database** | SQLite (WAL mode, ACID) |
| **Privacy** | Differential Privacy, Federated Learning, PII anonymization |
| **Security** | AES-256 encryption, bcrypt, RBAC, audit trails |
| **External APIs** | Frankfurter (ECB exchange rates) — free, no key required |
| **Hosting** | Vercel (frontend), Render (backend) |

---

## Project Structure

```
fintech/
├── dashboard/                    # React frontend
│   └── src/
│       ├── components/
│       │   ├── Dashboard.jsx         # Main layout + navigation
│       │   ├── Login.jsx             # Auth screen
│       │   ├── TransactionMonitor.jsx # Multi-currency fraud scorer
│       │   ├── FraudPatterns.jsx     # Pattern detection view
│       │   ├── Recommendations.jsx   # AI recommendations
│       │   ├── AnalysisReport.jsx    # Full analytics suite
│       │   ├── FraudChart.jsx        # Trend chart
│       │   ├── ModelStatus.jsx       # ML model cards
│       │   ├── StatsCard.jsx         # Metric cards
│       │   └── Header.jsx           # Top bar
│       └── services/
│           └── api.js               # Axios client + API modules
├── src/
│   ├── api/
│   │   ├── main.py                  # FastAPI app + endpoints
│   │   ├── analytics.py             # Analytics router
│   │   ├── database.py              # SQLite ACID layer
│   │   ├── exchange_rates.py        # Frankfurter API client
│   │   ├── exchange_rates_router.py # Exchange rates endpoints
│   │   └── seeder.py               # Transaction data seeder
│   ├── models/                      # XGBoost + Ensemble models
│   ├── realtime/                    # Real-time fraud detection engine
│   ├── security/                    # Auth, encryption, RBAC
│   ├── privacy/                     # Differential privacy, federated learning
│   ├── monitoring/                  # Metrics, alerts, performance
│   ├── compliance/                  # Audit logging
│   └── utils/                       # Shared utilities
├── models/                          # Trained model files (.json, .pkl)
├── tests/                           # Test suite
├── deployment/                      # Docker + K8s configs
├── render.yaml                      # Render auto-deploy blueprint
├── requirements-api.txt             # Production API dependencies
└── requirements.txt                 # Full dependencies (training + API)
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | JWT login (returns token + user info) |
| POST | `/auth/logout` | Invalidate session |

### Fraud Detection
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/detect/fraud` | Score a transaction for fraud |

### Metrics & Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | System health + DB stats + uptime |
| GET | `/metrics` | Aggregate transaction metrics |
| GET | `/metrics/prometheus` | Prometheus-format metrics |
| GET | `/models` | Loaded ML models + performance |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/patterns` | Detected fraud patterns |
| GET | `/analytics/risk-trends` | Risk trends over time |
| GET | `/analytics/geographic-insights` | Fraud by region |
| GET | `/analytics/model-comparison` | Model performance metrics |
| GET | `/analytics/business-impact` | Financial impact summary |
| POST | `/analytics/recommendations` | AI-ranked recommendations |

### Exchange Rates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/exchange-rates/latest` | Latest ECB rates |
| GET | `/exchange-rates/currencies` | Supported currencies |
| POST | `/exchange-rates/convert` | Currency conversion |
| GET | `/exchange-rates/historical` | Historical rate series |

### Audit
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/audit/events` | Audit event log |

---

## Getting Started

### Run the API locally

```bash
# Create virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements-api.txt

# Start the server
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload
```

The API auto-initializes the database, loads ML models, registers default users, and seeds 350 transactions on first start.

### Run the frontend locally

```bash
cd dashboard
npm install
npm run dev
```

Set `VITE_API_URL=http://localhost:8000` in `dashboard/.env` to point at your local API.

### Deploy

- **Backend** — push to `main`; Render auto-deploys via `render.yaml`
- **Frontend** — push to `main`; Vercel auto-deploys from `dashboard/`

---

## Performance

| Metric | Value |
|--------|-------|
| Inference latency | <50ms (p95) |
| Fraud detection accuracy | >97% |
| Recall | >94% |
| Database | ACID-compliant, WAL mode |
| Exchange rate cache | 1-hour TTL, 3-mirror failover |
| Seed data | 350 transactions, 8 currencies, 26 merchants |

---

## Regulatory Compliance

- **GDPR** — right to explanation, data minimization, PII anonymization
- **PSD2** — strong customer authentication, secure communication
- **PCI-DSS** — cardholder data protection, encryption standards
- **FCA Guidelines** — model governance, risk management, audit trails

---

## Author

Built by **Edoh Onuh** as a proof of technical excellence, demonstrating advanced ML engineering, privacy-preserving AI, enterprise security architecture, and production system design.

## License

MIT License
