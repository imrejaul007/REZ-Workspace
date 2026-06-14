# Karma Foundation - Deployment Guide

## Quick Start (Docker)

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- At least 2GB RAM available

### One-Command Deployment
```bash
# Clone and start all services
git clone https://github.com/karma-foundation/karma.git
cd karma
docker-compose up -d

# Verify services are running
docker-compose ps
```

### Default Ports
| Service | Port | URL |
|---------|------|-----|
| karma-service | 3000 | http://localhost:3000 |
| karma-loyalty-bridge | 3001 | http://localhost:3001 |
| karma-web | 3002 | http://localhost:3002 |

---

## Docker Deployment

### Docker Compose Setup

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    restart: unless-stopped
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  karma-service:
    build:
      context: ./karma-service
      dockerfile: Dockerfile
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/karma
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongodb
      - redis

  karma-loyalty-bridge:
    build:
      context: ./karma-loyalty-bridge
      dockerfile: Dockerfile
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    depends_on:
      - karma-service

volumes:
  mongodb_data:
  redis_data:
```

### Build and Run
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Docker Environment Variables
```bash
# Create .env file
cp .env.example .env

# Edit required variables
nano .env

# Rebuild after changes
docker-compose up -d --build
```

---

## Web App (Vercel)

### Prerequisites
- Vercel CLI: `npm i -g vercel`
- Vercel account connected to GitHub

### Deployment Steps

1. **Navigate to web app directory:**
   ```bash
   cd karma-web
   ```

2. **Deploy to Vercel:**
   ```bash
   vercel
   ```

3. **Production deployment:**
   ```bash
   vercel --prod
   ```

### Vercel Configuration (vercel.json)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_API_URL": "@api-url",
    "NEXT_PUBLIC_WS_URL": "@ws-url"
  }
}
```

### Environment Variables (Vercel)
```bash
# Set via CLI
vercel env add NEXT_PUBLIC_API_URL
vercel env add NEXT_PUBLIC_WS_URL
vercel env add NODE_ENV production

# Pull from project
vercel env pull .env.local
```

### Domain Setup
```bash
# Add custom domain
vercel domains add karma.foundation

# Check domain status
vercel domains ls
```

---

## Mobile App (EAS)

### Prerequisites
- EAS CLI: `npm i -g eas-cli`
- Expo account at expo.dev
- Apple Developer account (for iOS)
- Google Play Developer account (for Android)

### Setup

1. **Initialize EAS Build:**
   ```bash
   cd karma-mobile
   eas build:configure
   ```

2. **Configure eas.json:**
   ```json
   {
     "cli": {
       "version": ">= 5.0.0"
     },
     "build": {
       "development": {
         "developmentClient": true,
         "distribution": "internal"
       },
       "preview": {
         "distribution": "internal",
         "ios": {
           "simulator": true
         }
       },
       "production": {
         "android": {
           "buildType": "app-bundle"
         },
         "ios": {
           "buildType": "release"
         }
       }
     },
     "submit": {
       "production": {
         "android": {
           "serviceAccountKeyPath": "./path/to/service-account.json"
         },
         "ios": {
           "appleId": "your-apple-id@email.com"
         }
       }
     }
   }
   ```

### Build Commands

```bash
# Local development build (iOS Simulator)
eas build --local --platform ios --profile development

# Cloud development build
eas build --platform ios --profile development

# Preview build (internal distribution)
eas build --platform ios --profile preview
eas build --platform android --profile preview

# Production build
eas build --platform ios --profile production
eas build --platform android --profile production
```

### Submit to App Stores

```bash
# Submit to both stores
eas submit --platform all --profile production

# Submit to specific store
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

---

## VPS/Server Deployment

### Prerequisites
- Ubuntu 20.04+ / Debian 11+
- Nginx
- Node.js 18+
- MongoDB 6.0
- Redis 7.0
- SSL certificates (Let's Encrypt)

### Server Setup

1. **Install dependencies:**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs

   # Install Nginx
   sudo apt install -y nginx

   # Install MongoDB
   wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
   sudo apt update
   sudo apt install -y mongodb-org

   # Install Redis
   sudo apt install -y redis-server

   # Install PM2
   sudo npm install -g pm2
   ```

2. **Configure MongoDB:**
   ```bash
   sudo systemctl enable mongod
   sudo systemctl start mongod
   ```

3. **Configure Redis:**
   ```bash
   sudo systemctl enable redis-server
   sudo systemctl start redis-server
   ```

4. **Clone and setup application:**
   ```bash
   # Clone repository
   git clone https://github.com/karma-foundation/karma.git
   cd karma

   # Install dependencies for each service
   cd karma-service && npm install && cd ..
   cd karma-loyalty-bridge && npm install && cd ..
   ```

5. **Configure environment:**
   ```bash
   # Copy and edit environment files
   cp karma-service/.env.example karma-service/.env
   cp karma-loyalty-bridge/.env.example karma-loyalty-bridge/.env

   # Edit with production values
   nano karma-service/.env
   nano karma-loyalty-bridge/.env
   ```

6. **Start services with PM2:**
   ```bash
   # Start karma-service
   cd karma-service
   pm2 start src/index.js --name karma-service

   # Start karma-loyalty-bridge
   cd ../karma-loyalty-bridge
   pm2 start src/index.js --name karma-loyalty-bridge

   # Save PM2 configuration
   pm2 save

   # Setup PM2 startup script
   pm2 startup
   ```

7. **Configure Nginx:**
   ```bash
   sudo nano /etc/nginx/sites-available/karma
   ```

   ```nginx
   server {
       listen 80;
       server_name api.karma.foundation;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }

   server {
       listen 80;
       server_name loyalty.karma.foundation;

       location / {
           proxy_pass http://127.0.0.1:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   # Enable site
   sudo ln -s /etc/nginx/sites-available/karma /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

8. **Setup SSL with Let's Encrypt:**
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d api.karma.foundation -d loyalty.karma.foundation
   ```

---

## Render.com Deployment

### Prerequisites
- Render account
- GitHub repository connected

### Deploy Backend Services

1. **Create Web Service for karma-service:**
   - Go to Render Dashboard > New > Web Service
   - Connect GitHub repository
   - Select `karma-service` directory
   - Configure:
     - **Root Directory:** `karma-service`
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`
     - **Environment:** Node
     - **Plan:** Starter or higher

2. **Create Web Service for karma-loyalty-bridge:**
   - Same steps as above
   - **Root Directory:** `karma-loyalty-bridge`

3. **Create PostgreSQL database (if needed):**
   - New > PostgreSQL
   - Note connection string for environment variables

4. **Set Environment Variables:**
   In Render dashboard for each service:
   ```
   NODE_ENV=production
   MONGODB_URI=<your-mongodb-uri>
   REDIS_URL=<your-redis-uri>
   JWT_SECRET=<your-jwt-secret>
   CORS_ORIGIN=https://karma.foundation
   ```

### Deploy Web App

1. **Create Static Site:**
   - New > Static Site
   - Connect GitHub repository
   - Select `karma-web` directory
   - Configure:
     - **Root Directory:** `karma-web`
     - **Build Command:** `npm run build`
     - **Publish Directory:** `.next`
   - Add environment variable:
     - `NEXT_PUBLIC_API_URL=https://api.karma.foundation`

### Health Checks

All services should implement health check endpoints:

```javascript
// GET /health
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "database": "connected",
    "cache": "connected"
  },
  "uptime": 3600,
  "version": "1.0.0"
}
```

### Configure Health Check in Render
- **Health Check Path:** `/health`
- **Health Check Interval:** 30 seconds

---

## Health Checks

### Endpoint Structure

| Service | Health Endpoint | Port |
|---------|-----------------|------|
| karma-service | `GET /health` | 3000 |
| karma-loyalty-bridge | `GET /health` | 3001 |
| karma-web | `GET /api/health` | 3002 |

### Health Check Response
```json
{
  "status": "healthy",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "services": {
    "database": {
      "status": "connected",
      "latency_ms": 5
    },
    "cache": {
      "status": "connected",
      "latency_ms": 2
    }
  },
  "uptime_seconds": 86400,
  "version": "1.0.0",
  "environment": "production"
}
```

### Manual Health Check
```bash
# Check karma-service
curl -f https://api.karma.foundation/health

# Check karma-loyalty-bridge
curl -f https://loyalty.karma.foundation/health

# Check with detailed output
curl -s https://api.karma.foundation/health | jq
```

### Automated Health Checks
```bash
# Add to crontab
*/5 * * * * curl -f https://api.karma.foundation/health || echo "ALERT: Service down" | mail admin@example.com
```

---

## Monitoring

### Application Metrics

Implement Prometheus-compatible metrics endpoint:

```bash
# Metrics endpoint
curl https://api.karma.foundation/metrics
```

Key metrics to track:
- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request latency
- `active_connections` - Current active connections
- `queue_size` - Message queue size

### Logging

#### Structured Logging Format
```json
{
  "timestamp": "2026-01-01T00:00:00.000Z",
  "level": "info",
  "service": "karma-service",
  "message": "User authenticated",
  "user_id": "user_123",
  "request_id": "req_456",
  "duration_ms": 45
}
```

#### Log Aggregation
- Use ELK Stack (Elasticsearch, Logstash, Kibana)
- Or cloud solutions: Datadog, New Relic, Sentry

### Monitoring Tools

| Tool | Purpose | Setup |
|------|---------|-------|
| **Sentry** | Error tracking | Set `SENTRY_DSN` env var |
| **PM2 Plus** | Process monitoring | `pm2 link <key>` |
| **Grafana + Prometheus** | Metrics dashboards | Deploy via Docker |
| **Uptime Robot** | Uptime monitoring | Free tier available |

### Alerting

Set up alerts for:
- Service downtime (no response for 1 minute)
- High error rate (>5% errors in 5 minutes)
- High latency (>2s average response time)
- Disk space < 20%
- Memory usage > 90%

---

## Security Checklist

### Environment Variables
- [ ] All secrets are environment variables, not hardcoded
- [ ] `.env` files are in `.gitignore`
- [ ] Secrets are rotated every 90 days
- [ ] No default passwords in production

### Authentication
- [ ] JWT secrets are at least 256 bits
- [ ] JWT expiration is set (max 24 hours)
- [ ] Refresh tokens are implemented
- [ ] Rate limiting is enabled
- [ ] CORS is properly configured

### Database Security
- [ ] MongoDB authentication is enabled
- [ ] Strong passwords for database users
- [ ] SSL/TLS for database connections
- [ ] Regular backups configured
- [ ] Database user follows least privilege

### API Security
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitize user input)
- [ ] CSRF protection enabled
- [ ] API rate limiting configured
- [ ] API versioning implemented

### Infrastructure Security
- [ ] SSL/TLS enabled (HTTPS only)
- [ ] HSTS headers configured
- [ ] Security headers (CSP, X-Frame-Options, etc.)
- [ ] Firewall configured
- [ ] Unnecessary ports closed
- [ ] SSH key authentication only
- [ ] Regular security updates applied

### Secrets Checklist
```bash
# Required secrets for production
JWT_SECRET=<min-32-character-random-string>
QR_SECRET=<min-32-character-random-string>
INTERNAL_SERVICE_TOKEN=<min-32-character-random-string>
ADMIN_TOKEN=<secure-admin-token>

# Generate secure secrets
openssl rand -base64 32
```

---

## Troubleshooting

### Common Issues

#### 1. Service Won't Start

**Symptoms:** Container exits immediately or PM2 shows error status

**Solutions:**
```bash
# Check logs
docker-compose logs karma-service
pm2 logs karma-service

# Verify environment variables
cat .env | grep -E "^[A-Z]" | sort

# Check port availability
lsof -i :3000
netstat -tlnp | grep 3000

# Verify MongoDB connection
mongosh --eval "db.adminCommand('ping')"

# Verify Redis connection
redis-cli ping
```

#### 2. Database Connection Errors

**Symptoms:** `MongoServerSelectionError` or `ECONNREFUSED`

**Solutions:**
```bash
# Check MongoDB is running
docker-compose ps mongodb
sudo systemctl status mongod

# Test MongoDB connection
mongosh "mongodb://localhost:27017/karma"

# Check connection string format
# Correct: mongodb://user:pass@host:27017/database
# Check for typos and proper encoding
```

#### 3. Memory Issues

**Symptoms:** OOM kills, slow performance

**Solutions:**
```bash
# Check memory usage
docker stats
pm2 monit

# Increase memory limit
NODE_OPTIONS="--max-old-space-size=4096"

# Check for memory leaks in PM2
pm2 restart karma-service --update-env
```

#### 4. Build Failures

**Symptoms:** `npm install` fails or build errors

**Solutions:**
```bash
# Clear node_modules and cache
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Check Node.js version
node --version  # Should be 18+

# For Docker builds, check base image
docker-compose build --no-cache
```

#### 5. SSL Certificate Issues

**Symptoms:** HTTPS not working, certificate errors

**Solutions:**
```bash
# Check certificate status
sudo certbot certificates

# Renew certificates
sudo certbot renew

# Force renewal
sudo certbot renew --force-renewal

# Test Nginx configuration
sudo nginx -t
```

#### 6. CORS Errors

**Symptoms:** `Access-Control-Allow-Origin` errors in browser

**Solutions:**
```bash
# Verify CORS_ORIGIN environment variable
echo $CORS_ORIGIN

# Check CORS configuration
# Should match exact origin, not wildcard in production
# Example: https://karma.foundation (not *.karma.foundation)
```

#### 7. High Latency

**Symptoms:** Slow API responses

**Solutions:**
```bash
# Check Redis is functioning
redis-cli ping
redis-cli info stats

# Check database indexes
db.collection.getIndexes()

# Add slow query logging
# In MongoDB: db.setProfilingLevel(1, { slowms: 100 })
```

### Debug Mode

Enable debug logging:
```bash
# Development
NODE_ENV=development
DEBUG=karma:*

# View debug output
npm run dev 2>&1 | grep -i error
```

### Recovery Procedures

#### Complete Service Recovery
```bash
# 1. Stop all services
docker-compose down
pm2 stop all

# 2. Backup data
mongodump --archive=/backups/mongo-$(date +%Y%m%d).archive

# 3. Clear caches
redis-cli FLUSHALL

# 4. Restart services
docker-compose up -d
# OR
pm2 restart all

# 5. Verify health
curl -f https://api.karma.foundation/health
```

#### Rollback Deployment
```bash
# Docker
docker-compose down
git checkout v1.2.0
docker-compose up -d

# Vercel
vercel rollback

# PM2
pm2 stop all
git checkout v1.2.0
npm install
pm2 start ecosystem.config.js
```

### Support Contacts

| Issue | Contact |
|-------|---------|
| Infrastructure | ops@karma.foundation |
| Security | security@karma.foundation |
| Database | dba@karma.foundation |
| General | support@karma.foundation |

---

## Environment Variables Reference

See `.env.example` for all required environment variables.

### Required for Each Service

**karma-service:**
- `PORT`, `NODE_ENV`
- `MONGODB_URI`, `REDIS_URL`
- `JWT_SECRET`, `QR_SECRET`, `INTERNAL_SERVICE_TOKEN`
- `CORS_ORIGIN`

**karma-loyalty-bridge:**
- `PORT`, `NODE_ENV`
- `AUTH_SERVICE_URL`, `WALLET_SERVICE_URL`, `MERCHANT_SERVICE_URL`
- `INTERNAL_SERVICE_TOKEN`

**karma-web:**
- `PORT`, `NODE_ENV`
- `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`

**karma-mobile:**
- `API_URL`, `WS_URL`
- App store credentials

---

*Last updated: 2026-06-12*
*Version: 1.0.0*