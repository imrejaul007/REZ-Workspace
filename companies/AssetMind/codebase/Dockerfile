# AssetMind - Docker Compose
# Runs all services

version: '3.8'

services:
  # ============================================
  # API & Gateway
  # ============================================
  api-gateway:
    build: ./assetmind-api-gateway
    ports:
      - "8000:8000"
    environment:
      - PORT=8000
    restart: unless-stopped

  # ============================================
  # AI Services
  # ============================================
  rexmind:
    build: ./assetmind-rexmind
    ports:
      - "5160:5160"
    environment:
      - PORT=5160
      - CUDA_VISIBLE_DEVICES=0
    restart: unless-stopped

  multi-agent:
    build: ./assetmind-multiagent
    ports:
      - "5190:5190"
    environment:
      - PORT=5190
    restart: unless-stopped

  council:
    build: ./assetmind-council
    ports:
      - "5195:5195"
    environment:
      - PORT=5195
    restart: unless-stopped

  # ============================================
  # Intelligence
  # ============================================
  reasoning:
    build: ./assetmind-reasoning
    ports:
      - "5055:5055"
    environment:
      - PORT=5055
    restart: unless-stopped

  event-os:
    build: ./assetmind-event-os
    ports:
      - "5052:5052"
    environment:
      - PORT=5052
    restart: unless-stopped

  workflow:
    build: ./assetmind-workflow
    ports:
      - "5290:5290"
    environment:
      - PORT=5290
    restart: unless-stopped

  copilot:
    build: ./assetmind-copilot
    ports:
      - "5295:5295"
    environment:
      - PORT=5295
    restart: unless-stopped

  # ============================================
  # Orchestration
  # ============================================
  intelligence-hub:
    build: ./assetmind-intelligence-hub
    ports:
      - "5298:5298"
    environment:
      - PORT=5298
    depends_on:
      - rexmind
      - council
      - reasoning
    restart: unless-stopped

  realtime:
    build: ./assetmind-realtime
    ports:
      - "5299:5299"
    environment:
      - PORT=5299
    restart: unless-stopped

  # ============================================
  # Data Connectors
  # ============================================
  yfinance:
    build: ./assetmind-yfinance
    ports:
      - "5010:5010"
    environment:
      - PORT=5010
    restart: unless-stopped

  sec-connector:
    build: ./assetmind-sec
    ports:
      - "5020:5020"
    environment:
      - PORT=5020
    restart: unless-stopped

  news:
    build: ./assetmind-news
    ports:
      - "5030:5030"
    environment:
      - PORT=5030
    restart: unless-stopped

  # ============================================
  # Twins
  # ============================================
  asset-twin:
    build: ./assetmind-asset-universe
    ports:
      - "5002:5002"
    environment:
      - PORT=5002
    restart: unless-stopped

  portfolio-twin:
    build: ./assetmind-portfolio-twin
    ports:
      - "5004:5004"
    environment:
      - PORT=5004
    restart: unless-stopped

  investor-twin:
    build: ./assetmind-investor-twin
    ports:
      - "5005:5005"
    environment:
      - PORT=5005
    restart: unless-stopped

  # ============================================
  # Knowledge
  # ============================================
  knowledge-graph:
    build: ./assetmind-knowledge-graph
    ports:
      - "5040:5040"
    environment:
      - PORT=5040
      - NEO4J_URI=bolt://neo4j:7687
    depends_on:
      - neo4j
    restart: unless-stopped

  ontology:
    build: ./assetmind-ontology
    ports:
      - "5045:5045"
    environment:
      - PORT=5045
    restart: unless-stopped

  # ============================================
  # Memory
  # ============================================
  memory:
    build: ./assetmind-memory
    ports:
      - "5030:5030"
    environment:
      - PORT=5030
    restart: unless-stopped

  # ============================================
  # Trading
  # ============================================
  backtest:
    build: ./assetmind-backtest
    ports:
      - "5200:5200"
    environment:
      - PORT=5200
    restart: unless-stopped

  paper-trading:
    build: ./assetmind-paper-trading
    ports:
      - "5210:5210"
    environment:
      - PORT=5210
    restart: unless-stopped

  # ============================================
  # Frontend
  # ============================================
  dashboard:
    build: ./assetmind-dashboard
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
    restart: unless-stopped

  # ============================================
  # Production
  # ============================================
  production:
    build: ./assetmind-production
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - POSTGRES_URI=postgresql://assetmind:password@postgres:5432/assetmind
      - REDIS_URI=redis://redis:6379
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  # ============================================
  # Databases
  # ============================================
  postgres:
    image: timescale/timescaledb:latest-pg16
    environment:
      - POSTGRES_USER=assetmind
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=assetmind
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    command: redis-server --maxmemory 2gb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  neo4j:
    image: neo4j:5
    environment:
      - NEO4J_AUTH=neo4j/password
    volumes:
      - neo4j_data:/data
    ports:
      - "7474:7474"
      - "7687:7687"

  # ============================================
  # Monitoring
  # ============================================
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  postgres_data:
  redis_data:
  neo4j_data:
  grafana_data:

networks:
  default:
    name: assetmind-network
