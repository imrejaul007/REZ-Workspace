# HomeServices OS - Home Services Platform

**Status:** ✅ BUILT - June 14, 2026  
**Port:** 5140  
**Location:** `industries/homeservices-os/`

## Overview

HomeServices OS provides a comprehensive platform for home service businesses, connecting providers, customers, bookings, and services with AI-powered dispatch and quotes.

## Digital Twins

| Twin | Description | Capabilities |
|------|-------------|--------------|
| **Provider Twin** | Service provider profiles | Skills, availability |
| **Customer Twin** | Customer profiles | Address, preferences |
| **Booking Twin** | Service appointments | Scheduling, tracking |
| **Service Twin** | Service catalog | Pricing, duration |

## AI Agents

| Agent | Purpose |
|-------|---------|
| **Dispatcher Agent** | Job assignment |
| **QuoteGen Agent** | Quote generation |
| **Scheduling Agent** | Route optimization |
| **CustomerRet Agent** | Customer retention |
| **InventoryMgmt Agent** | Parts inventory |

## Quick Start

```bash
cd industries/homeservices-os && npm install && node src/index.js
curl http://localhost:5140/health
```

## Integration

- Connected to RTMN Hub at `http://localhost:8000`
- HomeServices Agent available via AgentOS
- Maps integration (Transport OS)
- Payment via RABTUL