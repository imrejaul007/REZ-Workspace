"""
AssetMind Financial Memory Service
Persistent memory storage for financial insights, predictions, and learnings

This service provides:
- Long-term memory storage for financial data
- Prediction tracking and outcome recording
- Learning system for improving predictions
- Semantic memory search
- Cross-asset relationship memory

Port: 5030

Version: 1.0.0
Date: June 11, 2026
"""

import logging
import time
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import APIRouter, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ============================================================================
# Logging Configuration
# ============================================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("assetmind-memory")

# ============================================================================
# Enums
# ============================================================================

class MemoryType(str, Enum):
    """Memory type enumeration"""
    PREDICTION = "prediction"
    OUTCOME = "outcome"
    INSIGHT = "insight"
    LEARNING = "learning"
    EVENT = "event"
    RESEARCH = "research"
    THESIS = "thesis"
    RELATIONSHIP = "relationship"


class MemoryStatus(str, Enum):
    """Memory status"""
    ACTIVE = "active"
    ARCHIVED = "archived"
    EXPIRED = "expired"


class AssetClass(str, Enum):
    """Asset class for memory categorization"""
    STOCK = "STOCK"
    CRYPTO = "CRYPTO"
    FOREX = "FOREX"
    COMMODITY = "COMMODITY"
    ETF = "ETF"
    INDEX = "INDEX"
    BOND = "BOND"

# ============================================================================
# Pydantic Models
# ============================================================================

class Memory(BaseModel):
    """Memory entry model"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    memory_type: MemoryType
    symbol: Optional[str] = None
    asset_class: Optional[AssetClass] = None
    title: str
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)
    source: str = "system"
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    importance: int = Field(default=5, ge=1, le=10)
    status: MemoryStatus = MemoryStatus.ACTIVE
    linked_memories: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None


class MemoryCreate(BaseModel):
    """Memory creation request"""
    memory_type: MemoryType
    symbol: Optional[str] = None
    asset_class: Optional[AssetClass] = None
    title: str
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    tags: List[str] = Field(default_factory=list)
    source: str = "api"
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    importance: int = Field(default=5, ge=1, le=10)
    expires_at: Optional[datetime] = None


class MemoryUpdate(BaseModel):
    """Memory update request"""
    title: Optional[str] = None
    content: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    status: Optional[MemoryStatus] = None
    confidence: Optional[float] = None
    importance: Optional[int] = None
    linked_memories: Optional[List[str]] = None


class MemorySearch(BaseModel):
    """Memory search request"""
    query: str
    memory_types: Optional[List[MemoryType]] = None
    symbols: Optional[List[str]] = None
    asset_classes: Optional[List[AssetClass]] = None
    tags: Optional[List[str]] = None
    min_confidence: Optional[float] = None
    min_importance: Optional[int] = None
    days_back: Optional[int] = None
    limit: int = Field(default=20, ge=1, le=100)


class PredictionRecord(BaseModel):
    """Prediction record for tracking"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    symbol: str
    predicted_value: float
    predicted_direction: str  # bullish, bearish, neutral
    time_horizon: str  # 1D, 7D, 30D, 90D, 1Y
    model_name: str
    reasoning: List[str]
    confidence: float
    actual_outcome: Optional[float] = None
    outcome_recorded_at: Optional[datetime] = None
    accuracy: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PredictionCreate(BaseModel):
    """Prediction creation request"""
    symbol: str
    predicted_value: float
    predicted_direction: str
    time_horizon: str
    model_name: str
    reasoning: List[str]
    confidence: float


class OutcomeRecord(BaseModel):
    """Outcome recording request"""
    prediction_id: str
    actual_value: float
    notes: Optional[str] = None


class LearningRecord(BaseModel):
    """Learning record for system improvement"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    category: str  # prediction, pattern, relationship, behavior
    insight: str
    supporting_memories: List[str]
    confidence: float
    times_proven: int = 0
    last_proven_at: Optional[datetime] = None
    model_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class MemoryStatistics(BaseModel):
    """Memory statistics"""
    total_memories: int
    by_type: Dict[str, int]
    by_symbol: Dict[str, int]
    total_predictions: int
    predictions_with_outcomes: int
    avg_prediction_accuracy: float
    total_learnings: int

# ============================================================================
# Application State
# ============================================================================

class MemoryState:
    """Application state for memory service"""

    def __init__(self):
        self.memories: Dict[str, Memory] = {}
        self.predictions: Dict[str, PredictionRecord] = {}
        self.learnings: Dict[str, LearningRecord] = {}
        self.outcomes: List[Dict] = []
        self.start_time = time.time()

    def create_memory(self, request: MemoryCreate) -> Memory:
        """Create a new memory"""
        memory = Memory(
            memory_type=request.memory_type,
            symbol=request.symbol,
            asset_class=request.asset_class,
            title=request.title,
            content=request.content,
            metadata=request.metadata,
            tags=request.tags,
            source=request.source,
            confidence=request.confidence,
            importance=request.importance,
            expires_at=request.expires_at,
        )
        self.memories[memory.id] = memory
        return memory

    def get_memory(self, memory_id: str) -> Optional[Memory]:
        """Get memory by ID"""
        return self.memories.get(memory_id)

    def update_memory(self, memory_id: str, update: MemoryUpdate) -> Optional[Memory]:
        """Update a memory"""
        memory = self.memories.get(memory_id)
        if not memory:
            return None

        if update.title is not None:
            memory.title = update.title
        if update.content is not None:
            memory.content = update.content
        if update.metadata is not None:
            memory.metadata.update(update.metadata)
        if update.tags is not None:
            memory.tags = update.tags
        if update.status is not None:
            memory.status = update.status
        if update.confidence is not None:
            memory.confidence = update.confidence
        if update.importance is not None:
            memory.importance = update.importance
        if update.linked_memories is not None:
            memory.linked_memories = update.linked_memories

        memory.updated_at = datetime.utcnow()
        return memory

    def search_memories(self, search: MemorySearch) -> List[Memory]:
        """Search memories"""
        results = list(self.memories.values())

        # Filter by query
        if search.query:
            query_lower = search.query.lower()
            results = [
                m for m in results
                if query_lower in m.content.lower()
                or query_lower in m.title.lower()
                or any(query_lower in tag.lower() for tag in m.tags)
            ]

        # Filter by types
        if search.memory_types:
            results = [m for m in results if m.memory_type in search.memory_types]

        # Filter by symbols
        if search.symbols:
            results = [m for m in results if m.symbol in search.symbols]

        # Filter by asset classes
        if search.asset_classes:
            results = [m for m in results if m.asset_class in search.asset_classes]

        # Filter by tags
        if search.tags:
            results = [
                m for m in results
                if any(tag in m.tags for tag in search.tags)
            ]

        # Filter by confidence
        if search.min_confidence is not None:
            results = [m for m in results if m.confidence >= search.min_confidence]

        # Filter by importance
        if search.min_importance is not None:
            results = [m for m in results if m.importance >= search.min_importance]

        # Filter by date
        if search.days_back:
            cutoff = datetime.utcnow() - timedelta(days=search.days_back)
            results = [m for m in results if m.created_at >= cutoff]

        # Filter out expired
        now = datetime.utcnow()
        results = [
            m for m in results
            if m.status != MemoryStatus.EXPIRED
            and (m.expires_at is None or m.expires_at > now)
        ]

        # Sort by relevance: importance * confidence * recency
        results.sort(
            key=lambda m: m.importance * m.confidence / (1 + (now - m.created_at).total_seconds() / 86400),
            reverse=True
        )

        return results[:search.limit]

    def create_prediction(self, request: PredictionCreate) -> PredictionRecord:
        """Create a prediction record"""
        prediction = PredictionRecord(
            symbol=request.symbol,
            predicted_value=request.predicted_value,
            predicted_direction=request.predicted_direction,
            time_horizon=request.time_horizon,
            model_name=request.model_name,
            reasoning=request.reasoning,
            confidence=request.confidence,
        )
        self.predictions[prediction.id] = prediction

        # Also create memory for this prediction
        self.create_memory(MemoryCreate(
            memory_type=MemoryType.PREDICTION,
            symbol=request.symbol,
            title=f"Prediction: {request.symbol} {request.predicted_direction}",
            content=f"Predicted {request.predicted_direction}: {request.predicted_value} (model: {request.model_name})",
            metadata={
                "prediction_id": prediction.id,
                "time_horizon": request.time_horizon,
                "reasoning": request.reasoning,
            },
            source="prediction-engine",
            tags=[request.symbol, request.predicted_direction, request.model_name],
            confidence=request.confidence,
        ))

        return prediction

    def record_outcome(self, request: OutcomeRecord) -> Dict[str, Any]:
        """Record prediction outcome and calculate accuracy"""
        prediction = self.predictions.get(request.prediction_id)
        if not prediction:
            raise HTTPException(status_code=404, detail="Prediction not found")

        prediction.actual_outcome = request.actual_value
        prediction.outcome_recorded_at = datetime.utcnow()

        # Calculate accuracy based on direction
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
            diff = abs(request.actual_value - prediction.predicted_value) / prediction.predicted_value
            prediction.accuracy = max(0, 1 - diff)

        prediction.accuracy = min(1.0, max(0, prediction.accuracy))

        # Store outcome
        outcome_record = {
            "prediction_id": request.prediction_id,
            "symbol": prediction.symbol,
            "predicted": prediction.predicted_value,
            "actual": request.actual_value,
            "accuracy": prediction.accuracy,
            "notes": request.notes,
            "recorded_at": datetime.utcnow().isoformat(),
        }
        self.outcomes.append(outcome_record)

        # Learn from outcome
        if prediction.accuracy < 0.7:
            learning = LearningRecord(
                category="prediction",
                insight=f"Model {prediction.model_name} had {prediction.accuracy:.0%} accuracy for {prediction.symbol}",
                supporting_memories=[request.prediction_id],
                confidence=prediction.accuracy,
                model_id=prediction.model_name,
            )
            self.learnings[learning.id] = learning

        return outcome_record

    def get_statistics(self) -> MemoryStatistics:
        """Get memory statistics"""
        by_type: Dict[str, int] = {}
        by_symbol: Dict[str, int] = {}

        for memory in self.memories.values():
            by_type[memory.memory_type.value] = by_type.get(memory.memory_type.value, 0) + 1
            if memory.symbol:
                by_symbol[memory.symbol] = by_symbol.get(memory.symbol, 0) + 1

        predictions_with_outcomes = [p for p in self.predictions.values() if p.accuracy is not None]
        avg_accuracy = (
            sum(p.accuracy for p in predictions_with_outcomes) / len(predictions_with_outcomes)
            if predictions_with_outcomes else 0.0
        )

        return MemoryStatistics(
            total_memories=len(self.memories),
            by_type=by_type,
            by_symbol=by_symbol,
            total_predictions=len(self.predictions),
            predictions_with_outcomes=len(predictions_with_outcomes),
            avg_prediction_accuracy=avg_accuracy,
            total_learnings=len(self.learnings),
        )


# Global state
state = MemoryState()

# ============================================================================
# Lifespan Manager
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("AssetMind Financial Memory Service starting up...")

    # Bootstrap with sample memories
    sample_memories = [
        MemoryCreate(
            memory_type=MemoryType.INSIGHT,
            symbol="NVDA",
            asset_class=AssetClass.STOCK,
            title="AI Infrastructure Demand",
            content="AI infrastructure companies continue to see strong demand",
            tags=["AI", "semiconductor", "growth"],
            source="system",
            confidence=0.85,
        ),
        MemoryCreate(
            memory_type=MemoryType.LEARNING,
            category="pattern",
            symbol="BTC",
            title="BTC-S&P500 Correlation",
            content="High correlation between BTC and tech stocks during risk-off periods",
            tags=["crypto", "correlation", "pattern"],
            source="system",
            confidence=0.75,
        ),
    ]

    for mem in sample_memories:
        state.create_memory(mem)

    logger.info(f"Memory Service ready with {len(state.memories)} initial memories")
    yield
    logger.info("AssetMind Financial Memory Service shutting down...")

# ============================================================================
# FastAPI Application
# ============================================================================

app = FastAPI(
    title="AssetMind Financial Memory",
    description="""
    ## AssetMind Financial Memory Service

    Long-term memory storage for financial intelligence:
    - Persistent storage of predictions and outcomes
    - Learning system for improving accuracy
    - Semantic memory search across all data
    - Cross-asset relationship tracking

    ### Memory Types
    - PREDICTION: Price and trend predictions
    - OUTCOME: Actual results vs predictions
    - INSIGHT: Market insights and observations
    - LEARNING: System learnings and patterns
    - EVENT: Significant market events
    - RESEARCH: Research findings
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
)

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
        "service": "assetmind-memory",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5030,
        "total_memories": len(state.memories),
        "total_predictions": len(state.predictions),
        "total_learnings": len(state.learnings),
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/health/live", tags=["Health"])
async def liveness():
    """Kubernetes liveness probe"""
    return {"status": "alive"}


@app.get("/health/ready", tags=["Health"])
async def readiness():
    """Kubernetes readiness probe"""
    return {"status": "ready", "memories_loaded": len(state.memories)}

# ============================================================================
# Memory CRUD Endpoints
# ============================================================================

memory_router = APIRouter(prefix="/memories", tags=["Memories"])


@memory_router.post("/", response_model=Memory, status_code=201)
async def create_memory(request: MemoryCreate):
    """Create a new memory"""
    memory = state.create_memory(request)
    logger.info(f"Created memory: {memory.id}")
    return memory


@memory_router.get("/", response_model=List[Memory])
async def list_memories(
    memory_type: Optional[MemoryType] = None,
    symbol: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
):
    """List memories with filters"""
    results = list(state.memories.values())

    if memory_type:
        results = [m for m in results if m.memory_type == memory_type]
    if symbol:
        results = [m for m in results if m.symbol == symbol]

    results.sort(key=lambda m: m.created_at, reverse=True)
    return results[:limit]


@memory_router.get("/{memory_id}", response_model=Memory)
async def get_memory(memory_id: str):
    """Get memory by ID"""
    memory = state.get_memory(memory_id)
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    return memory


@memory_router.patch("/{memory_id}", response_model=Memory)
async def update_memory(memory_id: str, update: MemoryUpdate):
    """Update a memory"""
    memory = state.update_memory(memory_id, update)
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")
    return memory


@memory_router.delete("/{memory_id}", status_code=204)
async def delete_memory(memory_id: str):
    """Delete a memory"""
    if memory_id not in state.memories:
        raise HTTPException(status_code=404, detail="Memory not found")
    del state.memories[memory_id]
    logger.info(f"Deleted memory: {memory_id}")


app.include_router(memory_router)

# ============================================================================
# Search Endpoints
# ============================================================================

search_router = APIRouter(prefix="/search", tags=["Search"])


@search_router.post("/", response_model=List[Memory])
async def search_memories(search: MemorySearch):
    """Search memories with filters"""
    return state.search_memories(search)


@search_router.get("/symbols/{symbol}", response_model=List[Memory])
async def get_symbol_memories(
    symbol: str,
    memory_type: Optional[MemoryType] = None,
    limit: int = Query(50, ge=1, le=200),
):
    """Get all memories for a specific symbol"""
    memories = state.search_memories(MemorySearch(
        query="",
        symbols=[symbol],
        memory_types=[memory_type] if memory_type else None,
        limit=limit,
    ))
    return memories


app.include_router(search_router)

# ============================================================================
# Prediction Endpoints
# ============================================================================

prediction_router = APIRouter(prefix="/predictions", tags=["Predictions"])


@prediction_router.post("/", response_model=PredictionRecord, status_code=201)
async def create_prediction(request: PredictionCreate):
    """Create a new prediction"""
    return state.create_prediction(request)


@prediction_router.get("/", response_model=List[PredictionRecord])
async def list_predictions(
    symbol: Optional[str] = None,
    has_outcome: Optional[bool] = None,
    limit: int = Query(50, ge=1, le=200),
):
    """List predictions"""
    results = list(state.predictions.values())

    if symbol:
        results = [p for p in results if p.symbol == symbol]
    if has_outcome is not None:
        if has_outcome:
            results = [p for p in results if p.accuracy is not None]
        else:
            results = [p for p in results if p.accuracy is None]

    results.sort(key=lambda p: p.created_at, reverse=True)
    return results[:limit]


@prediction_router.get("/{prediction_id}", response_model=PredictionRecord)
async def get_prediction(prediction_id: str):
    """Get prediction by ID"""
    if prediction_id not in state.predictions:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return state.predictions[prediction_id]


@prediction_router.post("/outcome", response_model=Dict[str, Any])
async def record_outcome(request: OutcomeRecord):
    """Record prediction outcome"""
    return state.record_outcome(request)


app.include_router(prediction_router)

# ============================================================================
# Learning Endpoints
# ============================================================================

@app.get("/learnings", response_model=List[LearningRecord], tags=["Learnings"])
async def list_learnings(
    category: Optional[str] = None,
    min_proven: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    """List system learnings"""
    results = list(state.learnings.values())

    if category:
        results = [l for l in results if l.category == category]
    if min_proven > 0:
        results = [l for l in results if l.times_proven >= min_proven]

    results.sort(key=lambda l: l.times_proven, reverse=True)
    return results[:limit]


@app.post("/learnings", response_model=LearningRecord, status_code=201, tags=["Learnings"])
async def create_learning(learning: LearningRecord):
    """Create a new learning"""
    state.learnings[learning.id] = learning
    return learning

# ============================================================================
# Statistics Endpoints
# ============================================================================

@app.get("/statistics", response_model=MemoryStatistics, tags=["Statistics"])
async def get_statistics():
    """Get memory statistics"""
    return state.get_statistics()


@app.get("/outcomes", response_model=List[Dict], tags=["Statistics"])
async def get_outcomes(limit: int = Query(100, ge=1, le=500)):
    """Get prediction outcomes"""
    return state.outcomes[-limit:]

# ============================================================================
# Root Endpoint
# ============================================================================

@app.get("/", include_in_schema=False)
async def root():
    """Root endpoint"""
    return {
        "service": "AssetMind Financial Memory",
        "version": "1.0.0",
        "port": 5030,
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5030)
