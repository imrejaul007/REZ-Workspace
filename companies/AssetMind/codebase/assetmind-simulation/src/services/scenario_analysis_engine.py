"""
Scenario Analysis Engine
"What if" analysis for market scenarios
Port: 5200

This engine performs scenario analysis to answer questions like:
- "What if oil hits $150?"
- "What if Fed cuts 50bps?"
- Cascade impact analysis
- Historical scenario matching
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from enum import Enum
import logging
import asyncio
import numpy as np
from collections import defaultdict

logger = logging.getLogger(__name__)

app = FastAPI(title="AssetMind Scenario Analysis Engine", version="1.0.0", docs_url="/docs")


class ScenarioType(str, Enum):
    """Types of scenarios"""
    MACRO = "macro"  # Fed policy, GDP, inflation
    SECTOR = "sector"  # Sector-specific shocks
    GEOPOLITICAL = "geopolitical"  # Wars, tensions
    COMMODITY = "commodity"  # Oil, metals
    EARNINGS = "earnings"  # Earnings surprise
    TECHNICAL = "technical"  # Technical events


class ImpactDirection(str, Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"
    MIXED = "mixed"


class ScenarioVariable(BaseModel):
    """A variable in a scenario"""
    variable_id: str
    name: str
    current_value: float
    scenario_value: float
    change_pct: float
    unit: str


class AssetImpact(BaseModel):
    """Impact on an asset"""
    asset: str
    asset_name: str
    current_price: float
    scenario_price: float
    impact_pct: float
    direction: ImpactDirection
    confidence: float
    factors: List[str] = Field(default_factory=list)


class SectorImpact(BaseModel):
    """Impact on a sector"""
    sector: str
    sector_etf: str
    current_performance: float
    scenario_performance: float
    impact_pct: float
    direction: ImpactDirection
    top_assets: List[str] = Field(default_factory=list)
    bottom_assets: List[str] = Field(default_factory=list)


class ScenarioResult(BaseModel):
    """Result of scenario analysis"""
    scenario_id: str
    scenario_name: str
    scenario_type: ScenarioType
    description: str

    # Variables
    variables: List[ScenarioVariable]

    # Impact analysis
    asset_impacts: List[AssetImpact]
    sector_impacts: List[SectorImpact]

    # Summary
    total_affected_assets: int
    avg_impact: float
    max_impact: float
    min_impact: float

    # Cascade
    cascade_effects: List[Dict[str, Any]] = Field(default_factory=list)

    # Historical analog
    historical_analog: Optional[Dict[str, Any]] = None

    # Confidence
    confidence: float
    analysis_timestamp: datetime


class ScenarioAnalysisEngine:
    """
    Scenario analysis engine for "what if" analysis.

    Key capabilities:
    - Define and run scenarios
    - Calculate cascade impacts
    - Match historical analogs
    - Multi-factor analysis
    """

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.name = "Scenario Analysis"
        self.port = 5200
        self.version = "1.0.0"

        # Scenario templates
        self._initialize_scenario_templates()

        # Impact models
        self._initialize_impact_models()

        # Historical scenarios
        self.historical_scenarios: Dict[str, Dict[str, Any]] = {}

    def _initialize_scenario_templates(self):
        """Initialize scenario templates"""
        self.scenario_templates = {
            "oil_spike_150": {
                "name": "Oil Hits $150/barrel",
                "type": ScenarioType.COMMODITY,
                "description": "Oil supply disruption causes prices to spike to $150",
                "variables": [
                    {"name": "WTI Oil", "current": 78, "scenario": 150, "unit": "USD/barrel"},
                    {"name": "Energy Inflation", "current": 2, "scenario": 8, "unit": "%"},
                    {"name": "Consumer Spending", "current": 0, "scenario": -1.5, "unit": "%"},
                ],
                "asset_models": {
                    "XLE": {"impact": 0.9, "direction": ImpactDirection.POSITIVE},
                    "OIH": {"impact": 0.7, "direction": ImpactDirection.POSITIVE},
                    "USO": {"impact": 0.85, "direction": ImpactDirection.POSITIVE},
                    "XLY": {"impact": -0.4, "direction": ImpactDirection.NEGATIVE},
                    "XLP": {"impact": -0.2, "direction": ImpactDirection.NEGATIVE},
                    "TSLA": {"impact": -0.3, "direction": ImpactDirection.NEGATIVE},
                    "AAPL": {"impact": -0.15, "direction": ImpactDirection.NEGATIVE},
                }
            },
            "fed_cut_50bps": {
                "name": "Fed Cuts50bps",
                "type": ScenarioType.MACRO,
                "description": "Federal Reserve cuts rates by 50 basis points",
                "variables": [
                    {"name": "Fed Funds Rate", "current": 5.25, "scenario": 4.75, "unit": "%"},
                    {"name": "10Y Treasury", "current": 4.5, "scenario": 4.0, "unit": "%"},
                    {"name": "2Y Treasury", "current": 5.0, "scenario": 4.2, "unit": "%"},
                ],
                "asset_models": {
                    "TLT": {"impact": 0.5, "direction": ImpactDirection.POSITIVE},
                    "BND": {"impact": 0.3, "direction": ImpactDirection.POSITIVE},
                    "GLD": {"impact": 0.25, "direction": ImpactDirection.POSITIVE},
                    "XLF": {"impact": 0.35, "direction": ImpactDirection.POSITIVE},
                    "VNQ": {"impact": 0.4, "direction": ImpactDirection.POSITIVE},
                    "SPY": {"impact": 0.2, "direction": ImpactDirection.POSITIVE},
                    "QQQ": {"impact": 0.15, "direction": ImpactDirection.POSITIVE},
                }
            },
            "taiwan_crisis": {
                "name": "Taiwan Strait Crisis",
                "type": ScenarioType.GEOPOLITICAL,
                "description": "Military tensions in Taiwan Strait escalate",
                "variables": [
                    {"name": "Taiwan Risk Premium", "current": 0, "scenario": 15, "unit": "%"},
                    {"name": "Semiconductor Premium", "current": 0, "scenario": -25, "unit": "%"},
                    {"name": "Defense Spending", "current": 0, "scenario": 20, "unit": "%"},
                ],
                "asset_models": {
                    "SMH": {"impact": -0.40, "direction": ImpactDirection.NEGATIVE},
                    "SOXX": {"impact": -0.35, "direction": ImpactDirection.NEGATIVE},
                    "NVDA": {"impact": -0.30, "direction": ImpactDirection.NEGATIVE},
                    "AMD": {"impact": -0.30, "direction": ImpactDirection.NEGATIVE},
                    "TSM": {"impact": -0.50, "direction": ImpactDirection.NEGATIVE},
                    "LMT": {"impact": 0.35, "direction": ImpactDirection.POSITIVE},
                    "RTX": {"impact": 0.30, "direction": ImpactDirection.POSITIVE},
                    "NOC": {"impact": 0.30, "direction": ImpactDirection.POSITIVE},
                    "XLE": {"impact": 0.20, "direction": ImpactDirection.POSITIVE},
                }
            },
            "recession": {
                "name": "Hard Landing Recession",
                "type": ScenarioType.MACRO,
                "description": "Economy enters recession with GDP contraction",
                "variables": [
                    {"name": "GDP Growth", "current": 2.0, "scenario": -1.5, "unit": "%"},
                    {"name": "Unemployment", "current": 3.8, "scenario": 7.0, "unit": "%"},
                    {"name": "Corporate Earnings", "current": 0, "scenario": -15, "unit": "%"},
                ],
                "asset_models": {
                    "SPY": {"impact": -0.25, "direction": ImpactDirection.NEGATIVE},
                    "QQQ": {"impact": -0.35, "direction": ImpactDirection.NEGATIVE},
                    "IWM": {"impact": -0.30, "direction": ImpactDirection.NEGATIVE},
                    "XLP": {"impact": 0.15, "direction": ImpactDirection.POSITIVE},
                    "XLU": {"impact": 0.10, "direction": ImpactDirection.POSITIVE},
                    "GLD": {"impact": 0.20, "direction": ImpactDirection.POSITIVE},
                    "TLT": {"impact": 0.25, "direction": ImpactDirection.POSITIVE},
                    "VNQ": {"impact": -0.30, "direction": ImpactDirection.NEGATIVE},
                }
            },
            "ai_boom": {
                "name": "AI Spending Surge",
                "type": ScenarioType.SECTOR,
                "description": "AI infrastructure spending accelerates dramatically",
                "variables": [
                    {"name": "AI CapEx", "current": 50, "scenario": 200, "unit": "B USD"},
                    {"name": "Data Center Spending", "current": 0, "scenario": 30, "unit": "%"},
                    {"name": "GPU Demand", "current": 0, "scenario": 50, "unit": "%"},
                ],
                "asset_models": {
                    "NVDA": {"impact": 0.40, "direction": ImpactDirection.POSITIVE},
                    "AMD": {"impact": 0.30, "direction": ImpactDirection.POSITIVE},
                    "SMH": {"impact": 0.35, "direction": ImpactDirection.POSITIVE},
                    "MSFT": {"impact": 0.20, "direction": ImpactDirection.POSITIVE},
                    "GOOGL": {"impact": 0.20, "direction": ImpactDirection.POSITIVE},
                    "AMZN": {"impact": 0.15, "direction": ImpactDirection.POSITIVE},
                    "INTC": {"impact": -0.10, "direction": ImpactDirection.NEGATIVE},
                    "IBM": {"impact": 0.15, "direction": ImpactDirection.POSITIVE},
                }
            },
            "inflation_spike": {
                "name": "Inflation Resurgence",
                "type": ScenarioType.MACRO,
                "description": "Inflation spikes back above 5%",
                "variables": [
                    {"name": "CPI", "current": 3.2, "scenario": 5.5, "unit": "%"},
                    {"name": "Core CPI", "current": 4.0, "scenario": 5.0, "unit": "%"},
                    {"name": "Fed Funds Rate", "current": 5.25, "scenario": 6.0, "unit": "%"},
                ],
                "asset_models": {
                    "TLT": {"impact": -0.30, "direction": ImpactDirection.NEGATIVE},
                    "VNQ": {"impact": -0.20, "direction": ImpactDirection.NEGATIVE},
                    "XLP": {"impact": 0.15, "direction": ImpactDirection.POSITIVE},
                    "GLD": {"impact": 0.25, "direction": ImpactDirection.POSITIVE},
                    "USO": {"impact": 0.20, "direction": ImpactDirection.POSITIVE},
                    "SPY": {"impact": -0.15, "direction": ImpactDirection.NEGATIVE},
                    "QQQ": {"impact": -0.20, "direction": ImpactDirection.NEGATIVE},
                }
            }
        }

    def _initialize_impact_models(self):
        """Initialize sector and asset impact models"""
        self.sector_models = {
            "technology": {
                "etf": "XLK",
                "sensitivity": {
                    "interest_rates": -0.3,
                    "recession": -0.4,
                    "oil_price": -0.1,
                    "ai_spending": 0.5
                }
            },
            "energy": {
                "etf": "XLE",
                "sensitivity": {
                    "interest_rates": -0.1,
                    "recession": -0.3,
                    "oil_price": 0.9,
                    "inflation": 0.2
                }
            },
            "financials": {
                "etf": "XLF",
                "sensitivity": {
                    "interest_rates": 0.3,
                    "recession": -0.4,
                    "oil_price": 0.1,
                    "inflation": 0.1
                }
            },
            "consumer_staples": {
                "etf": "XLP",
                "sensitivity": {
                    "interest_rates": 0.1,
                    "recession": 0.2,
                    "oil_price": -0.2,
                    "inflation": 0.3
                }
            },
            "healthcare": {
                "etf": "XLV",
                "sensitivity": {
                    "interest_rates": 0.0,
                    "recession": 0.1,
                    "oil_price": -0.1,
                    "inflation": 0.1
                }
            },
            "real_estate": {
                "etf": "VNQ",
                "sensitivity": {
                    "interest_rates": -0.5,
                    "recession": -0.4,
                    "oil_price": -0.1,
                    "inflation": -0.2
                }
            }
        }

    def _get_asset_current_price(self, asset: str) -> float:
        """Get current price for an asset (mock)"""
        prices = {
            "NVDA": 878, "AMD": 178, "MSFT": 415, "GOOGL": 178,
            "AAPL": 189, "AMZN": 185, "META": 512, "TSLA": 182,
            "SPY": 528, "QQQ": 458, "IWM": 205,
            "XLE": 85, "OIH": 320, "XLY": 180, "XLP": 72,
            "TLT": 95, "BND": 72, "VNQ": 85, "XLF": 38,
            "XLK": 215, "SMH": 245, "SOXX": 135,
            "LMT": 465, "RTX": 95, "NOC": 485,
            "GLD": 195, "USO": 75
        }
        return prices.get(asset, 100)

    async def run_scenario(
        self,
        scenario_name: str,
        custom_variables: Optional[Dict[str, float]] = None
    ) -> ScenarioResult:
        """
        Run a scenario analysis.

        Args:
            scenario_name: Name of the scenario template or custom scenario
            custom_variables: Optional custom variable values
        """
        # Get template
        template = self.scenario_templates.get(scenario_name)

        if not template:
            raise HTTPException(status_code=404, detail=f"Scenario {scenario_name} not found")

        scenario_id = f"scenario_{datetime.utcnow().timestamp()}"

        # Build variables
        variables = []
        for var in template.get("variables", []):
            current = custom_variables.get(var["name"], var["current"]) if custom_variables else var["current"]
            scenario_val = custom_variables.get(var["name"], var["scenario"]) if custom_variables else var["scenario"]

            variables.append(ScenarioVariable(
                variable_id=f"var_{var['name'].replace(' ', '_')}",
                name=var["name"],
                current_value=current,
                scenario_value=scenario_val,
                change_pct=((scenario_val - current) / current * 100) if current != 0 else 0,
                unit=var["unit"]
            ))

        # Calculate asset impacts
        asset_models = template.get("asset_models", {})
        asset_impacts = []

        for asset, model in asset_models.items():
            current_price = self._get_asset_current_price(asset)
            impact_pct = model["impact"]
            scenario_price = current_price * (1 + impact_pct)

            asset_impacts.append(AssetImpact(
                asset=asset,
                asset_name=asset,
                current_price=current_price,
                scenario_price=scenario_price,
                impact_pct=impact_pct * 100,
                direction=model["direction"],
                confidence=0.8,
                factors=[f"Scenario: {scenario_name}"]
            ))

        # Calculate sector impacts
        sector_impacts = []
        sector_assets = defaultdict(list)

        for impact in asset_impacts:
            # Map asset to sector (simplified)
            sector = self._get_asset_sector(impact.asset)
            sector_assets[sector].append(impact)

        for sector, assets in sector_assets.items():
            if assets:
                avg_impact = sum(a.impact_pct for a in assets) / len(assets)
                sector_impacts.append(SectorImpact(
                    sector=sector,
                    sector_etf=self.sector_models.get(sector, {}).get("etf", "UNKNOWN"),
                    current_performance=0,
                    scenario_performance=avg_impact,
                    impact_pct=avg_impact,
                    direction=ImpactDirection.POSITIVE if avg_impact > 0 else ImpactDirection.NEGATIVE,
                    top_assets=[a.asset for a in sorted(assets, key=lambda x: x.impact_pct, reverse=True)[:3]],
                    bottom_assets=[a.asset for a in sorted(assets, key=lambda x: x.impact_pct)[:3]]
                ))

        # Calculate summary
        all_impacts = [a.impact_pct for a in asset_impacts]
        total_affected = len(asset_impacts)
        avg_impact = sum(all_impacts) / len(all_impacts) if all_impacts else 0
        max_impact = max(all_impacts) if all_impacts else 0
        min_impact = min(all_impacts) if all_impacts else 0

        # Generate cascade effects
        cascade_effects = await self._calculate_cascade_effects(scenario_name, asset_impacts)

        # Find historical analog
        historical_analog = self._find_historical_analog(scenario_name)

        return ScenarioResult(
            scenario_id=scenario_id,
            scenario_name=template["name"],
            scenario_type=ScenarioType(template["type"]),
            description=template["description"],
            variables=variables,
            asset_impacts=asset_impacts,
            sector_impacts=sector_impacts,
            total_affected_assets=total_affected,
            avg_impact=avg_impact,
            max_impact=max_impact,
            min_impact=min_impact,
            cascade_effects=cascade_effects,
            historical_analog=historical_analog,
            confidence=0.75,
            analysis_timestamp=datetime.utcnow()
        )

    def _get_asset_sector(self, asset: str) -> str:
        """Map asset to sector"""
        sector_map = {
            "NVDA": "technology", "AMD": "technology", "MSFT": "technology",
            "GOOGL": "technology", "AAPL": "technology", "AMZN": "technology",
            "META": "technology", "SMH": "technology", "SOXX": "technology",
            "XLE": "energy", "OIH": "energy", "USO": "energy",
            "XLF": "financials", "VNQ": "real_estate",
            "XLP": "consumer_staples", "XLY": "consumer_discretionary",
            "TLT": "bonds", "BND": "bonds",
            "LMT": "defense", "RTX": "defense", "NOC": "defense",
            "GLD": "commodities"
        }
        return sector_map.get(asset, "other")

    async def _calculate_cascade_effects(
        self,
        scenario_name: str,
        asset_impacts: List[AssetImpact]
    ) -> List[Dict[str, Any]]:
        """Calculate cascade effects"""
        cascades = []

        # Check for specific cascade patterns
        if "oil" in scenario_name.lower():
            cascades.append({
                "type": "input_cost",
                "description": "Higher oil prices increase input costs for manufacturing",
                "affected_sectors": ["technology", "consumer_discretionary"],
                "secondary_impact": -0.1
            })

        if "taiwan" in scenario_name.lower():
            cascades.append({
                "type": "supply_chain",
                "description": "Semiconductor supply chain disruption affects tech sector",
                "affected_sectors": ["technology", "automotive"],
                "secondary_impact": -0.15
            })
            cascades.append({
                "type": "defense_spending",
                "description": "Geopolitical tensions increase defense budgets",
                "affected_sectors": ["defense"],
                "secondary_impact": 0.10
            })

        if "recession" in scenario_name.lower():
            cascades.append({
                "type": "consumer_spending",
                "description": "Recession reduces consumer spending",
                "affected_sectors": ["consumer_discretionary", "technology"],
                "secondary_impact": -0.12
            })
            cascades.append({
                "type": "flight_to_safety",
                "description": "Capital flows to bonds and gold",
                "affected_sectors": ["bonds", "commodities"],
                "secondary_impact": 0.15
            })

        return cascades

    def _find_historical_analog(self, scenario_name: str) -> Optional[Dict[str, Any]]:
        """Find historical analog for scenario"""
        analogs = {
            "oil_spike_150": {
                "event": "1979 Oil Crisis",
                "year": 1979,
                "similarity": 0.75,
                "description": "Iranian Revolution caused oil spike to $30+",
                "lessons": [
                    "Consumer spending declined",
                    "Stagflation returned",
                    "Fed raised rates aggressively"
                ]
            },
            "fed_cut_50bps": {
                "event": "2007-2008 Rate Cuts",
                "year": 2007,
                "similarity": 0.65,
                "description": "Fed cut rates in response to housing crisis",
                "lessons": [
                    "Treasuries rallied",
                    "Banks benefited",
                    "Real estate initially recovered"
                ]
            },
            "taiwan_crisis": {
                "event": "1996 Taiwan Strait Crisis",
                "year": 1996,
                "similarity": 0.70,
                "description": "China conducted missile tests near Taiwan",
                "lessons": [
                    "Tech stocks sold off",
                    "Defense stocks rallied",
                    "Tensions eventually de-escalated"
                ]
            },
            "recession": {
                "event": "2008 Financial Crisis",
                "year": 2008,
                "similarity": 0.80,
                "description": "Lehman Brothers collapse led to recession",
                "lessons": [
                    "All risk assets sold off",
                    "Bonds and gold rallied",
                    "Unemployment spiked"
                ]
            }
        }

        return analogs.get(scenario_name)

    async def compare_scenarios(
        self,
        scenario_names: List[str]
    ) -> Dict[str, Any]:
        """Compare multiple scenarios"""
        results = {}

        for name in scenario_names:
            try:
                result = await self.run_scenario(name)
                results[name] = {
                    "avg_impact": result.avg_impact,
                    "max_impact": result.max_impact,
                    "min_impact": result.min_impact,
                    "affected_assets": result.total_affected_assets
                }
            except Exception as e:
                logger.error(f"Error running scenario {name}: {e}")

        return results

    async def create_custom_scenario(
        self,
        name: str,
        description: str,
        scenario_type: ScenarioType,
        variables: List[Dict[str, Any]],
        asset_models: Dict[str, Dict[str, Any]]
    ) -> str:
        """Create a custom scenario"""
        scenario_id = name.lower().replace(" ", "_")

        self.scenario_templates[scenario_id] = {
            "name": name,
            "type": scenario_type.value,
            "description": description,
            "variables": variables,
            "asset_models": asset_models
        }

        return scenario_id

    def get_available_scenarios(self) -> List[Dict[str, Any]]:
        """Get list of available scenarios"""
        return [
            {
                "id": key,
                "name": template["name"],
                "type": template["type"],
                "description": template["description"]
            }
            for key, template in self.scenario_templates.items()
        ]


# Initialize service
service = ScenarioAnalysisEngine()


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": service.name,
        "port": service.port,
        "version": service.version,
        "available_scenarios": len(service.scenario_templates)
    }


@app.get("/scenarios")
async def get_scenarios():
    """Get available scenarios"""
    return {"scenarios": service.get_available_scenarios()}


@app.post("/scenarios/{scenario_name}/run")
async def run_scenario(
    scenario_name: str,
    custom_variables: Optional[Dict[str, float]] = None
):
    """Run a scenario analysis"""
    return await service.run_scenario(scenario_name, custom_variables)


@app.post("/scenarios/compare")
async def compare_scenarios(scenario_names: List[str]):
    """Compare multiple scenarios"""
    return await service.compare_scenarios(scenario_names)


@app.post("/scenarios/custom")
async def create_custom_scenario(
    name: str,
    description: str,
    scenario_type: ScenarioType,
    variables: List[Dict[str, Any]],
    asset_models: Dict[str, Dict[str, Any]]
):
    """Create a custom scenario"""
    scenario_id = await service.create_custom_scenario(
        name, description, scenario_type, variables, asset_models
    )
    return {"scenario_id": scenario_id, "status": "created"}


@app.get("/scenarios/{scenario_name}/analog")
async def get_historical_analog(scenario_name: str):
    """Get historical analog for a scenario"""
    template = service.scenario_templates.get(scenario_name)
    if not template:
        raise HTTPException(status_code=404, detail="Scenario not found")

    analog = service._find_historical_analog(scenario_name)
    return {
        "scenario": template["name"],
        "analog": analog
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5200)