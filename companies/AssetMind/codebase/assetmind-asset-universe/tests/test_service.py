"""
Tests for assetmind-asset-universe
Asset universe service for managing the asset registry
Port: 5001
"""
import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from services.asset_registry_service import app


class TestAssetUniverseService:
    """Test cases for Asset Universe Service"""

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
        assert data["service"] == "assetmind-asset-universe"
        assert data["port"] == 5001
        assert "version" in data
        assert "total_assets" in data

    def test_create_asset(self, client):
        """Test creating a new asset"""
        response = client.post(
            "/assets",
            json={
                "symbol": "TEST",
                "name": "Test Corporation",
                "asset_class": "STOCK",
                "exchange": "NASDAQ",
                "country": "US",
                "currency": "USD"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["symbol"] == "TEST"
        assert data["name"] == "Test Corporation"
        assert data["asset_class"] == "STOCK"

    def test_get_asset(self, client):
        """Test getting an asset by symbol"""
        # First create an asset
        client.post(
            "/assets",
            json={
                "symbol": "GETTEST",
                "name": "Get Test Corp",
                "asset_class": "STOCK",
                "currency": "USD"
            }
        )
        # Then get it
        response = client.get("/assets/GETTEST")
        assert response.status_code == 200
        data = response.json()
        assert data["symbol"] == "GETTEST"

    def test_get_asset_not_found(self, client):
        """Test getting a non-existent asset"""
        response = client.get("/assets/NOTFOUND")
        assert response.status_code == 404

    def test_list_assets(self, client):
        """Test listing assets"""
        response = client.get("/assets")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_list_assets_with_limit(self, client):
        """Test listing assets with limit"""
        response = client.get("/assets?limit=5")
        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 5

    def test_update_asset(self, client):
        """Test updating an asset"""
        # First create
        client.post(
            "/assets",
            json={
                "symbol": "UPDATETEST",
                "name": "Update Test Corp",
                "asset_class": "STOCK",
                "currency": "USD"
            }
        )
        # Then update
        response = client.patch(
            "/assets/UPDATETEST",
            json={"name": "Updated Name", "status": "ACTIVE"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"

    def test_search_assets(self, client):
        """Test searching assets"""
        response = client.get("/search?query=AAPL")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_search_assets_no_results(self, client):
        """Test searching for non-existent assets"""
        response = client.get("/search?query=NOTEXIST123456")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_get_stats(self, client):
        """Test getting asset universe statistics"""
        response = client.get("/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_assets" in data
        assert "by_asset_class" in data
        assert "phase1_target" in data
        assert "phase1_progress" in data

    def test_bootstrap_phase1(self, client):
        """Test bootstrapping Phase 1 assets"""
        response = client.post("/bootstrap/phase1")
        assert response.status_code == 200
        data = response.json()
        assert "assets_added" in data
        assert "total_assets" in data

    def test_create_duplicate_asset(self, client):
        """Test creating a duplicate asset fails"""
        # Create asset
        client.post(
            "/assets",
            json={
                "symbol": "DUPLICATE",
                "name": "Duplicate Corp",
                "asset_class": "STOCK",
                "currency": "USD"
            }
        )
        # Try to create again
        response = client.post(
            "/assets",
            json={
                "symbol": "DUPLICATE",
                "name": "Duplicate Corp 2",
                "asset_class": "STOCK",
                "currency": "USD"
            }
        )
        assert response.status_code == 409


class TestAssetValidation:
    """Test asset validation"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)

    def test_asset_class_validation(self, client):
        """Test asset class is validated"""
        response = client.post(
            "/assets",
            json={
                "symbol": "VALIDTEST",
                "name": "Valid Test Corp",
                "asset_class": "STOCK",
                "currency": "USD"
            }
        )
        assert response.status_code == 201

    def test_asset_response_fields(self, client):
        """Test asset response contains all required fields"""
        response = client.post(
            "/assets",
            json={
                "symbol": "FIELDTEST",
                "name": "Field Test Corp",
                "asset_class": "CRYPTO",
                "exchange": "GLOBAL",
                "currency": "USD"
            }
        )
        assert response.status_code == 201
        data = response.json()
        required_fields = ["id", "symbol", "name", "asset_class", "status",
                          "created_at", "updated_at", "currency"]
        for field in required_fields:
            assert field in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])