"""
Tests for assetmind-admin
"""
import pytest
from httpx import AsyncClient, ASGITransport
from fastapi.testclient import TestClient
import sys
import os

# Add the service to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from services.admin_service import app, service, AdminService


class TestAdminService:
    """Test cases for Admin Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = AdminService()
        self.app = app

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Admin Service"
        assert self.service.port == 5280
        assert self.service.version == "1.0.0"
        assert len(self.service._services) > 0  # Should have default services

    def test_register_service(self):
        """Test service registration"""
        result = self.service.register_service("test-service", 9999, "1.0.0")
        assert result.service_name == "test-service"
        assert result.port == 9999
        assert result.version == "1.0.0"
        assert result.status.value == "healthy"

    @pytest.mark.asyncio
    async def test_get_system_metrics(self):
        """Test getting system metrics"""
        metrics = await self.service.get_system_metrics()
        assert metrics.total_services > 0
        assert metrics.healthy_services >= 0
        assert metrics.total_errors >= 0

    @pytest.mark.asyncio
    async def test_create_user(self):
        """Test user creation"""
        user = await self.service.create_user(
            username="testuser",
            email="test@example.com",
            role="user"
        )
        assert user.username == "testuser"
        assert user.email == "test@example.com"
        assert user.role == "user"

    @pytest.mark.asyncio
    async def test_get_services(self):
        """Test getting services list"""
        services = await self.service.get_services()
        assert isinstance(services, list)
        assert len(services) > 0
        assert "service_name" in services[0]


class TestAdminAPI:
    """Test cases for Admin API endpoints"""

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
        assert data["service"] == "Admin Service"
        assert data["port"] == 5280

    def test_get_services_endpoint(self, client):
        """Test get services endpoint"""
        response = client.get("/api/v1/services")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_get_metrics_endpoint(self, client):
        """Test get metrics endpoint"""
        response = client.get("/api/v1/metrics")
        assert response.status_code == 200
        data = response.json()
        assert "total_services" in data
        assert "healthy_services" in data

    def test_list_users_endpoint(self, client):
        """Test list users endpoint"""
        response = client.get("/api/v1/users")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_create_user_endpoint(self, client):
        """Test create user endpoint"""
        response = client.post(
            "/api/v1/users",
            json={
                "username": "newuser",
                "email": "newuser@example.com",
                "password": "password123",
                "role": "user"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "newuser"

    def test_get_audit_log_endpoint(self, client):
        """Test get audit log endpoint"""
        response = client.get("/api/v1/audit-log?limit=10")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])