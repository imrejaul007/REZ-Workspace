'use client';

import { LayoutDashboard, Target, TrendingUp, Users, Activity, FileText, Bell, Settings } from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: 'overview' | 'deals' | 'pipeline' | 'signals' | 'accounts') => void;
}

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'pipeline', label: 'Pipeline', icon: Target },
  { id: 'deals', label: 'Deals', icon: TrendingUp },
  { id: 'signals', label: 'Signals', icon: Activity },
  { id: 'accounts', label: 'Accounts', icon: Users },
];

export default function Sidebar({ activeView, setActiveView }: SidebarProps) {
  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            R
          </div>
          REZ Revenue OS
        </h1>
        <p className="text-xs text-slate-400 mt-1">B2B Sales Intelligence</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveView(item.id as typeof activeView)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    activeView === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Alerts */}
      <div className="p-4 border-t border-slate-700">
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium">3 Alerts</span>
          </div>
          <p className="text-xs text-slate-400">2 high-intent signals detected</p>
        </div>
      </div>

      {/* Settings */}
      <div className="p-4 border-t border-slate-700">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white transition-colors">
          <Settings className="w-5 h-5" />
          <span className="text-sm">Settings</span>
        </button>
      </div>
    </aside>
  );
}
