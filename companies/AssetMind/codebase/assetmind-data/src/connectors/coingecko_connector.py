"""
AssetMind - CoinGecko Connector
Live crypto data from CoinGecko API
"""

import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional

try:
    from pycoingecko import CoinGeckoAPI
    COINGECKO_AVAILABLE = True
except ImportError:
    COINGECKO_AVAILABLE = False
    CoinGeckoAPI = None

from connectors.base_connector import BaseConnector


class CoinGeckoConnector(BaseConnector):
    """
    Connector for CoinGecko API.

    Free tier: 10-50 calls/minute, limited historical data
    Rate limits: https://www.coingecko.com/en/api/documentation
    """

    def __init__(self, api_key: str = None, config: Dict = None):
        config = config or {}
        config['source_name'] = 'coingecko'
        config['rate_limit'] = 60  # 1 request per second for free tier
        super().__init__(config)
        self.api_key = api_key
        self.source_name = "coingecko"

        if COINGECKO_AVAILABLE:
            self.client = CoinGeckoAPI(api_key=api_key)
        else:
            self.client = None
            self.logger.warning("pycoingecko not installed. Run: pip install pycoingecko")

    async def fetch_price(self, coin_id: str, currency: str = "usd") -> Dict[str, Any]:
        """
        Fetch current price for a cryptocurrency.

        Args:
            coin_id: CoinGecko coin ID (e.g., 'bitcoin', 'ethereum')
            currency: Fiat currency (usd, eur, gbp, etc.)

        Returns:
            Price data dictionary
        """
        if not self.client:
            raise ImportError("pycoingecko not installed")

        data = self.client.get_coin_by_id(coin_id)

        return self._transform_coin_data(data, currency)

    async def fetch_prices(self, coin_ids: List[str], currency: str = "usd") -> Dict[str, Any]:
        """
        Fetch prices for multiple coins.

        Args:
            coin_ids: List of CoinGecko coin IDs
            currency: Fiat currency

        Returns:
            Dictionary of coin_id -> price data
        """
        if not self.client:
            raise ImportError("pycoingecko not installed")

        # CoinGecko simple price endpoint
        data = self.client.get_price(
            ids=coin_ids,
            vs_currencies=currency,
            include_24hr_change=True,
            include_24hr_vol=True,
            include_market_cap=True
        )

        result = {}
        for coin_id, values in data.items():
            result[coin_id] = {
                "coin_id": coin_id,
                "symbol": coin_id.upper(),
                "currency": currency.upper(),
                "price": values.get(currency),
                "market_cap": values.get(f"{currency}_market_cap"),
                "change_24h": values.get(f"{currency}_24h_change"),
                "volume_24h": values.get(f"{currency}_24h_vol"),
                "timestamp": datetime.utcnow().isoformat(),
                "source": "coingecko"
            }

        return result

    async def fetch_market_data(self, coin_id: str, currency: str = "usd") -> Dict[str, Any]:
        """
        Fetch detailed market data for a coin.

        Args:
            coin_id: CoinGecko coin ID
            currency: Fiat currency

        Returns:
            Detailed market data
        """
        if not self.client:
            raise ImportError("pycoingecko not installed")

        data = self.client.get_coin_by_id(
            coin_id,
            localization=False,
            tickers=False,
            market_data=True,
            community_data=False,
            developer_data=False,
            sparkline=False
        )

        return self._transform_coin_data(data, currency)

    async def fetch_historical(
        self,
        coin_id: str,
        days: int = 7,
        currency: str = "usd"
    ) -> Dict[str, Any]:
        """
        Fetch historical price data.

        Args:
            coin_id: CoinGecko coin ID
            days: Number of days of history
            currency: Fiat currency

        Returns:
            Historical price data
        """
        if not self.client:
            raise ImportError("pycoingecko not installed")

        data = self.client.get_coin_market_chart_by_id(
            id=coin_id,
            vs_currency=currency,
            days=days
        )

        return {
            "coin_id": coin_id,
            "currency": currency.upper(),
            "days": days,
            "prices": data.get("prices", []),
            "market_caps": data.get("market_caps", []),
            "volumes": data.get("total_volumes", []),
            "source": "coingecko",
            "timestamp": datetime.utcnow().isoformat()
        }

    async def fetch_ohlc(
        self,
        coin_id: str,
        days: int = 7,
        currency: str = "usd"
    ) -> Dict[str, Any]:
        """
        Fetch OHLC (Open, High, Low, Close) data.

        Args:
            coin_id: CoinGecko coin ID
            days: Number of days
            currency: Fiat currency

        Returns:
            OHLC data
        """
        if not self.client:
            raise ImportError("pycoingecko not installed")

        data = self.client.get_coin_ohlc_by_id(
            id=coin_id,
            vs_currency=currency,
            days=days
        )

        return {
            "coin_id": coin_id,
            "currency": currency.upper(),
            "days": days,
            "ohlc": [
                {
                    "timestamp": item[0],
                    "open": item[1],
                    "high": item[2],
                    "low": item[3],
                    "close": item[4]
                }
                for item in data
            ],
            "source": "coingecko"
        }

    async def fetch_global(self) -> Dict[str, Any]:
        """
        Fetch global cryptocurrency market data.

        Returns:
            Global market data
        """
        if not self.client:
            raise ImportError("pycoingecko not installed")

        data = self.client.get_global()

        return {
            "total_market_cap": data.get("data", {}).get("total_market_cap", {}).get("usd"),
            "total_volume": data.get("data", {}).get("total_volume", {}).get("usd"),
            "btc_dominance": data.get("data", {}).get("market_cap_percentage", {}).get("btc"),
            "eth_dominance": data.get("data", {}).get("market_cap_percentage", {}).get("eth"),
            "active_cryptocurrencies": data.get("data", {}).get("active_cryptocurrencies"),
            "markets": data.get("data", {}).get("markets"),
            "timestamp": datetime.utcnow().isoformat(),
            "source": "coingecko"
        }

    async def search_coins(self, query: str) -> List[Dict[str, Any]]:
        """
        Search for coins by name or symbol.

        Args:
            query: Search query

        Returns:
            List of matching coins
        """
        if not self.client:
            raise ImportError("pycoingecko not installed")

        data = self.client.search(query)

        return [
            {
                "id": coin.get("id"),
                "name": coin.get("name"),
                "symbol": coin.get("symbol"),
                "market_cap_rank": coin.get("market_cap_rank")
            }
            for coin in data.get("coins", [])
        ]

    async def fetch_top_coins(self, per_page: int = 100) -> List[Dict[str, Any]]:
        """
        Fetch top coins by market cap.

        Args:
            per_page: Number of coins to fetch (max 250)

        Returns:
            List of top coins
        """
        if not self.client:
            raise ImportError("pycoingecko not installed")

        data = self.client.get_coins_markets(
            vs_currency="usd",
            order="market_cap_desc",
            per_page=min(per_page, 250),
            page=1,
            sparkline=False
        )

        return [
            {
                "coin_id": coin.get("id"),
                "symbol": coin.get("symbol"),
                "name": coin.get("name"),
                "current_price": coin.get("current_price"),
                "market_cap": coin.get("market_cap"),
                "market_cap_rank": coin.get("market_cap_rank"),
                "total_volume": coin.get("total_volume"),
                "high_24h": coin.get("high_24h"),
                "low_24h": coin.get("low_24h"),
                "price_change_24h": coin.get("price_change_24h"),
                "price_change_percentage_24h": coin.get("price_change_percentage_24h"),
                "circulating_supply": coin.get("circulating_supply"),
                "total_supply": coin.get("total_supply"),
                "ath": coin.get("ath"),
                "ath_change_percentage": coin.get("ath_change_percentage"),
                "source": "coingecko"
            }
            for coin in data
        ]

    def _transform_coin_data(self, data: Dict, currency: str) -> Dict[str, Any]:
        """Transform CoinGecko data to standard format"""
        market_data = data.get("market_data", {})
        current_price = market_data.get("current_price", {})

        return {
            "coin_id": data.get("id"),
            "symbol": data.get("symbol", "").upper(),
            "name": data.get("name"),
            "currency": currency.upper(),
            "price": current_price.get(currency),
            "market_cap": market_data.get("market_cap", {}).get(currency),
            "market_cap_rank": data.get("market_cap_rank"),
            "total_volume": market_data.get("total_volume", {}).get(currency),
            "high_24h": market_data.get("high_24h", {}).get(currency),
            "low_24h": market_data.get("low_24h", {}).get(currency),
            "price_change_24h": market_data.get("price_change_24h"),
            "price_change_percentage_24h": market_data.get("price_change_percentage_24h"),
            "price_change_percentage_7d": market_data.get("price_change_percentage_7d"),
            "price_change_percentage_30d": market_data.get("price_change_percentage_30d"),
            "ath": market_data.get("ath", {}).get(currency),
            "ath_date": market_data.get("ath_date", {}).get(currency),
            "atl": market_data.get("atl", {}).get(currency),
            "atl_date": market_data.get("atl_date", {}).get(currency),
            "circulating_supply": market_data.get("circulating_supply"),
            "total_supply": market_data.get("total_supply"),
            "max_supply": market_data.get("max_supply"),
            "sentiment_vote_up_percentage": data.get("sentiment_vote_up_percentage"),
            "sentiment_vote_down_percentage": data.get("sentiment_vote_down_percentage"),
            "description": data.get("description", {}).get("en", ""),
            "links": data.get("links", {}),
            "source": "coingecko",
            "timestamp": datetime.utcnow().isoformat()
        }

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
    connector = CoinGeckoConnector()

    # Fetch Bitcoin price
    btc = await connector.fetch_price("bitcoin")
    logger.debug(f"BTC Price: ${btc['price']}")

    # Fetch multiple prices
    prices = await connector.fetch_prices(["bitcoin", "ethereum", "solana"])
    for coin_id, data in prices.items():
        logger.debug(f"{coin_id}: ${data['price']}")

    # Fetch historical data (7 days)
    hist = await connector.fetch_historical("bitcoin", days=7)
    logger.debug(f"Bitcoin 7-day history: {len(hist['prices'])} data points")

    # Fetch OHLC
    ohlc = await connector.fetch_ohlc("bitcoin", days=7)
    logger.debug(f"OHLC candles: {len(ohlc['ohlc'])}")

    # Fetch global market data
    global_data = await connector.fetch_global()
    logger.debug(f"Total Market Cap: ${global_data['total_market_cap']}")
    logger.debug(f"BTC Dominance: {global_data['btc_dominance']}%")

    # Fetch top 10 coins
    top = await connector.fetch_top_coins(per_page=10)
    for coin in top[:5]:
        logger.debug(f"{coin['coin_id']}: ${coin['current_price']}")

    # Search for coins
    results = await connector.search_coins("AI")
    logger.debug(f"Search results: {len(results)} coins found")


if __name__ == "__main__":
    asyncio.run(main())
