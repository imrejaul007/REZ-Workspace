/**
 * TreasuryOS Dashboard - Main Dashboard Page
 */

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  PiggyBank,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface DashboardProps {
  businessId: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export const Dashboard: React.FC<DashboardProps> = ({ businessId }) => {
  // Mock data - replace with actual API calls
  const cashPosition = {
    totalBalance: 2450000,
    totalReserved: 350000,
    totalAvailable: 2100000,
    change: 12.5,
  };

  const forecastData = [
    { week: 'W1', inflow: 450000, outflow: 320000, balance: 2580000 },
    { week: 'W2', inflow: 520000, outflow: 380000, balance: 2720000 },
    { week: 'W3', inflow: 480000, outflow: 350000, balance: 2850000 },
    { week: 'W4', inflow: 550000, outflow: 420000, balance: 2980000 },
    { week: 'W5', inflow: 500000, outflow: 380000, balance: 3100000 },
    { week: 'W6', inflow: 580000, outflow: 400000, balance: 3280000 },
  ];

  const investmentAllocation = [
    { name: 'Fixed Deposits', value: 45 },
    { name: 'Mutual Funds', value: 30 },
    { name: 'Bonds', value: 15 },
    { name: 'Money Market', value: 10 },
  ];

  const alerts = [
    { id: 1, severity: 'high', message: 'FD of ₹5L maturing in 7 days', time: '2h ago' },
    { id: 2, severity: 'medium', message: 'Cash flow below target for Week 3', time: '5h ago' },
  ];

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Treasury Dashboard</h1>
          <p className="text-gray-500">Real-time cash position and forecasting</p>
        </div>
        <div className="flex gap-3">
          <select className="px-4 py-2 border rounded-lg">
            <option value={businessId}>Current Business</option>
          </select>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Generate Forecast
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Balance"
          value={formatCurrency(cashPosition.totalBalance)}
          change={cashPosition.change}
          icon={<DollarSign className="w-6 h-6" />}
          color="blue"
        />
        <KPICard
          title="Available Balance"
          value={formatCurrency(cashPosition.totalAvailable)}
          change={8.2}
          icon={<PiggyBank className="w-6 h-6" />}
          color="green"
        />
        <KPICard
          title="Invested"
          value={formatCurrency(850000)}
          change={15.3}
          icon={<TrendingUp className="w-6 h-6" />}
          color="purple"
        />
        <KPICard
          title="Forecast (13wk)"
          value={formatCurrency(3280000)}
          change={-3.1}
          icon={<Target className="w-6 h-6" />}
          color="orange"
          negative
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">13-Week Cash Flow Forecast</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis
                  tickFormatter={(value) =>
                    `₹${(value / 100000).toFixed(0)}L`
                  }
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="Projected Balance"
                />
                <Line
                  type="monotone"
                  dataKey="inflow"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Inflow"
                />
                <Line
                  type="monotone"
                  dataKey="outflow"
                  stroke="#EF4444"
                  strokeWidth={2}
                  name="Outflow"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts & Investments */}
        <div className="space-y-6">
          {/* Alerts */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Alerts</h2>
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                {alerts.length}
              </span>
            </div>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg"
                >
                  <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-gray-500">{alert.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Investment Allocation */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Investment Allocation</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={investmentAllocation}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {investmentAllocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {investmentAllocation.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index] }}
                  />
                  <span className="text-xs text-gray-600">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <QuickAction
          title="Create Account"
          description="Add new treasury account"
          icon={<ArrowUpRight className="w-5 h-5" />}
        />
        <QuickAction
          title="Transfer Funds"
          description="Move between accounts"
          icon={<ArrowUpRight className="w-5 h-5" />}
        />
        <QuickAction
          title="New Investment"
          description="FD, MF, or Bonds"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <QuickAction
          title="View Reports"
          description="Cash flow reports"
          icon={<ArrowDownRight className="w-5 h-5" />}
        />
      </div>
    </div>
  );
};

interface KPICardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  color: string;
  negative?: boolean;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  icon,
  color,
  negative,
}) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        <div
          className={`flex items-center gap-1 text-sm ${
            negative ? 'text-red-600' : 'text-green-600'
          }`}
        >
          {negative ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
          {Math.abs(change)}%
        </div>
      </div>
      <p className="text-2xl font-bold mt-4">{value}</p>
      <p className="text-gray-500 text-sm">{title}</p>
    </div>
  );
};

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const QuickAction: React.FC<QuickActionProps> = ({ title, description, icon }) => (
  <button className="bg-white rounded-xl shadow-sm p-4 text-left hover:shadow-md transition-shadow">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">{icon}</div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  </button>
);

export default Dashboard;
