"""
AssetMind Workflow Engine Service - Port 5290
Financial workflow automation: if-then rules, scheduled tasks, alerts, auto-execution.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

app = FastAPI(title="AssetMind Workflow Engine", version="1.0.0")
DEFAULT_PORT = 5290


class TriggerType(str, Enum):
    PRICE = "price"
    EARNINGS = "earnings"
    NEWS = "news"
    PORTFOLIO = "portfolio"
    SCHEDULE = "schedule"
    VOLUME = "volume"


class ActionType(str, Enum):
    ALERT = "alert"
    EMAIL = "email"
    SMS = "sms"
    REPORT = "report"
    TRADE = "trade"
    REBALANCE = "rebalance"
    RESEARCH = "research"
    WEBHOOK = "webhook"


class ConditionOperator(str, Enum):
    GT = ">"
    LT = "<"
    EQ = "=="
    GTE = ">="
    LTE = "<="
    CONTAINS = "contains"


class WorkflowStatus(str, Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    DISABLED = "disabled"


class Trigger(BaseModel):
    trigger_type: TriggerType
    symbol: Optional[str] = None
    operator: ConditionOperator = ConditionOperator.GT
    value: float
    window: Optional[str] = "1d"


class Condition(BaseModel):
    field: str
    operator: ConditionOperator
    value: Any


class Action(BaseModel):
    action_type: ActionType
    config: Dict[str, Any] = Field(default_factory=dict)
    delay: str = "immediate"


class Workflow(BaseModel):
    workflow_id: str
    name: str
    description: Optional[str] = None
    enabled: bool = True
    status: WorkflowStatus = WorkflowStatus.ACTIVE
    trigger: Trigger
    conditions: List[Condition] = Field(default_factory=list)
    actions: List[Action] = Field(default_factory=list)
    created_by: str = "system"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_triggered: Optional[datetime] = None
    trigger_count: int = 0


class WorkflowRun(BaseModel):
    run_id: str
    workflow_id: str
    trigger_data: Dict[str, Any]
    conditions_met: List[str] = Field(default_factory=list)
    actions_executed: List[str] = Field(default_factory=list)
    status: str = "success"
    started_at: datetime


# ============================================================================
# Workflow Templates
# ============================================================================

WORKFLOW_TEMPLATES = {
    "earnings_beat": {
        "name": "Earnings Beat Alert",
        "description": "Alert when earnings beat estimates by >10%",
        "trigger": {"trigger_type": "earnings", "operator": ">", "value": 10},
        "actions": [{"action_type": "alert", "config": {"priority": "high"}}]
    },
    "portfolio_drawdown": {
        "name": "Portfolio Drawdown Alert",
        "description": "Alert when portfolio drawdown exceeds 15%",
        "trigger": {"trigger_type": "portfolio", "operator": "<", "value": -15},
        "actions": [{"action_type": "alert", "config": {"priority": "critical"}}]
    },
    "insider_buying": {
        "name": "Insider Buying Spike",
        "description": "Create research when insider buying detected",
        "trigger": {"trigger_type": "news", "operator": ">", "value": 1},
        "actions": [{"action_type": "research", "config": {}}, {"action_type": "alert", "config": {}}]
    },
    "price_alert": {
        "name": "Price Alert",
        "description": "Alert when price crosses threshold",
        "trigger": {"trigger_type": "price", "operator": "crosses", "value": 0},
        "actions": [{"action_type": "alert", "config": {"priority": "medium"}}]
    },
    "momentum_signal": {
        "name": "Momentum Trading Signal",
        "description": "Execute trade on momentum signal",
        "trigger": {"trigger_type": "price", "operator": ">", "value": 0, "window": "1h"},
        "conditions": [{"field": "volume", "operator": ">", "value": 1.5}],
        "actions": [
            {"action_type": "trade", "config": {"action": "buy", "position_size": 0.1}},
            {"action_type": "alert", "config": {"priority": "high"}}
        ]
    },
    "rebalance_monthly": {
        "name": "Monthly Portfolio Rebalance",
        "description": "Automatically rebalance portfolio monthly",
        "trigger": {"trigger_type": "schedule", "value": "0 9 1 * *"},
        "actions": [{"action_type": "rebalance", "config": {"threshold": 5}}]
    }
}


# In-memory database
WORKFLOWS: Dict[str, Workflow] = {}
WORKFLOW_RUNS: List[WorkflowRun] = []


# ============================================================================
# Health & Status
# ============================================================================

@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-workflow",
        "status": "healthy",
        "version": "1.0.0",
        "port": DEFAULT_PORT,
        "capabilities": {
            "if_then_rules": "active",
            "scheduled_tasks": "active",
            "alert_triggers": "active",
            "auto_execution": "active"
        }
    }


@app.get("/status")
async def get_status():
    return {
        "service": "assetmind-workflow",
        "workflows": {
            "total": len(WORKFLOWS),
            "active": sum(1 for w in WORKFLOWS.values() if w.status == WorkflowStatus.ACTIVE)
        },
        "total_runs": len(WORKFLOW_RUNS),
        "templates": len(WORKFLOW_TEMPLATES)
    }


# ============================================================================
# Workflow CRUD
# ============================================================================

@app.post("/workflows", status_code=201, response_model=Workflow)
async def create_workflow(workflow: Workflow):
    workflow.workflow_id = workflow.workflow_id or str(uuid.uuid4())
    workflow.created_at = datetime.utcnow()
    WORKFLOWS[workflow.workflow_id] = workflow
    return workflow


@app.get("/workflows")
async def list_workflows(status: Optional[WorkflowStatus] = None, limit: int = 100):
    results = list(WORKFLOWS.values())
    if status:
        results = [w for w in results if w.status == status]
    results.sort(key=lambda w: w.created_at, reverse=True)
    return {"workflows": results[:limit], "total": len(results)}


@app.get("/workflows/{workflow_id}", response_model=Workflow)
async def get_workflow(workflow_id: str):
    if workflow_id not in WORKFLOWS:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return WORKFLOWS[workflow_id]


@app.patch("/workflows/{workflow_id}", response_model=Workflow)
async def update_workflow(workflow_id: str, updates: Dict):
    if workflow_id not in WORKFLOWS:
        raise HTTPException(status_code=404, detail="Workflow not found")
    workflow = WORKFLOWS[workflow_id]
    for key, value in updates.items():
        if hasattr(workflow, key):
            setattr(workflow, key, value)
    return workflow


@app.delete("/workflows/{workflow_id}")
async def delete_workflow(workflow_id: str):
    if workflow_id not in WORKFLOWS:
        raise HTTPException(status_code=404, detail="Workflow not found")
    del WORKFLOWS[workflow_id]
    return {"deleted": True}


# ============================================================================
# Workflow Templates
# ============================================================================

@app.get("/templates")
async def list_templates():
    return {"templates": list(WORKFLOW_TEMPLATES.values()), "total": len(WORKFLOW_TEMPLATES)}


@app.post("/templates/{template_id}/create")
async def create_from_template(template_id: str, name: str, symbol: Optional[str] = None):
    if template_id not in WORKFLOW_TEMPLATES:
        raise HTTPException(status_code=404, detail="Template not found")

    template = WORKFLOW_TEMPLATES[template_id]
    workflow = Workflow(
        workflow_id=str(uuid.uuid4()),
        name=name or template["name"],
        description=template["description"],
        trigger=Trigger(**template["trigger"]),
        actions=[Action(**a) for a in template["actions"]],
        created_at=datetime.utcnow()
    )
    if symbol:
        workflow.trigger.symbol = symbol

    WORKFLOWS[workflow.workflow_id] = workflow
    return {"workflow_id": workflow.workflow_id, "created": True}


# ============================================================================
# Workflow Execution
# ============================================================================

@app.post("/workflows/{workflow_id}/trigger", response_model=WorkflowRun)
async def trigger_workflow(workflow_id: str, data: Dict[str, Any]):
    if workflow_id not in WORKFLOWS:
        raise HTTPException(status_code=404, detail="Workflow not found")

    workflow = WORKFLOWS[workflow_id]
    conditions_met = []
    conditions_failed = []

    for condition in workflow.conditions:
        value = data.get(condition.field)
        met = evaluate_condition(value, condition.operator, condition.value)
        if met:
            conditions_met.append(condition.field)
        else:
            conditions_failed.append(condition.field)

    actions_executed = [a.action_type.value for a in workflow.actions]

    run = WorkflowRun(
        run_id=str(uuid.uuid4()),
        workflow_id=workflow_id,
        trigger_data=data,
        conditions_met=conditions_met,
        actions_executed=actions_executed,
        status="success",
        started_at=datetime.utcnow()
    )

    WORKFLOW_RUNS.append(run)
    workflow.last_triggered = datetime.utcnow()
    workflow.trigger_count += 1

    return run


@app.get("/workflows/{workflow_id}/runs")
async def get_workflow_runs(workflow_id: str, limit: int = 20):
    runs = [r for r in WORKFLOW_RUNS if r.workflow_id == workflow_id]
    runs.sort(key=lambda r: r.started_at, reverse=True)
    return {"workflow_id": workflow_id, "runs": runs[:limit], "total": len(runs)}


# ============================================================================
# Helper Functions
# ============================================================================

def evaluate_condition(value: Any, operator: ConditionOperator, target: Any) -> bool:
    if value is None:
        return False
    if operator == ConditionOperator.GT:
        return value > target
    elif operator == ConditionOperator.LT:
        return value < target
    elif operator == ConditionOperator.EQ:
        return value == target
    elif operator == ConditionOperator.GTE:
        return value >= target
    elif operator == ConditionOperator.LTE:
        return value <= target
    elif operator == ConditionOperator.CONTAINS:
        return target in str(value)
    return False


# ============================================================================
# Scenarios
# ============================================================================

@app.post("/scenarios")
async def create_scenario(name: str, rules: List[Dict]):
    scenario_id = str(uuid.uuid4())
    workflow_ids = []

    for rule in rules:
        workflow = Workflow(
            workflow_id=str(uuid.uuid4()),
            name=f"{name} - {rule.get('name', 'Rule')}",
            trigger=Trigger(
                trigger_type=TriggerType(rule.get("trigger_type", "price")),
                symbol=rule.get("symbol"),
                operator=ConditionOperator(rule.get("operator", ">")),
                value=rule.get("value", 0)
            ),
            actions=[Action(action_type=ActionType(rule.get("action", "alert")), config={})],
            created_at=datetime.utcnow()
        )
        WORKFLOWS[workflow.workflow_id] = workflow
        workflow_ids.append(workflow.workflow_id)

    return {"scenario_id": scenario_id, "workflows_created": len(workflow_ids)}


@app.get("/scenarios")
async def list_scenarios():
    categories = {}
    for tid, t in WORKFLOW_TEMPLATES.items():
        cat = tid.split("_")[0]
        if cat not in categories:
            categories[cat] = []
        categories[cat].append({"template_id": tid, "name": t["name"]})
    return {"categories": categories}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=DEFAULT_PORT)
