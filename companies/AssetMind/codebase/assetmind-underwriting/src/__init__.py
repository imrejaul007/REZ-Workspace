"""
AssetMind Underwriting Agent
Port: 5281

AI-powered underwriting analysis for private credit and lending decisions.
Calculates EBITDA, leverage ratios, interest coverage, and generates lender-ready outputs.
"""

import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


app = FastAPI(title="AssetMind Underwriting Agent", version="1.0.0")


class LoanType(str, Enum):
    TERM_LOAN = "term_loan"
    REVOLVING_CREDIT = "revolving_credit"
    ABL = "asset_based_lending"
    MEZZANINE = "mezzanine"
    UNITRANCHE = "unitranche"


class FinancialInputs(BaseModel):
    """Input financial data for underwriting."""
    revenue: float = Field(..., description="Total revenue in $")
    cogs: float = Field(..., description="Cost of goods sold in $")
    operating_expenses: float = Field(..., description="Operating expenses in $")
    interest_expense: float = Field(..., description="Current interest expense in $")
    depreciation: float = Field(..., description="Depreciation in $")
    amortization: float = Field(..., description="Amortization in $")
    taxes: float = Field(..., description="Taxes paid in $")
    capex: float = Field(..., description="Capital expenditures in $")
    working_capital_change: float = Field(0, description="Change in working capital")
    current_debt: float = Field(..., description="Current total debt in $")
    cash: float = Field(..., description="Cash and equivalents in $")
    accounts_receivable: float = Field(0, description="Accounts receivable")
    inventory: float = Field(0, description="Inventory")
    accounts_payable: float = Field(0, description="Accounts payable")


class UnderwritingRequest(BaseModel):
    company_name: str
    loan_type: LoanType
    loan_amount_requested: float
    loan_term_months: int = 60
    interest_rate: float = Field(..., description="Interest rate as percentage (e.g., 8.5 for 8.5%)")
    financial_inputs: FinancialInputs
    industry: str = "general"
    ltv: Optional[float] = Field(None, description="Loan-to-value if collateral-backed")


class UnderwritingOutput(BaseModel):
    """Complete underwriting analysis output."""
    company_name: str
    analysis_date: str
    loan_type: str
    recommended_loan_amount: float
    recommended_rate: float
    term_months: int
    leverage_metrics: Dict[str, float]
    coverage_metrics: Dict[str, float]
    liquidity_metrics: Dict[str, float]
    profitability_metrics: Dict[str, float]
    cashflow_metrics: Dict[str, float]
    covenant_recommendations: List[str]
    lender_grade: str
    approval_recommendation: str
    risk_factors: List[str]
    deal_summary: str


def calculate_metrics(inputs: FinancialInputs) -> Dict[str, Any]:
    """Calculate all financial metrics."""

    # Revenue Metrics
    gross_profit = inputs.revenue - inputs.cogs
    gross_margin = (gross_profit / inputs.revenue * 100) if inputs.revenue > 0 else 0

    # EBITDA
    ebitda = gross_profit - inputs.operating_expenses + inputs.depreciation + inputs.amortization

    # EBIT
    ebit = ebitda - inputs.depreciation - inputs.amortization

    # Net Income (approximate)
    net_income = ebit - inputs.interest_expense - inputs.taxes

    # Cash Flow metrics
    fcf = net_income + inputs.depreciation + inputs.amortization - inputs.capex + inputs.working_capital_change
    ocf = net_income + inputs.depreciation + inputs.amortization  # Operating cash flow

    # Leverage Ratios
    total_debt = inputs.current_debt
    net_debt = total_debt - inputs.cash
    debt_to_ebitda = total_debt / ebitda if ebitda > 0 else 0
    net_debt_to_ebitda = net_debt / ebitda if ebitda > 0 else 0

    # Coverage Ratios
    interest_coverage = ebit / inputs.interest_expense if inputs.interest_expense > 0 else 0
    debt_service_coverage = ocf / inputs.interest_expense if inputs.interest_expense > 0 else 0

    # Liquidity
    current_assets = inputs.cash + inputs.accounts_receivable + inputs.inventory
    current_liabilities = inputs.accounts_payable  # Simplified
    current_ratio = current_assets / current_liabilities if current_liabilities > 0 else 0

    # Profitability
    ebitda_margin = (ebitda / inputs.revenue * 100) if inputs.revenue > 0 else 0
    net_margin = (net_income / inputs.revenue * 100) if inputs.revenue > 0 else 0

    # Turnover
    receivables_days = (inputs.accounts_receivable / inputs.revenue * 365) if inputs.revenue > 0 else 0
    inventory_days = (inputs.inventory / inputs.cogs * 365) if inputs.cogs > 0 else 0
    payables_days = (inputs.accounts_payable / inputs.cogs * 365) if inputs.cogs > 0 else 0

    # Cash Conversion Cycle
    ccc = receivables_days + inventory_days - payables_days

    return {
        "revenue": inputs.revenue,
        "gross_profit": gross_profit,
        "gross_margin": round(gross_margin, 2),
        "ebitda": ebitda,
        "ebitda_margin": round(ebitda_margin, 2),
        "ebit": ebit,
        "net_income": net_income,
        "net_margin": round(net_margin, 2),
        "fcf": fcf,
        "ocf": ocf,
        "total_debt": total_debt,
        "net_debt": net_debt,
        "debt_to_ebitda": round(debt_to_ebitda, 2),
        "net_debt_to_ebitda": round(net_debt_to_ebitda, 2),
        "interest_coverage": round(interest_coverage, 2),
        "debt_service_coverage": round(debt_service_coverage, 2),
        "current_ratio": round(current_ratio, 2),
        "receivables_days": round(receivables_days, 1),
        "inventory_days": round(inventory_days, 1),
        "payables_days": round(payables_days, 1),
        "ccc": round(ccc, 1),
    }


def determine_grade(metrics: Dict, loan_type: LoanType) -> str:
    """Determine lender grade based on metrics."""
    score = 0

    # EBITDA margin scoring
    if metrics["ebitda_margin"] > 30:
        score += 30
    elif metrics["ebitda_margin"] > 20:
        score += 25
    elif metrics["ebitda_margin"] > 15:
        score += 20
    elif metrics["ebitda_margin"] > 10:
        score += 10

    # Debt/EBITDA scoring
    if metrics["debt_to_ebitda"] < 2:
        score += 30
    elif metrics["debt_to_ebitda"] < 3:
        score += 25
    elif metrics["debt_to_ebitda"] < 4:
        score += 15
    elif metrics["debt_to_ebitda"] < 5:
        score += 5

    # Interest coverage scoring
    if metrics["interest_coverage"] > 5:
        score += 25
    elif metrics["interest_coverage"] > 3:
        score += 20
    elif metrics["interest_coverage"] > 2:
        score += 10

    # Current ratio scoring
    if metrics["current_ratio"] > 2:
        score += 15
    elif metrics["current_ratio"] > 1.5:
        score += 10
    elif metrics["current_ratio"] > 1:
        score += 5

    # Grade determination
    if score >= 85:
        return "AAA"
    elif score >= 75:
        return "AA"
    elif score >= 65:
        return "A"
    elif score >= 50:
        return "BBB"
    elif score >= 35:
        return "BB"
    elif score >= 20:
        return "B"
    else:
        return "CCC"


def generate_recommendation(metrics: Dict, grade: str, loan_amount: float) -> str:
    """Generate underwriting recommendation."""

    risk_factors = []

    if metrics["debt_to_ebitda"] > 5:
        risk_factors.append("elevated leverage")
    if metrics["interest_coverage"] < 2:
        risk_factors.append("tight interest coverage")
    if metrics["current_ratio"] < 1:
        risk_factors.append("liquidity concern")
    if metrics["ebitda_margin"] < 10:
        risk_factors.append("thin profitability")

    if grade in ["AAA", "AA", "A"]:
        return f"APPROVE - Strong credit profile. {loan_amount:,.0f} recommended."
    elif grade == "BBB":
        if len(risk_factors) == 0:
            return f"APPROVE - Acceptable credit profile. Monitor covenants closely."
        else:
            return f"CONDITIONAL APPROVAL - Address {', '.join(risk_factors)}"
    elif grade in ["BB", "B"]:
        return f"REVIEW REQUIRED - {', '.join(risk_factors) if risk_factors else 'Enhanced due diligence needed'}"
    else:
        return "DECLINE - Does not meet lending criteria"


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "underwriting-agent", "version": "1.0.0"}


@app.post("/underwrite", response_model=UnderwritingOutput)
async def underwrite(request: UnderwritingRequest):
    """Perform complete underwriting analysis."""

    metrics = calculate_metrics(request.financial_inputs)
    grade = determine_grade(metrics, request.loan_type)

    # Calculate recommended loan amount based on metrics
    base_loan = min(request.loan_amount_requested, metrics["ebitda"] * 5)  # Max 5x EBITDA
    if request.loan_type == LoanType.ABL:
        base_loan = min(base_loan, metrics["current_assets"] * 0.8)  # 80% of current assets
    elif request.loan_type == LoanType.MEZZANINE:
        base_loan = min(base_loan, metrics["ebitda"] * 3)  # Lower for mezz

    # Adjust rate based on grade
    base_rate = request.interest_rate
    if grade == "AAA":
        rate_adjustment = -1.5
    elif grade == "AA":
        rate_adjustment = -1.0
    elif grade == "A":
        rate_adjustment = -0.5
    elif grade == "BBB":
        rate_adjustment = 0
    elif grade == "BB":
        rate_adjustment = 1.0
    elif grade == "B":
        rate_adjustment = 2.0
    else:
        rate_adjustment = 3.0

    recommended_rate = base_rate + rate_adjustment

    # Covenant recommendations
    covenants = []
    if metrics["debt_to_ebitda"] > 3:
        covenants.append(f"Maximum Total Debt/EBITDA: {metrics['debt_to_ebitda'] + 1:.1f}x")
    covenants.append(f"Minimum Interest Coverage: {max(1.5, metrics['interest_coverage'] - 0.5):.1f}x")
    covenants.append(f"Minimum Liquidity: ${max(500000, metrics['current_assets'] * 0.1):,.0f}")
    covenants.append("Quarterly financial reporting requirement")

    # Risk factors
    risk_factors = []
    if metrics["debt_to_ebitda"] > 4:
        risk_factors.append("High leverage ratio")
    if metrics["interest_coverage"] < 2.5:
        risk_factors.append("Tight debt service coverage")
    if metrics["fcf"] < metrics["interest_expense"]:
        risk_factors.append("Negative free cash flow")
    if metrics["ccc"] > 180:
        risk_factors.append("Extended cash conversion cycle")

    return UnderwritingOutput(
        company_name=request.company_name,
        analysis_date=datetime.now().strftime("%Y-%m-%d"),
        loan_type=request.loan_type.value,
        recommended_loan_amount=round(base_loan, 0),
        recommended_rate=round(recommended_rate, 2),
        term_months=request.loan_term_months,
        leverage_metrics={
            "total_debt": metrics["total_debt"],
            "net_debt": metrics["net_debt"],
            "debt_to_ebitda": metrics["debt_to_ebitda"],
            "net_debt_to_ebitda": metrics["net_debt_to_ebitda"]
        },
        coverage_metrics={
            "interest_coverage": metrics["interest_coverage"],
            "debt_service_coverage": metrics["debt_service_coverage"]
        },
        liquidity_metrics={
            "current_ratio": metrics["current_ratio"],
            "cash": request.financial_inputs.cash
        },
        profitability_metrics={
            "gross_margin": metrics["gross_margin"],
            "ebitda": metrics["ebitda"],
            "ebitda_margin": metrics["ebitda_margin"],
            "net_income": metrics["net_income"],
            "net_margin": metrics["net_margin"]
        },
        cashflow_metrics={
            "fcf": metrics["fcf"],
            "ocf": metrics["ocf"],
            "capex": request.financial_inputs.capex
        },
        covenant_recommendations=covenants,
        lender_grade=grade,
        approval_recommendation=generate_recommendation(metrics, grade, base_loan),
        risk_factors=risk_factors,
        deal_summary=f"{grade}-rated credit to {request.company_name}. {request.loan_type.value.replace('_', ' ').title()} of ${base_loan:,.0f} at {recommended_rate:.2f}% over {request.loan_term_months} months."
    )


@app.post("/calculate-metrics")
async def calculate_metrics_endpoint(inputs: FinancialInputs):
    """Calculate metrics from financial inputs only."""
    metrics = calculate_metrics(inputs)
    return {"metrics": metrics}


@app.post("/leverage-analysis")
async def leverage_analysis(ebitda: float, total_debt: float, cash: float = 0):
    """Quick leverage analysis."""
    net_debt = total_debt - cash
    return {
        "ebitda": ebitda,
        "total_debt": total_debt,
        "net_debt": net_debt,
        "debt_to_ebitda": round(total_debt / ebitda, 2) if ebitda > 0 else 0,
        "net_debt_to_ebitda": round(net_debt / ebitda, 2) if ebitda > 0 else 0,
        "implied_grade": "AAA" if net_debt / ebitda < 1 else "AA" if net_debt / ebitda < 2 else "A" if net_debt / ebitda < 3 else "BBB" if net_debt / ebitda < 4 else "BB" if net_debt / ebitda < 5 else "B"
    }


@app.post("/coverage-analysis")
async def coverage_analysis(ebit: float, interest_expense: float):
    """Quick coverage ratio analysis."""
    interest_coverage = ebit / interest_expense if interest_expense > 0 else 0
    return {
        "ebit": ebit,
        "interest_expense": interest_expense,
        "interest_coverage": round(interest_coverage, 2),
        "implied_stress_level": "LOW" if interest_coverage > 4 else "MEDIUM" if interest_coverage > 2 else "HIGH"
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5281)
