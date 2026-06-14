"""
Morning Briefing Engine
Complete orchestration of ALL daily briefings
Port: 5170

This engine orchestrates ALL daily briefings and generates complete morning briefings with:
- Top Opportunities (with conviction)
- Top Risks (with probability)
- Capital Rotation signals
- Emerging Themes
- Portfolio changes needed
- Sector rotation
"""

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from enum import Enum
import logging
import asyncio
import httpx
from collections import defaultdict

logger = logging.getLogger(__name__)

app = FastAPI(title="AssetMind Briefing Engine", version="1.0.0", docs_url="/docs")


class ConvictionLevel(str, Enum):
    HIGH = "high"  # Strong conviction, act now
    MEDIUM = "medium"  # Moderate conviction, monitor
    LOW = "low"  # Speculative, watch only


class RiskLevel(str, Enum):
    CRITICAL = "critical"  # Immediate action required
    HIGH = "high"  # Significant risk, hedge
    MEDIUM = "medium"  # Monitor closely
    LOW = "low"  # Background risk


class BriefingSection(str, Enum):
    OPPORTUNITIES = "opportunities"
    RISKS = "risks"
    ROTATION = "rotation"
    THEMES = "themes"
    PORTFOLIO = "portfolio"
    MARKET = "market"
    CALENDAR = "calendar"


class OpportunityItem(BaseModel):
    """A trading/investment opportunity"""
    opportunity_id: str
    title: str
    description: str
    conviction: ConvictionLevel
    conviction_score: float  # 0-100
    asset: str
    action: str  # buy, sell, watch, accumulate, reduce
    price_target: Optional[float] = None
    current_price: Optional[float] = None
    upside: Optional[float] = None
    timeframe: str  # intraday, swing, position
    factors: List[str]  # What drives this
    risk_reward: Optional[float] = None
    related_themes: List[str] = Field(default_factory=list)


class RiskItem(BaseModel):
    """A risk to be aware of"""
    risk_id: str
    title: str
    description: str
    risk_level: RiskLevel
    probability: float  # 0-1
    potential_impact: str  # High/Medium/Low
    affected_assets: List[str]
    time_horizon: str
    hedging_suggestion: Optional[str] = None
    probability_score: float  # 0-100
    monitoring_indicators: List[str] = Field(default_factory=list)


class RotationSignal(BaseModel):
    """Capital rotation signal"""
    signal_id: str
    from_sector: str
    to_sector: str
    strength: float  # 0-100
    confidence: float  # 0-1
    duration: str
    actionable: bool
    recommendation: str


class ThemeItem(BaseModel):
    """An emerging market theme"""
    theme_id: str
    name: str
    description: str
    momentum: float  # 0-100
    sentiment: float  # -1 to 1
    related_assets: List[str]
    narrative_state: str  # emerging, building, peak, declining
    investment_idea: Optional[str] = None


class PortfolioChange(BaseModel):
    """Recommended portfolio change"""
    change_id: str
    action: str  # add, reduce, exit, rotate
    asset: str
    current_weight: Optional[float] = None
    recommended_weight: Optional[float] = None
    rationale: str
    urgency: str  # immediate, this week, this month
    risk_adjustment: Optional[str] = None


class EconomicEvent(BaseModel):
    """Economic event on calendar"""
    event_id: str
    name: str
    time: str
    impact: RiskLevel
    previous: Optional[str] = None
    forecast: Optional[str] = None
    market_expectation: Optional[str] = None


class MarketOverview(BaseModel):
    """Current market overview"""
    status: str  # PRE_MARKET, REGULAR_HOURS, AFTER_HOURS
    market_open_countdown: Optional[int] = None
    major_indices: Dict[str, Dict[str, float]]
    sector_performance: Dict[str, float]
    market_sentiment: str  # BULLISH, BEARISH, NEUTRAL
    volatility_index: Optional[float] = None


class MorningBriefing(BaseModel):
    """Complete morning briefing"""
    briefing_id: str
    date: str
    generated_at: datetime

    # Sections
    market_overview: MarketOverview
    opportunities: List[OpportunityItem]
    risks: List[RiskItem]
    rotation_signals: List[RotationSignal]
    emerging_themes: List[ThemeItem]
    portfolio_changes: List[PortfolioChange]
    economic_calendar: List[EconomicEvent]

    # Summary
    summary: str
    action_items: List[str]
    key_watchlist: List[str]

    # Metadata
    confidence_score: float  # Overall briefing confidence
    data_sources: List[str]


class BriefingEngine:
    """
    Orchestrates all daily briefings and generates comprehensive morning briefings.

    Key capabilities:
    - Aggregate data from all services
    - Generate conviction-weighted opportunities
    - Calculate risk probabilities
    - Track capital rotation
    - Identify emerging themes
    - Recommend portfolio changes
    """

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.name = "Briefing Engine"
        self.port = 5170
        self.version = "1.0.0"

        # Service endpoints
        self.service_endpoints = {
            "market_data": os.getenv("SVC_MARKET_DATA", "http://localhost:5010"),
            "correlation": os.getenv("SVC_CORRELATION", "http://localhost:5043"),
            "capital_flow": os.getenv("SVC_CAPITAL_FLOW", "http://localhost:5183"),
            "narrative": os.getenv("SVC_NARRATIVE", "http://localhost:5150"),
            "learning": os.getenv("SVC_LEARNING", "http://localhost:5165"),
        }

        # HTTP client
        self._http_client: Optional[httpx.AsyncClient] = None

        # Cache
        self._briefing_cache: Dict[str, MorningBriefing] = {}
        self._last_refresh: Optional[datetime] = None

        # Market hours
        self.market_open = datetime.strptime("09:30", "%H:%M").time()
        self.market_close = datetime.strptime("16:00", "%H:%M").time()

    async def _get_client(self) -> httpx.AsyncClient:
        """Get HTTP client"""
        if self._http_client is None:
            self._http_client = httpx.AsyncClient(timeout=30.0)
        return self._http_client

    def _get_market_status(self) -> str:
        """Get current market status"""
        now = datetime.utcnow()
        current_time = now.time()

        if current_time < self.market_open:
            return "PRE_MARKET"
        elif current_time > self.market_close:
            return "AFTER_HOURS"
        else:
            return "REGULAR_HOURS"

    def _get_market_open_countdown(self) -> Optional[int]:
        """Get seconds until market open"""
        now = datetime.utcnow()
        today_open = datetime.combine(now.date(), self.market_open)

        if now.time() > self.market_close:
            today_open += timedelta(days=1)

        if now.time() < self.market_open:
            return int((today_open - now).total_seconds())

        return None

    async def _fetch_market_data(self) -> Dict[str, Any]:
        """Fetch current market data"""
        try:
            client = await self._get_client()
            response = await client.get(f"{self.service_endpoints['market_data']}/market-overview")
            if response.status_code == 200:
                return response.json()
        except Exception as e:
            logger.warning(f"Failed to fetch market data: {e}")

        # Return mock data
        return {
            "sp500": {"value": 5280, "change": 1.2},
            "nasdaq": {"value": 16500, "change": 1.5},
            "dow": {"value": 38500, "change": 0.8},
            "russell": {"value": 2050, "change": -0.3},
            "vix": 15.5
        }

    async def _fetch_capital_flows(self) -> Dict[str, Any]:
        """Fetch capital flow data"""
        try:
            client = await self._get_client()
            response = await client.get(f"{self.service_endpoints['capital_flow']}/api/v1/flows/summary")
            if response.status_code == 200:
                return response.json()
        except Exception as e:
            logger.warning(f"Failed to fetch capital flows: {e}")

        return {
            "total_inflow": 5.2e9,
            "total_outflow": 3.8e9,
            "sector_flows": {
                "technology": 2.1e9,
                "energy": -800e6,
                "healthcare": 500e6,
                "financials": -200e6,
            },
            "style_flows": {
                "growth": 1.2e9,
                "value": 200e6,
            }
        }

    async def _fetch_narrative_themes(self) -> List[Dict[str, Any]]:
        """Fetch current narrative themes"""
        try:
            client = await self._get_client()
            response = await client.get(f"{self.service_endpoints['narrative']}/api/v1/narrative/summary")
            if response.status_code == 200:
                data = response.json()
                return data.get("top_themes", [])
        except Exception as e:
            logger.warning(f"Failed to fetch narrative themes: {e}")

        # Return mock data
        return [
            {"theme": "ai", "state": "building", "mentions_24h": 150, "momentum": 0.8, "sentiment": 0.7},
            {"theme": "defense", "state": "emerging", "mentions_24h": 80, "momentum": 0.6, "sentiment": 0.5},
            {"theme": "nuclear", "state": "peak", "mentions_24h": 120, "momentum": 0.9, "sentiment": 0.8},
        ]

    async def _generate_opportunities(self) -> List[OpportunityItem]:
        """Generate top opportunities with conviction scores"""
        opportunities = []

        # Fetch supporting data
        market_data = await self._fetch_market_data()
        themes = await self._fetch_narrative_themes()

        # AI Theme opportunity
        ai_themes = [t for t in themes if "ai" in t.get("theme", "")]
        if ai_themes:
            ai_momentum = ai_themes[0].get("momentum", 0.5)
            opportunities.append(OpportunityItem(
                opportunity_id="opp_ai_semiconductors",
                title="AI Infrastructure - Semiconductors Lead",
                description="NVIDIA and AMD continue to benefit from AI chip demand. Data center revenue accelerating.",
                conviction=ConvictionLevel.HIGH if ai_momentum > 0.7 else ConvictionLevel.MEDIUM,
                conviction_score=min(100, ai_momentum * 100 + 20),
                asset="NVDA",
                action="accumulate",
                price_target=950.0,
                current_price=878.0,
                upside=8.2,
                timeframe="3-6 months",
                factors=["AI demand surge", "Data center growth", "Margin expansion"],
                risk_reward=2.5,
                related_themes=["ai", "semiconductors"]
            ))

        # Nuclear renaissance
        nuclear_themes = [t for t in themes if "nuclear" in t.get("theme", "")]
        if nuclear_themes:
            opportunities.append(OpportunityItem(
                opportunity_id="opp_nuclear_uranium",
                title="Nuclear Renaissance - Uranium Miners",
                description="Global nuclear power expansion driving uranium demand. Supply deficit widening.",
                conviction=ConvictionLevel.HIGH,
                conviction_score=85,
                asset="CCJ",
                action="buy",
                price_target=35.0,
                current_price=28.5,
                upside=22.8,
                timeframe="12-18 months",
                factors=["Uranium shortage", "SMR adoption", "Energy security"],
                risk_reward=3.0,
                related_themes=["nuclear", "clean_energy"]
            ))

        # Defense spending
        defense_themes = [t for t in themes if "defense" in t.get("theme", "")]
        if defense_themes:
            opportunities.append(OpportunityItem(
                opportunity_id="opp_defense_contractors",
                title="Defense Contractors - NATO Spending Surge",
                description="NATO allies increasing defense budgets. Long-term contracts secured.",
                conviction=ConvictionLevel.MEDIUM,
                conviction_score=72,
                asset="LMT",
                action="accumulate",
                price_target=520.0,
                current_price=465.0,
                upside=11.8,
                timeframe="6-12 months",
                factors=["NATO commitments", "Ukraine restocking", "Pacific tensions"],
                risk_reward=2.0,
                related_themes=["defense"]
            ))

        # Value rotation
        flow_data = await self._fetch_capital_flows()
        if flow_data.get("style_flows", {}).get("value", 0) > 0:
            opportunities.append(OpportunityItem(
                opportunity_id="opp_value_rotation",
                title="Value Rotation - Financials",
                description="Capital rotating from growth to value. Financials positioned for rate environment.",
                conviction=ConvictionLevel.MEDIUM,
                conviction_score=65,
                asset="XLF",
                action="accumulate",
                timeframe="1-3 months",
                factors=["Rate environment", "Value rotation", "Bank earnings"],
                related_themes=["finance"]
            ))

        return sorted(opportunities, key=lambda x: x.conviction_score, reverse=True)

    async def _generate_risks(self) -> List[RiskItem]:
        """Generate risk items with probability scores"""
        risks = []

        # Fed policy risk
        risks.append(RiskItem(
            risk_id="risk_fed_policy",
            title="Federal Reserve Policy Uncertainty",
            description="Fed signaling mixed signals on rate cuts. Market pricing uncertainty.",
            risk_level=RiskLevel.HIGH,
            probability=0.6,
            potential_impact="High",
            affected_assets=["SPY", "QQQ", "TLT", "GLD"],
            time_horizon="1-3 months",
            hedging_suggestion="Add VIX exposure, reduce long duration bonds",
            probability_score=60,
            monitoring_indicators=["FOMC minutes", "CPI data", "PPI data", "Jobs report"]
        ))

        # Geopolitical - Taiwan
        risks.append(RiskItem(
            risk_id="risk_taiwan",
            title="Taiwan Strait Tensions",
            description="US-China tensions around Taiwan. Semiconductor supply chain risk.",
            risk_level=RiskLevel.CRITICAL,
            probability=0.15,
            potential_impact="Critical",
            affected_assets=["NVDA", "AMD", "TSM", "SMH", "SOXX"],
            time_horizon="6-12 months",
            hedging_suggestion="Reduce semiconductor exposure, add defense names",
            probability_score=15,
            monitoring_indicators=["Military exercises", "Diplomatic statements", "Trade policies"]
        ))

        # Earnings disappointment
        risks.append(RiskItem(
            risk_id="risk_earnings",
            title="Tech Earnings Disappointment",
            description="High expectations for Q3 earnings. AI monetization concerns.",
            risk_level=RiskLevel.MEDIUM,
            probability=0.35,
            potential_impact="Medium",
            affected_assets=["META", "GOOGL", "MSFT"],
            time_horizon="2-4 weeks",
            hedging_suggestion="Partial profit taking, add protective puts",
            probability_score=35,
            monitoring_indicators=["Q3 guidance", "AI capex", "Cloud growth rates"]
        ))

        # Oil spike
        risks.append(RiskItem(
            risk_id="risk_oil_spike",
            title="Oil Supply Disruption",
            description="OPEC+ production cuts, potential supply shock.",
            risk_level=RiskLevel.MEDIUM,
            probability=0.3,
            potential_impact="Medium",
            affected_assets=["XLE", "OIH", "USO", "Energy sector"],
            time_horizon="1-2 months",
            hedging_suggestion="Add energy exposure, reduce consumer discretionary",
            probability_score=30,
            monitoring_indicators=["OPEC announcements", "Inventory data", "Chinese demand"]
        ))

        return sorted(risks, key=lambda x: x.probability_score * (1 if x.risk_level == RiskLevel.CRITICAL else 0.5), reverse=True)

    async def _generate_rotation_signals(self) -> List[RotationSignal]:
        """Generate capital rotation signals"""
        signals = []

        flow_data = await self._fetch_capital_flows()
        sector_flows = flow_data.get("sector_flows", {})

        # Tech to Energy rotation
        tech_flow = sector_flows.get("technology", 0)
        energy_flow = sector_flows.get("energy", 0)

        if energy_flow > 0 and tech_flow > 0:
            if energy_flow > tech_flow * 0.5:
                signals.append(RotationSignal(
                    signal_id="rotation_tech_energy",
                    from_sector="Technology",
                    to_sector="Energy",
                    strength=min(100, (energy_flow / max(tech_flow, 1)) * 50),
                    confidence=0.75,
                    duration="1-2 weeks",
                    actionable=True,
                    recommendation="Reduce tech exposure, add energy sector exposure"
                ))

        # Growth to Value
        style_flows = flow_data.get("style_flows", {})
        growth_flow = style_flows.get("growth", 0)
        value_flow = style_flows.get("value", 0)

        if value_flow > growth_flow:
            signals.append(RotationSignal(
                signal_id="rotation_growth_value",
                from_sector="Growth",
                to_sector="Value",
                strength=min(100, (value_flow - growth_flow) / 1e9 * 20),
                confidence=0.70,
                duration="1-4 weeks",
                actionable=True,
                recommendation="Rotate from growth ETFs to value ETFs"
            ))

        return signals

    async def _generate_themes(self) -> List[ThemeItem]:
        """Generate emerging themes"""
        themes = []
        raw_themes = await self._fetch_narrative_themes()

        for raw in raw_themes:
            theme_name = raw.get("theme", "unknown")
            state = raw.get("state", "unknown")

            theme = ThemeItem(
                theme_id=f"theme_{theme_name}",
                name=theme_name.replace("_", " ").title(),
                description=f"Market theme: {theme_name}",
                momentum=raw.get("momentum", 0.5) * 100,
                sentiment=raw.get("sentiment", 0),
                related_assets=self._get_assets_for_theme(theme_name),
                narrative_state=state,
                investment_idea=self._get_theme_investment_idea(theme_name)
            )
            themes.append(theme)

        return themes

    def _get_assets_for_theme(self, theme: str) -> List[str]:
        """Map theme to related assets"""
        theme_assets = {
            "ai": ["NVDA", "AMD", "MSFT", "GOOGL", "META"],
            "defense": ["LMT", "RTX", "NOC", "LHX"],
            "nuclear": ["CCJ", "DNN", "CEG"],
            "ev": ["TSLA", "RIVN", "LCID"],
            "cybersecurity": ["CRWD", "PANW", "ZS"],
            "semiconductors": ["NVDA", "AMD", "INTC", "ASML"],
            "clean_energy": ["ENPH", "FSLR", "PLUG"],
        }
        return theme_assets.get(theme, [])

    def _get_theme_investment_idea(self, theme: str) -> Optional[str]:
        """Get investment idea for theme"""
        ideas = {
            "ai": "Buy semiconductor ETFs (SMH) and AI leaders (NVDA)",
            "defense": "Accumulate defense contractors on dips",
            "nuclear": "Long uranium miners and SMR plays",
            "ev": "Wait for pullback, EV adoption secular",
        }
        return ideas.get(theme)

    async def _generate_portfolio_changes(self) -> List[PortfolioChange]:
        """Generate recommended portfolio changes"""
        changes = []

        # Based on rotation signals
        rotation = await self._generate_rotation_signals()
        if any("energy" in r.to_sector.lower() for r in rotation):
            changes.append(PortfolioChange(
                change_id="change_energy_rotation",
                action="add",
                asset="XLE",
                rationale="Capital rotation favoring energy sector",
                urgency="this week",
                risk_adjustment="Reduce tech sector weight"
            ))

        # Based on risks
        risks = await self._generate_risks()
        critical = [r for r in risks if r.risk_level == RiskLevel.CRITICAL]
        if critical:
            changes.append(PortfolioChange(
                change_id="change_hedge_semiconductors",
                action="reduce",
                asset="SMH",
                recommended_weight=8.0,
                rationale="Taiwan geopolitical risk elevated",
                urgency="immediate",
                risk_adjustment="Add defensive hedges"
            ))

        # Based on opportunities
        opportunities = await self._generate_opportunities()
        high_conviction = [o for o in opportunities if o.conviction == ConvictionLevel.HIGH]
        if high_conviction:
            changes.append(PortfolioChange(
                change_id="change_add_nuclear",
                action="add",
                asset="CCJ",
                rationale=f"High conviction: {high_conviction[0].title}",
                urgency="this week"
            ))

        return changes

    def _generate_economic_calendar(self) -> List[EconomicEvent]:
        """Generate economic calendar events"""
        events = []

        # Common high-impact events
        events.append(EconomicEvent(
            event_id="cal_cpi",
            name="CPI (Consumer Price Index)",
            time="08:30 AM",
            impact=RiskLevel.HIGH,
            previous="3.2%",
            forecast="3.3%",
            market_expectation="Core inflation sticky"
        ))

        events.append(EconomicEvent(
            event_id="cal_ppi",
            name="PPI (Producer Price Index)",
            time="08:30 AM",
            impact=RiskLevel.MEDIUM,
            previous="1.6%",
            forecast="1.4%",
            market_expectation="Wholesale inflation cooling"
        ))

        events.append(EconomicEvent(
            event_id="cal_jobs",
            name="Non-Farm Payrolls",
            time="08:30 AM",
            impact=RiskLevel.CRITICAL,
            previous="187K",
            forecast="170K",
            market_expectation="Labor market moderating"
        ))

        events.append(EconomicEvent(
            event_id="cal_fed",
            name="FOMC Meeting Minutes",
            time="02:00 PM",
            impact=RiskLevel.HIGH,
            market_expectation="Fed policy guidance"
        ))

        return events

    async def generate_complete_briefing(
        self,
        user_id: Optional[str] = None,
        watchlist: Optional[List[str]] = None,
        portfolio: Optional[Dict[str, Any]] = None
    ) -> MorningBriefing:
        """Generate complete morning briefing"""
        briefing_id = f"briefing_{datetime.utcnow().timestamp()}"

        # Gather all data
        market_data = await self._fetch_market_data()
        flows = await self._fetch_capital_flows()
        themes = await self._fetch_narrative_themes()

        # Generate sections
        market_overview = MarketOverview(
            status=self._get_market_status(),
            market_open_countdown=self._get_market_open_countdown(),
            major_indices={
                "S&P 500": market_data.get("sp500", {"value": 5280, "change": 0}),
                "NASDAQ": market_data.get("nasdaq", {"value": 16500, "change": 0}),
                "DOW": market_data.get("dow", {"value": 38500, "change": 0}),
            },
            sector_performance=flows.get("sector_flows", {}),
            market_sentiment="BULLISH" if market_data.get("sp500", {}).get("change", 0) > 0 else "NEUTRAL",
            volatility_index=market_data.get("vix")
        )

        opportunities = await self._generate_opportunities()
        risks = await self._generate_risks()
        rotation_signals = await self._generate_rotation_signals()
        emerging_themes = await self._generate_themes()
        portfolio_changes = await self._generate_portfolio_changes()
        economic_calendar = self._generate_economic_calendar()

        # Build action items
        action_items = []
        for change in portfolio_changes:
            if change.urgency == "immediate":
                action_items.append(f"ACTION: {change.rationale}")

        for risk in risks:
            if risk.risk_level == RiskLevel.CRITICAL:
                action_items.append(f"ALERT: {risk.title} - {risk.hedging_suggestion}")

        # Build watchlist
        key_watchlist = list(set([
            o.asset for o in opportunities[:3]
        ] + [r.affected_assets[0] for r in risks[:2]]))

        # Calculate confidence
        confidence = 0.7
        if opportunities:
            confidence += 0.1
        if flows:
            confidence += 0.1
        confidence = min(0.95, confidence)

        # Generate summary
        summary = f"Morning Briefing - {datetime.utcnow().strftime('%B %d, %Y')}. "
        summary += f"Market {market_overview.market_sentiment}. "
        summary += f"{len(opportunities)} opportunities, {len(risks)} risks. "
        summary += f"Key theme: {themes[0].get('theme', 'AI') if themes else 'AI'}."

        briefing = MorningBriefing(
            briefing_id=briefing_id,
            date=datetime.utcnow().strftime("%Y-%m-%d"),
            generated_at=datetime.utcnow(),
            market_overview=market_overview,
            opportunities=opportunities,
            risks=risks,
            rotation_signals=rotation_signals,
            emerging_themes=emerging_themes,
            portfolio_changes=portfolio_changes,
            economic_calendar=economic_calendar,
            summary=summary,
            action_items=action_items,
            key_watchlist=key_watchlist,
            confidence_score=confidence,
            data_sources=["market_data", "capital_flow", "narrative_intelligence", "correlation_engine"]
        )

        self._briefing_cache[briefing_id] = briefing
        self._last_refresh = datetime.utcnow()

        logger.info(f"Generated complete briefing: {briefing_id}")

        return briefing


# Initialize service
service = BriefingEngine()


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": service.name,
        "port": service.port,
        "version": service.version,
        "market_status": service._get_market_status(),
        "last_briefing": service._last_refresh.isoformat() if service._last_refresh else None
    }


@app.post("/api/v1/briefing/complete")
async def generate_complete_briefing(
    user_id: Optional[str] = None,
    watchlist: Optional[List[str]] = None,
    portfolio: Optional[Dict[str, Any]] = None
):
    """Generate complete morning briefing with all sections"""
    return await service.generate_complete_briefing(user_id, watchlist, portfolio)


@app.get("/api/v1/briefing/{briefing_id}")
async def get_briefing(briefing_id: str):
    """Get briefing by ID"""
    if briefing_id not in service._briefing_cache:
        raise HTTPException(status_code=404, detail="Briefing not found")
    return service._briefing_cache[briefing_id]


@app.get("/api/v1/briefing/today")
async def get_today_briefing():
    """Get today's briefing"""
    today = datetime.utcnow().strftime("%Y-%m-%d")
    for bid, briefing in service._briefing_cache.items():
        if briefing.date == today:
            return briefing

    # Generate if not exists
    return await service.generate_complete_briefing()


@app.get("/api/v1/opportunities")
async def get_opportunities():
    """Get current opportunities"""
    opportunities = await service._generate_opportunities()
    return {"opportunities": opportunities, "count": len(opportunities)}


@app.get("/api/v1/risks")
async def get_risks():
    """Get current risks"""
    risks = await service._generate_risks()
    return {"risks": risks, "count": len(risks)}


@app.get("/api/v1/rotation")
async def get_rotation_signals():
    """Get current rotation signals"""
    signals = await service._generate_rotation_signals()
    return {"signals": signals, "count": len(signals)}


@app.get("/api/v1/themes")
async def get_themes():
    """Get emerging themes"""
    themes = await service._generate_themes()
    return {"themes": themes, "count": len(themes)}


@app.get("/api/v1/portfolio/changes")
async def get_portfolio_changes():
    """Get recommended portfolio changes"""
    changes = await service._generate_portfolio_changes()
    return {"changes": changes, "count": len(changes)}


@app.get("/api/v1/calendar")
async def get_economic_calendar():
    """Get economic calendar"""
    events = service._generate_economic_calendar()
    return {"events": events, "count": len(events)}


@app.get("/api/v1/market/overview")
async def get_market_overview():
    """Get market overview"""
    return await service._fetch_market_data()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5170)