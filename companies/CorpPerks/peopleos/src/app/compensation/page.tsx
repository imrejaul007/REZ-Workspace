'use client';

const benchmarks = [
  { role: 'Software Engineer', your: 18, market: 22, percentile: '45th' },
  { role: 'Product Manager', your: 28, market: 32, percentile: '60th' },
];

export default function CompensationPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Compensation Planning</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Salary benchmarking and increment planning</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Avg Salary', value: '₹18.5L' },
          { label: 'Budget', value: '₹45L' },
          { label: 'Increment Pool', value: '₹8.2L' },
          { label: 'Pending Reviews', value: 12 },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', padding: 20, borderRadius: 12, textAlign: 'center' }}>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#8b5cf6', margin: 0 }}>{s.value}</p>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '8px 0 0' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h2 style={{ marginBottom: 16 }}>Salary Benchmarks</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{ padding: 12, textAlign: 'left' }}>Role</th>
              <th style={{ padding: 12, textAlign: 'right' }}>Your Salary</th>
              <th style={{ padding: 12, textAlign: 'right' }}>Market Rate</th>
              <th style={{ padding: 12, textAlign: 'center' }}>Percentile</th>
            </tr>
          </thead>
          <tbody>
            {benchmarks.map(b => (
              <tr key={b.role} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: 16, fontWeight: 500 }}>{b.role}</td>
                <td style={{ padding: 16, textAlign: 'right', color: '#8b5cf6', fontWeight: 600 }}>₹{b.your}L</td>
                <td style={{ padding: 16, textAlign: 'right', color: '#6b7280' }}>₹{b.market}L</td>
                <td style={{ padding: 16, textAlign: 'center' }}>
                  <span style={{ padding: '4px 12px', background: parseInt(b.percentile) > 50 ? '#dcfce7' : '#fee2e2', color: parseInt(b.percentile) > 50 ? '#15803d' : '#dc2626', borderRadius: 20 }}>
                    {b.percentile} percentile
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
        <h2 style={{ marginBottom: 16 }}>Increment Simulation</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <p style={{ marginBottom: 8, fontWeight: 500 }}>Budget Allocation</p>
            <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4 }}>
              <div style={{ width: '18%', height: '100%', background: '#8b5cf6', borderRadius: 4 }} />
            </div>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 8 }}>₹8.2L / ₹45L budget used</p>
          </div>
          <div>
            <p style={{ marginBottom: 8, fontWeight: 500 }}>Suggested Allocation</p>
            <p style={{ fontSize: 13, color: '#10b981' }}>✓ Within budget</p>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '8px 0 0' }}>Review increments annually for fairness</p>
          </div>
        </div>
      </div>
    </div>
  );
}
