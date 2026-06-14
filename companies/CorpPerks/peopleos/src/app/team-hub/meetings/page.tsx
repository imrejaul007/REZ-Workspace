'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { teamCollabService, Meeting } from '@/services/team-collab';

// Design System Colors
const colors = {
  primary: '#8B5CF6',
  primaryLight: '#EDE9FE',
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

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  scheduled: { bg: '#EDE9FE', text: '#7C3AED', border: '#8B5CF6' },
  in_progress: { bg: '#DCFCE7', text: '#166534', border: '#22C55E' },
  completed: { bg: '#F3F4F6', text: '#374151', border: '#6B7280' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B', border: '#EF4444' },
};

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadMeetings();
  }, []);

  async function loadMeetings() {
    try {
      setLoading(true);
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);

      const [upcoming, calendar] = await Promise.all([
        teamCollabService.getUpcomingMeetings(20),
        teamCollabService.getCalendarMeetings(
          startOfMonth.toISOString(),
          endOfMonth.toISOString()
        ),
      ]);

      // Merge and dedupe
      const allMeetings = [...upcoming];
      calendar.forEach((m) => {
        if (!allMeetings.find((existing) => existing.meetingId === m.meetingId)) {
          allMeetings.push(m);
        }
      });

      setMeetings(allMeetings.sort((a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      ));
    } catch (error) {
      logger.error('Failed to load meetings:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredMeetings = meetings.filter((meeting) => {
    if (filterStatus === 'all') return true;
    return meeting.status === filterStatus;
  });

  const todayMeetings = filteredMeetings.filter((m) => {
    const today = new Date();
    const start = new Date(m.startTime);
    return start.toDateString() === today.toDateString();
  });

  const upcomingMeetings = filteredMeetings.filter((m) => {
    const today = new Date();
    const start = new Date(m.startTime);
    return start > today;
  });

  const pastMeetings = filteredMeetings.filter((m) => {
    const today = new Date();
    const start = new Date(m.startTime);
    return start < today && m.status !== 'in_progress';
  });

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const formatFullDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getMeetingTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return '📹';
      case 'audio': return '🎧';
      case 'in_person': return '🏢';
      case 'phone': return '📞';
      default: return '📹';
    }
  };

  const getDaysUntil = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff < 0) return 'Past';
    return `In ${diff} days`;
  };

  const handleStartMeeting = async (meetingId: string) => {
    try {
      await teamCollabService.startMeeting(meetingId);
      loadMeetings();
    } catch (error) {
      logger.error('Failed to start meeting:', error);
    }
  };

  const handleEndMeeting = async (meetingId: string) => {
    try {
      await teamCollabService.endMeeting(meetingId);
      loadMeetings();
    } catch (error) {
      logger.error('Failed to end meeting:', error);
    }
  };

  const handleCancelMeeting = async (meetingId: string) => {
    if (!confirm('Are you sure you want to cancel this meeting?')) return;
    try {
      await teamCollabService.cancelMeeting(meetingId);
      loadMeetings();
    } catch (error) {
      logger.error('Failed to cancel meeting:', error);
    }
  };

  const handleToggleActionItem = async (meetingId: string, itemId: string) => {
    try {
      await teamCollabService.toggleActionItem(meetingId, itemId);
      loadMeetings();
    } catch (error) {
      logger.error('Failed to toggle action item:', error);
    }
  };

  const statusOptions = [
    { id: 'all', label: 'All' },
    { id: 'scheduled', label: 'Scheduled' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  if (loading) {
    return (
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: colors.gray[500] }}>Loading meetings...</p>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Link href="/team-hub" style={{ color: colors.gray[500], textDecoration: 'none', fontSize: '14px' }}>
              Team Hub
            </Link>
            <span style={{ color: colors.gray[400] }}>/</span>
            <span style={{ fontSize: '14px', color: colors.gray[900] }}>Meetings</span>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.gray[900], margin: 0 }}>
            Meetings
          </h1>
          <p style={{ fontSize: '14px', color: colors.gray[500], margin: '4px 0 0 0' }}>
            Schedule and manage team meetings
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '12px 20px',
            background: colors.primary,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>+</span> Schedule Meeting
        </button>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '16px',
          border: `1px solid ${colors.gray[200]}`,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: colors.primary }}>
            {meetings.filter((m) => m.status === 'scheduled').length}
          </div>
          <div style={{ fontSize: '13px', color: colors.gray[500] }}>Upcoming</div>
        </div>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '16px',
          border: `1px solid ${colors.gray[200]}`,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: colors.success }}>
            {meetings.filter((m) => m.status === 'in_progress').length}
          </div>
          <div style={{ fontSize: '13px', color: colors.gray[500] }}>In Progress</div>
        </div>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '16px',
          border: `1px solid ${colors.gray[200]}`,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: colors.gray[500] }}>
            {meetings.filter((m) => m.status === 'completed').length}
          </div>
          <div style={{ fontSize: '13px', color: colors.gray[500] }}>Completed</div>
        </div>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '16px',
          border: `1px solid ${colors.gray[200]}`,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: colors.danger }}>
            {meetings.filter((m) => m.status === 'cancelled').length}
          </div>
          <div style={{ fontSize: '13px', color: colors.gray[500] }}>Cancelled</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {statusOptions.map((status) => (
            <button
              key={status.id}
              onClick={() => setFilterStatus(status.id)}
              style={{
                padding: '8px 16px',
                background: filterStatus === status.id ? colors.primary : 'white',
                color: filterStatus === status.id ? 'white' : colors.gray[600],
                border: `1px solid ${filterStatus === status.id ? colors.primary : colors.gray[200]}`,
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              {status.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '8px 12px',
              background: viewMode === 'list' ? colors.primary : 'white',
              color: viewMode === 'list' ? 'white' : colors.gray[600],
              border: `1px solid ${viewMode === 'list' ? colors.primary : colors.gray[200]}`,
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            📋 List
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            style={{
              padding: '8px 12px',
              background: viewMode === 'calendar' ? colors.primary : 'white',
              color: viewMode === 'calendar' ? 'white' : colors.gray[600],
              border: `1px solid ${viewMode === 'calendar' ? colors.primary : colors.gray[200]}`,
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            📅 Calendar
          </button>
        </div>
      </div>

      {/* Meetings List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Today's Meetings */}
        {todayMeetings.length > 0 && (
          <section>
            <h2 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: colors.gray[900],
              margin: '0 0 16px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{
                padding: '4px 12px',
                background: colors.success,
                color: 'white',
                borderRadius: '4px',
                fontSize: '12px',
              }}>
                TODAY
              </span>
              {todayMeetings.length} meeting{todayMeetings.length > 1 ? 's' : ''}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {todayMeetings.map((meeting) => (
                <MeetingCard
                  key={meeting.meetingId}
                  meeting={meeting}
                  formatTime={formatTime}
                  formatFullDate={formatFullDate}
                  getMeetingTypeIcon={getMeetingTypeIcon}
                  onStart={handleStartMeeting}
                  onEnd={handleEndMeeting}
                  onCancel={handleCancelMeeting}
                  onToggleActionItem={handleToggleActionItem}
                />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Meetings */}
        {upcomingMeetings.length > 0 && (
          <section>
            <h2 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: colors.gray[900],
              margin: '0 0 16px 0',
            }}>
              Upcoming ({upcomingMeetings.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {upcomingMeetings.map((meeting) => (
                <MeetingCard
                  key={meeting.meetingId}
                  meeting={meeting}
                  formatTime={formatTime}
                  formatFullDate={formatFullDate}
                  getMeetingTypeIcon={getMeetingTypeIcon}
                  onStart={handleStartMeeting}
                  onEnd={handleEndMeeting}
                  onCancel={handleCancelMeeting}
                  onToggleActionItem={handleToggleActionItem}
                />
              ))}
            </div>
          </section>
        )}

        {/* Past Meetings */}
        {pastMeetings.length > 0 && (
          <section>
            <h2 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: colors.gray[500],
              margin: '0 0 16px 0',
            }}>
              Past ({pastMeetings.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pastMeetings.slice(0, 5).map((meeting) => (
                <MeetingCard
                  key={meeting.meetingId}
                  meeting={meeting}
                  formatTime={formatTime}
                  formatFullDate={formatFullDate}
                  getMeetingTypeIcon={getMeetingTypeIcon}
                  onStart={handleStartMeeting}
                  onEnd={handleEndMeeting}
                  onCancel={handleCancelMeeting}
                  onToggleActionItem={handleToggleActionItem}
                  isPast
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {filteredMeetings.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'white',
            borderRadius: '12px',
            border: `1px solid ${colors.gray[200]}`,
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.gray[900], margin: '0 0 8px 0' }}>
              No meetings found
            </h3>
            <p style={{ fontSize: '14px', color: colors.gray[500] }}>
              {filterStatus !== 'all'
                ? 'Try adjusting your filters.'
                : 'Schedule your first meeting to get started.'}
            </p>
          </div>
        )}
      </div>

      {/* Create Meeting Modal */}
      {showCreateModal && (
        <CreateMeetingModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            loadMeetings();
          }}
        />
      )}
    </div>
  );
}

function MeetingCard({
  meeting,
  formatTime,
  formatFullDate,
  getMeetingTypeIcon,
  onStart,
  onEnd,
  onCancel,
  onToggleActionItem,
  isPast = false,
}: {
  meeting: Meeting;
  formatTime: (d: string) => string;
  formatFullDate: (d: string) => string;
  getMeetingTypeIcon: (t: string) => string;
  onStart: (id: string) => void;
  onEnd: (id: string) => void;
  onCancel: (id: string) => void;
  onToggleActionItem: (meetingId: string, itemId: string) => void;
  isPast?: boolean;
}) {
  const statusStyle = statusColors[meeting.status] || statusColors.scheduled;
  const completedActions = meeting.actionItems?.filter((a) => a.completed).length || 0;
  const totalActions = meeting.actionItems?.length || 0;

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      border: `1px solid ${colors.gray[200]}`,
      opacity: isPast ? 0.7 : 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '10px',
            background: statusStyle.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            flexShrink: 0,
          }}>
            {getMeetingTypeIcon(meeting.meetingType)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: colors.gray[900],
                margin: 0,
              }}>
                {meeting.title}
              </h3>
              <span style={{
                padding: '2px 8px',
                background: statusStyle.bg,
                color: statusStyle.text,
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600',
                textTransform: 'uppercase',
              }}>
                {meeting.status.replace('_', ' ')}
              </span>
            </div>
            {meeting.description && (
              <p style={{
                fontSize: '13px',
                color: colors.gray[500],
                margin: '0 0 12px 0',
                lineHeight: 1.4,
              }}>
                {meeting.description.substring(0, 100)}
                {meeting.description.length > 100 && '...'}
              </p>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '13px', color: colors.gray[600] }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                🕐 {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                📅 {formatFullDate(meeting.startTime)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                👤 {meeting.hostName}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                👥 {meeting.attendees.length}
              </span>
              {totalActions > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ✅ {completedActions}/{totalActions} actions
                </span>
              )}
            </div>

            {/* Action Items */}
            {meeting.actionItems && meeting.actionItems.length > 0 && (
              <div style={{
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: `1px solid ${colors.gray[100]}`,
              }}>
                <div style={{ fontSize: '12px', fontWeight: '500', color: colors.gray[500], marginBottom: '8px' }}>
                  Action Items
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {meeting.actionItems.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '13px',
                        color: item.completed ? colors.gray[400] : colors.gray[700],
                        textDecoration: item.completed ? 'line-through' : 'none',
                      }}
                    >
                      <button
                        onClick={() => onToggleActionItem(meeting.meetingId, item.id)}
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '4px',
                          border: `2px solid ${item.completed ? colors.success : colors.gray[300]}`,
                          background: item.completed ? colors.success : 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                        }}
                      >
                        {item.completed && <span style={{ color: 'white', fontSize: '10px' }}>✓</span>}
                      </button>
                      <span style={{ flex: 1 }}>{item.task}</span>
                      <span style={{ fontSize: '11px', color: colors.gray[400] }}>
                        {item.assigneeName}
                      </span>
                    </div>
                  ))}
                  {meeting.actionItems.length > 3 && (
                    <div style={{ fontSize: '12px', color: colors.gray[400], paddingLeft: '26px' }}>
                      +{meeting.actionItems.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {meeting.status === 'scheduled' && (
            <>
              {meeting.meetingLink && (
                <a
                  href={meeting.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '8px 16px',
                    background: colors.primary,
                    color: 'white',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    textDecoration: 'none',
                    textAlign: 'center',
                  }}
                >
                  Join
                </a>
              )}
              <button
                onClick={() => onStart(meeting.meetingId)}
                style={{
                  padding: '8px 16px',
                  background: colors.success,
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Start
              </button>
              <button
                onClick={() => onCancel(meeting.meetingId)}
                style={{
                  padding: '8px 16px',
                  background: 'white',
                  color: colors.danger,
                  border: `1px solid ${colors.danger}`,
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </>
          )}
          {meeting.status === 'in_progress' && (
            <>
              {meeting.meetingLink && (
                <a
                  href={meeting.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '8px 16px',
                    background: colors.primary,
                    color: 'white',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    textDecoration: 'none',
                    textAlign: 'center',
                  }}
                >
                  Join
                </a>
              )}
              <button
                onClick={() => onEnd(meeting.meetingId)}
                style={{
                  padding: '8px 16px',
                  background: colors.danger,
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                End
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CreateMeetingModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [meetingType, setMeetingType] = useState<'video' | 'audio' | 'in_person' | 'phone'>('video');
  const [meetingLink, setMeetingLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || !startTime || !endTime) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const startDateTime = new Date(`${date}T${startTime}`);
      const endDateTime = new Date(`${date}T${endTime}`);

      if (endDateTime <= startDateTime) {
        setError('End time must be after start time');
        setLoading(false);
        return;
      }

      await teamCollabService.createMeeting({
        title: title.trim(),
        description: description.trim(),
        attendees: [], // Would be populated from employee selection
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        meetingType,
        meetingLink: meetingLink.trim() || undefined,
      });

      onCreated();
    } catch (err) {
      setError('Failed to create meeting. Please try again.');
      logger.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
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
        maxWidth: '520px',
        margin: '16px',
        maxHeight: '90vh',
        overflow: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.gray[900], margin: 0 }}>
            Schedule Meeting
          </h2>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              background: colors.gray[100],
              cursor: 'pointer',
              fontSize: '18px',
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: colors.gray[700], marginBottom: '6px' }}>
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Meeting title"
              style={{
                width: '100%',
                padding: '10px 14px',
                border: `1px solid ${colors.gray[200]}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: colors.gray[700], marginBottom: '6px' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Meeting agenda"
              rows={3}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: `1px solid ${colors.gray[200]}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: colors.gray[700], marginBottom: '6px' }}>
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: `1px solid ${colors.gray[200]}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: colors.gray[700], marginBottom: '6px' }}>
                Type
              </label>
              <select
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value as typeof meetingType)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: `1px solid ${colors.gray[200]}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                }}
              >
                <option value="video">📹 Video</option>
                <option value="audio">🎧 Audio</option>
                <option value="in_person">🏢 In Person</option>
                <option value="phone">📞 Phone</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: colors.gray[700], marginBottom: '6px' }}>
                Start Time *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: `1px solid ${colors.gray[200]}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: colors.gray[700], marginBottom: '6px' }}>
                End Time *
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: `1px solid ${colors.gray[200]}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {meetingType === 'video' && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: colors.gray[700], marginBottom: '6px' }}>
                Meeting Link
              </label>
              <input
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://meet.example.com/..."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: `1px solid ${colors.gray[200]}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          )}

          {error && (
            <div style={{
              padding: '12px',
              background: '#FEE2E2',
              color: colors.danger,
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px',
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: 'white',
                color: colors.gray[600],
                border: `1px solid ${colors.gray[200]}`,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                background: loading ? colors.gray[400] : colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Scheduling...' : 'Schedule Meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
