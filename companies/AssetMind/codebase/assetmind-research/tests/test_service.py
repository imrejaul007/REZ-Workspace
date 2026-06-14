"""
Tests for assetmind-research
Research services for reports and analysis
Ports: 5190-5199
"""
import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from services.sector_report_service import app as sector_app, service as sector_service
from services.country_report_service import app as country_app, service as country_service
from services.theme_report_service import app as theme_app, service as theme_service
from services.comparative_report_service import app as comp_app, service as comp_service
from services.company_report_service import app as company_app, service as company_service
from services.report_generation_service import app as gen_app, service as gen_service


class TestSectorReportService:
    """Test cases for Sector Report Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = sector_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Sector Report"
        assert self.service.port == 5192

    @pytest.mark.asyncio
    async def test_generate_report(self):
        """Test generating sector report"""
        result = await self.service.generate("Technology")
        assert result["sector"] == "Technology"
        assert result["report_type"] == "sector"
        assert "rating" in result
        assert "top_picks" in result
        assert "timestamp" in result

    @pytest.mark.asyncio
    async def test_report_rating_valid(self):
        """Test report has valid rating"""
        result = await self.service.generate("Healthcare")
        valid_ratings = ["OUTPERFORM", "NEUTRAL", "UNDERPERFORM"]
        assert result["rating"] in valid_ratings


class TestSectorReportAPI:
    """Test cases for Sector Report API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(sector_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "Sector Report"

    def test_generate_report_endpoint(self, client):
        """Test generate report endpoint"""
        response = client.get("/api/v1/report/Technology")
        assert response.status_code == 200
        data = response.json()
        assert data["sector"] == "Technology"


class TestCountryReportService:
    """Test cases for Country Report Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = country_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Country Report"
        assert self.service.port == 5193

    @pytest.mark.asyncio
    async def test_generate_report(self):
        """Test generating country report"""
        result = await self.service.generate("USA")
        assert "country" in result or "report" in result


class TestCountryReportAPI:
    """Test cases for Country Report API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(country_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestThemeReportService:
    """Test cases for Theme Report Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = theme_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Theme Report"
        assert self.service.port == 5194

    @pytest.mark.asyncio
    async def test_generate_report(self):
        """Test generating theme report"""
        result = await self.service.generate("AI")
        assert "theme" in result or "report" in result


class TestThemeReportAPI:
    """Test cases for Theme Report API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(theme_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestComparativeReportService:
    """Test cases for Comparative Report Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = comp_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Comparative Report"
        assert self.service.port == 5195

    @pytest.mark.asyncio
    async def test_generate_report(self):
        """Test generating comparative report"""
        result = await self.service.generate("AAPL", "GOOGL")
        assert "comparisons" in result or "report" in result


class TestComparativeReportAPI:
    """Test cases for Comparative Report API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(comp_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestCompanyReportService:
    """Test cases for Company Report Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = company_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Company Report"
        assert self.service.port == 5191

    @pytest.mark.asyncio
    async def test_generate_report(self):
        """Test generating company report"""
        result = await self.service.generate("AAPL")
        assert "company" in result or "report" in result


class TestCompanyReportAPI:
    """Test cases for Company Report API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(company_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestReportGenerationService:
    """Test cases for Report Generation Service"""

    def setup_method(self):
        """Setup test fixtures"""
        self.service = gen_service

    def test_service_initialization(self):
        """Test service initializes correctly"""
        assert self.service.name == "Report Generation"
        assert self.service.port == 5190

    @pytest.mark.asyncio
    async def test_generate_report(self):
        """Test generating general report"""
        result = await self.service.generate("summary")
        assert "report" in result or "generation" in result


class TestReportGenerationAPI:
    """Test cases for Report Generation API endpoints"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(gen_app)

    def test_health_endpoint(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])