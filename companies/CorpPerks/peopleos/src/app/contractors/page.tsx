const contractors = [
  { id: 1, name: 'Security Guards', count: 45, agency: 'SecureOps Inc', status: 'active' },
  { id: 2, name: 'Canteen Staff', count: 12, agency: 'FoodFirst', status: 'active' },
  { id: 3, name: 'Cleaners', count: 20, agency: 'CleanCo', status: 'active' },
];

export default function ContractorsPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Contractor Management</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Manage third-party workforce and vendors</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Contractors', value: 77 },
          { label: 'Active Agencies', value: 3 },
          { label: 'This Month Cost', value: '₹4.5L' },
          { label: 'Compliance', value: '98%' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', padding: 20, borderRadius: 12, textAlign: 'center' }}>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#8b5cf6', margin: 0 }}>{s.value}</p>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '8px 0 0' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ margin: 0 }}>Contractor Agencies</h2>
        </div>
        {contractors.map(c => (
          <div key={c.id} style={{ padding: 16, borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 32 }}>🏢</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, margin: 0 }}>{c.name}</p>
              <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>{c.agency}</p>
            </div>
            <div style={{ textAlign: 'right', marginRight: 16 }}>
              <p style={{ fontWeight: 700, fontSize: 20, color: '#8b5cf6', margin: 0 }}>{c.count}</p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>workers</p>
            </div>
            <span style={{ padding: '4px 12px', background: '#dcfce7', color: '#15803d', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>Active</span>
            <button style={{ padding: '8px 16px', background: '#e5e7eb', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Manage</button>
          </div>
        ))}
      </div>
    </div>
  );
}
