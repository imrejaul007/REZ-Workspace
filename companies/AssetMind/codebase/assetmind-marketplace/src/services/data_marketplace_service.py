"""
Data Marketplace Service
Market data and datasets marketplace
Port: 5234
"""

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from datetime import datetime
from enum import Enum
import logging
import random

logger = logging.getLogger(__name__)

app = FastAPI(title="AssetMind Data Marketplace", version="1.0.0", docs_url="/docs")


class DataType(str, Enum):
    PRICE_HISTORY = "price_history"
    FUNDAMENTAL = "fundamental"
    ALTERNATIVE = "alternative"
    NEWS = "news"
    SOCIAL = "social"
    OPTIONS = "options"
    CRYPTO = "crypto"


class DataAsset(BaseModel):
    dataset_id: str
    name: str
    description: str
    data_type: DataType
    symbols: List[str]
    date_range: str
    frequency: str  # minute, hourly, daily, weekly
    provider: str
    provider_id: str
    price: float
    file_size: str
    row_count: int
    quality_score: float
    rating: float = Field(0, ge=0, le=5)
    review_count: int = 0
    download_count: int = 0
    created_at: datetime


class DataMarketplaceService:
    """Market data and datasets marketplace"""

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.name = "Data Marketplace"
        self.port = 5234
        self.version = "1.0.0"
        self._datasets: Dict[str, DataAsset] = {}
        self._initialize_data()

    def _initialize_data(self):
        """Initialize with sample datasets"""
        datasets = [
            {"name": "5-Year Stock Prices", "type": DataType.PRICE_HISTORY, "provider": "DataHub Pro", "price": 49.99, "rows": 5000000},
            {"name": "Company Fundamentals", "type": DataType.FUNDAMENTAL, "provider": "FundData", "price": 79.99, "rows": 500000},
            {"name": "Satellite Imagery", "type": DataType.ALTERNATIVE, "provider": "AltData Co", "price": 199.99, "rows": 100000},
            {"name": "Financial News Archive", "type": DataType.NEWS, "provider": "NewsAPI", "price": 29.99, "rows": 2000000},
            {"name": "Social Sentiment Data", "type": DataType.SOCIAL, "provider": "SocialPulse", "price": 99.99, "rows": 10000000},
            {"name": "Options Chain Data", "type": DataType.OPTIONS, "provider": "OptionsFlow", "price": 149.99, "rows": 8000000}
        ]

        for i, d in enumerate(datasets):
            dataset_id = f"dataset_{i+1}"
            self._datasets[dataset_id] = DataAsset(
                dataset_id=dataset_id,
                name=d["name"],
                description=f"Comprehensive {d['type'].value.replace('_', ' ')} dataset",
                data_type=d["type"],
                symbols=["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA"][:random.randint(3, 6)],
                date_range="2020-01-01 to 2024-12-31",
                frequency="daily",
                provider=d["provider"],
                provider_id=f"provider_{i+1}",
                price=d["price"],
                file_size=f"{random.randint(1, 50)}GB",
                row_count=d["rows"],
                quality_score=round(random.uniform(0.85, 0.99), 2),
                rating=round(random.uniform(4.0, 5.0), 1),
                review_count=random.randint(10, 100),
                download_count=random.randint(50, 500),
                created_at=datetime.utcnow()
            )

    async def get_datasets(
        self,
        data_type: Optional[DataType] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        sort_by: str = "downloads",
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get datasets with filtering"""
        datasets = list(self._datasets.values())

        if data_type:
            datasets = [d for d in datasets if d.data_type == data_type]
        if min_price is not None:
            datasets = [d for d in datasets if d.price >= min_price]
        if max_price is not None:
            datasets = [d for d in datasets if d.price <= max_price]

        if sort_by == "price":
            datasets = sorted(datasets, key=lambda x: x.price)
        elif sort_by == "quality":
            datasets = sorted(datasets, key=lambda x: x.quality_score, reverse=True)
        elif sort_by == "rating":
            datasets = sorted(datasets, key=lambda x: x.rating, reverse=True)
        else:
            datasets = sorted(datasets, key=lambda x: x.download_count, reverse=True)

        return [
            {
                "dataset_id": d.dataset_id,
                "name": d.name,
                "description": d.description,
                "data_type": d.data_type.value,
                "symbols": d.symbols,
                "date_range": d.date_range,
                "frequency": d.frequency,
                "provider": d.provider,
                "price": d.price,
                "file_size": d.file_size,
                "row_count": d.row_count,
                "quality_score": d.quality_score,
                "rating": d.rating,
                "download_count": d.download_count
            }
            for d in datasets[:limit]
        ]

    async def get_dataset(self, dataset_id: str) -> Optional[Dict[str, Any]]:
        """Get dataset by ID"""
        dataset = self._datasets.get(dataset_id)
        if not dataset:
            return None

        return {
            "dataset_id": dataset.dataset_id,
            "name": dataset.name,
            "description": dataset.description,
            "data_type": dataset.data_type.value,
            "symbols": dataset.symbols,
            "date_range": dataset.date_range,
            "frequency": dataset.frequency,
            "provider": dataset.provider,
            "price": dataset.price,
            "file_size": dataset.file_size,
            "row_count": dataset.row_count,
            "quality_score": dataset.quality_score,
            "rating": dataset.rating,
            "review_count": dataset.review_count,
            "download_count": dataset.download_count
        }


service = DataMarketplaceService()


@app.get("/health")
async def health():
    return {"status": "healthy", "service": service.name, "port": service.port, "version": service.version}


@app.get("/api/v1/datasets")
async def get_datasets(
    data_type: DataType = Query(None),
    sort_by: str = Query("downloads"),
    limit: int = Query(50, le=100)
):
    return await service.get_datasets(data_type, sort_by=sort_by, limit=limit)


@app.get("/api/v1/datasets/{dataset_id}")
async def get_dataset(dataset_id: str):
    dataset = await service.get_dataset(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5234)