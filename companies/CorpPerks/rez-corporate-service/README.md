# ReZ Corporate Service

**Corporate Account Management API**

---

## Quick Start

```bash
npm install
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

## API Endpoints

### Corporate Accounts
- `POST /api/corporate/accounts` - Create corporate account
- `GET /api/corporate/accounts/:id` - Get account details
- `PUT /api/corporate/accounts/:id` - Update account
- `DELETE /api/corporate/accounts/:id` - Delete account

### Employees
- `POST /api/corporate/employees` - Add employee
- `GET /api/corporate/employees` - List employees
- `PUT /api/corporate/employees/:id` - Update employee

### Travel Approvals
- `POST /api/corporate/approvals` - Create approval
- `GET /api/corporate/approvals/:id` - Get approval
- `PUT /api/corporate/approvals/:id/approve` - Approve
- `PUT /api/corporate/approvals/:id/reject` - Reject

### Health
- `GET /health` - Health check
- `GET /health/live` - Liveness probe
- `GET /health/ready` - Readiness probe

## Health Checks

Health checks are automatically configured for Render deployment.

## Scripts

```bash
npm run dev    # Development
npm run build  # Build for production
npm start     # Start production server
```

## Dependencies

- Express
- Mongoose
- Redis
- Sentry (error tracking)
- Prometheus (metrics)

---

**Status:** Production Ready
**Version:** 1.0.0
