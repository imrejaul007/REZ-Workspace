'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Briefcase,
  Store,
  Users,
  ShoppingCart,
  BarChart3,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  LogOut,
  User,
  Moon,
  Sun,
  Globe,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/auth/auth-provider';
import { UserRole } from '@/types/auth';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import ErrorBoundary from '@/components/error-boundaries/error-boundary';

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  roles?: UserRole[];
  children?: NavigationItem[];
}

interface EnhancedDashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'jobs',
    label: 'Jobs',
    href: '/jobs',
    icon: Briefcase,
    badge: 'New',
    children: [
      { id: 'browse-jobs', label: 'Browse Jobs', href: '/jobs', icon: Search },
      { id: 'my-applications', label: 'My Applications', href: '/jobs/applications', icon: User, roles: [UserRole.EMPLOYEE] },
      { id: 'my-jobs', label: 'My Job Posts', href: '/restaurant/jobs', icon: Briefcase, roles: [UserRole.RESTAURANT] },
      { id: 'create-job', label: 'Post a Job', href: '/jobs/create', icon: Menu, roles: [UserRole.RESTAURANT] },
    ],
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    href: '/marketplace',
    icon: Store,
    children: [
      { id: 'browse-suppliers', label: 'Browse Suppliers', href: '/marketplace', icon: Store },
      { id: 'my-orders', label: 'My Orders', href: '/marketplace/orders', icon: ShoppingCart },
      { id: 'favorites', label: 'Favorites', href: '/marketplace/favorites', icon: User },
    ],
  },
  {
    id: 'community',
    label: 'Community',
    href: '/community',
    icon: Users,
    badge: 5,
    children: [
      { id: 'discussions', label: 'Discussions', href: '/community', icon: Users },
      { id: 'my-posts', label: 'My Posts', href: '/community/my-posts', icon: User },
      { id: 'create-post', label: 'Create Post', href: '/community/create', icon: Menu },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    roles: [UserRole.RESTAURANT, UserRole.ADMIN],
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

const quickActions = [
  { id: 'search', label: 'Search', icon: Search, shortcut: '⌘K' },
  { id: 'notifications', label: 'Notifications', icon: Bell, badge: 3 },
  { id: 'help', label: 'Help', icon: HelpCircle },
];

function Sidebar({ isOpen, onClose, currentPath }: {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
}) {
  const { user, logout } = useAuth();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const { theme, setTheme } = useTheme();

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const filteredNavigation = navigationItems.filter(item => {
    if (!item.roles) return true;
    return user?.role && item.roles.includes(user.role);
  });

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return currentPath === '/dashboard' || currentPath === '/';
    }
    return currentPath.startsWith(href);
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: isOpen ? 0 : -280 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed left-0 top-0 z-50 h-full w-70 bg-background border-r border-border lg:static lg:z-0 lg:translate-x-0"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <Link href="/dashboard" className="flex items-center space-x-3" onClick={onClose}>
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Home className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">RestoPapa</h1>
                <p className="text-xs text-muted-foreground">Professional</p>
              </div>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.role === UserRole.RESTAURANT ? 'Restaurant Owner' :
                   user?.role === UserRole.EMPLOYEE ? 'Employee' :
                   user?.role === UserRole.VENDOR ? 'Vendor' : 'User'}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Account</DropdownMenuLabel>
                  <DropdownMenuItem>
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                    {theme === 'dark' ? (
                      <Sun className="h-4 w-4 mr-2" />
                    ) : (
                      <Moon className="h-4 w-4 mr-2" />
                    )}
                    {theme === 'dark' ? 'Light' : 'Dark'} Mode
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const isActive = isActiveRoute(item.href);
              const isExpanded = expandedItems.has(item.id);
              const Icon = item.icon;
              const hasChildren = item.children && item.children.length > 0;

              return (
                <div key={item.id}>
                  <div className="relative">
                    {hasChildren ? (
                      <button
                        onClick={() => toggleExpanded(item.id)}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        )}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                          {item.badge && (
                            <Badge
                              variant={isActive ? 'secondary' : 'outline'}
                              className="h-5 px-2 text-xs"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        {isExpanded ? (
                          <ChevronRight className="h-4 w-4 rotate-90 transition-transform" />
                        ) : (
                          <ChevronRight className="h-4 w-4 transition-transform" />
                        )}
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          'flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                        {item.badge && (
                          <Badge
                            variant={isActive ? 'secondary' : 'outline'}
                            className="h-5 px-2 text-xs ml-auto"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    )}
                  </div>

                  {/* Submenu */}
                  <AnimatePresence>
                    {hasChildren && isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-6 mt-1 space-y-1 overflow-hidden"
                      >
                        {item.children?.filter(child => {
                          if (!child.roles) return true;
                          return user?.role && child.roles.includes(user.role);
                        }).map((child) => {
                          const isChildActive = isActiveRoute(child.href);
                          const ChildIcon = child.icon;

                          return (
                            <Link
                              key={child.id}
                              href={child.href}
                              onClick={onClose}
                              className={cn(
                                'flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors',
                                isChildActive
                                  ? 'bg-primary/10 text-primary font-medium'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                              )}
                            >
                              <ChildIcon className="h-4 w-4" />
                              <span>{child.label}</span>
                            </Link>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>

          {/* Quick Actions */}
          <div className="p-4 border-t border-border">
            <div className="space-y-2">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-4 w-4" />
                      <span>{action.label}</span>
                    </div>
                    {action.badge && (
                      <Badge variant="outline" className="h-5 px-2 text-xs">
                        {action.badge}
                      </Badge>
                    )}
                    {action.shortcut && (
                      <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                        {action.shortcut}
                      </kbd>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();

  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Dashboard', href: '/dashboard' }];

    let currentPath = '';
    segments.forEach((segment) => {
      currentPath += `/${segment}`;
      const formatted = segment.charAt(0).toUpperCase() + segment.slice(1);
      breadcrumbs.push({ label: formatted, href: currentPath });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="flex h-14 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.href}>
                {index > 0 && (
                  <ChevronRight className="h-4 w-4" />
                )}
                <Link
                  href={crumb.href}
                  className={cn(
                    'hover:text-foreground transition-colors',
                    index === breadcrumbs.length - 1 && 'text-foreground font-medium'
                  )}
                >
                  {crumb.label}
                </Link>
              </React.Fragment>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">Search</span>
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-auto">
              ⌘K
            </kbd>
          </Button>

          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-medium">
              3
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
}

export default function EnhancedDashboardLayout({ children, className }: EnhancedDashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Handle escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSidebarOpen(false);
      }
    };

    if (sidebarOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentPath={pathname}
        />

        <div className="flex flex-col flex-1 overflow-hidden">
          <TopBar onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 overflow-y-auto">
            <div className={cn('p-4 lg:p-6', className)}>
              <ErrorBoundary level="page" enableRetry={true}>
                {children}
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}