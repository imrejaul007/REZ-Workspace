"""
AssetMind Report Generator Service
Report generation and analytics
Port: 5215
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from enum import Enum
from io import BytesIO
import logging
import json
import uuid

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AssetMind Report Generator",
    description="Financial report generation and analytics service",
    version="1.0.0",
    docs_url="/docs"
)


class ReportType(str, Enum):
    PORTFOLIO_SUMMARY = "portfolio_summary"
    PERFORMANCE = "performance"
    RISK_ANALYSIS = "risk_analysis"
    TAX_REPORT = "tax_report"
    TRADE_HISTORY = "trade_history"
    ASSET_ALLOCATION = "asset_allocation"
    INCOME_STATEMENT = "income_statement"
    BALANCE_SHEET = "balance_sheet"
    CASH_FLOW = "cash_flow"
    CUSTOM = "custom"


class ReportFormat(str, Enum):
    PDF = "pdf"
    EXCEL = "excel"
    CSV = "csv"
    JSON = "json"
    HTML = "html"


class ReportStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ReportRequest(BaseModel):
    report_type: ReportType
    format: ReportFormat = ReportFormat.PDF
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    filters: Dict[str, Any] = Field(default_factory=dict)
    include_charts: bool = True
    include_summary: bool = True
    user_id: Optional[str] = None


class ReportMetadata(BaseModel):
    report_id: str
    report_type: ReportType
    format: ReportFormat
    title: str
    description: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    status: ReportStatus
    file_size: Optional[int] = None
    download_url: Optional[str] = None
    error_message: Optional[str] = None


class ReportSection(BaseModel):
    section_id: str
    title: str
    content: str
    data: Optional[Dict[str, Any]] = None
    charts: List[Dict[str, Any]] = Field(default_factory=list)
    tables: List[Dict[str, Any]] = Field(default_factory=list)


class GeneratedReport(BaseModel):
    report_id: str
    metadata: ReportMetadata
    sections: List[ReportSection]
    summary: Dict[str, Any]
    charts: List[Dict[str, Any]] = Field(default_factory=list)


class ScheduledReport(BaseModel):
    schedule_id: str
    user_id: str
    report_type: ReportType
    frequency: str
    recipients: List[str]
    enabled: bool = True
    next_run: datetime
    last_run: Optional[datetime] = None


class TemplateConfig(BaseModel):
    template_id: str
    name: str
    description: str
    sections: List[str]
    default_format: ReportFormat
    is_custom: bool = False


class ReportGeneratorService:
    """Report generation and analytics service"""

    def __init__(self):
        self.name = "Report Generator"
        self.port = 5215
        self.version = "1.0.0"
        self._reports_db: Dict[str, ReportMetadata] = {}
        self._scheduled_reports: Dict[str, ScheduledReport] = {}
        self._templates: Dict[str, TemplateConfig] = {}
        self._report_count = 0

    def _generate_id(self) -> str:
        """Generate unique ID"""
        self._report_count += 1
        return f"report_{datetime.utcnow().timestamp()}_{self._report_count}"

    def _generate_mock_data(self, report_type: ReportType) -> Dict[str, Any]:
        """Generate mock data for reports"""
        base_data = {
            "period": {
                "start": datetime.utcnow() - timedelta(days=90),
                "end": datetime.utcnow(),
            },
            "summary": {
                "total_value": 125000.00,
                "net_change": 12500.00,
                "net_change_pct": 11.1,
                "total_trades": 45,
                "winning_trades": 28,
                "losing_trades": 17,
            },
            "performance": {
                "ytd_return": 15.2,
                "1y_return": 22.5,
                "3y_return": 58.3,
                "sharpe_ratio": 1.45,
                "volatility": 12.5,
                "max_drawdown": -8.2,
            },
            "holdings": [
                {"symbol": "AAPL", "shares": 100, "avg_cost": 150.00, "current_price": 178.50, "value": 17850.00, "gain": 2850.00, "gain_pct": 19.0},
                {"symbol": "MSFT", "shares": 50, "avg_cost": 380.00, "current_price": 415.20, "value": 20760.00, "gain": 1760.00, "gain_pct": 9.26},
                {"symbol": "GOOGL", "shares": 75, "avg_cost": 125.00, "current_price": 142.80, "value": 10710.00, "gain": 1335.00, "gain_pct": 14.24},
                {"symbol": "AMZN", "shares": 60, "avg_cost": 165.00, "current_price": 185.60, "value": 11136.00, "gain": 1236.00, "gain_pct": 12.48},
                {"symbol": "NVDA", "shares": 25, "avg_cost": 650.00, "current_price": 875.30, "value": 21882.50, "gain": 5632.50, "gain_pct": 34.66},
            ],
            "transactions": [
                {"date": "2024-01-15", "type": "BUY", "symbol": "AAPL", "shares": 25, "price": 175.00, "total": 4375.00},
                {"date": "2024-01-22", "type": "BUY", "symbol": "NVDA", "shares": 10, "price": 820.00, "total": 8200.00},
                {"date": "2024-02-01", "type": "SELL", "symbol": "META", "shares": 15, "price": 480.00, "total": 7200.00},
            ],
        }
        return base_data

    async def create_report(
        self,
        user_id: str,
        request: ReportRequest
    ) -> ReportMetadata:
        """Create a new report request"""
        report_id = self._generate_id()

        metadata = ReportMetadata(
            report_id=report_id,
            report_type=request.report_type,
            format=request.format,
            title=f"{request.report_type.value.replace('_', ' ').title()} Report",
            description=f"Auto-generated {request.report_type.value} report for {user_id}",
            created_at=datetime.utcnow(),
            status=ReportStatus.PENDING,
        )

        self._reports_db[report_id] = metadata
        return metadata

    async def process_report(self, report_id: str, request: ReportRequest):
        """Background task to process report"""
        metadata = self._reports_db.get(report_id)
        if not metadata:
            return

        metadata.status = ReportStatus.PROCESSING
        self._reports_db[report_id] = metadata

        # Simulate processing
        import asyncio
        await asyncio.sleep(1)

        metadata.status = ReportStatus.COMPLETED
        metadata.completed_at = datetime.utcnow()
        metadata.download_url = f"/api/v1/reports/{report_id}/download"
        metadata.file_size = 1024 * 250
        self._reports_db[report_id] = metadata

    async def get_report(self, report_id: str) -> Optional[ReportMetadata]:
        """Get report by ID"""
        return self._reports_db.get(report_id)

    async def generate_report_preview(self, report_id: str) -> GeneratedReport:
        """Generate report preview"""
        metadata = self._reports_db.get(report_id)
        if not metadata:
            raise ValueError(f"Report not found: {report_id}")

        report_data = self._generate_mock_data(metadata.report_type)

        sections = [
            ReportSection(
                section_id="summary",
                title="Executive Summary",
                content="Portfolio performance overview for the reporting period.",
                data=report_data.get("summary", {}),
            ),
            ReportSection(
                section_id="performance",
                title="Performance Metrics",
                content="Detailed performance analysis including returns and risk metrics.",
                data=report_data.get("performance", {}),
            ),
            ReportSection(
                section_id="holdings",
                title="Holdings Detail",
                content="Current portfolio holdings with cost basis and gains.",
                tables=[{
                    "headers": ["Symbol", "Shares", "Value", "Gain"],
                    "rows": [[h["symbol"], h["shares"], h["value"], h["gain"]] for h in report_data.get("holdings", [])]
                }],
            ),
        ]

        return GeneratedReport(
            report_id=report_id,
            metadata=metadata,
            sections=sections,
            summary=report_data.get("summary", {}),
            charts=[],
        )

    async def get_user_reports(
        self,
        user_id: str,
        status: Optional[ReportStatus] = None,
        limit: int = 20
    ) -> List[ReportMetadata]:
        """Get user's reports"""
        reports = [
            r for r in self._reports_db.values()
            if r.description and user_id in r.description
        ]
        if status:
            reports = [r for r in reports if r.status == status]
        return reports[:limit]

    async def create_scheduled_report(
        self,
        user_id: str,
        report_type: ReportType,
        frequency: str,
        recipients: List[str]
    ) -> ScheduledReport:
        """Create scheduled report"""
        schedule_id = str(uuid.uuid4())

        schedule = ScheduledReport(
            schedule_id=schedule_id,
            user_id=user_id,
            report_type=report_type,
            frequency=frequency,
            recipients=recipients,
            enabled=True,
            next_run=datetime.utcnow() + timedelta(days=1)
        )

        self._scheduled_reports[schedule_id] = schedule
        return schedule

    async def get_templates(self) -> List[TemplateConfig]:
        """Get available report templates"""
        return [
            TemplateConfig(
                template_id="portfolio_monthly",
                name="Monthly Portfolio Summary",
                description="Standard monthly portfolio performance report",
                sections=["summary", "holdings", "performance", "transactions"],
                default_format=ReportFormat.PDF,
            ),
            TemplateConfig(
                template_id="annual_report",
                name="Annual Investment Report",
                description="Comprehensive annual investment performance report",
                sections=["summary", "performance", "holdings", "tax", "goals"],
                default_format=ReportFormat.PDF,
            ),
            TemplateConfig(
                template_id="risk_analysis",
                name="Risk Analysis Report",
                description="Detailed portfolio risk assessment",
                sections=["risk_metrics", "volatility", "correlation", "scenario"],
                default_format=ReportFormat.EXCEL,
            ),
            TemplateConfig(
                template_id="trade_history",
                name="Trade History Report",
                description="Detailed trade history with P&L analysis",
                sections=["trades", "pnl", "execution", "costs"],
                default_format=ReportFormat.EXCEL,
            ),
            TemplateConfig(
                template_id="tax_report",
                name="Tax Summary Report",
                description="Annual tax summary for reporting",
                sections=["realized_gains", "dividends", "fees", "estimated_tax"],
                default_format=ReportFormat.PDF,
            ),
        ]


service = ReportGeneratorService()


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": service.name,
        "version": service.version,
        "timestamp": datetime.utcnow().isoformat(),
        "reports_count": service._report_count
    }


@app.post("/api/v1/reports", response_model=ReportMetadata)
async def create_report(
    user_id: str,
    request: ReportRequest,
    background_tasks: BackgroundTasks
):
    """Create a new report request"""
    metadata = await service.create_report(user_id, request)
    background_tasks.add_task(service.process_report, metadata.report_id, request)
    return metadata


@app.get("/api/v1/reports/{report_id}")
async def get_report_status(report_id: str):
    """Get report status"""
    metadata = await service.get_report(report_id)
    if not metadata:
        raise HTTPException(status_code=404, detail="Report not found")
    return metadata


@app.get("/api/v1/reports/{report_id}/download")
async def download_report(
    report_id: str,
    format: ReportFormat = Query(default=ReportFormat.PDF)
):
    """Download generated report"""
    metadata = await service.get_report(report_id)
    if not metadata:
        raise HTTPException(status_code=404, detail="Report not found")

    if metadata.status != ReportStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Report not ready")

    content = json.dumps(service._generate_mock_data(metadata.report_type), indent=2, default=str)

    return StreamingResponse(
        BytesIO(content.encode()),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={report_id}.json"}
    )


@app.get("/api/v1/reports/{report_id}/preview")
async def preview_report(report_id: str):
    """Get report preview"""
    return await service.generate_report_preview(report_id)


@app.get("/api/v1/reports/user/{user_id}")
async def get_user_reports(
    user_id: str,
    status: Optional[ReportStatus] = None,
    limit: int = Query(default=20, le=100)
):
    """Get user's reports"""
    return await service.get_user_reports(user_id, status, limit)


@app.delete("/api/v1/reports/{report_id}")
async def delete_report(report_id: str):
    """Delete a report"""
    if report_id not in service._reports_db:
        raise HTTPException(status_code=404, detail="Report not found")
    del service._reports_db[report_id]
    return {"report_id": report_id, "deleted": True}


@app.get("/api/v1/templates")
async def get_templates():
    """Get available report templates"""
    return await service.get_templates()


@app.post("/api/v1/scheduled-reports")
async def create_scheduled_report(
    user_id: str,
    report_type: ReportType,
    frequency: str,
    recipients: List[str]
):
    """Create scheduled report"""
    return await service.create_scheduled_report(user_id, report_type, frequency, recipients)


@app.get("/api/v1/scheduled-reports/user/{user_id}")
async def get_scheduled_reports(user_id: str):
    """Get user's scheduled reports"""
    return [s for s in service._scheduled_reports.values() if s.user_id == user_id]


@app.put("/api/v1/scheduled-reports/{schedule_id}")
async def update_scheduled_report(schedule_id: str, enabled: bool):
    """Update scheduled report"""
    if schedule_id not in service._scheduled_reports:
        raise HTTPException(status_code=404, detail="Schedule not found")
    service._scheduled_reports[schedule_id].enabled = enabled
    return service._scheduled_reports[schedule_id]


@app.delete("/api/v1/scheduled-reports/{schedule_id}")
async def delete_scheduled_report(schedule_id: str):
    """Delete scheduled report"""
    if schedule_id not in service._scheduled_reports:
        raise HTTPException(status_code=404, detail="Schedule not found")
    del service._scheduled_reports[schedule_id]
    return {"schedule_id": schedule_id, "deleted": True}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5215)