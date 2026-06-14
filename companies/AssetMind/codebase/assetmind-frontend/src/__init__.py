"""
AssetMind Frontend Dashboard
Next.js web application for portfolio management and AI insights.
Port: 3000 (for local dev), served via nginx in production
"""

import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from typing import Dict, Any
import os


app = FastAPI(title="AssetMind Frontend", version="1.0.0")

# Serve static files in production
STATIC_PATH = os.path.join(os.path.dirname(__file__), "..", "public")
if os.path.exists(STATIC_PATH):
    app.mount("/static", StaticFiles(directory=STATIC_PATH), name="static")


@app.get("/")
async def root():
    """Serve the main dashboard."""
    return HTMLResponse(content="""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AssetMind - Financial Intelligence Platform</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0f;
            color: #fff;
        }
        .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
        header {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            padding: 30px 0;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .logo { font-size: 28px; font-weight: bold; color: #00d4ff; }
        .tagline { color: #888; margin-top: 5px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 30px; }
        .card {
            background: rgba(255,255,255,0.05);
            border-radius: 16px;
            padding: 25px;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .card h3 { color: #00d4ff; margin-bottom: 15px; }
        .metric { font-size: 36px; font-weight: bold; color: #fff; }
        .metric-label { color: #888; font-size: 14px; margin-top: 5px; }
        .positive { color: #00ff88; }
        .negative { color: #ff4757; }
        .btn {
            background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
            color: #000;
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            margin-top: 20px;
        }
        .nav { display: flex; gap: 30px; margin-top: 20px; }
        .nav a { color: #888; text-decoration: none; transition: color 0.3s; }
        .nav a:hover { color: #00d4ff; }
        .hero { text-align: center; padding: 60px 20px; }
        .hero h1 { font-size: 48px; margin-bottom: 20px; background: linear-gradient(135deg, #00d4ff, #00ff88); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .hero p { color: #888; font-size: 18px; max-width: 600px; margin: 0 auto; }
    </style>
</head>
<body>
    <header>
        <div class="container">
            <div class="logo">AssetMind</div>
            <div class="tagline">Financial Intelligence Platform</div>
            <nav class="nav">
                <a href="/">Dashboard</a>
                <a href="/api/portfolio">Portfolio</a>
                <a href="/api/market">Market</a>
                <a href="/api/ai">AI Insights</a>
            </nav>
        </div>
    </header>

    <main class="container">
        <div class="hero">
            <h1>The Trader Who Never Sleeps</h1>
            <p>AI-powered financial intelligence with digital twins, prediction networks, and autonomous decision-making.</p>
            <button class="btn" onclick="window.location.href='/api/docs'">Launch Platform</button>
        </div>

        <div class="grid">
            <div class="card">
                <h3>Portfolio Value</h3>
                <div class="metric">₹1,25,45,000</div>
                <div class="metric-label positive">+12.5% this month</div>
            </div>
            <div class="card">
                <h3>Today's P&L</h3>
                <div class="metric positive">+₹15,200</div>
                <div class="metric-label">1.2% gain</div>
            </div>
            <div class="card">
                <h3>AI Confidence</h3>
                <div class="metric">87%</div>
                <div class="metric-label">Twin prediction accuracy</div>
            </div>
            <div class="card">
                <h3>Active Twins</h3>
                <div class="metric">12</div>
                <div class="metric-label">Digital twins monitoring</div>
            </div>
        </div>
    </main>

    <script>
        // Load real data from APIs
        fetch('/api/status')
            .then(r => r.json())
            .then(data => console.log('AssetMind connected:', data));
    </script>
</body>
</html>
""")


@app.get("/api/status")
async def api_status():
    """API status endpoint."""
    return {
        "status": "operational",
        "version": "1.0.0",
        "services": {
            "twin_hub": "operational",
            "copilot": "operational",
            "intelligence": "operational"
        }
    }


@app.get("/api/portfolio")
async def api_portfolio():
    """Portfolio API endpoint."""
    return {
        "total_value": 12545000,
        "cash": 250000,
        "invested": 12295000,
        "day_change": 15200,
        "day_change_pct": 1.2,
        "positions": [
            {"symbol": "RELIANCE", "shares": 100, "value": 3500000, "pnl": 125000},
            {"symbol": "TCS", "shares": 50, "value": 2200000, "pnl": 85000},
            {"symbol": "HDFCBANK", "shares": 75, "value": 2800000, "pnl": -45000},
        ]
    }


@app.get("/api/market")
async def api_market():
    """Market data API."""
    return {
        "nifty": {"value": 22500, "change": 1.5},
        "bank_nifty": {"value": 48000, "change": 2.1},
        "sensex": {"value": 74500, "change": 1.3}
    }


@app.get("/api/ai")
async def api_ai():
    """AI insights API."""
    return {
        "insights": [
            {"type": "bullish", "confidence": 78, "message": "Nifty showing strong momentum"},
            {"type": "rebalance", "confidence": 65, "message": "Consider reducing bank exposure"},
            {"type": "alert", "confidence": 90, "message": "RBI policy meeting next week"}
        ]
    }


@app.get("/api/docs")
async def api_docs():
    """API documentation."""
    return JSONResponse(content={
        "title": "AssetMind API",
        "version": "1.0.0",
        "endpoints": [
            {"path": "/api/status", "method": "GET", "description": "Platform status"},
            {"path": "/api/portfolio", "method": "GET", "description": "Portfolio data"},
            {"path": "/api/market", "method": "GET", "description": "Market data"},
            {"path": "/api/ai", "method": "GET", "description": "AI insights"}
        ]
    })


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3000)
