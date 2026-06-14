"""
AssetMind Investment Memo Writer
Port: 5285

AI-powered investment memo generation for investment committees.
Creates professional, structured investment memos from analysis data.
"""

import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import json


app = FastAPI(title="AssetMind Investment Memo Writer", version="1.0.0")


class MemoType(str, Enum):
    IC_MEMO = "ic_memo"  # Investment Committee
    BOARD_MEMO = "board_memo"
    MANAGEMENT_MEMO = "management_memo"
    LENDER_MEMO = "lender_memo"
    INVESTOR_MEMO = "investor_memo"
    PARTNERSHIP_MEMO = "partnership_memo"


class InvestmentThesis(BaseModel):
    """Investment thesis and recommendation."""
    headline: str
    recommendation: str  # "APPROVE", "DECLINE", "CONDITIONAL APPROVAL"
    key_reasons: List[str]
    risks_to_overcome: List[str]
    expected_return: Optional[float] = None
    investment_period: Optional[str] = None


class CompanyOverview(BaseModel):
    """Company information."""
    name: str
    sector: str
    stage: str  # "early", "growth", "mature", "turnaround"
    headquarters: Optional[str] = None
    founded: Optional[int] = None
    employee_count: Optional[int] = None
    description: str


class FinancialHighlights(BaseModel):
    """Financial metrics summary."""
    revenue: float
    ebitda: float
    growth_rate: float
    margin: float
    debt: float
    valuation: Optional[float] = None


class RiskAssessment(BaseModel):
    """Risk factors assessment."""
    category: str
    risk_level: str  # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    description: str
    mitigation: Optional[str] = None


class DealStructure(BaseModel):
    """Deal terms and structure."""
    deal_type: str
    investment_amount: float
    ownership: Optional[float] = None
    entry_valuation: float
    investment_date: Optional[str] = None
    terms: Dict[str, Any]


class MemoRequest(BaseModel):
    memo_type: MemoType
    company: CompanyOverview
    investment_thesis: InvestmentThesis
    financials: Optional[FinancialHighlights] = None
    risks: List[RiskAssessment] = []
    deal_structure: Optional[DealStructure] = None
    additional_sections: Optional[Dict[str, str]] = None


class GeneratedMemo(BaseModel):
    """Complete investment memo."""
    memo_id: str
    title: str
    memo_type: str
    created_at: str
    sections: Dict[str, str]
    summary: str
    recommendation: str
    appendices: List[str]


def generate_ic_memo(request: MemoRequest) -> GeneratedMemo:
    """Generate Investment Committee memo."""

    sections = {}

    # Executive Summary
    exec_summary = f"""
INVESTMENT MEMORANDUM

Company: {request.company.name}
Sector: {request.company.sector}
Stage: {request.company.stage.title()}
Recommendation: {request.investment_thesis.recommendation}

EXECUTIVE SUMMARY

{request.investment_thesis.headline}

This memo presents an investment opportunity in {request.company.name}, a {request.company.sector} company at the {request.company.stage} stage.

KEY HIGHLIGHTS:
"""
    for reason in request.investment_thesis.key_reasons:
        exec_summary += f"- {reason}\n"

    if request.financials:
        exec_summary += f"""
FINANCIAL PROFILE:
- Revenue: ${request.financials.revenue:,.0f}
- EBITDA: ${request.financials.ebitda:,.0f}
- Growth Rate: {request.financials.growth_rate:.1f}%
- EBITDA Margin: {request.financials.margin:.1f}%
"""
        if request.financials.valuation:
            exec_summary += f"- Valuation: ${request.financials.valuation:,.0f}\n"

    sections["executive_summary"] = exec_summary.strip()

    # Company Overview
    company_overview = f"""
COMPANY OVERVIEW

Name: {request.company.name}
Sector: {request.company.sector}
Stage: {request.company.stage.title()}
"""
    if request.company.headquarters:
        company_overview += f"Headquarters: {request.company.headquarters}\n"
    if request.company.founded:
        company_overview += f"Founded: {request.company.founded}\n"
    if request.company.employee_count:
        company_overview += f"Employees: {request.company.employee_count:,}\n"

    company_overview += f"""
Description:
{request.company.description}
"""
    sections["company_overview"] = company_overview.strip()

    # Investment Thesis
    thesis = f"""
INVESTMENT THESIS

Recommendation: {request.investment_thesis.recommendation}

Investment Thesis:
{request.investment_thesis.headline}

Key Investment Reasons:
"""
    for i, reason in enumerate(request.investment_thesis.key_reasons, 1):
        thesis += f"{i}. {reason}\n"

    if request.investment_thesis.risks_to_overcome:
        thesis += """
Key Risks to Overcome:
"""
        for risk in request.investment_thesis.risks_to_overcome:
            thesis += f"- {risk}\n"

    if request.investment_thesis.expected_return:
        thesis += f"""
Expected Return: {request.investment_thesis.expected_return:.1f}%
"""
    if request.investment_thesis.investment_period:
        thesis += f"Investment Period: {request.investment_thesis.investment_period}\n"

    sections["investment_thesis"] = thesis.strip()

    # Financial Analysis
    if request.financials:
        financials = f"""
FINANCIAL ANALYSIS

Revenue Metrics:
- Total Revenue: ${request.financials.revenue:,.0f}
- YoY Growth: {request.financials.growth_rate:.1f}%
- EBITDA Margin: {request.financials.margin:.1f}%

Profitability:
- EBITDA: ${request.financials.ebitda:,.0f}

Capital Structure:
- Total Debt: ${request.financials.debt:,.0f}
"""
        if request.financials.valuation:
            financials += f"""
Valuation:
- Entry Valuation: ${request.financials.valuation:,.0f}
"""
        sections["financial_analysis"] = financials.strip()

    # Risk Assessment
    if request.risks:
        risks = """
RISK ASSESSMENT

"""
        risk_by_level = {}
        for risk in request.risks:
            if risk.risk_level not in risk_by_level:
                risk_by_level[risk.risk_level] = []
            risk_by_level[risk.risk_level].append(risk)

        for level in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]:
            if level in risk_by_level:
                risks += f"{level} RISKS:\n"
                for risk in risk_by_level[level]:
                    risks += f"- {risk.category}: {risk.description}\n"
                    if risk.mitigation:
                        risks += f"  Mitigation: {risk.mitigation}\n"
                risks += "\n"
        sections["risk_assessment"] = risks.strip()

    # Deal Structure
    if request.deal_structure:
        deal = f"""
DEAL STRUCTURE

Deal Type: {request.deal_structure.deal_type}
Investment Amount: ${request.deal_structure.investment_amount:,.0f}
Entry Valuation: ${request.deal_structure.entry_valuation:,.0f}
"""
        if request.deal_structure.ownership:
            deal += f"Ownership: {request.deal_structure.ownership:.1f}%\n"
        if request.deal_structure.investment_date:
            deal += f"Investment Date: {request.deal_structure.investment_date}\n"

        if request.deal_structure.terms:
            deal += """
Key Terms:
"""
            for key, value in request.deal_structure.terms.items():
                deal += f"- {key}: {value}\n"
        sections["deal_structure"] = deal.strip()

    # Recommendation
    recommendation = f"""
INVESTMENT COMMITTEE DECISION

RECOMMENDATION: {request.investment_thesis.recommendation}

{request.investment_thesis.headline}

Key Decision Factors:
"""
    for reason in request.investment_thesis.key_reasons[:3]:
        recommendation += f"✓ {reason}\n"

    if request.investment_thesis.risks_to_overcome:
        recommendation += """
Factors Requiring Monitoring:
"""
        for risk in request.investment_thesis.risks_to_overcome[:3]:
            recommendation += f"⚠ {risk}\n"

    recommendation += f"""
Expected Timeline: {request.investment_thesis.investment_period or 'To be determined'}

Prepared: {datetime.now().strftime('%Y-%m-%d')}
"""
    sections["recommendation"] = recommendation.strip()

    # Summary
    summary = f"""
INVESTMENT SUMMARY

Company: {request.company.name}
Sector: {request.company.sector}
Stage: {request.company.stage}
Recommendation: {request.investment_thesis.recommendation}

{request.investment_thesis.headline}

This investment opportunity has been analyzed and is recommended for {request.investment_thesis.recommendation} based on the above assessment.
"""

    memo = GeneratedMemo(
        memo_id=f"memo-{datetime.now().timestamp()}",
        title=f"Investment Memo: {request.company.name}",
        memo_type=request.memo_type.value,
        created_at=datetime.now().isoformat(),
        sections=sections,
        summary=summary,
        recommendation=request.investment_thesis.recommendation,
        appendices=["Financial Model", "Due Diligence Report", "Legal Review"]
    )

    return memo


def generate_board_memo(request: MemoRequest) -> GeneratedMemo:
    """Generate Board Memo format."""
    memo = generate_ic_memo(request)
    memo.memo_type = MemoType.BOARD_MEMO.value

    # Add board-specific sections
    board_sections = """
BOARD PRESENTATION

This memo is prepared for Board review and approval.

Key Governance Considerations:
- Investment alignment with strategic objectives
- Risk management framework
- Capital allocation impact
- ESG considerations
"""
    memo.sections["governance"] = board_sections.strip()

    return memo


def generate_lender_memo(request: MemoRequest) -> GeneratedMemo:
    """Generate Lender Memo format."""
    memo = generate_ic_memo(request)
    memo.memo_type = MemoType.LENDER_MEMO.value

    # Add lender-specific sections
    lender_sections = """
CREDIT ANALYSIS

Loan Structure:
- Principal Amount: ${request.deal_structure.investment_amount if request.deal_structure else 0:,.0f}
- Purpose: {request.deal_structure.deal_type if request.deal_structure else 'N/A'}
- Term: {request.investment_thesis.investment_period or 'Standard'}

Credit Metrics:
- Debt/EBITDA: {request.financials.debt/request.financials.ebitda if request.financials and request.financials.ebitda > 0 else 'N/A':.1f}x
- Interest Coverage: {request.financials.ebitda/request.financials.debt if request.financials and request.financials.debt > 0 else 'N/A':.1f}x

Covenant Recommendations:
- Maximum leverage threshold
- Minimum liquidity requirements
- Quarterly reporting obligations
"""
    memo.sections["credit_analysis"] = lender_sections.strip()

    return memo


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "memo-writer", "version": "1.0.0"}


@app.post("/generate", response_model=GeneratedMemo)
async def generate_memo(request: MemoRequest):
    """Generate an investment memo."""

    if request.memo_type == MemoType.IC_MEMO:
        return generate_ic_memo(request)
    elif request.memo_type == MemoType.BOARD_MEMO:
        return generate_board_memo(request)
    elif request.memo_type == MemoType.LENDER_MEMO:
        return generate_lender_memo(request)
    else:
        return generate_ic_memo(request)  # Default to IC memo


@app.get("/templates")
async def list_templates():
    """List available memo templates."""
    return {
        "templates": [
            {"type": "ic_memo", "name": "Investment Committee Memo", "description": "Standard IC memo format"},
            {"type": "board_memo", "name": "Board Memo", "description": "Board presentation format"},
            {"type": "lender_memo", "name": "Lender Memo", "description": "Credit analysis format"},
            {"type": "investor_memo", "name": "Investor Memo", "description": "LP/Investor format"},
        ]
    }


@app.post("/templates/{template_type}/preview")
async def preview_template(template_type: str):
    """Get template preview structure."""
    return {
        "template_type": template_type,
        "sections": [
            {"name": "executive_summary", "required": True},
            {"name": "company_overview", "required": True},
            {"name": "investment_thesis", "required": True},
            {"name": "financial_analysis", "required": False},
            {"name": "risk_assessment", "required": False},
            {"name": "deal_structure", "required": False},
            {"name": "recommendation", "required": True},
        ]
    }


@app.post("/summarize/{text:path}")
async def summarize_text(text: str, max_length: int = 500):
    """Summarize a block of text."""
    # Simple extractive summarization
    sentences = text.split(". ")
    if len(sentences) > 5:
        summary = ". ".join(sentences[:5]) + "."
    else:
        summary = text

    if len(summary) > max_length:
        summary = summary[:max_length] + "..."

    return {"summary": summary, "original_length": len(text)}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5285)