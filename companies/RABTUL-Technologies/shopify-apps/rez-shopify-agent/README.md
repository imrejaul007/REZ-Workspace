# ReZ Agent - AI Customer Service

AI-powered chatbot for Shopify.

## Features

- [x] Multi-platform (Web, WhatsApp, Instagram, Facebook)
- [x] Intent detection
- [x] Knowledge base integration
- [x] Order status queries
- [x] Return/refund handling
- [x] Human escalation
- [x] Analytics

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/agent/conversation/start` | POST | Start new conversation |
| `/agent/conversation/message` | POST | Process customer message |
| `/agent/conversation/:id/escalate` | POST | Escalate to human |
| `/agent/conversation/:id/resolve` | POST | Resolve conversation |
| `/agent/knowledge` | POST | Add knowledge base entry |
| `/agent/analytics/:shop` | GET | Get analytics |
