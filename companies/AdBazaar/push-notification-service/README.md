# Push Notification Service

Push notification service for AdBazaar.

## Features

- Push notification creation and management
- Device registration and management
- Broadcast notifications
- Targeted notifications by segment
- Delivery tracking and analytics
- FCM/APNs integration ready

## Port

**5032**

## API Endpoints

### Notifications
- `POST /api/notifications` - Create notification
- `GET /api/notifications` - List notifications
- `GET /api/notifications/:id` - Get notification details
- `PUT /api/notifications/:id` - Update notification
- `DELETE /api/notifications/:id` - Delete notification
- `POST /api/notifications/:id/send` - Send notification
- `POST /api/notifications/broadcast` - Broadcast to all devices
- `GET /api/notifications/analytics` - Get analytics summary

### Devices
- `POST /api/devices` - Register device
- `GET /api/devices` - List devices
- `DELETE /api/devices/:id` - Unregister device

## Models

### Notification
- notificationId: string
- advertiserId: string
- title: string
- body: string
- data: object
- target: { type, segment, deviceIds }
- status: draft | scheduled | sending | sent | failed
- stats: { sent, delivered, opened, clicked, failed }
- scheduledAt: Date
- sentAt: Date

### Device
- deviceId: string
- advertiserId: string
- userId: string
- platform: ios | android | web
- pushToken: string
- status: active | inactive | unsubscribed

### Send
- sendId: string
- notificationId: string
- deviceId: string
- status: pending | sent | delivered | opened | clicked | failed

## Quick Start

```bash
cd push-notification-service
npm install
npm run dev
```

## Health Check

```bash
curl http://localhost:5032/health
```

## Environment Variables

```
PORT=5032
MONGODB_URI=mongodb://localhost:27017/push_notifications
FCM_SERVER_KEY=your-server-key
INTERNAL_SERVICE_TOKEN=your-token
```