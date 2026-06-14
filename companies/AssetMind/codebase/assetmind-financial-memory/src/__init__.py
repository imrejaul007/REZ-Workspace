"""
AssetMind - Financial Memory Graph
Port: 5031

The Market Memory - Stores EVERYTHING about markets.

Unlike traditional memory, this stores:
- All predictions made
- All outcomes recorded
- All research published
- All events that occurred
- All agent decisions
- All portfolio changes
- All market regimes
- All learnings

Over time, AssetMind becomes smarter because it remembers.

Version: 1.0.0
Date: June 9, 2026
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from enum import Enum
import uuid


app = FastAPI(title="AssetMind Financial Memory Graph", version="1.0.0")


class MemoryType(str, Enum):
    PREDICTION = "prediction"
    OUTCOME = "outcome"
    RESEARCH = "research"
    EVENT = "event"
    DECISION = "decision"
    REGIME = "regime"
    LEARNING = "learning"
    INSIGHT = "insight"


class Memory(BaseModel):
    memory_id: str
    memory_type: MemoryType
    content: str
    entities: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    confidence: float = 1.0
    source: str = "system"
    created_at: datetime
    proven: bool = False
    times_proven: int = 0


MEMORIES: List[Memory] = []
MEMORY_INDEX: Dict[str, List[int]] = {}  # tag -> indices


@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-financial-memory",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5031,
        "memories": len(MEMORIES)
    }


@app.post("/remember", status_code=201)
async def remember(memory: Memory):
    MEMORIES.append(memory)
    for tag in memory.tags:
        if tag not in MEMORY_INDEX:
            MEMORY_INDEX[tag] = []
        MEMORY_INDEX[tag].append(len(MEMORIES) - 1)
    return {"memory_id": memory.memory_id, "stored": True}


@app.get("/recall")
async def recall(query: str, memory_type: Optional[MemoryType] = None):
    results = []
    query_lower = query.lower()
    for m in MEMORIES:
        if query_lower in m.content.lower():
            if memory_type is None or m.memory_type == memory_type:
                results.append(m)
    return {"results": results, "total": len(results)}


@app.get("/prove/{memory_id}")
async def prove_memory(memory_id: str, outcome: str):
    for m in MEMORIES:
        if m.memory_id == memory_id:
            m.proven = True
            m.times_proven += 1
            return {"proven": True, "times_proven": m.times_proven}
    raise HTTPException(status_code=404, detail="Memory not found")


@app.get("/learnings")
async def get_learnings(min_proven: int = 3):
    return {
        "learnings": [m for m in MEMORIES if m.memory_type == MemoryType.LEARNING and m.times_proven >= min_proven]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5031)