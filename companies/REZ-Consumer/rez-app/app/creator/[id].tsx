// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
// Creator Profile Page
// Shows a creator's public profile, stats, picks, and follow/unfollow

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  ActivityIndicator,
  Platform,
  StatusBar,
  Share,
  Linking,
} from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import creatorsApi, { CreatorProfile, CreatorPick } from '@/services/creatorsApi';
import { toggleFollow, checkFollowStatus } from '@/services/followApi';
import { useAuthUser } from '@/stores/selectors';
import { ProfileSkeleton } from '@/components/skeletons';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import { BRAND } from '@/constants/brand';
import { colors } from '@/constants/theme';
import { catchAndWarn } from '@/utils/catchAndReport';
import { useIsMounted } from '@/hooks/useIsMounted';
import { logger } from '@/utils/logger';

const { width } = Dimensions.get('window');
const REZ_COIN = BRAND.COIN_IMAGE;

const formatCount = (count: number): string => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

// ============================================
// PICK CARD COMPONENT
// ============================================

// eslint-disable-next-line react/display-name
const PickCard = React.memo(({ pick, onPress }: { pick: CreatorPick; onPress: () => void }) => (
  <Pressable style={styles.pickCard} onPress={onPress}>
    <View style={{ position: 'relative' }}>
      {pick.productImage ? (
        <CachedImage source={pick.productImage} style={styles.pickImage} contentFit="cover" />
      ) : (
        <View style={[styles.pickImage, styles.pickImagePlaceholder]}>
          <Ionicons name="image-outline" size={24} color={colors.border.default} />
        </View>
      )}
      {pick.videoUrl && (
        <View style={styles.videoIndicator}>
          <Ionicons name="videocam" size={12} color={colors.text.inverse} />
        </View>
      )}
    </View>
    <View style={styles.pickInfo}>
      <Text style={styles.pickTitle} numberOfLines={2}>
        {pick.title}
      </Text>
      <Text style={styles.pickBrand}>{pick.productBrand}</Text>
      <View style={styles.pickFooter}>
        <Text style={styles.pickPrice}>
          {BRAND.CURRENCY_CODE} {pick.productPrice?.toLocaleString()}
        </Text>
        <View style={styles.pickStats}>
          <Ionicons name="eye-outline" size={12} color={colors.text.tertiary} />
          <Text style={styles.pickStatText}>{formatCount(pick.views)}</Text>
        </View>
      </View>
    </View>
    {pick.tag && (
      <View style={styles.pickTagBadge}>
        <Text style={styles.pickTagText}>{pick.tag}</Text>
      </View>
    )}
  </Pressable>
));

// ============================================
// MAIN COMPONENT
// ============================================

function CreatorProfilePage() {
  const isMounted = useIsMounted();
  const router = useRouter();
  const { id } = useLocalSearchParams<unknown>();
  const user = useAuthUser();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [picks, setPicks] = useState<CreatorPick[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Check if this is the logged-in user's own profile
  const isOwnProfile = !!(user?.id && id && (user.id === id || user.id === creator?.profileId));

  const fetchCreatorData = useCallback(async () => {
    if (!id) {
      setError('Creator not found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [profileResponse, picksResponse] = await Promise.all([
        creatorsApi.getCreatorById(id),
        creatorsApi.getCreatorPicks(id, 20),
      ]);

      if (profileResponse.success && profileResponse.data) {
        if (!isMounted()) return;
        setCreator(profileResponse.data);

        // Check follow status (skip for own profile)
        const currentUserId = user?.id;
        const isOwnId = currentUserId && (currentUserId === id || currentUserId === profileResponse.data.profileId);
        if (!isOwnId) {
          const followResponse = await checkFollowStatus(id);
          if (followResponse.success && followResponse.data) {
            setIsFollowing(followResponse.data.isFollowing);
          }
        }
      } else {
        if (!isMounted()) return;
        setError(profileResponse.error || 'Creator not found');
      }

      if (picksResponse.success && picksResponse.data?.picks) {
        if (!isMounted()) return;
        setPicks(picksResponse.data.picks);
      }
    } catch (err) {
      if (!isMounted()) return;
      setError(err.message || 'Failed to load creator profile');
    } finally {
      if (!isMounted()) return;
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    fetchCreatorData();
  }, [fetchCreatorData]);

  const handleFollow = useCallback(async () => {
    if (!id || followLoading) return;

    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    setFollowLoading(true);

    try {
      const response = await toggleFollow(id);
      if (response.success && response.data) {
        setIsFollowing(response.data.following);
      } else {
        if (!isMounted()) return;
        setIsFollowing(wasFollowing); // revert
      }
    } catch {
      if (!isMounted()) return;
      setIsFollowing(wasFollowing); // revert
    } finally {
      if (!isMounted()) return;
      setFollowLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isFollowing, followLoading]);

  const renderPickCard = useCallback(
    ({ item }: { item: CreatorPick }) => (
      <PickCard pick={item} onPress={() => router.push({ pathname: '/picks/[id]', params: { id: item.id } })} />
    ),
    [router],
  );

  const keyExtractor = useCallback((item: CreatorPick) => item.id, []);

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.nileBlue} />
        <LinearGradient colors={[colors.nileBlue, '#2d5a7b']} style={styles.header}>
          <View style={styles.headerContent}>
            <Pressable
              style={styles.backButton}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text.inverse} />
            </Pressable>
            <Text style={styles.headerTitle}>Creator Profile</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>
        <ProfileSkeleton />
      </View>
    );
  }

  // ============================================
  // ERROR
  // ============================================

  if (error || !creator) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.nileBlue} />
        <LinearGradient colors={[colors.nileBlue, '#2d5a7b']} style={styles.header}>
          <View style={styles.headerContent}>
            <Pressable
              style={styles.backButton}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text.inverse} />
            </Pressable>
            <Text style={styles.headerTitle}>Creator Profile</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={56} color={Colors.error} />
          <Text style={styles.errorTitle}>Unable to Load</Text>
          <Text style={styles.errorMessage}>{error || 'Creator not found'}</Text>
          <Pressable style={styles.retryButton} onPress={fetchCreatorData}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
          <Pressable
            style={styles.goBackButton}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          >
            <Text style={styles.goBackButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.nileBlue} />

      {/* Header */}
      <LinearGradient colors={[colors.nileBlue, '#2d5a7b']} style={styles.header}>
        <View style={styles.headerContent}>
          <Pressable
            style={styles.backButton}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.inverse} />
          </Pressable>
          <Text style={styles.headerTitle}>{creator.name}</Text>
          <Pressable
            style={styles.shareButton}
            onPress={() => {
              Share.share({
                message: `Check out ${creator.name} on ${BRAND.APP_NAME}!`,
                title: creator.name,
              }).catch((err) => {
                // R2-H1 FIX: Log Share failure so attribution can be retried.
                if (__DEV__) logger.warn('[creator] Share failed:', { error: err });
              });
            }}
          >
            <Ionicons name="share-social-outline" size={22} color={colors.text.inverse} />
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          {/* Cover Image */}
          {creator.coverImage && (
            <CachedImage source={creator.coverImage} style={styles.coverImage} contentFit="cover" />
          )}

          {/* Avatar & Info */}
          <View style={styles.profileInfo}>
            <View style={styles.avatarSection}>
              <LinearGradient colors={['#9333EA', colors.brand.pink]} style={styles.avatarGradient}>
                {creator.avatar ? (
                  <CachedImage source={creator.avatar} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={40} color={colors.text.inverse} />
                )}
              </LinearGradient>
            </View>

            <View style={styles.nameSection}>
              <View style={styles.nameRow}>
                <Text style={styles.creatorName}>{creator.name}</Text>
                {creator.verified && <Ionicons name="checkmark-circle" size={20} color={Colors.info} />}
              </View>
              {creator.tier && (
                <View style={styles.tierBadge}>
                  <CachedImage source={REZ_COIN} style={{ width: 14, height: 14, borderRadius: 7 }} />
                  <Text style={styles.tierText}>
                    {creator.tier.charAt(0).toUpperCase() + creator.tier.slice(1)} Creator
                  </Text>
                </View>
              )}
              {creator.bio && <Text style={styles.bioText}>{creator.bio}</Text>}
            </View>

            {/* Action Button: Edit Profile (own) or Follow (others) */}
            {isOwnProfile ? (
              <Pressable style={styles.editProfileButton} onPress={() => router.push('/creator/edit')}>
                <Ionicons name="create-outline" size={16} color={colors.nileBlue} />
                <Text style={styles.editProfileButtonText}>Edit</Text>
              </Pressable>
            ) : (
              <Pressable
                style={[styles.followButton, isFollowing ? styles.followingButton : null]}
                onPress={handleFollow}
                disabled={followLoading}
              >
                {followLoading ? (
                  <ActivityIndicator size="small" color={isFollowing ? colors.text.tertiary : colors.text.inverse} />
                ) : (
                  <Text style={[styles.followButtonText, isFollowing ? styles.followingButtonText : null]}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                )}
              </Pressable>
            )}
          </View>

          {/* Tags */}
          {creator.tags && creator.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {creator.tags.map((tag, index) => (
                <View key={index} style={styles.tagPill}>
                  <Text style={styles.tagPillText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statBoxValue}>{formatCount(creator.stats.followers)}</Text>
            <Text style={styles.statBoxLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statBoxValue}>{formatCount(creator.stats.totalVideos)}</Text>
            <Text style={styles.statBoxLabel}>Picks</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statBoxValue}>{formatCount(creator.stats.totalViews)}</Text>
            <Text style={styles.statBoxLabel}>Views</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statBoxValue}>{formatCount(creator.stats.totalLikes)}</Text>
            <Text style={styles.statBoxLabel}>Likes</Text>
          </View>
        </View>

        {/* Own Profile Actions */}
        {isOwnProfile && (
          <View style={styles.ownProfileActions}>
            <Pressable style={styles.dashboardButton} onPress={() => router.push('/creator-dashboard')}>
              <Ionicons name="analytics-outline" size={18} color={colors.text.inverse} />
              <Text style={styles.dashboardButtonText}>Go to Dashboard</Text>
            </Pressable>
            {creator.stats.engagementRate != null && (
              <View style={styles.extraStatsRow}>
                <View style={styles.extraStatItem}>
                  <Text style={styles.extraStatValue}>{creator.stats.engagementRate}%</Text>
                  <Text style={styles.extraStatLabel}>Engagement</Text>
                </View>
                {creator.stats.totalConversions != null && (
                  <View style={styles.extraStatItem}>
                    <Text style={styles.extraStatValue}>{formatCount(creator.stats.totalConversions)}</Text>
                    <Text style={styles.extraStatLabel}>Conversions</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Social Links */}
        {creator.socialLinks && creator.socialLinks.length > 0 && (
          <View style={styles.socialSection}>
            <Text style={styles.sectionTitle}>Social Links</Text>
            <View style={styles.socialLinks}>
              {creator.socialLinks.map((link, index) => (
                <Pressable
                  key={index}
                  style={styles.socialLink}
                  onPress={() => {
                    if (link.url) {
                      try {
                        Linking.openURL(link.url);
                      } catch (e) {
                        catchAndWarn(e, 'CreatorProfile/openURL');
                      }
                    }
                  }}
                >
                  <Ionicons
                    name={
                      link.platform === 'instagram'
                        ? 'logo-instagram'
                        : link.platform === 'youtube'
                          ? 'logo-youtube'
                          : link.platform === 'twitter'
                            ? 'logo-twitter'
                            : link.platform === 'tiktok'
                              ? 'musical-notes'
                              : ('link' as unknown)
                    }
                    size={18}
                    color={colors.text.tertiary}
                  />
                  <Text style={styles.socialLinkText}>{link.platform}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Picks Section */}
        <View style={styles.picksSection}>
          <Text style={styles.sectionTitle}>Product Picks ({picks.length})</Text>

          {picks.length > 0 ? (
            <View style={styles.picksGrid}>
              {picks.map((pick) => (
                <PickCard
                  key={pick.id}
                  pick={pick}
                  onPress={() => router.push({ pathname: '/picks/[id]', params: { id: pick.id } })}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyPicks}>
              <Ionicons name="bag-outline" size={40} color={colors.border.default} />
              <Text style={styles.emptyPicksText}>No picks yet</Text>
            </View>
          )}
        </View>

        {/* Joined Date */}
        {creator.joinedAt && (
          <View style={styles.joinedSection}>
            <Ionicons name="calendar-outline" size={14} color={colors.text.tertiary} />
            <Text style={styles.joinedText}>
              Joined{' '}
              {new Date(creator.joinedAt).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 40,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.h4,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },

  // Loading & Error
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    ...Typography.body,
    color: colors.text.tertiary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['2xl'],
  },
  errorTitle: {
    ...Typography.h4,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
  },
  errorMessage: {
    ...Typography.body,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  retryButton: {
    backgroundColor: colors.nileBlue,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  retryButtonText: {
    color: colors.text.inverse,
    ...Typography.body,
    fontWeight: '600',
  },
  goBackButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  goBackButtonText: {
    color: colors.text.tertiary,
    ...Typography.body,
    fontWeight: '500',
  },

  // Profile
  profileSection: {
    backgroundColor: colors.text.inverse,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  coverImage: {
    width: width,
    height: 140,
    backgroundColor: colors.border.default,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.base,
    gap: Spacing.md,
  },
  avatarSection: {},
  avatarGradient: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  nameSection: {
    flex: 1,
    paddingTop: Spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  creatorName: {
    ...Typography.h3,
    fontWeight: '700',
    color: colors.text.primary,
    flexShrink: 1,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  tierText: {
    ...Typography.caption,
    fontWeight: '600',
    color: colors.primary[500],
  },
  bioText: {
    ...Typography.body,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  followButton: {
    backgroundColor: Colors.info,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    minWidth: 90,
    alignItems: 'center',
    marginTop: 4,
  },
  followingButton: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  followButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  followingButtonText: {
    color: colors.text.tertiary,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginTop: 4,
  },
  editProfileButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.nileBlue,
  },
  ownProfileActions: {
    backgroundColor: colors.text.inverse,
    padding: Spacing.base,
    marginTop: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  dashboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: colors.nileBlue,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  dashboardButtonText: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  extraStatsRow: {
    flexDirection: 'row',
    gap: Spacing.base,
    marginTop: Spacing.md,
  },
  extraStatItem: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    alignItems: 'center',
  },
  extraStatValue: {
    ...Typography.body,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 2,
  },
  extraStatLabel: {
    fontSize: 11,
    color: colors.text.tertiary,
    fontWeight: '500',
  },

  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
  },
  tagPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  tagPillText: {
    ...Typography.caption,
    fontWeight: '500',
    color: colors.primary[500],
  },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: colors.text.inverse,
    paddingVertical: Spacing.base,
    marginTop: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statBoxValue: {
    ...Typography.h4,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 2,
  },
  statBoxLabel: {
    ...Typography.caption,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border.default,
    alignSelf: 'center',
  },

  // Social
  socialSection: {
    backgroundColor: colors.text.inverse,
    padding: Spacing.base,
    marginTop: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  socialLinks: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  socialLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: colors.background.secondary,
  },
  socialLinkText: {
    ...Typography.caption,
    color: colors.text.secondary,
    fontWeight: '500',
    textTransform: 'capitalize',
  },

  // Picks
  picksSection: {
    padding: Spacing.base,
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.h4,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: Spacing.md,
  },
  picksGrid: {
    gap: Spacing.md,
  },
  pickCard: {
    backgroundColor: colors.text.inverse,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
    flexDirection: 'row',
  },
  pickImage: {
    width: 100,
    height: 100,
    backgroundColor: colors.background.secondary,
  },
  pickImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoIndicator: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 4,
    padding: 3,
  },
  pickInfo: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  pickTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.text.primary,
    lineHeight: 18,
    marginBottom: 2,
  },
  pickBrand: {
    ...Typography.caption,
    color: colors.text.tertiary,
    marginBottom: Spacing.xs,
  },
  pickFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickPrice: {
    ...Typography.body,
    fontWeight: '700',
    color: colors.nileBlue,
  },
  pickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  pickStatText: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  pickTagBadge: {
    position: 'absolute',
    top: Spacing.xs,
    left: Spacing.xs,
    backgroundColor: 'rgba(26, 58, 82, 0.85)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  pickTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  emptyPicks: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyPicksText: {
    ...Typography.body,
    color: colors.text.tertiary,
    marginTop: Spacing.sm,
  },

  // Joined
  joinedSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.base,
  },
  joinedText: {
    ...Typography.caption,
    color: colors.text.tertiary,
  },
});

export default withErrorBoundary(CreatorProfilePage, 'CreatorId');
