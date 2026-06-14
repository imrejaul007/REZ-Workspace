# RestoPapa API

A comprehensive B2B/B2C SaaS platform for the restaurant industry built with NestJS, providing restaurant management, B2B marketplace, job portal, and customer ordering solutions.

## 🚀 Features

- **Multi-role Authentication System** - JWT-based auth with role-based access control
- **Restaurant Management** - Complete restaurant operations and menu management
- **B2B Marketplace** - Vendor management and product sourcing
- **Job Portal** - HR management and job applications
- **Order Management** - Real-time order processing and tracking
- **Payment Integration** - Stripe and Razorpay support
- **Real-time Communication** - WebSocket-based messaging and notifications
- **File Management** - Cloud storage with Cloudinary and AWS S3
- **Email System** - Comprehensive email templates and queue processing
- **Search & Filtering** - Advanced search across all entities
- **Monitoring & Analytics** - Business metrics and performance monitoring
- **Security** - Rate limiting, input validation, and comprehensive logging

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │ ── │   NestJS API    │ ── │   PostgreSQL    │
│   (Rate Limit)  │    │   (Clustering)  │    │   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │     Redis       │              │
         │              │  (Cache/Queue)  │              │
         │              └─────────────────┘              │
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   File Storage  │    │   Socket.io     │    │   Monitoring    │
│ (Cloud/Local)   │    │ (Real-time)     │    │ (Metrics/Logs)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- Redis 6+
- Docker & Docker Compose (optional)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd restopapa/apps/api
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

Key environment variables:
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/restopapa?schema=public"

# Redis
REDIS_URL="redis://localhost:6379/0"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-refresh-secret"

# Email (choose one)
SENDGRID_API_KEY="your-sendgrid-key"
SMTP_HOST="smtp.gmail.com"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# File Storage (choose one)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
AWS_S3_BUCKET_NAME="your-bucket"

# Payment Gateways
STRIPE_SECRET_KEY="sk_test_your-stripe-key"
RAZORPAY_KEY_ID="your-razorpay-key"
```

### 3. Database Setup

```bash
# Run migrations
npm run db:migrate:dev

# Generate Prisma client
npm run db:generate

# Seed database (optional)
npm run db:seed
```

### 4. Start Development Server

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

- **Swagger UI**: `http://localhost:3000/docs`
- **Health Check**: `http://localhost:3000/api/v1/health`
- **API Prefix**: `/api/v1`

## 🐳 Docker Deployment

### Development with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

### Production Deployment

```bash
# Build production image
docker build -t restopapa-api --target production .

# Run with environment
docker run -d \
  --name restopapa-api \
  -p 3000:3000 \
  --env-file .env.production \
  restopapa-api
```

## 🧪 Testing

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Test with specific database
DATABASE_URL_TEST="postgresql://test:test@localhost:5432/test_db" npm run test
```

## 📊 Database Management

### Migrations

```bash
# Create new migration
npm run db:migrate:dev --name add_new_feature

# Deploy migrations (production)
npm run db:migrate:deploy

# Reset database (development only)
npm run db:migrate:reset
```

### Backup & Restore

```bash
# Create backup
./scripts/backup-database.sh

# List available backups
./scripts/restore-database.sh list

# Restore from backup
./scripts/restore-database.sh restore backup_20241201_120000.sql.gz

# Database statistics
./scripts/restore-database.sh info
```

## 🔍 Monitoring & Logging

### Application Logs

Logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- `logs/access.log` - HTTP access logs
- `logs/security.log` - Security events

### Health Checks

```bash
# Application health
curl http://localhost:3000/health

# Detailed health check
curl http://localhost:3000/health/detailed

# Metrics
curl http://localhost:3000/monitoring/system/metrics
```

### Performance Monitoring

```bash
# System status
curl http://localhost:3000/monitoring/system/status

# Business metrics
curl http://localhost:3000/monitoring/business/metrics

# Database metrics  
curl http://localhost:3000/monitoring/database/metrics
```

## 🔐 Security

### Authentication

The API uses JWT-based authentication with refresh tokens:

```bash
# Sign up
POST /api/v1/auth/signup
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "CUSTOMER"
}

# Sign in
POST /api/v1/auth/signin
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

# Use token in subsequent requests
Authorization: Bearer <access_token>
```

### Demo Credentials

For testing purposes, demo users are available with the following credentials:

| Role | Email | Password |
|------|--------|----------|
| Admin | admin@demo.com | Password123 |
| Restaurant | restaurant@demo.com | Password123 |
| Vendor | vendor@demo.com | Password123 |
| Employee | employee@demo.com | Password123 |

**Note:** These demo credentials are available after running the database seed command (`npm run db:seed`).

### Rate Limiting

- General API: 1000 requests per 15 minutes per IP
- Authentication endpoints: 5 requests per 15 minutes per IP
- File uploads: 50MB max per request

### Input Validation

All inputs are validated and sanitized:
- XSS protection
- SQL injection prevention  
- NoSQL injection prevention
- CSRF protection (production)

## 📨 Email Templates

Pre-built email templates available:

- `welcome` - Welcome new users
- `passwordReset` - Password reset instructions
- `orderConfirmation` - Order confirmation
- `orderStatusUpdate` - Order status changes
- `restaurantApproved` - Restaurant approval
- `jobApplicationReceived` - Job application notifications

Usage:
```typescript
await emailService.sendEmail({
  to: 'user@example.com',
  template: 'welcome',
  templateData: {
    firstName: 'John',
    verificationUrl: 'https://app.com/verify?token=...'
  }
});
```

## 📁 File Upload

Supports multiple storage providers:

```typescript
// Upload single file
POST /api/v1/files/upload
Content-Type: multipart/form-data

file: <file>
category: "profile-images"
isPublic: true
maxWidth: 800
maxHeight: 600
```

Storage options:
- **Cloudinary** (recommended for images)
- **AWS S3** (recommended for documents)  
- **Local storage** (development only)

## 💳 Payment Integration

Supports multiple payment gateways:

### Stripe
```typescript
POST /api/v1/payments/stripe/create-intent
{
  "amount": 2000,
  "currency": "usd",
  "customerId": "cust_123"
}
```

### Razorpay
```typescript
POST /api/v1/payments/razorpay/create-order
{
  "amount": 50000,
  "currency": "INR",
  "receipt": "order_001"
}
```

## 🔄 Real-time Features

WebSocket endpoints for real-time communication:

```javascript
// Connect to WebSocket
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Listen for order updates
socket.on('orderUpdate', (data) => {
  console.log('Order status changed:', data);
});

// Send message
socket.emit('sendMessage', {
  recipientId: 'user-id',
  content: 'Hello!',
  type: 'TEXT'
});
```

## 🔍 Search & Filtering

Advanced search across all entities:

```bash
# Search restaurants
GET /api/v1/search/restaurants?q=pizza&category=Italian&minPrice=10&maxPrice=50

# Search products  
GET /api/v1/search/products?q=tomato&category=Vegetables&availableOnly=true

# Global search
GET /api/v1/search/global?q=restaurant

# Search suggestions
GET /api/v1/search/suggestions?q=res&type=restaurants
```

## 📈 Analytics & Reporting

Business analytics endpoints:

```bash
# Restaurant analytics
GET /api/v1/restaurants/analytics?period=month

# Order analytics
GET /api/v1/analytics/orders?from=2024-01-01&to=2024-01-31

# Revenue reports
GET /api/v1/analytics/revenue?groupBy=day
```

## 🚀 Deployment

### Environment-specific Deployments

**Staging:**
```bash
# Deploy to staging
git push origin develop

# Manual deployment
docker-compose -f docker-compose.staging.yml up -d
```

**Production:**
```bash
# Deploy to production  
git push origin main

# Manual deployment
docker-compose -f docker-compose.prod.yml up -d
```

### Health Checks for Load Balancers

Configure your load balancer to use:
- **Liveness**: `/health/live`
- **Readiness**: `/health/ready`  
- **Health**: `/health`

### Scaling

For horizontal scaling:

1. **Database**: Use read replicas
2. **Redis**: Use Redis Cluster
3. **File Storage**: Use CDN
4. **Application**: Scale with Docker/Kubernetes

```yaml
# docker-compose.scale.yml
services:
  api:
    deploy:
      replicas: 3
    environment:
      PM2_INSTANCES: max
```

## 🐛 Troubleshooting

### Common Issues

**Database Connection Issues:**
```bash
# Check database status
npm run db:status

# Test connection
psql "postgresql://user:pass@localhost:5432/restopapa"
```

**Redis Connection Issues:**
```bash
# Test Redis connection
redis-cli ping

# Check Redis logs
docker logs restopapa-redis
```

**File Upload Issues:**
```bash
# Check storage configuration
curl -X POST http://localhost:3000/api/v1/files/test

# Verify permissions
ls -la uploads/
```

### Performance Issues

```bash
# Check slow queries
npm run db:analyze-slow-queries

# Monitor memory usage
npm run monitor:memory

# Check Redis memory
redis-cli info memory
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=true LOG_LEVEL=debug npm run start:dev

# Database query logging
DATABASE_LOGGING=true npm run start:dev
```

## 📞 Support

- **Documentation**: [Wiki/Docs URL]
- **Issues**: [GitHub Issues URL]
- **Email**: support@restopapa.com
- **Slack**: [Team Slack Channel]

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Workflow

```bash
# Install dependencies
npm install

# Run tests before committing
npm run test

# Lint and format
npm run lint
npm run format

# Type checking
npm run type-check
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🏷️ Version History

- **v1.1.0** - Current release (May 2026)
  - ReZ SSO Bridge integration
  - NextaBizz inventory sync
  - Security audit fixes
  - Password reset + 2FA
  - Community @mentions

For complete changelog, see [CHANGELOG.md](../../CHANGELOG.md) in the root directory.

---

**Version**: 1.1.0 | **Last Updated**: May 2026

**Built with ❤️ using NestJS, PostgreSQL, Redis, and TypeScript**