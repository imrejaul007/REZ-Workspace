# Authentication & Security Guide

This guide covers authentication, authorization, and security features in the RestoPapa API.

## Table of Contents

1. [Authentication Overview](#authentication-overview)
2. [JWT Token System](#jwt-token-system)
3. [Role-Based Access Control](#role-based-access-control)
4. [Security Features](#security-features)
5. [Implementation Examples](#implementation-examples)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Authentication Overview

RestoPapa uses a JWT-based authentication system with role-based access control (RBAC). The system supports four main user roles with specific permissions and verification requirements.

### Authentication Flow

1. **Registration**: User creates account with role-specific information
2. **Email Verification**: User verifies email address (required for sensitive operations)
3. **Login**: User authenticates and receives JWT tokens
4. **Token Usage**: Access token used for API requests
5. **Token Refresh**: Refresh token used to get new access tokens
6. **Logout**: Tokens invalidated

## JWT Token System

### Token Types

#### Access Token
- **Purpose**: Authenticate API requests
- **Lifetime**: 1 hour (configurable)
- **Usage**: Include in Authorization header
- **Format**: `Authorization: Bearer <access_token>`

#### Refresh Token
- **Purpose**: Obtain new access tokens
- **Lifetime**: 7 days (configurable)
- **Usage**: Send to refresh endpoint
- **Security**: Stored securely, rotated on use

### Token Structure

Access tokens contain user information and permissions:

```json
{
  "sub": "cm2abcd1234567890",
  "email": "user@example.com",
  "role": "RESTAURANT",
  "isVerified": true,
  "iat": 1640995200,
  "exp": 1640998800
}
```

### Token Endpoints

#### Get Tokens (Login)
```http
POST /auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "cm2abcd1234567890",
    "email": "user@example.com",
    "role": "RESTAURANT",
    "isVerified": true
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

#### Refresh Tokens
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Logout
```http
POST /auth/logout
Authorization: Bearer <access_token>

# Logout from all devices
POST /auth/logout?all=true
```

## Role-Based Access Control

### User Roles

#### ADMIN
**Permissions:**
- Full system access
- User management
- System configuration
- Analytics access
- Cross-restaurant operations

**Endpoints Access:**
- All endpoints
- Can create jobs for any restaurant
- Can view all analytics
- User management endpoints

#### RESTAURANT
**Permissions:**
- Own restaurant management
- Employee management
- Job posting and hiring
- Restaurant analytics
- Order management

**Endpoints Access:**
- Restaurant profile management
- Job creation/management
- Employee management
- Restaurant-specific analytics
- Order processing

#### EMPLOYEE
**Permissions:**
- Job applications (requires verification)
- Community participation
- Profile management
- View job recommendations

**Endpoints Access:**
- Job search and application
- Community features
- Profile management
- Personal analytics

**Verification Requirements:**
- Email verification required for job applications
- Aadhaar verification required for sensitive operations

#### VENDOR
**Permissions:**
- Vendor profile management
- Product management
- Order fulfillment
- Vendor analytics

**Endpoints Access:**
- Vendor profile management
- Product catalog management
- Order management
- Financial management

### Permission Verification

The system uses decorators to enforce permissions:

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.RESTAURANT, UserRole.ADMIN)
async createJob(@Body() createJobDto: CreateJobDto) {
  // Only restaurant owners and admins can create jobs
}
```

### Verification Guards

Additional verification requirements for sensitive operations:

```typescript
@UseGuards(VerificationGuard)
@RequireVerification(VerificationPresets.JOB_APPLICATION)
async applyForJob(@Param('id') jobId: string) {
  // Requires email verification and profile completion
}
```

## Security Features

### Rate Limiting

#### General Endpoints
```http
# Headers in response
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

#### Authentication Endpoints
- **Development**: 20 attempts per 15 minutes
- **Production**: 5 attempts per 15 minutes

#### Sensitive Operations
- Password reset: 3 attempts per hour
- Account operations: Progressive delays

### Brute Force Protection

The system implements progressive delays for failed login attempts:

1. **1st failure**: No delay
2. **2nd failure**: 1 second delay
3. **3rd failure**: 2 second delay
4. **4th failure**: 4 second delay
5. **5th+ failure**: Account temporarily locked

### Password Security

#### Requirements
- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

#### Password Reset Flow
1. User requests password reset
2. Secure token sent to email
3. Token valid for 1 hour
4. New password must meet requirements

### CORS Policy

#### Development
```javascript
// Allowed origins
[
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002'
]
```

#### Production
```javascript
// Strict whitelist
[
  'https://restopapa.com',
  'https://www.restopapa.com',
  'https://app.restopapa.com'
]
```

### HTTPS Enforcement

- All production traffic requires HTTPS
- HTTP requests automatically redirected
- Secure cookie settings in production

### Input Validation

- All inputs validated using class-validator
- SQL injection protection via Prisma ORM
- XSS protection through sanitization

## Implementation Examples

### Client-Side Authentication (JavaScript)

```javascript
class RestoPapaAuth {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  async login(email, password) {
    try {
      const response = await fetch(`${this.baseUrl}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      this.setTokens(data.tokens.accessToken, data.tokens.refreshToken);
      return data.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async refreshAccessToken() {
    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });

      if (!response.ok) {
        this.logout();
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      this.setTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  async apiRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    let response = await fetch(url, {
      ...options,
      headers
    });

    // Handle token expiration
    if (response.status === 401 && this.refreshToken) {
      try {
        await this.refreshAccessToken();
        headers.Authorization = `Bearer ${this.accessToken}`;
        response = await fetch(url, {
          ...options,
          headers
        });
      } catch (error) {
        this.logout();
        throw error;
      }
    }

    return response;
  }

  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  logout() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}

// Usage
const auth = new RestoPapaAuth('https://api.restopapa.com/api/v1');

// Login
const user = await auth.login('restaurant@example.com', 'password');

// Make authenticated requests
const response = await auth.apiRequest('/jobs/my-jobs');
const jobs = await response.json();
```

### Server-Side Integration (Node.js)

```javascript
const axios = require('axios');

class RestoPapaAPI {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.accessToken = null;
  }

  async authenticate(email, password) {
    try {
      const response = await axios.post(`${this.baseUrl}/auth/signin`, {
        email,
        password
      });

      this.accessToken = response.data.tokens.accessToken;
      return response.data.user;
    } catch (error) {
      throw new Error(`Authentication failed: ${error.response?.data?.message}`);
    }
  }

  async createJob(jobData) {
    try {
      const response = await axios.post(`${this.baseUrl}/jobs`, jobData, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'X-API-Key': this.apiKey
        }
      });

      return response.data;
    } catch (error) {
      throw new Error(`Job creation failed: ${error.response?.data?.message}`);
    }
  }
}
```

### Mobile App Integration (React Native)

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
  constructor() {
    this.baseUrl = 'https://api.restopapa.com/api/v1';
  }

  async login(email, password) {
    try {
      const response = await fetch(`${this.baseUrl}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem('accessToken', data.tokens.accessToken);
        await AsyncStorage.setItem('refreshToken', data.tokens.refreshToken);
        return data.user;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      throw error;
    }
  }

  async getStoredToken() {
    return await AsyncStorage.getItem('accessToken');
  }

  async logout() {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
  }
}
```

## Best Practices

### Token Management

1. **Secure Storage**
   - Use secure storage mechanisms (Keychain on iOS, Keystore on Android)
   - Never store tokens in plain text
   - Clear tokens on app uninstall

2. **Token Rotation**
   - Always use refresh tokens to get new access tokens
   - Implement automatic token refresh
   - Handle token expiration gracefully

3. **Logout Handling**
   - Always call logout endpoint to invalidate tokens
   - Clear all stored tokens
   - Redirect to login screen

### API Security

1. **HTTPS Only**
   - Never send credentials over HTTP
   - Validate SSL certificates
   - Use certificate pinning for mobile apps

2. **Rate Limiting**
   - Implement client-side rate limiting
   - Handle 429 responses gracefully
   - Use exponential backoff for retries

3. **Error Handling**
   - Never expose sensitive information in errors
   - Log security events appropriately
   - Implement proper error recovery

### Password Security

1. **Client-Side**
   - Never store passwords locally
   - Use secure input fields
   - Implement password strength indicators

2. **Server-Side**
   - Always hash passwords before storage
   - Use strong hashing algorithms (bcrypt)
   - Implement password history

## Troubleshooting

### Common Issues

#### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Invalid token",
  "error": "Unauthorized"
}
```

**Solutions:**
- Check token format and validity
- Ensure token is not expired
- Verify Authorization header format
- Try refreshing the token

#### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

**Solutions:**
- Verify user role and permissions
- Check if verification is required
- Ensure proper endpoint access rights

#### 429 Too Many Requests
```json
{
  "statusCode": 429,
  "message": "Too many requests from this IP",
  "error": "TooManyRequests",
  "retryAfter": 900
}
```

**Solutions:**
- Implement client-side rate limiting
- Use exponential backoff
- Check rate limit headers
- Wait for the specified retry period

#### Token Refresh Failed
**Common Causes:**
- Refresh token expired
- Refresh token invalidated
- Server-side token blacklisting

**Solutions:**
- Redirect to login page
- Clear stored tokens
- Request user to re-authenticate

### Debug Mode

Enable debug logging for authentication issues:

```javascript
// Set environment variable
DEBUG=auth:*

// Or enable in code
localStorage.setItem('debug', 'auth:*');
```

### Testing Authentication

Use the provided demo credentials for testing:

```bash
# Get demo credentials (development only)
curl -H "Authorization: Bearer ADMIN_TOKEN" \
     http://localhost:3000/api/v1/auth/demo-credentials?role=restaurant
```

## Security Monitoring

### Audit Logs

All authentication events are logged:

```json
{
  "userId": "cm2abcd1234567890",
  "action": "LOGIN_SUCCESS",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Security Alerts

The system monitors for:
- Multiple failed login attempts
- Unusual login patterns
- Token abuse
- Rate limit violations

### Health Checks

Monitor authentication service health:

```bash
curl http://localhost:3000/api/v1/auth/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "auth",
  "dependencies": {
    "redis": { "status": "healthy" },
    "database": { "status": "healthy" }
  }
}
```