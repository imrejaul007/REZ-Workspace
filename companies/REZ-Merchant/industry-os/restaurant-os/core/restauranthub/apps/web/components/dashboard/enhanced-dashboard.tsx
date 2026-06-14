'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  Store,
  DollarSign,
  ShoppingCart,
  Clock,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Filter,
  Calendar,
  Download,
  MoreHorizontal,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LoadingSpinner,
  DashboardStatsSkeleton,
  ErrorState,
  ProgressiveLoading,
  InlineLoading,
} from '@/components/ui/loading-states';
import { useAuth } from '@/lib/auth/auth-provider';
import { UserRole } from '@/types/auth';
import { cn } from '@/lib/utils';

// Mock hooks - these would be replaced with real API hooks
const useDashboardStats = (period: string = '7d') => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock data - replace with real API call
  const data = {
    totalJobs: 156,
    activeJobs: 89,
    totalApplications: 2340,
    pendingApplications: 45,
    totalRevenue: 125000,
    monthlyRevenue: 15500,
    totalOrders: 890,
    activeCustomers: 234,
    metrics: {
      jobsChange: 12.5,
      applicationsChange: -5.2,
      revenueChange: 18.7,
      ordersChange: 8.3,
    },
    chartData: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      revenue: [12000, 15000, 18000, 14000, 22000, 19000, 25000],
      applications: [45, 52, 38, 61, 48, 55, 42],
      orders: [120, 135, 98, 156, 142, 167, 134],
    },
  };

  const refetch = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return { data, isLoading, error, refetch };
};

const useRecentActivity = () => {
  const data = [
    {
      id: '1',
      type: 'application',
      title: 'New application received',
      description: 'John Doe applied for Executive Chef position',
      timestamp: '2 minutes ago',
      priority: 'high' as const,
      read: false,
    },
    {
      id: '2',
      type: 'job',
      title: 'Job posting approved',
      description: 'Sous Chef position is now live',
      timestamp: '15 minutes ago',
      priority: 'medium' as const,
      read: false,
    },
    {
      id: '3',
      type: 'order',
      title: 'Large order received',
      description: 'Premium Spice Co. - ₹25,000 order',
      timestamp: '1 hour ago',
      priority: 'high' as const,
      read: true,
    },
    {
      id: '4',
      type: 'review',
      title: 'New supplier review',
      description: 'Fresh Farm Produce received 5-star review',
      timestamp: '2 hours ago',
      priority: 'low' as const,
      read: true,
    },
  ];

  return { data, isLoading: false, error: null };
};

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  color?: string;
  format?: 'number' | 'currency' | 'percentage';
  isLoading?: boolean;
  trend?: 'up' | 'down' | 'neutral';
}

function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  color = 'blue',
  format = 'number',
  isLoading = false,
  trend,
}: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-600 border-blue-200',
    green: 'bg-green-500/10 text-green-600 border-green-200',
    orange: 'bg-orange-500/10 text-orange-600 border-orange-200',
    purple: 'bg-purple-500/10 text-purple-600 border-purple-200',
    red: 'bg-red-500/10 text-red-600 border-red-200',
  };

  const formatValue = (val: string | number) => {
    if (format === 'currency') {
      return `₹${typeof val === 'number' ? val.toLocaleString() : val}`;
    }
    if (format === 'percentage') {
      return `${val}%`;
    }
    return typeof val === 'number' ? val.toLocaleString() : val;
  };

  const getTrendIcon = () => {
    if (!change) return null;

    if (change > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (change < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return null;
  };

  const getTrendColor = () => {
    if (!change) return 'text-muted-foreground';
    return change > 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded animate-pulse"></div>
            <div className="h-8 bg-muted rounded animate-pulse w-24"></div>
            <div className="h-3 bg-muted rounded animate-pulse w-20"></div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold text-foreground">{formatValue(value)}</p>
              {change !== undefined && (
                <div className="flex items-center space-x-1 text-sm">
                  {getTrendIcon()}
                  <span className={getTrendColor()}>
                    {Math.abs(change)}% {changeLabel || 'vs last period'}
                  </span>
                </div>
              )}
            </div>
            <div className={cn('p-3 rounded-xl border', colorClasses[color as keyof typeof colorClasses])}>
              {icon}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ActivityItemProps {
  activity: {
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    priority: 'low' | 'medium' | 'high';
    read: boolean;
  };
  onMarkAsRead?: (id: string) => void;
}

function ActivityItem({ activity, onMarkAsRead }: ActivityItemProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'application':
        return <Users className="h-4 w-4" />;
      case 'job':
        return <Briefcase className="h-4 w-4" />;
      case 'order':
        return <ShoppingCart className="h-4 w-4" />;
      case 'review':
        return <Star className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'application':
        return 'bg-blue-100 text-blue-600';
      case 'job':
        return 'bg-green-100 text-green-600';
      case 'order':
        return 'bg-purple-100 text-purple-600';
      case 'review':
        return 'bg-yellow-100 text-yellow-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getPriorityDot = (priority: string) => {
    const colors = {
      low: 'bg-gray-400',
      medium: 'bg-yellow-400',
      high: 'bg-red-400',
    };
    return colors[priority as keyof typeof colors] || colors.low;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-start space-x-3 p-3 rounded-lg border transition-all duration-200 hover:bg-muted/50',
        !activity.read && 'bg-blue-50/50 border-blue-200'
      )}
    >
      <div className={cn('p-2 rounded-lg', getTypeColor(activity.type))}>
        {getTypeIcon(activity.type)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <h4 className="text-sm font-medium text-foreground truncate">
            {activity.title}
          </h4>
          <div className={cn('h-2 w-2 rounded-full', getPriorityDot(activity.priority))}></div>
          {!activity.read && (
            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
          {activity.description}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          {activity.timestamp}
        </p>
      </div>

      <Button
        size="sm"
        variant="ghost"
        onClick={() => onMarkAsRead?.(activity.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </motion.div>
  );
}

interface EnhancedDashboardProps {
  className?: string;
}

export default function EnhancedDashboard({ className }: EnhancedDashboardProps) {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedTab, setSelectedTab] = useState('overview');

  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useDashboardStats(selectedPeriod);

  const {
    data: activities,
    isLoading: activitiesLoading,
    error: activitiesError,
  } = useRecentActivity();

  // Get stats based on user role
  const getStatsForRole = useMemo(() => {
    if (!statsData) return [];

    const baseStats = [
      {
        title: 'Total Revenue',
        value: statsData.totalRevenue,
        change: statsData.metrics.revenueChange,
        icon: <DollarSign className="h-6 w-6" />,
        color: 'green',
        format: 'currency' as const,
      },
      {
        title: 'Total Orders',
        value: statsData.totalOrders,
        change: statsData.metrics.ordersChange,
        icon: <ShoppingCart className="h-6 w-6" />,
        color: 'blue',
        format: 'number' as const,
      },
    ];

    if (user?.role === UserRole.RESTAURANT) {
      return [
        {
          title: 'Active Jobs',
          value: statsData.activeJobs,
          change: statsData.metrics.jobsChange,
          icon: <Briefcase className="h-6 w-6" />,
          color: 'purple',
          format: 'number' as const,
        },
        {
          title: 'Applications',
          value: statsData.totalApplications,
          change: statsData.metrics.applicationsChange,
          icon: <Users className="h-6 w-6" />,
          color: 'orange',
          format: 'number' as const,
        },
        ...baseStats,
      ];
    }

    return [
      {
        title: 'Active Customers',
        value: statsData.activeCustomers,
        change: 5.2,
        icon: <Users className="h-6 w-6" />,
        color: 'orange',
        format: 'number' as const,
      },
      {
        title: 'Suppliers',
        value: 45,
        change: 2.1,
        icon: <Store className="h-6 w-6" />,
        color: 'purple',
        format: 'number' as const,
      },
      ...baseStats,
    ];
  }, [statsData, user?.role]);

  const periodOptions = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back, {user?.firstName || 'User'}! Here's your business overview.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={refetchStats}
            disabled={statsLoading}
          >
            <RefreshCw className={cn('h-4 w-4', statsLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <ProgressiveLoading
        isLoading={statsLoading}
        error={statsError}
        onRetry={refetchStats}
        loadingComponent={<DashboardStatsSkeleton />}
        errorComponent={
          <ErrorState
            title="Failed to load dashboard stats"
            message="Please try refreshing the page"
            showRetry={true}
            onRetry={refetchStats}
          />
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {getStatsForRole.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <StatCard
                title={stat.title}
                value={stat.value}
                change={stat.change}
                icon={stat.icon}
                color={stat.color}
                format={stat.format}
                isLoading={statsLoading}
              />
            </motion.div>
          ))}
        </div>
      </ProgressiveLoading>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {user?.role === UserRole.RESTAURANT ? (
                  <>
                    <Button className="w-full justify-start" variant="outline">
                      <Briefcase className="h-4 w-4 mr-2" />
                      Post New Job
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Users className="h-4 w-4 mr-2" />
                      Review Applications
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Store className="h-4 w-4 mr-2" />
                      Browse Suppliers
                    </Button>
                  </>
                ) : (
                  <>
                    <Button className="w-full justify-start" variant="outline">
                      <Briefcase className="h-4 w-4 mr-2" />
                      Search Jobs
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Place Order
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Star className="h-4 w-4 mr-2" />
                      Leave Review
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Performance Overview */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Performance Overview</span>
                  </div>
                  <Badge variant="outline">
                    {selectedPeriod === '24h' ? 'Today' : periodOptions.find(p => p.value === selectedPeriod)?.label}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <InlineLoading text="Loading chart data..." />
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Chart visualization would appear here</p>
                      <p className="text-sm">Showing {selectedPeriod} data</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressiveLoading
                isLoading={activitiesLoading}
                error={activitiesError}
                isEmpty={!activities || activities.length === 0}
                loadingComponent={
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-3 p-3">
                        <div className="w-10 h-10 bg-muted rounded animate-pulse"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded animate-pulse"></div>
                          <div className="h-3 bg-muted rounded animate-pulse w-2/3"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                }
                emptyComponent={
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2" />
                    <p>No recent activity</p>
                  </div>
                }
              >
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {activities?.map((activity) => (
                    <ActivityItem
                      key={activity.id}
                      activity={activity}
                      onMarkAsRead={(id) => console.log('Mark as read:', id)}
                    />
                  ))}
                </div>
              </ProgressiveLoading>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                    <p>Revenue chart would appear here</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activity Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                    <p>Activity chart would appear here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}