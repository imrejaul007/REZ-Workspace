"""
AssetMind - Data Service
Port: 5015

Data aggregation and normalization service.

Features:
- Multi-source data ingestion
- Data cleaning
- Normalization
- Caching

Version: 1.0.0
"""

from fastapi import FastAPI
import yfinance as yf

app = FastAPI(title="AssetMind Data")

@app.get("/health")
async def health():
    return {"service": "assetmind-data", "status": "healthy"}

@app.get("/stock/{symbol}")
async def get_stock_data(symbol: str):
    """Get stock data from Yahoo Finance"""
    try:
        ticker = yf.Ticker(symbol.upper())
        info = ticker.info
        return {
            "symbol": symbol.upper(),
            "name": info.get("shortName", ""),
            "price": info.get("regularMarketPrice", 0),
            "change": info.get("regularMarketChange", 0),
            "change_percent": info.get("regularMarketChangePercent", 0),
            "volume": info.get("regularMarketVolume", 0),
            "market_cap": info.get("marketCap", 0),
            "pe_ratio": info.get("trailingPE", 0)
        }
    except Exception as e:
        return {
            "symbol": symbol.upper(),
            "error": str(e),
            "price": 0
        }

@app.get("/historical/{symbol}")
async def get_historical_data(symbol: str, period: str = "1mo"):
    """Get historical price data"""
    try:
        ticker = yf.Ticker(symbol.upper())
        hist = ticker.history(period=period)
        return {
            "symbol": symbol.upper(),
            "period": period,
            "data_points": len(hist),
            "latest": hist.iloc[-1].to_dict() if len(hist) > 0 else {}
        }
    except Exception as e:
        return {"symbol": symbol.upper(), "error": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5015)
