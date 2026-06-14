'use client';

import { useState } from 'react';

interface Alert {
  id: string;
  employee: string;
  avatar: string;
  location: string;
  alertType: 'exit' | 'entry' | 'late';
  timestamp: string;
  status: 'new' | 'acknowledged' | 'resolved';
  distance?: number; // meters outside
}

const mockAlerts: Alert[] = [
  { id: '1', employee: 'Priya Sharma', avatar: 'PS', location: 'Main Office', alertType: 'exit', timestamp: '10 mins ago', status: 'new', distance: 250 },
  { id: '2', employee: 'Rahul Verma', avatar: 'RV', location: 'Branch Office - Mumbai', alertType: 'exit', timestamp: '25 mins ago', status: 'acknowledged', distance: 180 },
  { id: '3', employee: 'Sneha Patel', avatar: 'SP', location: 'Main Office', alertType: 'late', timestamp: '1 hour ago', status: 'resolved' },
  { id: '4', employee: 'Amit Kumar', avatar: 'AK', location: 'Warehouse - Delhi', alertType: 'entry', timestamp: '2 hours ago', status: 'new' },
];

export default function GeoAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [filter, setFilter] = useState<'all' | 'new' | 'acknowledged'>('all');

  const filteredAlerts = alerts.filter(a =>
    filter === 'all' ? true : a.status === filter
  );

  const acknowledgeAlert = (id: string) => {
    setAlerts(alerts.map(a =>
      a.id === id ? { ...a, status: 'acknowledged' as const } : a
    ));
  };

  const resolveAlert = (id: string) => {
    setAlerts(alerts.map(a =>
      a.id === id ? { ...a, status: 'resolved' as const } : a
    ));
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>🚨 Geo-Fence Alerts</h1>
        <p style={{ color: '#6b7280' }}>Real-time alerts when employees leave or enter geofenced areas</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Alerts', value: alerts.length, icon: '🚨', color: '#ef4444' },
          { label: 'New', value: alerts.filter(a => a.status === 'new').length, icon: '🔴', color: '#ef4444' },
          { label: 'Acknowledged', value: alerts.filter(a => a.status === 'acknowledged').length, icon: '🟡', color: '#f59e0b' },
          { label: 'Resolved', value: alerts.filter(a => a.status === 'resolved').length, icon: '✅', color: '#10b981' },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'white', padding: 20, borderRadius: 12 }}>
            <span style={{ fontSize: 24 }}>{stat.icon}</span>
            <div style={{ marginTop: 8 }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: stat.color }}>{stat.value}</p>
              <p style={{ fontSize: 13, color: '#6b7280' }}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Alert Types */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { type: 'exit', icon: '🚪', label: 'Exit Alert', desc: 'Employee left geofenced area', color: '#ef4444' },
          { type: 'entry', icon: '🚪', label: 'Entry Alert', desc: 'Employee entered geofenced area', color: '#3b82f6' },
          { type: 'late', icon: '⏰', label: 'Late Alert', desc: 'Employee arrived after shift start', color: '#f59e0b' },
        ].map(item => (
          <div key={item.type} style={{
            background: 'white',
            padding: 16,
            borderRadius: 12,
            borderLeft: `4px solid ${item.color}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>{item.icon}</span>
              <div>
                <p style={{ fontWeight: 600 }}>{item.label}</p>
                <p style={{ fontSize: 12, color: '#6b7280' }}>{item.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['all', 'new', 'acknowledged'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 500,
              background: filter === f ? '#10b981' : '#e5e7eb',
              color: filter === f ? 'white' : '#6b7280',
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)} ({f === 'all' ? alerts.length : alerts.filter(a => a.status === f).length})
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredAlerts.map(alert => (
          <div
            key={alert.id}
            style={{
              background: 'white',
              padding: 20,
              borderRadius: 12,
              borderLeft: `4px solid ${
                alert.status === 'new' ? '#ef4444' :
                alert.status === 'acknowledged' ? '#f59e0b' : '#10b981'
              }`,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            {/* Avatar */}
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 600,
            }}>
              {alert.avatar}
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 600 }}>{alert.employee}</span>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 500,
                  background:
                    alert.alertType === 'exit' ? '#fef2f2' :
                    alert.alertType === 'late' ? '#fffbeb' : '#eff6ff',
                  color:
                    alert.alertType === 'exit' ? '#dc2626' :
                    alert.alertType === 'late' ? '#d97706' : '#2563eb',
                }}>
                  {alert.alertType === 'exit' ? '🚪 Exited' :
                   alert.alertType === 'late' ? '⏰ Late' : '✅ Entered'}
                </span>
                {alert.distance && (
                  <span style={{ fontSize: 12, color: '#ef4444' }}>
                    {alert.distance}m outside
                  </span>
                )}
              </div>
              <p style={{ fontSize: 13, color: '#6b7280' }}>
                {alert.location} • {alert.timestamp}
              </p>
            </div>

            {/* Status */}
            <span style={{
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 500,
              background:
                alert.status === 'new' ? '#fef2f2' :
                alert.status === 'acknowledged' ? '#fffbeb' : '#dcfce7',
              color:
                alert.status === 'new' ? '#dc2626' :
                alert.status === 'acknowledged' ? '#d97706' : '#15803d',
            }}>
              {alert.status}
            </span>

            {/* Actions */}
            {alert.status === 'new' && (
              <button
                onClick={() => acknowledgeAlert(alert.id)}
                style={{
                  padding: '8px 16px',
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Acknowledge
              </button>
            )}

            {alert.status === 'acknowledged' && (
              <button
                onClick={() => resolveAlert(alert.id)}
                style={{
                  padding: '8px 16px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Resolve
              </button>
            )}
          </div>
        ))}
      </div>

      {filteredAlerts.length === 0 && (
        <div style={{
          background: 'white',
          padding: 60,
          borderRadius: 12,
          textAlign: 'center',
        }}>
          <span style={{ fontSize: 48 }}>✅</span>
          <p style={{ color: '#6b7280', marginTop: 16 }}>No alerts in this category</p>
        </div>
      )}

      {/* Settings */}
      <div style={{
        marginTop: 24,
        background: 'white',
        padding: 24,
        borderRadius: 12,
      }}>
        <h3 style={{ marginBottom: 16 }}>⚙️ Alert Settings</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {[
            { label: 'Email Notifications', enabled: true },
            { label: 'Push Notifications', enabled: true },
            { label: 'SMS Alerts', enabled: false },
            { label: 'Slack Integration', enabled: true },
          ].map(setting => (
            <div key={setting.label} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 12,
              background: '#f9fafb',
              borderRadius: 8,
            }}>
              <span>{setting.label}</span>
              <div style={{
                width: 48,
                height: 24,
                borderRadius: 12,
                background: setting.enabled ? '#10b981' : '#d1d5db',
                position: 'relative',
                cursor: 'pointer',
              }}>
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: 'white',
                  position: 'absolute',
                  top: 2,
                  left: setting.enabled ? 26 : 2,
                  transition: 'left 0.2s',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
