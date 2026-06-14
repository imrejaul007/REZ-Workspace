# Dynamic Content Service

Dynamic creative and content rendering for AdBazaar.

## Overview

Complete dynamic content management with:
- Multi-element content creation
- A/B variant testing
- Personalization engine
- Click and conversion tracking
- Content scheduling

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/content` | Create content |
| GET | `/api/content/:id` | Get content |
| PUT | `/api/content/:id` | Update content |
| POST | `/api/content/:id/personalize` | Personalize content |
| GET | `/api/content/:id/preview` | Preview content |
| POST | `/api/content/:id/variations` | Create variation |
| GET | `/api/content/:id/stats` | Get stats |

## Port

**5108**