'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard,
  Users,
  Briefcase,
  ShoppingCart,
  MessageSquare,
  Settings,
  HelpCircle,
  X,
  Building2,
  UserCheck,
  ClipboardList,
  Package,
  TrendingUp,
  Search,
  Shield,
  FileText,
  Calendar,
  CreditCard,
  Bell,
  Star,
  BookOpen
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types/auth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
  badge?: string;
}

const navigation: NavItem[] = [
  // Common items
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: [UserRole.ADMIN, UserRole.RESTAURANT, UserRole.EMPLOYEE, UserRole.VENDOR],
  },

  // Admin specific
  {
    title: 'User Management',
    href: '/admin/users',
    icon: Users,
    roles: [UserRole.ADMIN],
  },
  {
    title: 'Verification Center',
    href: '/admin/verification',
    icon: UserCheck,
    roles: [UserRole.ADMIN],
  },
  {
    title: 'Platform Analytics',
    href: '/admin/analytics',
    icon: TrendingUp,
    roles: [UserRole.ADMIN],
  },
  {
    title: 'Security & Reports',
    href: '/admin/security',
    icon: Shield,
    roles: [UserRole.ADMIN],
  },

  // Restaurant specific
  {
    title: 'Profile',
    href: '/restaurant/profile',
    icon: Building2,
    roles: [UserRole.RESTAURANT],
  },
  {
    title: 'Job Portal',
    href: '/restaurant/jobs',
    icon: Briefcase,
    roles: [UserRole.RESTAURANT],
  },
  {
    title: 'Employee Management',
    href: '/restaurant/employees',
    icon: Users,
    roles: [UserRole.RESTAURANT],
  },
  {
    title: 'Marketplace',
    href: '/restaurant/marketplace',
    icon: ShoppingCart,
    roles: [UserRole.RESTAURANT],
  },
  {
    title: 'Orders',
    href: '/restaurant/orders',
    icon: ClipboardList,
    roles: [UserRole.RESTAURANT],
  },
  {
    title: 'Community',
    href: '/restaurant/community',
    icon: MessageSquare,
    roles: [UserRole.RESTAURANT],
  },

  // Employee specific
  {
    title: 'Profile',
    href: '/employee/profile',
    icon: Users,
    roles: [UserRole.EMPLOYEE],
  },
  {
    title: 'Job Search',
    href: '/employee/jobs',
    icon: Search,
    roles: [UserRole.EMPLOYEE],
  },
  {
    title: 'My Applications',
    href: '/employee/applications',
    icon: FileText,
    roles: [UserRole.EMPLOYEE],
  },
  {
    title: 'Learning Hub',
    href: '/employee/learning',
    icon: BookOpen,
    roles: [UserRole.EMPLOYEE],
  },
  {
    title: 'Attendance',
    href: '/employee/attendance',
    icon: Calendar,
    roles: [UserRole.EMPLOYEE],
  },
  {
    title: 'Community',
    href: '/employee/community',
    icon: MessageSquare,
    roles: [UserRole.EMPLOYEE],
  },

  // Vendor specific
  {
    title: 'Profile',
    href: '/vendor/profile',
    icon: Building2,
    roles: [UserRole.VENDOR],
  },
  {
    title: 'Product Catalog',
    href: '/vendor/products',
    icon: Package,
    roles: [UserRole.VENDOR],
  },
  {
    title: 'Orders',
    href: '/vendor/orders',
    icon: ClipboardList,
    roles: [UserRole.VENDOR],
  },
  {
    title: 'Analytics',
    href: '/vendor/analytics',
    icon: TrendingUp,
    roles: [UserRole.VENDOR],
  },
  {
    title: 'Reviews',
    href: '/vendor/reviews',
    icon: Star,
    roles: [UserRole.VENDOR],
  },
  {
    title: 'Community',
    href: '/vendor/community',
    icon: MessageSquare,
    roles: [UserRole.VENDOR],
  },

  // Common items at bottom
  {
    title: 'Messages',
    href: '/messages',
    icon: MessageSquare,
    roles: [UserRole.ADMIN, UserRole.RESTAURANT, UserRole.EMPLOYEE, UserRole.VENDOR],
    badge: '3',
  },
  {
    title: 'Notifications',
    href: '/notifications',
    icon: Bell,
    roles: [UserRole.ADMIN, UserRole.RESTAURANT, UserRole.EMPLOYEE, UserRole.VENDOR],
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: [UserRole.ADMIN, UserRole.RESTAURANT, UserRole.EMPLOYEE, UserRole.VENDOR],
  },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const filteredNavigation = navigation.filter(item =>
    user?.role && item.roles.includes(user.role)
  );

  const getRoleDashboard = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return '/admin/dashboard';
      case UserRole.RESTAURANT:
        return '/restaurant/dashboard';
      case UserRole.EMPLOYEE:
        return '/employee/dashboard';
      case UserRole.VENDOR:
        return '/vendor/dashboard';
      default:
        return '/dashboard';
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.div
        initial={false}
        animate={{ width: isOpen ? 256 : 64 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed left-0 top-0 z-40 h-screen bg-card border-r border-border hidden lg:flex flex-col"
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-border">
          {isOpen ? (
            <Link href={user ? getRoleDashboard(user.role) : '/'} className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <span className="text-lg font-bold text-foreground">RestoPapa</span>
            </Link>
          ) : (
            <Link href={user ? getRoleDashboard(user.role) : '/'} className="flex items-center justify-center w-full">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
            </Link>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 group',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  <Icon className={cn('h-5 w-5 flex-shrink-0', {
                    'mr-3': isOpen,
                  })} />
                  
                  {isOpen && (
                    <>
                      <span className="truncate">{item.title}</span>
                      {item.badge && (
                        <span className="ml-auto bg-primary-500 text-white text-xs rounded-full px-2 py-0.5">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}

                  {!isOpen && item.badge && (
                    <span className="absolute left-full ml-2 bg-primary-500 text-white text-xs rounded-full px-2 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.badge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Link href="/help">
            <div className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <HelpCircle className={cn('h-5 w-5', { 'mr-3': isOpen })} />
              {isOpen && <span>Help & Support</span>}
            </div>
          </Link>
        </div>
      </motion.div>

      {/* Mobile Sidebar */}
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: isOpen ? 0 : '-100%' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed left-0 top-0 z-50 h-screen w-64 bg-card border-r border-border lg:hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          <Link href={user ? getRoleDashboard(user.role) : '/'} className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <span className="text-lg font-bold text-foreground">RestoPapa</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link key={item.href} href={item.href} onClick={onClose}>
                <div
                  className={cn(
                    'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  <span className="truncate">{item.title}</span>
                  {item.badge && (
                    <span className="ml-auto bg-primary-500 text-white text-xs rounded-full px-2 py-0.5">
                      {item.badge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Link href="/help" onClick={onClose}>
            <div className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <HelpCircle className="h-5 w-5 mr-3" />
              <span>Help & Support</span>
            </div>
          </Link>
        </div>
      </motion.div>
    </>
  );
}