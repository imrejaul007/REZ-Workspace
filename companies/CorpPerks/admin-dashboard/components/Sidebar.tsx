'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  Shield,
  FileText,
  Bell,
  HelpCircle,
  ChevronDown,
  Building2,
  Wallet,
  Calendar,
  Award,
  GraduationCap,
  BookOpen,
  Target,
  Workflow,
  UserPlus,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navigationGroups: NavGroup[] = [
  {
    title: 'Main',
    items: [
      {
        title: 'Dashboard',
        href: '/',
        icon: LayoutDashboard,
      },
      {
        title: 'Employees',
        href: '/employees',
        icon: Users,
        badge: '134',
      },
      {
        title: 'Analytics',
        href: '/analytics',
        icon: BarChart3,
      },
    ],
  },
  {
    title: 'Modules',
    items: [
      {
        title: 'Payroll',
        href: '/payroll',
        icon: Wallet,
      },
      {
        title: 'Attendance',
        href: '/attendance',
        icon: Calendar,
      },
      {
        title: 'Leave',
        href: '/leave',
        icon: FileText,
        badge: '12',
        badgeColor: 'warning',
      },
      {
        title: 'Performance',
        href: '/performance',
        icon: Award,
      },
      {
        title: 'Training',
        href: '/training',
        icon: GraduationCap,
      },
      {
        title: 'Documents',
        href: '/documents',
        icon: BookOpen,
      },
      {
        title: 'OKRs',
        href: '/okrs',
        icon: Target,
      },
      {
        title: 'Workflows',
        href: '/workflows',
        icon: Workflow,
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        title: 'Audit Logs',
        href: '/audit',
        icon: Shield,
      },
      {
        title: 'Settings',
        href: '/settings',
        icon: Settings,
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-600">
          <Building2 className="h-6 w-6 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900">CorpPerks</span>
          <span className="text-xs text-gray-500">Admin Dashboard</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-hide">
        {navigationGroups.map((group, groupIndex) => (
          <div
            key={group.title}
            className={cn(
              'mb-6',
              groupIndex < navigationGroups.length - 1 && 'border-b border-gray-100 pb-6'
            )}
          >
            <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
              {group.title}
            </h3>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <Icon
                          className={cn(
                            'h-5 w-5',
                            isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'
                          )}
                        />
                        {item.title}
                      </span>
                      {item.badge && (
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-medium',
                            item.badgeColor === 'warning'
                              ? 'bg-warning-100 text-warning-700'
                              : 'bg-gray-100 text-gray-600'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-3">
        <div className="rounded-lg bg-gray-50 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-500 text-sm font-medium text-white">
              KI
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">Kavya Iyer</p>
              <p className="text-xs text-gray-500 truncate">HR Manager</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-50">
              <HelpCircle className="h-3.5 w-3.5" />
              Help
            </button>
            <button className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-danger-600 shadow-sm transition-colors hover:bg-danger-50">
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
