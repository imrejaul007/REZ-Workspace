# CorpPerks Landing - SPEC.md

**Version:** 1.0.0
**Port:** (see config)
**Company:** CorpPerks
**Category:** Marketing

---

## Overview

Marketing landing page for CorpPerks employee benefits platform. Showcases features, pricing, and benefits of the corporate perks program.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CorpPerks Landing                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  Pages:                                                                    │
│  ├── Home          → Hero and feature overview                           │
│  ├── Features      → Detailed feature breakdown                          │
│  ├── Pricing       → Pricing plans                                        │
│  └── Contact       → Sales contact form                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Sections

| Section | Content |
|---------|---------|
| Hero | Main value proposition |
| Features | Platform capabilities |
| Benefits | Why choose CorpPerks |
| Pricing | Plan comparison |
| Testimonials | Customer quotes |
| CTA | Sign-up call to action |

---

## Dependencies

```json
{
  "next": "14.1.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "lucide-react": "^0.312.0"
}
```

---

## Status

- [x] Landing page
- [x] Feature showcase
- [x] Pricing page
- [x] Contact form

