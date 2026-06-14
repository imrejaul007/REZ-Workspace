'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { teamCollabService, Announcement } from '@/services/team-collab';

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

const categoryColors: Record<string, string> = {
  hr: '#EC4899',
  company: '#3B82F6',
  team: '#8B5CF6',
  event: '#F59E0B',
  policy: '#EF4444',
  milestone: '#22C55E',
};

const priorityColors: Record<string, string> = {
  urgent: colors.danger,
  high: colors.warning,
  normal: colors.primary,
  low: colors.gray[400],
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function loadAnnouncements() {
    try {
      setLoading(true);
      const data = await teamCollabService.getAnnouncements({ limit: 50 });
      setAnnouncements(data.items);
    } catch (error) {
      logger.error('Failed to load announcements:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredAnnouncements = announcements.filter((ann) => {
    const matchesCategory = filterCategory === 'all' || ann.category === filterCategory;
    const matchesPriority = filterPriority === 'all' || ann.priority === filterPriority;
    return matchesCategory && matchesPriority;
  });

  const categories = [
    { id: 'all', label: 'All', color: colors.gray[500] },
    { id: 'hr', label: 'HR', color: categoryColors.hr },
    { id: 'company', label: 'Company', color: categoryColors.company },
    { id: 'team', label: 'Team', color: categoryColors.team },
    { id: 'event', label: 'Event', color: categoryColors.event },
    { id: 'policy', label: 'Policy', color: categoryColors.policy },
    { id: 'milestone', label: 'Milestone', color: categoryColors.milestone },
  ];

  const priorities = [
    { id: 'all', label: 'All Priority' },
    { id: 'urgent', label: 'Urgent' },
    { id: 'high', label: 'High' },
    { id: 'normal', label: 'Normal' },
    { id: 'low', label: 'Low' },
  ];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (hours < 48) return 'Yesterday';
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return formatDate(dateStr);
  };

  const handleTrackView = async (announcementId: string) => {
    try {
      await teamCollabService.trackView(announcementId);
      // Update local state
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.announcementId === announcementId ? { ...a, views: a.views + 1 } : a
        )
      );
    } catch (error) {
      logger.error('Failed to track view:', error);
    }
  };

  const handleReaction = async (announcementId: string, emoji: string) => {
    try {
      const updated = await teamCollabService.addAnnouncementReaction(announcementId, emoji);
      setAnnouncements((prev) =>
        prev.map((a) => (a.announcementId === announcementId ? updated : a))
      );
    } catch (error) {
      logger.error('Failed to add reaction:', error);
    }
  };

  const commonReactions = ['👍', '❤️', '🎉', '🚀', '👀'];

  if (loading) {
    return (
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: colors.gray[500] }}>Loading announcements...</p>
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
            <span style={{ fontSize: '14px', color: colors.gray[900] }}>Announcements</span>
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.gray[900], margin: 0 }}>
            Announcements
          </h1>
          <p style={{ fontSize: '14px', color: colors.gray[500], margin: '4px 0 0 0' }}>
            Stay updated with company news and updates
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
          <span>+</span> New Announcement
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
            {announcements.length}
          </div>
          <div style={{ fontSize: '13px', color: colors.gray[500] }}>Total Announcements</div>
        </div>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '16px',
          border: `1px solid ${colors.gray[200]}`,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: colors.danger }}>
            {announcements.filter((a) => a.priority === 'urgent' || a.priority === 'high').length}
          </div>
          <div style={{ fontSize: '13px', color: colors.gray[500] }}>High Priority</div>
        </div>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '16px',
          border: `1px solid ${colors.gray[200]}`,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '28px', fontWeight: '700', color: colors.success }}>
            {announcements.reduce((sum, a) => sum + a.views, 0)}
          </div>
          <div style={{ fontSize: '13px', color: colors.gray[500] }}>Total Views</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: colors.gray[600], marginBottom: '6px' }}>
            Category
          </label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                style={{
                  padding: '6px 12px',
                  background: filterCategory === cat.id ? cat.color : 'white',
                  color: filterCategory === cat.id ? 'white' : colors.gray[600],
                  border: `1px solid ${filterCategory === cat.id ? cat.color : colors.gray[200]}`,
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.color }} />
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: colors.gray[600], marginBottom: '6px' }}>
            Priority
          </label>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            style={{
              padding: '8px 12px',
              border: `1px solid ${colors.gray[200]}`,
              borderRadius: '6px',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {priorities.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Announcements List */}
      {filteredAnnouncements.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'white',
          borderRadius: '12px',
          border: `1px solid ${colors.gray[200]}`,
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📢</div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.gray[900], margin: '0 0 8px 0' }}>
            No announcements found
          </h3>
          <p style={{ fontSize: '14px', color: colors.gray[500] }}>
            {filterCategory !== 'all' || filterPriority !== 'all'
              ? 'Try adjusting your filters.'
              : 'Create your first announcement to get started.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredAnnouncements.map((announcement) => (
            <div
              key={announcement.announcementId}
              onClick={() => {
                setSelectedAnnouncement(announcement);
                handleTrackView(announcement.announcementId);
              }}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                border: `1px solid ${colors.gray[200]}`,
                borderLeft: `4px solid ${priorityColors[announcement.priority]}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '2px 8px',
                      background: priorityColors[announcement.priority],
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                    }}>
                      {announcement.priority}
                    </span>
                    <span style={{
                      padding: '2px 8px',
                      background: categoryColors[announcement.category] + '20',
                      color: categoryColors[announcement.category],
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                    }}>
                      {announcement.category}
                    </span>
                  </div>
                  <h3 style={{
                    fontSize: '18px',
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
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {announcement.summary || announcement.content}
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
                    <span>{formatTimeAgo(announcement.createdAt)}</span>
                    <span>•</span>
                    <span>👁 {announcement.views}</span>
                    {announcement.reactions.length > 0 && (
                      <>
                        <span>•</span>
                        <span>{announcement.reactions.length} reactions</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Reactions */}
              <div style={{
                display: 'flex',
                gap: '4px',
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: `1px solid ${colors.gray[100]}`,
              }}
                onClick={(e) => e.stopPropagation()}
              >
                {commonReactions.map((emoji) => {
                  const count = announcement.reactions.filter((r) => r.emoji === emoji).length;
                  return (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(announcement.announcementId, emoji)}
                      style={{
                        padding: '4px 8px',
                        background: count > 0 ? colors.primaryLight : 'transparent',
                        border: `1px solid ${count > 0 ? colors.primary : colors.gray[200]}`,
                        borderRadius: '4px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.2s',
                      }}
                    >
                      <span>{emoji}</span>
                      {count > 0 && <span style={{ fontSize: '11px', color: colors.primary }}>{count}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Announcement Detail Modal */}
      {selectedAnnouncement && (
        <AnnouncementDetailModal
          announcement={selectedAnnouncement}
          onClose={() => setSelectedAnnouncement(null)}
          onReaction={handleReaction}
        />
      )}

      {/* Create Announcement Modal */}
      {showCreateModal && (
        <CreateAnnouncementModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            loadAnnouncements();
          }}
        />
      )}
    </div>
  );
}

function AnnouncementDetailModal({
  announcement,
  onClose,
  onReaction,
}: {
  announcement: Announcement;
  onClose: () => void;
  onReaction: (id: string, emoji: string) => void;
}) {
  const commonReactions = ['👍', '❤️', '🎉', '🚀', '👀'];

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
      padding: '16px',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '90vh',
        overflow: 'auto',
      }}>
        <div style={{ padding: '24px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                padding: '4px 10px',
                background: priorityColors[announcement.priority],
                color: 'white',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600',
                textTransform: 'uppercase',
              }}>
                {announcement.priority}
              </span>
              <span style={{
                padding: '4px 10px',
                background: categoryColors[announcement.category] + '20',
                color: categoryColors[announcement.category],
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600',
                textTransform: 'uppercase',
              }}>
                {announcement.category}
              </span>
            </div>
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

          <h2 style={{ fontSize: '24px', fontWeight: '700', color: colors.gray[900], margin: '0 0 16px 0' }}>
            {announcement.title}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: colors.primaryLight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: '600',
              color: colors.primary,
            }}>
              {announcement.authorName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: colors.gray[900] }}>
                {announcement.authorName}
              </div>
              <div style={{ fontSize: '12px', color: colors.gray[500] }}>
                {new Date(announcement.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>

          <div style={{
            fontSize: '15px',
            color: colors.gray[700],
            lineHeight: 1.7,
            marginBottom: '24px',
            whiteSpace: 'pre-wrap',
          }}>
            {announcement.content}
          </div>

          {/* Stats */}
          <div style={{
            display: 'flex',
            gap: '24px',
            padding: '16px',
            background: colors.gray[50],
            borderRadius: '8px',
            marginBottom: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: colors.gray[600] }}>
              👁 {announcement.views} views
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: colors.gray[600] }}>
              💬 {announcement.reactions.length} reactions
            </div>
          </div>

          {/* Reactions */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {commonReactions.map((emoji) => {
              const count = announcement.reactions.filter((r) => r.emoji === emoji).length;
              return (
                <button
                  key={emoji}
                  onClick={() => onReaction(announcement.announcementId, emoji)}
                  style={{
                    padding: '8px 12px',
                    background: count > 0 ? colors.primaryLight : 'white',
                    border: `1px solid ${count > 0 ? colors.primary : colors.gray[200]}`,
                    borderRadius: '8px',
                    fontSize: '15px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {emoji}
                  {count > 0 && <span style={{ fontSize: '13px', color: colors.primary, fontWeight: '600' }}>{count}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateAnnouncementModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState<'hr' | 'company' | 'team' | 'event' | 'policy' | 'milestone'>('company');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await teamCollabService.createAnnouncement({
        title: title.trim(),
        content: content.trim(),
        summary: summary.trim(),
        category,
        priority,
      });
      onCreated();
    } catch (err) {
      setError('Failed to create announcement. Please try again.');
      logger.error(err);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'hr', label: 'HR', color: categoryColors.hr },
    { id: 'company', label: 'Company', color: categoryColors.company },
    { id: 'team', label: 'Team', color: categoryColors.team },
    { id: 'event', label: 'Event', color: categoryColors.event },
    { id: 'policy', label: 'Policy', color: categoryColors.policy },
    { id: 'milestone', label: 'Milestone', color: categoryColors.milestone },
  ];

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
        maxWidth: '600px',
        margin: '16px',
        maxHeight: '90vh',
        overflow: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.gray[900], margin: 0 }}>
            New Announcement
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
              placeholder="Enter announcement title"
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
              Content *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter announcement content"
              rows={6}
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

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: colors.gray[700], marginBottom: '6px' }}>
              Summary
            </label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief summary (optional)"
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: colors.gray[700], marginBottom: '6px' }}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as typeof category)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: `1px solid ${colors.gray[200]}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                }}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: colors.gray[700], marginBottom: '6px' }}>
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as typeof priority)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  border: `1px solid ${colors.gray[200]}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                }}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

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
              {loading ? 'Publishing...' : 'Publish Announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
