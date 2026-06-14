"""
Prediction Learning Network
Track predictions → outcomes → learning → improvement
Port: 5165

The KEY 10x feature - every prediction is tracked and learned from.
This engine builds a feedback loop that continuously improves prediction accuracy.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from enum import Enum
import logging
import asyncio
import uuid
from collections import defaultdict
import statistics

logger = logging.getLogger(__name__)

app = FastAPI(title="AssetMind Prediction Learning Network", version="1.0.0", docs_url="/docs")


class PredictionType(str, Enum):
    PRICE_DIRECTION = "price_direction"
    PRICE_TARGET = "price_target"
    SECTOR_ROTATION = "sector_rotation"
    THEME_SHIFT = "theme_shift"
    EVENT_OUTCOME = "event_outcome"
    EARNINGS_RESULT = "earnings_result"
    MACRO_OUTCOME = "macro_outcome"
    CORRELATION = "correlation"


class OutcomeType(str, Enum):
    CORRECT = "correct"
    PARTIAL = "partial"
    INCORRECT = "incorrect"


class PredictionStatus(str, Enum):
    PENDING = "pending"
    RESOLVED = "resolved"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class Prediction(BaseModel):
    """A prediction made by the system"""
    prediction_id: str
    type: PredictionType
    title: str
    description: str

    # Prediction details
    asset: Optional[str] = None  # Asset ticker or "MARKET"
    prediction_value: Any  # What was predicted
    confidence: float = Field(ge=0, le=1)  # Initial confidence

    # Timeframe
    prediction_time: datetime
    resolution_time: Optional[datetime] = None
    horizon_hours: int  # How long until resolution

    # Status
    status: PredictionStatus = PredictionStatus.PENDING

    # Model source
    model_name: Optional[str] = None
    model_version: Optional[str] = None

    # Metadata
    factors: List[str] = Field(default_factory=list)  # What drove this prediction
    tags: List[str] = Field(default_factory=list)

    # Calibration
    calibrated_confidence: Optional[float] = None


class PredictionOutcome(BaseModel):
    """The actual outcome of a prediction"""
    outcome_id: str
    prediction_id: str

    # What actually happened
    actual_value: Any
    predicted_value: Any

    # Outcome classification
    outcome_type: OutcomeType
    accuracy_score: float = Field(ge=0, le=1)  # 0-1 accuracy

    # Timing
    resolution_time: datetime
    resolution_duration_hours: float

    # Analysis
    deviation: float  # How far off
    factors_analyzed: List[str] = Field(default_factory=list)

    # Learning
    lesson_learned: Optional[str] = None


class ModelPerformance(BaseModel):
    """Performance metrics for a model"""
    model_name: str
    model_version: Optional[str] = None

    # Accuracy metrics
    total_predictions: int = 0
    correct: int = 0
    partial: int = 0
    incorrect: int = 0

    accuracy_rate: float = 0
    partial_rate: float = 0

    # Calibration
    avg_predicted_confidence: float = 0
    avg_actual_accuracy: float = 0
    calibration_error: float = 0  # |predicted - actual|

    # Brier score
    brier_score: float = 0

    # Time decay metrics
    recent_accuracy: float = 0  # Last 30 predictions
    accuracy_trend: str = "stable"  # improving, declining, stable

    # By prediction type
    accuracy_by_type: Dict[str, float] = Field(default_factory=dict)

    # By horizon
    accuracy_by_horizon: Dict[int, float] = Field(default_factory=dict)  # horizon_hours -> accuracy


class CalibrationRecord(BaseModel):
    """Confidence calibration record"""
    confidence_bucket: int  # 0-10 (0-10%, 10-20%, etc.)
    predictions_in_bucket: int
    accuracy_in_bucket: float
    calibration_delta: float  # accuracy - bucket_center


class PredictionLearningNetwork:
    """
    The KEY 10x feature - tracks every prediction and learns from outcomes.

    Key capabilities:
    - Track every prediction made
    - Record actual outcomes
    - Calculate prediction accuracy
    - Auto-improve models based on outcomes
    - Build confidence calibration
    - Generate prediction insights
    """

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.name = "Prediction Learning Network"
        self.port = 5165
        self.version = "1.0.0"

        # Core data
        self.predictions: Dict[str, Prediction] = {}
        self.outcomes: Dict[str, PredictionOutcome] = {}
        self.model_performance: Dict[str, ModelPerformance] = {}
        self.calibration_records: List[CalibrationRecord] = []

        # Indexes for fast lookup
        self._prediction_by_asset: Dict[str, List[str]] = defaultdict(list)
        self._prediction_by_type: Dict[PredictionType, List[str]] = defaultdict(list)
        self._pending_predictions: List[str] = []

        # Calibration settings
        self.calibration_buckets = 10  # 0-10%, 10-20%, ..., 90-100%
        self.min_predictions_for_calibration = 10

        # Learning settings
        self.learning_rate = 0.1  # How fast to adjust confidence
        self.recency_weight = 0.3  # Weight of recent predictions in learning

    def _generate_prediction_id(self) -> str:
        """Generate unique prediction ID"""
        return f"pred_{uuid.uuid4().hex[:12]}"

    async def create_prediction(
        self,
        prediction_type: PredictionType,
        title: str,
        description: str,
        prediction_value: Any,
        asset: Optional[str] = None,
        confidence: float = 0.5,
        horizon_hours: int = 24,
        model_name: Optional[str] = None,
        model_version: Optional[str] = None,
        factors: List[str] = None,
        tags: List[str] = None
    ) -> Prediction:
        """Create a new prediction"""
        prediction_id = self._generate_prediction_id()
        prediction_time = datetime.utcnow()

        # Calibrate confidence based on historical accuracy
        calibrated_confidence = await self._calibrate_confidence(
            prediction_type, horizon_hours, confidence
        )

        prediction = Prediction(
            prediction_id=prediction_id,
            type=prediction_type,
            title=title,
            description=description,
            asset=asset,
            prediction_value=prediction_value,
            confidence=confidence,
            calibrated_confidence=calibrated_confidence,
            prediction_time=prediction_time,
            horizon_hours=horizon_hours,
            model_name=model_name,
            model_version=model_version,
            factors=factors or [],
            tags=tags or []
        )

        self.predictions[prediction_id] = prediction
        self._pending_predictions.append(prediction_id)

        # Update indexes
        if asset:
            self._prediction_by_asset[asset].append(prediction_id)
        self._prediction_by_type[prediction.type].append(prediction_id)

        logger.info(f"Created prediction: {prediction_id} - {title}")

        return prediction

    async def _calibrate_confidence(
        self,
        prediction_type: PredictionType,
        horizon_hours: int,
        raw_confidence: float
    ) -> float:
        """Calibrate confidence based on historical performance"""
        model_key = f"{prediction_type.value}_{horizon_hours}"

        if model_key in self.model_performance:
            perf = self.model_performance[model_key]
            # Adjust confidence based on recent accuracy
            if perf.recent_accuracy > 0:
                calibration_factor = 0.5 + (perf.recent_accuracy / 2)
                return min(0.99, raw_confidence * calibration_factor)

        return raw_confidence

    async def resolve_prediction(
        self,
        prediction_id: str,
        actual_value: Any,
        lesson_learned: Optional[str] = None
    ) -> PredictionOutcome:
        """Resolve a prediction with the actual outcome"""
        if prediction_id not in self.predictions:
            raise HTTPException(status_code=404, detail="Prediction not found")

        prediction = self.predictions[prediction_id]

        if prediction.status != PredictionStatus.PENDING:
            raise HTTPException(status_code=400, detail="Prediction already resolved")

        resolution_time = datetime.utcnow()

        # Calculate accuracy
        accuracy_score, outcome_type, deviation = self._calculate_accuracy(
            prediction.prediction_value,
            actual_value,
            prediction.type
        )

        # Create outcome record
        outcome_id = f"outcome_{uuid.uuid4().hex[:12]}"
        resolution_duration = (resolution_time - prediction.prediction_time).total_seconds() / 3600

        outcome = PredictionOutcome(
            outcome_id=outcome_id,
            prediction_id=prediction_id,
            actual_value=actual_value,
            predicted_value=prediction.prediction_value,
            outcome_type=outcome_type,
            accuracy_score=accuracy_score,
            resolution_time=resolution_time,
            resolution_duration_hours=resolution_duration,
            deviation=deviation,
            lesson_learned=lesson_learned
        )

        # Update prediction status
        prediction.status = PredictionStatus.RESOLVED
        prediction.resolution_time = resolution_time

        # Store outcome
        self.outcomes[outcome_id] = outcome
        self._pending_predictions.remove(prediction_id)

        # Update model performance
        await self._update_model_performance(prediction, outcome)

        # Update calibration
        await self._update_calibration(prediction.confidence, accuracy_score)

        logger.info(f"Resolved prediction: {prediction_id} - {outcome_type.value} ({accuracy_score:.2%})")

        return outcome

    def _calculate_accuracy(
        self,
        predicted: Any,
        actual: Any,
        prediction_type: PredictionType
    ) -> Tuple[float, OutcomeType, float]:
        """Calculate accuracy of a prediction"""
        try:
            if prediction_type == PredictionType.PRICE_DIRECTION:
                # Binary: up/down
                pred_direction = 1 if predicted > 0 else -1 if predicted < 0 else 0
                act_direction = 1 if actual > 0 else -1 if actual < 0 else 0

                if pred_direction == act_direction:
                    return 1.0, OutcomeType.CORRECT, 0.0
                else:
                    return 0.0, OutcomeType.INCORRECT, 1.0

            elif prediction_type == PredictionType.PRICE_TARGET:
                # How close to target
                if actual == 0:
                    return 0.0, OutcomeType.INCORRECT, 1.0

                deviation = abs(predicted - actual) / abs(actual)

                if deviation < 0.01:  # Within 1%
                    return 1.0, OutcomeType.CORRECT, deviation
                elif deviation < 0.05:  # Within 5%
                    return 0.75, OutcomeType.PARTIAL, deviation
                elif deviation < 0.10:  # Within 10%
                    return 0.5, OutcomeType.PARTIAL, deviation
                else:
                    return 0.0, OutcomeType.INCORRECT, deviation

            elif prediction_type == PredictionType.SECTOR_ROTATION:
                # Exact match
                if predicted == actual:
                    return 1.0, OutcomeType.CORRECT, 0.0
                elif predicted in actual or actual in predicted:
                    return 0.5, OutcomeType.PARTIAL, 0.5
                else:
                    return 0.0, OutcomeType.INCORRECT, 1.0

            else:
                # Generic comparison
                if predicted == actual:
                    return 1.0, OutcomeType.CORRECT, 0.0
                else:
                    # Try numeric comparison
                    try:
                        dev = abs(float(predicted) - float(actual)) / max(abs(float(actual)), 0.001)
                        if dev < 0.05:
                            return 0.8, OutcomeType.PARTIAL, dev
                    except:
                        pass
                    return 0.0, OutcomeType.INCORRECT, 1.0

        except Exception as e:
            logger.error(f"Error calculating accuracy: {e}")
            return 0.0, OutcomeType.INCORRECT, 1.0

    async def _update_model_performance(
        self,
        prediction: Prediction,
        outcome: PredictionOutcome
    ):
        """Update model performance metrics"""
        model_key = prediction.model_name or f"default_{prediction.type.value}"
        horizon_key = prediction.horizon_hours

        if model_key not in self.model_performance:
            self.model_performance[model_key] = ModelPerformance(
                model_name=model_key
            )

        perf = self.model_performance[model_key]
        perf.total_predictions += 1

        # Update counts
        if outcome.outcome_type == OutcomeType.CORRECT:
            perf.correct += 1
        elif outcome.outcome_type == OutcomeType.PARTIAL:
            perf.partial += 1
        else:
            perf.incorrect += 1

        # Calculate rates
        total = perf.total_predictions
        perf.accuracy_rate = perf.correct / total
        perf.partial_rate = perf.partial / total

        # Brier score (for probabilistic predictions)
        brier = (1 - outcome.accuracy_score) ** 2
        perf.brier_score = (perf.brier_score * (total - 1) + brier) / total

        # Recent accuracy (last 30)
        await self._calculate_recent_accuracy(perf, model_key)

        # Accuracy by type
        type_key = prediction.type.value
        if type_key not in perf.accuracy_by_type:
            perf.accuracy_by_type[type_key] = 0.0

        current_total = perf.accuracy_by_type.get(f"{type_key}_count", 0)
        perf.accuracy_by_type[type_key] = (
            (perf.accuracy_by_type[type_key] * current_total + outcome.accuracy_score)
            / (current_total + 1)
        )
        perf.accuracy_by_type[f"{type_key}_count"] = current_total + 1

        # Accuracy by horizon
        if horizon_key not in perf.accuracy_by_horizon:
            perf.accuracy_by_horizon[horizon_key] = 0.0

        horiz_total = perf.accuracy_by_horizon.get(f"{horizon_key}_count", 0)
        perf.accuracy_by_horizon[horizon_key] = (
            (perf.accuracy_by_horizon[horizon_key] * horiz_total + outcome.accuracy_score)
            / (horiz_total + 1)
        )
        perf.accuracy_by_horizon[f"{horizon_key}_count"] = horiz_total + 1

        # Calculate trend
        self._calculate_trend(perf)

    async def _calculate_recent_accuracy(self, perf: ModelPerformance, model_key: str):
        """Calculate recent accuracy from last 30 predictions"""
        recent_outcomes = []

        for pred_id, pred in self.predictions.items():
            if pred.model_name == model_key and pred.status == PredictionStatus.RESOLVED:
                # Find corresponding outcome
                for outcome in self.outcomes.values():
                    if outcome.prediction_id == pred_id:
                        recent_outcomes.append((pred.resolution_time, outcome.accuracy_score))
                        break

        # Sort by time and take last 30
        recent_outcomes.sort(key=lambda x: x[0], reverse=True)
        recent_outcomes = recent_outcomes[:30]

        if recent_outcomes:
            perf.recent_accuracy = sum(o[1] for o in recent_outcomes) / len(recent_outcomes)

    def _calculate_trend(self, perf: ModelPerformance):
        """Calculate accuracy trend"""
        if perf.total_predictions < 20:
            perf.accuracy_trend = "insufficient_data"
            return

        # Compare recent vs overall
        if perf.recent_accuracy > perf.accuracy_rate + 0.05:
            perf.accuracy_trend = "improving"
        elif perf.recent_accuracy < perf.accuracy_rate - 0.05:
            perf.accuracy_trend = "declining"
        else:
            perf.accuracy_trend = "stable"

    async def _update_calibration(self, confidence: float, accuracy: float):
        """Update confidence calibration"""
        bucket = int(confidence * self.calibration_buckets)
        bucket = min(bucket, self.calibration_buckets - 1)

        # Find or create calibration record
        record = None
        for r in self.calibration_records:
            if r.confidence_bucket == bucket:
                record = r
                break

        if record is None:
            record = CalibrationRecord(
                confidence_bucket=bucket,
                predictions_in_bucket=0,
                accuracy_in_bucket=0,
                calibration_delta=0
            )
            self.calibration_records.append(record)

        # Update running average
        n = record.predictions_in_bucket
        record.accuracy_in_bucket = (record.accuracy_in_bucket * n + accuracy) / (n + 1)
        record.predictions_in_bucket += 1

        # Update delta
        bucket_center = (bucket + 0.5) / self.calibration_buckets
        record.calibration_delta = record.accuracy_in_bucket - bucket_center

    async def get_calibration_report(self) -> Dict[str, Any]:
        """Get calibration report"""
        # Sort records by bucket
        sorted_records = sorted(self.calibration_records, key=lambda x: x.confidence_bucket)

        # Calculate overall calibration error
        total_error = sum(abs(r.calibration_delta) for r in sorted_records if r.predictions_in_bucket > 0)
        avg_error = total_error / len([r for r in sorted_records if r.predictions_in_bucket > 0]) if sorted_records else 0

        return {
            "calibration_error": avg_error,
            "is_well_calibrated": avg_error < 0.1,
            "buckets": [
                {
                    "bucket": r.confidence_bucket,
                    "center": (r.confidence_bucket + 0.5) / self.calibration_buckets,
                    "predictions": r.predictions_in_bucket,
                    "actual_accuracy": r.accuracy_in_bucket,
                    "delta": r.calibration_delta,
                    "status": "overconfident" if r.calibration_delta < -0.1 else
                              "underconfident" if r.calibration_delta > 0.1 else "calibrated"
                }
                for r in sorted_records
            ]
        }

    async def get_prediction_accuracy(
        self,
        prediction_type: Optional[PredictionType] = None,
        model_name: Optional[str] = None,
        asset: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get prediction accuracy statistics"""
        matching_predictions = []

        for pred_id, pred in self.predictions.items():
            if pred.status != PredictionStatus.RESOLVED:
                continue

            if prediction_type and pred.type != prediction_type:
                continue

            if model_name and pred.model_name != model_name:
                continue

            if asset and pred.asset != asset:
                continue

            matching_predictions.append(pred_id)

        if not matching_predictions:
            return {"total": 0, "accuracy": 0}

        actual_outcomes = []
        for pred_id in matching_predictions:
            for outcome in self.outcomes.values():
                if outcome.prediction_id == pred_id:
                    actual_outcomes.append(outcome)
                    break

        if not actual_outcomes:
            return {"total": 0, "accuracy": 0}

        accuracy = sum(o.accuracy_score for o in actual_outcomes) / len(actual_outcomes)
        correct = len([o for o in actual_outcomes if o.outcome_type == OutcomeType.CORRECT])
        partial = len([o for o in actual_outcomes if o.outcome_type == OutcomeType.PARTIAL])

        return {
            "total": len(actual_outcomes),
            "correct": correct,
            "partial": partial,
            "incorrect": len(actual_outcomes) - correct - partial,
            "accuracy": accuracy,
            "accuracy_rate": correct / len(actual_outcomes)
        }

    async def get_learning_insights(self) -> List[Dict[str, Any]]:
        """Get insights learned from prediction outcomes"""
        insights = []

        # Find factors that correlate with accuracy
        factor_accuracy: Dict[str, List[float]] = defaultdict(list)

        for outcome in self.outcomes.values():
            pred = self.predictions.get(outcome.prediction_id)
            if pred:
                for factor in pred.factors:
                    factor_accuracy[factor].append(outcome.accuracy_score)

        for factor, accuracies in factor_accuracy.items():
            if len(accuracies) >= 5:
                avg_acc = sum(accuracies) / len(accuracies)
                insights.append({
                    "type": "factor",
                    "factor": factor,
                    "accuracy_when_used": avg_acc,
                    "sample_size": len(accuracies),
                    "recommendation": f"Use {factor}" if avg_acc > 0.6 else f"Reconsider {factor}"
                })

        # Best prediction horizons
        horizon_accuracy: Dict[int, List[float]] = defaultdict(list)
        for outcome in self.outcomes.values():
            pred = self.predictions.get(outcome.prediction_id)
            if pred:
                horizon_accuracy[pred.horizon_hours].append(outcome.accuracy_score)

        best_horizon = max(horizon_accuracy.items(), key=lambda x: sum(x[1])/len(x[1]) if x[1] else 0)
        if best_horizon[1]:
            insights.append({
                "type": "horizon",
                "best_horizon_hours": best_horizon[0],
                "accuracy_at_horizon": sum(best_horizon[1]) / len(best_horizon[1]),
                "recommendation": f"Prefer {best_horizon[0]}h horizon predictions"
            })

        # Model comparison
        for model_name, perf in self.model_performance.items():
            if perf.total_predictions >= 10:
                insights.append({
                    "type": "model",
                    "model": model_name,
                    "accuracy": perf.accuracy_rate,
                    "trend": perf.accuracy_trend,
                    "recommendation": f"Model performing {'well' if perf.accuracy_rate > 0.6 else 'needs tuning'}"
                })

        return sorted(insights, key=lambda x: x.get("accuracy", x.get("accuracy_when_used", 0)), reverse=True)

    async def get_pending_predictions(self) -> List[Prediction]:
        """Get all pending predictions"""
        return [self.predictions[pid] for pid in self._pending_predictions]

    async def cancel_prediction(self, prediction_id: str, reason: str):
        """Cancel a pending prediction"""
        if prediction_id not in self.predictions:
            raise HTTPException(status_code=404, detail="Prediction not found")

        pred = self.predictions[prediction_id]
        if pred.status != PredictionStatus.PENDING:
            raise HTTPException(status_code=400, detail="Prediction already resolved")

        pred.status = PredictionStatus.CANCELLED
        self._pending_predictions.remove(prediction_id)

        return {"status": "cancelled", "reason": reason}

    async def expire_predictions(self):
        """Expire predictions that have passed their horizon"""
        now = datetime.utcnow()
        expired = []

        for pred_id in list(self._pending_predictions):
            pred = self.predictions[pred_id]
            expiry_time = pred.prediction_time + timedelta(hours=pred.horizon_hours)

            if now > expiry_time:
                pred.status = PredictionStatus.EXPIRED
                self._pending_predictions.remove(pred_id)
                expired.append(pred_id)

        return expired


# Initialize service
service = PredictionLearningNetwork()


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": service.name,
        "port": service.port,
        "version": service.version,
        "total_predictions": len(service.predictions),
        "pending_predictions": len(service._pending_predictions),
        "resolved_predictions": sum(1 for p in service.predictions.values() if p.status == PredictionStatus.RESOLVED)
    }


@app.post("/api/v1/predictions")
async def create_prediction(
    prediction_type: PredictionType,
    title: str,
    description: str,
    prediction_value: Any,
    asset: Optional[str] = None,
    confidence: float = 0.5,
    horizon_hours: int = 24,
    model_name: Optional[str] = None,
    factors: Optional[List[str]] = None,
    tags: Optional[List[str]] = None
):
    """Create a new prediction"""
    return await service.create_prediction(
        prediction_type=prediction_type,
        title=title,
        description=description,
        prediction_value=prediction_value,
        asset=asset,
        confidence=confidence,
        horizon_hours=horizon_hours,
        model_name=model_name,
        factors=factors,
        tags=tags
    )


@app.get("/api/v1/predictions/{prediction_id}")
async def get_prediction(prediction_id: str):
    """Get prediction details"""
    if prediction_id not in service.predictions:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return service.predictions[prediction_id]


@app.get("/api/v1/predictions/pending")
async def get_pending_predictions():
    """Get all pending predictions"""
    return await service.get_pending_predictions()


@app.post("/api/v1/predictions/{prediction_id}/resolve")
async def resolve_prediction(
    prediction_id: str,
    actual_value: Any,
    lesson_learned: Optional[str] = None
):
    """Resolve a prediction with actual outcome"""
    return await service.resolve_prediction(prediction_id, actual_value, lesson_learned)


@app.post("/api/v1/predictions/{prediction_id}/cancel")
async def cancel_prediction(prediction_id: str, reason: str):
    """Cancel a pending prediction"""
    return await service.cancel_prediction(prediction_id, reason)


@app.post("/api/v1/predictions/expire")
async def expire_predictions():
    """Expire predictions past their horizon"""
    expired = await service.expire_predictions()
    return {"expired_count": len(expired), "expired_ids": expired}


@app.get("/api/v1/accuracy")
async def get_accuracy(
    prediction_type: Optional[PredictionType] = None,
    model_name: Optional[str] = None,
    asset: Optional[str] = None
):
    """Get prediction accuracy statistics"""
    return await service.get_prediction_accuracy(prediction_type, model_name, asset)


@app.get("/api/v1/models/performance")
async def get_model_performance():
    """Get performance for all models"""
    return list(service.model_performance.values())


@app.get("/api/v1/calibration")
async def get_calibration_report():
    """Get confidence calibration report"""
    return await service.get_calibration_report()


@app.get("/api/v1/insights")
async def get_learning_insights():
    """Get insights learned from predictions"""
    return await service.get_learning_insights()


@app.get("/api/v1/outcomes/{outcome_id}")
async def get_outcome(outcome_id: str):
    """Get outcome details"""
    if outcome_id not in service.outcomes:
        raise HTTPException(status_code=404, detail="Outcome not found")
    return service.outcomes[outcome_id]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5165)