"""
Tests for assetmind-scoring
Scoring services for asset evaluation
Ports: 5072-5079
"""
import pytest
from httpx import AsyncClient, ASGITransport
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from services.momentum_score_service import app as momentum_app, service as momentum_service
from services.risk_score_service import app as risk_app, service as risk_service
from services.conviction_score_service import app as conviction_app, service as conviction_service
from services.institutional_score_service import app as institutional_app, service as institutional_service
from services.sentiment_score_service import app as sentiment_app, service as sentiment_service
from services.opportunity_score_service import app as opportunity_app, service as opportunity_service
from services.financial_score_service import app as financial_app, service as financial_service
from services.technical_score_service import app as technical_app, service as technical_service
from services.health_score_service import app as health_app, service as health_service


class TestMomentumScoreService:
    """Test cases for Momentum Score Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = momentum_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Momentum Score"
        assert self.service.port == 5078

    @pytest.mark.asyncio
    async def test_calculate_score(self):
        """Test score calculation"""
        result = await self.service.calculate_score("AAPL")
        assert result["symbol"] == "AAPL"
        assert "score" in result
        assert 0 <= result["score"] <= 100
        assert result["score_name"] == "momentum"
        assert "factors" in result
        assert "price_momentum" in result["factors"]
        assert "volume_momentum" in result["factors"]
        assert "confidence" in result

    @pytest.mark.asyncio
    async def test_calculate_score_different_horizon(self):
        """Test score calculation with different time horizon"""
        result = await self.service.calculate_score("GOOGL", "short")
        assert result["symbol"] == "GOOGL"
        assert result["time_horizon"] == "short"


class TestMomentumScoreAPI:
    """Test cases for Momentum Score API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return momentum_app

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        from fastapi.testclient import TestClient
        with TestClient(client) as tc:
            response = tc.get("/health")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "healthy"
            assert data["service"] == "Momentum Score"

    def test_get_score_endpoint(self, client):
        """Test get score endpoint"""
        from fastapi.testclient import TestClient
        with TestClient(client) as tc:
            response = tc.get("/api/v1/score/AAPL")
            assert response.status_code == 200
            data = response.json()
            assert data["symbol"] == "AAPL"

    def test_batch_scores_endpoint(self, client):
        """Test batch scores endpoint"""
        from fastapi.testclient import TestClient
        with TestClient(client) as tc:
            response = tc.post("/api/v1/scores/batch?symbols=AAPL&symbols=GOOGL")
            assert response.status_code == 200
            data = response.json()
            assert "scores" in data
            assert len(data["scores"]) == 2


class TestRiskScoreService:
    """Test cases for Risk Score Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = risk_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Risk Score"
        assert self.service.port == 5072

    @pytest.mark.asyncio
    async def test_calculate_score(self):
        """Test risk score calculation"""
        result = await self.service.calculate_score("TSLA")
        assert result["symbol"] == "TSLA"
        assert "score" in result
        assert 0 <= result["score"] <= 100
        assert result["score_name"] == "risk"
        assert "factors" in result
        assert "volatility" in result["factors"]
        assert "beta" in result["factors"]


class TestRiskScoreAPI:
    """Test cases for Risk Score API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return risk_app

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        from fastapi.testclient import TestClient
        with TestClient(client) as tc:
            response = tc.get("/health")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "healthy"

    def test_get_score_endpoint(self, client):
        """Test get score endpoint"""
        from fastapi.testclient import TestClient
        with TestClient(client) as tc:
            response = tc.get("/api/v1/score/NVDA?time_horizon=short")
            assert response.status_code == 200
            data = response.json()
            assert data["symbol"] == "NVDA"


class TestConvictionScoreService:
    """Test cases for Conviction Score Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = conviction_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Conviction Score"
        assert self.service.port == 5074

    @pytest.mark.asyncio
    async def test_calculate_score(self):
        """Test conviction score calculation"""
        result = await self.service.calculate_score("AMZN")
        assert result["symbol"] == "AMZN"
        assert "score" in result
        assert 0 <= result["score"] <= 100


class TestConvictionScoreAPI:
    """Test cases for Conviction Score API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return conviction_app

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        from fastapi.testclient import TestClient
        with TestClient(client) as tc:
            response = tc.get("/health")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "healthy"


class TestInstitutionalScoreService:
    """Test cases for Institutional Score Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = institutional_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Institutional Score"
        assert self.service.port == 5075

    @pytest.mark.asyncio
    async def test_calculate_score(self):
        """Test institutional score calculation"""
        result = await self.service.calculate_score("MSFT")
        assert result["symbol"] == "MSFT"
        assert "score" in result
        assert 0 <= result["score"] <= 100


class TestInstitutionalScoreAPI:
    """Test cases for Institutional Score API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return institutional_app

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        from fastapi.testclient import TestClient
        with TestClient(client) as tc:
            response = tc.get("/health")
            assert response.status_code == 200


class TestSentimentScoreService:
    """Test cases for Sentiment Score Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = sentiment_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Sentiment Score"
        assert self.service.port == 5076

    @pytest.mark.asyncio
    async def test_calculate_score(self):
        """Test sentiment score calculation"""
        result = await self.service.calculate_score("META")
        assert result["symbol"] == "META"
        assert "score" in result
        assert 0 <= result["score"] <= 100


class TestSentimentScoreAPI:
    """Test cases for Sentiment Score API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return sentiment_app

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        from fastapi.testclient import TestClient
        with TestClient(client) as tc:
            response = tc.get("/health")
            assert response.status_code == 200


class TestOpportunityScoreService:
    """Test cases for Opportunity Score Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = opportunity_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Opportunity Score"
        assert self.service.port == 5073

    @pytest.mark.asyncio
    async def test_calculate_score(self):
        """Test opportunity score calculation"""
        result = await self.service.calculate_score("AMD")
        assert result["symbol"] == "AMD"
        assert "score" in result
        assert 0 <= result["score"] <= 100


class TestOpportunityScoreAPI:
    """Test cases for Opportunity Score API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return opportunity_app

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        from fastapi.testclient import TestClient
        with TestClient(client) as tc:
            response = tc.get("/health")
            assert response.status_code == 200


class TestFinancialScoreService:
    """Test cases for Financial Score Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = financial_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Financial Score"
        assert self.service.port == 5077

    @pytest.mark.asyncio
    async def test_calculate_score(self):
        """Test financial score calculation"""
        result = await self.service.calculate_score("COIN")
        assert result["symbol"] == "COIN"
        assert "score" in result
        assert 0 <= result["score"] <= 100


class TestFinancialScoreAPI:
    """Test cases for Financial Score API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return financial_app

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        from fastapi.testclient import TestClient
        with TestClient(client) as tc:
            response = tc.get("/health")
            assert response.status_code == 200


class TestTechnicalScoreService:
    """Test cases for Technical Score Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = technical_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Technical Score"
        assert self.service.port == 5079

    @pytest.mark.asyncio
    async def test_calculate_score(self):
        """Test technical score calculation"""
        result = await self.service.calculate_score("PLTR")
        assert result["symbol"] == "PLTR"
        assert "score" in result
        assert 0 <= result["score"] <= 100


class TestTechnicalScoreAPI:
    """Test cases for Technical Score API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return technical_app

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        from fastapi.testclient import TestClient
        with TestClient(client) as tc:
            response = tc.get("/health")
            assert response.status_code == 200


class TestHealthScoreService:
    """Test cases for Health Score Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = health_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Health Score"
        assert self.service.port == 5071

    @pytest.mark.asyncio
    async def test_calculate_score(self):
        """Test health score calculation"""
        result = await self.service.calculate_score("RIVN")
        assert result["symbol"] == "RIVN"
        assert "score" in result
        assert 0 <= result["score"] <= 100


class TestHealthScoreAPI:
    """Test cases for Health Score API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return health_app

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        from fastapi.testclient import TestClient
        with TestClient(client) as tc:
            response = tc.get("/health")
            assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])