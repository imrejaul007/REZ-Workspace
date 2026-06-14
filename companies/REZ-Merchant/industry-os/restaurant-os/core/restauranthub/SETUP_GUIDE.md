# 🚀 Resturistan App - Complete Setup Guide

## Current Status
✅ **Project Structure**: Complete monorepo with all modules
✅ **Code Base**: All features implemented with UI
✅ **Scripts**: Infrastructure automation scripts created
❌ **Infrastructure**: Not running (Docker required)
❌ **Database**: Not initialized
❌ **Services**: Not connected

## Prerequisites Required

### 1. Install Docker Desktop (REQUIRED)
```bash
# macOS - Download from:
https://www.docker.com/products/docker-desktop/

# After installation, verify:
docker --version
docker compose version
```

### 2. Node.js Requirements
```bash
# Check your Node version (should be 18+)
node --version

# If needed, upgrade Node:
brew install node@18
```

## Quick Start Guide

### Step 1: Install Docker Desktop
1. Visit https://www.docker.com/products/docker-desktop/
2. Download Docker Desktop for Mac
3. Install and start Docker Desktop
4. Wait for Docker icon to appear in menu bar

### Step 2: Start Infrastructure
```bash
# Once Docker is running, execute:
./start-infrastructure.sh

# This will:
# - Start PostgreSQL database
# - Start Redis cache
# - Run database migrations
# - Seed initial data
```

### Step 3: Start Development Servers
```bash
# In a new terminal:
npm run dev

# This starts:
# - Backend API on http://localhost:3001
# - Frontend on http://localhost:3002
```

## Manual Setup (If Scripts Fail)

### 1. Start Database Services
```bash
# Start PostgreSQL and Redis
docker compose up -d postgres redis

# Wait for services
sleep 10
```

### 2. Setup Database
```bash
# Generate Prisma client
cd apps/api
npx prisma generate

# Push schema to database
npx prisma db push

# Seed initial data
npx prisma db seed
```

### 3. Fix Missing Dependencies
```bash
# Install missing packages
cd apps/api
npm install @nestjs/terminus express-rate-limit compression

cd ../web
npm install @radix-ui/react-label @radix-ui/react-collapsible
```

### 4. Start Services
```bash
# From root directory
npm run dev
```

## Default Credentials

After seeding, use these accounts:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@resturistan.com | Admin@123 |
| Restaurant | restaurant@resturistan.com | Restaurant@123 |
| Vendor | vendor@resturistan.com | Vendor@123 |
| Employee | employee@resturistan.com | Employee@123 |
| Customer | customer@resturistan.com | Customer@123 |

## Service URLs

- **Frontend**: http://localhost:3002
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api-docs
- **Database**: localhost:5432 (PostgreSQL)
- **Cache**: localhost:6379 (Redis)

## Troubleshooting

### Docker Not Found
```bash
# Install Docker Desktop manually from website
# Make sure Docker Desktop is running (check menu bar)
```

### Port Already in Use
```bash
# Find and kill process using port
lsof -i :3001
kill -9 <PID>

# Or change ports in .env file
```

### Database Connection Failed
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart database
docker compose restart postgres

# Check logs
docker compose logs postgres
```

### Prisma Errors
```bash
# Regenerate Prisma client
cd apps/api
npx prisma generate

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset
```

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf apps/web/.next
```

## Next Steps After Setup

1. **Verify Services**:
   - Open http://localhost:3002
   - Try logging in with credentials above
   - Check all user dashboards

2. **Test Features**:
   - Marketplace: Browse products, add to cart
   - Jobs: View job listings
   - Community: Check discussion boards
   - Wallet: View balance and transactions

3. **Development**:
   - API endpoints: http://localhost:3001/api/v1/*
   - Hot reload enabled for both frontend and backend
   - Database GUI: `npx prisma studio`

## Current Issues to Fix

1. **TypeScript Errors**: Some type definitions missing
2. **Missing Dependencies**: Need to install remaining packages
3. **Mock Data**: Frontend using mock data, needs API connection
4. **WebSocket**: Real-time features not configured

## Production Deployment

For production deployment, refer to:
- `DEPLOYMENT_GUIDE.md` - Cloud deployment instructions
- `docker-compose.prod.yml` - Production configuration
- `k8s/` - Kubernetes manifests

## Support

If you encounter issues:
1. Check Docker Desktop is running
2. Verify all ports are free
3. Check logs: `docker compose logs -f`
4. Restart services: `docker compose restart`

---

**Important**: The application requires Docker to run the database and cache services. Without Docker, you'll need to install PostgreSQL and Redis manually on your system.