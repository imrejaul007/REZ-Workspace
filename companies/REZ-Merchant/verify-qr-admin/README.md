# Verify QR Admin - Merchant Dashboard

A comprehensive admin dashboard for managing QR code verification, serial management, fraud detection, and claims processing.

## Features

- **Dashboard** - Overview stats, recent activity, and quick actions
- **Serial Management** - View, search, filter, and manage QR code serials
- **Bulk Generate** - Generate multiple serials at once with custom prefixes
- **Fraud Queue** - Review and manage suspicious scan activities
- **Claims Management** - Process warranty and support claims
- **Service Centers** - Manage authorized service centers
- **Analytics** - Detailed insights and visualizations

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Type Safety**: TypeScript
- **API**: REST calls to verify-qr-service

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Copy the environment file:

```bash
cp .env.example .env.local
```

4. Update `.env.local` with your API URLs and authentication token

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

Create a production build:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Project Structure

```
verify-qr-admin/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── serials/           # Serial management pages
│   │   ├── fraud/             # Fraud queue page
│   │   ├── claims/            # Claims management page
│   │   ├── centers/           # Service centers page
│   │   └── analytics/          # Analytics page
│   ├── components/            # Reusable UI components
│   │   ├── StatsCard.tsx      # Statistics card component
│   │   ├── SerialTable.tsx    # Serial listing table
│   │   ├── FraudAlert.tsx     # Fraud alert card
│   │   ├── ClaimCard.tsx      # Claim card component
│   │   └── Sidebar.tsx        # Navigation sidebar
│   └── services/              # API service layer
│       └── api.ts             # API client and types
├── .env.example               # Environment variables template
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Base API URL | `http://localhost:5000` |
| `VERIFY_QR_SERVICE_URL` | Verify QR service URL | `http://localhost:5000/api/v1` |
| `AUTH_TOKEN` | Authentication token | - |

## API Endpoints

The dashboard connects to the following verify-qr-service endpoints:

### Dashboard
- `GET /admin/dashboard/stats` - Dashboard statistics

### Serials
- `GET /admin/serials` - List serials with pagination
- `POST /admin/serials/generate` - Generate new serials
- `POST /admin/serials/:id/revoke` - Revoke a serial
- `GET /admin/serials/export` - Export serials

### Fraud
- `GET /admin/fraud` - List fraud alerts
- `POST /admin/fraud/:id/review` - Review fraud alert
- `GET /admin/fraud/stats` - Fraud statistics

### Claims
- `GET /admin/claims` - List claims
- `PATCH /admin/claims/:id/status` - Update claim status
- `POST /admin/claims/:id/assign` - Assign service center

### Service Centers
- `GET /admin/centers` - List service centers
- `POST /admin/centers` - Create service center
- `PATCH /admin/centers/:id` - Update service center
- `POST /admin/centers/:id/status` - Toggle center status

### Analytics
- `GET /admin/analytics` - Main analytics data
- `GET /admin/analytics/fraud` - Fraud analytics
- `GET /admin/analytics/claims` - Claims analytics

## License

Private - All rights reserved
