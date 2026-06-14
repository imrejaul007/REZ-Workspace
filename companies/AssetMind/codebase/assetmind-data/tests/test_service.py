"""
Tests for assetmind-data service
"""
import pytest
from httpx import AsyncClient
from assetmind_data.services.market_data_service import app, MarketDataService

@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.fixture
def service():
    return MarketDataService()

@pytest.mark.asyncio
async def test_health(client):
    """Test health endpoint"""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "service" in data
    assert data["port"] == 5010

@pytest.mark.asyncio
async def test_get_quote(client):
    """Test getting a stock quote"""
    response = await client.get("/api/v1/market/NVDA")
    assert response.status_code == 200
    data = response.json()
    assert "symbol" in data
    assert data["symbol"] == "NVDA"
    assert "price" in data
    assert isinstance(data["price"], (int, float))

@pytest.mark.asyncio
async def test_get_quote_uppercase(client):
    """Test symbol is normalized to uppercase"""
    response = await client.get("/api/v1/market/nvda")
    assert response.status_code == 200
    data = response.json()
    assert data["symbol"] == "NVDA"

@pytest.mark.asyncio
async def test_historical_data(client):
    """Test historical data endpoint"""
    response = await client.get("/api/v1/market/NVDA/history")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert isinstance(data["data"], list)

@pytest.mark.asyncio
async def test_batch_quotes(client):
    """Test batch quotes endpoint"""
    symbols = ["NVDA", "AAPL", "TSLA"]
    response = await client.post(
        "/api/v1/market/batch",
        json={"symbols": symbols}
    )
    assert response.status_code == 200
    data = response.json()
    assert "quotes" in data
    assert len(data["quotes"]) == len(symbols)

@pytest.mark.asyncio
async def test_service_initialization(service):
    """Test service initializes correctly"""
    assert service.name == "Market Data"
    assert service.port == 5010
    assert service.client is not None

@pytest.mark.asyncio
async def test_service_get_quote(service):
    """Test service quote method"""
    result = await service.get_quote("NVDA")
    assert result["symbol"] == "NVDA"
    assert "price" in result
    assert "change" in result

@pytest.mark.asyncio
async def test_service_get_multiple_quotes(service):
    """Test service batch quote method"""
    symbols = ["NVDA", "AAPL", "GOOG"]
    result = await service.get_multiple_quotes(symbols)
    assert len(result) == len(symbols)
    for quote in result:
        assert "symbol" in quote
        assert "price" in quote
