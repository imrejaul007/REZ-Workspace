"""
AssetMind Integrations Service
Third-party service integrations for AssetMind
Port: 5015
"""

import logging
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import uuid4

from fastapi import APIRouter, FastAPI, HTTPException, Query
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("assetmind-integrations")


class IntegrationType(str, Enum):
    BROKER = "broker"
    DATA_PROVIDER = "data_provider"
    NOTIFICATION = "notification"
    WEBHOOK = "webhook"
    AI_SERVICE = "ai_service"


class IntegrationStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"
    PENDING = "pending"


class Integration(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    integration_type: IntegrationType
    provider: str
    status: IntegrationStatus = IntegrationStatus.PENDING
    api_key: Optional[str] = None
    api_secret: Optional[str] = None
    base_url: Optional[str] = None
    webhook_url: Optional[str] = None
    config: Dict[str, Any] = Field(default_factory=dict)
    last_sync: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class IntegrationCreate(BaseModel):
    name: str
    integration_type: IntegrationType
    provider: str
    api_key: Optional[str] = None
    api_secret: Optional[str] = None
    base_url: Optional[str] = None
    webhook_url: Optional[str] = None
    config: Dict[str, Any] = Field(default_factory=dict)


class IntegrationUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[IntegrationStatus] = None
    api_key: Optional[str] = None
    api_secret: Optional[str] = None
    base_url: Optional[str] = None
    webhook_url: Optional[str] = None
    config: Optional[Dict[str, Any]] = None


class WebhookEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    integration_id: str
    event_type: str
    payload: Dict[str, Any]
    status: str = "pending"
    attempts: int = 0
    last_attempt: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class WebhookCreate(BaseModel):
    integration_id: str
    event_type: str
    payload: Dict[str, Any]


class SyncResult(BaseModel):
    integration_id: str
    sync_type: str
    records_synced: int
    errors: List[str] = Field(default_factory=list)
    duration_ms: float
    status: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class HOJAIIntegration(BaseModel):
    gateway_url: str = os.getenv("HOJAI_GATEWAY", "http://localhost:4500")
    memory_url: str = os.getenv("HOJAI_MEMORY", "http://localhost:4520")
    agents_url: str = os.getenv("HOJAI_AGENTS", "http://localhost:4550")
    api_key: Optional[str] = None
    enabled_services: List[str] = Field(default_factory=list)


class RABTULIntegration(BaseModel):
    auth_url: str = os.getenv("RABTUL_AUTH_URL", "http://localhost:4002")
    payment_url: str = os.getenv("RABTUL_PAYMENT_URL", "http://localhost:4001")
    wallet_url: str = os.getenv("RABTUL_WALLET_URL", "http://localhost:4004")
    api_key: Optional[str] = None
    enabled_services: List[str] = Field(default_factory=list)


class IntegrationsState:
    def __init__(self):
        self.integrations: Dict[str, Integration] = {}
        self.webhooks: Dict[str, WebhookEvent] = {}
        self.sync_history: List[SyncResult] = []
        self.hojai_config = HOJAIIntegration()
        self.rabtul_config = RABTULIntegration()
        self.start_time = datetime.utcnow()

    def create_integration(self, request: IntegrationCreate) -> Integration:
        integration = Integration(name=request.name, integration_type=request.integration_type, provider=request.provider,
                                api_key=request.api_key, api_secret=request.api_secret, base_url=request.base_url,
                                webhook_url=request.webhook_url, config=request.config, status=IntegrationStatus.PENDING)
        self.integrations[integration.id] = integration
        logger.info(f"Created integration: {integration.id}")
        return integration

    def update_integration(self, integration_id: str, update: IntegrationUpdate) -> Optional[Integration]:
        integration = self.integrations.get(integration_id)
        if not integration:
            return None
        if update.name is not None:
            integration.name = update.name
        if update.status is not None:
            integration.status = update.status
        if update.api_key is not None:
            integration.api_key = update.api_key
        if update.api_secret is not None:
            integration.api_secret = update.api_secret
        if update.base_url is not None:
            integration.base_url = update.base_url
        if update.webhook_url is not None:
            integration.webhook_url = update.webhook_url
        if update.config is not None:
            integration.config.update(update.config)
        integration.updated_at = datetime.utcnow()
        return integration

    def activate_integration(self, integration_id: str) -> Optional[Integration]:
        integration = self.integrations.get(integration_id)
        if not integration:
            return None
        integration.status = IntegrationStatus.ACTIVE if (integration.api_key or integration.base_url) else IntegrationStatus.ERROR
        integration.updated_at = datetime.utcnow()
        logger.info(f"Activated integration: {integration_id}")
        return integration

    def create_webhook(self, request: WebhookCreate) -> WebhookEvent:
        webhook = WebhookEvent(integration_id=request.integration_id, event_type=request.event_type, payload=request.payload)
        self.webhooks[webhook.id] = webhook
        return webhook

    def get_available_providers(self, integration_type: IntegrationType) -> List[Dict[str, str]]:
        providers = {
            IntegrationType.BROKER: [{"id": "alpaca", "name": "Alpaca"}, {"id": "interactive_brokers", "name": "Interactive Brokers"}, {"id": "tradier", "name": "Tradier"}],
            IntegrationType.DATA_PROVIDER: [{"id": "yahoo_finance", "name": "Yahoo Finance"}, {"id": "alpha_vantage", "name": "Alpha Vantage"}, {"id": "polygon", "name": "Polygon"}],
            IntegrationType.AI_SERVICE: [{"id": "hojai", "name": "HOJAI AI"}, {"id": "rabtul", "name": "RABTUL"}],
        }
        return providers.get(integration_type, [])


state = IntegrationsState()

app = FastAPI(title="AssetMind Integrations", description="Third-party service integrations", version="1.0.0")


@app.get("/health")
async def health_check():
    active = len([i for i in state.integrations.values() if i.status == IntegrationStatus.ACTIVE])
    return {"service": "assetmind-integrations", "status": "healthy", "version": "1.0.0", "port": 5015,
            "total_integrations": len(state.integrations), "active_integrations": active}


@app.get("/health/live")
async def liveness():
    return {"status": "alive"}


@app.get("/health/ready")
async def readiness():
    return {"status": "ready", "integrations_loaded": len(state.integrations)}


integration_router = APIRouter(prefix="/api/integrations")


@integration_router.post("/", response_model=Integration, status_code=201)
async def create_integration(request: IntegrationCreate):
    return state.create_integration(request)


@integration_router.get("/", response_model=List[Integration])
async def list_integrations(integration_type: Optional[IntegrationType] = None, status: Optional[IntegrationStatus] = None, limit: int = Query(50, ge=1, le=100)):
    results = list(state.integrations.values())
    if integration_type:
        results = [i for i in results if i.integration_type == integration_type]
    if status:
        results = [i for i in results if i.status == status]
    return results[:limit]


@integration_router.get("/{integration_id}", response_model=Integration)
async def get_integration(integration_id: str):
    integration = state.integrations.get(integration_id)
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    return integration


@integration_router.patch("/{integration_id}", response_model=Integration)
async def update_integration(integration_id: str, update: IntegrationUpdate):
    integration = state.update_integration(integration_id, update)
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    return integration


@integration_router.post("/{integration_id}/activate", response_model=Integration)
async def activate_integration(integration_id: str):
    integration = state.activate_integration(integration_id)
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    return integration


@integration_router.post("/{integration_id}/deactivate", response_model=Integration)
async def deactivate_integration(integration_id: str):
    integration = state.integrations.get(integration_id)
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    integration.status = IntegrationStatus.INACTIVE
    integration.updated_at = datetime.utcnow()
    return integration


@integration_router.delete("/{integration_id}", status_code=204)
async def delete_integration(integration_id: str):
    if integration_id not in state.integrations:
        raise HTTPException(status_code=404, detail="Integration not found")
    del state.integrations[integration_id]


app.include_router(integration_router)

webhook_router = APIRouter(prefix="/api/webhooks")


@webhook_router.post("/", response_model=WebhookEvent, status_code=201)
async def create_webhook(request: WebhookCreate):
    return state.create_webhook(request)


@webhook_router.get("/", response_model=List[WebhookEvent])
async def list_webhooks(integration_id: Optional[str] = None, status: Optional[str] = None, limit: int = Query(50, ge=1, le=100)):
    results = list(state.webhooks.values())
    if integration_id:
        results = [w for w in results if w.integration_id == integration_id]
    if status:
        results = [w for w in results if w.status == status]
    return sorted(results, key=lambda w: w.created_at, reverse=True)[:limit]


app.include_router(webhook_router)


@app.get("/api/providers/{integration_type}")
async def get_providers(integration_type: IntegrationType):
    return state.get_available_providers(integration_type)


@app.get("/api/sync/history", response_model=List[SyncResult])
async def get_sync_history(limit: int = Query(50, ge=1, le=200)):
    return state.sync_history[-limit:]


@app.get("/api/ai/hojai", response_model=HOJAIIntegration)
async def get_hojai_config():
    return state.hojai_config


@app.post("/api/ai/hojai", response_model=HOJAIIntegration)
async def update_hojai_config(config: HOJAIIntegration):
    state.hojai_config = config
    return config


@app.get("/api/ai/rabtul", response_model=RABTULIntegration)
async def get_rabtul_config():
    return state.rabtul_config


@app.post("/api/ai/rabtul", response_model=RABTULIntegration)
async def update_rabtul_config(config: RABTULIntegration):
    state.rabtul_config = config
    return config


@app.get("/")
async def root():
    return {"service": "AssetMind Integrations", "version": "1.0.0", "port": 5015}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5015)