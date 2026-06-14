"""
Tests for assetmind-simulation
Simulation services for Monte Carlo, scenarios, and backtesting
Ports: 5200-5209
"""
import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from services.monte_carlo_service import app as monte_app, service as monte_service
from services.scenario_simulator_service import app as scenario_app, service as scenario_service
from services.backtest_service import app as backtest_app, service as backtest_service


class TestMonteCarloService:
    """Test cases for Monte Carlo Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = monte_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Monte Carlo"
        assert self.service.port == 5201

    @pytest.mark.asyncio
    async def test_simulate(self):
        """Test Monte Carlo simulation"""
        result = await self.service.simulate(
            parameters={"mean": 100, "std": 20},
            simulations=1000
        )
        assert result["simulations"] == 1000
        assert "mean" in result
        assert "median" in result
        assert "percentile_5" in result
        assert "percentile_95" in result
        assert "timestamp" in result

    @pytest.mark.asyncio
    async def test_simulate_small_sample(self):
        """Test Monte Carlo with small sample"""
        result = await self.service.simulate({}, simulations=100)
        assert result["simulations"] == 100
        assert "mean" in result

    @pytest.mark.asyncio
    async def test_simulation_stats_valid(self):
        """Test simulation statistics are valid"""
        result = await self.service.simulate({}, simulations=1000)
        assert result["percentile_5"] <= result["median"] <= result["percentile_95"]


class TestMonteCarloAPI:
    """Test cases for Monte Carlo API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(monte_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "Monte Carlo"

    def test_simulate_endpoint(self, client):
        """Test simulate endpoint"""
        response = client.post(
            "/api/v1/simulate",
            json={
                "parameters": {"mean": 100, "std": 15},
                "simulations": 500
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "simulations" in data
        assert "mean" in data


class TestScenarioSimulatorService:
    """Test cases for Scenario Simulator Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = scenario_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Scenario Simulator"
        assert self.service.port == 5202

    @pytest.mark.asyncio
    async def test_simulate_scenario(self):
        """Test scenario simulation"""
        result = await self.service.simulate_scenario("bull")
        assert "scenario" in result or "results" in result


class TestScenarioSimulatorAPI:
    """Test cases for Scenario Simulator API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(scenario_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestBacktestService:
    """Test cases for Backtest Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = backtest_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Backtest"
        assert self.service.port == 5203

    @pytest.mark.asyncio
    async def test_run_backtest(self):
        """Test running backtest"""
        result = await self.service.run_backtest(
            strategy="momentum",
            start_date="2023-01-01",
            end_date="2023-12-31"
        )
        assert "results" in result or "performance" in result or "metrics" in result


class TestBacktestAPI:
    """Test cases for Backtest API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(backtest_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])