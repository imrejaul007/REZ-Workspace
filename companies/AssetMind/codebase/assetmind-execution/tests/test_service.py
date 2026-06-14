"""
Tests for assetmind-execution
Execution services for trading automation
Ports: 5250-5259
"""
import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from services.paper_trading_service import app as paper_app, service as paper_service
from services.trade_automation_service import app as auto_app, service as auto_service
from services.broker_integration_service import app as broker_app, service as broker_service


class TestPaperTradingService:
    """Test cases for Paper Trading Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = paper_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Paper Trading"
        assert self.service.port == 5251

    @pytest.mark.asyncio
    async def test_place_order_buy(self):
        """Test placing a buy order"""
        result = await self.service.place_order("AAPL", "BUY", 100)
        assert "order_id" in result
        assert result["symbol"] == "AAPL"
        assert result["action"] == "BUY"
        assert result["quantity"] == 100
        assert "status" in result
        assert "filled_price" in result

    @pytest.mark.asyncio
    async def test_place_order_sell(self):
        """Test placing a sell order"""
        result = await self.service.place_order("GOOGL", "SELL", 50)
        assert result["symbol"] == "GOOGL"
        assert result["action"] == "SELL"

    @pytest.mark.asyncio
    async def test_order_status(self):
        """Test order has valid status"""
        result = await self.service.place_order("MSFT", "BUY", 25)
        valid_statuses = ["FILLED", "PENDING", "CANCELLED", "REJECTED"]
        assert result["status"] in valid_statuses


class TestPaperTradingAPI:
    """Test cases for Paper Trading API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(paper_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "Paper Trading"

    def test_place_order_endpoint(self, client):
        """Test place order endpoint"""
        response = client.post(
            "/api/v1/orders",
            json={
                "symbol": "TSLA",
                "action": "BUY",
                "quantity": 10,
                "order_type": "MARKET"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["symbol"] == "TSLA"
        assert "order_id" in data


class TestTradeAutomationService:
    """Test cases for Trade Automation Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = auto_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Trade Automation"
        assert self.service.port == 5250

    @pytest.mark.asyncio
    async def test_automate_trade(self):
        """Test automating a trade"""
        result = await self.service.automate_trade("AAPL", "BUY")
        assert "trade_id" in result or "automation" in result


class TestTradeAutomationAPI:
    """Test cases for Trade Automation API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(auto_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestBrokerIntegrationService:
    """Test cases for Broker Integration Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = broker_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Broker Integration"
        assert self.service.port == 5252

    @pytest.mark.asyncio
    async def test_connect_broker(self):
        """Test connecting to broker"""
        result = await self.service.connect_broker("IBKR")
        assert "broker" in result or "connection" in result or "status" in result


class TestBrokerIntegrationAPI:
    """Test cases for Broker Integration API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(broker_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])