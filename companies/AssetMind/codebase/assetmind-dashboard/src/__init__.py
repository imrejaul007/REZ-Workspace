"""
AssetMind - Dashboard
Port: 3000

Professional portfolio dashboard with AI insights.

Features:
- Portfolio overview
- AI recommendations
- Market data
- Alerts

Version: 1.0.0
Date: June 9, 2026
"""

from fastapi import FastAPI, Request, WebSocket
from fastapi.responses import HTMLResponse
from fastapi.websockets import WebSocket
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import asyncio


app = FastAPI(title="AssetMind Dashboard", version="1.0.0")


# =============================================================================
# HTML DASHBOARD
# =============================================================================

DASHBOARD_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AssetMind Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0f;
            color: #fff;
            min-height: 100vh;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }

        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 0;
            border-bottom: 1px solid #1a1a2e;
            margin-bottom: 30px;
        }

        .logo {
            font-size: 24px;
            font-weight: 700;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .nav {
            display: flex;
            gap: 20px;
        }

        .nav a {
            color: #8b8b9a;
            text-decoration: none;
            padding: 8px 16px;
            border-radius: 8px;
            transition: all 0.3s;
        }

        .nav a:hover, .nav a.active {
            color: #fff;
            background: #1a1a2e;
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .card {
            background: #12121a;
            border: 1px solid #1a1a2e;
            border-radius: 16px;
            padding: 24px;
        }

        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }

        .card-title {
            font-size: 14px;
            color: #8b8b9a;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .metric {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
        }

        .positive {
            color: #10b981;
        }

        .negative {
            color: #ef4444;
        }

        .neutral {
            color: #8b8b9a;
        }

        .change {
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .symbol {
            font-weight: 600;
            margin-bottom: 4px;
        }

        .price {
            font-size: 18px;
            color: #fff;
        }

        .table {
            width: 100%;
            border-collapse: collapse;
        }

        .table th, .table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #1a1a2e;
        }

        .table th {
            color: #8b8b9a;
            font-size: 12px;
            text-transform: uppercase;
        }

        .badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }

        .badge-buy {
            background: rgba(16, 185, 129, 0.2);
            color: #10b981;
        }

        .badge-hold {
            background: rgba(139, 139, 154, 0.2);
            color: #8b8b9a;
        }

        .badge-sell {
            background: rgba(239, 68, 68, 0.2);
            color: #ef4444;
        }

        .ai-section {
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
            border: 1px solid rgba(102, 126, 234, 0.3);
        }

        .ai-insight {
            padding: 16px;
            background: #0a0a0f;
            border-radius: 12px;
            margin-bottom: 12px;
        }

        .ai-title {
            font-weight: 600;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .ai-badge {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 10px;
        }

        .insight-text {
            color: #8b8b9a;
            font-size: 14px;
            line-height: 1.6;
        }

        .action-btn {
            background: #667eea;
            color: #fff;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s;
        }

        .action-btn:hover {
            background: #7c8ff;
            transform: translateY(-2px);
        }

        .websocket-status {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
        }

        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #ef4444;
        }

        .status-dot.connected {
            background: #10b981;
        }

        @media (max-width: 768px) {
            .nav {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div class="logo">AssetMind</div>
            <nav class="nav">
                <a href="#" class="active">Dashboard</a>
                <a href="#">Portfolio</a>
                <a href="#">Research</a>
                <a href="#">AI Copilot</a>
            </nav>
            <div class="websocket-status">
                <div class="status-dot" id="ws-status"></div>
                <span id="ws-text">Connecting...</span>
            </div>
        </header>

        <div class="grid">
            <div class="card">
                <div class="card-title">Portfolio Value</div>
                <div class="metric">$125,450</div>
                <div class="change positive">+$2,340 (1.9%)</div>
            </div>
            <div class="card">
                <div class="card-title">Today's Change</div>
                <div class="metric positive">+$1,850</div>
                <div class="change positive">+1.5%</div>
            </div>
            <div class="card">
                <div class="card-title">AI Confidence</div>
                <div class="metric">82%</div>
                <div class="change neutral">Based on 10 indicators</div>
            </div>
            <div class="card">
                <div class="card-title">Open Alerts</div>
                <div class="metric">5</div>
                <div class="change neutral">2 critical, 3 medium</div>
            </div>
        </div>

        <div class="grid">
            <div class="card" style="grid-column: span 2;">
                <div class="card-header">
                    <div class="card-title">AI Recommendations</div>
                    <button class="action-btn" onclick="getAIRecommendations()">Refresh</button>
                </div>
                <div id="ai-insights">
                    <div class="ai-insight">
                        <div class="ai-title">
                            <span class="ai-badge">AI</span>
                            NVDA Analysis
                        </div>
                        <div class="insight-text">
                            <strong>Decision: BUY</strong><br>
                            Confidence: 82%<br>
                            Target: $1,050 (14% upside)<br>
                            Risk: Moderate volatility
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-title">Top Holdings</div>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Symbol</th>
                            <th>Price</th>
                            <th>Change</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="symbol">NVDA</td>
                            <td>$920.50</td>
                            <td class="positive">+2.3%</td>
                            <td><span class="badge badge-buy">BUY</span></td>
                        </tr>
                        <tr>
                            <td class="symbol">AAPL</td>
                            <td>$185.20</td>
                            <td class="positive">+0.8%</td>
                            <td><span class="badge badge-hold">HOLD</span></td>
                        </tr>
                        <tr>
                            <td class="symbol">MSFT</td>
                            <td>$420.30</td>
                            <td class="positive">+1.2%</td>
                            <td><span class="badge badge-buy">BUY</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <script>
        // WebSocket connection
        let ws = null;

        function connectWebSocket() {
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            ws = new WebSocket(`${wsProtocol}//${window.location.host}/ws`);

            ws.onopen = () => {
                document.getElementById('ws-status').classList.add('connected');
                document.getElementById('ws-text').textContent = 'Live';

                // Subscribe to alerts
                ws.send(JSON.stringify({ type: 'subscribe_alerts' }));
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log('WS:', data);
            };

            ws.onclose = () => {
                document.getElementById('ws-status').classList.remove('connected');
                document.getElementById('ws-text').textContent = 'Reconnecting...';
                setTimeout(connectWebSocket, 3000);
            };
        }

        connectWebSocket();

        // Get AI recommendations
        async function getAIRecommendations() {
            try {
                const response = await fetch('/api/recommendations');
                const data = await response.json();
                document.getElementById('ai-insights').innerHTML = data.html;
            } catch (error) {
                console.error('Error:', error);
            }
        }
    </script>
</body>
</html>
"""


# =============================================================================
# MODELS
# =============================================================================

class Portfolio(BaseModel):
    total_value: float
    day_change: float
    day_change_percent: float
    positions: List[Dict] = Field(default_factory=list)


class Recommendation(BaseModel):
    symbol: str
    action: str
    confidence: float
    target_price: Optional[float] = None
    reasoning: str = ""


# =============================================================================
# ENDPOINTS
# =============================================================================

@app.get("/")
async def dashboard():
    """Serve the dashboard HTML"""
    return HTMLResponse(content=DASHBOARD_HTML)


@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-dashboard",
        "status": "healthy",
        "version": "1.0.0",
        "port": 3000
    }


@app.get("/api/portfolio")
async def get_portfolio():
    """Get portfolio data"""
    return Portfolio(
        total_value=125450.0,
        day_change=2340.0,
        day_change_percent=1.9,
        positions=[
            {
                "symbol": "NVDA",
                "shares": 50,
                "price": 920.50,
                "value": 46025.0,
                "change": 2.3
            },
            {
                "symbol": "AAPL",
                "shares": 100,
                "price": 185.20,
                "value": 18520.0,
                "change": 0.8
            },
            {
                "symbol": "MSFT",
                "shares": 30,
                "price": 420.30,
                "value": 12609.0,
                "change": 1.2
            }
        ]
    )


@app.get("/api/recommendations")
async def get_recommendations():
    """Get AI recommendations"""
    return {
        "recommendations": [
            {
                "symbol": "NVDA",
                "action": "BUY",
                "confidence": 82,
                "target": 1050,
                "upside": 14,
                "risk": "Moderate"
            },
            {
                "symbol": "MSFT",
                "action": "HOLD",
                "confidence": 75,
                "target": 450,
                "upside": 7,
                "risk": "Low"
            }
        ],
        "insights": [
            "Tech sector momentum continues",
            "Consider taking profits in NVDA at $1,000"
        ],
        "alerts": [
            {"priority": "critical", "message": "NVDA earnings in 3 days"}
        ]
    }


@app.get("/api/prices")
async def get_prices():
    """Get current prices"""
    return {
        "prices": {
            "NVDA": {"price": 920.50, "change": 2.3},
            "AAPL": {"price": 185.20, "change": 0.8},
            "MSFT": {"price": 420.30, "change": 1.2}
        },
        "timestamp": datetime.utcnow().isoformat()
    }


# WebSocket for live updates
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket for live dashboard updates"""
    await websocket.accept()

    try:
        while True:
            data = await websocket.receive_text()

            if data == "ping":
                await websocket.send_json({"type": "pong"})
            elif data == "subscribe_prices":
                # Send current prices
                await websocket.send_json({
                    "type": "prices",
                    "data": {
                        "NVDA": 920.50,
                        "AAPL": 185.20,
                        "MSFT": 420.30
                    }
                })

    except Exception:
        pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)