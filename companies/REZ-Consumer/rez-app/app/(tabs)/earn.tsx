import { withErrorBoundary } from '@/utils/withErrorBoundary';
import { Redirect } from 'expo-router';

// The Earn tab routes to the Play & Earn page.
// Uses Redirect (not useEffect+router.replace) to avoid spinner flash on tab tap.
function EarnScreen() {
  return <Redirect href="/playandearn" />;
}

export default withErrorBoundary(EarnScreen, '(tabs)Earn');
