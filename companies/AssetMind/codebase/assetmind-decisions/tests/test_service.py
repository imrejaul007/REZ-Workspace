"""
Tests for assetmind-decisions
Decision services for actionable investment decisions
Ports: 5150-5159
"""
import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from services.decision_engine_service import app as decision_app, service as decision_service
from services.answer_generation_service import app as answer_app, service as answer_service
from services.reasoning_chain_service import app as reasoning_app, service as reasoning_service


class TestDecisionEngineService:
    """Test cases for Decision Engine Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = decision_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Decision Engine"
        assert self.service.port == 5150

    @pytest.mark.asyncio
    async def test_get_decision(self):
        """Test getting a decision"""
        result = await self.service.get_decision("AAPL")
        assert result["asset_id"] == "AAPL"
        assert "action" in result
        assert "reasoning" in result
        assert "confidence" in result
        assert "timestamp" in result

    @pytest.mark.asyncio
    async def test_decision_action_valid(self):
        """Test decision action is valid"""
        result = await self.service.get_decision("GOOGL")
        valid_actions = ["BUY", "HOLD", "REDUCE", "SELL"]
        assert result["action"] in valid_actions

    @pytest.mark.asyncio
    async def test_confidence_range(self):
        """Test confidence is in valid range"""
        result = await self.service.get_decision("MSFT")
        assert 0 <= result["confidence"] <= 100

    @pytest.mark.asyncio
    async def test_reasoning_not_empty(self):
        """Test reasoning is not empty"""
        result = await self.service.get_decision("AMZN")
        assert len(result["reasoning"]) > 0


class TestDecisionEngineAPI:
    """Test cases for Decision Engine API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(decision_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "Decision Engine"

    def test_get_decision_endpoint(self, client):
        """Test get decision endpoint"""
        response = client.get("/api/v1/decide/AAPL")
        assert response.status_code == 200
        data = response.json()
        assert data["asset_id"] == "AAPL"
        assert "action" in data


class TestAnswerGenerationService:
    """Test cases for Answer Generation Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = answer_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Answer Generation"
        assert self.service.port == 5151

    @pytest.mark.asyncio
    async def test_generate_answer(self):
        """Test generating an answer"""
        result = await self.service.generate_answer("Should I buy AAPL?")
        assert "answer" in result or "response" in result


class TestAnswerGenerationAPI:
    """Test cases for Answer Generation API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(answer_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestReasoningChainService:
    """Test cases for Reasoning Chain Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = reasoning_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Reasoning Chain"
        assert self.service.port == 5152

    @pytest.mark.asyncio
    async def test_build_reasoning(self):
        """Test building reasoning chain"""
        result = await self.service.build_reasoning("AAPL", "BUY")
        assert "reasoning" in result or "chain" in result or "steps" in result


class TestReasoningChainAPI:
    """Test cases for Reasoning Chain API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(reasoning_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])