# Cross-Sell Service - Statement of Truth

## Service Overview
- **Name**: Cross-Sell Service
- **Port**: 3001
- **Type**: CRM Micro-service
- **Version**: 1.0.0

## Core Functionality
Identifies and manages cross-sell opportunities across all 15 Industry AI products by analyzing customer industry profiles and recommending relevant cross-industry services.

## Key Features
1. **Opportunity Identification**: Automatically identifies cross-sell opportunities based on industry relationships
2. **Scoring System**: Calculates opportunity scores based on customer profile completeness and transaction history
3. **Industry Relationships**: Maps natural cross-sell paths between 15 industries (waitron, shopflow, staybot, carecode, glamai, fitmind, teammind, ledgerai, fleetiq, propflow, neighborai, learniq, tripmind, franchiseiq, prodflow)
4. **Status Tracking**: Manages opportunity lifecycle (identified, contacted, converted, declined, ignored)
5. **Campaign Recommendations**: Generates actionable recommendations for cross-sell campaigns

## API Endpoints

### Opportunities
- `POST /api/opportunities` - Create opportunity for customer
- `GET /api/opportunities` - Get all opportunities with filtering
- `GET /api/opportunities/:id` - Get opportunity by ID
- `PUT /api/opportunities/:id` - Update opportunity
- `POST /api/opportunities/:id/contact` - Mark as contacted
- `POST /api/opportunities/:id/convert` - Mark as converted
- `POST /api/opportunities/:id/decline` - Mark as declined
- `POST /api/opportunities/:id/ignore` - Mark as ignored
- `DELETE /api/opportunities/:id` - Delete opportunity

### Analytics
- `GET /api/analysis` - Get cross-sell analysis
- `GET /api/recommendations` - Get campaign recommendations
- `GET /api/relationships` - Get industry relationship map

### Rules
- `GET /api/rules` - Get all rules
- `PUT /api/rules/:id` - Update rule

## Health Check
- `GET /health` - Service health status

## Dependencies
- express
- cors
- uuid
- winston

## Data Models
- CrossSellOpportunity
- CrossSellRule
- TriggerCondition
- CrossSellAnalysis

## Status
**READY FOR PRODUCTION**
