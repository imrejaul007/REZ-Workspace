# REZ QR Cloud - Complete Deployment Guide

## Step 1: Create MongoDB Atlas Database

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up/Login
3. Click "Build a Database"
4. Choose **Free** tier (M0 Sandbox)
5. Select **Mumbai** region
6. Click "Create"

### Create Database User

1. Go to Security > Database Access
2. Click "Add New Database User"
3. Username: qrcloudadmin
4. Password: (generate secure password)
5. Database Privileges: "Read and write to any database"
6. Click "Add User"

### Configure Network Access

1. Go to Security > Network Access
2. Click "Add IP Address"
3. Click "Allow Access from Everywhere"
4. Click "Confirm"

### Get Connection String

1. Go to Deployment > Database
2. Click "Connect" on your cluster
3. Select "Connect your application"
4. Copy the connection string

---

## Step 2: Deploy to Render

### Create Render Account

1. Go to https://dashboard.render.com
2. Sign up with GitHub
3. Connect your GitHub repository

### Deploy Service

1. Click "New +" > "Web Service"
2. Connect: https://github.com/imrejaul007/RABTUL-Technologies
3. Root Directory: rez-qr-cloud-service
4. Settings:
   - **Name:** rez-qr-cloud
   - **Region:** Singapore
   - **Runtime:** Node
   - **Build Command:** npm install
   - **Start Command:** npm start

### Add Environment Variables

In Render dashboard, add these:

| Key | Value |
|-----|-------|
| NODE_ENV | production |
| PORT | 4300 |
| MONGODB_URI | Your MongoDB Atlas connection string |
| QR_CLOUD_URL | https://qr.rez.money |
| INTERNAL_SERVICE_TOKEN | Generate random 32-char string |
| LOG_LEVEL | info |
| RAZORPAY_KEY_ID | Your Razorpay key ID |
| RAZORPAY_KEY_SECRET | Your Razorpay key secret |

### Deploy

1. Click "Create Web Service"
2. Wait for deployment (2-5 minutes)
3. Note your URL

---

## Step 3: Configure DNS (Custom Domain)

### Add Domain in Render

1. Go to your service > Settings
2. Scroll to Custom Domains
3. Click "Add Custom Domain"
4. Enter: qr.rez.money
5. Click "Verify"
6. Add DNS records shown

### Add DNS Records (in your DNS provider)

| Type | Name | Value |
|------|------|-------|
| CNAME | qr | your-service.onrender.com |

---

## Step 4: Test Deployment

### Health Check

```bash
curl https://qr.rez.money/api/health
```

Should return: {"status":"healthy","service":"qr-cloud"}

### Create Test Merchant

```bash
curl -X POST https://qr.rez.money/api/merchants \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Restaurant","slug":"test-restaurant","type":"restaurant","phone":"+919876543210"}'
```

---

## Step 5: Deploy Customer App

### Option A: Vercel (Recommended)

1. Go to https://vercel.com
2. Import project
3. Select rez-qr-cloud-app folder
4. Framework: Static
5. Deploy

### Update API URL

After deployment, update API_URL in index.html

---

## Complete Setup Checklist

| Task | Status |
|------|--------|
| MongoDB Atlas cluster created | _ |
| Database user created | _ |
| Network access configured | _ |
| Connection string copied | _ |
| Render service deployed | _ |
| Environment variables added | _ |
| Health check passed | _ |
| Test merchant created | _ |
| Customer app deployed | _ |
| DNS configured | _ |
| Razorpay keys added | _ |

---

## Support

Email: support@rez.money
Phone: +91 98765 43210
