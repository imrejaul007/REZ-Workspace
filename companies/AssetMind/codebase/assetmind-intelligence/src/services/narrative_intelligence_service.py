"""
Narrative Intelligence Engine
Track themes: AI, Defense, Nuclear, EV, Cybersecurity
Measure narrative momentum and social amplification
Port: 5150

This engine tracks market narratives and themes:
- Theme momentum measurement
- Social/media amplification tracking
- Narrative shift prediction
- Theme correlation with asset performance
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional, Set
from datetime import datetime, timedelta
from enum import Enum
import logging
import asyncio
import httpx
import re
from collections import defaultdict
import json

logger = logging.getLogger(__name__)

app = FastAPI(title="AssetMind Narrative Intelligence", version="1.0.0", docs_url="/docs")


class Theme(str, Enum):
    """Market themes to track"""
    AI = "ai"  # Artificial Intelligence, Machine Learning
    DEFENSE = "defense"  # Defense contractors, security
    NUCLEAR = "nuclear"  # Nuclear energy, SMR
    EV = "ev"  # Electric vehicles, batteries
    CYBERSECURITY = "cybersecurity"  # Security, privacy
    QUANTUM = "quantum"  # Quantum computing
    BIOTECH = "biotech"  # Healthcare, pharma
    SPACE = "space"  # Space exploration, satellites
    CLEAN_ENERGY = "clean_energy"  # Solar, wind, renewables
    SEMICONDUCTOR = "semiconductor"  # Chips, fabs
    HOUSING = "housing"  # Real estate
    INFLATION = "inflation"  # Inflation hedging
    RECESSION = "recession"  # Economic slowdown
    RATE_HIKE = "rate_hike"  # Interest rates
    GEOPOLITICAL = "geopolitical"  # Taiwan, Russia, China


class NarrativeState(str, Enum):
    EMERGING = "emerging"  # Just started gaining traction
    BUILDING = "building"  # Gaining momentum
    PEAK = "peak"  # Maximum attention
    DECLINING = "declining"  # Losing attention
    DEAD = "dead"  # No longer relevant


class ThemeMetrics(BaseModel):
    """Metrics for a theme"""
    theme: Theme
    mentions_24h: int = 0
    mentions_7d: int = 0
    sentiment_score: float = 0  # -1 to 1
    momentum: float = 0  # Rate of change
    reach_score: float = 0  # Audience reach
    velocity: float = 0  # Speed of spread
    financial_correlation: float = 0  # Correlation with asset performance


class NarrativeShift(BaseModel):
    """Detected narrative shift"""
    shift_id: str
    from_theme: Optional[Theme]
    to_theme: Theme
    trigger_event: str
    confidence: float
    velocity: float
    affected_assets: List[str]
    timestamp: datetime


class Article(BaseModel):
    """News article or social post"""
    article_id: str
    source: str  # twitter, reddit, news, reddit
    title: str
    content: str
    themes: List[Theme]
    sentiment: float  # -1 to 1
    reach: int  # estimated reach
    url: Optional[str] = None
    published_at: datetime
    fetched_at: datetime = Field(default_factory=datetime.utcnow)


class NarrativeIntelligence:
    """
    Tracks market narratives and themes.

    Key capabilities:
    - Theme momentum tracking
    - Social media amplification
    - Narrative shift detection
    - Theme-asset correlation
    """

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.name = "Narrative Intelligence"
        self.port = 5150
        self.version = "1.0.0"

        # Data storage
        self.articles: List[Article] = []
        self.theme_metrics: Dict[Theme, ThemeMetrics] = {}
        self.narrative_shifts: List[NarrativeShift] = []
        self.asset_theme_correlation: Dict[str, Dict[Theme, float]] = defaultdict(dict)

        # Theme keywords
        self._initialize_theme_keywords()

        # GDELT API
        self.gdelt_base_url = "https://api.gdeltproject.org/api/v2"
        self._http_client: Optional[httpx.AsyncClient] = None

        # Initialize metrics
        self._initialize_metrics()

    def _initialize_theme_keywords(self):
        """Initialize keyword mappings for each theme"""
        self.theme_keywords = {
            Theme.AI: [
                "artificial intelligence", "AI", "machine learning", "ML", "deep learning",
                "neural network", "LLM", "ChatGPT", "GPT", "OpenAI", "Anthropic", "Gemini",
                "AI chip", "AI model", "generative AI", "foundation model", "AGI"
            ],
            Theme.DEFENSE: [
                "defense", "military", "Pentagon", "weapon", "arms", "defense contractor",
                "Lockheed", "Raytheon", "Northrop", "Boeing defense", "L3Harris",
                "warfare", "drone", "missile", "combat", "defense spending", "NATO"
            ],
            Theme.NUCLEAR: [
                "nuclear", "SMR", "small modular reactor", "nuclear energy", "uranium",
                "nuclear power", "fission", "fusion", "nuclear plant", "Cameco", "Vogtle",
                "nuclear renaissance", "clean energy", "zero carbon"
            ],
            Theme.EV: [
                "electric vehicle", "EV", "Tesla", "battery", "lithium", "charging",
                "BYD", "Rivian", "Lucid", "charging station", "solid state battery",
                "range anxiety", "BEV", "electric car", "zero emission vehicle"
            ],
            Theme.CYBERSECURITY: [
                "cybersecurity", "cyber attack", "hack", "breach", "ransomware",
                "firewall", "zero day", "vulnerability", "malware", "phishing",
                "security", "privacy", "data protection", "encryption", "CrowdStrike"
            ],
            Theme.QUANTUM: [
                "quantum computing", "quantum", "qubit", "superposition", "entanglement",
                "quantum supremacy", "IBM quantum", "Google quantum", "IonQ", "Rigetti",
                "quantum advantage", "post-quantum", "quantum cryptography"
            ],
            Theme.BIOTECH: [
                "biotech", "biopharmaceutical", "drug", "FDA", "clinical trial",
                "CRISPR", "gene therapy", "mRNA", "vaccine", "oncology", "Alzheimer",
                "cancer drug", "orphan drug", "biopharmaceutical"
            ],
            Theme.SPACE: [
                "space", "satellite", "rocket", "SpaceX", "NASA", "Starlink", "Blue Origin",
                "satellite internet", "orbit", "launch", "spacecraft", "astronaut",
                "space exploration", "space station", "Mars", "moon landing"
            ],
            Theme.CLEAN_ENERGY: [
                "solar", "wind energy", "renewable", "clean energy", "ESG", "sustainability",
                "carbon", "net zero", "climate", "green hydrogen", "solar panel",
                "wind turbine", "First Solar", "Enphase", "sustainability"
            ],
            Theme.SEMICONDUCTOR: [
                "semiconductor", "chip", "processor", "fabrication", "TSMC", "foundry",
                "NVIDIA", "AMD", "Intel fab", "EUV", "ASML", "Moore's Law",
                "advanced chip", "AI chip", "memory", "HBM", "chip shortage"
            ],
            Theme.HOUSING: [
                "housing", "real estate", "mortgage", "home price", "inventory",
                "Zillow", "Redfin", "housing market", "home sales", "housing starts",
                "mortgage rate", "affordability", "housing bubble"
            ],
            Theme.INFLATION: [
                "inflation", "CPI", "PPI", "price", "cost", "commodity prices",
                "inflation hedge", "gold", "TIPS", "commodity", "shelter inflation",
                "food prices", "energy prices", "sticky inflation"
            ],
            Theme.RECESSION: [
                "recession", "economic slowdown", "GDP contraction", "downturn",
                "bear market", "economic weakness", "hard landing", "soft landing",
                "contraction", "job losses", "unemployment"
            ],
            Theme.RATE_HIKE: [
                "interest rate", "Fed", "Federal Reserve", "rate hike", "rate cut",
                "monetary policy", "Yellen", "Powell", "federal funds",
                "bond yield", "treasury", "yield curve", "inverted yield"
            ],
            Theme.GEOPOLITICAL: [
                "Taiwan", "China", "Russia", "Ukraine", "geopolitical", "trade war",
                "sanctions", "OPEC", "Middle East", "tensions", "military conflict",
                "export control", "decoupling", "Cold War"
            ]
        }

        # Asset-theme mapping
        self.asset_themes: Dict[str, List[Theme]] = {
            "NVDA": [Theme.AI, Theme.SEMICONDUCTOR],
            "AMD": [Theme.AI, Theme.SEMICONDUCTOR],
            "MSFT": [Theme.AI],
            "GOOGL": [Theme.AI, Theme.QUANTUM],
            "META": [Theme.AI],
            "TSLA": [Theme.EV, Theme.AI],
            "RIVN": [Theme.EV],
            "LMT": [Theme.DEFENSE],
            "RTX": [Theme.DEFENSE, Theme.NUCLEAR],
            "NOC": [Theme.DEFENSE],
            "LHX": [Theme.DEFENSE],
            "CCJ": [Theme.NUCLEAR],
            "DNN": [Theme.NUCLEAR],
            "CRM": [Theme.CYBERSECURITY],
            "PANW": [Theme.CYBERSECURITY],
            "CRWD": [Theme.CYBERSECURITY],
            "IONQ": [Theme.QUANTUM],
            "IBM": [Theme.QUANTUM],
            "REGN": [Theme.BIOTECH],
            "MRNA": [Theme.BIOTECH],
            "BIIB": [Theme.BIOTECH],
            "SPCE": [Theme.SPACE],
            "LMT": [Theme.SPACE],
            "FSLR": [Theme.CLEAN_ENERGY],
            "ENPH": [Theme.CLEAN_ENERGY],
            "PLUG": [Theme.CLEAN_ENERGY],
            "INTC": [Theme.SEMICONDUCTOR],
            "ASML": [Theme.SEMICONDUCTOR],
            "AMAT": [Theme.SEMICONDUCTOR],
        }

    def _initialize_metrics(self):
        """Initialize theme metrics"""
        for theme in Theme:
            self.theme_metrics[theme] = ThemeMetrics(theme=theme)

    async def _get_http_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client"""
        if self._http_client is None:
            self._http_client = httpx.AsyncClient(timeout=30.0)
        return self._http_client

    async def fetch_gdelt_news(
        self,
        query: str,
        max_articles: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Fetch news from GDELT API.

        GDELT provides comprehensive global news coverage.
        """
        try:
            client = await self._get_http_client()
            url = f"{self.gdelt_base_url}/search/search"

            params = {
                "query": query,
                "mode": "artlist",
                "maxarticles": max_articles,
                "format": "json"
            }

            response = await client.get(url, params=params)

            if response.status_code == 200:
                data = response.json()
                return data.get("articles", [])
        except Exception as e:
            logger.warning(f"GDELT API error: {e}")

        return []

    async def analyze_article(self, article: Article) -> Article:
        """Analyze an article and extract themes"""
        content_lower = (article.title + " " + article.content).lower()

        detected_themes = []
        for theme, keywords in self.theme_keywords.items():
            for keyword in keywords:
                if keyword.lower() in content_lower:
                    detected_themes.append(theme)
                    break

        article.themes = list(set(detected_themes))
        return article

    async def ingest_article(
        self,
        title: str,
        content: str,
        source: str,
        url: Optional[str] = None,
        published_at: Optional[datetime] = None,
        reach: int = 0
    ) -> Article:
        """Ingest and analyze an article"""
        article = Article(
            article_id=f"article_{len(self.articles)}_{datetime.utcnow().timestamp()}",
            source=source,
            title=title,
            content=content,
            themes=[],
            sentiment=0,
            reach=reach,
            url=url,
            published_at=published_at or datetime.utcnow()
        )

        # Analyze themes
        article = await self.analyze_article(article)

        # Calculate sentiment (simplified)
        positive_words = ["surge", "soar", "gain", "rise", "growth", "boom", "rally", "beat"]
        negative_words = ["fall", "drop", "crash", "loss", "decline", "plunge", "miss", "concern"]

        content_lower = content.lower()
        pos_count = sum(1 for w in positive_words if w in content_lower)
        neg_count = sum(1 for w in negative_words if w in content_lower)

        total = pos_count + neg_count
        if total > 0:
            article.sentiment = (pos_count - neg_count) / total

        self.articles.append(article)
        await self._update_metrics()

        return article

    async def _update_metrics(self):
        """Update theme metrics based on recent articles"""
        cutoff_24h = datetime.utcnow() - timedelta(hours=24)
        cutoff_7d = datetime.utcnow() - timedelta(days=7)

        for theme in Theme:
            metrics = self.theme_metrics[theme]

            # Count mentions
            theme_articles = [a for a in self.articles if theme in a.themes]
            metrics.mentions_24h = len([a for a in theme_articles if a.published_at > cutoff_24h])
            metrics.mentions_7d = len([a for a in theme_articles if a.published_at > cutoff_7d])

            # Calculate sentiment
            if theme_articles:
                metrics.sentiment_score = sum(a.sentiment for a in theme_articles) / len(theme_articles)

            # Calculate reach
            metrics.reach_score = sum(a.reach for a in theme_articles)

    async def get_theme_metrics(self, theme: Theme) -> ThemeMetrics:
        """Get current metrics for a theme"""
        await self._update_metrics()
        return self.theme_metrics[theme]

    async def get_all_theme_metrics(self) -> List[ThemeMetrics]:
        """Get metrics for all themes"""
        await self._update_metrics()
        return list(self.theme_metrics.values())

    async def detect_narrative_shift(self) -> List[NarrativeShift]:
        """Detect narrative shifts between themes"""
        shifts = []

        # Get previous state (mock)
        # In production, compare with historical data
        previous_metrics = {
            Theme.AI: ThemeMetrics(theme=Theme.AI, mentions_24h=100, momentum=0.5),
            Theme.DEFENSE: ThemeMetrics(theme=Theme.DEFENSE, mentions_24h=50, momentum=0.3),
        }

        current_metrics = self.theme_metrics

        # Detect shifts
        for theme, current in current_metrics.items():
            prev = previous_metrics.get(theme)
            if prev:
                # Detect momentum change
                if current.momentum > 0.5 and prev.momentum < 0.2:
                    shift = NarrativeShift(
                        shift_id=f"shift_{theme.value}_{datetime.utcnow().timestamp()}",
                        from_theme=None,
                        to_theme=theme,
                        trigger_event="Momentum acceleration detected",
                        confidence=0.8,
                        velocity=current.momentum - prev.momentum,
                        affected_assets=self._get_assets_for_theme(theme),
                        timestamp=datetime.utcnow()
                    )
                    shifts.append(shift)
                    self.narrative_shifts.append(shift)

        return shifts

    def _get_assets_for_theme(self, theme: Theme) -> List[str]:
        """Get assets related to a theme"""
        assets = []
        for asset, themes in self.asset_themes.items():
            if theme in themes:
                assets.append(asset)
        return assets

    async def get_narrative_state(self, theme: Theme) -> NarrativeState:
        """Determine current state of a narrative"""
        metrics = self.theme_metrics[theme]

        # Simple state machine
        if metrics.mentions_24h < 10:
            return NarrativeState.DEAD
        elif metrics.mentions_24h < 30:
            return NarrativeState.EMERGING
        elif metrics.momentum > 0.7:
            return NarrativeState.PEAK
        elif metrics.momentum > 0.3:
            return NarrativeState.BUILDING
        else:
            return NarrativeState.DECLINING

    async def predict_narrative_shift(
        self,
        theme: Theme,
        horizon_hours: int = 24
    ) -> Dict[str, Any]:
        """Predict narrative shift for a theme"""
        metrics = self.theme_metrics[theme]

        # Calculate indicators
        velocity_trend = metrics.velocity > 0.3
        sentiment_reversal = abs(metrics.sentiment_score) > 0.5

        # Predict shift
        if metrics.momentum > 0.8 and metrics.sentiment_score > 0.5:
            prediction = "Theme likely to reach peak in next 12-24 hours"
            confidence = 0.75
        elif metrics.momentum < 0.2 and metrics.mentions_24h > 20:
            prediction = "Theme entering decline phase"
            confidence = 0.70
        elif velocity_trend and not sentiment_reversal:
            prediction = "Building momentum, expect continued growth"
            confidence = 0.65
        else:
            prediction = "Stable, no significant shift expected"
            confidence = 0.50

        return {
            "theme": theme.value,
            "current_state": (await self.get_narrative_state(theme)).value,
            "prediction": prediction,
            "confidence": confidence,
            "horizon_hours": horizon_hours,
            "indicators": {
                "velocity_trend": velocity_trend,
                "sentiment_reversal": sentiment_reversal,
                "momentum": metrics.momentum,
                "mentions_24h": metrics.mentions_24h
            }
        }

    async def get_theme_performance_correlation(
        self,
        theme: Theme
    ) -> Dict[str, Any]:
        """Get correlation between theme and asset performance"""
        assets = self._get_assets_for_theme(theme)

        # In production, calculate actual correlation from price data
        return {
            "theme": theme.value,
            "related_assets": assets,
            "correlation_strength": 0.75,
            "avg_performance_7d": 3.2,
            "sentiment_correlation": self.theme_metrics[theme].sentiment_score
        }

    async def get_narrative_summary(self) -> Dict[str, Any]:
        """Get summary of all narratives"""
        await self._update_metrics()

        # Rank themes by momentum
        ranked_themes = sorted(
            self.theme_metrics.items(),
            key=lambda x: x[1].momentum,
            reverse=True
        )

        return {
            "timestamp": datetime.utcnow().isoformat(),
            "total_articles": len(self.articles),
            "top_themes": [
                {
                    "theme": t.value,
                    "state": (await self.get_narrative_state(t)).value,
                    "mentions_24h": m.mentions_24h,
                    "momentum": m.momentum,
                    "sentiment": m.sentiment_score
                }
                for t, m in ranked_themes[:5]
            ],
            "emerging_themes": [
                t.value for t, m in self.theme_metrics.items()
                if await self.get_narrative_state(t) == NarrativeState.EMERGING
            ],
            "peak_themes": [
                t.value for t, m in self.theme_metrics.items()
                if await self.get_narrative_state(t) == NarrativeState.PEAK
            ]
        }

    async def search_themes(
        self,
        query: str,
        themes: Optional[List[Theme]] = None
    ) -> List[Article]:
        """Search articles by query and optional theme filter"""
        results = []

        for article in reversed(self.articles):
            # Theme filter
            if themes and not any(t in article.themes for t in themes):
                continue

            # Query match
            query_lower = query.lower()
            if (query_lower in article.title.lower() or
                query_lower in article.content.lower()):
                results.append(article)

            if len(results) >= 50:
                break

        return results

    async def refresh_from_gdelt(self, themes: Optional[List[Theme]] = None):
        """Refresh articles from GDELT API"""
        if themes is None:
            themes = list(Theme)

        for theme in themes[:5]:  # Limit to 5 themes per refresh
            try:
                keywords = self.theme_keywords[theme]
                query = " OR ".join(f'"{k}"' for k in keywords[:3])

                articles_data = await self.fetch_gdelt_news(query, max_articles=20)

                for art_data in articles_data:
                    await self.ingest_article(
                        title=art_data.get("title", ""),
                        content=art_data.get("socialimage", "") + " " + art_data.get("title", ""),
                        source="gdelt",
                        url=art_data.get("url"),
                        published_at=datetime.fromisoformat(art_data.get("seendate", "")[:10])
                        if art_data.get("seendate") else datetime.utcnow(),
                        reach=art_data.get("socialimage", "").__len__() * 1000
                    )

            except Exception as e:
                logger.error(f"Error refreshing GDELT for {theme}: {e}")


# Initialize service
service = NarrativeIntelligence()


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": service.name,
        "port": service.port,
        "version": service.version,
        "total_articles": len(service.articles),
        "tracked_themes": len(Theme)
    }


@app.post("/api/v1/articles")
async def ingest_article(
    title: str,
    content: str,
    source: str = "manual",
    url: Optional[str] = None,
    published_at: Optional[datetime] = None,
    reach: int = 0
):
    """Ingest a new article"""
    article = await service.ingest_article(
        title=title,
        content=content,
        source=source,
        url=url,
        published_at=published_at,
        reach=reach
    )
    return article


@app.get("/api/v1/themes/{theme}/metrics")
async def get_theme_metrics(theme: Theme):
    """Get metrics for a specific theme"""
    return await service.get_theme_metrics(theme)


@app.get("/api/v1/themes/metrics")
async def get_all_metrics():
    """Get metrics for all themes"""
    return await service.get_all_theme_metrics()


@app.get("/api/v1/themes/{theme}/state")
async def get_theme_state(theme: Theme):
    """Get current state of a theme"""
    state = await service.get_narrative_state(theme)
    return {"theme": theme.value, "state": state.value}


@app.post("/api/v1/themes/{theme}/predict")
async def predict_shift(theme: Theme, horizon_hours: int = 24):
    """Predict narrative shift for a theme"""
    return await service.predict_narrative_shift(theme, horizon_hours)


@app.get("/api/v1/themes/{theme}/correlation")
async def get_theme_correlation(theme: Theme):
    """Get theme-asset performance correlation"""
    return await service.get_theme_performance_correlation(theme)


@app.get("/api/v1/narrative/summary")
async def get_narrative_summary():
    """Get summary of all narratives"""
    return await service.get_narrative_summary()


@app.get("/api/v1/narrative/shifts")
async def get_narrative_shifts():
    """Get detected narrative shifts"""
    shifts = await service.detect_narrative_shift()
    return {"shifts": shifts}


@app.get("/api/v1/search")
async def search_articles(
    query: str,
    themes: Optional[str] = None
):
    """Search articles"""
    theme_list = None
    if themes:
        theme_list = [Theme(t.strip()) for t in themes.split(",")]

    results = await service.search_themes(query, theme_list)
    return {"results": results, "count": len(results)}


@app.post("/api/v1/refresh/gdelt")
async def refresh_from_gdelt(themes: Optional[str] = None):
    """Refresh articles from GDELT API"""
    theme_list = None
    if themes:
        theme_list = [Theme(t.strip()) for t in themes.split(",")]

    await service.refresh_from_gdelt(theme_list)
    return {
        "status": "refreshed",
        "total_articles": len(service.articles)
    }


@app.get("/api/v1/assets/{ticker}/themes")
async def get_asset_themes(ticker: str):
    """Get themes related to an asset"""
    themes = service.asset_themes.get(ticker.upper(), [])
    return {
        "ticker": ticker.upper(),
        "themes": [t.value for t in themes]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5150)