# REZ Merchant Auth Service

**Port:** 4015

Unified SSO for all merchant applications.

## Features

| Feature | Description |
|---------|-------------|
| **SSO** | Single login for all merchant apps |
| **JWT Tokens** | Secure tokens with embedded permissions |
| **RBAC** | Role-based access control |
| **Multi-tenant** | Per-merchant isolation |
| **API Keys** | Generate keys for integrations |
| **Audit Logs** | Full activity tracking |
| **Session Management** | Track & invalidate sessions |
| **Lockout Protection** | Brute force protection |

## Quick Start

```bash
cd RABTUL-Technologies/rez-merchant-auth-service
npm install
cp .env.example .env
npm run dev
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/refresh` | Refresh token |
| POST | `/api/v1/auth/logout` | Logout |
| GET | `/api/v1/auth/me` | Get current user |

### API Keys

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/api-keys` | Generate API key |
| GET | `/api/v1/api-keys` | List API keys |
| DELETE | `/api/v1/api-keys/:keyId` | Revoke key |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users` | List users |
| PATCH | `/api/v1/users/:userId` | Update user |

### Audit

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/audit` | Get audit logs |

## Roles & Permissions

| Role | Permissions |
|------|-------------|
| **owner** | All permissions |
| **admin** | All except user management |
| **manager** | Orders, products, inventory, reports |
| **staff** | Read-only access |

## Example Usage

### Login

```bash
curl -X POST https://api.rez.money/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@merchant.com",
    "password": "password123"
  }'
```

### Generate API Key

```bash
curl -X POST https://api.rez.money/api/v1/api-keys \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "POS Integration",
    "permissions": ["orders:read", "orders:create", "inventory:read"]
  }'
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                 REZ Merchant Auth Service                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Login    │  │  Register  │  │   Refresh  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  JWT Generation                            │   │
│  │  • Access token (24h)                                   │   │
│  │  • Refresh token (7d)                                   │   │
│  │  • Embedded permissions                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Session   │  │  API Keys  │  │   Audit    │             │
│  │  Manager   │  │  Generator │  │    Logs    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```
