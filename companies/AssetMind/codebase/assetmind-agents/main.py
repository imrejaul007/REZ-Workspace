"""
AssetMind Agents - AI Agents Service
Port: 5003
Provides AI-powered financial analysis agents.
"""

import uuid
import asyncio
from datetime import datetime
from typing import Optional, List
from enum import Enum

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from loguru import logger

app = FastAPI(title="AssetMind Agents", description="AI Agents Service", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class AgentType(str, Enum):
    ANALYST = "analyst"
    TRADER = "trader"
    RESEARCHER = "researcher"
    RISK_MANAGER = "risk_manager"

class AgentStatus(str, Enum):
    IDLE = "idle"
    WORKING = "working"
    COMPLETED = "completed"
    FAILED = "failed"

class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"

# ============================================================================
# Pydantic Models
# ============================================================================

class AgentConfig(BaseModel):
    model_name: str = "gpt-4"
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=4000, ge=100, le=100000)

class AgentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    agent_type: AgentType
    description: Optional[str] = None
    config: AgentConfig = AgentConfig()

class Agent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    agent_type: AgentType
    description: Optional[str] = None
    config: AgentConfig = AgentConfig()
    status: AgentStatus = AgentStatus.IDLE
    is_active: bool = True
    tasks_completed: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TaskContext(BaseModel):
    portfolio_id: Optional[str] = None
    symbols: List[str] = []
    parameters: dict = {}

class TaskCreate(BaseModel):
    agent_id: str
    task_type: str
    description: str
    context: TaskContext = TaskContext()
    priority: TaskPriority = TaskPriority.MEDIUM

class Task(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    agent_id: str
    task_type: str
    description: str
    context: TaskContext = TaskContext()
    priority: TaskPriority = TaskPriority.MEDIUM
    status: TaskStatus = TaskStatus.PENDING
    result: Optional[dict] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Conversation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    agent_id: str
    user_id: str
    messages: List[Message] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AnalysisRequest(BaseModel):
    agent_id: str
    prompt: str
    context: dict = {}

class AnalysisResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    agent_id: str
    request_prompt: str
    response: str
    insights: List[str] = []
    recommendations: List[str] = []
    confidence_score: float = Field(default=0.0, ge=0.0, le=1.0)
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ============================================================================
# In-Memory Storage
# ============================================================================

agents_db: dict[str, Agent] = {}
tasks_db: dict[str, Task] = {}
conversations_db: dict[str, Conversation] = {}
analysis_results_db: dict[str, AnalysisResult] = {}

# Initialize sample agents
agents_db["agent-analyst-001"] = Agent(id="agent-analyst-001", name="Market Analyst", agent_type=AgentType.ANALYST, description="Analyzes market trends")
agents_db["agent-researcher-001"] = Agent(id="agent-researcher-001", name="Research Agent", agent_type=AgentType.RESEARCHER, description="Researches companies")
agents_db["agent-risk-001"] = Agent(id="agent-risk-001", name="Risk Manager", agent_type=AgentType.RISK_MANAGER, description="Evaluates portfolio risk")

# ============================================================================
# Health Check
# ============================================================================

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "assetmind-agents",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "stats": {"agents": len(agents_db), "pending_tasks": len([t for t in tasks_db.values() if t.status == TaskStatus.PENDING])}
    }

# ============================================================================
# Agent Management Endpoints
# ============================================================================

@app.post("/agents", response_model=Agent, status_code=201)
async def create_agent(agent: AgentCreate):
    new_agent = Agent(**agent.model_dump())
    agents_db[new_agent.id] = new_agent
    logger.info(f"Created agent: {new_agent.name}")
    return new_agent

@app.get("/agents", response_model=List[Agent])
async def list_agents(skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100), agent_type: Optional[AgentType] = None):
    agents = list(agents_db.values())
    if agent_type:
        agents = [a for a in agents if a.agent_type == agent_type]
    return agents[skip:skip+limit]

@app.get("/agents/{agent_id}", response_model=Agent)
async def get_agent(agent_id: str):
    if agent_id not in agents_db:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agents_db[agent_id]

@app.put("/agents/{agent_id}", response_model=Agent)
async def update_agent(agent_id: str, update: dict):
    if agent_id not in agents_db:
        raise HTTPException(status_code=404, detail="Agent not found")
    agent = agents_db[agent_id]
    for field, value in update.items():
        if hasattr(agent, field):
            setattr(agent, field, value)
    return agent

@app.delete("/agents/{agent_id}", status_code=204)
async def delete_agent(agent_id: str):
    if agent_id not in agents_db:
        raise HTTPException(status_code=404, detail="Agent not found")
    del agents_db[agent_id]

# ============================================================================
# Task Management Endpoints
# ============================================================================

@app.post("/tasks", response_model=Task, status_code=201)
async def create_task(task: TaskCreate):
    if task.agent_id not in agents_db:
        raise HTTPException(status_code=404, detail="Agent not found")
    new_task = Task(**task.model_dump())
    tasks_db[new_task.id] = new_task
    return new_task

@app.get("/tasks", response_model=List[Task])
async def list_tasks(skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100), agent_id: Optional[str] = None, status: Optional[TaskStatus] = None):
    tasks = list(tasks_db.values())
    if agent_id:
        tasks = [t for t in tasks if t.agent_id == agent_id]
    if status:
        tasks = [t for t in tasks if t.status == status]
    priority_order = {TaskPriority.URGENT: 0, TaskPriority.HIGH: 1, TaskPriority.MEDIUM: 2, TaskPriority.LOW: 3}
    tasks.sort(key=lambda x: (priority_order.get(x.priority, 3), x.created_at))
    return tasks[skip:skip+limit]

@app.get("/tasks/{task_id}", response_model=Task)
async def get_task(task_id: str):
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail="Task not found")
    return tasks_db[task_id]

@app.post("/tasks/{task_id}/execute", response_model=Task)
async def execute_task(task_id: str, background_tasks: BackgroundTasks):
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail="Task not found")
    task = tasks_db[task_id]
    agent = agents_db.get(task.agent_id)
    if not agent or not agent.is_active:
        raise HTTPException(status_code=400, detail="Agent not available")
    task.status = TaskStatus.IN_PROGRESS
    agent.status = AgentStatus.WORKING

    async def process_task():
        await asyncio.sleep(0.5)
        task.result = {"insights": ["Market conditions favorable", "Consider diversification"], "confidence": 0.85}
        task.status = TaskStatus.COMPLETED
        agent.status = AgentStatus.IDLE
        agent.tasks_completed += 1

    background_tasks.add_task(process_task)
    return task

@app.post("/tasks/{task_id}/cancel", response_model=Task)
async def cancel_task(task_id: str):
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail="Task not found")
    task = tasks_db[task_id]
    if task.status in [TaskStatus.COMPLETED, TaskStatus.FAILED]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel task with status {task.status.value}")
    task.status = TaskStatus.FAILED
    return task

# ============================================================================
# Conversation Endpoints
# ============================================================================

@app.post("/conversations", response_model=Conversation, status_code=201)
async def create_conversation(agent_id: str, user_id: str):
    if agent_id not in agents_db:
        raise HTTPException(status_code=404, detail="Agent not found")
    conversation = Conversation(agent_id=agent_id, user_id=user_id)
    conversations_db[conversation.id] = conversation
    return conversation

@app.get("/conversations/{conversation_id}", response_model=Conversation)
async def get_conversation(conversation_id: str):
    if conversation_id not in conversations_db:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversations_db[conversation_id]

@app.post("/conversations/{conversation_id}/messages", response_model=Message)
async def add_message(conversation_id: str, role: str, content: str):
    if conversation_id not in conversations_db:
        raise HTTPException(status_code=404, detail="Conversation not found")
    conversation = conversations_db[conversation_id]
    message = Message(role=role, content=content)
    conversation.messages.append(message)
    return message

# ============================================================================
# Analysis Endpoints
# ============================================================================

@app.post("/analyze", response_model=AnalysisResult)
async def analyze(request: AnalysisRequest):
    if request.agent_id not in agents_db:
        raise HTTPException(status_code=404, detail="Agent not found")
    agent = agents_db[request.agent_id]
    await asyncio.sleep(0.3)
    result = AnalysisResult(
        agent_id=request.agent_id, request_prompt=request.prompt,
        response=f"Analysis of: {request.prompt}. Market conditions are stable.",
        insights=["Technical indicators show bullish signals", "Volume above average"],
        recommendations=["Consider long positions", "Set stop-loss at 5%"],
        confidence_score=0.82
    )
    analysis_results_db[result.id] = result
    agent.tasks_completed += 1
    return result

@app.get("/analyze", response_model=List[AnalysisResult])
async def list_analysis_results(agent_id: Optional[str] = None, skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100)):
    results = list(analysis_results_db.values())
    if agent_id:
        results = [r for r in results if r.agent_id == agent_id]
    results.sort(key=lambda x: x.created_at, reverse=True)
    return results[skip:skip+limit]

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting AssetMind Agents on port 5003")
    uvicorn.run(app, host="0.0.0.0", port=5003)
