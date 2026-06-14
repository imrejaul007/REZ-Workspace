export default function APIPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>API & Integrations</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Connect PeopleOS with your tools</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { name: 'Slack', icon: '💬', connected: true },
          { name: 'Google Workspace', icon: '📧', connected: true },
          { name: 'Microsoft Teams', icon: '👥', connected: false },
          { name: 'Zapier', icon: '⚡', connected: true },
        ].map(integration => (
          <div key={integration.name} style={{ background: 'white', padding: 20, borderRadius: 12, textAlign: 'center' }}>
            <span style={{ fontSize: 40 }}>{integration.icon}</span>
            <p style={{ fontWeight: 600, margin: '12px 0 8px' }}>{integration.name}</p>
            <button style={{
              padding: '8px 16px', border: 'none', borderRadius: 20, cursor: 'pointer',
              background: integration.connected ? '#dcfce7' : '#8b5cf6', color: integration.connected ? '#15803d' : 'white'
            }}>
              {integration.connected ? 'Connected' : 'Connect'}
            </button>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', padding: 24, borderRadius: 12 }}>
        <h2 style={{ marginBottom: 16 }}>API Keys</h2>
        <div style={{ background: '#1f2937', padding: 16, borderRadius: 8, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <code style={{ color: '#10b981', fontSize: 13 }}>pk_live_xxxxxxxxxxxxxxx</code>
          <button style={{ padding: '8px 16px', background: '#374151', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Copy</button>
        </div>
        <button style={{ padding: '12px 24px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          + Generate New Key
        </button>
      </div>
    </div>
  );
}
