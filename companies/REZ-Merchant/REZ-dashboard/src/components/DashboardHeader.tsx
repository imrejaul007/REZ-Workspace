'use client';

import { useState, useEffect } from 'react';
import { Bell, Search, User } from 'lucide-react';

export default function DashboardHeader() {
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }));
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-dark-200/80 backdrop-blur-lg border-b border-slate-800">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">R</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">REZ Platform</h1>
              <p className="text-slate-500 text-xs">{currentDate || 'Loading...'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search analytics..."
              className="pl-10 pr-4 py-2 bg-dark-100 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 w-64 transition-all"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-dark-100 transition-colors">
            <Bell className="w-5 h-5 text-slate-400" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* User */}
          <div className="flex items-center gap-3 pl-4 border-l border-slate-700">
            <div className="text-right hidden sm:block">
              <p className="text-white text-sm font-medium">Admin User</p>
              <p className="text-slate-500 text-xs">Super Admin</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
