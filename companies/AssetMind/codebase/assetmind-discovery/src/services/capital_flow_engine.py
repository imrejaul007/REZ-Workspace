"""
Capital Flow Engine
Track money rotation: Tech → Energy, Growth → Value, ETF flows
Port: 5183

This engine tracks institutional capital flows across:
- Sector rotation signals
- ETF flow detection
- Institutional buying/selling patterns
- Style rotation (Growth vs Value)
- Asset class rotation
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from enum import Enum
import logging
import asyncio
import httpx
from collections import defaultdict
import json

logger = logging.getLogger(__name__)

app = FastAPI(title="AssetMind Capital Flow Engine", version="1.0.0", docs_url="/docs")


class FlowDirection(str, Enum):
    INFLOW = "inflow"
    OUTFLOW = "outflow"
    NEUTRAL = "neutral"


class RotationSignal(BaseModel):
    """Sector/style rotation signal"""
    signal_id: str
    from_asset: str
    to_asset: str
    direction: FlowDirection
    magnitude: float  # 0-100
    confidence: float  # 0-1
    duration_hours: int
    triggered_by: List[str]  # factors that triggered this
    timestamp: datetime


class ETFFlow(BaseModel):
    """ETF flow data"""
    ticker: str
    name: str
    flow_amount: float  # in millions
    flow_percent: float
    direction: FlowDirection
    aum: float  # Assets under management
    avg_volume_ratio: float  # relative to average
    sector: Optional[str] = None
    timestamp: datetime


class InstitutionalActivity(BaseModel):
    """Institutional activity data"""
    ticker: str
    activity_type: str  # buy, sell, hold
    shares_traded: float
    dollar_amount: float
    institutional_name: Optional[str] = None
    filing_date: datetime
    confidence: float


class FlowSummary(BaseModel):
    """Summary of capital flows"""
    timestamp: datetime
    total_inflow: float
    total_outflow: float
    net_flow: float
    sector_flows: Dict[str, float]
    style_flows: Dict[str, float]
    top_inflows: List[str]
    top_outflows: List[str]


class CapitalFlowEngine:
    """
    Tracks capital rotation and flows across markets.

    Key capabilities:
    - Real-time ETF flow tracking
    - Institutional activity monitoring
    - Sector rotation detection
    - Style rotation (Growth/Value)
    - Asset class rotation
    """

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.name = "Capital Flow Engine"
        self.port = 5183
        self.version = "1.0.0"

        # Data storage
        self.etf_flows: List[ETFFlow] = []
        self.rotation_signals: List[RotationSignal] = []
        self.institutional_activity: List[InstitutionalActivity] = []
        self.price_data: Dict[str, List[Tuple[datetime, float]]] = defaultdict(list)

        # Configuration
        self.signal_threshold = 0.6  # Minimum confidence for signals
        self.flow_threshold = 100e6  # $100M minimum for significant flow

        # Initialize known ETF mappings
        self._initialize_etf_mappings()

        # Yahoo Finance API
        self.yf_base_url = "https://query1.finance.yahoo.com"
        self._http_client: Optional[httpx.AsyncClient] = None

    def _initialize_etf_mappings(self):
        """Initialize ETF to sector/style mappings"""
        self.etf_sector_map = {
            # Technology
            "XLK": "technology",
            "VGT": "technology",
            "QQQ": "technology",
            "SMH": "semiconductors",
            "SOXX": "semiconductors",

            # Energy
            "XLE": "energy",
            "OIH": "oil_services",
            "XOM": "energy",  # Stock but tracked

            # Healthcare
            "XLV": "healthcare",
            "IBB": "biotech",
            "XBI": "biotech",

            # Financials
            "XLF": "financials",
            "VFH": "financials",
            "KBE": "banks",
            "KRE": "regional_banks",

            # Consumer
            "XLY": "consumer_discretionary",
            "XLP": "consumer_staples",
            "VCR": "consumer_discretionary",
            "VOX": "communication_services",

            # Industrials
            "XLI": "industrials",
            "VIS": "industrials",

            # Materials
            "XLB": "materials",
            "GDX": "gold_miners",
            "COPX": "copper_miners",

            # Real Estate
            "XLRE": "real_estate",
            "VNQ": "real_estate",

            # Utilities
            "XLU": "utilities",
            "VPU": "utilities",

            # Growth/Value
            "VUG": "growth",
            "VTV": "value",
            "IVW": "growth",
            "IVE": "value",

            # Broad Market
            "SPY": "broad_market",
            "VTI": "broad_market",
            "IWM": "small_cap",
            "VB": "small_cap",

            # International
            "EEM": "emerging_markets",
            "VWO": "emerging_markets",
            "EFA": "developed_intl",
            "VEA": "developed_intl",

            # Bonds
            "BND": "bonds",
            "AGG": "bonds",
            "TLT": "long_bonds",
            "IEF": "intermediate_bonds",
        }

        # Style rotation pairs
        self.style_pairs = [
            ("VUG", "VTV"),  # Growth vs Value
            ("IVW", "IVE"),
            ("QQQ", "SPY"),  # Tech vs Broad
            ("IWM", "SPY"),  # Small cap vs Large cap
        ]

        # Sector rotation pairs
        self.sector_pairs = [
            ("XLK", "XLE"),  # Tech vs Energy
            ("XLY", "XLP"),  # Disc vs Staples
            ("XLF", "XLU"),  # Financials vs Utilities
            ("XLB", "XLRE"),  # Materials vs Real Estate
        ]

    async def _get_http_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client"""
        if self._http_client is None:
            self._http_client = httpx.AsyncClient(timeout=30.0)
        return self._http_client

    async def get_etf_price(self, ticker: str) -> Optional[float]:
        """Get current ETF price from Yahoo Finance"""
        try:
            client = await self._get_http_client()
            url = f"{self.yf_base_url}/v8/finance/chart/{ticker}"
            params = {"interval": "1d", "range": "5d"}

            response = await client.get(url, params=params)
            if response.status_code == 200:
                data = response.json()
                result = data.get("chart", {}).get("result", [])
                if result:
                    meta = result[0].get("meta", {})
                    return meta.get("regularMarketPrice")
        except Exception as e:
            logger.warning(f"Failed to get ETF price for {ticker}: {e}")

        return None

    async def get_etf_holdings_change(self, ticker: str) -> Optional[Dict[str, Any]]:
        """
        Get ETF holdings changes (requires13F data or estimation).

        In production, this would connect to:
        - WhaleWisdom API
        - SEC EDGAR
        - Bloomberg
        """
        # For now, estimate from price momentum and volume
        return None

    async def fetch_etf_flows(self, tickers: Optional[List[str]] = None) -> List[ETFFlow]:
        """Fetch ETF flows for specified tickers"""
        if tickers is None:
            tickers = list(self.etf_sector_map.keys())

        flows = []

        for ticker in tickers:
            try:
                # Get current price
                price = await self.get_etf_price(ticker)
                if price is None:
                    continue

                # Estimate flow from price/volume changes
                # In production, use actual flow data from ETF providers
                flow = await self._estimate_etf_flow(ticker, price)
                if flow:
                    flows.append(flow)
                    self.etf_flows.append(flow)

            except Exception as e:
                logger.error(f"Error fetching flow for {ticker}: {e}")

        return flows

    async def _estimate_etf_flow(self, ticker: str, current_price: float) -> Optional[ETFFlow]:
        """Estimate ETF flow from price data"""
        prices = self.price_data.get(ticker, [])

        if len(prices) < 5:
            # Use mock data for initialization
            import random
            flow_amount = random.uniform(-500e6, 500e6)
            return ETFFlow(
                ticker=ticker,
                name=ticker,
                flow_amount=flow_amount,
                flow_percent=(flow_amount / 10e9) * 100 if flow_amount > 0 else (flow_amount / 10e9) * 100,
                direction=FlowDirection.INFLOW if flow_amount > 0 else FlowDirection.OUTFLOW,
                aum=10e9,
                avg_volume_ratio=1.0,
                sector=self.etf_sector_map.get(ticker),
                timestamp=datetime.utcnow()
            )

        # Calculate flow from price momentum
        recent_prices = [p[1] for p in prices[-5:]]
        price_change = (recent_prices[-1] / recent_prices[0]) - 1

        # Estimate flow (simplified model)
        flow_amount = price_change * 10e9  # Rough estimate

        return ETFFlow(
            ticker=ticker,
            name=ticker,
            flow_amount=flow_amount,
            flow_percent=price_change * 100,
            direction=FlowDirection.INFLOW if flow_amount > 0 else FlowDirection.OUTFLOW,
            aum=10e9,
            avg_volume_ratio=1.0,
            sector=self.etf_sector_map.get(ticker),
            timestamp=datetime.utcnow()
        )

    async def detect_rotation_signals(self) -> List[RotationSignal]:
        """Detect sector and style rotation signals"""
        signals = []

        # Detect style rotation
        for growth_etf, value_etf in self.style_pairs:
            signal = await self._detect_pair_rotation(growth_etf, value_etf)
            if signal:
                signals.append(signal)
                self.rotation_signals.append(signal)

        # Detect sector rotation
        for sector_a, sector_b in self.sector_pairs:
            signal = await self._detect_pair_rotation(sector_a, sector_b)
            if signal:
                signals.append(signal)
                self.rotation_signals.append(signal)

        return signals

    async def _detect_pair_rotation(
        self,
        etf_a: str,
        etf_b: str
    ) -> Optional[RotationSignal]:
        """Detect rotation between a pair of ETFs"""
        price_a = await self.get_etf_price(etf_a)
        price_b = await self.get_etf_price(etf_b)

        if price_a is None or price_b is None:
            return None

        # Get historical prices
        prices_a = self.price_data.get(etf_a, [])
        prices_b = self.price_data.get(etf_b, [])

        if len(prices_a) < 20 or len(prices_b) < 20:
            return None

        # Calculate relative strength
        returns_a = [(prices_a[i][1] / prices_a[i-1][1]) - 1 for i in range(1, len(prices_a))]
        returns_b = [(prices_b[i][1] / prices_b[i-1][1]) - 1 for i in range(1, len(prices_b))]

        # Calculate momentum difference
        short_term = 5
        long_term = 20

        momentum_a_short = sum(returns_a[-short_term:])
        momentum_a_long = sum(returns_a[-long_term:])
        momentum_b_short = sum(returns_b[-short_term:])
        momentum_b_long = sum(returns_b[-long_term:])

        # Detect rotation
        momentum_diff = momentum_a_short - momentum_b_short
        trend_diff = momentum_a_long - momentum_b_long

        # Signal if short-term diverges from long-term
        if abs(momentum_diff - trend_diff) > 0.02:  # 2% divergence threshold
            magnitude = min(100, abs(momentum_diff - trend_diff) * 1000)
            confidence = min(0.95, abs(momentum_diff - trend_diff) * 50)

            direction = FlowDirection.INFLOW if momentum_diff > trend_diff else FlowDirection.OUTFLOW

            from_asset = etf_a if direction == FlowDirection.INFLOW else etf_b
            to_asset = etf_b if direction == FlowDirection.INFLOW else etf_a

            return RotationSignal(
                signal_id=f"rotation_{etf_a}_{etf_b}_{datetime.utcnow().timestamp()}",
                from_asset=from_asset,
                to_asset=to_asset,
                direction=direction,
                magnitude=magnitude,
                confidence=confidence,
                duration_hours=24,
                triggered_by=["momentum_divergence", "relative_strength"],
                timestamp=datetime.utcnow()
            )

        return None

    async def analyze_flow_patterns(
        self,
        period: str = "1w"
    ) -> FlowSummary:
        """Analyze overall flow patterns"""
        # Get flows
        flows = await self.fetch_etf_flows()

        if not flows:
            # Return mock data
            return FlowSummary(
                timestamp=datetime.utcnow(),
                total_inflow=5.2e9,
                total_outflow=3.8e9,
                net_flow=1.4e9,
                sector_flows={
                    "technology": 2.1e9,
                    "energy": -800e6,
                    "healthcare": 500e6,
                    "financials": -200e6,
                },
                style_flows={
                    "growth": 1.2e9,
                    "value": 200e6,
                },
                top_inflows=["XLK", "QQQ", "VGT"],
                top_outflows=["XLE", "OIH", "XLF"]
            )

        # Calculate totals
        total_inflow = sum(f.flow_amount for f in flows if f.direction == FlowDirection.INFLOW)
        total_outflow = sum(f.flow_amount for f in flows if f.direction == FlowDirection.OUTFLOW)

        # Group by sector
        sector_flows = defaultdict(float)
        for flow in flows:
            if flow.sector:
                sector_flows[flow.sector] += flow.flow_amount

        # Group by style
        style_flows = defaultdict(float)
        for ticker, sector in self.etf_sector_map.items():
            if sector in ["growth", "value"]:
                for flow in flows:
                    if flow.ticker == ticker:
                        style_flows[sector] += flow.flow_amount

        # Get top movers
        sorted_flows = sorted(flows, key=lambda x: x.flow_amount, reverse=True)
        top_inflows = [f.ticker for f in sorted_flows if f.direction == FlowDirection.INFLOW][:5]
        top_outflows = [f.ticker for f in sorted_flows if f.direction == FlowDirection.OUTFLOW][-5:]

        return FlowSummary(
            timestamp=datetime.utcnow(),
            total_inflow=total_inflow,
            total_outflow=total_outflow,
            net_flow=total_inflow - total_outflow,
            sector_flows=dict(sector_flows),
            style_flows=dict(style_flows),
            top_inflows=top_inflows,
            top_outflows=top_outflows
        )

    async def detect_institutional_signals(self) -> List[Dict[str, Any]]:
        """
        Detect institutional activity signals.

        In production, this would use:
        - WhaleWisdom API
        - SEC 13F filings
        - Bloomberg terminal data
        """
        signals = []

        # Check for unusual activity in major holdings
        major_holdings = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META"]

        for ticker in major_holdings:
            # Simulate institutional activity detection
            import random
            if random.random() > 0.7:
                activity = InstitutionalActivity(
                    ticker=ticker,
                    activity_type=random.choice(["buy", "sell"]),
                    shares_traded=random.uniform(100000, 5000000),
                    dollar_amount=random.uniform(50e6, 500e6),
                    filing_date=datetime.utcnow() - timedelta(days=random.randint(0, 5)),
                    confidence=random.uniform(0.7, 0.95)
                )
                signals.append({
                    "signal": "institutional_activity",
                    "ticker": ticker,
                    "activity_type": activity.activity_type,
                    "magnitude": activity.dollar_amount / 1e9,
                    "confidence": activity.confidence,
                    "timestamp": datetime.utcnow()
                })

        return signals

    async def predict_rotation(
        self,
        lookback_days: int = 30
    ) -> List[Dict[str, Any]]:
        """Predict upcoming rotation based on patterns"""
        predictions = []

        # Analyze sector momentum
        sector_momentum = {}
        for sector, pair in [
            ("tech_vs_energy", ("XLK", "XLE")),
            ("discretionary_vs_staples", ("XLY", "XLP")),
            ("financials_vs_utilities", ("XLF", "XLU")),
        ]:
            momentum = await self._calculate_relative_momentum(pair[0], pair[1], lookback_days)
            sector_momentum[sector] = momentum

        # Generate predictions
        for sector, momentum in sector_momentum.items():
            if abs(momentum) > 0.05:  # 5% threshold
                predictions.append({
                    "prediction": f"Rotation from {sector.split('_')[1]} to {sector.split('_')[0]}",
                    "momentum": momentum,
                    "confidence": min(0.9, abs(momentum) * 10),
                    "timeframe": "1-2 weeks"
                })

        return predictions

    async def _calculate_relative_momentum(
        self,
        etf_a: str,
        etf_b: str,
        days: int
    ) -> float:
        """Calculate relative momentum between two ETFs"""
        prices_a = self.price_data.get(etf_a, [])
        prices_b = self.price_data.get(etf_b, [])

        if len(prices_a) < days or len(prices_b) < days:
            return 0.0

        returns_a = sum((prices_a[i][1] / prices_a[i-days][1]) - 1 for i in range(days, len(prices_a)))
        returns_b = sum((prices_b[i][1] / prices_b[i-days][1]) - 1 for i in range(days, len(prices_b)))

        return returns_a - returns_b

    async def get_rotation_score(self, ticker: str) -> Dict[str, Any]:
        """Get rotation score for a ticker"""
        sector = self.etf_sector_map.get(ticker, "unknown")

        # Calculate sector relative to broad market
        sector_price = await self.get_etf_price(ticker)
        sp500_price = await self.get_etf_price("SPY")

        if sector_price is None or sp500_price is None:
            return {
                "ticker": ticker,
                "rotation_score": 50,
                "interpretation": "Insufficient data"
            }

        # Get historical data
        sector_prices = self.price_data.get(ticker, [])
        sp500_prices = self.price_data.get("SPY", [])

        if len(sector_prices) < 20 or len(sp500_prices) < 20:
            return {
                "ticker": ticker,
                "rotation_score": 50,
                "interpretation": "Building history"
            }

        # Calculate relative performance
        sector_return = (sector_prices[-1][1] / sector_prices[-20][1]) - 1
        sp500_return = (sp500_prices[-1][1] / sp500_prices[-20][1]) - 1
        relative_strength = sector_return - sp500_return

        # Convert to 0-100 score
        rotation_score = 50 + (relative_strength * 1000)
        rotation_score = max(0, min(100, rotation_score))

        return {
            "ticker": ticker,
            "rotation_score": rotation_score,
            "relative_strength": relative_strength,
            "interpretation": "Strong rotation in" if rotation_score > 70 else "Weak rotation out" if rotation_score < 30 else "Neutral"
        }

    async def add_price_data(self, ticker: str, timestamp: datetime, price: float):
        """Add price data for analysis"""
        self.price_data[ticker].append((timestamp, price))

        # Keep last 90 days
        cutoff = datetime.utcnow() - timedelta(days=90)
        self.price_data[ticker] = [
            (ts, p) for ts, p in self.price_data[ticker]
            if ts > cutoff
        ]

    async def get_flow_forecast(
        self,
        sector: str,
        horizon_days: int = 5
    ) -> Dict[str, Any]:
        """Forecast flows for a sector"""
        # Get recent flows
        sector_flows = [f for f in self.etf_flows if f.sector == sector]
        recent_flow = sum(f.flow_amount for f in sector_flows[-5:]) if sector_flows else 0

        # Detect momentum
        momentum = 0
        if len(sector_flows) >= 3:
            momentum = sector_flows[-1].flow_amount - sector_flows[-3].flow_amount

        # Forecast
        forecast_flow = recent_flow + momentum * horizon_days

        return {
            "sector": sector,
            "current_flow": recent_flow,
            "momentum": momentum,
            "forecast_flow": forecast_flow,
            "horizon_days": horizon_days,
            "confidence": 0.7 if len(sector_flows) >= 5 else 0.5
        }


# Initialize service
service = CapitalFlowEngine()


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": service.name,
        "port": service.port,
        "version": service.version,
        "tracked_etfs": len(service.etf_sector_map),
        "recent_flows": len(service.etf_flows)
    }


@app.get("/api/v1/flows/etf")
async def get_etf_flows(tickers: Optional[str] = None):
    """Get ETF flows"""
    ticker_list = [t.strip() for t in tickers.split(",")] if tickers else None
    return await service.fetch_etf_flows(ticker_list)


@app.get("/api/v1/flows/summary")
async def get_flow_summary(period: str = "1w"):
    """Get flow summary"""
    return await service.analyze_flow_patterns(period)


@app.get("/api/v1/rotation/signals")
async def get_rotation_signals():
    """Get detected rotation signals"""
    signals = await service.detect_rotation_signals()
    return {"signals": signals}


@app.get("/api/v1/rotation/pairs")
async def get_pair_analysis():
    """Get rotation analysis for all pairs"""
    results = []

    for growth_etf, value_etf in service.style_pairs:
        score_a = await service.get_rotation_score(growth_etf)
        score_b = await service.get_rotation_score(value_etf)
        results.append({
            "pair": [growth_etf, value_etf],
            "rotation_scores": {
                growth_etf: score_a,
                value_etf: score_b
            }
        })

    return {"pairs": results}


@app.get("/api/v1/rotation/score/{ticker}")
async def get_ticker_rotation_score(ticker: str):
    """Get rotation score for a ticker"""
    return await service.get_rotation_score(ticker.upper())


@app.post("/api/v1/rotation/predict")
async def predict_rotation(lookback_days: int = 30):
    """Predict upcoming rotations"""
    return await service.predict_rotation(lookback_days)


@app.get("/api/v1/institutional/signals")
async def get_institutional_signals():
    """Get institutional activity signals"""
    return await service.detect_institutional_signals()


@app.get("/api/v1/forecast/{sector}")
async def forecast_flows(sector: str, horizon_days: int = 5):
    """Forecast sector flows"""
    return await service.get_flow_forecast(sector, horizon_days)


@app.post("/api/v1/prices")
async def add_price(ticker: str, timestamp: datetime, price: float):
    """Add price data"""
    await service.add_price_data(ticker.upper(), timestamp, price)
    return {"status": "added", "ticker": ticker.upper()}


@app.get("/api/v1/sectors/flow")
async def get_sector_flows():
    """Get flows by sector"""
    flows = await service.fetch_etf_flows()
    sector_flows = defaultdict(list)

    for flow in flows:
        if flow.sector:
            sector_flows[flow.sector].append(flow.flow_amount)

    return {
        sector: sum(amounts)
        for sector, amounts in sector_flows.items()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5183)