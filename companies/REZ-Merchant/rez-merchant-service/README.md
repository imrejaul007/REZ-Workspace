# REZ Merchant Service

Merchant management microservice handling merchant profiles, teams, products, and inventory.

## Purpose

The Merchant Service manages:
- Merchant profile and settings
- Team member management
- Product catalog management
- Inventory tracking
- Business hours configuration
- Menu management
- Broadcast messaging

## Environment Variables

```env
# Service Configuration
NODE_ENV=development
PORT=4005
LOG_LEVEL=info

# Database
MONGODB_URI=mongodb://localhost:27017/rez

# Cache
REDIS_URL=redis://localhost:6379
REDIS_TLS=false

# Authentication
JWT_MERCHANT_SECRET=change-me-in-production

# Encryption
ENCRYPTION_KEY=change-me-32-bytes-exactly-here!!

# Internal Service Auth
INTERNAL_SERVICE_TOKEN=dev-internal-token-change-in-production

# Marketing Service
MARKETING_SERVICE_URL=http://localhost:4000

# CORS
CORS_ALLOWED_ORIGINS=https://my-custom-domain.com

# Observability
SENTRY_DSN=
SENTRY_TRACES_SAMPLE_RATE=0.1

# Trust Proxy
TRUST_PROXY_HOPS=1
```

## Local Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run tests
npm test

# Lint code
npm run lint
```

## API Endpoints

### Merchant Profile

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/merchant/profile | Get merchant profile |
| PUT | /api/merchant/profile | Update merchant profile |
| GET | /api/merchant/:merchantId | Get merchant by ID |

### Team Management

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/merchant/team | Get team members |
| POST | /api/merchant/team/invite | Invite team member |
| PUT | /api/merchant/team/:memberId | Update team member |
| DELETE | /api/merchant/team/:memberId | Remove team member |

### Products

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/merchant/products | List merchant products |
| POST | /api/merchant/products | Add new product |
| GET | /api/merchant/products/:productId | Get product details |
| PUT | /api/merchant/products/:productId | Update product |
| DELETE | /api/merchant/products/:productId | Delete product |
| PUT | /api/merchant/products/:productId/inventory | Update inventory |

### Categories

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/merchant/categories | List categories |
| POST | /api/merchant/categories | Create category |
| PUT | /api/merchant/categories/:categoryId | Update category |
| DELETE | /api/merchant/categories/:categoryId | Delete category |

### Business Hours

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/merchant/hours | Get business hours |
| PUT | /api/merchant/hours | Update business hours |

### Broadcasts

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/merchant/broadcasts | List broadcasts |
| POST | /api/merchant/broadcasts | Create broadcast |
| GET | /api/merchant/broadcasts/:broadcastId | Get broadcast status |

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check |

## Data Models

### Merchant
```typescript
{
  merchantId: string;
  name: string;
  email: string;
  phone: string;
  address: Address;
  businessHours: BusinessHours[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Product
```typescript
{
  productId: string;
  merchantId: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  images: string[];
  inventory: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### TeamMember
```typescript
{
  memberId: string;
  merchantId: string;
  userId: string;
  role: 'owner' | 'manager' | 'staff';
  permissions: string[];
  isActive: boolean;
}
```

## Security

1. **Encryption** - Bank details encrypted at rest with AES-256
2. **JWT Validation** - All endpoints require merchant JWT
3. **Role-Based Access** - Owner, Manager, Staff with different permissions
4. **Audit Logging** - All changes logged with user ID

## Deployment

### Render.com
1. Connect GitHub repository
2. Build command: `npm run build`
3. Start command: `npm start`
4. Configure MongoDB connection string

### Docker
```bash
docker build -t rez-merchant-service .
docker run -p 4005:4005 --env-file .env rez-merchant-service
```

## Related Services

- **rez-auth-service** - JWT validation
- **rez-order-service** - Order processing
- **rez-catalog-service** - Product catalog sync
- **rez-marketing-service** - Broadcast messaging

## License

MIT
