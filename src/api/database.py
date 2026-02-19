"""
SQLite Database Layer — ACID-compliant persistent storage for JED 24
Uses WAL mode for concurrent read/write, transactions for atomicity.
"""
import sqlite3
import json
import os
import threading
import logging
from datetime import datetime, timedelta
from contextlib import contextmanager
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

DB_PATH = os.environ.get("JED24_DB_PATH", "jed24.db")

_local = threading.local()


def get_connection() -> sqlite3.Connection:
    """Thread-local connection with WAL mode for isolation + concurrency."""
    if not hasattr(_local, "conn") or _local.conn is None:
        _local.conn = sqlite3.connect(DB_PATH, timeout=10)
        _local.conn.row_factory = sqlite3.Row
        _local.conn.execute("PRAGMA journal_mode=WAL")
        _local.conn.execute("PRAGMA foreign_keys=ON")
        _local.conn.execute("PRAGMA busy_timeout=5000")
    return _local.conn


@contextmanager
def atomic():
    """Context manager guaranteeing atomicity — auto commit/rollback."""
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise


def init_db():
    """Create all tables if they don't exist (idempotent)."""
    conn = get_connection()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            user_id     TEXT PRIMARY KEY,
            username    TEXT UNIQUE NOT NULL,
            email       TEXT NOT NULL,
            hashed_pw   TEXT NOT NULL,
            roles       TEXT NOT NULL DEFAULT '[]',
            is_active   INTEGER NOT NULL DEFAULT 1,
            created_at  TEXT NOT NULL DEFAULT (datetime('now')),
            last_login  TEXT
        );

        CREATE TABLE IF NOT EXISTS transactions (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            transaction_id  TEXT UNIQUE NOT NULL,
            user_id         TEXT NOT NULL,
            merchant_id     TEXT,
            amount          REAL NOT NULL,
            currency        TEXT NOT NULL DEFAULT 'GBP',
            transaction_type TEXT,
            channel         TEXT,
            country         TEXT,
            city            TEXT,
            fraud_score     REAL,
            is_fraud        INTEGER,
            risk_level      TEXT,
            decision        TEXT,
            model_version   TEXT,
            processing_time_ms REAL,
            risk_factors    TEXT DEFAULT '[]',
            created_at      TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS audit_events (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type  TEXT NOT NULL,
            user_id     TEXT,
            resource    TEXT,
            action      TEXT,
            status      TEXT,
            metadata    TEXT DEFAULT '{}',
            created_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS metrics_snapshots (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            metric_name TEXT NOT NULL,
            value       REAL NOT NULL,
            created_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_tx_created   ON transactions(created_at);
        CREATE INDEX IF NOT EXISTS idx_tx_fraud      ON transactions(is_fraud);
        CREATE INDEX IF NOT EXISTS idx_tx_country    ON transactions(country);
        CREATE INDEX IF NOT EXISTS idx_tx_channel    ON transactions(channel);
        CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_events(created_at);
        CREATE INDEX IF NOT EXISTS idx_audit_type    ON audit_events(event_type);
        CREATE INDEX IF NOT EXISTS idx_metrics_name  ON metrics_snapshots(metric_name, created_at);
    """)
    conn.commit()
    logger.info(f"Database initialized at {DB_PATH}")


# ─── User persistence ───────────────────────────────────────────────

def upsert_user(user_id: str, username: str, email: str,
                hashed_pw: str, roles: List[str]) -> bool:
    """Insert or ignore user. Returns True if inserted."""
    with atomic() as conn:
        cur = conn.execute(
            """INSERT OR IGNORE INTO users
               (user_id, username, email, hashed_pw, roles)
               VALUES (?, ?, ?, ?, ?)""",
            (user_id, username, email, hashed_pw, json.dumps(roles))
        )
        return cur.rowcount > 0


def get_user(username: str) -> Optional[Dict]:
    conn = get_connection()
    row = conn.execute(
        "SELECT * FROM users WHERE username = ?", (username,)
    ).fetchone()
    if row:
        d = dict(row)
        d["roles"] = json.loads(d["roles"])
        return d
    return None


def get_user_by_id(user_id: str) -> Optional[Dict]:
    conn = get_connection()
    row = conn.execute(
        "SELECT * FROM users WHERE user_id = ?", (user_id,)
    ).fetchone()
    if row:
        d = dict(row)
        d["roles"] = json.loads(d["roles"])
        return d
    return None


def update_last_login(user_id: str):
    with atomic() as conn:
        conn.execute(
            "UPDATE users SET last_login = ? WHERE user_id = ?",
            (datetime.utcnow().isoformat(), user_id)
        )


# ─── Transaction persistence ────────────────────────────────────────

def save_transaction(tx: Dict):
    """Persist a fraud-scored transaction atomically."""
    with atomic() as conn:
        conn.execute(
            """INSERT OR REPLACE INTO transactions
               (transaction_id, user_id, merchant_id, amount, currency,
                transaction_type, channel, country, city,
                fraud_score, is_fraud, risk_level, decision,
                model_version, processing_time_ms, risk_factors)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                tx["transaction_id"], tx["user_id"], tx.get("merchant_id"),
                tx["amount"], tx.get("currency", "GBP"),
                tx.get("transaction_type"), tx.get("channel"),
                tx.get("country"), tx.get("city"),
                tx.get("fraud_score"), int(tx.get("is_fraud", 0)),
                tx.get("risk_level"), tx.get("decision"),
                tx.get("model_version"), tx.get("processing_time_ms"),
                json.dumps(tx.get("risk_factors", []))
            )
        )


def get_transaction_stats(days: int = 30) -> Dict:
    """Aggregate transaction stats for /metrics."""
    conn = get_connection()
    since = (datetime.utcnow() - timedelta(days=days)).isoformat()
    row = conn.execute("""
        SELECT
            COUNT(*)                         AS total,
            COALESCE(SUM(is_fraud), 0)       AS fraud_count,
            COALESCE(AVG(fraud_score), 0)    AS avg_score,
            COALESCE(AVG(processing_time_ms), 0) AS avg_rt
        FROM transactions WHERE created_at >= ?
    """, (since,)).fetchone()
    total = row["total"] or 0
    fraud = row["fraud_count"] or 0
    return {
        "total_transactions": total,
        "fraud_detected": fraud,
        "approval_rate": round((1 - fraud / total) * 100, 2) if total > 0 else 0,
        "avg_response_time": round(row["avg_rt"] or 0, 1),
    }


def get_risk_trends(days: int = 30) -> List[Dict]:
    """Real risk trends from stored transactions."""
    conn = get_connection()
    since = (datetime.utcnow() - timedelta(days=days)).isoformat()
    rows = conn.execute("""
        SELECT
            DATE(created_at)                   AS date,
            COUNT(CASE WHEN is_fraud=1 THEN 1 END) AS fraud_count,
            COALESCE(AVG(fraud_score), 0)      AS avg_risk_score,
            COALESCE(SUM(amount), 0)           AS total_amount,
            CASE WHEN COUNT(*)>0
                 THEN ROUND(100.0 * COUNT(CASE WHEN decision IN ('approve','APPROVED') THEN 1 END) / COUNT(*), 1)
                 ELSE 0 END                    AS prevention_rate
        FROM transactions
        WHERE created_at >= ?
        GROUP BY DATE(created_at)
        ORDER BY date
    """, (since,)).fetchall()
    return [dict(r) for r in rows]


def get_geographic_insights() -> List[Dict]:
    """Real geographic fraud distribution from stored transactions."""
    conn = get_connection()
    rows = conn.execute("""
        SELECT
            COALESCE(country, 'Unknown') AS region,
            COUNT(CASE WHEN is_fraud=1 THEN 1 END)  AS fraud_count,
            COUNT(CASE WHEN is_fraud=0 THEN 1 END)  AS legitimate_count,
            CASE WHEN COUNT(*)>0
                 THEN ROUND(100.0 * COUNT(CASE WHEN is_fraud=1 THEN 1 END) / COUNT(*), 2)
                 ELSE 0 END AS fraud_rate,
            COALESCE(SUM(amount), 0) AS total_amount
        FROM transactions
        GROUP BY COALESCE(country, 'Unknown')
        ORDER BY fraud_count DESC
    """).fetchall()
    return [dict(r) for r in rows]


def get_fraud_patterns(days: int = 7) -> List[Dict]:
    """Derive fraud patterns from real transaction clusters."""
    conn = get_connection()
    since = (datetime.utcnow() - timedelta(days=days)).isoformat()

    patterns = []

    # Pattern 1 — velocity spikes: users with 3+ transactions in a day
    velocity = conn.execute("""
        SELECT user_id, COUNT(*) AS cnt, SUM(amount) AS total,
               MAX(fraud_score) AS max_score
        FROM transactions
        WHERE created_at >= ? AND is_fraud = 1
        GROUP BY user_id, DATE(created_at)
        HAVING cnt >= 3
    """, (since,)).fetchall()
    if velocity:
        occ = len(velocity)
        impact = sum(r["total"] for r in velocity)
        patterns.append({
            "pattern_id": "VEL_001",
            "name": "Velocity Spike Attack",
            "confidence": 0.94,
            "severity": "critical",
            "occurrences": occ,
            "impact_amount": round(impact, 2),
            "indicators": [
                f"{occ} users with 3+ fraudulent transactions in a single day",
                "Burst pattern indicates automated attack",
            ],
            "affected_accounts": occ,
        })

    # Pattern 2 — high-value fraud: individual tx > £500 flagged as fraud
    high_val = conn.execute("""
        SELECT COUNT(*) AS cnt, SUM(amount) AS total
        FROM transactions
        WHERE created_at >= ? AND is_fraud = 1 AND amount > 500
    """, (since,)).fetchone()
    if high_val and high_val["cnt"] > 0:
        patterns.append({
            "pattern_id": "HVF_002",
            "name": "High-Value Fraud Cluster",
            "confidence": 0.91,
            "severity": "high",
            "occurrences": high_val["cnt"],
            "impact_amount": round(high_val["total"], 2),
            "indicators": [
                f"{high_val['cnt']} transactions over £500 flagged as fraud",
                "Average fraud amount indicates account takeover risk",
            ],
            "affected_accounts": high_val["cnt"],
        })

    # Pattern 3 — channel anomalies: fraud rate per channel
    channel_fraud = conn.execute("""
        SELECT channel, COUNT(*) AS cnt,
               COUNT(CASE WHEN is_fraud=1 THEN 1 END) AS fraud_cnt,
               SUM(CASE WHEN is_fraud=1 THEN amount ELSE 0 END) AS fraud_amount
        FROM transactions
        WHERE created_at >= ? AND channel IS NOT NULL
        GROUP BY channel
        HAVING fraud_cnt > 0
        ORDER BY fraud_cnt DESC
        LIMIT 3
    """, (since,)).fetchall()
    for ch in channel_fraud:
        rate = round(100 * ch["fraud_cnt"] / ch["cnt"], 1)
        patterns.append({
            "pattern_id": f"CHN_{ch['channel'][:3].upper()}",
            "name": f"{ch['channel'].title()} Channel Anomaly",
            "confidence": min(0.70 + rate / 200, 0.99),
            "severity": "high" if rate > 10 else "medium",
            "occurrences": ch["fraud_cnt"],
            "impact_amount": round(ch["fraud_amount"], 2),
            "indicators": [
                f"{rate}% fraud rate on {ch['channel']} channel",
                f"{ch['fraud_cnt']} of {ch['cnt']} transactions flagged",
            ],
            "affected_accounts": ch["fraud_cnt"],
        })

    return patterns


def get_business_impact(days: int = 30) -> Dict:
    """Real business impact from stored transactions."""
    conn = get_connection()
    since = (datetime.utcnow() - timedelta(days=days)).isoformat()
    row = conn.execute("""
        SELECT
            COUNT(CASE WHEN is_fraud=1 THEN 1 END)  AS fraud_prevented,
            COALESCE(SUM(CASE WHEN is_fraud=1 THEN amount ELSE 0 END), 0) AS amount_saved,
            COUNT(CASE WHEN is_fraud=0 AND fraud_score > 0.4 THEN 1 END)  AS false_positives,
            COUNT(CASE WHEN decision IN ('approve','APPROVED') THEN 1 END) AS approved_count,
            COUNT(*) AS total
        FROM transactions WHERE created_at >= ?
    """, (since,)).fetchone()

    fraud_prevented = row["fraud_prevented"] or 0
    amount_saved = row["amount_saved"] or 0
    fp_cost = (row["false_positives"] or 0) * 50  # estimated £50 review cost per FP
    net = amount_saved - fp_cost
    total = row["total"] or 0

    return {
        "period_days": days,
        "fraud_prevented": fraud_prevented,
        "amount_saved": round(amount_saved, 2),
        "false_positive_cost": round(fp_cost, 2),
        "net_savings": round(net, 2),
        "roi_percentage": round((net / max(fp_cost, 1)) * 100, 1),
        "processing_cost": round(fp_cost, 2),
        "chargeback_prevented": fraud_prevented,
        "customer_trust_score": round(
            min(99, 80 + (20 * (1 - fraud_prevented / max(total, 1)))), 1
        ) if total > 0 else 0,
    }


def get_recommendations() -> List[Dict]:
    """Data-driven recommendations from real transaction patterns."""
    conn = get_connection()
    recs: List[Dict] = []

    # Recommendation based on recent fraud volume
    recent = conn.execute("""
        SELECT COUNT(*) AS cnt FROM transactions
        WHERE is_fraud=1 AND created_at >= datetime('now', '-1 day')
    """).fetchone()
    if recent and recent["cnt"] > 0:
        recs.append({
            "id": "REC_DYN_001",
            "priority": "critical",
            "category": "Security",
            "title": f"{recent['cnt']} Fraud Alerts in Last 24h",
            "description": f"Detected {recent['cnt']} fraudulent transactions in the past day. Immediate review recommended.",
            "action": "Review Transactions",
            "confidence": 95,
        })

    # Recommendation based on high-risk channel
    ch = conn.execute("""
        SELECT channel, COUNT(*) AS fraud_cnt
        FROM transactions WHERE is_fraud=1 AND channel IS NOT NULL
        GROUP BY channel ORDER BY fraud_cnt DESC LIMIT 1
    """).fetchone()
    if ch and ch["fraud_cnt"] > 0:
        recs.append({
            "id": "REC_DYN_002",
            "priority": "high",
            "category": "Transaction Pattern",
            "title": f"High Fraud on {ch['channel'].title()} Channel",
            "description": f"{ch['fraud_cnt']} fraudulent transactions detected on {ch['channel']} channel.",
            "action": "Apply Limits",
            "confidence": 87,
        })

    # Recommendation based on geographic concentration
    geo = conn.execute("""
        SELECT country, COUNT(*) AS fraud_cnt
        FROM transactions WHERE is_fraud=1 AND country IS NOT NULL
        GROUP BY country ORDER BY fraud_cnt DESC LIMIT 1
    """).fetchone()
    if geo and geo["fraud_cnt"] > 0:
        recs.append({
            "id": "REC_DYN_003",
            "priority": "high",
            "category": "Geographic Risk",
            "title": f"Fraud Cluster in {geo['country']}",
            "description": f"{geo['fraud_cnt']} fraudulent transactions originating from {geo['country']}.",
            "action": "Geo Restrict",
            "confidence": 82,
        })

    # If no data yet, return a system recommendation
    if not recs:
        recs.append({
            "id": "REC_SYS_001",
            "priority": "medium",
            "category": "System",
            "title": "Start Scanning Transactions",
            "description": "No transaction data yet. Use the Transaction Monitor to score transactions and build analytics.",
            "action": "Scan Now",
            "confidence": 100,
        })

    return recs


# ─── Audit persistence ──────────────────────────────────────────────

def save_audit_event(event_type: str, user_id: Optional[str] = None,
                     resource: Optional[str] = None, action: Optional[str] = None,
                     status: Optional[str] = None, metadata: Optional[Dict] = None):
    with atomic() as conn:
        conn.execute(
            """INSERT INTO audit_events
               (event_type, user_id, resource, action, status, metadata)
               VALUES (?,?,?,?,?,?)""",
            (event_type, user_id, resource, action, status,
             json.dumps(metadata or {}))
        )


def get_audit_events(limit: int = 100, user_id: Optional[str] = None,
                     event_type: Optional[str] = None) -> List[Dict]:
    conn = get_connection()
    q = "SELECT * FROM audit_events WHERE 1=1"
    params: list = []
    if user_id:
        q += " AND user_id = ?"
        params.append(user_id)
    if event_type:
        q += " AND event_type = ?"
        params.append(event_type)
    q += " ORDER BY created_at DESC LIMIT ?"
    params.append(limit)
    return [dict(r) for r in conn.execute(q, params).fetchall()]


# ─── Metrics persistence ────────────────────────────────────────────

def save_metric(name: str, value: float):
    with atomic() as conn:
        conn.execute(
            "INSERT INTO metrics_snapshots (metric_name, value) VALUES (?,?)",
            (name, value)
        )
