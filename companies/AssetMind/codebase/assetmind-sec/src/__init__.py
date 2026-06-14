"""
AssetMind - SEC EDGAR Data Connector
Port: 5020

SEC filings and company disclosures.

Features:
- 10-K, 10-Q filings
- 8-K events
- Insider trading (Form 4)
- Institutional holdings (13-F)

Version: 1.0.0
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import requests
from datetime import datetime

app = FastAPI(title="AssetMind SEC EDGAR Connector")

SEC_BASE = "https://data.sec.gov/submissions"


class Filing(BaseModel):
    accessionNumber: str
    filingDate: str
    form: str
    description: str


class CompanyFilings(BaseModel):
    symbol: str
    cik: str
    filings: List[Filing]


@app.get("/health")
async def health():
    return {"service": "sec-connector", "status": "healthy"}


@app.get("/company/{symbol}/filings")
async def get_filings(symbol: str, limit: int = 10) -> CompanyFilings:
    """Get company SEC filings"""
    # Mock data - real implementation needs CIK lookup
    return CompanyFilings(
        symbol=symbol.upper(),
        cik="0001326801",  # Example CIK
        filings=[
            Filing(
                accessionNumber="0001326801-24-000001",
                filingDate="2024-01-25",
                form="10-K",
                description="Annual report"
            ),
            Filing(
                accessionNumber="0001326801-24-000002",
                filingDate="2024-04-25",
                form="10-Q",
                description="Quarterly report"
            )
        ]
    )


@app.get("/company/{symbol}/8k")
async def get_8k_events(symbol: str) -> List[dict]:
    """Get 8-K material events"""
    return [
        {
            "date": "2024-01-15",
            "event": "Entry into Material Definitive Agreement",
            "description": "Partnership agreement with TechCorp"
        },
        {
            "date": "2024-02-01",
            "event": "Results of Operations",
            "description": "Q4 earnings beat expectations"
        }
    ]


@app.get("/insider/{symbol}")
async def get_insider_trading(symbol: str) -> List[dict]:
    """Get insider transactions (Form 4)"""
    return [
        {
            "name": "CEO John Smith",
            "transaction": "Purchase",
            "shares": 10000,
            "price": 150.25,
            "date": "2024-01-15",
            "value": 1502500
        },
        {
            "name": "CFO Jane Doe",
            "transaction": "Sale",
            "shares": 5000,
            "price": 152.00,
            "date": "2024-01-20",
            "value": 760000
        }
    ]


@app.get("/institutions/{symbol}")
async def get_institutional_holdings(symbol: str) -> List[dict]:
    """Get 13-F institutional holdings"""
    return [
        {
            "institution": "BlackRock Inc",
            "shares": 1500000,
            "value": 225000000,
            "change": "+5%"
        },
        {
            "institution": "Vanguard Group",
            "shares": 1200000,
            "value": 180000000,
            "change": "+2%"
        }
    ]


@app.get("/financials/{symbol}")
async def get_financials(symbol: str) -> dict:
    """Get key financial metrics"""
    return {
        "symbol": symbol.upper(),
        "metrics": {
            "revenue": 50000000000,
            "net_income": 10000000000,
            "eps": 5.25,
            "pe_ratio": 28.5,
            "market_cap": 285000000000
        },
        "as_of": datetime.utcnow().isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5020)