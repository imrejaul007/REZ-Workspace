# CorpPerks Backend API

Production-ready backend for CorpPerks Workforce OS.

## Quick Start

```bash
# Install dependencies
cd backend
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new tenant/company |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/change-password` | Change password |

### Employees
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employees` | List employees |
| GET | `/api/employees/:id` | Get employee |
| POST | `/api/employees` | Create employee |
| PUT | `/api/employees/:id` | Update employee |
| DELETE | `/api/employees/:id` | Delete employee |

### Leave
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leave` | List leave requests |
| GET | `/api/leave/:id` | Get leave request |
| POST | `/api/leave` | Create leave request |
| PUT | `/api/leave/:id/approve` | Approve/reject leave |
| PUT | `/api/leave/:id/cancel` | Cancel leave request |
| GET | `/api/leave/balances/all` | Get all leave balances |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/attendance` | List attendance records |
| GET | `/api/attendance/today` | Get today's attendance |
| GET | `/api/attendance/stats` | Get attendance stats |
| POST | `/api/attendance/check-in` | Check in |
| POST | `/api/attendance/check-out` | Check out |

### Shifts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/shifts` | List shifts |
| GET | `/api/shifts/stats` | Get shift stats |
| GET | `/api/shifts/templates` | Get shift templates |
| POST | `/api/shifts` | Create shift |
| POST | `/api/shifts/templates` | Create shift template |
| PUT | `/api/shifts/:id/start` | Start shift |
| PUT | `/api/shifts/:id/complete` | Complete shift |
| DELETE | `/api/shifts/:id` | Delete shift |

### Departments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/departments` | List departments |
| POST | `/api/departments` | Create department |
| PUT | `/api/departments/:id` | Update department |
| DELETE | `/api/departments/:id` | Delete department |

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Tenant Isolation

Multi-tenant architecture. Pass tenant ID in header:

```
X-Tenant-ID: <tenant_id>
```

Or use the tenant from the JWT token.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment | development |
| PORT | Server port | 4006 |
| MONGODB_URI | MongoDB connection string | localhost |
| JWT_SECRET | JWT signing secret | (required) |
| JWT_EXPIRES_IN | Token expiry | 7d |
| CORS_ORIGIN | Allowed origin | localhost:3000 |
| RATE_LIMIT_WINDOW_MS | Rate limit window | 900000 (15min) |
| RATE_LIMIT_MAX_REQUESTS | Max requests per window | 100 |

## Health Check

```bash
curl https://your-api.onrender.com/health
```

**Response:**
```json
{
  "status": "ok",
  "service": "corpperks-backend",
  "version": "1.0.0",
  "timestamp": "2026-05-22T00:00:00.000Z"
}
```

## Deploy to Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `npm run build`
4. Set start command: `npm start`
5. Add environment variables from `.env`

Or use the Render Blueprint: `render.yaml`

## Production Checklist

- [ ] Set strong JWT_SECRET
- [ ] Configure MongoDB Atlas with authentication
- [ ] Enable SSL for MongoDB
- [ ] Set proper CORS origins
- [ ] Configure rate limiting
- [ ] Add monitoring (Sentry, DataDog)
- [ ] Set up CI/CD pipeline
- [ ] Configure environment variables on hosting
