# PreferencesContext — Integration Guide

The `PreferencesContext` owns device-scoped merchant UX preferences that persist
across sessions without belonging to the authenticated backend profile:

- `merchantMode` — Simple / Growth / Advanced feature filter
- `dismissedActions` — Growth-prompt dismissals with reason (LRU-trimmed to 100)
- `lastSeenGrowthActionsAt` — drives the unread dot on the Growth tab
- `goalTabLastViewed` — remembers which Goal sub-tab the merchant last opened
- `identityCaptureMode` — POS "require customer identity before Pay" toggle

Storage key: `@rez_merchant_preferences`. Writes are debounced 500ms; reads are
corruption-safe (malformed JSON falls back to defaults).

## 1. Wire the Provider into `app/_layout.tsx`

Add the provider inside the existing provider stack. Place it **outside**
`MerchantProvider` / `StoreProvider` (preferences are device-scoped, not
merchant-session-scoped) but **inside** `AuthProvider` so it can later be
scoped per-merchant if we decide to key storage by merchant id.

```tsx
// app/_layout.tsx
import { PreferencesProvider } from '@/contexts/PreferencesContext';

// ... inside the provider stack:
<AuthProvider>
  <PreferencesProvider>
    <SocketProvider>
      <MerchantProvider>
        <StoreProvider>
          <NotificationProvider>
            {/* app content */}
          </NotificationProvider>
        </StoreProvider>
      </MerchantProvider>
    </SocketProvider>
  </PreferencesProvider>
</AuthProvider>
```

During the very first render after app launch the hook exposes `isHydrated:
false`. Screens that gate visibility on the mode (see §2) should treat the
pre-hydration moment as Simple mode (the safest default) or render a skeleton —
do **not** render the Advanced-only UI and then snap it away.

## 2. Which screens need `useMerchantMode()`

Any screen whose feature set is filtered by `getVisibleFeatures()` /
`isFeatureVisibleForVertical()` in `utils/verticalFeatures.ts` should consult
the mode. Known integration points:

| Screen / surface | Why it reads the mode |
|---|---|
| `app/(tabs)/index.tsx` — Dashboard | Hide Growth-only cards (broadcast, loyalty) when `simple`. |
| `app/(tabs)/_layout.tsx` — Tab bar | Filter tabs against `getVisibleFeatures(vertical, mode)`. |
| `app/(tabs)/analytics.tsx` | Analytics is Growth+ only; hide or soft-lock in Simple. |
| `app/marketing/*` — Campaigns / Broadcast | Growth+ only. |
| `app/reports/*` | Advanced only. |
| `app/team/*` | Advanced only for Restaurant/Grocery; Simple for Salon. |
| `app/settings/mode-selector.tsx` (new) | Setter UI — writes the mode via `setMode`. |

Pattern:

```tsx
import { useMerchantMode } from '@/contexts/PreferencesContext';
import { isFeatureVisibleForVertical } from '@/utils/verticalFeatures';

const { mode } = useMerchantMode();
if (!isFeatureVisibleForVertical('analytics', merchant.businessCategory, mode)) {
  return <LockedFeatureStub upgradeTo="growth" />;
}
```

## 3. POS Pay button reads `useIdentityCaptureMode()`

The POS checkout flow (`app/pos/index.tsx` / its Pay component) must consult
`useIdentityCaptureMode()` before allowing the order to be charged:

```tsx
import { useIdentityCaptureMode } from '@/contexts/PreferencesContext';

function PayButton({ cart, customer }: Props) {
  const { mode } = useIdentityCaptureMode();

  const canPay = mode === 'optional' || Boolean(customer?.phone || customer?.email);

  return (
    <Button
      disabled={!canPay}
      onPress={handlePay}
      label={canPay ? 'Charge' : 'Add customer to continue'}
    />
  );
}
```

Merchants toggle the requirement from Settings → POS → "Require customer
identity before Pay". The setter is `setMode('required' | 'optional')` from the
same hook.

## 4. Dismissing a Growth action

The Growth/Actions surface (wherever growth prompts are rendered) should call
`useDismissAction()` and supply a **unique instanceId per surfaced occurrence**
(UUID). The hook intentionally does not own ID generation so the UI can
correlate the dismissal with the specific card it rendered.

```tsx
import { v4 as uuidv4 } from 'uuid';
import { useDismissAction, useDismissedActions } from '@/contexts/PreferencesContext';

const dismiss = useDismissAction();
const dismissed = useDismissedActions();

// Filter the candidate list against dismissed rules:
const visible = candidates.filter(
  (a) => !dismissed.some((d) => d.actionId === a.id)
);

// On dismissal:
dismiss(action.id, uuidv4(), 'not_relevant');
// or with free-text note:
dismiss(action.id, uuidv4(), 'other', 'Seasonal — revisit in Q3');
```

The list is LRU-trimmed to 100 entries automatically.
