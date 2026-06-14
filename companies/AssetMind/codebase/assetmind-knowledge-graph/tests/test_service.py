"""
Tests for assetmind-knowledge-graph
Knowledge graph services for relationships and entity connections
Ports: 5040-5049
"""
import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from services.knowledge_graph_service import app as kg_app, service as kg_service
from services.graph_query_service import app as query_app, service as query_service
from services.relationship_service import app as rel_app, service as rel_service


class TestKnowledgeGraphService:
    """Test cases for Knowledge Graph Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = kg_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Knowledge Graph"
        assert self.service.port == 5040

    @pytest.mark.asyncio
    async def test_create_node(self):
        """Test creating a node"""
        result = await self.service.create_node(
            node_type="COMPANY",
            properties={"name": "Apple", "symbol": "AAPL"}
        )
        assert "node_id" in result
        assert result["type"] == "COMPANY"
        assert "properties" in result
        assert "created_at" in result

    @pytest.mark.asyncio
    async def test_create_relationship(self):
        """Test creating a relationship"""
        # First create nodes
        await self.service.create_node("COMPANY", {"symbol": "AAPL"})
        await self.service.create_node("COMPANY", {"symbol": "MSFT"})

        result = await self.service.create_relationship(
            from_node_id="company_aapl",
            to_node_id="company_msft",
            relationship_type="PARTNER",
            properties={"strength": 80}
        )
        assert result["from"] == "company_aapl"
        assert result["to"] == "company_msft"
        assert result["type"] == "PARTNER"
        assert "created_at" in result

    @pytest.mark.asyncio
    async def test_get_relationships(self):
        """Test getting relationships"""
        # Create a relationship first
        await self.service.create_node("STOCK", {"symbol": "GOOGL"})
        await self.service.create_node("STOCK", {"symbol": "AMZN"})
        await self.service.create_relationship(
            "stock_googl", "stock_amzn", "COMPETITOR"
        )

        rels = await self.service.get_relationships("stock_googl")
        assert isinstance(rels, list)

    @pytest.mark.asyncio
    async def test_get_relationships_with_type(self):
        """Test getting relationships filtered by type"""
        rels = await self.service.get_relationships(
            "stock_googl",
            relationship_type="COMPETITOR"
        )
        assert isinstance(rels, list)
        for rel in rels:
            assert rel["type"] == "COMPETITOR"

    @pytest.mark.asyncio
    async def test_traverse(self):
        """Test graph traversal"""
        # Create nodes and relationships
        await self.service.create_node("A", {"name": "A"})
        await self.service.create_node("B", {"name": "B"})
        await self.service.create_node("C", {"name": "C"})
        await self.service.create_relationship("a", "b", "LINKS_TO")
        await self.service.create_relationship("b", "c", "LINKS_TO")

        result = await self.service.traverse("a", max_depth=2)
        assert "start_node" in result
        assert "visited_nodes" in result
        assert "visited_count" in result
        assert result["start_node"] == "a"


class TestKnowledgeGraphAPI:
    """Test cases for Knowledge Graph API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(kg_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "Knowledge Graph"

    def test_create_node_endpoint(self, client):
        """Test create node endpoint"""
        response = client.post(
            "/api/v1/nodes",
            json={
                "node_type": "SECTOR",
                "properties": {"name": "Technology"}
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "SECTOR"

    def test_create_relationship_endpoint(self, client):
        """Test create relationship endpoint"""
        # First create nodes
        client.post(
            "/api/v1/nodes",
            json={"node_type": "TEST", "properties": {"id": "1"}}
        )
        client.post(
            "/api/v1/nodes",
            json={"node_type": "TEST", "properties": {"id": "2"}}
        )
        # Then create relationship
        response = client.post(
            "/api/v1/relationships",
            json={
                "from": "test_1",
                "to": "test_2",
                "type": "RELATED"
            }
        )
        assert response.status_code == 200

    def test_get_relationships_endpoint(self, client):
        """Test get relationships endpoint"""
        response = client.get("/api/v1/nodes/test_node/relationships")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_traverse_endpoint(self, client):
        """Test traverse endpoint"""
        response = client.post(
            "/api/v1/traverse",
            json={"start_node": "test_start", "max_depth": 3}
        )
        assert response.status_code == 200
        data = response.json()
        assert "start_node" in data


class TestGraphQueryService:
    """Test cases for Graph Query Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = query_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Graph Query"
        assert self.service.port == 5041

    @pytest.mark.asyncio
    async def test_query(self):
        """Test querying the graph"""
        result = await self.service.query("MATCH (n) RETURN n")
        assert "results" in result or "data" in result or "query" in result


class TestGraphQueryAPI:
    """Test cases for Graph Query API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(query_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestRelationshipService:
    """Test cases for Relationship Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = rel_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Relationship"
        assert self.service.port == 5042

    @pytest.mark.asyncio
    async def test_find_relationships(self):
        """Test finding relationships"""
        result = await self.service.find_relationships("AAPL")
        assert isinstance(result, list) or "relationships" in result


class TestRelationshipAPI:
    """Test cases for Relationship API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(rel_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])