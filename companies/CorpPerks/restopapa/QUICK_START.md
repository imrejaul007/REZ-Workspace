# 🚀 Quick Start Guide - Restaurant SaaS Platform

## Option 1: Automated Startup (Recommended)

```bash
cd /Users/rejaulkarim/Documents/resturistan
./start-local.sh
```

## Option 2: Manual Setup (Step by Step)

### Step 1: Start PostgreSQL Database
```bash
# Using Docker (Recommended)
docker run -d \
  --name restaurant-saas-postgres \
  -e POSTGRES_DB=restaurant_saas \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password123 \
  -p 5432:5432 \
  postgres:15-alpine

# Wait for database to be ready (30 seconds)
```

### Step 2: Setup Backend
```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed database with sample data
npx prisma db seed

# Start backend server
npm run start:dev
```

Backend will start on: http://localhost:8000

### Step 3: Setup Frontend (New Terminal)
```bash
cd frontend

# Install dependencies
npm install

# Start frontend server
npm run dev
```

Frontend will start on: http://localhost:3000

## 🌐 Access Points

- **Frontend App**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/v1
- **API Documentation**: http://localhost:8000/api/docs
- **Database Admin**: `npx prisma studio` (from backend folder)

## 🔑 Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@restauranthub.com | admin123 |
| Restaurant Owner | restaurant@example.com | password123 |
| Employee | employee@example.com | password123 |
| Vendor | vendor@example.com | password123 |

## 🎯 What to Test

### As Restaurant Owner (restaurant@example.com)
1. ✅ Login to dashboard
2. ✅ View restaurant profile
3. ✅ Browse job applications
4. ✅ Check employee profiles and reviews
5. ✅ Explore vendor marketplace
6. ✅ Participate in community discussions

### As Employee (employee@example.com)
1. ✅ Login and view profile
2. ✅ Browse and apply for jobs
3. ✅ Check employment history
4. ✅ View employer reviews and ratings
5. ✅ Update profile and skills

### As Vendor (vendor@example.com)
1. ✅ Login to vendor dashboard
2. ✅ Manage product listings
3. ✅ View customer reviews
4. ✅ Respond to business inquiries
5. ✅ Check order requests

## 🛠️ Troubleshooting

### Port Already in Use
```bash
# Kill processes on ports
sudo lsof -ti:3000 | xargs kill -9
sudo lsof -ti:8000 | xargs kill -9
sudo lsof -ti:5432 | xargs kill -9
```

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart database
docker stop restaurant-saas-postgres
docker run -d --name restaurant-saas-postgres ...
```

### Node Modules Issues
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 🔧 Development Commands

### Backend Commands
```bash
cd backend

# Database commands
npx prisma studio          # Database admin UI
npx prisma migrate reset    # Reset database
npx prisma db push         # Push schema changes
npx prisma db seed         # Seed data

# Development
npm run start:dev          # Hot reload
npm run build             # Production build
npm run test              # Run tests
npm run lint              # Code linting
```

### Frontend Commands
```bash
cd frontend

# Development
npm run dev               # Development server
npm run build            # Production build
npm run start            # Production server
npm run lint             # Code linting
npm run type-check       # TypeScript check
```

## 📊 Sample Data Included

- ✅ 1 Restaurant (Tasty Bites Restaurant)
- ✅ 1 Employee (Jane Smith - Chef)
- ✅ 1 Vendor (Fresh Farm Supplies)
- ✅ 2 Job Postings (Chef & Waiter)
- ✅ Community Discussions
- ✅ Reviews and Ratings
- ✅ Job Applications
- ✅ Notifications

## 🎉 Ready to Use!

The platform is now fully functional with:
- Complete authentication system
- Role-based dashboards
- Job portal functionality
- Vendor marketplace
- Community features
- Review and rating system
- Trust scoring
- Notification system

Start exploring and testing all the features! 🚀