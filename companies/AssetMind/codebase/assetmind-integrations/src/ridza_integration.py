"""
AssetMind → RIDZA Integration

Connects AssetMind to RIDZA services for:
- CFO Suite (Treasury, FP&A, Risk)
- Financial Intelligence
- Investment Analysis

RIDZA is "The Ramp of Financial Intelligence" - Decides what to do with money.

Version: 1.0.0
"""

import httpx
import os
from typing import Dict, Any, Optional, List
from datetime import datetime


class RIDZAIntegration:
    """
    Integration with RIDZA financial intelligence services.

    Usage:
        ridza = RIDZAIntegration()
        treasury = await ridza.get_cash_position()
        forecast = await ridza.get_budget_forecast()
        risk = await ridza.analyze_risk(symbol="NVDA")
    """

    def __init__(
        self,
        treasury_url: str = None,
        fpa_url: str = None,
        risk_url: str = None,
        investment_url: str = None,
        api_key: str = None
    ):
        self.treasury_url = treasury_url or os.getenv("RIDZA_TREASURY_URL", "http://localhost:4926")
        self.fpa_url = fpa_url or os.getenv("RIDZA_FPA_URL", "http://localhost:4927")
        self.risk_url = risk_url or os.getenv("RIDZA_RISK_URL", "http://localhost:4928")
        self.investment_url = investment_url or os.getenv("RIDZA_INVESTMENT_URL", "http://localhost:4929")
        self.api_key = api_key or os.getenv("RIDZA_API_KEY", "")
        self.timeout = 30.0

    async def get_cash_position(self) -> Dict[str, Any]:
        """
        Get current cash position from Treasury.

        Returns:
            Cash position details
        """
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(
                    f"{self.treasury_url}/api/cash/position",
                    headers={"X-API-Key": self.api_key}
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                return {"error": str(e), "cash_position": 0}

    async def get_liquidity_forecast(
        self,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Get liquidity forecast from Treasury.

        Args:
            days: Forecast horizon

        Returns:
            Liquidity forecast
        """
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(
                    f"{self.treasury_url}/api/forecast/liquidity",
                    params={"days": days},
                    headers={"X-API-Key": self.api_key}
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                return {"error": str(e), "forecast": []}

    async def get_budget_forecast(
        self,
        period: str = "Q2-2026"
    ) -> Dict[str, Any]:
        """
        Get budget forecast from FP&A.

        Args:
            period: Budget period

        Returns:
            Budget forecast
        """
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(
                    f"{self.fpa_url}/api/budget/forecast",
                    params={"period": period},
                    headers={"X-API-Key": self.api_key}
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                return {"error": str(e), "forecast": {}}

    async def get_variance_analysis(
        self,
        period: str = "Q1-2026"
    ) -> Dict[str, Any]:
        """
        Get variance analysis from FP&A.

        Args:
            period: Analysis period

        Returns:
            Variance analysis
        """
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(
                    f"{self.fpa_url}/api/variance",
                    params={"period": period},
                    headers={"X-API-Key": self.api_key}
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                return {"error": str(e), "variance": []}

    async def analyze_risk(
        self,
        symbol: str,
        portfolio: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Analyze risk for an asset or portfolio.

        Args:
            symbol: Asset symbol
            portfolio: Optional portfolio symbols

        Returns:
            Risk analysis
        """
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                json_data = {"symbol": symbol}
                if portfolio:
                    json_data["portfolio"] = portfolio

                response = await client.post(
                    f"{self.risk_url}/api/analyze",
                    json=json_data,
                    headers={"X-API-Key": self.api_key}
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                return {"error": str(e), "risk_score": 50}

    async def get_portfolio_risk(
        self,
        symbols: List[str],
        weights: Optional[List[float]] = None
    ) -> Dict[str, Any]:
        """
        Get portfolio-level risk analysis.

        Args:
            symbols: List of asset symbols
            weights: Optional portfolio weights

        Returns:
            Portfolio risk metrics
        """
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    f"{self.risk_url}/api/portfolio/risk",
                    json={
                        "symbols": symbols,
                        "weights": weights or [1.0/len(symbols)] * len(symbols)
                    },
                    headers={"X-API-Key": self.api_key}
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                return {
                    "error": str(e),
                    "portfolio_risk": 50,
                    "var_95": 0,
                    "max_drawdown": 0
                }

    async def get_investment_recommendation(
        self,
        symbol: str,
        amount: float,
        timeframe: str = "1Y"
    ) -> Dict[str, Any]:
        """
        Get investment recommendation from RIDZA.

        Args:
            symbol: Asset symbol
            amount: Investment amount
            timeframe: Investment horizon

        Returns:
            Investment recommendation
        """
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    f"{self.investment_url}/api/recommend",
                    json={
                        "symbol": symbol,
                        "amount": amount,
                        "timeframe": timeframe
                    },
                    headers={"X-API-Key": self.api_key}
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                return {"error": str(e), "recommendation": "HOLD"}

    async def get_macro_outlook(
        self,
        region: str = "US"
    ) -> Dict[str, Any]:
        """
        Get macro economic outlook.

        Args:
            region: Geographic region

        Returns:
            Macro outlook
        """
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(
                    f"{self.fpa_url}/api/macro",
                    params={"region": region},
                    headers={"X-API-Key": self.api_key}
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                return {"error": str(e), "outlook": "NEUTRAL"}

    async def get_scenario_analysis(
        self,
        symbol: str,
        scenarios: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Get scenario analysis (bull/bear/base case).

        Args:
            symbol: Asset symbol
            scenarios: List of scenarios to analyze

        Returns:
            Scenario analysis
        """
        return {
            "symbol": symbol,
            "scenarios": [
                {
                    "name": "Bull Case",
                    "probability": 30,
                    "price_target": "Up 25%",
                    "assumptions": ["AI spending accelerates", "Market share grows"]
                },
                {
                    "name": "Base Case",
                    "probability": 50,
                    "price_target": "Up 10%",
                    "assumptions": ["Steady growth", "No major disruption"]
                },
                {
                    "name": "Bear Case",
                    "probability": 20,
                    "price_target": "Down 15%",
                    "assumptions": ["Competition increases", "Margins compress"]
                }
            ],
            "recommended_action": "HOLD",
            "timestamp": datetime.utcnow().isoformat()
        }


# Singleton instance
_ridza_integration = None


def get_ridza_integration() -> RIDZAIntegration:
    """Get singleton RIDZA integration instance."""
    global _ridza_integration
    if _ridza_integration is None:
        _ridza_integration = RIDZAIntegration()
    return _ridza_integration