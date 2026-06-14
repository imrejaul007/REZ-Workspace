'use client';

const metrics = [
  { label: 'Total Students', value: 1250, change: '+12%', trend: 'up' },
  { label: 'Course Completions', value: 890, change: '+18%', trend: 'up' },
  { label: 'Placements', value: 234, change: '+25%', trend: 'up' },
  { label: 'Avg Salary', value: '8.5 LPA', change: '+15%', trend: 'up' },
];

const insights = [
  { type: 'success', text: 'Machine Learning course has highest enrollment (245 students)' },
  { type: 'warning', text: 'Completion rate dropped 10% in Data Science course' },
  { type: 'info', text: 'Top hiring: Google (45), Amazon (32), Microsoft (28)' },
];

export default function AdminAnalytics() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Campus Analytics</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Deep insights into campus performance</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {metrics.map(m => (
          <div key={m.label} style={{ background: 'white', padding: 20, borderRadius: 12 }}>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{m.label}</p>
            <p style={{ fontSize: 32, fontWeight: 700, color: '#8b5cf6', margin: '8px 0' }}>{m.value}</p>
            <span style={{ fontSize: 12, color: '#10b981', background: '#dcfce7', padding: '2px 8px', borderRadius: 10 }}>{m.change}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div style={{ background: 'white', padding: 24, borderRadius: 12 }}>
          <h2 style={{ marginBottom: 16 }}>Enrollment Trend</h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 200 }}>
            {[65, 78, 85, 92, 88, 95, 102].map((val, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ height: `${val * 2}px`, background: 'linear-gradient(to top, #8b5cf6, #06b6d4)', borderRadius: '8px 8px 0 0' }} />
                <p style={{ fontSize: 11, color: '#6b7280', marginTop: 8 }}>Month {i + 1}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'white', padding: 24, borderRadius: 12 }}>
          <h2 style={{ marginBottom: 16 }}>AI Insights</h2>
          {insights.map((ins, i) => (
            <div key={i} style={{
              padding: 12, borderRadius: 8, marginBottom: 8,
              background: ins.type === 'success' ? '#dcfce7' : ins.type === 'warning' ? '#fef3c7' : '#dbeafe',
            }}>
              <p style={{ fontSize: 13, margin: 0, color: ins.type === 'success' ? '#15803d' : ins.type === 'warning' ? '#b45309' : '#1d4ed8' }}>
                {ins.type === 'success' ? '✅' : ins.type === 'warning' ? '⚠️' : '💡'} {ins.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 24, background: 'white', padding: 24, borderRadius: 12 }}>
        <h2 style={{ marginBottom: 16 }}>Top Performing Courses</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { title: 'Full Stack Dev', students: 245, revenue: '₹45,000' },
            { title: 'Data Science', students: 189, revenue: '₹32,000' },
            { title: 'UI/UX Design', students: 156, revenue: '₹28,000' },
          ].map((c, i) => (
            <div key={i} style={{ padding: 16, background: '#f9fafb', borderRadius: 12 }}>
              <h3 style={{ margin: '0 0 12px' }}>#{i + 1} {c.title}</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Students</p>
                  <p style={{ fontWeight: 600, margin: 0 }}>{c.students}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Revenue</p>
                  <p style={{ fontWeight: 600, color: '#10b981', margin: 0 }}>{c.revenue}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
