# REZ Accounting Admin Portal

**Port:** 3012  
**Industry:** Accounting  
**Company:** REZ-Merchant

## Overview

Comprehensive accounting administration dashboard for managing financial operations, invoicing, expense tracking, and GST compliance.

## Features

- 📊 **Dashboard** - Financial overview with key metrics
- 📄 **Invoices** - Create, manage, and track invoices
- 💰 **Expenses** - Expense tracking and categorization
- 📋 **GST Filing** - GST return preparation and filing
- 📈 **Reports** - Financial reports and analytics
- 🏦 **Bank Reconciliation** - Bank statement matching

## Quick Start

```bash
cd REZ-accounting-admin-web
pnpm install
pnpm dev  # → http://localhost:3012
```

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Recharts
- Lucide Icons

## Related Services

- [REZ-Merchant API Gateway](../rez-merchant-api-gateway)
- [REZ Invoice Service](../../services/rez-invoice-service)
- [REZ GST Service](../../services/rez-gst-service)

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
REZ_API_KEY=your-api-key
```
