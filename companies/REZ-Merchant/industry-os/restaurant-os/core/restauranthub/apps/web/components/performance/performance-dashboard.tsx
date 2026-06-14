'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Play,
  Pause,
  Settings,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Zap,
  Shield,
  Database,
  Server,
} from 'lucide-react';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
  target?: number;
}

interface LoadTest {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed' | 'pending';
  progress: number;
  startTime: Date;
  duration: number;
  type: 'load' | 'stress' | 'spike' | 'endurance';
  metrics?: {
    totalRequests: number;
    successfulRequests: number;
    averageResponseTime: number;
    throughput: number;
    errorRate: number;
  };
}

interface OptimizationRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'cache' | 'database' | 'api' | 'infrastructure';
  impact: string;
  effort: 'low' | 'medium' | 'high';
  implemented: boolean;
}

export function PerformanceDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loadTests, setLoadTests] = useState<LoadTest[]>([]);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [realTimeMetrics, setRealTimeMetrics] = useState<PerformanceMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize with mock data
    setRealTimeMetrics([
      {
        name: 'Response Time',
        value: 125,
        unit: 'ms',
        trend: 'down',
        status: 'good',
        target: 200,
      },
      {
        name: 'Throughput',
        value: 847,
        unit: 'req/s',
        trend: 'up',
        status: 'good',
        target: 800,
      },
      {
        name: 'Error Rate',
        value: 0.8,
        unit: '%',
        trend: 'stable',
        status: 'good',
        target: 5,
      },
      {
        name: 'CPU Usage',
        value: 45,
        unit: '%',
        trend: 'up',
        status: 'good',
        target: 80,
      },
      {
        name: 'Memory Usage',
        value: 62,
        unit: '%',
        trend: 'stable',
        status: 'warning',
        target: 70,
      },
      {
        name: 'Cache Hit Rate',
        value: 94,
        unit: '%',
        trend: 'up',
        status: 'good',
        target: 90,
      },
    ]);

    setLoadTests([
      {
        id: 'test_1',
        name: 'API Load Test',
        status: 'running',
        progress: 65,
        startTime: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes ago
        duration: 300, // 5 minutes
        type: 'load',
        metrics: {
          totalRequests: 12500,
          successfulRequests: 12430,
          averageResponseTime: 125,
          throughput: 847,
          errorRate: 0.8,
        },
      },
      {
        id: 'test_2',
        name: 'Database Stress Test',
        status: 'completed',
        progress: 100,
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        duration: 600, // 10 minutes
        type: 'stress',
        metrics: {
          totalRequests: 45000,
          successfulRequests: 43200,
          averageResponseTime: 250,
          throughput: 720,
          errorRate: 4.0,
        },
      },
      {
        id: 'test_3',
        name: 'Spike Test',
        status: 'completed',
        progress: 100,
        startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        duration: 180, // 3 minutes
        type: 'spike',
        metrics: {
          totalRequests: 15000,
          successfulRequests: 14850,
          averageResponseTime: 180,
          throughput: 1250,
          errorRate: 1.0,
        },
      },
    ]);

    setRecommendations([
      {
        id: 'rec_1',
        title: 'Optimize Database Queries',
        description: 'Several slow queries detected that could benefit from indexing and optimization.',
        priority: 'high',
        category: 'database',
        impact: '30-50% response time reduction',
        effort: 'medium',
        implemented: false,
      },
      {
        id: 'rec_2',
        title: 'Implement Response Caching',
        description: 'Add caching for frequently accessed API endpoints to reduce database load.',
        priority: 'medium',
        category: 'cache',
        impact: '20-30% faster responses',
        effort: 'low',
        implemented: true,
      },
      {
        id: 'rec_3',
        title: 'Scale Infrastructure',
        description: 'Current infrastructure shows signs of resource constraints during peak loads.',
        priority: 'high',
        category: 'infrastructure',
        impact: 'Better handling of traffic spikes',
        effort: 'high',
        implemented: false,
      },
      {
        id: 'rec_4',
        title: 'API Response Optimization',
        description: 'Some endpoints return unnecessary data, increasing response times.',
        priority: 'medium',
        category: 'api',
        impact: '15-25% payload reduction',
        effort: 'medium',
        implemented: false,
      },
    ]);

    setIsLoading(false);

    // Simulate real-time updates
    const interval = setInterval(() => {
      setRealTimeMetrics(prev => prev.map(metric => ({
        ...metric,
        value: Math.max(0, metric.value + (Math.random() - 0.5) * 10),
      })));

      setLoadTests(prev => prev.map(test => {
        if (test.status === 'running') {
          const newProgress = Math.min(100, test.progress + Math.random() * 5);
          return {
            ...test,
            progress: newProgress,
            status: newProgress >= 100 ? 'completed' : 'running',
          };
        }
        return test;
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'critical':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getTestTypeIcon = (type: string) => {
    switch (type) {
      case 'load':
        return <Activity className="h-4 w-4" />;
      case 'stress':
        return <Zap className="h-4 w-4" />;
      case 'spike':
        return <TrendingUp className="h-4 w-4" />;
      case 'endurance':
        return <Clock className="h-4 w-4" />;
      default:
        return <Play className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'cache':
        return <Zap className="h-4 w-4" />;
      case 'api':
        return <Activity className="h-4 w-4" />;
      case 'infrastructure':
        return <Server className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor system performance, run load tests, and optimize based on recommendations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
          <Button>
            <Play className="h-4 w-4 mr-2" />
            Run Test
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tests">Load Tests</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="optimization">Auto-Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {realTimeMetrics.map((metric, index) => (
              <motion.div
                key={metric.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {metric.name}
                    </CardTitle>
                    {getTrendIcon(metric.trend)}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      <span className={getStatusColor(metric.status)}>
                        {metric.value.toFixed(metric.unit === '%' ? 1 : 0)}
                        {metric.unit}
                      </span>
                    </div>
                    {metric.target && (
                      <div className="mt-2">
                        <Progress
                          value={Math.min(100, (metric.value / metric.target) * 100)}
                          className="h-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Target: {metric.target}{metric.unit}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>
                  Overall system performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">API Response Time</span>
                  <Badge variant="secondary">Excellent</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database Performance</span>
                  <Badge variant="default">Good</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Cache Efficiency</span>
                  <Badge variant="secondary">Excellent</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Resource Utilization</span>
                  <Badge variant="outline">Warning</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest performance events and optimizations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm">Cache optimization completed</p>
                    <p className="text-xs text-muted-foreground">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm">High memory usage detected</p>
                    <p className="text-xs text-muted-foreground">15 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm">Load test completed successfully</p>
                    <p className="text-xs text-muted-foreground">1 hour ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tests" className="space-y-6">
          <div className="grid gap-4">
            {loadTests.map((test, index) => (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getTestTypeIcon(test.type)}
                        <div>
                          <CardTitle className="text-lg">{test.name}</CardTitle>
                          <CardDescription>
                            {test.type.charAt(0).toUpperCase() + test.type.slice(1)} Test •{' '}
                            {Math.floor(test.duration / 60)}m {test.duration % 60}s duration
                          </CardDescription>
                        </div>
                      </div>
                      <Badge
                        variant={
                          test.status === 'completed'
                            ? 'secondary'
                            : test.status === 'running'
                            ? 'default'
                            : test.status === 'failed'
                            ? 'destructive'
                            : 'outline'
                        }
                      >
                        {test.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {test.status === 'running' && (
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Progress</span>
                            <span>{test.progress.toFixed(0)}%</span>
                          </div>
                          <Progress value={test.progress} className="h-2" />
                        </div>
                      )}

                      {test.metrics && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">
                              {test.metrics.totalRequests.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">Total Requests</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">
                              {test.metrics.averageResponseTime}ms
                            </p>
                            <p className="text-xs text-muted-foreground">Avg Response</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-purple-600">
                              {test.metrics.throughput}
                            </p>
                            <p className="text-xs text-muted-foreground">Req/sec</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-orange-600">
                              {test.metrics.errorRate.toFixed(1)}%
                            </p>
                            <p className="text-xs text-muted-foreground">Error Rate</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-teal-600">
                              {((test.metrics.successfulRequests / test.metrics.totalRequests) * 100).toFixed(1)}%
                            </p>
                            <p className="text-xs text-muted-foreground">Success Rate</p>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>Started: {test.startTime.toLocaleTimeString()}</span>
                        {test.status === 'running' && (
                          <Button variant="outline" onClick={() => {}}>
                            <Pause className="h-4 w-4 mr-2" />
                            Stop Test
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <div className="grid gap-4">
            {recommendations.map((recommendation, index) => (
              <motion.div
                key={recommendation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getCategoryIcon(recommendation.category)}
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{recommendation.title}</CardTitle>
                          <CardDescription>{recommendation.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getPriorityColor(recommendation.priority)}>
                          {recommendation.priority}
                        </Badge>
                        {recommendation.implemented && (
                          <Badge variant="secondary">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Implemented
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium">Expected Impact</p>
                        <p className="text-sm text-muted-foreground">{recommendation.impact}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Implementation Effort</p>
                        <Badge variant="outline">{recommendation.effort}</Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Category</p>
                        <Badge variant="secondary">{recommendation.category}</Badge>
                      </div>
                    </div>
                    {!recommendation.implemented && (
                      <div className="mt-4 flex space-x-2">
                        <Button onClick={() => {}}>Implement</Button>
                        <Button variant="outline" onClick={() => {}}>Learn More</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Automated Optimization</CardTitle>
              <CardDescription>
                Configure rules for automatic performance optimization and monitoring
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Auto-scaling Rules</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">High CPU Usage</span>
                        <Badge variant="secondary">Active</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Memory Threshold</span>
                        <Badge variant="secondary">Active</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Response Time Alert</span>
                        <Badge variant="outline">Disabled</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Cache Optimization</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Auto Cache Refresh</span>
                        <Badge variant="secondary">Active</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Intelligent Preloading</span>
                        <Badge variant="secondary">Active</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Cache Warming</span>
                        <Badge variant="secondary">Active</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex space-x-2">
                <Button>Configure Rules</Button>
                <Button variant="outline">View Logs</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}