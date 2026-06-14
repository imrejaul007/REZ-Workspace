"""
AssetMind Decision Twin Service
Decision analysis, simulation, and optimization
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Callable
from datetime import datetime
from enum import Enum
import uuid
import random

# ============================================================================
# Configuration
# ============================================================================

app = FastAPI(
    title="AssetMind Decision Twin",
    description="Decision analysis, simulation, and optimization service",
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

class DecisionType(str, Enum):
    STRATEGIC = "strategic"        # Long-term decisions
    TACTICAL = "tactical"         # Medium-term decisions
    OPERATIONAL = "operational"   # Day-to-day decisions
    INVESTMENT = "investment"     # Capital allocation
    RISK = "risk"                 # Risk management

class DecisionStatus(str, Enum):
    DRAFT = "draft"
    ANALYSIS = "analysis"
    RECOMMENDED = "recommended"
    APPROVED = "approved"
    IMPLEMENTED = "implemented"
    REVIEWED = "reviewed"

class OptimizationGoal(str, Enum):
    MAXIMIZE = "maximize"
    MINIMIZE = "minimize"
    SATISFY = "satisfy"
    BALANCE = "balance"

class RiskLevel(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    NEGLIGIBLE = "negligible"

class ConfidenceLevel(str, Enum):
    VERY_HIGH = "very_high"       # > 0.9
    HIGH = "high"                 # 0.7 - 0.9
    MEDIUM = "medium"             # 0.5 - 0.7
    LOW = "low"                  # 0.3 - 0.5
    VERY_LOW = "very_low"         # < 0.3

# ============================================================================
# Pydantic Models
# ============================================================================

class Stakeholder(BaseModel):
    id: str
    name: str
    role: str
    influence: float = Field(ge=0, le=1)
    interest: float = Field(ge=0, le=1)

class DecisionCriterion(BaseModel):
    name: str
    description: Optional[str] = None
    weight: float = Field(ge=0, le=1)
    target_value: Optional[float] = None
    optimization: OptimizationGoal = OptimizationGoal.MAXIMIZE

class AlternativeOption(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    estimated_value: float
    estimated_cost: float
    risk_score: float = Field(ge=0, le=1)
    timeline: str
    requirements: List[str] = []
    pros: List[str] = []
    cons: List[str] = []

class RiskAssessment(BaseModel):
    risk_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    risk_name: str
    description: str
    probability: float = Field(ge=0, le=1)
    impact: float = Field(ge=0, le=1)
    risk_level: RiskLevel
    mitigation: List[str] = []
    contingency: Optional[str] = None

class OutcomeProjection(BaseModel):
    scenario: str
    probability: float
    expected_value: float
    best_case: float
    worst_case: float
    confidence: ConfidenceLevel
    key_factors: List[str]

class Decision(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    type: DecisionType
    status: DecisionStatus = DecisionStatus.DRAFT

    # Context
    context: str
    business_objective: str
    constraints: List[str] = []

    # Stakeholders
    stakeholders: List[Stakeholder] = []
    decision_maker: Optional[str] = None

    # Criteria and alternatives
    criteria: List[DecisionCriterion] = []
    alternatives: List[AlternativeOption] = []

    # Analysis
    risks: List[RiskAssessment] = []
    projections: List[OutcomeProjection] = []

    # Recommendation
    recommended_option: Optional[str] = None
    reasoning: Optional[str] = None
    confidence: ConfidenceLevel = ConfidenceLevel.MEDIUM

    # Metadata
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    due_date: Optional[datetime] = None

class DecisionCreateRequest(BaseModel):
    title: str
    description: str
    type: DecisionType
    context: str
    business_objective: str
    created_by: str

class DecisionAnalysisRequest(BaseModel):
    decision_id: str
    analysis_type: str  # swot, cost_benefit, risk, simulation
    parameters: Optional[Dict[str, Any]] = None

class SimulationConfig(BaseModel):
    iterations: int = Field(default=1000, ge=100, le=10000)
    variables: Dict[str, Dict[str, float]]  # name -> {min, max, distribution}
    constraints: List[str] = []

class SimulationResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    decision_id: str
    config: SimulationConfig

    # Results
    expected_value: float
    standard_deviation: float
    confidence_interval: tuple[float, float]

    # Distribution
    distribution: Dict[str, Any]  # bins, frequencies

    # Outcomes
    success_rate: float
    average_outcome: float
    worst_case_5pct: float
    best_case_95pct: float

    run_at: datetime = Field(default_factory=datetime.utcnow)

class Recommendation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    decision_id: str
    option_id: str
    option_name: str
    score: float
    confidence: ConfidenceLevel
    key_reasons: List[str]
    warnings: List[str] = []
    next_steps: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class OptimizationRequest(BaseModel):
    objective: str
    variables: List[Dict[str, Any]]
    constraints: List[Dict[str, Any]]
    optimization_type: str = "linear"  # linear, integer, mixed

class OptimizationResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    optimal_value: float
    variables: Dict[str, float]
    constraints_satisfied: bool
    solver_info: Dict[str, Any]
    computation_time_ms: float
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ============================================================================
# In-Memory Storage
# ============================================================================

decisions_db: Dict[str, Decision] = {}
simulations_db: Dict[str, SimulationResult] = {}
recommendations_db: Dict[str, Recommendation] = {}
optimizations_db: Dict[str, OptimizationResult] = {}

# ============================================================================
# Health Check
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "assetmind-decision-twin",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "decisions_count": len(decisions_db),
        "simulations_count": len(simulations_db)
    }

@app.get("/ready")
async def readiness_check():
    """Readiness check"""
    return {"ready": True}

# ============================================================================
# Decision CRUD Endpoints
# ============================================================================

@app.post("/api/v1/decisions", response_model=Decision, status_code=201)
async def create_decision(request: DecisionCreateRequest):
    """Create a new decision"""
    decision = Decision(
        title=request.title,
        description=request.description,
        type=request.type,
        context=request.context,
        business_objective=request.business_objective,
        created_by=request.created_by
    )
    decisions_db[decision.id] = decision
    return decision

@app.get("/api/v1/decisions", response_model=List[Decision])
async def list_decisions(
    type: Optional[DecisionType] = None,
    status: Optional[DecisionStatus] = None,
    limit: int = Query(default=50, le=200)
):
    """List decisions with filters"""
    results = list(decisions_db.values())

    if type:
        results = [d for d in results if d.type == type]
    if status:
        results = [d for d in results if d.status == status]

    return sorted(results, key=lambda x: x.created_at, reverse=True)[:limit]

@app.get("/api/v1/decisions/{decision_id}", response_model=Decision)
async def get_decision(decision_id: str):
    """Get decision details"""
    if decision_id not in decisions_db:
        raise HTTPException(status_code=404, detail="Decision not found")
    return decisions_db[decision_id]

@app.put("/api/v1/decisions/{decision_id}", response_model=Decision)
async def update_decision(decision_id: str, decision: Decision):
    """Update decision"""
    if decision_id not in decisions_db:
        raise HTTPException(status_code=404, detail="Decision not found")
    decision.updated_at = datetime.utcnow()
    decisions_db[decision_id] = decision
    return decision

@app.delete("/api/v1/decisions/{decision_id}", status_code=204)
async def delete_decision(decision_id: str):
    """Delete decision"""
    if decision_id not in decisions_db:
        raise HTTPException(status_code=404, detail="Decision not found")
    del decisions_db[decision_id]

# ============================================================================
# Alternative Management
# ============================================================================

@app.post("/api/v1/decisions/{decision_id}/alternatives", response_model=Decision)
async def add_alternative(decision_id: str, alternative: AlternativeOption):
    """Add alternative option to decision"""
    if decision_id not in decisions_db:
        raise HTTPException(status_code=404, detail="Decision not found")

    decision = decisions_db[decision_id]
    decision.alternatives.append(alternative)
    decision.updated_at = datetime.utcnow()
    return decision

@app.get("/api/v1/decisions/{decision_id}/alternatives", response_model=List[AlternativeOption])
async def get_alternatives(decision_id: str):
    """Get all alternatives for a decision"""
    if decision_id not in decisions_db:
        raise HTTPException(status_code=404, detail="Decision not found")
    return decisions_db[decision_id].alternatives

@app.delete("/api/v1/decisions/{decision_id}/alternatives/{alt_id}", status_code=204)
async def remove_alternative(decision_id: str, alt_id: str):
    """Remove alternative from decision"""
    if decision_id not in decisions_db:
        raise HTTPException(status_code=404, detail="Decision not found")

    decision = decisions_db[decision_id]
    decision.alternatives = [a for a in decision.alternatives if a.id != alt_id]
    decision.updated_at = datetime.utcnow()

# ============================================================================
# Risk Assessment Endpoints
# ============================================================================

@app.post("/api/v1/decisions/{decision_id}/risks", response_model=Decision)
async def add_risk(decision_id: str, risk: RiskAssessment):
    """Add risk assessment to decision"""
    if decision_id not in decisions_db:
        raise HTTPException(status_code=404, detail="Decision not found")

    decision = decisions_db[decision_id]
    decision.risks.append(risk)
    decision.updated_at = datetime.utcnow()
    return decision

@app.get("/api/v1/decisions/{decision_id}/risks", response_model=List[RiskAssessment])
async def get_risks(decision_id: str):
    """Get all risks for a decision"""
    if decision_id not in decisions_db:
        raise HTTPException(status_code=404, detail="Decision not found")
    return decisions_db[decision_id].risks

# ============================================================================
# Analysis Endpoints
# ============================================================================

@app.post("/api/v1/decisions/{decision_id}/analyze", response_model=Dict[str, Any])
async def analyze_decision(decision_id: str, request: DecisionAnalysisRequest):
    """Run analysis on decision"""
    if decision_id not in decisions_db:
        raise HTTPException(status_code=404, detail="Decision not found")

    decision = decisions_db[decision_id]
    decision.status = DecisionStatus.ANALYSIS
    decision.updated_at = datetime.utcnow()

    # Simulate different analysis types
    if request.analysis_type == "swot":
        return {
            "analysis_type": "swot",
            "strengths": ["Clear ROI", "Strong team", "Market timing"],
            "weaknesses": ["Budget constraints", "Limited resources"],
            "opportunities": ["Market expansion", "New partnerships"],
            "threats": ["Competition", "Regulatory changes"],
            "timestamp": datetime.utcnow().isoformat()
        }
    elif request.analysis_type == "cost_benefit":
        return {
            "analysis_type": "cost_benefit",
            "total_benefits": 1500000,
            "total_costs": 800000,
            "net_benefit": 700000,
            "roi": 0.875,
            "payback_months": 8,
            "timestamp": datetime.utcnow().isoformat()
        }
    elif request.analysis_type == "risk":
        return {
            "analysis_type": "risk",
            "overall_risk": "medium",
            "risk_score": 0.45,
            "key_risks": [
                {"name": "Market risk", "score": 0.6},
                {"name": "Operational risk", "score": 0.3},
                {"name": "Financial risk", "score": 0.5}
            ],
            "risk_recommendations": [
                "Hedge currency exposure",
                "Build contingency fund",
                "Diversify suppliers"
            ],
            "timestamp": datetime.utcnow().isoformat()
        }

    return {"message": "Analysis completed"}

# ============================================================================
# Simulation Endpoints
# ============================================================================

@app.post("/api/v1/simulate", response_model=SimulationResult, status_code=201)
async def run_simulation(
    decision_id: str,
    config: SimulationConfig
):
    """Run Monte Carlo simulation"""
    if decision_id not in decisions_db:
        raise HTTPException(status_code=404, detail="Decision not found")

    # Simulate Monte Carlo
    values = []
    for _ in range(config.iterations):
        val = sum(
            random.uniform(var["min"], var["max"])
            for var in config.variables.values()
        ) / len(config.variables) if config.variables else random.uniform(0, 100)
        values.append(val)

    mean_val = sum(values) / len(values)
    std_val = (sum((v - mean_val) ** 2 for v in values) / len(values)) ** 0.5

    sorted_values = sorted(values)
    lower_5 = sorted_values[int(len(sorted_values) * 0.05)]
    upper_95 = sorted_values[int(len(sorted_values) * 0.95)]

    result = SimulationResult(
        decision_id=decision_id,
        config=config,
        expected_value=round(mean_val, 2),
        standard_deviation=round(std_val, 2),
        confidence_interval=(round(lower_5, 2), round(upper_95, 2)),
        distribution={
            "bins": [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
            "frequencies": [random.randint(50, 200) for _ in range(10)]
        },
        success_rate=0.78,
        average_outcome=round(mean_val, 2),
        worst_case_5pct=round(lower_5, 2),
        best_case_95pct=round(upper_95, 2)
    )

    simulations_db[result.id] = result
    return result

@app.get("/api/v1/simulations/{simulation_id}", response_model=SimulationResult)
async def get_simulation(simulation_id: str):
    """Get simulation results"""
    if simulation_id not in simulations_db:
        raise HTTPException(status_code=404, detail="Simulation not found")
    return simulations_db[simulation_id]

# ============================================================================
# Recommendation Endpoints
# ============================================================================

@app.post("/api/v1/recommend/{decision_id}", response_model=Recommendation)
async def generate_recommendation(decision_id: str):
    """Generate recommendation for decision"""
    if decision_id not in decisions_db:
        raise HTTPException(status_code=404, detail="Decision not found")

    decision = decisions_db[decision_id]

    if not decision.alternatives:
        raise HTTPException(status_code=400, detail="No alternatives to recommend")

    # Score alternatives (simplified)
    best_alt = max(decision.alternatives, key=lambda a: a.estimated_value - a.risk_score * 100)

    recommendation = Recommendation(
        decision_id=decision_id,
        option_id=best_alt.id,
        option_name=best_alt.name,
        score=round(best_alt.estimated_value / 1000, 2),
        confidence=ConfidenceLevel.HIGH,
        key_reasons=[
            f"Highest expected value: {best_alt.estimated_value}",
            f"Acceptable risk score: {best_alt.risk_score}",
            f"Clear timeline: {best_alt.timeline}"
        ],
        warnings=["Consider market volatility", "Monitor implementation closely"],
        next_steps=["Stakeholder approval", "Resource allocation", "Implementation plan"]
    )

    recommendations_db[recommendation.id] = recommendation
    decision.recommended_option = best_alt.id
    decision.reasoning = "Highest value-to-risk ratio"
    decision.confidence = ConfidenceLevel.HIGH
    decision.status = DecisionStatus.RECOMMENDED
    decision.updated_at = datetime.utcnow()

    return recommendation

# ============================================================================
# Optimization Endpoints
# ============================================================================

@app.post("/api/v1/optimize", response_model=OptimizationResult, status_code=201)
async def run_optimization(request: OptimizationRequest):
    """Run optimization problem"""
    # Simulate optimization
    optimal_value = random.uniform(10000, 100000)
    variables = {v["name"]: random.uniform(v.get("min", 0), v.get("max", 100))
                 for v in request.variables}

    result = OptimizationResult(
        optimal_value=round(optimal_value, 2),
        variables={k: round(v, 2) for k, v in variables.items()},
        constraints_satisfied=True,
        solver_info={
            "solver": request.optimization_type,
            "iterations": random.randint(50, 200),
            "optimality_gap": 0.001
        },
        computation_time_ms=round(random.uniform(10, 500), 2)
    )

    optimizations_db[result.id] = result
    return result

# ============================================================================
# Dashboard Endpoints
# ============================================================================

@app.get("/api/v1/dashboard")
async def get_dashboard():
    """Get decision dashboard summary"""
    decisions = list(decisions_db.values())

    by_type: Dict[str, int] = {}
    by_status: Dict[str, int] = {}

    for d in decisions:
        by_type[d.type.value] = by_type.get(d.type.value, 0) + 1
        by_status[d.status.value] = by_status.get(d.status.value, 0) + 1

    return {
        "total_decisions": len(decisions),
        "pending_review": len([d for d in decisions if d.status == DecisionStatus.ANALYSIS]),
        "recommended": len([d for d in decisions if d.status == DecisionStatus.RECOMMENDED]),
        "implemented": len([d for d in decisions if d.status == DecisionStatus.IMPLEMENTED]),
        "by_type": by_type,
        "by_status": by_status,
        "avg_confidence": 0.72,
        "timestamp": datetime.utcnow().isoformat()
    }

# ============================================================================
# Run with uvicorn
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5005)