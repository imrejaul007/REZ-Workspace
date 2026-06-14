# RestoPapa API Documentation

The RestoPapa API is a comprehensive B2B/B2C SaaS platform designed specifically for the restaurant industry. It provides a complete ecosystem for restaurant management, vendor relations, job management, community features, and more.

## 🚀 Quick Start

### Base URL
- Development: `http://localhost:3000/api/v1`
- Production: `https://api.restopapa.com/api/v1`

### Authentication
All API requests (except public endpoints) require authentication using JWT Bearer tokens:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     https://api.restopapa.com/api/v1/auth/me
```

### Interactive Documentation
Visit the interactive API documentation at:
- Development: `http://localhost:3000/docs`
- Production: `https://api.restopapa.com/docs`

## 📁 Table of Contents

1. [Authentication](#authentication)
2. [User Roles](#user-roles)
3. [Job Management](#job-management)
4. [Restaurant Management](#restaurant-management)
5. [Vendor Management](#vendor-management)
6. [Community Features](#community-features)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)
9. [Security](#security)
10. [Examples](#examples)

## 🔐 Authentication

### Registration
Create a new user account with role-specific information:

```http
POST /auth/signup
Content-Type: application/json

{
  "email": "restaurant@example.com",
  "password": "SecurePassword123!",
  "role": "RESTAURANT",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+919876543210",
  "restaurantName": "The Food Court",
  "cuisineType": ["Indian", "Chinese"]
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "cm2abcd1234567890",
    "email": "restaurant@example.com",
    "role": "RESTAURANT",
    "isActive": true,
    "isVerified": false,
    "profile": {
      "firstName": "John",
      "lastName": "Doe"
    }
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

### Login
Authenticate and receive access tokens:

```http
POST /auth/signin
Content-Type: application/json

{
  "email": "restaurant@example.com",
  "password": "SecurePassword123!"
}
```

### Token Refresh
Get a new access token using your refresh token:

```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Logout
Invalidate tokens and logout:

```http
POST /auth/logout
Authorization: Bearer YOUR_ACCESS_TOKEN

# Optional: Logout from all devices
POST /auth/logout?all=true
```

## 👥 User Roles

The system supports multiple user roles with specific permissions:

### ADMIN
- Full system access
- Can create jobs for any restaurant
- Can manage all users and content
- Access to analytics and reports

### RESTAURANT
- Manage own restaurant profile
- Create and manage job postings
- View applications and hire employees
- Access restaurant-specific analytics

### EMPLOYEE
- Apply for jobs (requires verification)
- Access community features
- View job recommendations
- Manage own profile

### VENDOR
- Manage vendor profile and products
- Access marketplace features
- View orders and manage inventory
- Financial management

## 💼 Job Management

### Create Job Posting
Restaurant owners and admins can create job postings:

```http
POST /jobs
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "title": "Senior Chef",
  "description": "We are looking for an experienced chef to lead our kitchen team. The ideal candidate should have strong leadership skills and extensive knowledge of Indian cuisine.",
  "requirements": [
    "5+ years cooking experience",
    "Knowledge of Indian cuisine",
    "Leadership experience",
    "Food safety certification"
  ],
  "skills": [
    "Cooking",
    "Team Leadership",
    "Menu Planning",
    "Cost Management"
  ],
  "experienceMin": 3,
  "experienceMax": 8,
  "salaryMin": 25000,
  "salaryMax": 40000,
  "location": "Mumbai, Maharashtra",
  "jobType": "Full-time",
  "validTill": "2024-12-31"
}
```

### Search Jobs
Find jobs using text search and filters:

```http
GET /jobs/search?q=chef&location=Mumbai&jobType=Full-time
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Apply for Job
Employees can apply for jobs (requires verification):

```http
POST /jobs/{jobId}/apply
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "coverLetter": "I am excited to apply for the Senior Chef position. With over 6 years of experience in Indian cuisine and team leadership, I believe I would be a great fit for your restaurant.",
  "resume": "https://example.com/resume.pdf"
}
```

### Get Job Applications
Restaurant owners can view applications for their jobs:

```http
GET /jobs/{jobId}/applications?page=1&limit=20&status=PENDING
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## 🏪 Restaurant Management

### Restaurant Profile
Get restaurant information and manage settings:

```http
GET /restaurants/profile
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Update Restaurant
Update restaurant information:

```http
PATCH /restaurants/profile
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "name": "The Food Court - Updated",
  "description": "Authentic Indian and Chinese cuisine",
  "cuisineType": ["Indian", "Chinese", "Continental"],
  "logo": "https://example.com/logo.jpg"
}
```

## 🤝 Vendor Management

### Vendor Profile
Manage vendor information and business details:

```http
GET /vendors/profile
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Product Management
Add and manage products in the marketplace:

```http
POST /vendors/products
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "name": "Fresh Tomatoes",
  "description": "Organic fresh tomatoes from local farms",
  "category": "Vegetables",
  "price": 50.0,
  "unit": "kg",
  "minOrderQuantity": 5,
  "stock": 100
}
```

## 🌐 Community Features

### Get Community Posts
Access community discussions and posts:

```http
GET /community/posts?page=1&limit=20
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Create Community Post
Share knowledge and engage with the community:

```http
POST /community/posts
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "title": "Best Practices for Kitchen Management",
  "content": "Here are some tips I've learned over the years for efficient kitchen management...",
  "tags": ["kitchen", "management", "tips"],
  "type": "TIP"
}
```

## ⚠️ Error Handling

All API errors follow a consistent format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "BadRequest",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/auth/signin"
}
```

### Common Error Codes

| Status Code | Meaning |
|-------------|---------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Invalid or missing authentication |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation failed |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

## 🛡️ Rate Limiting

To ensure fair usage and system stability, the API implements rate limiting:

### General Endpoints
- **Development**: 1000 requests per 15 minutes
- **Production**: 100 requests per 15 minutes

### Authentication Endpoints
- **Development**: 20 requests per 15 minutes
- **Production**: 5 requests per 15 minutes

### Sensitive Operations
- Password reset: 3 requests per hour
- Account lockout: Progressive delays for repeated failures

### Rate Limit Headers
Response headers indicate current rate limit status:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## 🔒 Security

### HTTPS Only
All production API calls must use HTTPS. HTTP requests will be automatically redirected.

### CORS Policy
The API implements strict CORS policies:
- Development: Allows localhost origins
- Production: Only whitelisted domains allowed

### Input Validation
- All input is validated using class-validator
- SQL injection protection via Prisma ORM
- XSS protection through input sanitization

### Authentication Security
- JWT tokens with configurable expiration
- Refresh token rotation
- Brute force protection
- Account lockout mechanisms

## 📚 Examples

### Complete User Registration Flow

1. **Register a new restaurant:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "restaurant@example.com",
    "password": "SecurePassword123!",
    "role": "RESTAURANT",
    "firstName": "John",
    "lastName": "Doe",
    "restaurantName": "The Food Court",
    "cuisineType": ["Indian", "Chinese"]
  }'
```

2. **Verify email (check email for verification link)**

3. **Login:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "restaurant@example.com",
    "password": "SecurePassword123!"
  }'
```

4. **Create a job posting:**
```bash
curl -X POST http://localhost:3000/api/v1/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "title": "Senior Chef",
    "description": "Experienced chef needed",
    "location": "Mumbai, Maharashtra",
    "jobType": "Full-time",
    "validTill": "2024-12-31"
  }'
```

### Job Application Flow

1. **Register as employee:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "employee@example.com",
    "password": "SecurePassword123!",
    "role": "EMPLOYEE",
    "firstName": "Jane",
    "lastName": "Smith",
    "designation": "Chef"
  }'
```

2. **Search for jobs:**
```bash
curl -X GET "http://localhost:3000/api/v1/jobs/search?q=chef&location=Mumbai" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

3. **Apply for a job:**
```bash
curl -X POST http://localhost:3000/api/v1/jobs/JOB_ID/apply \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "coverLetter": "I am interested in this position...",
    "resume": "https://example.com/resume.pdf"
  }'
```

## 📞 Support

For API support and questions:
- Email: support@restopapa.com
- Documentation: https://docs.restopapa.com
- Status Page: https://status.restopapa.com

## 📄 License

This API documentation is provided under the MIT License.