'use client';

export default function SecurityPage() {
  const certifications = [
    { name: 'SOC 2 Type II', status: 'In Progress' },
    { name: 'ISO 27001', status: 'Planned Q3 2026' },
    { name: 'GDPR Compliant', status: 'Compliant' },
    { name: 'ISO 27701', status: 'Planned Q4 2026' },
  ];

  const features = [
    { icon: '🔐', title: 'Data Encryption', desc: 'AES-256 encryption at rest and TLS 1.3 in transit' },
    { icon: '🔑', title: 'SSO & MFA', desc: 'SAML, OAuth 2.0, TOTP authenticator support' },
    { icon: '🛡️', title: 'Role-Based Access', desc: 'Fine-grained permissions and audit trails' },
    { icon: '📋', title: 'Audit Logs', desc: 'Complete activity logging and exportable reports' },
    { icon: '🔒', title: 'IP Whitelisting', desc: 'Restrict access by IP ranges' },
    { icon: '📱', title: 'Device Management', desc: ' MDM support for mobile devices' },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Security & Compliance</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Enterprise-grade security for your workforce data</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {certifications.map(c => (
          <div key={c.name} style={{ background: 'white', padding: 20, borderRadius: 12 }}>
            <span style={{ fontSize: 32 }}>{c.status === 'Compliant' ? '✅' : '⏳'}</span>
            <p style={{ fontWeight: 600, margin: '12px 0 4px' }}>{c.name}</p>
            <p style={{ fontSize: 13, color: c.status === 'Compliant' ? '#10b981' : '#6b7280', margin: 0 }}>{c.status}</p>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 20, marginBottom: 16 }}>Security Features</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {features.map(f => (
          <div key={f.title} style={{ background: 'white', padding: 20, borderRadius: 12 }}>
            <span style={{ fontSize: 32 }}>{f.icon}</span>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '12px 0 4px' }}>{f.title}</h3>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
