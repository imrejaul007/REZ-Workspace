"""
Tests for assetmind-api
"""
import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from services.api_gateway_service import app, service


class TestAPIGatewayService:
    """Test cases for API Gateway Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "API Gateway"
        assert self.service.port == 5260
        assert len(self.service._routes) > 0

    @pytest.mark.asyncio
    async def test_create_api_key(self):
        """Test API key creation"""
        result = await self.service.create_api_key(
            key_name="test-key",
            permissions=["read", "write"],
            rate_limit=100
        )
        assert "key_id" in result
        assert "api_key" in result
        assert result["key_name"] == "test-key"

    @pytest.mark.asyncio
    async def test_get_services(self):
        """Test getting services"""
        services = await self.service.get_services()
        assert isinstance(services, list)
        assert len(services) > 0

    @pytest.mark.asyncio
    async def test_get_metrics(self):
        """Test getting metrics"""
        metrics = await self.service.get_metrics()
        assert "registered_services" in metrics
        assert "active_api_keys" in metrics

    @pytest.mark.asyncio
    async def test_register_service(self):
        """Test service registration"""
        route = await self.service.register_service(
            service_name="test-service",
            port=9999,
            path_prefix="/api/v1/test"
        )
        assert route.service_name == "test-service"
        assert route.port == 9999


class TestAPIGatewayAPI:
    """Test cases for API Gateway endpoints"""

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
        assert data["port"] == 5260

    def test_get_services_endpoint(self, client):
        """Test get services endpoint"""
        response = client.get("/api/v1/services")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_get_metrics_endpoint(self, client):
        """Test get metrics endpoint"""
        response = client.get("/api/v1/metrics")
        assert response.status_code == 200
        assert "registered_services" in response.json()

    def test_create_api_key_endpoint(self, client):
        """Test create API key endpoint"""
        response = client.post(
            "/api/v1/api-keys",
            json={"key_name": "test-api-key", "permissions": ["read"]}
        )
        assert response.status_code == 200
        data = response.json()
        assert "api_key" in data

    def test_get_routes_endpoint(self, client):
        """Test get routes endpoint"""
        response = client.get("/api/v1/routes")
        assert response.status_code == 200
        data = response.json()
        assert "routes" in data
        assert "total" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])