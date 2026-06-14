# High API Response Time

## Summary
API response times are elevated above acceptable thresholds. The 95th percentile response time is greater than 1 second (warning) or 2 seconds (critical).

## Severity
🟡 **WARNING** (>1s) | 🔴 **CRITICAL** (>2s)

## Symptoms
- Slow page loads for users
- Timeouts in frontend applications
- Increased bounce rate
- User complaints about slow performance

## Dashboard Links
- [API Performance](http://grafana.restopapa.com/d/api-performance)
- [System Overview](http://grafana.restopapa.com/d/system-overview)
- [Database Performance](http://grafana.restopapa.com/d/database-performance)

## Investigation

### 1. Identify Affected Endpoints (2 minutes)
```bash
# Check current response times by endpoint
curl http://localhost:9090/api/v1/query?query='histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))'

# Or use Grafana API Performance dashboard
# Look for endpoints with highest response times
```

### 2. Check System Resources (2 minutes)
```bash
# CPU usage
top -n 1

# Memory usage
free -m

# Load average
uptime

# Disk I/O
iostat -x 1 3

# Network stats
netstat -i
```

### 3. Event Loop Health (1 minute)
```bash
# Check event loop delay via metrics endpoint
curl http://localhost:3000/api/v1/metrics | grep event_loop_delay

# Check for long-running tasks
curl http://localhost:3000/api/v1/metrics | grep long_tasks
```

### 4. Database Performance (2 minutes)
```bash
# Check slow queries
psql -h localhost -U postgres -d restopapa -c "
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;"

# Check active connections
psql -h localhost -U postgres -d restopapa -c "
SELECT count(*), state
FROM pg_stat_activity
GROUP BY state;"

# Check for locks
psql -h localhost -U postgres -d restopapa -c "
SELECT count(*) as lock_count
FROM pg_locks
WHERE NOT granted;"
```

### 5. Cache Performance (1 minute)
```bash
# Check Redis performance
redis-cli info stats | grep -E "instantaneous_ops_per_sec|keyspace_hits|keyspace_misses"

# Check cache hit ratio
curl http://localhost:3000/api/v1/metrics | grep cache_hit_ratio
```

## Resolution

### Scenario 1: High CPU Usage

1. **Identify CPU-intensive processes**
   ```bash
   # Find top processes
   ps aux --sort=-%cpu | head -10

   # Check if API process is consuming high CPU
   ps -p $(pgrep -f restopapa-api) -o pid,ppid,cmd,%mem,%cpu
   ```

2. **Check for infinite loops or blocking operations**
   ```bash
   # Generate performance profile (if enabled)
   curl http://localhost:3000/debug/pprof/profile

   # Check event loop delay
   curl http://localhost:3000/api/v1/metrics/performance
   ```

3. **Temporary mitigation**
   ```bash
   # Scale horizontally if using containers
   docker-compose up --scale api=3

   # Or restart service to clear any stuck processes
   sudo systemctl restart restopapa-api
   ```

### Scenario 2: Database Bottleneck

1. **Identify slow queries**
   ```bash
   # Enable slow query logging
   psql -h localhost -U postgres -d restopapa -c "
   ALTER SYSTEM SET log_min_duration_statement = 1000;
   SELECT pg_reload_conf();"

   # Check for missing indexes
   psql -h localhost -U postgres -d restopapa -c "
   SELECT schemaname, tablename, attname, n_distinct, correlation
   FROM pg_stats
   WHERE schemaname = 'public'
   ORDER BY n_distinct DESC;"
   ```

2. **Optimize database connections**
   ```bash
   # Check connection pool settings
   curl http://localhost:3000/api/v1/metrics | grep db_connections

   # Restart API to reset connection pool
   sudo systemctl restart restopapa-api
   ```

3. **Emergency query optimization**
   ```bash
   # Kill long-running queries (use with caution)
   psql -h localhost -U postgres -d restopapa -c "
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE state = 'active'
   AND query_start < NOW() - INTERVAL '5 minutes'
   AND query NOT LIKE '%pg_stat_activity%';"
   ```

### Scenario 3: Memory Pressure

1. **Check memory usage**
   ```bash
   # Check heap usage
   curl http://localhost:3000/api/v1/metrics/system

   # Check for memory leaks
   ps -p $(pgrep -f restopapa-api) -o pid,ppid,cmd,%mem,rss
   ```

2. **Free up memory**
   ```bash
   # Clear caches (if safe)
   sync && echo 3 > /proc/sys/vm/drop_caches

   # Restart API service
   sudo systemctl restart restopapa-api
   ```

### Scenario 4: External Dependencies

1. **Check external API performance**
   ```bash
   # Test payment gateway
   curl -w "time_total: %{time_total}\n" -o /dev/null -s https://api.stripe.com/v1/charges

   # Test email service
   curl -w "time_total: %{time_total}\n" -o /dev/null -s https://api.sendgrid.com/v3/mail
   ```

2. **Enable circuit breakers**
   ```javascript
   // Add timeout to external API calls
   const response = await fetch(externalAPI, {
     timeout: 5000,
     retry: 3
   });
   ```

### Scenario 5: Cache Issues

1. **Check cache performance**
   ```bash
   # Redis response time
   redis-cli --latency-history -h localhost -p 6379

   # Cache hit ratio
   redis-cli info stats | grep hit_rate
   ```

2. **Restart cache if needed**
   ```bash
   sudo systemctl restart redis
   sudo systemctl status redis
   ```

## Immediate Mitigation

1. **Enable request queuing**
   ```bash
   # Configure nginx rate limiting
   sudo nano /etc/nginx/sites-available/restopapa
   # Add: limit_req zone=api burst=20 nodelay;
   sudo nginx -s reload
   ```

2. **Scale horizontally**
   ```bash
   # If using Docker
   docker-compose up --scale api=2

   # If using Kubernetes
   kubectl scale deployment restopapa-api --replicas=3
   ```

3. **Enable response caching**
   ```javascript
   // Add cache headers for static endpoints
   app.get('/api/v1/restaurants', cache('5 minutes'), handler);
   ```

## Verification

1. **Response times improved**
   ```bash
   # Test critical endpoints
   curl -w "time_total: %{time_total}\n" -o /dev/null -s http://localhost:3000/api/v1/health
   curl -w "time_total: %{time_total}\n" -o /dev/null -s http://localhost:3000/api/v1/restaurants
   ```

2. **Metrics show improvement**
   - 95th percentile response time < 1 second
   - Error rate not increased
   - Throughput maintained or improved

3. **System resources stable**
   - CPU usage < 80%
   - Memory usage stable
   - Event loop delay < 10ms

## Prevention

### Short-term
1. **Add response time monitoring**
   ```javascript
   // Add to API middleware
   app.use((req, res, next) => {
     const start = Date.now();
     res.on('finish', () => {
       const duration = Date.now() - start;
       if (duration > 1000) {
         logger.warn(`Slow request: ${req.method} ${req.path} - ${duration}ms`);
       }
     });
     next();
   });
   ```

2. **Implement request timeouts**
   ```javascript
   app.use(timeout('30s'));
   ```

### Long-term
1. **Database optimization**
   - Add missing indexes
   - Optimize slow queries
   - Implement read replicas
   - Connection pooling

2. **Caching strategy**
   - Implement Redis caching
   - CDN for static assets
   - Application-level caching
   - Database query caching

3. **Code optimization**
   - Profile application performance
   - Optimize algorithms
   - Implement async processing
   - Remove unused dependencies

4. **Infrastructure improvements**
   - Auto-scaling setup
   - Load balancing
   - CDN implementation
   - Database optimization

## Related Runbooks
- [High Memory Usage](./high-memory-usage.md)
- [Slow Database Queries](./slow-db-queries.md)
- [High Event Loop Delay](./high-event-loop-delay.md)
- [API Service Down](./api-service-down.md)

## Performance Targets
- **95th percentile response time**: < 500ms
- **99th percentile response time**: < 1000ms
- **Error rate**: < 1%
- **Throughput**: > 100 requests/second

## Emergency Contacts
- **Backend Team**: @backend-team
- **DevOps Engineer**: @devops-oncall
- **Performance Engineer**: @performance-team

---

**Response Time Target**: 10 minutes to mitigation, 30 minutes to resolution
**Last Updated**: 2024-01-15
**Runbook Owner**: Backend Team