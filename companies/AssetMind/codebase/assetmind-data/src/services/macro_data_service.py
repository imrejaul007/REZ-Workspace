"""
AssetMind - Macro Data Service
Port: 5015
"""

from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


app = FastAPI(title="AssetMind Macro Data Service", version="1.0.0")


class EconomicIndicator(BaseModel):
    name: str
    value: float
    previous: float
    change: float
    change_percent: float
    unit: str
    source: str
    timestamp: datetime


class USIndicators(BaseModel):
    # Interest Rates
    fed_funds_rate: float
    prime_rate: float
    y10_yield: float
    y2_yield: float

    # Inflation
    cpi_yoy: float
    core_cpi_yoy: float
    ppi_yoy: float

    # Growth
    gdp_qoq: float
    gdp_yoy: float

    # Employment
    unemployment: float
    nonfarm_payrolls: float
    labor_participation: float

    # Consumer
    consumer_confidence: float
    retail_sales_mom: float


class GlobalIndicators(BaseModel):
    # Major Economies
    us_gdp_growth: float
    eu_gdp_growth: float
    china_gdp_growth: float
    india_gdp_growth: float
    japan_gdp_growth: float

    # Central Banks
    ecb_rate: float
    boj_rate: float
    boc_rate: float
    rbi_rate: float

    # Global Markets
    global_manufacturing_pmi: float
    global_services_pmi: float


# Current mock data
US_MACRO = {
    "fed_funds_rate": 5.25,
    "prime_rate": 8.50,
    "y10_yield": 4.45,
    "y2_yield": 4.82,
    "cpi_yoy": 3.4,
    "core_cpi_yoy": 3.6,
    "ppi_yoy": 2.3,
    "gdp_qoq": 2.1,
    "gdp_yoy": 2.8,
    "unemployment": 3.9,
    "nonfarm_payrolls": 272000,
    "labor_participation": 62.7,
    "consumer_confidence": 103.5,
    "retail_sales_mom": 0.3
}

GLOBAL_MACRO = {
    "us_gdp_growth": 2.8,
    "eu_gdp_growth": 0.4,
    "china_gdp_growth": 4.9,
    "india_gdp_growth": 6.3,
    "japan_gdp_growth": 1.2,
    "ecb_rate": 4.50,
    "boj_rate": 0.10,
    "boc_rate": 5.00,
    "rbi_rate": 6.50,
    "global_manufacturing_pmi": 50.3,
    "global_services_pmi": 52.5
}


@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-macro-data",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5015,
        "source": "fred_worldbank"
    }


@app.get("/us")
async def get_us_indicators():
    """Get US economic indicators"""
    return {**US_MACRO, "timestamp": datetime.utcnow().isoformat()}


@app.get("/global")
async def get_global_indicators():
    """Get global economic indicators"""
    return {**GLOBAL_MACRO, "timestamp": datetime.utcnow().isoformat()}


@app.get("/indicators/{indicator_name}")
async def get_indicator(indicator_name: str):
    """Get a specific indicator"""
    # Try US indicators first
    if indicator_name.lower() in [k.lower() for k in US_MACRO.keys()]:
        for k, v in US_MACRO.items():
            if k.lower() == indicator_name.lower():
                return {"indicator": k, "value": v, "source": "FRED", "timestamp": datetime.utcnow().isoformat()}

    # Try global indicators
    if indicator_name.lower() in [k.lower() for k in GLOBAL_MACRO.keys()]:
        for k, v in GLOBAL_MACRO.items():
            if k.lower() == indicator_name.lower():
                return {"indicator": k, "value": v, "source": "World Bank", "timestamp": datetime.utcnow().isoformat()}

    return {"error": f"Indicator {indicator_name} not found"}


@app.get("/rates")
async def get_interest_rates():
    """Get all interest rates"""
    return {
        "fed_funds_rate": US_MACRO["fed_funds_rate"],
        "prime_rate": US_MACRO["prime_rate"],
        "y10_yield": US_MACRO["y10_yield"],
        "y2_yield": US_MACRO["y2_yield"],
        "ecb_rate": GLOBAL_MACRO["ecb_rate"],
        "boj_rate": GLOBAL_MACRO["boj_rate"],
        "boc_rate": GLOBAL_MACRO["boc_rate"],
        "rbi_rate": GLOBAL_MACRO["rbi_rate"],
        "yield_curve": {
            "2y": US_MACRO["y2_yield"],
            "10y": US_MACRO["y10_yield"],
            "spread": US_MACRO["y10_yield"] - US_MACRO["y2_yield"]
        },
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/inflation")
async def get_inflation_indicators():
    """Get inflation indicators"""
    return {
        "us_cpi_yoy": US_MACRO["cpi_yoy"],
        "us_core_cpi_yoy": US_MACRO["core_cpi_yoy"],
        "us_ppi_yoy": US_MACRO["ppi_yoy"],
        "interpretation": _interpret_inflation(US_MACRO["cpi_yoy"]),
        "timestamp": datetime.utcnow().isoformat()
    }


def _interpret_inflation(cpi: float) -> str:
    if cpi > 5:
        return "HIGH - Fed likely to remain hawkish"
    elif cpi > 3:
        return "ELEVATED - Gradual cooling expected"
    elif cpi > 2:
        return "MODERATE - Near target, monitoring closely"
    else:
        return "LOW - Risk of deflation concerns"


@app.get("/growth")
async def get_growth_indicators():
    """Get GDP growth indicators"""
    return {
        "us_gdp_qoq": US_MACRO["gdp_qoq"],
        "us_gdp_yoy": US_MACRO["gdp_yoy"],
        "eu_gdp_growth": GLOBAL_MACRO["eu_gdp_growth"],
        "china_gdp_growth": GLOBAL_MACRO["china_gdp_growth"],
        "india_gdp_growth": GLOBAL_MACRO["india_gdp_growth"],
        "japan_gdp_growth": GLOBAL_MACRO["japan_gdp_growth"],
        "global_manufacturing_pmi": GLOBAL_MACRO["global_manufacturing_pmi"],
        "global_services_pmi": GLOBAL_MACRO["global_services_pmi"],
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/employment")
async def get_employment_indicators():
    """Get employment indicators"""
    return {
        "unemployment": US_MACRO["unemployment"],
        "nonfarm_payrolls": US_MACRO["nonfarm_payrolls"],
        "labor_participation": US_MACRO["labor_participation"],
        "interpretation": _interpret_employment(US_MACRO["unemployment"], US_MACRO["nonfarm_payrolls"]),
        "timestamp": datetime.utcnow().isoformat()
    }


def _interpret_employment(unemployment: float, payrolls: float) -> str:
    if unemployment < 4:
        return "VERY TIGHT - Wage pressure likely"
    elif unemployment < 5:
        return "TIGHT - Fed watching wage growth"
    else:
        return "NORMAL - Labor market balanced"

    if payrolls > 200000:
        return "STRONG - Above breakeven levels"
    elif payrolls > 100000:
        return "HEALTHY - Solid job creation"
    else:
        return "WEAK - Concern about growth"


@app.get("/consumer")
async def get_consumer_indicators():
    """Get consumer sentiment indicators"""
    return {
        "consumer_confidence": US_MACRO["consumer_confidence"],
        "retail_sales_mom": US_MACRO["retail_sales_mom"],
        "interpretation": "CONFIDENT" if US_MACRO["consumer_confidence"] > 100 else "CAUTIOUS",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/summary")
async def get_macro_summary():
    """Get overall macro summary"""
    return {
        "regime": _determine_macro_regime(US_MACRO, GLOBAL_MACRO),
        "rates": {
            "fed_stance": "RESTRICTIVE" if US_MACRO["fed_funds_rate"] > 5 else "ACCOMMODATIVE",
            "yield_curve": "INVERTED" if US_MACRO["y2_yield"] > US_MACRO["y10_yield"] else "NORMAL",
            "curve_spread": US_MACRO["y10_yield"] - US_MACRO["y2_yield"]
        },
        "inflation": {
            "level": "HIGH" if US_MACRO["cpi_yoy"] > 4 else ("MODERATE" if US_MACRO["cpi_yoy"] > 2 else "LOW"),
            "trend": "FALLING" if US_MACRO["cpi_yoy"] < 4 else "STABLE"
        },
        "growth": {
            "us": "STRONG" if US_MACRO["gdp_qoq"] > 2 else ("MODERATE" if US_MACRO["gdp_qoq"] > 0 else "WEAK")
        },
        "labor": {
            "status": "TIGHT" if US_MACRO["unemployment"] < 4 else "NORMAL"
        },
        "timestamp": datetime.utcnow().isoformat()
    }


def _determine_macro_regime(us: Dict, global_d: Dict) -> str:
    if us["cpi_yoy"] > 4 and us["fed_funds_rate"] > 5:
        return "INFLATIONFIGHTING"
    elif us["gdp_qoq"] < 0 and us["cpi_yoy"] < 2:
        return "STAGFLATION"
    elif us["gdp_qoq"] > 2.5 and us["cpi_yoy"] > 3:
        return "GOLILOCK"
    elif us["gdp_qoq"] < 0:
        return "RECESSION_RISK"
    else:
        return "SLOWGROWTH"


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5015)
