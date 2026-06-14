# REZ Buyer Mapping Service

**Port:** 4134  
**Status:** Complete

## Overview

Maps buyer personas to decision-makers within target accounts. Identifies the buying committee, tracks engagement, and provides coverage analysis for B2B sales deals.

## Features

- **Buyer Personas** - Define and manage buyer archetypes with pain points, goals, and communication preferences
- **Contact Management** - Track decision makers with role, influence level, and engagement status
- **Stakeholder Maps** - Visual org charts showing decision-making structure
- **Buyer Matrix** - Real-time coverage analysis for each deal
- **Gap Analysis** - Identify missing roles and engagement gaps
- **Recommendations** - AI-powered suggestions to improve coverage

## Data Model

### BuyerPersona

```typescript
interface BuyerPersona {
  _id: ObjectId;
  tenantId: string;
  
  // Definition
  name: string;
  description: string;
  industry?: string;
  companySize?: string[];
  
  // Characteristics
  painPoints: string[];
  goals: string[];
  buyingTriggers: string[];
  communicationStyle: 'formal' | 'casual' | 'technical' | 'relationship';
  decisionTimeline: 'impulsive' | 'short' | 'moderate' | 'long';
  
  // Objections
  commonObjections: { objection: string; response: string; severity: string }[];
  
  // Usage
  usageCount: number;
  successRate?: number;
}
```

### Contact (Decision Maker)

```typescript
interface Contact {
  _id: ObjectId;
  tenantId: string;
  
  // Identity
  email: string;
  firstName: string;
  lastName: string;
  title?: string;
  department?: string;
  
  // Company
  companyName: string;
  companyId?: string;
  industry?: string;
  companySize?: string;
  
  // Decision Role
  decisionRole: 'champion' | 'economic_buyer' | 'technical_buyer' | 
                'legal_buyer' | 'user_buyer' | 'executive_sponsor' | 
                'influencer' | 'coach';
  influenceLevel: 'critical' | 'high' | 'medium' | 'low';
  
  // Engagement
  status: 'identified' | 'contacted' | 'engaged' | 'qualified' | 'advocate';
  engagementLevel: 'none' | 'low' | 'medium' | 'high' | 'champion';
  touchpoints: number;
  lastContactedAt?: Date;
  
  // Persona Match
  matchedPersonas: ObjectId[];
  
  // Coach Support
  isCoach: boolean;
  coachRating?: number;
  coachingNotes?: string;
}
```

### BuyerMatrix

```typescript
interface BuyerMatrix {
  _id: ObjectId;
  tenantId: string;
  
  // Deal Reference
  dealId: string;
  accountId: string;
  
  // Coverage
  coverage: {
    overall: number;      // 0-100
    economic: number;     // Economic buyer coverage
    technical: number;   // Technical evaluator coverage
    champion: number;    // Internal champion strength
    executive: number;    // Executive sponsorship
  };
  
  // Gaps
  gaps: GapAnalysis[];
  
  // Recommendations
  recommendations: Recommendation[];
}
```

## API Endpoints

### Personas

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/personas` | Create persona |
| GET | `/api/v1/personas` | List personas |
| GET | `/api/v1/personas/:id` | Get persona |
| PATCH | `/api/v1/personas/:id` | Update persona |
| DELETE | `/api/v1/personas/:id` | Delete persona |
| POST | `/api/v1/personas/:id/match` | Match contacts to persona |
| GET | `/api/v1/personas/recommend/:contactId` | Get recommended personas |

### Contacts

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/contacts` | Create contact |
| GET | `/api/v1/contacts` | List contacts |
| GET | `/api/v1/contacts/:id` | Get contact |
| PATCH | `/api/v1/contacts/:id` | Update contact |
| DELETE | `/api/v1/contacts/:id` | Delete contact |
| POST | `/api/v1/contacts/:id/interactions` | Add interaction |
| GET | `/api/v1/contacts/:id/interactions` | Get interactions |
| PATCH | `/api/v1/contacts/:id/engagement` | Update engagement |
| POST | `/api/v1/contacts/bulk` | Bulk create |
| GET | `/api/v1/contacts/search` | Search contacts |

### Stakeholder Maps

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/stakeholder-maps` | Create map |
| GET | `/api/v1/stakeholder-maps` | List maps |
| GET | `/api/v1/stakeholder-maps/:id` | Get map |
| PATCH | `/api/v1/stakeholder-maps/:id` | Update map |
| DELETE | `/api/v1/stakeholder-maps/:id` | Delete map |
| POST | `/api/v1/stakeholder-maps/:id/contacts` | Add contact |
| DELETE | `/api/v1/stakeholder-maps/:id/contacts/:contactId` | Remove contact |
| POST | `/api/v1/stakeholder-maps/:id/relationships` | Add relationship |
| POST | `/api/v1/stakeholder-maps/:id/blockers` | Add blocker |
| POST | `/api/v1/stakeholder-maps/:id/calculate-coverage` | Calculate coverage |
| GET | `/api/v1/stakeholder-maps/account/:accountId` | Get by account |

### Buyer Matrix

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/matrix/generate` | Generate matrix |
| GET | `/api/v1/matrix/deal/:dealId` | Get matrix by deal |
| GET | `/api/v1/matrix/account/:accountId` | Get matrices by account |
| PATCH | `/api/v1/matrix/deal/:dealId/contacts/:contactId` | Update contact |
| GET | `/api/v1/matrix/deal/:dealId/gaps` | Get gaps |
| GET | `/api/v1/matrix/deal/:dealId/recommendations` | Get recommendations |
| GET | `/api/v1/matrix/coverage/summary` | Get coverage summary |

## Decision Roles

| Role | Description | Weight |
|------|-------------|--------|
| Champion | Internal advocate for your solution | 0.25 |
| Economic Buyer | Controls budget | 0.30 |
| Technical Buyer | Evaluates technical fit | 0.25 |
| User Buyer | End user | 0.10 |
| Executive Sponsor | C-level support | 0.20 |
| Coach | Internal guide (not on buying committee) | N/A |

## Coverage Scoring

```
Overall = (Economic × 0.30) + (Technical × 0.25) + (Champion × 0.25) + (Executive × 0.20)
```

| Score | Status | Action |
|-------|--------|--------|
| 80-100 | Strong | Close |
| 50-79 | Moderate | Strengthen weak areas |
| 20-49 | Weak | Identify missing roles |
| 0-19 | Critical | Build foundation |

## Gap Types

- `missing_role` - Role not identified in buying committee
- `low_influence` - Key role has low influence level
- `disengaged` - Identified contact not engaged
- `negative` - Contact shows negative sentiment

## Dependencies

- MongoDB
- Express.js
- Zod validation
- Helmet security

## Installation

```bash
cd REZ-buyer-mapping-service
npm install
npm run dev
```
