# Security Checklist

## Pre-Production

### Critical
- [ ] JWT_SECRET = 32+ char random string
- [ ] INTERNAL_SERVICE_TOKEN = secure random
- [ ] CORS_ORIGIN = production domains only
- [ ] NODE_ENV = production

### Database
- [ ] MongoDB auth enabled
- [ ] Redis AUTH enabled
- [ ] SSL/TLS for connections

### Webhooks
- [ ] HMAC signature verification
- [ ] IP whitelist

## Monitoring
- [ ] Health checks with DB ping
- [ ] Prometheus metrics
- [ ] Alerting
