# Kronos - Foundation Model for Financial Markets

**Kronos** is a specialized financial foundation model trained on OHLCV candlestick data from 45+ global exchanges. It treats market movements like GPT treats language.

📄 **Paper:** [arXiv:2508.02739](https://arxiv.org/abs/2508.02739)  
🐙 **GitHub:** [github.com/shiyu-coder/Kronos](https://github.com/shiyu-coder/Kronos)

---

## Why Kronos?

Most forecasting systems treat financial data like generic time-series:

```
Market Data → LSTM/XGBoost/Transformer → Prediction
```

Kronos creates a **"language model for markets"**:

```
OHLCV Data → Financial Tokenizer → Market Tokens → Transformer → Forecasting
```

---

## Model Sizes

| Model | Parameters | Speed | Accuracy | Use Case |
|-------|------------|-------|----------|----------|
| **Kronos-mini** | 4M | Fastest | Basic | Testing, mobile |
| **Kronos-small** | 25M | Fast | Good | Real-time apps |
| **Kronos-base** | 102M | Medium | High | **Production** |
| **Kronos-large** | 499M | Slow | Highest | Research, accuracy-critical |

---

## What Kronos Can Do

### 1. Price Forecasting

Predict future price candles:

```python
POST /forecast
{
  "symbol": "AAPL",
  "candles": [...],  # Historical OHLCV
  "model_size": "base",
  "forecast_steps": 24
}
```

**Output:**
```json
{
  "symbol": "AAPL",
  "price_forecasts": [
    {
      "timestamp": "2026-06-10T00:00:00",
      "close": 195.50,
      "confidence_low": 190.00,
      "confidence_high": 201.00,
      "probability_bullish": 0.65
    }
  ]
}
```

### 2. Volatility Prediction

For options, risk management, position sizing:

```python
POST /forecast/volatility
{
  "symbol": "NVDA",
  "candles": [...],
  "horizon": "daily"
}
```

### 3. Market Regime Detection

Identify market conditions:

```python
POST /regime
{
  "symbol": "BTC",
  "candles": [...]
}
```

**Output:**
```json
{
  "regime": "high_volatility",
  "confidence": 0.85,
  "indicators": {
    "volatility": 0.65,
    "trend_score": 0.12
  }
}
```

### 4. Synthetic Data Generation

Generate realistic market data for backtesting:

```python
POST /synthetic
{
  "symbol": "TSLA",
  "template_candles": [...],
  "num_scenarios": 1000,
  "volatility_scaling": 1.2
}
```

---

## Integration with AssetMind

Kronos is **one signal** in AssetMind's multi-layer architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                    ASSETMIND LAYERS                              │
├─────────────────────────────────────────────────────────────────┤
│  Layer 1: Market Foundation Models                               │
│  ├── Kronos (price forecasting)  ◄── HERE                       │
│  ├── TimeGPT (time series)                                       │
│  ├── PatchTST (transformers)                                     │
│  └── TimesFM (Google)                                            │
├─────────────────────────────────────────────────────────────────┤
│  Layer 2: Alternative Data                                       │
│  ├── News, Social, Filings, Economic Data                      │
├─────────────────────────────────────────────────────────────────┤
│  Layer 3: Asset Twin (5002)                                      │
│  ├── Company, Sector, Competitors, Suppliers                     │
│  └── ← Kronos forecasts feed into Asset Twin                    │
├─────────────────────────────────────────────────────────────────┤
│  Layer 4: Portfolio Twin (5004)                                  │
│  ├── Exposure, Risk, Correlation                                 │
├─────────────────────────────────────────────────────────────────┤
│  Layer 5: Investor Twin (5005)                                   │
│  ├── Behavior, Risk Appetite, Goals                              │
├─────────────────────────────────────────────────────────────────┤
│  Layer 6: Financial Memory (5030)                                │
│  └── ← Predictions stored and learned from                      │
├─────────────────────────────────────────────────────────────────┤
│  Layer 7: Knowledge Graph (5040)                                 │
│  ├── NVIDIA → TSMC → Taiwan → China                             │
│  └── ← Supply chain affects Kronos forecasts                   │
├─────────────────────────────────────────────────────────────────┤
│  Layer 8: Agent Layer (5090)                                    │
│  └── AI agents use all signals including Kronos                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## What Kronos Does NOT See

Kronos only sees OHLCV data. AssetMind combines it with:

| Signal | Kronos | AssetMind |
|--------|--------|-----------|
| News | ❌ | ✅ |
| Earnings | ❌ | ✅ |
| Insider trades | ❌ | ✅ |
| Social sentiment | ❌ | ✅ |
| Macroeconomics | ❌ | ✅ |
| Supply chain | ❌ | ✅ |
| Fund flows | ❌ | ✅ |
| Knowledge graph | ❌ | ✅ |

**AssetMind = Kronos + Everything Else**

---

## Using Kronos in AssetMind

### Quick Start

```bash
# Start Kronos service
cd codebase/assetmind-kronos
pip install -r requirements.txt
python src/__init__.py  # Port 5160

# Health check
curl http://localhost:5160/health

# List models
curl http://localhost:5160/models

# Get explanation
curl http://localhost:5160/explain/NVDA
```

### Example: Full Analysis Pipeline

```python
import httpx

async def analyze_stock(symbol: str, candles: list):
    async with httpx.AsyncClient() as client:
        # 1. Get Kronos forecast
        forecast = await client.post(
            "http://localhost:5160/forecast",
            json={
                "symbol": symbol,
                "candles": candles,
                "model_size": "base",
                "forecast_steps": 24,
                "detect_regime": True
            }
        )

        # 2. Get Knowledge Graph context
        kg = await client.get(
            f"http://localhost:5040/supply-chain/{symbol}"
        )

        # 3. Get scores from scoring engines
        scores = await client.post(
            "http://localhost:5071/scores/batch",
            json={"symbols": [symbol]}
        )

        return {
            "forecast": forecast.json(),
            "knowledge": kg.json(),
            "scores": scores.json()
        }
```

---

## Strategic Position

| Capability | Kronos Alone | AssetMind with Kronos |
|-----------|-------------|----------------------|
| Price prediction | ✅ | ✅ |
| Volatility | ✅ | ✅ |
| Regime detection | ✅ | ✅ |
| News impact | ❌ | ✅ |
| Supply chain | ❌ | ✅ |
| Knowledge graph | ❌ | ✅ |
| Alternative data | ❌ | ✅ |
| Investor behavior | ❌ | ✅ |

---

## Architecture Decision

**We don't build around Kronos. We use Kronos as ONE module.**

The long-term moat is:

1. **Asset Twin + Portfolio Twin + Investor Twin** (entity understanding)
2. **Financial Memory** (learning from predictions)
3. **Knowledge Graph** (relationships)
4. **Alternative Data** (signals Kronos can't see)

Kronos adds price forecasting capability, but the moat is the **intelligence layers built around it**.

---

## Production Recommendations

| Environment | Model Size | Use Case |
|-------------|-----------|----------|
| Development | mini/small | Fast iteration |
| Staging | base | Full accuracy testing |
| Production | base | Recommended default |
| Critical | large | Maximum accuracy |

---

## Quick Reference

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Service health |
| `GET /models` | List available models |
| `POST /forecast` | Price + volatility + regime |
| `POST /forecast/price` | Price only |
| `POST /forecast/volatility` | Volatility only |
| `POST /regime` | Market regime detection |
| `POST /synthetic` | Generate synthetic data |
| `GET /explain/{symbol}` | How Kronos works |

---

*"Kronos treats market movements like GPT treats language."*