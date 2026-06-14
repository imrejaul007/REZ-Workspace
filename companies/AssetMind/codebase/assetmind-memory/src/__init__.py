"""
AssetMind - Financial Memory Service
Port: 5030

The "Memory" layer of AssetMind's intelligence architecture.
Stores predictions, outcomes, learnings, and financial insights forever.

This is the Prediction Learning Network moat - every prediction is stored,
every outcome is tracked, and the system learns over time.

Version: 1.0.0
Date: June 9, 2026
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime, timedelta
from enum import Enum
import uuid


app = FastAPI(title="AssetMind Financial Memory", version="1.0.0")

# In-memory storage (replace with TimescaleDB in production)
# Stores: predictions, outcomes, insights, learnings

class MemoryType(str, Enum):
    PREDICTION = "prediction"
    OUTCOME = "outcome"
    INSIGHT = "insight"
    LEARNING = "learning"
    EVENT = "event"
    RESEARCH = "research"
    THESIS = "thesis"


class Memory(BaseModel):
    memory_id: str
    symbol: Optional[str] = None
    memory_type: MemoryType
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    source: str = "system"  # Which service created this
    confidence: float = 1.0
    tags: List[str] = []
    linked_memories: List[str] = []
    created_at: datetime
    updated_at: datetime
    expires_at: Optional[datetime] = None


class PredictionMemory(BaseModel):
    """Stores a prediction for later learning"""
    prediction_id: str
    symbol: str
    predicted_value: float
    predicted_direction: str  # "bullish", "bearish", "neutral"
    time_horizon: str
    model: str  # Which model made the prediction (Kronos, etc.)
    reasoning: List[str]
    confidence: float
    actual_outcome: Optional[float] = None
    outcome_recorded_at: Optional[datetime] = None
    accuracy: Optional[float] = None  # Calculated when outcome recorded
    created_at: datetime


class Learning(BaseModel):
    """Stores what the system learned"""
    learning_id: str
    category: str  # "prediction", "pattern", "relationship"
    insight: str
    supporting_evidence: List[str]
    confidence: float
    times_proven: int = 0
    last_proven_at: Optional[datetime] = None
    created_at: datetime


class InsightRequest(BaseModel):
    symbol: Optional[str] = None
    memory_type: MemoryType
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    source: str = "api"
    tags: List[str] = []
    confidence: float = 1.0


class RecallRequest(BaseModel):
    query: str
    symbol: Optional[str] = None
    memory_types: Optional[List[MemoryType]] = None
    limit: int = Field(default=10, ge=1, le=100)
    days_back: Optional[int] = None  # Only recall from last N days


class PredictionRequest(BaseModel):
    symbol: str
    predicted_value: float
    predicted_direction: str
    time_horizon: str
    model: str
    reasoning: List[str]
    confidence: float


class OutcomeRequest(BaseModel):
    prediction_id: str
    actual_value: float


# In-memory storage
memories: Dict[str, Memory] = {}
predictions: Dict[str, PredictionMemory] = {}
learnings: Dict[str, Learning] = {}
outcomes: List[Dict] = []


# ============================================================================
# Health Check
# ============================================================================

@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-financial-memory",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5030,
        "memories": len(memories),
        "predictions": len(predictions),
        "learnings": len(learnings),
        "outcomes": len(outcomes)
    }


# ============================================================================
# Store Memory
# ============================================================================

@app.post("/memories", status_code=201)
async def store_memory(request: InsightRequest):
    """Store a new memory"""
    memory_id = str(uuid.uuid4())

    memory = Memory(
        memory_id=memory_id,
        symbol=request.symbol,
        memory_type=request.memory_type,
        content=request.content,
        metadata=request.metadata,
        source=request.source,
        confidence=request.confidence,
        tags=request.tags,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    memories[memory_id] = memory
    return {"memory_id": memory_id, "stored": True}


@app.get("/memories/{memory_id}")
async def get_memory(memory_id: str):
    """Get a specific memory"""
    if memory_id not in memories:
        raise HTTPException(status_code=404, detail="Memory not found")
    return memories[memory_id]


@app.get("/memories")
async def list_memories(
    symbol: Optional[str] = None,
    memory_type: Optional[MemoryType] = None,
    limit: int = 100
):
    """List memories with filters"""
    result = list(memories.values())

    if symbol:
        result = [m for m in result if m.symbol == symbol]
    if memory_type:
        result = [m for m in result if m.memory_type == memory_type]

    return {"memories": result[-limit:], "total": len(result)}


@app.delete("/memories/{memory_id}")
async def delete_memory(memory_id: str):
    """Delete a memory (soft delete - mark as expired)"""
    if memory_id not in memories:
        raise HTTPException(status_code=404, detail="Memory not found")

    memories[memory_id].expires_at = datetime.utcnow()
    memories[memory_id].updated_at = datetime.utcnow()

    return {"deleted": True, "memory_id": memory_id}


# ============================================================================
# Recall (Search)
# ============================================================================

@app.post("/recall")
async def recall_memories(request: RecallRequest):
    """Recall relevant memories based on query"""
    results = []

    query_lower = request.query.lower()

    for memory in memories.values():
        # Skip expired
        if memory.expires_at and memory.expires_at < datetime.utcnow():
            continue

        # Skip if too old
        if request.days_back:
            cutoff = datetime.utcnow() - timedelta(days=request.days_back)
            if memory.created_at < cutoff:
                continue

        # Filter by type
        if request.memory_types and memory.memory_type not in request.memory_types:
            continue

        # Filter by symbol
        if request.symbol and memory.symbol != request.symbol:
            continue

        # Text search
        if query_lower in memory.content.lower():
            results.append(memory)
        elif query_lower in memory.tags:
            results.append(memory)
        elif any(query_lower in tag.lower() for tag in memory.tags):
            results.append(memory)

    # Sort by relevance (confidence * recency)
    results.sort(
        key=lambda m: m.confidence * (1 / (datetime.utcnow() - m.created_at).total_seconds() + 1),
        reverse=True
    )

    return {"results": results[:request.limit], "total": len(results), "query": request.query}


@app.get("/recall/{symbol}")
async def recall_symbol_memories(symbol: str, limit: int = 20):
    """Recall all memories for a specific symbol"""
    symbol_memories = [
        m for m in memories.values()
        if m.symbol == symbol and (not m.expires_at or m.expires_at > datetime.utcnow())
    ]

    # Sort by recency
    symbol_memories.sort(key=lambda m: m.created_at, reverse=True)

    return {
        "symbol": symbol,
        "memories": symbol_memories[:limit],
        "total": len(symbol_memories)
    }


# ============================================================================
# Predictions
# ============================================================================

@app.post("/predictions", status_code=201)
async def store_prediction(request: PredictionRequest):
    """Store a prediction for later outcome tracking"""
    prediction_id = str(uuid.uuid4())

    prediction = PredictionMemory(
        prediction_id=prediction_id,
        symbol=request.symbol,
        predicted_value=request.predicted_value,
        predicted_direction=request.predicted_direction,
        time_horizon=request.time_horizon,
        model=request.model,
        reasoning=request.reasoning,
        confidence=request.confidence,
        created_at=datetime.utcnow()
    )

    predictions[prediction_id] = prediction

    # Also store as memory
    await store_memory(InsightRequest(
        symbol=request.symbol,
        memory_type=MemoryType.PREDICTION,
        content=f"Predicted {request.predicted_direction}: {request.predicted_value} (model: {request.model})",
        metadata={
            "prediction_id": prediction_id,
            "time_horizon": request.time_horizon,
            "reasoning": request.reasoning
        },
        source="prediction-engine",
        tags=[request.symbol, request.predicted_direction, request.model]
    ))

    return {"prediction_id": prediction_id, "stored": True}


@app.get("/predictions/{prediction_id}")
async def get_prediction(prediction_id: str):
    """Get a specific prediction"""
    if prediction_id not in predictions:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return predictions[prediction_id]


@app.get("/predictions")
async def list_predictions(symbol: Optional[str] = None, limit: int = 100):
    """List predictions"""
    result = list(predictions.values())

    if symbol:
        result = [p for p in result if p.symbol == symbol]

    return {"predictions": result[-limit:], "total": len(result)}


@app.post("/predictions/{prediction_id}/outcome")
async def record_outcome(prediction_id: str, request: OutcomeRequest):
    """Record the actual outcome of a prediction and learn"""
    if prediction_id not in predictions:
        raise HTTPException(status_code=404, detail="Prediction not found")

    prediction = predictions[prediction_id]
    prediction.actual_outcome = request.actual_value
    prediction.outcome_recorded_at = datetime.utcnow()

    # Calculate accuracy
    if prediction.predicted_direction == "bullish":
        if request.actual_value > prediction.predicted_value * 0.95:
            prediction.accuracy = 1.0
        else:
            prediction.accuracy = request.actual_value / (prediction.predicted_value * 0.95)
    elif prediction.predicted_direction == "bearish":
        if request.actual_value < prediction.predicted_value * 1.05:
            prediction.accuracy = 1.0
        else:
            prediction.accuracy = (prediction.predicted_value * 1.05) / request.actual_value
    else:
        # Neutral - check if within range
        diff = abs(request.actual_value - prediction.predicted_value) / prediction.predicted_value
        prediction.accuracy = max(0, 1 - diff)

    prediction.accuracy = min(1.0, max(0, prediction.accuracy))

    # Store outcome
    outcomes.append({
        "prediction_id": prediction_id,
        "symbol": prediction.symbol,
        "predicted": prediction.predicted_value,
        "actual": request.actual_value,
        "accuracy": prediction.accuracy,
        "recorded_at": datetime.utcnow().isoformat()
    })

    # Store as memory
    await store_memory(InsightRequest(
        symbol=prediction.symbol,
        memory_type=MemoryType.OUTCOME,
        content=f"Outcome recorded: predicted {prediction.predicted_value}, actual {request.actual_value}, accuracy {prediction.accuracy:.2%}",
        metadata={
            "prediction_id": prediction_id,
            "accuracy": prediction.accuracy
        },
        source="prediction-tracker",
        tags=[prediction.symbol, "outcome", f"accuracy_{prediction.accuracy:.0f}"]
    ))

    # Learn from outcome
    if prediction.accuracy < 0.7:
        await store_learning(Learning(
            learning_id=str(uuid.uuid4()),
            category="prediction",
            insight=f"Model {prediction.model} had {prediction.accuracy:.0%} accuracy for {prediction.symbol} on {prediction.time_horizon} horizon",
            supporting_evidence=[f"Predicted: {prediction.predicted_value}, Actual: {request.actual_value}"],
            confidence=prediction.accuracy,
            times_proven=1,
            last_proven_at=datetime.utcnow(),
            created_at=datetime.utcnow()
        ))

    return {
        "prediction_id": prediction_id,
        "actual_outcome": request.actual_value,
        "accuracy": prediction.accuracy,
        "learned": prediction.accuracy < 0.7
    }


# ============================================================================
# Learnings
# ============================================================================

@app.post("/learnings", status_code=201)
async def store_learning(request: Learning):
    """Store a new learning"""
    learning_id = request.learning_id or str(uuid.uuid4())

    learning = Learning(
        learning_id=learning_id,
        category=request.category,
        insight=request.insight,
        supporting_evidence=request.supporting_evidence,
        confidence=request.confidence,
        times_proven=request.times_proven,
        last_proven_at=request.last_proven_at,
        created_at=datetime.utcnow()
    )

    learnings[learning_id] = learning

    return {"learning_id": learning_id, "stored": True}


@app.get("/learnings")
async def list_learnings(category: Optional[str] = None, limit: int = 50):
    """List all learnings"""
    result = list(learnings.values())

    if category:
        result = [l for l in result if l.category == category]

    return {"learnings": result[-limit:], "total": len(result)}


@app.get("/learnings/proven")
async def get_proven_learnings(min_proven: int = 3):
    """Get learnings that have been proven multiple times"""
    proven = [l for l in learnings.values() if l.times_proven >= min_proven]
    proven.sort(key=lambda l: l.times_proven, reverse=True)

    return {"learnings": proven, "total": len(proven)}


# ============================================================================
# Analytics
# ============================================================================

@app.get("/stats/predictions")
async def get_prediction_stats():
    """Get prediction statistics"""
    if not predictions:
        return {
            "total_predictions": 0,
            "avg_accuracy": 0,
            "by_model": {},
            "by_symbol": {}
        }

    # Calculate overall stats
    predictions_with_outcomes = [p for p in predictions.values() if p.accuracy is not None]
    avg_accuracy = sum(p.accuracy for p in predictions_with_outcomes) / len(predictions_with_outcomes) if predictions_with_outcomes else 0

    # By model
    by_model = {}
    for p in predictions_with_outcomes:
        if p.model not in by_model:
            by_model[p.model] = {"count": 0, "total_accuracy": 0}
        by_model[p.model]["count"] += 1
        by_model[p.model]["total_accuracy"] += p.accuracy

    for model in by_model:
        by_model[model]["avg_accuracy"] = by_model[model]["total_accuracy"] / by_model[model]["count"]

    # By symbol
    by_symbol = {}
    for p in predictions_with_outcomes:
        if p.symbol not in by_symbol:
            by_symbol[p.symbol] = {"count": 0, "total_accuracy": 0}
        by_symbol[p.symbol]["count"] += 1
        by_symbol[p.symbol]["total_accuracy"] += p.accuracy

    for symbol in by_symbol:
        by_symbol[symbol]["avg_accuracy"] = by_symbol[symbol]["total_accuracy"] / by_symbol[symbol]["count"]

    return {
        "total_predictions": len(predictions),
        "predictions_with_outcomes": len(predictions_with_outcomes),
        "avg_accuracy": avg_accuracy,
        "by_model": by_model,
        "by_symbol": by_symbol
    }


@app.get("/stats/accuracy-trend")
async def get_accuracy_trend(days: int = 30):
    """Get accuracy trend over time"""
    cutoff = datetime.utcnow() - timedelta(days=days)

    recent_outcomes = [
        o for o in outcomes
        if datetime.fromisoformat(o["recorded_at"]) > cutoff
    ]

    if not recent_outcomes:
        return {"trend": [], "avg_accuracy": 0}

    # Group by day
    by_day = {}
    for outcome in recent_outcomes:
        day = outcome["recorded_at"][:10]  # YYYY-MM-DD
        if day not in by_day:
            by_day[day] = {"count": 0, "total_accuracy": 0}
        by_day[day]["count"] += 1
        by_day[day]["total_accuracy"] += outcome["accuracy"]

    trend = [
        {
            "date": day,
            "avg_accuracy": data["total_accuracy"] / data["count"],
            "count": data["count"]
        }
        for day, data in sorted(by_day.items())
    ]

    return {
        "trend": trend,
        "avg_accuracy": sum(o["accuracy"] for o in recent_outcomes) / len(recent_outcomes)
    }


# ============================================================================
# Bootstrap
# ============================================================================

@app.post("/bootstrap")
async def bootstrap_memory():
    """Bootstrap with sample memories and learnings"""
    added = 0

    # Sample predictions
    sample_predictions = [
        PredictionRequest(
            symbol="NVDA",
            predicted_value=950.0,
            predicted_direction="bullish",
            time_horizon="30D",
            model="kronos-base",
            reasoning=["AI infrastructure demand", "Data center growth"],
            confidence=0.80
        ),
        PredictionRequest(
            symbol="BTC",
            predicted_value=75000.0,
            predicted_direction="bullish",
            time_horizon="90D",
            model="kronos-base",
            reasoning=["ETF inflows", "Institutional adoption"],
            confidence=0.75
        ),
    ]

    for pred in sample_predictions:
        await store_prediction(pred)
        added += 1

    # Sample learnings
    sample_learnings = [
        Learning(
            learning_id=str(uuid.uuid4()),
            category="pattern",
            insight="AI infrastructure companies tend to outperform after earnings beats",
            supporting_evidence=["NVDA Q4 2023", "AMD Q4 2023"],
            confidence=0.85,
            times_proven=5,
            last_proven_at=datetime.utcnow(),
            created_at=datetime.utcnow()
        ),
        Learning(
            learning_id=str(uuid.uuid4()),
            category="relationship",
            insight="High correlation between BTC and tech stocks during risk-off periods",
            supporting_evidence=["2022 crash", "2024 rally"],
            confidence=0.75,
            times_proven=3,
            last_proven_at=datetime.utcnow(),
            created_at=datetime.utcnow()
        ),
    ]

    for learning in sample_learnings:
        await store_learning(learning)
        added += 1

    return {
        "message": "Bootstrap complete",
        "items_added": added,
        "total_memories": len(memories),
        "total_predictions": len(predictions),
        "total_learnings": len(learnings)
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5030)