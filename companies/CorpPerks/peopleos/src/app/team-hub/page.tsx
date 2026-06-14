'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { teamCollabService, Channel, Announcement, Meeting } from '@/services/team-collab';

// Design System Colors
const colors = {
  primary: '#8B5CF6',      // Indigo
  primaryLight: '#EDE9FE',
  primaryDark: '#7C3AED',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  online: '#22C55E',
  away: '#F59E0B',
  busy: '#EF4444',
  offline: '#6B7280',
  unread: '#6366F1',
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

export default function TeamHubPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'channels' | 'announcements' | 'meetings'>('channels');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [channelsData, announcementsData, meetingsData] = await Promise.all([
        teamCollabService.getMyChannels(),
        teamCollabService.getRecentAnnouncements(5),
        teamCollabService.getUpcomingMeetings(5),
      ]);
      setChannels(channelsData);
      setAnnouncements(announcementsData);
      setMeetings(meetingsData);
    } catch (error) {
      logger.error('Failed to load team hub data:', error);
    } finally {
      setLoading(false);
    }
  }

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'public': return '📢';
      case 'private': return '🔒';
      case 'project': return '📋';
      case 'direct': return '💬';
      default: return '📢';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return colors.danger;
      case 'high': return colors.warning;
      case 'normal': return colors.primary;
      case 'low': return colors.gray[400];
      default: return colors.gray[500];
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (hours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const formatMeetingTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const getMeetingStatus = (meeting: Meeting) => {
    const now = new Date();
    const start = new Date(meeting.startTime);
    const end = new Date(meeting.endTime);

    if (meeting.status === 'completed') return { label: 'Completed', color: colors.gray[500] };
    if (meeting.status === 'cancelled') return { label: 'Cancelled', color: colors.danger };
    if (meeting.status === 'in_progress' || (now >= start && now <= end)) return { label: 'In Progress', color: colors.success };
    if (start > now) return { label: 'Upcoming', color: colors.primary };
    return { label: 'Scheduled', color: colors.gray[500] };
  };

  const tabs = [
    { id: 'channels' as const, label: 'Channels', icon: '💬', count: channels.length },
    { id: 'announcements' as const, label: 'Announcements', icon: '📢', count: announcements.length },
    { id: 'meetings' as const, label: 'Meetings', icon: '📅', count: meetings.length },
  ];

  if (loading) {
    return (
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: colors.gray[500] }}>Loading team hub...</p>
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
            Team Hub
          </h1>
          <p style={{
            fontSize: '14px',
            color: colors.gray[500],
            margin: '4px 0 0 0',
          }}>
            Your collaboration workspace
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/team-hub/channels" style={{
            padding: '10px 16px',
            background: colors.primary,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            textDecoration: 'none',
          }}>
            + Create Channel
          </Link>
          <Link href="/team-hub/meetings" style={{
            padding: '10px 16px',
            background: 'white',
            color: colors.primary,
            border: `1px solid ${colors.primary}`,
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            textDecoration: 'none',
          }}>
            Schedule Meeting
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
              💬
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: colors.gray[900] }}>
                {channels.length}
              </div>
              <div style={{ fontSize: '13px', color: colors.gray[500] }}>Channels</div>
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
              📢
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: colors.gray[900] }}>
                {announcements.length}
              </div>
              <div style={{ fontSize: '13px', color: colors.gray[500] }}>New Announcements</div>
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
                {meetings.length}
              </div>
              <div style={{ fontSize: '13px', color: colors.gray[500] }}>Upcoming Meetings</div>
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
        paddingBottom: '0',
      }}>
        {tabs.map((tab) => (
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
              transition: 'all 0.2s',
            }}
          >
            <span>{tab.icon}</span>
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
        {/* Channels Tab */}
        {activeTab === 'channels' && (
          <div>
            {channels.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: 'white',
                borderRadius: '12px',
                border: `1px solid ${colors.gray[200]}`,
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.gray[900], margin: '0 0 8px 0' }}>
                  No channels yet
                </h3>
                <p style={{ fontSize: '14px', color: colors.gray[500], margin: '0 0 20px 0' }}>
                  Create your first channel to start collaborating with your team.
                </p>
                <Link href="/team-hub/channels" style={{
                  padding: '10px 20px',
                  background: colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  textDecoration: 'none',
                }}>
                  Create Channel
                </Link>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '16px',
              }}>
                {channels.map((channel) => (
                  <Link
                    key={channel.channelId}
                    href={`/team-hub/channels/${channel.channelId}`}
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
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '10px',
                        background: colors.primaryLight,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        flexShrink: 0,
                      }}>
                        {getChannelIcon(channel.type)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <h3 style={{
                            fontSize: '15px',
                            fontWeight: '600',
                            color: colors.gray[900],
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {channel.name}
                          </h3>
                          {channel.unreadCount && channel.unreadCount > 0 && (
                            <span style={{
                              background: colors.unread,
                              color: 'white',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              fontWeight: '600',
                              flexShrink: 0,
                            }}>
                              {channel.unreadCount}
                            </span>
                          )}
                        </div>
                        {channel.description && (
                          <p style={{
                            fontSize: '13px',
                            color: colors.gray[500],
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {channel.description}
                          </p>
                        )}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginTop: '12px',
                          fontSize: '12px',
                          color: colors.gray[400],
                        }}>
                          <span style={{
                            padding: '2px 8px',
                            background: colors.gray[100],
                            borderRadius: '4px',
                          }}>
                            {channel.type}
                          </span>
                          <span>{channel.memberCount || channel.members?.length || 0} members</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {announcements.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: 'white',
                borderRadius: '12px',
                border: `1px solid ${colors.gray[200]}`,
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📢</div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.gray[900], margin: '0 0 8px 0' }}>
                  No announcements
                </h3>
                <p style={{ fontSize: '14px', color: colors.gray[500] }}>
                  New announcements will appear here.
                </p>
              </div>
            ) : (
              announcements.map((announcement) => (
                <div
                  key={announcement.announcementId}
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '20px',
                    border: `1px solid ${colors.gray[200]}`,
                    borderLeft: `4px solid ${getPriorityColor(announcement.priority)}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{
                          padding: '2px 8px',
                          background: getPriorityColor(announcement.priority),
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                        }}>
                          {announcement.priority}
                        </span>
                        <span style={{
                          padding: '2px 8px',
                          background: colors.gray[100],
                          color: colors.gray[600],
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '500',
                        }}>
                          {getCategoryLabel(announcement.category)}
                        </span>
                      </div>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: colors.gray[900],
                        margin: '0 0 8px 0',
                      }}>
                        {announcement.title}
                      </h3>
                      <p style={{
                        fontSize: '14px',
                        color: colors.gray[600],
                        margin: '0 0 12px 0',
                        lineHeight: 1.5,
                      }}>
                        {announcement.summary || announcement.content.substring(0, 150)}
                        {(announcement.summary || announcement.content).length > 150 && '...'}
                      </p>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        fontSize: '12px',
                        color: colors.gray[400],
                      }}>
                        <span>By {announcement.authorName}</span>
                        <span>•</span>
                        <span>{formatTime(announcement.createdAt)}</span>
                        <span>•</span>
                        <span>👁 {announcement.views} views</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            <Link href="/team-hub/announcements" style={{
              padding: '12px 20px',
              background: colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              textDecoration: 'none',
              textAlign: 'center',
            }}>
              View All Announcements
            </Link>
          </div>
        )}

        {/* Meetings Tab */}
        {activeTab === 'meetings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {meetings.length === 0 ? (
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
                <p style={{ fontSize: '14px', color: colors.gray[500], margin: '0 0 20px 0' }}>
                  Schedule a meeting to collaborate with your team.
                </p>
                <Link href="/team-hub/meetings" style={{
                  padding: '10px 20px',
                  background: colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  textDecoration: 'none',
                }}>
                  Schedule Meeting
                </Link>
              </div>
            ) : (
              meetings.map((meeting) => {
                const status = getMeetingStatus(meeting);
                return (
                  <div
                    key={meeting.meetingId}
                    style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '20px',
                      border: `1px solid ${colors.gray[200]}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                      <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '10px',
                          background: colors.primaryLight,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                          flexShrink: 0,
                        }}>
                          {meeting.meetingType === 'video' ? '📹' :
                           meeting.meetingType === 'audio' ? '🎧' :
                           meeting.meetingType === 'in_person' ? '🏢' : '📞'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
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
                              background: status.color + '20',
                              color: status.color,
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '600',
                            }}>
                              {status.label}
                            </span>
                          </div>
                          {meeting.description && (
                            <p style={{
                              fontSize: '13px',
                              color: colors.gray[500],
                              margin: '0 0 12px 0',
                            }}>
                              {meeting.description.substring(0, 100)}
                              {meeting.description.length > 100 && '...'}
                            </p>
                          )}
                          <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '16px',
                            fontSize: '13px',
                            color: colors.gray[600],
                          }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              🕐 {formatMeetingTime(meeting.startTime)} - {formatMeetingTime(meeting.endTime)}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              👥 {meeting.attendees.length} attendees
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              📁 {meeting.actionItems?.length || 0} action items
                            </span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {meeting.meetingLink && status.label === 'Upcoming' && (
                          <a
                            href={meeting.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: '8px 16px',
                              background: colors.primary,
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              textDecoration: 'none',
                            }}
                          >
                            Join
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <Link href="/team-hub/meetings" style={{
              padding: '12px 20px',
              background: colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              textDecoration: 'none',
              textAlign: 'center',
            }}>
              View All Meetings
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
