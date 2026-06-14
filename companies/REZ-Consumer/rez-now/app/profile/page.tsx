import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import ProfileClient from './ProfileClient';

export const metadata: Metadata = {
  title: 'My Profile — REZ Now',
  description: 'View and manage your REZ Now profile.',
};

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const rezAuthCookie = cookieStore.get('rez-auth');
  if (rezAuthCookie) {
    try {
      const parsed = JSON.parse(rezAuthCookie.value);
      if (parsed?.state?.isLoggedIn === false) {
        redirect('/?login=1');
      }
    } catch {
      // Malformed cookie — let client handle redirect
    }
  }

  return <ProfileClient />;
}
