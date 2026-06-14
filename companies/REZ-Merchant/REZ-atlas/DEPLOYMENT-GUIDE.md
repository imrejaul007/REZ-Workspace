# REZ Atlas Deployment Guide
**Version:** 1.0.0 | **Date:** June 6, 2026

---

## 📋 PREREQUISITES

### Software Requirements
- Node.js 18+
- MongoDB 6.0+
- npm or yarn
- Redis (optional, for caching)

### API Keys Required
- Google Maps API Key (for Places & Directions)
- Google Places API enabled

---

## 🚀 QUICK START (Development)

### 1. Clone & Navigate
```bash
cd /Users/rejaulkarim/Documents/ReZ\ Full\ App/REZ-Merchant/REZ-atlas
```

### 2. Install Dependencies for All Services
```bash
# Core services
cd REZ-atlas-gateway && npm install && cd ..
cd REZ-atlas-discover && npm install && cd ..
cd REZ-atlas-twin && npm install && cd ..
cd REZ-atlas-score && npm install && cd ..
cd REZ-atlas-territory && npm install && cd ..
cd REZ-atlas-routes && npm install && cd ..
cd REZ-atlas-signals && npm install && cd ..
cd REZ-atlas-copilot && npm install && cd ..
cd REZ-atlas-graph && npm install && cd ..
cd REZ-atlas-maps && npm install && cd ..

# UI services
cd REZ-atlas-dashboard && npm install && cd ..
cd REZ-atlas-field-app && npm install && cd ..
```

### 3. Start MongoDB
```bash
mongod --dbpath /data/db
```

### 4. Configure Environment
Copy `.env.example` files and configure:

**REZ-atlas-gateway/.env**
```env
PORT=5150
NODE_ENV=development
ATLAS_DISCOVER_URL=http://localhost:5151
ATLAS_TWIN_URL=http://localhost:5153
ATLAS_SCORE_URL=http://localhost:5154
ATLAS_SIGNALS_URL=http://localhost:5155
ATLAS_TERRITORY_URL=http://localhost:5170
ATLAS_ROUTES_URL=http://localhost:5171
ATLAS_COPILOT_URL=http://localhost:5172
ATLAS_GRAPH_URL=http://localhost:5173
```

**REZ-atlas-discover/.env**
```env
PORT=5151
MONGODB_URI=mongodb://localhost:27017/rez-atlas-discover
GOOGLE_MAPS_API_KEY=your_api_key
GOOGLE_PLACES_API_KEY=your_api_key
```

**REZ-atlas-twin/.env**
```env
PORT=5153
MONGODB_URI=mongodb://localhost:27017/rez-atlas-twin
```

### 5. Start Services

**Option A: Individual Services**
```bash
# Terminal 1
cd REZ-atlas-gateway && npm run dev

# Terminal 2
cd REZ-atlas-discover && npm run dev

# Terminal 3
cd REZ-atlas-twin && npm run dev

# ... continue for all services
```

**Option B: Use Start Script**
```bash
./START-ATLAS.sh
```

### 6. Verify Services
```bash
curl http://localhost:5150/health
curl http://localhost:5151/health
curl http://localhost:5153/health
curl http://localhost:5154/health
curl http://localhost:5170/health
```

### 7. Access Dashboard
Open browser: http://localhost:5190

---

## 🐳 DOCKER DEPLOYMENT

### docker-compose.yml
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_DATABASE=rez-atlas

  atlas-gateway:
    build: ./REZ-atlas-gateway
    ports:
      - "5150:5150"
    environment:
      - PORT=5150
      - ATLAS_DISCOVER_URL=http://atlas-discover:5151
      - ATLAS_TWIN_URL=http://atlas-twin:5153
      - ATLAS_SCORE_URL=http://atlas-score:5154
      - ATLAS_SIGNALS_URL=http://atlas-signals:5155
      - ATLAS_TERRITORY_URL=http://atlas-territory:5170
      - ATLAS_ROUTES_URL=http://atlas-routes:5171
      - ATLAS_COPILOT_URL=http://atlas-copilot:5172
      - ATLAS_GRAPH_URL=http://atlas-graph:5173
    depends_on:
      - atlas-discover
      - atlas-twin
      - atlas-score
      - atlas-signals
      - atlas-territory
      - atlas-routes
      - atlas-copilot
      - atlas-graph

  atlas-discover:
    build: ./REZ-atlas-discover
    ports:
      - "5151:5151"
    environment:
      - PORT=5151
      - MONGODB_URI=mongodb://mongodb:27017/rez-atlas-discover
    depends_on:
      - mongodb

  atlas-maps:
    build: ./REZ-atlas-maps
    ports:
      - "5152:5152"

  atlas-twin:
    build: ./REZ-atlas-twin
    ports:
      - "5153:5153"
    environment:
      - PORT=5153
      - MONGODB_URI=mongodb://mongodb:27017/rez-atlas-twin
    depends_on:
      - mongodb

  atlas-score:
    build: ./REZ-atlas-score
    ports:
      - "5154:5154"

  atlas-signals:
    build: ./REZ-atlas-signals
    ports:
      - "5155:5155"

  atlas-territory:
    build: ./REZ-atlas-territory
    ports:
      - "5170:5170"

  atlas-routes:
    build: ./REZ-atlas-routes
    ports:
      - "5171:5171"

  atlas-copilot:
    build: ./REZ-atlas-copilot
    ports:
      - "5172:5172"

  atlas-graph:
    build: ./REZ-atlas-graph
    ports:
      - "5173:5173"

  atlas-dashboard:
    build: ./REZ-atlas-dashboard
    ports:
      - "5190:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://atlas-gateway:5150

volumes:
  mongodb_data:
```

### Deploy
```bash
docker-compose up -d
docker-compose ps
```

---

## ☁️ PRODUCTION DEPLOYMENT

### AWS / EC2 Deployment

#### 1. Launch EC2 Instance
- Instance type: t3.medium (minimum)
- OS: Ubuntu 22.04
- Security group: Allow ports 5150-5191, 3000

#### 2. Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
sudo apt install -y mongodb-org

# Install PM2 for process management
sudo npm install -g pm2
```

#### 3. Clone & Setup
```bash
git clone <repo> /opt/rez-atlas
cd /opt/rez-atlas/REZ-atlas

# Install dependencies
npm install --production
```

#### 4. Configure Environment
```bash
# Create .env file
sudo nano .env.production
```

```env
NODE_ENV=production
PORT=5150
MONGODB_URI=mongodb://localhost:27017/rez-atlas
GOOGLE_MAPS_API_KEY=your_production_api_key
```

#### 5. Start with PM2
```bash
# Create ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'atlas-gateway',
      script: 'dist/index.js',
      cwd: './REZ-atlas-gateway',
      instances: 1,
      env_production: { NODE_ENV: 'production' }
    },
    // ... add all services
  ]
};
EOF

# Start services
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

#### 6. Setup Nginx (Reverse Proxy)
```nginx
server {
    listen 80;
    server_name atlas-api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5150;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name atlas.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5190;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔒 SECURITY CONFIGURATION

### CORS Settings
```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://atlas.yourdomain.com',
  credentials: true
}));
```

### Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests'
});

app.use('/api/', limiter);
```

### Helmet Security Headers
```typescript
import helmet from 'helmet';
app.use(helmet({
  contentSecurityPolicy: true,
  hsts: true
}));
```

---

## 📊 MONITORING

### Health Check Script
```bash
#!/bin/bash
# health-check.sh

SERVICES=("5150:Gateway" "5151:Discover" "5153:Twin" "5154:Score" "5170:Territory")

for service in "${SERVICES[@]}"; do
  IFS=':' read -r port name <<< "$service"
  if curl -s http://localhost:$port/health > /dev/null; then
    echo "✅ $name ($port) - UP"
  else
    echo "❌ $name ($port) - DOWN"
  fi
done
```

### Log Aggregation
Configure services to output JSON logs for ELK/Graylog:
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

---

## 🧪 TESTING

### Run All Services Tests
```bash
# From each service directory
cd REZ-atlas-gateway && npm test && cd ..
cd REZ-atlas-discover && npm test && cd ..
# ... etc
```

### API Integration Test
```bash
# Test gateway
curl -X POST http://localhost:5150/api/score/leads \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Restaurant","email":"test@rest.com","category":"restaurant"}'

# Test discovery
curl "http://localhost:5151/api/search?q=restaurant&lat=19&lng=72"

# Test territory
curl http://localhost:5170/api/territories
```

---

## 🔧 TROUBLESHOOTING

### MongoDB Connection Issues
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check connection
mongosh --eval "db.adminCommand('ping')"
```

### Port Conflicts
```bash
# Find process using port
lsof -i :5150
# or
netstat -tlnp | grep 5150
```

### Memory Issues
```bash
# Check Node.js memory
node --max-old-space-size=2048 dist/index.js
```

---

## 📞 SUPPORT

For issues, contact:
- Email: atlas-support@rez.money
- Slack: #rez-atlas

---

**Last Updated:** June 6, 2026