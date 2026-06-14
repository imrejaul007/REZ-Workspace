'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  ChefHat,
  Users,
  Briefcase,
  ShoppingCart,
  TrendingUp,
  Calendar,
  Clock,
  BarChart3,
  MessageSquare,
  Settings,
  ArrowRight,
  Building2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { EmailVerificationAlert } from '@/components/auth/email-verification-alert';

const quickActions = [
  {
    title: 'Dashboard',
    description: 'View restaurant overview and key metrics',
    icon: BarChart3,
    href: '/restaurant/dashboard',
    color: 'bg-blue-500',
    stat: 'Quick Overview'
  },
  {
    title: 'Menu Management',
    description: 'Manage your restaurant menu items and categories',
    icon: ChefHat,
    href: '/restaurant/menu',
    color: 'bg-orange-500',
    stat: 'Active Items'
  },
  {
    title: 'Employee Management',
    description: 'Manage staff, schedules, and roles',
    icon: Users,
    href: '/restaurant/employees',
    color: 'bg-green-500',
    stat: 'Active Staff'
  },
  {
    title: 'Job Postings',
    description: 'Post jobs and manage applications',
    icon: Briefcase,
    href: '/restaurant/jobs',
    color: 'bg-purple-500',
    stat: 'Open Positions'
  },
  {
    title: 'Orders',
    description: 'Manage incoming orders and delivery',
    icon: ShoppingCart,
    href: '/restaurant/orders',
    color: 'bg-red-500',
    stat: 'Today'
  },
  {
    title: 'Marketplace',
    description: 'Browse and order from B2B suppliers',
    icon: Building2,
    href: '/restaurant/marketplace',
    color: 'bg-teal-500',
    stat: 'Available'
  },
  {
    title: 'Analytics',
    description: 'View detailed restaurant performance metrics',
    icon: TrendingUp,
    href: '/restaurant/analytics',
    color: 'bg-indigo-500',
    stat: 'Reports'
  },
  {
    title: 'Community',
    description: 'Connect with other restaurant owners',
    icon: MessageSquare,
    href: '/restaurant/community',
    color: 'bg-pink-500',
    stat: 'Active'
  }
];

export default function RestaurantHomePage() {
  const router = useRouter();

  // Redirect to dashboard if user prefers (can be configurable)
  const shouldRedirectToDashboard = false;

  useEffect(() => {
    if (shouldRedirectToDashboard) {
      router.push('/restaurant/dashboard');
    }
  }, [router]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <EmailVerificationAlert />
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
            <ChefHat className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Restaurant Management</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Welcome to your restaurant management hub. Choose from the options below to manage your restaurant operations efficiently.
          </p>
        </motion.div>

        {/* Quick Actions Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {quickActions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Card className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 border-l-4 border-l-transparent hover:border-l-primary">
                <CardHeader className="space-y-2">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${action.color} text-white group-hover:scale-110 transition-transform duration-200`}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {action.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-sm leading-relaxed">
                    {action.description}
                  </CardDescription>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">
                      {action.stat}
                    </span>
                    <Button
                      variant="ghost"
                      
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                      onClick={() => router.push(action.href)}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Recent Activity Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">
                +12% from yesterday
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">
                Currently on shift
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground">
                Total orders served
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Start Guide */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Quick Start Guide
              </CardTitle>
              <CardDescription>
                New to RestoPapa? Get started with these essential steps.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-4 text-left"
                  onClick={() => router.push('/restaurant/profile')}
                >
                  <div>
                    <div className="font-semibold">Complete Your Profile</div>
                    <div className="text-sm text-gray-600">Set up restaurant information and preferences</div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-4 text-left"
                  onClick={() => router.push('/restaurant/menu')}
                >
                  <div>
                    <div className="font-semibold">Add Menu Items</div>
                    <div className="text-sm text-gray-600">Create your digital menu and pricing</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}