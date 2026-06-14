# 🚀 RestaurantHub Production Deployment Guide

This guide covers deploying your RestaurantHub SaaS platform to production with enterprise-grade configuration, security, and monitoring.

## 📋 Prerequisites

### Server Requirements
- **OS**: Ubuntu 20.04+ / CentOS 8+ / RHEL 8+
- **CPU**: 4+ cores (8+ recommended)
- **RAM**: 8GB minimum (16GB+ recommended)
- **Storage**: 100GB+ SSD
- **Network**: Public IP with ports 80, 443 accessible

### Software Requirements
- Docker 20.10+
- Docker Compose 2.0+
- Git
- SSL Certificate (Let's Encrypt or commercial)

## 🔧 Production Setup

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create application directory
sudo mkdir -p /opt/restauranthub
sudo chown $USER:$USER /opt/restauranthub
```

### 2. Clone and Configure

```bash
# Clone repository
cd /opt/restauranthub
git clone https://github.com/imrejaul007/restaurantapp.git .

# Configure environment
cp .env.production .env
nano .env  # Update with your production values
```

### 3. SSL Certificate Setup

**Option A: Let's Encrypt (Recommended)**
```bash
# Install Certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
sudo chown $USER:$USER nginx/ssl/*
```

**Option B: Commercial Certificate**
```bash
# Copy your certificates to nginx/ssl/
cp your-cert.crt nginx/ssl/cert.pem
cp your-private-key.key nginx/ssl/key.pem
```

### 4. Database Setup

```bash
# Generate secure passwords
POSTGRES_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)

# Update .env file with generated passwords
sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$POSTGRES_PASSWORD/" .env
sed -i "s/REDIS_PASSWORD=.*/REDIS_PASSWORD=$REDIS_PASSWORD/" .env
```

### 5. Deploy Application

```bash
# Make deployment script executable
chmod +x scripts/deploy-prod.sh

# Run deployment
./scripts/deploy-prod.sh
```

## 🔒 Security Configuration

### Environment Variables
Update `.env` with production values:

```bash
# Required Updates
NODE_ENV=production
APP_URL=https://your-domain.com
DATABASE_URL=postgresql://username:password@postgres:5432/restauranthub_prod

# Generate new secrets
JWT_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64)
SESSION_SECRET=$(openssl rand -base64 64)
```

### Firewall Setup

```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### SSL Security

```bash
# Test SSL configuration
curl -I https://your-domain.com

# Verify SSL rating (should be A+)
# Visit: https://www.ssllabs.com/ssltest/
```

## 📊 Monitoring & Maintenance

### Health Checks

```bash
# Check application status
./scripts/deploy-prod.sh status

# View logs
./scripts/deploy-prod.sh logs

# Health check
curl -f https://your-domain.com/health
```

### Database Backups

```bash
# Manual backup
./scripts/deploy-prod.sh backup

# Automated daily backups (add to crontab)
0 2 * * * /opt/restauranthub/scripts/deploy-prod.sh backup
```

### Monitoring Dashboard

Access Grafana at: `http://your-domain.com:3003`
- Username: `admin`
- Password: `admin123` (change immediately)

## 🚀 Performance Optimization

### 1. Database Optimization

```sql
-- Production PostgreSQL settings
-- Add to postgresql.conf

shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
max_connections = 200
```

### 2. Redis Configuration

```bash
# Redis production settings
echo "maxmemory 512mb" >> redis/redis.conf
echo "maxmemory-policy allkeys-lru" >> redis/redis.conf
```

### 3. Nginx Optimization

```nginx
# Already configured in nginx/nginx.prod.conf
# - Gzip compression
# - Static file caching
# - Rate limiting
# - Security headers
```

## 🔄 CI/CD Pipeline

### GitHub Actions Setup

1. **Add Repository Secrets:**
   - `PROD_HOST`: Your production server IP
   - `PROD_USER`: SSH username
   - `PROD_SSH_KEY`: Private SSH key
   - `POSTGRES_PASSWORD`: Database password
   - `JWT_SECRET`: JWT secret key

2. **Automatic Deployment:**
   - Push to `main` branch triggers deployment
   - Includes testing, building, and health checks
   - Zero-downtime deployment with rollback capability

## 📋 Post-Deployment Checklist

- [ ] SSL certificate valid and A+ rating
- [ ] All health checks passing
- [ ] Database connected and migrations applied
- [ ] Redis cache working
- [ ] File uploads working
- [ ] Email notifications working
- [ ] Payment integration tested
- [ ] Monitoring dashboards accessible
- [ ] Backup system working
- [ ] Log rotation configured
- [ ] Firewall properly configured
- [ ] DNS records pointing to server
- [ ] CDN configured (if using)

## 🆘 Troubleshooting

### Common Issues

**1. Database Connection Issues**
```bash
# Check PostgreSQL status
docker logs restauranthub-postgres-prod

# Test connection
docker exec -it restauranthub-postgres-prod psql -U restauranthub_user -d restauranthub_prod
```

**2. SSL Certificate Issues**
```bash
# Check certificate expiry
openssl x509 -in nginx/ssl/cert.pem -text -noout | grep "Not After"

# Renew Let's Encrypt certificate
sudo certbot renew
```

**3. High CPU/Memory Usage**
```bash
# Check container resources
docker stats

# Scale services if needed
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

**4. Application Not Starting**
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

### Emergency Rollback

```bash
# Rollback to previous version
./scripts/deploy-prod.sh rollback
```

## 📞 Support & Maintenance

### Regular Maintenance Tasks

**Weekly:**
- Check SSL certificate expiry
- Review error logs
- Monitor disk usage
- Update system packages

**Monthly:**
- Update Docker images
- Review security reports
- Optimize database
- Clean old backups

### Performance Monitoring

- **Response Time**: < 200ms average
- **Uptime**: > 99.9%
- **Error Rate**: < 0.1%
- **Database Queries**: < 100ms average

## 🎯 Production Scaling

When your application grows, consider:

1. **Horizontal Scaling**
   - Add more backend instances
   - Load balancer configuration
   - Database read replicas

2. **Vertical Scaling**
   - Increase server resources
   - Optimize database configuration
   - Implement caching strategies

3. **CDN Integration**
   - CloudFlare or AWS CloudFront
   - Static asset optimization
   - Image optimization

## 🔐 Security Hardening

1. **Regular Updates**
   ```bash
   # Monthly security updates
   sudo apt update && sudo apt upgrade -y
   docker-compose -f docker-compose.prod.yml pull
   ```

2. **Security Scanning**
   ```bash
   # Scan for vulnerabilities
   docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
     aquasec/trivy image restauranthub-backend:latest
   ```

3. **Access Control**
   - Use SSH keys only
   - Disable password authentication
   - Implement fail2ban
   - Regular security audits

---

## 🎉 Congratulations!

Your RestaurantHub SaaS platform is now running in production with:

✅ **Enterprise Security** - SSL, firewalls, rate limiting
✅ **High Availability** - Health checks, auto-restart
✅ **Performance Monitoring** - Prometheus + Grafana
✅ **Automated Backups** - Database and file backups  
✅ **CI/CD Pipeline** - Automated testing and deployment
✅ **Scalable Architecture** - Docker containers with load balancing
✅ **Production Logging** - Centralized log management

Your restaurant industry platform is ready to serve thousands of users! 🚀

For support, check the logs or contact your development team.