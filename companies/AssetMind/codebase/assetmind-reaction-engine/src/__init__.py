"""
AssetMind - Reaction Prediction Engine
Port: 5255

Predicts reactions to events - Aiphrodite-style consumer prediction.

Features:
- Sentiment analysis
- Engagement prediction
- Conversion likelihood
- Audience segmentation
- Competitive positioning

Version: 1.0.0
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime
import random

app = FastAPI(title="Reaction Prediction Engine")

# ============================================================================
# MODELS
# ============================================================================

class AudienceSegment(BaseModel):
    segment: str
    size_pct: float
    sentiment: float  # -1 to 1
    engagement_probability: float  # 0-1
    conversion_probability: float  # 0-1

class ReactionPrediction(BaseModel):
    overall_sentiment: float  # -1 to 1
    sentiment_trend: str  # improving, declining, stable
    engagement_score: float  # 0-100
    conversion_likelihood: float  # 0-1
    key_themes: List[str]
    emotional_triggers: List[str]
    concerns: List[str]
    audience_segments: List[AudienceSegment]

class ContentAnalysis(BaseModel):
    content_type: str
    headline_score: float  # 0-100
    visual_appeal: float  # 0-100
    call_to_action_strength: float  # 0-100
    brand_alignment: float  # 0-100
    competitive_differentiation: float  # 0-100

class ReactionRequest(BaseModel):
    event_type: str  # product_launch, pricing_change, ad_campaign, etc.
    event_description: str
    entity: str
    audience_type: Optional[str] = None  # b2c, b2b, enterprise
    context: Optional[Dict] = None

# ============================================================================
# PREDICTION ENGINES
# ============================================================================

def predict_sentiment(event_type: str, description: str) -> float:
    """Predict overall sentiment"""
    positive_words = ["launch", "innovative", "improved", "discount", "free", "new"]
    negative_words = ["price increase", "delay", "recall", "lawsuit", "layoff"]

    score = 0
    desc_lower = description.lower()

    for word in positive_words:
        if word in desc_lower:
            score += 0.2

    for word in negative_words:
        if word in desc_lower:
            score -= 0.3

    return max(-1, min(1, score))

def predict_audience_segments(event_type: str) -> List[AudienceSegment]:
    """Predict reactions by audience segment"""

    segments = [
        AudienceSegment(
            segment="Early Adopters",
            size_pct=15.0,
            sentiment=0.7,
            engagement_probability=0.85,
            conversion_probability=0.45
        ),
        AudienceSegment(
            segment="Mainstream Users",
            size_pct=45.0,
            sentiment=0.4,
            engagement_probability=0.60,
            conversion_probability=0.25
        ),
        AudienceSegment(
            segment="Skeptics",
            size_pct=25.0,
            sentiment=-0.2,
            engagement_probability=0.30,
            conversion_probability=0.10
        ),
        AudienceSegment(
            segment="Non-Interested",
            size_pct=15.0,
            sentiment=-0.5,
            engagement_probability=0.10,
            conversion_probability=0.02
        )
    ]

    return segments

def analyze_content(description: str) -> ContentAnalysis:
    """Analyze content quality"""

    headline_score = random.uniform(60, 95)
    visual_appeal = random.uniform(65, 90)

    return ContentAnalysis(
        content_type="announcement",
        headline_score=headline_score,
        visual_appeal=visual_appeal,
        call_to_action_strength=random.uniform(50, 85),
        brand_alignment=random.uniform(70, 95),
        competitive_differentiation=random.uniform(55, 90)
    )

# ============================================================================
# API ROUTES
# ============================================================================

@app.get("/health")
async def health():
    return {
        "service": "reaction-prediction",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5255
    }

@app.post("/predict", response_model=ReactionPrediction)
async def predict_reaction(request: ReactionRequest) -> ReactionPrediction:
    """
    Predict audience reactions to an event.

    Aiphrodite-style consumer prediction.
    """

    sentiment = predict_sentiment(request.event_type, request.event_description)
    segments = predict_audience_segments(request.event_type)

    # Calculate weighted sentiment
    weighted_sentiment = sum(
        s.sentiment * (s.size_pct / 100) for s in segments
    )

    # Engagement score
    engagement = sum(
        s.engagement_probability * (s.size_pct / 100) for s in segments
    ) * 100

    # Conversion likelihood
    conversion = sum(
        s.conversion_probability * (s.size_pct / 100) for s in segments
    )

    return ReactionPrediction(
        overall_sentiment=weighted_sentiment,
        sentiment_trend="improving" if sentiment > 0 else "stable",
        engagement_score=engagement,
        conversion_likelihood=conversion,
        key_themes=["innovation", "value", "quality"],
        emotional_triggers=["curiosity", "fear_of_missing_out", "trust"],
        concerns=["price", "complexity", "compatibility"],
        audience_segments=segments
    )

@app.post("/analyze", response_model=ContentAnalysis)
async def analyze_content_endpoint(request: ReactionRequest) -> ContentAnalysis:
    """Analyze content quality"""

    return analyze_content(request.event_description)

@app.post("/compare")
async def compare_reactions(event1: str, event2: str):
    """
    Compare reactions to two events.

    Which performs better?
    """

    # Predict both
    pred1_sentiment = predict_sentiment("event", event1)
    pred2_sentiment = predict_sentiment("event", event2)

    return {
        "event1": {
            "description": event1,
            "sentiment": pred1_sentiment
        },
        "event2": {
            "description": event2,
            "sentiment": pred2_sentiment
        },
        "winner": "event1" if pred1_sentiment > pred2_sentiment else "event2",
        "recommendation": "Use the higher-performing event for maximum impact"
    }

@app.get("/segments")
async def list_segments():
    """List audience segments"""
    return {
        "segments": [
            "Early Adopters",
            "Mainstream Users",
            "Skeptics",
            "Non-Interested",
            "Enterprise Buyers",
            "Individual Consumers",
            "Power Users",
            "Casual Users"
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5255)
