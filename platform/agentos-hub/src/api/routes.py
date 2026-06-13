"""
AgentOS Hub - API Routes

REST API routes for all agent operations across 24 industries.
"""

from typing import List, Optional, Any, Dict
from datetime import datetime

from fastapi import APIRouter, HTTPException, Query, Path
from pydantic import BaseModel, Field

from .gateway import get_hub
from ..core.orchestrator import IndustryType, AgentStatus
from ..core.health_monitor import HealthStatus, AlertSeverity

router = APIRouter()


# ==================== Health & Info Routes ====================

@router.get("/health")
async def health_check():
    """Health check endpoint."""
    hub = get_hub()
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "uptime_seconds": hub.uptime_seconds
    }


@router.get("/info")
async def get_info():
    """Get AgentOS Hub information."""
    hub = get_hub()
    return {
        "name": "AgentOS Hub",
        "version": "1.0.0",
        "description": "Unified Agent Orchestration Platform for 24 Industries",
        "industries": len(IndustryType),
        "uptime_seconds": hub.uptime_seconds
    }


# ==================== Industry Routes ====================

@router.get("/industries")
async def list_industries():
    """List all 24 industry verticals."""
    hub = get_hub()
    overview = hub.orchestrator.get_industry_overview()
    return overview


@router.get("/industries/{industry}")
async def get_industry(industry: str = Path(..., description="Industry name")):
    """Get details for a specific industry."""
    try:
        industry_type = IndustryType(industry)
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Industry '{industry}' not found")

    hub = get_hub()
    config = hub.orchestrator.industry_configs.get(industry_type, {})
    agents = hub.orchestrator.get_agents_by_industry(industry_type)

    return {
        "name": industry_type.value,
        "display_name": industry_type.name.replace("_", " ").title(),
        "ports": config.get("ports", []),
        "gateway": config.get("gateway", "N/A"),
        "twins": config.get("twins", []),
        "agents": [
            {
                "id": a.id,
                "name": a.name,
                "status": a.status.value,
                "capabilities": a.capabilities
            }
            for a in agents
        ]
    }


# ==================== Agent Routes ====================

@router.post("/agents/register")
async def register_agent(request: Dict[str, Any]):
    """Register a new agent."""
    hub = get_hub()

    agent = Agent(
        id=request["agent_id"],
        name=request["name"],
        industry=IndustryType(request["industry"]),
        capabilities=request["capabilities"],
        endpoint=request.get("endpoint", "http://localhost"),
        protocol=request.get("protocol", "grpc"),
        metadata=request.get("metadata", {})
    )

    success = await hub.orchestrator.register_agent(agent)

    if success:
        # Also register with health monitor
        await hub.health_monitor.register_agent_health(
            agent_id=agent.id,
            agent_name=agent.name,
            industry=agent.industry.value
        )

        return {"status": "registered", "agent_id": agent.id}
    else:
        raise HTTPException(status_code=500, detail="Failed to register agent")


@router.delete("/agents/{agent_id}")
async def unregister_agent(agent_id: str):
    """Unregister an agent."""
    hub = get_hub()

    success = await hub.orchestrator.unregister_agent(agent_id)

    if success:
        return {"status": "unregistered", "agent_id": agent_id}
    else:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")


@router.get("/agents")
async def list_agents(
    industry: Optional[str] = Query(None, description="Filter by industry"),
    capability: Optional[str] = Query(None, description="Filter by capability"),
    status: Optional[str] = Query(None, description="Filter by status")
):
    """List all registered agents."""
    hub = get_hub()

    agents = list(hub.orchestrator.agents.values())

    if industry:
        try:
            industry_type = IndustryType(industry)
            agents = [a for a in agents if a.industry == industry_type]
        except ValueError:
            pass

    if capability:
        agents = [a for a in agents if capability in a.capabilities]

    if status:
        try:
            agent_status = AgentStatus(status)
            agents = [a for a in agents if a.status == agent_status]
        except ValueError:
            pass

    return {
        "total": len(agents),
        "agents": [
            {
                "id": a.id,
                "name": a.name,
                "industry": a.industry.value,
                "capabilities": a.capabilities,
                "status": a.status.value,
                "current_tasks": a.current_tasks,
                "success_count": a.success_count,
                "error_count": a.error_count,
                "last_heartbeat": a.last_heartbeat.isoformat()
            }
            for a in agents
        ]
    }


@router.get("/agents/{agent_id}")
async def get_agent(agent_id: str):
    """Get details for a specific agent."""
    hub = get_hub()

    agent = hub.orchestrator.get_agent(agent_id)

    if not agent:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")

    return {
        "id": agent.id,
        "name": agent.name,
        "industry": agent.industry.value,
        "capabilities": agent.capabilities,
        "endpoint": agent.endpoint,
        "protocol": agent.protocol,
        "status": agent.status.value,
        "max_concurrent_tasks": agent.max_concurrent_tasks,
        "current_tasks": agent.current_tasks,
        "success_count": agent.success_count,
        "error_count": agent.error_count,
        "last_heartbeat": agent.last_heartbeat.isoformat(),
        "metadata": agent.metadata
    }


@router.patch("/agents/{agent_id}/status")
async def update_agent_status(agent_id: str, status: str):
    """Update agent status."""
    hub = get_hub()

    try:
        new_status = AgentStatus(status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

    success = await hub.orchestrator.update_agent_status(agent_id, new_status)

    if success:
        return {"status": "updated", "agent_id": agent_id, "new_status": status}
    else:
        raise HTTPException(status_code=404, detail=f"Agent {agent_id} not found")


# ==================== Workflow Routes ====================

@router.post("/workflows")
async def create_workflow(request: Dict[str, Any]):
    """Create a new cross-industry workflow."""
    hub = get_hub()

    try:
        industries = [IndustryType(i) for i in request["industries"]]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid industry: {e}")

    workflow = await hub.orchestrator.create_workflow(
        name=request["name"],
        description=request.get("description", ""),
        industries=industries,
        steps=request["steps"]
    )

    return {
        "workflow_id": workflow.id,
        "name": workflow.name,
        "status": workflow.status,
        "created_at": workflow.created_at.isoformat()
    }


@router.get("/workflows")
async def list_workflows(
    status: Optional[str] = Query(None, description="Filter by status"),
    industry: Optional[str] = Query(None, description="Filter by industry")
):
    """List all workflows."""
    hub = get_hub()

    workflows = list(hub.orchestrator.workflows.values())

    if status:
        workflows = [w for w in workflows if w.status == status]

    if industry:
        try:
            industry_type = IndustryType(industry)
            workflows = [w for w in workflows if industry_type in w.industries]
        except ValueError:
            pass

    return {
        "total": len(workflows),
        "workflows": [
            {
                "id": w.id,
                "name": w.name,
                "status": w.status,
                "industries": [i.value for i in w.industries],
                "step_count": len(w.steps),
                "created_at": w.created_at.isoformat(),
                "completed_at": w.completed_at.isoformat() if w.completed_at else None
            }
            for w in workflows
        ]
    }


@router.post("/workflows/{workflow_id}/execute")
async def execute_workflow(workflow_id: str, initial_context: Optional[Dict] = None):
    """Execute a workflow."""
    hub = get_hub()

    try:
        result = await hub.orchestrator.execute_workflow(workflow_id, initial_context)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/workflows/{workflow_id}")
async def get_workflow(workflow_id: str):
    """Get workflow details."""
    hub = get_hub()

    workflow = hub.orchestrator.workflows.get(workflow_id)

    if not workflow:
        raise HTTPException(status_code=404, detail=f"Workflow {workflow_id} not found")

    return {
        "id": workflow.id,
        "name": workflow.name,
        "description": workflow.description,
        "status": workflow.status,
        "industries": [i.value for i in workflow.industries],
        "steps": workflow.steps,
        "context": workflow.context,
        "created_at": workflow.created_at.isoformat(),
        "completed_at": workflow.completed_at.isoformat() if workflow.completed_at else None
    }


# ==================== Cross-Industry Routes ====================

@router.post("/cross-industry")
async def cross_industry_operation(request: Dict[str, Any]):
    """Execute a cross-industry operation."""
    hub = get_hub()

    try:
        source = IndustryType(request["source_industry"])
        target = IndustryType(request["target_industry"])
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid industry: {e}")

    try:
        result = await hub.orchestrator.orchestrate_cross_industry(
            source_industry=source,
            target_industry=target,
            operation=request["operation"],
            payload=request["payload"]
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/broadcast")
async def broadcast_to_industry(request: Dict[str, Any]):
    """Broadcast a message to all agents in an industry."""
    hub = get_hub()

    try:
        industry = IndustryType(request["industry"])
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid industry: {request['industry']}")

    result = await hub.orchestrator.broadcast_to_industry(industry, request["message"])
    return result


# ==================== Health Monitoring Routes ====================

@router.get("/monitoring/health")
async def get_all_health():
    """Get health status of all agents."""
    hub = get_hub()
    return hub.health_monitor.get_all_health()


@router.get("/monitoring/health/{industry}")
async def get_industry_health(industry: str):
    """Get health status for a specific industry."""
    hub = get_hub()
    return hub.health_monitor.get_industry_health(industry)


@router.get("/monitoring/stats")
async def get_monitoring_stats():
    """Get monitoring statistics."""
    hub = get_hub()
    return hub.health_monitor.get_stats()


@router.get("/monitoring/alerts")
async def get_alerts(
    severity: Optional[str] = Query(None, description="Filter by severity"),
    industry: Optional[str] = Query(None, description="Filter by industry"),
    resolved: bool = Query(False, description="Include resolved alerts")
):
    """Get active alerts."""
    hub = get_hub()

    alerts = hub.health_monitor.get_active_alerts()

    if severity:
        try:
            sev = AlertSeverity(severity)
            alerts = [a for a in alerts if a.severity == sev]
        except ValueError:
            pass

    if industry:
        alerts = [a for a in alerts if a.industry == industry]

    return {
        "total": len(alerts),
        "alerts": [
            {
                "id": a.id,
                "severity": a.severity.value,
                "agent_id": a.agent_id,
                "agent_name": a.agent_name,
                "industry": a.industry,
                "title": a.title,
                "message": a.message,
                "timestamp": a.timestamp.isoformat(),
                "acknowledged": a.acknowledged,
                "resolved": a.resolved
            }
            for a in alerts
        ]
    }


@router.post("/monitoring/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str):
    """Acknowledge an alert."""
    hub = get_hub()

    success = await hub.health_monitor.acknowledge_alert(alert_id)

    if success:
        return {"status": "acknowledged", "alert_id": alert_id}
    else:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")


@router.post("/monitoring/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: str):
    """Resolve an alert."""
    hub = get_hub()

    success = await hub.health_monitor.resolve_alert(alert_id)

    if success:
        return {"status": "resolved", "alert_id": alert_id}
    else:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found")


# ==================== Event Bus Routes ====================

@router.get("/events/history")
async def get_event_history(
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    source: Optional[str] = Query(None, description="Filter by source"),
    industry: Optional[str] = Query(None, description="Filter by industry"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum events to return")
):
    """Get event history."""
    hub = get_hub()

    events = hub.event_bus.get_event_history(
        event_type=event_type,
        source=source,
        industry=industry,
        limit=limit
    )

    return {
        "total": len(events),
        "events": [e.to_dict() for e in events]
    }


@router.get("/events/stats")
async def get_event_stats():
    """Get event bus statistics."""
    hub = get_hub()
    return hub.event_bus.get_stats()


# ==================== Statistics Routes ====================

@router.get("/stats")
async def get_stats():
    """Get overall platform statistics."""
    hub = get_hub()

    return {
        "orchestrator": hub.orchestrator.get_stats(),
        "registry": hub.registry.get_stats(),
        "event_bus": hub.event_bus.get_stats(),
        "monitoring": hub.health_monitor.get_stats()
    }
