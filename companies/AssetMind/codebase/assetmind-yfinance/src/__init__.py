"""
AssetMind - Yahoo Finance Data Connector
Port: 5010

Real-time and historical market data from Yahoo Finance.

Features:
- Stock quotes
- Historical candles
- Options chain
- Fundamentals
- News

Version: 1.0.0
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import yfinance as yf
import pandas as pd

app = FastAPI(title="AssetMind Yahoo Finance Connector")


class StockQuote(BaseModel):
    symbol: str
    price: float
    change: float
    change_percent: float
    volume: int
    market_cap: Optional[float] = None
    pe_ratio: Optional[float] = None
    fifty_two_week_high: Optional[float] = None
    fifty_two_week_low: Optional[float] = None


class Candle(BaseModel):
    timestamp: str
    open: float
    high: float
    low: float
    close: float
    volume: int


class CompanyInfo(BaseModel):
    symbol: str
    name: str
    sector: str
    industry: str
    employees: Optional[int] = None
    revenue: Optional[float] = None
    net_income: Optional[float] = None


@app.get("/health")
async def health():
    return {"service": "yfinance-connector", "status": "healthy"}


@app.get("/quote/{symbol}", response_model=StockQuote)
async def get_quote(symbol: str):
    """Get real-time quote"""
    try:
        ticker = yf.Ticker(symbol.upper())
        info = ticker.info

        return StockQuote(
            symbol=symbol.upper(),
            price=info.get('regularMarketPrice', 0),
            change=info.get('regularMarketChange', 0),
            change_percent=info.get('regularMarketChangePercent', 0),
            volume=info.get('regularMarketVolume', 0),
            market_cap=info.get('marketCap'),
            pe_ratio=info.get('trailingPE'),
            fifty_two_week_high=info.get('fiftyTwoWeekHigh'),
            fifty_two_week_low=info.get('fiftyTwoWeekLow')
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/candles/{symbol}", response_model=List[Candle])
async def get_candles(
    symbol: str,
    interval: str = "1d",
    period: str = "1mo"
) -> List[Candle]:
    """Get historical candles"""
    try:
        ticker = yf.Ticker(symbol.upper())
        hist = ticker.history(period=period, interval=interval)

        candles = []
        for timestamp, row in hist.iterrows():
            candles.append(Candle(
                timestamp=timestamp.isoformat(),
                open=float(row['Open']),
                high=float(row['High']),
                low=float(row['Low']),
                close=float(row['Close']),
                volume=int(row['Volume'])
            ))

        return candles
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/info/{symbol}", response_model=CompanyInfo)
async def get_company_info(symbol: str):
    """Get company fundamentals"""
    try:
        ticker = yf.Ticker(symbol.upper())
        info = ticker.info

        return CompanyInfo(
            symbol=symbol.upper(),
            name=info.get('shortName', ''),
            sector=info.get('sector', ''),
            industry=info.get('industry', ''),
            employees=info.get('fullTimeEmployees'),
            revenue=info.get('totalRevenue'),
            net_income=info.get('netIncomeToCommon')
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/options/{symbol}")
async def get_options_chain(symbol: str):
    """Get options chain"""
    try:
        ticker = yf.Ticker(symbol.upper())
        options = ticker.option_chain()

        return {
            "symbol": symbol.upper(),
            "calls": [
                {
                    "strike": float(c.strike),
                    "bid": float(c.bid),
                    "ask": float(c.ask),
                    "volume": int(c.volume) if hasattr(c, 'volume') else 0
                }
                for _, c in options.calls.head(10).iterrows()
            ],
            "puts": [
                {
                    "strike": float(p.strike),
                    "bid": float(p.bid),
                    "ask": float(p.ask),
                    "volume": int(p.volume) if hasattr(p, 'volume') else 0
                }
                for _, p in options.puts.head(10).iterrows()
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/search")
async def search_symbols(query: str):
    """Search for symbols"""
    # Yahoo Finance doesn't have search, return common ones
    common = {
        "NVDA": "NVIDIA Corporation",
        "AAPL": "Apple Inc",
        "MSFT": "Microsoft Corporation",
        "GOOGL": "Alphabet Inc",
        "AMZN": "Amazon.com Inc",
        "META": "Meta Platforms Inc",
        "TSLA": "Tesla Inc"
    }

    results = [
        {"symbol": k, "name": v}
        for k, v in common.items()
        if query.lower() in v.lower() or query.lower() in k.lower()
    ]

    return {"results": results, "query": query}


@app.get("/market/movers")
async def get_market_movers():
    """Get top gaining/losing stocks"""
    try:
        # Major indices
        tickers = yf.Tickers('NVDA AAPL MSFT GOOGL AMZN META TSLA')

        movers = []
        for ticker in ['NVDA', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA']:
            t = yf.Ticker(ticker)
            info = t.info
            movers.append({
                "symbol": ticker,
                "price": info.get('regularMarketPrice', 0),
                "change_percent": info.get('regularMarketChangePercent', 0)
            })

        movers.sort(key=lambda x: x['change_percent'], reverse=True)

        return {
            "gainers": movers[:3],
            "losers": movers[-3:][::-1]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/batch/{symbols}")
async def get_batch_quotes(symbols: str):
    """Get quotes for multiple symbols"""
    symbol_list = symbols.split(',')
    results = []

    for symbol in symbol_list[:20]:  # Limit to 20
        try:
            ticker = yf.Ticker(symbol.strip().upper())
            info = ticker.info
            results.append({
                "symbol": symbol.strip().upper(),
                "price": info.get('regularMarketPrice', 0),
                "change_percent": info.get('regularMarketChangePercent', 0)
            })
        except:
            results.append({"symbol": symbol.strip().upper(), "error": "Not found"})

    return {"quotes": results}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5010)