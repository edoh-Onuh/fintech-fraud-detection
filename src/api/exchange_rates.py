"""
Exchange Rate Service — Frankfurter API integration for JED 24
Free, open-source, no API key required.
Source: European Central Bank via https://frankfurter.dev
"""
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, Optional, List
import urllib.request
import json

logger = logging.getLogger(__name__)

FRANKFURTER_BASE = "https://api.frankfurter.dev/v1"

# In-memory cache: { "GBP": { rates: {...}, fetched_at: timestamp } }
_cache: Dict[str, dict] = {}
CACHE_TTL_SECONDS = 3600  # 1 hour (ECB updates once/day ~16:00 CET)


def _fetch_json(url: str, timeout: int = 10) -> Optional[dict]:
    """Fetch JSON from URL using stdlib (no extra deps)."""
    try:
        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        logger.warning(f"Exchange rate fetch failed: {e}")
        return None


def get_latest_rates(base: str = "GBP") -> Optional[Dict[str, float]]:
    """
    Get latest exchange rates for a base currency.
    Returns dict like {"USD": 1.27, "EUR": 1.18, ...} or None on failure.
    Cached for 1 hour.
    """
    base = base.upper()
    cached = _cache.get(base)
    if cached and (time.time() - cached["fetched_at"]) < CACHE_TTL_SECONDS:
        return cached["rates"]

    data = _fetch_json(f"{FRANKFURTER_BASE}/latest?base={base}")
    if data and "rates" in data:
        _cache[base] = {"rates": data["rates"], "fetched_at": time.time()}
        logger.info(f"Fetched {len(data['rates'])} exchange rates for {base}")
        return data["rates"]
    return cached["rates"] if cached else None


def convert_amount(amount: float, from_currency: str, to_currency: str) -> Optional[float]:
    """Convert an amount between currencies using latest rates."""
    from_currency = from_currency.upper()
    to_currency = to_currency.upper()
    if from_currency == to_currency:
        return amount

    rates = get_latest_rates(from_currency)
    if rates and to_currency in rates:
        return round(amount * rates[to_currency], 2)
    return None


def get_rate(from_currency: str, to_currency: str) -> Optional[float]:
    """Get single exchange rate."""
    from_currency = from_currency.upper()
    to_currency = to_currency.upper()
    if from_currency == to_currency:
        return 1.0
    rates = get_latest_rates(from_currency)
    if rates and to_currency in rates:
        return rates[to_currency]
    return None


def get_historical_rates(
    base: str = "GBP",
    start_date: str = "",
    end_date: str = "",
    symbols: Optional[List[str]] = None,
) -> Optional[dict]:
    """
    Get historical exchange rate time series.
    Dates in YYYY-MM-DD format. Returns { "rates": { "2024-01-01": { "USD": 1.27 }, ... } }
    """
    base = base.upper()
    if not start_date:
        start_date = (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d")
    if not end_date:
        end_date = datetime.utcnow().strftime("%Y-%m-%d")

    url = f"{FRANKFURTER_BASE}/{start_date}..{end_date}?base={base}"
    if symbols:
        url += f"&symbols={','.join(s.upper() for s in symbols)}"

    data = _fetch_json(url, timeout=15)
    if data and "rates" in data:
        return data
    return None


def get_supported_currencies() -> Optional[Dict[str, str]]:
    """Get supported currency codes and full names."""
    data = _fetch_json(f"{FRANKFURTER_BASE}/currencies")
    return data  # { "AUD": "Australian Dollar", ... }
