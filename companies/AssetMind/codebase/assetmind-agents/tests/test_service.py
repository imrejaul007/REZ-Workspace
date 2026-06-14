"""
Tests for assetmind-agents
Asset Agent service - specialized agent for asset analysis
Port: 5100
"""
import pytest
from httpx import AsyncClient, ASGITransport
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from services.asset_agent import app


class TestAssetAgentService:
    """Test cases for Asset Agent Service"""

    @pytest.fixture
    async def client(self):
        """Create async test client"""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac

    @pytest.mark.asyncio
    async def test_health(self, client):
        """Test health check endpoint"""
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "assetmind-asset-agent"
        assert data["port"] == 5100
        assert "version" in data

    @pytest.mark.asyncio
    async def test_analyze_asset_full(self, client):
        """Test full asset analysis"""
        response = await client.post(
            "/analyze",
            json={"symbol": "AAPL", "analysis_type": "FULL"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["symbol"] == "AAPL"
        assert data["analysis_type"] == "FULL"
        assert "profile" in data
        assert "relationships" in data
        assert "historical_summary" in data
        assert "key_metrics" in data
        assert "insights" in data
        assert "confidence" in data
        assert 0 <= data["confidence"] <= 100

    @pytest.mark.asyncio
    async def test_analyze_asset_quick(self, client):
        """Test quick asset analysis"""
        response = await client.post(
            "/analyze",
            json={"symbol": "GOOGL", "analysis_type": "QUICK"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["symbol"] == "GOOGL"
        assert data["analysis_type"] == "QUICK"
        assert "profile" in data

    @pytest.mark.asyncio
    async def test_analyze_asset_comparison(self, client):
        """Test comparison asset analysis"""
        response = await client.post(
            "/analyze",
            json={"symbol": "MSFT", "analysis_type": "COMPARISON"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["symbol"] == "MSFT"
        assert data["analysis_type"] == "COMPARISON"

    @pytest.mark.asyncio
    async def test_analyze_lowercase_symbol(self, client):
        """Test asset analysis with lowercase symbol"""
        response = await client.post(
            "/analyze",
            json={"symbol": "nvda", "analysis_type": "FULL"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["symbol"] == "NVDA"

    @pytest.mark.asyncio
    async def test_compare_assets_single(self, client):
        """Test comparing a single asset"""
        response = await client.post("/compare?symbols=AAPL")
        assert response.status_code == 200
        data = response.json()
        assert "comparisons" in data
        assert len(data["comparisons"]) == 1
        assert data["comparisons"][0]["symbol"] == "AAPL"

    @pytest.mark.asyncio
    async def test_compare_assets_multiple(self, client):
        """Test comparing multiple assets"""
        response = await client.post("/compare?symbols=AAPL,GOOGL,MSFT")
        assert response.status_code == 200
        data = response.json()
        assert "comparisons" in data
        assert len(data["comparisons"]) == 3
        symbols = [c["symbol"] for c in data["comparisons"]]
        assert "AAPL" in symbols
        assert "GOOGL" in symbols
        assert "MSFT" in symbols

    @pytest.mark.asyncio
    async def test_get_asset_profile(self, client):
        """Test getting asset profile"""
        response = await client.get("/profile/AAPL")
        assert response.status_code == 200
        data = response.json()
        assert data["symbol"] == "AAPL"
        assert "name" in data
        assert "sector" in data
        assert "industry" in data

    @pytest.mark.asyncio
    async def test_get_asset_relationships(self, client):
        """Test getting asset relationships"""
        response = await client.get("/relationships/AAPL")
        assert response.status_code == 200
        data = response.json()
        assert data["symbol"] == "AAPL"
        assert "relationships" in data
        assert len(data["relationships"]) > 0
        for rel in data["relationships"]:
            assert "type" in rel
            assert "symbol" in rel
            assert "strength" in rel

    @pytest.mark.asyncio
    async def test_discover_related_assets(self, client):
        """Test discovering related assets"""
        response = await client.get("/discovery/related/NVDA")
        assert response.status_code == 200
        data = response.json()
        assert data["symbol"] == "NVDA"
        assert "related" in data
        assert len(data["related"]) > 0
        for rel in data["related"]:
            assert "symbol" in rel
            assert "reason" in rel
            assert "similarity" in rel


class TestAssetAgentResponseValidation:
    """Test validation of asset agent response data"""

    @pytest.fixture
    async def client(self):
        """Create async test client"""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac

    @pytest.mark.asyncio
    async def test_profile_contains_required_fields(self, client):
        """Test profile contains all required fields"""
        response = await client.post(
            "/analyze",
            json={"symbol": "TSLA", "analysis_type": "FULL"}
        )
        assert response.status_code == 200
        data = response.json()
        profile = data["profile"]
        assert "name" in profile
        assert "sector" in profile
        assert "industry" in profile
        assert "market_cap" in profile

    @pytest.mark.asyncio
    async def test_historical_summary_contains_returns(self, client):
        """Test historical summary contains return data"""
        response = await client.post(
            "/analyze",
            json={"symbol": "AMZN", "analysis_type": "FULL"}
        )
        assert response.status_code == 200
        data = response.json()
        summary = data["historical_summary"]
        assert "1y_return" in summary
        assert "volatility" in summary

    @pytest.mark.asyncio
    async def test_key_metrics_contains_financial_data(self, client):
        """Test key metrics contains financial data"""
        response = await client.post(
            "/analyze",
            json={"symbol": "META", "analysis_type": "FULL"}
        )
        assert response.status_code == 200
        data = response.json()
        metrics = data["key_metrics"]
        assert "pe_ratio" in metrics
        assert "revenue_growth" in metrics

    @pytest.mark.asyncio
    async def test_insights_not_empty(self, client):
        """Test insights list is not empty"""
        response = await client.post(
            "/analyze",
            json={"symbol": "AMD", "analysis_type": "FULL"}
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["insights"]) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])