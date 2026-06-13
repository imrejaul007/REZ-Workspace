# 🤖 Agent Framework - Features

**Service:** Agent Base Framework  
**Location:** `core/agent-framework/`  
**Status:** ✅ PRODUCTION READY

---

## Core Features

### 1. Base Agent Class
- [x] Shared foundation for all agents
- [x] Standard interface
- [x] Extensible design
- [x] Event system
- [x] Lifecycle hooks

### 2. Redis Integration
- [x] Session management
- [x] State caching
- [x] Pub/Sub support
- [x] Connection pooling
- [x] Auto-reconnect

### 3. Logging
- [x] Winston logger
- [x] Structured logs
- [x] Log levels
- [x] File rotation
- [x] Error tracking

### 4. Environment Config
- [x] dotenv support
- [x] Environment variables
- [x] Development/Production modes
- [x] Secret management

---

## Architecture

```
Agent Framework
├── Base Agent Class
├── Redis Client
├── Logger (Winston)
├── Express Server
└── UUID Generator
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| express | ^4.18.2 | Web framework |
| ioredis | ^5.3.2 | Redis client |
| winston | ^3.11.0 | Logging |
| uuid | ^9.0.1 | UUID generation |
| dotenv | ^16.3.1 | Environment config |

---

## Related Services

| Service | Description |
|---------|-------------|
| AgentOS Hub | Central registry for agents |
| HOJAI Expert OS | Agent runtime platform |
| Workflow Bridge | Agent-Workflow integration |

---

**Documentation:** [CLAUDE.md](./CLAUDE.md)
