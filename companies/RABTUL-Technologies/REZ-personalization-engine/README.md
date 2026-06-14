# REZ Personalization Engine

**Port:** 4135  
**Status:** Complete

## Overview

Dynamic content personalization engine for B2B sales. Generates personalized emails, LinkedIn messages, and other outreach content using contact, company, and deal data with conditional rules.

## Features

- **Content Templates** - Create reusable templates with variable placeholders
- **Variable Substitution** - Use `{{variable_name}}` syntax for dynamic content
- **Conditional Rules** - Apply rules based on contact/company/deal attributes
- **A/B Testing** - Create variants with different weights
- **Batch Generation** - Personalize content for multiple contacts
- **Performance Tracking** - Track open rates, click rates, reply rates

## Variable Syntax

```handlebars
{{firstName}}           - Contact first name
{{companyName}}         - Company name
{{dealValue}}           - Deal value
{{currentDate}}         - Current date
{{variable:default}}    - With default fallback
```

## Template Example

```
Subject: Quick question about {{companyName}}'s growth plans

Hi {{firstName}},

I noticed {{companyName}} has been expanding rapidly. 
As someone focused on {{title}}, you might be interested 
in how companies like yours are handling scaling challenges.

Would you be open to a quick 15-minute call to discuss?

Best regards
```

## API Endpoints

### Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/templates` | Create template |
| GET | `/api/v1/templates` | List templates |
| GET | `/api/v1/templates/:id` | Get template |
| PATCH | `/api/v1/templates/:id` | Update template |
| DELETE | `/api/v1/templates/:id` | Delete template |
| POST | `/api/v1/templates/:id/preview` | Preview with sample data |
| GET | `/api/v1/templates/:id/metrics` | Get performance metrics |
| POST | `/api/v1/templates/:id/duplicate` | Duplicate template |

### Rules

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/rules` | Create rule |
| GET | `/api/v1/rules` | List rules |
| GET | `/api/v1/rules/:id` | Get rule |
| PATCH | `/api/v1/rules/:id` | Update rule |
| DELETE | `/api/v1/rules/:id` | Delete rule |
| PATCH | `/api/v1/rules/:id/toggle` | Toggle active status |
| POST | `/api/v1/rules/reorder` | Reorder rules |

### Generation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/generate/generate` | Generate content |
| POST | `/api/v1/generate/batch` | Batch generate |
| GET | `/api/v1/generate/content` | List generated |
| GET | `/api/v1/generate/content/:id` | Get generated |
| PATCH | `/api/v1/generate/content/:id/status` | Update status |
| GET | `/api/v1/generate/stats/performance` | Performance stats |

## Condition Operators

| Operator | Description |
|----------|-------------|
| equals | Exact match |
| not_equals | Not equal |
| contains | String contains |
| not_contains | String doesn't contain |
| greater_than | Numeric comparison |
| less_than | Numeric comparison |
| in | Value in array |
| not_in | Value not in array |
| exists | Field exists |
| not_exists | Field doesn't exist |

## Rule Actions

| Action | Description |
|--------|-------------|
| insert_variable | Insert variable value |
| replace_text | Replace text pattern |
| add_section | Add content section |
| remove_section | Remove conditional section |
| change_tone | Change message tone |
| add_cta | Add call-to-action |
| custom | Custom action |

## Content Types

- `email` - Email campaigns
- `linkedin` - LinkedIn outreach
- `sequence` - Outbound sequences
- `social` - Social media posts
- `ad` - Ad copy

## Installation

```bash
cd REZ-personalization-engine
npm install
npm run dev
```

## TODO

- [x] Template CRUD
- [x] Variable substitution
- [x] Conditional rules
- [x] A/B variants
- [x] Batch generation
- [x] Performance tracking
- [ ] AI tone adjustment
- [ ] Image personalization
- [ ] Dynamic landing pages
