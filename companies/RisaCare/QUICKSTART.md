# RisaCare - Quick Start Guide

## 🚀 Start Development in 5 Minutes

### Option 1: Docker (Recommended)

```bash
# 1. Clone repo
git clone https://github.com/imrejaul007/RisaCare.git
cd RisaCare

# 2. Start all services
docker-compose up -d

# 3. Check services
docker-compose ps

# 4. Services running at:
# - Mobile Backend: http://localhost:4770
# - Telemedicine: http://localhost:4773
# - EMR: http://localhost:4778
```

### Option 2: Manual Start

```bash
# 1. Install dependencies
npm install

# 2. Start MongoDB
docker run -d -p 27017:27017 --name mongo mongo:7

# 3. Start services
cd risa-care-mobile-backend && npm run dev &
cd risa-care-telemedicine && npm run dev &
cd risa-care-emr-service && npm run dev &

# 4. Start mobile app
cd risa-care-mobile-app && npm install && expo start
```

---

## 📱 Mobile App Setup

### iOS
```bash
cd risa-care-mobile-app
npm install
npx expo start --ios
```

### Android
```bash
cd risa-care-mobile-app
npm install
npx expo start --android
```

### Web
```bash
cd risa-care-mobile-app
npm install
npx expo start --web
```

---

## 🔧 Service Ports

| Service | Port | URL |
|---------|------|-----|
| Mobile Backend | 4770 | http://localhost:4770 |
| Telemedicine | 4773 | http://localhost:4773 |
| EMR | 4778 | http://localhost:4778 |
| Pharmacy | 4757 | http://localhost:4757 |
| Lab | 4777 | http://localhost:4777 |
| Provider Directory | 4780 | http://localhost:4780 |
| Health Wallet | 4781 | http://localhost:4781 |
| Marketplace | 4774 | http://localhost:4774 |

---

## 🧪 Test APIs

### Health Check
```bash
curl http://localhost:4770/health
```

### Register User
```bash
curl -X POST http://localhost:4770/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210","password":"test123","role":"patient","firstName":"Test","lastName":"User"}'
```

### Get Doctors
```bash
curl http://localhost:4770/api/doctors
```

### Book Appointment
```bash
curl -X POST http://localhost:4770/api/appointments \
  -H "Content-Type: application/json" \
  -d '{"doctorId":"DR001","scheduledAt":"2026-06-25T10:00:00Z","reason":"Consultation"}'
```

---

## 📁 Key Files

```
RisaCare/
├── README.md              # Main documentation
├── QUICKSTART.md         # This file
├── SOT.md                # Source of Truth
├── CLAUDE.md             # Developer Guide
├── docker-compose.yml     # Docker deployment
├── k8s-deployment.yml    # Kubernetes deployment
├── risa-care-mobile-app/ # Mobile app
│   ├── App.tsx           # Main app
│   └── src/screens/      # All screens
├── risa-care-mobile-backend/    # Backend API
├── risa-care-telemedicine/      # Video calls
└── risa-care-emr-service/       # EMR/EHR
```

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
# Start MongoDB
docker run -d -p 27017:27017 --name mongo mongo:7
```

### Port Already in Use
```bash
# Kill process on port
lsof -ti:4770 | xargs kill -9
```

### Expo Not Starting
```bash
cd risa-care-mobile-app
rm -rf node_modules
npm install
npx expo start --clear
```

---

## 📞 Need Help?

- **Docs:** See README.md
- **Issues:** GitHub Issues
- **Status:** Check service health endpoints
