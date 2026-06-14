"""
FRED (Federal Reserve Economic Data) Connector
Source: https://fred.stlouisfed.org/docs/api/fred/
"""
import httpx
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class FREDConnector:
    """Connector for Federal Reserve Economic Data (FRED)"""

    BASE_URL = "https://api.stlouisfed.org/fred"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or ""
        self.client = httpx.AsyncClient(timeout=30.0)

    async def fetch(
        self,
        series_id: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: int = 1000,
    ) -> List[Dict[str, Any]]:
        """
        Fetch data for a FRED series

        Args:
            series_id: FRED series ID (e.g., 'GDP', 'CPIAUCSL', 'FEDFUNDS')
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
            limit: Maximum number of observations

        Returns:
            List of observations with date and value
        """
        if not self.api_key:
            logger.warning("FRED API key not provided, using mock data")
            return self._mock_data(series_id)

        params = {
            "series_id": series_id,
            "api_key": self.api_key,
            "file_type": "json",
            "limit": limit,
        }

        if start_date:
            params["observation_start"] = start_date
        if end_date:
            params["observation_end"] = end_date

        try:
            response = await self.client.get(
                f"{self.BASE_URL}/series/observations",
                params=params
            )
            response.raise_for_status()
            data = response.json()

            observations = data.get("observations", [])
            return [
                {
                    "date": obs["date"],
                    "value": float(obs["value"]) if obs["value"] != "." else None,
                    "series_id": series_id,
                }
                for obs in observations
            ]
        except Exception as e:
            logger.error(f"Error fetching FRED data for {series_id}: {e}")
            return self._mock_data(series_id)

    async def search_series(
        self,
        query: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Search for FRED series by keyword"""
        if not self.api_key:
            return self._mock_search(query)

        params = {
            "search_text": query,
            "api_key": self.api_key,
            "file_type": "json",
            "limit": limit,
        }

        try:
            response = await self.client.get(
                f"{self.BASE_URL}/series/search",
                params=params
            )
            response.raise_for_status()
            data = response.json()

            return [
                {
                    "id": s["id"],
                    "title": s["title"],
                    "units": s.get("units", ""),
                    "frequency": s.get("frequency", ""),
                }
                for s in data.get("seriess", [])
            ]
        except Exception as e:
            logger.error(f"Error searching FRED: {e}")
            return self._mock_search(query)

    async def get_category_series(
        self,
        category_id: int,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get all series in a FRED category"""
        if not self.api_key:
            return []

        params = {
            "category_id": category_id,
            "api_key": self.api_key,
            "file_type": "json",
            "limit": limit,
        }

        try:
            response = await self.client.get(
                f"{self.BASE_URL}/category/series",
                params=params
            )
            response.raise_for_status()
            data = response.json()
            return data.get("seriess", [])
        except Exception as e:
            logger.error(f"Error fetching category series: {e}")
            return []

    async def get_releases(
        self,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get all FRED releases"""
        if not self.api_key:
            return []

        params = {
            "api_key": self.api_key,
            "file_type": "json",
            "limit": limit,
        }

        try:
            response = await self.client.get(
                f"{self.BASE_URL}/release/releases",
                params=params
            )
            response.raise_for_status()
            data = response.json()
            return data.get("releases", [])
        except Exception as e:
            logger.error(f"Error fetching releases: {e}")
            return []

    async def get_latest_release(
        self,
        release_id: int
    ) -> Dict[str, Any]:
        """Get the latest data for a release"""
        if not self.api_key:
            return {}

        params = {
            "release_id": release_id,
            "api_key": self.api_key,
            "file_type": "json",
        }

        try:
            response = await self.client.get(
                f"{self.BASE_URL}/release",
                params=params
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error fetching release: {e}")
            return {}

    def _mock_data(self, series_id: str) -> List[Dict[str, Any]]:
        """Generate mock data for testing"""
        import random

        mock_series = {
            "GDP": {"value": 28000.0, "trend": 0.02},
            "CPIAUCSL": {"value": 300.0, "trend": 0.003},
            "FEDFUNDS": {"value": 5.25, "trend": 0},
            "UNRATE": {"value": 3.9, "trend": -0.001},
            "PAYEMS": {"value": 157000, "trend": 0.001},
        }

        base = mock_series.get(series_id, {"value": 100.0, "trend": 0})
        base_value = base["value"]
        trend = base["trend"]

        observations = []
        current_date = datetime.now()

        for i in range(100):
            date = current_date - timedelta(days=i * 7)
            value = base_value * (1 + trend * (100 - i) / 100) + random.uniform(-0.01, 0.01) * base_value

            observations.append({
                "date": date.strftime("%Y-%m-%d"),
                "value": round(value, 2),
                "series_id": series_id,
            })

        return observations

    def _mock_search(self, query: str) -> List[Dict[str, Any]]:
        """Generate mock search results"""
        all_series = [
            {"id": "GDP", "title": "Gross Domestic Product", "units": "Billions", "frequency": "Quarterly"},
            {"id": "CPIAUCSL", "title": "Consumer Price Index for All Urban Consumers", "units": "Index", "frequency": "Monthly"},
            {"id": "FEDFUNDS", "title": "Federal Funds Rate", "units": "Percent", "frequency": "Monthly"},
            {"id": "UNRATE", "title": "Unemployment Rate", "units": "Percent", "frequency": "Monthly"},
            {"id": "PAYEMS", "title": "All Employees Total Nonfarm", "units": "Thousands", "frequency": "Monthly"},
            {"id": "PCEPI", "title": "PCE Price Index", "units": "Index", "frequency": "Monthly"},
            {"id": "M2SL", "title": "M2 Money Stock", "units": "Billions", "frequency": "Weekly"},
            {"id": "DGS10", "title": "10-Year Treasury Rate", "units": "Percent", "frequency": "Daily"},
            {"id": "DGS2", "title": "2-Year Treasury Rate", "units": "Percent", "frequency": "Daily"},
            {"id": "HOUST", "title": "Housing Starts", "units": "Thousands", "frequency": "Monthly"},
        ]

        query_lower = query.lower()
        return [
            s for s in all_series
            if query_lower in s["id"].lower() or query_lower in s["title"].lower()
][:5]

    async def close(self):
        await self.client.aclose()


# Common FRED series IDs
FRED_SERIES = {
    # GDP and Growth
    "GDP": "Gross Domestic Product",
    "GDPC1": "Real Gross Domestic Product",
    "A191RL1Q225SBEA": "Real GDP Growth Rate",

    # Inflation
    "CPIAUCSL": "Consumer Price Index",
    "PCEPI": "PCE Price Index",
    "PPIACO": "Producer Price Index",

    # Interest Rates
    "FEDFUNDS": "Federal Funds Rate",
    "DGS10": "10-Year Treasury",
    "DGS2": "2-Year Treasury",
    "MORTGAGE30US": "30-Year Mortgage Rate",

    # Employment
    "UNRATE": "Unemployment Rate",
    "PAYEMS": "Nonfarm Payrolls",
    "ICSA": "Initial Jobless Claims",
    "JOBOPENINGS": "Job Openings",

    # Consumer
    "PCE": "Personal Consumption Expenditures",
    "DPCERA": "Real Personal Consumption",

    # Money Supply
    "M2SL": "M2 Money Supply",
    "M2V": "M2 Velocity",

    # Housing
    "HOUST": "Housing Starts",
    "CSUSHPINSA": "Case-Shiller Home Price",
    "PERMIT": "Building Permits",
}
