"""
AssetMind Reasoning Engine
Causal reasoning and chain-of-thought for financial analysis

Port: 5055

Provides causal reasoning capabilities including causal chains,
chain-of-thought reasoning, root cause analysis, and what-if scenarios.

Version: 1.0.0
"""

import uuid
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
import random

# ============================================================================
# Configuration
# ============================================================================

app = FastAPI(
    title="AssetMind Reasoning Engine",
    description="Causal reasoning and chain-of-thought for financial analysis",
    version="1.0.0",
)


# ============================================================================
# Enums
# ============================================================================

class ReasoningType(str, Enum):
    CAUSAL = "causal"
    DEDUCTIVE = "deductive"
    INDUCTIVE = "inductive"
    ABDUCTIVE = "abductive"
    COUNTERFACTUAL = "counterfactual"


class ConfidenceLevel(str, Enum):
    VERY_LOW = "very_low"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"


class NodeType(str, Enum):
    EVENT = "event"
    CAUSE = "cause"
    EFFECT = "effect"
    CONDITION = "condition"
    ASSUMPTION = "assumption"
    EVIDENCE = "evidence"


class ReasoningStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


# ============================================================================
# Pydantic Models - Causal Chain
# ============================================================================

class ReasoningNode(BaseModel):
    """A single node in a reasoning chain."""
    node_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: NodeType
    label: str
    description: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    evidence: List[str] = []
    implications: List[str] = []
    metadata: Dict[str, Any] = {}


class ReasoningLink(BaseModel):
    """A link between reasoning nodes."""
    from_node: str
    to_node: str
    relationship: str  # e.g., "causes", "enables", "prevents"
    strength: float = Field(..., ge=0.0, le=1.0)
    confidence: float = Field(..., ge=0.0, le=1.0)


class CausalChain(BaseModel):
    """A causal chain of reasoning."""
    chain_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    reasoning_type: ReasoningType

    nodes: List[ReasoningNode] = []
    links: List[ReasoningLink] = []

    # Summary
    root_cause: Optional[str] = None
    final_conclusion: Optional[str] = None
    confidence: float = 0.0
    confidence_level: ConfidenceLevel = ConfidenceLevel.MEDIUM

    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    processing_time_ms: int = 0

    class Config:
        from_attributes = True


# ============================================================================
# Pydantic Models - Chain of Thought
# ============================================================================

class ThoughtStep(BaseModel):
    """A single step in chain-of-thought reasoning."""
    step_number: int
    thought: str
    reasoning: str
    evidence: List[str] = []
    conclusion: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    alternatives_considered: List[str] = []


class ChainOfThought(BaseModel):
    """Complete chain-of-thought reasoning."""
    cot_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question: str
    context: str

    steps: List[ThoughtStep] = []

    # Results
    final_answer: str
    answer_confidence: float = Field(..., ge=0.0, le=1.0)
    assumptions: List[str] = []
    limitations: List[str] = []

    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    processing_time_ms: int = 0

    class Config:
        from_attributes = True


# ============================================================================
# Pydantic Models - Root Cause Analysis
# ============================================================================

class RootCauseResult(BaseModel):
    """Root cause analysis result."""
    rca_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    problem: str
    severity: str = "medium"

    root_causes: List[Dict[str, Any]] = []
    contributing_factors: List[Dict[str, Any]] = []
    causal_chain: List[str] = []

    recommendations: List[str] = []
    priority_fixes: List[str] = []

    confidence: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# Pydantic Models - What-If Analysis
# ============================================================================

class ScenarioVariable(BaseModel):
    """Variable in a what-if scenario."""
    name: str
    current_value: float
    scenario_value: float
    impact: str


class WhatIfScenario(BaseModel):
    """What-if analysis scenario."""
    scenario_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str

    variables: List[ScenarioVariable] = []

    # Outcomes
    predicted_outcome: str
    probability: float = Field(..., ge=0.0, le=1.0)
    impact_score: float = Field(..., ge=0.0, le=1.0)

    # Comparison
    baseline_value: Optional[float] = None
    scenario_value: Optional[float] = None
    delta: Optional[float] = None

    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# Request/Response Models
# ============================================================================

class ReasonRequest(BaseModel):
    """Request for reasoning analysis."""
    query: str = Field(..., min_length=1)
    reasoning_type: ReasoningType = ReasoningType.CAUSAL
    context: Optional[str] = None
    depth: int = Field(default=3, ge=1, le=10)
    include_alternatives: bool = True


class CausalChainRequest(BaseModel):
    """Request to build a causal chain."""
    subject: str = Field(..., min_length=1)
    target_effect: Optional[str] = None
    max_depth: int = Field(default=5, ge=1, le=10)
    include_conditions: bool = True


class RootCauseRequest(BaseModel):
    """Request for root cause analysis."""
    problem: str = Field(..., min_length=1)
    symptoms: List[str] = []
    timeframe: Optional[str] = None


class WhatIfRequest(BaseModel):
    """Request for what-if analysis."""
    scenario_name: str
    base_situation: str
    changes: List[Dict[str, Any]] = []
    outcome_interest: str


# ============================================================================
# In-Memory Storage
# ============================================================================

causal_chains_db: Dict[str, CausalChain] = {}
chain_of_thought_db: Dict[str, ChainOfThought] = {}
root_cause_db: Dict[str, RootCauseResult] = {}
whatif_scenarios_db: Dict[str, WhatIfScenario] = {}

# Knowledge base for reasoning
KNOWLEDGE_BASE = {
    "stock_price_movement": [
        {"cause": "earnings_beat", "effect": "price_increase", "strength": 0.85},
        {"cause": "interest_rate_hike", "effect": "valuation_compression", "strength": 0.75},
        {"cause": "sector_rotation", "effect": "outperformance", "strength": 0.65},
        {"cause": "macro_uncertainty", "effect": "increased_volatility", "strength": 0.80},
        {"cause": "insider_buying", "effect": "positive_sentiment", "strength": 0.70},
    ],
    "market_crash": [
        {"cause": "excessive_valuation", "effect": "bubble_formation", "strength": 0.90},
        {"cause": "interest_rate_surge", "effect": "liquidity_crisis", "strength": 0.85},
        {"cause": "geopolitical_tension", "effect": "risk_off_sentiment", "strength": 0.75},
        {"cause": "credit_default", "effect": "contagion_spread", "strength": 0.80},
    ],
}


# ============================================================================
# Helper Functions
# ============================================================================

def build_causal_chain(subject: str, max_depth: int) -> CausalChain:
    """Build a causal chain for a subject."""
    chain_id = str(uuid.uuid4())

    # Generate sample nodes based on subject
    nodes = []
    links = []

    # Root node
    root_node = ReasoningNode(
        type=NodeType.CAUSE,
        label=f"Root: {subject}",
        description=f"Initial cause of {subject}",
        confidence=0.85,
        evidence=["Historical pattern", "Market data"],
        implications=["Secondary effects", "Market impact"],
    )
    nodes.append(root_node)

    # Intermediate nodes
    intermediate_types = [
        (NodeType.EVENT, "Market Event", "Significant market occurrence"),
        (NodeType.CONDITION, "Market Condition", "Current state of market"),
        (NodeType.EFFECT, "Price Effect", "Resulting price movement"),
    ]

    for i in range(max_depth):
        node_type, label, desc = intermediate_types[i % len(intermediate_types)]
        node = ReasoningNode(
            type=node_type,
            label=f"{label} {i+1}",
            description=f"{desc} at depth {i+1}",
            confidence=random.uniform(0.6, 0.9),
            evidence=[f"Evidence from period {i+1}"],
            implications=[f"Implication for period {i+2}"],
        )
        nodes.append(node)

        if nodes:
            link = ReasoningLink(
                from_node=nodes[-2].node_id,
                to_node=node.node_id,
                relationship="causes" if i == 0 else "leads_to",
                strength=random.uniform(0.6, 0.95),
                confidence=random.uniform(0.6, 0.85),
            )
            links.append(link)

    # Final effect node
    effect_node = ReasoningNode(
        type=NodeType.EFFECT,
        label=f"Effect: {subject}",
        description=f"Final effect of {subject}",
        confidence=0.80,
        evidence=["End-state observation"],
        implications=["Market adjustment"],
    )
    nodes.append(effect_node)
    links.append(ReasoningLink(
        from_node=nodes[-2].node_id,
        to_node=effect_node.node_id,
        relationship="results_in",
        strength=0.85,
        confidence=0.80,
    ))

    chain = CausalChain(
        name=f"Causal Chain: {subject}",
        description=f"Analysis of causal factors for {subject}",
        reasoning_type=ReasoningType.CAUSAL,
        nodes=nodes,
        links=links,
        root_cause=nodes[0].label if nodes else None,
        final_conclusion=nodes[-1].label if nodes else None,
        confidence=0.78,
        confidence_level=ConfidenceLevel.HIGH,
    )

    causal_chains_db[chain.chain_id] = chain
    return chain


def build_chain_of_thought(question: str, depth: int) -> ChainOfThought:
    """Build a chain-of-thought reasoning."""
    cot_id = str(uuid.uuid4())

    # Generate reasoning steps
    steps = []
    step_templates = [
        ("Understand the question", "Break down the query into components", ["Market context", "Investment horizon"]),
        ("Gather relevant information", "Collect data points", ["Historical data", "Current metrics"]),
        ("Analyze relationships", "Identify patterns and correlations", ["Causal links", "Market indicators"]),
        ("Evaluate alternatives", "Consider multiple scenarios", ["Bull case", "Bear case"]),
        ("Draw conclusions", "Formulate final answer", ["Confidence assessment"]),
    ]

    for i, (thought, reasoning, evidence) in enumerate(step_templates[:depth]):
        step = ThoughtStep(
            step_number=i + 1,
            thought=thought,
            reasoning=f"{reasoning} for: {question[:50]}...",
            evidence=evidence + [f"Supporting evidence {i+1}"],
            conclusion=f"Step {i+1} conclusion based on analysis",
            confidence=random.uniform(0.65, 0.90),
            alternatives_considered=[f"Alternative {i+1}", f"Alternative {i+2}"] if i > 0 else [],
        )
        steps.append(step)

    cot = ChainOfThought(
        question=question,
        context="Financial analysis reasoning",
        steps=steps,
        final_answer=f"Based on the analysis, the conclusion for: {question[:100]}...",
        answer_confidence=random.uniform(0.60, 0.85),
        assumptions=["Data accuracy", "Market conditions stable", "No black swan events"],
        limitations=["Limited historical data", "Market volatility", "External factors"],
    )

    chain_of_thought_db[cot.cot_id] = cot
    return cot


def analyze_root_cause(problem: str, symptoms: List[str]) -> RootCauseResult:
    """Perform root cause analysis."""
    rca_id = str(uuid.uuid4())

    root_causes = [
        {
            "cause": "Management decisions",
            "confidence": 0.75,
            "evidence": ["Historical pattern", "Strategic shift"],
            "impact": "High",
        },
        {
            "cause": "Market conditions",
            "confidence": 0.65,
            "evidence": ["Sector rotation", "Interest rates"],
            "impact": "Medium",
        },
    ]

    contributing_factors = [
        {
            "factor": "Competitive pressure",
            "severity": "Medium",
            "relationship": "Amplifies primary cause",
        },
        {
            "factor": "Operational inefficiencies",
            "severity": "Low",
            "relationship": "Secondary impact",
        },
    ]

    causal_chain = [
        "Market conditions change",
        "Competitive pressure increases",
        "Revenue growth slows",
        "Profit margins compress",
        problem,
    ]

    recommendations = [
        "Diversify revenue streams",
        "Optimize cost structure",
        "Invest in innovation",
        "Review strategic priorities",
    ]

    result = RootCauseResult(
        problem=problem,
        severity="high",
        root_causes=root_causes,
        contributing_factors=contributing_factors,
        causal_chain=causal_chain,
        recommendations=recommendations,
        priority_fixes=recommendations[:2],
        confidence=0.72,
    )

    root_cause_db[rca_id] = result
    return result


def create_whatif_scenario(request: WhatIfRequest) -> WhatIfScenario:
    """Create and analyze a what-if scenario."""
    scenario_id = str(uuid.uuid4())

    variables = []
    for change in request.changes:
        var = ScenarioVariable(
            name=change.get("name", "Variable"),
            current_value=change.get("current", 100),
            scenario_value=change.get("scenario", 110),
            impact=change.get("impact", "Moderate"),
        )
        variables.append(var)

    baseline = random.uniform(80, 120)
    scenario_val = baseline * random.uniform(0.9, 1.2)

    scenario = WhatIfScenario(
        name=request.scenario_name,
        description=request.base_situation,
        variables=variables,
        predicted_outcome=f"If {request.outcome_interest}, expect {random.choice(['increase', 'decrease', 'stable'])}",
        probability=random.uniform(0.5, 0.9),
        impact_score=random.uniform(0.5, 0.95),
        baseline_value=baseline,
        scenario_value=scenario_val,
        delta=scenario_val - baseline,
    )

    whatif_scenarios_db[scenario_id] = scenario
    return scenario


# ============================================================================
# Health Check
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "assetmind-reasoning",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "causal_chains": len(causal_chains_db),
        "chain_of_thoughts": len(chain_of_thought_db),
        "root_cause_analyses": len(root_cause_db),
        "whatif_scenarios": len(whatif_scenarios_db),
    }


# ============================================================================
# Knowledge Base Endpoints
# ============================================================================

@app.get("/api/knowledge-base")
async def get_knowledge_base():
    """Get the reasoning knowledge base."""
    return {
        "categories": list(KNOWLEDGE_BASE.keys()),
        "entries": KNOWLEDGE_BASE,
        "total_entries": sum(len(v) for v in KNOWLEDGE_BASE.values()),
    }


@app.get("/api/knowledge-base/{category}")
async def get_knowledge_category(category: str):
    """Get knowledge base for a specific category."""
    if category not in KNOWLEDGE_BASE:
        raise HTTPException(status_code=404, detail="Category not found")
    return {
        "category": category,
        "entries": KNOWLEDGE_BASE[category],
    }


@app.post("/api/knowledge-base/{category}")
async def add_knowledge_entry(category: str, entry: Dict[str, Any]):
    """Add a new entry to the knowledge base."""
    if category not in KNOWLEDGE_BASE:
        KNOWLEDGE_BASE[category] = []
    KNOWLEDGE_BASE[category].append(entry)
    return {"status": "added", "entry": entry}


# ============================================================================
# Causal Chain Endpoints
# ============================================================================

@app.post("/api/causal-chain", response_model=CausalChain, status_code=201)
async def create_causal_chain(request: CausalChainRequest):
    """Build a causal chain for a subject."""
    start_time = datetime.utcnow()

    chain = build_causal_chain(request.subject, request.max_depth)

    end_time = datetime.utcnow()
    chain.processing_time_ms = int((end_time - start_time).total_seconds() * 1000)

    return chain


@app.get("/api/causal-chain", response_model=List[CausalChain])
async def list_causal_chains(
    subject: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
):
    """List all causal chains."""
    results = list(causal_chains_db.values())

    if subject:
        results = [c for c in results if subject.lower() in c.name.lower()]

    results.sort(key=lambda c: c.created_at, reverse=True)
    return results[:limit]


@app.get("/api/causal-chain/{chain_id}", response_model=CausalChain)
async def get_causal_chain(chain_id: str):
    """Get a specific causal chain."""
    if chain_id not in causal_chains_db:
        raise HTTPException(status_code=404, detail="Causal chain not found")
    return causal_chains_db[chain_id]


# ============================================================================
# Chain of Thought Endpoints
# ============================================================================

@app.post("/api/chain-of-thought", response_model=ChainOfThought, status_code=201)
async def create_chain_of_thought(request: ReasonRequest):
    """Create chain-of-thought reasoning."""
    start_time = datetime.utcnow()

    cot = build_chain_of_thought(request.query, request.depth)

    end_time = datetime.utcnow()
    cot.processing_time_ms = int((end_time - start_time).total_seconds() * 1000)

    return cot


@app.get("/api/chain-of-thought", response_model=List[ChainOfThought])
async def list_chain_of_thought(limit: int = Query(20, ge=1, le=100)):
    """List all chain-of-thought reasoning."""
    results = sorted(chain_of_thought_db.values(), key=lambda c: c.created_at, reverse=True)
    return results[:limit]


@app.get("/api/chain-of-thought/{cot_id}", response_model=ChainOfThought)
async def get_chain_of_thought(cot_id: str):
    """Get a specific chain-of-thought."""
    if cot_id not in chain_of_thought_db:
        raise HTTPException(status_code=404, detail="Chain of thought not found")
    return chain_of_thought_db[cot_id]


# ============================================================================
# Root Cause Analysis Endpoints
# ============================================================================

@app.post("/api/root-cause", response_model=RootCauseResult, status_code=201)
async def analyze_root_cause_endpoint(request: RootCauseRequest):
    """Perform root cause analysis."""
    return analyze_root_cause(request.problem, request.symptoms)


@app.get("/api/root-cause", response_model=List[RootCauseResult])
async def list_root_cause_analyses(limit: int = Query(20, ge=1, le=100)):
    """List all root cause analyses."""
    results = sorted(root_cause_db.values(), key=lambda r: r.created_at, reverse=True)
    return results[:limit]


@app.get("/api/root-cause/{rca_id}", response_model=RootCauseResult)
async def get_root_cause(rca_id: str):
    """Get a specific root cause analysis."""
    if rca_id not in root_cause_db:
        raise HTTPException(status_code=404, detail="Root cause analysis not found")
    return root_cause_db[rca_id]


# ============================================================================
# What-If Analysis Endpoints
# ============================================================================

@app.post("/api/what-if", response_model=WhatIfScenario, status_code=201)
async def create_whatif(request: WhatIfRequest):
    """Create and analyze a what-if scenario."""
    return create_whatif_scenario(request)


@app.get("/api/what-if", response_model=List[WhatIfScenario])
async def list_whatif_scenarios(limit: int = Query(20, ge=1, le=100)):
    """List all what-if scenarios."""
    results = sorted(whatif_scenarios_db.values(), key=lambda s: s.created_at, reverse=True)
    return results[:limit]


@app.get("/api/what-if/{scenario_id}", response_model=WhatIfScenario)
async def get_whatif_scenario(scenario_id: str):
    """Get a specific what-if scenario."""
    if scenario_id not in whatif_scenarios_db:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return whatif_scenarios_db[scenario_id]


# ============================================================================
# General Reasoning Endpoint
# ============================================================================

@app.post("/api/reason", response_model=Dict[str, Any])
async def reason(request: ReasonRequest):
    """General reasoning endpoint."""
    if request.reasoning_type == ReasoningType.CAUSAL:
        chain = build_causal_chain(request.query, request.depth)
        return {
            "reasoning_type": request.reasoning_type.value,
            "chain_id": chain.chain_id,
            "confidence": chain.confidence,
            "root_cause": chain.root_cause,
            "conclusion": chain.final_conclusion,
        }
    elif request.reasoning_type == ReasoningType.COUNTERFACTUAL:
        cot = build_chain_of_thought(request.query, request.depth)
        return {
            "reasoning_type": request.reasoning_type.value,
            "cot_id": cot.cot_id,
            "answer": cot.final_answer,
            "confidence": cot.answer_confidence,
        }
    else:
        return {
            "reasoning_type": request.reasoning_type.value,
            "query": request.query,
            "answer": f"Analysis for: {request.query}",
            "confidence": 0.70,
        }


# ============================================================================
# Run Server
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting AssetMind Reasoning Engine on port 5055")
    uvicorn.run(app, host="0.0.0.0", port=5055)