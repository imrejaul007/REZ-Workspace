"""
Tests for assetmind-daily
Daily briefing services for market updates
Ports: 5170-5179
"""
import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from services.morning_briefing_service import app as morning_app, service as morning_service
from services.watchlist_briefing_service import app as watchlist_app, service as watchlist_service
from services.portfolio_briefing_service import app as portfolio_app, service as portfolio_service
from services.market_briefing_service import app as market_app, service as market_service
from services.theme_briefing_service import app as theme_app, service as theme_service
from services.risk_briefing_service import app as risk_app, service as risk_service
from services.opportunity_briefing_service import app as opportunity_app, service as opportunity_service


class TestMorningBriefingService:
    """Test cases for Morning Briefing Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = morning_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Morning Briefing Service"
        assert self.service.port == 5170

    @pytest.mark.asyncio
    async def test_generate_briefing(self):
        """Test briefing generation"""
        briefing = await self.service.generate_morning_briefing()
        assert briefing.briefing_id is not None
        assert len(briefing.items) > 0
        assert briefing.briefing_type.value == "morning"

    @pytest.mark.asyncio
    async def test_get_dashboard_summary(self):
        """Test dashboard summary"""
        summary = await self.service.get_dashboard_summary()
        assert "market_status" in summary
        assert "market_summary" in summary


class TestWatchlistBriefingService:
    """Test cases for Watchlist Briefing Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = watchlist_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Watchlist Briefing Service"
        assert self.service.port == 5171

    @pytest.mark.asyncio
    async def test_generate_briefing(self):
        """Test briefing generation"""
        briefing = await self.service.generate_briefing(
            watchlist=["AAPL", "GOOGL", "MSFT"]
        )
        assert briefing.briefing_id is not None
        assert len(briefing.items) == 3


class TestPortfolioBriefingService:
    """Test cases for Portfolio Briefing Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = portfolio_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Portfolio Briefing Service"
        assert self.service.port == 5172

    @pytest.mark.asyncio
    async def test_generate_briefing(self):
        """Test briefing generation"""
        positions = [
            {"symbol": "AAPL", "quantity": 100, "avg_cost": 150, "current_price": 175},
            {"symbol": "GOOGL", "quantity": 50, "avg_cost": 2800, "current_price": 3000}
        ]
        briefing = await self.service.generate_briefing(positions=positions)
        assert briefing.briefing_id is not None
        assert len(briefing.positions) == 2


class TestMarketBriefingService:
    """Test cases for Market Briefing Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = market_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Market Briefing Service"
        assert self.service.port == 5173

    @pytest.mark.asyncio
    async def test_generate_briefing(self):
        """Test briefing generation"""
        briefing = await self.service.generate_briefing()
        assert briefing.briefing_id is not None
        assert len(briefing.indices) > 0
        assert len(briefing.sectors) > 0


class TestThemeBriefingService:
    """Test cases for Theme Briefing Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = theme_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Theme Briefing Service"
        assert self.service.port == 5174

    @pytest.mark.asyncio
    async def test_generate_briefing(self):
        """Test briefing generation"""
        briefing = await self.service.generate_briefing()
        assert briefing.briefing_id is not None
        assert len(briefing.themes) > 0


class TestRiskBriefingService:
    """Test cases for Risk Briefing Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = risk_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Risk Briefing Service"
        assert self.service.port == 5175

    @pytest.mark.asyncio
    async def test_generate_briefing(self):
        """Test briefing generation"""
        briefing = await self.service.generate_briefing()
        assert briefing.briefing_id is not None
        assert len(briefing.alerts) >= 0
        assert len(briefing.metrics) > 0


class TestOpportunityBriefingService:
    """Test cases for Opportunity Briefing Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = opportunity_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Opportunity Briefing Service"
        assert self.service.port == 5176

    @pytest.mark.asyncio
    async def test_generate_briefing(self):
        """Test briefing generation"""
        briefing = await self.service.generate_briefing()
        assert briefing.briefing_id is not None
        assert len(briefing.opportunities) > 0


class TestDailyAPI:
    """Test cases for Daily API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(morning_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

    def test_generate_briefing_endpoint(self, client):
        """Test generate briefing endpoint"""
        response = client.post("/api/v1/briefing/morning")
        assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])