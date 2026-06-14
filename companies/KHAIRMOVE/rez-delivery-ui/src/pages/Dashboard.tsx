import {
  Package,
  Users,
  Clock,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import OrderCard from '../components/OrderCard';

const hourlyData = [
  { hour: '6AM', orders: 12 },
  { hour: '8AM', orders: 28 },
  { hour: '10AM', orders: 35 },
  { hour: '12PM', orders: 52 },
  { hour: '2PM', orders: 48 },
  { hour: '4PM', orders: 42 },
  { hour: '6PM', orders: 61 },
  { hour: '8PM', orders: 45 },
  { hour: '10PM', orders: 23 },
];

const statusDistribution = [
  { name: 'Delivered', value: 78, color: '#22c55e' },
  { name: 'In Transit', value: 15, color: '#3b82f6' },
  { name: 'Pending', value: 7, color: '#f59e0b' },
];

const recentOrders = [
  {
    id: 'ORD-7829',
    customer: 'Sarah Mitchell',
    address: '742 Evergreen Terrace, Springfield',
    status: 'in_transit' as const,
    time: '12 mins ago',
    amount: 34.50,
    rider: 'John D.',
  },
  {
    id: 'ORD-7828',
    customer: 'Michael Chen',
    address: '221B Baker Street, London District',
    status: 'pending' as const,
    time: '8 mins ago',
    amount: 28.00,
    rider: null,
  },
  {
    id: 'ORD-7827',
    customer: 'Emma Wilson',
    address: '1600 Pennsylvania Avenue, Metro City',
    status: 'delivered' as const,
    time: '5 mins ago',
    amount: 52.75,
    rider: 'Alex K.',
  },
  {
    id: 'ORD-7826',
    customer: 'James Rodriguez',
    address: '350 Fifth Avenue, Manhattan',
    status: 'delivered' as const,
    time: '2 mins ago',
    amount: 19.99,
    rider: 'Maria S.',
  },
];

const stats = [
  {
    label: 'Active Orders',
    value: '47',
    change: '+12%',
    trend: 'up',
    icon: Package,
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
  },
  {
    label: 'Riders on Duty',
    value: '23',
    change: '+3',
    trend: 'up',
    icon: Users,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  {
    label: 'Avg Delivery Time',
    value: '28 min',
    change: '-8%',
    trend: 'up',
    icon: Clock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  {
    label: 'Success Rate',
    value: '96.8%',
    change: '+2.1%',
    trend: 'up',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="stat-card">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders Over Time */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Orders Today
            </h2>
            <span className="text-sm text-gray-500">346 total orders</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="hour"
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="orders"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorOrders)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Order Status
          </h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {statusDistribution.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-600">{item.name}</span>
                </div>
                <span className="font-medium text-gray-900">
                  {item.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          <Link
            to="/orders"
            className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      </div>
    </div>
  );
}
