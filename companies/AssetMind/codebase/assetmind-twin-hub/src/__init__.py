"""
AssetMind - Twin Hub
Port: 5250

Central orchestration for all digital twins.

Connects:
- Decision Twin Engine (5250)
- Reaction Engine (5255)
- Competitor Twin (5258)
- Analyst Twin (5260)
- Asset Twin (5002)
- Portfolio Twin (5004)
- Investor Twin (5005)
- Economic Twin (5041)

Version: 1.0.0
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from datetime import datetime
import httpx
import asyncio
import os

app = FastAPI(title="AssetMind Twin Hub")

# ============================================================================
# MODELS
# ============================================================================

class TwinReference(BaseModel):
    name: str
    port: int
    url: str
    status: str = "unknown"
    last_call: Optional[str] = None

class TwinResult(BaseModel):
    twin: str
    port: int
    status: str
    result: Dict[str, Any]
    latency_ms: float

class TwinHubRequest(BaseModel):
    event_type: str
    event_description: str
    entity: str
    twins: Optional[List[str]] = None  # If None, use all twins

class TwinHubResponse(BaseModel):
    request_id: str
    event: str
    timestamp: str
    twins_called: int
    results: List[TwinResult]
    aggregated_prediction: Dict[str, Any]
    confidence: float

# ============================================================================
# TWIN REGISTRY
# ============================================================================

TWINS = {
    "decision": TwinReference(name="Decision Twin", port=5250, url=os.getenv("SVC_DECISION", "http://localhost:5250")),
    "reaction": TwinReference(name="Reaction Engine", port=5255, url=os.getenv("SVC_REACTION", "http://localhost:5255")),
    "competitor": TwinReference(name="Competitor Twin", port=5258, url=os.getenv("SVC_COMPETITOR", "http://localhost:5258")),
    "analyst": TwinReference(name="Analyst Twin", port=5260, url=os.getenv("SVC_ANALYST", "http://localhost:5260")),
    "asset": TwinReference(name="Asset Twin", port=5002, url=os.getenv("SVC_ASSET", "http://localhost:5002")),
    "portfolio": TwinReference(name="Portfolio Twin", port=5004, url=os.getenv("SVC_PORTFOLIO", "http://localhost:5004")),
    "investor": TwinReference(name="Investor Twin", port=5005, url=os.getenv("SVC_INVESTOR", "http://localhost:5005")),
    "economic": TwinReference(name="Economic Twin", port=5041, url=os.getenv("SVC_ECONOMIC", "http://localhost:5041")),
}

# ============================================================================
# TWIN CONNECTIONS
# ============================================================================

async def call_twin(twin_name: str, twin: TwinReference, payload: Dict) -> TwinResult:
    """Call a twin and return result"""
    start = datetime.utcnow()

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(
                f"{twin.url}/predict",
                json=payload
            )
            latency = (datetime.utcnow() - start).total_seconds() * 1000

            return TwinResult(
                twin=twin.name,
                port=twin.port,
                status="success",
                result=response.json(),
                latency_ms=latency
            )
    except Exception as e:
        latency = (datetime.utcnow() - start).total_seconds() * 1000
        return TwinResult(
            twin=twin.name,
            port=twin.port,
            status="error",
            result={"error": str(e)},
            latency_ms=latency
        )

def aggregate_predictions(results: List[TwinResult]) -> Dict[str, Any]:
    """Aggregate predictions from all twins"""

    sentiments = []
    confidences = []

    for result in results:
        if result.status == "success":
            if "overall_sentiment" in result.result:
                sentiments.append(result.result["overall_sentiment"])
            if "confidence" in result.result:
                confidences.append(result.result["confidence"])

    avg_sentiment = sum(sentiments) / len(sentiments) if sentiments else 0
    avg_confidence = sum(confidences) / len(confidences) if confidences else 0

    if avg_sentiment > 0.3:
        prediction = "POSITIVE"
    elif avg_sentiment < -0.3:
        prediction = "NEGATIVE"
    else:
        prediction = "NEUTRAL"

    return {
        "prediction": prediction,
        "avg_sentiment": round(avg_sentiment, 2),
        "avg_confidence": round(avg_confidence, 2),
        "twins_agreed": len([s for s in sentiments if (s > 0 and avg_sentiment > 0) or (s < 0 and avg_sentiment < 0)])
    }

# ============================================================================
# ROUTES
# ============================================================================

@app.get("/health")
async def health():
    """Health check with twin status"""
    return {
        "service": "twin-hub",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5250,
        "connected_twins": len(TWINS),
        "twins": {name: {"port": t.port, "status": t.status} for name, t in TWINS.items()}
    }

@app.get("/twins")
async def list_twins():
    """List all connected twins"""
    return {
        "twins": [
            {
                "name": name,
                "port": twin.port,
                "url": twin.url,
                "status": twin.status
            }
            for name, twin in TWINS.items()
        ]
    }

@app.post("/predict", response_model=TwinHubResponse)
async def predict_with_all_twins(request: TwinHubRequest) -> TwinHubResponse:
    """
    Call all twins with the given event and aggregate predictions.
    """

    # Select twins
    target_twins = {
        name: twin
        for name, twin in TWINS.items()
        if request.twins is None or name in request.twins
    }

    # Build payload
    payload = {
        "event_type": request.event_type,
        "event_description": request.event_description,
        "entity": request.entity
    }

    # Call all twins in parallel
    tasks = [
        call_twin(name, twin, payload)
        for name, twin in target_twins.items()
    ]
    results = await asyncio.gather(*tasks)

    # Aggregate
    aggregated = aggregate_predictions(results)

    return TwinHubResponse(
        request_id=f"req-{datetime.utcnow().timestamp()}",
        event=request.event_description,
        timestamp=datetime.utcnow().isoformat(),
        twins_called=len(results),
        results=results,
        aggregated_prediction=aggregated,
        confidence=aggregated["avg_confidence"]
    )

@app.get("/twin/{twin_name}")
async def get_twin_status(twin_name: str):
    """Get status of a specific twin"""
    if twin_name not in TWINS:
        raise HTTPException(status_code=404, detail="Twin not found")

    twin = TWINS[twin_name]

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{twin.url}/health")
            return {
                "name": twin.name,
                "port": twin.port,
                "status": "healthy",
                "response": response.json()
            }
    except Exception as e:
        return {
            "name": twin.name,
            "port": twin.port,
            "status": "error",
            "error": str(e)
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5250)
