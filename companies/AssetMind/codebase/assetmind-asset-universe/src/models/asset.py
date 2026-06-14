"""
AssetMind - Asset Models
Core models for the Asset Universe Service
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid


class AssetClass(str, Enum):
    """Asset class enumeration"""
    STOCK = "STOCK"
    CRYPTO = "CRYPTO"
    FOREX = "FOREX"
    COMMODITY = "COMMODITY"
    BOND = "BOND"
    ETF = "ETF"
    INDEX = "INDEX"


class StockType(str, Enum):
    COMMON = "COMMON"
    PREFERRED = "PREFERRED"
    ADR = "ADR"
    OTC = "OTC"


class CryptoType(str, Enum):
    SPOT = "SPOT"
    FUTURES = "FUTURES"
    DEFI = "DEFI"
    STABLECOIN = "STABLECOIN"


class ForexType(str, Enum):
    MAJOR = "MAJOR"
    MINOR = "MINOR"
    EXOTIC = "EXOTIC"


class CommodityType(str, Enum):
    METALS = "METALS"
    ENERGY = "ENERGY"
    AGRICULTURE = "AGRICULTURE"


class AssetType(str, Enum):
    # Stocks
    STOCK_COMMON = "STOCK_COMMON"
    STOCK_PREFERRED = "STOCK_PREFERRED"
    STOCK_ADR = "STOCK_ADR"
    STOCK_OTC = "STOCK_OTC"

    # Crypto
    CRYPTO_SPOT = "CRYPTO_SPOT"
    CRYPTO_FUTURES = "CRYPTO_FUTURES"
    CRYPTO_DEFI = "CRYPTO_DEFI"
    CRYPTO_STABLECOIN = "CRYPTO_STABLECOIN"

    # Forex
    FOREX_MAJOR = "FOREX_MAJOR"
    FOREX_MINOR = "FOREX_MINOR"
    FOREX_EXOTIC = "FOREX_EXOTIC"

    # Commodities
    COMMODITY_METALS = "COMMODITY_METALS"
    COMMODITY_ENERGY = "COMMODITY_ENERGY"
    COMMODITY_AGRICULTURE = "COMMODITY_AGRICULTURE"

    # Bonds
    BOND_GOVERNMENT = "BOND_GOVERNMENT"
    BOND_CORPORATE = "BOND_CORPORATE"

    # ETF
    ETF_EQUITY = "ETF_EQUITY"
    ETF_FIXED_INCOME = "ETF_FIXED_INCOME"
    ETF_COMMODITY = "ETF_COMMODITY"
    ETF_SECTOR = "ETF_SECTOR"
    ETF_CRYPTO = "ETF_CRYPTO"

    # Index
    INDEX_EQUITY = "INDEX_EQUITY"
    INDEX_FIXED_INCOME = "INDEX_FIXED_INCOME"
    INDEX_COMMODITY = "INDEX_COMMODITY"


class AssetStatus(str, Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    DELISTED = "DELISTED"


class Asset(BaseModel):
    """
    Core Asset Model

    Represents a single financial asset in the AssetMind universe.
    Every stock, crypto, forex pair, commodity, ETF, and index
    has a canonical representation here.
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    symbol: str = Field(..., description="Ticker symbol (AAPL, BTC, EURUSD)")
    name: str = Field(..., description="Full name (Apple Inc, Bitcoin)")

    # Classification
    asset_class: AssetClass
    asset_type: Optional[AssetType] = None

    # Market info
    exchange: Optional[str] = None
    country: Optional[str] = None
    currency: str = "USD"

    # Status
    status: AssetStatus = AssetStatus.ACTIVE

    # Metadata
    metadata: Dict[str, Any] = Field(default_factory=dict)

    # Links
    twin_id: Optional[str] = Field(default=None, description="Link to Asset Twin")

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        use_enum_values = True


class AssetUniverseStats(BaseModel):
    """Statistics about the asset universe"""
    total_assets: int
    by_class: Dict[str, int]
    by_exchange: Dict[str, int]
    by_country: Dict[str, int]
    phase1_target: int = 455
    phase1_progress: float


# Symbol mapping for data sources
YAHOO_FINANCE_SYMBOLS = {
    # Top US Stocks
    "AAPL": "Apple Inc", "MSFT": "Microsoft Corporation", "GOOGL": "Alphabet Inc",
    "AMZN": "Amazon.com Inc", "NVDA": "NVIDIA Corporation", "META": "Meta Platforms Inc",
    "TSLA": "Tesla Inc", "AVGO": "Broadcom Inc", "ORCL": "Oracle Corporation",
}

COINGECKO_SYMBOLS = {
    "BTC": "Bitcoin", "ETH": "Ethereum", "BNB": "Binance Coin",
    "XRP": "XRP", "SOL": "Solana", "ADA": "Cardano",
    "DOGE": "Dogecoin", "DOT": "Polkadot", "AVAX": "Avalanche",
}

FOREX_PAIRS = {
    "EURUSD": "Euro / US Dollar", "GBPUSD": "British Pound / US Dollar",
    "USDJPY": "US Dollar / Japanese Yen", "USDCHF": "US Dollar / Swiss Franc",
    "AUDUSD": "Australian Dollar / US Dollar", "USDCAD": "US Dollar / Canadian Dollar",
}

COMMODITIES = {
    "GC": "Gold", "SI": "Silver", "CL": "Crude Oil WTI", "NG": "Natural Gas",
}
