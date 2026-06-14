'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Puzzle,
  Key,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  Shield,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Tenants', href: '/tenants', icon: Building2 },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Billing', href: '/billing', icon: CreditCard },
  { name: 'Modules', href: '/modules', icon: Puzzle },
  { name: 'API Keys', href: '/api-keys', icon: Key },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300 flex flex-col ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo Section */}
      <div className="flex items-center h-16 px-4 border-b border-gray-200">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-900">CorpPerks</span>
              <span className="text-xs text-gray-500">Super Admin</span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon
                className={`w-5 h-5 flex-shrink-0 ${
                  isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'
                }`}
              />
              {!collapsed && (
                <span className="font-medium text-sm">{item.name}</span>
              )}
              {collapsed && (
                <div className="absolute left-20 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="px-3 py-4 border-t border-gray-200 space-y-1">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 group ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <Settings className="w-5 h-5 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
          {!collapsed && <span className="font-medium text-sm">Settings</span>}
        </Link>
        <button
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 w-full group ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-600 flex-shrink-0" />
          {!collapsed && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-gray-400" />
        )}
      </button>
    </aside>
  );
}
