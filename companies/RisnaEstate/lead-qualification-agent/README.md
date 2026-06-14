# Lead Qualification Agent

AI-powered lead scoring and qualification. Port 5100.

## Features
- Lead scoring based on budget, timeline, source
- Grade assignment (A, B, C, D)
- Stage management (new, contacted, qualified, visiting, negotiating, closed)
- AI recommendations for next actions
- Matching properties to leads

## API
- POST /api/leads - Create lead
- GET /api/leads - List leads (filter by grade, stage)
- GET /api/dashboard - Lead statistics

## Run
```bash
npm install && npm start
```