"""
AssetMind Python SDK - Models
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from datetime import datetime


@dataclass
class Asset:
    id: str
    symbol: str
    name: str
    asset_class: str
    exchange: Optional[str] = None
    country: Optional[str] = None
    currency: str = "USD"
    status: str = "ACTIVE"


@dataclass
class AssetTwin:
    symbol: str
    opportunity_score: int
    risk_score: int
    sentiment: int
    prediction: 'Prediction'
    current_price: float = 0
    price_change_24h: float = 0

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'AssetTwin':
        return cls(
            symbol=data.get("symbol", ""),
            opportunity_score=data.get("opportunity_score", 50),
            risk_score=data.get("risk_score", 50),
            sentiment=data.get("sentiment", 50),
            prediction=Prediction.from_dict(data.get("prediction", {})),
            current_price=data.get("current_price", 0),
            price_change_24h=data.get("price_change_24h", 0)
        )


@dataclass
class Prediction:
    bullish_probability: float
    neutral_probability: float
    bearish_probability: float
    confidence: float
    time_horizon: str
    reasoning_chain: List[str] = field(default_factory=list)
    supporting_factors: List[str] = field(default_factory=list)
    contradicting_factors: List[str] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Prediction':
        return cls(
            bullish_probability=data.get("bullish_probability", 33.33),
            neutral_probability=data.get("neutral_probability", 33.33),
            bearish_probability=data.get("bearish_probability", 33.33),
            confidence=data.get("confidence", 50),
            time_horizon=data.get("time_horizon", "30D"),
            reasoning_chain=data.get("reasoning_chain", []),
            supporting_factors=data.get("supporting_factors", []),
            contradicting_factors=data.get("contradicting_factors", [])
        )


@dataclass
class ResearchReport:
    report_id: str
    symbol: str
    rating: str
    price_target: float
    current_price: float
    upside: float
    time_horizon: str
    conviction: str
    executive_summary: str
    key_thesis_points: List[str] = field(default_factory=list)
    risk_factors: List[str] = field(default_factory=list)
    monitoring_points: List[str] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ResearchReport':
        return cls(
            report_id=data.get("report_id", ""),
            symbol=data.get("subject", ""),
            rating=data.get("rating", "HOLD"),
            price_target=data.get("price_target", 0),
            current_price=data.get("current_price", 0),
            upside=data.get("upside", 0),
            time_horizon=data.get("time_horizon", ""),
            conviction=data.get("conviction", "MEDIUM"),
            executive_summary=data.get("executive_summary", ""),
            key_thesis_points=data.get("key_thesis_points", []),
            risk_factors=data.get("risk_factors", []),
            monitoring_points=data.get("monitoring_points", [])
        )


@dataclass
class Briefing:
    date: str
    market_sentiment: str
    top_opportunities: List[Dict[str, Any]] = field(default_factory=list)
    top_risks: List[Dict[str, Any]] = field(default_factory=list)
    economic_events: List[Dict[str, Any]] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Briefing':
        return cls(
            date=data.get("date", ""),
            market_sentiment=data.get("market_sentiment", ""),
            top_opportunities=data.get("top_opportunities", []),
            top_risks=data.get("top_risks", []),
            economic_events=data.get("economic_events", [])
        )


@dataclass
class Opportunity:
    symbol: str
    name: str
    score: int
    conviction: str = "MEDIUM"
    thesis: str = ""
    risk_level: str = "MEDIUM"
    sector: Optional[str] = None

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Opportunity':
        return cls(
            symbol=data.get("symbol", ""),
            name=data.get("name", ""),
            score=data.get("opportunity_score", data.get("score", 50)),
            conviction=data.get("conviction", "MEDIUM"),
            thesis=data.get("thesis", ""),
            risk_level=data.get("risk_level", "MEDIUM"),
            sector=data.get("sector")
        )


@dataclass
class Risk:
    name: str
    type: str
    score: int
    reason: str
    affected_assets: List[str] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Risk':
        return cls(
            name=data.get("name", ""),
            type=data.get("type", ""),
            score=data.get("risk_score", data.get("score", 50)),
            reason=data.get("reason", ""),
            affected_assets=data.get("affected_assets", [])
        )
