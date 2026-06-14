'use client';

const branches = [
  { name: 'Mumbai HQ', employees: 45, revenue: '₹12L', status: 'active' },
  { name: 'Delhi Branch', employees: 32, revenue: '₹8L', status: 'active' },
  { name: 'Bangalore Office', employees: 28, revenue: '₹7L', status: 'active' },
];

export default function FranchisePage() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Multi-Location Management</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Manage branches and franchises</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Locations', value: 3 },
          { label: 'Total Employees', value: 105 },
          { label: 'Total Revenue', value: '₹27L' },
          { label: 'Avg Utilization', value: '87%' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', padding: 20, borderRadius: 12, textAlign: 'center' }}>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#8b5cf6', margin: 0 }}>{s.value}</p>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '8px 0 0' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
        <h2 style={{ marginBottom: 16 }}>Branch Performance</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{ padding: 12, textAlign: 'left' }}>Location</th>
              <th style={{ padding: 12, textAlign: 'right' }}>Employees</th>
              <th style={{ padding: 12, textAlign: 'right' }}>Revenue</th>
              <th style={{ padding: 12, textAlign: 'center' }}>Status</th>
              <th style={{ padding: 12, textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {branches.map(b => (
              <tr key={b.name} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: 16, fontWeight: 600 }}>{b.name}</td>
                <td style={{ padding: 16, textAlign: 'right' }}>{b.employees}</td>
                <td style={{ padding: 16, textAlign: 'right', color: '#10b981', fontWeight: 600 }}>{b.revenue}</td>
                <td style={{ padding: 16, textAlign: 'center' }}>
                  <span style={{ padding: '4px 12px', background: '#dcfce7', color: '#15803d', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                    {b.status}
                  </span>
                </td>
                <td style={{ padding: 16, textAlign: 'center' }}>
                  <button style={{ padding: '8px 16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                    View Dashboard
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
