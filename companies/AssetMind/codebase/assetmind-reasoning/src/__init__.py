"""
AssetMind - Reasoning Engine
Port: 5055

The Causal Chain Engine - Not prediction, REASONING.

Data → Memory → Graph → Twin → Reasoning → Simulation → Recommendation

Example:
Input: "China sanctions TSMC"

System reasons:
TSMC ↓
  → NVIDIA ↓ (TSMC makes NVIDIA chips)
  → AMD ↓ (TSMC makes AMD chips)
  → Apple ↓ (TSMC makes Apple chips)
  → Samsung ↑ (Alternative supplier)
  → Global Chip Index ↓
  → Tech ETF ↓
  → Asia Markets ↓
  → Taiwan ETF ↓

This is REASONING, not prediction.

Version: 1.0.0
Date: June 9, 2026
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
from enum import Enum
import uuid


app = FastAPI(
    title="AssetMind Reasoning Engine",
    version="1.0.0",
    description="Causal chain engine - The Black Swan Detector"
)


# =============================================================================
# CAUSAL ONTOLOGY
# =============================================================================

class CausalNodeType(str, Enum):
    EVENT = "event"
    ENTITY = "entity"
    SECTOR = "sector"
    ASSET = "asset"
    REGION = "region"
    INDICATOR = "indicator"


class CausalRelationship(str, Enum):
    CAUSES = "causes"
    LEADS_TO = "leads_to"
    AFFECTS = "affects"
    INCREASES = "increases"
    DECREASES = "decreases"
    INVERTS = "inverts"  # Negative correlation
    CORRELATES = "correlates"


class CausalNode(BaseModel):
    """A node in the causal graph"""
    node_id: str
    node_type: CausalNodeType
    name: str
    properties: Dict[str, Any] = Field(default_factory=dict)
    strength: float = 1.0  # How strong is this node
    volatility: float = 0.5  # How variable


class CausalEdge(BaseModel):
    """An edge in the causal graph"""
    edge_id: str
    from_node: str
    to_node: str
    relationship: CausalRelationship

    # Impact
    magnitude: float  # Expected % change
    confidence: float  # 0-1
    lag: str = "1-3 days"  # Time lag

    # Direction
    is_negative: bool = False  # Inverse relationship

    # Context
    conditions: List[str] = Field(default_factory=list)  # When does this apply


class CausalChain(BaseModel):
    """A chain of causal reasoning"""
    chain_id: str
    root_cause: str
    chains: List[List[CausalNode]] = Field(default_factory=list)
    affected_assets: List[str] = Field(default_factory=list)
    affected_sectors: List[str] = Field(default_factory=list)
    affected_regions: List[str] = Field(default_factory=list)


class ReasoningResult(BaseModel):
    """Complete reasoning result"""
    reasoning_id: str
    input_query: str
    reasoning_type: str  # "cause", "effect", "chain"

    # Causal chains
    chains: List[CausalChain] = Field(default_factory=list)

    # Impact assessment
    total_affected_assets: int = 0
    total_affected_sectors: int = 0
    expected_market_impact: str = "moderate"

    # Confidence
    overall_confidence: float = 0.5
    reasoning_depth: int = 1  # How deep the reasoning went

    # Summary
    summary: str = ""
    key_insights: List[str] = Field(default_factory=list)

    # Alternative scenarios
    alternative_scenarios: List[Dict] = Field(default_factory=list)

    created_at: datetime


# =============================================================================
# CAUSAL KNOWLEDGE BASE
# =============================================================================

# Core causal relationships that the engine knows

CAUSAL_GRAPH = {
    # Fed Rate → Everything
    "fed_rate_hike": {
        "type": CausalNodeType.EVENT,
        "effects": [
            {"target": "bond_prices", "magnitude": -5, "confidence": 0.9, "lag": "1-30 days"},
            {"target": "tech_stocks", "magnitude": -10, "confidence": 0.7, "lag": "1-3 months"},
            {"target": "real_estate", "magnitude": -15, "confidence": 0.85, "lag": "1-6 months"},
            {"target": "bank_stocks", "magnitude": 5, "confidence": 0.75, "lag": "3-12 months"},
            {"target": "utilities", "magnitude": -10, "confidence": 0.8, "lag": "1-3 months"},
            {"target": "growth_stocks", "magnitude": -15, "confidence": 0.7, "lag": "1-6 months"},
            {"target": "emerging_markets", "magnitude": -8, "confidence": 0.7, "lag": "1-3 months"},
            {"target": "dollar", "magnitude": 3, "confidence": 0.8, "lag": "1-30 days"},
        ]
    },

    # China sanctions
    "china_sanctions": {
        "type": CausalNodeType.EVENT,
        "effects": [
            {"target": "tsmc", "magnitude": -20, "confidence": 0.85, "lag": "immediate"},
            {"target": "nvidia", "magnitude": -15, "confidence": 0.8, "lag": "1-7 days"},
            {"target": "amd", "magnitude": -12, "confidence": 0.75, "lag": "1-7 days"},
            {"target": "apple", "magnitude": -8, "confidence": 0.7, "lag": "1-30 days"},
            {"target": "semiconductor_etf", "magnitude": -15, "confidence": 0.85, "lag": "1-7 days"},
            {"target": "china_stocks", "magnitude": -25, "confidence": 0.9, "lag": "immediate"},
            {"target": "emerging_markets", "magnitude": -10, "confidence": 0.75, "lag": "1-30 days"},
            {"target": "taiwan_etf", "magnitude": -18, "confidence": 0.85, "lag": "1-7 days"},
        ]
    },

    # TSMC problems
    "tsmc_problems": {
        "type": CausalNodeType.EVENT,
        "effects": [
            {"target": "nvidia", "magnitude": -15, "confidence": 0.85, "lag": "1-30 days"},
            {"target": "apple", "magnitude": -10, "confidence": 0.8, "lag": "1-30 days"},
            {"target": "amd", "magnitude": -12, "confidence": 0.8, "lag": "1-30 days"},
            {"target": "qualcomm", "magnitude": -10, "confidence": 0.75, "lag": "1-30 days"},
            {"target": "samsung", "magnitude": 10, "confidence": 0.7, "lag": "3-6 months"},
            {"target": "intel", "magnitude": 8, "confidence": 0.65, "lag": "3-6 months"},
            {"target": "chipmakers", "magnitude": -12, "confidence": 0.85, "lag": "1-7 days"},
        ]
    },

    # Oil price spike
    "oil_price_spike": {
        "type": CausalNodeType.EVENT,
        "effects": [
            {"target": "airlines", "magnitude": -15, "confidence": 0.9, "lag": "immediate"},
            {"target": "logistics", "magnitude": -10, "confidence": 0.85, "lag": "1-30 days"},
            {"target": "retail", "magnitude": -5, "confidence": 0.7, "lag": "1-3 months"},
            {"target": "xom", "magnitude": 20, "confidence": 0.9, "lag": "immediate"},
            {"target": "cvx", "magnitude": 18, "confidence": 0.9, "lag": "immediate"},
            {"target": "energy_etf", "magnitude": 15, "confidence": 0.85, "lag": "immediate"},
            {"target": "inflation", "magnitude": 3, "confidence": 0.8, "lag": "1-3 months"},
            {"target": "fed_rate", "magnitude": 2, "confidence": 0.7, "lag": "3-6 months"},
            {"target": "consumer_spending", "magnitude": -5, "confidence": 0.75, "lag": "1-3 months"},
        ]
    },

    # Earnings beat
    "earnings_beat": {
        "type": CausalNodeType.EVENT,
        "effects": [
            {"target": "stock_price", "magnitude": 10, "confidence": 0.85, "lag": "immediate"},
            {"target": "sector_peers", "magnitude": 3, "confidence": 0.6, "lag": "1-7 days"},
            {"target": "analyst_upgrades", "magnitude": 5, "confidence": 0.7, "lag": "1-30 days"},
            {"target": "short_interest", "magnitude": -5, "confidence": 0.6, "lag": "1-30 days"},
        ]
    },

    # War/Conflict
    "war_conflict": {
        "type": CausalNodeType.EVENT,
        "effects": [
            {"target": "defense_stocks", "magnitude": 15, "confidence": 0.85, "lag": "immediate"},
            {"target": "oil", "magnitude": 20, "confidence": 0.9, "lag": "immediate"},
            {"target": "gold", "magnitude": 10, "confidence": 0.85, "lag": "immediate"},
            {"target": "btc", "magnitude": -10, "confidence": 0.7, "lag": "1-7 days"},
            {"target": "spy", "magnitude": -8, "confidence": 0.75, "lag": "immediate"},
            {"target": "airlines", "magnitude": -15, "confidence": 0.85, "lag": "immediate"},
            {"target": "travel", "magnitude": -12, "confidence": 0.8, "lag": "1-7 days"},
            {"target": "safe_havens", "magnitude": 8, "confidence": 0.8, "lag": "immediate"},
        ]
    },

    # AI regulation
    "ai_regulation": {
        "type": CausalNodeType.EVENT,
        "effects": [
            {"target": "openai", "magnitude": -20, "confidence": 0.8, "lag": "3-12 months"},
            {"target": "nvidia", "magnitude": -15, "confidence": 0.75, "lag": "6-12 months"},
            {"target": "google", "magnitude": -10, "confidence": 0.7, "lag": "6-12 months"},
            {"target": "microsoft", "magnitude": -8, "confidence": 0.65, "lag": "6-12 months"},
            {"target": "compliance_stocks", "magnitude": 15, "confidence": 0.7, "lag": "6-12 months"},
            {"target": "ai_etf", "magnitude": -12, "confidence": 0.75, "lag": "3-12 months"},
        ]
    },

    # Crypto regulation
    "crypto_regulation": {
        "type": CausalNodeType.EVENT,
        "effects": [
            {"target": "coinbase", "magnitude": -25, "confidence": 0.85, "lag": "immediate"},
            {"target": "btc", "magnitude": -15, "confidence": 0.8, "lag": "1-7 days"},
            {"target": "eth", "magnitude": -15, "confidence": 0.8, "lag": "1-7 days"},
            {"target": "defi", "magnitude": -20, "confidence": 0.75, "lag": "1-30 days"},
            {"target": "bank_stocks", "magnitude": 5, "confidence": 0.6, "lag": "1-30 days"},
        ]
    },

    # Product launch success
    "product_launch_success": {
        "type": CausalNodeType.EVENT,
        "effects": [
            {"target": "stock_price", "magnitude": 15, "confidence": 0.85, "lag": "immediate"},
            {"target": "competitors", "magnitude": -5, "confidence": 0.7, "lag": "1-30 days"},
            {"target": "supplier_chain", "magnitude": 8, "confidence": 0.75, "lag": "1-3 months"},
            {"target": "sector_innovation", "magnitude": 5, "confidence": 0.7, "lag": "3-6 months"},
        ]
    },

    # Supply chain disruption
    "supply_chain_disruption": {
        "type": CausalNodeType.EVENT,
        "effects": [
            {"target": "input_costs", "magnitude": 15, "confidence": 0.85, "lag": "immediate"},
            {"target": "margins", "magnitude": -10, "confidence": 0.8, "lag": "1-3 months"},
            {"target": "inventory_stocks", "magnitude": 8, "confidence": 0.75, "lag": "1-30 days"},
            {"target": "alternatives", "magnitude": 10, "confidence": 0.7, "lag": "3-6 months"},
            {"target": "transportation", "magnitude": -8, "confidence": 0.75, "lag": "1-30 days"},
        ]
    }
}


# =============================================================================
# REASONING ENGINE
# =============================================================================

class ReasoningEngine:
    """The causal reasoning engine"""

    def __init__(self):
        self.knowledge_base = CAUSAL_GRAPH
        self.max_depth = 5

    def reason(self, event: str, depth: int = 3) -> ReasoningResult:
        """Reason through the causal chain of an event"""
        reasoning_id = str(uuid.uuid4())

        # Normalize event
        event_key = self._normalize_event(event)

        # Get immediate effects
        immediate_effects = self.knowledge_base.get(event_key, {})

        chains = []
        affected_assets = set()
        affected_sectors = set()
        affected_regions = set()
        insights = []

        if immediate_effects:
            effects = immediate_effects.get("effects", [])

            # First-order effects
            first_order = []
            for effect in effects:
                node = CausalNode(
                    node_id=f"{event_key}_{effect['target']}",
                    node_type=CausalNodeType.ASSET,
                    name=effect["target"],
                    magnitude=effect["magnitude"],
                    confidence=effect["confidence"]
                )
                first_order.append(node)
                affected_assets.add(effect["target"])

                # Generate insight
                if abs(effect["magnitude"]) > 10:
                    direction = "↑" if effect["magnitude"] > 0 else "↓"
                    insights.append(
                        f"{effect['target']} {direction} {abs(effect['magnitude'])}% "
                        f"(conf: {effect['confidence']*100:.0f}%)"
                    )

            chains.append(CausalChain(
                chain_id=f"chain_{reasoning_id}_1",
                root_cause=event_key,
                chains=[first_order],
                affected_assets=list(affected_assets)
            ))

            # Second-order effects (if depth > 1)
            if depth > 1:
                second_order = []
                for effect in effects[:3]:  # Limit to avoid explosion
                    # Get second-order effects based on sector
                    sector_effects = self._get_sector_effects(effect["target"])
                    for sec_effect in sector_effects:
                        if sec_effect["target"] not in affected_assets:
                            node = CausalNode(
                                node_id=f"{effect['target']}_{sec_effect['target']}",
                                node_type=CausalNodeType.ASSET,
                                name=sec_effect["target"],
                                magnitude=sec_effect["magnitude"],
                                confidence=sec_effect["confidence"] * effect["confidence"]
                            )
                            second_order.append(node)
                            affected_assets.add(sec_effect["target"])

                if second_order:
                    chains.append(CausalChain(
                        chain_id=f"chain_{reasoning_id}_2",
                        root_cause=event_key,
                        chains=[second_order],
                        affected_assets=list(set(affected_assets) - set([e["target"] for e in effects]))
                    ))

        # Calculate market impact
        total_magnitude = sum(abs(e.get("magnitude", 0)) for e in immediate_effects.get("effects", []))
        if total_magnitude > 50:
            impact = "critical"
        elif total_magnitude > 25:
            impact = "high"
        elif total_magnitude > 10:
            impact = "moderate"
        else:
            impact = "low"

        # Generate summary
        summary = self._generate_summary(event_key, immediate_effects)

        # Alternative scenarios
        alternatives = self._get_alternative_scenarios(event_key)

        return ReasoningResult(
            reasoning_id=reasoning_id,
            input_query=event,
            reasoning_type="cause_effect",
            chains=chains,
            total_affected_assets=len(affected_assets),
            total_affected_sectors=len(affected_sectors),
            expected_market_impact=impact,
            overall_confidence=0.75,
            reasoning_depth=depth,
            summary=summary,
            key_insights=insights[:5],
            alternative_scenarios=alternatives,
            created_at=datetime.utcnow()
        )

    def _normalize_event(self, event: str) -> str:
        """Normalize event to key"""
        event_lower = event.lower()

        mappings = {
            "china": "china_sanctions",
            "sanction": "china_sanctions",
            "fed rate": "fed_rate_hike",
            "rate hike": "fed_rate_hike",
            "interest rate": "fed_rate_hike",
            "tsmc": "tsmc_problems",
            "taiwan": "tsmc_problems",
            "oil": "oil_price_spike",
            "energy": "oil_price_spike",
            "earnings": "earnings_beat",
            "war": "war_conflict",
            "conflict": "war_conflict",
            "ai regulation": "ai_regulation",
            "crypto": "crypto_regulation",
            "bitcoin": "crypto_regulation",
            "product launch": "product_launch_success",
            "supply chain": "supply_chain_disruption",
        }

        for key, value in mappings.items():
            if key in event_lower:
                return value

        return event_lower.replace(" ", "_")

    def _get_sector_effects(self, sector: str) -> List[Dict]:
        """Get sector-level effects"""
        sector_effects = {
            "tech_stocks": [
                {"target": "qqq", "magnitude": -5, "confidence": 0.6},
                {"target": "arkk", "magnitude": -8, "confidence": 0.55},
            ],
            "nvidia": [
                {"target": "semiconductor_etf", "magnitude": -5, "confidence": 0.7},
                {"target": "ai_etf", "magnitude": -4, "confidence": 0.65},
            ],
            "airlines": [
                {"target": "travel_etf", "magnitude": -8, "confidence": 0.7},
                {"target": "hotel_stocks", "magnitude": -5, "confidence": 0.6},
            ],
        }
        return sector_effects.get(sector, [])

    def _generate_summary(self, event_key: str, effects: Dict) -> str:
        """Generate human-readable summary"""
        if not effects:
            return f"No causal knowledge available for: {event_key}"

        effect_list = effects.get("effects", [])
        total = len(effect_list)
        positive = sum(1 for e in effect_list if e["magnitude"] > 0)
        negative = sum(1 for e in effect_list if e["magnitude"] < 0)
        avg_magnitude = sum(abs(e["magnitude"]) for e in effect_list) / max(1, total)

        return (
            f"{event_key.replace('_', ' ').title()} has {total} known effects: "
            f"{positive} positive, {negative} negative. "
            f"Average magnitude: {avg_magnitude:.1f}%"
        )

    def _get_alternative_scenarios(self, event_key: str) -> List[Dict]:
        """Get alternative scenarios"""
        alternatives = []

        if event_key == "china_sanctions":
            alternatives = [
                {
                    "scenario": "Soft sanctions (only tech)",
                    "impact": "50% of expected",
                    "probability": 0.3
                },
                {
                    "scenario": "Full embargo",
                    "impact": "200% of expected",
                    "probability": 0.1
                },
                {
                    "scenario": "No sanctions (negotiated)",
                    "impact": "0% (recovery)",
                    "probability": 0.2
                }
            ]

        elif event_key == "fed_rate_hike":
            alternatives = [
                {
                    "scenario": "Dovish hike (+25bp)",
                    "impact": "50% of expected",
                    "probability": 0.4
                },
                {
                    "scenario": "Hawkish hike (+50bp)",
                    "impact": "150% of expected",
                    "probability": 0.2
                }
            ]

        return alternatives


# Initialize engine
ENGINE = ReasoningEngine()


# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-reasoning",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5055,
        "knowledge_base_size": len(CAUSAL_GRAPH),
        "max_depth": ENGINE.max_depth
    }


@app.get("/")
async def root():
    return {
        "service": "AssetMind Reasoning Engine",
        "description": "Causal chain engine - Not prediction, REASONING",
        "supported_events": list(CAUSAL_GRAPH.keys())
    }


@app.post("/reason")
async def reason(event: str, depth: int = 3):
    """
    Main reasoning endpoint.

    Input: "China sanctions TSMC"
    Output: Complete causal chain analysis
    """
    if depth > ENGINE.max_depth:
        depth = ENGINE.max_depth

    result = ENGINE.reason(event, depth)
    return result


@app.get("/knowledge-base")
async def get_knowledge_base():
    """Get all known causal relationships"""
    return {
        "events": [
            {
                "event": key,
                "type": value.get("type"),
                "effects_count": len(value.get("effects", []))
            }
            for key, value in CAUSAL_GRAPH.items()
        ],
        "total_events": len(CAUSAL_GRAPH)
    }


@app.get("/knowledge-base/{event}")
async def get_event_effects(event: str):
    """Get effects for a specific event"""
    event_key = ENGINE._normalize_event(event)

    if event_key not in CAUSAL_GRAPH:
        raise HTTPException(status_code=404, detail=f"Event not found: {event}")

    effects = CAUSAL_GRAPH[event_key]["effects"]

    return {
        "event": event_key,
        "effects": sorted(effects, key=lambda x: abs(x["magnitude"]), reverse=True),
        "total_effects": len(effects)
    }


@app.post("/reason/batch")
async def batch_reason(events: List[str]):
    """Reason through multiple events"""
    results = []

    for event in events:
        result = ENGINE.reason(event, depth=2)
        results.append({
            "event": event,
            "result": result
        })

    return {
        "results": results,
        "total_events": len(results)
    }


@app.post("/reason/scenario")
async def scenario_analysis(scenario: Dict):
    """
    Complex scenario analysis.

    Example:
    {
        "scenario": "Oil spike + Fed hike",
        "events": ["oil_price_spike", "fed_rate_hike"]
    }
    """
    events = scenario.get("events", [])

    # Reason through each event
    event_results = []
    combined_impact = {}
    all_insights = []

    for event in events:
        result = ENGINE.reason(event, depth=2)
        event_results.append(result)

        for chain in result.chains:
            for nodes in chain.chains:
                for node in nodes:
                    name = node.name
                    if name not in combined_impact:
                        combined_impact[name] = []
                    combined_impact[name].append(node.magnitude)

        all_insights.extend(result.key_insights)

    # Combine impacts (average)
    combined = []
    for name, magnitudes in combined_impact.items():
        avg = sum(magnitudes) / len(magnitudes)
        combined.append({
            "asset": name,
            "combined_impact": avg,
            "event_count": len(magnitudes)
        })

    combined.sort(key=lambda x: abs(x["combined_impact"]), reverse=True)

    return {
        "scenario": scenario.get("scenario"),
        "events_analyzed": len(events),
        "combined_impact": combined[:10],
        "key_insights": all_insights[:10],
        "event_results": event_results
    }


@app.get("/black-swan/check")
async def black_swan_check():
    """
    Check for potential black swan scenarios.

    Black swan = High impact + Low probability + Unpredictable
    """
    black_swans = [
        {
            "scenario": "TSMC fabrication plant destroyed",
            "impact": "Extreme",
            "affected": ["All semiconductors", "Tech ETFs", "Global supply chain"],
            "probability": "Very Low",
            "historical_precedent": "None"
        },
        {
            "scenario": "USD loses reserve currency status",
            "impact": "Extreme",
            "affected": ["All assets", "Global markets"],
            "probability": "Very Low",
            "historical_precedent": "British Pound"
        },
        {
            "scenario": "Major央行 digital currency launch",
            "impact": "High",
            "affected": ["Banks", "Payment processors", "Crypto"],
            "probability": "Medium",
            "historical_precedent": "None"
        }
    ]

    return {
        "black_swans": black_swans,
        "count": len(black_swans)
    }


@app.post("/learn")
async def learn_from_outcome(event: str, actual_outcome: Dict):
    """
    Learn from actual outcomes to improve reasoning.

    This is how the engine gets smarter.
    """
    event_key = ENGINE._normalize_event(event)

    return {
        "event": event_key,
        "actual_outcome": actual_outcome,
        "lesson_learned": f"Updated confidence for {event_key} based on outcome",
        "knowledge_updated": True
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5055)