# Rez Virtual Concierge Service

AI-Powered Guest Assistance and Hotel Information System

**Port:** 4034

## Features

- **Intent Classification**: Automatically classify guest requests (room service, complaints, directions, etc.)
- **Knowledge Base**: Hotel-specific FAQ and information articles with keyword search
- **Service Requests**: Create and track service requests (room service, housekeeping, taxi, spa)
- **Multilingual Support**: English, Hindi, Tamil, Telugu, Bengali, Marathi
- **Sentiment Analysis**: Detect guest sentiment (positive, neutral, negative)
- **Conversation Management**: Multi-turn conversations with context preservation
- **Escalation Handling**: Automatic escalation to staff for complaints or special requests
- **Guest Preferences**: Store and recall guest preferences and dietary restrictions
- **Quick Actions**: Pre-defined action buttons for common requests
- **Analytics Dashboard**: Track conversation metrics and service request statistics

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /api/info | Service information and capabilities |
| POST | /api/conversations | Start new conversation |
| GET | /api/conversations/:id | Get conversation |
| POST | /api/conversations/:id/message | Send message |
| POST | /api/conversations/:id/close | Close conversation |
| GET | /api/conversations/guest/:guestId | Get guest conversations |
| POST | /api/service-requests | Create service request |
| GET | /api/service-requests/:id | Get request status |
| POST | /api/service-requests/:id/rate | Rate service |
| GET | /api/knowledge/:hotelId | Get knowledge base |
| POST | /api/knowledge | Add knowledge article |
| PUT | /api/knowledge/:id | Update article |
| POST | /api/knowledge/:id/feedback | Article feedback |
| GET | /api/quick-actions/:hotelId | Get quick action buttons |
| POST | /api/quick-actions/:hotelId/:actionId | Execute quick action |
| GET | /api/analytics/:hotelId | Get analytics |

## Quick Start

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run in production mode
npm start

# Run tests
npm test
```

## Configuration

Configure via environment variables or `.env` file:
- `PORT`: Server port (default: 4034)
- `MONGO_URL`: MongoDB connection string
- `HOJAI_URL`: AI/LLM service URL (optional)
- `HOJAI_API_KEY`: AI service API key (optional)

## Intent Types

| Intent | Description |
|--------|-------------|
| room_service | Food, beverages, in-room dining requests |
| concierge_info | Hotel information, hours, directions |
| complaint | Guest complaints and issues |
| booking_query | Reservation inquiries and modifications |
| amenity_info | Hotel amenities and facilities |
| checkout | Check-out requests |
| direction | Navigation within hotel |
| recommendation | Suggestions for dining, attractions |
| compliment | Positive feedback |
| escalate | Request for human assistance |
| general | Unclassified requests |

## Quick Actions

- Room Service
- Housekeeping
- Taxi Booking
- Express Checkout
- WiFi Password
- Spa Booking
- Restaurant Information
- Directions
