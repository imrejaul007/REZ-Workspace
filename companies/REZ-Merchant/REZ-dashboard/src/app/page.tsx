'use client';

import { useState, useEffect } from 'react';
import DashboardHeader from '@/components/DashboardHeader';
import Sidebar from '@/components/Sidebar';
import MetricsGrid from '@/components/MetricsGrid';
import RealtimeMetrics from '@/components/RealtimeMetrics';
import FunnelChart from '@/components/FunnelChart';
import CampaignChart from '@/components/CampaignChart';
import RevenueChart from '@/components/RevenueChart';
import { generateRealtimeMetric } from '@/lib/mock-data';
import { RealtimeMetric } from '@/types';

function DashboardSkeleton() {
  return (
    <div className="animate-pulse p-6 space-y-6">
      <div className="h-10 bg-slate-800 rounded w-1/3 mb-8" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-800 rounded-xl" />
        ))}
      </div>
      <div className="h-64 bg-slate-800 rounded-xl" />
      <div className="grid grid-cols-2 gap-6">
        <div className="h-64 bg-slate-800 rounded-xl" />
        <div className="h-64 bg-slate-800 rounded-xl" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [realtimeMetrics, setRealtimeMetrics] = useState<RealtimeMetric[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial data load
    const loadData = async () => {
      try {
        // Initialize real-time metrics
        const initialMetrics: RealtimeMetric[] = [
          generateRealtimeMetric('active_users'),
          generateRealtimeMetric('page_views'),
          generateRealtimeMetric('orders'),
          generateRealtimeMetric('revenue_live'),
          generateRealtimeMetric('cart_abandonment'),
          generateRealtimeMetric('avg_session'),
        ];
        setRealtimeMetrics(initialMetrics);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Update metrics every 5 seconds
    const interval = setInterval(() => {
      setRealtimeMetrics((prev) =>
        prev.map((metric) => ({
          ...metric,
          ...generateRealtimeMetric(metric.id),
          timestamp: new Date(),
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            <DashboardHeader />

            <div className="p-6 space-y-6">
              {/* Page Title */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
                <p className="text-slate-400 mt-1">
                  Real-time platform performance and insights
                </p>
              </div>

              {/* Key Metrics */}
              <section>
                <h2 className="text-xl font-semibold text-white mb-4">Key Metrics</h2>
                <MetricsGrid />
              </section>

              {/* Real-time Metrics */}
              <section>
                <h2 className="text-xl font-semibold text-white mb-4">
                  Real-time Activity
                  <span className="ml-3 inline-flex items-center gap-2 px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-sm font-medium">
                    <span className="w-2 h-2 bg-primary-400 rounded-full live-indicator" />
                    Live
                  </span>
                </h2>
                <RealtimeMetrics metrics={realtimeMetrics} />
              </section>

              {/* Main Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <div className="chart-container">
                  <h3 className="text-lg font-semibold text-white mb-4">Revenue Trend</h3>
                  <RevenueChart />
                </div>

                {/* Funnel Visualization */}
                <div className="chart-container">
                  <h3 className="text-lg font-semibold text-white mb-4">Conversion Funnel</h3>
                  <FunnelChart />
                </div>
              </div>

              {/* Campaign Performance */}
              <section>
                <h2 className="text-xl font-semibold text-white mb-4">Campaign Performance</h2>
                <CampaignChart />
              </section>

              {/* Footer */}
              <footer className="text-center text-slate-500 py-8 border-t border-slate-800">
                <p>REZ Analytics Platform - Real-time insights powered by data</p>
              </footer>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
