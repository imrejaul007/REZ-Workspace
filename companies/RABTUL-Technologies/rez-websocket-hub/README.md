# ReZ WebSocket Hub

A scalable WebSocket hub service providing real-time bidirectional communication for the ReZ ecosystem with support for channels, private messaging, presence tracking, and authentication.

## Features

- **WebSocket Communication**: Full-duplex real-time communication
- **Channel-based Pub/Sub**: Subscribe to channels for group messaging
- **Private Messaging**: Send messages to specific users
- **Presence Tracking**: Track online users and their status
- **JWT Authentication**: Secure WebSocket connections with JWT
- **Message Acknowledgment**: ACK/NAK for message delivery
- **Connection Health**: Ping/pong heartbeat monitoring
- **Graceful Shutdown**: Clean connection teardown on server restart
- **REST API**: HTTP endpoints for WebSocket management

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ReZ WebSocket Hub                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  WebSocket  │  │   REST API   │  │    Connection        │  │
│  │   Server    │  │   Server     │  │    Manager           │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                   │                     │               │
│  ┌──────▼───────────────────▼─────────────────────▼───────────┐  │
│  │                    Channel Service                             │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐  │  │
│  │  │   Pub/Sub   │ │   Presence   │ │    Message        │  │  │
│  │  │   Manager   │ │   Tracker    │ │    Router         │  │  │
│  │  └──────────────┘ └──────────────┘ └──────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                             │                                    │
│  ┌──────────────────────────▼────────────────────────────────┐  │
│  │                    Connection Layer                            │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │  WebSocket Clients                                   │  │  │
│  │  │  - Authenticated Users                              │  │  │
│  │  │  - Subscribed Channels                              │  │  │
│  │  │  - Connection Metadata                               │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file:

```env
PORT=4024
NODE_ENV=development

# WebSocket Configuration
WS_PATH=/ws
PING_INTERVAL=30000
PING_TIMEOUT=10000
MAX_MESSAGE_SIZE=1048576

# CORS
CORS_ORIGIN=*

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_ALGORITHM=HS256
```

## Running the Service

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm run build
npm start
```

## WebSocket Connection

### Connection URL

```
ws://localhost:4024/ws?token=<JWT_TOKEN>
```

### Authentication

Include JWT token in query parameter or Authorization header:

```
# Query parameter
ws://localhost:4024/ws?token=eyJhbGciOiJIUzI1NiIs...

# Authorization header
ws://localhost:4024/ws
Headers: { "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..." }
```

## WebSocket Messages

### Incoming Messages (Client to Server)

| Type | Description | Payload |
|------|-------------|---------|
| `subscribe` | Subscribe to channel | `{ channel: string }` |
| `unsubscribe` | Unsubscribe from channel | `{ channel: string }` |
| `broadcast` | Broadcast to channel | `{ channel: string, payload: any }` |
| `private` | Send to specific user | `{ targetUserId: string, payload: any }` |
| `ping` | Keep-alive ping | `{}` |
| `presence` | Get presence info | `{}` |

### Outgoing Messages (Server to Client)

| Type | Description | Payload |
|------|-------------|---------|
| `ack` | Message acknowledgment | `{ messageId: string, ... }` |
| `error` | Error response | `{ error: string, code: string }` |
| `subscribe` | Subscription confirmation | `{ channel: string, status: string }` |
| `unsubscribe` | Unsubscription confirmation | `{ channel: string, status: string }` |
| `message` | Broadcast message | `{ channel: string, payload: any }` |
| `private` | Private message | `{ from: string, payload: any }` |
| `pong` | Ping response | `{ timestamp: number }` |
| `presence_update` | Presence information | `{ user: object, onlineUsers: object }` |

## REST API Endpoints

### Health & Info

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Service information |
| GET | `/api/ws/health` | WebSocket health check |
| GET | `/api/ws/stats` | Connection statistics |

### Channel Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ws/channels` | List active channels |
| GET | `/api/ws/channels/:channel` | Get channel info |
| GET | `/api/ws/channels/:channel/clients` | List clients in channel |

### Connection Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ws/connections` | List all connections |
| GET | `/api/ws/connections/:id` | Get connection details |
| DELETE | `/api/ws/connections/:id` | Force disconnect |

### Presence

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ws/presence/users` | List online users |
| GET | `/api/ws/presence/users/:id` | Get user presence |
| GET | `/api/ws/presence/channels` | Get channel presence |

### Message Broadcast

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ws/broadcast` | Broadcast to channel |
| POST | `/api/ws/private` | Send to specific user |

## JavaScript Client Example

```javascript
class ReZWebSocket {
  constructor(token) {
    this.token = token;
    this.ws = null;
    this.messageHandlers = {};
    this.connectionId = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`ws://localhost:4024/ws?token=${this.token}`);

      this.ws.onopen = () => {
        console.log('Connected to WebSocket Hub');
        resolve();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      };
    });
  }

  handleMessage(message) {
    switch (message.type) {
      case 'ack':
        console.log('Message acknowledged:', message.payload);
        break;
      case 'error':
        console.error('Error:', message.payload);
        break;
      case 'message':
        this.emit(message.channel || 'message', message.payload);
        break;
      case 'private':
        this.emit('private', message.payload);
        break;
      case 'pong':
        console.log('Pong received');
        break;
    }
  }

  subscribe(channel) {
    this.send({ type: 'subscribe', channel, messageId: this.generateId() });
  }

  unsubscribe(channel) {
    this.send({ type: 'unsubscribe', channel, messageId: this.generateId() });
  }

  broadcast(channel, payload) {
    this.send({
      type: 'broadcast',
      channel,
      payload,
      messageId: this.generateId()
    });
  }

  sendPrivate(targetUserId, payload) {
    this.send({
      type: 'private',
      targetUserId,
      payload,
      messageId: this.generateId()
    });
  }

  ping() {
    this.send({ type: 'ping', messageId: this.generateId() });
  }

  getPresence() {
    this.send({ type: 'presence', messageId: this.generateId() });
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  on(event, handler) {
    if (!this.messageHandlers[event]) {
      this.messageHandlers[event] = [];
    }
    this.messageHandlers[event].push(handler);
  }

  emit(event, data) {
    if (this.messageHandlers[event]) {
      this.messageHandlers[event].forEach(handler => handler(data));
    }
  }

  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Usage
const ws = new ReZWebSocket('your_jwt_token');

ws.connect().then(() => {
  ws.subscribe('notifications');
  ws.subscribe('orders');

  ws.on('message', (data) => {
    console.log('New notification:', data);
  });

  ws.on('private', (data) => {
    console.log('Private message:', data);
  });
});
```

## Python Client Example

```python
import json
import threading
import time
from websocket import create_connection

class ReZWebSocket:
    def __init__(self, token, url="ws://localhost:4024/ws"):
        self.token = token
        self.url = f"{url}?token={token}"
        self.ws = None
        self.handlers = {}

    def connect(self):
        self.ws = create_connection(self.url)
        print("Connected to WebSocket Hub")

    def send(self, message):
        if self.ws:
            self.ws.send(json.dumps(message))

    def subscribe(self, channel):
        self.send({
            "type": "subscribe",
            "channel": channel,
            "messageId": self._generate_id()
        })

    def unsubscribe(self, channel):
        self.send({
            "type": "unsubscribe",
            "channel": channel,
            "messageId": self._generate_id()
        })

    def broadcast(self, channel, payload):
        self.send({
            "type": "broadcast",
            "channel": channel,
            "payload": payload,
            "messageId": self._generate_id()
        })

    def send_private(self, target_user_id, payload):
        self.send({
            "type": "private",
            "targetUserId": target_user_id,
            "payload": payload,
            "messageId": self._generate_id()
        })

    def ping(self):
        self.send({"type": "ping", "messageId": self._generate_id()})

    def listen(self):
        while True:
            try:
                data = self.ws.recv()
                message = json.loads(data)
                self._handle_message(message)
            except Exception as e:
                print(f"Error: {e}")
                break

    def _handle_message(self, message):
        msg_type = message.get("type")

        if msg_type == "ack":
            print(f"Message acknowledged: {message.get('payload')}")
        elif msg_type == "error":
            print(f"Error: {message.get('payload')}")
        elif msg_type == "message":
            channel = message.get("channel")
            if channel in self.handlers:
                self.handlers[channel](message.get("payload"))

    def on(self, event, handler):
        self.handlers[event] = handler

    def _generate_id(self):
        import random
        return f"{int(time.time())}-{random.randint(0, 999999999):09d}"

    def close(self):
        if self.ws:
            self.ws.close()

# Usage
ws = ReZWebSocket("your_jwt_token")
ws.connect()
ws.subscribe("notifications")
ws.on("notifications", lambda data: print(f"Notification: {data}"))
ws.listen()
```

## Configuration Options

| Parameter | Default | Description |
|-----------|---------|-------------|
| `PORT` | 4024 | HTTP server port |
| `WS_PATH` | /ws | WebSocket endpoint path |
| `PING_INTERVAL` | 30000 | Ping interval in ms |
| `PING_TIMEOUT` | 10000 | Ping timeout in ms |
| `MAX_MESSAGE_SIZE` | 1048576 | Max message size in bytes |

## Error Codes

| Code | Description |
|------|-------------|
| `AUTH_REQUIRED` | No valid authentication |
| `INVALID_TOKEN` | JWT token invalid |
| `TOKEN_EXPIRED` | JWT token expired |
| `CHANNEL_NOT_FOUND` | Channel does not exist |
| `USER_NOT_FOUND` | Target user not found |
| `RATE_LIMITED` | Too many messages |
| `PAYLOAD_TOO_LARGE` | Message exceeds size limit |

## Testing

```bash
npm test
```

## Deployment

### Docker

```bash
docker build -t rez-websocket-hub .
docker run -p 4024:4024 \
  -e JWT_SECRET=your_jwt_secret \
  -e PING_INTERVAL=30000 \
  rez-websocket-hub
```

## License

MIT
