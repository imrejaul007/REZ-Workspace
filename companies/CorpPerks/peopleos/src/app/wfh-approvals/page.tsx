'use client';

import { useState } from 'react';

interface WFHRequest {
  id: string;
  employee: string;
  avatar: string;
  department: string;
  address: string;
  lat: number;
  lng: number;
  reason: string;
  startDate: string;
  endDate: string;
  radius: number;
  status: 'pending' | 'approved' | 'rejected';
}

const mockRequests: WFHRequest[] = [
  {
    id: '1',
    employee: 'Priya Sharma',
    avatar: 'PS',
    department: 'Engineering',
    address: '456 MG Road, Bangalore',
    lat: 12.9716,
    lng: 77.5946,
    reason: 'Personal',
    startDate: 'May 20, 2026',
    endDate: 'May 25, 2026',
    radius: 100,
    status: 'pending',
  },
  {
    id: '2',
    employee: 'Rahul Verma',
    avatar: 'RV',
    department: 'Marketing',
    address: '789 Koramangala, Bangalore',
    lat: 12.9352,
    lng: 77.6245,
    reason: 'Medical',
    startDate: 'May 18, 2026',
    endDate: 'May 19, 2026',
    radius: 100,
    status: 'pending',
  },
  {
    id: '3',
    employee: 'Sneha Patel',
    avatar: 'SP',
    department: 'Sales',
    address: '123 Whitefield, Bangalore',
    lat: 12.9698,
    lng: 77.7499,
    reason: 'Weather',
    startDate: 'May 15, 2026',
    endDate: 'May 17, 2026',
    radius: 100,
    status: 'approved',
  },
];

export default function WFHApprovalsPage() {
  const [requests, setRequests] = useState<WFHRequest[]>(mockRequests);
  const [selected, setSelected] = useState<WFHRequest | null>(null);

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');

  const approveRequest = (id: string) => {
    setRequests(requests.map(r =>
      r.id === id ? { ...r, status: 'approved' } : r
    ));
  };

  const rejectRequest = (id: string) => {
    setRequests(requests.map(r =>
      r.id === id ? { ...r, status: 'rejected' } : r
    ));
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>🏠 WFH Approvals</h1>
          <p style={{ color: '#6b7280' }}>Approve work from home location requests</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Pending', value: pendingRequests.length, icon: '⏳', color: '#f59e0b' },
          { label: 'Approved', value: approvedRequests.length, icon: '✅', color: '#10b981' },
          { label: 'This Month', value: 12, icon: '📅', color: '#3b82f6' },
          { label: 'Employees WFH', value: 5, icon: '👥', color: '#8b5cf6' },
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

      {/* Pending Requests */}
      <div style={{ background: 'white', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>⏳ Pending Requests ({pendingRequests.length})</h2>

        {pendingRequests.length === 0 ? (
          <p style={{ color: '#6b7280', textAlign: 'center', padding: 40 }}>No pending requests</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {pendingRequests.map(request => (
              <div
                key={request.id}
                onClick={() => setSelected(selected?.id === request.id ? null : request)}
                style={{
                  padding: 20,
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  cursor: 'pointer',
                  background: selected?.id === request.id ? '#f9fafb' : 'white',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
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
                    {request.avatar}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600 }}>{request.employee}</span>
                      <span style={{ fontSize: 12, color: '#6b7280' }}>{request.department}</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                      📍 {request.address}
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: 20,
                      fontSize: 12,
                      background: '#fef3c7',
                      color: '#b45309',
                    }}>
                      {request.reason}
                    </span>
                    <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                      {request.startDate} - {request.endDate}
                    </p>
                  </div>
                </div>

                {selected?.id === request.id && (
                  <div style={{ marginTop: 16, padding: 16, background: '#f9fafb', borderRadius: 8 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
                      <div>
                        <p style={{ fontSize: 12, color: '#6b7280' }}>Latitude</p>
                        <p style={{ fontWeight: 500 }}>{request.lat.toFixed(4)}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: 12, color: '#6b7280' }}>Longitude</p>
                        <p style={{ fontWeight: 500 }}>{request.lng.toFixed(4)}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: 12, color: '#6b7280' }}>Radius</p>
                        <p style={{ fontWeight: 500 }}>{request.radius}m</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); approveRequest(request.id); }}
                        style={{
                          flex: 1,
                          padding: 12,
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: 8,
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); rejectRequest(request.id); }}
                        style={{
                          flex: 1,
                          padding: 12,
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: 8,
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approved Requests */}
      <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>✅ Approved ({approvedRequests.length})</h2>
        {approvedRequests.map(request => (
          <div key={request.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: 16,
            borderBottom: '1px solid #e5e7eb',
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: '#dcfce7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
            }}>
              {request.avatar}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 500 }}>{request.employee}</p>
              <p style={{ fontSize: 12, color: '#6b7280' }}>{request.address}</p>
            </div>
            <span style={{ fontSize: 12, color: '#6b7280' }}>
              {request.startDate} - {request.endDate}
            </span>
            <span style={{
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: 12,
              background: '#dcfce7',
              color: '#15803d',
            }}>
              Approved
            </span>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div style={{
        marginTop: 24,
        background: '#eff6ff',
        padding: 20,
        borderRadius: 12,
        borderLeft: '4px solid #3b82f6',
      }}>
        <h3 style={{ color: '#1d4ed8', marginBottom: 8 }}>How WFH tracking works:</h3>
        <ol style={{ color: '#1e40af', fontSize: 13, margin: 0, paddingLeft: 16, lineHeight: 2 }}>
          <li>Employee submits WFH request with location</li>
          <li>HR approves/rejects the request</li>
          <li>If approved, that location becomes employee's attendance location</li>
          <li>Employee must be within radius of approved location</li>
          <li>If outside → Employee AND HR get notified</li>
        </ol>
      </div>
    </div>
  );
}
