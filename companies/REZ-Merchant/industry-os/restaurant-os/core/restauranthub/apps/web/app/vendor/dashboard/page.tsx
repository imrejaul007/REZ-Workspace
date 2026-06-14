'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Star,
  Eye,
  AlertCircle,
  BarChart3,
  MessageSquare,
  Calendar,
  ArrowUpRight,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { EmailVerificationAlert } from '@/components/auth/email-verification-alert';
import { cn } from '@/lib/utils';
import { vendorProductsApi, VendorStats } from '@/lib/api/vendor-products';

export default function VendorDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    vendorProductsApi
      .getStats()
      .then((data) => setStats(data))
      .catch((err) => setStatsError(err instanceof Error ? err.message : 'Failed to load stats'))
      .finally(() => setStatsLoading(false));
  }, []);
  
  const quickActions = [
    { icon: Package, label: 'Add Product', href: '/vendor/products', color: 'bg-blue-500' },
    { icon: ShoppingCart, label: 'View Orders', href: '/vendor/orders', color: 'bg-green-500' },
    { icon: TrendingUp, label: 'Analytics', href: '/vendor/analytics', color: 'bg-purple-500' },
    { icon: Star, label: 'Reviews', href: '/vendor/reviews', color: 'bg-orange-500' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Vendor Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage your inventory, orders, and track business performance
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-4 sm:mt-0">
            <Button variant="outline" >
              <Calendar className="h-4 w-4 mr-2" />
              Last 30 days
            </Button>
            <Button >
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </div>
        </div>

        {/* Email Verification Alert */}
        <EmailVerificationAlert />

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Monthly Revenue — coming soon */}
          {[
            { title: 'Monthly Revenue', icon: DollarSign, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900', value: null, subtitle: 'Coming soon' },
            { title: 'Total Orders', icon: ShoppingCart, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900', value: null, subtitle: 'Coming soon' },
            { title: 'Customer Rating', icon: Star, color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900', value: null, subtitle: 'Coming soon' },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }}>
                <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                        <p className="text-2xl font-bold text-foreground mt-1">—</p>
                        <p className="text-sm text-muted-foreground mt-2">{stat.subtitle}</p>
                      </div>
                      <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                        <Icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

          {/* Active Products — real data from /vendor/stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
            <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer" onClick={() => router.push('/vendor/products')}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Active Products</p>
                    {statsLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mt-1" />
                    ) : statsError ? (
                      <p className="text-2xl font-bold text-foreground mt-1">—</p>
                    ) : (
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {stats?.productCount ?? 0}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-2">
                      {statsError ? 'Could not load' : 'Total listed products'}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900">
                    <Package className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold">
                    Recent Orders
                  </CardTitle>
                  <Button variant="ghost" >
                    <Eye className="h-4 w-4 mr-2" />
                    View All
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="h-10 w-10 mx-auto mb-3" />
                    <p className="text-sm font-medium">No orders yet</p>
                    <p className="text-xs mt-1">Incoming orders from buyers will appear here once the orders API is connected.</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
                <CardDescription>
                  Common vendor tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Button 
                      key={index}
                      variant="ghost" 
                      className="w-full justify-start h-auto p-4 hover:bg-muted/50"
                      onClick={() => router.push(action.href)}
                    >
                      <div className={`p-2 rounded-lg ${action.color} mr-4`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-sm">{action.label}</p>
                        <p className="text-xs text-muted-foreground">
                          Navigate to {action.label.toLowerCase()}
                        </p>
                      </div>
                    </Button>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Low Stock Alert */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-warning-500" />
                <CardTitle className="text-lg font-semibold">
                  Inventory Alerts
                </CardTitle>
              </div>
              <Button variant="ghost" >
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Manage Inventory
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-3" />
                <p className="text-sm font-medium">No inventory alerts</p>
                <p className="text-xs mt-1">Inventory alerts will appear here once product management is connected.</p>
                <Button variant="outline" className="mt-4" onClick={() => router.push('/vendor/products')}>
                  Manage Products
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Reviews */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">
                Recent Reviews
              </CardTitle>
              <Button variant="ghost" >
                <MessageSquare className="h-4 w-4 mr-2" />
                View All Reviews
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-10 w-10 mx-auto mb-3" />
                <p className="text-sm font-medium">No reviews yet</p>
                <p className="text-xs mt-1">Customer reviews will appear here once the reviews API is connected.</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}