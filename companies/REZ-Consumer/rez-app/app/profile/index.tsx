// Profile Page — Sprint 12: dark mode applied
// User profile page with icon grid and menu list
// Refactored: state/effects extracted into `hooks/useProfileData.ts`

import { colors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import React, { useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  StatusBar,
  Platform,
  RefreshControl,
  ActivityIndicator,
  ViewStyle,
  DimensionValue,
} from 'react-native';
import CachedImage from '@/components/ui/CachedImage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { HeaderBackButton } from '@/components/navigation/SafeBackButton';
import { PROFILE_COLORS, ProfileIconGridItem, ProfileMenuListItem } from '@/types/profile.types';
import { Colors, Spacing } from '@/constants/DesignSystem';
import { profileMenuListItems } from '@/data/profileData';
import LocationDisplay from '@/components/location/LocationDisplay';
import TimeDisplay from '@/components/location/TimeDisplay';
import { useSafeNavigation } from '@/hooks/useSafeNavigation';
import { useProfileData } from '@/hooks/useProfileData';

function ProfilePage() {
  const { isDark, sprintColors: themeColors } = useTheme();
  const { goBack, canGoBack } = useSafeNavigation();
  const router = useProfileData().router;

  const {
    user,
    profileCompletion,
    completionStatus,
    identitySegment,
    verificationSegment,
    instituteName,
    companyName,
    statistics,
    statsLoading,
    statsError,
    referralCount,
    rezScoreData,
    REZ_TIER_THRESHOLDS,
    getRezTier,
    getCompletionMessage,
    getMissingFields,
    refreshing,
    uploadingImage,
    onRefresh,
    handleImageUpload,
    handleShareProfile,
    iconGridData,
    currencySymbol,
  } = useProfileData();

  // ── Navigation handlers ──────────────────────────────────────────────────

  const handleIconGridItemPress = useCallback(
    (item: ProfileIconGridItem) => {
      switch (item.id) {
        case 'product':
          router.push('/my-products');
          break;
        case 'service':
          router.push('/my-services');
          break;
        case 'voucher':
          router.push('/my-vouchers');
          break;
        case 'earns':
          router.push('/my-earnings');
          break;
        default:
          if (item.route) router.push(item.route as unknown as string);
          break;
      }
    },
    [router],
  );

  const handleMenuItemPress = useCallback(
    (item: ProfileMenuListItem) => {
      switch (item.id) {
        case 'order_transaction_history':
          router.push('/tracking');
          break;
        case 'bookings':
          router.push('/my-bookings');
          break;
        case 'incomplete_transaction':
          router.push('/transactions/incomplete');
          break;
        case 'home_delivery':
          router.push('/home-delivery');
          break;
        case 'rezcoin':
          router.push('/wallet-screen');
          break;
        case 'group_buy':
          router.push('/group-buy');
          break;
        case 'order_tracking':
          router.push('/tracking');
          break;
        case 'review':
          router.push('/my-reviews');
          break;
        case 'social_media':
          router.push('/social-media');
          break;
        case 'achievements':
          router.push('/profile/achievements');
          break;
        case 'saved_addresses':
          router.push('/account/addresses');
          break;
        case 'notification_preferences':
          router.push('/account/notifications');
          break;
        case 'checkin_history':
          router.push('/checkin-history');
          break;
        case 'settings':
          router.push('/settings');
          break;
        case 'notifications_inbox':
          router.push('/notifications');
          break;
        case 'nearby_map':
          router.push('/map');
          break;
        case 'bill_simulator':
          router.push('/bill-simulator');
          break;
        default:
          if (item.route) router.push(item.route as unknown as string);
          break;
      }
    },
    [router],
  );

  const handleLocationSettingsPress = useCallback(() => {
    router.push('/location/settings');
  }, [router]);

  // ── Render helpers ────────────────────────────────────────────────────────

  const getMenuItemBadge = useCallback(
    (itemId: string): string | undefined => {
      if (!statistics) return undefined;
      switch (itemId) {
        case 'incomplete_transaction': {
          const pendingCount =
            (statistics.orders?.total || 0) - (statistics.orders?.completed || 0) - (statistics.orders?.cancelled || 0);
          return pendingCount > 0 ? pendingCount.toString() : undefined;
        }
        case 'rezcoin': {
          const balance = Math.round(statistics.wallet?.balance || 0);
          return balance > 0 ? balance.toString() : undefined;
        }
        case 'achievements': {
          const unlockedCount = statistics.achievements?.unlocked || 0;
          return unlockedCount > 0 ? unlockedCount.toString() : undefined;
        }
        default:
          return undefined;
      }
    },
    [statistics],
  );

  const renderIconGridItem = useCallback(
    (item: ProfileIconGridItem) => (
      <Pressable
        key={item.id}
        style={styles.iconGridItem}
        onPress={() => handleIconGridItemPress(item)}
        accessibilityLabel={item.title}
        accessibilityRole="button"
        accessibilityHint={`${item.count || 0} items. Double tap to view your ${item.title.toLowerCase()}`}
      >
        <View style={[styles.iconContainer, { backgroundColor: item.backgroundColor }]}>
          <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={24} color={item.color} />
        </View>
        <ThemedText style={styles.iconLabel}>{item.title}</ThemedText>
        {item.count && <ThemedText style={styles.iconCount}>{item.count}</ThemedText>}
      </Pressable>
    ),
    [handleIconGridItemPress],
  );

  const renderMenuListItem = useCallback(
    (item: ProfileMenuListItem) => {
      const dynamicBadge = getMenuItemBadge(item.id);
      const badgeValue = dynamicBadge || item.badge;
      return (
        <Pressable
          key={item.id}
          style={styles.menuItem}
          onPress={() => handleMenuItemPress(item)}
          accessibilityLabel={`${item.title}${badgeValue ? `, ${badgeValue} ${item.isNew ? '' : 'items'}` : ''}${item.description ? `, ${item.description}` : ''}`}
          accessibilityRole="button"
          accessibilityHint={`Double tap to navigate to ${item.title.toLowerCase()}`}
        >
          <View style={styles.menuItemLeft}>
            <View style={styles.menuIconContainer}>
              <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={22} color={PROFILE_COLORS.primary} />
            </View>
            <View style={styles.menuTextContainer}>
              <ThemedText style={styles.menuTitle}>{item.title}</ThemedText>
              {item.description && <ThemedText style={styles.menuDescription}>{item.description}</ThemedText>}
            </View>
          </View>
          <View style={styles.menuItemRight}>
            {badgeValue && (
              <View style={[styles.menuBadge, item.isNew ? styles.newBadge : styles.numericBadge]}>
                <ThemedText style={[styles.menuBadgeText, item.isNew ? styles.newBadgeText : null]}>
                  {item.isNew ? 'New' : badgeValue}
                </ThemedText>
              </View>
            )}
            {item.showArrow && <Ionicons name="chevron-forward" size={18} color={PROFILE_COLORS.textSecondary} />}
          </View>
        </Pressable>
      );
    },
    [handleMenuItemPress, getMenuItemBadge],
  );

  // ── JSX ──────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, isDark && { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={PROFILE_COLORS.primary} translucent={true} />

      {/* Modern Profile Header */}
      <LinearGradient
        colors={[PROFILE_COLORS.primary, PROFILE_COLORS.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          {canGoBack && <HeaderBackButton fallbackRoute="/(tabs)" light={true} iconSize={22} />}
          <View style={styles.headerTitleSection}>
            <ThemedText style={styles.headerTitle}>My Profile</ThemedText>
            <ThemedText style={styles.headerSubtitle}>Personal information and preferences</ThemedText>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.actionButton}
              onPress={() => router.push('/profile/qr-code')}
              accessibilityLabel="View QR Code"
              accessibilityRole="button"
            >
              <Ionicons name="qr-code-outline" size={22} color="white" />
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => router.push('/profile/edit')}
              accessibilityLabel="Edit profile"
              accessibilityRole="button"
            >
              <Ionicons name="create-outline" size={22} color="white" />
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={handleShareProfile}
              accessibilityLabel="Share profile"
              accessibilityRole="button"
            >
              <Ionicons name="share-outline" size={22} color="white" />
            </Pressable>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={PROFILE_COLORS.primary}
            colors={[PROFILE_COLORS.primary]}
          />
        }
      >
        {/* User Info Section */}
        <View style={styles.userSection}>
          <View style={[styles.userCard, isDark && { backgroundColor: themeColors.card }]}>
            <Pressable
              style={styles.avatarContainer}
              onPress={handleImageUpload}
              disabled={uploadingImage}
              accessibilityLabel={uploadingImage ? 'Uploading profile picture' : 'Change profile picture'}
              accessibilityRole="button"
              accessibilityHint={
                uploadingImage ? 'Please wait while image uploads' : 'Double tap to upload a new profile picture'
              }
              accessibilityState={{ disabled: uploadingImage, busy: uploadingImage }}
            >
              <View style={styles.avatar}>
                {user?.avatar ? (
                  <CachedImage source={{ uri: user.avatar }} style={styles.avatarImage} cachePolicy="memory-disk" />
                ) : (
                  <ThemedText style={styles.avatarText}>{user?.initials || 'U'}</ThemedText>
                )}
                {uploadingImage && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator color="white" size="small" />
                  </View>
                )}
              </View>
              <View style={styles.avatarEditBadge}>
                <Ionicons name="camera" size={14} color="white" />
              </View>
            </Pressable>
            <View style={styles.userInfo}>
              <ThemedText style={styles.userName}>{user?.name || ''}</ThemedText>
              <ThemedText style={styles.userEmail}>{user?.email || ''}</ThemedText>
              {user?.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={PROFILE_COLORS.success} />
                  <ThemedText style={styles.verifiedText}>Verified</ThemedText>
                </View>
              )}
              <Pressable
                style={styles.editProfileButton}
                onPress={() => router.push('/profile/edit')}
                accessibilityRole="button"
                accessibilityLabel="Edit profile"
              >
                <Ionicons name="create-outline" size={16} color={PROFILE_COLORS.primary} />
                <ThemedText style={styles.editProfileButtonText}>Edit Profile</ThemedText>
              </Pressable>
            </View>
          </View>

          {/* Identity Status Banner */}
          {identitySegment !== 'normal' && (
            <View style={styles.identityBanner}>
              <View
                style={[
                  styles.identityBannerInner,
                  {
                    backgroundColor:
                      verificationSegment === 'verified'
                        ? colors.successScale[50]
                        : verificationSegment === 'provisional' || verificationSegment === 'pending'
                          ? colors.warningScale[50]
                          : colors.infoScale[50],
                  },
                ]}
              >
                <View
                  style={[
                    styles.identityIconCircle,
                    {
                      backgroundColor:
                        verificationSegment === 'verified'
                          ? colors.successScale[100]
                          : verificationSegment === 'provisional' || verificationSegment === 'pending'
                            ? colors.warningScale[100]
                            : colors.infoScale[100],
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      identitySegment === 'verified_student'
                        ? 'school'
                        : identitySegment === 'verified_employee'
                          ? 'briefcase'
                          : 'shield-checkmark'
                    }
                    size={20}
                    color={
                      verificationSegment === 'verified'
                        ? colors.successScale[600]
                        : verificationSegment === 'provisional' || verificationSegment === 'pending'
                          ? colors.warningScale[600]
                          : colors.infoScale[600]
                    }
                  />
                </View>
                <View style={styles.identityTextContainer}>
                  <ThemedText
                    style={[
                      styles.identityTitle,
                      {
                        color:
                          verificationSegment === 'verified'
                            ? colors.successScale[700]
                            : verificationSegment === 'provisional' || verificationSegment === 'pending'
                              ? colors.warningScale[700]
                              : colors.infoScale[700],
                      },
                    ]}
                  >
                    {verificationSegment === 'verified'
                      ? identitySegment === 'verified_student'
                        ? 'Student Verified'
                        : identitySegment === 'verified_employee'
                          ? 'Corporate Verified'
                          : 'Identity Verified'
                      : verificationSegment === 'provisional'
                        ? 'Provisional Access'
                        : 'Verification Pending'}
                  </ThemedText>
                  <ThemedText style={styles.identitySubtitle}>
                    {identitySegment === 'verified_student' && instituteName
                      ? instituteName
                      : identitySegment === 'verified_employee' && companyName
                        ? companyName
                        : verificationSegment === 'verified'
                          ? 'Exclusive deals unlocked'
                          : 'Full access after review'}
                  </ThemedText>
                </View>
              </View>
            </View>
          )}

          {/* Profile Completion Indicator */}
          {profileCompletion < 100 && (
            <Pressable
              style={styles.completionCard}
              onPress={() => router.push('/profile/edit')}
              accessibilityLabel={`Profile completion ${profileCompletion} percent`}
              accessibilityRole="button"
            >
              <View style={styles.completionHeader}>
                <View style={styles.completionInfo}>
                  <ThemedText style={styles.completionTitle}>Profile Completion</ThemedText>
                  <ThemedText style={styles.completionMessage}>{getCompletionMessage(profileCompletion)}</ThemedText>
                </View>
                <View style={styles.completionPercentage}>
                  <ThemedText style={styles.percentageText}>{profileCompletion}%</ThemedText>
                </View>
              </View>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${profileCompletion}%`,
                      backgroundColor:
                        profileCompletion >= 80 ? Colors.gold : profileCompletion >= 50 ? Colors.warning : Colors.error,
                    },
                  ]}
                />
              </View>
              {getMissingFields().length > 0 && (
                <View style={styles.missingFields}>
                  <ThemedText style={styles.missingFieldsLabel}>Add: {getMissingFields().join(', ')}</ThemedText>
                  <Ionicons name="chevron-forward" size={16} color={PROFILE_COLORS.primary} />
                </View>
              )}
            </Pressable>
          )}

          {/* Invite Friends card */}
          <Pressable
            style={styles.inviteFriendsCard}
            onPress={() => router.push('/invite-friends')}
            accessibilityLabel="Invite Friends"
            accessibilityRole="button"
          >
            <View style={styles.inviteFriendsContent}>
              <View style={styles.inviteFriendsIcon}>
                <Ionicons name="gift-outline" size={22} color={colors.lightMustard} />
              </View>
              <View style={styles.inviteFriendsText}>
                <ThemedText style={styles.inviteFriendsTitle}>Invite Friends</ThemedText>
                <ThemedText style={styles.inviteFriendsSub}>
                  {referralCount !== null && referralCount > 0
                    ? `You've invited ${referralCount} friend${referralCount !== 1 ? 's' : ''}`
                    : 'Share your code and earn coins together'}
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.neutral[400]} />
            </View>
          </Pressable>

          {/* Referral Program Card */}
          <Pressable
            style={styles.referralCard}
            onPress={() => router.push('/referral')}
            accessibilityLabel="Refer and Earn 100 rupees"
            accessibilityRole="button"
          >
            <LinearGradient
              colors={[PROFILE_COLORS.primary, PROFILE_COLORS.primaryDark]}
              style={styles.referralGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.referralContent}>
                <View style={styles.referralIcon}>
                  <Ionicons name="gift" size={28} color="white" />
                </View>
                <View style={styles.referralText}>
                  <ThemedText style={styles.referralTitle}>Refer & Earn {currencySymbol}100</ThemedText>
                  <ThemedText style={styles.referralSubtitle}>
                    {referralCount !== null && referralCount > 0
                      ? `Friends joined: ${referralCount}`
                      : 'Invite friends and get rewards'}
                  </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={20} color="white" />
              </View>
            </LinearGradient>
          </Pressable>

          {/* Loyalty Points Card */}
          <Pressable
            style={styles.loyaltyCard}
            onPress={() => router.push('/profile/achievements')}
            accessibilityLabel="Loyalty points"
            accessibilityRole="button"
          >
            <View style={styles.loyaltyContent}>
              <View style={styles.loyaltyLeft}>
                <View style={styles.loyaltyIcon}>
                  <Ionicons name="diamond" size={24} color={Colors.warning} />
                </View>
                <View style={styles.loyaltyText}>
                  <ThemedText style={styles.loyaltyPoints}>Loyalty Rewards</ThemedText>
                  <ThemedText style={styles.loyaltyLabel}>Gold tier</ThemedText>
                </View>
              </View>
              <View style={styles.loyaltyRight}>
                <View style={styles.tierBadge}>
                  <Ionicons name="star" size={12} color={Colors.warning} />
                  <ThemedText style={styles.tierText}>Gold</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={20} color={PROFILE_COLORS.primary} />
              </View>
            </View>
          </Pressable>

          {/* REZ Score Card */}
          {rezScoreData &&
            (() => {
              const score = rezScoreData.score;
              const tier = getRezTier(score);
              const trendPoints = rezScoreData.trendPoints ?? 0;
              const isUp = trendPoints > 0;
              const isDown = trendPoints < 0;
              const nextTier = REZ_TIER_THRESHOLDS.slice()
                .reverse()
                .find((t) => t.min > score);
              const nextTierMin = nextTier?.min ?? 1000;
              const progressInTier = score - tier.min;
              const tierRange = tier.max - tier.min;
              const progressPct = Math.min((progressInTier / tierRange) * 100, 100);
              return (
                <Pressable
                  style={styles.rezScoreCard}
                  onPress={() => router.push('/rez-score')}
                  accessibilityRole="button"
                  accessibilityLabel={`REZ Score ${score}`}
                >
                  <View style={styles.rezScoreHeader}>
                    <View>
                      <ThemedText style={styles.rezScoreTitle}>REZ Score</ThemedText>
                      <View style={[styles.rezTierBadge, { backgroundColor: tier.bg }]}>
                        <ThemedText style={[styles.rezTierText, { color: tier.color }]}>
                          {tier.label.toUpperCase()}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.rezScoreRight}>
                      <ThemedText style={[styles.rezScoreNumber, { color: tier.color }]}>{score}</ThemedText>
                      <ThemedText style={styles.rezScoreOutOf}>/ 1000</ThemedText>
                    </View>
                  </View>
                  <View style={styles.rezProgressTrack}>
                    <View
                      style={[
                        styles.rezProgressFill,
                        { width: `${progressPct}%` as unknown as DimensionValue, backgroundColor: tier.color },
                      ]}
                    />
                  </View>
                  <View style={styles.rezProgressLabels}>
                    <ThemedText style={styles.rezProgressLeft}>{tier.label}</ThemedText>
                    {nextTier && (
                      <ThemedText style={styles.rezProgressRight}>
                        {nextTierMin - score} pts to {nextTier.label}
                      </ThemedText>
                    )}
                  </View>
                  <View style={styles.rezTrendRow}>
                    <Ionicons
                      name={isUp ? 'trending-up' : isDown ? 'trending-down' : 'remove'}
                      size={14}
                      color={isUp ? colors.success : isDown ? colors.error : colors.gray[400]}
                    />
                    <ThemedText
                      style={[
                        styles.rezTrendText,
                        { color: isUp ? colors.success : isDown ? colors.error : colors.gray[400] },
                      ]}
                    >
                      {isUp ? '+' : ''}
                      {trendPoints} pts vs last month
                    </ThemedText>
                    <View style={{ flex: 1 }} />
                    <ThemedText style={styles.rezWhatIs}>What is REZ Score?</ThemedText>
                    <Ionicons name="chevron-forward" size={14} color={colors.gray[400]} />
                  </View>
                </Pressable>
              );
            })()}

          {/* Tier Benefits Card */}
          <Pressable
            style={styles.tierBenefitsCard}
            onPress={() => router.push('/tier-benefits')}
            accessibilityLabel="Tier Benefits"
            accessibilityRole="button"
          >
            <View style={styles.tierBenefitsContent}>
              <View style={styles.tierBenefitsIcon}>
                <Ionicons name="trophy-outline" size={22} color={colors.brand.purple} />
              </View>
              <View style={styles.tierBenefitsText}>
                <ThemedText style={styles.tierBenefitsTitle}>Tier Benefits</ThemedText>
                <ThemedText style={styles.tierBenefitsSub}>See what perks your tier unlocks</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.gray[400]} />
            </View>
          </Pressable>

          {/* REZ Premium Card */}
          <Pressable
            style={styles.premiumCard}
            onPress={() => router.push('/premium')}
            accessibilityLabel="REZ Premium"
            accessibilityRole="button"
          >
            <LinearGradient
              colors={['#0A1628', '#1A2E4A']}
              style={styles.premiumGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.premiumContent}>
                <View style={styles.premiumLeft}>
                  <View style={styles.premiumIconContainer}>
                    <Ionicons name="star" size={24} color="#FFD700" />
                  </View>
                  <View style={styles.premiumText}>
                    <ThemedText style={styles.premiumTitle}>REZ Premium</ThemedText>
                    <ThemedText style={styles.premiumSubtitle}>2x coins, no ads &amp; more</ThemedText>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#FFD700" />
              </View>
            </LinearGradient>
          </Pressable>

          {/* Transaction History Card */}
          <Pressable
            style={styles.transactionHistoryCard}
            onPress={() => router.push('/transaction-history')}
            accessibilityLabel="Transaction History"
            accessibilityRole="button"
          >
            <View style={styles.transactionHistoryContent}>
              <View style={styles.transactionHistoryLeft}>
                <View style={styles.transactionHistoryIcon}>
                  <Ionicons name="receipt-outline" size={22} color={PROFILE_COLORS.primary} />
                </View>
                <View style={styles.transactionHistoryText}>
                  <ThemedText style={styles.transactionHistoryTitle}>Transaction History</ThemedText>
                  <ThemedText style={styles.transactionHistorySub}>View all coin earn &amp; redeem activity</ThemedText>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.neutral[400]} />
            </View>
          </Pressable>

          {/* Partner Program Card */}
          <Pressable
            style={styles.partnerCard}
            onPress={() => router.push('/profile/partner')}
            accessibilityLabel="Partner Program"
            accessibilityRole="button"
          >
            <LinearGradient
              colors={[PROFILE_COLORS.gold, PROFILE_COLORS.goldDark]}
              style={styles.partnerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.partnerContent}>
                <View style={styles.partnerLeft}>
                  <View style={styles.partnerIconContainer}>
                    <Ionicons name="trophy" size={28} color={colors.nileBlue} />
                  </View>
                  <View style={styles.partnerText}>
                    <ThemedText style={styles.partnerTitle}>Partner Program</ThemedText>
                    <ThemedText style={styles.partnerSubtitle}>Unlock exclusive rewards & benefits</ThemedText>
                  </View>
                </View>
                <View style={styles.partnerRight}>
                  <View style={styles.partnerLevelBadge}>
                    <Ionicons name="star" size={12} color={PROFILE_COLORS.gold} />
                    <ThemedText style={styles.partnerLevelText}>Level 1</ThemedText>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.nileBlue} />
                </View>
              </View>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Location & Time Section */}
        <View style={styles.section}>
          <View style={styles.locationTimeContainer}>
            <LocationDisplay
              showCoordinates={true}
              showLastUpdated={true}
              showRefreshButton={true}
              style={styles.locationCard}
              onPress={handleLocationSettingsPress}
            />
            <TimeDisplay showDate={true} showTimezone={true} showTimeOfDay={true} style={styles.timeCard} />
          </View>
        </View>

        {/* Icon Grid Section */}
        <View style={styles.section}>
          <View style={styles.iconGrid}>{iconGridData.map(renderIconGridItem)}</View>
        </View>

        {/* Quick Access: Notifications Inbox + Nearby Map + Bill Simulator */}
        <View style={styles.section}>
          <Pressable
            style={styles.menuItem}
            onPress={() => router.push('/notifications')}
            accessibilityLabel="Notifications"
            accessibilityRole="button"
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIconContainer}>
                <Ionicons name="notifications-outline" size={22} color={PROFILE_COLORS.primary} />
              </View>
              <View style={styles.menuTextContainer}>
                <ThemedText style={styles.menuTitle}>Notifications</ThemedText>
                <ThemedText style={styles.menuDescription}>Your inbox — achievements, cashback & streaks</ThemedText>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={PROFILE_COLORS.textSecondary} />
          </Pressable>
          <Pressable
            style={styles.menuItem}
            onPress={() => router.push('/map')}
            accessibilityLabel="Nearby Map"
            accessibilityRole="button"
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIconContainer}>
                <Ionicons name="map-outline" size={22} color={PROFILE_COLORS.primary} />
              </View>
              <View style={styles.menuTextContainer}>
                <ThemedText style={styles.menuTitle}>Nearby Map</ThemedText>
                <ThemedText style={styles.menuDescription}>Find stores near you with cashback offers</ThemedText>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={PROFILE_COLORS.textSecondary} />
          </Pressable>
          <Pressable
            style={styles.menuItem}
            onPress={() => router.push('/bill-simulator')}
            accessibilityLabel="Bill Simulator"
            accessibilityRole="button"
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIconContainer}>
                <Ionicons name="calculator-outline" size={22} color={PROFILE_COLORS.primary} />
              </View>
              <View style={styles.menuTextContainer}>
                <ThemedText style={styles.menuTitle}>Bill Simulator</ThemedText>
                <ThemedText style={styles.menuDescription}>See how much you can save at nearby stores</ThemedText>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={PROFILE_COLORS.textSecondary} />
          </Pressable>
        </View>

        {/* Menu List Section */}
        <View style={styles.section}>
          <View style={styles.menuList}>{profileMenuListItems.map(renderMenuListItem)}</View>
        </View>

        {/* Stats Section */}
        <View style={styles.section}>
          <View style={styles.statsCard}>
            <View style={styles.statsHeader}>
              <ThemedText style={styles.statsTitle}>Your Activity</ThemedText>
              <Pressable
                onPress={() => router.push('/profile/activity')}
                style={styles.viewAllButton}
                accessibilityLabel="View all activity"
                accessibilityRole="button"
              >
                <ThemedText style={styles.viewAllText}>View All</ThemedText>
                <Ionicons name="chevron-forward" size={16} color={PROFILE_COLORS.primary} />
              </Pressable>
            </View>
            {statsLoading ? (
              <View style={{ height: 60, backgroundColor: colors.gray[300], borderRadius: 8, marginVertical: 8 }} />
            ) : statistics ? (
              <View style={styles.statsGrid}>
                <Pressable
                  style={styles.statItem}
                  onPress={() => router.push('/earnings-history')}
                  accessibilityRole="button"
                >
                  <ThemedText style={styles.statNumber}>{statistics.orders?.total || 0}</ThemedText>
                  <ThemedText style={styles.statLabel}>Orders</ThemedText>
                </Pressable>
                <Pressable
                  style={styles.statItem}
                  onPress={() => router.push('/wallet-screen')}
                  accessibilityRole="button"
                >
                  <ThemedText style={styles.statNumber}>
                    {currencySymbol}
                    {statistics.wallet?.totalSpent || 0}
                  </ThemedText>
                  <ThemedText style={styles.statLabel}>Spent</ThemedText>
                </Pressable>
                <Pressable
                  style={styles.statItem}
                  onPress={() => router.push('/profile/achievements')}
                  accessibilityRole="button"
                >
                  <ThemedText style={styles.statNumber}>
                    {statistics.achievements?.unlocked || 0}/{statistics.achievements?.total || 0}
                  </ThemedText>
                  <ThemedText style={styles.statLabel}>Badges</ThemedText>
                </Pressable>
                <View style={styles.statItem}>
                  <ThemedText style={styles.statNumber}>{statistics.reviews?.total || 0}</ThemedText>
                  <ThemedText style={styles.statLabel}>Reviews</ThemedText>
                </View>
              </View>
            ) : (
              <ThemedText style={styles.errorText}>{statsError || 'Unable to load stats'}</ThemedText>
            )}
          </View>
        </View>

        {/* Footer Space */}
        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.tint.coolGray },
  header: {
    paddingTop: Platform.OS === 'android' ? 50 : 52,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitleSection: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: 'white', marginBottom: 3, letterSpacing: 0.3 },
  headerSubtitle: { fontSize: 12, color: 'rgba(255, 255, 255, 0.75)', fontWeight: '500' },
  headerActions: { flexDirection: 'row', alignItems: 'center', marginLeft: Spacing.md, gap: Spacing.sm },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  content: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  section: { marginHorizontal: Spacing.md, marginBottom: Spacing.md },
  locationTimeContainer: { flexDirection: 'row', gap: 12 },
  locationCard: { flex: 1 },
  timeCard: { flex: 1 },
  userSection: { marginHorizontal: Spacing.md, marginTop: Spacing.xl, marginBottom: Spacing.md },
  userCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 20,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: PROFILE_COLORS.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 5,
  },
  avatarContainer: { marginRight: Spacing.lg, position: 'relative' },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: PROFILE_COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 3,
    borderColor: PROFILE_COLORS.gold,
    shadowColor: PROFILE_COLORS.gold,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 40 },
  avatarText: { fontSize: 28, fontWeight: '800', color: 'white' },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: PROFILE_COLORS.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 40,
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 20, fontWeight: '800', color: PROFILE_COLORS.primaryDark, marginBottom: 3, letterSpacing: 0.2 },
  userEmail: { fontSize: 13, color: PROFILE_COLORS.textSecondary, marginBottom: 10 },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.greenMist,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 4,
  },
  verifiedText: { fontSize: 12, fontWeight: '700', color: colors.brand.greenDark },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    borderWidth: 1,
    borderColor: PROFILE_COLORS.primary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 36,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  editProfileButtonText: { fontSize: 13, fontWeight: '700', color: PROFILE_COLORS.primary },
  identityBanner: { marginTop: Spacing.md },
  identityBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  identityIconCircle: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  identityTextContainer: { flex: 1 },
  identityTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  identitySubtitle: { fontSize: 12, color: colors.text.secondary },
  completionCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 18,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    shadowColor: PROFILE_COLORS.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: PROFILE_COLORS.primaryDark,
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  completionInfo: { flex: 1, marginRight: 14 },
  completionTitle: { fontSize: 15, fontWeight: '700', color: PROFILE_COLORS.primaryDark, marginBottom: 4 },
  completionMessage: { fontSize: 12, color: PROFILE_COLORS.textSecondary, lineHeight: 18 },
  completionPercentage: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: `${PROFILE_COLORS.primaryDark}10`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: { fontSize: 16, fontWeight: '800', color: PROFILE_COLORS.primaryDark },
  progressBarContainer: {
    height: 7,
    backgroundColor: colors.indigoMist,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: { height: '100%', borderRadius: 4 },
  missingFields: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  missingFieldsLabel: { fontSize: 12, color: PROFILE_COLORS.primaryDark, fontWeight: '600', flex: 1 },
  inviteFriendsCard: {
    marginTop: Spacing.md,
    borderRadius: 14,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: 'rgba(255,205,87,0.25)',
    shadowColor: colors.nileBlue,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  inviteFriendsContent: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  inviteFriendsIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255,205,87,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteFriendsText: { flex: 1 },
  inviteFriendsTitle: { fontSize: 14, fontWeight: '700', color: colors.nileBlue },
  inviteFriendsSub: { fontSize: 12, color: colors.midGray, marginTop: 2 },
  referralCard: {
    marginTop: Spacing.md,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: PROFILE_COLORS.primaryDark,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 7,
  },
  referralGradient: { padding: Spacing.lg },
  referralContent: { flexDirection: 'row', alignItems: 'center' },
  referralIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  referralText: { flex: 1 },
  referralTitle: { fontSize: 16, fontWeight: '800', color: 'white', marginBottom: 4 },
  referralSubtitle: { fontSize: 13, color: 'rgba(255, 255, 255, 0.85)' },
  loyaltyCard: {
    marginTop: Spacing.md,
    backgroundColor: colors.background.primary,
    borderRadius: 18,
    padding: Spacing.md,
    shadowColor: PROFILE_COLORS.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  loyaltyContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  loyaltyLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  loyaltyIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.tint.amberLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  loyaltyText: { flex: 1 },
  loyaltyPoints: { fontSize: 17, fontWeight: '800', color: PROFILE_COLORS.primaryDark, marginBottom: 2 },
  loyaltyLabel: { fontSize: 12, color: PROFILE_COLORS.textSecondary },
  loyaltyRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tint.amberLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  tierText: { fontSize: 12, fontWeight: '700', color: colors.brand.amberDark },
  rezScoreCard: {
    marginTop: Spacing.md,
    backgroundColor: colors.background.primary,
    borderRadius: 18,
    padding: Spacing.md,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  rezScoreHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  rezScoreTitle: { fontSize: 13, fontWeight: '700', color: colors.text.primary, marginBottom: 4 },
  rezTierBadge: { alignSelf: 'flex-start', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 10 },
  rezTierText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  rezScoreRight: { alignItems: 'flex-end' },
  rezScoreNumber: { fontSize: 36, fontWeight: '900', letterSpacing: -1, lineHeight: 40 },
  rezScoreOutOf: { fontSize: 12, color: colors.gray[400], fontWeight: '500', marginTop: -2 },
  rezProgressTrack: { height: 6, backgroundColor: colors.gray[200], borderRadius: 3, overflow: 'hidden' },
  rezProgressFill: { height: '100%', borderRadius: 3 },
  rezProgressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  rezProgressLeft: { fontSize: 10, color: colors.gray[500], fontWeight: '500' },
  rezProgressRight: { fontSize: 10, color: colors.gray[500], fontWeight: '500' },
  rezTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  rezTrendText: { fontSize: 11, fontWeight: '600' },
  rezWhatIs: { fontSize: 11, color: colors.gray[400], fontWeight: '500' },
  tierBenefitsCard: {
    marginTop: Spacing.sm,
    borderRadius: 14,
    backgroundColor: colors.tint.purpleLight,
    borderWidth: 1,
    borderColor: colors.brand.purpleSoft,
    overflow: 'hidden',
  },
  tierBenefitsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    gap: 12,
  },
  tierBenefitsIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierBenefitsText: { flex: 1 },
  tierBenefitsTitle: { fontSize: 14, fontWeight: '700', color: colors.brand.purpleDeep },
  tierBenefitsSub: { fontSize: 12, color: colors.brand.purple, marginTop: 2 },
  premiumCard: {
    marginTop: Spacing.md,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#0A1628',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  premiumGradient: { padding: Spacing.md },
  premiumContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  premiumLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  premiumIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  premiumText: { flex: 1 },
  premiumTitle: { fontSize: 16, fontWeight: '800', color: '#FFD700', marginBottom: 3 },
  premiumSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  transactionHistoryCard: {
    marginTop: Spacing.md,
    borderRadius: 14,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },
  transactionHistoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  transactionHistoryLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  transactionHistoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${PROFILE_COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  transactionHistoryText: { flex: 1 },
  transactionHistoryTitle: { fontSize: 14, fontWeight: '700', color: PROFILE_COLORS.primaryDark },
  transactionHistorySub: { fontSize: 12, color: colors.text.tertiary, marginTop: 2 },
  partnerCard: {
    marginTop: Spacing.md,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: PROFILE_COLORS.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 6,
  },
  partnerGradient: { padding: Spacing.md },
  partnerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  partnerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  partnerIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  partnerText: { flex: 1 },
  partnerTitle: { fontSize: 16, fontWeight: '800', color: colors.nileBlue, marginBottom: 3 },
  partnerSubtitle: { fontSize: 12, color: 'rgba(11, 34, 64, 0.75)' },
  partnerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  partnerLevelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  partnerLevelText: { fontSize: 12, fontWeight: '700', color: PROFILE_COLORS.goldDark },
  iconGrid: {
    backgroundColor: colors.background.primary,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: PROFILE_COLORS.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  iconGridItem: { alignItems: 'center', flex: 1, paddingHorizontal: 4 },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: PROFILE_COLORS.primaryDark,
    textAlign: 'center',
    marginBottom: 3,
  },
  iconCount: { fontSize: 13, fontWeight: '800', color: PROFILE_COLORS.primaryDark },
  menuList: {
    backgroundColor: colors.background.primary,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: PROFILE_COLORS.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.slateLight,
    minHeight: 64,
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  menuIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: `${PROFILE_COLORS.primaryDark}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  menuTextContainer: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: '600', color: PROFILE_COLORS.primaryDark },
  menuDescription: { fontSize: 12, color: PROFILE_COLORS.textSecondary, marginTop: 2 },
  menuItemRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  menuBadge: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4 },
  numericBadge: { backgroundColor: PROFILE_COLORS.primaryDark },
  newBadge: { backgroundColor: colors.brand.greenDark },
  menuBadgeText: { fontSize: 12, fontWeight: '700', color: 'white' },
  newBadgeText: { textTransform: 'uppercase', letterSpacing: 0.5 },
  statsCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 20,
    padding: Spacing.xl,
    shadowColor: PROFILE_COLORS.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  statsTitle: { fontSize: 16, fontWeight: '800', color: PROFILE_COLORS.primaryDark },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: `${PROFILE_COLORS.primaryDark}08`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  viewAllText: { fontSize: 13, fontWeight: '600', color: PROFILE_COLORS.primaryDark },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.xs,
    backgroundColor: colors.tint.coolGray,
    borderRadius: 14,
  },
  statNumber: { fontSize: 20, fontWeight: '800', color: PROFILE_COLORS.primaryDark, marginBottom: 4 },
  statLabel: {
    fontSize: 12,
    color: PROFILE_COLORS.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loadingText: { fontSize: 14, color: PROFILE_COLORS.textSecondary, textAlign: 'center', paddingVertical: 20 },
  errorText: { fontSize: 14, color: Colors.error, textAlign: 'center', paddingVertical: 20 },
  footer: { height: 100 },
});

export default ProfilePage;
