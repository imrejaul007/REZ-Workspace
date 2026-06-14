# REZ Developer Portal

A comprehensive developer portal for the REZ API ecosystem, built with Next.js 14.

## Features

- **API Documentation** - Complete reference for all REZ API services
- **Interactive Playground** - Test API endpoints directly in the browser
- **SDK Documentation** - Installation guides for JavaScript, Node.js, and React Native
- **Authentication Guide** - JWT, API keys, and service-to-service auth
- **Webhook Documentation** - Real-time event notifications
- **Rate Limiting Info** - Understanding request limits
- **Error Code Reference** - Troubleshooting guide
- **Changelog** - Stay updated with latest changes

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Syntax Highlighting**: Prism (react-syntax-highlighter)
- **Icons**: Lucide React
- **MDX Support**: next-mdx-remote

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/imrejaul007/REZ-Developer-Portal.git

# Navigate to the project directory
cd REZ-Developer-Portal

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
REZ-developer-portal/
├── app/
│   ├── docs/
│   │   ├── [slug]/page.tsx    # Dynamic doc pages
│   │   └── page.tsx          # Docs hub
│   ├── api-reference/
│   │   └── page.tsx          # API reference
│   ├── playground/
│   │   └── page.tsx          # API playground
│   ├── sdks/
│   │   └── page.tsx          # SDK documentation
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx              # Landing page
├── components/
│   ├── ApiTester.tsx         # Interactive API tester
│   ├── CodeBlock.tsx         # Syntax highlighted code
│   ├── Header.tsx            # Navigation header
│   ├── Providers.tsx         # React providers
│   ├── Search.tsx            # Search modal
│   └── Sidebar.tsx          # Documentation sidebar
├── content/
│   └── docs/
│       ├── introduction.mdx
│       ├── authentication.mdx
│       ├── quick-start.mdx
│       ├── api-overview.mdx
│       ├── webhooks.mdx
│       ├── rate-limits.mdx
│       ├── error-codes.mdx
│       └── changelog.mdx
├── lib/
│   └── docs.ts               # MDX utilities
├── public/
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Documentation Sections

### Getting Started
- [Introduction](/docs/introduction) - Learn the basics
- [Authentication](/docs/authentication) - Secure your requests
- [Quick Start](/docs/quick-start) - First API call in 5 minutes

### Core Concepts
- [API Overview](/docs/api-overview) - All available services
- [Webhooks](/docs/webhooks) - Real-time notifications
- [Rate Limits](/docs/rate-limits) - Request limits
- [Error Codes](/docs/error-codes) - Troubleshooting

### Resources
- [API Reference](/api-reference) - Complete endpoint reference
- [SDKs](/sdks) - Client library documentation
- [Playground](/playground) - Test APIs live

## Services

The portal documents these RABTUL services:

| Service | Port | Purpose |
|---------|------|---------|
| Auth Service | 4002 | JWT, OTP, MFA, OAuth |
| Payment Service | 4001 | Razorpay, UPI, Webhooks |
| Wallet Service | 4004 | Coins, Balance, Loyalty |
| Order Service | 4006 | Order lifecycle, FSM |
| Catalog Service | 4007 | Products, Inventory |
| Search Service | 4008 | Full-text, Autocomplete |
| Notifications | 4011 | Push, SMS, Email, WhatsApp |
| Analytics | 4016 | Dashboards |

## License

MIT License - See LICENSE file for details.

---

Built with care for developers worldwide.
