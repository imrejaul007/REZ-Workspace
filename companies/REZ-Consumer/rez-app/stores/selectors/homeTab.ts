/**
 * Home tab store selectors — 5 imports.
 */

import { useHomeTabStore } from '../homeTabStore';

/** Only re-renders when active tab changes */
export const useActiveTab = () => useHomeTabStore((s: ReturnType<typeof useHomeTabStore.getState>) => s.activeTab);

/** Stable function — never re-renders */
export const useSetActiveTab = () => useHomeTabStore((s: ReturnType<typeof useHomeTabStore.getState>) => s.setActiveTab);

/** Derived booleans */
export const useIsPriveActive = () => useHomeTabStore((s: ReturnType<typeof useHomeTabStore.getState>) => s.isPriveActive);
export const useIsMallActive = () => useHomeTabStore((s: ReturnType<typeof useHomeTabStore.getState>) => s.isMallActive);

/** Only re-renders when prive eligibility changes */
export const usePriveEligibility = () => useHomeTabStore((s: ReturnType<typeof useHomeTabStore.getState>) => s.priveEligibility);

/** Only re-renders when prive eligible status changes */
export const useIsPriveEligible = () => useHomeTabStore((s: ReturnType<typeof useHomeTabStore.getState>) => s.isPriveEligible);

/** Legacy tab ID — only re-renders when active tab changes */
export const useActiveHomeTab = () => useHomeTabStore((s: ReturnType<typeof useHomeTabStore.getState>) => s.activeHomeTab);

/** Stable function — never re-renders */
export const useSetActiveHomeTab = () => useHomeTabStore((s: ReturnType<typeof useHomeTabStore.getState>) => s.setActiveHomeTab);

/** Stable function — never re-renders */
export const useRegisterScrollToTop = () => useHomeTabStore((s: ReturnType<typeof useHomeTabStore.getState>) => s.registerScrollToTop);
