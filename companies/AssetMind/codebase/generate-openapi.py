#!/usr/bin/env python3
"""
AssetMind OpenAPI Generator
Generates comprehensive OpenAPI specifications for all services
"""

import json
import os
from pathlib import Path

BASE_PATH = Path("/Users/rejaulkarim/Documents/RTMN/companies/AssetMind/codebase")

# Common OpenAPI components
SECURITY_SCHEMES = {
    "ApiKeyAuth": {
        "type": "apiKey",
        "in": "header",
        "name": "X-API-Key"
    },
    "BearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT"
    }
}

TAG_GROUPS = [
    {"name": "Core", "description": "Core platform services"},
    {"name": "Data", "description": "Data and connectors"},
    {"name": "Intelligence", "description": "AI and ML services"},
    {"name": "Agents", "description": "Agent systems"},
    {"name": "Trading", "description": "Trading and execution"},
    {"name": "Portfolio", "description": "Portfolio management"},
    {"name": "Market", "description": "Market data and analysis"},
]

def create_openapi_spec(service_name: str, port: int, title: str, description: str, paths: list) -> dict:
    """Create OpenAPI specification for a service."""
    return {
        "openapi": "3.0.3",
        "info": {
            "title": title,
            "description": description,
            "version": "1.0.0",
            "contact": {
                "name": "AssetMind Support",
                "email": "support@assetmind.ai"
            }
        },
        "servers": [
            {"url": f"http://localhost:{port}", "description": "Local development"},
            {"url": "https://api.assetmind.ai", "description": "Production"}
        ],
        "tags": [{"name": "default", "description": "API endpoints"}],
        "paths": paths,
        "components": {
            "securitySchemes": SECURITY_SCHEMES,
            "schemas": {
                "Error": {
                    "type": "object",
                    "properties": {
                        "error": {"type": "string"},
                        "message": {"type": "string"},
                        "code": {"type": "integer"}
                    }
                },
                "HealthResponse": {
                    "type": "object",
                    "properties": {
                        "status": {"type": "string", "example": "healthy"},
                        "service": {"type": "string"},
                        "version": {"type": "string"},
                        "timestamp": {"type": "string", "format": "date-time"}
                    }
                }
            }
        }
    }

def generate_service_specs():
    """Generate OpenAPI specs for all services."""
    services = {
        "api-gateway": {
            "port": 5260,
            "title": "AssetMind API Gateway",
            "description": "Central API gateway for AssetMind platform",
            "paths": {
                "/health": {
                    "get": {
                        "summary": "Health check",
                        "tags": ["default"],
                        "responses": {
                            "200": {"description": "OK", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/HealthResponse"}}}}
                        }
                    }
                },
                "/api/assets": {
                    "get": {
                        "summary": "List assets",
                        "tags": ["Data"],
                        "security": [{"ApiKeyAuth": []}],
                        "responses": {
                            "200": {"description": "List of assets"},
                            "401": {"description": "Unauthorized", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Error"}}}}
                        }
                    }
                },
                "/api/twin/{symbol}": {
                    "get": {
                        "summary": "Get asset twin",
                        "tags": ["Intelligence"],
                        "parameters": [{"name": "symbol", "in": "path", "required": True, "schema": {"type": "string"}}],
                        "security": [{"ApiKeyAuth": []}],
                        "responses": {
                            "200": {"description": "Asset twin data"},
                            "404": {"description": "Not found"}
                        }
                    }
                },
                "/api/portfolio": {
                    "get": {
                        "summary": "List portfolios",
                        "tags": ["Portfolio"],
                        "security": [{"ApiKeyAuth": []}],
                        "responses": {
                            "200": {"description": "List of portfolios"}
                        }
                    },
                    "post": {
                        "summary": "Create portfolio",
                        "tags": ["Portfolio"],
                        "security": [{"ApiKeyAuth": []}],
                        "responses": {
                            "201": {"description": "Portfolio created"}
                        }
                    }
                },
                "/api/intelligence": {
                    "get": {
                        "summary": "Get market intelligence",
                        "tags": ["Intelligence"],
                        "security": [{"ApiKeyAuth": []}],
                        "responses": {
                            "200": {"description": "Intelligence data"}
                        }
                    }
                }
            }
        },
        "twin-engine": {
            "port": 5002,
            "title": "AssetMind Twin Engine",
            "description": "Digital twin engine for asset, market, and portfolio analysis",
            "paths": {
                "/health": {
                    "get": {
                        "summary": "Health check",
                        "responses": {"200": {"description": "OK"}}
                    }
                },
                "/api/twin/{symbol}": {
                    "get": {
                        "summary": "Get digital twin",
                        "parameters": [{"name": "symbol", "in": "path", "required": True, "schema": {"type": "string"}}],
                        "responses": {
                            "200": {
                                "description": "Twin data",
                                "content": {
                                    "application/json": {
                                        "schema": {
                                            "type": "object",
                                            "properties": {
                                                "symbol": {"type": "string"},
                                                "health_score": {"type": "number"},
                                                "opportunity_score": {"type": "number"},
                                                "risk_score": {"type": "number"}
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                "/api/predict/{symbol}": {
                    "get": {
                        "summary": "Get predictions",
                        "parameters": [{"name": "symbol", "in": "path", "required": True, "schema": {"type": "string"}}],
                        "responses": {"200": {"description": "Prediction data"}}
                    }
                }
            }
        },
        "data-service": {
            "port": 5010,
            "title": "AssetMind Data Service",
            "description": "Aggregated market data from multiple sources",
            "paths": {
                "/health": {
                    "get": {"summary": "Health check", "responses": {"200": {"description": "OK"}}}
                },
                "/api/quotes": {
                    "get": {
                        "summary": "Get quotes",
                        "parameters": [
                            {"name": "symbols", "in": "query", "schema": {"type": "string"}, "description": "Comma-separated symbols"}
                        ],
                        "responses": {"200": {"description": "Quote data"}}
                    }
                },
                "/api/historical/{symbol}": {
                    "get": {
                        "summary": "Get historical data",
                        "parameters": [
                            {"name": "symbol", "in": "path", "required": True, "schema": {"type": "string"}},
                            {"name": "period", "in": "query", "schema": {"type": "string", "enum": ["1D", "1W", "1M", "3M", "1Y", "ALL"]}}
                        ],
                        "responses": {"200": {"description": "Historical data"}}
                    }
                }
            }
        },
        "intelligence": {
            "port": 5050,
            "title": "AssetMind Intelligence",
            "description": "AI-powered financial intelligence",
            "paths": {
                "/health": {
                    "get": {"summary": "Health check", "responses": {"200": {"description": "OK"}}}
                },
                "/api/analyze/{symbol}": {
                    "get": {
                        "summary": "Analyze symbol",
                        "parameters": [{"name": "symbol", "in": "path", "required": True, "schema": {"type": "string"}}],
                        "responses": {"200": {"description": "Analysis results"}}
                    }
                },
                "/api/sentiment/{symbol}": {
                    "get": {
                        "summary": "Get sentiment",
                        "parameters": [{"name": "symbol", "in": "path", "required": True, "schema": {"type": "string"}}],
                        "responses": {"200": {"description": "Sentiment data"}}
                    }
                }
            }
        },
        "agents": {
            "port": 5090,
            "title": "AssetMind Agents",
            "description": "Multi-agent orchestration",
            "paths": {
                "/health": {
                    "get": {"summary": "Health check", "responses": {"200": {"description": "OK"}}}
                },
                "/api/agents": {
                    "get": {
                        "summary": "List agents",
                        "responses": {"200": {"description": "List of agents"}}
                    }
                },
                "/api/tasks": {
                    "post": {
                        "summary": "Submit task",
                        "requestBody": {"content": {"application/json": {"schema": {"type": "object"}}},
                        "responses": {"202": {"description": "Task accepted"}}
                    }
                }
            }
        }
    }

    return services

def main():
    """Generate all OpenAPI specifications."""
    output_dir = BASE_PATH / "openapi"
    output_dir.mkdir(exist_ok=True)

    specs = generate_service_specs()

    for service, config in specs.items():
        spec = create_openapi_spec(
            service_name=service,
            port=config["port"],
            title=config["title"],
            description=config["description"],
            paths=config["paths"]
        )

        output_file = output_dir / f"{service}.json"
        with open(output_file, "w") as f:
            json.dump(spec, f, indent=2)

        print(f"✅ Generated: {output_file}")

    # Generate combined spec
    combined = {
        "openapi": "3.0.3",
        "info": {
            "title": "AssetMind API",
            "description": "Complete API specification for AssetMind Financial Intelligence Platform",
            "version": "1.0.0"
        },
        "servers": [{"url": "https://api.assetmind.ai", "description": "Production"}],
        "paths": {}
    }

    for service, config in specs.items():
        for path, methods in config["paths"].items():
            combined["paths"][path] = methods

    combined["components"] = {"securitySchemes": SECURITY_SCHEMES}

    with open(output_dir / "combined.json", "w") as f:
        json.dump(combined, f, indent=2)

    print(f"\n✅ Generated combined spec: {output_dir / 'combined.json'}")
    print(f"✅ Total specs: {len(specs)}")

if __name__ == "__main__":
    main()
