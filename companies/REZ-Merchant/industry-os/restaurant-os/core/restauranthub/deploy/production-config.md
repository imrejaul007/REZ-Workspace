# Production Deployment Configuration

## Pre-Deployment Security Checklist

### Environment Variables
- [ ] Update all `CHANGE_THIS_*` values in `.env.production`
- [ ] Generate cryptographically strong secrets (256-bit minimum)
- [ ] Verify database URLs use SSL (`sslmode=require`)
- [ ] Set up production Redis with authentication
- [ ] Configure production SMTP credentials
- [ ] Update AWS S3 credentials and bucket names
- [ ] Set production payment gateway credentials
- [ ] Configure allowed CORS origins for production domains

### Security Configuration
- [ ] Enable CSRF protection (`ENABLE_CSRF=true`)
- [ ] Configure rate limiting for production traffic
- [ ] Set up SSL certificates
- [ ] Configure secure session settings
- [ ] Verify JWT token expiration times are appropriate
- [ ] Set up proper log rotation and monitoring
- [ ] Configure Sentry for error tracking
- [ ] Set up health check endpoints

### Database Security
- [ ] Use connection pooling with appropriate limits
- [ ] Enable SSL/TLS for database connections
- [ ] Set up database backups and point-in-time recovery
- [ ] Configure database user with minimal required permissions
- [ ] Enable query logging for audit purposes

### Infrastructure Security
- [ ] Configure firewall rules (only necessary ports open)
- [ ] Set up load balancers with proper SSL termination
- [ ] Configure CDN for static assets
- [ ] Set up monitoring and alerting
- [ ] Configure automatic security updates
- [ ] Set up intrusion detection systems

## Deployment Commands

### 1. Environment Setup
```bash
# Copy production environment file
cp .env.production .env

# Install production dependencies
npm ci --production

# Build the application
npm run build

# Run database migrations
npx prisma migrate deploy
```

### 2. Security Verification
```bash
# Test CORS configuration
curl -H "Origin: https://malicious-site.com" http://localhost:3000/api/v1/health

# Test rate limiting
for i in {1..100}; do curl http://localhost:3000/api/v1/auth/signin; done

# Test CSRF protection
curl -X POST http://localhost:3000/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### 3. Production Startup
```bash
# Start with PM2 for production
pm2 start ecosystem.config.js --env production

# Or start with Docker
docker-compose -f docker-compose.prod.yml up -d
```

## Monitoring Configuration

### Health Checks
- Endpoint: `/api/v1/health`
- Database connectivity check
- Redis connectivity check
- JWT validation check
- File system permissions check

### Logging
- Application logs: `/var/log/restopapa/app.log`
- Error logs: `/var/log/restopapa/error.log`
- Access logs: `/var/log/restopapa/access.log`
- Audit logs: `/var/log/restopapa/audit.log`

### Metrics
- Response time monitoring
- Error rate tracking
- Database query performance
- Memory and CPU usage
- Rate limiting effectiveness

## Security Headers Verification

Expected security headers in production:
- `Strict-Transport-Security`
- `Content-Security-Policy`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`

## Backup Strategy

### Database Backups
- Full backup daily at 2 AM UTC
- Point-in-time recovery enabled
- Backup retention: 30 days
- Test restore procedure monthly

### File Backups
- S3 bucket versioning enabled
- Cross-region replication configured
- Backup verification automated

## Incident Response Plan

### Security Incident Response
1. Immediate containment
2. Impact assessment
3. Evidence collection
4. System restoration
5. Post-incident review

### Contact Information
- Security team: security@restopapa.com
- DevOps team: devops@restopapa.com
- Emergency escalation: +1-xxx-xxx-xxxx

## Performance Optimization

### Database Optimization
- Index optimization for frequently queried fields
- Query performance monitoring
- Connection pooling configuration
- Read replica setup for reporting queries

### Caching Strategy
- Redis caching for frequently accessed data
- CDN caching for static assets
- Application-level caching for computed results
- Cache invalidation strategies

### Load Balancing
- Horizontal scaling configuration
- Session affinity settings
- Health check configuration
- Failover procedures