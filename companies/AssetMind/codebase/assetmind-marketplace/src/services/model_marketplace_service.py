"""
Model Marketplace Service
AI/ML models marketplace
Port: 5232
"""

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from datetime import datetime
from enum import Enum
import logging
import random

logger = logging.getLogger(__name__)

app = FastAPI(title="AssetMind Model Marketplace", version="1.0.0", docs_url="/docs")


class ModelType(str, Enum):
    PRICE_PREDICTION = "price_prediction"
    SENTIMENT = "sentiment"
    PATTERN_RECOGNITION = "pattern_recognition"
    RISK_ASSESSMENT = "risk_assessment"
    VOLATILITY = "volatility"
    CLASSIFICATION = "classification"


class AIModel(BaseModel):
    model_id: str
    name: str
    description: str
    model_type: ModelType
    accuracy: float
    precision: float
    recall: float
    developer: str
    developer_id: str
    price: float
    license_type: str  # personal, commercial, enterprise
    framework: str  # pytorch, tensorflow, sklearn
    deployment_options: List[str]
    rating: float = Field(0, ge=0, le=5)
    review_count: int = 0
    download_count: int = 0
    created_at: datetime
    version: str


class ModelMarketplaceService:
    """AI/ML models marketplace"""

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.name = "Model Marketplace"
        self.port = 5232
        self.version = "1.0.0"
        self._models: Dict[str, AIModel] = {}
        self._initialize_data()

    def _initialize_data(self):
        """Initialize with sample models"""
        models = [
            {"name": "LSTM Price Predictor", "type": ModelType.PRICE_PREDICTION, "accuracy": 0.87, "price": 199.99, "dev": "ML Labs"},
            {"name": "FinBERT Sentiment", "type": ModelType.SENTIMENT, "accuracy": 0.92, "price": 149.99, "dev": "NLP Corp"},
            {"name": "Chart Pattern CNN", "type": ModelType.PATTERN_RECOGNITION, "accuracy": 0.85, "price": 249.99, "dev": "Vision AI"},
            {"name": "Risk Score Model", "type": ModelType.RISK_ASSESSMENT, "accuracy": 0.89, "price": 179.99, "dev": "Risk Analytics"},
            {"name": "GARCH Volatility", "type": ModelType.VOLATILITY, "accuracy": 0.82, "price": 129.99, "dev": "Quant Tools"}
        ]

        for i, m in enumerate(models):
            model_id = f"model_{i+1}"
            self._models[model_id] = AIModel(
                model_id=model_id,
                name=m["name"],
                description=f"Advanced {m['type'].value.replace('_', ' ')} model",
                model_type=m["type"],
                accuracy=m["accuracy"],
                precision=round(m["accuracy"] * random.uniform(0.95, 1.0), 3),
                recall=round(m["accuracy"] * random.uniform(0.90, 0.98), 3),
                developer=m["dev"],
                developer_id=f"dev_{i+1}",
                price=m["price"],
                license_type="commercial",
                framework=random.choice(["pytorch", "tensorflow", "sklearn"]),
                deployment_options=["cloud", "on-premise", "edge"],
                rating=round(random.uniform(4.2, 5.0), 1),
                review_count=random.randint(10, 80),
                download_count=random.randint(50, 500),
                created_at=datetime.utcnow(),
                version="1.0.0"
            )

    async def get_models(
        self,
        model_type: Optional[ModelType] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        sort_by: str = "downloads",
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get models with filtering"""
        models = list(self._models.values())

        if model_type:
            models = [m for m in models if m.model_type == model_type]
        if min_price is not None:
            models = [m for m in models if m.price >= min_price]
        if max_price is not None:
            models = [m for m in models if m.price <= max_price]

        if sort_by == "accuracy":
            models = sorted(models, key=lambda x: x.accuracy, reverse=True)
        elif sort_by == "price":
            models = sorted(models, key=lambda x: x.price)
        elif sort_by == "rating":
            models = sorted(models, key=lambda x: x.rating, reverse=True)
        else:
            models = sorted(models, key=lambda x: x.download_count, reverse=True)

        return [
            {
                "model_id": m.model_id,
                "name": m.name,
                "description": m.description,
                "model_type": m.model_type.value,
                "accuracy": m.accuracy,
                "developer": m.developer,
                "price": m.price,
                "license_type": m.license_type,
                "framework": m.framework,
                "rating": m.rating,
                "download_count": m.download_count
            }
            for m in models[:limit]
        ]

    async def get_model(self, model_id: str) -> Optional[Dict[str, Any]]:
        """Get model by ID"""
        model = self._models.get(model_id)
        if not model:
            return None

        return {
            "model_id": model.model_id,
            "name": model.name,
            "description": model.description,
            "model_type": model.model_type.value,
            "accuracy": model.accuracy,
            "precision": model.precision,
            "recall": model.recall,
            "developer": model.developer,
            "price": model.price,
            "license_type": model.license_type,
            "framework": model.framework,
            "deployment_options": model.deployment_options,
            "rating": model.rating,
            "review_count": model.review_count,
            "download_count": model.download_count,
            "version": model.version
        }


service = ModelMarketplaceService()


@app.get("/health")
async def health():
    return {"status": "healthy", "service": service.name, "port": service.port, "version": service.version}


@app.get("/api/v1/models")
async def get_models(
    model_type: ModelType = Query(None),
    sort_by: str = Query("downloads"),
    limit: int = Query(50, le=100)
):
    return await service.get_models(model_type, sort_by=sort_by, limit=limit)


@app.get("/api/v1/models/{model_id}")
async def get_model(model_id: str):
    model = await service.get_model(model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return model


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5232)