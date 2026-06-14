import { useState, useEffect } from 'react';
import { Bell, Search, TrendingUp, TrendingDown, Users, DollarSign, ShoppingCart, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { getBenchmark, getSegments, chat } from '../services/api';

// Mock data as fallback
const mockRevenueData = [
  { day: 'Mon', revenue: 12500, orders: 45 },
  { day: 'Tue', revenue: 15200, orders: 52 },
  { day: 'Wed', revenue: 11800, orders: 41 },
  { day: 'Thu', revenue: 16800, orders: 58 },
  { day: 'Fri', revenue: 21500, orders: 72 },
  { day: 'Sat', revenue: 25200, orders: 85 },
  { day: 'Sun', revenue: 19800, orders: 68 },
];

const mockHourlyDemand = [
  { hour: '9AM', demand: 45 },
  { hour: '10AM', demand: 65 },
  { hour: '11AM', demand: 80 },
  { hour: '12PM', demand: 95 },
  { hour: '1PM', demand: 75 },
  { hour: '2PM', demand: 55 },
  { hour: '5PM', demand: 70 },
  { hour: '6PM', demand: 85 },
  { hour: '7PM', demand: 100 },
  { hour: '8PM', demand: 90 },
  { hour: '9PM', demand: 70 },
];

const mockUpcomingEvents = [
  { name: 'Weekend Sale', date: 'Dec 14', daysUntil: 3, impact: 'High demand expected' },
  { name: 'Christmas', date: 'Dec 25', daysUntil: 14, impact: '+40% demand surge' },
  { name: 'New Year', date: 'Jan 1', daysUntil: 21, impact: '+60% demand surge' },
];

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [benchmark, setBenchmark] = useState<any>(null);
  const [segments, setSegments] = useState<any>(null);
  const [revenueData, setRevenueData] = useState(mockRevenueData);
  const [hourlyDemand, setHourlyDemand] = useState(mockHourlyDemand);
  const [upcomingEvents, setUpcomingEvents] = useState(mockUpcomingEvents);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load benchmark from API
      const benchmarkData = await getBenchmark('demo_merchant');
      if (benchmarkData) {
        setBenchmark(benchmarkData);
      }

      // Load segments from API
      const segmentData = await getSegments('demo_merchant');
      if (segmentData) {
        setSegments(segmentData);
      }

      // Get AI insights from MerchantGPT
      const insightsResponse = await chat('Give me 3 quick business insights for my restaurant');
      if (insightsResponse) {
        setInsights([
          {
            icon: TrendingUp,
            title: 'Revenue Trend',
            description: insightsResponse.response.substring(0, 100) + '...',
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
    setLoading(false);
  };

  const stats = benchmark ? [
    { label: "Today's Revenue", value: '₹18,450', change: '+12.5%', positive: true },
    { label: 'Orders', value: benchmark.overallScore.toString(), change: `Grade ${benchmark.letterGrade}`, positive: true },
    { label: 'Avg Order Value', value: '₹288', change: '+4.2%', positive: true },
    { label: 'Revenue Score', value: `${benchmark.overallScore}/100`, change: benchmark.percentile, positive: true },
  ] : [
    { label: "Today's Revenue", value: '₹18,450', change: '+12.5%', positive: true },
    { label: 'Orders', value: '64', change: '+8.3%', positive: true },
    { label: 'Avg Order Value', value: '₹288', change: '+4.2%', positive: true },
    { label: 'Revenue Score', value: '82/100', change: 'Top 25%', positive: true },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>Loading...</div>
          <div style={{ color: 'var(--text-secondary)' }}>Connecting to REZ Revenue AI</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="header">
        <div>
          <h2>Revenue Overview</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Salon Elegance • Bangalore
            {benchmark && <span style={{ marginLeft: '1rem', color: 'var(--success)' }}>● Live</span>}
          </p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline">
            <Search size={18} />
          </button>
          <button className="btn btn-outline">
            <Bell size={18} />
          </button>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="btn btn-outline"
            style={{ paddingRight: '2rem' }}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-label">{stat.label}</div>
            <div className="stat-value">{stat.value}</div>
            <div className={`stat-change ${stat.positive ? 'positive' : 'negative'}`}>
              {stat.positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      {/* Benchmark Score */}
      {benchmark && (
        <div className="card" style={{ marginBottom: '2rem', borderColor: 'var(--primary)' }}>
          <div className="card-header">
            <span className="card-title">Your Revenue Score</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: `conic-gradient(var(--success) ${benchmark.overallScore * 3.6}deg, var(--bg-dark) 0deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'var(--bg-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
              }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>{benchmark.overallScore}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{benchmark.letterGrade}</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: '0.5rem' }}>{benchmark.percentile} in your category</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {benchmark.breakdown?.slice(0, 4).map((metric: any, i: number) => (
                  <span key={i} className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                    {metric.metric}: {Math.round(metric.score)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="charts-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Revenue Trend</span>
            <select className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ fill: '#6366f1' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Hourly Demand</span>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyDemand}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Bar dataKey="demand" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Upcoming Events */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Upcoming Events</span>
          </div>
          <div className="events-timeline">
            {upcomingEvents.map((event, index) => (
              <div key={index} className="event-item">
                <div className="event-date">
                  <div style={{ fontWeight: 600 }}>{event.daysUntil}</div>
                  <div style={{ fontSize: '0.625rem' }}>days</div>
                </div>
                <div className="event-content">
                  <div className="event-name">{event.name}</div>
                  <div className="event-impact">{event.impact}</div>
                </div>
                <span className="badge badge-warning">{event.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">AI Insights</span>
          </div>
          <div className="insights-list">
            {insights.length > 0 ? insights.map((insight, index) => (
              <div key={index} className="insight-item">
                <div className="insight-icon">
                  <insight.icon size={20} />
                </div>
                <div className="insight-content">
                  <h4>{insight.title}</h4>
                  <p>{insight.description}</p>
                </div>
              </div>
            )) : (
              <>
                <div className="insight-item">
                  <div className="insight-icon">
                    <TrendingUp size={20} />
                  </div>
                  <div className="insight-content">
                    <h4>Friday surge detected</h4>
                    <p>Your 7PM bookings are up 35% this week. Consider peak pricing.</p>
                  </div>
                </div>
                <div className="insight-item">
                  <div className="insight-icon">
                    <Users size={20} />
                  </div>
                  <div className="insight-content">
                    <h4>New customer spike</h4>
                    <p>28% more new customers this week. Good time for acquisition offers.</p>
                  </div>
                </div>
                <div className="insight-item">
                  <div className="insight-icon">
                    <DollarSign size={20} />
                  </div>
                  <div className="insight-content">
                    <h4>AOV opportunity</h4>
                    <p>Bundle deals could increase average order value by 18%.</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
