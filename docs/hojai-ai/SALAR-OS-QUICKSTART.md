# SALAR OS - Quick Start Guide

**Version:** 2.0 | **Date:** June 10, 2026

---

## Prerequisites

1. **MongoDB** running on `mongodb://localhost:27017`
2. **Node.js** 18+ with npm

---

## 1. Start Salar OS

```bash
# Navigate to Salar OS
cd CorpPerks/salar-os

# Install dependencies
npm install

# Start the service
npm run dev

# Service runs on port 4710
# Check health: http://localhost:4710/health
```

---

## 2. Initialize Capabilities

```bash
# Initialize 50+ master capabilities
curl -X POST http://localhost:4710/capabilities/init \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "total": 54,
    "created": 54,
    "existing": 0
  }
}
```

---

## 3. Create Agent Twins

```bash
# Create Agent Twin
curl -X POST http://localhost:4710/agent-twin \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "CI-AGT-001",
    "name": "Auth Agent",
    "type": "SPECIALIZED",
    "capabilities": [
      {"name": "Python", "level": "ADVANCED"},
      {"name": "Security", "level": "EXPERT"}
    ]
  }'
```

---

## 4. Create Human Twins

```bash
# Create Human Twin
curl -X POST http://localhost:4710/human-twin \
  -H "Content-Type: application/json" \
  -d '{
    "corpId": "CI-IND-001",
    "name": "John Developer",
    "role": "Senior Software Engineer",
    "department": "Engineering",
    "skills": [
      {"name": "Python", "level": "ADVANCED"},
      {"name": "JavaScript", "level": "INTERMEDIATE"}
    ]
  }'
```

---

## 5. Map Capabilities

```bash
# Map Python capability to Human
curl -X POST http://localhost:4710/capabilities/mappings \
  -H "Content-Type: application/json" \
  -d '{
    "capabilityId": "CAP-XXXXXXXX-XXXX",
    "entityType": "HUMAN",
    "entityId": "CI-IND-001",
    "level": "ADVANCED",
    "evidence": [
      {"type": "PROJECT", "sourceName": "GitHub PR #123", "weight": 0.8}
    ]
  }'

# Map Python capability to Agent
curl -X POST http://localhost:4710/capabilities/mappings \
  -H "Content-Type: application/json" \
  -d '{
    "capabilityId": "CAP-XXXXXXXX-XXXX",
    "entityType": "AGENT",
    "entityId": "CI-AGT-001",
    "level": "EXPERT"
  }'
```

---

## 6. Create Hybrid Team

```bash
# Create Hybrid Team
curl -X POST http://localhost:4710/hybrid-team \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Engineering Hybrid Team",
    "supervisor": "CI-IND-001",
    "humans": [
      {"corpId": "CI-IND-001", "name": "John Developer", "role": "LEAD"}
    ],
    "agents": [
      {"agentId": "CI-AGT-001", "name": "Auth Agent", "role": "EXECUTE"}
    ]
  }'
```

---

## 7. Find Workforce for Task

```bash
# Find best workforce
curl -X POST http://localhost:4710/workforce/find \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Build authentication feature",
    "capabilities": ["python", "security"],
    "allowHybrid": true
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "task": "Build authentication feature",
    "candidates": {
      "humans": [...],
      "agents": [...]
    },
    "hybridRecommendation": {
      "description": "Hybrid team recommended",
      "humans": [...],
      "agents": [...]
    }
  }
}
```

---

## 8. Check Network Status

```bash
# Get Workforce Twin Network status
curl http://localhost:4710/network
```

Expected response:
```json
{
  "success": true,
  "data": {
    "network": {
      "status": "ACTIVE",
      "entities": {
        "humans": 1,
        "agents": 1,
        "hybridTeams": 1,
        "total": 3
      },
      "capabilities": {
        "defined": 54,
        "mapped": 4
      }
    }
  }
}
```

---

## 9. Sutar Bridge

```bash
# Sutar requests workforce decision
curl -X POST http://localhost:4710/sutar/bridge/workforce-decision \
  -H "Content-Type: application/json" \
  -d '{
    "decisionId": "dec-123",
    "requiredCapabilities": ["python", "security"],
    "allowHybrid": true
  }'
```

---

## 10. Record Task Outcome

```bash
# Record task completion
curl -X POST http://localhost:4710/agent-twin/CI-AGT-001/task \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "task-001",
    "description": "Build authentication",
    "outcome": "SUCCESS",
    "duration": 3600000,
    "quality": 0.95,
    "cost": 0.05
  }'
```

---

## Using Scripts

### Register AI Employees

```bash
# Preview registration (dry run)
npx tsx scripts/register-ai-employees.ts --dry-run

# Execute registration
npx tsx scripts/register-ai-employees.ts
```

### Generate Human Twins

```bash
# Preview generation (dry run)
npx tsx scripts/generateHumanTwins.ts --dry-run

# Execute generation
npx tsx scripts/generateHumanTwins.ts
```

### Generate Hybrid Teams

```bash
# Preview generation (dry run)
npx tsx scripts/generateHybridTeams.ts --dry-run

# Execute generation
npx tsx scripts/generateHybridTeams.ts
```

---

## Service Health

```bash
# Health check
curl http://localhost:4710/health

# Readiness check
curl http://localhost:4710/health/ready

# Service info
curl http://localhost:4710/
```

---

## Common Issues

### MongoDB Connection Failed

```bash
# Start MongoDB
mongod --dbpath /path/to/data

# Or use Docker
docker run -d -p 27017:27017 mongo
```

### Port Already in Use

```bash
# Change port
export PORT=4711
npm run dev
```

### Capabilities Not Found

```bash
# Initialize capabilities first
curl -X POST http://localhost:4710/capabilities/init
```

---

## Next Steps

1. **Connect to CorpID** - Link to CorpPerks employee data
2. **Connect to MemoryOS** - Add evidence from events
3. **Connect to Sutar** - Enable autonomous decisions
4. **Build App** - Create UI on top of these APIs

---

## Full API Documentation

See [SALAR-OS.md](SALAR-OS.md) for complete API reference.

---

**Quick Start Complete | June 10, 2026**
