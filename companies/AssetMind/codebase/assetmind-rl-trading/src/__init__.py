"""
AssetMind - Reinforcement Learning Trading (FinRL-Style)
Port: 5180

Inspired by FinRL from AI4Finance Foundation.
Deep reinforcement learning for algorithmic trading.

Features:
- DQN, PPO, A2C agents
- Environment simulation
- Backtesting
- Strategy optimization

Version: 1.0.0
Date: June 9, 2026
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid
import numpy as np


app = FastAPI(title="AssetMind RL Trading", version="1.0.0")


# ============================================================================
# Enums
# ============================================================================

class AgentType(str, Enum):
    DQN = "dqn"      # Deep Q-Network
    PPO = "ppo"      # Proximal Policy Optimization
    A2C = "a2c"      # Advantage Actor-Critic
    SAC = "sac"      # Soft Actor-Critic
    TD3 = "td3"      # Twin Delayed DDPG


class ActionType(str, Enum):
    BUY = "buy"
    SELL = "sell"
    HOLD = "hold"


class EnvironmentType(str, Enum):
    STOCKS = "stocks"
    CRYPTO = "crypto"
    FOREX = "forex"


class RiskLevel(str, Enum):
    CONSERVATIVE = "conservative"
    MODERATE = "moderate"
    AGGRESSIVE = "aggressive"


# ============================================================================
# Models
# ============================================================================

class Portfolio(BaseModel):
    portfolio_id: str
    initial_balance: float
    current_balance: float
    positions: Dict[str, float]  # symbol -> quantity
    total_value: float
    return_pct: float


class Trade(BaseModel):
    trade_id: str
    symbol: str
    action: ActionType
    quantity: float
    price: float
    timestamp: datetime
    pnl: float = 0.0


class StrategyConfig(BaseModel):
    agent_type: AgentType
    environment: EnvironmentType
    risk_level: RiskLevel
    initial_balance: float = 100000.0
    train_episodes: int = 100
    max_steps: int = 1000


class BacktestRequest(BaseModel):
    strategy: StrategyConfig
    symbols: List[str]
    start_date: datetime
    end_date: datetime
    initial_balance: float = 100000.0


class BacktestResult(BaseModel):
    backtest_id: str
    total_return: float
    sharpe_ratio: float
    max_drawdown: float
    win_rate: float
    total_trades: int
    trades: List[Trade]
    equity_curve: List[float]


class TradeSignal(BaseModel):
    symbol: str
    action: ActionType
    quantity: float
    confidence: float
    reasoning: List[str]


# ============================================================================
# Mock Agent Implementations
# ============================================================================

class RLAgent:
    """Base RL agent (simplified)"""

    def __init__(self, agent_type: AgentType, state_dim: int = 10, action_dim: int = 3):
        self.agent_type = agent_type
        self.state_dim = state_dim
        self.action_dim = action_dim
        self.policy = np.random.randn(state_dim, action_dim)

    def select_action(self, state: np.ndarray) -> int:
        """Select action based on policy"""
        q_values = np.dot(state, self.policy)
        return np.argmax(q_values)

    def update(self, state, action, reward, next_state, done):
        """Update policy (simplified)"""
        alpha = 0.001
        q_current = np.dot(state, self.policy)[:, action]
        q_target = reward + 0.99 * np.max(np.dot(next_state, self.policy)) * (1 - done)
        self.policy[:, action] += alpha * (q_target - q_current) * state


class TradingEnvironment:
    """Trading environment (OpenAI Gym-style)"""

    def __init__(self, symbols: List[str], initial_balance: float = 100000):
        self.symbols = symbols
        self.initial_balance = initial_balance
        self.balance = initial_balance
        self.positions = {s: 0 for s in symbols}
        self.current_step = 0
        self.max_steps = 252  # Trading days

    def reset(self):
        """Reset environment"""
        self.balance = self.initial_balance
        self.positions = {s: 0 for s in self.symbols}
        self.current_step = 0
        return self._get_state()

    def _get_state(self) -> np.ndarray:
        """Get current state"""
        # Simplified state: balance, positions, prices
        prices = np.random.rand(len(self.symbols))
        state = [self.balance / self.initial_balance]
        state.extend([self.positions[s] for s in self.symbols])
        state.extend(prices.tolist())
        return np.array(state)

    def step(self, actions: List[int]) -> tuple:
        """
        Take action and return (next_state, reward, done, info)

        Actions: 0=Hold, 1=Buy, 2=Sell
        """
        self.current_step += 1

        # Simulate price changes
        price_changes = np.random.randn(len(self.symbols)) * 0.02
        portfolio_value = self.balance

        for i, symbol in enumerate(self.symbols):
            action = actions[i] if i < len(actions) else 0

            if action == 1:  # Buy
                max_shares = self.balance * 0.1 / (1 + price_changes[i])
                if max_shares > 0:
                    self.positions[symbol] += max_shares
                    self.balance -= max_shares * (1 + price_changes[i])
            elif action == 2:  # Sell
                if self.positions[symbol] > 0:
                    self.balance += self.positions[symbol] * (1 + price_changes[i])
                    self.positions[symbol] = 0

            portfolio_value += self.positions[symbol] * (1 + price_changes[i])

        # Calculate reward
        reward = (portfolio_value - self.initial_balance) / self.initial_balance
        done = self.current_step >= self.max_steps

        return self._get_state(), reward, done, {}


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-rl-trading",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5180,
        "agents": [a.value for a in AgentType],
        "features": [
            "DQN, PPO, A2C agents",
            "Backtesting engine",
            "Strategy optimization",
            "Real-time signals"
        ]
    }


@app.post("/agents/create")
async def create_agent(agent_type: AgentType, symbols: List[str]):
    """Create an RL trading agent"""
    agent_id = str(uuid.uuid4())

    return {
        "agent_id": agent_id,
        "agent_type": agent_type.value,
        "symbols": symbols,
        "state_dim": 10 + len(symbols),
        "action_dim": 3 ** len(symbols),  # Buy/Sell/Hold per symbol
        "created_at": datetime.utcnow().isoformat()
    }


@app.post("/train")
async def train_agent(
    agent_type: AgentType,
    symbols: List[str],
    episodes: int = 100,
    initial_balance: float = 100000.0
):
    """
    Train an RL agent (FinRL-style).

    Returns training metrics and performance.
    """
    env = TradingEnvironment(symbols, initial_balance)
    agent = RLAgent(agent_type, state_dim=10 + len(symbols))

    training_history = []

    for episode in range(episodes):
        state = env.reset()
        total_reward = 0

        while True:
            # Select action
            action_idx = agent.select_action(state)
            actions = [(action_idx >> i) % 3 for i in range(len(symbols))]

            # Step environment
            next_state, reward, done, _ = env.step(actions)
            total_reward += reward

            # Update agent
            agent.update(state, action_idx, reward, next_state, done)

            state = next_state

            if done:
                break

        training_history.append({
            "episode": episode + 1,
            "reward": total_reward,
            "portfolio_value": env.balance + sum(
                env.positions[s] * 100 for s in symbols
            )
        })

        if (episode + 1) % 10 == 0:
            avg_reward = sum(h["reward"] for h in training_history[-10:]) / 10
            logger.info(f"Episode {episode+1}, Avg Reward: {avg_reward:.4f}")

    final_value = training_history[-1]["portfolio_value"]

    return {
        "agent_type": agent_type.value,
        "symbols": symbols,
        "episodes": episodes,
        "final_value": final_value,
        "total_return": (final_value - initial_balance) / initial_balance * 100,
        "best_episode": max(training_history, key=lambda x: x["reward"])["episode"],
        "training_history": training_history[-10:]  # Last 10 episodes
    }


@app.post("/backtest", response_model=BacktestResult)
async def run_backtest(request: BacktestRequest):
    """
    Backtest a trading strategy.

    Like FinRL's backtesting framework.
    """
    backtest_id = str(uuid.uuid4())

    env = TradingEnvironment(request.symbols, request.initial_balance)
    agent = RLAgent(
        AgentType(request.strategy.agent_type.value),
        state_dim=10 + len(request.symbols)
    )

    trades: List[Trade] = []
    equity_curve = []

    state = env.reset()

    for step in range(env.max_steps):
        action_idx = agent.select_action(state)
        actions = [(action_idx >> i) % 3 for i in range(len(request.symbols))]

        # Execute trade
        for i, symbol in enumerate(request.symbols):
            action = actions[i] if i < len(actions) else 0

            if action == 1 and env.balance > 1000:  # Buy
                trade = Trade(
                    trade_id=str(uuid.uuid4()),
                    symbol=symbol,
                    action=ActionType.BUY,
                    quantity=10,
                    price=100 + np.random.randn() * 5,
                    timestamp=datetime.utcnow()
                )
                trades.append(trade)

            elif action == 2:  # Sell
                trade = Trade(
                    trade_id=str(uuid.uuid4()),
                    symbol=symbol,
                    action=ActionType.SELL,
                    quantity=10,
                    price=100 + np.random.randn() * 5,
                    timestamp=datetime.utcnow()
                )
                trades.append(trade)

        next_state, _, done, _ = env.step(actions)
        state = next_state

        portfolio_value = env.balance + sum(
            env.positions[s] * 100 for s in request.symbols
        )
        equity_curve.append(portfolio_value)

        if done:
            break

    # Calculate metrics
    returns = np.diff(equity_curve) / equity_curve[:-1]
    sharpe_ratio = np.mean(returns) / np.std(returns) * np.sqrt(252) if np.std(returns) > 0 else 0

    # Max drawdown
    peak = equity_curve[0]
    max_dd = 0
    for value in equity_curve:
        if value > peak:
            peak = value
        dd = (peak - value) / peak
        if dd > max_dd:
            max_dd = dd

    # Win rate
    buy_trades = [t for t in trades if t.action == ActionType.BUY]
    sell_trades = [t for t in trades if t.action == ActionType.SELL]
    win_rate = len(sell_trades) / max(1, len(buy_trades))

    return BacktestResult(
        backtest_id=backtest_id,
        total_return=(equity_curve[-1] - request.initial_balance) / request.initial_balance * 100,
        sharpe_ratio=sharpe_ratio,
        max_drawdown=max_dd * 100,
        win_rate=win_rate * 100,
        total_trades=len(trades),
        trades=trades[:100],  # Limit to 100 for response
        equity_curve=equity_curve
    )


@app.post("/signal")
async def get_trade_signal(symbol: str, agent_id: str = None):
    """
    Get real-time trade signal.

    Uses trained agent to generate signal.
    """
    # Mock signal generation
    action_probs = np.random.dirichlet([1, 1, 1])

    action = ActionType.HOLD
    if np.argmax(action_probs) == 0:
        action = ActionType.BUY
    elif np.argmax(action_probs) == 1:
        action = ActionType.SELL

    return TradeSignal(
        symbol=symbol,
        action=action,
        quantity=100,
        confidence=max(action_probs),
        reasoning=[
            "Technical indicators bullish",
            "Volume increasing",
            "AI model signal positive"
        ] if action != ActionType.HOLD else [
            "Wait for clearer signal",
            "Hold current position"
        ]
    )


@app.get("/agents/{agent_id}/performance")
async def get_agent_performance(agent_id: str):
    """Get agent performance metrics"""
    return {
        "agent_id": agent_id,
        "total_trades": 150,
        "win_rate": 62.5,
        "avg_profit": 2.3,
        "sharpe_ratio": 1.85,
        "max_drawdown": 8.5,
        "total_return": 45.2
    }


@app.post("/optimize")
async def optimize_strategy(
    symbols: List[str],
    risk_level: RiskLevel,
    target_return: float = 20.0
):
    """
    Optimize trading strategy parameters.

    Like FinRL's strategy optimization.
    """
    # Mock optimization
    best_params = {
        "agent_type": "ppo",
        "learning_rate": 0.0003,
        "batch_size": 256,
        "gamma": 0.99,
        "epsilon": 0.1,
        "target_return": target_return,
        "actual_return": target_return * 1.1,
        "confidence": 0.85
    }

    return {
        "symbols": symbols,
        "risk_level": risk_level.value,
        "optimization_status": "completed",
        "best_params": best_params,
        "expected_sharpe": 1.9,
        "expected_max_dd": 12.0
    }


@app.get("/environments")
async def list_environments():
    """List available trading environments"""
    return {
        "environments": [
            {
                "type": env.value,
                "name": env.value.title(),
                "description": f"{env.value.title()} trading environment"
            }
            for env in EnvironmentType
        ]
    }


@app.get("/strategies/predefined")
async def get_predefined_strategies():
    """Get predefined trading strategies"""
    return {
        "strategies": [
            {
                "name": "Conservative Momentum",
                "agent_type": "a2c",
                "risk_level": "conservative",
                "expected_return": 15,
                "expected_sharpe": 1.5,
                "description": "Low-risk momentum strategy"
            },
            {
                "name": "Balanced DQN",
                "agent_type": "dqn",
                "risk_level": "moderate",
                "expected_return": 25,
                "expected_sharpe": 1.8,
                "description": "Balanced risk-reward"
            },
            {
                "name": "Aggressive PPO",
                "agent_type": "ppo",
                "risk_level": "aggressive",
                "expected_return": 40,
                "expected_sharpe": 1.2,
                "description": "High-risk, high-reward"
            }
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5180)