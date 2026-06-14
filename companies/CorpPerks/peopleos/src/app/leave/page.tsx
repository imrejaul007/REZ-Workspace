'use client';

import React, { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api/client';

// Types
interface LeaveRequest {
  id: string;
  employeeName: string;
  employeeId: string;
  type: 'sick' | 'casual' | 'earned' | 'wfh' | 'maternity' | 'paternity' | 'unpaid';
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedOn: string;
  reviewedBy?: string;
  reviewedOn?: string;
}

interface LeaveBalance {
  type: string;
  total: number;
  used: number;
  remaining: number;
  icon: string;
  color: string;
}

// Mock data
const mockLeaveRequests: LeaveRequest[] = [
  {
    id: '1',
    employeeName: 'Priya Sharma',
    employeeId: 'EMP001',
    type: 'sick',
    fromDate: 'May 22, 2026',
    toDate: 'May 23, 2026',
    days: 2,
    reason: 'Medical appointment and rest',
    status: 'pending',
    appliedOn: 'May 20, 2026',
  },
  {
    id: '2',
    employeeName: 'Rahul Verma',
    employeeId: 'EMP002',
    type: 'casual',
    fromDate: 'May 25, 2026',
    toDate: 'May 28, 2026',
    days: 4,
    reason: 'Family vacation',
    status: 'pending',
    appliedOn: 'May 19, 2026',
  },
  {
    id: '3',
    employeeName: 'Sneha Patel',
    employeeId: 'EMP003',
    type: 'earned',
    fromDate: 'May 15, 2026',
    toDate: 'May 16, 2026',
    days: 2,
    reason: 'Personal work',
    status: 'approved',
    appliedOn: 'May 10, 2026',
    reviewedBy: 'Manager',
    reviewedOn: 'May 11, 2026',
  },
  {
    id: '4',
    employeeName: 'Amit Kumar',
    employeeId: 'EMP004',
    type: 'wfh',
    fromDate: 'May 21, 2026',
    toDate: 'May 21, 2026',
    days: 1,
    reason: 'Plumber coming home',
    status: 'approved',
    appliedOn: 'May 20, 2026',
    reviewedBy: 'Manager',
    reviewedOn: 'May 20, 2026',
  },
  {
    id: '5',
    employeeName: 'Neha Singh',
    employeeId: 'EMP005',
    type: 'sick',
    fromDate: 'May 18, 2026',
    toDate: 'May 18, 2026',
    days: 1,
    reason: 'Feeling unwell',
    status: 'rejected',
    appliedOn: 'May 18, 2026',
    reviewedBy: 'Manager',
    reviewedOn: 'May 18, 2026',
  },
];

const mockLeaveBalances: LeaveBalance[] = [
  { type: 'Sick Leave', total: 12, used: 3, remaining: 9, icon: '🏥', color: '#ef4444' },
  { type: 'Casual Leave', total: 10, used: 2, remaining: 8, icon: '🏖️', color: '#3b82f6' },
  { type: 'Earned Leave', total: 18, used: 5, remaining: 13, icon: '🌟', color: '#f59e0b' },
  { type: 'Work From Home', total: 8, used: 4, remaining: 4, icon: '🏠', color: '#8b5cf6' },
  { type: 'Maternity Leave', total: 90, used: 0, remaining: 90, icon: '👶', color: '#ec4899' },
  { type: 'Paternity Leave', total: 10, used: 0, remaining: 10, icon: '👨', color: '#06b6d4' },
];

const leaveTypeColors: Record<string, string> = {
  sick: '#ef4444',
  casual: '#3b82f6',
  earned: '#f59e0b',
  wfh: '#8b5cf6',
  maternity: '#ec4899',
  paternity: '#06b6d4',
  unpaid: '#6b7280',
};

export default function LeavePage() {
  const [activeTab, setActiveTab] = useState<'requests' | 'balance' | 'calendar' | 'policy'>('requests');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(mockLeaveRequests);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>(mockLeaveBalances);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch leave requests from API
  const fetchLeaveRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.getLeaveRequests();
      if (response.success && response.data) {
        // Transform API response to match frontend interface
        const transformed: LeaveRequest[] = response.data.map((item: any) => ({
          id: item._id,
          employeeName: item.employeeName,
          employeeId: item.employeeId,
          type: item.leaveType,
          fromDate: new Date(item.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          toDate: new Date(item.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          days: item.totalDays,
          reason: item.reason,
          status: item.status,
          appliedOn: new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          reviewedBy: item.approvedBy,
          reviewedOn: item.approvedAt ? new Date(item.approvedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : undefined,
        }));
        setLeaveRequests(transformed);
      }
    } catch (error) {
      logger.error('Failed to fetch leave requests:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch leave balances
  const fetchLeaveBalances = useCallback(async () => {
    try {
      const response = await api.getLeaveBalances();
      if (response.success && response.data) {
        // Transform API response
        const transformed: LeaveBalance[] = response.data.map((emp: any) => ({
          type: emp.employeeId,
          total: 0,
          used: 0,
          remaining: 0,
          icon: '👤',
          color: '#8b5cf6',
        }));
        setLeaveBalances(transformed);
      }
    } catch (error) {
      logger.error('Failed to fetch leave balances:', error);
    }
  }, []);

  useEffect(() => {
    fetchLeaveRequests();
    fetchLeaveBalances();
  }, [fetchLeaveRequests, fetchLeaveBalances]);

  const filteredRequests = leaveRequests.filter((req) => {
    if (statusFilter === 'all') return true;
    return req.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: { bg: '#fef3c7', color: '#92400e' },
      approved: { bg: '#dcfce7', color: '#15803d' },
      rejected: { bg: '#fee2e2', color: '#dc2626' },
    };
    const s = styles[status as keyof typeof styles] || styles.pending;
    return (
      <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', backgroundColor: s.bg, color: s.color }}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 }}>Leave Management</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0' }}>Manage leave requests, balances, and policies</p>
        </div>
        <button
          style={{ backgroundColor: '#8b5cf6', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
          onClick={() => setShowApplyModal(true)}
        >
          + Apply Leave
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <span style={{ fontSize: '32px' }}>📋</span>
          <div>
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
              {mockLeaveRequests.filter((r) => r.status === 'pending').length}
            </p>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Pending Requests</p>
          </div>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <span style={{ fontSize: '32px' }}>✅</span>
          <div>
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 }}>
              {mockLeaveRequests.filter((r) => r.status === 'approved').length}
            </p>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Approved This Month</p>
          </div>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <span style={{ fontSize: '32px' }}>👥</span>
          <div>
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 }}>45</p>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>On Leave Today</p>
          </div>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <span style={{ fontSize: '32px' }}>📅</span>
          <div>
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937', margin: 0 }}>68%</p>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Leave Utilization</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
        {[
          { key: 'requests', label: 'Requests', icon: '📋' },
          { key: 'balance', label: 'Balance', icon: '💰' },
          { key: 'calendar', label: 'Calendar', icon: '📅' },
          { key: 'policy', label: 'Policy', icon: '📋' },
        ].map((tab) => (
          <button
            key={tab.key}
            style={{
              padding: '10px 20px',
              border: 'none',
              backgroundColor: activeTab === tab.key ? '#8b5cf6' : 'transparent',
              color: activeTab === tab.key ? 'white' : '#6b7280',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              borderRadius: '8px',
            }}
            onClick={() => setActiveTab(tab.key as any)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {['all', 'pending', 'approved', 'rejected'].map((filter) => (
              <button
                key={filter}
                style={{
                  padding: '8px 16px',
                  border: statusFilter === filter ? 'none' : '1px solid #e5e7eb',
                  backgroundColor: statusFilter === filter ? '#8b5cf6' : 'white',
                  color: statusFilter === filter ? 'white' : '#6b7280',
                  fontSize: '13px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                }}
                onClick={() => setStatusFilter(filter as any)}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          {/* Table */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Employee</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Type</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Duration</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Reason</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Applied</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Status</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#8b5cf6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '600' }}>
                          {request.employeeName.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div>
                          <p style={{ fontWeight: '600', margin: 0, color: '#1f2937' }}>{request.employeeName}</p>
                          <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{request.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', backgroundColor: leaveTypeColors[request.type] + '20', color: leaveTypeColors[request.type] }}>
                        {request.type.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <p style={{ margin: 0, fontSize: '13px' }}>{request.fromDate}</p>
                      <p style={{ margin: 0, fontSize: '13px' }}>to {request.toDate}</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#6b7280' }}>{request.days} day(s)</p>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <p style={{ margin: 0, fontSize: '13px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{request.reason}</p>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <p style={{ margin: 0, fontSize: '13px' }}>{request.appliedOn}</p>
                      {request.reviewedBy && (
                        <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#6b7280' }}>
                          By {request.reviewedBy} on {request.reviewedOn}
                        </p>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>{getStatusBadge(request.status)}</td>
                    <td style={{ padding: '14px 16px' }}>
                      {request.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button style={{ padding: '6px 12px', backgroundColor: '#dcfce7', color: '#15803d', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>✓ Approve</button>
                          <button style={{ padding: '6px 12px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>✗ Reject</button>
                        </div>
                      )}
                      {request.status !== 'pending' && (
                        <button style={{ padding: '6px 12px', backgroundColor: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>View</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Balance Tab */}
      {activeTab === 'balance' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          {mockLeaveBalances.map((balance) => (
            <div key={balance.type} style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <span style={{ fontSize: '28px' }}>{balance.icon}</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>{balance.type}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '16px' }}>
                <div>
                  <p style={{ fontSize: '36px', fontWeight: '700', color: '#8b5cf6', margin: 0 }}>{balance.remaining}</p>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Remaining</p>
                </div>
                <div style={{ width: '1px', height: '40px', backgroundColor: '#e5e7eb' }} />
                <div>
                  <p style={{ fontSize: '24px', fontWeight: '600', color: '#6b7280', margin: 0 }}>{balance.total}</p>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Total</p>
                </div>
              </div>
              <div style={{ height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(balance.used / balance.total) * 100}%`, backgroundColor: balance.color, borderRadius: '4px' }} />
              </div>
              <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '8px', textAlign: 'center' }}>
                {balance.used} used of {balance.total}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <span style={{ fontSize: '64px' }}>📅</span>
          <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', margin: '16px 0 8px 0' }}>Leave Calendar</h3>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 24px 0' }}>View team availability and planned leaves</p>
          <div style={{ display: 'inline-block', textAlign: 'left' }}>
            <p style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '12px', textAlign: 'center' }}>May 2026</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} style={{ padding: '8px', textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#6b7280' }}>{day}</div>
              ))}
              {Array.from({ length: 28 }, (_, i) => {
                const day = i + 1;
                const hasLeave = [15, 16, 22, 23, 25, 26, 27, 28].includes(day);
                return (
                  <div
                    key={day}
                    style={{
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      color: '#374151',
                      borderRadius: '8px',
                      backgroundColor: hasLeave ? '#dbeafe' : 'transparent',
                      border: hasLeave ? '1px solid #3b82f6' : '1px solid transparent',
                    }}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '16px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b7280' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#3b82f6' }} /> On Leave
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b7280' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#8b5cf6' }} /> WFH
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Policy Tab */}
      {activeTab === 'policy' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
          <h3 style={{ gridColumn: '1 / -1', fontSize: '20px', fontWeight: '600', color: '#1f2937', margin: '0 0 16px 0' }}>Leave Policy</h3>
          {[
            { title: 'Sick Leave', items: ['12 days per year', 'Requires medical certificate for 3+ days', 'Can be encashed at year end (50%)', 'Carry forward allowed'] },
            { title: 'Casual Leave', items: ['10 days per year', 'For personal work or emergencies', 'Cannot be carried forward', 'Requires 2 days advance notice'] },
            { title: 'Earned Leave', items: ['18 days per year (1.5 days/month)', 'Can be accumulated up to 45 days', 'Requires 7 days advance notice', 'Fully encashable at year end'] },
            { title: 'Work From Home', items: ['8 days per month', 'Subject to manager approval', 'Must be productive and available', 'No impact on attendance'] },
          ].map((policy) => (
            <div key={policy.title} style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: '0 0 12px 0' }}>{policy.title}</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#6b7280', fontSize: '14px', lineHeight: '1.8' }}>
                {policy.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowApplyModal(false)}
        >
          <div
            style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '500px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', margin: '0 0 24px 0' }}>Apply for Leave</h2>
            <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>Leave Type</label>
                <select style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}>
                  <option value="">Select type...</option>
                  <option value="sick">Sick Leave</option>
                  <option value="casual">Casual Leave</option>
                  <option value="earned">Earned Leave</option>
                  <option value="wfh">Work From Home</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>From Date</label>
                  <input type="date" style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>To Date</label>
                  <input type="date" style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>Reason</label>
                <textarea style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', resize: 'vertical' }} rows={4} placeholder="Enter reason for leave..." />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" style={{ padding: '10px 20px', backgroundColor: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }} onClick={() => setShowApplyModal(false)}>Cancel</button>
                <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
