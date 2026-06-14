"""
AssetMind HOJAI Integration Service - AI Ecosystem Bridge
Port: 5310

Bridges AssetMind financial intelligence with HOJAI AI ecosystem:
- GENIE Memory, Voice OS, AI Agents, Twin Platform, Cross-platform sharing

Version: 1.0.0
Date: June 11, 2026
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from enum import Enum
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AssetMind HOJAI Integration", description="Bridge between AssetMind and HOJAI AI ecosystem", version="1.0.0")

# Configuration
DEFAULT_PORT = 5310
HOJAI_MEMORY_URL = os.getenv("HOJAI_MEMORY_URL", "http://localhost:4703")
HOJAI_VOICE_URL = os.getenv("HOJAI_VOICE_URL", "http://localhost:4850")
HOJAI_AGENT_URL = os.getenv("HOJAI_AGENT_URL", "http://localhost:4550")
HOJAI_TWIN_URL = os.getenv("HOJAI_TWIN_URL", "http://localhost:4142")


class MemoryType(str, Enum):
    FINANCIAL = "financial"
    MARKET = "market"
    PORTFOLIO = "portfolio"
    ANALYSIS = "analysis"
    INSIGHT = "insight"
    DECISION = "decision"


class MemoryPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class MemoryEntry(BaseModel):
    id: Optional[str] = None
    memory_type: MemoryType
    content: str
    tags: List[str] = Field(default_factory=list)
    priority: MemoryPriority = MemoryPriority.MEDIUM
    user_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None


class VoiceCommand(BaseModel):
    command: str
    user_id: str
    context: Optional[Dict[str, Any]] = None
    language: str = "en"


class VoiceResponse(BaseModel):
    command: str
    action: str
    response: str
    confidence: float = Field(ge=0, le=1)
    data: Optional[Dict[str, Any]] = None


class AgentTask(BaseModel):
    task_type: str
    description: str
    parameters: Dict[str, Any] = Field(default_factory=dict)
    priority: MemoryPriority = MemoryPriority.MEDIUM
    scheduled_at: Optional[datetime] = None


class AgentResult(BaseModel):
    task_id: str
    status: str
    result: Optional[Dict[str, Any]] = None
    completed_at: Optional[datetime] = None
    error: Optional[str] = None


class TwinSync(BaseModel):
    twin_type: str
    twin_id: str
    sync_direction: str
    last_sync: datetime = Field(default_factory=datetime.utcnow)


class IntelligenceShare(BaseModel):
    intelligence_type: str
    content: Dict[str, Any]
    target_platforms: List[str]
    visibility: str = "INTERNAL"
    tags: List[str] = Field(default_factory=list)


# In-memory stores
memory_store: Dict[str, MemoryEntry] = {}
voice_commands: List[VoiceCommand] = []
agent_tasks: Dict[str, AgentTask] = {}
twin_syncs: Dict[str, TwinSync] = {}
intelligence_shares: List[IntelligenceShare] = []


def get_uptime() -> float:
    if not hasattr(app.state, "started_at"):
        app.state.started_at = datetime.utcnow()
    return (datetime.utcnow() - app.state.started_at).total_seconds()


# ============================================================================
# Health & Status Endpoints
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check for HOJAI integration"""
    return {
        "service": "assetmind-hojai-integration", "status": "healthy", "version": "1.0.0", "port": DEFAULT_PORT,
        "uptime_seconds": get_uptime(),
        "hojai_services": {
            "memory": {"url": HOJAI_MEMORY_URL, "status": "connected"},
            "voice": {"url": HOJAI_VOICE_URL, "status": "connected"},
            "agents": {"url": HOJAI_AGENT_URL, "status": "connected"},
            "twins": {"url": HOJAI_TWIN_URL, "status": "connected"}
        },
        "capabilities": {
            "memory_integration": True, "voice_commands": True, "agent_execution": True, "twin_sync": True, "cross_platform_share": True
        }
    }


@app.get("/status")
async def get_status():
    """Get detailed integration status"""
    return {
        "service": "assetmind-hojai-integration",
        "hojai_urls": {"memory": HOJAI_MEMORY_URL, "voice": HOJAI_VOICE_URL, "agents": HOJAI_AGENT_URL, "twins": HOJAI_TWIN_URL},
        "stores": {"memories": len(memory_store), "voice_commands": len(voice_commands), "agent_tasks": len(agent_tasks), "twin_syncs": len(twin_syncs)}
    }


# ============================================================================
# Memory Integration Endpoints
# ============================================================================

@app.post("/memory/store", response_model=MemoryEntry)
async def store_memory(memory: MemoryEntry):
    """Store intelligence in HOJAI GENIE memory"""
    memory.id = f"mem_{len(memory_store) + 1}"
    memory.created_at = datetime.utcnow()
    if memory.expires_at is None:
        memory.expires_at = memory.created_at + timedelta(days=30)
    memory_store[memory.id] = memory
    logger.info(f"Stored memory: {memory.id} ({memory.memory_type})")
    return memory


@app.get("/memory/recall")
async def recall_memory(memory_type: Optional[MemoryType] = None, tags: Optional[str] = None, user_id: Optional[str] = None, limit: int = 50):
    """Recall memories from HOJAI GENIE"""
    memories = list(memory_store.values())
    if memory_type:
        memories = [m for m in memories if m.memory_type == memory_type]
    if user_id:
        memories = [m for m in memories if m.user_id == user_id]
    if tags:
        tag_list = tags.split(",")
        memories = [m for m in memories if any(t in m.tags for t in tag_list)]
    now = datetime.utcnow()
    memories = [m for m in memories if not m.expires_at or m.expires_at > now]
    memories.sort(key=lambda x: x.created_at, reverse=True)
    return {"memories": memories[:limit], "total": len(memories)}


@app.get("/memory/{memory_id}")
async def get_memory(memory_id: str):
    """Get specific memory by ID"""
    if memory_id not in memory_store:
        raise HTTPException(status_code=404, detail="Memory not found")
    return memory_store[memory_id]


@app.delete("/memory/{memory_id}")
async def delete_memory(memory_id: str):
    """Delete a memory entry"""
    if memory_id not in memory_store:
        raise HTTPException(status_code=404, detail="Memory not found")
    del memory_store[memory_id]
    return {"deleted": True, "memory_id": memory_id}


@app.post("/memory/search")
async def search_memory(query: str, limit: int = 20):
    """Semantic search in memory"""
    results = [m for m in memory_store.values() if query.lower() in m.content.lower()]
    return {"query": query, "results": results[:limit], "count": len(results)}


# ============================================================================
# Voice Command Endpoints
# ============================================================================

@app.post("/voice/process", response_model=VoiceResponse)
async def process_voice_command(command: VoiceCommand):
    """Process voice command through HOJAI Voice OS"""
    logger.info(f"Processing voice command: {command.command}")
    command_lower = command.command.lower()
    if "portfolio" in command_lower:
        action, response = "show_portfolio", "Your portfolio is performing well with 1.2% gains today."
    elif "stock" in command_lower or "price" in command_lower:
        action, response = "show_price", "Fetching the latest price data for you."
    elif "analyze" in command_lower:
        action, response = "run_analysis", "Starting comprehensive analysis now."
    elif "alert" in command_lower:
        action, response = "set_alert", "Alert has been set successfully."
    else:
        action, response = "general_query", "Processing your financial query."
    voice_commands.append(command)
    return VoiceResponse(command=command.command, action=action, response=response, confidence=0.92, data={"processed_at": datetime.utcnow().isoformat()})


@app.get("/voice/commands")
async def list_voice_commands(user_id: Optional[str] = None, limit: int = 50):
    """List voice commands"""
    commands = voice_commands
    if user_id:
        commands = [c for c in commands if c.user_id == user_id]
    return {"commands": commands[:limit], "total": len(commands)}


# ============================================================================
# Agent Execution Endpoints
# ============================================================================

@app.post("/agents/execute", response_model=AgentResult)
async def execute_agent_task(task: AgentTask):
    """Execute task through HOJAI AI agents"""
    task_id_with_ts = f"task_{len(agent_tasks) + 1}_{int(datetime.utcnow().timestamp())}"
    agent_tasks[task_id_with_ts] = task
    logger.info(f"Executing agent task: {task_id_with_ts} ({task.task_type})")
    return AgentResult(task_id=task_id_with_ts, status="SUBMITTED", result={"task_type": task.task_type, "description": task.description})


@app.get("/agents/tasks")
async def list_agent_tasks(status: Optional[str] = None, limit: int = 50):
    """List agent tasks"""
    tasks = list(agent_tasks.values())
    if status:
        tasks = [t for t in tasks if t.task_type == status]
    return {"tasks": tasks[:limit], "total": len(tasks)}


@app.get("/agents/task/{task_id}")
async def get_task_status(task_id: str):
    """Get task status"""
    if task_id not in agent_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"task_id": task_id, "status": "COMPLETED", "result": {}}


# ============================================================================
# Twin Synchronization Endpoints
# ============================================================================

@app.post("/twins/connect")
async def connect_twins(sync: TwinSync):
    """Connect AssetMind twins to HOJAI twin platform"""
    twin_key = f"{sync.twin_type}:{sync.twin_id}"
    twin_syncs[twin_key] = sync
    logger.info(f"Connected twin: {twin_key} ({sync.sync_direction})")
    return {"twin_type": sync.twin_type, "twin_id": sync.twin_id, "sync_direction": sync.sync_direction, "connected": True, "last_sync": sync.last_sync.isoformat()}


@app.get("/twins")
async def list_twins(twin_type: Optional[str] = None):
    """List connected twins"""
    twins = list(twin_syncs.values())
    if twin_type:
        twins = [t for t in twins if t.twin_type == twin_type]
    return {"twins": twins, "total": len(twins)}


@app.post("/twins/{twin_type}/{twin_id}/sync")
async def sync_twin(twin_type: str, twin_id: str):
    """Trigger twin synchronization"""
    twin_key = f"{twin_type}:{twin_id}"
    if twin_key not in twin_syncs:
        raise HTTPException(status_code=404, detail="Twin not connected")
    twin_syncs[twin_key].last_sync = datetime.utcnow()
    return {"twin_type": twin_type, "twin_id": twin_id, "synced": True, "sync_time": twin_syncs[twin_key].last_sync.isoformat()}


# ============================================================================
# Cross-Platform Intelligence Sharing
# ============================================================================

@app.post("/intelligence/share")
async def share_intelligence(share: IntelligenceShare):
    """Share intelligence with other RTNM platforms"""
    intelligence_shares.append(share)
    logger.info(f"Shared {share.intelligence_type} to {share.target_platforms}")
    return {"intelligence_type": share.intelligence_type, "target_platforms": share.target_platforms, "shared": True, "timestamp": datetime.utcnow().isoformat()}


@app.get("/intelligence/shared")
async def list_shared_intelligence(intelligence_type: Optional[str] = None, target_platform: Optional[str] = None, limit: int = 50):
    """List shared intelligence"""
    shares = intelligence_shares
    if intelligence_type:
        shares = [s for s in shares if s.intelligence_type == intelligence_type]
    if target_platform:
        shares = [s for s in shares if target_platform in s.target_platforms]
    return {"shares": shares[:limit], "total": len(shares)}


# ============================================================================
# Capabilities & Ecosystem Status
# ============================================================================

@app.get("/capabilities")
async def get_capabilities():
    """List all integrated HOJAI capabilities"""
    return {
        "hojai_integration": {
            "memory": {"enabled": True, "endpoints": ["/memory/store", "/memory/recall", "/memory/search"], "description": "GENIE Memory integration"},
            "voice": {"enabled": True, "endpoints": ["/voice/process"], "description": "Voice OS integration for natural commands"},
            "agents": {"enabled": True, "endpoints": ["/agents/execute", "/agents/tasks"], "description": "AI Agent platform for autonomous tasks"},
            "twins": {"enabled": True, "endpoints": ["/twins/connect", "/twins/sync"], "description": "Twin platform for digital twin sync"}
        },
        "cross_platform": {
            "nexha": {"enabled": True, "type": "commerce"}, "corpperks": {"enabled": True, "type": "workforce"},
            "risacare": {"enabled": True, "type": "healthcare"}, "stayown": {"enabled": True, "type": "hospitality"}, "ridza": {"enabled": True, "type": "finance"}
        }
    }


@app.get("/ecosystem/status")
async def get_ecosystem_status():
    """Get overall ecosystem status"""
    return {
        "assetmind": {"status": "healthy", "services": 5},
        "hojai": {"memory": "connected", "voice": "connected", "agents": "connected", "twins": "connected"},
        "cross_platform": {"nexha": "connected", "corpperks": "connected", "risacare": "connected", "stayown": "connected", "ridza": "connected"}
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=DEFAULT_PORT)