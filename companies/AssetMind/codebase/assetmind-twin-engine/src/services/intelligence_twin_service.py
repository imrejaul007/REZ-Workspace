"""
AssetMind - Intelligence Twin Service
Port: 5006
"""

from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


app = FastAPI(title="AssetMind Intelligence Twin Service", version="1.0.0")


class PredictionType(str, Enum):
    DIRECTION = "DIRECTION"
    SCORE = "SCORE"
    EVENT = "EVENT"
    EARNINGS = "EARNINGS"


class ModelName(str, Enum):
    TECHNICAL = "technical_model"
    FUNDAMENTAL = "fundamental_model"
    SENTIMENT = "sentiment_model"
    MACRO = "macro_model"
    EVENT = "event_model"
    ENSEMBLE = "ensemble_model"


class PredictionRecord(BaseModel):
    """Single prediction for learning"""
    id: str
    asset_symbol: str
    prediction_type: PredictionType
    prediction_value: Dict[str, float]  # e.g., {"bullish": 0.62, "neutral": 0.24, "bearish": 0.14}
    confidence: float
    reasoning: List[str]
    model_used: ModelName
    time_horizon: str

    # Outcome (filled later)
    actual_outcome: Optional[float] = None
    prediction_correct: Optional[bool] = None
    error: Optional[float] = None

    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ModelPerformance(BaseModel):
    """Individual model performance"""
    model_name: str
    accuracy: float = 50
    avg_confidence: float = 50
    predictions_count: int = 0
    last_updated: datetime = Field(default_factory=datetime.utcnow)


class IntelligenceTwin(BaseModel):
    """Intelligence Digital Twin - Tracks all predictions and system learning"""
    platform_id: str = "assetmind"

    # Overall Performance
    total_predictions: int = 0
    correct_predictions: int = 0
    overall_accuracy: float = 50

    # Confidence Calibration
    avg_predicted_confidence: float = 50
    actual_accuracy_at_confidence: float = 50
    calibration_error: float = 0

    # Model Performance
    technical_model: ModelPerformance = Field(
        default_factory=lambda: ModelPerformance(model_name="technical_model")
    )
    fundamental_model: ModelPerformance = Field(
        default_factory=lambda: ModelPerformance(model_name="fundamental_model")
    )
    sentiment_model: ModelPerformance = Field(
        default_factory=lambda: ModelPerformance(model_name="sentiment_model")
    )
    macro_model: ModelPerformance = Field(
        default_factory=lambda: ModelPerformance(model_name="macro_model")
    )
    event_model: ModelPerformance = Field(
        default_factory=lambda: ModelPerformance(model_name="event_model")
    )
    ensemble_model: ModelPerformance = Field(
        default_factory=lambda: ModelPerformance(model_name="ensemble_model")
    )

    # Learning Events
    major_learning_events: List[str] = Field(default_factory=list)
    pattern_discoveries: List[str] = Field(default_factory=list)
    model_updates: List[str] = Field(default_factory=list)

    # Intellectual Property
    proprietary_indicators: List[str] = Field(default_factory=list)
    proprietary_patterns: List[str] = Field(default_factory=list)
    proprietary_relationships: List[str] = Field(default_factory=list)

    # Recent Predictions
    recent_predictions: List[PredictionRecord] = Field(default_factory=list)

    # Improvement Trends
    accuracy_trend_30d: str = "STABLE"
    accuracy_trend_90d: str = "STABLE"
    accuracy_trend_1y: str = "STABLE"

    last_updated: datetime = Field(default_factory=datetime.utcnow)


# In-memory storage
intelligence_twin = IntelligenceTwin()


@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-intelligence-twin",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5006,
        "total_predictions": intelligence_twin.total_predictions,
        "overall_accuracy": intelligence_twin.overall_accuracy
    }


@app.get("/twin")
async def get_intelligence_twin():
    return intelligence_twin


@app.get("/twin/accuracy")
async def get_accuracy_metrics():
    return {
        "overall_accuracy": intelligence_twin.overall_accuracy,
        "total_predictions": intelligence_twin.total_predictions,
        "correct_predictions": intelligence_twin.correct_predictions,
        "calibration_error": intelligence_twin.calibration_error,
        "accuracy_trend_30d": intelligence_twin.accuracy_trend_30d,
        "accuracy_trend_90d": intelligence_twin.accuracy_trend_90d,
    }


@app.get("/twin/models")
async def get_model_performance():
    return {
        "models": [
            intelligence_twin.technical_model.model_dump(),
            intelligence_twin.fundamental_model.model_dump(),
            intelligence_twin.sentiment_model.model_dump(),
            intelligence_twin.macro_model.model_dump(),
            intelligence_twin.event_model.model_dump(),
            intelligence_twin.ensemble_model.model_dump(),
        ]
    }


@app.get("/twin/calibration")
async def get_confidence_calibration():
    return {
        "avg_predicted_confidence": intelligence_twin.avg_predicted_confidence,
        "actual_accuracy": intelligence_twin.actual_accuracy_at_confidence,
        "calibration_error": intelligence_twin.calibration_error,
        "interpretation": _interpret_calibration(intelligence_twin.calibration_error)
    }


def _interpret_calibration(error: float) -> str:
    if abs(error) < 5:
        return "Well calibrated - predictions match confidence levels"
    elif error > 0:
        return "Overconfident - actual accuracy is lower than predicted confidence"
    else:
        return "Underconfident - actual accuracy is higher than predicted confidence"


@app.get("/twin/recent-predictions")
async def get_recent_predictions(limit: int = 10):
    predictions = intelligence_twin.recent_predictions[-limit:]
    return {"predictions": [p.model_dump() for p in reversed(predictions)]}


@app.get("/twin/learning-events")
async def get_learning_events():
    return {
        "major_events": intelligence_twin.major_learning_events,
        "pattern_discoveries": intelligence_twin.pattern_discoveries,
        "model_updates": intelligence_twin.model_updates,
    }


@app.get("/twin/intellectual-property")
async def get_intellectual_property():
    return {
        "proprietary_indicators": intelligence_twin.proprietary_indicators,
        "proprietary_patterns": intelligence_twin.proprietary_patterns,
        "proprietary_relationships": intelligence_twin.proprietary_relationships,
    }


@app.post("/twin/prediction")
async def record_prediction(prediction: PredictionRecord):
    """Record a new prediction"""
    intelligence_twin.total_predictions += 1
    intelligence_twin.recent_predictions.append(prediction)

    # Keep only last 1000
    intelligence_twin.recent_predictions = intelligence_twin.recent_predictions[-1000:]

    intelligence_twin.last_updated = datetime.utcnow()
    return {"message": "Prediction recorded", "prediction_id": prediction.id}


@app.post("/twin/prediction/{prediction_id}/outcome")
async def record_outcome(prediction_id: str, actual_outcome: float, direction_correct: bool):
    """Record the outcome of a prediction"""
    # Find prediction
    for pred in intelligence_twin.recent_predictions:
        if pred.id == prediction_id:
            pred.actual_outcome = actual_outcome
            pred.prediction_correct = direction_correct
            pred.error = abs(actual_outcome - 0.5) if actual_outcome else None

            if direction_correct:
                intelligence_twin.correct_predictions += 1

            intelligence_twin.overall_accuracy = (
                intelligence_twin.correct_predictions / intelligence_twin.total_predictions * 100
            )

            intelligence_twin.last_updated = datetime.utcnow()
            return {"message": "Outcome recorded", "prediction_correct": direction_correct}

    return {"error": "Prediction not found"}


@app.post("/twin/model/{model_name}/update")
async def update_model_accuracy(model_name: str, accuracy: float, predictions_count: int):
    """Update model performance metrics"""
    models = {
        "technical_model": intelligence_twin.technical_model,
        "fundamental_model": intelligence_twin.fundamental_model,
        "sentiment_model": intelligence_twin.sentiment_model,
        "macro_model": intelligence_twin.macro_model,
        "event_model": intelligence_twin.event_model,
        "ensemble_model": intelligence_twin.ensemble_model,
    }

    if model_name in models:
        models[model_name].accuracy = accuracy
        models[model_name].predictions_count = predictions_count
        models[model_name].last_updated = datetime.utcnow()

        intelligence_twin.model_updates.append(
            f"{model_name} updated: accuracy={accuracy}% on {datetime.utcnow().strftime('%Y-%m-%d')}"
        )
        intelligence_twin.last_updated = datetime.utcnow()

        return {"message": f"Model {model_name} updated"}

    return {"error": "Model not found"}


@app.post("/twin/learning-event")
async def add_learning_event(event_type: str, description: str):
    """Add a major learning event"""
    event = f"[{event_type.upper()}] {description} - {datetime.utcnow().strftime('%Y-%m-%d')}"

    if event_type == "major":
        intelligence_twin.major_learning_events.append(event)
    elif event_type == "pattern":
        intelligence_twin.pattern_discoveries.append(event)
    elif event_type == "model":
        intelligence_twin.model_updates.append(event)

    intelligence_twin.last_updated = datetime.utcnow()
    return {"message": "Learning event added"}


@app.get("/twin/summary")
async def get_intelligence_summary():
    """Get a summary of the intelligence twin"""
    return {
        "platform": intelligence_twin.platform_id,
        "total_predictions": intelligence_twin.total_predictions,
        "overall_accuracy": f"{intelligence_twin.overall_accuracy:.1f}%",
        "best_model": _get_best_model(intelligence_twin),
        "calibration": "Good" if abs(intelligence_twin.calibration_error) < 5 else "Needs Improvement",
        "learning_events_count": (
            len(intelligence_twin.major_learning_events) +
            len(intelligence_twin.pattern_discoveries) +
            len(intelligence_twin.model_updates)
        ),
        "ip_count": (
            len(intelligence_twin.proprietary_indicators) +
            len(intelligence_twin.proprietary_patterns) +
            len(intelligence_twin.proprietary_relationships)
        )
    }


def _get_best_model(twin: IntelligenceTwin) -> str:
    models = [
        ("Technical", twin.technical_model.accuracy),
        ("Fundamental", twin.fundamental_model.accuracy),
        ("Sentiment", twin.sentiment_model.accuracy),
        ("Macro", twin.macro_model.accuracy),
        ("Event", twin.event_model.accuracy),
        ("Ensemble", twin.ensemble_model.accuracy),
    ]
    return max(models, key=lambda x: x[1])[0]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5006)
