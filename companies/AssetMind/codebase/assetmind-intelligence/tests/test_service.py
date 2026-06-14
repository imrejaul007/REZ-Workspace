"""
Tests for assetmind-intelligence
Intelligence services for risk, news, events, and market analysis
Ports: 5050-5059
"""
import pytest
from httpx import AsyncClient, ASGITransport
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from services.risk_intelligence_service import app as risk_app


class TestRiskIntelligenceService:
    """Test cases for Risk Intelligence Service"""

    @pytest.fixture
    async def client(self):
        """Create async test client"""
        transport = ASGITransport(app=risk_app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac

    @pytest.mark.asyncio
    async def test_health(self, client):
        """Test health check endpoint"""
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "assetmind-risk-intelligence"
        assert data["port"] == 5053
        assert "version" in data

    @pytest.mark.asyncio
    async def test_get_risk_assessment_nvda(self, client):
        """Test getting risk assessment for NVDA"""
        response = await client.get("/assessment/NVDA")
        assert response.status_code == 200
        data = response.json()
        assert data["symbol"] == "NVDA"
        assert "financial_risk" in data
        assert "market_risk" in data
        assert "operational_risk" in data
        assert "regulatory_risk" in data
        assert "geopolitical_risk" in data
        assert "liquidity_risk" in data
        assert "overall_risk" in data
        assert "risk_level" in data
        assert "risk_factors" in data
        assert "risk_trends" in data
        assert "recommendations" in data

    @pytest.mark.asyncio
    async def test_get_risk_assessment_aapl(self, client):
        """Test getting risk assessment for AAPL"""
        response = await client.get("/assessment/AAPL")
        assert response.status_code == 200
        data = response.json()
        assert data["symbol"] == "AAPL"
        assert data["risk_level"] == "LOW"
        assert data["overall_risk"] < 50

    @pytest.mark.asyncio
    async def test_get_risk_assessment_unknown(self, client):
        """Test getting risk assessment for unknown symbol"""
        response = await client.get("/assessment/UNKNOWN")
        assert response.status_code == 200
        data = response.json()
        assert data["symbol"] == "UNKNOWN"
        assert data["risk_level"] == "MEDIUM"

    @pytest.mark.asyncio
    async def test_get_risk_scores(self, client):
        """Test getting risk scores"""
        response = await client.get("/assessment/AAPL/scores")
        assert response.status_code == 200
        data = response.json()
        assert data["symbol"] == "AAPL"
        assert "financial_risk" in data
        assert "market_risk" in data
        assert "overall_risk" in data
        # All scores should be between 0 and 100
        for key in ["financial_risk", "market_risk", "operational_risk",
                   "regulatory_risk", "geopolitical_risk", "liquidity_risk", "overall_risk"]:
            assert 0 <= data[key] <= 100

    @pytest.mark.asyncio
    async def test_get_risk_scenarios(self, client):
        """Test getting risk scenarios"""
        response = await client.get("/scenarios")
        assert response.status_code == 200
        data = response.json()
        assert "scenarios" in data
        assert len(data["scenarios"]) > 0
        for scenario in data["scenarios"]:
            assert "name" in scenario
            assert "probability" in scenario
            assert "impact" in scenario
            assert "affected_assets" in scenario

    @pytest.mark.asyncio
    async def test_get_market_risk(self, client):
        """Test getting market risk level"""
        response = await client.get("/market-risk")
        assert response.status_code == 200
        data = response.json()
        assert "overall_market_risk" in data
        assert "risk_level" in data
        assert "factors" in data
        assert0 <= data["overall_market_risk"] <= 100


class TestRiskIntelligenceValidation:
    """Test validation of risk intelligence responses"""

    @pytest.fixture
    async def client(self):
        """Create async test client"""
        transport = ASGITransport(app=risk_app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac

    @pytest.mark.asyncio
    async def test_risk_scores_in_valid_range(self, client):
        """Test all risk scores are in valid range"""
        response = await client.get("/assessment/NVDA/scores")
        assert response.status_code == 200
        data = response.json()
        risk_keys = ["financial_risk", "market_risk", "operational_risk",
                     "regulatory_risk", "geopolitical_risk", "liquidity_risk", "overall_risk"]
        for key in risk_keys:
            assert 0 <= data[key] <= 100, f"{key} should be between 0 and 100"

    @pytest.mark.asyncio
    async def test_risk_level_valid(self, client):
        """Test risk level is valid"""
        response = await client.get("/assessment/NVDA")
        assert response.status_code == 200
        data = response.json()
        valid_levels = ["LOW", "MEDIUM", "HIGH", "VERY_HIGH"]
        assert data["risk_level"] in valid_levels

    @pytest.mark.asyncio
    async def test_recommendations_not_empty(self, client):
        """Test recommendations list is not empty for known symbols"""
        response = await client.get("/assessment/NVDA")
        assert response.status_code == 200
        data = response.json()
        assert len(data["recommendations"]) > 0

    @pytest.mark.asyncio
    async def test_case_insensitive_symbols(self, client):
        """Test symbol lookup is case insensitive"""
        response1 = await client.get("/assessment/aapl")
        response2 = await client.get("/assessment/AAPL")
        assert response1.status_code == 200
        assert response2.status_code == 200
        assert response1.json()["symbol"] == response2.json()["symbol"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])