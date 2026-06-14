'use client';

import React from 'react';
import type { TabType } from '@/types';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs: { id: TabType; label: string; icon?: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'requests', label: 'Requests', icon: '📋' },
  { id: 'rooms', label: 'Rooms', icon: '🛏️' },
  { id: 'housekeeping', label: 'Housekeeping', icon: '🧹' },
];

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="flex border-b bg-white rounded-t-lg">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
            activeTab === tab.id
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.icon && <span>{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
