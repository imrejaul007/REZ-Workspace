import { BarChart3, TrendingUp, Users, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const weeklyForecast = [
  { day: 'Mon', demand: 45, orders: 38 },
  { day: 'Tue', demand: 52, orders: 44 },
  { day: 'Wed', demand: 48, orders: 40 },
  { day: 'Thu', demand: 58, orders: 50 },
  { day: 'Fri', demand: 85, orders: 72 },
  { day: 'Sat', demand: 95, orders: 82 },
  { day: 'Sun', demand: 72, orders: 62 },
];

const hourlyForecast = [
  { hour: '9AM', demand: 35 },
  { hour: '10AM', demand: 55 },
  { hour: '11AM', demand: 75 },
  { hour: '12PM', demand: 90 },
  { hour: '1PM', demand: 70 },
  { hour: '2PM', demand: 50 },
  { hour: '3PM', demand: 45 },
  { hour: '4PM', demand: 55 },
  { hour: '5PM', demand: 65 },
  { hour: '6PM', demand: 80 },
  { hour: '7PM', demand: 95 },
  { hour: '8PM', demand: 85 },
  { hour: '9PM', demand: 60 },
];

const staffingRecommendations = [
  { hour: '9AM-12PM', staff: 3, reason: 'Low demand' },
  { hour: '12PM-3PM', staff: 5, reason: 'Lunch rush' },
  { hour: '3PM-6PM', staff: 4, reason: 'Moderate' },
  { hour: '6PM-9PM', staff: 7, reason: 'Peak hours' },
];

const inventoryRecommendations = [
  { item: 'Hair Color Products', current: 45, recommended: 60, urgency: 'high' },
  { item: 'Shampoo Stock', current: 80, recommended: 100, urgency: 'low' },
  { item: 'Treatment Kits', current: 25, recommended: 40, urgency: 'medium' },
];

export default function Forecast() {
  return (
    <div>
      <div className="header">
        <div>
          <h2>Demand Forecast</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            AI-powered predictions for staffing and inventory
          </p>
        </div>
        <div className="header-actions">
          <select className="btn btn-outline" style={{ padding: '0.75rem 1rem' }}>
            <option>This Week</option>
            <option>Next Week</option>
            <option>This Month</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-label">Peak Day</div>
          <div className="stat-value">Saturday</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Expected 95 demand score
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Peak Hour</div>
          <div className="stat-value">7 PM</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Highest booking window
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Forecast Confidence</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>87%</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Based on 90 days data
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Weekly Demand Forecast</span>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyForecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} />
                <Area type="monotone" dataKey="demand" stroke="#6366f1" fill="rgba(99, 102, 241, 0.2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Hourly Pattern (Peak Day)</span>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyForecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} />
                <Bar dataKey="demand" radius={[4, 4, 0, 0]}>
                  {hourlyForecast.map((entry, index) => (
                    <rect key={index} fill={entry.demand > 80 ? '#ef4444' : entry.demand > 50 ? '#f59e0b' : '#22c55e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Staffing */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <Users size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Staffing Recommendations
            </span>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Time Slot</th>
                <th>Staff Needed</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {staffingRecommendations.map((rec, index) => (
                <tr key={index}>
                  <td>{rec.hour}</td>
                  <td>
                    <span className="badge badge-success">{rec.staff} stylists</span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{rec.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Inventory */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <Package size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Inventory Recommendations
            </span>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Current</th>
                <th>Recommended</th>
                <th>Urgency</th>
              </tr>
            </thead>
            <tbody>
              {inventoryRecommendations.map((item, index) => (
                <tr key={index}>
                  <td>{item.item}</td>
                  <td>{item.current}%</td>
                  <td style={{ color: 'var(--success)' }}>{item.recommended}%</td>
                  <td>
                    <span className={`badge badge-${item.urgency === 'high' ? 'danger' : item.urgency === 'medium' ? 'warning' : 'success'}`}>
                      {item.urgency}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
