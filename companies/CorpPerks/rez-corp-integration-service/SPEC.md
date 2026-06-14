# REZ Corp Integration Service - SPEC.md

**Version:** 1.0.0
**Port:** (see config)
**Company:** CorpPerks
**Category:** Integration

---

## Overview

Integration service connecting CorpPerks to RABTUL platform services. Bridges employee benefits, corporate features, and REZ ecosystem capabilities.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│               REZ Corp Integration Service                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  Integrations:                                                            │
│  ├── RABTUL Auth    → Employee authentication                           │
│  ├── RABTUL Wallet  → Corporate wallet/benefits                        │
│  ├── RABTUL Payment → Corporate payments                               │
│  └── CorpPerks APIs → Benefits platform                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Status

- [x] CorpPerks to RABTUL bridge
- [x] Auth integration
- [x] Payment integration

