'use client';

import { useState } from 'react';
import { Search, Bell, RefreshCw, ChevronDown } from 'lucide-react';
import { chatSessions } from '@/lib/mock-data';

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const activeChats = chatSessions.filter((s) => s.status === 'active').length;

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tickets, employees, knowledge base..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Active Chats Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-green-700">
            {activeChats} Active Chats
          </span>
        </div>

        {/* Refresh */}
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <RefreshCw className="w-5 h-5 text-gray-500" />
        </button>

        {/* Notifications */}
        <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-gray-500" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Quick Actions */}
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <span>New Ticket</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
