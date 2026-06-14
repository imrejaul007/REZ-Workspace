"""
World Bank Open Data Connector
Source: https://data.worldbank.org/
Free, no API key required
"""
import httpx
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class WorldBankConnector:
    """Connector for World Bank Open Data"""

    BASE_URL = "https://api.worldbank.org/v2"

    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)

    async def get_countries(self) -> List[Dict[str, Any]]:
        """Get all countries"""
        try:
            response = await self.client.get(
                f"{self.BASE_URL}/country",
                params={"format": "json", "per_page": 500}
            )
            response.raise_for_status()
            data = response.json()

            return [
                self._transform_country(c)
                for c in data[1] if c.get("id") != "WLD"
            ]
        except Exception as e:
            logger.error(f"Error fetching countries: {e}")
            return []

    async def get_country(
        self,
        country_code: str
    ) -> Optional[Dict[str, Any]]:
        """Get country details"""
        try:
            response = await self.client.get(
                f"{self.BASE_URL}/country/{country_code}",
                params={"format": "json"}
            )
            response.raise_for_status()
            data = response.json()

            if data and len(data) > 1 and data[1]:
                return self._transform_country(data[1][0])
            return None
        except Exception as e:
            logger.error(f"Error fetching country {country_code}: {e}")
            return None

    async def get_indicators(
        self,
        country_code: str,
        indicator: str,
        start_year: Optional[int] = None,
        end_year: Optional[int] = None,
        per_page: int = 100
    ) -> List[Dict[str, Any]]:
        """Get indicator data for a country"""
        params = {"format": "json", "per_page": per_page}
        if start_year:
            params["date"] = f"{start_year}:{end_year or datetime.now().year}"

        try:
            response = await self.client.get(
                f"{self.BASE_URL}/country/{country_code}/indicator/{indicator}",
                params=params
            )
            response.raise_for_status()
            data = response.json()

            if data and len(data) > 1:
                return [
                    self._transform_indicator(obs)
                    for obs in data[1] if obs.get("value") is not None
                ]
            return []
        except Exception as e:
            logger.error(f"Error fetching indicator {indicator}: {e}")
            return []

    async def get_all_indicators(self) -> List[Dict[str, Any]]:
        """Get all available indicators"""
        try:
            response = await self.client.get(
                f"{self.BASE_URL}/indicator",
                params={"format": "json", "per_page": 1000}
            )
            response.raise_for_status()
            data = response.json()

            return [
                {
                    "id": ind.get("id"),
                    "name": ind.get("name"),
                    "description": ind.get("sourceNote", "")[:500],
                    "topics": [t.get("value") for t in ind.get("topics", [])],
                }
                for ind in data[1]
            ]
        except Exception as e:
            logger.error(f"Error fetching indicators: {e}")
            return []

    def _transform_country(self, c: Dict) -> Dict[str, Any]:
        """Transform country data"""
        return {
            "id": c.get("id"),
            "name": c.get("name"),
            "region": c.get("region", {}).get("value"),
            "income_level": c.get("incomeLevel", {}).get("value"),
            "lending_type": c.get("lendingType", {}).get("value"),
            "capital": c.get("capitalCity"),
            "longitude": c.get("longitude"),
            "latitude": c.get("latitude"),
        }

    def _transform_indicator(self, obs: Dict) -> Dict[str, Any]:
        """Transform indicator observation"""
        return {
            "country": obs.get("country", {}).get("value"),
            "country_id": obs.get("countryiso3code"),
            "date": obs.get("date"),
            "value": obs.get("value"),
            "indicator": obs.get("indicator", {}).get("value"),
            "indicator_id": obs.get("indicator", {}).get("id"),
        }

    async def close(self):
        await self.client.aclose()


# Common World Bank Indicators
WB_INDICATORS = {
    "gdp": "NY.GDP.MKTP.CD",
    "gdp_growth": "NY.GDP.MKTP.KD.ZG",
    "gdp_per_capita": "NY.GDP.PCAP.CD",
    "inflation": "FP.CPI.TOTL.ZG",
    "unemployment": "SL.UEM.TOTL.ZS",
    "population": "SP.POP.TOTL",
    "pop_growth": "SP.POP.GROW",
    "birth_rate": "SP.DYN.CBRT.IN",
    "death_rate": "SP.DYN.CDRT.IN",
    "exports": "NE.EXP.GNFS.ZS",
    "imports": "NE.IMP.GNFS.ZS",
    "fdi": "BX.KLT.DINV.CD.WD",
}