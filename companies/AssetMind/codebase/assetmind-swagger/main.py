"""
AssetMind Swagger - API Documentation Service
FastAPI Main Application
"""

from datetime import datetime
from enum import Enum
from typing import Any, Optional
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ============================================================================
# Configuration
# ============================================================================

app = FastAPI(title="AssetMind Swagger", description="API Documentation Service", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


# ============================================================================
# Enums
# ============================================================================


class HTTPMethod(str, Enum):
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    PATCH = "PATCH"
    DELETE = "DELETE"


class ParameterType(str, Enum):
    PATH = "path"
    QUERY = "query"
    HEADER = "header"
    BODY = "body"


class SecurityScheme(str, Enum):
    API_KEY = "api_key"
    BEARER = "bearer"
    OAUTH2 = "oauth2"


class DocVersion(str, Enum):
    V1 = "v1"
    V2 = "v2"


# ============================================================================
# Pydantic Models
# ============================================================================


class SchemaProperty(BaseModel):
    name: str
    type: str
    description: Optional[str] = None
    required: bool = False
    default: Optional[Any] = None
    enum: Optional[list[Any]] = None


class SchemaDefinition(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    description: Optional[str] = None
    properties: list[SchemaProperty] = []
    required_fields: list[str] = []
    example: Optional[dict[str, Any]] = None


class ParameterDefinition(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    param_type: ParameterType
    schema: SchemaProperty
    required: bool = False
    description: Optional[str] = None
    deprecated: bool = False


class ResponseDefinition(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    status_code: int
    description: str
    schema: Optional[SchemaDefinition] = None
    example: Optional[dict[str, Any]] = None


class APIEndpoint(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    path: str
    method: HTTPMethod
    operation_id: str
    summary: str
    description: Optional[str] = None
    tags: list[str] = []
    parameters: list[ParameterDefinition] = []
    responses: list[ResponseDefinition] = []
    deprecated: bool = False
    version: DocVersion = DocVersion.V1
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class APIController(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    description: Optional[str] = None
    version: DocVersion = DocVersion.V1
    endpoints: list[str] = []
    tags: list[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)


class DocChangeLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    endpoint_id: str
    version: DocVersion
    change_type: str
    description: str
    author: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# In-Memory Storage
# ============================================================================

schemas_db: dict[str, SchemaDefinition] = {}
endpoints_db: dict[str, APIEndpoint] = {}
controllers_db: dict[str, APIController] = {}
changelogs_db: list[DocChangeLog] = []


# ============================================================================
# Health Check
# ============================================================================


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "assetmind-swagger",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "stats": {"total_endpoints": len(endpoints_db), "total_schemas": len(schemas_db)},
    }


# ============================================================================
# Schema Endpoints
# ============================================================================


@app.post("/schemas", response_model=SchemaDefinition, status_code=201)
async def create_schema(schema: SchemaDefinition):
    schemas_db[schema.id] = schema
    return schema


@app.get("/schemas/{schema_id}", response_model=SchemaDefinition)
async def get_schema(schema_id: str):
    if schema_id not in schemas_db:
        raise HTTPException(status_code=404, detail="Schema not found")
    return schemas_db[schema_id]


@app.get("/schemas", response_model=list[SchemaDefinition])
async def list_schemas(tag: Optional[str] = Query(None), limit: int = Query(50, ge=1, le=200)):
    schemas = list(schemas_db.values())
    if tag:
        schemas = [s for s in schemas if tag.lower() in s.name.lower()]
    return schemas[:limit]


# ============================================================================
# Endpoint Documentation Endpoints
# ============================================================================


@app.post("/endpoints", response_model=APIEndpoint, status_code=201)
async def create_endpoint(endpoint: APIEndpoint):
    endpoints_db[endpoint.id] = endpoint
    return endpoint


@app.get("/endpoints/{endpoint_id}", response_model=APIEndpoint)
async def get_endpoint(endpoint_id: str):
    if endpoint_id not in endpoints_db:
        raise HTTPException(status_code=404, detail="Endpoint not found")
    return endpoints_db[endpoint_id]


@app.get("/endpoints", response_model=list[APIEndpoint])
async def list_endpoints(
    method: Optional[HTTPMethod] = Query(None),
    tag: Optional[str] = Query(None),
    version: Optional[DocVersion] = Query(None),
    limit: int = Query(50, ge=1, le=200),
):
    endpoints = list(endpoints_db.values())
    if method:
        endpoints = [e for e in endpoints if e.method == method]
    if tag:
        endpoints = [e for e in endpoints if tag in e.tags]
    if version:
        endpoints = [e for e in endpoints if e.version == version]
    return endpoints[:limit]


@app.put("/endpoints/{endpoint_id}", response_model=APIEndpoint)
async def update_endpoint(endpoint_id: str, endpoint: APIEndpoint):
    if endpoint_id not in endpoints_db:
        raise HTTPException(status_code=404, detail="Endpoint not found")
    endpoint.updated_at = datetime.utcnow()
    endpoints_db[endpoint_id] = endpoint
    return endpoint


# ============================================================================
# Controller Endpoints
# ============================================================================


@app.post("/controllers", response_model=APIController, status_code=201)
async def create_controller(controller: APIController):
    controllers_db[controller.id] = controller
    return controller


@app.get("/controllers/{controller_id}", response_model=APIController)
async def get_controller(controller_id: str):
    if controller_id not in controllers_db:
        raise HTTPException(status_code=404, detail="Controller not found")
    return controllers_db[controller_id]


@app.get("/controllers", response_model=list[APIController])
async def list_controllers(version: Optional[DocVersion] = Query(None), limit: int = Query(20, ge=1, le=100)):
    controllers = list(controllers_db.values())
    if version:
        controllers = [c for c in controllers if c.version == version]
    return controllers[:limit]


# ============================================================================
# OpenAPI Specification Endpoints
# ============================================================================


@app.get("/specs/openapi/{version}")
async def get_openapi_spec(version: DocVersion = DocVersion.V1):
    endpoints = [e for e in endpoints_db.values() if e.version == version]
    schemas = list(schemas_db.values())
    return {
        "openapi": f"3.0.{version.value.replace('v', '')}",
        "info": {"title": "AssetMind API", "version": version.value},
        "paths": {e.path: {e.method.value.lower(): {"summary": e.summary, "operationId": e.operation_id, "tags": e.tags}} for e in endpoints},
        "components": {"schemas": {s.name: {"type": "object", "properties": {p.name: {"type": p.type} for p in s.properties}} for s in schemas}},
    }


# ============================================================================
# Changelog Endpoints
# ============================================================================


@app.post("/changelog", response_model=DocChangeLog, status_code=201)
async def create_changelog_entry(entry: DocChangeLog):
    changelogs_db.append(entry)
    return entry


@app.get("/changelog", response_model=list[DocChangeLog])
async def get_changelog(version: Optional[DocVersion] = Query(None), limit: int = Query(50, ge=1, le=200)):
    entries = changelogs_db.copy()
    if version:
        entries = [e for e in entries if e.version == version]
    return sorted(entries, key=lambda x: x.created_at, reverse=True)[:limit]


# ============================================================================
# Try-It-Out Endpoints
# ============================================================================


@app.post("/try/{endpoint_id}")
async def try_endpoint(endpoint_id: str, parameters: dict[str, Any] = {}, body: Optional[dict[str, Any]] = None):
    if endpoint_id not in endpoints_db:
        raise HTTPException(status_code=404, detail="Endpoint not found")
    endpoint = endpoints_db[endpoint_id]
    return {"success": True, "endpoint": endpoint.path, "method": endpoint.method.value, "parameters": parameters, "body": body}


# ============================================================================
# Search Endpoints
# ============================================================================


@app.get("/search")
async def search_docs(q: str = Query(..., min_length=1)):
    results = {"endpoints": [], "schemas": [], "controllers": []}
    q_lower = q.lower()
    for e in endpoints_db.values():
        if q_lower in e.summary.lower() or q_lower in e.path.lower() or any(q_lower in t.lower() for t in e.tags):
            results["endpoints"].append({"id": e.id, "summary": e.summary, "path": e.path, "method": e.method.value})
    for s in schemas_db.values():
        if q_lower in s.name.lower():
            results["schemas"].append({"id": s.id, "name": s.name})
    for c in controllers_db.values():
        if q_lower in c.name.lower():
            results["controllers"].append({"id": c.id, "name": c.name})
    return results


# ============================================================================
# Entry Point
# ============================================================================


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5052)