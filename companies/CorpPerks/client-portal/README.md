# CorpPerks Client Portal

A modern, client-facing dashboard for CorpPerks enterprise clients to view project status, invoices, and communicate with their dedicated project team.

## Features

- **Dashboard** - Overview of active projects, pending invoices, messages, and recent activity
- **Projects** - Track project progress, milestones, team members, and documents
- **Invoices** - View and download invoices, track payment status
- **Messages** - Real-time communication with project team
- **Documents** - Access contracts, proposals, reports, and invoices
- **Profile** - Manage company information and team members

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, TailwindCSS
- **Backend**: Node.js, Express, TypeScript
- **Authentication**: JWT-based token auth
- **Design**: Custom CorpPerks design system with gradient accents

## Quick Start

### Backend Service

```bash
cd client-portal-service

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

The backend runs on **port 4726**.

### Frontend

```bash
cd client-portal

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend runs on **port 3001**.

## Demo Credentials

| Email | Password |
|-------|----------|
| demo@corpperks.com | demo123 |
| tech@globex.io | tech123 |
| hello@startupx.in | startup123 |

## API Endpoints

### Authentication
- `POST /api/auth/login` - Client login
- `GET /api/auth/verify` - Verify token

### Client Data
- `GET /api/client/profile` - Get client profile
- `GET /api/client/dashboard` - Get dashboard stats
- `GET /api/client/projects` - Get all projects
- `GET /api/client/projects/:id` - Get specific project
- `GET /api/client/invoices` - Get all invoices
- `GET /api/client/invoices/:id` - Get specific invoice
- `GET /api/client/messages` - Get all messages
- `POST /api/client/messages` - Send message
- `GET /api/client/documents` - Get all documents

## Environment Variables

### Backend (.env)
```env
PORT=4726
NODE_ENV=development
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:3001
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:4726
```

## Design System

### Colors
- Primary: `#8B5CF6` (Indigo/Purple)
- Background: `#F8FAFC` (Slate 50)
- Card: `#FFFFFF` (White)
- Text: `#1E293B` (Slate 800)

### Typography
- Headings: Plus Jakarta Sans
- Body: Inter

## Integration Points

The client portal connects to:
- **Corp CRM Service** (Port 4725) - Client data
- **ProjectOS Service** (Port 4715) - Project details
- **Team Collab Service** (Port 4716) - Messages

## Production Deployment

### Build Frontend
```bash
cd client-portal
npm run build
npm start
```

### Build Backend
```bash
cd client-portal-service
npm run build
npm start
```

## License

Proprietary - CorpPerks
