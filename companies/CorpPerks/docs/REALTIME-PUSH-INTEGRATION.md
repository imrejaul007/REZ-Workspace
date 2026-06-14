# CorpPerks Real-time & Push Notification Integration

## Overview

This document describes the WebSocket real-time service and Expo Push Notification integration for CorpPerks PeopleOS.

## Services Created

### 1. Real-time Service (WebSocket)
**Location:** `CorpPerks/realtime-service/`
**Port:** 4748

### 2. Expo Push Service
**Location:** `CorpPerks/push-service/`
**Port:** 4749

### 3. Mobile App Integration
**Location:** `CorpPerks/people/`

## Quick Start

### 1. Start Real-time Service
```bash
cd CorpPerks/realtime-service
npm install
npm run dev
```

### 2. Start Push Service
```bash
cd CorpPerks/push-service
npm install
npm run dev
```

## API Endpoints

### Real-time Service (Port 4748)

#### WebSocket
- **URL:** `ws://localhost:4748`
- **Query Params:** `?userId=<userId>&token=<token>`

#### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/rooms/:userId` | Get user rooms |
| POST | `/api/rooms/join` | Join a room |
| POST | `/api/rooms/leave` | Leave a room |
| POST | `/api/publish` | Publish event |
| GET | `/api/presence/:userId` | Get user presence |
| POST | `/api/presence/update` | Update presence |
| GET | `/api/stats` | Get WebSocket stats |

### Expo Push Service (Port 4749)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/push/register` | Register device token |
| DELETE | `/api/push/unregister` | Unregister device |
| POST | `/api/push/send` | Send notification |
| POST | `/api/push/send/batch` | Send to multiple users |
| POST | `/api/push/schedule` | Schedule notification |
| DELETE | `/api/push/schedule/:id` | Cancel scheduled |
| GET | `/api/push/tokens/:userId` | Get user tokens |
| GET | `/api/push/history/:userId` | Get notification history |
| GET | `/api/push/stats/:id` | Delivery stats |

## WebSocket Events

### Incoming Events (Client to Server)

```javascript
// Authenticate
{ "action": "auth", "payload": { "userId": "user123", "token": "jwt..." } }

// Join Room
{ "action": "join_room", "payload": { "roomId": "team_123", "roomType": "team" } }

// Leave Room
{ "action": "leave_room", "payload": { "roomId": "team_123" } }

// Send Message
{ "action": "send_message", "payload": { "roomId": "team_123", "type": "notification", "data": {...} } }

// Typing Indicator
{ "action": "typing", "payload": { "roomId": "team_123", "isTyping": true } }

// Presence Update
{ "action": "presence", "payload": { "status": "online" } }

// Ping
{ "action": "ping" }
```

### Outgoing Events (Server to Client)

```javascript
// Connection Acknowledged
{ "type": "connection", "payload": { "clientId": "...", "authenticated": true } }

// Room Joined
{ "type": "room_joined", "payload": { "roomId": "...", "roomType": "..." } }

// Notification
{ "type": "notification", "payload": { "title": "...", "body": "...", "data": {...} } }

// Task Updated
{ "type": "task_updated", "payload": { "taskId": "...", "status": "..." } }

// Leave Status Changed
{ "type": "leave_status", "payload": { "leaveId": "...", "status": "approved" } }

// Announcement
{ "type": "announcement", "payload": { "title": "...", "body": "..." } }

// Presence Update
{ "type": "presence", "payload": { "userId": "...", "status": "online" } }

// Typing
{ "type": "typing", "payload": { "userId": "...", "roomId": "...", "isTyping": true } }

// Pong
{ "type": "pong", "payload": { "timestamp": 1234567890 } }
```

## Usage in Mobile App

### Hooks Available

#### usePushNotifications
```typescript
import { usePushNotifications } from '../src/hooks/usePushNotifications';

function MyComponent() {
  const {
    expoPushToken,
    notifications,
    unreadCount,
    registerForPushNotifications,
    markAsRead,
    markAllAsRead,
  } = usePushNotifications({
    onNotificationReceived: (notification) => {
      console.log('Notification:', notification);
    },
    onNotificationTapped: (notification) => {
      // Navigate to relevant screen
    },
  });

  // Register on mount
  useEffect(() => {
    registerForPushNotifications();
  }, []);
}
```

#### useWebSocket
```typescript
import { useWebSocket } from '../src/hooks/useWebSocket';

function MyComponent() {
  const {
    isConnected,
    connectionState,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendTyping,
    updatePresence,
  } = useWebSocket({
    onNotification: (payload) => {
      console.log('Notification:', payload);
    },
    onTaskUpdated: (payload) => {
      console.log('Task updated:', payload);
    },
    onPresenceChange: (payload) => {
      console.log('Presence:', payload);
    },
  });

  // Join team room on mount
  useEffect(() => {
    if (isConnected) {
      joinRoom('team_123', 'team');
    }
    return () => leaveRoom('team_123');
  }, [isConnected]);
}
```

## Notification Types

| Type | Description |
|------|-------------|
| `announcement` | Company announcements |
| `task_reminder` | Task due reminders |
| `task_updated` | Task status changes |
| `leave_request` | Leave request submitted |
| `leave_approved` | Leave approved |
| `leave_rejected` | Leave rejected |
| `meeting_reminder` | Upcoming meeting |
| `payroll` | Salary/payroll updates |
| `document` | New document shared |
| `performance_review` | Review notifications |
| `policy_update` | Policy changes |
| `shift_change` | Shift updates |
| `onboarding` | Onboarding progress |
| `general` | General notifications |

## Room Types

| Type | Description |
|------|-------------|
| `user` | Personal room for user |
| `team` | Team collaboration room |
| `company` | Company-wide announcements |
| `project` | Project-specific room |
| `custom` | Custom room type |

## Environment Variables

### Real-time Service
```env
PORT=4748
MONGODB_URI=mongodb://localhost:27017/corpperks_realtime
INTERNAL_SERVICE_TOKEN=your-token
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4749
```

### Push Service
```env
PORT=4749
MONGODB_URI=mongodb://localhost:27017/corpperks_push
INTERNAL_SERVICE_TOKEN=your-token
EXPO_ACCESS_TOKEN=your-expo-token
RABTUL_NOTIFICATION_URL=http://localhost:4011
```

## Database Models

### Real-time Service
- `Room` - Room/channel management
- `Message` - Message history
- `Presence` - User online/offline status

### Push Service
- `Notification` - Notification records
- `NotificationTemplate` - Reusable templates
- `NotificationPreference` - User preferences
- `ScheduledNotification` - Scheduled notifications
- `ExpoToken` - Device push tokens
- `ExpoDelivery` - Delivery tracking

## Testing

### Test WebSocket Connection
```javascript
const ws = new WebSocket('ws://localhost:4748?userId=test123');

ws.onopen = () => {
  console.log('Connected');
  ws.send(JSON.stringify({
    action: 'auth',
    payload: { userId: 'test123', token: 'test-token' }
  }));
};

ws.onmessage = (event) => {
  console.log('Received:', JSON.parse(event.data));
};
```

### Test Push Registration
```bash
curl -X POST http://localhost:4749/api/push/register \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "companyId": "corp_001",
    "expoPushToken": "ExponentPushToken[xxxxx]",
    "platform": "ios"
  }'
```

### Test Send Notification
```bash
curl -X POST http://localhost:4749/api/push/send \
  -H "Content-Type: application/json" \
  -H "X-Internal-Token: your-token" \
  -d '{
    "userId": "user123",
    "title": "New Task Assigned",
    "body": "You have been assigned to Project X",
    "data": { "taskId": "task_123" }
  }'
```

## Files Created

### Real-time Service
```
CorpPerks/realtime-service/
├── package.json
├── tsconfig.json
├── .env.example
└── src/
    ├── index.ts
    ├── types/index.ts
    ├── models/
    │   ├── index.ts
    │   ├── Room.ts
    │   ├── Message.ts
    │   └── Presence.ts
    ├── services/
    │   ├── index.ts
    │   └── WebSocketService.ts
    ├── routes/index.ts
    └── middleware/index.ts
```

### Push Service (Updated)
```
CorpPerks/push-service/src/
├── models/
│   ├── ExpoToken.ts (NEW)
│   └── ExpoDelivery.ts (NEW)
├── services/
│   └── expoPushService.ts (NEW)
└── routes/
    └── expoPushRoutes.ts (NEW)
```

### Mobile App
```
CorpPerks/people/src/hooks/
├── usePushNotifications.ts (NEW)
└── useWebSocket.ts (NEW)

CorpPerks/people/app/
├── _layout.tsx (UPDATED)
└── notifications/
    └── index.tsx (NEW)
```
