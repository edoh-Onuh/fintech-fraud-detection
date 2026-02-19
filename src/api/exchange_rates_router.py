"""
Exchange Rates Router — FastAPI endpoints exposing Frankfurter data to the frontend.
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, Optional, List
from . import exchange_rates as fx

router = APIRouter(prefix="/exchange-rates", tags=["Exchange Rates"])


class ConvertRequest(BaseModel):
    amount: float = Field(..., gt=0)
    from_currency: str = Field(default="GBP")
    to_currency: str = Field(default="USD")


class ConvertResponse(BaseModel):
    amount: float
    from_currency: str
    to_currency: str
    rate: float
    converted_amount: float


class RatesResponse(BaseModel):
    base: str
    rates: Dict[str, float]


# ─── Endpoints ───────────────────────────────────────────────────────

@router.get("/latest", response_model=RatesResponse)
async def latest_rates(base: str = Query("GBP", description="Base currency code")):
    """Get latest exchange rates from ECB via Frankfurter."""
    rates = fx.get_latest_rates(base.upper())
    if rates is None:
        raise HTTPException(status_code=502, detail="Exchange rate service unavailable")
    return RatesResponse(base=base.upper(), rates=rates)


@router.get("/currencies")
async def supported_currencies():
    """List all supported currency codes + names."""
    currencies = fx.get_supported_currencies()
    if currencies is None:
        raise HTTPException(status_code=502, detail="Exchange rate service unavailable")
    return currencies


@router.post("/convert", response_model=ConvertResponse)
async def convert_currency(req: ConvertRequest):
    """Convert an amount between currencies."""
    rate = fx.get_rate(req.from_currency, req.to_currency)
    if rate is None:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot get rate for {req.from_currency} → {req.to_currency}"
        )
    converted = round(req.amount * rate, 2)
    return ConvertResponse(
        amount=req.amount,
        from_currency=req.from_currency.upper(),
        to_currency=req.to_currency.upper(),
        rate=round(rate, 6),
        converted_amount=converted,
    )


@router.get("/historical")
async def historical_rates(
    base: str = Query("GBP"),
    start_date: str = Query("", description="YYYY-MM-DD"),
    end_date: str = Query("", description="YYYY-MM-DD"),
    symbols: str = Query("USD,EUR,NGN", description="Comma-separated currency codes"),
):
    """Get historical exchange rate time series."""
    symbol_list = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    data = fx.get_historical_rates(base.upper(), start_date, end_date, symbol_list)
    if data is None:
        raise HTTPException(status_code=502, detail="Exchange rate service unavailable")
    return data
