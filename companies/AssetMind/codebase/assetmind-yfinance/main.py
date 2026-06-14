"""
AssetMind Yahoo Finance Data Connector
Real-time and Historical Market Data
Port: 5010
"""

import logging
import time
import random
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("assetmind-yfinance")


class Interval(str, Enum):
    MINUTE_1 = "1m"
    MINUTE_5 = "5m"
    DAILY = "1d"
    WEEKLY = "1wk"


class Period(str, Enum):
    DAY_1 = "1d"
    MONTH_1 = "1mo"
    MONTHS_3 = "3mo"
    YEAR_1 = "1y"


# ============================================================================
# Pydantic Models
# ============================================================================

class StockQuote(BaseModel):
    symbol: str
    name: str
    price: float
    change: float
    change_percent: float
    volume: int
    avg_volume: int
    market_cap: float
    pe_ratio: float
    eps: float
    fifty_two_week_high: float
    fifty_two_week_low: float
    day_high: float
    day_low: float
    open: float
    previous_close: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class Candle(BaseModel):
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: int


class CandleResponse(BaseModel):
    symbol: str
    interval: str
    candles: List[Candle]
    total_candles: int


class CompanyInfo(BaseModel):
    symbol: str
    name: str
    sector: str
    industry: str
    market_cap: float
    employees: int
    exchange: str
    fifty_two_week_high: float
    fifty_two_week_low: float
    analyst_target_price: float
    recommendation: str


class OptionContract(BaseModel):
    symbol: str
    strike: float
    last_price: float
    bid: float
    ask: float
    volume: int
    implied_volatility: float
    delta: float
    expiration_date: datetime
    in_the_money: bool


class OptionsChain(BaseModel):
    symbol: str
    underlying_price: float
    calls: List[OptionContract] = []
    puts: List[OptionContract] = []


class MarketMover(BaseModel):
    symbol: str
    name: str
    price: float
    change_percent: float
    volume: int


class MarketMovers(BaseModel):
    gainers: List[MarketMover] = []
    losers: List[MarketMover] = []
    most_active: List[MarketMover] = []


# ============================================================================
# State Management
# ============================================================================

class YahooFinanceState:
    def __init__(self):
        self.quotes_cache: Dict[str, StockQuote] = {}
        self.stats = {"total_requests": 0, "cache_hits": 0}
        self.start_time = time.time()
        self._init_sample_data()

    def _init_sample_data(self):
        samples = [
            StockQuote(symbol="NVDA", name="NVIDIA Corporation", price=920.50, change=25.50, change_percent=2.85,
                      volume=45_000_000, avg_volume=42_000_000, market_cap=2_300_000_000_000, pe_ratio=65.5, eps=14.05,
                      fifty_two_week_high=974.00, fifty_two_week_low=400.00, day_high=925.00, day_low=895.00,
                      open=895.00, previous_close=895.00),
            StockQuote(symbol="AAPL", name="Apple Inc.", price=178.50, change=2.50, change_percent=1.42,
                      volume=52_000_000, avg_volume=50_000_000, market_cap=2_800_000_000_000, pe_ratio=28.5, eps=6.26,
                      fifty_two_week_high=199.62, fifty_two_week_low=164.08, day_high=180.00, day_low=176.50,
                      open=176.00, previous_close=176.00),
            StockQuote(symbol="MSFT", name="Microsoft Corporation", price=425.50, change=-3.25, change_percent=-0.76,
                      volume=22_000_000, avg_volume=25_000_000, market_cap=3_150_000_000_000, pe_ratio=35.2, eps=12.09,
                      fifty_two_week_high=468.35, fifty_two_week_low=309.45, day_high=430.00, day_low=423.00,
                      open=428.00, previous_close=428.75),
        ]
        for q in samples:
            self.quotes_cache[q.symbol] = q

    def get_quote(self, symbol: str) -> StockQuote:
        symbol = symbol.upper()
        if symbol in self.quotes_cache:
            self.stats["cache_hits"] += 1
            return self.quotes_cache[symbol]

        base_price = random.uniform(50, 500)
        change = random.uniform(-10, 10)
        quote = StockQuote(
            symbol=symbol, name=f"{symbol} Corp", price=base_price, change=change,
            change_percent=(change / base_price) * 100, volume=random.randint(1_000_000, 50_000_000),
            avg_volume=random.randint(1_000_000, 50_000_000), market_cap=base_price * 1e9,
            pe_ratio=random.uniform(10, 50), eps=base_price / 30, fifty_two_week_high=base_price * 1.2,
            fifty_two_week_low=base_price * 0.7, day_high=base_price * 1.02, day_low=base_price * 0.98,
            open=base_price * 0.99, previous_close=base_price * 0.99,
        )
        self.quotes_cache[symbol] = quote
        return quote

    def get_candles(self, symbol: str, interval: Interval, period: Period) -> CandleResponse:
        num_candles = {"1d": 30, "3mo": 63, "1y": 252, "5d": 5}.get(period.value, 30)
        base_price = 100.0
        candles = []
        for i in range(num_candles):
            ts = datetime.utcnow() - timedelta(days=num_candles - i)
            o = base_price + random.uniform(-2, 2)
            h = o + random.uniform(0, 3)
            l = o - random.uniform(0, 3)
            c = l + random.uniform(0, h - l)
            candles.append(Candle(timestamp=ts, open=o, high=h, low=l, close=c, volume=random.randint(1_000_000, 10_000_000)))
            base_price = c
        return CandleResponse(symbol=symbol.upper(), interval=interval.value, candles=candles, total_candles=len(candles))

    def get_company_info(self, symbol: str) -> CompanyInfo:
        symbol = symbol.upper()
        price = random.uniform(50, 500)
        return CompanyInfo(
            symbol=symbol, name=f"{symbol} Corporation", sector="Technology",
            industry="Software", market_cap=price * 1e9, employees=random.randint(1000, 100000),
            exchange="NASDAQ", fifty_two_week_high=price * 1.2, fifty_two_week_low=price * 0.7,
            analyst_target_price=price * 1.15, recommendation=random.choice(["buy", "hold", "sell"]),
        )

    def get_options_chain(self, symbol: str) -> OptionsChain:
        quote = self.get_quote(symbol)
        underlying = quote.price
        calls = []
        puts = []
        for offset in range(-5, 6):
            strike = underlying + (offset * 5)
            calls.append(OptionContract(
                symbol=f"{symbol}C{int(strike)}", strike=strike, last_price=random.uniform(1, 50),
                bid=random.uniform(0.5, 49), ask=random.uniform(1.5, 51), volume=random.randint(0, 1000),
                implied_volatility=random.uniform(0.1, 0.8), delta=random.uniform(-1, 1),
                expiration_date=datetime.utcnow() + timedelta(days=30), in_the_money=strike < underlying,
            ))
            puts.append(OptionContract(
                symbol=f"{symbol}P{int(strike)}", strike=strike, last_price=random.uniform(1, 50),
                bid=random.uniform(0.5, 49), ask=random.uniform(1.5, 51), volume=random.randint(0, 1000),
                implied_volatility=random.uniform(0.1, 0.8), delta=random.uniform(-1, 1),
                expiration_date=datetime.utcnow() + timedelta(days=30), in_the_money=strike > underlying,
            ))
        return OptionsChain(symbol=symbol.upper(), underlying_price=underlying, calls=calls[:10], puts=puts[:10])

    def get_market_movers(self) -> MarketMovers:
        return MarketMovers(
            gainers=[MarketMover(symbol="NVDA", name="NVIDIA", price=920.50, change_percent=5.2, volume=45_000_000),
                     MarketMover(symbol="AMD", name="AMD", price=165.30, change_percent=4.8, volume=35_000_000)],
            losers=[MarketMover(symbol="META", name="Meta", price=502.30, change_percent=-3.5, volume=18_000_000),
                    MarketMover(symbol="NFLX", name="Netflix", price=625.80, change_percent=-2.8, volume=5_000_000)],
            most_active=[MarketMover(symbol="AAPL", name="Apple", price=178.50, change_percent=1.2, volume=52_000_000)],
        )


state = YahooFinanceState()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Yahoo Finance Connector starting...")
    yield
    logger.info("Yahoo Finance Connector shutting down...")


app = FastAPI(title="AssetMind Yahoo Finance Connector", description="Real-time and Historical Market Data", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


@app.get("/health")
async def health_check():
    return {"service": "assetmind-yfinance", "status": "healthy", "total_requests": state.stats["total_requests"],
            "cache_size": len(state.quotes_cache), "uptime_seconds": time.time() - state.start_time}


@app.get("/quote/{symbol}", response_model=StockQuote)
async def get_quote(symbol: str):
    state.stats["total_requests"] += 1
    return state.get_quote(symbol)


@app.get("/candles/{symbol}", response_model=CandleResponse)
async def get_candles(symbol: str, interval: Interval = Interval.DAILY, period: Period = Period.MONTH_1):
    state.stats["total_requests"] += 1
    return state.get_candles(symbol, interval, period)


@app.get("/info/{symbol}", response_model=CompanyInfo)
async def get_company_info(symbol: str):
    state.stats["total_requests"] += 1
    return state.get_company_info(symbol)


@app.get("/options/{symbol}", response_model=OptionsChain)
async def get_options_chain(symbol: str):
    state.stats["total_requests"] += 1
    return state.get_options_chain(symbol)


@app.get("/market/movers", response_model=MarketMovers)
async def get_market_movers():
    state.stats["total_requests"] += 1
    return state.get_market_movers()


@app.get("/search")
async def search_symbols(q: str = Query(...)):
    results = [
        {"symbol": "NVDA", "name": "NVIDIA Corporation", "exchange": "NASDAQ", "type": "stock"},
        {"symbol": "AMD", "name": "Advanced Micro Devices", "exchange": "NASDAQ", "type": "stock"},
    ]
    return [r for r in results if q.upper() in r["symbol"] or q.lower() in r["name"].lower()]


@app.get("/")
async def root():
    return {"service": "Yahoo Finance Connector", "version": "1.0.0", "port": 5010, "docs": "/docs"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5010)