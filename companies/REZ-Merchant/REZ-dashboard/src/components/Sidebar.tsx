'use client';

import {
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  Target,
  DollarSign,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
  PieChart,
} from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: Activity, label: 'Real-time', active: false },
  { icon: BarChart3, label: 'Analytics', active: false },
  { icon: TrendingUp, label: 'Trends', active: false },
  { icon: Target, label: 'Campaigns', active: false },
  { icon: DollarSign, label: 'Revenue', active: false },
  { icon: Users, label: 'Users', active: false },
  { icon: PieChart, label: 'Reports', active: false },
];

const bottomItems = [
  { icon: Settings, label: 'Settings' },
];

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 h-screen bg-dark-200 border-r border-slate-800 transition-all duration-300 z-50 flex flex-col',
        isOpen ? 'w-64' : 'w-20'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        <div className={clsx('flex items-center gap-3', !isOpen && 'justify-center w-full')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xl">R</span>
          </div>
          {isOpen && (
            <span className="text-white font-bold text-xl gradient-text">REZ</span>
          )}
        </div>
        <button
          onClick={onToggle}
          className={clsx(
            'p-1.5 rounded-lg hover:bg-dark-100 transition-colors text-slate-400',
            !isOpen && 'hidden'
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Toggle Button when collapsed */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="absolute -right-3 top-20 p-1.5 rounded-full bg-dark-200 border border-slate-700 hover:bg-dark-100 transition-colors text-slate-400"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.label}
            className={clsx(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
              item.active
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                : 'text-slate-400 hover:bg-dark-100 hover:text-white'
            )}
          >
            <item.icon className={clsx('w-5 h-5 flex-shrink-0', item.active && 'text-primary-400')} />
            {isOpen && <span className="font-medium">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Bottom items */}
      <div className="py-4 px-3 border-t border-slate-800 space-y-1">
        {bottomItems.map((item) => (
          <button
            key={item.label}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-dark-100 hover:text-white transition-all"
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {isOpen && <span className="font-medium">{item.label}</span>}
          </button>
        ))}
      </div>

      {/* Collapse hint */}
      {isOpen && (
        <div className="px-4 pb-4">
          <p className="text-slate-600 text-xs">v1.0.0 - Analytics Dashboard</p>
        </div>
      )}
    </aside>
  );
}
