'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { meetingService, Meeting, OneOnOneWithStats } from '@/services/meeting';

// Design System Colors
const colors = {
  primary: '#8B5CF6',
  primaryLight: '#EDE9FE',
  primaryDark: '#7C3AED',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
};

// Mock user data - in production, this would come from auth context
const currentUser = {
  userId: 'user_123',
  name: 'John Manager',
  role: 'manager',
  companyId: 'corp_001',
};

export default function MeetingsOneOnOnePage() {
  const [oneOnOnes, setOneOnOnes] = useState<OneOnOneWithStats[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'upcoming' | 'history'>('active');
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Form state for scheduling
  const [scheduleForm, setScheduleForm] = useState({
    employeeId: '',
    employeeName: '',
    frequency: 'weekly' as const,
    duration: 30,
    nextScheduled: '',
    preferredTime: '14:00',
    preferredDays: [1, 3, 5],
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [activeData, upcomingData] = await Promise.all([
        meetingService.getActiveOneOnOnes(currentUser.userId),
        meetingService.getUpcomingMeetings(currentUser.userId, 10),
      ]);
      setOneOnOnes(activeData);
      setUpcomingMeetings(upcomingData);
    } catch (error) {
      logger.error('Failed to load meetings:', error);
    } finally {
      setLoading(false);
    }
  }

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      weekly: 'Weekly',
      biweekly: 'Bi-weekly',
      monthly: 'Monthly',
    };
    return labels[frequency] || frequency;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      active: { bg: '#DCFCE7', text: '#22C55E', label: 'Active' },
      paused: { bg: '#FEF3C7', text: '#F59E0B', label: 'Paused' },
      ended: { bg: '#F3F4F6', text: '#6B7280', label: 'Ended' },
    };
    const config = statusConfig[status] || statusConfig.active;
    return (
      <span style={{
        background: config.bg,
        color: config.text,
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '600',
      }}>
        {config.label}
      </span>
    );
  };

  const getMeetingStatusBadge = (meeting: Meeting) => {
    const now = new Date();
    const start = new Date(meeting.scheduledStart);
    const end = new Date(meeting.scheduledEnd);

    let status: { bg: string; text: string; label: string };
    if (meeting.status === 'completed') {
      status = { bg: '#F3F4F6', text: '#6B7280', label: 'Completed' };
    } else if (meeting.status === 'cancelled') {
      status = { bg: '#FEE2E2', text: '#EF4444', label: 'Cancelled' };
    } else if (now >= start && now <= end) {
      status = { bg: '#DCFCE7', text: '#22C55E', label: 'In Progress' };
    } else if (start > now) {
      status = { bg: '#EDE9FE', text: '#8B5CF6', label: 'Upcoming' };
    } else {
      status = { bg: '#FEF3C7', text: '#F59E0B', label: 'Past' };
    }

    return (
      <span style={{
        background: status.bg,
        color: status.text,
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '600',
      }}>
        {status.label}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days === -1) return 'Tomorrow';
    if (days < 0 && days > -7) return `In ${Math.abs(days)} days`;
    if (days > 0 && days < 7) return `${days} days ago`;

    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleScheduleOneOnOne = async () => {
    if (!scheduleForm.employeeId || !scheduleForm.nextScheduled) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await meetingService.scheduleOneOnOne({
        companyId: currentUser.companyId,
        managerId: currentUser.userId,
        managerName: currentUser.name,
        employeeId: scheduleForm.employeeId,
        employeeName: scheduleForm.employeeName,
        type: '1on1',
        frequency: scheduleForm.frequency,
        nextScheduled: scheduleForm.nextScheduled,
        duration: scheduleForm.duration,
        preferredTime: scheduleForm.preferredTime,
        preferredDays: scheduleForm.preferredDays,
        createdById: currentUser.userId,
      });

      setShowScheduleModal(false);
      setScheduleForm({
        employeeId: '',
        employeeName: '',
        frequency: 'weekly',
        duration: 30,
        nextScheduled: '',
        preferredTime: '14:00',
        preferredDays: [1, 3, 5],
      });
      loadData();
    } catch (error) {
      logger.error('Failed to schedule 1:1:', error);
      alert('Failed to schedule 1:1. Please try again.');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: colors.gray[500] }}>Loading 1:1 meetings...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
      }}>
        <div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: colors.gray[900],
            margin: 0,
          }}>
            1:1 Meetings
          </h1>
          <p style={{
            fontSize: '14px',
            color: colors.gray[500],
            margin: '4px 0 0 0',
          }}>
            Manage your one-on-one meetings with your team
          </p>
        </div>
        <button
          onClick={() => setShowScheduleModal(true)}
          style={{
            padding: '10px 20px',
            background: colors.primary,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          + Schedule 1:1
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          border: `1px solid ${colors.gray[200]}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: colors.primaryLight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}>
              👥
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: colors.gray[900] }}>
                {oneOnOnes.filter(o => o.status === 'active').length}
              </div>
              <div style={{ fontSize: '13px', color: colors.gray[500] }}>Active 1:1s</div>
            </div>
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          border: `1px solid ${colors.gray[200]}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#DCFCE7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}>
              📅
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: colors.gray[900] }}>
                {upcomingMeetings.length}
              </div>
              <div style={{ fontSize: '13px', color: colors.gray[500] }}>Upcoming</div>
            </div>
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          border: `1px solid ${colors.gray[200]}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#FEF3C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}>
              ✅
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: colors.gray[900] }}>
                {oneOnOnes.reduce((sum, o) => sum + o.stats.completedMeetings, 0)}
              </div>
              <div style={{ fontSize: '13px', color: colors.gray[500] }}>Completed</div>
            </div>
          </div>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          border: `1px solid ${colors.gray[200]}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#FEE2E2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}>
              📋
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: colors.gray[900] }}>
                {oneOnOnes.reduce((sum, o) => sum + o.stats.pendingActionItems, 0)}
              </div>
              <div style={{ fontSize: '13px', color: colors.gray[500] }}>Action Items</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: `1px solid ${colors.gray[200]}`,
      }}>
        {[
          { id: 'active' as const, label: 'Active 1:1s', count: oneOnOnes.filter(o => o.status === 'active').length },
          { id: 'upcoming' as const, label: 'Upcoming Meetings', count: upcomingMeetings.length },
          { id: 'history' as const, label: 'History', count: 0 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 20px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? `2px solid ${colors.primary}` : '2px solid transparent',
              color: activeTab === tab.id ? colors.primary : colors.gray[500],
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? '600' : '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                background: activeTab === tab.id ? colors.primary : colors.gray[200],
                color: activeTab === tab.id ? 'white' : colors.gray[500],
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: '600',
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ minHeight: '400px' }}>
        {/* Active 1:1s Tab */}
        {activeTab === 'active' && (
          <div>
            {oneOnOnes.filter(o => o.status === 'active').length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: 'white',
                borderRadius: '12px',
                border: `1px solid ${colors.gray[200]}`,
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.gray[900], margin: '0 0 8px 0' }}>
                  No active 1:1s
                </h3>
                <p style={{ fontSize: '14px', color: colors.gray[500], margin: '0 0 20px 0' }}>
                  Schedule your first 1:1 meeting with a team member.
                </p>
                <button
                  onClick={() => setShowScheduleModal(true)}
                  style={{
                    padding: '10px 20px',
                    background: colors.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  Schedule 1:1
                </button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: '16px',
              }}>
                {oneOnOnes.filter(o => o.status === 'active').map((oneOnOne) => (
                  <Link
                    key={oneOnOne.oneOnOneId}
                    href={`/meetings-1on1/${oneOnOne.oneOnOneId}`}
                    style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '20px',
                      border: `1px solid ${colors.gray[200]}`,
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = colors.primary;
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = colors.gray[200];
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: colors.primaryLight,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                          color: colors.primary,
                          fontWeight: '600',
                        }}>
                          {oneOnOne.employeeName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div>
                          <h3 style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: colors.gray[900],
                            margin: 0,
                          }}>
                            {oneOnOne.employeeName}
                          </h3>
                          <p style={{
                            fontSize: '13px',
                            color: colors.gray[500],
                            margin: '2px 0 0 0',
                          }}>
                            {getFrequencyLabel(oneOnOne.frequency)} • {oneOnOne.duration} min
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(oneOnOne.status)}
                    </div>

                    {oneOnOne.nextScheduled && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '12px',
                        padding: '8px 12px',
                        background: colors.gray[50],
                        borderRadius: '8px',
                      }}>
                        <span style={{ fontSize: '16px' }}>📅</span>
                        <span style={{ fontSize: '13px', color: colors.gray[700] }}>
                          Next: {formatDate(oneOnOne.nextScheduled)} at {formatTime(oneOnOne.nextScheduled)}
                        </span>
                      </div>
                    )}

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '13px',
                      color: colors.gray[500],
                    }}>
                      <span>{oneOnOne.stats.completedMeetings} meetings</span>
                      <span>{oneOnOne.stats.completedActionItems} actions done</span>
                    </div>

                    {oneOnOne.stats.averageRating && (
                      <div style={{
                        marginTop: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        <span style={{ color: colors.warning }}>★</span>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: colors.gray[700] }}>
                          {oneOnOne.stats.averageRating.toFixed(1)}
                        </span>
                        <span style={{ fontSize: '13px', color: colors.gray[500] }}>
                          avg rating
                        </span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Upcoming Meetings Tab */}
        {activeTab === 'upcoming' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {upcomingMeetings.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: 'white',
                borderRadius: '12px',
                border: `1px solid ${colors.gray[200]}`,
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.gray[900], margin: '0 0 8px 0' }}>
                  No upcoming meetings
                </h3>
                <p style={{ fontSize: '14px', color: colors.gray[500] }}>
                  Your upcoming meetings will appear here.
                </p>
              </div>
            ) : (
              upcomingMeetings.map((meeting) => (
                <Link
                  key={meeting.meetingId}
                  href={`/meetings-1on1/${meeting.meetingId}`}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '20px',
                    border: `1px solid ${colors.gray[200]}`,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    background: colors.primaryLight,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                  }}>
                    {meeting.meetingType === 'video' ? '📹' :
                     meeting.meetingType === 'audio' ? '🎧' :
                     meeting.meetingType === 'in_person' ? '🏢' : '📞'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h3 style={{
                        fontSize: '15px',
                        fontWeight: '600',
                        color: colors.gray[900],
                        margin: 0,
                      }}>
                        {meeting.title}
                      </h3>
                      {getMeetingStatusBadge(meeting)}
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '16px',
                      fontSize: '13px',
                      color: colors.gray[500],
                    }}>
                      <span>📅 {formatDate(meeting.scheduledStart)}</span>
                      <span>🕐 {formatTime(meeting.scheduledStart)} - {formatTime(meeting.scheduledEnd)}</span>
                      <span>👥 {meeting.attendeeName}</span>
                    </div>
                  </div>
                  {meeting.meetingLink && (
                    <a
                      href={meeting.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding: '8px 16px',
                        background: colors.primary,
                        color: 'white',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '500',
                        textDecoration: 'none',
                      }}
                    >
                      Join
                    </a>
                  )}
                </Link>
              ))
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'white',
            borderRadius: '12px',
            border: `1px solid ${colors.gray[200]}`,
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📜</div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.gray[900], margin: '0 0 8px 0' }}>
              Meeting History
            </h3>
            <p style={{ fontSize: '14px', color: colors.gray[500] }}>
              View your past 1:1 meetings and notes.
            </p>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            maxWidth: '480px',
            maxHeight: '90vh',
            overflow: 'auto',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: colors.gray[900],
                margin: 0,
              }}>
                Schedule 1:1 Meeting
              </h2>
              <button
                onClick={() => setShowScheduleModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: colors.gray[500],
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: colors.gray[700],
                  marginBottom: '6px',
                }}>
                  Employee *
                </label>
                <input
                  type="text"
                  placeholder="Employee Name"
                  value={scheduleForm.employeeName}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, employeeName: e.target.value, employeeId: `emp_${Date.now()}` })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${colors.gray[300]}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: colors.gray[700],
                  marginBottom: '6px',
                }}>
                  Frequency *
                </label>
                <select
                  value={scheduleForm.frequency}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, frequency: e.target.value as 'weekly' | 'biweekly' | 'monthly' })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${colors.gray[300]}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: colors.gray[700],
                  marginBottom: '6px',
                }}>
                  Duration *
                </label>
                <select
                  value={scheduleForm.duration}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, duration: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${colors.gray[300]}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: colors.gray[700],
                  marginBottom: '6px',
                }}>
                  Next Meeting Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={scheduleForm.nextScheduled}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, nextScheduled: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${colors.gray[300]}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: colors.gray[700],
                  marginBottom: '6px',
                }}>
                  Preferred Time
                </label>
                <input
                  type="time"
                  value={scheduleForm.preferredTime}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, preferredTime: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${colors.gray[300]}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: '24px',
            }}>
              <button
                onClick={() => setShowScheduleModal(false)}
                style={{
                  flex: 1,
                  padding: '10px 20px',
                  background: 'white',
                  color: colors.gray[700],
                  border: `1px solid ${colors.gray[300]}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleOneOnOne}
                style={{
                  flex: 1,
                  padding: '10px 20px',
                  background: colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
