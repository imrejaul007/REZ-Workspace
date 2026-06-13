# SUTAR OS - Features

**Status:** ✅ BUILT | **Port:** 4002 | **Updated:** June 14, 2026

---

## Overview

SUTAR (System for Unified Task Assignment and Response) is Autonomous Economic Infrastructure enabling agents to find, negotiate, contract, and transact autonomously.

---

## 12-Layer Architecture

| Layer | Port | Service | Purpose |
|-------|------|---------|---------|
| **Trigger** | 4018 | Intent Capture | Human/system goal input |
| **Intent Graph** | 4018 | Intent Processing | Pattern recognition |
| **GoalOS** | 4242 | Goal Decomposition | Break goals into sub-goals |
| **Discovery** | 4155 | Agent Discovery | Find capable agents |
| **Negotiation** | 4155 | Negotiation Engine | Terms agreement |
| **Trust** | 4250 | Trust Engine | SLB, reputation |
| **Contract** | 4252 | Smart Contracts | Self-executing |
| **Execution** | 4002 | Task Execution | Agent actions |
| **Economy** | 4251 | Agent Economy | Karma, SLB, payments |
| **Simulation** | 4155 | What-If Engine | Scenario testing |
| **Orchestration** | 4002 | Workflow | Multi-agent coordination |
| **Audit** | 4002 | Audit Trail | Transaction logging |

---

## 27 Services

### Core Services
- **sutar-trigger** - Intent capture
- **sutar-intent-graph** - Intent processing
- **sutar-goal-os** - Goal decomposition
- **sutar-execution-engine** - Task execution

### Discovery & Matching
- **sutar-discovery** - Agent discovery
- **sutar-negotiation** - Terms negotiation
- **sutar-matching** - Capability matching

### Trust & Contracts
- **sutar-trust-engine** - SLB and reputation
- **sutar-contract-engine** - Smart contracts
- **sutar-reputation** - Reputation scoring

### Economy
- **sutar-economy** - Karma and payments
- **sutar-escrow** - Payment escrow
- **sutar-payments** - Payment processing

### Simulation & Planning
- **sutar-simulation** - What-if scenarios
- **sutar-planning** - Action planning
- **sutar-forecasting** - Outcome prediction

### Orchestration
- **sutar-orchestration** - Workflow orchestration
- **sutar-coordination** - Multi-agent coordination
- **sutar-monitoring** - Execution monitoring

### Infrastructure
- **sutar-memory** - Memory integration
- **sutar-agent-registry** - Agent registry
- **sutar-twin-registry** - Twin registry
- **sutar-audit** - Audit trail
- **sutar-connection** - RTMN Hub connection

### Autonomous Agents
- **sutar-agent-1** through **sutar-agent-10**

---

## Key Features

### Intent Processing
- Natural language understanding
- Context enrichment
- Pattern recognition
- Similar intent detection

### Goal Decomposition
- Automatic sub-goal creation
- Dependency mapping
- Priority assignment
- Resource estimation

### Agent Discovery
- Capability matching
- Reputation filtering
- Availability checking
- Cost optimization

### Negotiation
- Multi-round negotiation
- Price discovery
- Terms agreement
- Counter-offer handling

### Trust & Reputation
- SLB (Service Level Bond) staking
- Karma scoring
- Performance tracking
- Verification system

### Smart Contracts
- Self-executing agreements
- Condition-based triggers
- Automatic payments
- Dispute resolution

### Economy
- Karma rewards
- SLB staking/slashing
- Payment escrow
- Leaderboard tracking

### Simulation
- What-if scenarios
- Outcome prediction
- Risk assessment
- Strategy optimization

---

## API Endpoints

### Core
- `GET /health` - Health check
- `POST /api/intents` - Submit intent
- `GET /api/intents/:id` - Get intent
- `GET /api/goals` - List goals
- `GET /api/goals/:id` - Get goal

### Discovery
- `GET /api/discover` - Discover agents
- `POST /api/match` - Match agents
- `GET /api/agents/:id` - Agent details

### Negotiation
- `POST /api/negotiate` - Start negotiation
- `PUT /api/negotiate/:id` - Update terms
- `POST /api/negotiate/:id/accept` - Accept

### Contracts
- `POST /api/contracts` - Create contract
- `GET /api/contracts/:id` - Get contract
- `PUT /api/contracts/:id/execute` - Execute

### Economy
- `GET /api/economy/balance/:corpId` - Balance
- `POST /api/economy/karma/award` - Award karma
- `POST /api/economy/slb/stake` - Stake SLB

---

## Integrations

| Service | Integration Type | Purpose |
|---------|-----------------|---------|
| RTMN Hub | HTTP | Platform access |
| AgentOS | HTTP | Agent invocation |
| TwinOS Hub | HTTP | Twin data |
| Memory OS | HTTP | Context storage |
| BOA | Event | Strategic goals |

---

## Quick Start

```bash
cd industries/sutar-os
npm install
node src/index.js
# Runs on http://localhost:4002
```
