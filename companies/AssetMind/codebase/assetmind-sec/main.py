"""
AssetMind SEC EDGAR Connector Service
SEC filings and company disclosures

Port: 5020

Version: 1.0.0
"""

import uuid
import random
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
import uvicorn

# ============================================================================
# Configuration
# ============================================================================

app = FastAPI(
    title="AssetMind SEC EDGAR Connector",
    description="SEC filings and company disclosures",
    version="1.0.0",
)

# ============================================================================
# Enums
# ============================================================================

class FilingType(str, Enum):
    FORM_10K = "10-K"
    FORM_10Q = "10-Q"
    FORM_8K = "8-K"
    FORM_4 = "4"
    FORM_13F = "13F"
    FORM_S1 = "S-1"
    FORM_DEFM14A = "DEF 14A"

class FormCategory(str, Enum):
    ANNUAL = "annual"
    QUARTERLY = "quarterly"
    CURRENT = "current"
    INSIDER = "insider"
    INSTITUTIONAL = "institutional"
    REGISTRATION = "registration"
    PROXY = "proxy"

class InsiderTransactionType(str, Enum):
    PURCHASE = "purchase"
    SALE = "sale"
    GRANT = "grant"
    EXERCISE = "exercise"
    GIFT = "gift"
    DISPOSITION = "disposition"

# ============================================================================
# Pydantic Models - Filings
# ============================================================================

class FilingDocument(BaseModel):
    type: str
    description: str
    url: str
    filing_date: datetime

class SECFiling(BaseModel):
    filing_id: str = Field(default_factory=lambda: f"sec-{uuid.uuid4().hex[:8]}")
    company_name: str
    ticker: str
    filing_type: FilingType
    category: FormCategory

    # Filing details
    accession_number: str
    filing_date: datetime
    period_of_report: Optional[datetime] = None
    acceptance_datetime: datetime

    # Content
    description: str
    documents: List[FilingDocument] = []

    # Metadata
    form_url: str = ""
    is_amendment: bool = False
    amendment_type: Optional[str] = None

    class Config:
        from_attributes = True

# ============================================================================
# Pydantic Models - Insider Trading
# ============================================================================

class InsiderInfo(BaseModel):
    name: str
    title: Optional[str] = None
    relationship: str = "insider"
    is_director: bool = False
    is_officer: bool = False
    is_ten_percent_owner: bool = False

class InsiderTransaction(BaseModel):
    transaction_id: str = Field(default_factory=lambda: f"txn-{uuid.uuid4().hex[:8]}")
    insider: InsiderInfo
    ticker: str

    # Transaction details
    transaction_type: InsiderTransactionType
    securities_type: str = "Common Stock"
    amount: float
    shares: float
    price_per_share: Optional[float] = None

    # Post-transaction
    shares_owned_after: float
    direct_ownership: float = 0.0
    indirect_ownership: float = 0.0

    # Dates
    transaction_date: datetime
    filing_date: datetime

    # Metadata
    filing_id: str
    footnotes: str = ""

class InsiderFiling(BaseModel):
    ticker: str
    company_name: str
    filing_date: datetime
    period_of_report: datetime
    transactions: List[InsiderTransaction]
    total_transactions: int
    total_shares_traded: float
    total_value: float

# ============================================================================
# Pydantic Models - Institutional Holdings
# ============================================================================

class InstitutionalHolder(BaseModel):
    name: str
   cik: str
    filing_date: datetime

    # Holdings summary
    total_value: float
    total_shares: float
    portfolio_count: int

    # Top holdings
    top_holdings: List[Dict[str, Any]] = []

    # Changes
    purchases_count: int = 0
    sales_count: int = 0
    new_positions_count: int = 0
    closed_positions_count: int = 0

class HoldingsReport(BaseModel):
    ticker: str
    company_name: str
    report_date: datetime
    filing_date: datetime

    # Aggregate data
    total_shares_outstanding: float
    institutional_shares: float
    institutional_percentage: float

    # Top holders
    top_holders: List[Dict[str, Any]] = []

    # Changes
    institutional_activity: Dict[str, int] = {}

# ============================================================================
# Pydantic Models - 8-K Events
# ============================================================================

class Item8KEvent(BaseModel):
    item_number: str
    item_name: str
    description: str
    filed_date: datetime

class Form8K(BaseModel):
    ticker: str
    company_name: str
    filing_date: datetime
    accession_number: str

    # Events
    events: List[Item8KEvent]

    # Financial impact
    has_financial_statements: bool = False
    has_exhibits: bool = False
    exhibit_count: int = 0

    # Sentiment
    sentiment_score: float = 0.0
    sentiment_label: str = "neutral"

# ============================================================================
# Pydantic Models - Requests
# ============================================================================

class FilingSearchRequest(BaseModel):
    ticker: str
    filing_types: List[FilingType] = []
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    limit: int = Field(default=50, ge=1, le=500)

class InsiderSearchRequest(BaseModel):
    ticker: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

# ============================================================================
# In-Memory Storage
# ============================================================================

filings_db: Dict[str, SECFiling] = {}
insider_filings_db: Dict[str, List[InsiderTransaction]] = {}
holdings_db: Dict[str, HoldingsReport] = {}

# Initialize sample data
def init_sample_data():
    """Initialize sample SEC filing data."""
    sample_tickers = ["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA", "NVDA", "META", "NFLX"]

    for ticker in sample_tickers:
        # Generate 10-K filings
        for year in [2024, 2023, 2022]:
            filing = SECFiling(
                company_name=f"{ticker} Inc.",
                ticker=ticker,
                filing_type=FilingType.FORM_10K,
                category=FormCategory.ANNUAL,
                accession_number=f"000{ticker.lower()}-{year}-001",
                filing_date=datetime(year, 2, random.randint(15, 28)),
                period_of_report=datetime(year, 12, 31),
                acceptance_datetime=datetime(year, 2, random.randint(20, 28)),
                description=f"Annual report for fiscal year {year}",
                documents=[
                    FilingDocument(
                        type="10-K",
                        description="Annual Report",
                        url=f"https://www.sec.gov/archives/edgar/data/{ticker}/{year}/10k.pdf",
                        filing_date=datetime(year, 2, 20),
                    ),
                ],
            )
            filings_db[f"{ticker}-{filing.accession_number}"] = filing

        # Generate 10-Q filings
        for quarter, month in [(1, 4), (2, 7), (3, 10), (4, 1)]:
            year = 2024 if month != 1 else 2025
            filing = SECFiling(
                company_name=f"{ticker} Inc.",
                ticker=ticker,
                filing_type=FilingType.FORM_10Q,
                category=FormCategory.QUARTERLY,
                accession_number=f"000{ticker.lower()}-{year}-q{quarter}",
                filing_date=datetime(year, month, random.randint(10, 20)),
                period_of_report=datetime(year, (quarter - 1) * 3 + 1, 1),
                acceptance_datetime=datetime(year, month, random.randint(12, 20)),
                description=f"Quarterly report Q{quarter} {year}",
                documents=[],
            )
            filings_db[f"{ticker}-q{quarter}-{year}"] = filing

        # Generate 8-K filings
        for i in range(3):
            days_ago = i * 30 + random.randint(5, 25)
            filing = SECFiling(
                company_name=f"{ticker} Inc.",
                ticker=ticker,
                filing_type=FilingType.FORM_8K,
                category=FormCategory.CURRENT,
                accession_number=f"000{ticker.lower()}-24-{i+1:05d}",
                filing_date=datetime.utcnow() - timedelta(days=days_ago),
                period_of_report=datetime.utcnow() - timedelta(days=days_ago),
                acceptance_datetime=datetime.utcnow() - timedelta(days=days_ago - 1),
                description=f"Current report - Event {i+1}",
                documents=[],
            )
            filings_db[f"{ticker}-8k-{days_ago}"] = filing

        # Generate insider transactions
        insider_titles = ["CEO", "CFO", "CTO", "COO", "VP", "Director", "General Counsel"]
        for i in range(random.randint(5, 15)):
            days_ago = random.randint(1, 90)
            txn_type = random.choice(list(InsiderTransactionType))
            price = random.uniform(50, 500)
            shares = random.randint(100, 10000)

            transaction = InsiderTransaction(
                insider=InsiderInfo(
                    name=f"Insider {i+1}",
                    title=random.choice(insider_titles),
                    relationship="insider",
                    is_director=random.choice([True, False]),
                    is_officer=random.choice([True, False]),
                ),
                ticker=ticker,
                transaction_type=txn_type,
                shares=shares,
                amount=shares * price,
                price_per_share=price,
                shares_owned_after=random.randint(10000, 500000),
                transaction_date=datetime.utcnow() - timedelta(days=days_ago),
                filing_date=datetime.utcnow() - timedelta(days=days_ago - 1),
                filing_id=f"sec-{uuid.uuid4().hex[:8]}",
            )
            if ticker not in insider_filings_db:
                insider_filings_db[ticker] = []
            insider_filings_db[ticker].append(transaction)

        # Generate 13-F holdings
        holdings = HoldingsReport(
            ticker=ticker,
            company_name=f"{ticker} Inc.",
            report_date=datetime(2024, 12, 31),
            filing_date=datetime(2025, 2, 15),
            total_shares_outstanding=random.uniform(1e9, 10e9),
            institutional_shares=random.uniform(0.6, 0.8) * random.uniform(1e9, 10e9),
            institutional_percentage=random.uniform(60, 85),
            top_holders=[
                {"name": f"Vanguard {ticker} Index Fund", "shares": random.randint(100000, 1000000), "value": random.uniform(1e8, 5e8)},
                {"name": "BlackRock Fund Advisors", "shares": random.randint(50000, 500000), "value": random.uniform(5e7, 2e8)},
                {"name": "State Street Global Advisors", "shares": random.randint(30000, 300000), "value": random.uniform(3e7, 1e8)},
            ],
            institutional_activity={
                "new_positions": random.randint(5, 20),
                "closed_positions": random.randint(3, 15),
                "increased_positions": random.randint(10, 40),
                "decreased_positions": random.randint(8, 30),
            },
        )
        holdings_db[ticker] = holdings

init_sample_data()

# ============================================================================
# Health Check
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    filing_types = {f.value: sum(1 for filing in filings_db.values() if filing.filing_type == f)
                    for f in FilingType}

    return {
        "status": "healthy",
        "service": "assetmind-sec",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "stats": {
            "total_filings": len(filings_db),
            "filings_by_type": filing_types,
            "tracked_tickers": len(holdings_db),
        },
    }

# ============================================================================
# Company Filings Endpoints
# ============================================================================

@app.get("/company/{symbol}/filings", response_model=List[SECFiling])
async def get_company_filings(
    symbol: str,
    filing_type: Optional[FilingType] = None,
    limit: int = Query(50, ge=1, le=500),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
):
    """Get all SEC filings for a company."""
    symbol = symbol.upper()

    filings = [
        f for f in filings_db.values()
        if f.ticker == symbol
        and (filing_type is None or f.filing_type == filing_type)
        and (start_date is None or f.filing_date >= start_date)
        and (end_date is None or f.filing_date <= end_date)
    ]

    filings.sort(key=lambda f: f.filing_date, reverse=True)
    return filings[:limit]

@app.get("/company/{symbol}/10k", response_model=List[SECFiling])
async def get_annual_reports(symbol: str, years: int = Query(5, ge=1, le=20)):
    """Get annual 10-K filings for a company."""
    symbol = symbol.upper()
    cutoff = datetime.utcnow() - timedelta(days=years * 365)

    filings = [
        f for f in filings_db.values()
        if f.ticker == symbol
        and f.filing_type == FilingType.FORM_10K
        and f.filing_date >= cutoff
    ]

    return sorted(filings, key=lambda f: f.filing_date, reverse=True)

@app.get("/company/{symbol}/10q", response_model=List[SECFiling])
async def get_quarterly_reports(symbol: str, year: Optional[int] = None):
    """Get quarterly 10-Q filings for a company."""
    symbol = symbol.upper()

    filings = [
        f for f in filings_db.values()
        if f.ticker == symbol
        and f.filing_type == FilingType.FORM_10Q
        and (year is None or f.filing_date.year == year)
    ]

    return sorted(filings, key=lambda f: f.filing_date, reverse=True)

# ============================================================================
# 8-K Events Endpoints
# ============================================================================

@app.get("/company/{symbol}/8k", response_model=List[Form8K])
async def get_8k_events(symbol: str, limit: int = Query(20, ge=1, le=100)):
    """Get recent 8-K events for a company."""
    symbol = symbol.upper()

    filings = [
        f for f in filings_db.values()
        if f.ticker == symbol and f.filing_type == FilingType.FORM_8K
    ]

    # Convert to Form8K format
    events = []
    for f in sorted(filings, key=lambda x: x.filing_date, reverse=True)[:limit]:
        event_items = [
            Item8KEvent(
                item_number="2.02",
                item_name="Results of Operations",
                description=f. description,
                filed_date=f.filing_date,
            )
        ]

        events.append(Form8K(
            ticker=symbol,
            company_name=f.company_name,
            filing_date=f.filing_date,
            accession_number=f.accession_number,
            events=event_items,
            sentiment_score=random.uniform(-0.5, 0.5),
            sentiment_label="positive" if random.random() > 0.5 else "neutral",
        ))

    return events

# ============================================================================
# Insider Trading Endpoints
# ============================================================================

@app.get("/insider/{symbol}", response_model=InsiderFiling)
async def get_insider_filings(symbol: str):
    """Get insider trading activity for a company."""
    symbol = symbol.upper()

    if symbol not in insider_filings_db:
        raise HTTPException(status_code=404, detail=f"No insider data for {symbol}")

    transactions = insider_filings_db[symbol]

    total_shares = sum(t.shares for t in transactions)
    total_value = sum(t.amount for t in transactions)

    return InsiderFiling(
        ticker=symbol,
        company_name=f"{symbol} Inc.",
        filing_date=max(t.filing_date for t in transactions),
        period_of_report=max(t.transaction_date for t in transactions),
        transactions=transactions,
        total_transactions=len(transactions),
        total_shares_traded=total_shares,
        total_value=total_value,
    )

@app.get("/insider/{symbol}/recent")
async def get_recent_insider_trades(symbol: str, days: int = Query(30, ge=1, le=365)):
    """Get recent insider trades within specified days."""
    symbol = symbol.upper()
    cutoff = datetime.utcnow() - timedelta(days=days)

    if symbol not in insider_filings_db:
        return {"ticker": symbol, "transactions": []}

    recent = [
        t for t in insider_filings_db[symbol]
        if t.transaction_date >= cutoff
    ]

    return {
        "ticker": symbol,
        "days": days,
        "transactions": recent,
        "count": len(recent),
        "total_value": sum(t.amount for t in recent),
    }

# ============================================================================
# Institutional Holdings Endpoints
# ============================================================================

@app.get("/institutions/{symbol}", response_model=HoldingsReport)
async def get_institutional_holdings(symbol: str):
    """Get institutional holdings (13-F) for a company."""
    symbol = symbol.upper()

    if symbol not in holdings_db:
        raise HTTPException(status_code=404, detail=f"No holdings data for {symbol}")

    return holdings_db[symbol]

@app.get("/institutions/{symbol}/top-holders")
async def get_top_holders(symbol: str, limit: int = Query(10, ge=1, le=50)):
    """Get top institutional holders for a company."""
    symbol = symbol.upper()

    if symbol not in holdings_db:
        raise HTTPException(status_code=404, detail=f"No holdings data for {symbol}")

    holdings = holdings_db[symbol]
    return {
        "ticker": symbol,
        "company_name": holdings.company_name,
        "report_date": holdings.report_date.isoformat(),
        "top_holders": holdings.top_holders[:limit],
        "institutional_percentage": holdings.institutional_percentage,
    }

# ============================================================================
# Run Server
# ============================================================================

if __name__ == "__main__":
    logger.info("Starting AssetMind SEC EDGAR Connector on port 5020")
    uvicorn.run(app, host="0.0.0.0", port=5020)