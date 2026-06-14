# RestoPapa Screen-to-Endpoint Mapping

## Overview
This document maps every screen/page in the RestoPapa platform to its corresponding backend API endpoints, showing data flow and navigation paths to ensure no dead-ends in the application.

## API Base URL
- Development: `http://localhost:3000/api/v1`
- Production: `https://api.restopapa.com/api/v1`

## Authentication Endpoints (All Roles)

| Screen | Endpoint(s) | Method | Data In | Data Out | Navigation To |
|--------|-------------|---------|---------|----------|---------------|
| Sign Up | `/auth/signup` | POST | email, password, role, firstName, lastName, phone | user, accessToken, refreshToken | Role-specific dashboard |
| Sign In | `/auth/signin` | POST | email, password | user, accessToken, refreshToken | Role-specific dashboard |
| Forgot Password | `/auth/forgot-password` | POST | email | message | Sign In |
| Reset Password | `/auth/reset-password` | POST | token, newPassword | message | Sign In |
| Change Password | `/auth/change-password` | POST | oldPassword, newPassword | message | Profile |
| Logout | `/auth/logout` | POST | - | message | Sign In |
| Refresh Token | `/auth/refresh` | POST | refreshToken | accessToken, refreshToken | Current screen |

## Admin Screens

| Screen | Endpoint(s) | Method | Data In | Data Out | Navigation To |
|--------|-------------|---------|---------|----------|---------------|
| Admin Dashboard | `/admin/stats` | GET | - | statistics, metrics | Admin sections |
| | `/admin/recent-activities` | GET | - | activities[] | Activity details |
| Users Management | `/admin/users` | GET | page, limit, filters | users[], total | User detail |
| | `/admin/users/:id` | GET | - | user details | Edit user |
| | `/admin/users/:id` | PUT | user data | updated user | Users list |
| | `/admin/users/:id/status` | PATCH | isActive | success | Users list |
| Restaurant Verification | `/admin/restaurants/pending` | GET | page, limit | restaurants[] | Restaurant detail |
| | `/admin/restaurants/:id` | GET | - | restaurant details | Verification |
| | `/admin/restaurants/:id/verify` | POST | status, notes | success | Pending list |
| Vendor Verification | `/admin/vendors/pending` | GET | page, limit | vendors[] | Vendor detail |
| | `/admin/vendors/:id` | GET | - | vendor details | Verification |
| | `/admin/vendors/:id/approve` | POST | status, notes | success | Pending list |
| Marketplace Control | `/admin/products` | GET | page, limit, filters | products[] | Product detail |
| | `/admin/products/:id/flag` | POST | reason | success | Products list |
| | `/admin/categories` | GET/POST | - / category data | categories[] / new category | Category edit |
| Financial Overview | `/admin/finance` | GET | dateRange | revenue, transactions | Transaction detail |
| | `/admin/finance/settlements` | GET | page, limit | settlements[] | Settlement detail |
| | `/admin/finance/settle` | POST | vendorId, amount | transaction | Settlements |
| Reports | `/admin/reports` | GET | type, dateRange | report data | Export options |
| | `/admin/reports/export` | POST | type, format, filters | download URL | Reports list |
| System Settings | `/admin/settings` | GET | - | settings | Edit settings |
| | `/admin/settings` | PUT | settings data | updated settings | Settings |

## Restaurant Owner Screens

| Screen | Endpoint(s) | Method | Data In | Data Out | Navigation To |
|--------|-------------|---------|---------|----------|---------------|
| Restaurant Dashboard | `/restaurants/:id/dashboard` | GET | - | stats, feed, alerts | Restaurant sections |
| | `/restaurants/:id/analytics` | GET | dateRange | charts, metrics | Analytics detail |
| Restaurant Profile | `/restaurants/:id` | GET | - | restaurant details | Edit profile |
| | `/restaurants/:id` | PUT | restaurant data | updated restaurant | Profile view |
| | `/restaurants/:id/documents` | POST | document files | uploaded docs | Documents list |
| Branch Management | `/restaurants/:id/branches` | GET | - | branches[] | Branch detail |
| | `/restaurants/:id/branches` | POST | branch data | new branch | Branches list |
| | `/branches/:id` | PUT | branch data | updated branch | Branches list |
| Employee Management | `/restaurants/:id/employees` | GET | page, limit, filters | employees[] | Employee detail |
| | `/restaurants/:id/employees` | POST | employee data | new employee | Employees list |
| | `/employees/:id` | GET | - | employee details | Edit employee |
| | `/employees/:id` | PUT | employee data | updated employee | Employees list |
| | `/employees/:id/verify` | POST | aadharNumber | verification status | Employee detail |
| Job Postings | `/restaurants/:id/jobs` | GET | page, limit, status | jobs[] | Job detail |
| | `/restaurants/:id/jobs` | POST | job data | new job | Jobs list |
| | `/jobs/:id` | GET | - | job details | Edit job |
| | `/jobs/:id` | PUT | job data | updated job | Jobs list |
| | `/jobs/:id/applications` | GET | page, limit | applications[] | Application detail |
| | `/jobs/:id/applications/:appId` | PATCH | status, notes | updated application | Applications |
| Marketplace (Buy) | `/products` | GET | filters, page, limit | products[] | Product detail |
| | `/products/:id` | GET | - | product details | Add to cart |
| | `/products/compare` | POST | productIds[] | comparison data | Products list |
| Shopping Cart | `/restaurants/:id/cart` | GET | - | cart items | Checkout |
| | `/cart/items` | POST | productId, quantity | updated cart | Cart view |
| | `/cart/items/:id` | PUT | quantity | updated cart | Cart view |
| | `/cart/items/:id` | DELETE | - | updated cart | Cart view |
| Checkout | `/orders` | POST | cart, address, payment | order | Order confirmation |
| | `/payments/initiate` | POST | orderId, method | payment gateway data | Payment page |
| Orders | `/restaurants/:id/orders` | GET | page, limit, status | orders[] | Order detail |
| | `/orders/:id` | GET | - | order details | Track order |
| | `/orders/:id/invoice` | GET | - | invoice PDF | Orders list |
| Sell/Resale | `/restaurants/:id/products` | GET | page, limit | products[] | Product edit |
| | `/restaurants/:id/products` | POST | product data | new product | Products list |
| | `/products/:id` | PUT | product data | updated product | Products list |
| Messaging | `/conversations` | GET | - | conversations[] | Conversation |
| | `/conversations/:id` | GET | - | messages[] | Send message |
| | `/messages` | POST | conversationId, content | new message | Conversation |
| Community | `/posts` | GET | page, limit, filters | posts[] | Post detail |
| | `/posts` | POST | title, content, images | new post | Post detail |
| | `/posts/:id` | GET | - | post, comments | Add comment |
| | `/posts/:id/comments` | POST | content | new comment | Post detail |
| Notifications | `/notifications` | GET | page, limit | notifications[] | Related screen |
| | `/notifications/:id/read` | PATCH | - | success | Notifications |
| Settings | `/restaurants/:id/settings` | GET | - | settings | Edit settings |
| | `/restaurants/:id/settings` | PUT | settings data | updated settings | Settings |

## Employee Screens

| Screen | Endpoint(s) | Method | Data In | Data Out | Navigation To |
|--------|-------------|---------|---------|----------|---------------|
| Employee Dashboard | `/employees/:id/dashboard` | GET | - | stats, activities | Employee sections |
| Employee Profile | `/employees/:id` | GET | - | employee details | Edit profile |
| | `/employees/:id` | PUT | profile data | updated employee | Profile view |
| | `/employees/:id/documents` | POST | document files | uploaded docs | Documents |
| Job Search | `/jobs` | GET | filters, page, limit | jobs[] | Job detail |
| | `/jobs/search` | POST | keywords, location | jobs[] | Job detail |
| | `/jobs/:id` | GET | - | job details | Apply |
| Job Application | `/jobs/:id/applications` | POST | coverLetter, resume | application | Applications |
| My Applications | `/employees/:id/applications` | GET | page, limit | applications[] | Application detail |
| | `/applications/:id` | GET | - | application details | Job detail |
| | `/applications/:id/withdraw` | DELETE | - | success | Applications |
| Learning Hub | `/learning` | GET | page, limit, category | courses[] | Course detail |
| | `/learning/:id` | GET | - | course details | Start course |
| | `/learning/:id/progress` | POST | progress data | updated progress | Course |
| Attendance | `/employees/:id/attendance` | GET | dateRange | attendance[] | Mark attendance |
| | `/attendance/checkin` | POST | - | check-in time | Dashboard |
| | `/attendance/checkout` | POST | - | check-out time | Dashboard |
| Leave Management | `/employees/:id/leaves` | GET | - | leaves[] | Leave detail |
| | `/leaves` | POST | leave data | new leave request | Leaves list |
| | `/leaves/:id` | GET | - | leave details | Edit/Cancel |
| Messaging | `/conversations` | GET | - | conversations[] | Conversation |
| | `/messages` | POST | conversationId, content | new message | Conversation |

## Vendor Screens

| Screen | Endpoint(s) | Method | Data In | Data Out | Navigation To |
|--------|-------------|---------|---------|----------|---------------|
| Vendor Dashboard | `/vendors/:id/dashboard` | GET | - | stats, orders, alerts | Vendor sections |
| | `/vendors/:id/analytics` | GET | dateRange | charts, metrics | Analytics |
| Vendor Profile | `/vendors/:id` | GET | - | vendor details | Edit profile |
| | `/vendors/:id` | PUT | vendor data | updated vendor | Profile view |
| | `/vendors/:id/documents` | POST | document files | uploaded docs | Documents |
| Product Catalog | `/vendors/:id/products` | GET | page, limit, filters | products[] | Product detail |
| | `/vendors/:id/products` | POST | product data | new product | Products list |
| | `/products/:id` | GET | - | product details | Edit product |
| | `/products/:id` | PUT | product data | updated product | Products list |
| | `/products/:id` | DELETE | - | success | Products list |
| Inventory | `/vendors/:id/inventory` | GET | - | inventory items | Update stock |
| | `/inventory/:productId` | PATCH | quantity | updated inventory | Inventory |
| Orders | `/vendors/:id/orders` | GET | page, limit, status | orders[] | Order detail |
| | `/orders/:id` | GET | - | order details | Process order |
| | `/orders/:id/status` | PATCH | status, trackingNumber | updated order | Orders list |
| | `/orders/:id/invoice` | GET | - | invoice PDF | Order detail |
| Payouts | `/vendors/:id/payouts` | GET | page, limit | payouts[] | Payout detail |
| | `/payouts/:id` | GET | - | payout details | Payouts list |
| | `/payouts/request` | POST | amount, method | payout request | Payouts |
| Reviews | `/vendors/:id/reviews` | GET | page, limit | reviews[] | Review detail |
| | `/reviews/:id/response` | POST | response | updated review | Reviews |
| Promotions | `/vendors/:id/promotions` | GET | - | promotions[] | Promotion detail |
| | `/promotions` | POST | promotion data | new promotion | Promotions |
| | `/promotions/:id` | PUT | promotion data | updated promotion | Promotions |

## Community Screens (All Roles)

| Screen | Endpoint(s) | Method | Data In | Data Out | Navigation To |
|--------|-------------|---------|---------|----------|---------------|
| Community Feed | `/posts` | GET | page, limit, filters | posts[] | Post detail |
| | `/posts/trending` | GET | limit | posts[] | Post detail |
| Create Post | `/posts` | POST | title, content, images, tags | new post | Post detail |
| Post Detail | `/posts/:id` | GET | - | post, comments | Add comment |
| | `/posts/:id/like` | POST | - | updated likes | Post detail |
| | `/posts/:id/comments` | GET | page, limit | comments[] | Comment thread |
| | `/posts/:id/comments` | POST | content | new comment | Post detail |
| User Profile | `/users/:id/profile` | GET | - | user, posts | User posts |
| | `/users/:id/posts` | GET | page, limit | posts[] | Post detail |
| Search | `/search` | GET | query, type, filters | results[] | Result detail |

## Real-time WebSocket Events

| Event | Purpose | Payload | Subscribe By |
|-------|---------|---------|--------------|
| `order:status` | Order status updates | orderId, status, timestamp | Restaurant, Vendor |
| `message:new` | New message received | conversationId, message | All users |
| `notification:new` | New notification | notification object | All users |
| `job:application` | New job application | jobId, applicationId | Restaurant |
| `payment:status` | Payment status change | orderId, status | Restaurant, Vendor |
| `employee:verification` | Employee verification complete | employeeId, status | Restaurant, Employee |
| `product:stock` | Stock level alert | productId, quantity | Vendor |

## Navigation Rules

### Global Navigation
- **Header**: Logo → Home, User Menu → Profile/Settings/Logout
- **Breadcrumbs**: Home > Section > Subsection > Current Page
- **Back Button**: Always returns to parent list or previous screen
- **Mobile Bottom Nav**: Home, Search, Cart, Messages, Profile

### Error States
- **404 Not Found** → Home button, Search
- **401 Unauthorized** → Login screen
- **403 Forbidden** → Previous page, Home
- **500 Server Error** → Retry button, Support contact

### Success States
- **Order Success** → Order detail, Continue shopping
- **Payment Success** → Invoice download, Order tracking
- **Registration Success** → Dashboard, Complete profile

### Empty States
- **No Products** → Browse marketplace, Add first product
- **No Orders** → Start shopping, View products
- **No Employees** → Add employee, Import employees
- **No Jobs** → Post job, Job templates

## Performance Optimizations

### Caching Strategy
- User profile: 5 minutes
- Product listings: 2 minutes
- Categories: 10 minutes
- Dashboard stats: 1 minute
- Static content: 1 hour

### Pagination
- Default page size: 20 items
- Max page size: 100 items
- Cursor-based for real-time data
- Offset-based for static lists

### Real-time Updates
- WebSocket for critical updates
- Polling for non-critical data (30s intervals)
- SSE for one-way notifications

## Security Measures

### Authentication
- JWT tokens (15min access, 7day refresh)
- Role-based access control (RBAC)
- 2FA for admin and financial operations
- Session management with Redis

### Rate Limiting
- Auth endpoints: 5 requests/minute
- API endpoints: 100 requests/minute
- File uploads: 10 requests/hour
- WebSocket connections: 1 per user

### Data Protection
- HTTPS everywhere
- Input validation on all endpoints
- SQL injection prevention
- XSS protection
- CSRF tokens for state-changing operations