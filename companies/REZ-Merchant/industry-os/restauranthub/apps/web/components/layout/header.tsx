'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types/auth';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChefHat,
  Search,
  Bell,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  ShoppingCart,
  Briefcase,
  Users,
  Store,
  Package,
  Shield,
  MessageCircle
} from 'lucide-react';

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsSearchFocused(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getRoleBasedDashboard = () => {
    if (!user) return '/dashboard';
    switch (user.role) {
      case UserRole.ADMIN: return '/admin/dashboard';
      case UserRole.RESTAURANT: return '/restaurant/dashboard';
      case UserRole.EMPLOYEE: return '/employee/dashboard';
      case UserRole.VENDOR: return '/vendor/dashboard';
      default: return '/dashboard';
    }
  };

  const navigationItems = [
    { label: 'Marketplace', href: '/marketplace', icon: ShoppingCart },
    { label: 'Jobs', href: '/jobs', icon: Briefcase },
    { label: 'Community', href: '/community', icon: Users },
    { label: 'Services', href: '/services', icon: Store },
  ];

  const userMenuItems = [
    { label: 'Dashboard', href: getRoleBasedDashboard(), icon: Store },
    { label: 'Profile', href: '/profile', icon: User },
    { label: 'Settings', href: '/settings', icon: Settings },
    { label: 'Messages', href: '/messages', icon: MessageCircle },
  ];

  return (
    <header className={`sticky top-0 z-50 w-full bg-white/95 dark:bg-gray-950/95 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm ${className}`}>
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 flex-shrink-0 group">
            <div className="relative">
              <ChefHat className="h-9 w-9 text-primary transition-transform group-hover:scale-105" />
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent hidden sm:inline">
                RestoPapa
              </span>
              <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent sm:hidden">
                RP
              </span>
            </div>
          </Link>

          {/* Universal Search - Desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-6">
            <form onSubmit={handleSearch} className="relative w-full group">
              <div className={`relative transition-all duration-300 ${
                isSearchFocused 
                  ? 'ring-2 ring-primary/50 shadow-lg shadow-primary/10' 
                  : 'hover:shadow-md hover:shadow-gray-200/50 dark:hover:shadow-gray-800/50'
              }`}>
                <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors ${
                  isSearchFocused ? 'text-primary' : 'text-muted-foreground'
                }`} />
                <input
                  type="text"
                  placeholder="Search products, jobs, vendors, communities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className="w-full pl-12 pr-6 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-800/50 focus:outline-none focus:bg-white dark:focus:bg-gray-800 transition-all duration-300 text-sm placeholder:text-gray-400"
                />
              </div>
            </form>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary transition-all duration-200 group"
                >
                  <Icon className="h-4 w-4 group-hover:scale-105 transition-transform" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            {/* Mobile Search Toggle */}
            <Button
              variant="ghost"
              
              className="md:hidden h-10 w-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setIsSearchFocused(!isSearchFocused)}
            >
              <Search className="h-5 w-5" />
            </Button>

            {isAuthenticated && user ? (
              <>
                {/* Notifications */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost"  className="relative h-10 w-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 group">
                      <Bell className="h-5 w-5 group-hover:scale-105 transition-transform" />
                      <div className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-white">3</span>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">New order received</p>
                        <p className="text-xs text-muted-foreground">2 minutes ago</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">Job application submitted</p>
                        <p className="text-xs text-muted-foreground">1 hour ago</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">New community post</p>
                        <p className="text-xs text-muted-foreground">3 hours ago</p>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost"  className="flex items-center space-x-3 px-3 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 group">
                      <div className="relative h-9 w-9 rounded-full bg-gradient-to-r from-primary to-primary/70 p-0.5 group-hover:from-primary group-hover:to-primary/90 transition-all duration-200">
                        <div className="h-full w-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
                          {user.profile?.avatar ? (
                            <img src={user.profile.avatar} alt={`${user.profile.firstName} ${user.profile.lastName}`} className="h-8 w-8 rounded-full object-cover" />
                          ) : (
                            <User className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </div>
                      <div className="hidden sm:flex flex-col items-start">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{user.profile?.firstName} {user.profile?.lastName}</span>
                        <span className="text-xs text-gray-500 capitalize">{user.role}</span>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-xl">
                    <DropdownMenuLabel>
                      <div className="flex items-center space-x-3 p-2">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-primary/70 p-0.5">
                          <div className="h-full w-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
                            {user.profile?.avatar ? (
                              <img src={user.profile.avatar} alt={`${user.profile.firstName} ${user.profile.lastName}`} className="h-9 w-9 rounded-full object-cover" />
                            ) : (
                              <User className="h-5 w-5 text-primary" />
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.profile?.firstName} {user.profile?.lastName}</p>
                          <p className="text-xs text-gray-500 capitalize bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">{user.role}</p>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {userMenuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <DropdownMenuItem key={item.href} asChild className="focus:bg-gray-50 dark:focus:bg-gray-800/50 rounded-lg m-1">
                          <Link href={item.href} className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors group">
                            <Icon className="h-4 w-4 text-gray-500 group-hover:text-primary transition-colors" />
                            <span className="text-sm font-medium">{item.label}</span>
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuSeparator className="my-2" />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50 rounded-lg m-1">
                      <div className="flex items-center space-x-3 p-3 w-full hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors group">
                        <LogOut className="h-4 w-4 group-hover:scale-105 transition-transform" />
                        <span className="text-sm font-medium">Log out</span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/auth/login">
                  <Button variant="ghost"  className="font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full px-4 transition-all duration-200">
                    Login
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-medium rounded-full px-6 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-200 hover:scale-105">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isSearchFocused && (
          <div className="md:hidden py-3 border-t">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products, jobs, vendors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-full bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
            </form>
          </div>
        )}

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t py-4">
            <nav className="flex flex-col space-y-4">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center space-x-3 text-sm font-medium hover:text-primary transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}