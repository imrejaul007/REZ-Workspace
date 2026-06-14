"""
AssetMind - Yahoo Finance Connector
Live data from Yahoo Finance
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

try:
    import yfinance as yf
    YFINANCE_AVAILABLE = True
except ImportError:
    YFINANCE_AVAILABLE = False
    yf = None

from connectors.base_connector import BaseConnector


@dataclass
class YahooFinanceConfig:
    """Configuration for Yahoo Finance connector"""
    rate_limit: int = 60  # seconds between requests
    cache_ttl: int = 300  # 5 minutes cache


class YahooFinanceConnector(BaseConnector):
    """
    Connector for Yahoo Finance data.

    Uses yfinance library for stock, ETF, and index data.
    All data is from Yahoo Finance's unofficial API.
    """

    def __init__(self, config: YahooFinanceConfig = None):
        super().__init__(config or {})
        self.config = config or YahooFinanceConfig()
        self.source_name = "yahoo_finance"
        self.rate_limit = self.config.rate_limit
        self._cache: Dict[str, tuple] = {}  # {symbol: (data, timestamp)}

    async def fetch(self, symbol: str, period: str = "1d", interval: str = "1m") -> Dict[str, Any]:
        """
        Fetch current quote data for a symbol.

        Args:
            symbol: Stock symbol (e.g., 'NVDA', 'AAPL')
            period: Historical period (1d, 5d, 1mo, 3mo, 6mo, 1y, 5y, max)
            interval: Data interval (1m, 2m, 5m, 15m, 30m, 60m, 1h, 1d, 1wk, 1mo)

        Returns:
            Dictionary with quote data
        """
        if not YFINANCE_AVAILABLE:
            raise ImportError("yfinance not installed. Run: pip install yfinance")

        # Check cache
        cache_key = f"{symbol}_{period}_{interval}"
        if cache_key in self._cache:
            data, timestamp = self._cache[cache_key]
            if (datetime.utcnow() - timestamp).total_seconds() < self.config.cache_ttl:
                return data

        # Fetch data
        ticker = yf.Ticker(symbol)
        info = ticker.info

        # Get historical data
        hist = ticker.history(period=period, interval=interval)

        data = {
            "symbol": symbol.upper(),
            "timestamp": datetime.utcnow().isoformat(),
            "current_price": info.get("currentPrice") or info.get("regularMarketPrice"),
            "previous_close": info.get("previousClose") or info.get("regularMarketPreviousClose"),
            "open": info.get("open") or info.get("regularMarketOpen"),
            "day_high": info.get("dayHigh") or info.get("regularMarketDayHigh"),
            "day_low": info.get("dayLow") or info.get("regularMarketDayLow"),
            "volume": info.get("volume") or info.get("regularMarketVolume"),
            "market_cap": info.get("marketCap"),
            "pe_ratio": info.get("trailingPE"),
            "forward_pe": info.get("forwardPE"),
            "dividend_yield": info.get("dividendYield"),
            "52_week_high": info.get("fiftyTwoWeekHigh"),
            "52_week_low": info.get("fiftyTwoWeekLow"),
            "name": info.get("shortName") or info.get("longName"),
            "sector": info.get("sector"),
            "industry": info.get("industry"),
            "exchange": info.get("exchange"),
            "currency": info.get("currency"),
            "history": hist.to_dict() if not hist.empty else None,
            "source": "yahoo_finance"
        }

        # Cache result
        self._cache[cache_key] = (data, datetime.utcnow())

        return data

    async def fetch_batch(self, symbols: List[str], period: str = "1d") -> List[Dict[str, Any]]:
        """
        Fetch data for multiple symbols.

        Args:
            symbols: List of stock symbols
            period: Historical period

        Returns:
            List of quote dictionaries
        """
        results = []
        for symbol in symbols:
            try:
                data = await self.fetch(symbol, period)
                results.append(data)
                # Rate limiting
                await asyncio.sleep(0.5)
            except Exception as e:
                self.logger.error(f"Error fetching {symbol}: {e}")
                results.append({"symbol": symbol.upper(), "error": str(e)})

        return results

    async def fetch_historical(
        self,
        symbol: str,
        start_date: datetime = None,
        end_date: datetime = None,
        period: str = "1mo"
    ) -> Dict[str, Any]:
        """
        Fetch historical price data.

        Args:
            symbol: Stock symbol
            start_date: Start date (optional)
            end_date: End date (optional)
            period: Period if dates not provided

        Returns:
            Historical price data
        """
        if not YFINANCE_AVAILABLE:
            raise ImportError("yfinance not installed")

        ticker = yf.Ticker(symbol)

        if start_date and end_date:
            hist = ticker.history(start=start_date, end=end_date)
        else:
            hist = ticker.history(period=period)

        return {
            "symbol": symbol.upper(),
            "start_date": hist.index[0].isoformat() if not hist.empty else None,
            "end_date": hist.index[-1].isoformat() if not hist.empty else None,
            "period": period,
            "data": hist.to_dict() if not hist.empty else None,
            "count": len(hist)
        }

    async def fetch_financials(self, symbol: str) -> Dict[str, Any]:
        """
        Fetch financial statements.

        Args:
            symbol: Stock symbol

        Returns:
            Financial data (income statement, balance sheet, cash flow)
        """
        if not YFINANCE_AVAILABLE:
            raise ImportError("yfinance not installed")

        ticker = yf.Ticker(symbol)

        return {
            "symbol": symbol.upper(),
            "income_statement": ticker.income_stmt.to_dict() if ticker.income_stmt is not None else None,
            "balance_sheet": ticker.balance_sheet.to_dict() if ticker.balance_sheet is not None else None,
            "cash_flow": ticker.cashflow.to_dict() if ticker.cashflow is not None else None,
            "earnings": ticker.earnings.to_dict() if ticker.earnings is not None else None,
            "financials": ticker.financials.to_dict() if ticker.financials is not None else None,
            "major_holders": ticker.major_holders.to_dict() if ticker.major_holders is not None else None,
            "institutional_holders": ticker.institutional_holders.to_dict() if ticker.institutional_holders is not None else None,
        }

    async def fetch_info(self, symbol: str) -> Dict[str, Any]:
        """
        Fetch company info.

        Args:
            symbol: Stock symbol

        Returns:
            Company info dictionary
        """
        if not YFINANCE_AVAILABLE:
            raise ImportError("yfinance not installed")

        ticker = yf.Ticker(symbol)
        info = ticker.info

        # Extract key metrics
        return {
            "symbol": symbol.upper(),
            "name": info.get("shortName") or info.get("longName"),
            "sector": info.get("sector"),
            "industry": info.get("industry"),
            "market_cap": info.get("marketCap"),
            "pe_ratio": info.get("trailingPE"),
            "forward_pe": info.get("forwardPE"),
            "peg_ratio": info.get("pegRatio"),
            "eps": info.get("trailingEps"),
            "eps_forward": info.get("forwardEps"),
            "revenue": info.get("totalRevenue"),
            "revenue_growth": info.get("revenueGrowth"),
            "earnings_growth": info.get("earningsGrowth"),
            "gross_margin": info.get("grossMargins"),
            "operating_margin": info.get("operatingMargins"),
            "net_margin": info.get("profitMargins"),
            "roe": info.get("returnOnEquity"),
            "roa": info.get("returnOnAssets"),
            "debt_to_equity": info.get("debtToEquity"),
            "current_ratio": info.get("currentRatio"),
            "quick_ratio": info.get("quickRatio"),
            "dividend_yield": info.get("dividendYield"),
            "beta": info.get("beta"),
            "52_week_high": info.get("fiftyTwoWeekHigh"),
            "52_week_low": info.get("fiftyTwoWeekLow"),
            "avg_volume": info.get("averageVolume"),
            "recommendation": info.get("recommendationKey"),
            "target_price": info.get("targetMeanPrice"),
            "analyst_count": info.get("numberOfAnalystOpinions"),
        }

    async def search(self, query: str) -> List[Dict[str, Any]]:
        """
        Search for symbols by company name.

        Args:
            query: Search query

        Returns:
            List of matching symbols
        """
        if not YFINANCE_AVAILABLE:
            raise ImportError("yfinance not installed")

        # Yahoo Finance doesn't have a public search API through yfinance
        # We can use a workaround with Tickers
        # For now, return empty list - would need to integrate with a search API
        self.logger.warning("Symbol search not available through yfinance")
        return []

    async def transform(self, raw_data: Any) -> List[Dict[str, Any]]:
        """Transform raw data to standard format"""
        if isinstance(raw_data, list):
            return raw_data
        return [raw_data]


# =============================================================================
// USAGE EXAMPLES
// =============================================================================

async def main():
    """Example usage"""
    connector = YahooFinanceConnector()

    # Fetch single symbol
    quote = await connector.fetch("NVDA")
    logger.debug(f"NVDA Price: ${quote['current_price']}")

    # Fetch multiple symbols
    quotes = await connector.fetch_batch(["AAPL", "MSFT", "GOOGL"])
    for q in quotes:
        logger.debug(f"{q['symbol']}: ${q['current_price']}")

    # Fetch historical data
    hist = await connector.fetch_historical("NVDA", period="1mo")
    logger.debug(f"Historical data points: {hist['count']}")

    # Fetch financials
    financials = await connector.fetch_financials("NVDA")
    logger.debug(f"Income statement keys: {financials['income_statement'].keys() if financials['income_statement'] else 'None'}")

    # Fetch company info
    info = await connector.fetch_info("NVDA")
    logger.debug(f"Sector: {info['sector']}, Industry: {info['industry']}")


if __name__ == "__main__":
    asyncio.run(main())
