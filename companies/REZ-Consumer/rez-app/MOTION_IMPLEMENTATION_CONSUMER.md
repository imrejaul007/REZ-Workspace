# Motion Implementation Guide — Consumer App (Nuqta)

**Luca Romano** — Motion & Interaction Designer
**Date:** March 23, 2026

---

## New Components Added

### 1. `components/ui/AnimatedPressable.tsx`
Universal button wrapper with spring feedback.

**Quick Start:**
```tsx
import AnimatedPressable from '@/components/ui/AnimatedPressable';

<AnimatedPressable
  onPress={handlePress}
  haptic
  hapticType="light"
>
  <Text>Tap me</Text>
</AnimatedPressable>
```

**Props:**
- `haptic?: boolean` — Enable haptic feedback (default: false)
- `hapticType?: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'`
- `android_ripple?: {color, borderless, radius}` — Android ripple config
- Inherits all standard Pressable props

**Performance:** ~60fps, useNativeDriver optimized

---

### 2. `components/wallet/CoinBalanceAnimated.tsx`
Displays coin balance with spring scale animation on earn events.

**Quick Start:**
```tsx
import CoinBalanceAnimated from '@/components/wallet/CoinBalanceAnimated';

<CoinBalanceAnimated
  balance={userCoins}
  previousBalance={previousCoins}
  symbol="₹"
  label="Nuqta Coins"
  color="#10b981"
/>
```

**Props:**
- `balance: number` — Current balance
- `previousBalance?: number` — Previous balance (for detecting increases)
- `symbol?: string` — Currency symbol (default: '')
- `label?: string` — Display label (default: 'Coins')
- `fontSize?: number` — Balance text size (default: 28)
- `labelFontSize?: number` — Label text size (default: 12)
- `color?: string` — Text color
- `onAnimationComplete?: () => void` — Callback after animation

**Behavior:**
- Automatically detects balance increases
- Triggers 1.0 → 1.2 → 1.0 spring animation
- Haptic feedback on earn event
- Auto-scales down after 500ms

---

### 3. `components/animations/SuccessCheckmark.tsx`
Animated checkmark for success screens.

**Quick Start:**
```tsx
import SuccessCheckmark from '@/components/animations/SuccessCheckmark';

<SuccessCheckmark
  size={64}
  color="#10b981"
  duration={600}
/>
```

**Props:**
- `size?: number` — Icon size in px (default: 64)
- `color?: string` — Icon/circle color
- `duration?: number` — Total animation duration in ms (default: 600)
- `strokeWidth?: number` — SVG stroke width (default: 2.5)
- `onAnimationComplete?: () => void` — Callback after animation

**Sequence:**
1. Checkmark draws in (0 → 100% stroke) — 400ms
2. Scale pop (0.5 → 1.1 → 1) — simultaneous
3. Auto-dismiss fade + scale down — after `duration` ms

---

## Integration Checklist

### Phase 1: Button Feedback (2-4 hours)
Target: Replace bare Pressable components in main user flows

**Screens to update:**
1. `(tabs)/index.tsx` — Header buttons (location pill, streak button, notification button)
   ```tsx
   // Before:
   <Pressable onPress={handlePress} style={styles.button}>

   // After:
   <AnimatedPressable onPress={handlePress} haptic>
   ```

2. `wallet-screen.tsx` — Quick action buttons (recharge, refer, etc.)

3. `cart.tsx` — Checkout buttons, quantity adjusters

4. Key components:
   - `components/experience/PremiumStoreCard.tsx` — Visit button
   - `components/category-pages/HomeServicesCategoryPage.tsx` — Filter chips, rewards button

**Testing Checklist:**
- [ ] Button feedback visible within 100ms of tap
- [ ] Haptic triggers on tap
- [ ] Android ripple appears
- [ ] No jank during scroll while button animating

---

### Phase 2: Coin Animations (2-3 hours)
Target: Celebrate when users earn coins

**Screens to update:**
1. `wallet-screen.tsx` — Replace balance Text with CoinBalanceAnimated
   ```tsx
   // In wallet display:
   <CoinBalanceAnimated
     balance={walletData.rezCoins}
     previousBalance={previousCoinsRef.current}
     color={colors.successScale[400]}
   />
   ```

2. `(tabs)/index.tsx` — Coin balance in header
   ```tsx
   <CoinBalanceAnimated
     balance={userBalance}
     fontSize={16}
     labelFontSize={10}
   />
   ```

3. `payment-success.tsx` — Coins earned display
   ```tsx
   const [coinsEarned, setCoinsEarned] = useState(0);
   <CoinBalanceAnimated
     balance={coinsEarned}
     previousBalance={0}
     label="Coins Earned"
     onAnimationComplete={() => {
       // Trigger reward popup here
       showCoinsEarned(coinsEarned);
     }}
   />
   ```

**Testing Checklist:**
- [ ] Animation triggers only on balance increase
- [ ] 1.2x scale bounce looks smooth
- [ ] Haptic plays on earn
- [ ] Works with rapid balance updates (referral bonus scenarios)

---

### Phase 3: Success Screen Animations (3-4 hours)
Target: Add celebratory feeling to important moments

**Screens to update:**
1. `payment-success.tsx`
   ```tsx
   import SuccessCheckmark from '@/components/animations/SuccessCheckmark';

   <View style={styles.centerContent}>
     <SuccessCheckmark size={80} color={colors.successScale[400]} />
     <ThemedText variant="heading">Payment Successful</ThemedText>
   </View>
   ```

2. `deal-success.tsx` — Similar pattern

3. `flash-sale-success.tsx` — Similar pattern

4. `onboarding/verification-success.tsx` — Account verified celebration

5. `pay-in-store/success.tsx` — QR code payment success

**Testing Checklist:**
- [ ] Checkmark animation completes smoothly
- [ ] Auto-dismiss timing feels natural (600-800ms)
- [ ] Works on all screen sizes
- [ ] Web/iOS/Android all render correctly

---

## Performance Optimization

### Memory
- All components use `React.memo()` to prevent unnecessary re-renders
- Animations use `useSharedValue` (not state) to avoid render cycles

### CPU
- `useNativeDriver: true` on all Animated.View transforms
- Spring damping values optimized for 60fps (damping: 6-10)

### Bundle Size
- AnimatedPressable: ~2KB (minified)
- CoinBalanceAnimated: ~3KB
- SuccessCheckmark: ~4KB
- Total impact: < 10KB gzip

---

## Haptic Feedback Configuration

Current haptic triggers:
- `AnimatedPressable`: `ImpactFeedbackStyle.Light` by default
- `CoinBalanceAnimated`: `NotificationFeedbackType.Success` on earn
- `SuccessCheckmark`: `NotificationFeedbackType.Success` on mount

**To customize:**
```tsx
<AnimatedPressable haptic hapticType="heavy">
```

---

## Troubleshooting

**Issue:** Animation jank during scroll
- **Cause:** Component re-renders while animation running
- **Fix:** Wrap in `React.memo()` and use callback refs for onPress handlers

**Issue:** Haptic not triggering on iOS
- **Cause:** App needs microphone permission for haptics
- **Fix:** Already handled in app — verify at runtime with try/catch (already in place)

**Issue:** Balance animation doesn't trigger
- **Cause:** `previousBalance` prop not tracking state correctly
- **Fix:** Ensure parent component maintains previous balance in ref or state

---

## Next Steps

1. **Merge these components** into your main branch
2. **Run test suite** to ensure no regressions
3. **A/B test** button feedback (test group gets haptics, control doesn't)
4. **Measure retention** — users who see celebratory animations tend to return more
5. **Iterate** based on user feedback (especially animation duration preferences)

---

## References

- React Native Reanimated docs: https://docs.swmansion.com/react-native-reanimated
- Expo Haptics: https://docs.expo.dev/modules/expo-haptics
- Material Design: https://m3.material.io/components
- Animation best practices: https://www.nngroup.com/articles/animation-timing/

---

**Questions?** Contact Luca Romano (REZ Motion & Interaction Designer)
