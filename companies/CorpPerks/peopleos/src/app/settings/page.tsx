'use client';

import { useState } from 'react';

type Section = 'company' | 'hr' | 'integrations' | 'security' | 'notifications' | 'billing';

export default function SettingsPage() {
  const [section, setSection] = useState<Section>('company');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const navItems: { id: Section; label: string; icon: string }[] = [
    { id: 'company', label: 'Company', icon: '🏢' },
    { id: 'hr', label: 'HR Policies', icon: '📋' },
    { id: 'integrations', label: 'Integrations', icon: '🔗' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'billing', label: 'Billing', icon: '💳' },
  ];

  const renderSection = () => {
    switch (section) {
      case 'company':
        return (
          <div>
            <h2 style={{ marginBottom: 16, fontSize: 20 }}>Company Settings</h2>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Company Name</label>
                <input defaultValue="Acme Corp" style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Industry</label>
                <select style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}>
                  <option>Technology</option>
                  <option>Healthcare</option>
                  <option>Retail</option>
                  <option>Finance</option>
                  <option>Manufacturing</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Company Size</label>
                <select style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}>
                  <option>1-50 employees</option>
                  <option>51-200 employees</option>
                  <option>201-500 employees</option>
                  <option>500+ employees</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Website</label>
                <input defaultValue="https://acmecorp.com" type="url" style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Logo URL</label>
                <input placeholder="https://example.com/logo.png" type="url" style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button onClick={handleSave} style={{ padding: '12px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}>
                {saved ? '✓ Saved' : 'Save Changes'}
              </button>
              <button style={{ padding: '12px 24px', background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        );

      case 'hr':
        return (
          <div>
            <h2 style={{ marginBottom: 16, fontSize: 20 }}>HR Policies</h2>
            <div style={{ display: 'grid', gap: 20 }}>
              <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8 }}>
                <h3 style={{ marginBottom: 12, fontSize: 16 }}>Working Hours</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Start Time</label>
                    <input defaultValue="09:00" type="time" style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>End Time</label>
                    <input defaultValue="18:00" type="time" style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }} />
                  </div>
                </div>
              </div>
              <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8 }}>
                <h3 style={{ marginBottom: 12, fontSize: 16 }}>Leave Policy</h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Annual Leave Days</label>
                    <input defaultValue="24" type="number" min="1" max="50" style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Sick Leave Days</label>
                    <input defaultValue="12" type="number" min="1" max="30" style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }} />
                  </div>
                </div>
              </div>
              <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8 }}>
                <h3 style={{ marginBottom: 12, fontSize: 16 }}>Probation Period</h3>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Duration (months)</label>
                  <input defaultValue="3" type="number" min="0" max="12" style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }} />
                </div>
              </div>
              <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8 }}>
                <h3 style={{ marginBottom: 12, fontSize: 16 }}>Notice Period</h3>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Days</label>
                  <input defaultValue="30" type="number" min="7" max="90" style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }} />
                </div>
              </div>
            </div>
            <button onClick={handleSave} style={{ padding: '12px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', marginTop: 24, fontWeight: 500 }}>
              {saved ? '✓ Saved' : 'Save Policies'}
            </button>
          </div>
        );

      case 'integrations':
        return (
          <div>
            <h2 style={{ marginBottom: 16, fontSize: 20 }}>Integrations</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {[
                { name: 'REZ Auth Service', desc: 'JWT, OTP, MFA authentication', connected: true },
                { name: 'REZ Wallet Service', desc: 'Employee benefit wallets', connected: true },
                { name: 'REZ Payment Service', desc: 'Salary & expense payments', connected: true },
                { name: 'REZ Intelligence', desc: 'AI predictions & insights', connected: true },
                { name: 'Slack', desc: 'Team notifications', connected: false },
                { name: 'Microsoft Teams', desc: 'Enterprise communication', connected: false },
                { name: 'Google Workspace', desc: 'Calendar & docs sync', connected: false },
                { name: 'Zapier', desc: 'Workflow automation', connected: false },
              ].map(integration => (
                <div key={integration.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb', padding: 16, borderRadius: 8 }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{integration.name}</div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>{integration.desc}</div>
                  </div>
                  <button style={{
                    padding: '8px 16px',
                    background: integration.connected ? '#10b981' : '#fff',
                    color: integration.connected ? '#fff' : '#374151',
                    border: integration.connected ? 'none' : '1px solid #d1d5db',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 14
                  }}>
                    {integration.connected ? 'Connected' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'security':
        return (
          <div>
            <h2 style={{ marginBottom: 16, fontSize: 20 }}>Security Settings</h2>
            <div style={{ display: 'grid', gap: 20 }}>
              <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8 }}>
                <h3 style={{ marginBottom: 12, fontSize: 16 }}>Password Policy</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" defaultChecked style={{ width: 18, height: 18 }} />
                    Require minimum 8 characters
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" defaultChecked style={{ width: 18, height: 18 }} />
                    Require uppercase & lowercase
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" defaultChecked style={{ width: 18, height: 18 }} />
                    Require numbers & symbols
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" style={{ width: 18, height: 18 }} />
                    Force password change every 90 days
                  </label>
                </div>
              </div>
              <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8 }}>
                <h3 style={{ marginBottom: 12, fontSize: 16 }}>Two-Factor Authentication</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" defaultChecked style={{ width: 18, height: 18 }} />
                    Require 2FA for all users
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" defaultChecked style={{ width: 18, height: 18 }} />
                    Allow authenticator apps
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" style={{ width: 18, height: 18 }} />
                    Allow SMS verification
                  </label>
                </div>
              </div>
              <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8 }}>
                <h3 style={{ marginBottom: 12, fontSize: 16 }}>Session Management</h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Session Timeout (minutes)</label>
                    <input defaultValue="30" type="number" min="5" max="480" style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }} />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" defaultChecked style={{ width: 18, height: 18 }} />
                    Allow multiple sessions per user
                  </label>
                </div>
              </div>
              <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8 }}>
                <h3 style={{ marginBottom: 12, fontSize: 16 }}>IP Allowlist</h3>
                <textarea placeholder="Enter IP addresses (one per line)" rows={4} style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, resize: 'vertical' }} />
              </div>
            </div>
            <button onClick={handleSave} style={{ padding: '12px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', marginTop: 24, fontWeight: 500 }}>
              {saved ? '✓ Saved' : 'Save Security Settings'}
            </button>
          </div>
        );

      case 'notifications':
        return (
          <div>
            <h2 style={{ marginBottom: 16, fontSize: 20 }}>Notification Preferences</h2>
            <div style={{ display: 'grid', gap: 20 }}>
              {[
                { title: 'Email Notifications', items: ['New leave requests', 'Payroll processed', 'Performance reviews', 'Company announcements'] },
                { title: 'Push Notifications', items: ['Approval requests', 'Schedule changes', 'Team updates', 'Recognition badges'] },
                { title: 'SMS Notifications', items: ['OTPs', 'Critical alerts', 'Leave status changes'] },
              ].map(group => (
                <div key={group.title} style={{ background: '#f9fafb', padding: 16, borderRadius: 8 }}>
                  <h3 style={{ marginBottom: 12, fontSize: 16 }}>{group.title}</h3>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {group.items.map(item => (
                      <label key={item} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
                        <span>{item}</span>
                        <input type="checkbox" defaultChecked style={{ width: 18, height: 18 }} />
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={handleSave} style={{ padding: '12px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', marginTop: 24, fontWeight: 500 }}>
              {saved ? '✓ Saved' : 'Save Preferences'}
            </button>
          </div>
        );

      case 'billing':
        return (
          <div>
            <h2 style={{ marginBottom: 16, fontSize: 20 }}>Billing & Subscription</h2>
            <div style={{ display: 'grid', gap: 20 }}>
              <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', padding: 24, borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, opacity: 0.9 }}>Current Plan</div>
                    <div style={{ fontSize: 28, fontWeight: 700 }}>Enterprise</div>
                    <div style={{ fontSize: 14, opacity: 0.8 }}>₹199/employee/month</div>
                  </div>
                  <button style={{ padding: '10px 20px', background: 'white', color: '#10b981', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                    Upgrade Plan
                  </button>
                </div>
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.2)', display: 'flex', gap: 24 }}>
                  <div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>Employees</div>
                    <div style={{ fontSize: 20, fontWeight: 600 }}>247</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>Billing Cycle</div>
                    <div style={{ fontSize: 20, fontWeight: 600 }}>Monthly</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>Next Invoice</div>
                    <div style={{ fontSize: 20, fontWeight: 600 }}>Jun 1, 2026</div>
                  </div>
                </div>
              </div>
              <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8 }}>
                <h3 style={{ marginBottom: 12, fontSize: 16 }}>Payment Method</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'white', borderRadius: 8 }}>
                  <span style={{ fontSize: 24 }}>💳</span>
                  <div>
                    <div style={{ fontWeight: 500 }}>Visa ending in 4242</div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>Expires 12/2027</div>
                  </div>
                  <button style={{ marginLeft: 'auto', padding: '8px 12px', background: 'transparent', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer' }}>
                    Update
                  </button>
                </div>
              </div>
              <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8 }}>
                <h3 style={{ marginBottom: 12, fontSize: 16 }}>Billing Address</h3>
                <div style={{ display: 'grid', gap: 12 }}>
                  <input placeholder="Company Name" defaultValue="Acme Corp" style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }} />
                  <input placeholder="Address Line 1" defaultValue="123 Tech Park" style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                    <input placeholder="City" defaultValue="Bangalore" style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }} />
                    <input placeholder="PIN" defaultValue="560001" style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }} />
                  </div>
                </div>
              </div>
            </div>
            <button onClick={handleSave} style={{ padding: '12px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', marginTop: 24, fontWeight: 500 }}>
              {saved ? '✓ Saved' : 'Save Billing Info'}
            </button>
          </div>
        );
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Settings</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24 }}>
        <div style={{ background: 'white', borderRadius: 12, padding: 8, height: 'fit-content' }}>
          {navItems.map(item => (
            <div
              key={item.id}
              onClick={() => setSection(item.id)}
              style={{
                padding: 12,
                borderRadius: 8,
                background: section === item.id ? '#f3f4f6' : 'transparent',
                cursor: 'pointer',
                fontWeight: section === item.id ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 4
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>

        <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
          {renderSection()}
        </div>
      </div>
    </div>
  );
}
