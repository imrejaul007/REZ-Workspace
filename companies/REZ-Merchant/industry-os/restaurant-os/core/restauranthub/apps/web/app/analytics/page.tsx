'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import AnalyticsDashboard from '@/components/analytics/analytics-dashboard';
import { useAuth } from '@/lib/auth/auth-provider';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '3m' | '1y'>('30d');

  return (
    <DashboardLayout>
      <AnalyticsDashboard
        userRole={user?.role as unknown || 'restaurant'}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
      />
    </DashboardLayout>
  );
}
