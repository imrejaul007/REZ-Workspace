# Dashboard Split Plan — Sprint -1a

**Source file:** `rez-app-merchant/app/(dashboard)/index.tsx`
**Total lines:** 3,762
**Target extraction root:** `rez-app-merchant/components/dashboard/cards/`
**Goal:** reduce the monolithic `DashboardScreen` to a config-driven list renderer that iterates over `DASHBOARD_CARDS` and passes each card the slice of state it needs.

> Do NOT modify `index.tsx` during this sprint. Sprint -1a is the planning + scaffolding + smoke-test checkpoint. The mechanical extraction lands in Sprint -1b.

---

## 1. Inventory — top-level hooks, state, refs, effects (lines 108-414)

These live in `DashboardScreen()` and feed almost every card. They are the contract every extracted card will need to receive through props or through a new `DashboardContext`.

### Context hooks
| Source line | Hook | Consumers |
|---|---|---|
| 110 | `useSafeAreaInsets()` | header padding only (shell) |
| 111 | `useAuth()` → `authState` | greeting card, cashier redirect effect |
| 112 | `useMerchant()` → `merchantState`, `loadAnalytics` | `loadAnalytics` is imported but NEVER called (dead code — remove during extraction) |
| 113 | `useStore()` → `activeStore` | suspension banner, inactive banner, `fetchDashboardData`, `RendezBookingsCard` |
| 114 | `useNotificationContext()` → `unreadCount` | header notification bell only |
| 115 | `useDashboardRealTime()` → `realTime` | header LIVE dot, real-time merge effect |

### Local state (lines 116-136)
`metrics`, `overview`, `notifications`, `isLoading`, `refreshing`, `dashboardError`, `customerPayments`, `storePerformance`, `actionItems`, `todayRevenue`, `topItemsToday`, `campaignPerformance`, `customerRetention`, `basketTrend`, `healthData`, `recommendations`.

### Refs (138-139)
`lastFetchRef`, `fetchInFlightRef` — debounce guards, must stay in the shell.

### Callbacks / local helpers
- `fetchDashboardData` (141-343) — the single data-fetch pipeline. Do NOT split per-card fetches yet; keep the shell as data-owner and pass results down.
- `handleRefresh` (404-406), `generateSampleData` (408-414).
- `formatCurrency` (416), `formatPercentage` (417), `formatNumber` (419) — **move to `rez-app-merchant/utils/dashboardFormatters.ts`** before extraction. These are closed over by nearly every inline card.
- `MetricCardItem` (421-488), `QuickActionButton` (490-521) — inner components that are NEVER rendered in the return. Delete during cleanup.

### Effects
- Lines 346-351 — cashier/staff redirect. Stays in the shell.
- Lines 353-358 — initial `fetchDashboardData` call. Stays in the shell.
- Lines 361-402 — socket real-time merge into `metrics`/`overview`. Stays in the shell. **This is a render-adjacent effect, not a render side-effect — safe.**

---

## 2. Rendered card / widget enumeration (return statement, lines 523-2288)

There are **22 distinct rendered blocks** in the return tree. Of those, **8 are already extracted components**, **1 is the scroll shell itself**, and **13 are inline card bodies that need extraction**.

Numbering below matches render order.

| # | Card / block | Lines | Already extracted? | Suggested filename |
|---|---|---|---|---|
| 0 | `<View container>` + background gradient | 524-528 | shell | (stays in index) |
| 1 | Error banner | 531-546 | no | `ErrorBannerCard.tsx` |
| 2 | Store suspension alert | 549-562 | no | `StoreSuspensionBanner.tsx` |
| 3 | Inactive store warning | 565-575 | no | `StoreInactiveBanner.tsx` |
| 4 | `DailyCommandBar` | 580-585 | **yes** (external) | wrap in config as `DailyCommandBarCard` |
| 5 | Glassmorphic header (greeting + LIVE + bell) | 594-656 | no | `DashboardHeaderCard.tsx` |
| 6 | Today at a Glance (4-cell grid) | 659-806 | no | `TodayAtAGlanceCard.tsx` |
| 7 | `RendezBookingsCard` | 809 | **yes** | already a component, register in config |
| 8 | Health Score card (A-05) | 812-854 | no | `StoreHealthScoreCard.tsx` |
| 9 | AI Recommendations (A-05) | 857-885 | no | `AIRecommendationsCard.tsx` |
| 10 | Today's Highlights horizontal scroll (4 cards in one block) | 888-1038 | no | `TodaysHighlightsStrip.tsx` |
| 11 | Story Card — monthly revenue narrative | 1041-1072 | no | `MonthlyStoryCard.tsx` |
| 12 | Today's Revenue (inline card, vs-yesterday) | 1075-1182 | no | `TodayRevenueInlineCard.tsx` — ⚠️ name-clash with the imported `TodayRevenueWidget` component used on line 1945. Keep the two separate; the inline one is the ROI / vs-yesterday treatment. |
| 13 | Top Items Today | 1185-1242 | no | `TopItemsTodayCard.tsx` |
| 14 | Customer Return Rate | 1245-1298 | no | `CustomerReturnRateCard.tsx` |
| 15 | Basket Size Trend Alert | 1301-1336 | no | `BasketSizeTrendCard.tsx` |
| 16 | Quick Action cards (2x2+1) | 1339-1403 | no | `QuickActionGridCard.tsx` |
| 17 | Action Items ("Needs Your Attention") | 1406-1454 | no | `ActionItemsCard.tsx` |
| 18 | Active Campaigns ROI | 1457-1540 | no | `CampaignROICard.tsx` |
| 19 | Analytics Overview (2x2 + quick stats bar) | 1543-1779 | no | `AnalyticsOverviewCard.tsx` |
| 20 | Store Performance (horizontal scroll) | 1782-1928 | no | `StorePerformanceCard.tsx` |
| 21 | `BudgetGauge` | 1931-1941 | **yes** (external) | register in config as `BudgetGaugeCard` |
| 22 | `DemandIntelligenceCard` | 1943 | **yes** | register in config |
| 23 | `REZAttributionCard` | 1944 | **yes** | register in config |
| 24 | `TodayRevenueWidget` | 1945 | **yes** | register in config |
| 25 | `RezNowAnalyticsCard` | 1946 | **yes** | register in config |
| 26 | Quick Actions Premium grid (2 primary + 9 secondary tiles) | 1949-2093 | no | `QuickActionsPremiumGrid.tsx` |
| 27 | Customer Payments list | 2096-2177 | no | `CustomerPaymentsCard.tsx` |
| 28 | Recent Activity (orders) | 2180-2287 | no | `RecentActivityCard.tsx` |

**Total cards in scope for extraction:** 21 inline blocks + 7 already-external components = **28 cards to register in config** (banners 1/2/3 and the shell header 5 may or may not qualify as "cards" in the config — see §5).

Card count (reviewable widgets, excluding the scroll shell): **28.**

---

## 3. Per-card state & landmine analysis

Legend:
- **Reads** = props the card will receive from the shell.
- **Context** = context hooks the card will call directly (allowed, cheap).
- **Callbacks** = navigation / action fns the card fires.
- **Closures** = non-obvious vars the inline JSX captures from `DashboardScreen` that WILL break extraction if missed.
- **Effort** = S (≤30 min, pure JSX move), M (30-90 min, needs prop-threading or deduping styles), L (>90 min, local state, complex data shaping, or cross-card coupling).

### 1. ErrorBannerCard — S
- Reads: `dashboardError: string | null`
- Callbacks: `onRetry()` → shell calls `fetchDashboardData()`
- Closures: none
- Landmines: none

### 2. StoreSuspensionBanner — S
- Reads: `activeStore` (via `useStore()` directly)
- Context: `useStore`
- Landmines: none

### 3. StoreInactiveBanner — S
- Reads: `activeStore`
- Context: `useStore`
- Landmines: none

### 5. DashboardHeaderCard — M
- Reads: `isLiveConnected: boolean`, `lastUpdate: Date | null`
- Context: `useAuth` (for `user.name`, `merchant.businessName`), `useNotificationContext` (for `unreadCount`)
- Callbacks: `onPressNotifications()` → `router.push('/notifications')` (can stay internal via expo-router import)
- Closures: none material — `realTime.isConnected` and `realTime.lastUpdate` must be passed in or re-derived from `useDashboardRealTime()`. Calling `useDashboardRealTime` twice is fine; it's memoised.

### 6. TodayAtAGlanceCard — M
- Reads: `isLoading: boolean`, `metrics: DashboardMetrics | null`, `todayRevenue: TodayRevenueMetrics | null`
- Callbacks: none (currently — no onPress wired on cells)
- Closures: `new Date()` is computed at render — keep inside the card; acceptable.
- Landmines: **mixed data sources** — Visits cell reads `todayRevenue.vsYesterday.orders ?? metrics.pendingOrders`. The `?? metrics.pendingOrders` fallback is semantically wrong (pendingOrders is NOT visits) and must be documented or fixed during extraction. Flag for product review before changing.

### 8. StoreHealthScoreCard — S
- Reads: `healthData: { score, trend, percentile } | null`
- Landmines: `healthData` is typed `any` — add a narrow interface `HealthScoreData` during extraction.

### 9. AIRecommendationsCard — M
- Reads: `recommendations: Recommendation[]`
- Callbacks: `onRecommendationPress(rec)` → `router.push(rec.actionRoute)` (can stay internal)
- Landmines: `recommendations: any[]` in source. Define `Recommendation` shape.

### 10. TodaysHighlightsStrip — M
- Reads: `metrics: DashboardMetrics | null`
- Closures: `formatCurrency`, `formatPercentage`, `formatNumber` — **move to shared util first**.
- Landmines: 4 animated cards in one horizontal scroll. Biggest single-render block in the file apart from Analytics Overview. Keep as ONE component, not 4.

### 11. MonthlyStoryCard — S
- Reads: `metrics`
- Closures: uses `metrics.monthlyRevenue`, `monthlyOrders`, `revenueGrowth`. Straight move.

### 12. TodayRevenueInlineCard — M
- Reads: `todayRevenue: TodayRevenueMetrics | null`
- Landmines: **name collision** with `TodayRevenueWidget` imported at line 57. Must NOT import both under same name. Suggest filename `TodayRevenueROICard.tsx` to disambiguate.

### 13. TopItemsTodayCard — S
- Reads: `topItemsToday: TopItemToday[]`
- Closures: none
- Landmines: none

### 14. CustomerReturnRateCard — S
- Reads: `customerRetention: CustomerRetentionMetrics | null`

### 15. BasketSizeTrendCard — S
- Reads: `basketTrend: BasketSizeTrend | null`
- Guarded by `basketTrend.percentChange !== 0` — keep guard inside card so config doesn't have to know.

### 16. QuickActionGridCard — S
- Reads: nothing from shell
- Callbacks: router.push per item (stays internal)
- Landmines: none. Pure static grid. Extract first as warm-up.

### 17. ActionItemsCard — M
- Reads: `actionItems: ActionItem[]`
- Callbacks: router.push per item (stays internal)
- Landmines: styling is shared with other "section" headers (`styles.recentActivityIconBg`, `actionItemsTitleRow`). Either duplicate the styles or promote to a shared `dashboardSectionStyles`.

### 18. CampaignROICard — M
- Reads: `campaignPerformance: CampaignPerformance[]`
- Callbacks: router.push (stays internal)

### 19. AnalyticsOverviewCard — L
- Reads: `metrics`
- Closures: `formatCurrency`, `formatNumber` — requires shared util.
- Landmines: **largest inline card** (237 lines). Contains a 2x2 Animated grid PLUS a quick-stats bar below. Split the quick-stats bar into its own sub-component `AnalyticsQuickStatsBar` to keep files under 500 lines. Also duplicates several styles with AnalyticsOverview elsewhere — audit `styles.analyticsCardGradient` usage.

### 20. StorePerformanceCard — L
- Reads: `storePerformance: StorePerformance[]`
- Callbacks: `router.push('/stores/:id/details')`, `router.push('/stores')`
- Landmines: 120+ lines of JSX per-store with 3 conditional status pills. Heavy animation. Consider splitting per-store row into `StorePerformanceRow` sub-component.

### 26. QuickActionsPremiumGrid — M
- Reads: none
- Callbacks: 9 router.push destinations (stays internal)
- Landmines: near-duplicate of #16 (QuickActionGridCard). Flag for product: do we need two action grids? **Do not merge them in Sprint -1a.** Note the duplication and defer.

### 27. CustomerPaymentsCard — M
- Reads: `customerPayments: CustomerPayment[]`
- Callbacks: router.push('/(dashboard)/payments'), router.push('/orders/:id')

### 28. RecentActivityCard — M
- Reads: `overview: DashboardOverview | null`
- Closures: `formatCurrency`
- Landmines: contains a local `getStatusColor(status)` helper defined **inside** the `.map` (lines 2203-2218). Lift to a util during extraction.

---

## 4. Render-time side-effects check (§5 of the task)

Grepped the return tree for state setters and external mutations:
- `maybeRequestReview(transformedMetrics.completedOrders)` at **line 183** — lives inside `fetchDashboardData`, NOT inside render. Safe.
- No `setXxx(...)` calls inside JSX.
- No direct context mutations inside JSX.
- No `router.replace` or navigation inside JSX (only inside `useEffect` and onPress).

**Verdict:** **no card mutates store/context state as a render side-effect.** All 21 inline cards are safe to extract in one sprint from this axis. The only soft blocker is the "name collision" (card #12) and the shared-style coupling (cards #17, #19, #20).

---

## 5. `DASHBOARD_CARDS` config shape

```ts
// rez-app-merchant/components/dashboard/cards/config.ts
import type { ComponentType } from 'react';
import type { BusinessVertical, MerchantMode } from '@/utils/verticalFeatures';

export interface DashboardCardProps {
  // Each card receives the full dashboard data slice it needs. The shell
  // owns fetching; cards are pure renderers. Unused fields are ignored.
  metrics: DashboardMetrics | null;
  overview: DashboardOverview | null;
  todayRevenue: TodayRevenueMetrics | null;
  topItemsToday: TopItemToday[];
  campaignPerformance: CampaignPerformance[];
  customerRetention: CustomerRetentionMetrics | null;
  basketTrend: BasketSizeTrend | null;
  customerPayments: CustomerPayment[];
  storePerformance: StorePerformance[];
  actionItems: ActionItem[];
  healthData: HealthScoreData | null;
  recommendations: Recommendation[];
  isLoading: boolean;
  dashboardError: string | null;
  onRetry: () => void;
}

export interface DashboardCardConfig {
  /** Stable id used as React key and for analytics/telemetry. */
  id: string;
  /** The extracted component. Must accept DashboardCardProps. */
  component: ComponentType<DashboardCardProps>;
  /** Which merchant modes this card appears in. */
  modes: Array<MerchantMode>;           // 'simple' | 'growth' | 'advanced'
  /** Optional vertical gating. Omit = all verticals. */
  verticals?: BusinessVertical[];
  /** Optional guard: return false to suppress even when modes/verticals match. */
  shouldRender?: (props: DashboardCardProps) => boolean;
}

export const DASHBOARD_CARDS: DashboardCardConfig[] = [
  { id: 'error-banner',         component: ErrorBannerCard,          modes: ['simple','growth','advanced'], shouldRender: (p) => !!p.dashboardError },
  { id: 'store-suspension',     component: StoreSuspensionBanner,    modes: ['simple','growth','advanced'] },
  { id: 'store-inactive',       component: StoreInactiveBanner,      modes: ['simple','growth','advanced'] },
  { id: 'daily-command-bar',    component: DailyCommandBarCard,      modes: ['growth','advanced'] },
  { id: 'header',               component: DashboardHeaderCard,      modes: ['simple','growth','advanced'] },
  { id: 'today-at-a-glance',    component: TodayAtAGlanceCard,       modes: ['simple','growth','advanced'] },
  { id: 'rendez-bookings',      component: RendezBookingsCard,       modes: ['growth','advanced'] },
  { id: 'health-score',         component: StoreHealthScoreCard,     modes: ['growth','advanced'],           shouldRender: (p) => !!p.healthData },
  { id: 'ai-recommendations',   component: AIRecommendationsCard,    modes: ['growth','advanced'],           shouldRender: (p) => p.recommendations.length > 0 },
  { id: 'todays-highlights',    component: TodaysHighlightsStrip,    modes: ['simple','growth','advanced'] },
  { id: 'monthly-story',        component: MonthlyStoryCard,         modes: ['simple','growth','advanced'],  shouldRender: (p) => !!p.metrics },
  { id: 'today-revenue-roi',    component: TodayRevenueROICard,      modes: ['growth','advanced'],           shouldRender: (p) => !!p.todayRevenue },
  { id: 'top-items-today',      component: TopItemsTodayCard,        modes: ['growth','advanced'],           shouldRender: (p) => p.topItemsToday.length > 0 },
  { id: 'customer-return-rate', component: CustomerReturnRateCard,   modes: ['growth','advanced'],           shouldRender: (p) => !!p.customerRetention },
  { id: 'basket-trend',         component: BasketSizeTrendCard,      modes: ['growth','advanced'],           shouldRender: (p) => !!p.basketTrend && p.basketTrend.percentChange !== 0 },
  { id: 'quick-actions-grid',   component: QuickActionGridCard,      modes: ['simple','growth','advanced'] },
  { id: 'action-items',         component: ActionItemsCard,          modes: ['simple','growth','advanced'],  shouldRender: (p) => p.actionItems.length > 0 },
  { id: 'campaigns-roi',        component: CampaignROICard,          modes: ['growth','advanced'],           shouldRender: (p) => p.campaignPerformance.length > 0 },
  { id: 'analytics-overview',   component: AnalyticsOverviewCard,    modes: ['advanced'] },
  { id: 'store-performance',    component: StorePerformanceCard,     modes: ['advanced'],                    shouldRender: (p) => p.storePerformance.length > 0 },
  { id: 'budget-gauge',         component: BudgetGaugeCard,          modes: ['growth','advanced'],           shouldRender: (p) => !!p.metrics },
  { id: 'demand-intelligence',  component: DemandIntelligenceCard,   modes: ['growth','advanced'] },
  { id: 'rez-attribution',      component: REZAttributionCard,       modes: ['growth','advanced'] },
  { id: 'today-revenue-widget', component: TodayRevenueWidget,       modes: ['advanced'] },
  { id: 'rez-now-analytics',    component: RezNowAnalyticsCard,      modes: ['advanced'] },
  { id: 'quick-actions-premium',component: QuickActionsPremiumGrid,  modes: ['simple','growth','advanced'] },
  { id: 'customer-payments',    component: CustomerPaymentsCard,     modes: ['growth','advanced'],           shouldRender: (p) => p.customerPayments.length > 0 },
  { id: 'recent-activity',      component: RecentActivityCard,       modes: ['simple','growth','advanced'] },
];
```

Vertical gating is intentionally absent in v1 — wire `verticals` in Sprint -1c once product owns the matrix.

### Shell render loop (post-extraction sketch)

```tsx
return (
  <View style={[styles.container, { paddingTop: insets.top }]}>
    <LinearGradient ... />
    <ScrollView ...>
      {DASHBOARD_CARDS
        .filter(c => c.modes.includes(mode))
        .filter(c => !c.verticals || c.verticals.includes(vertical))
        .filter(c => !c.shouldRender || c.shouldRender(cardProps))
        .map(c => <c.component key={c.id} {...cardProps} />)}
    </ScrollView>
  </View>
);
```

---

## 6. Execution checklist (Sprint -1b, not -1a)

1. Create `rez-app-merchant/utils/dashboardFormatters.ts` with `formatCurrency`, `formatPercentage`, `formatNumber`.
2. Create `rez-app-merchant/components/dashboard/cards/` dir + one file per card in §2.
3. Extract each card verbatim (no refactor beyond pulling formatters).
4. Create `cards/config.ts` with the `DASHBOARD_CARDS` array above.
5. Replace body of `DashboardScreen` with the render loop in §5.
6. Delete dead-code (`loadAnalytics` destructure, `MetricCardItem`, `QuickActionButton`).
7. Run smoke test in `__tests__/dashboard-smoke.test.tsx`.
8. Manually verify against simulator screenshot set.

---

## 7. Known deferred decisions (NOT in -1a)

- Should `QuickActionGridCard` + `QuickActionsPremiumGrid` be merged? Product review needed.
- Should the "Today Visits" cell in `TodayAtAGlanceCard` keep the `pendingOrders` fallback? Flag says no.
- Should cards subscribe to `useDashboardRealTime()` directly, or keep the shell-pipes-down model? Keep shell for -1b; revisit when we have real perf data.
- Should `DailyCommandBar` move below `ScrollView` (currently sticky above it)? No — that's a behavioural change, not an extraction.
