"""
Confidence Calibration Engine
Track predicted confidence vs actual accuracy
Port: 5166

This engine:
- Tracks predicted confidence vs actual accuracy
- Detects overconfidence/underconfidence
- Auto-calibrates predictions
- Generates calibration reports
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from enum import Enum
import logging
import uuid
from collections import defaultdict
import statistics

logger = logging.getLogger(__name__)

app = FastAPI(title="AssetMind Confidence Calibration Engine", version="1.0.0", docs_url="/docs")


class CalibrationStatus(str, Enum):
    WELL_CALIBRATED = "well_calibrated"
    OVERCONFIDENT = "overconfident"
    UNDERCONFIDENT = "underconfident"
    INSUFFICIENT_DATA = "insufficient_data"


class PredictionRecord(BaseModel):
    """A prediction with confidence and outcome"""
    record_id: str
    prediction_id: str
    predicted_confidence: float  # 0-1
    actual_outcome: float  # 0-1 accuracy
    prediction_type: str
    horizon_hours: int
    asset: Optional[str] = None
    timestamp: datetime


class CalibrationBucket(BaseModel):
    """Calibration bucket (e.g., 60-70% confidence)"""
    bucket_id: int  # 0-9 for 0-10%, 10-20%, etc.
    bucket_label: str  # "60-70%"
    center_confidence: float  # 0.65
    predictions_in_bucket: int
    avg_predicted_confidence: float
    avg_actual_accuracy: float
    calibration_error: float  # actual - predicted
    standard_deviation: float
    count_correct: int
    count_incorrect: int
    count_partial: int


class CalibrationReport(BaseModel):
    """Complete calibration report"""
    report_id: str
    generated_at: datetime

    # Overall metrics
    total_predictions: int
    overall_calibration_error: float
    overall_expected_calibration_error: float  # ECE
    calibration_status: CalibrationStatus

    # Buckets
    buckets: List[CalibrationBucket]

    # Confidence distribution
    confidence_histogram: Dict[str, int]  # "0-10%", "10-20%", etc.

    # Trends
    recent_calibration_trend: str # improving, declining, stable
    accuracy_vs_confidence_correlation: float

    # Recommendations
    recommendations: List[str]


class ConfidenceCalibrationEngine:
    """
    Confidence calibration engine.

    Key capabilities:
    - Track predicted confidence vs actual accuracy
    - Detect overconfidence/underconfidence
    - Auto-calibrate predictions
    - Generate calibration reports
    - Recommend confidence adjustments
    """

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.name = "Confidence Calibration"
        self.port = 5166
        self.version = "1.0.0"

        # Prediction records
        self.predictions: List[PredictionRecord] = []

        # Calibration settings
        self.num_buckets = 10  # 0-10%, 10-20%, ..., 90-100%
        self.min_predictions_for_report = 20
        self.recent_window = 100  # Last N predictions for trend

        # Calibration thresholds
        self.calibration_threshold = 0.1  # 10% error threshold
        self.overconfidence_threshold = -0.1  # Negative error = overconfident
        self.underconfidence_threshold = 0.1  # Positive error = underconfident

    def _get_bucket_id(self, confidence: float) -> int:
        """Get bucket ID for a confidence value"""
        bucket = int(confidence * self.num_buckets)
        return min(bucket, self.num_buckets - 1)

    def _get_bucket_label(self, bucket_id: int) -> str:
        """Get label for a bucket"""
        lower = bucket_id * 10
        upper = (bucket_id + 1) * 10
        return f"{lower}-{upper}%"

    def _get_bucket_center(self, bucket_id: int) -> float:
        """Get center confidence for a bucket"""
        return (bucket_id + 0.5) / self.num_buckets

    async def record_prediction(
        self,
        prediction_id: str,
        predicted_confidence: float,
        actual_outcome: float,
        prediction_type: str,
        horizon_hours: int,
        asset: Optional[str] = None
    ) -> PredictionRecord:
        """Record a prediction with its outcome"""
        record = PredictionRecord(
            record_id=f"rec_{uuid.uuid4().hex[:12]}",
            prediction_id=prediction_id,
            predicted_confidence=predicted_confidence,
            actual_outcome=actual_outcome,
            prediction_type=prediction_type,
            horizon_hours=horizon_hours,
            asset=asset,
            timestamp=datetime.utcnow()
        )

        self.predictions.append(record)

        # Keep only last 10000 predictions
        if len(self.predictions) > 10000:
            self.predictions = self.predictions[-10000:]

        logger.info(f"Recorded prediction: {prediction_id}, conf={predicted_confidence:.2f}, actual={actual_outcome:.2f}")

        return record

    async def _calculate_bucket_stats(self, bucket_id: int) -> CalibrationBucket:
        """Calculate statistics for a bucket"""
        bucket_predictions = [
            p for p in self.predictions
            if self._get_bucket_id(p.predicted_confidence) == bucket_id
        ]

        if not bucket_predictions:
            return CalibrationBucket(
                bucket_id=bucket_id,
                bucket_label=self._get_bucket_label(bucket_id),
                center_confidence=self._get_bucket_center(bucket_id),
                predictions_in_bucket=0,
                avg_predicted_confidence=0,
                avg_actual_accuracy=0,
                calibration_error=0,
                standard_deviation=0,
                count_correct=0,
                count_incorrect=0,
                count_partial=0
            )

        confidences = [p.predicted_confidence for p in bucket_predictions]
        accuracies = [p.actual_outcome for p in bucket_predictions]

        avg_predicted = sum(confidences) / len(confidences)
        avg_actual = sum(accuracies) / len(accuracies)
        calibration_error = avg_actual - avg_predicted

        # Standard deviation
        if len(accuracies) > 1:
            std_dev = statistics.stdev(accuracies)
        else:
            std_dev = 0

        # Count by outcome
        count_correct = len([p for p in bucket_predictions if p.actual_outcome >= 0.8])
        count_incorrect = len([p for p in bucket_predictions if p.actual_outcome < 0.3])
        count_partial = len(bucket_predictions) - count_correct - count_incorrect

        return CalibrationBucket(
            bucket_id=bucket_id,
            bucket_label=self._get_bucket_label(bucket_id),
            center_confidence=self._get_bucket_center(bucket_id),
            predictions_in_bucket=len(bucket_predictions),
            avg_predicted_confidence=avg_predicted,
            avg_actual_accuracy=avg_actual,
            calibration_error=calibration_error,
            standard_deviation=std_dev,
            count_correct=count_correct,
            count_incorrect=count_incorrect,
            count_partial=count_partial
        )

    async def generate_calibration_report(self) -> CalibrationReport:
        """Generate comprehensive calibration report"""
        report_id = f"report_{datetime.utcnow().timestamp()}"

        if len(self.predictions) < self.min_predictions_for_report:
            return CalibrationReport(
                report_id=report_id,
                generated_at=datetime.utcnow(),
                total_predictions=len(self.predictions),
                overall_calibration_error=0,
                overall_expected_calibration_error=0,
                calibration_status=CalibrationStatus.INSUFFICIENT_DATA,
                buckets=[],
                confidence_histogram={},
                recent_calibration_trend="insufficient_data",
                accuracy_vs_confidence_correlation=0,
                recommendations=["Need more predictions to generate calibration report"]
            )

        # Calculate bucket statistics
        buckets = []
        for i in range(self.num_buckets):
            bucket = await self._calculate_bucket_stats(i)
            buckets.append(bucket)

        # Calculate overall calibration error
        buckets_with_data = [b for b in buckets if b.predictions_in_bucket > 0]
        if buckets_with_data:
            overall_error = sum(b.calibration_error for b in buckets_with_data) / len(buckets_with_data)
        else:
            overall_error = 0

        # Calculate Expected Calibration Error (ECE)
        total_predictions = sum(b.predictions_in_bucket for b in buckets)
        ece = 0
        for bucket in buckets_with_data:
            weight = bucket.predictions_in_bucket / total_predictions
            ece += weight * abs(bucket.calibration_error)

        # Determine calibration status
        if abs(overall_error) < self.calibration_threshold:
            status = CalibrationStatus.WELL_CALIBRATED
        elif overall_error < self.overconfidence_threshold:
            status = CalibrationStatus.OVERCONFIDENT
        elif overall_error > self.underconfidence_threshold:
            status = CalibrationStatus.UNDERCONFIDENT
        else:
            status = CalibrationStatus.WELL_CALIBRATED

        # Confidence histogram
        histogram = defaultdict(int)
        for pred in self.predictions:
            bucket_id = self._get_bucket_id(pred.predicted_confidence)
            label = self._get_bucket_label(bucket_id)
            histogram[label] += 1

        # Calculate correlation between confidence and accuracy
        confidences = [p.predicted_confidence for p in self.predictions]
        accuracies = [p.actual_outcome for p in self.predictions]

        if len(confidences) > 1:
            correlation = self._calculate_correlation(confidences, accuracies)
        else:
            correlation = 0

        # Calculate trend
        trend = await self._calculate_calibration_trend()

        # Generate recommendations
        recommendations = self._generate_recommendations(buckets, status, overall_error)

        return CalibrationReport(
            report_id=report_id,
            generated_at=datetime.utcnow(),
            total_predictions=len(self.predictions),
            overall_calibration_error=overall_error,
            overall_expected_calibration_error=ece,
            calibration_status=status,
            buckets=buckets,
            confidence_histogram=dict(histogram),
            recent_calibration_trend=trend,
            accuracy_vs_confidence_correlation=correlation,
            recommendations=recommendations
        )

    def _calculate_correlation(self, x: List[float], y: List[float]) -> float:
        """Calculate Pearson correlation coefficient"""
        if len(x) < 2:
            return 0

        n = len(x)
        sum_x = sum(x)
        sum_y = sum(y)
        sum_xy = sum(x[i] * y[i] for i in range(n))
        sum_x2 = sum(xi * xi for xi in x)
        sum_y2 = sum(yi * yi for yi in y)

        numerator = n * sum_xy - sum_x * sum_y
        denominator = ((n * sum_x2 - sum_x * sum_x) * (n * sum_y2 - sum_y * sum_y)) ** 0.5

        if denominator == 0:
            return 0

        return numerator / denominator

    async def _calculate_calibration_trend(self) -> str:
        """Calculate calibration trend over recent predictions"""
        if len(self.predictions) < 50:
            return "insufficient_data"

        # Split into halves
        mid = len(self.predictions) // 2
        recent = self.predictions[mid:]
        older = self.predictions[:mid]

        recent_error = sum(
            p.actual_outcome - p.predicted_confidence for p in recent
        ) / len(recent) if recent else 0

        older_error = sum(
            p.actual_outcome - p.predicted_confidence for p in older
        ) / len(older) if older else 0

        error_change = recent_error - older_error

        if error_change < -0.05:
            return "improving"  # Error becoming more negative = more accurate
        elif error_change > 0.05:
            return "declining"
        else:
            return "stable"

    def _generate_recommendations(
        self,
        buckets: List[CalibrationBucket],
        status: CalibrationStatus,
        overall_error: float
    ) -> List[str]:
        """Generate calibration recommendations"""
        recommendations = []

        if status == CalibrationStatus.OVERCONFIDENT:
            recommendations.append(
                "SYSTEM IS OVERCONFIDENT: Reduce confidence by 5-10% across all predictions"
            )
            recommendations.append(
                "Focus on reducing false positives in high-confidence predictions"
            )

        elif status == CalibrationStatus.UNDERCONFIDENT:
            recommendations.append(
                "SYSTEM IS UNDERCONFIDENT: Increase confidence by 5-10% across all predictions"
            )
            recommendations.append(
                "Your predictions are more accurate than your confidence suggests"
            )

        elif status == CalibrationStatus.WELL_CALIBRATED:
            recommendations.append(
                "Calibration is good: predicted confidence matches actual accuracy"
            )

        # Bucket-specific recommendations
        for bucket in buckets:
            if bucket.predictions_in_bucket >= 5:
                if bucket.calibration_error < -0.15:
                    recommendations.append(
                        f"Bucket {bucket.bucket_label}: OVERCONFIDENT by {abs(bucket.calibration_error):.1%}. "
                        f"Reduce confidence in this range."
                    )
                elif bucket.calibration_error > 0.15:
                    recommendations.append(
                        f"Bucket {bucket.bucket_label}: UNDERCONFIDENT by {bucket.calibration_error:.1%}. "
                        f"Increase confidence in this range."
                    )

        # Check for empty buckets
        empty_buckets = [b for b in buckets if b.predictions_in_bucket == 0]
        if empty_buckets:
            recommendations.append(
                f"WARNING: {len(empty_buckets)} confidence buckets have no data. "
                "Need more diverse confidence levels."
            )

        if not recommendations:
            recommendations.append("Monitor calibration continuously for drift")

        return recommendations

    async def get_calibration_for_type(
        self,
        prediction_type: str
    ) -> Dict[str, Any]:
        """Get calibration metrics for a specific prediction type"""
        type_predictions = [
            p for p in self.predictions
            if p.prediction_type == prediction_type
        ]

        if not type_predictions:
            return {
                "prediction_type": prediction_type,
                "count": 0,
                "calibration_status": CalibrationStatus.INSUFFICIENT_DATA
            }

        confidences = [p.predicted_confidence for p in type_predictions]
        accuracies = [p.actual_outcome for p in type_predictions]

        avg_confidence = sum(confidences) / len(confidences)
        avg_accuracy = sum(accuracies) / len(accuracies)
        calibration_error = avg_accuracy - avg_confidence

        if abs(calibration_error) < self.calibration_threshold:
            status = CalibrationStatus.WELL_CALIBRATED
        elif calibration_error < 0:
            status = CalibrationStatus.OVERCONFIDENT
        else:
            status = CalibrationStatus.UNDERCONFIDENT

        return {
            "prediction_type": prediction_type,
            "count": len(type_predictions),
            "avg_confidence": avg_confidence,
            "avg_accuracy": avg_accuracy,
            "calibration_error": calibration_error,
            "calibration_status": status.value
        }

    async def get_calibration_for_horizon(
        self,
        horizon_hours: int
    ) -> Dict[str, Any]:
        """Get calibration metrics for a specific horizon"""
        horizon_predictions = [
            p for p in self.predictions
            if p.horizon_hours == horizon_hours
        ]

        if not horizon_predictions:
            return {
                "horizon_hours": horizon_hours,
                "count": 0,
                "calibration_status": CalibrationStatus.INSUFFICIENT_DATA
            }

        confidences = [p.predicted_confidence for p in horizon_predictions]
        accuracies = [p.actual_outcome for p in horizon_predictions]

        avg_confidence = sum(confidences) / len(confidences)
        avg_accuracy = sum(accuracies) / len(accuracies)
        calibration_error = avg_accuracy - avg_confidence

        if abs(calibration_error) < self.calibration_threshold:
            status = CalibrationStatus.WELL_CALIBRATED
        elif calibration_error < 0:
            status = CalibrationStatus.OVERCONFIDENT
        else:
            status = CalibrationStatus.UNDERCONFIDENT

        return {
            "horizon_hours": horizon_hours,
            "count": len(horizon_predictions),
            "avg_confidence": avg_confidence,
            "avg_accuracy": avg_accuracy,
            "calibration_error": calibration_error,
            "calibration_status": status.value
        }

    async def get_calibration_for_asset(
        self,
        asset: str
    ) -> Dict[str, Any]:
        """Get calibration metrics for a specific asset"""
        asset_predictions = [
            p for p in self.predictions
            if p.asset == asset
        ]

        if not asset_predictions:
            return {
                "asset": asset,
                "count": 0,
                "calibration_status": CalibrationStatus.INSUFFICIENT_DATA
            }

        confidences = [p.predicted_confidence for p in asset_predictions]
        accuracies = [p.actual_outcome for p in asset_predictions]

        avg_confidence = sum(confidences) / len(confidences)
        avg_accuracy = sum(accuracies) / len(accuracies)
        calibration_error = avg_accuracy - avg_confidence

        if abs(calibration_error) < self.calibration_threshold:
            status = CalibrationStatus.WELL_CALIBRATED
        elif calibration_error < 0:
            status = CalibrationStatus.OVERCONFIDENT
        else:
            status = CalibrationStatus.UNDERCONFIDENT

        return {
            "asset": asset,
            "count": len(asset_predictions),
            "avg_confidence": avg_confidence,
            "avg_accuracy": avg_accuracy,
            "calibration_error": calibration_error,
            "calibration_status": status.value
        }

    async def get_calibration_adjustment(
        self,
        raw_confidence: float,
        prediction_type: Optional[str] = None,
        horizon_hours: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Get calibrated confidence adjustment.

        Use this to adjust raw model confidence based on historical calibration.
        """
        # Get bucket
        bucket_id = self._get_bucket_id(raw_confidence)
        bucket = await self._calculate_bucket_stats(bucket_id)

        if bucket.predictions_in_bucket < 5:
            # Not enough data, use overall calibration
            report = await self.generate_calibration_report()
            adjustment = report.overall_calibration_error
        else:
            adjustment = bucket.calibration_error

        # Apply adjustment
        calibrated_confidence = raw_confidence + adjustment
        calibrated_confidence = max(0.01, min(0.99, calibrated_confidence))

        return {
            "raw_confidence": raw_confidence,
            "calibration_adjustment": adjustment,
            "calibrated_confidence": calibrated_confidence,
            "confidence_change": calibrated_confidence - raw_confidence,
            "bucket": bucket.bucket_label,
            "bucket_predictions": bucket.predictions_in_bucket
        }

    async def get_recent_predictions(
        self,
        limit: int = 50
    ) -> List[PredictionRecord]:
        """Get recent prediction records"""
        sorted_predictions = sorted(
            self.predictions,
            key=lambda x: x.timestamp,
            reverse=True
        )
        return sorted_predictions[:limit]


# Initialize service
service = ConfidenceCalibrationEngine()


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": service.name,
        "port": service.port,
        "version": service.version,
        "total_predictions": len(service.predictions),
        "recent_window": service.recent_window
    }


@app.post("/api/v1/record")
async def record_prediction(
    prediction_id: str,
    predicted_confidence: float,
    actual_outcome: float,
    prediction_type: str,
    horizon_hours: int,
    asset: Optional[str] = None
):
    """Record a prediction with its outcome"""
    return await service.record_prediction(
        prediction_id=prediction_id,
        predicted_confidence=predicted_confidence,
        actual_outcome=actual_outcome,
        prediction_type=prediction_type,
        horizon_hours=horizon_hours,
        asset=asset
    )


@app.get("/api/v1/report")
async def get_calibration_report():
    """Get comprehensive calibration report"""
    return await service.generate_calibration_report()


@app.get("/api/v1/calibration/type/{prediction_type}")
async def get_type_calibration(prediction_type: str):
    """Get calibration for a prediction type"""
    return await service.get_calibration_for_type(prediction_type)


@app.get("/api/v1/calibration/horizon/{horizon_hours}")
async def get_horizon_calibration(horizon_hours: int):
    """Get calibration for a horizon"""
    return await service.get_calibration_for_horizon(horizon_hours)


@app.get("/api/v1/calibration/asset/{asset}")
async def get_asset_calibration(asset: str):
    """Get calibration for an asset"""
    return await service.get_calibration_for_asset(asset)


@app.post("/api/v1/adjust")
async def get_calibration_adjustment(
    raw_confidence: float,
    prediction_type: Optional[str] = None,
    horizon_hours: Optional[int] = None
):
    """Get calibrated confidence adjustment"""
    return await service.get_calibration_adjustment(
        raw_confidence, prediction_type, horizon_hours
    )


@app.get("/api/v1/recent")
async def get_recent_predictions(limit: int = 50):
    """Get recent prediction records"""
    return await service.get_recent_predictions(limit)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5166)