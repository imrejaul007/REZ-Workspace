'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Store,
  Package,
  Briefcase,
  Shield,
  TrendingUp,
  Users,
  ShoppingCart,
  BarChart3,
  CreditCard,
  Settings,
  Bell,
  MessageCircle,
  Calendar,
  Star,
  Award,
  Clock,
  ChefHat
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-provider';
import { UserRole } from '@/types/auth';

export default function GeneralDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  // Role-based quick actions
  const getRoleBasedActions = () => {
    if (!user) return [];
    
    switch (user.role) {
      case UserRole.RESTAURANT:
        return [
          { label: 'Post Job', icon: Briefcase, onClick: () => router.push('/jobs/create'), color: 'bg-blue-500' },
          { label: 'Order Supplies', icon: ShoppingCart, onClick: () => router.push('/marketplace'), color: 'bg-green-500' },
          { label: 'View Applications', icon: Users, onClick: () => router.push('/jobs/applications'), color: 'bg-purple-500' },
        ];
      case UserRole.VENDOR:
        return [
          { label: 'Add Product', icon: Package, onClick: () => router.push('/marketplace/add-product'), color: 'bg-green-500' },
          { label: 'View Orders', icon: ShoppingCart, onClick: () => router.push('/orders'), color: 'bg-blue-500' },
          { label: 'Manage Inventory', icon: BarChart3, onClick: () => router.push('/inventory'), color: 'bg-purple-500' },
        ];
      case UserRole.EMPLOYEE:
        return [
          { label: 'Browse Jobs', icon: Briefcase, onClick: () => router.push('/jobs'), color: 'bg-blue-500' },
          { label: 'My Applications', icon: Users, onClick: () => router.push('/jobs/my-applications'), color: 'bg-green-500' },
          { label: 'Update Profile', icon: Settings, onClick: () => router.push('/profile'), color: 'bg-purple-500' },
        ];
      default:
        return [];
    }
  };

  const roleActions = getRoleBasedActions();

  // Temporarily disable auto-redirect to show modern UI
  // React.useEffect(() => {
  //   if (user) {
  //     switch (user.role) {
  //       case 'admin':
  //         router.push('/admin/dashboard');
  //         return;
  //       case 'restaurant':
  //         router.push('/restaurant/dashboard');
  //         return;
  //       case 'employee':
  //         router.push('/employee/dashboard');
  //         return;
  //       case 'vendor':
  //         router.push('/vendor/dashboard');
  //         return;
  //     }
  //   }
  // }, [user, router]);

  const quickActions = [
    {
      icon: Store,
      title: 'Restaurant Management',
      description: 'Manage your restaurant operations',
      href: '/restaurant/dashboard',
      color: 'text-blue-600',
      visible: !user || user.role === UserRole.RESTAURANT
    },
    {
      icon: Package,
      title: 'Vendor Portal',
      description: 'Supply products to restaurants',
      href: '/vendor/dashboard',
      color: 'text-green-600',
      visible: !user || user.role === UserRole.VENDOR
    },
    {
      icon: Briefcase,
      title: 'Job Portal',
      description: 'Find employment opportunities',
      href: '/employee/dashboard',
      color: 'text-purple-600',
      visible: !user || user.role === UserRole.EMPLOYEE
    },
    {
      icon: Shield,
      title: 'Admin Panel',
      description: 'Platform administration',
      href: '/admin/dashboard',
      color: 'text-orange-600',
      visible: !user || user.role === UserRole.ADMIN
    }
  ].filter(action => action.visible);

  const features = [
    {
      icon: ShoppingCart,
      title: 'Marketplace',
      description: 'Browse and purchase from suppliers',
      href: '/marketplace'
    },
    {
      icon: Briefcase,
      title: 'Jobs',
      description: 'Find your next opportunity',
      href: '/jobs'
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Connect with other users',
      href: '/community'
    },
    {
      icon: BarChart3,
      title: 'Analytics',
      description: 'View your performance metrics',
      href: '/analytics'
    },
    {
      icon: CreditCard,
      title: 'Wallet',
      description: 'Manage your payments',
      href: '/wallet'
    },
    {
      icon: Settings,
      title: 'Settings',
      description: 'Configure your account',
      href: '/settings'
    }
  ];

  const recentActivities = [
    { icon: Bell, text: 'Welcome to RestoPapa!', time: 'Just now' },
    { icon: MessageCircle, text: 'Complete your profile setup', time: '5 minutes ago' },
    { icon: Calendar, text: 'Explore available features', time: '10 minutes ago' }
  ];

  const stats = [
    { value: '10,000+', label: 'Active Restaurants', icon: Store },
    { value: '50,000+', label: 'Users', icon: Users },
    { value: '₹100M+', label: 'Transactions', icon: TrendingUp },
    { value: '98%', label: 'Satisfaction', icon: Star }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Enhanced Header */}
      <div className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-orange-200/50 dark:border-gray-800/50 shadow-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-lg">
                <ChefHat className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                  ✨ Welcome to RestoPapa ✨
                </h1>
                <p className="text-orange-600 font-bold">Your culinary business journey starts here - UPDATED!</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-md">
                <Award className="h-4 w-4 mr-2" />
                General User
              </Badge>
              <Link href="/profile">
                <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 rounded-full">
                  Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Role-Based Quick Actions */}
            {roleActions.length > 0 && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {roleActions.map((action, index) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={index}
                          onClick={action.onClick}
                          className={`${action.color} text-white p-4 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-3`}
                        >
                          <Icon className="h-6 w-6" />
                          <span className="font-medium">{action.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Welcome Message */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  {user ? `Welcome back, ${user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : 'User'}!` : 'Get Started with RestoPapa'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {user 
                    ? `Access your ${user.role} dashboard and features below.`
                    : 'Choose your role to access specialized features and dashboard tailored to your needs.'}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <Link key={index} href={action.href}>
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                          <CardContent className="p-4">
                            <div className={`inline-flex p-2 rounded-lg bg-primary/10 ${action.color} mb-2`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <h3 className="font-semibold mb-1">{action.title}</h3>
                            <p className="text-sm text-muted-foreground">{action.description}</p>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Marketplace Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  Marketplace Highlights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Fresh Vegetables</p>
                      <p className="text-sm text-muted-foreground">Daily delivery available</p>
                    </div>
                    <span className="text-green-600 font-semibold">20% OFF</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Premium Spices</p>
                      <p className="text-sm text-muted-foreground">Authentic & fresh</p>
                    </div>
                    <span className="text-blue-600 font-semibold">New</span>
                  </div>
                  <Link href="/marketplace">
                    <Button variant="outline" className="w-full mt-2">
                      View All Products →
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Jobs Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Latest Job Openings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <p className="font-medium">Head Chef</p>
                    <p className="text-sm text-muted-foreground">5-Star Restaurant • Mumbai</p>
                    <p className="text-sm text-green-600 mt-1">₹80,000/month</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="font-medium">Restaurant Manager</p>
                    <p className="text-sm text-muted-foreground">Fine Dining • Delhi</p>
                    <p className="text-sm text-green-600 mt-1">₹60,000/month</p>
                  </div>
                  <Link href="/jobs">
                    <Button variant="outline" className="w-full mt-2">
                      Browse All Jobs →
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Platform Features */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <Link key={index} href={feature.href}>
                        <div className="p-4 rounded-lg border hover:shadow-md transition-shadow cursor-pointer">
                          <Icon className="h-6 w-6 text-primary mb-2" />
                          <h4 className="font-medium mb-1">{feature.title}</h4>
                          <p className="text-xs text-muted-foreground">{feature.description}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Platform Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <div key={index} className="text-center">
                        <Icon className="h-6 w-6 text-primary mx-auto mb-2" />
                        <div className="text-2xl font-bold text-primary">{stat.value}</div>
                        <div className="text-sm text-muted-foreground">{stat.label}</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => {
                    const Icon = activity.icon;
                    return (
                      <div key={index} className="flex items-start gap-3">
                        <Icon className="h-4 w-4 text-primary mt-0.5" />
                        <div>
                          <p className="text-sm">{activity.text}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Link href="/support">
                    <Button variant="ghost" className="w-full justify-start">
                      Support Center
                    </Button>
                  </Link>
                  <Link href="/community">
                    <Button variant="ghost" className="w-full justify-start">
                      Community Forum
                    </Button>
                  </Link>
                  <Link href="/training">
                    <Button variant="ghost" className="w-full justify-start">
                      Training Resources
                    </Button>
                  </Link>
                  <Link href="/profile">
                    <Button variant="ghost" className="w-full justify-start">
                      Profile Settings
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}