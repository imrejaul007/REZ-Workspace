'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  Bell, 
  Search,
  Settings,
  LogOut,
  User,
  ChevronDown,
  MessageSquare,
  Sun,
  Moon,
  Monitor,
  ArrowLeft
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/lib/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { UserRole } from '@/types/auth';
import { Sidebar } from './sidebar';
import { NotificationBell } from './notification-bell';
import { getInitials } from '@/lib/utils';
import { generateBreadcrumbs } from '@/lib/breadcrumbs';
import { useRouter } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getPageTitle = () => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return 'Dashboard';
    return segments[segments.length - 1]
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case UserRole.RESTAURANT:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case UserRole.EMPLOYEE:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case UserRole.VENDOR:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  const breadcrumbItems = generateBreadcrumbs(pathname);
  const showBackButton = pathname !== '/dashboard' && pathname !== '/';

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className={`flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
        {/* Header */}
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between px-4 lg:px-6">
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>

              {/* Desktop Sidebar Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:flex"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>

              {/* Back Button */}
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.back()}
                  className="hover:bg-accent"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}

              {/* Page Title and Breadcrumbs */}
              <div className="flex flex-col">
                <h1 className="text-lg font-semibold text-foreground">
                  {getPageTitle()}
                </h1>
                {breadcrumbItems.length > 0 && (
                  <Breadcrumb items={breadcrumbItems} className="mt-1" />
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Search Button - Mobile */}
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Search className="h-5 w-5" />
              </Button>

              {/* Search Bar - Desktop */}
              <div className="hidden lg:flex items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Search..."
                    className="w-64 pl-10 pr-4 py-2 text-sm bg-muted/50 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  />
                </div>
              </div>

              {/* Theme Toggle */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setThemeMenuOpen(!themeMenuOpen)}
                  className="relative"
                >
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </Button>

                <AnimatePresence>
                  {themeMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 top-full mt-2 z-50"
                      onBlur={() => setThemeMenuOpen(false)}
                    >
                      <Card className="p-1 shadow-lg min-w-[120px]">
                        {themeOptions.map((option) => {
                          const Icon = option.icon;
                          return (
                            <button
                              key={option.value}
                              className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-accent rounded-sm transition-colors"
                              onClick={() => {
                                setTheme(option.value);
                                setThemeMenuOpen(false);
                              }}
                            >
                              <Icon className="h-4 w-4" />
                              <span>{option.label}</span>
                            </button>
                          );
                        })}
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Notifications */}
              <NotificationBell />

              {/* Messages */}
              <Button variant="ghost" size="icon">
                <MessageSquare className="h-5 w-5" />
              </Button>

              {/* User Menu */}
              <div className="relative">
                <button
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent transition-colors"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    {user?.profile?.firstName ? getInitials(`${user.profile.firstName} ${user.profile.lastName}`) : 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium text-foreground">
                      {user?.profile?.firstName ? `${user.profile.firstName} ${user.profile.lastName}` : user?.email}
                    </div>
                    <div className={`text-xs px-2 py-0.5 rounded-full inline-block ${getRoleColor(user?.role || UserRole.RESTAURANT)}`}>
                      {user?.role?.toLowerCase()}
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 top-full mt-2 z-50"
                      onBlur={() => setUserMenuOpen(false)}
                    >
                      <Card className="p-2 shadow-lg min-w-[200px]">
                        <div className="px-3 py-2 border-b">
                          <div className="text-sm font-medium text-foreground">
                            {user?.profile?.firstName ? `${user.profile.firstName} ${user.profile.lastName}` : user?.email}
                          </div>
                          <div className="text-xs text-muted-foreground">{user?.email}</div>
                        </div>
                        <div className="space-y-1 py-2">
                          <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-accent rounded-sm transition-colors">
                            <User className="h-4 w-4" />
                            <span>Profile</span>
                          </button>
                          <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-accent rounded-sm transition-colors">
                            <Settings className="h-4 w-4" />
                            <span>Settings</span>
                          </button>
                          <hr className="my-1" />
                          <button
                            className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-accent rounded-sm transition-colors text-destructive"
                            onClick={handleLogout}
                          >
                            <LogOut className="h-4 w-4" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}