# NexTaBizz

**Universal Business OS - Frontend Application**

NexTaBizz is a modern, responsive web application for managing businesses across multiple industries. It provides a comprehensive dashboard for restaurant, hotel, salon, retail, gym, and other business management needs.

## Overview

NexTaBizz Frontend is built with Next.js 14 and provides:

- **Industry Selector**: Choose from 15+ industries with pre-configured modules
- **Business Dashboard**: Real-time analytics and insights
- **Module Management**: Enable/disable features per business
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern UI**: Built with Tailwind CSS and Lucide icons

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Icons**: Lucide React

## Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
```

### Running the App

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

## Project Structure

```
NexTaBizz/
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Landing page
│   │   ├── globals.css        # Global styles
│   │   ├── providers.tsx      # React Query provider
│   │   ├── dashboard/
│   │   │   └── page.tsx       # Business dashboard
│   │   ├── business/
│   │   │   ├── page.tsx       # Business list
│   │   │   └── [id]/
│   │   │       └── page.tsx   # Business detail
│   │   ├── industries/
│   │   │   └── page.tsx       # Industry selection
│   │   └── api/
│   │       └── health/
│   │           └── route.ts   # Health check API
│   ├── components/
│   │   ├── IndustrySelector.tsx
│   │   ├── BusinessCard.tsx
│   │   ├── ModuleToggle.tsx
│   │   └── Dashboard.tsx
│   ├── lib/
│   │   └── api.ts             # API client
│   └── types/
│       └── index.ts            # TypeScript types
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── .env.example
```

## Environment Variables

Create a `.env.local` file in the root directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:4200
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_DARK_MODE=true
```

## Features

### Landing Page

The landing page showcases:

- Industry selector with visual cards
- Feature highlights
- Industry showcase
- Customer testimonials
- Call-to-action sections

### Dashboard

The main dashboard includes:

- Summary statistics (businesses, revenue, orders, customers)
- Analytics charts (revenue trend, revenue by module, top products)
- Business cards with quick actions
- Period selector (day, week, month, year)

### Business Management

- List all businesses with search and filters
- Create new business with industry selection
- View business details
- Edit business information
- Enable/disable modules
- View business analytics

### Industry Selection

- Browse all 15+ supported industries
- Filter by module category
- View industry-specific modules
- Quick-start business creation

## Supported Industries

| Industry | Icon | Modules |
|----------|------|---------|
| Restaurant | 🍽️ | Menu, POS, KDS, Inventory, Staff, Loyalty |
| Hotel | 🏨 | Rooms, Booking, Housekeeping, Gateway |
| Salon | 💇 | Appointments, POS, Clients, Treatments |
| Retail | 🛍️ | POS, Inventory, Suppliers, Barcode |
| Gym | 🏋️ | Membership, Attendance, Classes, Trainers |
| Spa | 🧘 | Appointments, Treatments, Booking |
| Healthcare | 🏥 | Patients, Appointments, Prescriptions |
| Education | 🎓 | Students, Courses, Attendance, Grades |
| Real Estate | 🏠 | Properties, Leads, Viewings, Contracts |
| Automotive | 🚗 | Vehicles, Service History, Parts |
| Grocery | 🛒 | POS, Inventory, Barcode, Suppliers |
| Pharmacy | 💊 | POS, Prescriptions, Inventory |
| Fashion | 👗 | POS, Inventory, Clients, Discounts |
| Fitness | 🧘 | Membership, Classes, Trainers |
| Other | 📦 | POS, Inventory, Staff, Orders |

## API Integration

The frontend integrates with the NexTaBizz Backend Service at `http://localhost:4200`.

### Endpoints Used

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/industries | List all industries |
| GET | /api/industries/:type | Get industry details |
| GET | /api/industries/:type/modules | Get industry modules |
| GET | /api/business | List businesses |
| GET | /api/business/:id | Get business details |
| POST | /api/business | Create business |
| PUT | /api/business/:id | Update business |
| DELETE | /api/business/:id | Delete business |
| GET | /api/business/:id/modules | Get business modules |
| POST | /api/business/:id/modules | Enable module |
| DELETE | /api/business/:id/modules/:moduleId | Disable module |
| GET | /api/analytics/business/:id | Get business analytics |
| GET | /api/analytics/summary | Get analytics summary |

### Authentication

The API uses JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Components

### IndustrySelector

Displays a grid of industry cards with:
- Industry icon and name
- Description
- Module count
- Visual selection state

### BusinessCard

Shows business information with:
- Business name and industry
- Location and contact info
- Stats (revenue, orders, customers)
- Enabled modules preview
- Quick actions (edit, delete, analytics)

### ModuleToggle

Toggle component for enabling/disabling modules:
- Module icon and name
- Category badge
- Toggle switch
- Availability status

### Dashboard

Analytics dashboard with:
- Period selector
- Stats cards (revenue, orders, customers, AOV)
- Revenue trend chart
- Revenue by module pie chart
- Top products bar chart

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Docker

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
ENV NODE_ENV production
CMD ["npm", "start"]
```

## Performance

- Server-side rendering for SEO
- Static generation for landing page
- Client-side data fetching with React Query
- Optimized images with Next.js Image
- Code splitting by route

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Proprietary - REZ-Merchant

## Related Services

- [nexTabizz-service](https://github.com/rez-merchant/nextabizz-service) - Backend API
- [REZ-Merchant](https://github.com/rez-merchant) - Industry OS Platform
