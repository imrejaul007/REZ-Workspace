"""
Tests for assetmind-gateway
"""
import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from services.websocket_gateway import app, service


class TestWebSocketGatewayService:
    """Test cases for WebSocket Gateway Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "WebSocket Gateway"
        assert self.service.port == 5261
        assert len(self.service._channels) > 0

    @pytest.mark.asyncio
    async def test_get_channels(self):
        """Test getting channels"""
        channels = await self.service.get_channels()
        assert isinstance(channels, list)
        assert len(channels) > 0

    @pytest.mark.asyncio
    async def test_get_metrics(self):
        """Test getting metrics"""
        metrics = await self.service.get_metrics()
        assert "total_connections" in metrics
        assert "total_channels" in metrics
        assert "uptime_seconds" in metrics


class TestWebSocketGatewayAPI:
    """Test cases for WebSocket Gateway endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["port"] == 5261

    def test_get_channels_endpoint(self, client):
        """Test get channels endpoint"""
        response = client.get("/api/v1/channels")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_get_metrics_endpoint(self, client):
        """Test get metrics endpoint"""
        response = client.get("/api/v1/metrics")
        assert response.status_code == 200
        assert "total_connections" in response.json()

    def test_broadcast_endpoint(self, client):
        """Test broadcast endpoint"""
        response = client.post(
            "/api/v1/broadcast",
            json={"channel": "test", "message": {"text": "Hello"}}
        )
        assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])