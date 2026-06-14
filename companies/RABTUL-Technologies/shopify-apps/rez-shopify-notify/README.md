# ReZ Notify - Push Notifications

Multi-channel notifications for Shopify.

## Features

- [x] Push notifications
- [x] Email notifications
- [x] SMS notifications
- [x] WhatsApp notifications
- [x] Template system
- [x] Segmentation-based broadcast
- [x] Analytics

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/notify/send` | POST | Send single notification |
| `/notify/template` | POST | Send template notification |
| `/notify/broadcast` | POST | Broadcast to segment |
| `/notify/track/:id/:action` | POST | Track interaction |
| `/notify/stats/:shop` | GET | Get notification stats |
