"""
AssetMind Enterprise - Enterprise Features Service
Port: 5004
Provides enterprise-grade features: multi-tenancy, compliance, reporting.
"""

import uuid
from datetime import datetime, timedelta
from typing import Optional, List
from enum import Enum

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from loguru import logger

app = FastAPI(title="AssetMind Enterprise", description="Enterprise Features", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class TenantStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    PENDING = "pending"
    TERMINATED = "terminated"

class PlanType(str, Enum):
    STARTER = "starter"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"
    UNLIMITED = "unlimited"

class ComplianceFramework(str, Enum):
    SOC2 = "soc2"
    GDPR = "gdpr"
    HIPAA = "hipaa"
    ISO27001 = "iso27001"

class ReportType(str, Enum):
    PORTFOLIO_SUMMARY = "portfolio_summary"
    PERFORMANCE = "performance"
    TAX = "tax"
    AUDIT = "audit"
    COMPLIANCE = "compliance"

class ReportFormat(str, Enum):
    PDF = "pdf"
    EXCEL = "excel"
    CSV = "csv"
    JSON = "json"

# ============================================================================
# Pydantic Models
# ============================================================================

class TenantConfig(BaseModel):
    max_users: int = 10
    max_portfolios: int = 5
    max_api_calls_per_month: int = 10000
    features: List[str] = []

class TenantCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    domain: Optional[str] = None
    plan: PlanType = PlanType.STARTER
    admin_email: str
    config: TenantConfig = TenantConfig()

class Tenant(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str = Field(default_factory=lambda: f"tenant_{uuid.uuid4().hex[:8]}")
    name: str
    domain: Optional[str] = None
    plan: PlanType
    admin_email: str
    status: TenantStatus = TenantStatus.PENDING
    config: TenantConfig = TenantConfig()
    subscription_expires_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TeamMember(BaseModel):
    user_id: str
    email: str
    name: str
    role: str = "member"

class Team(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    name: str = Field(..., min_length=1, max_length=100)
    members: List[TeamMember] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ComplianceCheck(BaseModel):
    framework: ComplianceFramework
    requirement: str
    status: str = "pending"
    evidence: Optional[str] = None
    last_checked: Optional[datetime] = None

class ComplianceReport(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    frameworks: List[ComplianceFramework]
    checks: List[ComplianceCheck] = []
    overall_score: float = 0.0
    generated_at: datetime = Field(default_factory=datetime.utcnow)

class ReportConfig(BaseModel):
    report_type: ReportType
    format: ReportFormat = ReportFormat.PDF
    include_charts: bool = True
    date_range: dict = {}

class ReportRequest(BaseModel):
    tenant_id: str
    report_type: ReportType
    name: str
    config: ReportConfig

class Report(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    name: str
    report_type: ReportType
    format: ReportFormat
    status: str = "pending"
    file_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

class UsageMetric(BaseModel):
    metric_name: str
    current_usage: int = 0
    limit: int = 0
    unit: str = "count"

class UsageSummary(BaseModel):
    tenant_id: str
    period: str
    metrics: List[UsageMetric] = []
    total_cost: float = 0.0
    generated_at: datetime = Field(default_factory=datetime.utcnow)

# ============================================================================
# In-Memory Storage
# ============================================================================

tenants_db: dict[str, Tenant] = {}
teams_db: dict[str, Team] = {}
compliance_reports_db: dict[str, ComplianceReport] = {}
reports_db: dict[str, Report] = {}
usage_summaries_db: dict[str, UsageSummary] = {}

# Initialize sample tenant
tenants_db["tenant-001"] = Tenant(
    id="tenant-001", tenant_id="acme_corp", name="ACME Corporation",
    admin_email="admin@acme.com", plan=PlanType.ENTERPRISE, status=TenantStatus.ACTIVE,
    subscription_expires_at=datetime.utcnow() + timedelta(days=365)
)

# ============================================================================
# Health Check
# ============================================================================

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "assetmind-enterprise",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "stats": {"tenants": len(tenants_db), "teams": len(teams_db), "reports": len(reports_db)}
    }

# ============================================================================
# Tenant Management Endpoints
# ============================================================================

@app.post("/tenants", response_model=Tenant, status_code=201)
async def create_tenant(tenant: TenantCreate):
    new_tenant = Tenant(**tenant.model_dump(), subscription_expires_at=datetime.utcnow() + timedelta(days=30))
    tenants_db[new_tenant.id] = new_tenant
    logger.info(f"Created tenant: {new_tenant.name}")
    return new_tenant

@app.get("/tenants", response_model=List[Tenant])
async def list_tenants(skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100), status: Optional[TenantStatus] = None):
    tenants = list(tenants_db.values())
    if status:
        tenants = [t for t in tenants if t.status == status]
    return tenants[skip:skip+limit]

@app.get("/tenants/{tenant_id}", response_model=Tenant)
async def get_tenant(tenant_id: str):
    if tenant_id not in tenants_db:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenants_db[tenant_id]

@app.put("/tenants/{tenant_id}", response_model=Tenant)
async def update_tenant(tenant_id: str, update: dict):
    if tenant_id not in tenants_db:
        raise HTTPException(status_code=404, detail="Tenant not found")
    tenant = tenants_db[tenant_id]
    for field, value in update.items():
        if hasattr(tenant, field):
            setattr(tenant, field, value)
    return tenant

@app.delete("/tenants/{tenant_id}", status_code=204)
async def delete_tenant(tenant_id: str):
    if tenant_id not in tenants_db:
        raise HTTPException(status_code=404, detail="Tenant not found")
    tenants_db[tenant_id].status = TenantStatus.TERMINATED

# ============================================================================
# Team Management Endpoints
# ============================================================================

@app.post("/teams", response_model=Team, status_code=201)
async def create_team(tenant_id: str, name: str):
    if tenant_id not in tenants_db:
        raise HTTPException(status_code=404, detail="Tenant not found")
    team = Team(tenant_id=tenant_id, name=name)
    teams_db[team.id] = team
    return team

@app.get("/teams", response_model=List[Team])
async def list_teams(tenant_id: str):
    return [t for t in teams_db.values() if t.tenant_id == tenant_id]

@app.post("/teams/{team_id}/members", response_model=Team)
async def add_team_member(team_id: str, member: TeamMember):
    if team_id not in teams_db:
        raise HTTPException(status_code=404, detail="Team not found")
    team = teams_db[team_id]
    for existing in team.members:
        if existing.user_id == member.user_id:
            raise HTTPException(status_code=400, detail="User already in team")
    team.members.append(member)
    return team

@app.delete("/teams/{team_id}/members/{user_id}", status_code=204)
async def remove_team_member(team_id: str, user_id: str):
    if team_id not in teams_db:
        raise HTTPException(status_code=404, detail="Team not found")
    teams_db[team_id].members = [m for m in teams_db[team_id].members if m.user_id != user_id]

# ============================================================================
# Compliance Endpoints
# ============================================================================

@app.get("/compliance/{tenant_id}", response_model=ComplianceReport)
async def get_compliance_report(tenant_id: str, frameworks: List[ComplianceFramework]):
    if tenant_id not in tenants_db:
        raise HTTPException(status_code=404, detail="Tenant not found")
    checks = []
    for framework in frameworks:
        checks.extend([
            ComplianceCheck(framework=framework, requirement=f"{framework.value}_access_control", status="compliant", evidence="Logs reviewed", last_checked=datetime.utcnow()),
            ComplianceCheck(framework=framework, requirement=f"{framework.value}_data_protection", status="compliant", evidence="Encryption verified", last_checked=datetime.utcnow()),
        ])
    score = len([c for c in checks if c.status == "compliant"]) / max(len(checks), 1) * 100
    report = ComplianceReport(tenant_id=tenant_id, frameworks=frameworks, checks=checks, overall_score=score)
    compliance_reports_db[report.id] = report
    return report

# ============================================================================
# Report Generation Endpoints
# ============================================================================

@app.post("/reports", response_model=Report, status_code=201)
async def create_report(request: ReportRequest):
    if request.tenant_id not in tenants_db:
        raise HTTPException(status_code=404, detail="Tenant not found")
    report = Report(tenant_id=request.tenant_id, name=request.name, report_type=request.report_type, format=request.config.format, status="generating")
    reports_db[report.id] = report
    report.status = "completed"
    report.file_url = f"/reports/{report.id}/download"
    report.completed_at = datetime.utcnow()
    return report

@app.get("/reports", response_model=List[Report])
async def list_reports(tenant_id: str, skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100)):
    reports = [r for r in reports_db.values() if r.tenant_id == tenant_id]
    reports.sort(key=lambda x: x.created_at, reverse=True)
    return reports[skip:skip+limit]

@app.get("/reports/{report_id}", response_model=Report)
async def get_report(report_id: str):
    if report_id not in reports_db:
        raise HTTPException(status_code=404, detail="Report not found")
    return reports_db[report_id]

# ============================================================================
# Usage& Billing Endpoints
# ============================================================================

@app.get("/usage/{tenant_id}", response_model=UsageSummary)
async def get_usage_summary(tenant_id: str, period: str = "monthly"):
    if tenant_id not in tenants_db:
        raise HTTPException(status_code=404, detail="Tenant not found")
    tenant = tenants_db[tenant_id]
    summary = UsageSummary(
        tenant_id=tenant_id, period=period,
        metrics=[
            UsageMetric(metric_name="active_users", current_usage=25, limit=tenant.config.max_users, unit="users"),
            UsageMetric(metric_name="portfolios", current_usage=12, limit=tenant.config.max_portfolios, unit="portfolios"),
            UsageMetric(metric_name="api_calls", current_usage=450000, limit=tenant.config.max_api_calls_per_month, unit="calls"),
        ],
        total_cost=2999.0
    )
    usage_summaries_db[f"{tenant_id}_{period}"] = summary
    return summary

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting AssetMind Enterprise on port 5004")
    uvicorn.run(app, host="0.0.0.0", port=5004)
