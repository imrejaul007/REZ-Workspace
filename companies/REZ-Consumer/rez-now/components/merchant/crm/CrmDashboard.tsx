'use client';

import { useState } from 'react';
import CustomerSegments from './CustomerSegments';
import CustomerList from './CustomerList';
import AtRiskCustomers from './AtRiskCustomers';
import { cn } from '@/lib/utils/cn';

type Tab = 'overview' | 'customers' | 'at_risk';

interface CrmDashboardProps {
  storeSlug: string;
}

export default function CrmDashboard({ storeSlug }: CrmDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'customers', label: 'All Customers' },
    { id: 'at_risk', label: 'At Risk' },
  ];

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-all',
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview: all three sections stacked */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <CustomerSegments />
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <CustomerList storeSlug={storeSlug} pageSize={5} />
          </div>
          <AtRiskCustomers storeSlug={storeSlug} />
        </div>
      )}

      {/* All customers */}
      {activeTab === 'customers' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <CustomerList storeSlug={storeSlug} pageSize={10} />
        </div>
      )}

      {/* At-risk */}
      {activeTab === 'at_risk' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <AtRiskCustomers storeSlug={storeSlug} />
        </div>
      )}
    </div>
  );
}
