"""
AssetMind - Investor Twin Service
Port: 5005
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid


app = FastAPI(title="AssetMind Investor Twin Service", version="1.0.0")

# In-memory storage
investors: Dict[str, Dict] = {}


class RiskTolerance(str, Enum):
    CONSERVATIVE = "CONSERVATIVE"
    MODERATE = "MODERATE"
    AGGRESSIVE = "AGGRESSIVE"


class InvestmentHorizon(str, Enum):
    SHORT = "SHORT"  # < 1 year
    MEDIUM = "MEDIUM"  # 1-5 years
    LONG = "LONG"  # > 5 years


class StrategyType(str, Enum):
    VALUE = "VALUE"
    GROWTH = "GROWTH"
    INCOME = "INCOME"
    MOMENTUM = "MOMENTUM"
    SWING = "SWING"
    DAY_TRADING = "DAY_TRADING"


class InvestorProfile(BaseModel):
    goals: List[str] = Field(default_factory=list)
    risk_tolerance: RiskTolerance = RiskTolerance.MODERATE
    investment_horizon: InvestmentHorizon = InvestmentHorizon.MEDIUM
    preferred_sectors: List[str] = Field(default_factory=list)
    preferred_asset_classes: List[str] = Field(default_factory=list)
    strategy_type: StrategyType = StrategyType.GROWTH


class InvestorBehavior(BaseModel):
    total_trades: int = 0
    avg_holding_period_days: float = 0
    avg_position_size_pct: float = 0
    trade_frequency_per_week: float = 0
    win_rate: float = 50
    loss_rate: float = 50
    avg_win_pct: float = 0
    avg_loss_pct: float = 0


class InvestorMistakes(BaseModel):
    revenge_trading_count: int = 0
    overtrading_count: int = 0
    fomo_entries: int = 0
    panic_exits: int = 0
    position_sizing_errors: int = 0


class InvestorTwin(BaseModel):
    """Investor Digital Twin"""
    twin_id: str
    user_id: str
    profile: InvestorProfile = InvestorProfile()
    behavior: InvestorBehavior = InvestorBehavior()
    mistakes: InvestorMistakes = InvestorMistakes()

    # Best/Worst
    best_strategies: List[str] = Field(default_factory=list)
    worst_strategies: List[str] = Field(default_factory=list)

    # Coaching
    coaching_tips: List[str] = Field(default_factory=list)
    pre_trade_checks: List[str] = Field(default_factory=list)
    recent_mistakes: List[str] = Field(default_factory=list)

    # Personality Scores
    patience_score: float = Field(50, ge=0, le=100)
    discipline_score: float = Field(50, ge=0, le=100)
    emotional_control_score: float = Field(50, ge=0, le=100)
    conviction_score: float = Field(50, ge=0, le=100)

    # Learning
    mistakes_improved: int = 0
    coaching_sessions_completed: int = 0

    last_updated: datetime = Field(default_factory=datetime.utcnow)
    twin_created_at: datetime = Field(default_factory=datetime.utcnow)


def create_default_investor(user_id: str) -> InvestorTwin:
    """Create a new investor twin with default values"""
    return InvestorTwin(
        twin_id=str(uuid.uuid4()),
        user_id=user_id,
        profile=InvestorProfile(
            goals=["Wealth building", "Retirement"],
            risk_tolerance=RiskTolerance.MODERATE,
            investment_horizon=InvestmentHorizon.MEDIUM,
            preferred_sectors=["Technology", "Healthcare"],
            preferred_asset_classes=["STOCK", "ETF"],
            strategy_type=StrategyType.GROWTH
        ),
        behavior=InvestorBehavior(
            total_trades=0,
            avg_holding_period_days=30,
            avg_position_size_pct=10,
            trade_frequency_per_week=2,
            win_rate=55,
            loss_rate=45,
            avg_win_pct=8,
            avg_loss_pct=-5
        ),
        mistakes=InvestorMistakes(),
        best_strategies=["Buy and hold quality companies"],
        worst_strategies=[],
        coaching_tips=[
            "Stick to your plan",
            "Don't chase past winners",
            "Rebalance quarterly"
        ],
        pre_trade_checks=[
            "Does this fit my strategy?",
            "Is position size appropriate?",
            "What's my exit plan?"
        ],
        patience_score=60,
        discipline_score=65,
        emotional_control_score=55,
        conviction_score=70
    )


@app.get("/health")
async def health_check():
    return {
        "service": "assetmind-investor-twin",
        "status": "healthy",
        "version": "1.0.0",
        "port": 5005,
        "total_investors": len(investors)
    }


@app.post("/investors", status_code=201)
async def create_investor(user_id: str):
    if user_id in investors:
        raise HTTPException(status_code=409, detail="Investor twin already exists")

    investor = create_default_investor(user_id)
    investors[user_id] = investor
    return {"twin_id": investor.twin_id, "user_id": user_id, "message": "Investor twin created"}


@app.get("/investors/{user_id}")
async def get_investor(user_id: str):
    if user_id not in investors:
        raise HTTPException(status_code=404, detail="Investor twin not found")
    return investors[user_id]


@app.patch("/investors/{user_id}/profile")
async def update_profile(user_id: str, profile: InvestorProfile):
    if user_id not in investors:
        raise HTTPException(status_code=404, detail="Investor twin not found")

    investors[user_id].profile = profile
    investors[user_id].last_updated = datetime.utcnow()
    return {"message": "Profile updated"}


@app.patch("/investors/{user_id}/behavior")
async def update_behavior(user_id: str, behavior: InvestorBehavior):
    if user_id not in investors:
        raise HTTPException(status_code=404, detail="Investor twin not found")

    investors[user_id].behavior = behavior
    investors[user_id].last_updated = datetime.utcnow()
    return {"message": "Behavior updated"}


@app.post("/investors/{user_id}/mistakes/{mistake_type}")
async def record_mistake(user_id: str, mistake_type: str):
    """Record a trading mistake"""
    if user_id not in investors:
        raise HTTPException(status_code=404, detail="Investor twin not found")

    mistakes = investors[user_id].mistakes
    mistakes_dict = mistakes.model_dump()

    if mistake_type in mistakes_dict:
        mistakes_dict[mistake_type] += 1
        investors[user_id].mistakes = InvestorMistakes(**mistakes_dict)

        # Add to recent mistakes
        investors[user_id].recent_mistakes.append(
            f"{mistake_type} detected on {datetime.utcnow().strftime('%Y-%m-%d')}"
        )
        # Keep only last 10
        investors[user_id].recent_mistakes = investors[user_id].recent_mistakes[-10:]

    investors[user_id].last_updated = datetime.utcnow()
    return {"message": f"Mistake {mistake_type} recorded"}


@app.get("/investors/{user_id}/coaching")
async def get_coaching(user_id: str):
    """Get personalized coaching recommendations"""
    if user_id not in investors:
        raise HTTPException(status_code=404, detail="Investor twin not found")

    investor = investors[user_id]
    coaching = []

    # Analyze mistakes
    mistakes = investor.mistakes
    behavior = investor.behavior

    if mistakes.revenge_trading_count > 2:
        coaching.append("⚠️ Revenge trading detected multiple times. Take a break after losses.")
    if mistakes.overtrading_count > 5:
        coaching.append("⚠️ High trading frequency. Consider a more disciplined approach.")
    if mistakes.fomo_entries > 3:
        coaching.append("⚠️ FOMO entries detected. Wait for pullbacks instead of chasing.")
    if mistakes.panic_exits > 2:
        coaching.append("⚠️ Panic selling pattern. Set stop-losses in advance.")

    # Position sizing
    if behavior.avg_position_size_pct > 20:
        coaching.append("⚠️ Position sizes may be too large. Consider max 10% per position.")

    # Holding period
    if behavior.avg_holding_period_days < 7:
        coaching.append("Short holding periods may trigger excessive taxes and fees.")

    # Win rate
    if behavior.win_rate < 50:
        coaching.append("Win rate below 50%. Review your strategy or cut losses earlier.")

    return {
        "coaching_tips": investor.coaching_tips,
        "personalized_coaching": coaching,
        "personality_scores": {
            "patience": investor.patience_score,
            "discipline": investor.discipline_score,
            "emotional_control": investor.emotional_control_score,
            "conviction": investor.conviction_score
        },
        "recent_mistakes": investor.recent_mistakes,
        "mistake_summary": mistakes.model_dump()
    }


@app.get("/investors/{user_id}/analysis")
async def get_investor_analysis(user_id: str):
    """Get full investor analysis"""
    if user_id not in investors:
        raise HTTPException(status_code=404, detail="Investor twin not found")

    investor = investors[user_id]

    return {
        "profile": investor.profile.model_dump(),
        "behavior": investor.behavior.model_dump(),
        "personality_scores": {
            "patience": investor.patience_score,
            "discipline": investor.discipline_score,
            "emotional_control": investor.emotional_control_score,
            "conviction": investor.conviction_score
        },
        "strategy_insights": {
            "best_strategies": investor.best_strategies,
            "worst_strategies": investor.worst_strategies
        },
        "risk_assessment": _assess_investor_risk(investor),
        "learning_progress": {
            "mistakes_improved": investor.mistakes_improved,
            "coaching_sessions_completed": investor.coaching_sessions_completed
        }
    }


def _assess_investor_risk(investor: InvestorTwin) -> Dict[str, Any]:
    """Assess investor risk profile"""
    risk_factors = []
    risk_score = 50

    # Check patience
    if investor.patience_score < 40:
        risk_factors.append("Low patience - prone to emotional decisions")
        risk_score += 10

    # Check discipline
    if investor.discipline_score < 50:
        risk_factors.append("Below average discipline")
        risk_score += 15

    # Check emotional control
    if investor.emotional_control_score < 50:
        risk_factors.append("Emotional control needs improvement")
        risk_score += 15

    # Check mistakes
    total_mistakes = sum(investor.mistakes.model_dump().values())
    if total_mistakes > 10:
        risk_factors.append("High mistake count - review strategy")
        risk_score += 10

    # Check win rate
    if investor.behavior.win_rate < 45:
        risk_factors.append("Below average win rate")
        risk_score += 10

    return {
        "overall_risk_score": min(risk_score, 100),
        "risk_factors": risk_factors,
        "recommendation": "Reduce position sizes and focus on discipline" if risk_score > 60 else "Continue current approach"
    }


@app.get("/stats")
async def get_stats():
    if not investors:
        return {"total_investors": 0}

    avg_win_rate = sum(i.behavior.win_rate for i in investors.values()) / len(investors)
    avg_discipline = sum(i.discipline_score for i in investors.values()) / len(investors)

    return {
        "total_investors": len(investors),
        "avg_win_rate": avg_win_rate,
        "avg_discipline_score": avg_discipline,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5005)
