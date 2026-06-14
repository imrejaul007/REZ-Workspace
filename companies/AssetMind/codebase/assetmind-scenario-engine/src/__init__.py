"""
AssetMind - Scenario Engine
Port: 5141

Causal simulation engine.

User asks: "What happens if oil reaches $150?"

AssetMind answers:
- Airlines ↓
- Logistics ↓
- Inflation ↑
- Interest Rates ↑
- Oil Companies ↑

This is where Knowledge Graph + Memory become powerful.

Version: 1.0.0
Date: June 9, 2026
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


app = FastAPI(title="AssetMind Scenario Engine", version="1.0.0")


class ScenarioType(str, Enum):
    COMMODITY_SHOCK = "commodity_shock"
    RATE_SHOCK = "rate_shock"
    GEOPOLITICAL = "geopolitical"
    REGULATORY = "regulatory"
    CUSTOM = "custom"


class Scenario(BaseModel):
    scenario_id: str
    scenario_type: ScenarioType
    trigger: str
    magnitude: float

    # Cascading effects
    sector_effects: Dict[str, Dict] = Field(default_factory=dict)
    asset_effects: Dict[str, Dict] = Field(default_factory=dict)

    # Portfolio impact
    hedging_assets: List[str] = Field(default_factory=list)
    risky_assets: List[str] = Field(default_factory=list)

    # Probability
    probability: float = 0.3
    time_horizon: str = "6 months"

    created_at: datetime


SCENARIOS: Dict[str, Scenario] = {}


@app.get("/health")
async def health_check():
    return {"service": "assetmind-scenario-engine", "status": "healthy", "port": 5141}


@app.get("/")
async def root():
    return {
        "service": "Scenario Engine",
        "description": "Causal simulation - What happens if X?"
    }


@app.post("/simulate")
async def simulate(scenario_type: ScenarioType, trigger: str, magnitude: float):
    """Run a scenario simulation"""
    scenario_id = f"scenario_{len(SCENARIOS) + 1}"

    if scenario_type == ScenarioType.COMMODITY_SHOCK:
        # Oil shock simulation
        effects = {
            "airlines": {"impact": "negative", "magnitude": -15, "reason": "Fuel costs surge"},
            "logistics": {"impact": "negative", "magnitude": -10, "reason": "Shipping costs"},
            "retail": {"impact": "negative", "magnitude": -5, "reason": "Inflation pressure"},
            "energy": {"impact": "positive", "magnitude": 20, "reason": "Revenue surge"},
            "defense": {"impact": "positive", "magnitude": 5, "reason": "Geopolitical risk premium"},
            "utilities": {"impact": "negative", "magnitude": -8, "reason": "Input costs"}
        }
        hedging = ["GLD", "OIL", "XLE", "TLT"]
        risky = ["AAL", "DAL", "FDX", "AMZN"]

    elif scenario_type == ScenarioType.RATE_SHOCK:
        effects = {
            "banks": {"impact": "positive", "magnitude": 8, "reason": "Net interest margin"},
            "real_estate": {"impact": "negative", "magnitude": -15, "reason": "Mortgage pressure"},
            "tech": {"impact": "negative", "magnitude": -10, "reason": "Valuation compression"},
            "utilities": {"impact": "negative", "magnitude": -12, "reason": "Bond proxy"},
            "financials": {"impact": "positive", "magnitude": 5, "reason": "Spread widening"}
        }
        hedging = ["TLT", "BIL", "cash"]
        risky = ["ARKK", "QQQ", "real_estate_etf"]

    else:
        effects = {"general": {"impact": "mixed", "magnitude": 5}}
        hedging = ["GLD", "TLT"]
        risky = ["SPY"]

    scenario = Scenario(
        scenario_id=scenario_id,
        scenario_type=scenario_type,
        trigger=trigger,
        magnitude=magnitude,
        sector_effects=effects,
        hedging_assets=hedging,
        risky_assets=risky,
        created_at=datetime.utcnow()
    )

    SCENARIOS[scenario_id] = scenario
    return scenario


@app.get("/scenarios")
async def list_scenarios():
    return {"scenarios": list(SCENARIOS.values())}


@app.get("/scenarios/{scenario_id}")
async def get_scenario(scenario_id: str):
    if scenario_id not in SCENARIOS:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return SCENARIOS[scenario_id]


@app.get("/portfolio-impact")
async def get_portfolio_impact(holdings: List[Dict]):
    """Calculate portfolio impact across all active scenarios"""
    impacts = []
    for scenario in SCENARIOS.values():
        portfolio_impact = 0
        for holding in holdings:
            symbol = holding.get("symbol")
            weight = holding.get("weight", 0)

            # Find impact on this asset
            for sector, effect in scenario.sector_effects.items():
                if symbol in scenario.risky_assets:
                    portfolio_impact += weight * effect.get("magnitude", 0) / 100
                    break

        impacts.append({
            "scenario_id": scenario.scenario_id,
            "trigger": scenario.trigger,
            "portfolio_impact": portfolio_impact,
            "probability": scenario.probability
        })

    return {
        "impacts": sorted(impacts, key=lambda x: x["portfolio_impact"]),
        "worst_case": impacts[-1] if impacts else None,
        "expected_impact": sum(i["portfolio_impact"] * i["probability"] for i in impacts)
    }


@app.get("/hedging")
async def get_hedging_recommendations():
    """Get hedging recommendations for current scenarios"""
    all_hedging = set()
    for scenario in SCENARIOS.values():
        all_hedging.update(scenario.hedging_assets)

    return {
        "hedges": list(all_hedging),
        "reasoning": "Diversified hedges across scenarios"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5141)