"""
Tests for assetmind-discovery
Discovery services for opportunities and hidden gems
Ports: 5180-5189
"""
import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from services.opportunity_discovery_service import app as opp_app, service as opp_service
from services.institutional_discovery_service import app as inst_app, service as inst_service
from services.hidden_opportunity_service import app as hidden_app, service as hidden_service
from services.theme_discovery_service import app as theme_app, service as theme_service
from services.capital_flow_service import app as flow_app, service as flow_service
from services.risk_discovery_service import app as risk_app, service as risk_service


class TestOpportunityDiscoveryService:
    """Test cases for Opportunity Discovery Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = opp_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Opportunity Discovery"
        assert self.service.port == 5180

    @pytest.mark.asyncio
    async def test_get_opportunities_default(self):
        """Test getting opportunities with default limit"""
        opportunities = await self.service.get_opportunities()
        assert isinstance(opportunities, list)
        assert len(opportunities) > 0
        assert len(opportunities) <= 10

    @pytest.mark.asyncio
    async def test_get_opportunities_custom_limit(self):
        """Test getting opportunities with custom limit"""
        opportunities = await self.service.get_opportunities(limit=5)
        assert isinstance(opportunities, list)
        assert len(opportunities) <= 5

    @pytest.mark.asyncio
    async def test_opportunity_structure(self):
        """Test opportunity data structure"""
        opportunities = await self.service.get_opportunities(limit=1)
        assert len(opportunities) > 0
        opp = opportunities[0]
        assert "rank" in opp
        assert "symbol" in opp
        assert "opportunity_score" in opp
        assert "conviction" in opp
        assert "reason" in opp
        assert "thesis" in opp

    @pytest.mark.asyncio
    async def test_opportunity_score_range(self):
        """Test opportunity scores are in valid range"""
        opportunities = await self.service.get_opportunities()
        for opp in opportunities:
            assert 0 <= opp["opportunity_score"] <= 100


class TestOpportunityDiscoveryAPI:
    """Test cases for Opportunity Discovery API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(opp_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "Opportunity Discovery"

    def test_get_opportunities_endpoint(self, client):
        """Test get opportunities endpoint"""
        response = client.get("/api/v1/opportunities")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0

    def test_get_opportunities_with_limit(self, client):
        """Test get opportunities with limit parameter"""
        response = client.get("/api/v1/opportunities?limit=3")
        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 3


class TestInstitutionalDiscoveryService:
    """Test cases for Institutional Discovery Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = inst_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Institutional Discovery"
        assert self.service.port == 5181

    @pytest.mark.asyncio
    async def test_get_opportunities(self):
        """Test getting institutional opportunities"""
        result = await self.service.get_opportunities()
        assert isinstance(result, list)


class TestInstitutionalDiscoveryAPI:
    """Test cases for Institutional Discovery API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(inst_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestHiddenOpportunityService:
    """Test cases for Hidden Opportunity Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = hidden_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Hidden Opportunity"
        assert self.service.port == 5182

    @pytest.mark.asyncio
    async def test_find_opportunities(self):
        """Test finding hidden opportunities"""
        result = await self.service.find_opportunities()
        assert isinstance(result, list)


class TestHiddenOpportunityAPI:
    """Test cases for Hidden Opportunity API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(hidden_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestThemeDiscoveryService:
    """Test cases for Theme Discovery Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = theme_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Theme Discovery"
        assert self.service.port == 5183

    @pytest.mark.asyncio
    async def test_get_themes(self):
        """Test getting themes"""
        result = await self.service.get_themes()
        assert isinstance(result, list)


class TestThemeDiscoveryAPI:
    """Test cases for Theme Discovery API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(theme_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestCapitalFlowService:
    """Test cases for Capital Flow Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = flow_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Capital Flow"
        assert self.service.port == 5184

    @pytest.mark.asyncio
    async def test_track_flows(self):
        """Test tracking capital flows"""
        result = await self.service.track_flows()
        assert isinstance(result, list)


class TestCapitalFlowAPI:
    """Test cases for Capital Flow API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(flow_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestRiskDiscoveryService:
    """Test cases for Risk Discovery Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = risk_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Risk Discovery"
        assert self.service.port == 5185

    @pytest.mark.asyncio
    async def test_discover_risks(self):
        """Test discovering risks"""
        result = await self.service.discover_risks()
        assert isinstance(result, list)


class TestRiskDiscoveryAPI:
    """Test cases for Risk Discovery API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(risk_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])