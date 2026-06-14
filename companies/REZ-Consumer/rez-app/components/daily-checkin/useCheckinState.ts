// @ts-nocheck
/**
 * useCheckinState — custom hook for daily check-in page logic
 *
 * Encapsulates all API calls, state management, and action handlers
 * for the daily check-in feature.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Share } from 'react-native';
import { useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import gamificationApi, {
  CheckInReward,
  StreakData,
  AffiliateStats,
  PromotionalPoster,
  ShareSubmission,
  StreakBonus,
} from '@/services/gamificationApi';
import { useGamification } from '@/contexts/GamificationContext';
import { useGetCurrencySymbol, useRefreshWallet } from '@/stores/selectors';
import { platformAlertSimple, platformAlertConfirm } from '@/utils/platformAlert';
import apiClient from '@/services/apiClient';
import { BRAND } from '@/constants/brand';

export function useCheckinState() {
  const { actions: gamificationActions } = useGamification();
  const getCurrencySymbol = useGetCurrencySymbol();
  const refreshWallet = useRefreshWallet();
  const currencySymbol = getCurrencySymbol();
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // API state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkInLoading, setCheckInLoading] = useState(false);

  const [checkInRewards, setCheckInRewards] = useState<CheckInReward[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [selectedPoster, setSelectedPoster] = useState<PromotionalPoster | null>(null);

  // Error states for API failures
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [postersError, setPostersError] = useState<string | null>(null);
  const [bonusesError, setBonusesError] = useState<string | null>(null);

  // Data fetched from API
  const [promotionalPosters, setPromotionalPosters] = useState<PromotionalPoster[]>([]);
  const [affiliateStats, setAffiliateStats] = useState<AffiliateStats>({
    totalShares: 0,
    appDownloads: 0,
    purchases: 0,
    commissionEarned: 0,
  });
  const [streakBonuses, setStreakBonuses] = useState<StreakBonus[]>([]);

  // Countdown timer for next check-in
  const [countdown, setCountdown] = useState('');
  const [streakWasReset, setStreakWasReset] = useState(false);

  // Streak freeze state
  const [freezeLoading, setFreezeLoading] = useState(false);
  const [isStreakFrozen, setIsStreakFrozen] = useState(false);

  // Check-in success animation values
  const rewardScaleAnim = useSharedValue(0.3);
  const rewardOpacityAnim = useSharedValue(0);

  // Countdown timer effect — ticks every second when checked in today
  useEffect(() => {
    if (!hasCheckedInToday) {
      setCountdown('');
      return;
    }

    const tick = () => {
      const now = new Date();
      const nextMidnight = new Date(now);
      nextMidnight.setUTCDate(nextMidnight.getUTCDate() + 1);
      nextMidnight.setUTCHours(0, 0, 0, 0);
      const diff = nextMidnight.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown('Available now!');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
      );
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [hasCheckedInToday]);

  const [proTips, setProTips] = useState<string[]>([
    'Check in at the same time daily to build a habit',
    'Share posters daily to maximize your affiliate earnings',
    'Track your affiliate performance to see which posters work best',
    'Missing even one day resets your streak to zero',
  ]);
  const [affiliateTip, setAffiliateTip] = useState(
    'Share posters → Friends download the app → Earn 100 coins/download + 5% commission on their first 3 purchases!',
  );
  const [reviewTimeframe, setReviewTimeframe] = useState('within 24 hours');

  // Fetch all check-in page data from APIs
  const fetchCheckInData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setCalendarError(null);
      setPostersError(null);
      setBonusesError(null);

      const streakResponse = await gamificationApi.getStreakStatus();

      if (!isMountedRef.current) return;

      const [
        calendarResponse,
        affiliateResponse,
        postersResponse,
        submissionsResponse,
        bonusesResponse,
        configResponse,
      ] = await Promise.all([
        gamificationApi.getWeeklyCalendar(streakResponse.data || undefined),
        gamificationApi.getAffiliateStats(),
        gamificationApi.getPromotionalPosters(),
        gamificationApi.getShareSubmissions(),
        gamificationApi.getStreakBonuses(),
        gamificationApi.getCheckinConfig(),
      ]);

      if (!isMountedRef.current) return;

      if (streakResponse.success && streakResponse.data) {
        const {
          currentStreak: streak,
          longestStreak,
          hasCheckedInToday: checkedIn,
          totalEarned: earned,
        } = streakResponse.data;
        if (longestStreak > 1 && streak <= 1 && !checkedIn) {
          setStreakWasReset(true);
        }
        setCurrentStreak(streak);
        setBestStreak(longestStreak);
        setHasCheckedInToday(checkedIn);
        setTotalEarned(earned);
      }

      if (calendarResponse.success && calendarResponse.data) {
        setCheckInRewards(calendarResponse.data);
        setCalendarError(null);
      } else {
        setCalendarError(calendarResponse.error || 'Unable to load check-in calendar');
      }

      if (affiliateResponse.success && affiliateResponse.data) {
        setAffiliateStats(affiliateResponse.data);
      }

      if (postersResponse.success && postersResponse.data) {
        setPromotionalPosters(postersResponse.data);
        setPostersError(null);
      } else if (!postersResponse.success) {
        setPostersError(postersResponse.error || 'Unable to load promotional posters');
      }

      if (submissionsResponse.success && submissionsResponse.data) {
        setSubmissions(submissionsResponse.data);
      }

      if (bonusesResponse.success && bonusesResponse.data) {
        setStreakBonuses(bonusesResponse.data);
        setBonusesError(null);
      } else {
        setBonusesError(bonusesResponse.error || 'Unable to load streak bonuses');
      }

      if (configResponse.success && configResponse.data) {
        if (configResponse.data.proTips?.length > 0) {
          setProTips(configResponse.data.proTips);
        }
        if (configResponse.data.affiliateTip) {
          setAffiliateTip(configResponse.data.affiliateTip);
        }
        if (configResponse.data.reviewTimeframe) {
          setReviewTimeframe(configResponse.data.reviewTimeframe);
        }
      }
    } catch (error) {
      if (!isMountedRef.current) return;
      setCalendarError('Network error. Please try again.');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchCheckInData();
  }, [fetchCheckInData]);

  const onRefresh = useCallback(() => {
    fetchCheckInData(true);
  }, [fetchCheckInData]);

  // Submission workflow states
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitUrl, setSubmitUrl] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [submissions, setSubmissions] = useState<ShareSubmission[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [checkInStarted, setCheckInStarted] = useState(false);
  const [pendingCheckInReward, setPendingCheckInReward] = useState<CheckInReward | null>(null);
  const [sharedPoster, setSharedPoster] = useState<PromotionalPoster | null>(null);

  // Streak freeze handler
  const handleFreezeStreak = () => {
    const FREEZE_COST = 50;
    platformAlertConfirm(
      'Freeze Streak',
      `Spend ${FREEZE_COST} ${BRAND.CURRENCY_CODE} to freeze your streak for 1 day? Your streak won't reset if you miss tomorrow's check-in.`,
      async () => {
        setFreezeLoading(true);
        try {
          const response = await apiClient.post<unknown>('/streak/freeze', {
            type: 'daily_checkin',
            days: 1,
          });
          if (response.success) {
            setIsStreakFrozen(true);
            platformAlertSimple(
              'Streak Frozen!',
              'Your streak is protected for 1 day. You can still check in as usual.',
            );
          } else {
            platformAlertSimple('Failed', response.error || 'Could not freeze streak. Please try again.');
          }
        } catch (error) {
          platformAlertSimple('Error', error.message || 'Something went wrong. Please try again.');
        } finally {
          setFreezeLoading(false);
        }
      },
      'Freeze',
      'Cancel',
    );
  };

  // Check-in success animation trigger
  const triggerRewardAnimation = () => {
    rewardScaleAnim.value = 0.3;
    rewardOpacityAnim.value = 0;
    rewardScaleAnim.value = withSpring(1, { damping: 4, stiffness: 60 });
    rewardOpacityAnim.value = withTiming(1, { duration: 300 });
  };

  const handleCheckIn = async (postersYPosition: number, scrollRef: React.RefObject<unknown>) => {
    if (hasCheckedInToday || checkInLoading) return;

    const todayReward = checkInRewards.find((r) => r.today);
    if (todayReward && !todayReward.claimed) {
      setCheckInStarted(true);
      setPendingCheckInReward(todayReward);
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: postersYPosition, animated: true });
      }, 100);
    }
  };

  const completeCheckIn = async () => {
    if (pendingCheckInReward) {
      try {
        setCheckInLoading(true);
        const response = await gamificationApi.performCheckIn();

        if (response.success && response.data) {
          setShowReward(true);
          triggerRewardAnimation();
          setCurrentStreak(response.data!.streak);
          setTotalEarned((prev) => prev + response.data!.totalEarned);
          setHasCheckedInToday(true);

          setCheckInRewards((prev) =>
            prev.map((r) => (r.day === pendingCheckInReward.day ? { ...r, claimed: true } : r)),
          );

          await refreshWallet();
          await gamificationActions.syncCoinsFromWallet();

          setTimeout(() => {
            setShowReward(false);
          }, 3000);
        } else {
          platformAlertSimple('Check-in Failed', response.error || 'Please try again later');
        }
      } catch (error) {
        platformAlertSimple('Error', error.message || 'Something went wrong');
      } finally {
        setCheckInLoading(false);
        setCheckInStarted(false);
        setPendingCheckInReward(null);
      }
    }
  };

  const handleSharePoster = async (poster: PromotionalPoster, platform: string) => {
    const affiliateCode = `REZ${Date.now().toString(36)}`;
    const shareUrl = `https://rez.app?ref=${affiliateCode}`;
    const shareText = `${poster.title} - ${poster.subtitle}! Download ${BRAND.APP_NAME} app and get amazing deals. Use my code: ${affiliateCode}`;

    try {
      if (platform === 'instagram') {
        platformAlertSimple('Link Copied!', 'Paste it in your Instagram story or post.');
      }

      await Share.share({
        message: shareText + ' ' + shareUrl,
        title: poster.title,
      });

      setSharedPoster(poster);
      setSelectedPlatform(platform);
      setSelectedPoster(null);
      setShowSubmitModal(true);
    } catch (error) {
      // Dismissed by user
    }
  };

  const handleSubmitPost = async () => {
    if (!submitUrl.trim()) {
      platformAlertSimple('Error', 'Please enter the URL of your shared post');
      return;
    }

    try {
      new URL(submitUrl);
    } catch {
      platformAlertSimple('Error', 'Please enter a valid URL');
      return;
    }

    setSubmitting(true);

    try {
      const response = await gamificationApi.submitSharePost({
        posterId: sharedPoster?.id || '',
        posterTitle: sharedPoster?.title || 'Promotional Poster',
        postUrl: submitUrl,
        platform: selectedPlatform,
        shareBonus: sharedPoster?.shareBonus || 0,
      });

      if (response.success && response.data) {
        setSubmissions((prev) => [response.data!, ...prev]);
        setAffiliateStats((prev) => ({
          ...prev,
          totalShares: prev.totalShares + 1,
        }));

        setShowSubmitModal(false);
        setSubmitUrl('');
        setSelectedPlatform('');
        setSharedPoster(null);

        if (checkInStarted) {
          await completeCheckIn();
        }

        platformAlertSimple(
          'Success!',
          'Your post has been submitted for review! Check-in completed! You will receive share bonus coins once approved.',
        );
      } else {
        platformAlertSimple('Submission Failed', response.error || 'Please try again later');
      }
    } catch (error) {
      platformAlertSimple('Error', error.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const todayReward = checkInRewards.find((r) => r.today);
  const isNewAffiliate =
    affiliateStats.totalShares === 0 &&
    affiliateStats.appDownloads === 0 &&
    affiliateStats.purchases === 0 &&
    affiliateStats.commissionEarned === 0;

  return {
    // State
    loading,
    refreshing,
    checkInLoading,
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
    currencySymbol,
    // Animation values
    rewardScaleAnim,
    rewardOpacityAnim,
    // Actions
    onRefresh,
    fetchCheckInData,
    handleCheckIn,
    completeCheckIn,
    handleSharePoster,
    handleSubmitPost,
    handleFreezeStreak,
    setSelectedPoster,
    setShowSubmitModal,
    setSubmitUrl,
    setSelectedPlatform,
    setSharedPoster,
  };
}
