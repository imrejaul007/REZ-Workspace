'use client';

import { useState, useCallback } from 'react';

interface CoverageGap {
  id: string;
  date: string;
  timeSlot: string;
  role: string;
  department: string;
  status: 'critical' | 'warning' | 'filled';
  employeesNeeded: number;
  employeesScheduled: number;
}

interface SwapRequest {
  id: string;
  requester: { name: string; avatar: string };
  target: { name: string; avatar: string };
  date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface OvertimeRequest {
  id: string;
  employee: { name: string; avatar: string };
  date: string;
  hours: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

const mockCoverageGaps: CoverageGap[] = [
  { id: '1', date: '2026-05-31', timeSlot: '09:00 - 17:00', role: 'Server', department: 'Service', status: 'critical', employeesNeeded: 3, employeesScheduled: 1 },
  { id: '2', date: '2026-05-31', timeSlot: '17:00 - 22:00', role: 'Bartender', department: 'Bar', status: 'warning', employeesNeeded: 2, employeesScheduled: 1 },
  { id: '3', date: '2026-06-01', timeSlot: '06:00 - 14:00', role: 'Chef', department: 'Kitchen', status: 'critical', employeesNeeded: 2, employeesScheduled: 0 },
  { id: '4', date: '2026-06-02', timeSlot: '14:00 - 22:00', role: 'Host', department: 'Service', status: 'filled', employeesNeeded: 1, employeesScheduled: 1 },
];

const mockSwapRequests: SwapRequest[] = [
  { id: '1', requester: { name: 'Priya Sharma', avatar: 'PS' }, target: { name: 'Rahul Verma', avatar: 'RV' }, date: '2026-05-28', reason: 'Medical appointment', status: 'pending' },
  { id: '2', requester: { name: 'Sneha Patel', avatar: 'SP' }, target: { name: 'Amit Kumar', avatar: 'AK' }, date: '2026-05-29', reason: 'Family event', status: 'approved' },
  { id: '3', requester: { name: 'Neha Singh', avatar: 'NS' }, target: { name: 'Vikram Rao', avatar: 'VR' }, date: '2026-05-30', reason: 'Personal work', status: 'pending' },
];

const mockOvertimeRequests: OvertimeRequest[] = [
  { id: '1', employee: { name: 'Rahul Verma', avatar: 'RV' }, date: '2026-05-30', hours: 4, reason: 'Inventory preparation', status: 'pending' },
  { id: '2', employee: { name: 'Amit Kumar', avatar: 'AK' }, date: '2026-05-31', hours: 6, reason: 'Weekend event coverage', status: 'approved' },
  { id: '3', employee: { name: 'Vikram Rao', avatar: 'VR' }, date: '2026-06-01', hours: 3, reason: 'Kitchen deep cleaning', status: 'pending' },
];

const departments = ['All', 'Kitchen', 'Service', 'Bar', 'Management'];

export default function AdvancedShiftsPage() {
  const [activeTab, setActiveTab] = useState<'coverage' | 'swaps' | 'overtime' | 'patterns'>('coverage');
  const [selectedDept, setSelectedDept] = useState('All');
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>(mockSwapRequests);
  const [overtimeRequests, setOvertimeRequests] = useState<OvertimeRequest[]>(mockOvertimeRequests);

  const filteredGaps = mockCoverageGaps.filter(
    (g) => selectedDept === 'All' || g.department === selectedDept
  );

  const stats = {
    criticalGaps: mockCoverageGaps.filter((g) => g.status === 'critical').length,
    pendingSwaps: swapRequests.filter((s) => s.status === 'pending').length,
    pendingOvertime: overtimeRequests.filter((o) => o.status === 'pending').length,
    weeklyOTHours: 24,
    avgCoverage: 87,
  };

  const handleSwapAction = useCallback((id: string, action: 'approved' | 'rejected') => {
    setSwapRequests((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: action } : s))
    );
  }, []);

  const handleOvertimeAction = useCallback((id: string, action: 'approved' | 'rejected') => {
    setOvertimeRequests((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: action } : o))
    );
  }, []);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; color: string; label: string }> = {
      critical: { bg: '#fee2e2', color: '#dc2626', label: 'Critical' },
      warning: { bg: '#fef3c7', color: '#b45309', label: 'Warning' },
      filled: { bg: '#dcfce7', color: '#15803d', label: 'Filled' },
      pending: { bg: '#fef3c7', color: '#b45309', label: 'Pending' },
      approved: { bg: '#dcfce7', color: '#15803d', label: 'Approved' },
      rejected: { bg: '#fee2e2', color: '#dc2626', label: 'Rejected' },
    };
    const s = styles[status] || styles.pending;
    return (
      <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: s.bg, color: s.color }}>
        {s.label}
      </span>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span>Advanced Shift Management</span>
            <span style={{ fontSize: 14, padding: '4px 12px', background: '#8b5cf6', color: 'white', borderRadius: 20, fontWeight: 500 }}>Pro</span>
          </h1>
          <p style={{ color: '#6b7280', margin: '8px 0 0' }}>Coverage optimization, swap management, and overtime tracking</p>
        </div>
        <button
          onClick={() => setShowNewRequest(true)}
          style={{ padding: '12px 24px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <span>+</span> New Request
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'white', padding: 20, borderRadius: 12, borderLeft: '4px solid #dc2626' }}>
          <p style={{ fontSize: 32, fontWeight: 700, color: '#dc2626', margin: 0 }}>{stats.criticalGaps}</p>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '8px 0 0' }}>Critical Gaps</p>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 12, borderLeft: '4px solid #f59e0b' }}>
          <p style={{ fontSize: 32, fontWeight: 700, color: '#f59e0b', margin: 0 }}>{stats.pendingSwaps}</p>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '8px 0 0' }}>Swap Requests</p>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 12, borderLeft: '4px solid #3b82f6' }}>
          <p style={{ fontSize: 32, fontWeight: 700, color: '#3b82f6', margin: 0 }}>{stats.pendingOvertime}</p>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '8px 0 0' }}>Overtime Pending</p>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 12, borderLeft: '4px solid #8b5cf6' }}>
          <p style={{ fontSize: 32, fontWeight: 700, color: '#8b5cf6', margin: 0 }}>{stats.weeklyOTHours}h</p>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '8px 0 0' }}>Weekly Overtime</p>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 12, borderLeft: '4px solid #10b981' }}>
          <p style={{ fontSize: 32, fontWeight: 700, color: '#10b981', margin: 0 }}>{stats.avgCoverage}%</p>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '8px 0 0' }}>Avg Coverage</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #e5e7eb', paddingBottom: 8 }}>
        {[
          { key: 'coverage', label: 'Coverage Gaps', icon: '📊' },
          { key: 'swaps', label: 'Shift Swaps', icon: '🔄' },
          { key: 'overtime', label: 'Overtime', icon: '⏰' },
          { key: 'patterns', label: 'Patterns', icon: '📈' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 500,
              background: activeTab === tab.key ? '#8b5cf6' : 'transparent',
              color: activeTab === tab.key ? 'white' : '#6b7280',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Coverage Gaps Tab */}
      {activeTab === 'coverage' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: 20,
                  cursor: 'pointer',
                  fontWeight: 500,
                  background: selectedDept === dept ? '#8b5cf6' : '#e5e7eb',
                  color: selectedDept === dept ? 'white' : '#6b7280',
                }}
              >
                {dept}
              </button>
            ))}
          </div>

          <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', textAlign: 'left', fontSize: 13, color: '#6b7280' }}>
                  <th style={{ padding: '12px 16px' }}>Date</th>
                  <th style={{ padding: '12px 16px' }}>Time Slot</th>
                  <th style={{ padding: '12px 16px' }}>Role</th>
                  <th style={{ padding: '12px 16px' }}>Department</th>
                  <th style={{ padding: '12px 16px' }}>Coverage</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGaps.map((gap) => (
                  <tr key={gap.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: 16, fontWeight: 500 }}>{gap.date}</td>
                    <td style={{ padding: 16, color: '#6b7280' }}>{gap.timeSlot}</td>
                    <td style={{ padding: 16 }}>{gap.role}</td>
                    <td style={{ padding: 16 }}>{gap.department}</td>
                    <td style={{ padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 100, height: 8, background: '#e5e7eb', borderRadius: 4 }}>
                          <div
                            style={{
                              width: `${(gap.employeesScheduled / gap.employeesNeeded) * 100}%`,
                              height: '100%',
                              background: gap.status === 'critical' ? '#dc2626' : gap.status === 'warning' ? '#f59e0b' : '#10b981',
                              borderRadius: 4,
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 13, color: '#6b7280' }}>
                          {gap.employeesScheduled}/{gap.employeesNeeded}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: 16 }}>{getStatusBadge(gap.status)}</td>
                    <td style={{ padding: 16 }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button style={{ padding: '6px 12px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                          Auto-Fill
                        </button>
                        <button style={{ padding: '6px 12px', background: '#e5e7eb', color: '#6b7280', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                          Notify
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Shift Swaps Tab */}
      {activeTab === 'swaps' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Pending Swaps */}
            <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
              <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }}></span>
                Pending Approvals
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {swapRequests.filter((s) => s.status === 'pending').map((swap) => (
                  <div key={swap.id} style={{ padding: 16, background: '#f9fafb', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#8b5cf6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>
                        {swap.requester.avatar}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, margin: 0 }}>{swap.requester.name}</p>
                        <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>wants to swap with</p>
                      </div>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>
                        {swap.target.avatar}
                      </div>
                      <p style={{ fontWeight: 600, margin: 0 }}>{swap.target.name}</p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Date: {swap.date}</p>
                        <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>Reason: {swap.reason}</p>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handleSwapAction(swap.id, 'approved')}
                          style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleSwapAction(swap.id, 'rejected')}
                          style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Swap History */}
            <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
              <h3 style={{ margin: '0 0 16px' }}>Recent Approvals</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {swapRequests.filter((s) => s.status !== 'pending').map((swap) => (
                  <div key={swap.id} style={{ padding: 16, background: '#f9fafb', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#8b5cf6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600 }}>
                          {swap.requester.avatar}
                        </div>
                        <span style={{ fontWeight: 500 }}>{swap.requester.name}</span>
                        <span style={{ color: '#6b7280' }}>↔</span>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600 }}>
                          {swap.target.avatar}
                        </div>
                        <span style={{ fontWeight: 500 }}>{swap.target.name}</span>
                      </div>
                      {getStatusBadge(swap.status)}
                    </div>
                    <p style={{ fontSize: 13, color: '#6b7280', margin: '8px 0 0' }}>{swap.date}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overtime Tab */}
      {activeTab === 'overtime' && (
        <div>
          <div style={{ background: 'white', borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Overtime Summary</h3>
              <button style={{ padding: '8px 16px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 500 }}>
                Set Overtime Policy
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <div style={{ padding: 16, background: '#f9fafb', borderRadius: 8 }}>
                <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>This Week</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: '#8b5cf6', margin: '8px 0 0' }}>24h</p>
              </div>
              <div style={{ padding: 16, background: '#f9fafb', borderRadius: 8 }}>
                <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>This Month</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: '#8b5cf6', margin: '8px 0 0' }}>86h</p>
              </div>
              <div style={{ padding: 16, background: '#f9fafb', borderRadius: 8 }}>
                <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>OT Cost (Month)</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: '#ef4444', margin: '8px 0 0' }}>₹45,600</p>
              </div>
              <div style={{ padding: 16, background: '#f9fafb', borderRadius: 8 }}>
                <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Pending Requests</p>
                <p style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b', margin: '8px 0 0' }}>3</p>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', textAlign: 'left', fontSize: 13, color: '#6b7280' }}>
                  <th style={{ padding: '12px 16px' }}>Employee</th>
                  <th style={{ padding: '12px 16px' }}>Date</th>
                  <th style={{ padding: '12px 16px' }}>Hours</th>
                  <th style={{ padding: '12px 16px' }}>Reason</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {overtimeRequests.map((req) => (
                  <tr key={req.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                    <td style={{ padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#8b5cf6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>
                          {req.employee.avatar}
                        </div>
                        <span style={{ fontWeight: 500 }}>{req.employee.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: 16 }}>{req.date}</td>
                    <td style={{ padding: 16, fontWeight: 600, color: '#8b5cf6' }}>{req.hours}h</td>
                    <td style={{ padding: 16, color: '#6b7280' }}>{req.reason}</td>
                    <td style={{ padding: 16 }}>{getStatusBadge(req.status)}</td>
                    <td style={{ padding: 16 }}>
                      {req.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => handleOvertimeAction(req.id, 'approved')}
                            style={{ padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleOvertimeAction(req.id, 'rejected')}
                            style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Patterns Tab */}
      {activeTab === 'patterns' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
            <h3 style={{ margin: '0 0 16px' }}>Weekly Distribution</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { day: 'Monday', hours: 156, percentage: 18 },
                { day: 'Tuesday', hours: 168, percentage: 20 },
                { day: 'Wednesday', hours: 162, percentage: 19 },
                { day: 'Thursday', hours: 150, percentage: 18 },
                { day: 'Friday', hours: 144, percentage: 17 },
                { day: 'Saturday', hours: 48, percentage: 6 },
                { day: 'Sunday', hours: 24, percentage: 2 },
              ].map((item) => (
                <div key={item.day} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 80, fontSize: 13, color: '#6b7280' }}>{item.day}</span>
                  <div style={{ flex: 1, height: 24, background: '#e5e7eb', borderRadius: 4 }}>
                    <div style={{ width: `${item.percentage}%`, height: '100%', background: '#8b5cf6', borderRadius: 4 }} />
                  </div>
                  <span style={{ width: 40, fontSize: 13, fontWeight: 500, textAlign: 'right' }}>{item.hours}h</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
            <h3 style={{ margin: '0 0 16px' }}>Department Coverage</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { dept: 'Kitchen', coverage: 92, critical: false },
                { dept: 'Service', coverage: 88, critical: false },
                { dept: 'Bar', coverage: 76, critical: true },
                { dept: 'Management', coverage: 95, critical: false },
              ].map((item) => (
                <div key={item.dept} style={{ padding: 12, background: '#f9fafb', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontWeight: 500 }}>{item.dept}</span>
                    <span style={{ color: item.critical ? '#dc2626' : '#10b981', fontWeight: 600 }}>{item.coverage}%</span>
                  </div>
                  <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4 }}>
                    <div
                      style={{
                        width: `${item.coverage}%`,
                        height: '100%',
                        background: item.critical ? '#dc2626' : '#10b981',
                        borderRadius: 4,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
            <h3 style={{ margin: '0 0 16px' }}>Peak Hours Analysis</h3>
            <div style={{ padding: 16, background: '#f9fafb', borderRadius: 8 }}>
              <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Highest Demand Window</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#8b5cf6', margin: '8px 0' }}>12:00 - 14:00</p>
              <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Staffing needed: 15 employees</p>
              <p style={{ fontSize: 13, color: '#dc2626', margin: '4px 0 0' }}>Current: 11 employees</p>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 12, padding: 24 }}>
            <h3 style={{ margin: '0 0 16px' }}>AI Recommendations</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { icon: '💡', text: 'Add 2 servers for Saturday dinner service', impact: 'High' },
                { icon: '💡', text: 'Consider split shifts for bar coverage', impact: 'Medium' },
                { icon: '💡', text: 'Cross-train kitchen staff for flexibility', impact: 'Medium' },
              ].map((rec, i) => (
                <div key={i} style={{ padding: 12, background: '#f9fafb', borderRadius: 8, display: 'flex', gap: 12 }}>
                  <span style={{ fontSize: 20 }}>{rec.icon}</span>
                  <div>
                    <p style={{ margin: 0, fontWeight: 500 }}>{rec.text}</p>
                    <span style={{ fontSize: 12, color: rec.impact === 'High' ? '#dc2626' : '#6b7280' }}>{rec.impact} Impact</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New Request Modal */}
      {showNewRequest && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: 32, borderRadius: 16, width: 500 }}>
            <h2 style={{ marginTop: 0 }}>Create New Request</h2>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Request Type</label>
              <select style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}>
                <option>Shift Swap</option>
                <option>Overtime Request</option>
                <option>Coverage Request</option>
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Date</label>
              <input type="date" style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Reason</label>
              <textarea style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb', minHeight: 100 }} placeholder="Enter reason for request..." />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowNewRequest(false)}
                style={{ flex: 1, padding: 12, background: '#e5e7eb', border: 'none', borderRadius: 8, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowNewRequest(false)}
                style={{ flex: 1, padding: 12, background: '#8b5cf6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
