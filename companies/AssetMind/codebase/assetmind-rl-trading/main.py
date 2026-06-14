"""
AssetMind RL Trading Service
Reinforcement Learning-based trading system
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime
from enum import Enum
import uuid
import numpy as np
import asyncio

app = FastAPI(
    title="AssetMind RL Trading",
    description="Reinforcement Learning-based trading system",
    version="1.0.0"
)


# Enums
class AgentType(str, Enum):
    DQN = "dqn"
    PPO = "ppo"
    A2C = "a2c"
    SAC = "sac"
    TD3 = "td3"


class ActionType(str, Enum):
    HOLD = 0
    BUY = 1
    SELL = 2
    CLOSE = 3


class TrainingStatus(str, Enum):
    PENDING = "pending"
    TRAINING = "training"
    EVALUATING = "evaluating"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"


class EnvironmentType(str, Enum):
    CONTINUOUS = "continuous"
    DISCRETE = "discrete"


class MarketRegime(str, Enum):
    BULL = "bull"
    BEAR = "bear"
    SIDEWAYS = "sideways"
    VOLATILE = "volatile"


# Pydantic Models
class MarketState(BaseModel):
    """Market state observation for RL agent."""
    symbol: str
    prices: List[float]  # Historical prices
    volumes: List[float]  # Historical volumes
    indicators: Dict[str, float]  # Technical indicators
    portfolio_value: float
    position_size: float
    current_price: float
    timestamp: datetime


class TrainingConfig(BaseModel):
    """RL training configuration."""
    agent_type: AgentType
    environment_type: EnvironmentType
    symbol: str
    initial_balance: float = Field(default=100000, gt=0)
    episode_length: int = Field(default=252, ge=10)  # Trading days
    total_episodes: int = Field(default=1000, ge=10)
    batch_size: int = Field(default=64, ge=8)
    learning_rate: float = Field(default=0.001, gt=0)
    gamma: float = Field(default=0.99, ge=0, le=1)  # Discount factor
    epsilon_start: float = Field(default=1.0, ge=0, le=1)
    epsilon_end: float = Field(default=0.01, ge=0, le=1)
    epsilon_decay: float = Field(default=0.995, ge=0, le=1)
    target_update_freq: int = Field(default=100, ge=1)
    replay_buffer_size: int = Field(default=100000, ge=100)
    reward_scaling: float = Field(default=1.0, gt=0)
    save_freq: int = Field(default=50, ge=1)
    eval_freq: int = Field(default=25, ge=1)


class AgentConfig(BaseModel):
    """Agent architecture configuration."""
    state_dim: int = Field(default=50, ge=1)
    action_dim: int = Field(default=3, ge=2)
    hidden_layers: List[int] = Field(default=[256, 256, 128])
    activation: str = Field(default="relu")
    optimizer: str = Field(default="adam")
    layer_norm: bool = Field(default=True)
    dropout: float = Field(default=0.1, ge=0, le=0.5)
    dueling_network: bool = Field(default=True)
    noisy_networks: bool = Field(default=False)


class TrainingMetrics(BaseModel):
    """Training progress metrics."""
    episode: int
    total_episodes: int
    episode_reward: float
    avg_reward: float
    best_reward: float
    epsilon: float
    loss: float
    portfolio_value: float
    sharpe_ratio: float
    max_drawdown: float
    win_rate: float
    timestamp: datetime


class TrainingJob(BaseModel):
    """Training job status."""
    job_id: str
    status: TrainingStatus
    config: TrainingConfig
    agent_config: AgentConfig
    current_episode: int
    total_episodes: int
    metrics: List[TrainingMetrics]
    best_model_path: Optional[str]
    started_at: datetime
    completed_at: Optional[datetime] = None
    error: Optional[str] = None


class InferenceRequest(BaseModel):
    """Request for RL inference."""
    symbol: str
    state: MarketState
    deterministic: bool = Field(default=False)


class InferenceResponse(BaseModel):
    """RL agent inference response."""
    action: ActionType
    confidence: float
    q_values: Dict[str, float]
    recommended_size: float
    risk_score: float
    timestamp: datetime


class BacktestResult(BaseModel):
    """RL strategy backtest result."""
    job_id: str
    agent_type: AgentType
    total_return: float
    sharpe_ratio: float
    max_drawdown: float
    win_rate: float
    total_trades: int
    avg_trade_duration: float
    profit_factor: float
    sortino_ratio: float
    calmar_ratio: float
    equity_curve: List[Dict[str, Any]]


class PortfolioAllocation(BaseModel):
    """Portfolio allocation from RL agent."""
    allocations: Dict[str, float]  # Symbol -> weight
    confidence: float
    rebalance_needed: bool
    risk_metrics: Dict[str, float]


# In-memory storage
training_jobs: Dict[str, TrainingJob] = {}
agent_models: Dict[str, Dict[str, Any]] = {}


def calculate_reward(action: int, prev_value: float, curr_value: float,
                     position: float, price_change: float) -> float:
    """Calculate reward for RL agent."""
    returns = (curr_value - prev_value) / prev_value if prev_value > 0 else 0
    position_reward = position * price_change
    action_penalty = 0.001 if action != ActionType.HOLD else 0

    return (returns * 100) + position_reward - action_penalty


def extract_features(state: MarketState) -> np.ndarray:
    """Extract features from market state for RL agent."""
    features = []

    # Price features
    if len(state.prices) >= 20:
        returns = np.diff(state.prices) / state.prices[:-1]
        features.extend([
            state.prices[-1] / state.prices[-5] - 1,  # 5-day return
            state.prices[-1] / state.prices[-20] - 1,  # 20-day return
            np.std(returns[-20:]),  # Volatility
            np.mean(returns[-20:]),  # Mean return
        ])
    else:
        features.extend([0, 0, 0, 0])

    # Volume features
    if len(state.volumes) >= 20:
        features.extend([
            state.volumes[-1] / np.mean(state.volumes[-20:]) - 1,
            np.std(state.volumes[-20:]) / np.mean(state.volumes[-20:]),
        ])
    else:
        features.extend([0, 0])

    # Technical indicators
    features.extend([
        state.indicators.get("rsi", 50) / 100 - 0.5,
        state.indicators.get("macd", 0) / state.prices[-1] if state.prices else 0,
        state.indicators.get("bb_position", 0.5),
        state.indicators.get("volume_ratio", 1) - 1,
    ])

    # Portfolio features
    features.extend([
        state.position_size / 100,  # Normalized position
        (state.portfolio_value - 100000) / 100000,  # Normalized PnL
    ])

    # Pad to fixed size
    while len(features) < 50:
        features.append(0)

    return np.array(features[:50])


def select_action(q_values: np.ndarray, epsilon: float, deterministic: bool = False) -> Tuple[int, float]:
    """Select action using epsilon-greedy policy."""
    if deterministic or np.random.random() > epsilon:
        action = np.argmax(q_values)
    else:
        action = np.random.randint(len(q_values))

    confidence = float(q_values[action] / np.sum(q_values)) if np.sum(q_values) > 0 else 0.33
    return action, confidence


# Routes
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "assetmind-rl-trading",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "active_jobs": len([j for j in training_jobs.values() if j.status == TrainingStatus.TRAINING]),
        "trained_agents": len(agent_models)
    }


@app.post("/train", response_model=TrainingJob, status_code=201)
async def start_training(config: TrainingConfig, agent_config: AgentConfig,
                         background_tasks: BackgroundTasks):
    """Start RL agent training job."""
    job_id = str(uuid.uuid4())

    job = TrainingJob(
        job_id=job_id,
        status=TrainingStatus.PENDING,
        config=config,
        agent_config=agent_config,
        current_episode=0,
        total_episodes=config.total_episodes,
        metrics=[],
        best_model_path=None,
        started_at=datetime.now()
    )

    training_jobs[job_id] = job

    async def run_training():
        try:
            job.status = TrainingStatus.TRAINING
            epsilon = config.epsilon_start

            for episode in range(config.total_episodes):
                job.current_episode = episode + 1

                # Simulate episode
                await asyncio.sleep(0.01)

                episode_reward = np.random.uniform(-500, 2000)
                portfolio_value = config.initial_balance * (1 + np.random.uniform(-0.1, 0.2))

                metrics = TrainingMetrics(
                    episode=episode + 1,
                    total_episodes=config.total_episodes,
                    episode_reward=episode_reward,
                    avg_reward=episode_reward * 0.9 + 500,
                    best_reward=max(episode_reward, 1500),
                    epsilon=epsilon,
                    loss=np.random.uniform(0.01, 0.5),
                    portfolio_value=portfolio_value,
                    sharpe_ratio=np.random.uniform(0.5, 2.5),
                    max_drawdown=np.random.uniform(5, 20),
                    win_rate=np.random.uniform(0.3, 0.7),
                    timestamp=datetime.now()
                )

                job.metrics.append(metrics)
                epsilon *= config.epsilon_decay

                # Evaluate periodically
                if (episode + 1) % config.eval_freq == 0:
                    job.status = TrainingStatus.EVALUATING
                    await asyncio.sleep(0.1)
                    job.status = TrainingStatus.TRAINING

            job.status = TrainingStatus.COMPLETED
            job.completed_at = datetime.now()
            job.best_model_path = f"models/{job_id}/best.pt"

        except Exception as e:
            job.status = TrainingStatus.FAILED
            job.error = str(e)

    background_tasks.add_task(run_training)
    return job


@app.get("/train/{job_id}", response_model=TrainingJob)
async def get_training_job(job_id: str):
    """Get training job status."""
    if job_id not in training_jobs:
        raise HTTPException(status_code=404, detail="Training job not found")
    return training_jobs[job_id]


@app.post("/train/{job_id}/pause")
async def pause_training(job_id: str):
    """Pause training job."""
    if job_id not in training_jobs:
        raise HTTPException(status_code=404, detail="Training job not found")

    job = training_jobs[job_id]
    if job.status != TrainingStatus.TRAINING:
        raise HTTPException(status_code=400, detail="Job is not training")

    job.status = TrainingStatus.PAUSED
    return {"status": "paused"}


@app.post("/train/{job_id}/resume")
async def resume_training(job_id: str):
    """Resume paused training job."""
    if job_id not in training_jobs:
        raise HTTPException(status_code=404, detail="Training job not found")

    job = training_jobs[job_id]
    if job.status != TrainingStatus.PAUSED:
        raise HTTPException(status_code=400, detail="Job is not paused")

    job.status = TrainingStatus.TRAINING
    return {"status": "resumed"}


@app.post("/train/{job_id}/stop")
async def stop_training(job_id: str):
    """Stop training job."""
    if job_id not in training_jobs:
        raise HTTPException(status_code=404, detail="Training job not found")

    job = training_jobs[job_id]
    job.status = TrainingStatus.COMPLETED
    job.completed_at = datetime.now()

    return {"status": "stopped"}


@app.post("/infer", response_model=InferenceResponse)
async def inference(request: InferenceRequest):
    """Run RL agent inference on market state."""
    features = extract_features(request.state)

    # Simulate Q-values based on features
    q_values = np.random.randn(4)  # 4 actions: hold, buy, sell, close
    q_values[0] += 0.5  # Bias towards hold

    action_idx, confidence = select_action(q_values, epsilon=0.0, deterministic=True)
    action = ActionType(action_idx)

    # Calculate recommended size and risk score
    portfolio_momentum = request.state.portfolio_value / 100000 - 1
    recommended_size = min(max(portfolio_momentum * 100, 0), 100)
    risk_score = abs(features[0]) + abs(features[1]) if len(features) >= 2 else 0.5

    return InferenceResponse(
        action=action,
        confidence=confidence,
        q_values={
            "hold": float(q_values[0]),
            "buy": float(q_values[1]),
            "sell": float(q_values[2]),
            "close": float(q_values[3])
        },
        recommended_size=recommended_size,
        risk_score=min(risk_score, 1.0),
        timestamp=datetime.now()
    )


@app.post("/backtest", response_model=BacktestResult, status_code=201)
async def backtest_agent(agent_type: AgentType, symbol: str, start_date: str, end_date: str,
                        initial_balance: float = 100000):
    """Backtest trained RL agent."""
    job_id = str(uuid.uuid4())

    # Generate mock backtest results
    total_return = np.random.uniform(-20, 50)
    equity_curve = [
        {"timestamp": f"2024-01-{i+1:02d}", "value": initial_balance * (1 + total_return/100 * i/100)}
        for i in range(100)
    ]

    return BacktestResult(
        job_id=job_id,
        agent_type=agent_type,
        total_return=total_return,
        sharpe_ratio=np.random.uniform(0.5, 2.5),
        max_drawdown=np.random.uniform(5, 25),
        win_rate=np.random.uniform(0.35, 0.65),
        total_trades=np.random.randint(50, 200),
        avg_trade_duration=np.random.uniform(1, 10),
        profit_factor=np.random.uniform(1, 3),
        sortino_ratio=np.random.uniform(0.5, 3),
        calmar_ratio=np.random.uniform(0.5, 2),
        equity_curve=equity_curve
    )


@app.get("/models")
async def list_models():
    """List available trained models."""
    return {
        "models": [
            {
                "model_id": model_id,
                "type": config.get("type", "unknown"),
                "trained_at": config.get("trained_at"),
                "performance": config.get("performance", {})
            }
            for model_id, config in agent_models.items()
        ]
    }


@app.post("/portfolio/allocate", response_model=PortfolioAllocation)
async def allocate_portfolio(symbols: List[str], total_value: float = 100000,
                             risk_tolerance: float = 0.5):
    """Get portfolio allocation from RL agent."""
    # Simulate RL-based allocation
    allocations = {}
    for symbol in symbols:
        allocations[symbol] = np.random.uniform(0.05, 0.3)

    # Normalize to sum to 1
    total = sum(allocations.values())
    allocations = {k: v/total for k, v in allocations.items()}

    return PortfolioAllocation(
        allocations=allocations,
        confidence=np.random.uniform(0.6, 0.95),
        rebalance_needed=np.random.random() > 0.5,
        risk_metrics={
            "expected_return": np.random.uniform(0.05, 0.15),
            "volatility": np.random.uniform(0.1, 0.3),
            "sharpe_ratio": np.random.uniform(0.5, 2.0),
            "max_drawdown": np.random.uniform(0.1, 0.3)
        }
    )


@app.get("/environments")
async def list_environments():
    """List available RL environments."""
    return {
        "environments": [
            {
                "name": "TradingEnv-v0",
                "type": "discrete",
                "actions": 4,
                "description": "Discrete trading environment with hold/buy/sell/close"
            },
            {
                "name": "ContinuousTrading-v0",
                "type": "continuous",
                "actions": 3,
                "description": "Continuous position sizing environment"
            },
            {
                "name": "MultiAssetEnv-v0",
                "type": "multi-agent",
                "actions": 20,
                "description": "Multi-asset portfolio optimization"
            }
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5104)
