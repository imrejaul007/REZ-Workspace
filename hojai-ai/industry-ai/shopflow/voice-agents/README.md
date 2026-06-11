# ShopFlow Voice Agents

This folder contains voice interface implementations for ShopFlow retail AI.

## Phone Receptionist

Handles incoming retail calls with IVR navigation.

**Port:** 4831

**Features:**
- IVR call handling
- Product inquiries
- Store information
- Loyalty program
- Associate transfer

**Endpoints:**
- `POST /api/calls/incoming` - Start new call
- `POST /api/calls/:callId/select` - IVR selection
- `POST /api/calls/:callId/voice` - Voice input
- `POST /api/calls/:callId/end` - End call
- `GET /api/calls` - List calls

## WhatsApp AI

Conversational commerce via WhatsApp.

**Port:** 4832

**Features:**
- Product search and recommendations
- Cart management
- Order placement
- Return policy
- Store information

**Endpoints:**
- `POST /api/whatsapp/webhook` - Receive messages
- `POST /api/whatsapp/send` - Send proactive messages
- `GET /api/whatsapp/conversations/:phone` - Get conversation
- `GET /api/whatsapp/products` - Product catalog

## Running

```bash
cd phone-receptionist && npm install && npm run dev
cd whatsapp-ai && npm install && npm run dev
```