'use client';

import { useState, useEffect } from 'react';
import Dashboard from '@/components/Dashboard';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { mockPipelineData, mockDealActivities, mockSignals, mockForecast } from '@/lib/mockData';

export default function Home() {
  const [activeView, setActiveView] = useState<'overview' | 'deals' | 'pipeline' | 'signals' | 'accounts'>('overview');
  const [tenantId] = useState('demo-tenant');

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Dashboard
            activeView={activeView}
            pipelineData={mockPipelineData}
            dealActivities={mockDealActivities}
            signals={mockSignals}
            forecast={mockForecast}
          />
        </main>
      </div>
    </div>
  );
}
