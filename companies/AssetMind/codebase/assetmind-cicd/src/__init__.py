"""
AssetMind CI/CD Pipeline
Automated build, test, and deployment pipeline for AssetMind services.
"""

import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import json


app = FastAPI(title="AssetMind CI/CD", version="1.0.0")


class BuildStatus(str, Enum):
    PENDING = "pending"
    BUILDING = "building"
    TESTING = "testing"
    SUCCESS = "success"
    FAILED = "failed"


class DeploymentEnvironment(str, Enum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"


class Build(BaseModel):
    build_id: str
    service: str
    branch: str
    commit: str
    status: BuildStatus
    started_at: str
    finished_at: Optional[str] = None
    logs: List[str] = []
    artifacts: List[str] = []


class Deployment(BaseModel):
    deployment_id: str
    build_id: str
    environment: DeploymentEnvironment
    status: str
    deployed_at: str
    deployed_by: str


# In-memory storage
builds: Dict[str, Build] = {}
deployments: Dict[str, Deployment] = {}
build_counter = 0
deploy_counter = 0


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "cicd", "version": "1.0.0"}


@app.post("/builds")
async def create_build(service: str, branch: str = "main", commit: str = "HEAD"):
    """Trigger a new build."""
    global build_counter
    build_counter += 1

    build_id = f"build-{build_counter:04d}"

    build = Build(
        build_id=build_id,
        service=service,
        branch=branch,
        commit=commit,
        status=BuildStatus.PENDING,
        started_at=datetime.now().isoformat(),
        logs=["Build queued..."]
    )

    builds[build_id] = build

    # Simulate build process
    await simulate_build(build)

    return build


async def simulate_build(build: Build):
    """Simulate build process (replace with actual CI)."""
    import asyncio

    build.status = BuildStatus.BUILDING
    build.logs.append(f"Building {build.service} from {build.branch}...")

    await asyncio.sleep(0.5)
    build.logs.append("Running npm install / pip install...")

    await asyncio.sleep(0.5)
    build.status = BuildStatus.TESTING
    build.logs.append("Running tests...")

    await asyncio.sleep(0.5)
    build.status = BuildStatus.SUCCESS
    build.finished_at = datetime.now().isoformat()
    build.logs.append("Build successful!")
    build.artifacts = [
        f"dist/{build.service}.zip",
        f"logs/{build.service}.log"
    ]


@app.get("/builds")
async def list_builds(service: Optional[str] = None, limit: int = 50):
    """List builds."""
    result = list(builds.values())

    if service:
        result = [b for b in result if b.service == service]

    result.sort(key=lambda x: x.started_at, reverse=True)
    return {"builds": result[:limit], "total": len(result)}


@app.get("/builds/{build_id}")
async def get_build(build_id: str):
    """Get build details."""
    if build_id not in builds:
        raise HTTPException(status_code=404, detail="Build not found")
    return builds[build_id]


@app.post("/deployments")
async def create_deployment(
    build_id: str,
    environment: DeploymentEnvironment,
    deployed_by: str
):
    """Create a new deployment."""
    global deploy_counter

    if build_id not in builds:
        raise HTTPException(status_code=404, detail="Build not found")

    build = builds[build_id]
    if build.status != BuildStatus.SUCCESS:
        raise HTTPException(status_code=400, detail="Cannot deploy failed build")

    deploy_counter += 1
    deployment_id = f"deploy-{deploy_counter:04d}"

    deployment = Deployment(
        deployment_id=deployment_id,
        build_id=build_id,
        environment=environment,
        status="deployed",
        deployed_at=datetime.now().isoformat(),
        deployed_by=deployed_by
    )

    deployments[deployment_id] = deployment
    return deployment


@app.get("/deployments")
async def list_deployments(environment: Optional[DeploymentEnvironment] = None):
    """List deployments."""
    result = list(deployments.values())

    if environment:
        result = [d for d in result if d.environment == environment]

    result.sort(key=lambda x: x.deployed_at, reverse=True)
    return {"deployments": result, "total": len(result)}


@app.get("/status")
async def get_pipeline_status():
    """Get overall pipeline status."""
    total_builds = len(builds)
    successful = len([b for b in builds.values() if b.status == BuildStatus.SUCCESS])
    failed = len([b for b in builds.values() if b.status == BuildStatus.FAILED])

    recent_builds = list(builds.values())[-5:]
    recent_builds.sort(key=lambda x: x.started_at, reverse=True)

    return {
        "total_builds": total_builds,
        "successful": successful,
        "failed": failed,
        "success_rate": round(successful / total_builds * 100, 1) if total_builds > 0 else 0,
        "recent_builds": recent_builds
    }


@app.post("/rollback")
async def rollback_deployment(deployment_id: str):
    """Rollback to a previous deployment."""
    if deployment_id not in deployments:
        raise HTTPException(status_code=404, detail="Deployment not found")

    deployment = deployments[deployment_id]

    # Create new deployment that reverts to previous state
    deploy_counter += 1
    rollback = Deployment(
        deployment_id=f"deploy-{deploy_counter:04d}",
        build_id=deployment.build_id,
        environment=deployment.environment,
        status="rolled_back",
        deployed_at=datetime.now().isoformat(),
        deployed_by="system"
    )

    deployments[rollback.deployment_id] = rollback
    return rollback


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=4500)
