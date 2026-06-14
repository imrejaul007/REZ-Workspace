# Troubleshooting Guide

## Common Issues

### Service Won't Start

**Symptom:** Service fails to start

**Solutions:**
```bash
# Check logs
docker-compose logs <service-name>

# Check port conflicts
lsof -i :3002

# Restart service
docker-compose restart <service-name>
```

### Database Connection Issues

**Symptom:** Cannot connect to MongoDB/Redis

**Solutions:**
```bash
# Check if database is running
docker-compose ps

# Restart database
docker-compose restart mongodb redis

# Check connection string
cat .env | grep DATABASE_URL
```

### Authentication Errors

**Symptom:** 401 Unauthorized errors

**Solutions:**
```bash
# Check token expiration
# Token may have expired

# Verify RABTUL auth service
curl http://localhost:4002/health

# Check token in header
curl -H "Authorization: Bearer <token>" http://localhost:3002/api/health
```

### Memory Issues

**Symptom:** Service crashes with OOM

**Solutions:**
```bash
# Check memory usage
docker stats

# Increase memory limit in docker-compose.yml
# Add: mem_limit: 512m

# Check for memory leaks in logs
docker-compose logs --tail=100 | grep -i memory
```

### API Timeout

**Symptom:** Requests timeout

**Solutions:**
```bash
# Check if service is responding
curl -w "%{time_total}" http://localhost:3002/api/restaurants/search

# Check Redis cache
docker-compose exec redis redis-cli ping

# Increase timeout in service config
```

---

## Debug Commands

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f go4food-api

# Check network connectivity
docker-compose exec go4food-api ping redis

# Check environment variables
docker-compose exec go4food-api env | grep -E "NODE_ENV|PORT"
```

---

## Emergency Contacts

| Issue | Contact |
|-------|---------|
| Auth issues | auth@rez.consumer |
| Payment issues | payment@rez.consumer |
| General support | support@rez.consumer |
