"""
Prediction Memory Service
Stores and tracks all predictions with outcomes
Port: 5033
"""

from fastapi import FastAPI
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

app = FastAPI(title="Prediction Memory Service", version="1.0.0")


class PredictionMemoryService:
    """Stores predictions and tracks their outcomes"""

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.name = "Prediction Memory"
        self.port = 5033
        self.predictions = {}
        self.outcomes = {}

    async def store_prediction(
        self,
        asset_id: str,
        prediction_type: str,
        prediction_data: Dict[str, Any],
        confidence: float,
        time_horizon: str,
        reasoning: List[str] = None
    ) -> Dict[str, Any]:
        """Store a prediction"""
        pred_id = f"pred_{datetime.utcnow().timestamp()}"

        prediction = {
            "prediction_id": pred_id,
            "asset_id": asset_id,
            "type": prediction_type,
            "data": prediction_data,
            "confidence": confidence,
            "time_horizon": time_horizon,
            "reasoning": reasoning or [],
            "created_at": datetime.utcnow().isoformat(),
            "outcome_recorded": False,
        }

        self.predictions[pred_id] = prediction
        return prediction

    async def record_outcome(
        self,
        prediction_id: str,
        outcome: str,
        actual_value: float = None,
        notes: str = None
    ) -> Dict[str, Any]:
        """Record the outcome of a prediction"""
        if prediction_id not in self.predictions:
            raise ValueError(f"Prediction {prediction_id} not found")

        outcome_data = {
            "prediction_id": prediction_id,
            "outcome": outcome,
            "actual_value": actual_value,
            "notes": notes,
            "recorded_at": datetime.utcnow().isoformat(),
        }

        self.outcomes[prediction_id] = outcome_data
        self.predictions[prediction_id]["outcome_recorded"] = True
        self.predictions[prediction_id]["outcome"] = outcome_data

        return outcome_data

    async def get_predictions(
        self,
        asset_id: str,
        with_outcomes: bool = False,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get predictions for an asset"""
        predictions = [
            p for p in self.predictions.values()
            if p["asset_id"] == asset_id
            and (not with_outcomes or p["outcome_recorded"])
        ]
        return sorted(predictions, key=lambda x: x["created_at"], reverse=True)[:limit]

    async def get_accuracy(self, asset_id: str = None) -> Dict[str, Any]:
        """Calculate prediction accuracy"""
        predictions = list(self.predictions.values())

        if asset_id:
            predictions = [p for p in predictions if p["asset_id"] == asset_id]

        completed = [p for p in predictions if p["outcome_recorded"]]
        correct = [p for p in completed if p.get("outcome", {}).get("outcome") == "CORRECT"]

        accuracy = len(correct) / len(completed) if completed else 0

        return {
            "total_predictions": len(predictions),
            "completed_predictions": len(completed),
            "correct_predictions": len(correct),
            "accuracy": round(accuracy * 100, 2) if completed else 0,
            "by_time_horizon": {},
        }


service = PredictionMemoryService()


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "Prediction Memory", "port": 5033}


@app.post("/api/v1/predictions")
async def store_prediction(request: Dict[str, Any]):
    return await service.store_prediction(
        request["asset_id"],
        request["prediction_type"],
        request["prediction_data"],
        request.get("confidence", 0.7),
        request.get("time_horizon", "medium"),
        request.get("reasoning")
    )


@app.post("/api/v1/predictions/{prediction_id}/outcome")
async def record_outcome(prediction_id: str, request: Dict[str, Any]):
    return await service.record_outcome(
        prediction_id,
        request["outcome"],
        request.get("actual_value"),
        request.get("notes")
    )


@app.get("/api/v1/predictions/{asset_id}")
async def get_predictions(asset_id: str, with_outcomes: bool = False, limit: int = 100):
    return await service.get_predictions(asset_id, with_outcomes, limit)


@app.get("/api/v1/accuracy")
async def get_accuracy(asset_id: str = None):
    return await service.get_accuracy(asset_id)
