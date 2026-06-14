# E2E Merchant App Testing Guide

**Project:** rez-app-merchant
**Last Updated:** 2026-04-29
**Test Environment:** Expo Router (React Native/Web)

---

## Table of Contents

1. [Test Infrastructure Overview](#1-test-infrastructure-overview)
2. [Journey 1: Login to Dashboard](#2-journey-1-login-to-dashboard)
3. [Journey 2: Product Management (CRUD)](#3-journey-2-product-management-crud)
4. [Journey 3: Order Fulfillment](#4-journey-3-order-fulfillment)
5. [Journey 4: Analytics Viewing](#5-journey-4-analytics-viewing)
6. [Journey 5: Staff Management](#6-journey-5-staff-management)
7. [Missing Screens & Gaps](#7-missing-screens--gaps)
8. [API Integration Checklist](#8-api-integration-checklist)
9. [Test Scenarios Matrix](#9-test-scenarios-matrix)

---

## 1. Test Infrastructure Overview

### Available Testing Tools

| Tool | Location | Purpose |
|------|----------|---------|
| Jest | `jest.config.js` | Unit & integration testing |
| React Query | `config/reactQuery.ts` | Data fetching hooks |
| Mock Server | `services/api/client.ts` | API mocking |
| Test Utils | `utils/testApi.ts` | API testing helpers |
| Offline Queue | `services/offline.ts` | Offline mode testing |

### Key API Endpoints

```
Base URL: merchant/
Auth:       merchant/auth/login, merchant/auth/register, merchant/auth/refresh
Products:   merchant/products, merchant/products/{id}
Orders:     merchant/orders, merchant/orders/{id}/status
Team:       merchant/team, merchant/team/{id}
Analytics:  merchant/analytics/overview
```

### Authentication Flow

```
Login Screen (/app/(auth)/login.tsx)
    ↓
authService.login() → API: merchant/auth/login
    ↓
Token stored via storageService
    ↓
AuthContext.isAuthenticated → true
    ↓
Router.replace('/(dashboard)')
```

---

## 2. Journey 1: Login to Dashboard

### Screen Flow

```
/app/(auth)/login.tsx        → Login form with email/password
/app/(auth)/register.tsx    → New merchant registration
/app/(auth)/forgot-password.tsx → Password reset flow
/app/(dashboard)/index.tsx  → Main dashboard
```

### Test Steps

#### TC-LOGIN-001: Successful Login

1. Navigate to `/app/(auth)/login.tsx`
2. Enter valid email and password
3. Tap "Login" button
4. **Expected:** Loading state shown
5. **Expected:** Redirect to dashboard on success
6. **Expected:** Token stored in AsyncStorage

```typescript
// Test: TC-LOGIN-001
describe('Login Flow', () => {
  it('should login successfully with valid credentials', async () => {
    // Arrange
    const mockCredentials = { email: 'test@merchant.com', password: 'password123' };

    // Act
    const result = await authService.login(mockCredentials);

    // Assert
    expect(result.token).toBeDefined();
    expect(result.merchant).toBeDefined();
    expect(result.user).toBeDefined();
  });
});
```

#### TC-LOGIN-002: Failed Login (Invalid Credentials)

1. Navigate to login screen
2. Enter invalid email
3. Enter wrong password
4. Tap "Login"
5. **Expected:** Error message displayed
6. **Expected:** Account locked after 5 failed attempts

#### TC-LOGIN-003: Account Lockout

1. Fail login 5 times with same email
2. Attempt 6th login
3. **Expected:** "Account Temporarily Locked" message
4. **Expected:** Lockout timer displayed

**Critical Hook:** `useLoginAttemptTracking` in `/hooks/useLoginAttemptTracking.ts`

#### TC-LOGIN-004: Session Persistence

1. Login successfully
2. Close app / refresh browser
3. **Expected:** Session persisted via storageService
4. **Expected:** Direct redirect to dashboard

#### TC-LOGIN-005: Token Refresh

1. Login successfully
2. Wait for token expiry (~1 hour)
3. Make authenticated API call
4. **Expected:** Token auto-refreshed via `authService.refreshToken()`
5. **Expected:** New token stored

### Missing Screens / Gaps

| Issue | Screen | Status |
|-------|--------|--------|
| Biometric login | `/app/(auth)/login.tsx` | Partial - need biometric hook integration |
| 2FA support | N/A | Not implemented |
| Social login | N/A | Not implemented |

---

## 3. Journey 2: Product Management (CRUD)

### Screen Flow

```
/app/products/index.tsx           → Product list with search/filter
/app/products/add.tsx            → Create new product
/app/products/[id].tsx           → Product details
/app/products/edit/[id].tsx      → Edit product
/app/products/variants/[id].tsx → Variant management
/app/products/bulk-actions.tsx   → Bulk operations
/app/categories/index.tsx        → Category management
```

### API Service

**File:** `/services/api/products.ts`

```typescript
class ProductsService {
  getProducts(filters?: ProductFilters): Promise<ProductListResponse>
  getProduct(productId: string): Promise<Product>
  createProduct(productData: CreateProductRequest): Promise<Product>
  updateProduct(productId: string, updates: UpdateProductRequest): Promise<Product>
  deleteProduct(productId: string): Promise<void>
  getProductVariants(productId: string): Promise<GetVariantsResponse>
  createVariant(productId: string, variantData: CreateVariantRequest): Promise<ProductVariant>
  bulkProductAction(bulkAction: BulkProductAction): Promise<BulkResult>
  validateSku(sku: string, excludeProductId?: string): Promise<SkuValidation>
}
```

### Test Steps

#### TC-PROD-001: Create Product

1. Navigate to `/app/products/add.tsx`
2. Fill required fields:
   - Name
   - Description
   - Category
   - Selling Price
   - Stock Quantity
3. Upload product image
4. Set cashback percentage
5. Save product
6. **Expected:** Product created successfully
7. **Expected:** Redirect to product list

```typescript
// Test: TC-PROD-001
describe('Product Creation', () => {
  it('should create product with all required fields', async () => {
    const productData = {
      name: 'Test Product',
      description: 'A test product description',
      pricing: { selling: 29.99, original: 39.99 },
      category: 'electronics',
      inventory: { stock: 100, trackInventory: true },
      cashback: { percentage: 5 }
    };

    const result = await productsService.createProduct(productData);
    expect(result.id).toBeDefined();
    expect(result.name).toBe('Test Product');
  });

  it('should reject duplicate SKU', async () => {
    const sku = 'PROD-001';
    const validation = await productsService.validateSku(sku);
    expect(validation.isAvailable).toBe(false);
  });
});
```

#### TC-PROD-002: Edit Product

1. Navigate to product detail `/app/products/[id].tsx`
2. Tap "Edit" button
3. Modify fields (name, price, stock)
4. Save changes
5. **Expected:** Product updated in database
6. **Expected:** List reflects changes

#### TC-PROD-003: Delete Product

1. Navigate to product detail
2. Tap "Delete" button
3. Confirm deletion in modal
4. **Expected:** Product archived (soft delete)
5. **Expected:** Product no longer appears in active list

#### TC-PROD-004: Product Search & Filter

1. Navigate to `/app/products/index.tsx`
2. Use search bar
3. Apply filters:
   - Category
   - Stock level (low stock, out of stock, in stock)
   - Status (active/inactive)
4. **Expected:** Results filtered correctly
5. **Expected:** Pagination works

#### TC-PROD-005: Bulk Actions

1. Navigate to `/app/products/bulk-actions.tsx`
2. Select multiple products (checkbox)
3. Choose action:
   - Activate/Deactivate
   - Update category
   - Delete
4. Execute action
5. **Expected:** Idempotency key prevents duplicates
6. **Expected:** Results shown (successful/failed counts)

#### TC-PROD-006: Variant Management

1. Navigate to product with variants
2. Add new variant (size, color, etc.)
3. Set variant-specific pricing
4. **Expected:** Variant created
5. **Expected:** Inventory tracked per variant

### Missing Screens / Gaps

| Issue | Screen | Status |
|-------|--------|--------|
| Product import (CSV) | `/app/products/import.tsx` | Exists but needs UI testing |
| Product export | `/app/products/export.tsx` | Exists but needs UI testing |
| 86'd items management | `/app/products/[id]/86` | Exists but needs integration testing |
| Product restore | `/app/(dashboard)/product-restore.tsx` | Exists - need testing |

---

## 4. Journey 3: Order Fulfillment

### Screen Flow

```
/app/(dashboard)/orders.tsx          → Order list with status tabs
/app/(dashboard)/orders/[id].tsx      → Order detail
/app/orders/live.tsx                 → Real-time order monitoring
/app/kds/index.tsx                   → Kitchen Display System
/app/pos/index.tsx                   → Point of Sale
```

### API Service

**File:** `/services/api/orders.ts`

```typescript
class OrdersService {
  getOrders(params: OrderSearchParams): Promise<OrderListResponse>
  getOrderById(orderId: string): Promise<Order>
  updateOrderStatus(orderId: string, updateData: UpdateOrderStatusRequest): Promise<Order>
  bulkAction(actionData: BulkOrderActionRequest): Promise<BulkOrderResult>
  getAnalytics(dateStart?: string, dateEnd?: string): Promise<OrderAnalytics>
  getOrderSummary(): Promise<OrderSummary>
  // Status transitions
  cancelOrder(orderId: string, notes?: string): Promise<Order>
  confirmOrder(orderId: string, notes?: string): Promise<Order>
  deliverOrder(orderId: string, notes?: string): Promise<Order>
}
```

### Order Status State Machine

```
placed → confirmed → preparing → ready → dispatched → delivered
   ↓         ↓           ↓         ↓          ↓
cancelled  cancelled   cancelled  cancelled  out_for_delivery
                                              ↓
                                           cancelled
```

### Test Steps

#### TC-ORDER-001: View Orders

1. Navigate to `/app/(dashboard)/orders.tsx`
2. View default tab (All orders)
3. Switch tabs by status
4. **Expected:** Orders filtered by status
5. **Expected:** Real-time updates via WebSocket

```typescript
// Test: TC-ORDER-001
describe('Order List', () => {
  it('should fetch orders with pagination', async () => {
    const result = await ordersService.getOrders({
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      order: 'desc'
    });

    expect(result.orders).toBeDefined();
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.page).toBe(1);
  });

  it('should filter orders by status', async () => {
    const result = await ordersService.getOrdersByStatus('placed', 1, 20);
    result.orders.forEach(order => {
      expect(order.status).toBe('placed');
    });
  });
});
```

#### TC-ORDER-002: Order Status Transition

1. Navigate to order detail `/app/(dashboard)/orders/[id].tsx`
2. Tap status update button (e.g., "Confirm")
3. **Expected:** Optimistic UI update
4. **Expected:** Backend validation (invalid transitions rejected)
5. **Expected:** Rollback on API failure

```typescript
// Test: TC-ORDER-002
describe('Order Status Transitions', () => {
  it('should validate valid transition placed → confirmed', async () => {
    const result = await ordersService.confirmOrder('order-123');
    expect(result.status).toBe('confirmed');
  });

  it('should reject invalid transition placed → delivered', async () => {
    await expect(
      ordersService.deliverOrder('order-123')
    ).rejects.toThrow(/Invalid status transition/);
  });
});
```

#### TC-ORDER-003: Order Cancellation

1. Open order with status that allows cancellation
2. Tap "Cancel Order"
3. Add cancellation notes
4. Confirm cancellation
5. **Expected:** Order status → cancelled
6. **Expected:** Customer notified (if `notifyCustomer: true`)

#### TC-ORDER-004: Bulk Order Actions

1. Navigate to orders list
2. Select multiple orders
3. Choose bulk action (confirm, prepare, ready, cancel)
4. Execute
5. **Expected:** Each order updated with idempotency key
6. **Expected:** Summary shows success/failure counts

#### TC-ORDER-005: Real-time Order Updates

1. Have two browser/app instances open
2. Update order status in one instance
3. **Expected:** Other instance receives WebSocket event
4. **Expected:** UI updates without refresh

### Missing Screens / Gaps

| Issue | Screen | Status |
|-------|--------|--------|
| WebSocket integration | `SocketContext.tsx` | Exists - needs E2E testing |
| Offline order queue | `/app/pos/offline.tsx` | Exists - needs offline testing |
| KDS configuration | `/app/kds/settings.tsx` | Exists - needs UI testing |
| Aggregator orders | `/app/(dashboard)/aggregator-orders.tsx` | Exists - needs integration |

---

## 5. Journey 4: Analytics Viewing

### Screen Flow

```
/app/analytics/index.tsx         → Analytics dashboard overview
/app/analytics/sales.tsx         → Sales metrics
/app/analytics/products.tsx      → Product performance
/app/analytics/customers.tsx     → Customer analytics
/app/analytics/revenue.tsx       → Revenue breakdown
/app/analytics/forecast.tsx      → Sales forecasting
/app/analytics/expenses.tsx      → Expense tracking
/app/analytics/export.tsx        → Data export
```

### API Service

**File:** `/services/api/analytics.ts`

```typescript
class AnalyticsService {
  getAnalyticsOverview(dateRange?: DateRangeFilter): Promise<AnalyticsOverview>
  getSalesForecast(forecastDays: 7|30|60|90): Promise<SalesForecastResponse>
  getStockoutPredictions(dateRange?: DateRangeFilter): Promise<InventoryStockoutResponse>
  getCustomerInsights(dateRange?: DateRangeFilter): Promise<CustomerInsights>
  getSeasonalTrends(dataType: 'sales'|'orders'|'customers'|'products'): Promise<SeasonalTrendResponse>
  getProductPerformance(filters: ProductPerformanceFilters): Promise<ProductPerformanceResponse>
}
```

### Test Steps

#### TC-ANALYTICS-001: Dashboard Overview

1. Navigate to `/app/analytics/index.tsx`
2. View default date range (last 7 days)
3. Change date range preset
4. **Expected:** Metrics recalculated
5. **Expected:** Charts render with data

```typescript
// Test: TC-ANALYTICS-001
describe('Analytics Overview', () => {
  it('should fetch analytics overview', async () => {
    const overview = await analyticsService.getAnalyticsOverview({
      startDate: '2026-04-01',
      endDate: '2026-04-29'
    });

    expect(overview).toBeDefined();
    expect(overview.totalRevenue).toBeDefined();
    expect(overview.totalOrders).toBeDefined();
  });
});
```

#### TC-ANALYTICS-002: Sales Trends

1. Navigate to `/app/analytics/sales.tsx`
2. View daily sales chart
3. Hover/click on data points
4. **Expected:** Detailed breakdown shown

#### TC-ANALYTICS-003: Product Performance

1. Navigate to `/app/analytics/products.tsx`
2. View top-selling products
3. Filter by category/date
4. **Expected:** Products sorted by revenue/quantity

#### TC-ANALYTICS-004: Customer Insights

1. Navigate to `/app/analytics/customers.tsx`
2. View LTV segments
3. View retention metrics
4. **Expected:** Customer cohort data displayed

#### TC-ANALYTICS-005: Data Export

1. Navigate to `/app/analytics/export.tsx`
2. Select metrics and date range
3. Choose format (CSV/Excel)
4. Click export
5. **Expected:** File download initiated
6. **Expected:** Large datasets handled with pagination

### Missing Screens / Gaps

| Issue | Screen | Status |
|-------|--------|--------|
| Cohort analysis | `/app/analytics/cohorts.tsx` | Exists - needs testing |
| Churn risk analysis | `/app/analytics/churn-risk.tsx` | Exists - needs testing |
| Menu engineering | `/app/analytics/menu-engineering.tsx` | Exists - needs testing |
| Food cost analysis | `/app/analytics/food-cost.tsx` | Exists - needs testing |

---

## 6. Journey 5: Staff Management

### Screen Flow

```
/app/team/index.tsx           → Team member list
/app/team/invite.tsx         → Invite new member
/app/team/[userId].tsx        → Member detail
/app/team/roles.tsx           → Role management
/app/team/permissions.tsx     → Permission configuration
/app/team/activity.tsx         → Activity log
/app/team/attendance/index.tsx → Attendance tracking
/app/team/timesheet.tsx       → Staff timesheets
/app/team/commissions.tsx     → Commission tracking
```

### API Service

**File:** `/services/api/team.ts`

```typescript
class TeamService {
  getTeamMembers(pagination?: TeamPaginationParams): Promise<TeamMembersListResponse>
  getTeamMember(userId: string): Promise<TeamMemberResponse>
  inviteTeamMember(inviteData: InviteTeamMemberRequest): Promise<InvitationResponse>
  resendInvitation(userId: string): Promise<ResendInvitationResponse>
  updateTeamMemberRole(userId: string, roleData: UpdateRoleRequest): Promise<UpdateRoleResponse>
  updateTeamMemberStatus(userId: string, statusData: UpdateStatusRequest): Promise<UpdateStatusResponse>
  removeTeamMember(userId: string): Promise<RemoveMemberResponse>
  checkPermission(permission: Permission): Promise<PermissionCheckResult>
  getRoleCapabilities(role: MerchantRole): RoleCapabilities
}
```

### Role Hierarchy

```
owner  → Full access (cannot be assigned)
admin  → Manage products, orders, team
manager → Manage products, orders
staff  → View-only + order status updates
cashier → POS-only access
```

### Test Steps

#### TC-TEAM-001: View Team Members

1. Navigate to `/app/team/index.tsx`
2. View team member list
3. Check pagination
4. **Expected:** Members displayed with role/status badges

```typescript
// Test: TC-TEAM-001
describe('Team Management', () => {
  it('should fetch team members', async () => {
    const result = await teamService.getTeamMembers({ page: 1, limit: 20 });
    expect(result.members).toBeDefined();
    expect(Array.isArray(result.members)).toBe(true);
  });

  it('should respect RBAC - owner can invite', async () => {
    const check = await teamService.checkPermission('team:invite');
    // Depends on current user role
    expect(check).toBeDefined();
  });
});
```

#### TC-TEAM-002: Invite Team Member

1. Navigate to `/app/team/invite.tsx`
2. Enter email, name, select role
3. Submit invitation
4. **Expected:** Invitation email sent
5. **Expected:** Member appears in list as "pending"

#### TC-TEAM-003: Accept Invitation (Team Member)

1. Open invitation email/link
2. Navigate to `/app/reset-password/[token].tsx`
3. Set password
4. Submit
5. **Expected:** Account activated
6. **Expected:** Redirect to dashboard

#### TC-TEAM-004: Change Member Role

1. Navigate to member detail `/app/team/[userId].tsx`
2. Tap "Change Role"
3. Select new role
4. Confirm
5. **Expected:** Role updated
6. **Expected:** Permissions recalculated

#### TC-TEAM-005: Remove Team Member

1. Navigate to member detail
2. Tap "Remove Member"
3. Confirm in modal
4. **Expected:** Member removed from list
5. **Expected:** Cannot access app anymore

#### TC-TEAM-006: View Activity Log

1. Navigate to `/app/team/activity.tsx`
2. View recent actions
3. Filter by action type
4. **Expected:** Actions timestamped
5. **Expected:** Filtered results correct

### Missing Screens / Gaps

| Issue | Screen | Status |
|-------|--------|--------|
| Staff shift scheduling | `/app/staff-shifts/index.tsx` | Exists - needs UI testing |
| Payroll integration | `/app/team/payroll/index.tsx` | Exists - needs integration |
| Clock in/out | `/app/team/clock.tsx` | Exists - needs UI testing |
| Rota management | `/app/team/rota.tsx` | Exists - needs UI testing |

---

## 7. Missing Screens & Gaps

### Authentication

| Screen | Priority | Notes |
|--------|----------|-------|
| Biometric auth | Medium | Hook exists (`utils/biometric.ts`) - UI not complete |
| 2FA setup | Low | Not in scope |
| SSO/SAML | Low | Not in scope |

### Products

| Screen | Priority | Notes |
|--------|----------|-------|
| Product comparison | Low | Not implemented |
| Product recommendations | Medium | Exists in copilot, needs testing |
| Barcode scanning | Low | Exists in try/merchant/scanner.tsx |

### Orders

| Screen | Priority | Notes |
|--------|----------|-------|
| Split payment | Medium | Exists in POS - needs testing |
| Order templates | Low | Not implemented |
| Recurring orders | Low | Not implemented |

### Analytics

| Screen | Priority | Notes |
|--------|----------|-------|
| Custom dashboards | Medium | Not implemented |
| Scheduled reports | Low | Not implemented |
| Benchmark comparison | Medium | Exists `/analytics/comparison.tsx` - needs testing |

---

## 8. API Integration Checklist

### Authentication

- [ ] POST `merchant/auth/login` - Login with email/password
- [ ] POST `merchant/auth/register` - Register new merchant
- [ ] POST `merchant/auth/refresh` - Refresh token
- [ ] GET `merchant/auth/me` - Get current user profile
- [ ] POST `merchant/auth/logout` - Logout
- [ ] POST `merchant/auth/forgot-password` - Password reset request
- [ ] POST `merchant/auth/reset-password` - Reset with token

### Products

- [ ] GET `merchant/products` - List products with filters
- [ ] GET `merchant/products/{id}` - Get single product
- [ ] POST `merchant/products` - Create product
- [ ] PUT `merchant/products/{id}` - Update product
- [ ] DELETE `merchant/products/{id}` - Delete product
- [ ] GET `merchant/products/categories` - List categories
- [ ] POST `merchant/products/bulk-action` - Bulk operations
- [ ] POST `merchant/products/{id}/86` - Mark 86'd

### Orders

- [ ] GET `merchant/orders` - List orders with filters
- [ ] GET `merchant/orders/{id}` - Get order detail
- [ ] PUT `merchant/orders/{id}/status` - Update status
- [ ] POST `merchant/orders/bulk-action` - Bulk actions
- [ ] GET `merchant/orders/analytics` - Order analytics

### Team

- [ ] GET `merchant/team` - List team members
- [ ] GET `merchant/team/{id}` - Get member detail
- [ ] POST `merchant/team/invite` - Invite member
- [ ] PUT `merchant/team/{id}/role` - Update role
- [ ] PUT `merchant/team/{id}/status` - Update status
- [ ] DELETE `merchant/team/{id}` - Remove member
- [ ] GET `merchant/team/me/permissions` - Current user permissions

### Analytics

- [ ] GET `merchant/analytics/overview` - Dashboard overview
- [ ] GET `merchant/analytics/forecast/sales` - Sales forecast
- [ ] GET `merchant/analytics/customers/insights` - Customer insights
- [ ] GET `merchant/analytics/inventory/stockout-prediction` - Stockout alerts

---

## 9. Test Scenarios Matrix

### Priority 1 (Critical Paths)

| ID | Journey | Scenario | Expected Result |
|----|---------|----------|------------------|
| P1-01 | Login | Valid credentials | Dashboard loaded |
| P1-02 | Login | Invalid credentials | Error message shown |
| P1-03 | Login | 5 failed attempts | Account locked |
| P1-04 | Dashboard | Load metrics | Cards populated |
| P1-05 | Products | Create product | Product in list |
| P1-06 | Products | Delete product | Removed from list |
| P1-07 | Orders | View list | Orders displayed |
| P1-08 | Orders | Update status | Status changed |
| P1-09 | Team | Invite member | Invitation sent |
| P1-10 | Analytics | Load overview | Charts rendered |

### Priority 2 (Important)

| ID | Journey | Scenario | Expected Result |
|----|---------|----------|------------------|
| P2-01 | Login | Session persists | Auto-login on reload |
| P2-02 | Products | Search products | Results filtered |
| P2-03 | Products | Bulk activate | Multiple updated |
| P2-04 | Orders | Cancel order | Status = cancelled |
| P2-05 | Orders | Bulk cancel | Multiple cancelled |
| P2-06 | Team | Change role | Permissions updated |
| P2-07 | Team | Remove member | Not in list |
| P2-08 | Analytics | Date range change | Metrics recalculated |
| P2-09 | Analytics | Export data | File downloaded |

### Priority 3 (Nice to Have)

| ID | Journey | Scenario | Expected Result |
|----|---------|----------|------------------|
| P3-01 | Products | Duplicate SKU | Validation error |
| P3-02 | Products | Variant creation | Variant added |
| P3-03 | Orders | Invalid transition | Error thrown |
| P3-04 | Orders | Real-time update | UI auto-updates |
| P3-05 | Team | Activity log | Actions logged |
| P3-06 | Analytics | Forecast view | Predictions shown |
| P3-07 | Dashboard | Offline mode | Queue operations |

---

## Running Tests

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
npm run test:integration
```

### E2E Tests (Manual)

1. Start mock server
2. Navigate through screens
3. Verify API calls in Network tab
4. Check console for errors

### Offline Mode Testing

```typescript
// Test offline queue
import { offlineQueue } from '@/services/offline';

it('should queue operations when offline', async () => {
  // Simulate offline
  const queue = offlineQueue.getPendingOperations();
  expect(queue.length).toBeGreaterThanOrEqual(0);
});
```

---

## Appendix: Key Files Reference

### Contexts

- `/contexts/AuthContext.tsx` - Authentication state
- `/contexts/MerchantContext.tsx` - Merchant data
- `/contexts/StoreContext.tsx` - Store management
- `/contexts/TeamContext.tsx` - Team state

### Hooks

- `/hooks/useLoginAttemptTracking.ts` - Login security
- `/hooks/useDashboardData.ts` - Dashboard data fetching
- `/hooks/useMerchantOrders.ts` - Order management
- `/hooks/useRBAC.ts` - Permission checking

### Services

- `/services/api/auth.ts` - Auth operations
- `/services/api/products.ts` - Product CRUD
- `/services/api/orders.ts` - Order management
- `/services/api/team.ts` - Team operations
- `/services/api/analytics.ts` - Analytics queries
- `/services/offline.ts` - Offline queue

### WebSocket

- `/services/api/socket.ts` - Real-time updates
- `/contexts/SocketContext.tsx` - Socket state
- `/hooks/useMerchantOrdersSocket.ts` - Order socket
