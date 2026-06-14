'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { teamCollabService, Channel } from '@/services/team-collab';

// Design System Colors
const colors = {
  primary: '#8B5CF6',
  primaryLight: '#EDE9FE',
  primaryDark: '#7C3AED',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  online: '#22C55E',
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

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadChannels();
  }, []);

  async function loadChannels() {
    try {
      setLoading(true);
      const data = await teamCollabService.getChannels({ limit: 100 });
      setChannels(data.items);
    } catch (error) {
      logger.error('Failed to load channels:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredChannels = channels.filter((channel) => {
    const matchesType = filterType === 'all' || channel.type === filterType;
    const matchesSearch = channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      channel.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const channelTypes = [
    { id: 'all', label: 'All', count: channels.length },
    { id: 'public', label: 'Public', count: channels.filter((c) => c.type === 'public').length },
    { id: 'private', label: 'Private', count: channels.filter((c) => c.type === 'private').length },
    { id: 'project', label: 'Project', count: channels.filter((c) => c.type === 'project').length },
    { id: 'direct', label: 'Direct', count: channels.filter((c) => c.type === 'direct').length },
  ];

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'public': return '📢';
      case 'private': return '🔒';
      case 'project': return '📋';
      case 'direct': return '💬';
      default: return '📢';
    }
  };

  const handleArchive = async (channelId: string) => {
    if (!confirm('Are you sure you want to archive this channel?')) return;
    try {
      await teamCollabService.archiveChannel(channelId);
      loadChannels();
    } catch (error) {
      logger.error('Failed to archive channel:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: colors.gray[500] }}>Loading channels...</p>
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
            <Link href="/team-hub" style={{
              color: colors.gray[500],
              textDecoration: 'none',
              fontSize: '14px',
            }}>
              Team Hub
            </Link>
            <span style={{ color: colors.gray[400] }}>/</span>
            <span style={{ fontSize: '14px', color: colors.gray[900] }}>Channels</span>
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: colors.gray[900],
            margin: 0,
          }}>
            Channels
          </h1>
          <p style={{
            fontSize: '14px',
            color: colors.gray[500],
            margin: '4px 0 0 0',
          }}>
            Manage your team communication channels
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
          <span>+</span> Create Channel
        </button>
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
          {channelTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setFilterType(type.id)}
              style={{
                padding: '8px 16px',
                background: filterType === type.id ? colors.primary : 'white',
                color: filterType === type.id ? 'white' : colors.gray[600],
                border: `1px solid ${filterType === type.id ? colors.primary : colors.gray[200]}`,
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {type.label}
              <span style={{
                marginLeft: '6px',
                padding: '2px 6px',
                background: filterType === type.id ? 'rgba(255,255,255,0.2)' : colors.gray[100],
                borderRadius: '4px',
                fontSize: '11px',
              }}>
                {type.count}
              </span>
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search channels..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: '8px 16px',
            border: `1px solid ${colors.gray[200]}`,
            borderRadius: '6px',
            fontSize: '14px',
            width: '240px',
            outline: 'none',
          }}
        />
      </div>

      {/* Channel Grid */}
      {filteredChannels.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'white',
          borderRadius: '12px',
          border: `1px solid ${colors.gray[200]}`,
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.gray[900], margin: '0 0 8px 0' }}>
            {searchQuery ? 'No channels found' : 'No channels yet'}
          </h3>
          <p style={{ fontSize: '14px', color: colors.gray[500] }}>
            {searchQuery ? 'Try a different search term.' : 'Create your first channel to start collaborating.'}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '16px',
        }}>
          {filteredChannels.map((channel) => (
            <div
              key={channel.channelId}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                border: `1px solid ${colors.gray[200]}`,
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
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
                  {getChannelIcon(channel.type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: colors.gray[900],
                      margin: 0,
                    }}>
                      {channel.name}
                    </h3>
                    {channel.isArchived && (
                      <span style={{
                        padding: '2px 6px',
                        background: colors.gray[200],
                        color: colors.gray[600],
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '600',
                      }}>
                        ARCHIVED
                      </span>
                    )}
                  </div>
                  <span style={{
                    padding: '2px 8px',
                    background: colors.gray[100],
                    color: colors.gray[600],
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '500',
                  }}>
                    {channel.type}
                  </span>
                </div>
              </div>

              {channel.description && (
                <p style={{
                  fontSize: '13px',
                  color: colors.gray[600],
                  margin: '0 0 16px 0',
                  lineHeight: 1.5,
                }}>
                  {channel.description}
                </p>
              )}

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '16px',
                borderTop: `1px solid ${colors.gray[100]}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: colors.gray[500] }}>
                  <span>👥 {channel.memberCount || channel.members?.length || 0} members</span>
                  <span>📝 {channel.unreadCount || 0} unread</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link
                    href={`/team-hub/channels/${channel.channelId}`}
                    style={{
                      padding: '6px 12px',
                      background: colors.primary,
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      textDecoration: 'none',
                    }}
                  >
                    Open
                  </Link>
                  <button
                    onClick={() => handleArchive(channel.channelId)}
                    style={{
                      padding: '6px 12px',
                      background: 'white',
                      color: colors.gray[600],
                      border: `1px solid ${colors.gray[200]}`,
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                    }}
                  >
                    Archive
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Channel Modal */}
      {showCreateModal && (
        <CreateChannelModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            loadChannels();
          }}
        />
      )}
    </div>
  );
}

function CreateChannelModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'public' | 'private' | 'project' | 'direct'>('public');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Channel name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await teamCollabService.createChannel({
        name: name.trim(),
        description: description.trim(),
        type,
        companyId: 'default', // Would come from auth context
      });
      onCreated();
    } catch (err) {
      setError('Failed to create channel. Please try again.');
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
        maxWidth: '480px',
        margin: '16px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.gray[900], margin: 0 }}>
            Create Channel
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: colors.gray[700], marginBottom: '6px' }}>
              Channel Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., engineering, marketing"
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

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: colors.gray[700], marginBottom: '6px' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this channel about?"
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

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: colors.gray[700], marginBottom: '8px' }}>
              Channel Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {[
                { id: 'public', label: 'Public', icon: '📢', desc: 'Visible to everyone' },
                { id: 'private', label: 'Private', icon: '🔒', desc: 'Invite only' },
                { id: 'project', label: 'Project', icon: '📋', desc: 'Project-specific' },
                { id: 'direct', label: 'Direct', icon: '💬', desc: '1-on-1 chat' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id as typeof type)}
                  style={{
                    padding: '12px',
                    background: type === t.id ? colors.primaryLight : 'white',
                    border: `2px solid ${type === t.id ? colors.primary : colors.gray[200]}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '16px' }}>{t.icon}</span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: colors.gray[900] }}>{t.label}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: colors.gray[500] }}>{t.desc}</span>
                </button>
              ))}
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
              {loading ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
