"""
AssetMind Twin Hub Service
Central orchestration for all digital twins

Port: 5250

Version: 1.0.0
"""

import uuid
import random
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
import uvicorn

# ============================================================================
# Configuration
# ============================================================================

app = FastAPI(
    title="AssetMind Twin Hub",
    description="Central orchestration for all digital twins",
    version="1.0.0",
)

# ============================================================================
# Enums
# ============================================================================

class TwinType(str, Enum):
    DECISION = "decision"
    REACTION = "reaction"
    COMPETITOR = "competitor"
    ANALYST = "analyst"
    ASSET = "asset"
    PORTFOLIO = "portfolio"
    INVESTOR = "investor"
    ECONOMIC = "economic"
    MARKET = "market"
    RISK = "risk"

class TwinStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SYNCING = "syncing"
    ERROR = "error"

class PredictionDirection(str, Enum):
    POSITIVE = "POSITIVE"
    NEGATIVE = "NEGATIVE"
    NEUTRAL = "NEUTRAL"
    MIXED = "MIXED"

# ============================================================================
# Pydantic Models - Twin Registry
# ============================================================================

class TwinEndpoint(BaseModel):
    name: str
    url: str
    port: int
    twin_type: TwinType
    status: TwinStatus = TwinStatus.ACTIVE
    last_response_time_ms: Optional[float] = None
    last_updated: datetime = Field(default_factory=datetime.utcnow)

class TwinPrediction(BaseModel):
    twin_name: str
    twin_type: TwinType
    prediction: PredictionDirection
    sentiment: float = Field(..., ge=-1.0, le=1.0)
    confidence: float = Field(..., ge=0.0, le=1.0)
    reasoning: str = ""
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class AggregatedPrediction(BaseModel):
    prediction: PredictionDirection
    avg_sentiment: float
    avg_confidence: float
    sentiment_distribution: Dict[str, float] = {}
    top_twins: List[str] = []
    disagreement_twins: List[str] = []

# ============================================================================
# Pydantic Models - Requests/Responses
# ============================================================================

class PredictionRequest(BaseModel):
    event_type: str = Field(..., description="Type of event (e.g., product_launch, earnings)")
    event_description: str = Field(..., description="Description of the event")
    entity: str = Field(..., description="Entity symbol (e.g., AAPL, MSFT)")
    context: Optional[Dict[str, Any]] = None
    twin_filters: Optional[List[TwinType]] = None

class PredictionResponse(BaseModel):
    request_id: str
    twins_called: int
    twins_available: int
    aggregated_prediction: AggregatedPrediction
    results: List[TwinPrediction]
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class TwinCreateRequest(BaseModel):
    name: str
    url: str
    port: int
    twin_type: TwinType

class TwinUpdateRequest(BaseModel):
    status: Optional[TwinStatus] = None
    url: Optional[str] = None

# ============================================================================
# In-Memory Storage
# ============================================================================

twins_registry: Dict[str, TwinEndpoint] = {}

# Initialize connected twins
def init_twins():
    """Initialize the twin registry with connected twins."""
    initial_twins = [
        TwinEndpoint(name="decision-twin", url=os.getenv("SVC_DECISION", "http://localhost:5250"), port=5250, twin_type=TwinType.DECISION),
        TwinEndpoint(name="reaction-engine", url=os.getenv("SVC_REACTION", "http://localhost:5255"), port=5255, twin_type=TwinType.REACTION),
        TwinEndpoint(name="competitor-twin", url=os.getenv("SVC_COMPETITOR", "http://localhost:5258"), port=5258, twin_type=TwinType.COMPETITOR),
        TwinEndpoint(name="analyst-twin", url=os.getenv("SVC_ANALYST", "http://localhost:5260"), port=5260, twin_type=TwinType.ANALYST),
        TwinEndpoint(name="asset-twin", url=os.getenv("SVC_ASSET", "http://localhost:5002"), port=5002, twin_type=TwinType.ASSET),
        TwinEndpoint(name="portfolio-twin", url=os.getenv("SVC_PORTFOLIO", "http://localhost:5004"), port=5004, twin_type=TwinType.PORTFOLIO),
        TwinEndpoint(name="investor-twin", url=os.getenv("SVC_INVESTOR", "http://localhost:5005"), port=5005, twin_type=TwinType.INVESTOR),
        TwinEndpoint(name="economic-twin", url=os.getenv("SVC_ECONOMIC", "http://localhost:5041"), port=5041, twin_type=TwinType.ECONOMIC),
    ]
    for twin in initial_twins:
        twins_registry[twin.name] = twin

init_twins()

# ============================================================================
# Health Check
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint with twin status."""
    active_count = sum(1 for t in twins_registry.values() if t.status == TwinStatus.ACTIVE)
    return {
        "status": "healthy",
        "service": "assetmind-twin-hub",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "stats": {
            "total_twins": len(twins_registry),
            "active_twins": active_count,
            "inactive_twins": len(twins_registry) - active_count,
        },
        "twins": {
            name: {
                "type": twin.twin_type.value,
                "status": twin.status.value,
                "port": twin.port,
            }
            for name, twin in twins_registry.items()
        },
    }

# ============================================================================
# Twin Registry Endpoints
# ============================================================================

@app.get("/twins", response_model=List[TwinEndpoint])
async def list_twins(
    twin_type: Optional[TwinType] = None,
    status: Optional[TwinStatus] = None,
):
    """List all registered twins with optional filtering."""
    twins = list(twins_registry.values())

    if twin_type:
        twins = [t for t in twins if t.twin_type == twin_type]
    if status:
        twins = [t for t in twins if t.status == status]

    return twins

@app.get("/twins/{twin_name}", response_model=TwinEndpoint)
async def get_twin(twin_name: str):
    """Get details of a specific twin."""
    if twin_name not in twins_registry:
        raise HTTPException(status_code=404, detail=f"Twin '{twin_name}' not found")
    return twins_registry[twin_name]

@app.post("/twins", response_model=TwinEndpoint, status_code=201)
async def register_twin(request: TwinCreateRequest):
    """Register a new twin with the hub."""
    if request.name in twins_registry:
        raise HTTPException(status_code=400, detail=f"Twin '{request.name}' already registered")

    twin = TwinEndpoint(
        name=request.name,
        url=request.url,
        port=request.port,
        twin_type=request.twin_type,
    )
    twins_registry[request.name] = twin
    return twin

@app.put("/twins/{twin_name}", response_model=TwinEndpoint)
async def update_twin(twin_name: str, request: TwinUpdateRequest):
    """Update twin configuration."""
    if twin_name not in twins_registry:
        raise HTTPException(status_code=404, detail=f"Twin '{twin_name}' not found")

    twin = twins_registry[twin_name]
    if request.status:
        twin.status = request.status
    if request.url:
        twin.url = request.url
    twin.last_updated = datetime.utcnow()
    return twin

@app.delete("/twins/{twin_name}", status_code=204)
async def unregister_twin(twin_name: str):
    """Unregister a twin from the hub."""
    if twin_name not in twins_registry:
        raise HTTPException(status_code=404, detail=f"Twin '{twin_name}' not found")
    del twins_registry[twin_name]

# ============================================================================
# Prediction Endpoints
# ============================================================================

@app.post("/predict", response_model=PredictionResponse)
async def aggregate_predictions(request: PredictionRequest):
    """
    Call all twins and aggregate their predictions into a unified decision.
    """
    request_id = f"req-{uuid.uuid4().hex[:8]}"

    # Filter twins if specified
    twins_to_call = twins_registry.values()
    if request.twin_filters:
        twins_to_call = [t for t in twins_to_call if t.twin_type in request.twin_filters]

    active_twins = [t for t in twins_to_call if t.status == TwinStatus.ACTIVE]

    # Simulate calling each twin (in production, this would make actual HTTP calls)
    results: List[TwinPrediction] = []
    for twin in active_twins:
        # Simulate twin response
        sentiment = random.uniform(-0.3, 0.9)
        confidence = random.uniform(0.5, 0.95)

        if sentiment > 0.2:
            prediction = PredictionDirection.POSITIVE
        elif sentiment < -0.2:
            prediction = PredictionDirection.NEGATIVE
        else:
            prediction = PredictionDirection.NEUTRAL

        results.append(TwinPrediction(
            twin_name=twin.name,
            twin_type=twin.twin_type,
            prediction=prediction,
            sentiment=sentiment,
            confidence=confidence,
            reasoning=f"Based on {request.event_type} event for {request.entity}",
        ))

    # Aggregate predictions
    if not results:
        aggregated = AggregatedPrediction(
            prediction=PredictionDirection.NEUTRAL,
            avg_sentiment=0.0,
            avg_confidence=0.0,
        )
    else:
        avg_sentiment = sum(r.sentiment for r in results) / len(results)
        avg_confidence = sum(r.confidence for r in results) / len(results)

        # Determine overall prediction
        positive_count = sum(1 for r in results if r.prediction == PredictionDirection.POSITIVE)
        negative_count = sum(1 for r in results if r.prediction == PredictionDirection.NEGATIVE)

        if positive_count > negative_count:
            overall = PredictionDirection.POSITIVE
        elif negative_count > positive_count:
            overall = PredictionDirection.NEGATIVE
        else:
            overall = PredictionDirection.MIXED

        # Top twins by confidence
        sorted_by_confidence = sorted(results, key=lambda x: x.confidence, reverse=True)
        top_twins = [r.twin_name for r in sorted_by_confidence[:3]]

        # Disagreement twins (low confidence or conflicting sentiment)
        disagreement = [
            r.twin_name for r in results
            if r.confidence < 0.6 or abs(r.sentiment - avg_sentiment) > 0.4
        ]

        aggregated = AggregatedPrediction(
            prediction=overall,
            avg_sentiment=avg_sentiment,
            avg_confidence=avg_confidence,
            sentiment_distribution={
                "positive": positive_count / len(results),
                "negative": negative_count / len(results),
                "neutral": (len(results) - positive_count - negative_count) / len(results),
            },
            top_twins=top_twins,
            disagreement_twins=disagreement,
        )

    return PredictionResponse(
        request_id=request_id,
        twins_called=len(active_twins),
        twins_available=len(twins_registry),
        aggregated_prediction=aggregated,
        results=results,
    )

@app.get("/predict/{entity}", response_model=List[TwinPrediction])
async def get_entity_predictions(entity: str):
    """Get latest predictions for a specific entity from all twins."""
    results = []
    for twin in twins_registry.values():
        if twin.status == TwinStatus.ACTIVE:
            sentiment = random.uniform(-0.5, 0.8)
            confidence = random.uniform(0.5, 0.9)

            if sentiment > 0.2:
                prediction = PredictionDirection.POSITIVE
            elif sentiment < -0.2:
                prediction = PredictionDirection.NEGATIVE
            else:
                prediction = PredictionDirection.NEUTRAL

            results.append(TwinPrediction(
                twin_name=twin.name,
                twin_type=twin.twin_type,
                prediction=prediction,
                sentiment=sentiment,
                confidence=confidence,
                reasoning=f"Latest analysis for {entity}",
            ))

    return results

# ============================================================================
# Statistics Endpoints
# ============================================================================

@app.get("/stats")
async def get_hub_stats():
    """Get hub statistics and twin performance metrics."""
    twin_stats = []
    for name, twin in twins_registry.items():
        twin_stats.append({
            "name": name,
            "type": twin.twin_type.value,
            "status": twin.status.value,
            "last_response_time_ms": twin.last_response_time_ms,
            "last_updated": twin.last_updated.isoformat(),
        })

    return {
        "total_twins": len(twins_registry),
        "by_type": {
            t.value: sum(1 for twin in twins_registry.values() if twin.twin_type == t)
            for t in TwinType
        },
        "by_status": {
            s.value: sum(1 for twin in twins_registry.values() if twin.status == s)
            for s in TwinStatus
        },
        "twins": twin_stats,
    }

# ============================================================================
# Run Server
# ============================================================================

if __name__ == "__main__":
    logger.info("Starting AssetMind Twin Hub on port 5250")
    uvicorn.run(app, host="0.0.0.0", port=5250)
