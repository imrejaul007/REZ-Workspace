"""
Tests for assetmind-trader
Trader services for journal, analysis, and performance
Ports: 5210-5219
"""
import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from services.trade_journal_service import app as journal_app, service as journal_service
from services.behavior_analysis_service import app as behavior_app, service as behavior_service
from services.strategy_analysis_service import app as strategy_app, service as strategy_service
from services.performance_review_service import app as performance_app, service as performance_service
from services.mistake_detection_service import app as mistake_app, service as mistake_service


class TestTradeJournalService:
    """Test cases for Trade Journal Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = journal_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Trade Journal"
        assert self.service.port == 5210

    @pytest.mark.asyncio
    async def test_add_trade(self):
        """Test adding a trade"""
        trade_data = {
            "symbol": "AAPL",
            "action": "BUY",
            "quantity": 100,
            "price": 150.0
        }
        result = await self.service.add_trade("user123", trade_data)
        assert "trade_id" in result
        assert result["user_id"] == "user123"
        assert result["symbol"] == "AAPL"
        assert result["action"] == "BUY"
        assert "created_at" in result

    @pytest.mark.asyncio
    async def test_get_trades(self):
        """Test getting user trades"""
        # Add some trades
        await self.service.add_trade("user456", {"symbol": "GOOGL", "action": "BUY", "quantity": 50})
        await self.service.add_trade("user456", {"symbol": "MSFT", "action": "SELL", "quantity": 25})

        trades = await self.service.get_trades("user456")
        assert len(trades) == 2
        assert all(t["user_id"] == "user456" for t in trades)

    @pytest.mark.asyncio
    async def test_get_trades_with_limit(self):
        """Test getting trades with limit"""
        # Add multiple trades
        for i in range(5):
            await self.service.add_trade("user789", {"symbol": f"STOCK{i}", "action": "BUY", "quantity": 10})

        trades = await self.service.get_trades("user789", limit=3)
        assert len(trades) <= 3


class TestTradeJournalAPI:
    """Test cases for Trade Journal API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(journal_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "Trade Journal"

    def test_add_trade_endpoint(self, client):
        """Test add trade endpoint"""
        response = client.post(
            "/api/v1/trades",
            json={
                "user_id": "test_user",
                "trade_data": {
                    "symbol": "TSLA",
                    "action": "BUY",
                    "quantity": 10,
                    "price": 250.0
                }
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == "test_user"
        assert data["symbol"] == "TSLA"

    def test_get_trades_endpoint(self, client):
        """Test get trades endpoint"""
        # First add a trade
        client.post(
            "/api/v1/trades",
            json={
                "user_id": "test_user2",
                "trade_data": {"symbol": "AMZN", "action": "BUY", "quantity": 20}
            }
        )
        # Then get trades
        response = client.get("/api/v1/trades/test_user2")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


class TestBehaviorAnalysisService:
    """Test cases for Behavior Analysis Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = behavior_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Behavior Analysis"
        assert self.service.port == 5211

    @pytest.mark.asyncio
    async def test_analyze_behavior(self):
        """Test analyzing trader behavior"""
        result = await self.service.analyze_behavior("user123")
        assert "user_id" in result
        assert "patterns" in result or "behaviors" in result or "analysis" in result


class TestBehaviorAnalysisAPI:
    """Test cases for Behavior Analysis API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(behavior_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestStrategyAnalysisService:
    """Test cases for Strategy Analysis Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = strategy_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Strategy Analysis"
        assert self.service.port == 5212

    @pytest.mark.asyncio
    async def test_analyze_strategy(self):
        """Test analyzing trading strategy"""
        result = await self.service.analyze_strategy("momentum")
        assert "strategy" in result or "analysis" in result or "results" in result


class TestStrategyAnalysisAPI:
    """Test cases for Strategy Analysis API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(strategy_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestPerformanceReviewService:
    """Test cases for Performance Review Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = performance_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Performance Review"
        assert self.service.port == 5213

    @pytest.mark.asyncio
    async def test_get_performance(self):
        """Test getting performance metrics"""
        result = await self.service.get_performance("user123")
        assert "user_id" in result or "metrics" in result or "performance" in result


class TestPerformanceReviewAPI:
    """Test cases for Performance Review API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(performance_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestMistakeDetectionService:
    """Test cases for Mistake Detection Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = mistake_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Mistake Detection"
        assert self.service.port == 5214

    @pytest.mark.asyncio
    async def test_detect_mistakes(self):
        """Test detecting trading mistakes"""
        result = await self.service.detect_mistakes("user123")
        assert "user_id" in result or "mistakes" in result or "detections" in result


class TestMistakeDetectionAPI:
    """Test cases for Mistake Detection API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(mistake_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])