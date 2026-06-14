# MongoDB Atlas Setup Guide

## Step 1: Create Free MongoDB Atlas Account

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Try Free" → Create free account
3. Select "M0 Sandbox" (Free tier)

## Step 2: Create Cluster

1. Click "Build a Database"
2. Select "M0 Sandbox" (Free)
3. Select region: Singapore (closest to Render)
4. Click "Create"

## Step 3: Create Database User

1. Go to "Database Access" in left menu
2. Click "Add New Database User"
3. Username: `rez-safe-qr`
4. Password: (generate strong password)
5. Role: "Read and write to any database"
6. Click "Add User"

## Step 4: Configure Network Access

1. Go to "Network Access" in left menu
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

## Step 5: Get Connection String

1. Go to "Clusters" → Click "Connect"
2. Select "Connect your application"
3. Copy the connection string:

```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/rez-safe-qr?retryWrites=true&w=majority
```

Replace `<username>` and `<password>` with your credentials.

---

## Generate INTERNAL_SERVICE_TOKEN

```bash
openssl rand -hex 32
```

---

## Render Environment Variables

Add these in Render dashboard:

```env
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/rez-safe-qr
INTERNAL_SERVICE_TOKEN=<generated-token>
AUTH_SERVICE_URL=https://rez-auth-service.onrender.com
NOTIFICATIONS_SERVICE_URL=https://rez-notifications-service.onrender.com
QR_BASE_URL=https://rez.app/s
```

---

## Quick Test (Local)

```bash
# Start MongoDB locally
brew services start mongodb-community

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Test connection
mongosh "mongodb://localhost:27017/rez-safe-qr"
```
