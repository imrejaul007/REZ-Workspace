'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Kanban,
  FileText,
  FileSignature,
  Key,
  ChevronLeft,
  ChevronRight,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/lib/store';
import { ScrollArea } from '@/components/ui/scroll-area';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pipeline', label: 'Pipeline', icon: Kanban },
  { href: '/deals', label: 'Deals', icon: FileText },
  { href: '/agreements', label: 'Agreements', icon: FileSignature },
  { href: '/handovers', label: 'Handovers', icon: Key },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-card border-r transition-all duration-300',
        sidebarOpen ? 'w-64' : 'w-20'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            {sidebarOpen && (
              <span className="font-bold text-lg">RisnaEstate</span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8"
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t">
          {sidebarOpen ? (
            <p className="text-xs text-muted-foreground text-center">
              Deal Pipeline v1.0.0
            </p>
          ) : (
            <div className="flex justify-center">
              <div className="h-2 w-2 rounded-full bg-primary" />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
