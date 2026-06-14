// ==========================================
// MyTalent - Team Announcements Screen
// Company Announcements View
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Linking,
} from 'react-native';
import { Colors } from '../../components/Badge';
import { teamCollabService, Announcement } from '../../services/teamCollabService';

const REACTIONS = ['👍', '❤️', '🎉', '🚀', '👀'];

const CATEGORY_COLORS: Record<string, string> = {
  hr: '#EC4899',
  company: '#3B82F6',
  team: '#8B5CF6',
  event: '#F59E0B',
  policy: '#EF4444',
  milestone: '#22C55E',
};

export default function AnnouncementsScreen() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function loadAnnouncements() {
    try {
      setLoading(true);
      const data = await teamCollabService.getRecentAnnouncements(20);
      setAnnouncements(data);
    } catch (error) {
      logger.error('Failed to load announcements:', error);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadAnnouncements();
    setRefreshing(false);
  }

  async function handleReaction(announcementId: string, emoji: string) {
    try {
      await teamCollabService.addReaction(announcementId, emoji);
      // Update local state
      setAnnouncements((prev) =>
        prev.map((a) => {
          if (a.announcementId === announcementId) {
            const existingReaction = a.reactions.find((r) => r.emoji === emoji);
            if (existingReaction) {
              return {
                ...a,
                reactions: a.reactions.filter((r) => !(r.emoji === emoji && r.userId === 'current')),
              };
            } else {
              return {
                ...a,
                reactions: [...a.reactions, { emoji, odId: 'current', userName: 'You' }],
              };
            }
          }
          return a;
        })
      );
    } catch (error) {
      logger.error('Failed to add reaction:', error);
    }
  }

  async function handleTrackView(announcementId: string) {
    try {
      await teamCollabService.trackView(announcementId);
    } catch {
      // Silently fail
    }
  }

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (hours < 48) return 'Yesterday';
    return `${Math.floor(hours / 24)}d ago`;
  };

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'hr', label: 'HR' },
    { id: 'company', label: 'Company' },
    { id: 'team', label: 'Team' },
    { id: 'event', label: 'Event' },
    { id: 'policy', label: 'Policy' },
    { id: 'milestone', label: 'Milestone' },
  ];

  const filteredAnnouncements = announcements.filter((ann) => {
    return filterCategory === 'all' || ann.category === filterCategory;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'normal': return Colors.primary;
      default: return Colors.textMuted;
    }
  };

  const renderAnnouncementCard = (announcement: Announcement) => (
    <TouchableOpacity
      key={announcement.announcementId}
      style={styles.card}
      onPress={() => {
        setSelectedAnnouncement(announcement);
        handleTrackView(announcement.announcementId);
      }}
    >
      <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(announcement.priority) }]} />

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.badgeContainer}>
            <View style={[styles.categoryBadge, { backgroundColor: CATEGORY_COLORS[announcement.category] + '20' }]}>
              <Text style={[styles.categoryBadgeText, { color: CATEGORY_COLORS[announcement.category] }]}>
                {announcement.category.toUpperCase()}
              </Text>
            </View>
            {announcement.priority !== 'normal' && (
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(announcement.priority) }]}>
                <Text style={styles.priorityBadgeText}>
                  {announcement.priority.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.cardTime}>{formatTimeAgo(announcement.createdAt)}</Text>
        </View>

        <Text style={styles.cardTitle}>{announcement.title}</Text>
        <Text style={styles.cardSummary} numberOfLines={2}>
          {announcement.summary || announcement.content}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.authorContainer}>
            <View style={styles.authorAvatar}>
              <Text style={styles.authorAvatarText}>
                {announcement.authorName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.authorName}>{announcement.authorName}</Text>
          </View>

          <View style={styles.statsContainer}>
            <Text style={styles.statText}>👁 {announcement.views}</Text>
            {announcement.reactions.length > 0 && (
              <Text style={styles.statText}>
                {announcement.reactions.length}
              </Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Announcements</Text>
        <Text style={styles.headerSubtitle}>Stay updated with company news</Text>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.filterChip,
              filterCategory === cat.id && styles.filterChipActive,
            ]}
            onPress={() => setFilterCategory(cat.id)}
          >
            <Text
              style={[
                styles.filterChipText,
                filterCategory === cat.id && styles.filterChipTextActive,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Announcements List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredAnnouncements.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📢</Text>
            <Text style={styles.emptyTitle}>No announcements</Text>
            <Text style={styles.emptySubtitle}>New updates will appear here</Text>
          </View>
        ) : (
          filteredAnnouncements.map(renderAnnouncementCard)
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={!!selectedAnnouncement}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedAnnouncement(null)}
      >
        {selectedAnnouncement && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedAnnouncement(null)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Announcement</Text>
              <View style={styles.modalClosePlaceholder} />
            </View>

            <ScrollView style={styles.modalScrollView} contentContainerStyle={styles.modalContent}>
              <View style={styles.modalBadgeContainer}>
                <View style={[styles.categoryBadge, { backgroundColor: CATEGORY_COLORS[selectedAnnouncement.category] + '20' }]}>
                  <Text style={[styles.categoryBadgeText, { color: CATEGORY_COLORS[selectedAnnouncement.category] }]}>
                    {selectedAnnouncement.category.toUpperCase()}
                  </Text>
                </View>
                {selectedAnnouncement.priority !== 'normal' && (
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(selectedAnnouncement.priority) }]}>
                    <Text style={styles.priorityBadgeText}>
                      {selectedAnnouncement.priority.toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.modalHeading}>{selectedAnnouncement.title}</Text>

              <View style={styles.modalAuthor}>
                <View style={styles.authorAvatar}>
                  <Text style={styles.authorAvatarText}>
                    {selectedAnnouncement.authorName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.authorName}>{selectedAnnouncement.authorName}</Text>
                  <Text style={styles.modalDate}>
                    {new Date(selectedAnnouncement.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              </View>

              <Text style={styles.modalBody}>{selectedAnnouncement.content}</Text>

              <View style={styles.modalStats}>
                <Text style={styles.statText}>👁 {selectedAnnouncement.views} views</Text>
              </View>

              {/* Reactions */}
              <View style={styles.reactionsContainer}>
                <Text style={styles.reactionsLabel}>React</Text>
                <View style={styles.reactionsRow}>
                  {REACTIONS.map((emoji) => {
                    const count = selectedAnnouncement.reactions.filter((r) => r.emoji === emoji).length;
                    return (
                      <TouchableOpacity
                        key={emoji}
                        style={[styles.reactionButton, count > 0 && styles.reactionButtonActive]}
                        onPress={() => handleReaction(selectedAnnouncement.announcementId, emoji)}
                      >
                        <Text style={styles.reactionEmoji}>{emoji}</Text>
                        {count > 0 && (
                          <Text style={styles.reactionCount}>{count}</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  header: {
    backgroundColor: Colors.primary,
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  filterContainer: {
    maxHeight: 50,
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.card,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  priorityIndicator: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  cardSummary: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  authorAvatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  authorName: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: Colors.text,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
  },
  modalClosePlaceholder: {
    width: 32,
  },
  modalScrollView: {
    flex: 1,
  },
  modalContent: {
    padding: 20,
  },
  modalBadgeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  modalHeading: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  modalAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalDate: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  modalBody: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    marginBottom: 20,
  },
  modalStats: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  reactionsContainer: {
    marginTop: 20,
  },
  reactionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  reactionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.card,
    borderRadius: 20,
    gap: 6,
  },
  reactionButtonActive: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  reactionEmoji: {
    fontSize: 22,
  },
  reactionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
});
