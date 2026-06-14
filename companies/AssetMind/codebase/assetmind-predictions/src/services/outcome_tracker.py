"""
Outcome Tracker Service
Track and analyze prediction outcomes
Port: 5164
"""

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from enum import Enum
import logging
import random
from collections import defaultdict

logger = logging.getLogger(__name__)

app = FastAPI(title="AssetMind Outcome Tracker", version="1.0.0", docs_url="/docs")


class OutcomeStatus(str, Enum):
    PENDING = "pending"
    CORRECT = "correct"
    INCORRECT = "incorrect"
    PARTIAL = "partial"
    EXPIRED = "expired"


class OutcomeRecord(BaseModel):
    outcome_id: str
    prediction_id: str
    asset_symbol: str
    prediction_type: str
    predicted_value: float
    actual_value: float
    predicted_direction: str  # UP, DOWN, STABLE
    actual_direction: str
    predicted_time: datetime
    actual_time: datetime
    status: OutcomeStatus
    error_percent: float
    error_absolute: float
    accuracy_score: float  # 0-1
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class PerformanceMetrics(BaseModel):
    period: str
    total_predictions: int
    correct_predictions: int
    accuracy: float  # Overall accuracy percentage
    mean_error: float
    mean_absolute_error: float
    root_mean_square_error: float
    directional_accuracy: float
    magnitude_accuracy: float
    by_prediction_type: Dict[str, Dict[str, Any]]
    by_symbol: Dict[str, Dict[str, Any]]
    by_time_horizon: Dict[str, Dict[str, Any]]
    calculated_at: datetime


class OutcomeTracker:
    """Track and analyze prediction outcomes"""

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.name = "Outcome Tracker"
        self.port = 5164
        self.version = "1.0.0"
        self._outcomes: Dict[str, OutcomeRecord] = {}
        self._predictions_pending: Dict[str, Dict[str, Any]] = {}
        self._outcome_count = 0
        self._initialize_mock_outcomes()

    def _initialize_mock_outcomes(self):
        """Initialize with some mock outcomes for testing"""
        symbols = ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN", "NVDA", "META"]
        prediction_types = ["price", "trend", "volatility", "returns"]
        directions = ["UP", "DOWN", "STABLE"]

        for i in range(20):
            symbol = random.choice(symbols)
            pred_type = random.choice(prediction_types)
            predicted_value = random.uniform(100, 500)
            actual_value = predicted_value * random.uniform(0.9, 1.1)
            predicted_direction = random.choice(directions)

            # Determine actual direction
            if actual_value > predicted_value * 1.01:
                actual_direction = "UP"
            elif actual_value < predicted_value * 0.99:
                actual_direction = "DOWN"
            else:
                actual_direction = "STABLE"

            # Determine status
            if predicted_direction == actual_direction:
                status = OutcomeStatus.CORRECT
            elif predicted_direction == "STABLE":
                status = OutcomeStatus.PARTIAL
            else:
                status = OutcomeStatus.INCORRECT

            error_pct = abs(actual_value - predicted_value) / predicted_value * 100

            outcome = OutcomeRecord(
                outcome_id=f"outcome_{i}",
                prediction_id=f"pred_{i}",
                asset_symbol=symbol,
                prediction_type=pred_type,
                predicted_value=round(predicted_value, 2),
                actual_value=round(actual_value, 2),
                predicted_direction=predicted_direction,
                actual_direction=actual_direction,
                predicted_time=datetime.utcnow() - timedelta(days=random.randint(1, 30)),
                actual_time=datetime.utcnow() - timedelta(days=random.randint(0, 5)),
                status=status,
                error_percent=round(error_pct, 2),
                error_absolute=round(abs(actual_value - predicted_value), 2),
                accuracy_score=round(random.uniform(0.5, 1.0), 3),
                created_at=datetime.utcnow() - timedelta(days=30),
                updated_at=datetime.utcnow()
            )

            self._outcomes[f"outcome_{i}"] = outcome
            self._outcome_count += 1

    def _generate_outcome_id(self) -> str:
        """Generate unique outcome ID"""
        self._outcome_count += 1
        return f"outcome_{datetime.utcnow().timestamp()}_{self._outcome_count}"

    async def record_prediction(
        self,
        prediction_id: str,
        asset_symbol: str,
        prediction_type: str,
        predicted_value: float,
        predicted_direction: str,
        valid_until: datetime
    ) -> Dict[str, Any]:
        """Record a prediction for tracking"""
        record = {
            "prediction_id": prediction_id,
            "asset_symbol": asset_symbol,
            "prediction_type": prediction_type,
            "predicted_value": predicted_value,
            "predicted_direction": predicted_direction,
            "valid_until": valid_until,
            "recorded_at": datetime.utcnow()
        }

        self._predictions_pending[prediction_id] = record
        logger.info(f"Recorded prediction for tracking: {prediction_id}")

        return {
            "prediction_id": prediction_id,
            "status": "recorded",
            "valid_until": valid_until.isoformat()
        }

    async def record_outcome(
        self,
        prediction_id: str,
        actual_value: float,
        actual_time: Optional[datetime] = None,
        notes: Optional[str] = None
    ) -> OutcomeRecord:
        """Record the outcome of a prediction"""
        if prediction_id not in self._predictions_pending:
            raise ValueError(f"Prediction {prediction_id} not found")

        pred = self._predictions_pending[prediction_id]

        # Determine actual direction
        if actual_value > pred["predicted_value"] * 1.01:
            actual_direction = "UP"
        elif actual_value < pred["predicted_value"] * 0.99:
            actual_direction = "DOWN"
        else:
            actual_direction = "STABLE"

        # Determine status
        if pred["predicted_direction"] == actual_direction:
            status = OutcomeStatus.CORRECT
        elif pred["predicted_direction"] == "STABLE":
            status = OutcomeStatus.PARTIAL
        else:
            status = OutcomeStatus.INCORRECT

        error_absolute = abs(actual_value - pred["predicted_value"])
        error_percent = (error_absolute / pred["predicted_value"]) * 100 if pred["predicted_value"] > 0 else 0

        # Calculate accuracy score (0-1)
        if error_percent <= 1:
            accuracy_score = 1.0
        elif error_percent <= 5:
            accuracy_score = 0.8
        elif error_percent <= 10:
            accuracy_score = 0.6
        elif error_percent <= 20:
            accuracy_score = 0.4
        else:
            accuracy_score = 0.2

        outcome = OutcomeRecord(
            outcome_id=self._generate_outcome_id(),
            prediction_id=prediction_id,
            asset_symbol=pred["asset_symbol"],
            prediction_type=pred["prediction_type"],
            predicted_value=pred["predicted_value"],
            actual_value=round(actual_value, 2),
            predicted_direction=pred["predicted_direction"],
            actual_direction=actual_direction,
            predicted_time=pred["recorded_at"],
            actual_time=actual_time or datetime.utcnow(),
            status=status,
            error_percent=round(error_percent, 2),
            error_absolute=round(error_absolute, 2),
            accuracy_score=accuracy_score,
            notes=notes,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        self._outcomes[outcome.outcome_id] = outcome
        del self._predictions_pending[prediction_id]

        logger.info(f"Recorded outcome for prediction {prediction_id}: {status.value}")
        return outcome

    async def get_outcome(self, outcome_id: str) -> Optional[OutcomeRecord]:
        """Get outcome by ID"""
        return self._outcomes.get(outcome_id)

    async def get_outcomes_by_symbol(
        self,
        symbol: str,
        limit: int = 50
    ) -> List[OutcomeRecord]:
        """Get outcomes for a specific symbol"""
        outcomes = [
            o for o in self._outcomes.values()
            if o.asset_symbol == symbol.upper()
        ]
        return sorted(outcomes, key=lambda x: x.actual_time, reverse=True)[:limit]

    async def get_outcomes_by_prediction_type(
        self,
        prediction_type: str,
        limit: int = 50
    ) -> List[OutcomeRecord]:
        """Get outcomes by prediction type"""
        outcomes = [
            o for o in self._outcomes.values()
            if o.prediction_type == prediction_type
        ]
        return sorted(outcomes, key=lambda x: x.actual_time, reverse=True)[:limit]

    async def get_pending_predictions(
        self,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get predictions pending outcome"""
        pending = list(self._predictions_pending.values())
        return sorted(pending, key=lambda x: x["valid_until"])[:limit]

    async def get_performance_metrics(
        self,
        period: str = "30d"
    ) -> PerformanceMetrics:
        """Calculate performance metrics"""
        # Filter by period
        now = datetime.utcnow()
        if period == "7d":
            start_date = now - timedelta(days=7)
        elif period == "30d":
            start_date = now - timedelta(days=30)
        elif period == "90d":
            start_date = now - timedelta(days=90)
        else:  # all
            start_date = datetime.min

        outcomes = [
            o for o in self._outcomes.values()
            if o.actual_time >= start_date
        ]

        if not outcomes:
            return PerformanceMetrics(
                period=period,
                total_predictions=0,
                correct_predictions=0,
                accuracy=0,
                mean_error=0,
                mean_absolute_error=0,
                root_mean_square_error=0,
                directional_accuracy=0,
                magnitude_accuracy=0,
                by_prediction_type={},
                by_symbol={},
                by_time_horizon={},
                calculated_at=datetime.utcnow()
            )

        # Calculate overall metrics
        total = len(outcomes)
        correct = sum(1 for o in outcomes if o.status == OutcomeStatus.CORRECT)
        accuracy = (correct / total) * 100 if total > 0 else 0

        errors = [o.error_percent for o in outcomes]
        mean_error = sum(errors) / len(errors)
        mean_absolute_error = sum(abs(e) for e in errors) / len(errors)
        rmse = math.sqrt(sum(e ** 2 for e in errors) / len(errors))

        # Directional accuracy
        directional_correct = sum(
            1 for o in outcomes
            if o.predicted_direction == o.actual_direction
        )
        directional_accuracy = (directional_correct / total) * 100 if total > 0 else 0

        # Magnitude accuracy (predictions within 5%)
        magnitude_correct = sum(1 for o in outcomes if o.error_percent <= 5)
        magnitude_accuracy = (magnitude_correct / total) * 100 if total > 0 else 0

        # By prediction type
        by_type = defaultdict(list)
        for o in outcomes:
            by_type[o.prediction_type].append(o)

        by_prediction_type = {}
        for ptype, type_outcomes in by_type.items():
            t_total = len(type_outcomes)
            t_correct = sum(1 for o in type_outcomes if o.status == OutcomeStatus.CORRECT)
            by_prediction_type[ptype] = {
                "total": t_total,
                "correct": t_correct,
                "accuracy": round((t_correct / t_total) * 100, 2) if t_total > 0 else 0
            }

        # By symbol
        by_symbol_dict = defaultdict(list)
        for o in outcomes:
            by_symbol_dict[o.asset_symbol].append(o)

        by_symbol = {}
        for symbol, symbol_outcomes in by_symbol_dict.items():
            s_total = len(symbol_outcomes)
            s_correct = sum(1 for o in symbol_outcomes if o.status == OutcomeStatus.CORRECT)
            by_symbol[symbol] = {
                "total": s_total,
                "correct": s_correct,
                "accuracy": round((s_correct / s_total) * 100, 2) if s_total > 0 else 0,
                "avg_error": round(sum(o.error_percent for o in symbol_outcomes) / s_total, 2) if s_total > 0 else 0
            }

        return PerformanceMetrics(
            period=period,
            total_predictions=total,
            correct_predictions=correct,
            accuracy=round(accuracy, 2),
            mean_error=round(mean_error, 2),
            mean_absolute_error=round(mean_absolute_error, 2),
            root_mean_square_error=round(rmse, 2),
            directional_accuracy=round(directional_accuracy, 2),
            magnitude_accuracy=round(magnitude_accuracy, 2),
            by_prediction_type=by_prediction_type,
            by_symbol=by_symbol,
            by_time_horizon={},  # Could add if needed
            calculated_at=datetime.utcnow()
        )

    async def get_leaderboard(
        self,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get top performing prediction types/symbols"""
        metrics = await self.get_performance_metrics("30d")

        # Sort symbols by accuracy
        symbol_rankings = sorted(
            metrics.by_symbol.items(),
            key=lambda x: x[1]["accuracy"],
            reverse=True
        )[:limit]

        return [
            {
                "rank": i + 1,
                "symbol": symbol,
                "accuracy": data["accuracy"],
                "total_predictions": data["total"],
                "avg_error": data["avg_error"]
            }
            for i, (symbol, data) in enumerate(symbol_rankings)
        ]

    async def get_recent_outcomes(
        self,
        limit: int = 20,
        status: Optional[OutcomeStatus] = None
    ) -> List[Dict[str, Any]]:
        """Get recent outcomes"""
        outcomes = list(self._outcomes.values())

        if status:
            outcomes = [o for o in outcomes if o.status == status]

        outcomes = sorted(outcomes, key=lambda x: x.actual_time, reverse=True)[:limit]

        return [
            {
                "outcome_id": o.outcome_id,
                "prediction_id": o.prediction_id,
                "asset_symbol": o.asset_symbol,
                "prediction_type": o.prediction_type,
                "predicted_value": o.predicted_value,
                "actual_value": o.actual_value,
                "predicted_direction": o.predicted_direction,
                "actual_direction": o.actual_direction,
                "status": o.status.value,
                "error_percent": o.error_percent,
                "accuracy_score": o.accuracy_score,
                "actual_time": o.actual_time.isoformat()
            }
            for o in outcomes
        ]


import math

service = OutcomeTracker()


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": service.name,
        "port": service.port,
        "version": service.version,
        "total_outcomes": len(service._outcomes),
        "pending_predictions": len(service._predictions_pending)
    }


@app.post("/api/v1/outcomes/record-prediction")
async def record_prediction(request: Dict[str, Any]):
    """Record a prediction for tracking"""
    return await service.record_prediction(
        prediction_id=request["prediction_id"],
        asset_symbol=request["asset_symbol"],
        prediction_type=request["prediction_type"],
        predicted_value=request["predicted_value"],
        predicted_direction=request["predicted_direction"],
        valid_until=datetime.fromisoformat(request["valid_until"])
    )


@app.post("/api/v1/outcomes")
async def record_outcome(request: Dict[str, Any]):
    """Record the outcome of a prediction"""
    try:
        actual_time = None
        if "actual_time" in request:
            actual_time = datetime.fromisoformat(request["actual_time"])

        outcome = await service.record_outcome(
            prediction_id=request["prediction_id"],
            actual_value=request["actual_value"],
            actual_time=actual_time,
            notes=request.get("notes")
        )

        return {
            "outcome_id": outcome.outcome_id,
            "status": outcome.status.value,
            "accuracy_score": outcome.accuracy_score,
            "error_percent": outcome.error_percent
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/api/v1/outcomes/{outcome_id}")
async def get_outcome(outcome_id: str):
    """Get outcome by ID"""
    outcome = await service.get_outcome(outcome_id)
    if not outcome:
        raise HTTPException(status_code=404, detail="Outcome not found")
    return outcome


@app.get("/api/v1/outcomes/symbol/{symbol}")
async def get_outcomes_by_symbol(symbol: str, limit: int = Query(50, le=100)):
    """Get outcomes for a specific symbol"""
    return await service.get_outcomes_by_symbol(symbol, limit)


@app.get("/api/v1/outcomes/type/{prediction_type}")
async def get_outcomes_by_type(prediction_type: str, limit: int = Query(50, le=100)):
    """Get outcomes by prediction type"""
    return await service.get_outcomes_by_prediction_type(prediction_type, limit)


@app.get("/api/v1/outcomes/pending")
async def get_pending_predictions(limit: int = Query(50, le=100)):
    """Get predictions pending outcome"""
    return await service.get_pending_predictions(limit)


@app.get("/api/v1/metrics/performance")
async def get_performance_metrics(period: str = Query("30d")):
    """Get performance metrics"""
    return await service.get_performance_metrics(period)


@app.get("/api/v1/metrics/leaderboard")
async def get_leaderboard(limit: int = Query(10, le=50)):
    """Get top performing prediction types/symbols"""
    return await service.get_leaderboard(limit)


@app.get("/api/v1/outcomes/recent")
async def get_recent_outcomes(
    limit: int = Query(20, le=100),
    status: OutcomeStatus = Query(None)
):
    """Get recent outcomes"""
    return await service.get_recent_outcomes(limit, status)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5164)