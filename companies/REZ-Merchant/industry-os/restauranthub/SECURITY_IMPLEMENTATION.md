# RestoPapa Security Implementation

## Overview

This document outlines the comprehensive security hardening implementation for the RestoPapa application. The implementation follows enterprise-level security standards and best practices to protect against common vulnerabilities and attacks.

## Security Features Implemented

### 1. API Security Configuration
- **CORS (Cross-Origin Resource Sharing)**: Strict origin validation with environment-specific policies
- **Helmet Security Headers**: Comprehensive security headers including HSTS, CSP, X-Frame-Options
- **Rate Limiting**: Multi-tier rate limiting with progressive penalties
- **Request Size Limits**: Protection against DoS attacks via large payloads
- **Compression**: Smart compression with security-aware filtering

### 2. Input Validation and Sanitization
- **XSS Protection**: Multi-layer XSS prevention using `xss` and `sanitize-html` libraries
- **SQL Injection Prevention**: Input sanitization and parameterized queries
- **Custom Validators**: Strong password validation, secure string validation, safe filename validation
- **MongoDB Injection Protection**: Using `express-mongo-sanitize`

### 3. Authentication and Authorization Security

#### JWT Token Management
- **Token Blacklisting**: JTI-based token revocation system
- **Secure Token Generation**: Cryptographically strong JTIs with proper expiration
- **Token Validation**: Enhanced JWT validation with comprehensive error handling
- **Session Management**: Secure session tracking with device fingerprinting

#### API Key Authentication
- **Hashed Storage**: API keys stored as SHA-256 hashes
- **Usage Tracking**: Monitor API key usage patterns
- **Expiration Management**: Configurable API key expiration
- **Permission-based Access**: Granular permissions per API key

### 4. Brute Force Protection
- **IP-based Rate Limiting**: Progressive rate limiting based on IP address
- **Endpoint-specific Limits**: Different limits for authentication endpoints
- **Temporary IP Blocking**: Automatic IP blocking for excessive attempts
- **Attack Pattern Detection**: Monitoring for suspicious request patterns

### 5. Session Management
- **Secure Session Storage**: Encrypted session tokens
- **Device Tracking**: Monitor sessions across devices
- **Concurrent Session Limits**: Configurable session limits per user
- **Suspicious Activity Detection**: Alert on unusual login patterns
- **Automatic Cleanup**: Regular cleanup of expired sessions

### 6. Security Headers and HTTPS
- **Content Security Policy (CSP)**: Strict CSP to prevent XSS attacks
- **HTTP Strict Transport Security (HSTS)**: Force HTTPS in production
- **X-Frame-Options**: Prevent clickjacking attacks
- **X-Content-Type-Options**: Prevent MIME-type sniffing
- **Referrer Policy**: Control referrer information leakage

### 7. Request/Response Logging
- **Security Event Logging**: Comprehensive logging of security events
- **Suspicious Activity Monitoring**: Real-time monitoring for threats
- **Audit Trail**: Complete audit trail for compliance
- **Performance Monitoring**: Track slow requests and potential DoS attempts

### 8. Error Handling
- **Information Disclosure Prevention**: Generic error messages in production
- **Database Error Sanitization**: Prevent exposure of database schema
- **Stack Trace Protection**: Hide stack traces in production
- **Structured Error Responses**: Consistent error response format

## File Structure

```
apps/api/src/
├── common/
│   ├── decorators/
│   │   └── validators.ts              # Custom security validators
│   ├── filters/
│   │   └── global-exception.filter.ts # Security-aware error handling
│   ├── guards/
│   │   ├── api-key.guard.ts          # API key authentication
│   │   ├── brute-force.guard.ts      # Brute force protection
│   │   └── jwt-auth.guard.ts         # Enhanced JWT guard
│   ├── interceptors/
│   │   └── security-logging.interceptor.ts # Security event logging
│   ├── middleware/
│   │   └── security.middleware.ts     # Core security middleware
│   ├── modules/
│   │   └── security.module.ts        # Security module configuration
│   ├── services/
│   │   └── session.service.ts        # Session management
│   └── tasks/
│       └── security-cleanup.task.ts  # Automated security cleanup
├── config/
│   └── https.config.ts               # HTTPS configuration
├── modules/auth/
│   ├── guards/
│   │   └── jwt-auth.guard.ts         # JWT authentication guard
│   └── services/
│       └── token-blacklist.service.ts # Token blacklisting
└── test/security/
    └── security.spec.ts              # Security integration tests
```

## Database Schema Updates

### Security-Related Models

```prisma
// JWT Token Blacklisting
model BlacklistedToken {
  id        String   @id @default(cuid())
  jti       String   @unique // JWT ID (hashed)
  userId    String
  reason    String   @default("logout")
  expiresAt DateTime
  createdAt DateTime @default(now())
}

// API Key Management
model ApiKey {
  id          String    @id @default(cuid())
  name        String
  keyHash     String    @unique
  userId      String
  permissions String[]
  isActive    Boolean   @default(true)
  lastUsedAt  DateTime?
  usageCount  Int       @default(0)
  expiresAt   DateTime?
}

// Brute Force Protection
model FailedAttempt {
  id          String   @id @default(cuid())
  ipAddress   String
  endpoint    String
  email       String?
  attemptedAt DateTime @default(now())
}

model BlockedIp {
  id           String    @id @default(cuid())
  ipAddress    String    @unique
  reason       String
  blockedAt    DateTime
  blockedUntil DateTime
  blockCount   Int       @default(1)
}

// Enhanced Session Management
model Session {
  id             String    @id @default(cuid())
  userId         String
  token          String    @unique
  ipAddress      String?
  userAgent      String?
  deviceInfo     String?
  expiresAt      DateTime
  lastAccessedAt DateTime?
  createdAt      DateTime  @default(now())
}
```

## Environment Variables

### Required Security Environment Variables

```env
# JWT Configuration
JWT_SECRET=<strong-secret-minimum-32-chars>
JWT_REFRESH_SECRET=<strong-refresh-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Session Management
SESSION_SECRET=<strong-session-secret>
SESSION_DURATION_MS=86400000  # 24 hours

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000   # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX_REQUESTS=5

# Brute Force Protection
BRUTE_FORCE_WINDOW_MS=900000
BRUTE_FORCE_BLOCK_DURATION_MS=3600000  # 1 hour

# CORS Configuration
ALLOWED_ORIGINS=https://restopapa.com,https://www.restopapa.com
FRONTEND_URL=https://restopapa.com

# Security Features
ENABLE_CSRF=true  # Enable in production
ALLOW_NO_ORIGIN_REQUESTS=false
HTTPS_ENABLED=true
HTTPS_KEY_PATH=/etc/ssl/private/server.key
HTTPS_CERT_PATH=/etc/ssl/certs/server.crt

# Request Limits
MAX_REQUEST_SIZE=10485760  # 10MB

# Logging
LOG_LEVEL=info  # debug for development
```

## Security Testing

### Automated Tests
- XSS injection prevention tests
- SQL injection prevention tests
- Rate limiting verification
- CORS policy enforcement
- Authentication bypass attempts
- API key validation tests

### Test Coverage
- Input sanitization validation
- Error handling security
- Session management security
- JWT token security
- Brute force protection

## Security Monitoring and Alerts

### Real-time Monitoring
- **Failed Authentication Attempts**: Monitor and alert on brute force attacks
- **Suspicious IP Activity**: Track IPs with unusual patterns
- **Rate Limit Violations**: Monitor rate limit breaches
- **Token Blacklist Events**: Track token revocation events
- **API Key Abuse**: Monitor API key usage patterns

### Security Metrics
- Authentication success/failure rates
- Rate limiting effectiveness
- Session security metrics
- Token usage patterns
- Error rate monitoring

## Production Deployment Security

### HTTPS Configuration
- TLS 1.2+ enforcement
- Strong cipher suites
- HSTS headers with preload
- Certificate validation
- Secure renegotiation

### Environment Hardening
- Secure environment variable management
- Database connection security
- Network security configuration
- Container security (if applicable)
- Load balancer security configuration

## Security Maintenance

### Automated Cleanup Tasks
- **Hourly**: Expired token cleanup
- **Every 30 minutes**: Expired session cleanup
- **Every 6 hours**: Brute force record cleanup
- **Daily**: Old audit log cleanup
- **Weekly**: Security report generation

### Regular Security Audits
- Dependency vulnerability scanning
- Code security analysis
- Penetration testing recommendations
- Security configuration reviews

## Compliance and Standards

### Security Standards Compliance
- OWASP Top 10 protection
- GDPR data protection requirements
- Industry-standard authentication practices
- Secure coding guidelines
- API security best practices

### Data Protection
- Personal data encryption
- Secure data transmission
- Data retention policies
- Right to deletion (GDPR)
- Data export capabilities

## Troubleshooting

### Common Security Issues

1. **Rate Limiting False Positives**
   - Check IP whitelisting configuration
   - Adjust rate limits for legitimate traffic
   - Monitor rate limiting logs

2. **CORS Issues**
   - Verify allowed origins configuration
   - Check for wildcard usage in production
   - Validate origin header handling

3. **JWT Token Issues**
   - Verify token secret configuration
   - Check token expiration settings
   - Monitor token blacklist effectiveness

4. **Session Management Problems**
   - Check session duration settings
   - Verify session cleanup tasks
   - Monitor concurrent session limits

### Security Logs Analysis
- Use structured logging for security events
- Implement log aggregation for analysis
- Set up alerts for critical security events
- Regular review of security logs

## Performance Considerations

### Security vs Performance
- Optimized input validation
- Efficient rate limiting algorithms
- Smart compression strategies
- Minimal security overhead
- Caching for security decisions

### Monitoring and Optimization
- Response time monitoring
- Security middleware performance
- Database query optimization
- Memory usage tracking
- CPU utilization monitoring

## Future Enhancements

### Planned Security Improvements
- Advanced threat detection
- Machine learning-based anomaly detection
- Enhanced API rate limiting
- Multi-factor authentication
- Advanced session security

### Security Roadmap
- Q1: Advanced threat detection implementation
- Q2: ML-based security monitoring
- Q3: Enhanced audit and compliance features
- Q4: Security automation improvements

---

**Note**: This security implementation is designed to provide enterprise-level protection while maintaining application performance and usability. Regular security audits and updates are recommended to maintain the highest security standards.