'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import api from '@/lib/api';
import { DashboardStats, ClientUser } from '@/types';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<ClientUser | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!api.isAuthenticated()) {
        router.push('/');
        return;
      }

      const [profileRes, dashboardRes] = await Promise.all([
        api.getProfile(),
        api.getDashboard(),
      ]);

      if (!profileRes.success) {
        router.push('/');
        return;
      }

      setUser(profileRes.data as ClientUser);
      setStats(dashboardRes.data as DashboardStats);
      setIsLoading(false);
    };

    loadData();
  }, [router]);

  const handleLogout = () => {
    api.logout();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Failed to load dashboard'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar clientName={user?.companyName} onLogout={handleLogout} />
      <main className="ml-64 p-8">
        <Dashboard stats={stats} />
      </main>
    </div>
  );
}
