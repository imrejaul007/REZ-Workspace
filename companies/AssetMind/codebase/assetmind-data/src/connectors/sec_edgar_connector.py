"""
AssetMind - SEC EDGAR Connector
SEC filings and financial data (FREE)
"""

import asyncio
import logging
import re
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

import requests

from connectors.base_connector import BaseConnector


@dataclass
class SECConfig:
    rate_limit: int = 10  # 10 requests/second max
    user_agent: str = "AssetMind assetmind.ai research@assetmind.ai"


class SECEdgarConnector(BaseConnector):
    """
    Connector for SEC EDGAR.

    Free access to all SEC filings.
    - 10 requests per second limit
    - No API key required
    - Covers all SEC filings: 10-K, 10-Q, 8-K, 13F, etc.
    """

    BASE_URL = "https://data.sec.gov/submissions"
    FILINGS_URL = "https://www.sec.gov/cgi-bin/browse-edgar"

    def __init__(self, config: SECConfig = None):
        config = config or SECConfig()
        super().__init__({"source_name": "sec_edgar", "rate_limit": config.rate_limit})
        self.source_name = "sec_edgar"
        self.rate_limit = config.rate_limit
        self.user_agent = config.user_agent
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": self.user_agent})

    async def get_company_filings(self, cik: str) -> Dict[str, Any]:
        """
        Get all filings for a company.

        Args:
            cik: Central Index Key (e.g., '0001326801' for NVDA)

        Returns:
            Company filing data
        """
        url = f"{self.BASE_URL}/CIK{cik}.json"
        response = self.session.get(url)

        if response.status_code != 200:
            raise Exception(f"Failed to fetch filings: {response.status_code}")

        data = response.json()
        return self._transform_filings(data)

    async def get_filing(self, cik: str, accession_number: str) -> Dict[str, Any]:
        """
        Get a specific filing.

        Args:
            cik: Company CIK
            accession_number: Filing accession number

        Returns:
            Filing data
        """
        # Search for filing in company filings
        company_filings = await self.get_company_filings(cik)

        for filing_type, filings in company_filings.get("recent_filings", {}).items():
            for filing in filings:
                if filing.get("accessionNumber") == accession_number:
                    return filing

        raise Exception(f"Filing not found: {accession_number}")

    async def get_10k(self, cik: str, year: int = None) -> Dict[str, Any]:
        """
        Get 10-K annual reports.

        Args:
            cik: Company CIK
            year: Specific year (optional)

        Returns:
            List of 10-K filings
        """
        filings = await self.get_company_filings(cik)

        ten_k_filings = []
        for filing in filings.get("all_filings", []):
            if filing.get("form") == "10-K":
                if year:
                    filing_year = int(filing.get("filingDate", "")[:4])
                    if filing_year == year:
                        ten_k_filings.append(filing)
                else:
                    ten_k_filings.append(filing)

        return {"filings": ten_k_filings, "cik": cik}

    async def get_10q(self, cik: str, year: int = None, quarter: int = None) -> Dict[str, Any]:
        """
        Get 10-Q quarterly reports.

        Args:
            cik: Company CIK
            year: Specific year (optional)
            quarter: Specific quarter (optional)

        Returns:
            List of 10-Q filings
        """
        filings = await self.get_company_filings(cik)

        ten_q_filings = []
        for filing in filings.get("all_filings", []):
            if filing.get("form") == "10-Q":
                if year:
                    filing_year = int(filing.get("filingDate", "")[:4])
                    if filing_year == year:
                        ten_q_filings.append(filing)
                else:
                    ten_q_filings.append(filing)

        return {"filings": ten_q_filings, "cik": cik}

    async def get_8k(self, cik: str, days: int = 30) -> Dict[str, Any]:
        """
        Get 8-K current reports.

        Args:
            cik: Company CIK
            days: Number of days to look back

        Returns:
            List of 8-K filings
        """
        filings = await self.get_company_filings(cik)

        cutoff = datetime.utcnow() - timedelta(days=days)
        eight_k_filings = []

        for filing in filings.get("all_filings", []):
            if filing.get("form") == "8-K":
                filing_date = datetime.strptime(filing.get("filingDate", ""), "%Y-%m-%d")
                if filing_date >= cutoff:
                    eight_k_filings.append(filing)

        return {"filings": eight_k_filings, "cik": cik}

    async def get_13f(self, cik: str) -> Dict[str, Any]:
        """
        Get 13-F institutional holdings reports.

        Args:
            cik: Company CIK

        Returns:
            List of 13-F filings
        """
        filings = await self.get_company_filings(cik)

        thirteen_f_filings = []
        for filing in filings.get("all_filings", []):
            if filing.get("form") == "13F-HR":
                thirteen_f_filings.append(filing)

        return {"filings": thirteen_f_filings, "cik": cik}

    async def search_company(self, company_name: str) -> List[Dict[str, Any]]:
        """
        Search for companies by name.

        Args:
            company_name: Company name to search

        Returns:
            List of matching companies
        """
        url = "https://www.sec.gov/cgi-bin/browse-edgar"
        params = {
            "company": company_name,
            "action": "getcompany",
            "output": "atom"
        }

        response = self.session.get(url, params=params)

        if response.status_code != 200:
            return []

        # Parse XML response
        # In production, use xml.etree.ElementTree
        return []

    async def get_company_tickers(self) -> Dict[str, Any]:
        """
        Get all company tickers.

        Returns:
            Dictionary of ticker -> company info
        """
        url = "https://www.sec.gov/files/company_tickers.json"
        response = self.session.get(url)

        if response.status_code != 200:
            raise Exception("Failed to fetch tickers")

        return response.json()

    def get_cik_from_ticker(self, ticker: str, tickers_data: Dict = None) -> str:
        """
        Get CIK from ticker symbol.

        Args:
            ticker: Stock ticker
            tickers_data: Optional cached tickers data

        Returns:
            CIK as string
        """
        if not tickers_data:
            import requests
            response = requests.get(
                "https://www.sec.gov/files/company_tickers.json",
                headers={"User-Agent": self.user_agent}
            )
            tickers_data = response.json()

        # Search through tickers
        for entry in tickers_data.values():
            if entry.get("ticker", "").upper() == ticker.upper():
                return str(entry.get("cik_str")).zfill(10)

        return None

    def _transform_filings(self, data: Dict) -> Dict[str, Any]:
        """Transform SEC filings data to standard format"""
        recent = data.get("filings", {}).get("recent", {})

        all_filings = []
        for i, filing_date in enumerate(recent.get("filingDate", [])):
            filing = {
                "accession_number": recent.get("accessionNumber", [])[i],
                "filing_date": filing_date,
                "form": recent.get("form", [])[i],
                "document_count": recent.get("documents", [])[i],
            }
            all_filings.append(filing)

        return {
            "cik": data.get("cik"),
            "company_name": data.get("name"),
            "ticker": data.get("tickers", [None])[0] if data.get("tickers") else None,
            "sic": data.get("sic"),
            "state_of_incorporation": data.get("stateOfIncorporation"),
            "fiscal_year_end": data.get("fiscalYearEnd"),
            "recent_filings": {"recent": recent},
            "all_filings": all_filings,
            "source": "sec_edgar",
            "timestamp": datetime.utcnow().isoformat()
        }

    async def transform(self, raw_data: Any) -> List[Dict[str, Any]]:
        """Transform raw data"""
        if isinstance(raw_data, list):
            return raw_data
        return [raw_data]


# =============================================================================
// USAGE EXAMPLES
// =============================================================================

async def main():
    """Example usage"""
    connector = SECEdgarConnector()

    # Get CIK from ticker
    tickers = await connector.get_company_tickers()
    nvidia_cik = connector.get_cik_from_ticker("NVDA", tickers)
    logger.debug(f"NVDA CIK: {nvidia_cik}")

    # Get all filings
    if nvidia_cik:
        filings = await connector.get_company_filings(nvidia_cik)
        logger.debug(f"Company: {filings['company_name']}")
        logger.debug(f"Recent filings: {len(filings.get('all_filings', []))}")

        # Get 10-K annual reports
        ten_k = await connector.get_10k(nvidia_cik)
        logger.debug(f"10-K filings: {len(ten_k['filings'])}")

        # Get recent 8-K filings
        eight_k = await connector.get_8k(nvidia_cik, days=60)
        logger.debug(f"8-K filings (60 days): {len(eight_k['filings'])}")


if __name__ == "__main__":
    asyncio.run(main())
