"""
AssetMind SDK - Developer SDK Service
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

app = FastAPI(title="AssetMind SDK", description="Developer SDK for Financial Intelligence", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


# ============================================================================
# Enums
# ============================================================================


class SDKLanguage(str, Enum):
    PYTHON = "python"
    TYPESCRIPT = "typescript"
    JAVASCRIPT = "javascript"
    JAVA = "java"
    GO = "go"


class SDKComponent(str, Enum):
    TWIN_ENGINE = "twin_engine"
    MARKET_DATA = "market_data"
    ANALYTICS = "analytics"
    TRADING = "trading"
    PORTFOLIO = "portfolio"
    RISK = "risk"


class PackageStatus(str, Enum):
    STABLE = "stable"
    BETA = "beta"
    ALPHA = "alpha"
    DEPRECATED = "deprecated"


# ============================================================================
# Pydantic Models
# ============================================================================


class SDKPackage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    version: str
    description: str
    language: SDKLanguage
    components: list[SDKComponent]
    status: PackageStatus = PackageStatus.STABLE
    documentation_url: Optional[str] = None
    npm_package: Optional[str] = None
    pypi_package: Optional[str] = None
    github_repo: Optional[str] = None
    dependencies: list[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)


class SDKMethod(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    description: str
    package_id: str
    component: SDKComponent
    parameters: list[dict[str, Any]] = []
    return_type: str
    example_usage: str


class SDKCredential(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    user_id: str
    api_key: str
    secret_key: Optional[str] = None
    scopes: list[str] = []
    rate_limit: int = 100
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None
    last_used: Optional[datetime] = None


class SDKUsageStats(BaseModel):
    api_calls: int = 0
    successful_calls: int = 0
    failed_calls: int = 0
    avg_response_time_ms: float = 0.0


class SDKProject(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    user_id: str
    description: str
    packages: list[str] = []
    usage_stats: SDKUsageStats = Field(default_factory=SDKUsageStats)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CodeSnippet(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    language: SDKLanguage
    title: str
    description: str
    code: str
    component: SDKComponent
    tags: list[str] = []
    author: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# In-Memory Storage
# ============================================================================

packages_db: dict[str, SDKPackage] = {}
methods_db: dict[str, SDKMethod] = {}
credentials_db: dict[str, SDKCredential] = {}
projects_db: dict[str, SDKProject] = {}
snippets_db: list[CodeSnippet] = []


# ============================================================================
# Health Check
# ============================================================================


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "assetmind-sdk",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "stats": {"total_packages": len(packages_db), "total_methods": len(methods_db), "total_projects": len(projects_db)},
    }


# ============================================================================
# Package Endpoints
# ============================================================================


@app.post("/packages", response_model=SDKPackage, status_code=201)
async def create_package(package: SDKPackage):
    packages_db[package.id] = package
    return package


@app.get("/packages/{package_id}", response_model=SDKPackage)
async def get_package(package_id: str):
    if package_id not in packages_db:
        raise HTTPException(status_code=404, detail="Package not found")
    return packages_db[package_id]


@app.get("/packages", response_model=list[SDKPackage])
async def list_packages(
    language: Optional[SDKLanguage] = Query(None),
    component: Optional[SDKComponent] = Query(None),
    status: Optional[PackageStatus] = Query(None),
    limit: int = Query(20, ge=1, le=100),
):
    packages = list(packages_db.values())
    if language:
        packages = [p for p in packages if p.language == language]
    if component:
        packages = [p for p in packages if component in p.components]
    if status:
        packages = [p for p in packages if p.status == status]
    return packages[:limit]


@app.get("/packages/{package_id}/methods", response_model=list[SDKMethod])
async def get_package_methods(package_id: str):
    if package_id not in packages_db:
        raise HTTPException(status_code=404, detail="Package not found")
    return [m for m in methods_db.values() if m.package_id == package_id]


# ============================================================================
# Method Endpoints
# ============================================================================


@app.post("/methods", response_model=SDKMethod, status_code=201)
async def create_method(method: SDKMethod):
    methods_db[method.id] = method
    return method


@app.get("/methods/{method_id}", response_model=SDKMethod)
async def get_method(method_id: str):
    if method_id not in methods_db:
        raise HTTPException(status_code=404, detail="Method not found")
    return methods_db[method_id]


@app.get("/methods", response_model=list[SDKMethod])
async def list_methods(
    component: Optional[SDKComponent] = Query(None),
    limit: int = Query(50, ge=1, le=200),
):
    methods = list(methods_db.values())
    if component:
        methods = [m for m in methods if m.component == component]
    return methods[:limit]


# ============================================================================
# Project Endpoints
# ============================================================================


@app.post("/projects", response_model=SDKProject, status_code=201)
async def create_project(project: SDKProject):
    projects_db[project.id] = project
    return project


@app.get("/projects/{project_id}", response_model=SDKProject)
async def get_project(project_id: str):
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    return projects_db[project_id]


@app.get("/projects", response_model=list[SDKProject])
async def list_user_projects(user_id: str = Query(...), limit: int = Query(20, ge=1, le=100)):
    projects = [p for p in projects_db.values() if p.user_id == user_id]
    return projects[:limit]


# ============================================================================
# Credentials Endpoints
# ============================================================================


@app.post("/credentials", response_model=SDKCredential, status_code=201)
async def create_credential(credential: SDKCredential):
    credentials_db[credential.id] = credential
    return credential


@app.get("/credentials/{credential_id}", response_model=SDKCredential)
async def get_credential(credential_id: str):
    if credential_id not in credentials_db:
        raise HTTPException(status_code=404, detail="Credential not found")
    return credentials_db[credential_id]


@app.post("/credentials/{credential_id}/validate")
async def validate_credential(credential_id: str):
    if credential_id not in credentials_db:
        raise HTTPException(status_code=404, detail="Credential not found")
    cred = credentials_db[credential_id]
    cred.last_used = datetime.utcnow()
    return {"valid": True, "scopes": cred.scopes, "rate_limit": cred.rate_limit}


# ============================================================================
# Code Snippets Endpoints
# ============================================================================


@app.post("/snippets", response_model=CodeSnippet, status_code=201)
async def create_snippet(snippet: CodeSnippet):
    snippets_db.append(snippet)
    return snippet


@app.get("/snippets", response_model=list[CodeSnippet])
async def list_snippets(
    language: Optional[SDKLanguage] = Query(None),
    component: Optional[SDKComponent] = Query(None),
    limit: int = Query(20, ge=1, le=100),
):
    snippets = snippets_db.copy()
    if language:
        snippets = [s for s in snippets if s.language == language]
    if component:
        snippets = [s for s in snippets if s.component == component]
    return snippets[:limit]


# ============================================================================
# Installation Endpoints
# ============================================================================


@app.get("/install/{language}/{package_name}")
async def get_installation_command(language: SDKLanguage, package_name: str):
    for pkg in packages_db.values():
        if pkg.name.lower() == package_name.lower():
            if language == SDKLanguage.PYTHON and pkg.pypi_package:
                return {"command": f"pip install {pkg.pypi_package}", "package": pkg.pypi_package}
            elif language in [SDKLanguage.TYPESCRIPT, SDKLanguage.JAVASCRIPT] and pkg.npm_package:
                return {"command": f"npm install {pkg.npm_package}", "package": pkg.npm_package}
    raise HTTPException(status_code=404, detail="Package not found")


@app.get("/install/quickstart/{language}")
async def get_quickstart(language: SDKLanguage):
    quickstarts = {
        SDKLanguage.PYTHON: {"install": "pip install assetmind", "setup": "from assetmind import AssetMind\nclient = AssetMind(api_key='key')\nportfolio = client.portfolio.get_summary()"},
        SDKLanguage.TYPESCRIPT: {"install": "npm install @assetmind/sdk", "setup": "import { AssetMind } from '@assetmind/sdk';\nconst client = new AssetMind({ apiKey: 'key' });"},
    }
    if language not in quickstarts:
        raise HTTPException(status_code=404, detail="Quickstart not available")
    return quickstarts[language]


# ============================================================================
# Entry Point
# ============================================================================


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5051)