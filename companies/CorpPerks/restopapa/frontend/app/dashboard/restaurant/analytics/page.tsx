'use client';

import { useState } from 'react';
import { 
  ChartBarIcon,
  CurrencyRupeeIcon,
  UserGroupIcon,
  TruckIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  StarIcon,
  ShoppingCartIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  FireIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

interface SalesData {
  date: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
}

interface TopMenuItem {
  id: string;
  name: string;
  category: string;
  orders: number;
  revenue: number;
  rating: number;
}

interface CustomerInsight {
  metric: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

interface EmployeePerformance {
  id: string
  name: string
  role: string
  rating: number
  ordersHandled: number
  customerRating: number
  efficiency: number
}

interface InventoryAlert {
  id: string
  item: string
  currentStock: number
  minStock: number
  status: 'critical' | 'low' | 'warning'
  supplier: string
  lastOrdered: string
}

export default function RestaurantAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [activeTab, setActiveTab] = useState('overview');

  const salesData: SalesData[] = [
    { date: '2025-01-01', revenue: 45000, orders: 120, averageOrderValue: 375 },
    { date: '2025-01-02', revenue: 52000, orders: 135, averageOrderValue: 385 },
    { date: '2025-01-03', revenue: 38000, orders: 95, averageOrderValue: 400 },
    { date: '2025-01-04', revenue: 61000, orders: 150, averageOrderValue: 407 },
    { date: '2025-01-05', revenue: 48000, orders: 125, averageOrderValue: 384 },
    { date: '2025-01-06', revenue: 55000, orders: 142, averageOrderValue: 387 },
    { date: '2025-01-07', revenue: 49000, orders: 128, averageOrderValue: 383 },
  ];

  const topMenuItems: TopMenuItem[] = [
    {
      id: 'item_1',
      name: 'Butter Chicken',
      category: 'Main Course',
      orders: 245,
      revenue: 85750,
      rating: 4.8
    },
    {
      id: 'item_2',
      name: 'Chicken Biryani',
      category: 'Rice & Biryani',
      orders: 198,
      revenue: 89100,
      rating: 4.7
    },
    {
      id: 'item_3',
      name: 'Paneer Tikka',
      category: 'Starters',
      orders: 156,
      revenue: 43680,
      rating: 4.6
    },
    {
      id: 'item_4',
      name: 'Garlic Naan',
      category: 'Breads',
      orders: 312,
      revenue: 24960,
      rating: 4.5
    },
    {
      id: 'item_5',
      name: 'Dal Makhani',
      category: 'Vegetarian',
      orders: 134,
      revenue: 24120,
      rating: 4.4
    }
  ];

  const customerInsights: CustomerInsight[] = [
    {
      metric: 'New Customers',
      value: '145',
      change: 12.5,
      trend: 'up'
    },
    {
      metric: 'Returning Customers',
      value: '68%',
      change: 5.2,
      trend: 'up'
    },
    {
      metric: 'Customer Satisfaction',
      value: '4.6/5',
      change: 0.2,
      trend: 'up'
    },
    {
      metric: 'Average Visit Frequency',
      value: '2.3x/month',
      change: -0.1,
      trend: 'down'
    },
    {
      metric: 'Customer Lifetime Value',
      value: '₹12,450',
      change: 8.7,
      trend: 'up'
    },
    {
      metric: 'Complaint Rate',
      value: '2.1%',
      change: -0.8,
      trend: 'up'
    }
  ];

  const employeePerformance: EmployeePerformance[] = [
    {
      id: '1',
      name: 'Rajesh Kumar',
      role: 'Head Chef',
      rating: 4.8,
      ordersHandled: 145,
      customerRating: 4.9,
      efficiency: 95
    },
    {
      id: '2',
      name: 'Priya Sharma',
      role: 'Server',
      rating: 4.6,
      ordersHandled: 98,
      customerRating: 4.7,
      efficiency: 88
    },
    {
      id: '3',
      name: 'Amit Singh',
      role: 'Cashier',
      rating: 4.4,
      ordersHandled: 156,
      customerRating: 4.5,
      efficiency: 82
    }
  ];

  const inventoryAlerts: InventoryAlert[] = [
    {
      id: '1',
      item: 'Tomatoes',
      currentStock: 5,
      minStock: 20,
      status: 'critical',
      supplier: 'Mandi Fresh',
      lastOrdered: '3 days ago'
    },
    {
      id: '2',
      item: 'Chicken',
      currentStock: 8,
      minStock: 15,
      status: 'low',
      supplier: 'Protein Palace',
      lastOrdered: '1 day ago'
    },
    {
      id: '3',
      item: 'Cooking Oil',
      currentStock: 12,
      minStock: 20,
      status: 'warning',
      supplier: 'Kitchen Essentials',
      lastOrdered: '5 days ago'
    }
  ];

  const operationalMetrics = {
    todaysOrders: 87,
    pendingOrders: 12,
    completedOrders: 75,
    avgPreparationTime: '18 mins',
    kitchenEfficiency: '94%',
    deliverySuccess: '97.2%',
    staffOnDuty: 15,
    totalStaff: 18,
    currentOccupancy: '65%',
    tableUtilization: '78%'
  };

  const revenueBreakdown = {
    dineIn: { amount: 285000, percentage: 45 },
    delivery: { amount: 316500, percentage: 50 },
    takeaway: { amount: 31650, percentage: 5 }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '➡️';
    }
  };

  const getTrendColor = (trend: string, isPositive: boolean = true) => {
    if (trend === 'stable') return 'text-gray-600';
    if (trend === 'up') return isPositive ? 'text-green-600' : 'text-red-600';
    if (trend === 'down') return isPositive ? 'text-red-600' : 'text-green-600';
    return 'text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="mt-2 text-gray-600">Track your restaurant's performance and insights</p>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-4">
            <select 
              value={selectedPeriod} 
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="12m">Last 12 months</option>
            </select>
            
            <select 
              value={selectedMetric} 
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="revenue">Revenue</option>
              <option value="orders">Orders</option>
              <option value="aov">Average Order Value</option>
            </select>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Export Data
          </button>
        </div>

        <div className="mb-6">
          <div className="flex space-x-4 border-b">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2 px-1 ${activeTab === 'overview' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('employees')}
              className={`pb-2 px-1 ${activeTab === 'employees' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            >
              Employee Performance
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`pb-2 px-1 ${activeTab === 'inventory' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            >
              Inventory Alerts
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`pb-2 px-1 ${activeTab === 'reports' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            >
              Reports
            </button>
          </div>
        </div>

        {activeTab === 'overview' && (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-blue-600 text-xl">💰</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">₹6.3L</p>
                  <p className="ml-2 text-sm font-medium text-green-600">+15.2%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-green-600 text-xl">📦</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">1,245</p>
                  <p className="ml-2 text-sm font-medium text-green-600">+8.7%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-purple-600 text-xl">💳</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">₹506</p>
                  <p className="ml-2 text-sm font-medium text-green-600">+3.4%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-yellow-600 text-xl">⭐</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Customer Rating</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">4.6</p>
                  <p className="ml-2 text-sm font-medium text-green-600">+0.2</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Revenue Breakdown</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-500 rounded mr-3"></div>
                    <span className="text-sm text-gray-700">Delivery Orders</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(revenueBreakdown.delivery.amount)}</div>
                    <div className="text-xs text-gray-500">{revenueBreakdown.delivery.percentage}%</div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded mr-3"></div>
                    <span className="text-sm text-gray-700">Dine-in Orders</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(revenueBreakdown.dineIn.amount)}</div>
                    <div className="text-xs text-gray-500">{revenueBreakdown.dineIn.percentage}%</div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-yellow-500 rounded mr-3"></div>
                    <span className="text-sm text-gray-700">Takeaway Orders</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(revenueBreakdown.takeaway.amount)}</div>
                    <div className="text-xs text-gray-500">{revenueBreakdown.takeaway.percentage}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Operational Metrics</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-blue-600">{operationalMetrics.todaysOrders}</div>
                  <div className="text-sm text-gray-600">Today's Orders</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-orange-600">{operationalMetrics.pendingOrders}</div>
                  <div className="text-sm text-gray-600">Pending Orders</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-green-600">{operationalMetrics.avgPreparationTime}</div>
                  <div className="text-sm text-gray-600">Avg Prep Time</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-purple-600">{operationalMetrics.kitchenEfficiency}</div>
                  <div className="text-sm text-gray-600">Kitchen Efficiency</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-indigo-600">{operationalMetrics.currentOccupancy}</div>
                  <div className="text-sm text-gray-600">Current Occupancy</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-teal-600">{operationalMetrics.deliverySuccess}</div>
                  <div className="text-sm text-gray-600">Delivery Success</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Top Menu Items</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {topMenuItems.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600 mr-3">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.category}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(item.revenue)}</div>
                      <div className="text-xs text-gray-500">{item.orders} orders • ⭐ {item.rating}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Customer Insights</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {customerInsights.map((insight, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border-l-4 border-blue-500 bg-blue-50">
                    <div>
                      <div className="font-medium text-gray-900">{insight.metric}</div>
                      <div className="text-2xl font-bold text-blue-600">{insight.value}</div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center">
                        <span className="mr-1">{getTrendIcon(insight.trend)}</span>
                        <span className={`text-sm font-medium ${getTrendColor(insight.trend, insight.change >= 0)}`}>
                          {insight.change > 0 ? '+' : ''}{insight.change}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Sales Trend</h3>
            <p className="text-sm text-gray-500">Daily performance over the selected period</p>
          </div>
          <div className="p-6">
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl text-gray-400 mb-2">📈</div>
                <div className="text-gray-600">Sales Chart</div>
                <div className="text-sm text-gray-500 mt-2">
                  Interactive chart showing {selectedMetric} trends for {selectedPeriod}
                </div>
                <div className="mt-4 grid grid-cols-7 gap-2">
                  {salesData.map((data, index) => (
                    <div key={index} className="text-center">
                      <div className="text-xs text-gray-500 mb-1">
                        {new Date(data.date).toLocaleDateString('en-IN', { weekday: 'short' })}
                      </div>
                      <div className="bg-blue-500 rounded" style={{ 
                        height: `${(data.revenue / Math.max(...salesData.map(d => d.revenue))) * 80}px`,
                        minHeight: '4px'
                      }}></div>
                      <div className="text-xs text-gray-600 mt-1">
                        {selectedMetric === 'revenue' && formatCurrency(data.revenue)}
                        {selectedMetric === 'orders' && data.orders}
                        {selectedMetric === 'aov' && `₹${data.averageOrderValue}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center">
            <span className="mr-2">📊</span>
            Download Report
          </button>
          <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center justify-center">
            <span className="mr-2">📧</span>
            Email Report
          </button>
          <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 flex items-center justify-center">
            <span className="mr-2">🔄</span>
            Schedule Reports
          </button>
        </div>
        </>
        )}

        {activeTab === 'employees' && (
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Employee Performance</h2>
              <p className="text-gray-600 mt-1">Track your team's productivity and customer service quality</p>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {employeePerformance.map((employee) => (
                  <div key={employee.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{employee.name}</h3>
                        <p className="text-gray-600">{employee.role}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`h-4 w-4 ${
                                i < Math.floor(employee.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="ml-1 text-sm text-gray-600">({employee.rating})</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-lg mx-auto mb-2">
                          <ShoppingCartIcon className="h-6 w-6" />
                        </div>
                        <p className="text-xl font-semibold text-gray-900">{employee.ordersHandled}</p>
                        <p className="text-sm text-gray-500">Orders Handled</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-lg mx-auto mb-2">
                          <StarIcon className="h-6 w-6" />
                        </div>
                        <p className="text-xl font-semibold text-gray-900">{employee.customerRating}</p>
                        <p className="text-sm text-gray-500">Customer Rating</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-lg mx-auto mb-2">
                          <ChartBarIcon className="h-6 w-6" />
                        </div>
                        <p className="text-xl font-semibold text-gray-900">{employee.efficiency}%</p>
                        <p className="text-sm text-gray-500">Efficiency</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Overall Performance</span>
                        <span>{employee.efficiency}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            employee.efficiency >= 90 ? 'bg-green-500' :
                            employee.efficiency >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${employee.efficiency}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Inventory Alerts</h2>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                  View Full Inventory
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-8 w-8 text-red-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-red-600">Critical Items</p>
                      <p className="text-2xl font-semibold text-red-900">
                        {inventoryAlerts.filter(item => item.status === 'critical').length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <ClockIcon className="h-8 w-8 text-yellow-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-yellow-600">Low Stock</p>
                      <p className="text-2xl font-semibold text-yellow-900">
                        {inventoryAlerts.filter(item => item.status === 'low').length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <EyeIcon className="h-8 w-8 text-orange-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-orange-600">Watch List</p>
                      <p className="text-2xl font-semibold text-orange-900">
                        {inventoryAlerts.filter(item => item.status === 'warning').length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {inventoryAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        alert.status === 'critical' ? 'bg-red-500' :
                        alert.status === 'low' ? 'bg-yellow-500' : 'bg-orange-500'
                      }`} />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{alert.item}</h3>
                        <p className="text-xs text-gray-500">
                          Current: {alert.currentStock} kg | Min: {alert.minStock} kg
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-900">{alert.supplier}</p>
                      <p className="text-xs text-gray-500">Last ordered: {alert.lastOrdered}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        alert.status === 'critical' ? 'bg-red-100 text-red-800' :
                        alert.status === 'low' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {alert.status.toUpperCase()}
                      </span>
                      <button className="bg-blue-600 text-white px-3 py-1 text-xs rounded-md hover:bg-blue-700">
                        Reorder
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Reports & Export</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center mb-4">
                  <ChartBarIcon className="h-8 w-8 text-blue-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Sales Report</h3>
                </div>
                <p className="text-gray-600 mb-4">Detailed analysis of sales performance, revenue trends, and order statistics.</p>
                <button className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">
                  Generate Report
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center mb-4">
                  <UserGroupIcon className="h-8 w-8 text-green-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Employee Report</h3>
                </div>
                <p className="text-gray-600 mb-4">Performance metrics, attendance records, and productivity analysis.</p>
                <button className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700">
                  Generate Report
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center mb-4">
                  <TruckIcon className="h-8 w-8 text-purple-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Inventory Report</h3>
                </div>
                <p className="text-gray-600 mb-4">Stock levels, consumption patterns, and supplier performance.</p>
                <button className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700">
                  Generate Report
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center mb-4">
                  <CurrencyRupeeIcon className="h-8 w-8 text-yellow-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Financial Report</h3>
                </div>
                <p className="text-gray-600 mb-4">Revenue, expenses, profit margins, and cash flow analysis.</p>
                <button className="w-full bg-yellow-600 text-white py-2 rounded-md hover:bg-yellow-700">
                  Generate Report
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center mb-4">
                  <StarIcon className="h-8 w-8 text-red-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Customer Report</h3>
                </div>
                <p className="text-gray-600 mb-4">Customer satisfaction, feedback analysis, and loyalty metrics.</p>
                <button className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700">
                  Generate Report
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center mb-4">
                  <DocumentTextIcon className="h-8 w-8 text-gray-600 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">Custom Report</h3>
                </div>
                <p className="text-gray-600 mb-4">Create customized reports with specific metrics and date ranges.</p>
                <button className="w-full bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700">
                  Create Custom
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}