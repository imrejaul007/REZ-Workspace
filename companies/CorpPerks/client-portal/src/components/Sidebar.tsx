'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Receipt,
  MessageSquare,
  FileText,
  User,
  LogOut,
  ChevronRight,
  Building2,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';

interface SidebarProps {
  clientName?: string;
  onLogout?: () => void;
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/invoices', label: 'Invoices', icon: Receipt },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/documents', label: 'Documents', icon: FileText },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function Sidebar({ clientName = 'CorpPerks Client', onLogout }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200 flex flex-col">
      {/* Logo & Brand */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-slate-900 text-lg">Client Portal</h1>
            <p className="text-xs text-slate-500">CorpPerks</p>
          </div>
        </div>
      </div>

      {/* Client Info */}
      <div className="px-4 py-4 mx-3 mt-4 bg-gradient-to-r from-primary-50 to-primary-100/50 rounded-xl border border-primary-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-500 flex items-center justify-center text-white text-sm font-semibold">
            {getInitials(clientName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{clientName}</p>
            <p className="text-xs text-slate-500">Enterprise Client</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <Icon className={cn('w-5 h-5', isActive ? 'text-white' : 'text-slate-400')} />
                {item.label}
                {isActive && (
                  <ChevronRight className="w-4 h-4 ml-auto text-white/70" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
