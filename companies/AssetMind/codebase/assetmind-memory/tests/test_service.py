"""
Tests for assetmind-memory
Memory services for storing and retrieving asset data
Ports: 5030-5039
"""
import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from services.asset_memory_service import app as asset_app, service as asset_service
from services.news_memory_service import app as news_app, service as news_service
from services.event_memory_service import app as event_app, service as event_service
from services.prediction_memory_service import app as pred_app, service as pred_service


class TestAssetMemoryService:
    """Test cases for Asset Memory Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = asset_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Asset Memory"
        assert self.service.port == 5030

    @pytest.mark.asyncio
    async def test_remember(self):
        """Test storing a memory"""
        result = await self.service.remember(
            asset_id="AAPL",
            memory_type="price",
            content="AAPL reached $200",
            metadata={"price": 200}
        )
        assert "memory_id" in result
        assert result["asset_id"] == "AAPL"
        assert result["type"] == "price"
        assert result["content"] == "AAPL reached $200"
        assert "created_at" in result

    @pytest.mark.asyncio
    async def test_recall(self):
        """Test recalling memories"""
        # First store some memories
        await self.service.remember("AAPL", "price", "Memory 1")
        await self.service.remember("AAPL", "price", "Memory 2")
        await self.service.remember("AAPL", "news", "Memory 3")

        # Recall all memories
        memories = await self.service.recall("AAPL")
        assert len(memories) == 3

        # Recall by type
        price_memories = await self.service.recall("AAPL", "price")
        assert len(price_memories) == 2

    @pytest.mark.asyncio
    async def test_profile(self):
        """Test building asset profile"""
        # Store some memories
        await self.service.remember("MSFT", "price", "Price update 1")
        await self.service.remember("MSFT", "news", "News update")

        profile = await self.service.profile("MSFT")
        assert profile["asset_id"] == "MSFT"
        assert "total_memories" in profile
        assert "memory_types" in profile
        assert "first_memory" in profile
        assert "latest_memory" in profile


class TestAssetMemoryAPI:
    """Test cases for Asset Memory API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(asset_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "Asset Memory"

    def test_remember_endpoint(self, client):
        """Test remember endpoint"""
        response = client.post(
            "/api/v1/remember",
            json={
                "asset_id": "GOOGL",
                "memory_type": "price",
                "content": "Test memory",
                "metadata": {"test": True}
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["asset_id"] == "GOOGL"

    def test_recall_endpoint(self, client):
        """Test recall endpoint"""
        # First add a memory
        client.post(
            "/api/v1/remember",
            json={
                "asset_id": "AMZN",
                "memory_type": "price",
                "content": "AMZN price update"
            }
        )
        # Then recall
        response = client.get("/api/v1/recall/AMZN")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_profile_endpoint(self, client):
        """Test profile endpoint"""
        # First add memories
        client.post(
            "/api/v1/remember",
            json={
                "asset_id": "TSLA",
                "memory_type": "news",
                "content": "TSLA news"
            }
        )
        # Then get profile
        response = client.get("/api/v1/profile/TSLA")
        assert response.status_code == 200
        data = response.json()
        assert data["asset_id"] == "TSLA"
        assert "total_memories" in data


class TestNewsMemoryService:
    """Test cases for News Memory Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = news_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "News Memory"
        assert self.service.port == 5031

    @pytest.mark.asyncio
    async def test_remember(self):
        """Test storing news memory"""
        result = await self.service.remember(
            headline="AAPL announces new product",
            source="Bloomberg",
            sentiment="positive"
        )
        assert "news_id" in result
        assert result["headline"] == "AAPL announces new product"

    @pytest.mark.asyncio
    async def test_recall_recent(self):
        """Test recalling recent news"""
        # Add some news
        await self.service.remember("News 1", "Reuters", "positive")
        await self.service.remember("News 2", "CNBC", "neutral")

        # Recall recent
        news = await self.service.recall_recent(limit=10)
        assert isinstance(news, list)


class TestNewsMemoryAPI:
    """Test cases for News Memory API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(news_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestEventMemoryService:
    """Test cases for Event Memory Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = event_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Event Memory"
        assert self.service.port == 5032

    @pytest.mark.asyncio
    async def test_remember(self):
        """Test storing event memory"""
        result = await self.service.remember(
            asset_id="NVDA",
            event_type="earnings",
            description="NVDA beats Q4 earnings"
        )
        assert "event_id" in result
        assert result["asset_id"] == "NVDA"


class TestEventMemoryAPI:
    """Test cases for Event Memory API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(event_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestPredictionMemoryService:
    """Test cases for Prediction Memory Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = pred_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Prediction Memory"
        assert self.service.port == 5033

    @pytest.mark.asyncio
    async def test_store_prediction(self):
        """Test storing prediction"""
        result = await self.service.store_prediction(
            symbol="AAPL",
            prediction_type="price",
            predicted_value=200.0,
            confidence=85
        )
        assert "prediction_id" in result
        assert result["symbol"] == "AAPL"

    @pytest.mark.asyncio
    async def test_get_accuracy(self):
        """Test getting prediction accuracy"""
        # Store predictions
        await self.service.store_prediction("GOOGL", "price", 150.0, 80)
        await self.service.store_prediction("GOOGL", "price", 155.0, 85)

        # Get accuracy
        accuracy = await self.service.get_accuracy("GOOGL")
        assert "accuracy" in accuracy or "predictions" in accuracy


class TestPredictionMemoryAPI:
    """Test cases for Prediction Memory API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(pred_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])