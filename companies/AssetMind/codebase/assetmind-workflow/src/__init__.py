"""
AssetMind - Workflow Engine
Port: 5290

Financial Workflow Automation.

Think Zapier + Bloomberg + AI.

Examples:

If earnings surprise >10%
→ Generate report

If portfolio drawdown >15%
→ Alert me

If insider buying spikes
→ Create research brief

Version: 1.0.0
Date: June 9, 2026
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Callable
from datetime import datetime
from enum import Enum
import uuid


app = FastAPI(
    title="AssetMind Workflow Engine",
    version="1.0.0",
    description="Financial workflow automation"
)


# =============================================================================
# TRIGGER TYPES
# =============================================================================

class TriggerType(str, Enum):
    PRICE = "price"           # Price crosses threshold
    EARNINGS = "earnings"       # Earnings announcement
    NEWS = "news"             # News about symbol
    PORTFOLIO = "portfolio"     # Portfolio threshold
    CUSTOM = "custom"           # Custom condition


class ActionType(str, Enum):
    ALERT = "alert"
    EMAIL = "email"
    SMS = "sms"
    REPORT = "report"
    TRADE = "trade"
    REBALANCE = "rebalance"
    RESEARCH = "research"
    WEBHOOK = "webhook"


# =============================================================================
# WORKFLOW MODELS
# =============================================================================

class Trigger(BaseModel):
    trigger_type: TriggerType
    symbol: Optional[str] = None
    condition: str = ">"  # >, <, ==, contains
    value: float
    window: Optional[str] = None  # "1d", "1h", "5m"


class Condition(BaseModel):
    field: str
    operator: str  # >, <, ==, contains, changes
    value: Any


class Action(BaseModel):
    action_type: ActionType
    config: Dict[str, Any] = Field(default_factory=dict)
    delay: str = "immediate"  # "immediate", "1h", "1d"


class Workflow(BaseModel):
    workflow_id: str
    name: str
    description: Optional[str] = None
    enabled: bool = True

    # Trigger
    trigger: Trigger

    # Conditions
    conditions: List[Condition] = Field(default_factory=list)

    # Actions
    actions: List[Action] = Field(default_factory=list)

    # Meta
    created_by: str = "user"
    created_at: datetime
    last_triggered: Optional[datetime] = None
    trigger_count: int = 0


class WorkflowRun(BaseModel):
    run_id: str
    workflow_id: str
    trigger_data: Dict[str, Any]
    conditions_met: List[str] = Field(default_factory=list)
    actions_executed: List[str] = Field(default_factory=list)
    status: str = "success"
    executed_at: datetime


# =============================================================================
# WORKFLOW TEMPLATES
# =============================================================================

WORKFLOW_TEMPLATES = {
    "earnings_beat": {
        "name": "Earnings Beat Alert",
        "description": "Alert when earnings beat by >10%",
        "trigger": {
            "trigger_type": "earnings",
            "condition": ">10%"
        },
        "actions": [
            {"action_type": "alert", "config": {"priority": "high"}},
            {"action_type": "research", "config": {"type": "earnings_analysis"}}
        ]
    },
    "portfolio_drawdown": {
        "name": "Portfolio Drawdown Alert",
        "description": "Alert when portfolio drawdown >15%",
        "trigger": {
            "trigger_type": "portfolio",
            "condition": "<-15%"
        },
        "actions": [
            {"action_type": "alert", "config": {"priority": "critical"}},
            {"action_type": "rebalance", "config": {"strategy": "stop_loss"}}
        ]
    },
    "insider_buying": {
        "name": "Insider Buying Spike",
        "description": "Create research when insider buying spikes",
        "trigger": {
            "trigger_type": "news",
            "condition": "insider_buying"
        },
        "actions": [
            {"action_type": "research", "config": {"type": "insider_analysis"}},
            {"action_type": "alert", "config": {"priority": "medium"}}
        ]
    },
    "price_alert": {
        "name": "Price Alert",
        "description": "Alert when price crosses threshold",
        "trigger": {
            "trigger_type": "price",
            "condition": "crosses"
        },
        "actions": [
            {"action_type": "alert", "config": {}}
        ]
    }
}


# =============================================================================
# DATABASE
# =============================================================================

WORKFLOWS: Dict[str, Workflow] = {}
WORKFLOW_RUNS: List[WorkflowRun] = []


# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-workflow",
        "status": "healthy",
        "port": 5290,
        "workflows": len(WORKFLOWS),
        "runs": len(WORKFLOW_RUNS)
    }


@app.get("/")
async def root():
    return {
        "service": "AssetMind Workflow Engine",
        "description": "Financial workflow automation",
        "templates": list(WORKFLOW_TEMPLATES.keys())
    }


# =============================================================================
# WORKFLOW CRUD
# =============================================================================

@app.post("/workflows", status_code=201)
async def create_workflow(workflow: Workflow):
    WORKFLOWS[workflow.workflow_id] = workflow
    return {"workflow_id": workflow.workflow_id, "created": True}


@app.get("/workflows")
async def list_workflows(enabled: Optional[bool] = None):
    results = list(WORKFLOWS.values())
    if enabled is not None:
        results = [w for w in results if w.enabled == enabled]
    return {"workflows": results, "total": len(results)}


@app.get("/workflows/{workflow_id}")
async def get_workflow(workflow_id: str):
    if workflow_id not in WORKFLOWS:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return WORKFLOWS[workflow_id]


@app.patch("/workflows/{workflow_id}")
async def update_workflow(workflow_id: str, updates: Dict):
    if workflow_id not in WORKFLOWS:
        raise HTTPException(status_code=404, detail="Workflow not found")

    workflow = WORKFLOWS[workflow_id]
    for key, value in updates.items():
        if hasattr(workflow, key):
            setattr(workflow, key, value)

    return {"updated": True}


@app.delete("/workflows/{workflow_id}")
async def delete_workflow(workflow_id: str):
    if workflow_id not in WORKFLOWS:
        raise HTTPException(status_code=404, detail="Workflow not found")
    del WORKFLOWS[workflow_id]
    return {"deleted": True}


# =============================================================================
# WORKFLOW TEMPLATES
# =============================================================================

@app.get("/templates")
async def list_templates():
    return {"templates": WORKFLOW_TEMPLATES}


@app.post("/templates/{template_name}/create")
async def create_from_template(template_name: str, symbol: str = None):
    if template_name not in WORKFLOW_TEMPLATES:
        raise HTTPException(status_code=404, detail="Template not found")

    template = WORKFLOW_TEMPLATES[template_name]

    workflow = Workflow(
        workflow_id=str(uuid.uuid4()),
        name=f"{template['name']} - {symbol or 'Auto'}",
        description=template["description"],
        trigger=Trigger(**template["trigger"]),
        actions=[Action(**a) for a in template["actions"]],
        created_at=datetime.utcnow()
    )

    WORKFLOWS[workflow.workflow_id] = workflow
    return {"workflow_id": workflow.workflow_id, "created": True}


# =============================================================================
# WORKFLOW EXECUTION
# =============================================================================

@app.post("/workflows/{workflow_id}/trigger")
async def trigger_workflow(workflow_id: str, data: Dict):
    """Manually trigger a workflow"""
    if workflow_id not in WORKFLOWS:
        raise HTTPException(status_code=404, detail="Workflow not found")

    workflow = WORKFLOWS[workflow_id]

    # Check conditions
    conditions_met = []
    for condition in workflow.conditions:
        field_value = data.get(condition.field)
        if condition.operator == ">":
            met = field_value > condition.value
        elif condition.operator == "<":
            met = field_value < condition.value
        elif condition.operator == "==":
            met = field_value == condition.value
        else:
            met = False

        if met:
            conditions_met.append(condition.field)

    # Execute actions
    actions_executed = []
    for action in workflow.actions:
        actions_executed.append(action.action_type.value)

    # Record run
    run = WorkflowRun(
        run_id=str(uuid.uuid4()),
        workflow_id=workflow_id,
        trigger_data=data,
        conditions_met=conditions_met,
        actions_executed=actions_executed,
        executed_at=datetime.utcnow()
    )

    WORKFLOW_RUNS.append(run)

    # Update workflow
    workflow.last_triggered = datetime.utcnow()
    workflow.trigger_count += 1

    return {
        "run_id": run.run_id,
        "workflow_id": workflow_id,
        "conditions_met": conditions_met,
        "actions_executed": actions_executed,
        "status": "success"
    }


@app.get("/workflows/{workflow_id}/runs")
async def get_workflow_runs(workflow_id: str, limit: int = 20):
    runs = [r for r in WORKFLOW_RUNS if r.workflow_id == workflow_id]
    runs.sort(key=lambda r: r.executed_at, reverse=True)
    return {"runs": runs[:limit], "total": len(runs)}


# =============================================================================
# SCENARIOS
# =============================================================================

@app.post("/scenarios")
async def create_scenario(name: str, rules: List[Dict]):
    """Create a scenario with multiple rules"""
    scenario_id = str(uuid.uuid4())

    # Create workflow for each rule
    workflow_ids = []
    for rule in rules:
        workflow = Workflow(
            workflow_id=str(uuid.uuid4()),
            name=f"{name} - {rule.get('name', 'Rule')}",
            trigger=Trigger(
                trigger_type=TriggerType(rule.get("trigger_type", "price"),
                symbol=rule.get("symbol"),
                condition=rule.get("condition", ">"),
                value=rule.get("value", 0)
            ),
            actions=[
                Action(
                    action_type=ActionType(rule.get("action", "alert"),
                    config=rule.get("config", {})
                )
            ],
            created_at=datetime.utcnow()
        )
        WORKFLOWS[workflow.workflow_id] = workflow
        workflow_ids.append(workflow.workflow_id)

    return {
        "scenario_id": scenario_id,
        "name": name,
        "workflows_created": len(workflow_ids),
        "workflow_ids": workflow_ids
    }


@app.get("/scenarios")
async def list_scenarios():
    """Get workflow scenarios"""
    return {
        "scenarios": [
            {
                "name": t["name"],
                "description": t["description"],
                "trigger": t["trigger"]["trigger_type"]
            }
            for t in WORKFLOW_TEMPLATES.values()
        ]
    }


# =============================================================================
# POPULAR WORKFLOWS
# =============================================================================

@app.post("/workflows/popular")
async def create_popular_workflows():
    """Create popular workflow templates"""
    created = []

    for name, template in WORKFLOW_TEMPLATES.items():
        workflow = Workflow(
            workflow_id=str(uuid.uuid4()),
            name=template["name"],
            description=template["description"],
            trigger=Trigger(**template["trigger"]),
            actions=[Action(**a) for a in template["actions"]],
            created_at=datetime.utcnow()
        )
        WORKFLOWS[workflow.workflow_id] = workflow
        created.append(workflow.workflow_id)

    return {"created": len(created), "workflow_ids": created}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5290)