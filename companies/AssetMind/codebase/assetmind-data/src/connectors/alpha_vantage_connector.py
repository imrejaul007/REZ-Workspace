"""
Alpha Vantage API Connector
Source: https://www.alphavantage.co/
Free tier: 5 API calls/minute, 500/day
"""
import httpx
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging
import asyncio

logger = logging.getLogger(__name__)


class AlphaVantageConnector:
    """Connector for Alpha Vantage API"""

    BASE_URL = "https://www.alphavantage.co/query"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or "demo"
        self.client = httpx.AsyncClient(timeout=30.0)
        self.last_call_time = 0
        self.min_interval = 12  # 5 calls/min = 12 seconds between calls

    async def _rate_limit(self):
        """Enforce rate limiting"""
        import time
        elapsed = time.time() - self.last_call_time
        if elapsed < self.min_interval:
            await asyncio.sleep(self.min_interval - elapsed)
        self.last_call_time = time.time()

    async def get_quote(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Get real-time quote for a symbol"""
        await self._rate_limit()

        params = {
            "function": "GLOBAL_QUOTE",
            "symbol": symbol,
            "apikey": self.api_key,
        }

        try:
            response = await self.client.get(self.BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()

            quote = data.get("Global Quote", {})
            if quote:
                return self._transform_quote(quote)
            return None
        except Exception as e:
            logger.error(f"Error fetching quote for {symbol}: {e}")
            return None

    async def get_intraday(
        self,
        symbol: str,
        interval: str = "5min",
        output_size: str = "compact"
    ) -> List[Dict[str, Any]]:
        """Get intraday data"""
        await self._rate_limit()

        params = {
            "function": "TIME_SERIES_INTRADAY",
            "symbol": symbol,
            "interval": interval,
            "outputsize": output_size,
            "apikey": self.api_key,
            "datatype": "json",
        }

        try:
            response = await self.client.get(self.BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()

            key = f"Time Series ({interval})"
            time_series = data.get(key, {})

            return [
                {
                    "datetime": datetime_str,
                    "open": float(values["1. open"]),
                    "high": float(values["2. high"]),
                    "low": float(values["3. low"]),
                    "close": float(values["4. close"]),
                    "volume": int(values["5. volume"]),
                }
                for datetime_str, values in time_series.items()
            ]
        except Exception as e:
            logger.error(f"Error fetching intraday for {symbol}: {e}")
            return []

    async def get_daily(
        self,
        symbol: str,
        output_size: str = "compact"
    ) -> List[Dict[str, Any]]:
        """Get daily time series"""
        await self._rate_limit()

        params = {
            "function": "TIME_SERIES_DAILY",
            "symbol": symbol,
            "outputsize": output_size,
            "apikey": self.api_key,
            "datatype": "json",
        }

        try:
            response = await self.client.get(self.BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()

            time_series = data.get("Time Series (Daily)", {})

            return [
                {
                    "date": date_str,
                    "open": float(values["1. open"]),
                    "high": float(values["2. high"]),
                    "low": float(values["3. low"]),
                    "close": float(values["4. close"]),
                    "volume": int(values["5. volume"]),
                }
                for date_str, values in time_series.items()
            ]
        except Exception as e:
            logger.error(f"Error fetching daily for {symbol}: {e}")
            return []

    async def get_company_overview(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Get company information"""
        await self._rate_limit()

        params = {
            "function": "OVERVIEW",
            "symbol": symbol,
            "apikey": self.api_key,
        }

        try:
            response = await self.client.get(self.BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()

            if data.get("Symbol"):
                return self._transform_overview(data)
            return None
        except Exception as e:
            logger.error(f"Error fetching overview for {symbol}: {e}")
            return None

    async def get_earnings(self, symbol: str) -> List[Dict[str, Any]]:
        """Get earnings data"""
        await self._rate_limit()

        params = {
            "function": "EARNINGS",
            "symbol": symbol,
            "apikey": self.api_key,
        }

        try:
            response = await self.client.get(self.BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()

            quarterly = data.get("quarterlyEarnings", [])
            return [self._transform_earnings(e) for e in quarterly]
        except Exception as e:
            logger.error(f"Error fetching earnings: {e}")
            return []

    async def get_forex_rate(
        self,
        from_currency: str,
        to_currency: str
    ) -> Optional[Dict[str, Any]]:
        """Get forex exchange rate"""
        await self._rate_limit()

        params = {
            "function": "CURRENCY_EXCHANGE_RATE",
            "from_currency": from_currency,
            "to_currency": to_currency,
            "apikey": self.api_key,
        }

        try:
            response = await self.client.get(self.BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()

            fx_data = data.get("Realtime Currency Exchange Rate", {})
            if fx_data:
                return {
                    "from_currency": fx_data.get("From Currency Code"),
                    "to_currency": fx_data.get("To Currency Code"),
                    "rate": float(fx_data.get("5. Exchange Rate", 0)),
                    "last_updated": fx_data.get("6. Last Refreshed"),
                }
            return None
        except Exception as e:
            logger.error(f"Error fetching forex rate: {e}")
            return None

    async def search_symbol(self, keywords: str) -> List[Dict[str, Any]]:
        """Search for symbols"""
        await self._rate_limit()

        params = {
            "function": "SYMBOL_SEARCH",
            "keywords": keywords,
            "apikey": self.api_key,
        }

        try:
            response = await self.client.get(self.BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()

            matches = data.get("bestMatches", [])
            return [self._transform_search(m) for m in matches]
        except Exception as e:
            logger.error(f"Error searching symbols: {e}")
            return []

    def _transform_quote(self, quote: Dict) -> Dict[str, Any]:
        """Transform quote data"""
        return {
            "symbol": quote.get("01. symbol"),
            "price": float(quote.get("05. price", 0)),
            "change": float(quote.get("09. change", 0)),
            "change_percent": quote.get("10. change percent", "0%").replace("%", ""),
            "volume": int(quote.get("06. volume", 0)),
            "open": float(quote.get("02. open", 0)),
            "high": float(quote.get("03. high", 0)),
            "low": float(quote.get("04. low", 0)),
            "latest_trading_day": quote.get("07. latest trading day"),
        }

    def _transform_overview(self, data: Dict) -> Dict[str, Any]:
        """Transform company overview"""
        return {
            "symbol": data.get("Symbol"),
            "name": data.get("Name"),
            "description": data.get("Description"),
            "sector": data.get("Sector"),
            "industry": data.get("Industry"),
            "market_cap": data.get("MarketCapitalization"),
            "pe_ratio": data.get("PERatio"),
            "eps": data.get("EPS"),
            "dividend_yield": data.get("DividendYield"),
            "52_week_high": data.get("52WeekHigh"),
            "52_week_low": data.get("52WeekLow"),
            "shares_outstanding": data.get("SharesOutstanding"),
        }

    def _transform_earnings(self, earning: Dict) -> Dict[str, Any]:
        """Transform earnings data"""
        return {
            "fiscal_date": earning.get("fiscalDateEnding"),
            "reported_eps": earning.get("reportedEPS"),
            "estimated_eps": earning.get("estimatedEPS"),
            "surprise": earning.get("EPSSurpriseDollar"),
            "surprise_percent": earning.get("EPSSurprisePercent"),
            "reported_date": earning.get("reportedDate"),
        }

    def _transform_search(self, match: Dict) -> Dict[str, Any]:
        """Transform search match"""
        return {
            "symbol": match.get("1. symbol"),
            "name": match.get("2. name"),
            "type": match.get("3. type"),
            "region": match.get("4. region"),
            "currency": match.get("8. currency"),
        }

    async def close(self):
        await self.client.aclose()