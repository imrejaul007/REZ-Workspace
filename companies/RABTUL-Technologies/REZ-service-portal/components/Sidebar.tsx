'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Server,
  Heart,
  BarChart3,
  FileText,
  Settings,
  Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: <LayoutDashboard size={20} /> },
  { label: 'Services', href: '/services', icon: <Server size={20} /> },
  { label: 'Health', href: '/health', icon: <Heart size={20} /> },
  { label: 'Metrics', href: '/metrics', icon: <BarChart3 size={20} /> },
  { label: 'Docs', href: '/docs', icon: <FileText size={20} /> },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-surface-700 bg-surface-900/95 backdrop-blur-sm">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-surface-700 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500">
            <span className="text-lg font-bold text-white">R</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">Service Portal</h1>
            <p className="text-xs text-slate-400">REZ Ecosystem</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                isActive(item.href)
                  ? 'bg-brand-500/10 text-brand-400'
                  : 'text-slate-400 hover:bg-surface-800 hover:text-white'
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-surface-700 p-4">
          <div className="rounded-lg bg-surface-800 p-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              <span>Gateway: localhost:4080</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Demo Mode Active</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
