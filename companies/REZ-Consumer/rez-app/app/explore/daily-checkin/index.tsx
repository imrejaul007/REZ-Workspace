/**
 * Daily Check-In Page — index.tsx
 *
 * Lean composition layer. All state/logic in useCheckinState,
 * all UI sections in CheckinCalendar, CheckinStreak, CheckinRewards.
 *
 * @version 2.0.0 - refactored from monolithic daily-checkin.tsx
 */
import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import CachedImage from '@/components/ui/CachedImage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCheckinState } from '@/components/daily-checkin/useCheckinState';
import { CheckinCalendar } from '@/components/daily-checkin/CheckinCalendar';
import { CheckinStreak } from '@/components/daily-checkin/CheckinStreak';
import {
  AffiliateStatsSection,
  PostersGrid,
  SubmissionsList,
  StreakBonusesSection,
  ProTips,
} from '@/components/daily-checkin/CheckinRewards';

import { withErrorBoundary } from '@/utils/withErrorBoundary';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import { BRAND } from '@/constants/brand';
import { colors } from '@/constants/theme';

const { width } = Dimensions.get('window');

function DailyCheckInPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const postersYPosition = useRef(0);

  const state = useCheckinState();
  const {
    loading,
    refreshing,
    currencySymbol,
    checkInRewards,
    currentStreak,
    bestStreak,
    totalEarned,
    hasCheckedInToday,
    showReward,
    selectedPoster,
    calendarError,
    postersError,
    bonusesError,
    promotionalPosters,
    affiliateStats,
    streakBonuses,
    countdown,
    streakWasReset,
    freezeLoading,
    isStreakFrozen,
    proTips,
    affiliateTip,
    reviewTimeframe,
    showSubmitModal,
    submitUrl,
    selectedPlatform,
    submissions,
    submitting,
    checkInStarted,
    pendingCheckInReward,
    sharedPoster,
    todayReward,
    isNewAffiliate,
    rewardScaleAnim,
    rewardOpacityAnim,
    onRefresh,
    fetchCheckInData,
    handleCheckIn,
    handleSharePoster,
    handleSubmitPost,
    handleFreezeStreak,
    setSelectedPoster,
    setShowSubmitModal,
    setSubmitUrl,
    setSharedPoster,
    setSelectedPlatform,
  } = state;

  const rewardAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rewardScaleAnim.value }],
    opacity: rewardOpacityAnim.value,
  }));

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Ionicons name="calendar" size={20} color={Colors.info} />
          <Text style={styles.headerTitle}>Daily Check-In & Earn</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.info]} />}
      >
        {/* Stats Row */}
        <View style={styles.statsContainer}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: 'rgba(249, 115, 22, 0.1)', borderColor: 'rgba(249, 115, 22, 0.2)' },
            ]}
          >
            <Ionicons name="flame" size={20} color={colors.brand.orange} />
            <Text style={styles.statValue}>{currentStreak}</Text>
            <Text style={styles.statLabel}>Day streak</Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' },
            ]}
          >
            <CachedImage source={BRAND.COIN_IMAGE} style={styles.coinIcon20} contentFit="contain" />
            <Text style={styles.statValue}>
              {currencySymbol}
              {totalEarned}
            </Text>
            <Text style={styles.statLabel}>Total earned</Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.2)' },
            ]}
          >
            <Ionicons name="trending-up" size={20} color={colors.brand.purpleLight} />
            <Text style={styles.statValue}>{bestStreak}</Text>
            <Text style={styles.statLabel}>Best streak</Text>
          </View>
        </View>

        {/* Skeleton Loading */}
        {loading && (
          <View style={styles.skeletonContainer}>
            <View style={styles.skeletonSection}>
              <View style={styles.skeletonTitleBar} />
              <View style={styles.skeletonCalendarGrid}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <View key={i} style={styles.skeletonCalendarDay} />
                ))}
              </View>
              <View style={styles.skeletonBonusDay} />
            </View>
            <View style={[styles.skeletonBlock, styles.skeletonCheckInBtn]} />
            <View style={styles.skeletonSection}>
              <View style={styles.skeletonTitleBar} />
              <View style={styles.skeletonStatsRow}>
                {[1, 2, 3, 4].map((i) => (
                  <View key={i} style={[styles.skeletonBlock, styles.skeletonStatItem]} />
                ))}
              </View>
            </View>
            <View style={styles.skeletonSection}>
              <View style={styles.skeletonTitleBar} />
              <View style={styles.skeletonPostersRow}>
                {[1, 2].map((i) => (
                  <View key={i} style={[styles.skeletonBlock, styles.skeletonPosterItem]} />
                ))}
              </View>
            </View>
          </View>
        )}

        {!loading && (
          <>
            {/* Info Banner */}
            <View style={styles.infoBannerContainer}>
              <LinearGradient
                colors={checkInStarted ? [Colors.warning, colors.brand.orange] : [colors.nileBlue, colors.nileBlue]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.infoBanner}
              >
                <View style={styles.infoBannerHeader}>
                  <Ionicons name="gift" size={20} color={colors.text.inverse} />
                  <Text style={styles.infoBannerTitle}>
                    {checkInStarted ? 'Complete Your Check-In!' : 'How Daily Check-In Works!'}
                  </Text>
                </View>
                <Text style={styles.infoBannerText}>
                  {checkInStarted
                    ? `Share a promotional poster below and submit your post link to complete today's check-in and earn ${currencySymbol}${pendingCheckInReward?.coins} coins!`
                    : '1. Click "Check In Now" → 2. Share a promotional poster → 3. Submit your post link → 4. Earn coins + share bonus!'}
                </Text>
              </LinearGradient>
            </View>

            {/* Calendar Section */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Ionicons name="calendar" size={16} color={colors.text.primary} />
                <Text style={styles.sectionTitle}>Daily Check-In Calendar</Text>
              </View>
              <CheckinCalendar
                checkInRewards={checkInRewards}
                calendarError={calendarError}
                currencySymbol={currencySymbol}
                onRetry={fetchCheckInData}
              />
            </View>

            {/* Check-In Button + Streak Controls */}
            <CheckinStreak
              hasCheckedInToday={hasCheckedInToday}
              checkInStarted={checkInStarted}
              checkInLoading={false}
              currentStreak={currentStreak}
              isStreakFrozen={isStreakFrozen}
              freezeLoading={freezeLoading}
              streakWasReset={streakWasReset}
              countdown={countdown}
              todayReward={todayReward}
              pendingCheckInRewardCoins={pendingCheckInReward?.coins}
              currencySymbol={currencySymbol}
              onCheckIn={() => handleCheckIn(postersYPosition.current, scrollViewRef)}
              onFreezeStreak={handleFreezeStreak}
            />

            {/* Affiliate Stats */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Ionicons name="trending-up" size={16} color={colors.text.primary} />
                <Text style={styles.sectionTitle}>Your Affiliate Performance</Text>
              </View>
              <AffiliateStatsSection
                affiliateStats={affiliateStats}
                isNewAffiliate={isNewAffiliate}
                affiliateTip={affiliateTip}
                currencySymbol={currencySymbol}
              />
            </View>

            {/* Promotional Posters */}
            <View
              style={styles.sectionContainer}
              onLayout={(event) => {
                postersYPosition.current = event.nativeEvent.layout.y;
              }}
            >
              <View style={styles.sectionHeader}>
                <Ionicons name="share-social" size={16} color={colors.text.primary} />
                <Text style={styles.sectionTitle}>Share Promotional Posters</Text>
                {checkInStarted && (
                  <View style={styles.requiredBadge}>
                    <Text style={styles.requiredBadgeText}>Required</Text>
                  </View>
                )}
              </View>
              <PostersGrid
                promotionalPosters={promotionalPosters}
                postersError={postersError}
                checkInStarted={checkInStarted}
                currencySymbol={currencySymbol}
                onSelectPoster={setSelectedPoster}
                onRetry={fetchCheckInData}
              />
            </View>

            {/* Submission History */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Ionicons name="link" size={16} color={colors.text.primary} />
                <Text style={styles.sectionTitle}>Your Submissions</Text>
              </View>
              <SubmissionsList submissions={submissions} currencySymbol={currencySymbol} />
            </View>

            {/* Streak Bonuses */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Streak Bonuses</Text>
              <StreakBonusesSection
                streakBonuses={streakBonuses}
                bonusesError={bonusesError}
                currencySymbol={currencySymbol}
                onRetry={fetchCheckInData}
              />
            </View>

            {/* Pro Tips */}
            <ProTips proTips={proTips} />
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Reward Animation Modal */}
      <Modal visible={showReward} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={styles.rewardOverlay}>
          <Animated.View style={rewardAnimStyle}>
            <LinearGradient colors={[Colors.gold, colors.tealGreen]} style={styles.rewardCard}>
              <CachedImage source={BRAND.COIN_IMAGE} style={{ width: 64, height: 64 }} contentFit="contain" />
              <Text style={styles.rewardAmount}>
                +{currencySymbol}
                {pendingCheckInReward?.coins || todayReward?.coins}
              </Text>
              <Text style={styles.rewardText}>Check-in completed successfully!</Text>
              <Text style={styles.rewardSubtext}>
                Keep the streak going! Your post is under review for share bonus approval.
              </Text>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>

      {/* Share Poster Modal */}
      <Modal
        visible={!!selectedPoster}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedPoster(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedPoster(null)} />
          <View style={styles.modalContent}>
            {selectedPoster && (
              <>
                <LinearGradient colors={selectedPoster.colors} style={styles.modalPosterPreview}>
                  <CachedImage source={{ uri: selectedPoster.image }} style={styles.modalPosterImage} />
                  <View style={styles.modalPosterContentWrapper}>
                    <Text style={styles.modalPosterTitle}>{selectedPoster.title}</Text>
                    <Text style={styles.modalPosterSubtitle}>{selectedPoster.subtitle}</Text>
                  </View>
                </LinearGradient>
                <View style={styles.shareOptions}>
                  <Text style={styles.shareOptionsTitle}>Share on Social Media</Text>
                  <View style={styles.shareButtonsGrid}>
                    {[
                      { platform: 'whatsapp', label: 'WhatsApp', bg: '#25D366' },
                      { platform: 'facebook', label: 'Facebook', bg: '#1877F2' },
                      { platform: 'twitter', label: 'Twitter', bg: '#1DA1F2' },
                      { platform: 'instagram', label: 'Instagram', bg: '#833AB4' },
                    ].map(({ platform, label, bg }) => (
                      <Pressable
                        key={platform}
                        style={[styles.shareButton, { backgroundColor: bg }]}
                        onPress={() => handleSharePoster(selectedPoster, platform)}
                      >
                        <Text style={styles.shareButtonText}>{label}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={styles.shareBonusInfo}>
                    <Text style={styles.shareBonusText}>
                      +{currencySymbol}
                      {selectedPoster.shareBonus} bonus when you submit your post link for approval!
                    </Text>
                  </View>
                  <Pressable style={styles.closeButton} onPress={() => setSelectedPoster(null)}>
                    <Text style={styles.closeButtonText}>Close</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Submit Post URL Modal */}
      <Modal
        visible={showSubmitModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSubmitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowSubmitModal(false)} />
          <View style={styles.submitModalContent}>
            <View style={styles.submitModalHeader}>
              <View style={styles.submitModalIcon}>
                <Ionicons name="link" size={24} color={Colors.info} />
              </View>
              <View>
                <Text style={styles.submitModalTitle}>Submit Your Post</Text>
                <Text style={styles.submitModalSubtitle}>Paste the link to your shared post</Text>
              </View>
            </View>
            <Text style={styles.inputLabel}>Post URL</Text>
            <TextInput
              style={styles.urlInput}
              value={submitUrl}
              onChangeText={setSubmitUrl}
              placeholder={`https://${selectedPlatform}.com/your-post-link`}
              placeholderTextColor={colors.text.tertiary}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.submitTip}>
              <Text style={styles.submitTipText}>
                <Text style={{ fontWeight: '700' }}>How to get your post link:</Text>
                {'\n'}• WhatsApp/Facebook/Twitter: Click share button and copy link{'\n'}• Instagram: Go to your post →
                ··· → Share → Copy Link
              </Text>
            </View>
            <View style={styles.submitInfo}>
              <Text style={styles.submitInfoText}>
                Your post will be reviewed {reviewTimeframe}. You'll earn {currencySymbol}
                {sharedPoster?.shareBonus || 0} once approved!
              </Text>
            </View>
            <View style={styles.submitButtons}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => {
                  setShowSubmitModal(false);
                  setSubmitUrl('');
                  setSharedPoster(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.submitButton, submitting ? styles.submitButtonDisabled : null]}
                onPress={handleSubmitPost}
                disabled={submitting}
              >
                <LinearGradient
                  colors={
                    submitting ? [colors.text.tertiary, colors.text.tertiary] : [colors.nileBlue, colors.nileBlue]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitButtonGradient}
                >
                  {submitting ? (
                    <View style={styles.submitButtonLoading}>
                      <ActivityIndicator size="small" color={colors.text.inverse} />
                      <Text style={styles.submitButtonText}>Submitting...</Text>
                    </View>
                  ) : (
                    <Text style={styles.submitButtonText}>Submit for Review</Text>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.secondary,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xl,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerTitle: { ...Typography.h4, fontWeight: '700', color: colors.text.primary },
  headerSpacer: { width: 40 },
  scrollContent: { paddingBottom: 120 },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    gap: Spacing.md,
  },
  statCard: { flex: 1, padding: Spacing.md, borderRadius: BorderRadius.lg, borderWidth: 1, alignItems: 'center' },
  statValue: { ...Typography.h4, fontWeight: '700', color: colors.text.primary, marginTop: Spacing.xs },
  statLabel: { ...Typography.caption, color: colors.text.tertiary, marginTop: 2 },
  coinIcon20: { width: 20, height: 20 },
  infoBannerContainer: { paddingHorizontal: Spacing.base, marginBottom: Spacing.base },
  infoBanner: { padding: Spacing.base, borderRadius: BorderRadius.lg },
  infoBannerHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  infoBannerTitle: { ...Typography.body, fontWeight: '700', color: colors.text.inverse },
  infoBannerText: { ...Typography.bodySmall, color: 'rgba(255, 255, 255, 0.9)', lineHeight: 18 },
  sectionContainer: { paddingHorizontal: Spacing.base, marginBottom: Spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  sectionTitle: { ...Typography.body, fontWeight: '600', color: colors.text.primary },
  requiredBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    marginLeft: 'auto',
  },
  requiredBadgeText: { ...Typography.caption, fontWeight: '600', color: colors.warningScale[700] },
  // Skeleton styles
  skeletonContainer: { paddingHorizontal: Spacing.base },
  skeletonSection: { marginBottom: Spacing.lg },
  skeletonTitleBar: {
    width: 160,
    height: 16,
    backgroundColor: colors.border.default,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  skeletonCalendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  skeletonCalendarDay: {
    width: (width - 72) / 3,
    height: 70,
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.md,
  },
  skeletonBonusDay: {
    height: 50,
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  skeletonBlock: { backgroundColor: colors.background.secondary },
  skeletonCheckInBtn: { height: 48, borderRadius: BorderRadius['2xl'], marginBottom: Spacing.lg },
  skeletonStatsRow: { flexDirection: 'row', gap: Spacing.sm },
  skeletonStatItem: { flex: 1, height: 80, borderRadius: BorderRadius.md },
  skeletonPostersRow: { flexDirection: 'row', gap: Spacing.md },
  skeletonPosterItem: { flex: 1, height: 140, borderRadius: BorderRadius.lg },
  // Reward modal
  rewardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  rewardCard: { padding: Spacing['2xl'], borderRadius: BorderRadius['2xl'], alignItems: 'center', maxWidth: 320 },
  rewardAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.text.inverse,
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
  },
  rewardText: { ...Typography.h4, color: 'rgba(255, 255, 255, 0.9)', marginBottom: Spacing.sm },
  rewardSubtext: { ...Typography.body, color: 'rgba(255, 255, 255, 0.8)', textAlign: 'center', lineHeight: 20 },
  // Share poster modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    overflow: 'hidden',
  },
  modalPosterPreview: { height: 192, position: 'relative', justifyContent: 'center', padding: Spacing.xl },
  modalPosterImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.3 },
  modalPosterContentWrapper: { zIndex: 1 },
  modalPosterTitle: { ...Typography.h2, fontWeight: '700', color: colors.text.inverse, marginBottom: Spacing.sm },
  modalPosterSubtitle: { ...Typography.bodyLarge, color: 'rgba(255, 255, 255, 0.9)' },
  shareOptions: { padding: Spacing.xl },
  shareOptionsTitle: { ...Typography.body, fontWeight: '600', color: colors.text.primary, marginBottom: Spacing.md },
  shareButtonsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.base },
  shareButton: {
    width: (width - 48 - 12) / 2,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  shareButtonText: { ...Typography.body, fontWeight: '600', color: colors.text.inverse },
  shareBonusInfo: {
    padding: Spacing.md,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    marginBottom: Spacing.base,
  },
  shareBonusText: { ...Typography.bodySmall, color: colors.nileBlue, textAlign: 'center', fontWeight: '600' },
  closeButton: {
    paddingVertical: 14,
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  closeButtonText: { ...Typography.body, fontWeight: '600', color: colors.text.primary },
  // Submit modal
  submitModalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
  },
  submitModalHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  submitModalIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius['2xl'],
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitModalTitle: { ...Typography.h4, fontWeight: '700', color: colors.text.primary },
  submitModalSubtitle: { ...Typography.bodySmall, color: colors.text.tertiary },
  inputLabel: { ...Typography.body, fontWeight: '600', color: colors.text.primary, marginBottom: Spacing.sm },
  urlInput: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    ...Typography.body,
    color: colors.text.primary,
    marginBottom: Spacing.base,
  },
  submitTip: {
    padding: Spacing.md,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    marginBottom: Spacing.base,
  },
  submitTipText: { ...Typography.bodySmall, color: '#1E40AF', lineHeight: 18 },
  submitInfo: {
    padding: Spacing.md,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    marginBottom: Spacing.lg,
  },
  submitInfoText: { ...Typography.bodySmall, color: colors.brand.amberDeep, textAlign: 'center' },
  submitButtons: { flexDirection: 'row', gap: Spacing.md },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: colors.background.secondary,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  cancelButtonText: { ...Typography.body, fontWeight: '600', color: colors.text.primary },
  submitButton: { flex: 1, borderRadius: BorderRadius.md, overflow: 'hidden' },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonGradient: { paddingVertical: 14, alignItems: 'center' },
  submitButtonLoading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  submitButtonText: { ...Typography.body, fontWeight: '600', color: colors.text.inverse },
  bottomSpacer: { height: 120 },
});

export default withErrorBoundary(DailyCheckInPage, 'ExploreDailyCheckin');
