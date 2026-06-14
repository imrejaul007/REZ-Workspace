# REZ Analytics Dashboard

Real-time analytics dashboard for the REZ Platform built with Next.js and Recharts.

## Features

- **Real-time Metrics** - Live updating KPIs with auto-refresh
- **Funnel Visualization** - Conversion funnel analysis with conversion rates
- **Campaign Performance** - Multi-campaign tracking with ROI, CTR, and conversion metrics
- **Revenue Tracking** - Daily revenue trends vs targets over 30 days

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Charts**: Recharts
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
cd REZ-dashboard

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
REZ-dashboard/
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   │   ├── analytics/
│   │   │   ├── campaigns/
│   │   │   ├── realtime/
│   │   │   └── revenue/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── DashboardHeader.tsx
│   │   ├── Sidebar.tsx
│   │   ├── MetricsGrid.tsx
│   │   ├── RealtimeMetrics.tsx
│   │   ├── FunnelChart.tsx
│   │   ├── CampaignChart.tsx
│   │   └── RevenueChart.tsx
│   ├── lib/
│   │   └── mock-data.ts
│   └── types/
│       └── index.ts
├── .github/
│   └── workflows/
│       └── deploy.yml
├── vercel.json
├── tailwind.config.ts
└── package.json
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analytics` | GET | All analytics data |
| `/api/realtime` | GET | Real-time metrics |
| `/api/revenue` | GET | Revenue data and summary |
| `/api/campaigns` | GET | Campaign performance data |

## Deployment to Vercel

### Option 1: Vercel CLI

```bash
npm install -g vercel
vercel login
vercel
```

### Option 2: GitHub Integration

1. Push to GitHub
2. Import project in Vercel
3. Configure environment variables:
   - `APP_URL`: Your production URL
4. Deploy

### Required Secrets (GitHub Actions)

- `VERCEL_TOKEN`: Vercel API token
- `APP_URL`: Production app URL

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_APP_URL` | Application URL | Yes |

## License

Proprietary - REZ Platform
