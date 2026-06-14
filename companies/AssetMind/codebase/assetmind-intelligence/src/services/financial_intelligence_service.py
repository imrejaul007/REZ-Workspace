"""
AssetMind - Financial Intelligence Service
Port: 5050
Analyzes financial statements, ratios, and fundamentals
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


app = FastAPI(title="AssetMind Financial Intelligence", version="1.0.0")


class FinancialAnalysis(BaseModel):
    symbol: str
    # Growth
    revenue_growth_1y: float
    revenue_growth_3y: float
    earnings_growth_1y: float

    # Profitability
    gross_margin: float
    operating_margin: float
    net_margin: float
    roe: float
    roa: float
    roic: float

    # Valuation
    pe_ratio: float
    forward_pe: float
    peg_ratio: float
    ev_ebitda: float
    price_book: float

    # Financial Health
    debt_equity: float
    current_ratio: float
    quick_ratio: float
    interest_coverage: float

    # Cash Flow
    fcf_yield: float
    cash_conversion: float

    # Scores
    growth_score: float = Field(..., ge=0, le=100)
    profitability_score: float = Field(..., ge=0, le=100)
    valuation_score: float = Field(..., ge=0, le=100)
    financial_health_score: float = Field(..., ge=0, le=100)
    overall_score: float = Field(..., ge=0, le=100)

    timestamp: datetime


# Mock financial data
MOCK_FINANCIALS = {
    "NVDA": FinancialAnalysis(
        symbol="NVDA",
        revenue_growth_1y=122.4,
        revenue_growth_3y=85.0,
        earnings_growth_1y=165.0,
        gross_margin=74.0,
        operating_margin=64.0,
        net_margin=53.0,
        roe=82.5,
        roa=38.0,
        roic=52.0,
        pe_ratio=45.0,
        forward_pe=35.0,
        peg_ratio=0.8,
        ev_ebitda=32.0,
        price_book=45.0,
        debt_equity=0.4,
        current_ratio=4.2,
        quick_ratio=3.8,
        interest_coverage=45.0,
        fcf_yield=1.8,
        cash_conversion=95.0,
        growth_score=95,
        profitability_score=95,
        valuation_score=60,
        financial_health_score=90,
        overall_score=85
    ),
    "AAPL": FinancialAnalysis(
        symbol="AAPL",
        revenue_growth_1y=4.3,
        revenue_growth_3y=9.2,
        earnings_growth_1y=11.2,
        gross_margin=46.2,
        operating_margin=29.8,
        net_margin=24.5,
        roe=160.0,
        roa=24.0,
        roic=45.0,
        pe_ratio=28.5,
        forward_pe=25.0,
        peg_ratio=3.5,
        ev_ebitda=20.0,
        price_book=45.0,
        debt_equity=1.5,
        current_ratio=0.99,
        quick_ratio=0.92,
        interest_coverage=15.0,
        fcf_yield=3.5,
        cash_conversion=98.0,
        growth_score=45,
        profitability_score=85,
        valuation_score=70,
        financial_health_score=70,
        overall_score=68
    ),
    "MSFT": FinancialAnalysis(
        symbol="MSFT",
        revenue_growth_1y=15.2,
        revenue_growth_3y=18.0,
        earnings_growth_1y=20.5,
        gross_margin=70.0,
        operating_margin=42.0,
        net_margin=35.0,
        roe=42.0,
        roa=18.0,
        roic=28.0,
        pe_ratio=35.0,
        forward_pe=30.0,
        peg_ratio=2.5,
        ev_ebitda=25.0,
        price_book=12.0,
        debt_equity=0.45,
        current_ratio=1.3,
        quick_ratio=1.2,
        interest_coverage=12.0,
        fcf_yield=2.2,
        cash_conversion=95.0,
        growth_score=75,
        profitability_score=90,
        valuation_score=65,
        financial_health_score=88,
        overall_score=80
    ),
}


@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-financial-intelligence",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5050
    }


@app.get("/analysis/{symbol}")
async def get_financial_analysis(symbol: str):
    """Get complete financial analysis for a symbol"""
    analysis = MOCK_FINANCIALS.get(symbol.upper())

    if not analysis:
        # Return default for unknown symbols
        return FinancialAnalysis(
            symbol=symbol.upper(),
            revenue_growth_1y=0, revenue_growth_3y=0, earnings_growth_1y=0,
            gross_margin=0, operating_margin=0, net_margin=0,
            roe=0, roa=0, roic=0,
            pe_ratio=0, forward_pe=0, peg_ratio=0, ev_ebitda=0, price_book=0,
            debt_equity=0, current_ratio=0, quick_ratio=0, interest_coverage=0,
            fcf_yield=0, cash_conversion=0,
            growth_score=50, profitability_score=50, valuation_score=50,
            financial_health_score=50, overall_score=50
        )

    return analysis


@app.get("/analysis/{symbol}/scores")
async def get_financial_scores(symbol: str):
    """Get just the financial scores"""
    analysis = MOCK_FINANCIALS.get(symbol.upper())

    if not analysis:
        return {
            "symbol": symbol.upper(),
            "growth_score": 50,
            "profitability_score": 50,
            "valuation_score": 50,
            "financial_health_score": 50,
            "overall_score": 50
        }

    return {
        "symbol": symbol.upper(),
        "growth_score": analysis.growth_score,
        "profitability_score": analysis.profitability_score,
        "valuation_score": analysis.valuation_score,
        "financial_health_score": analysis.financial_health_score,
        "overall_score": analysis.overall_score
    }


@app.get("/ratios/{symbol}")
async def get_financial_ratios(symbol: str):
    """Get detailed financial ratios"""
    analysis = MOCK_FINANCIALS.get(symbol.upper())

    if not analysis:
        raise HTTPException(status_code=404, detail="Financial data not found")

    return {
        "symbol": symbol.upper(),
        "profitability": {
            "gross_margin": analysis.gross_margin,
            "operating_margin": analysis.operating_margin,
            "net_margin": analysis.net_margin,
            "roe": analysis.roe,
            "roa": analysis.roa,
            "roic": analysis.roic
        },
        "valuation": {
            "pe_ratio": analysis.pe_ratio,
            "forward_pe": analysis.forward_pe,
            "peg_ratio": analysis.peg_ratio,
            "ev_ebitda": analysis.ev_ebitda,
            "price_book": analysis.price_book
        },
        "financial_health": {
            "debt_equity": analysis.debt_equity,
            "current_ratio": analysis.current_ratio,
            "quick_ratio": analysis.quick_ratio,
            "interest_coverage": analysis.interest_coverage
        }
    }


@app.get("/compare")
async def compare_financials(symbols: str):
    """Compare financials for multiple symbols"""
    symbol_list = [s.strip().upper() for s in symbols.split(",")]
    comparisons = []

    for symbol in symbol_list:
        analysis = MOCK_FINANCIALS.get(symbol)
        if analysis:
            comparisons.append({
                "symbol": symbol,
                "overall_score": analysis.overall_score,
                "growth_score": analysis.growth_score,
                "profitability_score": analysis.profitability_score,
                "valuation_score": analysis.valuation_score,
                "pe_ratio": analysis.pe_ratio,
                "roe": analysis.roe
            })

    return {"comparisons": comparisons}


@app.get("/summary")
async def get_financial_summary():
    """Get overall market financial health"""
    if not MOCK_FINANCIALS:
        return {"status": "no data"}

    avg_scores = {
        "avg_growth": sum(a.growth_score for a in MOCK_FINANCIALS.values()) / len(MOCK_FINANCIALS),
        "avg_profitability": sum(a.profitability_score for a in MOCK_FINANCIALS.values()) / len(MOCK_FINANCIALS),
        "avg_valuation": sum(a.valuation_score for a in MOCK_FINANCIALS.values()) / len(MOCK_FINANCIALS),
        "avg_financial_health": sum(a.financial_health_score for a in MOCK_FINANCIALS.values()) / len(MOCK_FINANCIALS),
    }
    avg_scores["avg_overall"] = sum(avg_scores.values()) / 4

    return {
        "tracked_symbols": len(MOCK_FINANCIALS),
        "avg_scores": avg_scores,
        "interpretation": "STRONG" if avg_scores["avg_overall"] > 70 else
                         ("MODERATE" if avg_scores["avg_overall"] > 50 else "WEAK")
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5050)
