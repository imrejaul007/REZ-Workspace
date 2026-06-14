'use client';

import { useState } from 'react';

interface Location {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  radius: number; // meters
  employees: number;
  status: 'active' | 'inactive';
}

const mockLocations: Location[] = [
  { id: '1', name: 'Main Office', address: '123 Tech Park, Bangalore', lat: 12.9716, lng: 77.5946, radius: 100, employees: 25, status: 'active' },
  { id: '2', name: 'Branch Office - Mumbai', address: '456 Business Hub, Mumbai', lat: 19.076, lng: 72.8777, radius: 150, employees: 12, status: 'active' },
  { id: '3', name: 'Warehouse - Delhi', address: '789 Industrial Area, Delhi', lat: 28.7041, lng: 77.1025, radius: 200, employees: 8, status: 'active' },
];

export default function GeoFencePage() {
  const [locations, setLocations] = useState<Location[]>(mockLocations);
  const [showModal, setShowModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive'>('all');

  const filteredLocations = locations.filter(loc =>
    activeTab === 'all' ? true : loc.status === activeTab
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>📍 Geo-Fence Management</h1>
          <p style={{ color: '#6b7280' }}>Set up workplace locations for attendance tracking</p>
        </div>
        <button
          onClick={() => { setSelectedLocation(null); setShowModal(true); }}
          style={{
            padding: '12px 24px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          + Add Location
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Locations', value: locations.length, icon: '📍' },
          { label: 'Active', value: locations.filter(l => l.status === 'active').length, icon: '✅' },
          { label: 'Total Employees', value: locations.reduce((sum, l) => sum + l.employees, 0), icon: '👥' },
          { label: 'Avg Radius', value: `${Math.round(locations.reduce((sum, l) => sum + l.radius, 0) / locations.length)}m`, icon: '📏' },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'white', padding: 20, borderRadius: 12 }}>
            <span style={{ fontSize: 24 }}>{stat.icon}</span>
            <div style={{ marginTop: 8 }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>{stat.value}</p>
              <p style={{ fontSize: 13, color: '#6b7280' }}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['all', 'active', 'inactive'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 500,
              background: activeTab === tab ? '#10b981' : '#e5e7eb',
              color: activeTab === tab ? 'white' : '#6b7280',
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)} ({tab === 'all' ? locations.length : locations.filter(l => l.status === tab).length})
          </button>
        ))}
      </div>

      {/* Locations List */}
      <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', textAlign: 'left', fontSize: 13, color: '#6b7280' }}>
              <th style={{ padding: '12px 16px' }}>Location</th>
              <th style={{ padding: '12px 16px' }}>Address</th>
              <th style={{ padding: '12px 16px' }}>Radius</th>
              <th style={{ padding: '12px 16px' }}>Employees</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px' }}>QR Code</th>
              <th style={{ padding: '12px 16px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLocations.map(loc => (
              <tr key={loc.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: '16px' }}>
                  <div style={{ fontWeight: 500 }}>{loc.name}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                  </div>
                </td>
                <td style={{ padding: '16px' }}>{loc.address}</td>
                <td style={{ padding: '16px' }}>{loc.radius}m</td>
                <td style={{ padding: '16px' }}>{loc.employees}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 500,
                    background: loc.status === 'active' ? '#dcfce7' : '#fef3c7',
                    color: loc.status === 'active' ? '#15803d' : '#b45309',
                  }}>
                    {loc.status}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  <button style={{
                    padding: '6px 12px',
                    background: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}>
                    📱 Generate QR
                  </button>
                </td>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer' }}>Edit</button>
                    <button style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>View</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* How It Works */}
      <div style={{
        marginTop: 24,
        background: 'linear-gradient(135deg, #10b981 0%, #6366f1 100%)',
        padding: 24,
        borderRadius: 12,
        color: 'white',
      }}>
        <h3 style={{ marginBottom: 16 }}>📍 How Geo-Fence Attendance Works</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {[
            { step: '1', title: 'Set Location', desc: 'HR defines workplace location with radius' },
            { step: '2', title: 'Employee Scans QR', desc: 'Employee scans QR or opens link at workplace' },
            { step: '3', title: 'GPS Verification', desc: 'System checks if employee is within geofence' },
            { step: '4', title: 'Auto Check-In', desc: 'If within radius → attendance marked' },
            { step: '5', title: 'Alert on Exit', desc: 'If leaves area → HR gets notified' },
          ].map(item => (
            <div key={item.step} style={{ background: 'rgba(255,255,255,0.1)', padding: 16, borderRadius: 8 }}>
              <span style={{ fontSize: 24, fontWeight: 700 }}>{item.step}</span>
              <h4 style={{ margin: '8px 0 4px' }}>{item.title}</h4>
              <p style={{ fontSize: 13, opacity: 0.9 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            padding: 32,
            borderRadius: 16,
            width: 500,
          }}>
            <h2 style={{ marginBottom: 24 }}>{selectedLocation ? 'Edit Location' : 'Add New Location'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input placeholder="Location Name (e.g., Main Office)" style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }} />
              <input placeholder="Address" style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <input placeholder="Latitude" type="number" step="0.0001" defaultValue={selectedLocation?.lat || 12.9716} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }} />
                <input placeholder="Longitude" type="number" step="0.0001" defaultValue={selectedLocation?.lng || 77.5946} style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Geofence Radius: <span id="radiusValue">100</span>m</label>
                <input type="range" min="50" max="500" defaultValue="100" style={{ width: '100%' }} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: 12, background: '#e5e7eb', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
                <button style={{ flex: 1, padding: 12, background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Save Location</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
