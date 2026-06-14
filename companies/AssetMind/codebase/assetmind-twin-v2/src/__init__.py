"""
AssetMind - Asset Twin 2.0
Port: 5002

The Living Digital Twin - Not just data, but INTELLIGENCE.

A complete digital replica that includes:
- Identity: Who this asset IS
- Memory: What we know (predictions, outcomes, research)
- Relationships: Who it's connected to
- Risks: What can go wrong
- Forecasts: Where it's going
- Events: What affects it
- Supply Chain: Who supplies it
- Competitors: Who competes with it
- Valuation: What it's worth
- Scenarios: What if analysis

This is NOT a static record. It's a living, learning entity.

Version: 1.0.0
Date: June 9, 2026
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime, timedelta
from enum import Enum
import uuid


app = FastAPI(title="AssetMind Asset Twin 2.0", version="1.0.0")


# =============================================================================
# TWIN COMPONENTS
# =============================================================================

class TwinStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    UNDER_REVIEW = "under_review"
    ACQUIRED = "acquired"
    BANKRUPT = "bankrupt"


class IdentityLayer(BaseModel):
    """Who this asset IS"""
    # Basic
    symbol: str
    name: str
    asset_class: str # stock, etf, crypto, bond, etc.

    # Classification
    sector: str
    industry: str
    market_cap_bucket: str  # mega, large, mid, small, micro

    # Exchange& Trading
    exchange: str
    currency: str
    isin: Optional[str] = None

    # Business
    description: str
    founded: Optional[int] = None
    headquarters: Optional[str] = None
    employees: Optional[int] = None

    # Status
    status: TwinStatus = TwinStatus.ACTIVE
    last_updated: datetime


class FinancialsLayer(BaseModel):
    """Financial metrics and ratios"""
    # Income Statement
    revenue: Optional[float] = None
    revenue_growth: Optional[float] = None  # YoY %
    gross_profit: Optional[float] = None
    operating_income: Optional[float] = None
    net_income: Optional[float] = None
    eps: Optional[float] = None
    eps_growth: Optional[float] = None

    # Balance Sheet
    total_assets: Optional[float] = None
    total_debt: Optional[float] = None
    cash: Optional[float] = None
    book_value: Optional[float] = None

    # Cash Flow
    operating_cash_flow: Optional[float] = None
    free_cash_flow: Optional[float] = None
    capital_expenditure: Optional[float] = None

    # Key Ratios
    pe_ratio: Optional[float] = None
    peg_ratio: Optional[float] = None
    pb_ratio: Optional[float] = None
    ps_ratio: Optional[float] = None
    ev_ebitda: Optional[float] = None
    debt_equity: Optional[float] = None
    current_ratio: Optional[float] = None
    quick_ratio: Optional[float] = None

    # Profitability
    gross_margin: Optional[float] = None
    operating_margin: Optional[float] = None
    net_margin: Optional[float] = None
    roe: Optional[float] = None
    roa: Optional[float] = None
    roic: Optional[float] = None

    # Dividends
    dividend_yield: Optional[float] = None
    payout_ratio: Optional[float] = None

    # Valuation
    market_cap: Optional[float] = None
    enterprise_value: Optional[float] = None
    fair_value: Optional[float] = None
    upside: Optional[float] = None  # % upside to fair value

    # Last updated
    last_updated: datetime


class MemoryLayer(BaseModel):
    """What we know about this asset"""
    # Predictions (from RexMind)
    predictions: List[Dict] = Field(default_factory=list)

    # Research
    research_reports: List[Dict] = Field(default_factory=list)

    # Earnings history
    earnings_history: List[Dict] = Field(default_factory=list)

    # Key events
    key_events: List[Dict] = Field(default_factory=list)

    # Analyst coverage
    analysts: List[Dict] = Field(default_factory=list)
    avg_rating: Optional[str] = None  # BUY, HOLD, SELL
    price_targets: List[Dict] = Field(default_factory=list)

    # Sentiment
    sentiment_score: Optional[float] = None  # -100 to 100
    sentiment_trend: Optional[str] = None  # improving, declining, stable

    # Last updated
    last_updated: datetime


class RelationshipLayer(BaseModel):
    """Who this asset is connected to"""
    # Suppliers
    suppliers: List[Dict] = Field(default_factory=list)  # Company IDs

    # Customers
    customers: List[Dict] = Field(default_factory=list)

    # Competitors
    competitors: List[Dict] = Field(default_factory=list)

    # Partners
    partners: List[Dict] = Field(default_factory=list)

    # Parent/Subsidiaries
    parent: Optional[str] = None
    subsidiaries: List[str] = Field(default_factory=list)

    # Key people
    ceo: Optional[str] = None
    cfo: Optional[str] = None
    key_executives: List[Dict] = Field(default_factory=list)

    # Institutional holders
    major_shareholders: List[Dict] = Field(default_factory=list)

    # Last updated
    last_updated: datetime


class RiskLayer(BaseModel):
    """What can go wrong"""
    # Market risks
    market_risks: List[Dict] = Field(default_factory=list)

    # Company-specific risks
    company_risks: List[Dict] = Field(default_factory=list)

    # Sector risks
    sector_risks: List[Dict] = Field(default_factory=list)

    # Geopolitical risks
    geo_risks: List[Dict] = Field(default_factory=list)

    # Risk scores
    overall_risk_score: Optional[float] = None  # 0-100
    volatility_score: Optional[float] = None
    beta: Optional[float] = None
    sharpe_ratio: Optional[float] = None

    # Key risk factors
    key_risk_factors: List[str] = Field(default_factory=list)

    # Last updated
    last_updated: datetime


class ForecastLayer(BaseModel):
    """Where this asset is going"""
    # Price forecasts
    price_forecasts: List[Dict] = Field(default_factory=list)

    # Revenue forecasts
    revenue_forecasts: List[Dict] = Field(default_factory=list)

    # Earnings forecasts
    eps_forecasts: List[Dict] = Field(default_factory=list)

    # Target prices
    target_prices: List[Dict] = Field(default_factory=list)

    # Sentiment forecasts
    sentiment_forecasts: List[Dict] = Field(default_factory=list)

    # Model confidence
    model_confidence: Optional[float] = None

    # Last updated
    last_updated: datetime


class EventLayer(BaseModel):
    """What affects this asset"""
    # Upcoming events
    upcoming_events: List[Dict] = Field(default_factory=list)

    # Recent events
    recent_events: List[Dict] = Field(default_factory=list)

    # Event impact history
    event_impacts: List[Dict] = Field(default_factory=list)

    # Key catalysts
    catalysts: List[str] = Field(default_factory=list)

    # Key risks
    headwinds: List[str] = Field(default_factory=list)

    # Last updated
    last_updated: datetime


class SupplyChainLayer(BaseModel):
    """Supply chain intelligence"""
    # Tier 1 suppliers
    tier1_suppliers: List[Dict] = Field(default_factory=list)

    # Tier 2 suppliers
    tier2_suppliers: List[Dict] = Field(default_factory=list)

    # Tier 1 customers
    tier1_customers: List[Dict] = Field(default_factory=list)

    # Geographic exposure
    geographic_exposure: Dict[str, float] = Field(default_factory=dict)  # country -> %

    # Key dependencies
    key_dependencies: List[str] = Field(default_factory=list)

    # Concentration risk
    supplier_concentration: Optional[float] = None
    customer_concentration: Optional[float] = None

    # Last updated
    last_updated: datetime


class ValuationLayer(BaseModel):
    """What this asset is worth"""
    # Methods
    dcf_model: Optional[Dict] = None
    comparable_model: Optional[Dict] = None
    dividend_model: Optional[Dict] = None
    asset_model: Optional[Dict] = None

    # Fair value range
    fair_value_low: Optional[float] = None
    fair_value_high: Optional[float] = None
    fair_value: Optional[float] = None

    # Upside/downside
    upside_to_fair: Optional[float] = None
    downside_to_fair: Optional[float] = None

    # Valuation multiples
    current_multiple: Optional[float] = None
    historical_multiple: Optional[float] = None
    sector_average: Optional[float] = None

    # Rating
    valuation_rating: Optional[str] = None  # undervalued, fair, overvalued

    # Last updated
    last_updated: datetime


class ScenarioLayer(BaseModel):
    """What-if analysis"""
    # Bull case
    bull_case: Optional[Dict] = None

    # Base case
    base_case: Optional[Dict] = None

    # Bear case
    bear_case: Optional[Dict] = None

    # Stress scenarios
    stress_scenarios: List[Dict] = Field(default_factory=list)

    # Sensitivity analysis
    sensitivity: List[Dict] = Field(default_factory=list)

    # Last updated
    last_updated: datetime


# =============================================================================
# COMPLETE ASSET TWIN
# =============================================================================

class AssetTwin(BaseModel):
    """The complete living digital twin"""
    twin_id: str
    symbol: str

    # All layers
    identity: IdentityLayer
    financials: FinancialsLayer
    memory: MemoryLayer
    relationships: RelationshipLayer
    risks: RiskLayer
    forecasts: ForecastLayer
    events: EventLayer
    supply_chain: SupplyChainLayer
    valuation: ValuationLayer
    scenarios: ScenarioLayer

    # Composite scores
    overall_score: Optional[float] = None  # 0-100
    opportunity_score: Optional[float] = None
    risk_score: Optional[float] = None
    health_score: Optional[float] = None

    # Recommendation
    recommendation: str = "HOLD"  # BUY, HOLD, SELL
    confidence: float = 0.5

    # Metadata
    created_at: datetime
    last_updated: datetime
    version: str = "2.0"


# =============================================================================
# TWIN DATABASE
# =============================================================================

TWINS: Dict[str, AssetTwin] = {}


# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-twin-v2",
        "status": "healthy",
        "version": "2.0",
        "port": 5002,
        "active_twins": len(TWINS)
    }


@app.get("/")
async def root():
    return {
        "service": "AssetMind Asset Twin 2.0",
        "description": "The Living Digital Twin - Not just data, but INTELLIGENCE",
        "layers": [
            "identity", "financials", "memory", "relationships",
            "risks", "forecasts", "events", "supply_chain",
            "valuation", "scenarios"
        ]
    }


# =============================================================================
# Twin CRUD
# =============================================================================

@app.post("/twins", status_code=201)
async def create_twin(twin: AssetTwin):
    """Create a new asset twin"""
    TWINS[twin.twin_id] = twin
    return {"twin_id": twin.twin_id, "created": True}


@app.get("/twins/{twin_id}")
async def get_twin(twin_id: str):
    """Get complete twin"""
    if twin_id not in TWINS:
        raise HTTPException(status_code=404, detail="Twin not found")
    return TWINS[twin_id]


@app.get("/twins/symbol/{symbol}")
async def get_twin_by_symbol(symbol: str):
    """Get twin by symbol"""
    for twin in TWINS.values():
        if twin.symbol == symbol:
            return twin
    raise HTTPException(status_code=404, detail=f"Twin for {symbol} not found")


@app.get("/twins")
async def list_twins(
    sector: Optional[str] = None,
    limit: int = 50
):
    """List twins with optional filter"""
    results = list(TWINS.values())

    if sector:
        results = [t for t in results if t.identity.sector == sector]

    return {"twins": results[:limit], "total": len(results)}


@app.patch("/twins/{twin_id}")
async def update_twin(twin_id: str, updates: Dict):
    """Update twin layer"""
    if twin_id not in TWINS:
        raise HTTPException(status_code=404, detail="Twin not found")

    twin = TWINS[twin_id]

    # Update specific layer
    for key, value in updates.items():
        if hasattr(twin, key):
            setattr(twin, key, value)

    twin.last_updated = datetime.utcnow()
    TWINS[twin_id] = twin

    return {"updated": True, "twin_id": twin_id}


# =============================================================================
# Layer-Specific Access
# =============================================================================

@app.get("/twins/{twin_id}/identity")
async def get_identity(twin_id: str):
    """Get identity layer"""
    if twin_id not in TWINS:
        raise HTTPException(status_code=404, detail="Twin not found")
    return TWINS[twin_id].identity


@app.get("/twins/{twin_id}/financials")
async def get_financials(twin_id: str):
    """Get financials layer"""
    if twin_id not in TWINS:
        raise HTTPException(status_code=404, detail="Twin not found")
    return TWINS[twin_id].financials


@app.get("/twins/{twin_id}/memory")
async def get_memory(twin_id: str):
    """Get memory layer"""
    if twin_id not in TWINS:
        raise HTTPException(status_code=404, detail="Twin not found")
    return TWINS[twin_id].memory


@app.get("/twins/{twin_id}/relationships")
async def get_relationships(twin_id: str):
    """Get relationships layer"""
    if twin_id not in TWINS:
        raise HTTPException(status_code=404, detail="Twin not found")
    return TWINS[twin_id].relationships


@app.get("/twins/{twin_id}/risks")
async def get_risks(twin_id: str):
    """Get risks layer"""
    if twin_id not in TWINS:
        raise HTTPException(status_code=404, detail="Twin not found")
    return TWINS[twin_id].risks


@app.get("/twins/{twin_id}/forecasts")
async def get_forecasts(twin_id: str):
    """Get forecasts layer"""
    if twin_id not in TWINS:
        raise HTTPException(status_code=404, detail="Twin not found")
    return TWINS[twin_id].forecasts


@app.get("/twins/{twin_id}/valuation")
async def get_valuation(twin_id: str):
    """Get valuation layer"""
    if twin_id not in TWINS:
        raise HTTPException(status_code=404, detail="Twin not found")
    return TWINS[twin_id].valuation


@app.get("/twins/{twin_id}/scenarios")
async def get_scenarios(twin_id: str):
    """Get scenarios layer"""
    if twin_id not in TWINS:
        raise HTTPException(status_code=404, detail="Twin not found")
    return TWINS[twin_id].scenarios


# =============================================================================
# Intelligence Queries
# =============================================================================

@app.get("/twins/{twin_id}/summary")
async def get_twin_summary(twin_id: str):
    """Get a summary of the twin"""
    if twin_id not in TWINS:
        raise HTTPException(status_code=404, detail="Twin not found")

    twin = TWINS[twin_id]

    return {
        "symbol": twin.symbol,
        "name": twin.identity.name,
        "sector": twin.identity.sector,
        "recommendation": twin.recommendation,
        "confidence": twin.confidence,
        "scores": {
            "overall": twin.overall_score,
            "opportunity": twin.opportunity_score,
            "risk": twin.risk_score,
            "health": twin.health_score
        },
        "valuation": {
            "fair_value": twin.valuation.fair_value,
            "upside": twin.valuation.upside_to_fair,
            "rating": twin.valuation.valuation_rating
        },
        "forecasts": {
            "price_targets": twin.forecasts.target_prices[:3] if twin.forecasts.target_prices else [],
            "model_confidence": twin.forecasts.model_confidence
        },
        "key_metrics": {
            "pe_ratio": twin.financials.pe_ratio,
            "revenue_growth": twin.financials.revenue_growth,
            "market_cap": twin.financials.market_cap
        },
        "risks": twin.risks.key_risk_factors[:5] if twin.risks.key_risk_factors else [],
        "catalysts": twin.events.catalysts[:5] if twin.events.catalysts else []
    }


@app.get("/twins/{twin_id}/supply-chain")
async def get_supply_chain(twin_id: str):
    """Get supply chain analysis"""
    if twin_id not in TWINS:
        raise HTTPException(status_code=404, detail="Twin not found")

    twin = TWINS[twin_id]

    return {
        "symbol": twin.symbol,
        "tier1_suppliers": twin.supply_chain.tier1_suppliers,
        "tier2_suppliers": twin.supply_chain.tier2_suppliers,
        "tier1_customers": twin.supply_chain.tier1_customers,
        "geographic_exposure": twin.supply_chain.geographic_exposure,
        "key_dependencies": twin.supply_chain.key_dependencies,
        "concentration_risk": {
            "supplier": twin.supply_chain.supplier_concentration,
            "customer": twin.supply_chain.customer_concentration
        }
    }


@app.get("/twins/{twin_id}/competitors")
async def get_competitors(twin_id: str):
    """Get competitor analysis"""
    if twin_id not in TWINS:
        raise HTTPException(status_code=404, detail="Twin not found")

    twin = TWINS[twin_id]

    return {
        "symbol": twin.symbol,
        "competitors": twin.relationships.competitors,
        "market_position": {
            "market_cap": twin.financials.market_cap,
            "revenue": twin.financials.revenue,
            "pe_ratio": twin.financials.pe_ratio
        }
    }


# =============================================================================
# Comparative Analysis
# =============================================================================

@app.post("/twins/compare")
async def compare_twins(symbols: List[str]):
    """Compare multiple twins"""
    twins = []

    for symbol in symbols:
        for twin in TWINS.values():
            if twin.symbol == symbol:
                twins.append(twin)
                break

    if not twins:
        raise HTTPException(status_code=404, detail="No twins found")

    comparison = {
        "symbols": [t.symbol for t in twins],
        "metrics": {
            "market_cap": {t.symbol: t.financials.market_cap for t in twins},
            "revenue": {t.symbol: t.financials.revenue for t in twins},
            "pe_ratio": {t.symbol: t.financials.pe_ratio for t in twins},
            "revenue_growth": {t.symbol: t.financials.revenue_growth for t in twins},
            "recommendation": {t.symbol: t.recommendation for t in twins},
            "opportunity_score": {t.symbol: t.opportunity_score for t in twins},
            "risk_score": {t.symbol: t.risk_score for t in twins}
        }
    }

    return comparison


@app.get("/twins/sector/{sector}")
async def get_sector_twins(sector: str):
    """Get all twins in a sector"""
    sector_twins = [t for t in TWINS.values() if t.identity.sector == sector]

    if not sector_twins:
        return {"twins": [], "message": f"No twins in {sector} sector"}

    # Sort by opportunity score
    sector_twins.sort(
        key=lambda t: t.opportunity_score or 0,
        reverse=True
    )

    return {
        "sector": sector,
        "twins": sector_twins,
        "count": len(sector_twins),
        "avg_metrics": {
            "pe_ratio": sum(t.financials.pe_ratio or 0 for t in sector_twins) / len(sector_twins),
            "revenue_growth": sum(t.financials.revenue_growth or 0 for t in sector_twins) / len(sector_twins),
            "opportunity_score": sum(t.opportunity_score or 0 for t in sector_twins) / len(sector_twins)
        }
    }


# =============================================================================
# Scoring & Ranking
# =============================================================================

@app.get("/twins/top-opportunities")
async def get_top_opportunities(limit: int = 10):
    """Get top opportunity scores"""
    sorted_twins = sorted(
        TWINS.values(),
        key=lambda t: t.opportunity_score or 0,
        reverse=True
    )

    return {
        "opportunities": [
            {
                "symbol": t.symbol,
                "name": t.identity.name,
                "opportunity_score": t.opportunity_score,
                "risk_score": t.risk_score,
                "recommendation": t.recommendation,
                "upside": t.valuation.upside_to_fair
            }
            for t in sorted_twins[:limit]
        ]
    }


@app.get("/twins/top-risks")
async def get_top_risks(limit: int = 10):
    """Get highest risk scores"""
    sorted_twins = sorted(
        TWINS.values(),
        key=lambda t: t.risk_score or 0,
        reverse=True
    )

    return {
        "risks": [
            {
                "symbol": t.symbol,
                "name": t.identity.name,
                "risk_score": t.risk_score,
                "opportunity_score": t.opportunity_score,
                "key_risks": t.risks.key_risk_factors[:3]
            }
            for t in sorted_twins[:limit]
        ]
    }


# =============================================================================
# Bootstrap Sample Twins
# =============================================================================

@app.post("/bootstrap")
async def bootstrap_twins():
    """Create sample twins for major companies"""

    sample_twins = [
        {
            "symbol": "NVDA",
            "name": "NVIDIA Corporation",
            "sector": "Technology",
            "industry": "Semiconductors"
        },
        {
            "symbol": "AAPL",
            "name": "Apple Inc.",
            "sector": "Technology",
            "industry": "Consumer Electronics"
        },
        {
            "symbol": "MSFT",
            "name": "Microsoft Corporation",
            "sector": "Technology",
            "industry": "Software"
        },
        {
            "symbol": "TSM",
            "name": "Taiwan Semiconductor",
            "sector": "Technology",
            "industry": "Semiconductors"
        }
    ]

    for sample in sample_twins:
        twin = AssetTwin(
            twin_id=f"TWIN_{sample['symbol']}",
            symbol=sample["symbol"],
            identity=IdentityLayer(
                symbol=sample["symbol"],
                name=sample["name"],
                asset_class="stock",
                sector=sample["sector"],
                industry=sample["industry"],
                market_cap_bucket="mega",
                exchange="NASDAQ",
                currency="USD",
                status=TwinStatus.ACTIVE,
                last_updated=datetime.utcnow()
            ),
            financials=FinancialsLayer(
                revenue=60000000000,
                revenue_growth=122,
                net_income=30000000000,
                eps=12.5,
                pe_ratio=45,
                market_cap=850000000000,
                gross_margin=74,
                operating_margin=42,
                roe=65,
                last_updated=datetime.utcnow()
            ),
            memory=MemoryLayer(
                predictions=[],
                research_reports=[],
                earnings_history=[],
                key_events=[],
                sentiment_score=75,
                last_updated=datetime.utcnow()
            ),
            relationships=RelationshipLayer(
                suppliers=[],
                customers=[],
                competitors=[],
                partners=[],
                last_updated=datetime.utcnow()
            ),
            risks=RiskLayer(
                market_risks=[],
                company_risks=[],
                sector_risks=[],
                geo_risks=[],
                overall_risk_score=35,
                beta=1.5,
                key_risk_factors=["Competition", "China exposure", "Valuation"],
                last_updated=datetime.utcnow()
            ),
            forecasts=ForecastLayer(
                price_forecasts=[],
                target_prices=[{"target": 1000, "analyst": "Morgan Stanley"}],
                model_confidence=0.78,
                last_updated=datetime.utcnow()
            ),
            events=EventLayer(
                upcoming_events=[],
                recent_events=[],
                catalysts=["AI demand", "Data center growth"],
                headwinds=["China restrictions"],
                last_updated=datetime.utcnow()
            ),
            supply_chain=SupplyChainLayer(
                tier1_suppliers=[],
                tier2_suppliers=[],
                tier1_customers=[],
                geographic_exposure={"US": 60, "China": 20, "Taiwan": 15},
                key_dependencies=["TSMC", "CoWoS packaging"],
                last_updated=datetime.utcnow()
            ),
            valuation=ValuationLayer(
                fair_value=950,
                fair_value_low=850,
                fair_value_high=1100,
                upside_to_fair=18,
                valuation_rating="fair",
                last_updated=datetime.utcnow()
            ),
            scenarios=ScenarioLayer(
                bull_case={"price": 1200, "scenario": "AI demand exceeds expectations"},
                base_case={"price": 950, "scenario": "Steady growth continues"},
                bear_case={"price": 700, "scenario": "Competition intensifies"},
                stress_scenarios=[],
                last_updated=datetime.utcnow()
            ),
            overall_score=82,
            opportunity_score=88,
            risk_score=35,
            health_score=90,
            recommendation="BUY",
            confidence=0.78,
            created_at=datetime.utcnow(),
            last_updated=datetime.utcnow()
        )

        TWINS[twin.twin_id] = twin

    return {
        "message": "Twins bootstrapped",
        "twins_created": len(sample_twins)
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5002)