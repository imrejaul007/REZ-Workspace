"""
AssetMind Economic Twin Service
Economic modeling and scenario analysis
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum
import uuid
import random

# ============================================================================
# Configuration
# ============================================================================

app = FastAPI(
    title="AssetMind Economic Twin",
    description="Economic modeling and scenario analysis service",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# Enums
# ============================================================================

class EconomicIndicator(str, Enum):
    GDP = "gdp"
    INFLATION = "inflation"
    UNEMPLOYMENT = "unemployment"
    INTEREST_RATE = "interest_rate"
    TRADE_BALANCE = "trade_balance"
    CONSUMER_CONFIDENCE = "consumer_confidence"
    HOUSING_STARTS = "housing_starts"
    RETAIL_SALES = "retail_sales"
    PMI = "pmi"
    STOCK_MARKET = "stock_market"

class ScenarioType(str, Enum):
    BASE = "base"
    OPTIMISTIC = "optimistic"
    PESSIMISTIC = "pessimistic"
    STRESS = "stress"
    CUSTOM = "custom"

class Region(str, Enum):
    GLOBAL = "global"
    NORTH_AMERICA = "north_america"
    EUROPE = "europe"
    ASIA_PACIFIC = "asia_pacific"
    LATIN_AMERICA = "latin_america"
    MIDDLE_EAST = "middle_east"
    AFRICA = "africa"

class TimeHorizon(str, Enum):
    QUARTERLY = "quarterly"
    ANNUAL = "annual"
    MULTI_YEAR = "multi_year"

class EconomicCycle(str, Enum):
    EXPANSION = "expansion"
    PEAK = "peak"
    CONTRACTION = "contraction"
    TROUGH = "trough"

# ============================================================================
# Pydantic Models
# ============================================================================

class IndicatorValue(BaseModel):
    indicator: EconomicIndicator
    value: float
    unit: str
    timestamp: datetime
    source: str
    confidence: float = Field(ge=0, le=1)

class HistoricalDataPoint(BaseModel):
    date: date
    value: float
    adjusted_value: Optional[float] = None

class EconomicForecast(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    indicator: EconomicIndicator
    horizon: TimeHorizon
    predictions: List[Dict[str, Any]]  # [{date, value, confidence}]
    model_used: str
    accuracy_score: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Scenario(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    type: ScenarioType
    region: Region = Region.GLOBAL

    # Assumptions
    assumptions: Dict[str, float]  # indicator -> value
    probability: float = Field(ge=0, le=1, default=0.33)

    # Impact
    gdp_impact: float  # percentage change
    inflation_impact: float
    employment_impact: float
    market_impact: float

    # Timeline
    start_date: date
    end_date: date
    horizon: TimeHorizon

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ScenarioComparison(BaseModel):
    scenarios: List[Scenario]
    metrics: List[str]
    comparison_data: Dict[str, List[Dict[str, Any]]]

class EconomicModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    model_type: str  # VAR, ARIMA, DSGE, etc.
    indicators: List[EconomicIndicator]
    variables: List[str]
    parameters: Dict[str, float]
    accuracy_metrics: Dict[str, float]
    last_trained: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MarketImpact(BaseModel):
    sector: str
    impact_score: float = Field(ge=-1, le=1)
    affected_assets: List[str]
    description: str

class EconomicTwin(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    region: Region
    cycle: EconomicCycle

    # Current state
    current_gdp: float
    current_inflation: float
    current_unemployment: float
    current_interest_rate: float

    # Growth rates
    gdp_growth: float
    inflation_change: float

    # Projections
    next_quarter_gdp: float
    next_year_gdp: float

    # Health metrics
    health_score: float = Field(ge=0, le=100)
    stability_index: float = Field(ge=0, le=1)
    risk_factors: List[str] = []

    last_updated: datetime = Field(default_factory=datetime.utcnow)

class WhatIfAnalysis(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str

    # Trigger
    trigger_event: str
    trigger_magnitude: float

    # Expected outcomes
    affected_indicators: List[EconomicIndicator]
    expected_changes: Dict[str, float]

    # Timeline
    timeline_days: int
    phases: List[Dict[str, Any]]

    created_at: datetime = Field(default_factory=datetime.utcnow)

# ============================================================================
# In-Memory Storage
# ============================================================================

scenarios_db: Dict[str, Scenario] = {}
models_db: Dict[str, EconomicModel] = {}
forecasts_db: Dict[str, List[EconomicForecast]] = {}
economic_twins_db: Dict[str, EconomicTwin] = {}
historical_data: Dict[str, List[HistoricalDataPoint]] = {}

# Initialize sample data
_initialize_sample_data()

def _initialize_sample_data():
    twins = [
        EconomicTwin(
            name="USA Economic Twin",
            region=Region.NORTH_AMERICA,
            cycle=EconomicCycle.EXPANSION,
            current_gdp=26700000000000,
            current_inflation=3.2,
            current_unemployment=3.8,
            current_interest_rate=5.25,
            gdp_growth=2.1,
            inflation_change=-0.3,
            next_quarter_gdp=26900000000000,
            next_year_gdp=27500000000000,
            health_score=75.5,
            stability_index=0.82,
            risk_factors=["Geopolitical tensions", "Fed policy uncertainty"]
        ),
        EconomicTwin(
            name="EU Economic Twin",
            region=Region.EUROPE,
            cycle=EconomicCycle.CONTRACTION,
            current_gdp=17000000000000,
            current_inflation=2.8,
            current_unemployment=6.5,
            current_interest_rate=4.5,
            gdp_growth=0.5,
            inflation_change=-1.2,
            next_quarter_gdp=16900000000000,
            next_year_gdp=17100000000000,
            health_score=58.0,
            stability_index=0.65,
            risk_factors=["Energy crisis", "Political instability"]
        ),
    ]
    for twin in twins:
        economic_twins_db[twin.id] = twin

# ============================================================================
# Health Check
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "assetmind-economic-twin",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "scenarios_count": len(scenarios_db),
        "twins_count": len(economic_twins_db)
    }

@app.get("/ready")
async def readiness_check():
    """Readiness check"""
    return {"ready": True}

# ============================================================================
# Economic Twin Endpoints
# ============================================================================

@app.get("/api/v1/economic-twins", response_model=List[EconomicTwin])
async def list_economic_twins(region: Optional[Region] = None):
    """List all economic twins"""
    twins = list(economic_twins_db.values())
    if region:
        twins = [t for t in twins if t.region == region]
    return twins

@app.get("/api/v1/economic-twins/{twin_id}", response_model=EconomicTwin)
async def get_economic_twin(twin_id: str):
    """Get economic twin details"""
    if twin_id not in economic_twins_db:
        raise HTTPException(status_code=404, detail="Economic twin not found")
    return economic_twins_db[twin_id]

@app.post("/api/v1/economic-twins", response_model=EconomicTwin, status_code=201)
async def create_economic_twin(twin: EconomicTwin):
    """Create a new economic twin"""
    economic_twins_db[twin.id] = twin
    return twin

@app.put("/api/v1/economic-twins/{twin_id}", response_model=EconomicTwin)
async def update_economic_twin(twin_id: str, twin: EconomicTwin):
    """Update economic twin"""
    if twin_id not in economic_twins_db:
        raise HTTPException(status_code=404, detail="Economic twin not found")
    twin.last_updated = datetime.utcnow()
    economic_twins_db[twin_id] = twin
    return twin

# ============================================================================
# Scenario Endpoints
# ============================================================================

@app.post("/api/v1/scenarios", response_model=Scenario, status_code=201)
async def create_scenario(scenario: Scenario):
    """Create a new economic scenario"""
    scenarios_db[scenario.id] = scenario
    return scenario

@app.get("/api/v1/scenarios", response_model=List[Scenario])
async def list_scenarios(
    type: Optional[ScenarioType] = None,
    region: Optional[Region] = None
):
    """List scenarios with filters"""
    scenarios = list(scenarios_db.values())
    if type:
        scenarios = [s for s in scenarios if s.type == type]
    if region:
        scenarios = [s for s in scenarios if s.region == region]
    return scenarios

@app.get("/api/v1/scenarios/{scenario_id}", response_model=Scenario)
async def get_scenario(scenario_id: str):
    """Get scenario details"""
    if scenario_id not in scenarios_db:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return scenarios_db[scenario_id]

@app.post("/api/v1/scenarios/generate", response_model=List[Scenario])
async def generate_scenarios(
    base_conditions: Dict[str, float],
    count: int = Query(default=3, le=10)
):
    """Generate standard scenarios (base, optimistic, pessimistic)"""
    scenarios = []
    types = [ScenarioType.PESSIMISTIC, ScenarioType.BASE, ScenarioType.OPTIMISTIC]

    for i, sc_type in enumerate(types[:count]):
        scenario = Scenario(
            name=f"{sc_type.value.capitalize()} Scenario",
            description=f"Economic forecast based on {sc_type.value} assumptions",
            type=sc_type,
            region=Region.GLOBAL,
            assumptions=base_conditions.copy(),
            probability=0.33 if count == 3 else (0.5 if i == 1 else 0.25),
            gdp_impact=(-2.0 + i * 2.0) if count == 3 else (i * 0.5 - 0.5),
            inflation_impact=(-0.5 + i * 0.5) if count == 3 else (i * 0.2),
            employment_impact=(-1.0 + i * 1.0) if count == 3 else (i * 0.3),
            market_impact=(-5.0 + i * 5.0) if count == 3 else (i * 1.5),
            start_date=date.today(),
            end_date=date.today().replace(year=date.today().year + 1)
        )
        scenarios.append(scenario)
        scenarios_db[scenario.id] = scenario

    return scenarios

@app.post("/api/v1/scenarios/compare", response_model=ScenarioComparison)
async def compare_scenarios(scenario_ids: List[str]):
    """Compare multiple scenarios"""
    scenarios = [scenarios_db[sid] for sid in scenario_ids if sid in scenarios_db]
    if len(scenarios) < 2:
        raise HTTPException(status_code=400, detail="At least 2 scenarios required")

    return ScenarioComparison(
        scenarios=scenarios,
        metrics=["gdp_impact", "inflation_impact", "employment_impact", "market_impact"],
        comparison_data={
            "gdp_impact": [{"name": s.name, "value": s.gdp_impact} for s in scenarios],
            "inflation_impact": [{"name": s.name, "value": s.inflation_impact} for s in scenarios],
        }
    )

# ============================================================================
# Forecasting Endpoints
# ============================================================================

@app.post("/api/v1/forecasts", response_model=EconomicForecast, status_code=201)
async def create_forecast(forecast: EconomicForecast):
    """Create economic forecast"""
    if forecast.indicator.value not in forecasts_db:
        forecasts_db[forecast.indicator.value] = []
    forecasts_db[forecast.indicator.value].append(forecast)
    return forecast

@app.get("/api/v1/forecasts/{indicator}", response_model=List[EconomicForecast])
async def get_forecasts(indicator: EconomicIndicator):
    """Get forecasts for an indicator"""
    return forecasts_db.get(indicator.value, [])

@app.get("/api/v1/forecasts/{indicator}/latest", response_model=Optional[EconomicForecast])
async def get_latest_forecast(indicator: EconomicIndicator):
    """Get latest forecast for an indicator"""
    forecasts = forecasts_db.get(indicator.value, [])
    return forecasts[-1] if forecasts else None

# ============================================================================
# Economic Models Endpoints
# ============================================================================

@app.post("/api/v1/models", response_model=EconomicModel, status_code=201)
async def create_model(model: EconomicModel):
    """Create economic model"""
    models_db[model.id] = model
    return model

@app.get("/api/v1/models", response_model=List[EconomicModel])
async def list_models():
    """List all models"""
    return list(models_db.values())

@app.get("/api/v1/models/{model_id}", response_model=EconomicModel)
async def get_model(model_id: str):
    """Get model details"""
    if model_id not in models_db:
        raise HTTPException(status_code=404, detail="Model not found")
    return models_db[model_id]

# ============================================================================
# What-If Analysis Endpoints
# ============================================================================

@app.post("/api/v1/what-if", response_model=WhatIfAnalysis, status_code=201)
async def run_what_if_analysis(analysis: WhatIfAnalysis):
    """Run what-if analysis"""
    # Simulate impact calculation
    for indicator in analysis.affected_indicators:
        base_change = analysis.trigger_magnitude * random.uniform(0.5, 1.5)
        analysis.expected_changes[indicator.value] = round(base_change, 2)

    # Generate phases
    analysis.phases = [
        {"phase": 1, "day": 0, "impact": analysis.trigger_magnitude},
        {"phase": 2, "day": analysis.timeline_days // 3, "impact": analysis.trigger_magnitude * 1.5},
        {"phase": 3, "day": analysis.timeline_days * 2 // 3, "impact": analysis.trigger_magnitude * 0.8},
        {"phase": 4, "day": analysis.timeline_days, "impact": analysis.trigger_magnitude * 0.3},
    ]

    return analysis

# ============================================================================
# Historical Data Endpoints
# ============================================================================

@app.get("/api/v1/historical/{indicator}")
async def get_historical_data(
    indicator: EconomicIndicator,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = Query(default=100, le=1000)
):
    """Get historical data for an indicator"""
    data = historical_data.get(indicator.value, [])

    if start_date:
        data = [d for d in data if d.date >= start_date]
    if end_date:
        data = [d for d in data if d.date <= end_date]

    return {
        "indicator": indicator.value,
        "data": [{"date": d.date.isoformat(), "value": d.value} for d in data[-limit:]],
        "count": len(data[-limit:])
    }

@app.post("/api/v1/historical/{indicator}")
async def add_historical_data(
    indicator: EconomicIndicator,
    data_points: List[HistoricalDataPoint]
):
    """Add historical data points"""
    if indicator.value not in historical_data:
        historical_data[indicator.value] = []
    historical_data[indicator.value].extend(data_points)
    return {"added": len(data_points)}

# ============================================================================
# Run with uvicorn
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5004)