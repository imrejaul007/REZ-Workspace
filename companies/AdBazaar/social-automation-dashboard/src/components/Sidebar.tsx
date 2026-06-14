'use client';

import {
  LayoutDashboard,
  Server,
  Settings,
  Activity,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface SidebarProps {
  stats: {
    totalServices: number;
    onlineCount: number;
    offlineCount: number;
  };
}

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Services', href: '/services', icon: Server },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar({ stats }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`flex flex-col h-full bg-slate-900 border-r border-slate-800 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-slate-800">
        <Activity className="w-8 h-8 text-blue-500 flex-shrink-0" />
        {!collapsed && (
          <div className="ml-3 overflow-hidden">
            <h1 className="text-lg font-bold text-white truncate">
              Social Auto
            </h1>
            <p className="text-xs text-slate-400">Dashboard</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="ml-3 font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Stats Summary */}
      {!collapsed && (
        <div className="px-4 py-4 border-t border-slate-800">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Quick Stats
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Total Services</span>
              <span className="text-sm font-semibold text-white">
                {stats.totalServices}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Online</span>
              <span className="text-sm font-semibold text-green-400">
                {stats.onlineCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Offline</span>
              <span className="text-sm font-semibold text-red-400">
                {stats.offlineCount}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-10 border-t border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-5 h-5" />
        ) : (
          <ChevronLeft className="w-5 h-5" />
        )}
      </button>
    </aside>
  );
}
