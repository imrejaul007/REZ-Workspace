#!/usr/bin/env python3
"""
AssetMind README Generator
Generates comprehensive README.md files for all services
"""

import os
import json

# Service configurations
SERVICES = {
    "assetmind-admin": {
        "name": "AssetMind Admin",
        "port": 5251,
        "type": "FastAPI / Python",
        "description": "Admin dashboard and user management for AssetMind platform",
        "features": [
            "User management",
            "Service monitoring",
            "System configuration",
            "Audit logging",
            "API key management"
        ],
        "env_vars": ["ADMIN_PASSWORD", "DATABASE_URL"],
        "endpoints": ["/health", "/api/users", "/api/services"]
    },
    "assetmind-agents": {
        "name": "AssetMind Agents",
        "port": 5090,
        "type": "FastAPI / Python",
        "description": "Multi-agent orchestration system for financial intelligence",
        "features": [
            "Agent orchestration",
            "Task scheduling",
            "Parallel execution",
            "Result aggregation",
            "Agent communication"
        ],
        "env_vars": ["AGENT_CONFIG", "TASK_QUEUE_URL", "DATABASE_URL"],
        "endpoints": ["/health", "/api/agents", "/api/tasks", "/api/results"]
    },
    "assetmind-analyst-twin": {
        "name": "Analyst Twin",
        "port": 5260,
        "type": "FastAPI / Python",
        "description": "AI-powered financial analyst digital twin",
        "features": [
            "Company analysis",
            "Industry research",
            "Earnings analysis",
            "Valuation modeling",
            "Analyst recommendations"
        ],
        "env_vars": ["DATABASE_URL", "NEWS_API_KEY"],
        "endpoints": ["/health", "/api/analyze/{symbol}", "/api/earnings", "/api/valuation"]
    },
    "assetmind-api": {
        "name": "AssetMind API",
        "port": 5260,
        "type": "FastAPI / Python",
        "description": "Main REST API for AssetMind platform",
        "features": [
            "RESTful API",
            "Authentication",
            "Rate limiting",
            "API versioning",
            "Documentation (Swagger)"
        ],
        "env_vars": ["DATABASE_URL", "API_KEY"],
        "endpoints": ["/health", "/docs", "/openapi.json"]
    },
    "assetmind-asset-twin": {
        "name": "Asset Twin",
        "port": 5002,
        "type": "FastAPI / Python",
        "description": "Digital twin for individual asset analysis",
        "features": [
            "Real-time monitoring",
            "Technical analysis",
            "Fundamental analysis",
            "Risk scoring",
            "Price predictions"
        ],
        "env_vars": ["DATABASE_URL", "REDIS_URL"],
        "endpoints": ["/health", "/api/twin/{symbol}", "/api/quote/{symbol}"]
    },
    "assetmind-asset-universe": {
        "name": "Asset Universe",
        "port": 5001,
        "type": "FastAPI / Python",
        "description": "Comprehensive asset database and discovery",
        "features": [
            "Asset catalog",
            "Search and filtering",
            "Classification",
            "Metadata management",
            "Data validation"
        ],
        "env_vars": ["DATABASE_URL"],
        "endpoints": ["/health", "/api/assets", "/api/assets/{id}", "/api/search"]
    },
    "assetmind-backtest": {
        "name": "Backtesting Engine",
        "port": 5140,
        "type": "FastAPI / Python",
        "description": "Historical strategy backtesting platform",
        "features": [
            "Strategy backtesting",
            "Historical data",
            "Performance metrics",
            "Risk analysis",
            "Report generation"
        ],
        "env_vars": ["DATABASE_URL", "HISTORICAL_DATA_URL"],
        "endpoints": ["/health", "/api/backtest", "/api/results", "/api/strategies"]
    },
    "assetmind-briefing": {
        "name": "Daily Briefing",
        "port": 5200,
        "type": "FastAPI / Python",
        "description": "AI-generated daily market briefings",
        "features": [
            "Market summary",
            "Top movers",
            "News digest",
            "Sector analysis",
            "Personalized alerts"
        ],
        "env_vars": ["DATABASE_URL", "EMAIL_API_KEY"],
        "endpoints": ["/health", "/api/briefing", "/api/briefing/{date}"]
    },
    "assetmind-broker-api": {
        "name": "Broker API",
        "port": 5160,
        "type": "FastAPI / Python",
        "description": "Unified broker integration API",
        "features": [
            "Broker abstraction",
            "Order management",
            "Portfolio sync",
            "Real-time quotes",
            "Trade execution"
        ],
        "env_vars": ["BROKER_API_KEY", "BROKER_SECRET"],
        "endpoints": ["/health", "/api/orders", "/api/positions", "/api/quotes"]
    },
    "assetmind-capital-flow": {
        "name": "Capital Flow Analysis",
        "port": 5183,
        "type": "FastAPI / Python",
        "description": "Institutional capital flow tracking and analysis",
        "features": [
            "Flow tracking",
            "Institutional ownership",
            "Sector flows",
            "Regional analysis",
            "Flow predictions"
        ],
        "env_vars": ["DATABASE_URL", "FLOW_DATA_API_KEY"],
        "endpoints": ["/health", "/api/flows", "/api/ownership/{symbol}"]
    },
    "assetmind-competitor-twin": {
        "name": "Competitor Twin",
        "port": 5258,
        "type": "FastAPI / Python",
        "description": "Competitive intelligence digital twin",
        "features": [
            "Competitive analysis",
            "Market share tracking",
            "Product comparison",
            "Strategic insights",
            "Win/loss analysis"
        ],
        "env_vars": ["DATABASE_URL"],
        "endpoints": ["/health", "/api/competitors/{symbol}", "/api/analysis"]
    },
    "assetmind-connectors": {
        "name": "Data Connectors",
        "port": 5010,
        "type": "Python",
        "description": "External data source connectors",
        "features": [
            "Yahoo Finance",
            "SEC EDGAR",
            "CoinGecko",
            "FRED Economic",
            "News APIs"
        ],
        "env_vars": ["YAHOO_API_KEY", "SEC_API_KEY", "COINGECKO_API_KEY"],
        "endpoints": ["/health"]
    },
    "assetmind-copilot": {
        "name": "AI Copilot",
        "port": 5295,
        "type": "FastAPI / Python",
        "description": "AI-powered investment copilot assistant",
        "features": [
            "Natural language queries",
            "Portfolio Q&A",
            "Trade recommendations",
            "Risk explanations",
            "Strategy suggestions"
        ],
        "env_vars": ["DATABASE_URL", "LLM_API_KEY"],
        "endpoints": ["/health", "/api/chat", "/api/recommend"]
    },
    "assetmind-core": {
        "name": "Core Services",
        "port": 5000,
        "type": "FastAPI / Python",
        "description": "Core business logic and shared utilities",
        "features": [
            "Shared utilities",
            "Data models",
            "Common functions",
            "Error handling",
            "Validation"
        ],
        "env_vars": ["DATABASE_URL"],
        "endpoints": ["/health"]
    },
    "assetmind-council": {
        "name": "Financial Council",
        "port": 5195,
        "type": "FastAPI / Python",
        "description": "Multi-agent AI council for investment decisions",
        "features": [
            "Multi-agent deliberation",
            "Consensus building",
            "Argument synthesis",
            "Decision logging",
            "Bias detection"
        ],
        "env_vars": ["DATABASE_URL", "AGENT_COUNT"],
        "endpoints": ["/health", "/api/council/{question}"]
    },
    "assetmind-covenant": {
        "name": "Covenant Tracking",
        "port": 5170,
        "type": "FastAPI / Python",
        "description": "Debt covenant monitoring and alerts",
        "features": [
            "Covenant extraction",
            "Breach monitoring",
            "Early warnings",
            "Compliance tracking",
            "Regulatory reporting"
        ],
        "env_vars": ["DATABASE_URL", "SEC_API_KEY"],
        "endpoints": ["/health", "/api/covenants/{issuer}"]
    },
    "assetmind-daily": {
        "name": "Daily Reports",
        "port": 5200,
        "type": "FastAPI / Python",
        "description": "Automated daily reporting system",
        "features": [
            "Portfolio summaries",
            "Performance reports",
            "Risk dashboards",
            "Market recaps",
            "Scheduled delivery"
        ],
        "env_vars": ["DATABASE_URL", "SMTP_HOST"],
        "endpoints": ["/health", "/api/reports", "/api/schedule"]
    },
    "assetmind-dashboard": {
        "name": "Web Dashboard",
        "port": 3000,
        "type": "React / TypeScript",
        "description": "Web-based investment dashboard",
        "features": [
            "Portfolio view",
            "Charts and graphs",
            "Real-time data",
            "Custom widgets",
            "Dark mode"
        ],
        "env_vars": ["REACT_APP_API_URL"],
        "endpoints": ["/"]
    },
    "assetmind-data": {
        "name": "Market Data Service",
        "port": 5010,
        "type": "FastAPI / Python",
        "description": "Aggregated market data from multiple sources",
        "features": [
            "Real-time quotes",
            "Historical data",
            "Fundamentals",
            "Company info",
            "Market indices"
        ],
        "env_vars": ["DATABASE_URL", "YAHOO_FINANCE_KEY"],
        "endpoints": ["/health", "/api/quotes", "/api/historical", "/api/fundamentals"]
    },
    "assetmind-db": {
        "name": "Database Service",
        "port": 5432,
        "type": "PostgreSQL/TimescaleDB",
        "description": "Database management and query service",
        "features": [
            "Time-series data",
            "Historical storage",
            "Query optimization",
            "Data retention",
            "Backup management"
        ],
        "env_vars": ["DATABASE_URL", "REDIS_URL"],
        "endpoints": ["/health"]
    },
    "assetmind-deal-room": {
        "name": "Deal Room",
        "port": 5280,
        "type": "FastAPI / Python",
        "description": "Investment deal tracking and collaboration",
        "features": [
            "Deal pipeline",
            "Document management",
            "Team collaboration",
            "Due diligence",
            "Deal analytics"
        ],
        "env_vars": ["DATABASE_URL"],
        "endpoints": ["/health", "/api/deals", "/api/documents"]
    },
    "assetmind-decision-twin": {
        "name": "Decision Twin",
        "port": 5250,
        "type": "FastAPI / Python",
        "description": "AI-powered investment decision support",
        "features": [
            "Decision modeling",
            "Scenario analysis",
            "Risk assessment",
            "Recommendation engine",
            "Decision logging"
        ],
        "env_vars": ["DATABASE_URL"],
        "endpoints": ["/health", "/api/decide", "/api/scenarios"]
    },
    "assetmind-decisions": {
        "name": "Decision Tracker",
        "port": 5250,
        "type": "FastAPI / Python",
        "description": "Track and analyze investment decisions",
        "features": [
            "Decision logging",
            "Outcome tracking",
            "Performance analysis",
            "Bias identification",
            "Learning system"
        ],
        "env_vars": ["DATABASE_URL"],
        "endpoints": ["/health", "/api/decisions", "/api/outcomes"]
    },
    "assetmind-diligence": {
        "name": "Due Diligence",
        "port": 5290,
        "type": "FastAPI / Python",
        "description": "AI-powered due diligence platform",
        "features": [
            "Company research",
            "Financial analysis",
            "Legal review",
            "Risk assessment",
            "Report generation"
        ],
        "env_vars": ["DATABASE_URL", "SEC_API_KEY"],
        "endpoints": ["/health", "/api/diligence/{company}"]
    },
    "assetmind-discovery": {
        "name": "Opportunity Discovery",
        "port": 5120,
        "type": "FastAPI / Python",
        "description": "AI-powered investment opportunity discovery",
        "features": [
            "Pattern recognition",
            "Anomaly detection",
            "Trending analysis",
            "Screening engine",
            "Alert system"
        ],
        "env_vars": ["DATABASE_URL"],
        "endpoints": ["/health", "/api/opportunities", "/api/screen"]
    },
    "assetmind-economic-twin": {
        "name": "Economic Twin",
        "port": 5041,
        "type": "FastAPI / Python",
        "description": "Economic indicator digital twin",
        "features": [
            "GDP tracking",
            "Inflation monitoring",
            "Interest rate analysis",
            "Currency trends",
            "Economic forecasting"
        ],
        "env_vars": ["DATABASE_URL", "FRED_API_KEY"],
        "endpoints": ["/health", "/api/indicators", "/api/forecast"]
    },
    "assetmind-enterprise": {
        "name": "Enterprise Features",
        "port": 5250,
        "type": "FastAPI / Python",
        "description": "Enterprise-specific features and integrations",
        "features": [
            "SSO integration",
            "Custom branding",
            "Audit logging",
            "Compliance tools",
            "API management"
        ],
        "env_vars": ["DATABASE_URL", "SSO_PROVIDER"],
        "endpoints": ["/health", "/api/enterprise"]
    },
    "assetmind-event-intelligence": {
        "name": "Event Intelligence",
        "port": 5054,
        "type": "FastAPI / Python",
        "description": "Market event analysis and prediction",
        "features": [
            "Event extraction",
            "Impact analysis",
            "Historical patterns",
            "Real-time alerts",
            "Sentiment analysis"
        ],
        "env_vars": ["DATABASE_URL", "NEWS_API_KEY"],
        "endpoints": ["/health", "/api/events", "/api/impact/{symbol}"]
    },
    "assetmind-event-os": {
        "name": "Event Operating System",
        "port": 5052,
        "type": "FastAPI / Python",
        "description": "Event-driven architecture platform",
        "features": [
            "Event streaming",
            "Event processing",
            "Real-time analytics",
            "Event storage",
            "Event replay"
        ],
        "env_vars": ["KAFKA_BROKERS", "DATABASE_URL"],
        "endpoints": ["/health", "/api/events", "/api/streams"]
    },
    "assetmind-excel-engine": {
        "name": "Excel Engine",
        "port": 5180,
        "type": "FastAPI / Python",
        "description": "Excel file processing and generation",
        "features": [
            "Report generation",
            "Data import",
            "Template processing",
            "Formula evaluation",
            "Chart creation"
        ],
        "env_vars": ["DATABASE_URL"],
        "endpoints": ["/health", "/api/export", "/api/import"]
    },
    "assetmind-execution": {
        "name": "Trade Execution",
        "port": 5161,
        "type": "FastAPI / Python",
        "description": "Order execution and trade management",
        "features": [
            "Order routing",
            "Smart routing",
            "Execution algorithms",
            "Commission optimization",
            "Trade confirmation"
        ],
        "env_vars": ["BROKER_API_KEY", "DATABASE_URL"],
        "endpoints": ["/health", "/api/execute", "/api/orders"]
    },
    "assetmind-financial-memory": {
        "name": "Financial Memory",
        "port": 5030,
        "type": "FastAPI / Python",
        "description": "Long-term financial knowledge storage",
        "features": [
            "Knowledge storage",
            "Semantic search",
            "Entity linking",
            "Memory retrieval",
            "Context management"
        ],
        "env_vars": ["DATABASE_URL", "REDIS_URL"],
        "endpoints": ["/health", "/api/memory", "/api/remember"]
    },
    "assetmind-frontend": {
        "name": "Frontend Application",
        "port": 3000,
        "type": "Next.js / React",
        "description": "Main web application frontend",
        "features": [
            "Portfolio management",
            "Market data visualization",
            "AI insights",
            "Real-time updates",
            "Responsive design"
        ],
        "env_vars": ["NEXT_PUBLIC_API_URL"],
        "endpoints": ["/"]
    },
    "assetmind-gateway": {
        "name": "Python Gateway",
        "port": 8000,
        "type": "FastAPI / Python",
        "description": "Python-based API gateway alternative",
        "features": [
            "Request routing",
            "Authentication",
            "Rate limiting",
            "Request logging",
            "Service discovery"
        ],
        "env_vars": ["DATABASE_URL", "SERVICE_URLS"],
        "endpoints": ["/health", "/api/routes"]
    },
    "assetmind-hojai-integration": {
        "name": "HOJAI Integration",
        "port": 4540,
        "type": "FastAPI / Python",
        "description": "Integration with HOJAI AI platform",
        "features": [
            "HOJAI memory",
            "HOJAI agents",
            "HOJAI voice",
            "HOJAI intelligence",
            "Bidirectional sync"
        ],
        "env_vars": ["HOJAI_API_KEY", "HOJAI_GATEWAY_URL"],
        "endpoints": ["/health", "/api/hojai"]
    },
    "assetmind-integrations": {
        "name": "External Integrations",
        "port": 5010,
        "type": "FastAPI / Python",
        "description": "Third-party service integrations",
        "features": [
            "RABTUL services",
            "HOJAI AI",
            "Market data providers",
            "Broker integrations",
            "Notification services"
        ],
        "env_vars": ["RABTUL_API_KEY", "HOJAI_API_KEY"],
        "endpoints": ["/health", "/api/integrations"]
    },
    "assetmind-intelligence": {
        "name": "Financial Intelligence",
        "port": 5050,
        "type": "FastAPI / Python",
        "description": "Core AI intelligence engine",
        "features": [
            "Market analysis",
            "Pattern recognition",
            "Predictive modeling",
            "Risk assessment",
            "Opportunity detection"
        ],
        "env_vars": ["DATABASE_URL", "MODEL_PATH"],
        "endpoints": ["/health", "/api/intelligence/{symbol}"]
    },
    "assetmind-intelligence-hub": {
        "name": "Intelligence Hub",
        "port": 5298,
        "type": "FastAPI / Python",
        "description": "Central orchestration for AI intelligence services",
        "features": [
            "Service coordination",
            "Result aggregation",
            "Load balancing",
            "Failover management",
            "Performance monitoring"
        ],
        "env_vars": ["DATABASE_URL"],
        "endpoints": ["/health", "/api/hub"]
    },
    "assetmind-investor-twin": {
        "name": "Investor Twin",
        "port": 5005,
        "type": "FastAPI / Python",
        "description": "Investor profile and behavior digital twin",
        "features": [
            "Profile analysis",
            "Behavior modeling",
            "Risk tolerance",
            "Investment style",
            "Performance history"
        ],
        "env_vars": ["DATABASE_URL", "REDIS_URL"],
        "endpoints": ["/health", "/api/investor/{id}", "/api/profile"]
    },
    "assetmind-knowledge-graph": {
        "name": "Knowledge Graph",
        "port": 5040,
        "type": "FastAPI / Python",
        "description": "Neo4j-based financial knowledge graph",
        "features": [
            "Entity relationships",
            "Graph queries",
            "Path analysis",
            "Entity resolution",
            "Knowledge inference"
        ],
        "env_vars": ["NEO4J_URI", "NEO4J_USER", "NEO4J_PASSWORD"],
        "endpoints": ["/health", "/api/graph", "/api/search"]
    },
    "assetmind-kronos": {
        "name": "Kronos Forecasting",
        "port": 5160,
        "type": "Python / PyTorch",
        "description": "Time series forecasting engine",
        "features": [
            "Price prediction",
            "Volatility forecasting",
            "Trend analysis",
            "Seasonal patterns",
            "Multi-horizon forecasting"
        ],
        "env_vars": ["DATABASE_URL", "MODEL_PATH"],
        "endpoints": ["/health", "/api/forecast/{symbol}"]
    },
    "assetmind-landing": {
        "name": "Landing Page",
        "port": 3000,
        "type": "Next.js / React",
        "description": "Marketing landing page",
        "features": [
            "Product showcase",
            "Feature highlights",
            "Pricing plans",
            "Testimonials",
            "CTA sections"
        ],
        "env_vars": [],
        "endpoints": ["/"]
    },
    "assetmind-market-intelligence": {
        "name": "Market Intelligence",
        "port": 5050,
        "type": "FastAPI / Python",
        "description": "Market-wide intelligence and analysis",
        "features": [
            "Market trends",
            "Sector rotation",
            "Style analysis",
            "Market breadth",
            "Sentiment indicators"
        ],
        "env_vars": ["DATABASE_URL"],
        "endpoints": ["/health", "/api/market"]
    },
    "assetmind-market-twin": {
        "name": "Market Twin",
        "port": 5003,
        "type": "FastAPI / Python",
        "description": "Market conditions digital twin",
        "features": [
            "Market overview",
            "Trend analysis",
            "Volatility tracking",
            "Correlation mapping",
            "Market regime detection"
        ],
        "env_vars": ["DATABASE_URL", "REDIS_URL"],
        "endpoints": ["/health", "/api/market"]
    },
    "assetmind-marketplace": {
        "name": "Marketplace",
        "port": 5270,
        "type": "FastAPI / Python",
        "description": "AssetMind services marketplace",
        "features": [
            "Service catalog",
            "Service discovery",
            "Usage tracking",
            "Billing integration",
            "Review system"
        ],
        "env_vars": ["DATABASE_URL", "STRIPE_API_KEY"],
        "endpoints": ["/health", "/api/marketplace", "/api/services"]
    },
    "assetmind-memo-writer": {
        "name": "AI Memo Writer",
        "port": 5190,
        "type": "FastAPI / Python",
        "description": "AI-powered investment memo generation",
        "features": [
            "Research synthesis",
            "Professional formatting",
            "Citation generation",
            "Multiple templates",
            "Export options"
        ],
        "env_vars": ["DATABASE_URL", "LLM_API_KEY"],
        "endpoints": ["/health", "/api/generate", "/api/templates"]
    },
    "assetmind-memory": {
        "name": "Memory Service",
        "port": 5030,
        "type": "FastAPI / Python",
        "description": "HOJAI memory platform integration",
        "features": [
            "Context storage",
            "Session management",
            "Memory retrieval",
            "Context aggregation",
            "Memory optimization"
        ],
        "env_vars": ["DATABASE_URL", "REDIS_URL", "HOJAI_API_KEY"],
        "endpoints": ["/health", "/api/memory"]
    },
    "assetmind-mobile": {
        "name": "Mobile App",
        "port": 5005,
        "type": "Expo / React Native",
        "description": "iOS and Android mobile application",
        "features": [
            "Portfolio tracking",
            "Real-time quotes",
            "AI recommendations",
            "Push notifications",
            "Biometric login"
        ],
        "env_vars": ["EXPO_PUBLIC_API_URL"],
        "endpoints": ["/health", "/api/mobile"]
    },
    "assetmind-multiagent": {
        "name": "Multi-Agent System",
        "port": 5090,
        "type": "FastAPI / Python",
        "description": "Multi-agent collaboration platform",
        "features": [
            "Agent creation",
            "Task delegation",
            "Result aggregation",
            "Agent communication",
            "Performance tracking"
        ],
        "env_vars": ["DATABASE_URL", "AGENT_CONFIG"],
        "endpoints": ["/health", "/api/agents"]
    },
    "assetmind-news": {
        "name": "News Service",
        "port": 5012,
        "type": "FastAPI / Python",
        "description": "Financial news aggregation and analysis",
        "features": [
            "News aggregation",
            "Sentiment analysis",
            "Relevance scoring",
            "Category filtering",
            "Breaking news alerts"
        ],
        "env_vars": ["DATABASE_URL", "NEWS_API_KEY"],
        "endpoints": ["/health", "/api/news", "/api/sentiment/{symbol}"]
    },
    "assetmind-ontology": {
        "name": "Financial Ontology",
        "port": 5045,
        "type": "FastAPI / Python",
        "description": "Financial concept taxonomy and relationships",
        "features": [
            "Concept definitions",
            "Relationship mapping",
            "Taxonomy management",
            "Semantic search",
            "Inference engine"
        ],
        "env_vars": ["DATABASE_URL", "NEO4J_URI"],
        "endpoints": ["/health", "/api/ontology"]
    },
    "assetmind-paper-trading": {
        "name": "Paper Trading",
        "port": 5150,
        "type": "FastAPI / Python",
        "description": "Risk-free trading simulator",
        "features": [
            "Virtual portfolio",
            "Real-time simulation",
            "P&L tracking",
            "Strategy testing",
            "Performance analytics"
        ],
        "env_vars": ["DATABASE_URL"],
        "endpoints": ["/health", "/api/paper/trade", "/api/paper/portfolio"]
    },
    "assetmind-portfolio-analytics": {
        "name": "Portfolio Analytics",
        "port": 5070,
        "type": "FastAPI / Python",
        "description": "Advanced portfolio analysis and optimization",
        "features": [
            "Performance attribution",
            "Risk decomposition",
            "Optimization engine",
            "Scenario analysis",
            "Rebalancing recommendations"
        ],
        "env_vars": ["DATABASE_URL"],
        "endpoints": ["/health", "/api/analytics", "/api/optimize"]
    },
    "assetmind-portfolio-twin": {
        "name": "Portfolio Twin",
        "port": 5004,
        "type": "FastAPI / Python",
        "description": "Digital twin for portfolio analysis",
        "features": [
            "Portfolio overview",
            "Risk analysis",
            "Performance metrics",
            "Allocation optimization",
            "Scenario modeling"
        ],
        "env_vars": ["DATABASE_URL", "REDIS_URL"],
        "endpoints": ["/health", "/api/portfolio/{id}"]
    },
    "assetmind-predictions": {
        "name": "Price Predictions",
        "port": 5055,
        "type": "FastAPI / Python",
        "description": "AI-powered price prediction engine",
        "features": [
            "Price forecasting",
            "Confidence intervals",
            "Multiple horizons",
            "Ensemble models",
            "Model monitoring"
        ],
        "env_vars": ["DATABASE_URL", "MODEL_PATH"],
        "endpoints": ["/health", "/api/predict/{symbol}"]
    },
    "assetmind-production": {
        "name": "Production Bootstrap",
        "port": 5000,
        "type": "FastAPI / Python",
        "description": "Production environment configuration and bootstrap",
        "features": [
            "Config validation",
            "Secret management",
            "Health checks",
            "Service discovery",
            "Startup orchestration"
        ],
        "env_vars": ["APP_ENV", "ASSETMIND_SECRET_KEY"],
        "endpoints": ["/health"]
    },
    "assetmind-reaction-engine": {
        "name": "Reaction Engine",
        "port": 5255,
        "type": "FastAPI / Python",
        "description": "Real-time market reaction analysis",
        "features": [
            "Price reaction",
            "Volume analysis",
            "Sentiment shifts",
            "Momentum detection",
            "Alert generation"
        ],
        "env_vars": ["DATABASE_URL", "REDIS_URL"],
        "endpoints": ["/health", "/api/reaction/{symbol}"]
    },
    "assetmind-realtime": {
        "name": "Real-Time Service",
        "port": 5261,
        "type": "WebSocket / Python",
        "description": "Real-time data streaming service",
        "features": [
            "WebSocket connections",
            "Real-time quotes",
            "Price alerts",
            "Portfolio updates",
            "Push notifications"
        ],
        "env_vars": ["REDIS_URL", "KAFKA_BROKERS"],
        "endpoints": ["/health", "/ws"]
    },
    "assetmind-reasoning": {
        "name": "Reasoning Engine",
        "port": 5055,
        "type": "FastAPI / Python",
        "description": "AI reasoning and explanation engine",
        "features": [
            "Logical reasoning",
            "Explanation generation",
            "Counterfactual analysis",
            "Decision justification",
            "Bias detection"
        ],
        "env_vars": ["DATABASE_URL", "LLM_API_KEY"],
        "endpoints": ["/health", "/api/reason", "/api/explain"]
    },
    "assetmind-report-generator": {
        "name": "Report Generator",
        "port": 5180,
        "type": "FastAPI / Python",
        "description": "Automated report generation service",
        "features": [
            "Template engine",
            "Multiple formats",
            "Scheduled reports",
            "Custom styling",
            "Email delivery"
        ],
        "env_vars": ["DATABASE_URL", "SMTP_HOST"],
        "endpoints": ["/health", "/api/reports", "/api/generate"]
    },
    "assetmind-research": {
        "name": "Research Agent",
        "port": 5130,
        "type": "FastAPI / Python",
        "description": "AI-powered investment research agent",
        "features": [
            "Company research",
            "Industry analysis",
            "Competitor comparison",
            "Data synthesis",
            "Report generation"
        ],
        "env_vars": ["DATABASE_URL", "SEC_API_KEY"],
        "endpoints": ["/health", "/api/research/{symbol}"]
    },
    "assetmind-rexmind": {
        "name": "REXMind",
        "port": 5160,
        "type": "Python / PyTorch",
        "description": "Research expert system with deep learning",
        "features": [
            "Deep research",
            "Knowledge synthesis",
            "Hypothesis generation",
            "Evidence evaluation",
            "Expert consultation"
        ],
        "env_vars": ["DATABASE_URL", "MODEL_PATH"],
        "endpoints": ["/health", "/api/research"]
    },
    "assetmind-rexmind-model": {
        "name": "REXMind Model",
        "port": 5160,
        "type": "Python / PyTorch",
        "description": "Core ML model for REXMind",
        "features": [
            "Transformer architecture",
            "Financial fine-tuning",
            "Knowledge distillation",
            "Model versioning",
            "A/B testing"
        ],
        "env_vars": ["MODEL_PATH", "GPU_DEVICE"],
        "endpoints": ["/health", "/api/model/predict"]
    },
    "assetmind-rl-trading": {
        "name": "RL Trading",
        "port": 5165,
        "type": "Python / PyTorch",
        "description": "Reinforcement learning trading agent",
        "features": [
            "RL agent training",
            "Policy optimization",
            "Backtesting",
            "Live trading",
            "Performance monitoring"
        ],
        "env_vars": ["DATABASE_URL", "MODEL_PATH"],
        "endpoints": ["/health", "/api/train", "/api/predict"]
    },
    "assetmind-scenario-engine": {
        "name": "Scenario Engine",
        "port": 5140,
        "type": "FastAPI / Python",
        "description": "Investment scenario modeling and analysis",
        "features": [
            "Scenario creation",
            "What-if analysis",
            "Stress testing",
            "Monte Carlo simulation",
            "Sensitivity analysis"
        ],
        "env_vars": ["DATABASE_URL"],
        "endpoints": ["/health", "/api/scenario", "/api/simulate"]
    },
    "assetmind-scoring": {
        "name": "Scoring Engine",
        "port": 5070,
        "type": "FastAPI / Python",
        "description": "Asset and portfolio scoring service",
        "features": [
            "Risk scoring",
            "Opportunity scoring",
            "Composite scores",
            "Peer comparison",
            "Historical tracking"
        ],
        "env_vars": ["DATABASE_URL"],
        "endpoints": ["/health", "/api/score/{symbol}"]
    },
    "assetmind-sdk": {
        "name": "Software Development Kit",
        "port": None,
        "type": "Python / TypeScript",
        "description": "Official SDKs for AssetMind API",
        "features": [
            "Python SDK",
            "TypeScript SDK",
            "Comprehensive documentation",
            "Example code",
            "Type definitions"
        ],
        "env_vars": ["ASSETMIND_API_KEY"],
        "endpoints": []
    },
    "assetmind-sec": {
        "name": "SEC EDGAR Connector",
        "port": 5020,
        "type": "FastAPI / Python",
        "description": "SEC EDGAR filing integration",
        "features": [
            "Filing search",
            "10-K/10-Q retrieval",
            "8-K event tracking",
            "Insider trading",
            "Filing alerts"
        ],
        "env_vars": ["DATABASE_URL", "SEC_API_KEY"],
        "endpoints": ["/health", "/api/filings", "/api/search"]
    },
    "assetmind-security": {
        "name": "Security Service",
        "port": 5000,
        "type": "FastAPI / Python",
        "description": "Authentication and security services",
        "features": [
            "User authentication",
            "API key management",
            "Token validation",
            "Permission management",
            "Audit logging"
        ],
        "env_vars": ["DATABASE_URL", "JWT_SECRET"],
        "endpoints": ["/health", "/api/auth", "/api/keys"]
    },
    "assetmind-semantic-search": {
        "name": "Semantic Search",
        "port": 5043,
        "type": "FastAPI / Python",
        "description": "Natural language search for financial data",
        "features": [
            "Semantic embeddings",
            "Vector search",
            "Question answering",
            "Document retrieval",
            "Relevance ranking"
        ],
        "env_vars": ["DATABASE_URL", "EMBEDDING_MODEL"],
        "endpoints": ["/health", "/api/search", "/api/qa"]
    },
    "assetmind-simulation": {
        "name": "Simulation Engine",
        "port": 5140,
        "type": "FastAPI / Python",
        "description": "Monte Carlo and other simulation engines",
        "features": [
            "Monte Carlo simulation",
            "Historical simulation",
            "Bootstrap methods",
            "Scenario generation",
            "Result visualization"
        ],
        "env_vars": ["DATABASE_URL"],
        "endpoints": ["/health", "/api/simulate"]
    },
    "assetmind-swagger": {
        "name": "API Documentation",
        "port": 5260,
        "type": "Swagger UI",
        "description": "Interactive API documentation",
        "features": [
            "Swagger UI",
            "OpenAPI 3.0 spec",
            "Try it out",
            "Code samples",
            "Authentication"
        ],
        "env_vars": [],
        "endpoints": ["/docs", "/openapi.json"]
    },
    "assetmind-tests": {
        "name": "Test Suite",
        "port": None,
        "type": "Python / pytest",
        "description": "Comprehensive test suite for AssetMind",
        "features": [
            "Unit tests",
            "Integration tests",
            "Performance tests",
            "Security tests",
            "Test coverage reports"
        ],
        "env_vars": ["TEST_DATABASE_URL"],
        "endpoints": []
    },
    "assetmind-trader": {
        "name": "Trading Engine",
        "port": 5150,
        "type": "FastAPI / Python",
        "description": "Core trading execution engine",
        "features": [
            "Order management",
            "Position tracking",
            "Trade reconciliation",
            "Commission calculation",
            "P&L reporting"
        ],
        "env_vars": ["DATABASE_URL", "BROKER_API_KEY"],
        "endpoints": ["/health", "/api/trade", "/api/orders"]
    },
    "assetmind-trading-engine": {
        "name": "Advanced Trading Engine",
        "port": 5150,
        "type": "FastAPI / Python",
        "description": "Advanced trading strategies and execution",
        "features": [
            "Algorithmic trading",
            "Strategy library",
            "Risk controls",
            "Execution optimization",
            "Real-time monitoring"
        ],
        "env_vars": ["DATABASE_URL", "BROKER_API_KEY"],
        "endpoints": ["/health", "/api/algo", "/api/strategies"]
    },
    "assetmind-twin-engine": {
        "name": "Twin Engine",
        "port": 5002,
        "type": "FastAPI / Python",
        "description": "Digital twin engine (core)",
        "features": [
            "Asset twins",
            "Market twins",
            "Portfolio twins",
            "Real-time sync",
            "Historical analysis"
        ],
        "env_vars": ["DATABASE_URL", "REDIS_URL"],
        "endpoints": ["/health", "/api/twin/{id}"]
    },
    "assetmind-twin-hub": {
        "name": "Twin Hub",
        "port": 5250,
        "type": "FastAPI / Python",
        "description": "Central orchestration for all digital twins",
        "features": [
            "Twin coordination",
            "Result aggregation",
            "Cross-twin analysis",
            "Unified API",
            "Performance optimization"
        ],
        "env_vars": ["DATABASE_URL"],
        "endpoints": ["/health", "/api/hub"]
    },
    "assetmind-twin-v2": {
        "name": "Twin Engine v2",
        "port": 5002,
        "type": "FastAPI / Python",
        "description": "Next-generation digital twin engine",
        "features": [
            "Enhanced models",
            "Improved accuracy",
            "Faster processing",
            "Better predictions",
            "Extended coverage"
        ],
        "env_vars": ["DATABASE_URL", "MODEL_PATH"],
        "endpoints": ["/health", "/api/v2/twin/{id}"]
    },
    "assetmind-underwriting": {
        "name": "Underwriting Engine",
        "port": 5175,
        "type": "FastAPI / Python",
        "description": "AI-powered investment underwriting",
        "features": [
            "Risk assessment",
            "Credit scoring",
            "Deal evaluation",
            "Covenant analysis",
            "Recommendation engine"
        ],
        "env_vars": ["DATABASE_URL"],
        "endpoints": ["/health", "/api/underwrite/{deal}"]
    },
    "assetmind-voice-bridge": {
        "name": "Voice Bridge",
        "port": 4850,
        "type": "FastAPI / Python",
        "description": "Voice interface for AssetMind",
        "features": [
            "Speech recognition",
            "Voice commands",
            "Audio responses",
            "Multi-language",
            "Voice authentication"
        ],
        "env_vars": ["VOICE_API_KEY", "STT_ENGINE"],
        "endpoints": ["/health", "/api/voice"]
    },
    "assetmind-workflow": {
        "name": "Workflow Engine",
        "port": 5100,
        "type": "FastAPI / Python",
        "description": "Investment workflow automation",
        "features": [
            "Workflow creation",
            "Task automation",
            "Approval flows",
            "Notifications",
            "Audit trail"
        ],
        "env_vars": ["DATABASE_URL"],
        "endpoints": ["/health", "/api/workflows"]
    },
    "assetmind-yfinance": {
        "name": "Yahoo Finance Connector",
        "port": 5010,
        "type": "Python",
        "description": "Yahoo Finance data integration",
        "features": [
            "Real-time quotes",
            "Historical data",
            "Company info",
            "Financial statements",
            "Options data"
        ],
        "env_vars": ["YAHOO_FINANCE_KEY"],
        "endpoints": ["/health"]
    }
}


def generate_readme(service_name: str, config: dict) -> str:
    """Generate a comprehensive README for a service."""
    name = config.get("name", service_name.replace("assetmind-", "").replace("-", " ").title())
    port = config.get("port")
    svc_type = config.get("type", "Python")
    description = config.get("description", "")
    features = config.get("features", [])
    env_vars = config.get("env_vars", [])
    endpoints = config.get("endpoints", [])

    port_str = f"**Port:** {port}" if port else ""
    port_note = f"\n- Default port: `{port}`" if port else ""

    env_section = ""
    if env_vars:
        env_section = "\n## Environment Variables\n\n| Variable | Required | Description |\n|----------|----------|-------------|\n"
        for var in env_vars:
            env_section += f"| `{var}` | Yes | See description |\n"

    endpoints_section = ""
    if endpoints:
        endpoints_section = "\n## API Endpoints\n\n| Method | Endpoint | Description |\n|--------|----------|-------------|\n"
        for ep in endpoints:
            method = "GET"
            if ep.startswith("/api/"):
                method = "GET/POST/PUT/DELETE"
            path = f"`{ep}`" if ep.startswith("/") else f"`/{ep}`"
            endpoints_section += f"| {method} | {path} | - |\n"

    features_section = ""
    if features:
        features_section = "\n### Features\n\n"
        for feature in features:
            features_section += f"- {feature}\n"

    docker_section = ""
    if port:
        docker_section = f"""
## Docker

```bash
# Build
docker build -t {service_name} .

# Run
docker run -p {port}:{port} \\
  -e APP_ENV=production \\
  {service_name}
```

"""

    return f"""# {name}

**Service:** {service_name}
{port_str}
**Type:** {svc_type}

## Overview

{description}

{features_section}
## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export APP_ENV=development{port_note}

# Start service
python main.py
```

{env_section}
{endpoints_section}
## Health Check

```bash
curl http://localhost:{port}/health
```

{docker_section}
## Architecture

```
{service_name}
├── main.py              # Entry point
├── src/                 # Source code
├── tests/               # Test suite
├── requirements.txt      # Dependencies
└── README.md            # This file
```

## Configuration

### Environment Modes

| Mode | Description |
|------|-------------|
| `development` | Local development with debug logging |
| `staging` | Staging environment |
| `production` | Production with optimized settings |

## Monitoring

- Health endpoint: `GET /health`
- Prometheus metrics: `GET /metrics`
- Ready endpoint: `GET /ready`

## Testing

```bash
# Run tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=src --cov-report=html

# Run specific test
pytest tests/ -k "test_name"
```

## See Also

- [Main README](../README.md) - Platform overview
- [Deployment Guide](../DEPLOYMENT.md) - Deployment instructions
- [Monitoring Guide](../MONITORING.md) - Monitoring setup
- [Security Guide](../SECURITY.md) - Security hardening

---

*Part of the AssetMind Financial Intelligence Platform*
"""


def main():
    """Generate READMEs for all services."""
    base_path = "/Users/rejaulkarim/Documents/RTMN/companies/AssetMind/codebase"

    for service_name, config in SERVICES.items():
        service_path = os.path.join(base_path, service_name)

        if not os.path.exists(service_path):
            print(f"⚠️  Service not found: {service_name}")
            continue

        readme_path = os.path.join(service_path, "README.md")

        # Generate README content
        readme_content = generate_readme(service_name, config)

        # Write README
        with open(readme_path, "w") as f:
            f.write(readme_content)

        print(f"✅ Generated: {service_name}/README.md")

    print(f"\n✨ Generated {len(SERVICES)} READMEs")


if __name__ == "__main__":
    main()
