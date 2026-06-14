import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import OrderHistoryClient from './OrderHistoryClient';

export const metadata: Metadata = {
  title: 'My Orders — REZ Now',
  description: 'View all your past orders across every store on REZ Now.',
};

export default async function OrdersPage() {
  const cookieStore = await cookies();
  // Auth state is persisted in zustand under the key "rez-auth" as a cookie/localStorage.
  // For server-side gating we check the NEXT_LOCALE cookie as a lightweight presence
  // check is not available server-side for localStorage. Instead we rely on the client
  // component to redirect if the user is not logged in, but we also do a best-effort
  // check via the rez-auth cookie that Zustand persist writes when running in a context
  // that supports cookies (some environments set it, some don't).
  // Reliable redirect happens client-side in OrderHistoryClient when isLoggedIn === false.
  const rezAuthCookie = cookieStore.get('rez-auth');
  if (rezAuthCookie) {
    try {
      const parsed = JSON.parse(rezAuthCookie.value);
      if (parsed?.state?.isLoggedIn === false) {
        redirect('/?login=1');
      }
    } catch {
      // Malformed cookie — let client handle it
    }
  }

  return <OrderHistoryClient />;
}
