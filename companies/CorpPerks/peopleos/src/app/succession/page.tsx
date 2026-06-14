'use client';

const successors = [
  { id: 1, role: 'Engineering Lead', candidates: ['Priya Sharma', 'Rahul Verma'], status: 'identifying' },
  { id: 2, role: 'Product Manager', candidates: ['Sneha Patel'], status: 'approved' },
  { id: 3, role: 'Sales Head', candidates: ['Amit Kumar'], status: 'planning' },
];

export default function SuccessionPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Succession Planning</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Identify and develop future leaders</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Key Roles', value: 5 },
          { label: 'Ready Now', value: 2 },
          { label: 'In Pipeline', value: 3 },
          { label: 'At Risk', value: 1 },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', padding: 20, borderRadius: 12, textAlign: 'center' }}>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#8b5cf6', margin: 0 }}>{s.value}</p>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '8px 0 0' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
        <h2 style={{ marginBottom: 16 }}>Succession Pipeline</h2>
        {successors.map(s => (
          <div key={s.id} style={{ padding: 16, borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 600, margin: 0 }}>{s.role}</p>
                <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>Candidates: {s.candidates.join(', ')}</p>
              </div>
              <span style={{
                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                background: s.status === 'approved' ? '#dcfce7' : s.status === 'planning' ? '#dbeafe' : '#fef3c7',
                color: s.status === 'approved' ? '#15803d' : s.status === 'planning' ? '#1d4ed8' : '#b45309'
              }}>
                {s.status === 'identifying' ? 'Identifying' : s.status === 'planning' ? 'Planning' : 'Approved'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
