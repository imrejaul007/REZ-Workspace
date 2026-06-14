'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { meetingService, Meeting, ActionItem, Feedback, MeetingNote } from '@/services/meeting';

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
  companyId: 'corp_001',
};

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const meetingId = params.id as string;

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [notes, setNotes] = useState<MeetingNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'actions' | 'feedback'>('overview');

  // Form states
  const [noteContent, setNoteContent] = useState('');
  const [actionItemForm, setActionItemForm] = useState({
    task: '',
    assigneeId: '',
    assigneeName: '',
    dueDate: '',
    priority: 'medium' as const,
  });
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 4 as 1 | 2 | 3 | 4 | 5,
    feedbackType: 'overall' as Feedback['feedbackType'],
    comment: '',
  });

  useEffect(() => {
    loadMeeting();
  }, [meetingId]);

  async function loadMeeting() {
    try {
      setLoading(true);
      const [meetingData, actionItemsData, feedbackData, notesData] = await Promise.all([
        meetingService.getMeeting(meetingId).catch(() => null),
        meetingService.getActionItems(meetingId).catch(() => []),
        meetingService.getFeedback(meetingId).catch(() => []),
        meetingService.getNotes(meetingId).catch(() => []),
      ]);
      setMeeting(meetingData);
      setActionItems(actionItemsData);
      setFeedback(feedbackData);
      setNotes(notesData);
    } catch (error) {
      logger.error('Failed to load meeting:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = () => {
    if (!meeting) return null;
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      scheduled: { bg: '#EDE9FE', text: '#8B5CF6', label: 'Scheduled' },
      in_progress: { bg: '#DCFCE7', text: '#22C55E', label: 'In Progress' },
      completed: { bg: '#F3F4F6', text: '#6B7280', label: 'Completed' },
      cancelled: { bg: '#FEE2E2', text: '#EF4444', label: 'Cancelled' },
    };
    const config = statusConfig[meeting.status] || statusConfig.scheduled;
    return (
      <span style={{
        background: config.bg,
        color: config.text,
        padding: '4px 12px',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: '600',
      }}>
        {config.label}
      </span>
    );
  };

  const handleStartMeeting = async () => {
    if (!meeting) return;
    try {
      const updated = await meetingService.startMeeting(meeting.meetingId);
      setMeeting(updated);
    } catch (error) {
      logger.error('Failed to start meeting:', error);
    }
  };

  const handleEndMeeting = async () => {
    if (!meeting) return;
    try {
      const updated = await meetingService.endMeeting(meeting.meetingId);
      setMeeting(updated);
    } catch (error) {
      logger.error('Failed to end meeting:', error);
    }
  };

  const handleAddNote = async () => {
    if (!meeting || !noteContent.trim()) return;
    try {
      await meetingService.addNote(meeting.meetingId, currentUser.userId, currentUser.name, {
        content: noteContent,
        sentiment: 'neutral',
      });
      setNoteContent('');
      loadMeeting();
    } catch (error) {
      logger.error('Failed to add note:', error);
    }
  };

  const handleAddActionItem = async () => {
    if (!meeting || !actionItemForm.task.trim()) return;
    try {
      await meetingService.addActionItem(
        meeting.meetingId,
        currentUser.userId,
        currentUser.name,
        {
          task: actionItemForm.task,
          assigneeId: actionItemForm.assigneeId || currentUser.userId,
          assigneeName: actionItemForm.assigneeName || currentUser.name,
          dueDate: actionItemForm.dueDate || undefined,
          priority: actionItemForm.priority,
        }
      );
      setActionItemForm({
        task: '',
        assigneeId: '',
        assigneeName: '',
        dueDate: '',
        priority: 'medium',
      });
      loadMeeting();
    } catch (error) {
      logger.error('Failed to add action item:', error);
    }
  };

  const handleToggleActionItem = async (item: ActionItem) => {
    try {
      await meetingService.updateActionItem(item.itemId, {
        status: item.status === 'completed' ? 'pending' : 'completed',
      });
      loadMeeting();
    } catch (error) {
      logger.error('Failed to toggle action item:', error);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!meeting) return;
    const revieweeId = meeting.hostId === currentUser.userId ? meeting.attendeeId : meeting.hostId;
    const revieweeName = meeting.hostId === currentUser.userId ? meeting.attendeeName : meeting.hostName;

    try {
      await meetingService.submitFeedback(
        meeting.meetingId,
        currentUser.userId,
        currentUser.name,
        revieweeId,
        revieweeName,
        {
          rating: feedbackForm.rating,
          feedbackType: feedbackForm.feedbackType,
          comment: feedbackForm.comment,
        }
      );
      setFeedbackForm({ rating: 4, feedbackType: 'overall', comment: '' });
      loadMeeting();
    } catch (error) {
      logger.error('Failed to submit feedback:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: colors.gray[500] }}>Loading meeting details...</p>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>😕</div>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: colors.gray[900] }}>Meeting not found</h2>
          <p style={{ color: colors.gray[500], marginTop: '8px' }}>This meeting may have been deleted or you don&apos;t have access.</p>
          <Link href="/meetings-1on1" style={{
            display: 'inline-block',
            marginTop: '16px',
            padding: '10px 20px',
            background: colors.primary,
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '500',
          }}>
            Back to Meetings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Link href="/meetings-1on1" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          color: colors.gray[500],
          textDecoration: 'none',
          fontSize: '14px',
          marginBottom: '16px',
        }}>
          ← Back to Meetings
        </Link>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '24px',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <h1 style={{
                fontSize: '28px',
                fontWeight: '700',
                color: colors.gray[900],
                margin: 0,
              }}>
                {meeting.title}
              </h1>
              {getStatusBadge()}
            </div>
            <p style={{
              fontSize: '14px',
              color: colors.gray[500],
              margin: 0,
            }}>
              {formatDate(meeting.scheduledStart)} • {formatTime(meeting.scheduledStart)} - {formatTime(meeting.scheduledEnd)}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {meeting.status === 'scheduled' && (
              <button
                onClick={handleStartMeeting}
                style={{
                  padding: '10px 20px',
                  background: colors.success,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Start Meeting
              </button>
            )}
            {meeting.status === 'in_progress' && (
              <button
                onClick={handleEndMeeting}
                style={{
                  padding: '10px 20px',
                  background: colors.danger,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                End Meeting
              </button>
            )}
            {meeting.meetingLink && meeting.status !== 'completed' && (
              <a
                href={meeting.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '10px 20px',
                  background: colors.primary,
                  color: 'white',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                Join Meeting
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Participants */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        border: `1px solid ${colors.gray[200]}`,
        marginBottom: '24px',
      }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: '600',
          color: colors.gray[700],
          margin: '0 0 16px 0',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          Participants
        </h3>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: colors.primaryLight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.primary,
              fontWeight: '600',
              fontSize: '14px',
            }}>
              {meeting.hostName.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: colors.gray[900] }}>
                {meeting.hostName}
              </div>
              <div style={{ fontSize: '12px', color: colors.gray[500] }}>Host</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#DCFCE7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.success,
              fontWeight: '600',
              fontSize: '14px',
            }}>
              {meeting.attendeeName.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: colors.gray[900] }}>
                {meeting.attendeeName}
              </div>
              <div style={{ fontSize: '12px', color: colors.gray[500] }}>Attendee</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '24px',
        background: colors.gray[100],
        padding: '4px',
        borderRadius: '10px',
        width: 'fit-content',
      }}>
        {[
          { id: 'overview' as const, label: 'Overview' },
          { id: 'notes' as const, label: 'Notes' },
          { id: 'actions' as const, label: `Actions (${actionItems.length})` },
          { id: 'feedback' as const, label: `Feedback (${feedback.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              background: activeTab === tab.id ? 'white' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: activeTab === tab.id ? colors.primary : colors.gray[600],
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? '600' : '500',
              cursor: 'pointer',
              boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Description */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              border: `1px solid ${colors.gray[200]}`,
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: colors.gray[700],
                margin: '0 0 12px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Description
              </h3>
              <p style={{
                fontSize: '14px',
                color: colors.gray[600],
                margin: 0,
                lineHeight: 1.6,
              }}>
                {meeting.description || 'No description provided.'}
              </p>
            </div>

            {/* AI Summary */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              border: `1px solid ${colors.gray[200]}`,
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: colors.gray[700],
                margin: '0 0 12px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                AI Summary
              </h3>
              <p style={{
                fontSize: '14px',
                color: colors.gray[600],
                margin: 0,
                lineHeight: 1.6,
              }}>
                {meeting.aiSummary || 'Summary will be available after the meeting ends.'}
              </p>
            </div>

            {/* Stats */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              border: `1px solid ${colors.gray[200]}`,
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: colors.gray[700],
                margin: '0 0 16px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Meeting Stats
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: colors.gray[900] }}>
                    {meeting.duration}
                  </div>
                  <div style={{ fontSize: '13px', color: colors.gray[500] }}>Duration (min)</div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: colors.gray[900] }}>
                    {actionItems.filter(a => a.status === 'completed').length}/{actionItems.length}
                  </div>
                  <div style={{ fontSize: '13px', color: colors.gray[500] }}>Actions Done</div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: colors.gray[900] }}>
                    {meeting.notes.length}
                  </div>
                  <div style={{ fontSize: '13px', color: colors.gray[500] }}>Notes</div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: colors.gray[900] }}>
                    {feedback.length}
                  </div>
                  <div style={{ fontSize: '13px', color: colors.gray[500] }}>Feedback</div>
                </div>
              </div>
            </div>

            {/* Location/Link */}
            {(meeting.location || meeting.meetingLink) && (
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                border: `1px solid ${colors.gray[200]}`,
              }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: colors.gray[700],
                  margin: '0 0 12px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  Location
                </h3>
                {meeting.meetingLink && (
                  <a
                    href={meeting.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '14px',
                      color: colors.primary,
                      textDecoration: 'underline',
                    }}
                  >
                    {meeting.meetingLink}
                  </a>
                )}
                {meeting.location && (
                  <p style={{
                    fontSize: '14px',
                    color: colors.gray[600],
                    margin: '8px 0 0 0',
                  }}>
                    📍 {meeting.location}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              border: `1px solid ${colors.gray[200]}`,
              marginBottom: '24px',
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: colors.gray[700],
                margin: '0 0 12px 0',
              }}>
                Add Note
              </h3>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Write your meeting notes here..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${colors.gray[300]}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleAddNote}
                disabled={!noteContent.trim()}
                style={{
                  marginTop: '12px',
                  padding: '8px 16px',
                  background: noteContent.trim() ? colors.primary : colors.gray[300],
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: noteContent.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Save Note
              </button>
            </div>

            {notes.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                background: 'white',
                borderRadius: '12px',
                border: `1px solid ${colors.gray[200]}`,
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📝</div>
                <p style={{ color: colors.gray[500] }}>No notes yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {notes.map((note) => (
                  <div
                    key={note.noteId}
                    style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '20px',
                      border: `1px solid ${colors.gray[200]}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: colors.gray[900] }}>
                          {note.authorName}
                        </span>
                        {note.isPrivate && (
                          <span style={{
                            marginLeft: '8px',
                            padding: '2px 6px',
                            background: colors.gray[100],
                            borderRadius: '4px',
                            fontSize: '11px',
                            color: colors.gray[500],
                          }}>
                            Private
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '12px', color: colors.gray[400] }}>
                        {formatDate(note.createdAt)}
                      </span>
                    </div>
                    <p style={{
                      fontSize: '14px',
                      color: colors.gray[600],
                      margin: 0,
                      lineHeight: 1.6,
                    }}>
                      {note.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions Tab */}
        {activeTab === 'actions' && (
          <div>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              border: `1px solid ${colors.gray[200]}`,
              marginBottom: '24px',
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: colors.gray[700],
                margin: '0 0 12px 0',
              }}>
                Add Action Item
              </h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="Task description"
                  value={actionItemForm.task}
                  onChange={(e) => setActionItemForm({ ...actionItemForm, task: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${colors.gray[300]}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <input
                    type="text"
                    placeholder="Assignee name"
                    value={actionItemForm.assigneeName}
                    onChange={(e) => setActionItemForm({ ...actionItemForm, assigneeName: e.target.value, assigneeId: `user_${Date.now()}` })}
                    style={{
                      padding: '10px 12px',
                      border: `1px solid ${colors.gray[300]}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                  <input
                    type="date"
                    value={actionItemForm.dueDate}
                    onChange={(e) => setActionItemForm({ ...actionItemForm, dueDate: e.target.value })}
                    style={{
                      padding: '10px 12px',
                      border: `1px solid ${colors.gray[300]}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                  <select
                    value={actionItemForm.priority}
                    onChange={(e) => setActionItemForm({ ...actionItemForm, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' })}
                    style={{
                      padding: '10px 12px',
                      border: `1px solid ${colors.gray[300]}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <button
                  onClick={handleAddActionItem}
                  disabled={!actionItemForm.task.trim()}
                  style={{
                    padding: '8px 16px',
                    background: actionItemForm.task.trim() ? colors.primary : colors.gray[300],
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: actionItemForm.task.trim() ? 'pointer' : 'not-allowed',
                    width: 'fit-content',
                  }}
                >
                  Add Action Item
                </button>
              </div>
            </div>

            {actionItems.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                background: 'white',
                borderRadius: '12px',
                border: `1px solid ${colors.gray[200]}`,
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
                <p style={{ color: colors.gray[500] }}>No action items yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {actionItems.map((item) => (
                  <div
                    key={item.itemId}
                    style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      border: `1px solid ${colors.gray[200]}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <button
                      onClick={() => handleToggleActionItem(item)}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        border: `2px solid ${item.status === 'completed' ? colors.success : colors.gray[300]}`,
                        background: item.status === 'completed' ? colors.success : 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '14px',
                        flexShrink: 0,
                      }}
                    >
                      {item.status === 'completed' ? '✓' : ''}
                    </button>
                    <div style={{ flex: 1 }}>
                      <p style={{
                        fontSize: '14px',
                        fontWeight: item.status === 'completed' ? '400' : '500',
                        color: item.status === 'completed' ? colors.gray[400] : colors.gray[900],
                        margin: 0,
                        textDecoration: item.status === 'completed' ? 'line-through' : 'none',
                      }}>
                        {item.task}
                      </p>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '12px', color: colors.gray[500] }}>
                        <span>👤 {item.assigneeName}</span>
                        {item.dueDate && (
                          <span>📅 {formatDate(item.dueDate)}</span>
                        )}
                        <span style={{
                          color: item.priority === 'urgent' ? colors.danger :
                                 item.priority === 'high' ? colors.warning :
                                 colors.gray[500],
                        }}>
                          {item.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <div>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              border: `1px solid ${colors.gray[200]}`,
              marginBottom: '24px',
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: colors.gray[700],
                margin: '0 0 12px 0',
              }}>
                Submit Feedback
              </h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: colors.gray[600], marginBottom: '6px', display: 'block' }}>
                    Rating
                  </label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setFeedbackForm({ ...feedbackForm, rating: rating as 1 | 2 | 3 | 4 | 5 })}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          border: 'none',
                          background: feedbackForm.rating >= rating ? colors.warning : colors.gray[100],
                          cursor: 'pointer',
                          fontSize: '18px',
                          color: feedbackForm.rating >= rating ? 'white' : colors.gray[400],
                        }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: colors.gray[600], marginBottom: '6px', display: 'block' }}>
                    Feedback Type
                  </label>
                  <select
                    value={feedbackForm.feedbackType}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, feedbackType: e.target.value as Feedback['feedbackType'] })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid ${colors.gray[300]}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  >
                    <option value="overall">Overall</option>
                    <option value="meeting_prep">Meeting Preparation</option>
                    <option value="engagement">Engagement</option>
                    <option value="action_items">Action Items</option>
                    <option value="communication">Communication</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: colors.gray[600], marginBottom: '6px', display: 'block' }}>
                    Comments
                  </label>
                  <textarea
                    value={feedbackForm.comment}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
                    placeholder="Share your feedback..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: `1px solid ${colors.gray[300]}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      outline: 'none',
                    }}
                  />
                </div>
                <button
                  onClick={handleSubmitFeedback}
                  style={{
                    padding: '8px 16px',
                    background: colors.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    width: 'fit-content',
                  }}
                >
                  Submit Feedback
                </button>
              </div>
            </div>

            {feedback.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                background: 'white',
                borderRadius: '12px',
                border: `1px solid ${colors.gray[200]}`,
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
                <p style={{ color: colors.gray[500] }}>No feedback yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {feedback.map((fb) => (
                  <div
                    key={fb.feedbackId}
                    style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '20px',
                      border: `1px solid ${colors.gray[200]}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: colors.gray[900] }}>
                          {fb.reviewerName}
                        </span>
                        <span style={{ marginLeft: '8px', fontSize: '13px', color: colors.gray[500] }}>
                          → {fb.revieweeName}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: colors.warning }}>★</span>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: colors.gray[900] }}>
                          {fb.rating}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: colors.gray[500], marginBottom: '8px' }}>
                      {fb.feedbackType.replace('_', ' ')} • {formatDate(fb.submittedAt)}
                    </div>
                    {fb.comment && (
                      <p style={{
                        fontSize: '14px',
                        color: colors.gray[600],
                        margin: 0,
                        lineHeight: 1.5,
                      }}>
                        {fb.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
