"""
AssetMind Capital Flow Service
ETF flow tracking and capital analysis

This service provides:
- ETF flow tracking (inflows, outflows, net flows)
- Capital flow analysis by asset class
- Flow aggregation and visualization
- Historical flow data
- Flow predictions
- Sector and thematic flow analysis

Port: 5183

Version: 1.0.0
Date: June 11, 2026
"""

import asyncio
import logging
import time
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional, Set
from uuid import uuid4

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    FastAPI,
    HTTPException,
    Path,
    Query,
    Request,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator

# ============================================================================
# Logging Configuration
# ============================================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("assetmind-capital-flow")

# ============================================================================
# Enums
# ============================================================================

class FlowType(str, Enum):
    """Flow type enumeration"""
    INFLOW = "inflow"
    OUTFLOW = "outflow"
    NET = "net"
    REDEMPTION = "redemption"
    SUBSCRIPTION = "subscription"


class AssetClass(str, Enum):
    """Asset class for flows"""
    EQUITY = "equity"
    FIXED_INCOME = "fixed_income"
    COMMODITY = "commodity"
    CRYPTO = "crypto"
    REAL_ESTATE = "real_estate"
    MONEY_MARKET = "money_market"
    ALTERNATIVE = "alternative"


class TimeFrame(str, Enum):
    """Time frame for flows"""
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


class FlowStatus(str, Enum):
    """Flow status"""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    REVERSED = "reversed"


# ============================================================================
# Pydantic Models
# ============================================================================

class ETFFlow(BaseModel):
    """Individual ETF flow record"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    etf_ticker: str
    date: str # YYYY-MM-DD
    flow_type: FlowType
    amount: float  # In USD millions
    shares: float
    nav: float  # Net Asset Value
    change_pct: float # % change
    status: FlowStatus = FlowStatus.CONFIRMED
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ETFInfo(BaseModel):
    """ETF information"""
    ticker: str
    name: str
    issuer: str
    asset_class: AssetClass
    expense_ratio: float
    aum: float  # Assets Under Management
    avg_volume: float
    inception_date: str
    is_leveraged: bool = False
    is_inverse: bool = False


class FlowSummary(BaseModel):
    """Flow summary for a period"""
    period: str
    start_date: str
    end_date: str
    total_inflow: float
    total_outflow: float
    net_flow: float
    inflow_count: int
    outflow_count: int
    avg_daily_flow: float
    max_inflow: float
    max_outflow: float


class SectorFlow(BaseModel):
    """Sector flow analysis"""
    sector: str
    total_inflow: float
    total_outflow: float
    net_flow: float
    etf_count: int
    top_etf: Optional[str] = None
    change_pct: float


class FlowHistory(BaseModel):
    """Historical flow data"""
    etf_ticker: str
    timeframe: TimeFrame
    flows: List[ETFFlow]
    summary: FlowSummary


class FlowPrediction(BaseModel):
    """Flow prediction"""
    etf_ticker: str
    predicted_date: str
    predicted_flow: float
    confidence_low: float
    confidence_high: float
    model: str
    accuracy_score: float


class FlowAlert(BaseModel):
    """Flow alert configuration"""
    id: str
    etf_ticker: str
    alert_type: str  # large_inflow, large_outflow, flow_reversal
    threshold: float
    active: bool = True
    created_at: datetime


class FlowAlertTrigger(BaseModel):
    """Triggered flow alert"""
    alert_id: str
    etf_ticker: str
    alert_type: str
    current_flow: float
    threshold: float
    triggered_at: datetime
    message: str


class FlowComparison(BaseModel):
    """Flow comparison between ETFs"""
    etfs: List[str]
    period: str
    flows: Dict[str, FlowSummary]
    rankings: Dict[str, int]


class MarketFlowOverview(BaseModel):
    """Market-wide flow overview"""
    date: str
    total_market_inflow: float
    total_market_outflow: float
    net_market_flow: float
    equity_flow: float
    fixed_income_flow: float
    commodity_flow: float
    crypto_flow: float
    sector_flows: List[SectorFlow]


class FlowRequest(BaseModel):
    """Flow query request"""
    etf_ticker: Optional[str] = None
    asset_class: Optional[AssetClass] = None
    flow_type: Optional[FlowType] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    timeframe: TimeFrame = TimeFrame.DAILY
    limit: int = Field(default=100, ge=1, le=500)


class FlowCreate(BaseModel):
    """Flow creation request"""
    etf_ticker: str
    date: str
    flow_type: FlowType
    amount: float
    shares: Optional[float] = None
    nav: Optional[float] = None


class FlowStatistics(BaseModel):
    """Flow statistics"""
    total_flows: int
    total_etfs: int
    total_inflow: float
    total_outflow: float
    net_flow: float
    avg_flow_size: float
    largest_inflow: float
    largest_outflow: float


# ============================================================================
# Application State
# ============================================================================

class CapitalFlowState:
    """Application state for capital flow service"""

    def __init__(self):
        self.flows: Dict[str, ETFFlow] = {}
        self.etf_info: Dict[str, ETFInfo] = {}
        self.alerts: Dict[str, FlowAlert] = {}
        self.start_time = time.time()

    def add_flow(self, flow: ETFFlow):
        """Add a flow record"""
        self.flows[flow.id] = flow

    def get_flows_by_etf(
        self,
        ticker: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: int = 100,
    ) -> List[ETFFlow]:
        """Get flows for an ETF"""
        flows = [f for f in self.flows.values() if f.etf_ticker == ticker]

        if start_date:
            flows = [f for f in flows if f.date >= start_date]
        if end_date:
            flows = [f for f in flows if f.date <= end_date]

        flows.sort(key=lambda f: f.date, reverse=True)
        return flows[:limit]

    def get_flows_by_asset_class(
        self,
        asset_class: AssetClass,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[ETFFlow]:
        """Get flows by asset class"""
        etfs_in_class = [
            ticker for ticker, info in self.etf_info.items()
            if info.asset_class == asset_class
        ]

        flows = []
        for flow in self.flows.values():
            if flow.etf_ticker in etfs_in_class:
                if start_date and flow.date < start_date:
                    continue
                if end_date and flow.date > end_date:
                    continue
                flows.append(flow)

        return flows

    def calculate_summary(
        self,
        flows: List[ETFFlow],
        start_date: str,
        end_date: str,
    ) -> FlowSummary:
        """Calculate flow summary"""
        total_inflow = sum(f.amount for f in flows if f.flow_type == FlowType.INFLOW)
        total_outflow = sum(f.amount for f in flows if f.flow_type == FlowType.OUTFLOW)

        inflow_count = sum(1 for f in flows if f.flow_type == FlowType.INFLOW)
        outflow_count = sum(1 for f in flows if f.flow_type == FlowType.OUTFLOW)

        all_amounts = [f.amount for f in flows if f.flow_type == FlowType.INFLOW]
        max_inflow = max(all_amounts) if all_amounts else 0

        all_outflows = [f.amount for f in flows if f.flow_type == FlowType.OUTFLOW]
        max_outflow = max(all_outflows) if all_outflows else 0

        days = max(1, (datetime.fromisoformat(end_date) - datetime.fromisoformat(start_date)).days)
        avg_daily = (total_inflow - total_outflow) / days

        return FlowSummary(
            period=f"{start_date} to {end_date}",
            start_date=start_date,
            end_date=end_date,
            total_inflow=total_inflow,
            total_outflow=total_outflow,
            net_flow=total_inflow - total_outflow,
            inflow_count=inflow_count,
            outflow_count=outflow_count,
            avg_daily_flow=avg_daily,
            max_inflow=max_inflow,
            max_outflow=max_outflow,
        )

    def get_sector_flows(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
    ) -> List[SectorFlow]:
        """Get flows by sector"""
        sector_data: Dict[str, Dict[str, float]] = {}

        for flow in self.flows.values():
            if start_date and flow.date < start_date:
                continue
            if end_date and flow.date > end_date:
                continue

            etf = self.etf_info.get(flow.etf_ticker)
            if not etf:
                continue

            sector = etf.asset_class.value

            if sector not in sector_data:
                sector_data[sector] = {"inflow": 0, "outflow": 0, "count": 0}

            if flow.flow_type == FlowType.INFLOW:
                sector_data[sector]["inflow"] += flow.amount
            elif flow.flow_type == FlowType.OUTFLOW:
                sector_data[sector]["outflow"] += flow.amount

            sector_data[sector]["count"] += 1

        return [
            SectorFlow(
                sector=sector,
                total_inflow=data["inflow"],
                total_outflow=data["outflow"],
                net_flow=data["inflow"] - data["outflow"],
                etf_count=data["count"],
                change_pct=((data["inflow"] - data["outflow"]) / data["inflow"] * 100) if data["inflow"] > 0 else 0,
            )
            for sector, data in sector_data.items()
        ]

    def get_statistics(self) -> FlowStatistics:
        """Get flow statistics"""
        total_inflow = sum(f.amount for f in self.flows.values() if f.flow_type == FlowType.INFLOW)
        total_outflow = sum(f.amount for f in self.flows.values() if f.flow_type == FlowType.OUTFLOW)

        all_flows = [f.amount for f in self.flows.values()]
        avg_size = sum(all_flows) / len(all_flows) if all_flows else 0
 largest_in = max([f.amount for f in self.flows.values() if f.flow_type == FlowType.INFLOW], default=0)
        largest_out = max([f.amount for f in self.flows.values() if f.flow_type == FlowType.OUTFLOW], default=0)

        return FlowStatistics(
            total_flows=len(self.flows),
            total_etfs=len(self.etf_info),
            total_inflow=total_inflow,
            total_outflow=total_outflow,
            net_flow=total_inflow - total_outflow,
            avg_flow_size=avg_size,
            largest_inflow=largest_in,
            largest_outflow=largest_out,
        )


# Global state
state = CapitalFlowState()


# ============================================================================
# Sample Data Generation
# ============================================================================

def generate_sample_etfs() -> Dict[str, ETFInfo]:
    """Generate sample ETF information"""
    return {
        "SPY": ETFInfo(
            ticker="SPY",
            name="SPDR S&P 500 ETF Trust",
            issuer="State Street",
            asset_class=AssetClass.EQUITY,
            expense_ratio=0.09,
            aum=500000,
            avg_volume=50000000,
            inception_date="1993-01-22",
        ),
        "QQQ": ETFInfo(
            ticker="QQQ",
            name="Invesco QQQ Trust",
            issuer="Invesco",
            asset_class=AssetClass.EQUITY,
            expense_ratio=0.20,
            aum=250000,
            avg_volume=30000000,
            inception_date="1999-03-10",
        ),
        "IWM": ETFInfo(
            ticker="IWM",
            name="iShares Russell 2000 ETF",
            issuer="BlackRock",
            asset_class=AssetClass.EQUITY,
            expense_ratio=0.19,
            aum=60000,
            avg_volume=20000000,
            inception_date="2000-05-22",
        ),
        "GLD": ETFInfo(
            ticker="GLD",
            name="SPDR Gold Shares",
            issuer="State Street",
            asset_class=AssetClass.COMMODITY,
            expense_ratio=0.40,
            aum=60000,
            avg_volume=10000000,
            inception_date="2004-11-18",
        ),
        "TLT": ETFInfo(
            ticker="TLT",
            name="iShares 20+ Year Treasury Bond ETF",
            issuer="BlackRock",
            asset_class=AssetClass.FIXED_INCOME,
            expense_ratio=0.15,
            aum=40000,
            avg_volume=8000000,
            inception_date="2002-07-22",
        ),
        "VNQ": ETFInfo(
            ticker="VNQ",
            name="Vanguard Real Estate ETF",
            issuer="Vanguard",
            asset_class=AssetClass.REAL_ESTATE,
            expense_ratio=0.12,
            aum=30000,
            avg_volume=5000000,
            inception_date="2004-09-23",
        ),
        "BITO": ETFInfo(
            ticker="BITO",
            name="ProShares Bitcoin Strategy ETF",
            issuer="ProShares",
            asset_class=AssetClass.CRYPTO,
            expense_ratio=0.95,
            aum=10000,
            avg_volume=5000000,
            inception_date="2021-10-19",
            is_leveraged=True,
        ),
        "AGG": ETFInfo(
            ticker="AGG",
            name="iShares Core US Aggregate Bond ETF",
            issuer="BlackRock",
            asset_class=AssetClass.FIXED_INCOME,
            expense_ratio=0.03,
            aum=90000,
            avg_volume=5000000,
            inception_date="2003-09-22",
        ),
    }


def generate_sample_flows(etfs: Dict[str, ETFInfo], days: int = 30) -> List[ETFFlow]:
    """Generate sample flow data"""
    import random

    flows = []
    today = datetime.utcnow()

    for etf_ticker, etf_info in etfs.items():
        for i in range(days):
            date = (today - timedelta(days=i)).strftime("%Y-%m-%d")

            # Random flow generation
            if random.random() > 0.3:  # 70% chance of flow
                flow_type = random.choice([FlowType.INFLOW, FlowType.INFLOW, FlowType.OUTFLOW])
                base_amount = etf_info.aum / 1000  # Base on AUM

                if flow_type == FlowType.INFLOW:
                    amount = random.uniform(10, base_amount * 0.1)
                else:
                    amount = random.uniform(10, base_amount * 0.05)

                flows.append(ETFFlow(
                    etf_ticker=etf_ticker,
                    date=date,
                    flow_type=flow_type,
                    amount=round(amount, 2),
                    shares=round(amount * 1000000 / etf_info.avg_volume * 10, 0),
                    nav=round(random.uniform(50, 500), 2),
                    change_pct=round(random.uniform(-3, 3), 2),
                ))

    return flows


# ============================================================================
# Lifespan Manager
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("AssetMind Capital Flow Service starting up...")

    # Initialize sample ETFs
    sample_etfs = generate_sample_etfs()
    for ticker, info in sample_etfs.items():
        state.etf_info[ticker] = info

    # Generate sample flows
    sample_flows = generate_sample_flows(sample_etfs, 30)
    for flow in sample_flows:
        state.add_flow(flow)

    logger.info(f"Capital Flow Service ready with {len(state.etf_info)} ETFs and {len(state.flows)} flows")
    yield

    logger.info("AssetMind Capital Flow Service shutting down...")


# ============================================================================
# FastAPI Application
# ============================================================================

app = FastAPI(
    title="AssetMind Capital Flow Service",
    description="""
    ## AssetMind Capital Flow Service

    ETF flow tracking and capital analysis providing:
    - Real-time flow tracking
    - Historical flow data
    - Flow aggregation by sector/asset class
    - Flow predictions
    - Alert configuration

    ### Asset Classes
    - Equity: Stock ETFs
    - Fixed Income: Bond ETFs
    - Commodity: Gold, oil, etc.
    - Crypto: Cryptocurrency ETFs
    - Real Estate: REITs
    - Money Market: Cash equivalents
    - Alternative: Alternative investments
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Health Check Endpoints
# ============================================================================

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "service": "assetmind-capital-flow",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5183,
        "total_flows": len(state.flows),
        "total_etfs": len(state.etf_info),
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/health/live", tags=["Health"])
async def liveness():
    """Kubernetes liveness probe"""
    return {"status": "alive"}


@app.get("/health/ready", tags=["Health"])
async def readiness():
    """Kubernetes readiness probe"""
    return {"status": "ready", "etfs_loaded": len(state.etf_info)}


# ============================================================================
# ETF Info Endpoints
# ============================================================================

etf_router = APIRouter(prefix="/etfs", tags=["ETFs"])


@etf_router.get("/", response_model=List[ETFInfo])
async def list_etfs(
    asset_class: Optional[AssetClass] = None,
    limit: int = Query(50, ge=1, le=200),
):
    """
    List all ETFs

    Args:
        asset_class: Filter by asset class
        limit: Maximum results

    Returns:
        List of ETFs
    """
    etfs = list(state.etf_info.values())

    if asset_class:
        etfs = [e for e in etfs if e.asset_class == asset_class]

    return etfs[:limit]


@etf_router.get("/{ticker}", response_model=ETFInfo)
async def get_etf(ticker: str):
    """
    Get ETF information

    Args:
        ticker: ETF ticker

    Returns:
        ETF details
    """
    if ticker not in state.etf_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ETF {ticker} not found"
        )

    return state.etf_info[ticker]


@etf_router.post("/", response_model=ETFInfo, status_code=201)
async def create_etf(info: ETFInfo):
    """
    Register a new ETF

    Args:
        info: ETF information

    Returns:
        Created ETF
    """
    if info.ticker in state.etf_info:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"ETF {info.ticker} already exists"
        )

    state.etf_info[info.ticker] = info
    return info


app.include_router(etf_router)


# ============================================================================
# Flow Endpoints
# ============================================================================

flow_router = APIRouter(prefix="/flows", tags=["Flows"])


@flow_router.post("/", response_model=ETFFlow, status_code=201)
async def create_flow(flow: FlowCreate):
    """
    Record a new flow

    Args:
        flow: Flow data

    Returns:
        Created flow
    """
    if flow.etf_ticker not in state.etf_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ETF {flow.etf_ticker} not found"
        )

    etfflow = ETFFlow(
        etf_ticker=flow.etf_ticker,
        date=flow.date,
        flow_type=flow.flow_type,
        amount=flow.amount,
        shares=flow.shares or 0,
        nav=flow.nav or 0,
        change_pct=0,
    )

    state.add_flow(etfflow)
    logger.info(f"Recorded flow: {etfflow.etf_ticker} {etfflow.flow_type.value} ${etfflow.amount}M")

    return etfflow


@flow_router.get("/", response_model=List[ETFFlow])
async def list_flows(
    etf_ticker: Optional[str] = Query(None, description="Filter by ETF ticker"),
    asset_class: Optional[AssetClass] = Query(None, description="Filter by asset class"),
    flow_type: Optional[FlowType] = Query(None, description="Filter by flow type"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    limit: int = Query(100, ge=1, le=500),
):
    """
    List flows with filters

    Args:
        etf_ticker: Filter by ETF
        asset_class: Filter by asset class
        flow_type: Filter by flow type
        start_date: Start date
        end_date: End date
        limit: Maximum results

    Returns:
        List of flows
    """
    if etf_ticker:
        flows = state.get_flows_by_etf(etf_ticker, start_date, end_date, limit)
    elif asset_class:
        flows = state.get_flows_by_asset_class(asset_class, start_date, end_date)
    else:
        flows = list(state.flows.values())

        if flow_type:
            flows = [f for f in flows if f.flow_type == flow_type]
        if start_date:
            flows = [f for f in flows if f.date >= start_date]
        if end_date:
            flows = [f for f in flows if f.date <= end_date]

        flows.sort(key=lambda f: f.date, reverse=True)
        flows = flows[:limit]

    return flows


@flow_router.get("/etf/{ticker}", response_model=Dict[str, Any])
async def get_etf_flows(
    ticker: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    timeframe: TimeFrame = TimeFrame.DAILY,
):
    """
    Get flows for a specific ETF

    Args:
        ticker: ETF ticker
        start_date: Start date
        end_date: End date
        timeframe: Time aggregation

    Returns:
        ETF flows with summary
    """
    if ticker not in state.etf_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ETF {ticker} not found"
        )

    flows = state.get_flows_by_etf(ticker, start_date, end_date)

    # Calculate summary
    if start_date and end_date:
        summary = state.calculate_summary(flows, start_date, end_date)
    else:
        # Default to last 30 days
        end = datetime.utcnow().strftime("%Y-%m-%d")
        start = (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d")
        summary = state.calculate_summary(flows, start, end)

    return {
        "etf": state.etf_info[ticker],
        "flows": flows,
        "summary": summary,
        "timeframe": timeframe.value,
    }


@flow_router.get("/summary", response_model=FlowSummary)
async def get_flow_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    asset_class: Optional[AssetClass] = None,
):
    """
    Get aggregate flow summary

    Args:
        start_date: Start date
        end_date: End date
        asset_class: Filter by asset class

    Returns:
        Flow summary
    """
    if not start_date:
        start_date = (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d")
    if not end_date:
        end_date = datetime.utcnow().strftime("%Y-%m-%d")

    if asset_class:
        flows = state.get_flows_by_asset_class(asset_class, start_date, end_date)
    else:
        flows = [
            f for f in state.flows.values()
            if f.date >= start_date and f.date <= end_date
        ]

    return state.calculate_summary(flows, start_date, end_date)


@flow_router.get("/sectors", response_model=List[SectorFlow])
async def get_sector_flows(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):
    """
    Get flows by sector/asset class

    Args:
        start_date: Start date
        end_date: End date

    Returns:
        Sector flow analysis
    """
    return state.get_sector_flows(start_date, end_date)


app.include_router(flow_router)


# ============================================================================
# Market Overview Endpoints
# ============================================================================

@app.get("/overview", response_model=MarketFlowOverview, tags=["Market"])
async def get_market_overview(
    date: Optional[str] = Query(None, description="Date (YYYY-MM-DD)"),
):
    """
    Get market-wide flow overview

    Args:
        date: Specific date (default: today)

    Returns:
        Market flow overview
    """
    if not date:
        date = datetime.utcnow().strftime("%Y-%m-%d")

    # Get flows for the date
    day_flows = [f for f in state.flows.values() if f.date == date]

    total_inflow = sum(f.amount for f in day_flows if f.flow_type == FlowType.INFLOW)
    total_outflow = sum(f.amount for f in day_flows if f.flow_type == FlowType.OUTFLOW)

    # Get sector flows
    sector_flows = state.get_sector_flows(date, date)

    # Get specific asset class flows
    equity_flows = state.get_flows_by_asset_class(AssetClass.EQUITY, date, date)
    fi_flows = state.get_flows_by_asset_class(AssetClass.FIXED_INCOME, date, date)
    commodity_flows = state.get_flows_by_asset_class(AssetClass.COMMODITY, date, date)
    crypto_flows = state.get_flows_by_asset_class(AssetClass.CRYPTO, date, date)

    equity_net = sum(f.amount for f in equity_flows if f.flow_type == FlowType.INFLOW) - \
                 sum(f.amount for f in equity_flows if f.flow_type == FlowType.OUTFLOW)
    fi_net = sum(f.amount for f in fi_flows if f.flow_type == FlowType.INFLOW) - \
             sum(f.amount for f in fi_flows if f.flow_type == FlowType.OUTFLOW)
    commodity_net = sum(f.amount for f in commodity_flows if f.flow_type == FlowType.INFLOW) - \
                     sum(f.amount for f in commodity_flows if f.flow_type == FlowType.OUTFLOW)
    crypto_net = sum(f.amount for f in crypto_flows if f.flow_type == FlowType.INFLOW) - \
                 sum(f.amount for f in crypto_flows if f.flow_type == FlowType.OUTFLOW)

    return MarketFlowOverview(
        date=date,
        total_market_inflow=total_inflow,
        total_market_outflow=total_outflow,
        net_market_flow=total_inflow - total_outflow,
        equity_flow=equity_net,
        fixed_income_flow=fi_net,
        commodity_flow=commodity_net,
        crypto_flow=crypto_net,
        sector_flows=sector_flows,
    )


@app.get("/trends", tags=["Market"])
async def get_flow_trends(
    days: int = Query(30, ge=7, le=365),
    asset_class: Optional[AssetClass] = None,
):
    """
    Get flow trends over time

    Args:
        days: Number of days
        asset_class: Filter by asset class

    Returns:
        Daily flow trends
    """
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    trends = []
    for i in range(days):
        date = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")

        if asset_class:
            flows = state.get_flows_by_asset_class(asset_class, date, date)
        else:
            flows = [f for f in state.flows.values() if f.date == date]

        inflow = sum(f.amount for f in flows if f.flow_type == FlowType.INFLOW)
        outflow = sum(f.amount for f in flows if f.flow_type == FlowType.OUTFLOW)

        trends.append({
            "date": date,
            "inflow": round(inflow, 2),
            "outflow": round(outflow, 2),
            "net": round(inflow - outflow, 2),
        })

    return {
        "period_days": days,
        "asset_class": asset_class.value if asset_class else "all",
        "trends": trends,
    }


# ============================================================================
# Predictions Endpoints
# ============================================================================

predictions_router = APIRouter(prefix="/predictions", tags=["Predictions"])


@predictions_router.get("/etf/{ticker}", response_model=List[FlowPrediction])
async def predict_etf_flows(
    ticker: str,
    days: int = Query(7, ge=1, le=30),
):
    """
    Predict ETF flows

    Args:
        ticker: ETF ticker
        days: Number of days to predict

    Returns:
        Flow predictions
    """
    if ticker not in state.etf_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ETF {ticker} not found"
        )

    # Get historical flows
    flows = state.get_flows_by_etf(ticker, limit=30)

    if not flows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No historical flows for {ticker}"
        )

    # Calculate average flow
    avg_flow = sum(f.amount for f in flows) / len(flows) if flows else 0

    # Generate predictions
    predictions = []
    for i in range(1, days + 1):
        pred_date = (datetime.utcnow() + timedelta(days=i)).strftime("%Y-%m-%d")

        # Simple prediction based on historical average
        predicted = avg_flow * (1 + (i / days) * 0.1)  # Slight trend

        predictions.append(FlowPrediction(
            etf_ticker=ticker,
            predicted_date=pred_date,
            predicted_flow=round(predicted, 2),
            confidence_low=round(predicted * 0.8, 2),
            confidence_high=round(predicted * 1.2, 2),
            model="simple_average",
            accuracy_score=0.65,
        ))

    return predictions


@predictions_router.get("/market", response_model=Dict[str, Any])
async def predict_market_flows(
    days: int = Query(7, ge=1, le=30),
):
    """
    Predict market-wide flows

    Args:
        days: Number of days to predict

    Returns:
        Market flow predictions
    """
    all_flows = list(state.flows.values())

    if not all_flows:
        return {
            "predictions": [],
            "total_predicted_inflow": 0,
            "total_predicted_outflow": 0,
        }

    avg_inflow = sum(f.amount for f in all_flows if f.flow_type == FlowType.INFLOW) / max(1, len(all_flows))
    avg_outflow = sum(f.amount for f in all_flows if f.flow_type == FlowType.OUTFLOW) / max(1, len(all_flows))

    predictions = []
    for i in range(1, days + 1):
        pred_date = (datetime.utcnow() + timedelta(days=i)).strftime("%Y-%m-%d")

        predictions.append({
            "date": pred_date,
            "predicted_inflow": round(avg_inflow * 1.1, 2),
            "predicted_outflow": round(avg_outflow * 0.9, 2),
            "predicted_net": round((avg_inflow * 1.1) - (avg_outflow * 0.9), 2),
        })

    return {
        "predictions": predictions,
        "total_predicted_inflow": round(sum(p["predicted_inflow"] for p in predictions), 2),
        "total_predicted_outflow": round(sum(p["predicted_outflow"] for p in predictions), 2),
        "total_predicted_net": round(sum(p["predicted_net"] for p in predictions), 2),
    }


app.include_router(predictions_router)


# ============================================================================
# Alerts Endpoints
# ============================================================================

alerts_router = APIRouter(prefix="/alerts", tags=["Alerts"])


@alerts_router.post("/", response_model=FlowAlert, status_code=201)
async def create_alert(alert: FlowAlert):
    """
    Create a flow alert

    Args:
        alert: Alert configuration

    Returns:
        Created alert
    """
    state.alerts[alert.id] = alert
    return alert


@alerts_router.get("/", response_model=List[FlowAlert])
async def list_alerts(
    etf_ticker: Optional[str] = None,
    active_only: bool = False,
):
    """
    List flow alerts

    Args:
        etf_ticker: Filter by ETF
        active_only: Only active alerts

    Returns:
        List of alerts
    """
    alerts = list(state.alerts.values())

    if etf_ticker:
        alerts = [a for a in alerts if a.etf_ticker == etf_ticker]
    if active_only:
        alerts = [a for a in alerts if a.active]

    return alerts


@alerts_router.post("/check/{etf_ticker}", response_model=List[FlowAlertTrigger])
async def check_alerts(etf_ticker: str):
    """
    Check alerts for an ETF

    Args:
        etf_ticker: ETF ticker

    Returns:
        Triggered alerts
    """
    if etf_ticker not in state.etf_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ETF {etf_ticker} not found"
        )

    # Get latest flow
    flows = state.get_flows_by_etf(etf_ticker, limit=1)

    if not flows:
        return []

    latest_flow = flows[0]
    triggered = []

    for alert in state.alerts.values():
        if alert.etf_ticker != etf_ticker or not alert.active:
            continue

        should_trigger = False
        message = ""

        if alert.alert_type == "large_inflow" and latest_flow.flow_type == FlowType.INFLOW:
            if latest_flow.amount >= alert.threshold:
                should_trigger = True
                message = f"Large inflow detected: ${latest_flow.amount}M (threshold: ${alert.threshold}M)"

        elif alert.alert_type == "large_outflow" and latest_flow.flow_type == FlowType.OUTFLOW:
            if latest_flow.amount >= alert.threshold:
                should_trigger = True
                message = f"Large outflow detected: ${latest_flow.amount}M (threshold: ${alert.threshold}M)"

        if should_trigger:
            triggered.append(FlowAlertTrigger(
                alert_id=alert.id,
                etf_ticker=etf_ticker,
                alert_type=alert.alert_type,
                current_flow=latest_flow.amount,
                threshold=alert.threshold,
                triggered_at=datetime.utcnow(),
                message=message,
            ))

    return triggered


@alerts_router.delete("/{alert_id}", status_code=204)
async def delete_alert(alert_id: str):
    """
    Delete an alert

    Args:
        alert_id: Alert UUID
    """
    if alert_id not in state.alerts:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert {alert_id} not found"
        )

    del state.alerts[alert_id]


app.include_router(alerts_router)


# ============================================================================
# Comparison Endpoints
# ============================================================================

@app.post("/compare", response_model=FlowComparison, tags=["Analysis"])
async def compare_etfs(
    etfs: List[str],
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):
    """
    Compare flows between ETFs

    Args:
        etfs: List of ETF tickers
        start_date: Start date
        end_date: End date

    Returns:
        Flow comparison
    """
    if len(etfs) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least 2 ETFs required for comparison"
        )

    if not start_date:
        start_date = (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d")
    if not end_date:
        end_date = datetime.utcnow().strftime("%Y-%m-%d")

    flows: Dict[str, FlowSummary] = {}
    net_flows = []

    for ticker in etfs:
        if ticker not in state.etf_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"ETF {ticker} not found"
            )

        etf_flows = state.get_flows_by_etf(ticker, start_date, end_date)
        summary = state.calculate_summary(etf_flows, start_date, end_date)
        flows[ticker] = summary
        net_flows.append((ticker, summary.net_flow))

    # Rank by net flow
    rankings = {
        ticker: rank + 1
        for rank, (ticker, _) in enumerate(sorted(net_flows, key=lambda x: x[1], reverse=True))
    }

    return FlowComparison(
        etfs=etfs,
        period=f"{start_date} to {end_date}",
        flows=flows,
        rankings=rankings,
    )


# ============================================================================
# Statistics Endpoints
# ============================================================================

@app.get("/statistics", response_model=FlowStatistics, tags=["Statistics"])
async def get_statistics():
    """
    Get flow statistics

    Returns:
        Service statistics
    """
    return state.get_statistics()


# ============================================================================
# Top ETFs Endpoints
# ============================================================================

@app.get("/top/inflows", response_model=List[Dict[str, Any]], tags=["Rankings"])
async def get_top_inflows(
    days: int = Query(7, ge=1, le=30),
    limit: int = Query(10, ge=1, le=50),
):
    """
    Get top ETFs by inflows

    Args:
        days: Lookback period
        limit: Number of results

    Returns:
        Top inflow ETFs
    """
    end_date = datetime.utcnow()
    start_date = (end_date - timedelta(days=days)).strftime("%Y-%m-%d")
    end_date_str = end_date.strftime("%Y-%m-%d")

    # Aggregate flows by ETF
    etf_flows: Dict[str, float] = {}

    for flow in state.flows.values():
        if flow.date >= start_date and flow.date <= end_date_str:
            if flow.flow_type == FlowType.INFLOW:
                etf_flows[flow.etf_ticker] = etf_flows.get(flow.etf_ticker, 0) + flow.amount

    # Sort and return top
    sorted_etfs = sorted(etf_flows.items(), key=lambda x: x[1], reverse=True)[:limit]

    return [
        {
            "ticker": ticker,
            "total_inflow": round(amount, 2),
            "etf_info": state.etf_info.get(ticker),
        }
        for ticker, amount in sorted_etfs
    ]


@app.get("/top/outflows", response_model=List[Dict[str, Any]], tags=["Rankings"])
async def get_top_outflows(
    days: int = Query(7, ge=1, le=30),
    limit: int = Query(10, ge=1, le=50),
):
    """
    Get top ETFs by outflows

    Args:
        days: Lookback period
        limit: Number of results

    Returns:
        Top outflow ETFs
    """
    end_date = datetime.utcnow()
    start_date = (end_date - timedelta(days=days)).strftime("%Y-%m-%d")
    end_date_str = end_date.strftime("%Y-%m-%d")

    # Aggregate flows by ETF
    etf_flows: Dict[str, float] = {}

    for flow in state.flows.values():
        if flow.date >= start_date and flow.date <= end_date_str:
            if flow.flow_type == FlowType.OUTFLOW:
                etf_flows[flow.etf_ticker] = etf_flows.get(flow.etf_ticker, 0) + flow.amount

    # Sort and return top
    sorted_etfs = sorted(etf_flows.items(), key=lambda x: x[1], reverse=True)[:limit]

    return [
        {
            "ticker": ticker,
            "total_outflow": round(amount, 2),
            "etf_info": state.etf_info.get(ticker),
        }
        for ticker, amount in sorted_etfs
    ]


# ============================================================================
# Root Endpoint
# ============================================================================

@app.get("/", include_in_schema=False)
async def root():
    """Root endpoint"""
    return {
        "service": "AssetMind Capital Flow Service",
        "version": "1.0.0",
        "port": 5183,
        "total_flows": len(state.flows),
        "total_etfs": len(state.etf_info),
        "docs": "/docs"
    }


# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=5183,
        reload=True,
        log_level="info"
    )
