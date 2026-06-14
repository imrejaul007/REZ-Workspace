export default function WebhooksPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Webhooks</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Real-time event notifications</p>

      <div style={{ background: 'white', padding: 24, borderRadius: 12, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>Webhook Events</h2>
          <button style={{ padding: '12px 24px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>+ Add Webhook</button>
        </div>
        {[
          { event: 'employee.created', url: 'https://api.example.com/webhook', active: true },
          { event: 'leave.approved', url: 'https://api.example.com/leave', active: true },
          { event: 'payroll.completed', url: 'https://api.example.com/payroll', active: false },
        ].map((hook, i) => (
          <div key={i} style={{ padding: 16, borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontWeight: 600, margin: 0 }}>{hook.event}</p>
              <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>{hook.url}</p>
            </div>
            <span style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 12,
              background: hook.active ? '#dcfce7' : '#f3f4f6', color: hook.active ? '#15803d' : '#6b7280'
            }}>
              {hook.active ? 'Active' : 'Paused'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
