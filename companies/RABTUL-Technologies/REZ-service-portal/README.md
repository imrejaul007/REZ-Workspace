# ReZ Service Portal

Service Management Portal for the REZ ecosystem. Built with Next.js 14, Tailwind CSS, and TypeScript.

## Features

- **Service Catalog**: Browse all services with search and filter capabilities
- **Health Dashboard**: Real-time health status monitoring (green/yellow/red)
- **Metrics Visualization**: Performance metrics with charts and trends
- **API Documentation**: Interactive API reference with examples
- **Dark Theme**: Modern dark UI design

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- React Query (TanStack Query)
- Axios

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

## Configuration

Environment variables:

```env
NEXT_PUBLIC_GATEWAY_URL=http://localhost:4080  # Gateway URL (default)
NEXT_PUBLIC_USE_MOCK=true  # Use mock data (default: true)
```

## Pages

- `/` - Dashboard with overview
- `/services` - Service catalog
- `/services/[id]` - Service detail page
- `/health` - Health overview
- `/metrics` - Metrics dashboard
- `/docs` - API documentation

## Mock Data

The app runs with mock data by default for demo purposes. To connect to a real gateway:

1. Set `NEXT_PUBLIC_USE_MOCK=false` in environment
2. Ensure gateway is running at configured URL
3. Gateway should expose `/api/services`, `/api/health`, `/api/metrics` endpoints

## Structure

```
REZ-service-portal/
├── app/                    # Next.js App Router pages
│   ├── services/          # Service pages
│   ├── health/            # Health dashboard
│   ├── metrics/           # Metrics page
│   └── docs/              # API documentation
├── components/             # React components
│   ├── Sidebar.tsx
│   ├── ServiceCard.tsx
│   └── HealthStatus.tsx
└── lib/                   # Utilities and API
    ├── api.ts             # API client
    ├── types.ts           # TypeScript types
    └── utils.ts           # Helper functions
```

## Design

- **Theme**: Dark mode with slate-900 background
- **Status Colors**: Green (healthy), Yellow (degraded), Red (down)
- **Navigation**: Fixed sidebar with main sections
- **Typography**: Inter font family
