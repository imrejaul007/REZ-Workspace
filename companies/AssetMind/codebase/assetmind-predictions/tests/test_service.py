"""
Tests for assetmind-predictions
Prediction services for price and probability forecasting
Ports: 5160-5169
"""
import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from services.prediction_service import app as pred_app, service as pred_service, PredictionType, TimeHorizon
from services.probability_engine import app as prob_app, service as prob_service, ScenarioType
from services.outcome_tracker import app as outcome_app, service as outcome_service


class TestPredictionService:
    """Test cases for Prediction Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = pred_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Prediction Service"
        assert self.service.port == 5160
        assert self.service.version == "1.0.0"

    @pytest.mark.asyncio
    async def test_predict_single(self):
        """Test single prediction"""
        prediction = await self.service.predict(
            symbol="AAPL",
            prediction_type=PredictionType.PRICE,
            time_horizon=TimeHorizon.DAILY
        )
        assert prediction.asset_symbol == "AAPL"
        assert prediction.prediction_type == PredictionType.PRICE
        assert prediction.current_value > 0
        assert prediction.predicted_value > 0

    @pytest.mark.asyncio
    async def test_predict_batch(self):
        """Test batch predictions"""
        predictions = await self.service.predict_batch(
            symbols=["AAPL", "GOOGL", "MSFT"],
            prediction_type=PredictionType.PRICE
        )
        assert len(predictions) == 3
        assert all(p.asset_symbol in ["AAPL", "GOOGL", "MSFT"] for p in predictions)


class TestProbabilityEngine:
    """Test cases for Probability Engine"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = prob_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Probability Engine"
        assert self.service.port == 5161

    @pytest.mark.asyncio
    async def test_calculate_scenario_probability(self):
        """Test scenario probability calculation"""
        result = await self.service.calculate_scenario_probability(
            scenario_type=ScenarioType.PRICE_MOVE,
            parameters={
                "initial_price": 100,
                "expected_return": 0.001,
                "volatility": 0.02,
                "periods": 1,
                "target_price": 105
            },
            simulations=1000
        )
        assert result.scenario_type == ScenarioType.PRICE_MOVE
        assert 0 <= result.probability <= 1
        assert result.simulations_run == 1000

    @pytest.mark.asyncio
    async def test_conditional_probability(self):
        """Test conditional probability calculation"""
        result = await self.service.calculate_conditional_probability(
            event_a_probability=0.3,
            event_b_probability=0.5,
            joint_probability=0.15
        )
        assert "p_a_given_b" in result


class TestOutcomeTracker:
    """Test cases for Outcome Tracker"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = outcome_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Outcome Tracker"
        assert self.service.port == 5164
        assert len(self.service._outcomes) > 0

    @pytest.mark.asyncio
    async def test_get_performance_metrics(self):
        """Test getting performance metrics"""
        metrics = await self.service.get_performance_metrics("30d")
        assert metrics.total_predictions >= 0


class TestPredictionAPI:
    """Test cases for Prediction API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(pred_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"

    def test_predict_endpoint(self, client):
        """Test predict endpoint"""
        response = client.post(
            "/api/v1/predict",
            json={
                "symbol": "AAPL",
                "prediction_type": "price",
                "time_horizon": "daily"
            }
        )
        assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])