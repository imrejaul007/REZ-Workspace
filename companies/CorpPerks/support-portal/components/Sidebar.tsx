'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Ticket,
  MessageSquare,
  BookOpen,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronDown,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Tickets',
    href: '/tickets',
    icon: Ticket,
  },
  {
    name: 'Live Chat',
    href: '/chat',
    icon: MessageSquare,
  },
  {
    name: 'Knowledge Base',
    href: '/knowledge',
    icon: BookOpen,
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: BarChart3,
  },
];

const bottomNav = [
  {
    name: 'Settings',
    href: '#',
    icon: Settings,
  },
  {
    name: 'Help',
    href: '#',
    icon: HelpCircle,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">CorpPerks</h1>
            <p className="text-xs text-gray-500">Support Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Icon className={cn('w-5 h-5', active ? 'text-blue-700' : 'text-gray-500')} />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Nav */}
      <div className="py-4 px-3 border-t border-gray-200">
        <ul className="space-y-1">
          {bottomNav.map((item) => {
            const Icon = item.icon;

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Icon className="w-5 h-5 text-gray-500" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Agent Profile */}
        <div className="mt-4 px-3 py-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium">
              SJ
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">Sarah Johnson</p>
              <p className="text-xs text-gray-500 truncate">Senior Support Agent</p>
            </div>
            <button className="p-1 hover:bg-gray-200 rounded">
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
