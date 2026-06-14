# REZ Atlas Score
**Port:** 5154 | **Type:** Lead Scoring Engine

---

## Overview

AI-powered lead scoring engine that scores, grades, and prioritizes leads.

**Scoring Factors:**
- Basic info completeness (+65 max)
- Category match (+30 max)
- Source attribution (+35 max)
- Metadata enrichment (+20 max)

---

## Quick Start

```bash
npm install
npm run dev
```

---

## API Endpoints

### Leads
- `GET /api/leads` - List leads with filters
- `POST /api/leads` - Create lead (auto-scores)
- `GET /api/leads/:id` - Get lead with activities
- `PUT /api/leads/:id` - Update lead (re-scores)
- `DELETE /api/leads/:id` - Delete lead

### Scoring
- `POST /api/leads/:id/score` - Recalculate score
- `POST /api/leads/score/bulk` - Bulk score

### Assignment
- `POST /api/leads/:id/assign` - Assign to owner
- `POST /api/leads/bulk-assign` - Bulk assign
- `POST /api/leads/:id/convert` - Mark as converted

### Activities
- `POST /api/leads/:id/activities` - Add activity
- `GET /api/leads/:id/activities` - Get activities

### Stats
- `GET /api/stats` - Lead statistics

---

## Scoring Algorithm

```typescript
function calculateScore(lead): number {
  let score = 0;
  
  // Basic info (+65 max)
  if (lead.email) score += 20;
  if (lead.phone) score += 15;
  if (lead.company) score += 20;
  if (lead.name) score += 10;
  
  // Category (+30 max)
  const categoryScores = {
    restaurant: 25, ecommerce: 30, hotel: 25,
    retail: 20, healthcare: 20, services: 15, salon: 15
  };
  score += categoryScores[lead.category] || 15;
  
  // Source (+35 max)
  const sourceScores = {
    referral: 35, discovery: 30, linkedin: 30,
    organic: 20, partnership: 25, event: 20,
    webinar: 20, paid_ads: 15, cold_email: 10
  };
  score += sourceScores[lead.source] || 15;
  
  // Metadata enrichment (+20 max)
  if (lead.metadata?.twinScore) score += Math.min(lead.metadata.twinScore, 20);
  if (lead.metadata?.hasPOS) score += 15;
  if (lead.metadata?.hasWebsite) score += 10;
  if (lead.metadata?.hasReviews) score += 10;
  
  return Math.min(score, 100);
}
```

---

## Grades

| Grade | Score Range | Action |
|-------|-------------|--------|
| A | 80-100 | Call today |
| B | 60-79 | Schedule demo within 48h |
| C | 40-59 | Nurture campaign |
| D | 0-39 | Long-term nurturing |

---

## Environment Variables

```env
PORT=5154
```