# Context Consolidation Plan

## Migration Candidates (server state → React Query)

### 1. MerchantContext — FULLY REPLACEABLE
- `products` → use existing `useProducts()` hook
- `orders` → use existing `useOrders()` hook
- `cashbackRequests` → use existing `useCashback()` hook
- `analytics` → use existing `useDashboard()` hook
- `isLoading`/`error` → handled by React Query automatically
- **Action**: Remove MerchantContext entirely. Screens import query hooks directly.

### 2. StoreContext — PARTIALLY REPLACEABLE
- `stores` → use new `useStores()` hook
- `isLoading`/`error` → handled by React Query
- `activeStore` → KEEP in context or move to Zustand (persisted local preference)
- **Action**: Slim down to only `activeStore` selection. Store list comes from query hook.

### 3. TeamContext — PARTIALLY REPLACEABLE
- `members`, `membersById`, `totalMembers` → use new `useTeamMembers()` hook
- `currentUserRole`, `currentUserPermissions` → use new `useMyPermissions()` hook
- `pendingOperations` → move to `useMutation` optimistic update pattern
- **Action**: Remove server state fields. Keep only if optimistic update state needs sharing.

### 4. NotificationContext — PARTIALLY REPLACEABLE
- `unreadCount`, `unreadByType` → already uses React Query internally
- `latestNotification` → KEEP for toast trigger (ephemeral UI state)
- **Action**: Slim down to only toast trigger logic.

## Keep As-Is (not suitable for React Query)

| Context | Reason |
|---------|--------|
| AuthContext | Auth flow + token management (security-sensitive) |
| SocketContext | WebSocket lifecycle management |
| AuditFilterContext | Pure UI filter state |
| OnboardingContext | Multi-step form wizard state machine |

## Migration Order
1. MerchantContext (zero risk — all fields have query hook equivalents)
2. StoreContext.stores (low risk — keep activeStore in slimmed context)
3. TeamContext server fields (medium risk — optimistic updates need care)
4. NotificationContext (low risk — already partially migrated)
