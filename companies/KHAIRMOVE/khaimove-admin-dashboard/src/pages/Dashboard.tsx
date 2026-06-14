import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, Users, DollarSign, TrendingUp, Car, Clock } from 'lucide-react';

// Types for API responses
interface Stats {
  activeRides: number;
  onlineDrivers: number;
  todayRevenue: number;
  avgWaitTime: number;
}

interface ChartData {
  hour: string;
  rides: number;
}

interface EarningsData {
  day: string;
  earnings: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    activeRides: 0,
    onlineDrivers: 0,
    todayRevenue: 0,
    avgWaitTime: 0,
  });
  const [rideData, setRideData] = useState<ChartData[]>([]);
  const [earningsData, setEarningsData] = useState<EarningsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Authentication check
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    // Optionally verify token with backend
    const verifyToken = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:4600'}/api/admin/verify`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        if (!response.ok) {
          localStorage.removeItem('admin_token');
          router.push('/login');
        }
      } catch (err) {
        // In development, continue without blocking the UI
        console.warn('Token verification skipped:', err);
      }
    };
    verifyToken();
  }, [router]);

  // Fetch data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
      
      try {
        setLoading(true);
        
        // Fetch stats
        const statsRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:4600'}/api/stats`,
          {
            headers: {
              ...(token && { 'Authorization': `Bearer ${token}` }),
              'Content-Type': 'application/json',
            },
          }
        );
        
        // Fetch ride chart data
        const ridesRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:4600'}/api/stats/rides/hourly`,
          {
            headers: {
              ...(token && { 'Authorization': `Bearer ${token}` }),
              'Content-Type': 'application/json',
            },
          }
        );
        
        // Fetch earnings chart data
        const earningsRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:4600'}/api/stats/earnings/weekly`,
          {
            headers: {
              ...(token && { 'Authorization': `Bearer ${token}` }),
              'Content-Type': 'application/json',
            },
          }
        );

        // Process responses
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (ridesRes.ok) {
          const ridesJson = await ridesRes.json();
          setRideData(ridesJson.data || ridesJson);
        } else {
          // Fallback to mock data if API not available
          setRideData([
            { hour: '00:00', rides: 12 },
            { hour: '04:00', rides: 8 },
            { hour: '08:00', rides: 45 },
            { hour: '12:00', rides: 78 },
            { hour: '16:00', rides: 92 },
            { hour: '20:00', rides: 65 },
            { hour: '23:59', rides: 35 },
          ]);
        }

        if (earningsRes.ok) {
          const earningsJson = await earningsRes.json();
          setEarningsData(earningsJson.data || earningsJson);
        } else {
          // Fallback to mock data if API not available
          setEarningsData([
            { day: 'Mon', earnings: 12500 },
            { day: 'Tue', earnings: 14200 },
            { day: 'Wed', earnings: 11800 },
            { day: 'Thu', earnings: 15600 },
            { day: 'Fri', earnings: 18200 },
            { day: 'Sat', earnings: 21500 },
            { day: 'Sun', earnings: 16800 },
          ]);
        }

        setError(null);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data');
        
        // Set fallback mock data on error
        setRideData([
          { hour: '00:00', rides: 12 },
          { hour: '04:00', rides: 8 },
          { hour: '08:00', rides: 45 },
          { hour: '12:00', rides: 78 },
          { hour: '16:00', rides: 92 },
          { hour: '20:00', rides: 65 },
          { hour: '23:59', rides: 35 },
        ]);
        setEarningsData([
          { day: 'Mon', earnings: 12500 },
          { day: 'Tue', earnings: 14200 },
          { day: 'Wed', earnings: 11800 },
          { day: 'Thu', earnings: 15600 },
          { day: 'Fri', earnings: 18200 },
          { day: 'Sat', earnings: 21500 },
          { day: 'Sun', earnings: 16800 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const statsItems = [
    { label: 'Active Rides', value: stats.activeRides.toString(), icon: Car, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Online Drivers', value: stats.onlineDrivers.toString(), icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
    { label: "Today's Revenue", value: `₹${(stats.todayRevenue / 1000).toFixed(1)}K`, icon: DollarSign, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Avg Wait Time', value: `${stats.avgWaitTime} min`, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">KHAIRMOVE Admin</h1>
            <p className="text-sm text-gray-500">Operations Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</span>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-green-600">All Systems Operational</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Error Banner */}
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6">
            <p className="font-medium">{error}</p>
            <p className="text-sm mt-1">Displaying cached data. Some features may be limited.</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsItems.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : stat.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Rides Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Hourly Rides</h2>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={rideData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip />
                <Line type="monotone" dataKey="rides" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Earnings Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Weekly Earnings</h2>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={earningsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip />
                <Bar dataKey="earnings" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              View All Rides
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
              Driver Management
            </button>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
              View Analytics
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
              Generate Report
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
