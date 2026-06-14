# REZ-assistant-ui

**AI Chat Assistant UI for REZ Consumer**

A conversational AI chat interface for REZ Consumer, built with Next.js 14 and Tailwind CSS.

## Overview

REZ-assistant-ui provides a modern, conversational interface for the REZ AI Assistant. It connects to the REZ-assistant backend service to enable intent tracking, preference learning, and personalized recommendations.

## Status

**COMPLETE** - Built June 2026

## Port Configuration

**Default Port: 3011**

Runs on `PORT=3011` (configurable via environment variable).

## Environment Variables

### Required

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | http://localhost:3011 |

### RABTUL Services (via .env.example)

| Variable | Description | Default |
|----------|-------------|---------|
| `AUTH_SERVICE_URL` | RABTUL Authentication | http://localhost:4002 |
| `WALLET_SERVICE_URL` | RABTUL Wallet | http://localhost:4004 |
| `ANALYTICS_SERVICE_URL` | RABTUL Analytics | http://localhost:4016 |
| `NOTIFICATION_SERVICE_URL` | RABTUL Notification | http://localhost:4011 |

### REZ Intelligence

| Variable | Description | Default |
|----------|-------------|---------|
| `INTENT_SERVICE_URL` | Intent tracking | http://localhost:4018 |
| `PREDICTIVE_SERVICE_URL` | Predictive analytics | http://localhost:4123 |
| `SIGNAL_SERVICE_URL` | Signal processing | http://localhost:4121 |

## RABTUL Integration

REZ-assistant-ui uses the shared RABTUL client for:

1. **Authentication**: Validate user sessions before chat
2. **Analytics**: Track conversation patterns
3. **Notifications**: Push notifications for recommendations

## API Integration

### Connected Backend

The UI connects to `REZ-assistant` service (port 3011) for:

- `POST /api/chat/message` - Send chat message
- `GET /api/chat/history/:userId` - Get conversation history
- `GET /api/intents/:userId` - Get user intents
- `GET /api/recommendations/:userId` - Get recommendations

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3011](http://localhost:3011) in your browser.

## Features

- **Conversational AI Chat**: Real-time messaging with an AI assistant
- **Quick Actions**: One-click buttons for common tasks (Track Order, Today's Deals, etc.)
- **Product Recommendations**: Personalized product cards with ratings, pricing, and add-to-cart
- **Conversation History**: Searchable history of past conversations
- **Context-Aware Suggestions**: Smart prompts based on conversation context
- **Rich Interactions**: File attachments, emoji support, voice input ready

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Date Utilities**: date-fns
- **Language**: TypeScript

## Project Structure

```
REZ-assistant-ui/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main chat interface
│   │   ├── history/page.tsx       # Conversation history
│   │   ├── layout.tsx            # Root layout
│   │   └── globals.css           # Global styles
│   ├── components/
│   │   ├── ChatMessage.tsx        # Message bubble component
│   │   ├── ChatInput.tsx         # Input field with attachments
│   │   ├── QuickActions.tsx      # Quick action buttons
│   │   └── Recommendations.tsx   # Product recommendation cards
│   └── types/
│       └── chat.ts               # TypeScript type definitions
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.mjs
```

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Open** [http://localhost:3000](http://localhost:3000) in your browser

## Pages

### Main Chat (`/`)
- Welcome message from REZ Assistant
- Quick action buttons for common tasks
- Real-time chat messaging
- Product recommendations display
- Conversation history link

### History (`/history`)
- List of past conversations
- Search functionality
- Conversation preview and timestamps
- Delete conversations
- View full conversation details

## Components

### ChatMessage
Displays user and assistant messages with:
- Avatar icons
- Timestamp
- Copy/share actions
- Quick reactions

### ChatInput
Multi-line input with:
- Auto-resize textarea
- File attachment support
- Voice input button (UI ready)
- Emoji picker (UI ready)
- Keyboard shortcuts (Enter to send, Shift+Enter for new line)

### QuickActions
Interactive buttons for:
- Track Order
- Today's Deals
- Personalized Recommendations
- Support/Help
- Popular searches
- Category browsing

### Recommendations
Product cards featuring:
- Product images
- Badges (Sale, Best Seller, New Arrival)
- Star ratings
- Pricing with discounts
- Add to Cart functionality
- Wishlist button

## Design System

### Colors
- **Brand**: Blue scale (brand-500 primary)
- **Surface**: Neutral grays for backgrounds
- **Customizable dark mode** support

### Typography
- Font: Inter (Google Fonts)
- Responsive text sizing
- Proper line heights for readability

### Animations
- Fade-in for new elements
- Slide-up for recommendations
- Typing indicator dots
- Hover transitions

## API Integration

The chat interface is ready for backend integration. The `handleSendMessage` function can be connected to your AI service endpoint:

```typescript
const handleSendMessage = async (content: string) => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: content }),
  });
  const data = await response.json();
  // Handle response...
};
```

## Customization

### Adding Quick Actions
Edit `src/components/QuickActions.tsx` to modify quick action buttons.

### Product Recommendations
The `Recommendations` component accepts a `products` prop to pass custom product data.

### Chat Message Types
Extend the `Message` interface in `src/types/chat.ts` to support additional message types.

## License

Private - REZ Consumer Application
