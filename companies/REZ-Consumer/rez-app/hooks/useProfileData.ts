/**
 * `useProfileData` — all state, side effects, and computed data for the profile page.
 * Extracted from `app/profile/index.tsx` (was 2,161 lines) to comply with the
 * 500-line-per-file architecture rule.
 *
 * Responsibilities:
 * - Live user profile data (API fetch + merge with context)
 * - Referral stats
 * - Profile refresh (on mount + on focus)
 * - REZ tier thresholds and helpers
 * - Computed icon grid data
 * - Image upload and share handlers
 *
 * The component only renders JSX with data from this hook.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useFocusEffect } from 'expo-router';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '@/services/authApi';
import { getReferralStats } from '@/services/referralApi';
import { uploadProfileImage } from '@/services/imageUploadService';
import { ShareService } from '@/services/shareService';
import { platformAlertSimple } from '@/utils/platformAlert';
import { getImagePicker } from '@/utils/lazyImports';
import {
  useIsAuthenticated,
  useAuthLoading,
  useAuthActions,
  useRezBalance,
  useRefreshWallet,
  useGetCurrencySymbol,
} from '@/stores/selectors';
import { useProfile } from '@/contexts/ProfileContext';
import { useUserStatistics } from '@/hooks/useUserStatistics';
import { useUserIdentityStore } from '@/stores/userIdentityStore';
import { useIsMounted } from '@/hooks/useIsMounted';
import type { ProfileIconGridItem } from '@/types/profile.types';
import { profileIconGridItems } from '@/data/profileData';
import type { UseQueryResult } from '@tanstack/react-query';

// Need this import for the RezScore query
import { useQuery } from '@tanstack/react-query';
type GetScoreFn = typeof import('@/services/rezScoreApi')['getScore'];

export interface ProfileUser {
  id?: string;
  name: string;
  email: string;
  avatar?: string | null;
  initials: string;
  isVerified?: boolean;
  bio?: string;
}

export interface UseProfileDataReturn {
  // User data
  user: ProfileUser | null;
  liveUserData: {
    name: string;
    email: string;
    avatar?: string | null;
    initials: string;
  } | null;
  profileCompletion: number;
  completionStatus: ReturnType<typeof useProfile>['completionStatus'];
  refreshCompletionStatus: ReturnType<typeof useProfile>['refreshCompletionStatus'];
  // Auth
  isAuthenticated: boolean;
  authLoading: boolean;
  authActions: ReturnType<typeof useAuthActions>;
  // Wallet
  userPoints: ReturnType<typeof useRezBalance>;
  refreshWallet: ReturnType<typeof useRefreshWallet>;
  currencySymbol: string;
  // Identity
  identitySegment: string;
  verificationSegment: string;
  instituteName: string;
  companyName: string;
  // Statistics
  statistics: ReturnType<typeof useUserStatistics>['statistics'];
  statsLoading: ReturnType<typeof useUserStatistics>['isLoading'];
  statsError: ReturnType<typeof useUserStatistics>['error'];
  refetchStats: ReturnType<typeof useUserStatistics>['refetch'];
  // Referral
  referralCount: number | null;
  // REZ Score
  rezScoreData: UseQueryResult<Awaited<ReturnType<GetScoreFn>>>['data'];
  // Local state
  refreshing: boolean;
  uploadingImage: boolean;
  setRefreshing: React.Dispatch<React.SetStateAction<boolean>>;
  setUploadingImage: React.Dispatch<React.SetStateAction<boolean>>;
  // Handlers
  onRefresh: () => Promise<void>;
  handleImageUpload: () => Promise<void>;
  handleShareProfile: () => Promise<void>;
  // Computed
  iconGridData: ProfileIconGridItem[];
  REZ_TIER_THRESHOLDS: readonly { min: number; max: number; label: string; color: string; bg: string }[];
  getRezTier: (score: number) => { min: number; max: number; label: string; color: string; bg: string };
  getCompletionMessage: (percentage: number) => string;
  getMissingFields: () => string[];
  // Router
  router: ReturnType<typeof useRouter>;
}

export const useProfileData = (): UseProfileDataReturn => {
  const router = useRouter();
  const { user: contextUser, completionStatus, refreshCompletionStatus } = useProfile();
  const isAuthenticated = useIsAuthenticated();
  const authLoading = useAuthLoading();
  const authActions = useAuthActions();
  const { statistics, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useUserStatistics(true);
  const userPoints = useRezBalance();
  const refreshWallet = useRefreshWallet();
  const getCurrencySymbol = useGetCurrencySymbol();
  const currencySymbol = getCurrencySymbol();
  const { segment: identitySegment, verificationSegment, instituteName, companyName } = useUserIdentityStore();
  const isMounted = useIsMounted();

  // REZ Score query
  const { data: rezScoreData } = useQuery({ queryKey: ['rez-score'], queryFn: () => import('@/services/rezScoreApi').then(m => m.getScore()), enabled: isAuthenticated && !authLoading, staleTime: 5 * 60_000 });

  // ── Live user data ────────────────────────────────────────────────────────

  const [liveUserData, setLiveUserData] = useState<{
    name: string; email: string; avatar?: string | null; initials: string;
  } | null>(null);

  const fetchLiveProfile = useCallback(() => {
    let cancelled = false;
    authService.getProfile().then((res) => {
      if (cancelled || !res.success || !res.data) return;
      const d = res.data as unknown as Record<string, unknown>;
      const fn = (d.profile as Record<string, string> | undefined)?.firstName || '';
      const ln = (d.profile as Record<string, string> | undefined)?.lastName || '';
      const name = fn && ln ? `${fn} ${ln}` : fn || (d.name as string) || (d.email as string)?.split('@')[0] || '';
      setLiveUserData({
        name,
        email: (d.email as string) || '',
        avatar: (d.profile as Record<string, string> | undefined)?.avatar,
        initials: fn ? (fn.charAt(0) + (ln?.charAt(0) || '')).toUpperCase() : 'U',
      });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { return fetchLiveProfile(); }, [fetchLiveProfile]);

  useFocusEffect(useCallback(() => { return fetchLiveProfile(); }, [fetchLiveProfile]));

  // Merge live API data over context user
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const user: ProfileUser | null = contextUser
    ? {
        ...contextUser,
        name: liveUserData?.name || contextUser.name,
        email: liveUserData?.email || contextUser.email,
        avatar: liveUserData?.avatar !== undefined ? liveUserData.avatar : contextUser.avatar,
        initials: liveUserData?.initials || contextUser.initials,
      }
    : null;

  // ── Referral ─────────────────────────────────────────────────────────────

  const [referralCount, setReferralCount] = useState<number | null>(null);
  useEffect(() => {
    if (!isAuthenticated || authLoading) return;
    let cancelled = false;
    getReferralStats().then((stats) => { if (!cancelled && stats) setReferralCount(stats.totalReferrals); }).catch(() => {});
    return () => { cancelled = true; };
  }, [isAuthenticated, authLoading]);

  // ── Local state ──────────────────────────────────────────────────────────

  const [refreshing, setRefreshing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // ── Refresh ──────────────────────────────────────────────────────────────

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await AsyncStorage.removeItem('user_statistics_cache');
      await Promise.allSettled([
        refreshWallet(),
        authActions.checkAuthStatus(),
        refetchStats(),
        refreshCompletionStatus(),
        getReferralStats().then((stats) => { if (stats) setReferralCount(stats.totalReferrals); }),
      ]);
    } catch { /* silently handle */ }
    finally { if (!isMounted()) return; setRefreshing(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authActions, refetchStats, refreshWallet, refreshCompletionStatus]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleImageUpload = useCallback(async () => {
    try {
      const ImagePicker = await getImagePicker();
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { platformAlertSimple('Permission Required', 'Please allow access to your photo library to upload a profile picture.'); return; }
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      if (!result.canceled && result.assets?.[0]) {
        if (!isMounted()) return;
        setUploadingImage(true);
        const uploadResult = await uploadProfileImage(result.assets![0].uri);
        if (uploadResult.success) { await authActions.checkAuthStatus(); platformAlertSimple('Success', 'Profile picture updated successfully!'); }
        else { platformAlertSimple('Upload Failed', uploadResult.error || 'Failed to upload image'); }
      }
    } catch (error) {
      platformAlertSimple('Error', error instanceof Error ? error.message : 'An error occurred while uploading the image');
    } finally { if (!isMounted()) return; setUploadingImage(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleShareProfile = useCallback(async () => {
    if (!user) return;
    const result = await ShareService.shareProfile({ userId: user.id || 'user', userName: user.name || 'User', userBio: user.bio });
    if (result.error && result.action !== 'dismissed') platformAlertSimple('Error', result.error);
  }, [user]);

  // ── REZ tier config ─────────────────────────────────────────────────────

  const REZ_TIER_THRESHOLDS = [
    { min: 801, max: 999, label: 'REZ Elite', color: '#B8860B', bg: 'rgba(255,200,87,0.15)' },
    { min: 601, max: 800, label: 'Power Saver', color: '#2563EB', bg: 'rgba(37,99,235,0.10)' },
    { min: 401, max: 600, label: 'Smart Saver', color: '#16A34A', bg: 'rgba(22,163,74,0.10)' },
    { min: 201, max: 400, label: 'Regular', color: '#6B7280', bg: 'rgba(107,114,128,0.10)' },
    { min: 0, max: 200, label: 'Starter', color: '#9CA3AF', bg: 'rgba(156,163,175,0.10)' },
  ] as const;

  const getRezTier = useCallback((score: number) => {
    for (const t of REZ_TIER_THRESHOLDS) { if (score >= t.min && score <= t.max) return t; }
    return REZ_TIER_THRESHOLDS[REZ_TIER_THRESHOLDS.length - 1];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Computed ─────────────────────────────────────────────────────────────

  const profileCompletion = completionStatus?.completionPercentage ?? 0;

  const getCompletionMessage = useCallback((percentage: number): string => {
    if (percentage === 100) return 'Your profile is complete!';
    if (percentage >= 80) return 'Almost there! Complete your profile';
    if (percentage >= 60) return 'Good progress! Add more details';
    if (percentage >= 40) return 'Keep going! Fill in more info';
    return 'Complete your profile to unlock features';
  }, []);

  const getMissingFields = useCallback((): string[] => {
    if (!completionStatus?.missingFields?.length) return [];
    const fieldLabels: Record<string, string> = { firstName: 'Name', email: 'Email', phone: 'Phone', avatar: 'Profile Picture', dateOfBirth: 'Date of Birth', gender: 'Gender', address: 'Address', bio: 'Bio', website: 'Website' };
    return completionStatus.missingFields.map((field) => fieldLabels[field] || field).slice(0, 3);
  }, [completionStatus]);

  const iconGridData = useMemo(() => {
    if (!statistics) return profileIconGridItems;
    return [
      { ...profileIconGridItems[0], count: statistics.orders?.total || 0 },
      { ...profileIconGridItems[1], count: statistics.projects?.totalParticipated || 0 },
      { ...profileIconGridItems[2], count: statistics.vouchers?.active || 0 },
      { ...profileIconGridItems[3], count: Math.round(statistics.wallet?.totalEarned || 0) },
    ];
  }, [statistics]);

  return {
    user, liveUserData, profileCompletion, completionStatus, refreshCompletionStatus,
    isAuthenticated, authLoading, authActions,
    userPoints, refreshWallet, currencySymbol,
    identitySegment, verificationSegment, instituteName, companyName,
    statistics, statsLoading, statsError, refetchStats,
    referralCount,
    rezScoreData,
    refreshing, uploadingImage, setRefreshing, setUploadingImage,
    onRefresh, handleImageUpload, handleShareProfile,
    iconGridData,
    REZ_TIER_THRESHOLDS, getRezTier,
    getCompletionMessage, getMissingFields,
    router,
  };
};
