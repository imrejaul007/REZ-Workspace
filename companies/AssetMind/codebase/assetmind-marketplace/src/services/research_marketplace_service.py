"""
Research Marketplace Service
Research reports marketplace
Port: 5231
"""

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from datetime import datetime
from enum import Enum
import logging
import random

logger = logging.getLogger(__name__)

app = FastAPI(title="AssetMind Research Marketplace", version="1.0.0", docs_url="/docs")


class ReportType(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    SECTOR = "sector"
    COMPANY = "company"
    THEMATIC = "thematic"
    MACRO = "macro"


class Report(BaseModel):
    report_id: str
    title: str
    description: str
    report_type: ReportType
    sector: Optional[str]
    symbols: List[str] = Field(default_factory=list)
    author: str
    author_id: str
    price: float
    pages: int
    rating: float = Field(0, ge=0, le=5)
    review_count: int = 0
    download_count: int = 0
    tags: List[str] = Field(default_factory=list)
    published_at: datetime
    created_at: datetime


class ResearchMarketplaceService:
    """Research reports marketplace"""

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.name = "Research Marketplace"
        self.port = 5231
        self.version = "1.0.0"
        self._reports: Dict[str, Report] = {}
        self._initialize_data()

    def _initialize_data(self):
        """Initialize with sample reports"""
        reports = [
            {"title": "Tech Sector Weekly Outlook", "type": ReportType.WEEKLY, "sector": "Technology", "price": 29.99, "pages": 25},
            {"title": "Q4 Earnings Preview", "type": ReportType.QUARTERLY, "sector": "General", "price": 49.99, "pages": 45},
            {"title": "AI Industry Deep Dive", "type": ReportType.SECTOR, "sector": "Technology", "price": 79.99, "pages": 60},
            {"title": "NVDA Analysis Report", "type": ReportType.COMPANY, "sector": "Technology", "price": 19.99, "pages": 15},
            {"title": "Daily Market Summary", "type": ReportType.DAILY, "sector": "General", "price": 9.99, "pages": 5},
            {"title": "Green Energy Thematic Report", "type": ReportType.THEMATIC, "sector": "Energy", "price": 59.99, "pages": 40}
        ]

        for i, r in enumerate(reports):
            report_id = f"report_{i+1}"
            self._reports[report_id] = Report(
                report_id=report_id,
                title=r["title"],
                description=f"Comprehensive {r['type'].value} report on {r.get('sector', 'market')}",
                report_type=r["type"],
                sector=r.get("sector"),
                symbols=["AAPL", "MSFT", "GOOGL", "NVDA"][:random.randint(1, 3)],
                author=f"Author {i+1}",
                author_id=f"author_{i+1}",
                price=r["price"],
                pages=r["pages"],
                rating=round(random.uniform(4, 5), 1),
                review_count=random.randint(5, 50),
                download_count=random.randint(20, 200),
                tags=["featured", "premium"],
                published_at=datetime.utcnow(),
                created_at=datetime.utcnow()
            )

    async def get_reports(
        self,
        report_type: Optional[ReportType] = None,
        sector: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        sort_by: str = "downloads",
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get reports with filtering"""
        reports = list(self._reports.values())

        if report_type:
            reports = [r for r in reports if r.report_type == report_type]
        if sector:
            reports = [r for r in reports if r.sector == sector]
        if min_price is not None:
            reports = [r for r in reports if r.price >= min_price]
        if max_price is not None:
            reports = [r for r in reports if r.price <= max_price]

        if sort_by == "downloads":
            reports = sorted(reports, key=lambda x: x.download_count, reverse=True)
        elif sort_by == "price":
            reports = sorted(reports, key=lambda x: x.price)
        elif sort_by == "rating":
            reports = sorted(reports, key=lambda x: x.rating, reverse=True)
        else:
            reports = sorted(reports, key=lambda x: x.published_at, reverse=True)

        return [
            {
                "report_id": r.report_id,
                "title": r.title,
                "description": r.description,
                "report_type": r.report_type.value,
                "sector": r.sector,
                "price": r.price,
                "rating": r.rating,
                "review_count": r.review_count,
                "download_count": r.download_count,
                "published_at": r.published_at.isoformat()
            }
            for r in reports[:limit]
        ]

    async def get_report(self, report_id: str) -> Optional[Dict[str, Any]]:
        """Get report by ID"""
        report = self._reports.get(report_id)
        if not report:
            return None

        return {
            "report_id": report.report_id,
            "title": report.title,
            "description": report.description,
            "report_type": report.report_type.value,
            "sector": report.sector,
            "symbols": report.symbols,
            "author": report.author,
            "price": report.price,
            "pages": report.pages,
            "rating": report.rating,
            "review_count": report.review_count,
            "download_count": report.download_count,
            "tags": report.tags,
            "published_at": report.published_at.isoformat()
        }


service = ResearchMarketplaceService()


@app.get("/health")
async def health():
    return {"status": "healthy", "service": service.name, "port": service.port, "version": service.version}


@app.get("/api/v1/reports")
async def get_reports(
    report_type: ReportType = Query(None),
    sector: str = Query(None),
    sort_by: str = Query("downloads"),
    limit: int = Query(50, le=100)
):
    return await service.get_reports(report_type, sector, sort_by=sort_by, limit=limit)


@app.get("/api/v1/reports/{report_id}")
async def get_report(report_id: str):
    report = await service.get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5231)