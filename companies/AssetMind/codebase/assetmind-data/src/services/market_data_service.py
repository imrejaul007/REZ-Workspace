"""
AssetMind - Market Data Service (Real Yahoo Finance Integration)
Port: 5010

This service fetches real-time and historical market data from Yahoo Finance API.
Supports: Stocks, ETFs, Crypto, Forex, Commodities, Indices
"""

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import asyncio
import logging
import httpx
import json

logger = logging.getLogger(__name__)

app = FastAPI(title="AssetMind Market Data Service", version="2.0.0", docs_url="/docs")


class PriceData(BaseModel):
    """OHLCV price data"""
    symbol: str
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float
    market_cap: Optional[float] = None


class MarketDataResponse(BaseModel):
    """Market data response"""
    symbol: str
    current_price: float
    price_change_24h: float
    price_change_percent_24h: float
    volume_24h: float
    market_cap: Optional[float] = None
    high_52w: Optional[float] = None
    low_52w: Optional[float] = None
    timestamp: datetime
    source: str = "yahoo_finance"


class MarketDataService:
    """
    Market data service with real Yahoo Finance integration.

    Key capabilities:
    - Real-time price fetching from Yahoo Finance
    - Historical price data
    - Batch price lookups
    - Market overview and movers
    - Support for multiple asset classes
    """

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.name = "Market Data"
        self.port = 5010
        self.version = "2.0.0"

        # Yahoo Finance API
        self.yf_base_url = "https://query1.finance.yahoo.com"
        self._http_client: Optional[httpx.AsyncClient] = None

        # Cache for prices
        self._price_cache: Dict[str, Dict[str, Any]] = {}
        self._cache_ttl = 60  # 60 seconds cache

        # Default symbols
        self.default_symbols = [
            "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA",
            "BTC-USD", "ETH-USD", "SOL-USD",
            "SPY", "QQQ", "IWM",
            "EURUSD=X", "GBPUSD=X", "USDJPY=X",
            "GC=F", "CL=F"
        ]

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client"""
        if self._http_client is None:
            self._http_client = httpx.AsyncClient(timeout=30.0)
        return self._http_client

    async def _fetch_from_yahoo(
        self,
        symbol: str,
        interval: str = "1d",
        range: str = "1mo"
    ) -> Optional[Dict[str, Any]]:
        """
        Fetch data from Yahoo Finance API.

        API: https://query1.finance.yahoo.com/v8/finance/chart/{symbol}
        """
        try:
            client = await self._get_client()
            url = f"{self.yf_base_url}/v8/finance/chart/{symbol}"

            params = {
                "interval": interval,
                "range": range
            }

            response = await client.get(url, params=params)

            if response.status_code == 200:
                data = response.json()
                result = data.get("chart", {}).get("result", [])

                if result:
                    return result[0]

            logger.warning(f"Yahoo Finance returned status {response.status_code} for {symbol}")

        except Exception as e:
            logger.error(f"Error fetching {symbol} from Yahoo Finance: {e}")

        return None

    async def get_price(self, symbol: str, use_cache: bool = True) -> Optional[MarketDataResponse]:
        """
        Get current price for a symbol.

        Uses Yahoo Finance API for real data.
        """
        # Check cache
        if use_cache and symbol in self._price_cache:
            cached = self._price_cache[symbol]
            cache_age = (datetime.utcnow() - cached.get("cached_at", datetime.min)).total_seconds()
            if cache_age < self._cache_ttl:
                return MarketDataResponse(**cached["data"])

        # Fetch from Yahoo Finance
        data = await self._fetch_from_yahoo(symbol, interval="1d", range="1d")

        if not data:
            # Return mock data as fallback
            return self._get_mock_price(symbol)

        # Extract data
        meta = data.get("meta", {})
        timestamps = data.get("timestamp", [])
        ohlcv = data.get("indicators", {}).get("quote", [{}])[0]

        if not timestamps:
            return self._get_mock_price(symbol)

        current_idx = -1
        current_price = meta.get("regularMarketPrice", 0)
        prev_close = meta.get("previousClose", current_price)

        # Calculate 24h change
        price_change = current_price - prev_close
        price_change_pct = (price_change / prev_close * 100) if prev_close > 0 else 0

        result = {
            "symbol": symbol.replace("-USD", "").replace("=X", ""),
            "current_price": current_price,
            "price_change_24h": price_change,
            "price_change_percent_24h": price_change_pct,
            "volume_24h": meta.get("regularMarketVolume", 0),
            "market_cap": meta.get("marketCap"),
            "timestamp": datetime.utcnow()
        }

        # Update cache
        self._price_cache[symbol] = {
            "data": result,
            "cached_at": datetime.utcnow()
        }

        return MarketDataResponse(**result, source="yahoo_finance")

    def _get_mock_price(self, symbol: str) -> MarketDataResponse:
        """Return mock price data when Yahoo Finance is unavailable"""
        mock_prices = {
            "AAPL": {"price": 189.25, "change": 1.45, "change_pct": 0.77, "volume": 52.3e6, "mcap": 2.95e12},
            "MSFT": {"price": 415.50, "change": 2.30, "change_pct": 0.56, "volume": 18.2e6, "mcap": 3.08e12},
            "GOOGL": {"price": 178.50, "change": -0.85, "change_pct": -0.47, "volume": 21.5e6, "mcap": 2.22e12},
            "AMZN": {"price": 185.75, "change": 3.25, "change_pct": 1.78, "volume": 45.8e6, "mcap": 1.92e12},
            "NVDA": {"price": 878.35, "change": 21.50, "change_pct": 2.51, "volume": 38.2e6, "mcap": 2.17e12},
            "META": {"price": 512.40, "change": 5.80, "change_pct": 1.14, "volume": 12.5e6, "mcap": 1.31e12},
            "TSLA": {"price": 182.30, "change": -3.20, "change_pct": -1.72, "volume": 98.5e6, "mcap": 579e9},
            "BTC": {"price": 68500, "change": 1250, "change_pct": 1.86, "volume": 28.5e9, "mcap": 1.35e12},
            "ETH": {"price": 3850, "change": 85, "change_pct": 2.26, "volume": 12.8e9, "mcap": 463e9},
            "SPY": {"price": 528.75, "change": 2.15, "change_pct": 0.41, "volume": 78.5e6, "mcap": 510e9},
            "QQQ": {"price": 458.20, "change": 3.40, "change_pct": 0.75, "volume": 42.1e6, "mcap": 245e9},
        }

        symbol_key = symbol.replace("-USD", "").replace("=X", "")
        data = mock_prices.get(symbol_key, {"price": 100, "change": 0, "change_pct": 0, "volume": 1e6, "mcap": None})

        return MarketDataResponse(
            symbol=symbol_key,
            current_price=data["price"],
            price_change_24h=data["change"],
            price_change_percent_24h=data["change_pct"],
            volume_24h=data["volume"],
            market_cap=data["mcap"],
            timestamp=datetime.utcnow(),
            source="mock_fallback"
        )

    async def get_prices(self, symbols: List[str]) -> List[MarketDataResponse]:
        """Get prices for multiple symbols"""
        results = []

        for symbol in symbols:
            try:
                price = await self.get_price(symbol)
                if price:
                    results.append(price)
            except Exception as e:
                logger.error(f"Error getting price for {symbol}: {e}")

        return results

    async def get_price_history(
        self,
        symbol: str,
        period: str = "1mo",
        interval: str = "1d"
    ) -> Dict[str, Any]:
        """
        Get historical price data for a symbol.

        Args:
            symbol: Ticker symbol
            period: Time period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, max)
            interval: Candle interval (1m, 5m, 15m, 1h, 1d, 1wk)
        """
        data = await self._fetch_from_yahoo(symbol, interval=interval, range=period)

        if not data:
            return self._get_mock_history(symbol)

        timestamps = data.get("timestamp", [])
        ohlcv = data.get("indicators", {}).get("quote", [{}])[0]

        history = []
        for i, ts in enumerate(timestamps):
            history.append({
                "timestamp": datetime.fromtimestamp(ts).isoformat(),
                "open": ohlcv.get("open", [0])[i] if i < len(ohlcv.get("open", [])) else 0,
                "high": ohlcv.get("high", [0])[i] if i < len(ohlcv.get("high", [])) else 0,
                "low": ohlcv.get("low", [0])[i] if i < len(ohlcv.get("low", [])) else 0,
                "close": ohlcv.get("close", [0])[i] if i < len(ohlcv.get("close", [])) else 0,
                "volume": ohlcv.get("volume", [0])[i] if i < len(ohlcv.get("volume", [])) else 0,
            })

        return {
            "symbol": symbol,
            "period": period,
            "interval": interval,
            "history": history,
            "source": "yahoo_finance"
        }

    def _get_mock_history(self, symbol: str) -> Dict[str, Any]:
        """Return mock history when Yahoo Finance is unavailable"""
        import random
        base_price = 100

        history = []
        for i in range(30):
            price = base_price * (1 + (random.random() - 0.5) * 0.1)
            history.append({
                "timestamp": (datetime.utcnow() - timedelta(days=30-i)).isoformat(),
                "open": price * 0.99,
                "high": price * 1.02,
                "low": price * 0.98,
                "close": price,
                "volume": random.randint(1000000, 10000000)
            })

        return {
            "symbol": symbol,
            "period": "1mo",
            "interval": "1d",
            "history": history,
            "source": "mock_fallback"
        }

    async def get_market_overview(self) -> Dict[str, Any]:
        """Get overall market overview"""
        # Fetch major indices
        indices = ["^GSPC", "^IXIC", "^DJI", "^RUT"]

        index_data = {}
        for idx in indices:
            price = await self.get_price(idx, use_cache=False)
            if price:
                index_data[idx] = {
                    "price": price.current_price,
                    "change": price.price_change_24h,
                    "change_pct": price.price_change_percent_24h
                }

        # Calculate average sentiment
        changes = [d["change_pct"] for d in index_data.values()]
        avg_change = sum(changes) / len(changes) if changes else 0

        sentiment = "BULLISH" if avg_change > 0.5 else "BEARISH" if avg_change < -0.5 else "NEUTRAL"

        return {
            "sp500": index_data.get("^GSPC", {"price": 5280, "change": 0, "change_pct": 0}),
            "nasdaq": index_data.get("^IXIC", {"price": 16500, "change": 0, "change_pct": 0}),
            "dow": index_data.get("^DJI", {"price": 38500, "change": 0, "change_pct": 0}),
            "russell": index_data.get("^RUT", {"price": 2050, "change": 0, "change_pct": 0}),
            "market_sentiment": sentiment,
            "timestamp": datetime.utcnow().isoformat()
        }

    async def get_top_movers(self, market: str = "US") -> Dict[str, List[Dict[str, Any]]]:
        """Get top gainers and losers"""
        # Use sector ETFs to estimate movers
        symbols = ["XLK", "XLE", "XLV", "XLF", "XLY", "XLP", "XLI", "XLB", "XLRE", "XLU"]

        movers = []
        for symbol in symbols:
            try:
                price = await self.get_price(symbol)
                if price:
                    movers.append({
                        "symbol": symbol,
                        "price": price.current_price,
                        "change_pct": price.price_change_percent_24h
                    })
            except Exception:
                pass

        # Sort by change
        movers.sort(key=lambda x: x["change_pct"], reverse=True)

        return {
            "gainers": movers[:5],
            "losers": movers[-5:][::-1] if len(movers) >= 5 else []
        }

    async def get_intraday_data(self, symbol: str) -> Dict[str, Any]:
        """Get intraday data for a symbol"""
        return await self.get_price_history(symbol, period="1d", interval="5m")

    async def get_crypto_data(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Get cryptocurrency data"""
        crypto_symbol = f"{symbol}-USD"
        price = await self.get_price(crypto_symbol)

        if price:
            return {
                "symbol": symbol,
                "price": price.current_price,
                "change_24h": price.price_change_24h,
                "change_pct_24h": price.price_change_percent_24h,
                "volume_24h": price.volume_24h,
                "market_cap": price.market_cap,
                "source": price.source
            }

        return None

    async def get_forex_data(self, pair: str) -> Optional[Dict[str, Any]]:
        """Get forex data"""
        forex_symbol = f"{pair}=X"
        price = await self.get_price(forex_symbol)

        if price:
            return {
                "pair": pair,
                "price": price.current_price,
                "change_24h": price.price_change_24h,
                "change_pct_24h": price.price_change_percent_24h,
                "source": price.source
            }

        return None


# Initialize service
service = MarketDataService()


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "service": "assetmind-market-data",
        "status": "healthy",
        "version": service.version,
        "port": service.port,
        "source": "yahoo_finance",
        "cached_symbols": len(service._price_cache)
    }


@app.get("/price/{symbol}")
async def get_price(symbol: str):
    """Get current price for a symbol"""
    price = await service.get_price(symbol.upper())
    if not price:
        raise HTTPException(status_code=404, detail=f"Price data not found for {symbol}")
    return price


@app.get("/prices")
async def get_prices(symbols: str):
    """Get prices for multiple symbols"""
    symbol_list = [s.strip().upper() for s in symbols.split(",")]
    prices = await service.get_prices(symbol_list)
    return {"prices": prices, "count": len(prices)}


@app.get("/batch/prices")
async def get_batch_prices(symbols: List[str]):
    """Batch price lookup"""
    prices = await service.get_prices(symbols)
    return {"prices": prices, "count": len(prices)}


@app.get("/history/{symbol}")
async def get_price_history(
    symbol: str,
    period: str = Query("1mo", description="Time period: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, max"),
    interval: str = Query("1d", description="Candle interval: 1m, 5m, 15m, 1h, 1d, 1wk")
):
    """Get price history for a symbol"""
    return await service.get_price_history(symbol.upper(), period, interval)


@app.get("/intraday/{symbol}")
async def get_intraday(symbol: str):
    """Get intraday data"""
    return await service.get_intraday_data(symbol.upper())


@app.get("/market/overview")
async def get_market_overview():
    """Get overall market overview"""
    return await service.get_market_overview()


@app.get("/market/movers")
async def get_top_movers(market: str = "US"):
    """Get top gainers and losers"""
    return await service.get_top_movers(market)


@app.get("/top-gainers")
async def get_top_gainers(limit: int = 10):
    """Get top gaining assets"""
    movers = await service.get_top_movers()
    return {"gainers": movers.get("gainers", [])[:limit]}


@app.get("/top-losers")
async def get_top_losers(limit: int = 10):
    """Get top losing assets"""
    movers = await service.get_top_movers()
    return {"losers": movers.get("losers", [])[:limit]}


@app.get("/crypto/{symbol}")
async def get_crypto_data(symbol: str):
    """Get cryptocurrency data"""
    data = await service.get_crypto_data(symbol.upper())
    if not data:
        raise HTTPException(status_code=404, detail=f"Crypto data not found for {symbol}")
    return data


@app.get("/forex/{pair}")
async def get_forex_data(pair: str):
    """Get forex data (e.g., EURUSD)"""
    data = await service.get_forex_data(pair.upper())
    if not data:
        raise HTTPException(status_code=404, detail=f"Forex data not found for {pair}")
    return data


@app.get("/cache/clear")
async def clear_cache():
    """Clear price cache"""
    service._price_cache.clear()
    return {"status": "cache_cleared"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5010)