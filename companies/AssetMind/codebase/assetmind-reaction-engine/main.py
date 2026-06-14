"""
AssetMind Reaction Prediction Engine
Aiphrodite-style consumer reaction prediction service
Port: 5255
"""

import logging
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import uuid4
import random

from fastapi import APIRouter, FastAPI, Query
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("assetmind-reaction-engine")


class EventType(str, Enum):
    PRODUCT_LAUNCH = "product_launch"
    EARNINGS_ANNOUNCEMENT = "earnings_announcement"
    MERGER_ACQUISITION = "merger_acquisition"
    CEO_CHANGE = "ceo_change"
    REGULATORY_NEWS = "regulatory_news"
    PARTNERSHIP = "partnership"
    LAWSUIT = "lawsuit"
    DIVIDEND_CHANGE = "dividend_change"


class AudienceSegment(str, Enum):
    EARLY_ADOPTERS = "early_adopters"
    TECH_ENTHUSIASTS = "tech_enthusiasts"
    VALUE_INVESTORS = "value_investors"
    GROWTH_INVESTORS = "growth_investors"
    INSTITUTIONAL = "institutional"
    RETAIL_INVESTORS = "retail_investors"


class SentimentDirection(str, Enum):
    VERY_BEARISH = "very_bearish"
    BEARISH = "bearish"
    NEUTRAL = "neutral"
    BULLISH = "bullish"
    VERY_BULLISH = "very_bullish"


class ReactionEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    event_type: EventType
    entity: str
    event_description: str
    context: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ReactionPrediction(BaseModel):
    event_id: str
    overall_sentiment: float = Field(ge=-1.0, le=1.0)
    sentiment_direction: SentimentDirection
    engagement_score: float = Field(ge=0.0, le=100.0)
    conversion_likelihood: float = Field(ge=0.0, le=1.0)
    expected_volume: int
    volatility_impact: float = Field(ge=-1.0, le=1.0)
    confidence: float = Field(ge=0.0, le=1.0)


class SegmentReaction(BaseModel):
    segment: AudienceSegment
    sentiment: float = Field(ge=-1.0, le=1.0)
    engagement_score: float = Field(ge=0.0, le=100.0)
    expected_action: str
    confidence: float = Field(ge=0.0, le=1.0)


class ContentAnalysis(BaseModel):
    event_id: str
    headline_sentiment: float
    key_themes: List[str]
    urgency_level: str
    controversy_score: float = Field(ge=0.0, le=1.0)
    novelty_score: float = Field(ge=0.0, le=1.0)


class PredictionRequest(BaseModel):
    event_type: EventType
    event_description: str
    entity: str
    context: Dict[str, Any] = Field(default_factory=dict)
    include_segments: bool = True
    include_analysis: bool = True


class PredictionResponse(BaseModel):
    event: ReactionEvent
    prediction: ReactionPrediction
    segment_reactions: Optional[List[SegmentReaction]] = None
    analysis: Optional[ContentAnalysis] = None


class ReactionEngineState:
    def __init__(self):
        self.events: Dict[str, ReactionEvent] = {}
        self.predictions: Dict[str, PredictionResponse] = {}
        self.start_time = datetime.utcnow()

    def calculate_sentiment(self, event_type: EventType, description: str) -> tuple[float, SentimentDirection]:
        base_sentiments = {EventType.PRODUCT_LAUNCH: 0.3, EventType.EARNINGS_ANNOUNCEMENT: 0.0,
                          EventType.MERGER_ACQUISITION: 0.2, EventType.CEO_CHANGE: -0.1,
                          EventType.REGULATORY_NEWS: -0.2, EventType.PARTNERSHIP: 0.15,
                          EventType.LAWSUIT: -0.3, EventType.DIVIDEND_CHANGE: 0.1}

        base = base_sentiments.get(event_type, 0.0)
        description_lower = description.lower()
        for kw in ["beat", "growth", "surge", "record"] if True else []:
            if kw in description_lower:
                base += 0.1
        for kw in ["miss", "decline", "loss", "warning"]:
            if kw in description_lower:
                base -= 0.15

        sentiment = max(-1.0, min(1.0, base + random.uniform(-0.1, 0.1)))
        if sentiment >= 0.5:
            direction = SentimentDirection.VERY_BULLISH
        elif sentiment >= 0.2:
            direction = SentimentDirection.BULLISH
        elif sentiment <= -0.5:
            direction = SentimentDirection.VERY_BEARISH
        elif sentiment <= -0.2:
            direction = SentimentDirection.BEARISH
        else:
            direction = SentimentDirection.NEUTRAL
        return sentiment, direction

    def calculate_engagement(self, event_type: EventType) -> float:
        base_engagement = {EventType.PRODUCT_LAUNCH: 75.0, EventType.EARNINGS_ANNOUNCEMENT: 85.0,
                          EventType.MERGER_ACQUISITION: 90.0, EventType.CEO_CHANGE: 70.0,
                          EventType.REGULATORY_NEWS: 65.0, EventType.PARTNERSHIP: 55.0,
                          EventType.LAWSUIT: 80.0, EventType.DIVIDEND_CHANGE: 45.0}
        return max(0.0, min(100.0, base_engagement.get(event_type, 50.0) + random.uniform(-10, 10)))

    def predict_reaction(self, request: PredictionRequest) -> PredictionResponse:
        event = ReactionEvent(event_type=request.event_type, entity=request.entity,
                             event_description=request.event_description, context=request.context)
        self.events[event.id] = event

        sentiment, direction = self.calculate_sentiment(request.event_type, request.event_description)
        engagement = self.calculate_engagement(request.event_type)
        conversion = max(0.0, min(1.0, (sentiment + 1) / 2 * 0.6 + 0.2 + random.uniform(-0.1, 0.1)))
        volume = int(1000000 * (1.0 + abs(sentiment) * 2) + random.randint(-100000, 100000))
        volatility = sentiment * 0.5 + random.uniform(-0.1, 0.1)

        prediction = ReactionPrediction(event_id=event.id, overall_sentiment=sentiment, sentiment_direction=direction,
                                       engagement_score=engagement, conversion_likelihood=conversion,
                                       expected_volume=volume, volatility_impact=volatility, confidence=0.75)

        response = PredictionResponse(event=event, prediction=prediction)
        if request.include_segments:
            response.segment_reactions = self.get_segment_reactions(sentiment, engagement)
        if request.include_analysis:
            response.analysis = self.analyze_content(event)

        self.predictions[event.id] = response
        logger.info(f"Generated prediction for {event.entity}: sentiment={sentiment:.2f}")
        return response

    def get_segment_reactions(self, sentiment: float, engagement: float) -> List[SegmentReaction]:
        reactions = []
        offsets = {AudienceSegment.EARLY_ADOPTERS: 0.15, AudienceSegment.TECH_ENTHUSIASTS: 0.1,
                  AudienceSegment.VALUE_INVESTORS: -0.05, AudienceSegment.GROWTH_INVESTORS: 0.08,
                  AudienceSegment.INSTITUTIONAL: 0.0, AudienceSegment.RETAIL_INVESTORS: -0.05}
        actions = {AudienceSegment.EARLY_ADOPTERS: "buy_aggressive", AudienceSegment.TECH_ENTHUSIASTS: "buy_moderate",
                  AudienceSegment.VALUE_INVESTORS: "hold_watch", AudienceSegment.GROWTH_INVESTORS: "accumulate",
                  AudienceSegment.INSTITUTIONAL: "rebalance", AudienceSegment.RETAIL_INVESTORS: "mixed"}

        for segment, offset in offsets.items():
            reactions.append(SegmentReaction(segment=segment, sentiment=max(-1.0, min(1.0, sentiment + offset)),
                                           engagement_score=max(0.0, min(100.0, engagement + offset * 20)),
                                           expected_action=actions[segment], confidence=0.75))
        return reactions

    def analyze_content(self, event: ReactionEvent) -> ContentAnalysis:
        desc = event.event_description.lower()
        themes = []
        for kw, theme in [("ai", "AI"), ("growth", "Growth"), ("risk", "Risk"), ("partnership", "Partnership")]:
            if kw in desc:
                themes.append(theme)
        urgency = "high" if any(kw in desc for kw in ["breaking", "urgent"]) else "medium" if any(kw in desc for kw in ["announcement", "report"]) else "low"
        return ContentAnalysis(event_id=event.id, headline_sentiment=0.0, key_themes=themes[:5], urgency_level=urgency,
                              controversy_score=0.3 + len(themes) * 0.1, novelty_score=0.5)


state = ReactionEngineState()

app = FastAPI(title="AssetMind Reaction Prediction Engine", description="Consumer reaction prediction for financial events", version="1.0.0")


@app.get("/health")
async def health_check():
    return {"service": "assetmind-reaction-engine", "status": "healthy", "version": "1.0.0", "port": 5255,
            "total_events": len(state.events)}


@app.get("/health/live")
async def liveness():
    return {"status": "alive"}


@app.get("/health/ready")
async def readiness():
    return {"status": "ready", "events_processed": len(state.predictions)}


@app.post("/predict", response_model=PredictionResponse, status_code=201)
async def predict_reaction(request: PredictionRequest):
    return state.predict_reaction(request)


@app.get("/predictions", response_model=List[PredictionResponse])
async def list_predictions(event_type: Optional[EventType] = None, limit: int = Query(20, ge=1, le=100)):
    results = list(state.predictions.values())
    if event_type:
        results = [p for p in results if p.event.event_type == event_type]
    return sorted(results, key=lambda p: p.event.created_at, reverse=True)[:limit]


@app.post("/analyze", response_model=ContentAnalysis)
async def analyze_content(event_type: EventType, description: str, entity: str):
    event = ReactionEvent(event_type=event_type, entity=entity, event_description=description)
    return state.analyze_content(event)


@app.get("/segments")
async def list_segments():
    return [{"segment": s.value, "description": s.name.replace("_", " ").title()} for s in AudienceSegment]


@app.get("/")
async def root():
    return {"service": "AssetMind Reaction Prediction Engine", "version": "1.0.0", "port": 5255}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5255)