"""
AssetMind Covenant Monitoring Service
Port: 5282

Tracks covenant compliance, detects breaches, and generates alerts.
Monitors financial covenants across loan portfolios.
"""

import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from enum import Enum
import json


app = FastAPI(title="AssetMind Covenant Monitor", version="1.0.0")


class CovenantType(str, Enum):
    DEBT_TO_EBITDA = "debt_to_ebitda"
    INTEREST_COVERAGE = "interest_coverage"
    CURRENT_RATIO = "current_ratio"
    LIQUIDITY = "liquidity"
    DEBT_SERVICE_COVERAGE = "debt_service_coverage"
    LEVERAGE_RATIO = "leverage_ratio"
    NET_LEVERAGE = "net_leverage"
    FIXED_CHARGE_COVERAGE = "fixed_charge_coverage"
    CUSTOM = "custom"


class ComparisonOperator(str, Enum):
    LESS_THAN = "less_than"
    GREATER_THAN = "greater_than"
    EQUALS = "equals"
    LESS_THAN_OR_EQUAL = "less_than_or_equal"
    GREATER_THAN_OR_EQUAL = "greater_than_or_equal"


class CovenantDefinition(BaseModel):
    covenant_id: str
    covenant_name: str
    covenant_type: CovenantType
    threshold_value: float
    operator: ComparisonOperator
    is_affirmative: bool = True  # True = borrower must maintain, False = borrower cannot exceed
    description: str = ""


class FinancialSnapshot(BaseModel):
    """Snapshot of financial metrics at a point in time."""
    ebitda: float
    total_debt: float
    net_debt: float
    cash: float
    interest_expense: float
    current_assets: float
    current_liabilities: float
    fcf: float
    total_fixed_charges: float
    revenue: float
    timestamp: str


class CovenantStatus(BaseModel):
    covenant_id: str
    covenant_name: str
    covenant_type: CovenantType
    current_value: float
    threshold_value: float
    operator: str
    status: str  # "compliant", "warning", "breach"
    headroom: float
    headroom_percent: float
    breach_severity: str  # "none", "minor", "major", "critical"
    last_updated: str


class LoanFacility(BaseModel):
    facility_id: str
    borrower_name: str
    facility_type: str
    principal: float
    current_balance: float
    covenants: List[CovenantDefinition]
    last_review_date: str
    next_review_date: str
    status: str = "active"


class CovenantAlert(BaseModel):
    alert_id: str
    facility_id: str
    borrower_name: str
    covenant_name: str
    alert_type: str  # "warning", "breach", "cure_period", "waiver_request"
    message: str
    current_value: float
    threshold: float
    severity: str  # "low", "medium", "high", "critical"
    created_at: str
    acknowledged: bool = False
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[str] = None


# In-memory storage
facilities: Dict[str, LoanFacility] = {}
covenant_history: Dict[str, List[CovenantStatus]] = {}
alerts: List[CovenantAlert] = []


def evaluate_covenant(covenant: CovenantDefinition, snapshot: FinancialSnapshot) -> Dict[str, Any]:
    """Evaluate a single covenant against current metrics."""

    # Calculate current value based on covenant type
    if covenant.covenant_type == CovenantType.DEBT_TO_EBITDA:
        current_value = snapshot.total_debt / snapshot.ebitda if snapshot.ebitda > 0 else 999
    elif covenant.covenant_type == CovenantType.NET_LEVERAGE:
        current_value = snapshot.net_debt / snapshot.ebitda if snapshot.ebitda > 0 else 999
    elif covenant.covenant_type == CovenantType.INTEREST_COVERAGE:
        current_value = snapshot.ebitda / snapshot.interest_expense if snapshot.interest_expense > 0 else 0
    elif covenant.covenant_type == CovenantType.CURRENT_RATIO:
        current_value = snapshot.current_assets / snapshot.current_liabilities if snapshot.current_liabilities > 0 else 0
    elif covenant.covenant_type == CovenantType.LIQUIDITY:
        current_value = snapshot.cash
    elif covenant.covenant_type == CovenantType.DEBT_SERVICE_COVERAGE:
        current_value = snapshot.fcf / snapshot.interest_expense if snapshot.interest_expense > 0 else 0
    elif covenant.covenant_type == CovenantType.FIXED_CHARGE_COVERAGE:
        current_value = snapshot.fcf / snapshot.total_fixed_charges if snapshot.total_fixed_charges > 0 else 0
    else:
        current_value = 0

    # Determine compliance status
    threshold = covenant.threshold_value
    op = covenant.operator

    if covenant.covenant_type in [CovenantType.DEBT_TO_EBITDA, CovenantType.LEVERAGE_RATIO, CovenantType.NET_LEVERAGE]:
        # Lower is better for these
        if op == ComparisonOperator.LESS_THAN:
            is_compliant = current_value < threshold
            headroom = threshold - current_value
        elif op == ComparisonOperator.LESS_THAN_OR_EQUAL:
            is_compliant = current_value <= threshold
            headroom = threshold - current_value
        else:
            is_compliant = current_value <= threshold
            headroom = threshold - current_value
    else:
        # Higher is better
        if op == ComparisonOperator.GREATER_THAN:
            is_compliant = current_value > threshold
            headroom = current_value - threshold
        elif op == ComparisonOperator.GREATER_THAN_OR_EQUAL:
            is_compliant = current_value >= threshold
            headroom = current_value - threshold
        else:
            is_compliant = current_value >= threshold
            headroom = current_value - threshold

    # Determine severity
    if is_compliant:
        if headroom / threshold > 0.2:
            status = "compliant"
            severity = "none"
        else:
            status = "warning"
            severity = "minor"
    else:
        if abs(headroom) / threshold > 0.3:
            status = "breach"
            severity = "critical"
        elif abs(headroom) / threshold > 0.15:
            status = "breach"
            severity = "major"
        else:
            status = "breach"
            severity = "minor"

    headroom_percent = (headroom / threshold * 100) if threshold != 0 else 0

    return {
        "current_value": round(current_value, 2),
        "status": status,
        "headroom": round(headroom, 2),
        "headroom_percent": round(headroom_percent, 1),
        "breach_severity": severity,
        "is_compliant": is_compliant
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "covenant-monitor", "version": "1.0.0"}


@app.post("/facilities")
async def create_facility(facility: LoanFacility):
    """Register a new loan facility with covenants."""
    facilities[facility.facility_id] = facility
    return {"facility_id": facility.facility_id, "status": "created"}


@app.get("/facilities/{facility_id}")
async def get_facility(facility_id: str):
    """Get facility details."""
    if facility_id not in facilities:
        raise HTTPException(status_code=404, detail="Facility not found")
    return facilities[facility_id]


@app.get("/facilities")
async def list_facilities():
    """List all facilities."""
    return {"facilities": list(facilities.values())}


@app.post("/facilities/{facility_id}/evaluate")
async def evaluate_facility(facility_id: str, snapshot: FinancialSnapshot):
    """Evaluate all covenants for a facility."""
    if facility_id not in facilities:
        raise HTTPException(status_code=404, detail="Facility not found")

    facility = facilities[facility_id]
    results = []

    for covenant in facility.covenants:
        eval_result = evaluate_covenant(covenant, snapshot)

        status = CovenantStatus(
            covenant_id=covenant.covenant_id,
            covenant_name=covenant.covenant_name,
            covenant_type=covenant.covenant_type,
            current_value=eval_result["current_value"],
            threshold_value=covenant.threshold_value,
            operator=covenant.operator.value,
            status=eval_result["status"],
            headroom=eval_result["headroom"],
            headroom_percent=eval_result["headroom_percent"],
            breach_severity=eval_result["breach_severity"],
            last_updated=snapshot.timestamp
        )

        results.append(status)

        # Store history
        if facility_id not in covenant_history:
            covenant_history[facility_id] = []
        covenant_history[facility_id].append(status)

        # Generate alerts for breaches
        if eval_result["status"] != "compliant":
            alert = CovenantAlert(
                alert_id=f"alert-{facility_id}-{covenant.covenant_id}-{datetime.now().timestamp()}",
                facility_id=facility_id,
                borrower_name=facility.borrower_name,
                covenant_name=covenant.covenant_name,
                alert_type="breach" if eval_result["status"] == "breach" else "warning",
                message=f"Covenant '{covenant.covenant_name}' is {eval_result['status']}. Current: {eval_result['current_value']}, Threshold: {covenant.threshold_value}",
                current_value=eval_result["current_value"],
                threshold=covenant.threshold_value,
                severity=eval_result["breach_severity"],
                created_at=datetime.now().isoformat()
            )
            alerts.append(alert)

    return {
        "facility_id": facility_id,
        "borrower_name": facility.borrower_name,
        "evaluation_time": snapshot.timestamp,
        "overall_status": "compliant" if all(r.status == "compliant" for r in results) else "warning" if any(r.status == "warning" for r in results) else "breach",
        "covenant_results": results
    }


@app.get("/facilities/{facility_id}/history")
async def get_covenant_history(facility_id: str, limit: int = 30):
    """Get covenant evaluation history."""
    if facility_id not in covenant_history:
        return {"facility_id": facility_id, "history": []}

    history = covenant_history[facility_id][-limit:]
    return {"facility_id": facility_id, "history": history}


@app.get("/alerts")
async def get_alerts(severity: Optional[str] = None, acknowledged: Optional[bool] = None):
    """Get all alerts with optional filtering."""
    filtered_alerts = alerts

    if severity:
        filtered_alerts = [a for a in filtered_alerts if a.severity == severity]
    if acknowledged is not None:
        filtered_alerts = [a for a in filtered_alerts if a.acknowledged == acknowledged]

    return {"alerts": filtered_alerts, "total_count": len(filtered_alerts)}


@app.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str, acknowledged_by: str):
    """Acknowledge an alert."""
    for alert in alerts:
        if alert.alert_id == alert_id:
            alert.acknowledged = True
            alert.acknowledged_by = acknowledged_by
            alert.acknowledged_at = datetime.now().isoformat()
            return alert

    raise HTTPException(status_code=404, detail="Alert not found")


@app.get("/portfolio/summary")
async def portfolio_summary():
    """Get portfolio-wide covenant summary."""
    total_facilities = len(facilities)
    breached_facilities = 0
    warning_facilities = 0
    compliant_facilities = 0

    total_principal_at_risk = 0

    for facility_id, history in covenant_history.items():
        if facility_id in facilities:
            facility = facilities[facility_id]
            latest = history[-1] if history else None

            if latest:
                if latest.status == "breach":
                    breached_facilities += 1
                    total_principal_at_risk += facility.principal
                elif latest.status == "warning":
                    warning_facilities += 1
                else:
                    compliant_facilities += 1

    return {
        "total_facilities": total_facilities,
        "compliant_facilities": compliant_facilities,
        "warning_facilities": warning_facilities,
        "breached_facilities": breached_facilities,
        "compliance_rate": round(compliant_facilities / total_facilities * 100, 1) if total_facilities > 0 else 0,
        "principal_at_risk": total_principal_at_risk,
        "total_alerts": len([a for a in alerts if not a.acknowledged])
    }


@app.post("/covenant-builder")
async def build_covenant_set(financial_metrics: Dict[str, float]):
    """Generate recommended covenants based on financial profile."""
    recommendations = []

    # Leverage covenant
    debt_to_ebitda = financial_metrics.get("total_debt", 0) / financial_metrics.get("ebitda", 1) if financial_metrics.get("ebitda", 0) > 0 else 0
    recommendations.append(CovenantDefinition(
        covenant_id="cov-debt-ebitda",
        covenant_name="Maximum Debt/EBITDA",
        covenant_type=CovenantType.DEBT_TO_EBITDA,
        threshold_value=round(debt_to_ebitda * 1.2, 1),  # 20% buffer
        operator=ComparisonOperator.LESS_THAN_OR_EQUAL,
        description=f"Total debt cannot exceed {round(debt_to_ebitda * 1.2, 1)}x EBITDA"
    ))

    # Interest coverage covenant
    interest_coverage = financial_metrics.get("ebitda", 0) / financial_metrics.get("interest_expense", 1) if financial_metrics.get("interest_expense", 0) > 0 else 999
    recommendations.append(CovenantDefinition(
        covenant_id="cov-int-coverage",
        covenant_name="Minimum Interest Coverage",
        covenant_type=CovenantType.INTEREST_COVERAGE,
        threshold_value=max(1.5, round(interest_coverage * 0.7, 1)),  # 30% buffer
        operator=ComparisonOperator.GREATER_THAN_OR_EQUAL,
        description=f"EBITDA/Interest must remain above {max(1.5, round(interest_coverage * 0.7, 1))}x"
    ))

    # Liquidity covenant
    recommendations.append(CovenantDefinition(
        covenant_id="cov-liquidity",
        covenant_name="Minimum Liquidity",
        covenant_type=CovenantType.LIQUIDITY,
        threshold_value=financial_metrics.get("cash", 0) * 0.5,  # 50% of current cash
        operator=ComparisonOperator.GREATER_THAN_OR_EQUAL,
        description="Minimum cash balance requirement"
    ))

    return {"recommended_covenants": recommendations}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5282)
