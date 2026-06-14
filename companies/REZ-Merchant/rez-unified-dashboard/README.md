# REZ Unified Merchant Dashboard

**Single dashboard for all merchant operations.**

## Overview

This dashboard aggregates data from ALL ReZ services into a single view:

| Section | Data Source |
|---------|-------------|
| **Revenue** | RABTUL Payment + Wallet |
| **Orders** | RABTUL Order Service |
| **Customers** | REZ-Merchant CRM |
| **Inventory** | RABTUL Catalog |
| **Loyalty** | REZ-Media Engagement |
| **Marketing** | REZ-Media Campaigns |
| **B2B** | REZ-Merchant NexTaBizz |
| **Trust Score** | RTNM-Digital Trust |

## Quick Start

```bash
cd REZ-Merchant/rez-unified-dashboard
npm install
NEXT_PUBLIC_GATEWAY_URL=http://localhost:4080 npm run dev
```

## Features

### Dashboard Sections

- **Overview Cards** - Revenue, Orders, Customers, Balance
- **Recent Orders** - Latest transactions
- **Marketing Campaigns** - Active campaign status
- **Loyalty Program** - Member stats
- **Low Stock Alerts** - Inventory warnings
- **B2B Suppliers** - Supplier management

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              REZ Unified Merchant Dashboard                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   │
│  │Revenue │   │Orders  │   │Customers│   │Balance │   │
│  │ Card   │   │ Card   │   │  Card   │   │  Card   │   │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘   │
│                                                               │
│  ┌─────────────────────┐   ┌─────────────────────┐           │
│  │   Recent Orders    │   │    Loyalty Stats   │           │
│  └─────────────────────┘   └─────────────────────┘           │
│  ┌─────────────────────┐   ┌─────────────────────┐           │
│  │  Marketing        │   │   Low Stock       │           │
│  │  Campaigns        │   │   Alerts         │           │
│  └─────────────────────┘   └─────────────────────┘           │
│  ┌─────────────────────┐   ┌─────────────────────┐           │
│  │  B2B Suppliers    │   │   Trust Score     │           │
│  └─────────────────────┘   └─────────────────────┘           │
│                                                               │
│                          ▼                                     │
│            ┌─────────────────────────┐                        │
│            │  REZ Merchant Gateway  │                        │
│            │     (Port 4080)       │                        │
│            └─────────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## Environment Variables

```bash
NEXT_PUBLIC_GATEWAY_URL=http://localhost:4080
```
