"""
Mistake Detection Service
Detects trading mistakes
Port: 5211
"""

from fastapi import FastAPI
from typing import Dict, List, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

app = FastAPI(title="Mistake Detection Service", version="1.0.0")


class MistakeDetectionService:
    """Detects trading mistakes and behavior patterns"""

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.name = "Mistake Detection"
        self.port = 5211

    async def analyze_trades(
        self,
        trades: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Analyze trades for mistakes"""
        mistakes = []

        # Check for revenge trading
        recent_losses = [t for t in trades[-5:] if t.get("pnl", 0) < 0]
        if len(recent_losses) >= 3:
            mistakes.append({
                "type": "REVENGE_TRADING",
                "severity": "HIGH",
                "description": "Multiple losses in a row - emotional trading detected",
            })

        # Check for overtrading
        if len(trades) > 20:
            mistakes.append({
                "type": "OVERTRADING",
                "severity": "MEDIUM",
                "description": f"{len(trades)} trades in period - too frequent",
            })

        return {
            "trades_analyzed": len(trades),
            "mistakes_detected": len(mistakes),
            "mistakes": mistakes,
            "timestamp": datetime.utcnow().isoformat(),
        }


service = MistakeDetectionService()


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "Mistake Detection", "port": 5211}


@app.post("/api/v1/analyze")
async def analyze(request: Dict[str, Any]):
    return await service.analyze_trades(request.get("trades", []))