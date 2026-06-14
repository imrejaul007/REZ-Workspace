# CLAUDE.md - Finance Budget Coach

## Project Overview

**Name:** Finance Budget Coach  
**Company:** RidZa  
**Type:** AI Budget Planning & Simulation  
**Port:** 3000  
**Tagline:** Budget Planning & Simulation

## Product Description

AI-powered budget planning, advice, and scenario simulation service. Helps businesses manage their finances with smart recommendations.

## Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB with Mongoose
- **Security:** Helmet, CORS, JWT
- **Validation:** Zod

## Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Development server |
| `npm run build` | Build for production |
| `npm start` | Production server |

## API Endpoints

### Budget Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/budgets/:tenantId` | GET | List budgets |
| `/api/budgets/:tenantId` | POST | Create budget |
| `/api/budgets/:tenantId/:id` | PUT | Update budget |
| `/api/budgets/:tenantId/:id` | DELETE | Delete budget |
| `/api/budgets/categories` | GET | List categories |

### AI Advice & Simulation
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/budgets/:tenantId/advice` | GET | AI recommendations |
| `/api/simulate/:tenantId` | POST | Run scenario simulation |

## Budget Categories
- housing, transportation, food, utilities
- healthcare, entertainment, savings, debt, other

## Features Checklist

- [x] Budget CRUD operations
- [x] AI-powered recommendations
- [x] Scenario simulation
- [x] Category-based tracking
- [x] Fiscal year support
- [x] JWT authentication
- [x] Health check endpoints
- [x] Docker support

**Last Updated:** 2026-06-12
