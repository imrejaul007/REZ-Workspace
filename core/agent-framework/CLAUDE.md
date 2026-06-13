# 🤖 Agent Framework

## Overview

**Service Name:** Agent Base Framework  
**Version:** 1.0.0  
**Location:** `core/agent-framework/`  
**Purpose:** Shared foundation for all AI agents in RTNM Industry OS

**Status:** ✅ PRODUCTION READY  
**Last Updated:** June 13, 2026

---

## Quick Start

```bash
cd core/agent-framework
npm install
npm start
```

---

## Features

| Feature | Description | Status |
|---------|-------------|--------|
| Base Agent Class | Shared foundation for all agents | ✅ |
| Redis Integration | Fast session management | ✅ |
| Structured Logging | Winston logging | ✅ |
| UUID Generation | Unique agent IDs | ✅ |
| Express Server | HTTP API foundation | ✅ |
| Environment Config | dotenv support | ✅ |

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

## Usage

```javascript
import { BaseAgent } from './src/index.js';

class MyAgent extends BaseAgent {
  async process(input) {
    // Agent logic
    return { result: 'processed' };
  }
}
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

## Related Documentation

- [AgentOS Hub CLAUDE.md](../agentos-hub/CLAUDE.md)
- [HOJAI AI CLAUDE.md](../../companies/hojai-ai/CLAUDE.md)
- [RTNM-COMPANIES-AUDIT.md](../../RTNM-COMPANIES-AUDIT.md)

---

**Built with ❤️ by RTNM**
