"""
Tests for assetmind-marketplace
Marketplace services for research, models, strategies, data, and agents
Ports: 5230-5239
"""
import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from services.marketplace_service import app as market_app, service as market_service, ListingType, ListingStatus
from services.research_marketplace_service import app as research_app, service as research_service
from services.model_marketplace_service import app as model_app, service as model_service
from services.strategy_marketplace_service import app as strategy_app, service as strategy_service
from services.data_marketplace_service import app as data_app, service as data_service
from services.agent_marketplace_service import app as agent_app, service as agent_service


class TestMarketplaceService:
    """Test cases for Marketplace Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = market_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Marketplace Service"
        assert self.service.port == 5230
        assert len(self.service._listings) > 0

    @pytest.mark.asyncio
    async def test_get_listings(self):
        """Test getting listings"""
        result = await self.service.get_listings()
        assert "listings" in result
        assert "total" in result
        assert result["total"] > 0

    @pytest.mark.asyncio
    async def test_get_categories(self):
        """Test getting categories"""
        categories = await self.service.get_categories()
        assert isinstance(categories, list)
        assert len(categories) > 0

    @pytest.mark.asyncio
    async def test_get_brief(self):
        """Test getting marketplace brief"""
        brief = await self.service.get_brief()
        assert "total_listings" in brief
        assert "categories" in brief

    @pytest.mark.asyncio
    async def test_search(self):
        """Test search functionality"""
        results = await self.service.search("tech")
        assert isinstance(results, list)


class TestResearchMarketplace:
    """Test cases for Research Marketplace"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = research_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Research Marketplace"
        assert self.service.port == 5231

    @pytest.mark.asyncio
    async def test_get_reports(self):
        """Test getting reports"""
        reports = await self.service.get_reports()
        assert isinstance(reports, list)


class TestModelMarketplace:
    """Test cases for Model Marketplace"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = model_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Model Marketplace"
        assert self.service.port == 5232

    @pytest.mark.asyncio
    async def test_get_models(self):
        """Test getting models"""
        models = await self.service.get_models()
        assert isinstance(models, list)


class TestStrategyMarketplace:
    """Test cases for Strategy Marketplace"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = strategy_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Strategy Marketplace"
        assert self.service.port == 5233

    @pytest.mark.asyncio
    async def test_get_strategies(self):
        """Test getting strategies"""
        strategies = await self.service.get_strategies()
        assert isinstance(strategies, list)


class TestDataMarketplace:
    """Test cases for Data Marketplace"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = data_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Data Marketplace"
        assert self.service.port == 5234

    @pytest.mark.asyncio
    async def test_get_datasets(self):
        """Test getting datasets"""
        datasets = await self.service.get_datasets()
        assert isinstance(datasets, list)


class TestAgentMarketplace:
    """Test cases for Agent Marketplace"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = agent_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Agent Marketplace"
        assert self.service.port == 5235

    @pytest.mark.asyncio
    async def test_get_agents(self):
        """Test getting agents"""
        agents = await self.service.get_agents()
        assert isinstance(agents, list)


class TestMarketplaceAPI:
    """Test cases for Marketplace API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(market_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"

    def test_get_brief_endpoint(self, client):
        """Test get brief endpoint"""
        response = client.get("/api/v1/brief")
        assert response.status_code == 200

    def test_get_listings_endpoint(self, client):
        """Test get listings endpoint"""
        response = client.get("/api/v1/listings")
        assert response.status_code == 200

    def test_get_categories_endpoint(self, client):
        """Test get categories endpoint"""
        response = client.get("/api/v1/categories")
        assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])