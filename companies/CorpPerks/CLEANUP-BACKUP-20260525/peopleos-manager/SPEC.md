# PeopleOS Manager - SPEC.md

**Version:** 1.0.0
**Port:** (see config)
**Company:** CorpPerks
**Category:** HR

---

## Overview

HR manager dashboard for PeopleOS workforce platform. Provides tools for managing employees, approving leaves, viewing attendance reports, and handling HR operations.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PeopleOS Manager                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  Screens:                                                                  │
│  ├── Dashboard     → HR overview and metrics                              │
│  ├── Employees    → Employee directory                                    │
│  ├── Attendance   → Attendance reports                                    │
│  ├── Leave        → Leave management                                     │
│  └── Reports      → HR analytics                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Features

### Core Features
- Employee directory management
- Attendance monitoring
- Leave approval workflow
- Performance metrics
- Document management
- Announcement broadcasting

---

## Dependencies

```json
{
  "expo": "~50.0.0",
  "react": "18.2.0",
  "react-native": "0.73.2",
  "react-native-paper": "5.12.0",
  "@react-navigation/native": "^6.1.0",
  "expo-camera": "~14.0.0",
  "expo-barcode-scanner": "~12.9.0"
}
```

---

## Status

- [x] Employee management
- [x] Attendance tracking
- [x] Leave approval
- [x] HR reporting

