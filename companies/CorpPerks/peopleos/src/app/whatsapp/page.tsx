'use client';

import { useState } from 'react';

const commands = [
  { cmd: '!attendance', desc: 'Mark your attendance', icon: '✅', category: 'Attendance' },
  { cmd: '!leave <type> <dates>', desc: 'Apply for leave', icon: '🏖️', category: 'Attendance' },
  { cmd: '!balance', desc: 'Check wallet balance', icon: '💰', category: 'Finance' },
  { cmd: '!payslip', desc: 'Get latest payslip', icon: '📄', category: 'Finance' },
  { cmd: '!team', desc: 'View team updates', icon: '👥', category: 'HR' },
  { cmd: '!org', desc: 'View org chart', icon: '🏢', category: 'HR' },
  { cmd: '!holidays', desc: 'See upcoming holidays', icon: '🎉', category: 'HR' },
  { cmd: '!claim <amount> <reason>', desc: 'Submit expense claim', icon: '📋', category: 'Finance' },
  { cmd: '!wfh <date>', desc: 'Request work from home', icon: '🏠', category: 'Attendance' },
  { cmd: '!help', desc: 'Get help', icon: '❓', category: 'General' },
  { cmd: '!profile', desc: 'View your profile', icon: '👤', category: 'HR' },
  { cmd: '!kpi', desc: 'View your KPIs', icon: '📊', category: 'Performance' },
];

const recentMessages = [
  { user: 'Priya Sharma', phone: '+91 98765 43210', msg: '!attendance', time: '9:05 AM', response: '✅ Marked present at Bangalore Office', status: 'success' },
  { user: 'Rahul Verma', phone: '+91 98765 43211', msg: '!leave casual May 20-22', time: '8:30 AM', response: '🏖️ Leave request sent for approval', status: 'pending' },
  { user: 'Sneha Patel', phone: '+91 98765 43212', msg: '!balance', time: '8:15 AM', response: '💰 Wellness: ₹2,500 | Learning: ₹8,000 | Travel: ₹15,000', status: 'success' },
  { user: 'Amit Kumar', phone: '+91 98765 43213', msg: '!payslip', time: '7:45 AM', response: '📄 Payslip sent to your email', status: 'success' },
  { user: 'Neha Gupta', phone: '+91 98765 43214', msg: '!wfh May 20', time: '7:30 AM', response: '🏠 WFH request sent for approval', status: 'pending' },
];

export default function WhatsAppPage() {
  const [phone, setPhone] = useState('');
  const [connected, setConnected] = useState(false);

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>WhatsApp Integration</h1>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>Employees manage HR via WhatsApp - India&apos;s #1 communication app</p>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Active Users', value: '1,247', icon: '👥', color: '#8b5cf6' },
          { label: 'Messages Today', value: '3,456', icon: '💬', color: '#06b6d4' },
          { label: 'Commands', value: '1,892', icon: '⚡', color: '#10b981' },
          { label: 'Success Rate', value: '98.5%', icon: '✅', color: '#10b981' },
          { label: 'Avg Response', value: '<2s', icon: '🚀', color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{ background: 'white', padding: 20, borderRadius: 12, textAlign: 'center' }}>
            <span style={{ fontSize: 24 }}>{s.icon}</span>
            <p style={{ fontSize: 24, fontWeight: 700, color: s.color, margin: '8px 0 0' }}>{s.value}</p>
            <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Setup */}
        <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: connected ? '#dcfce7' : '#fef3c7',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{ fontSize: 32 }}>{connected ? '✅' : '🔌'}</span>
            </div>
            <div>
              <h2 style={{ margin: 0 }}>{connected ? 'WhatsApp Connected!' : 'Connect WhatsApp Business'}</h2>
              <p style={{ color: '#6b7280', margin: '4px 0 0' }}>
                {connected ? 'Your WhatsApp bot is live' : 'Enable HR commands via WhatsApp'}
              </p>
            </div>
          </div>

          {!connected && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, color: '#6b7280', marginBottom: 4 }}>WhatsApp Business Number</label>
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  style={{ width: '100%', padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}
                />
              </div>
              <button
                onClick={() => setConnected(true)}
                style={{ padding: '12px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                Connect WhatsApp Business API
              </button>
            </>
          )}

          {connected && (
            <div style={{ background: '#f0fdf4', padding: 16, borderRadius: 8 }}>
              <p style={{ fontSize: 13, color: '#15803d', margin: 0 }}>
                ✅ WhatsApp Business API connected<br/>
                📱 Employees can now use HR commands via WhatsApp
              </p>
            </div>
          )}
        </div>

        {/* Why WhatsApp */}
        <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
          <h2 style={{ marginBottom: 16 }}>Why WhatsApp?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { icon: '📱', text: '1.5B+ users in India' },
              { icon: '⚡', text: 'Instant delivery' },
              { icon: '🔒', text: 'End-to-end encrypted' },
              { icon: '📊', text: 'High engagement rate' },
            ].map(f => (
              <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>{f.icon}</span>
                <span style={{ fontSize: 13 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Commands */}
      <div style={{ background: 'white', borderRadius: 12, padding: 24, marginTop: 24 }}>
        <h2 style={{ marginBottom: 16 }}>Available Commands</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {commands.map(cmd => (
            <div key={cmd.cmd} style={{ padding: 16, background: '#f9fafb', borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 24 }}>{cmd.icon}</span>
                <code style={{ fontSize: 12, background: '#e5e7eb', padding: '2px 8px', borderRadius: 4 }}>{cmd.cmd}</code>
              </div>
              <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{cmd.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Live Messages */}
      <div style={{ background: 'white', borderRadius: 12, padding: 24, marginTop: 24 }}>
        <h2 style={{ marginBottom: 16 }}>Live Message Feed</h2>
        <div style={{ maxHeight: 400, overflow: 'auto' }}>
          {recentMessages.map((m, i) => (
            <div key={i} style={{ padding: 16, background: '#f9fafb', borderRadius: 12, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{m.user}</span>
                  <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 8 }}>{m.phone}</span>
                </div>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>{m.time}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#8b5cf6' }}>👤 {m.msg}</span>
              </div>
              <p style={{ fontSize: 13, color: m.status === 'success' ? '#15803d' : '#b45309', margin: 0 }}>
                🤖 {m.response}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
