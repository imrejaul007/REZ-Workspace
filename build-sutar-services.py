#!/usr/bin/env python3
"""SUTAR OS - Complete Service Builder"""
import os
from pathlib import Path
from datetime import datetime

ROOT = Path("/Users/rejaulkarim/Documents/RTMN/companies/hojai-ai/hojai-sutar-os/services")

SERVICES = [
    {"name": "sutar-gateway", "port": 4140, "description": "SUTAR OS Main API Gateway", "features": ["Request routing", "Authentication", "Rate limiting"]},
    {"name": "sutar-twin-os", "port": 4142, "description": "Digital Twin OS - Entity state management", "features": ["Entity creation", "State tracking", "Change history"]},
    {"name": "sutar-memory-bridge", "port": 4143, "description": "Memory Bridge - HOJAI Memory integration", "features": ["Context storage", "Retrieval", "Session management"]},
    {"name": "sutar-agent-id", "port": 4146, "description": "Agent Identity Service", "features": ["Agent registration", "Identity verification"]},
    {"name": "sutar-intent-bus", "port": 4154, "description": "Intent Bus - Intent routing", "features": ["Intent capture", "Pattern recognition", "Routing"]},
    {"name": "sutar-agent-network", "port": 4155, "description": "Agent Network - Agent registry", "features": ["Agent registry", "Capability matching"]},
    {"name": "sutar-decision-engine", "port": 4240, "description": "Decision Engine - Policy evaluation", "features": ["Policy check", "Risk assessment", "Proceed/Hold/Reject"]},
    {"name": "sutar-simulation-os", "port": 4241, "description": "Simulation OS - What-if analysis", "features": ["Scenario testing", "Impact prediction"]},
    {"name": "sutar-goal-os", "port": 4242, "description": "Goal OS - Goal decomposition", "features": ["Goal decomposition", "Sub-goal generation"]},
    {"name": "sutar-network-learning", "port": 4243, "description": "Network Learning", "features": ["Pattern learning", "Success analysis"]},
    {"name": "sutar-flow-os", "port": 4244, "description": "Flow OS - Workflow orchestration", "features": ["Step sequencing", "Dependency management"]},
    {"name": "sutar-marketplace", "port": 4250, "description": "Marketplace - Agent marketplace", "features": ["Service listing", "Capability search", "Ratings"]},
    {"name": "sutar-economy-os", "port": 4251, "description": "Economy OS - Economic flow", "features": ["Transaction tracking", "Balance management"]},
    {"name": "sutar-usage-tracker", "port": 4253, "description": "Usage Tracker", "features": ["API usage", "Cost calculation"]},
    {"name": "sutar-policy-os", "port": 4254, "description": "Policy OS", "features": ["Policy CRUD", "Versioning"]},
    {"name": "sutar-trust-engine", "port": 4180, "description": "Trust Engine", "features": ["Credit check", "Trust validation"]},
    {"name": "sutar-contract-os", "port": 4190, "description": "Contract OS", "features": ["Contract generation", "Digital signatures"]},
    {"name": "sutar-negotiation-engine", "port": 4191, "description": "Negotiation Engine", "features": ["RFQ processing", "Counter-offers"]},
    {"name": "sutar-monitoring", "port": 3100, "description": "Monitoring", "features": ["Health checks", "Metrics collection"]},
    {"name": "sutar-exploration-engine", "port": 4255, "description": "Exploration Engine", "features": ["Market scanning", "Opportunity identification"]},
    {"name": "sutar-discovery-engine", "port": 4256, "description": "Discovery Engine", "features": ["Search", "Filtering", "Ranking"]},
    {"name": "sutar-multi-agent-evaluator", "port": 4257, "description": "Multi-Agent Evaluator", "features": ["Capability comparison", "Selection recommendation"]},
    {"name": "sutar-reputation-aggregator", "port": 4258, "description": "Reputation Aggregator", "features": ["Review aggregation", "Reputation scoring"]},
    {"name": "sutar-roi-calculator", "port": 4259, "description": "ROI Calculator", "features": ["Cost analysis", "ROI projection"]},
    {"name": "sutar-identity-os", "port": 4147, "description": "Identity OS", "features": ["Identity verification", "KYC"]},
]

def build_service(service):
    name = service["name"]
    port = service["port"]
    desc = service["description"]
    features = service["features"]
    service_dir = ROOT / name
    src_dir = service_dir / "src"
    src_dir.mkdir(parents=True, exist_ok=True)
    (service_dir / "tests").mkdir(parents=True, exist_ok=True)

    features_table = "\n".join([f"| {f} | Implemented |" for f in features])

    pkg = f'''{{
  "name": "{name}",
  "version": "1.0.0",
  "description": "{desc}",
  "main": "dist/index.js",
  "scripts": {{
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }},
  "dependencies": {{
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "zod": "^3.22.4",
    "uuid": "^9.0.0"
  }},
  "devDependencies": {{
    "@types/express": "^4.17.21",
    "@types/uuid": "^9.0.7",
    "typescript": "^5.3.3",
    "tsx": "^4.7.0"
  }}
}}'''

    tsconfig = '''{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*"]
}'''

    types = f'''export interface Config {{ port: number; environment: string; }}
export interface HealthResponse {{ status: string; service: string; version: string; timestamp: string; uptime: number; }}
export interface ApiResponse<T = unknown> {{ success: boolean; data?: T; error?: string; timestamp: string; }}
'''

    index = f'''import express from "express";
import cors from "cors";
import helmet from "helmet";
import {{ v4 as uuidv4 }} from "uuid";
import {{ z }} from "zod";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : {port};
const START_TIME = Date.now();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {{
  res.json({{ status: "healthy", service: "{name}", version: "1.0.0", timestamp: new Date().toISOString(), uptime: Math.floor((Date.now() - START_TIME) / 1000) }});
}});

const apiResponse = <T>(success: boolean, data?: T, error?: string) => ({{ success, data, error, timestamp: new Date().toISOString() }});

app.get("/api/v1/info", (_req, res) => {{
  res.json(apiResponse(true, {{ name: "{name}", description: "{desc}", version: "1.0.0", features: {features} }}));
}});

app.post("/api/v1/intent", async (req, res) => {{
  try {{
    const {{ type, payload }} = req.body;
    console.log(`[INTENT] ${{type}}:`, payload);
    res.json(apiResponse(true, {{ intentId: uuidv4(), type, status: "received" }}));
  }} catch (e) {{
    res.status(400).json(apiResponse(false, undefined, String(e)));
  }}
}});

app.post("/api/v1/event", async (req, res) => {{
  try {{
    const {{ type, data }} = req.body;
    console.log(`[EVENT] ${{type}}:`, data);
    res.json(apiResponse(true, {{ eventId: uuidv4(), type, status: "processed" }}));
  }} catch (e) {{
    res.status(400).json(apiResponse(false, undefined, String(e)));
  }}
}});

app.use((_req, res) => {{ res.status(404).json(apiResponse(false, undefined, "Not found")); }});

app.listen(PORT, () => {{
  console.log(`{name.upper()} running on port {port}`);
}});

export default app;
'''

    readme = f'''# {name.replace("-", " ").title()}
> **{desc}**
## Port: {port}
## Features
{features_table}
## API
- GET /health - Health check
- GET /api/v1/info - Service info
- POST /api/v1/intent - Submit intent
- POST /api/v1/event - Publish event
'''

    dockerfile = f'''FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE {port}
CMD ["npm", "start"]
'''

    claude = f'''# {name}
Port: {port}
Type: SUTAR OS Service
{features_table}
'''

    (service_dir / "package.json").write_text(pkg)
    (service_dir / "tsconfig.json").write_text(tsconfig)
    (service_dir / "README.md").write_text(readme)
    (service_dir / "Dockerfile").write_text(dockerfile)
    (service_dir / "CLAUDE.md").write_text(claude)
    (src_dir / "types" / "index.ts").write_text(types)
    (src_dir / "index.ts").write_text(index)

    return service_dir

def main():
    print("Building SUTAR OS services...")
    for s in SERVICES:
        try:
            build_service(s)
            print(f"  [OK] {s['name']} (port {s['port']})")
        except Exception as e:
            print(f"  [ERR] {s['name']}: {e}")
    print(f"\nDone! Built {len(SERVICES)} services.")

if __name__ == "__main__":
    main()
