# RTNM Digital - Quick Start Guide

**Date:** June 10, 2026
**New Services:** 8

---

## 🚀 Start All New Services

```bash
# Option 1: Using the script
chmod +x scripts/start-all-services.sh
./scripts/start-all-services.sh start

# Option 2: Docker
docker-compose -f docker-compose-new-services.yml up -d

# Option 3: Manual (each service)
cd <service-dir> && npm install && npm run dev
```

---

## 📊 New Services Summary

| Port | Service | Category |
|------|---------|----------|
| 4100 | Developer Platform | APIs, SDKs, Docs |
| 4150 | Agent Wallet | Payments, Escrow |
| 4160 | Agent Identity | Registry, Certification |
| 4170 | Arabic AI | STT, TTS, NLU |
| 4180 | Agent Marketplace | Ratings, Reviews |
| 4190 | Trust Network | Identity, Score |
| 4530 | Islamic Finance | BNPL, Zakat |
| 4540 | Remittance | P2P Transfers |

---

## ✅ Health Check All Services

```bash
# Quick health check
./scripts/start-all-services.sh health

# Or manually
for port in 4100 4150 4160 4170 4180 4190 4530 4540; do
  curl -s http://localhost:$port/health | jq -r '.status' 2>/dev/null && echo " Port $port" || echo "✗ Port $port"
done
```

---

## 🧪 Test All APIs

```bash
# Test all services
./scripts/test-all-apis.sh all

# Test single service
./scripts/test-all-apis.sh single 4190
```

---

## 📡 Key API Endpoints

### Trust Network (4190)
```bash
# Create identity
curl -X POST http://localhost:4190/api/identity/create \
  -H "Content-Type: application/json" \
  -d '{"type":"human","humanName":"John Doe"}'

# Get trust score
curl http://localhost:4190/api/score/RTNM-HUM-12345
```

### Agent Wallet (4150)
```bash
# Create wallet
curl -X POST http://localhost:4150/api/wallet/create \
  -d '{"agentId":"AGT-001"}'

# Deposit funds
curl -X POST http://localhost:4150/api/wallet/AGT-001/deposit \
  -d '{"amount":1000,"currency":"USD"}'
```

### Agent Identity (4160)
```bash
# Create agent
curl -X POST http://localhost:4160/api/agents \
  -d '{"name":"Sales Agent","owner":"company1"}'

# Verify agent
curl -X POST http://localhost:4160/api/agents/AGT-001/verify
```

### Arabic AI (4170)
```bash
# Arabic STT
curl -X POST http://localhost:4170/api/stt/transcribe \
  -d '{"text":"مرحبا"}'

# Arabic TTS
curl -X POST http://localhost:4170/api/tts/synthesize \
  -d '{"text":"مرحبا","voice":"fatima"}'
```

### Islamic Finance (4530)
```bash
# Islamic BNPL
curl -X POST http://localhost:4530/api/bnpl/apply \
  -d '{"userId":"U001","amount":1000,"tenure":3}'

# Calculate Zakat
curl -X POST http://localhost:4530/api/zakat/calculate \
  -d '{"userId":"U001","assets":{"cash":50000}}'
```

### Remittance (4540)
```bash
# Get exchange rate
curl http://localhost:4540/api/rates/USD/AED

# Send money
curl -X POST http://localhost:4540/api/transfer/send \
  -d '{"senderId":"U001","recipientId":"U002","amount":100,"currency":"USD","targetCurrency":"INR"}'
```

---

## 📁 New Directories

```
rtnm-trust-network/           # Trust Network (Port 4190)
hojai-agent-wallet/            # Agent Wallet (Port 4150)
hojai-agent-identity/         # Agent Identity (Port 4160)
hojai-agent-marketplace-2/    # Agent Marketplace (Port 4180)
hojai-developer-platform/     # Developer Platform (Port 4100)
hojai-arabic-ai/              # Arabic AI (Port 4170)
ridza-islamic-finance/        # Islamic Finance (Port 4530)
ridza-remittance/             # Remittance (Port 4540)
```

---

## 📝 Stop All Services

```bash
# Using script
./scripts/start-all-services.sh stop

# Or kill by port
for port in 4100 4150 4160 4170 4180 4190 4530 4540; do
  lsof -ti :$port | xargs kill 2>/dev/null
done
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| PORTS.md | Complete port documentation |
| BUILD-SUMMARY-JUNE-2026.md | Build summary |
| GAPS-ANALYSIS.md | Gap analysis |
| RTNM-COMPANIES-AUDIT.md | Company audit |
| ECOSYSTEM-REGISTRY.md | Service registry |

---

**Happy Coding! 🚀**