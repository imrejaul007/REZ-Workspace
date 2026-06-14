import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import WalletClient from './WalletClient';

export const metadata: Metadata = {
  title: 'My Wallet — REZ Now',
  description: 'View your REZ Coin balance, tier, and transaction history.',
};

export default async function WalletPage() {
  const cookieStore = await cookies();
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

  return <WalletClient />;
}
