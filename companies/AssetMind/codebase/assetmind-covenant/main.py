"""
AssetMind Covenant - Covenant Monitoring Service
Port: 5282
"""

import uuid
from datetime import datetime, date
from typing import Optional, List
from enum import Enum

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from loguru import logger

app = FastAPI(title="AssetMind Covenant", description="Covenant Compliance Monitoring and Breach Detection", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class CovenantType(str, Enum):
    DEBT_TO_EBITDA = "debt_to_ebitda"
    NET_LEVERAGE = "net_leverage"
    INTEREST_COVERAGE = "interest_coverage"
    CURRENT_RATIO = "current_ratio"
    LIQUIDITY = "liquidity"
    DEBT_SERVICE_COVERAGE = "debt_service_coverage"
    FIXED_CHARGE_COVERAGE = "fixed_charge_coverage"
    REVENUE_MINIMUM = "revenue_minimum"

class CovenantDirection(str, Enum):
    LOWER_IS_BETTER = "lower_is_better"
    HIGHER_IS_BETTER = "higher_is_better"

class CovenantStatus(str, Enum):
    COMPLIANT = "compliant"
    WARNING = "warning"
    BREACH = "breach"

class SeverityLevel(str, Enum):
    NONE = "none"
    MINOR = "minor"
    MAJOR = "major"
    CRITICAL = "critical"

class FacilityType(str, Enum):
    TERM_LOAN_A = "Term Loan A"
    TERM_LOAN_B = "Term Loan B"
    REVOLVING_CREDIT = "Revolving Credit"
    BRIDGE_LOAN = "Bridge Loan"
    MEZZANINE = "Mezzanine"
    CONVERTIBLE_NOTE = "Convertible Note"

class AlertStatus(str, Enum):
    PENDING = "pending"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"

# Models
class CovenantDefinition(BaseModel):
    covenant_id: str = Field(default_factory=lambda: f"cov_{uuid.uuid4().hex[:8]}")
    covenant_name: str
    covenant_type: CovenantType
    direction: CovenantDirection
    threshold_value: float
    warning_threshold: Optional[float] = None

class Facility(BaseModel):
    id: str = Field(default_factory=lambda: f"fac_{uuid.uuid4().hex[:8]}")
    borrower_name: str
    facility_type: FacilityType
    principal: float
    current_balance: float
    interest_rate: float = 0.08
    covenants: List[CovenantDefinition] = []
    last_review_date: date
    next_review_date: date
    created_at: datetime = Field(default_factory=datetime.utcnow)

class FacilityCreate(BaseModel):
    facility_id: Optional[str] = None
    borrower_name: str
    facility_type: FacilityType
    principal: float
    current_balance: Optional[float] = None
    covenants: List[CovenantDefinition] = []
    last_review_date: date
    next_review_date: date

class FinancialData(BaseModel):
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
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class CovenantEvaluationResult(BaseModel):
    covenant_id: str
    covenant_name: str
    covenant_type: CovenantType
    current_value: float
    threshold_value: float
    status: CovenantStatus
    severity: SeverityLevel
    headroom: float
    headroom_percent: float

class EvaluationResponse(BaseModel):
    facility_id: str
    borrower_name: str
    overall_status: CovenantStatus
    overall_severity: SeverityLevel
    covenant_results: List[CovenantEvaluationResult]
    alerts_generated: int

class Alert(BaseModel):
    id: str = Field(default_factory=lambda: f"alert_{uuid.uuid4().hex[:8]}")
    facility_id: str
    borrower_name: str
    covenant_name: str
    severity: SeverityLevel
    status: AlertStatus = AlertStatus.PENDING
    current_value: float
    threshold_value: float
    message: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PortfolioSummary(BaseModel):
    total_facilities: int
    compliant_facilities: int
    warning_facilities: int
    breached_facilities: int
    compliance_rate: float
    principal_at_risk: float

# Storage
facilities_db: dict[str, Facility] = {}
evaluation_history_db: dict[str, List[EvaluationResponse]] = {}
alerts_db: dict[str, Alert] = {}

def calculate_covenant_value(financials: FinancialData, covenant_type: CovenantType) -> float:
    calculations = {
        CovenantType.DEBT_TO_EBITDA: financials.total_debt / financials.ebitda if financials.ebitda > 0 else float("inf"),
        CovenantType.NET_LEVERAGE: financials.net_debt / financials.ebitda if financials.ebitda > 0 else float("inf"),
        CovenantType.INTEREST_COVERAGE: financials.ebitda / financials.interest_expense if financials.interest_expense > 0 else float("inf"),
        CovenantType.CURRENT_RATIO: financials.current_assets / financials.current_liabilities if financials.current_liabilities > 0 else 0,
        CovenantType.LIQUIDITY: financials.cash,
        CovenantType.DEBT_SERVICE_COVERAGE: financials.fcf / financials.interest_expense if financials.interest_expense > 0 else 0,
        CovenantType.FIXED_CHARGE_COVERAGE: financials.fcf / financials.total_fixed_charges if financials.total_fixed_charges > 0 else 0,
        CovenantType.REVENUE_MINIMUM: financials.revenue,
    }
    return calculations.get(covenant_type, 0.0)

def evaluate_covenant_status(covenant: CovenantDefinition, current_value: float) -> tuple:
    threshold = covenant.threshold_value
    direction = covenant.direction

    if direction == CovenantDirection.LOWER_IS_BETTER:
        if current_value <= threshold:
            return CovenantStatus.COMPLIANT, SeverityLevel.NONE, threshold - current_value
        elif covenant.warning_threshold and current_value <= covenant.warning_threshold:
            return CovenantStatus.WARNING, SeverityLevel.MINOR, threshold - current_value
        else:
            headroom = current_value - threshold
            severity = SeverityLevel.CRITICAL if headroom / threshold > 0.25 else SeverityLevel.MAJOR if headroom / threshold > 0.10 else SeverityLevel.MINOR
            return CovenantStatus.BREACH, severity, -headroom
    else:  # HIGHER_IS_BETTER
        if current_value >= threshold:
            return CovenantStatus.COMPLIANT, SeverityLevel.NONE, current_value - threshold
        elif covenant.warning_threshold and current_value >= covenant.warning_threshold:
            return CovenantStatus.WARNING, SeverityLevel.MINOR, current_value - threshold
        else:
            headroom = threshold - current_value
            severity = SeverityLevel.CRITICAL if headroom / threshold > 0.25 else SeverityLevel.MAJOR if headroom / threshold > 0.10 else SeverityLevel.MINOR
            return CovenantStatus.BREACH, severity, -headroom

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "assetmind-covenant", "version": "1.0.0", "timestamp": datetime.utcnow().isoformat(), "stats": {"facilities": len(facilities_db), "alerts": len(alerts_db)}}

@app.post("/facilities", response_model=Facility, status_code=201)
async def create_facility(facility_data: FacilityCreate):
    facility_id = facility_data.facility_id or f"fac_{uuid.uuid4().hex[:8]}"
    if facility_id in facilities_db:
        raise HTTPException(status_code=400, detail="Facility ID already exists")
    facility = Facility(id=facility_id, borrower_name=facility_data.borrower_name, facility_type=facility_data.facility_type, principal=facility_data.principal, current_balance=facility_data.current_balance or facility_data.principal, covenants=facility_data.covenants, last_review_date=facility_data.last_review_date, next_review_date=facility_data.next_review_date)
    facilities_db[facility.id] = facility
    return facility

@app.get("/facilities")
async def list_facilities(skip: int = 0, limit: int = 100):
    return list(facilities_db.values())[skip:skip + limit]

@app.get("/facilities/{facility_id}", response_model=Facility)
async def get_facility(facility_id: str):
    if facility_id not in facilities_db:
        raise HTTPException(status_code=404, detail="Facility not found")
    return facilities_db[facility_id]

@app.post("/facilities/{facility_id}/evaluate", response_model=EvaluationResponse)
async def evaluate_facility(facility_id: str, financials: FinancialData):
    if facility_id not in facilities_db:
        raise HTTPException(status_code=404, detail="Facility not found")

    facility = facilities_db[facility_id]
    results = []
    alerts_generated = 0

    for covenant in facility.covenants:
        current_value = calculate_covenant_value(financials, covenant.covenant_type)
        status, severity, headroom = evaluate_covenant_status(covenant, current_value)
        headroom_pct = (headroom / covenant.threshold_value * 100) if covenant.threshold_value != 0 else 0

        result = CovenantEvaluationResult(covenant_id=covenant.covenant_id, covenant_name=covenant.covenant_name, covenant_type=covenant.covenant_type, current_value=current_value, threshold_value=covenant.threshold_value, status=status, severity=severity, headroom=headroom, headroom_percent=headroom_pct)
        results.append(result)

        if status in [CovenantStatus.WARNING, CovenantStatus.BREACH]:
            alerts_generated += 1
            alert = Alert(facility_id=facility_id, borrower_name=facility.borrower_name, covenant_name=covenant.covenant_name, severity=severity, current_value=current_value, threshold_value=covenant.threshold_value, message=f"{covenant.covenant_name}: {status.value}")
            alerts_db[alert.id] = alert

    overall_status = CovenantStatus.BREACH if any(r.status == CovenantStatus.BREACH for r in results) else CovenantStatus.WARNING if any(r.status == CovenantStatus.WARNING for r in results) else CovenantStatus.COMPLIANT
    overall_severity = SeverityLevel.CRITICAL if any(r.severity == SeverityLevel.CRITICAL for r in results) else SeverityLevel.MAJOR if any(r.severity == SeverityLevel.MAJOR for r in results) else SeverityLevel.MINOR if any(r.severity == SeverityLevel.MINOR for r in results) else SeverityLevel.NONE

    response = EvaluationResponse(facility_id=facility_id, borrower_name=facility.borrower_name, overall_status=overall_status, overall_severity=overall_severity, covenant_results=results, alerts_generated=alerts_generated)

    if facility_id not in evaluation_history_db:
        evaluation_history_db[facility_id] = []
    evaluation_history_db[facility_id].append(response)
    return response

@app.get("/facilities/{facility_id}/history")
async def get_evaluation_history(facility_id: str, limit: int = 10):
    if facility_id not in evaluation_history_db:
        return []
    history = evaluation_history_db[facility_id]
    history.sort(key=lambda x: x.covenant_results[0].current_value if x.covenant_results else 0, reverse=True)
    return history[:limit]

@app.get("/alerts", response_model=List[Alert])
async def list_alerts(skip: int = 0, limit: int = 100, status: Optional[AlertStatus] = None):
    alerts = list(alerts_db.values())
    if status:
        alerts = [a for a in alerts if a.status == status]
    alerts.sort(key=lambda x: x.created_at, reverse=True)
    return alerts[skip:skip + limit]

@app.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str):
    if alert_id not in alerts_db:
        raise HTTPException(status_code=404, detail="Alert not found")
    alerts_db[alert_id].status = AlertStatus.ACKNOWLEDGED
    return alerts_db[alert_id]

@app.post("/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: str):
    if alert_id not in alerts_db:
        raise HTTPException(status_code=404, detail="Alert not found")
    alerts_db[alert_id].status = AlertStatus.RESOLVED
    return alerts_db[alert_id]

@app.get("/portfolio/summary", response_model=PortfolioSummary)
async def get_portfolio_summary():
    total = len(facilities_db)
    compliant = warning = breached = principal_at_risk = 0

    for facility in facilities_db.values():
        if facility.id in evaluation_history_db and evaluation_history_db[facility.id]:
            latest = evaluation_history_db[facility.id][-1]
            if latest.overall_status == CovenantStatus.COMPLIANT:
                compliant += 1
            elif latest.overall_status == CovenantStatus.WARNING:
                warning += 1
                principal_at_risk += facility.current_balance
            else:
                breached += 1
                principal_at_risk += facility.current_balance
        else:
            compliant += 1

    return PortfolioSummary(total_facilities=total, compliant_facilities=compliant, warning_facilities=warning, breached_facilities=breached, compliance_rate=round(compliant / total * 100, 2) if total > 0 else 0, principal_at_risk=principal_at_risk)

@app.post("/covenant-builder")
async def build_covenants(borrower_name: str, loan_amount: float, ebitda_estimate: float):
    leverage = loan_amount / ebitda_estimate if ebitda_estimate > 0 else 0
    covenants = [
        CovenantDefinition(covenant_name="Max Leverage", covenant_type=CovenantType.DEBT_TO_EBITDA, direction=CovenantDirection.LOWER_IS_BETTER, threshold_value=round(leverage * 1.2, 2), warning_threshold=round(leverage * 1.1, 2)),
        CovenantDefinition(covenant_name="Min Interest Coverage", covenant_type=CovenantType.INTEREST_COVERAGE, direction=CovenantDirection.HIGHER_IS_BETTER, threshold_value=2.0, warning_threshold=2.5),
        CovenantDefinition(covenant_name="Min Liquidity", covenant_type=CovenantType.LIQUIDITY, direction=CovenantDirection.HIGHER_IS_BETTER, threshold_value=loan_amount * 0.05, warning_threshold=loan_amount * 0.10),
    ]
    return {"borrower_name": borrower_name, "suggested_covenants": covenants}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5282)