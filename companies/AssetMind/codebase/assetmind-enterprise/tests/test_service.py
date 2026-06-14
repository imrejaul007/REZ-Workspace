"""
Tests for assetmind-enterprise
Enterprise services for teams and collaboration
Ports: 5220-5229
"""
import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from services.team_service import app as team_app, service as team_service
from services.collaboration_service import app as collab_app, service as collab_service
from services.permissions_service import app as perm_app, service as perm_service
from services.audit_service import app as audit_app, service as audit_service
from services.custom_agent_service import app as agent_app, service as agent_service


class TestTeamService:
    """Test cases for Team Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = team_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Team Service"
        assert self.service.port == 5220

    @pytest.mark.asyncio
    async def test_create_team(self):
        """Test creating a team"""
        result = await self.service.create_team("Alpha Traders", "owner123")
        assert "team_id" in result
        assert result["name"] == "Alpha Traders"
        assert result["owner_id"] == "owner123"
        assert "members" in result
        assert "created_at" in result

    @pytest.mark.asyncio
    async def test_team_id_format(self):
        """Test team ID format"""
        result = await self.service.create_team("Beta Group", "owner456")
        assert result["team_id"].startswith("team_")


class TestTeamAPI:
    """Test cases for Team API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(team_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "Team Service"

    def test_create_team_endpoint(self, client):
        """Test create team endpoint"""
        response = client.post(
            "/api/v1/teams",
            json={
                "team_name": "Test Team",
                "owner_id": "user123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Team"


class TestCollaborationService:
    """Test cases for Collaboration Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = collab_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Collaboration"
        assert self.service.port == 5221

    @pytest.mark.asyncio
    async def test_collaborate(self):
        """Test collaboration"""
        result = await self.service.collaborate("team123", "user456")
        assert "team_id" in result or "collaboration" in result


class TestCollaborationAPI:
    """Test cases for Collaboration API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(collab_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestPermissionsService:
    """Test cases for Permissions Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = perm_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Permissions"
        assert self.service.port == 5222

    @pytest.mark.asyncio
    async def test_check_permission(self):
        """Test checking permissions"""
        result = await self.service.check_permission("user123", "trade")
        assert "allowed" in result or "permission" in result or "granted" in result


class TestPermissionsAPI:
    """Test cases for Permissions API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(perm_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestAuditService:
    """Test cases for Audit Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = audit_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Audit"
        assert self.service.port == 5223

    @pytest.mark.asyncio
    async def test_get_audit_log(self):
        """Test getting audit log"""
        result = await self.service.get_audit_log("team123")
        assert isinstance(result, list) or "logs" in result


class TestAuditAPI:
    """Test cases for Audit API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(audit_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestCustomAgentService:
    """Test cases for Custom Agent Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = agent_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Custom Agent"
        assert self.service.port == 5224

    @pytest.mark.asyncio
    async def test_create_agent(self):
        """Test creating custom agent"""
        result = await self.service.create_agent("momentum_trader")
        assert "agent_id" in result or "agent" in result


class TestCustomAgentAPI:
    """Test cases for Custom Agent API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(agent_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])