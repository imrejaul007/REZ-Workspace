import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Package,
  Users,
  MapPin,
  Calendar,
  Download,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import clsx from 'clsx';

type TimeRange = 'today' | 'week' | 'month' | 'year';

const deliveryTimeData = [
  { day: 'Mon', avgTime: 26, target: 30 },
  { day: 'Tue', avgTime: 24, target: 30 },
  { day: 'Wed', avgTime: 28, target: 30 },
  { day: 'Thu', avgTime: 25, target: 30 },
  { day: 'Fri', avgTime: 32, target: 30 },
  { day: 'Sat', avgTime: 35, target: 30 },
  { day: 'Sun', avgTime: 30, target: 30 },
];

const hourlyPerformance = [
  { hour: '6AM', orders: 12, avgTime: 22 },
  { hour: '8AM', orders: 28, avgTime: 24 },
  { hour: '10AM', orders: 35, avgTime: 26 },
  { hour: '12PM', orders: 52, avgTime: 28 },
  { hour: '2PM', orders: 48, avgTime: 30 },
  { hour: '4PM', orders: 42, avgTime: 32 },
  { hour: '6PM', orders: 61, avgTime: 34 },
  { hour: '8PM', orders: 45, avgTime: 30 },
  { hour: '10PM', orders: 23, avgTime: 26 },
];

const riderPerformance = [
  { name: 'John D.', deliveries: 28, rating: 4.9, time: 24 },
  { name: 'Maria S.', deliveries: 25, rating: 4.8, time: 22 },
  { name: 'Alex K.', deliveries: 22, rating: 4.7, time: 28 },
  { name: 'David L.', deliveries: 20, rating: 4.6, time: 31 },
  { name: 'Emma W.', deliveries: 18, rating: 4.9, time: 19 },
];

const successRateData = [
  { name: 'Delivered', value: 94.2, color: '#22c55e' },
  { name: 'Customer Canceled', value: 3.1, color: '#f59e0b' },
  { name: 'Rider Canceled', value: 1.2, color: '#ef4444' },
  { name: 'Failed Attempt', value: 1.5, color: '#6b7280' },
];

const monthlyTrend = [
  { month: 'Jan', orders: 2840, revenue: 42500 },
  { month: 'Feb', orders: 3120, revenue: 46800 },
  { month: 'Mar', orders: 2980, revenue: 44700 },
  { month: 'Apr', orders: 3560, revenue: 53400 },
  { month: 'May', orders: 3890, revenue: 58350 },
  { month: 'Jun', orders: 4120, revenue: 61800 },
];

const peakHours = [
  { hour: '12:00 PM', orders: 127, status: 'peak' },
  { hour: '1:00 PM', orders: 118, status: 'peak' },
  { hour: '6:00 PM', orders: 142, status: 'peak' },
  { hour: '7:00 PM', orders: 135, status: 'peak' },
  { hour: '11:00 AM', orders: 98, status: 'high' },
  { hour: '5:00 PM', orders: 95, status: 'high' },
  { hour: '8:00 PM', orders: 89, status: 'high' },
  { hour: '10:00 AM', orders: 72, status: 'normal' },
];

const summaryStats = [
  {
    label: 'Total Deliveries',
    value: '21,630',
    change: '+12.5%',
    trend: 'up',
    icon: Package,
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
  },
  {
    label: 'Avg Delivery Time',
    value: '28 min',
    change: '-8.2%',
    trend: 'up',
    icon: Clock,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  {
    label: 'Success Rate',
    value: '96.8%',
    change: '+2.1%',
    trend: 'up',
    icon: TrendingUp,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    label: 'Active Riders',
    value: '156',
    change: '+8',
    trend: 'up',
    icon: Users,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
];

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Delivery performance and insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['today', 'week', 'month', 'year'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={clsx(
                  'px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors',
                  timeRange === range
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                {range}
              </button>
            ))}
          </div>
          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="stat-card">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  {stat.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {stat.change}
                </div>
              </div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delivery Time Trend */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Delivery Time Trend
            </h2>
            <span className="text-sm text-gray-500">vs Target (30 min)</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={deliveryTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} unit="m" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="avgTime"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                  name="Avg Time"
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#e5e7eb"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                  name="Target"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Success Rate Distribution */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Order Outcome
            </h2>
            <span className="text-sm text-gray-500">Last 30 days</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={successRateData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(1)}%`
                  }
                  labelLine={false}
                >
                  {successRateData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Performance */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Orders by Hour
            </h2>
            <span className="text-sm text-gray-500">Volume distribution</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="hour" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip />
                <Bar
                  dataKey="orders"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  name="Orders"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Hours */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Peak Hours</h2>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {peakHours.map((hour) => (
              <div
                key={hour.hour}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-900">
                    {hour.hour}
                  </span>
                  <span
                    className={clsx(
                      'badge',
                      hour.status === 'peak'
                        ? 'bg-red-50 text-red-700'
                        : hour.status === 'high'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-gray-100 text-gray-600'
                    )}
                  >
                    {hour.status}
                  </span>
                </div>
                <span className="font-semibold text-gray-900">
                  {hour.orders}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Third Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Monthly Orders & Revenue
            </h2>
            <span className="text-sm text-gray-500">6 months</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis
                  yAxisId="left"
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <Tooltip />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="orders"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorOrders)"
                  name="Orders"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  name="Revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rider Performance */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Top Performing Riders
            </h2>
            <span className="text-sm text-gray-500">This week</span>
          </div>
          <div className="space-y-4">
            {riderPerformance.map((rider, index) => (
              <div
                key={rider.name}
                className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
              >
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{rider.name}</div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      {rider.deliveries}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {rider.time}m avg
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-yellow-500">
                  <span className="text-lg font-bold">{rider.rating}</span>
                  <svg
                    className="w-4 h-4 fill-current"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
