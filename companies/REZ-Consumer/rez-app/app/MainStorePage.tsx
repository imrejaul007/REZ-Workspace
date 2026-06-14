// @ts-nocheck
import { colors } from '@/constants/theme';
import logger from '@/utils/logger';
// MainStorePage.tsx - Orchestrator component for store page
// All data fetching & state management lives in useMainStorePageData hook.
// All section rendering is delegated to extracted components.
import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import {
  Platform,
  RefreshControl,
  StatusBar,
  Text,
  Pressable,
  View,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolate } from 'react-native-reanimated';
import { useRouter, Href } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import {
  MainStoreHeader,
  ProductDisplay,
  TabNavigation,
  CashbackHeroCard,
  StoreQuickInfoCard,
  StoreActionButtons as NewStoreActionButtons,
  UserLoyaltyCard,
  PaymentMethodsCard,
  StoreBottomActionBar,
} from './MainStoreSection';
import MerchantLoyaltyCard from '@/components/gamification/MerchantLoyaltyCard';
import { TierName } from '@/components/gamification/VisitProgressBar';
import { MainStorePageProps } from '@/types/mainstore';
import { StoreHeaderSkeleton, ProductGridSkeleton, PromotionBannerSkeleton } from '@/components/skeletons';
import { Colors, Spacing } from '@/constants/DesignSystem';
import { spacing } from '@/constants/theme';
import { createStyles } from '@/utils/MainStorePage.styles';
import { withErrorBoundary } from '@/utils/withErrorBoundary';

// Extracted section components
import StoreInfoHeader from '@/components/store/StoreInfoHeader';
import BookTableCard from '@/components/store/BookTableCard';
import StoreOffersBuilder from '@/components/store/StoreOffersBuilder';
import ReviewsTabContent from '@/components/store/ReviewsTabContent';
import AboutTabContent from '@/components/store/AboutTabContent';
import MenuTabContent from '@/components/store/MenuTabContent';
import PhotosTabContent from '@/components/store/PhotosTabContent';
import AlwaysVisibleSections from '@/components/store/AlwaysVisibleSections';
import StoreModals, { buildAboutModalData } from '@/components/store/StoreModals';

// Custom hook for all data/state/handlers
import { useMainStorePageData, DynamicStoreData, LocationData } from '@/hooks/useMainStorePageData';
import apiClient from '@/services/apiClient';

function MainStorePage({ productId, initialProduct }: MainStorePageProps = {}) {
  const router = useRouter();
  const d = useMainStorePageData({ productId, initialProduct });

  // Upcoming coin drops state
  const [upcomingDrop, setUpcomingDrop] = useState<unknown>(null);
  const [activeCampaigns, setActiveCampaigns] = useState<unknown[]>([]);

  // Responsive layout
  const isWeb = Platform.OS === 'web';
  const isDesktop = d.screenData.width >= 1024;
  const HORIZONTAL_PADDING = (() => {
    if (d.screenData.width < 375) return 12;
    if (d.screenData.width < 768) return 16;
    if (d.screenData.width < 1024) return 24;
    if (d.screenData.width < 1440) return 32;
    return Math.max(32, (d.screenData.width - 1200) / 2);
  })();
  const MAX_CONTENT_WIDTH = isDesktop ? 1200 : undefined;

  // Scroll view ref for programmatic scrolling (e.g. jump-to-menu)
  const scrollViewRef = useRef<unknown>(null);

  // CA-DSC-050 FIX: Close all modals on unmount to prevent state leaks
  useEffect(() => {
    return () => {
      if (d.showAboutModal) d.handleCloseAboutModal();
      if (d.showDealsModal) d.handleCloseDealsModal();
      if (d.showReviewModal) d.handleCloseReviewModal();
    };
  }, [d]);

  // ── Food ordering handlers ────────────────────────────────────
  const handleOrderFood = useCallback(() => {
    // Switch to the menu tab and scroll to top
    d.handleTabChange('menu');
    // CA-DSC-039 FIX: Add null check and error handling to scrollViewRef usage
    if (scrollViewRef.current) {
      try {
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
      } catch (e) {
        logger.warn('[MainStore] Failed to scroll:', { error: e });
      }
    }
  }, [d]);

  const handleBookTable = useCallback(() => {
    router.push(
      `/MainCategory/food-dining/book-table?storeId=${d.currentStoreId}&storeName=${encodeURIComponent(d.currentStoreName || '')}`,
    );
  }, [router, d.currentStoreId, d.currentStoreName]);

  const handleCallStore = useCallback(() => {
    const phone = (d.storeData as DynamicStoreData)?.contact?.phone || (d.storeData as DynamicStoreData)?.phone;
    if (phone) {
      Linking.openURL(`tel:${phone}`).catch((err) => {
        logger.debug('Phone call failed', { error: err?.message }, 'MainStore');
      });
    }
  }, [d.storeData]);

  // Sticky tab navigation state
  const scrollY = useSharedValue(0);
  const [showStickyTabs, setShowStickyTabs] = useState(false);
  const stickyHeaderAnim = useSharedValue(0);
  const tabsContainerRef = useRef<View>(null);
  const tabsPositionY = useRef(0);
  const tabsPositionMeasured = useRef(false);

  useEffect(() => {
    stickyHeaderAnim.value = withTiming(showStickyTabs ? 1 : 0, { duration: 200 });
  }, [showStickyTabs, stickyHeaderAnim]);

  // Measure tabs position after page loads
  useEffect(() => {
    if (!d.pageLoading) {
      const timer = setTimeout(() => {
        if (tabsContainerRef.current && (tabsContainerRef.current as View).measure) {
          (tabsContainerRef.current as View).measure((_x: number, y: number, _w: number, height: number) => {
            tabsPositionY.current = y + height;
            tabsPositionMeasured.current = true;
          });
        } else {
          tabsPositionY.current = 550;
          tabsPositionMeasured.current = true;
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [d.pageLoading]);

  // Reset sticky tabs on refresh
  useEffect(() => {
    if (d.refreshing) {
      setShowStickyTabs(false);
      tabsPositionMeasured.current = false;
    }
  }, [d.refreshing]);

  // CA-DSC-006 FIX: Use AbortController to cancel in-flight requests on unmount
  // PACKETSENSE FIX-1: Batch fetch upcoming coin drops + active campaigns in a single round trip.
  // Replaced two sequential useEffect API calls with one /page-extras call whose two DB
  // queries run in parallel on the backend (Promise.allSettled).
  useEffect(() => {
    if (!d.currentStoreId) return;
    let cancelled = false;
    const abortController = new AbortController();
    apiClient
      .get<{ data?: { upcomingDrop?: unknown; activeCampaigns?: unknown[] } }>(
        `/stores/${d.currentStoreId}/page-extras`,
        undefined,
        { signal: abortController.signal },
      )
      .then((res) => {
        if (cancelled) return;
        const payload = res.data?.data;
        if (payload?.upcomingDrop) setUpcomingDrop(payload.upcomingDrop);
        if (Array.isArray(payload?.activeCampaigns)) setActiveCampaigns(payload.activeCampaigns);
      })
      .catch((err) => {
        logger.debug('Active campaigns fetch failed', { error: err?.message }, 'MainStore');
      });
    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [d.currentStoreId]);

  // Cleanup modals on component unmount to prevent state leaks
  useEffect(() => {
    return () => {
      if (d.showAboutModal) {
        d.handleCloseAboutModal?.();
      }
      if (d.showDealsModal) {
        d.handleCloseDealsModal?.();
      }
      if (d.showReviewModal) {
        d.handleCloseReviewModal?.();
      }
      if (d.showWriteReviewModal) {
        d.handleCloseWriteReviewModal?.();
      }
    };
  }, []);

  const styles = useMemo(() => createStyles(HORIZONTAL_PADDING, d.screenData), [HORIZONTAL_PADDING, d.screenData]);

  // CA-DSC-020 FIX: Memoize conditional style array to prevent unnecessary re-renders
  const contentContainerStyle = useMemo(
    () => [styles.scrollContent, isWeb ? styles.webScrollContent : null],
    [styles.scrollContent, styles.webScrollContent, isWeb],
  );

  // Helper function to format time until coin drop
  const getTimeUntil = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m} minutes`;
  };

  // About modal data (memoized) - CA-DSC-026 FIX: Add guard for missing fields
  const aboutModalData = useMemo(() => {
    const data = buildAboutModalData(
      d.storeData,
      d.fullStoreDataRef.current,
      d.fetchedStoreData,
      d.productData,
      d.isDynamic,
    );
    // Ensure all required fields are present
    return {
      ...data,
      storeName: data?.storeName || '',
      description: data?.description || '',
      hours: data?.hours || [],
      contact: data?.contact || {},
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d.storeData, d.fetchedStoreData, d.productData, d.isDynamic]);

  // Sticky header animated style
  const stickyHeaderAnimStyle = useAnimatedStyle(() => ({
    opacity: stickyHeaderAnim.value,
    transform: [{ translateY: interpolate(stickyHeaderAnim.value, [0, 1], [-20, 0]) }],
  }));

  // Shared tab navigation props
  const tabNavProps = {
    activeTab: d.activeTab,
    onTabChange: d.handleTabChange,
    menuTabLabel: d.menuTabLabel,
    maxSavingsPercent:
      typeof d.storeData?.cashback === 'number'
        ? d.storeData.cashback
        : typeof d.storeData?.discount === 'number'
          ? d.storeData.discount
          : undefined,
    reviewCount: d.totalReviewCount,
    photoCount: (d.storeData as DynamicStoreData)?.photoCount,
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['left', 'right', 'top']}>
      {/* SOFIA: SafeAreaView prevents content from hiding behind notch and dynamic island */}
      <ThemedView style={styles.page}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />

        <MainStoreHeader
          storeName={d.currentStoreName || ''}
          storeCategory={d.storeData?.category || d.productData.category || 'Store'}
          onBack={d.handleBackPress}
          onFavoritePress={d.handleFavoritePress}
          isFavorited={d.isFavorited}
          userCoins={d.userCoins}
          storeId={d.currentStoreId}
        />

        <Animated.ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
            const y = event.nativeEvent.contentOffset.y;
            scrollY.value = y;
            setShowStickyTabs(tabsPositionMeasured.current && y > tabsPositionY.current);
          }}
          contentContainerStyle={contentContainerStyle}
          refreshControl={
            <RefreshControl
              refreshing={d.refreshing}
              onRefresh={d.onRefresh}
              colors={[Colors.gold, colors.nileBlue]}
              tintColor={Colors.gold}
              title="Pull to refresh"
              titleColor={colors.text.tertiary}
            />
          }
        >
          <View
            style={[
              styles.contentWrapper,
              MAX_CONTENT_WIDTH && { maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' as const, width: '100%' },
            ]}
          >
            {d.pageLoading ? (
              <>
                <PromotionBannerSkeleton count={2} />
                <StoreHeaderSkeleton />
                <View style={{ paddingHorizontal: HORIZONTAL_PADDING, marginTop: Spacing.lg }}>
                  <ProductGridSkeleton count={6} />
                </View>
              </>
            ) : (
              <>
                {/* Banner / Product Display */}
                <View style={styles.imageSection}>
                  <View style={styles.imageCard}>
                    <ProductDisplay
                      images={d.productData.images}
                      onSharePress={d.handleSharePress}
                      onFavoritePress={d.handleFavoritePress}
                      isFavorited={d.isFavorited}
                      rating={d.avgRating}
                      reviewCount={d.totalReviewCount}
                      categoryTags={d.storeData?.tags || []}
                      phoneNumber={d.storeData?.contact?.phone}
                      locationCoords={
                        d.storeData?.location && typeof d.storeData.location === 'object'
                          ? (() => {
                              const coords = (d.storeData.location as LocationData).coordinates;
                              if (!coords) return undefined;
                              const lat = coords.lat || coords[1] || 0;
                              const lng = coords.lng || coords[0] || 0;
                              return lat && lng ? { lat, lng } : undefined;
                            })()
                          : undefined
                      }
                    />
                  </View>
                </View>

                {/* Store Info Header */}
                {(d.productData.title || d.storeData?.name) && (
                  <StoreInfoHeader
                    storeName={d.productData.title || d.storeData?.name || 'Store'}
                    rating={d.avgRating}
                    categoryTags={d.storeData?.tags || []}
                    horizontalPadding={HORIZONTAL_PADDING}
                  />
                )}

                {/* Cashback Hero Card */}
                {d.isDynamic &&
                  d.storeData &&
                  (() => {
                    const cashbackVal =
                      typeof d.storeData.cashback === 'number'
                        ? d.storeData.cashback
                        : (d.storeData as DynamicStoreData).offers?.cashback || 0;
                    return cashbackVal > 0 ? (
                      <CashbackHeroCard
                        cashbackPercentage={cashbackVal}
                        coinsToEarn={(d.storeData as DynamicStoreData).rewardRules?.reviewBonusCoins || 50}
                      />
                    ) : null;
                  })()}

                {/* Store Action Buttons */}
                <NewStoreActionButtons
                  storeId={d.currentStoreId}
                  onScanPay={() =>
                    router.push({
                      pathname: '/pay-in-store/enter-amount',
                      params: {
                        storeId: d.currentStoreId,
                        storeName: d.currentStoreName || '',
                        storeLogo: d.currentStoreLogo,
                      },
                    } as Href)
                  }
                  onUploadBill={() =>
                    router.push({
                      pathname: '/bill-upload',
                      params: { storeId: d.currentStoreId, storeName: d.currentStoreName },
                    } as Href)
                  }
                  onViewOffers={() =>
                    router.push({
                      pathname: '/CardOffersPage',
                      params: { storeId: d.currentStoreId, storeName: d.currentStoreName, orderValue: '1000' },
                    } as Href)
                  }
                />

                {/* Active Campaigns Section */}
                {activeCampaigns.length > 0 && (
                  <View style={{ marginHorizontal: HORIZONTAL_PADDING, marginBottom: spacing.xs }}>
                    <Text style={{ fontWeight: '700', color: '#1a3a52', fontSize: 15, marginBottom: spacing.xs }}>
                      🎯 Active Offers
                    </Text>
                    {activeCampaigns.map(
                      (c: {
                        _id: string;
                        title?: string;
                        description?: string;
                        coinMultiplier?: number;
                        [key: string]: unknown;
                      }) => (
                        <View
                          key={c._id}
                          style={{
                            padding: spacing.md,
                            backgroundColor: '#fff',
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: '#E8DCC4',
                            marginBottom: spacing.xs,
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ fontSize: 20, marginRight: spacing.sm }}>✨</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontWeight: '600', color: '#1a3a52', fontSize: 14 }}>{c.title}</Text>
                            <Text style={{ color: '#2A5577', fontSize: 13 }}>{c.description}</Text>
                            {(c as unknown).coinMultiplier > 1 && (
                              <Text style={{ color: '#ffcd57', fontWeight: '700', fontSize: 13 }}>
                                {c.coinMultiplier}x coins on every purchase
                              </Text>
                            )}
                          </View>
                        </View>
                      ),
                    )}
                  </View>
                )}

                {/* Upcoming Coin Drop Banner */}
                {upcomingDrop && (
                  <View
                    style={{
                      margin: HORIZONTAL_PADDING,
                      padding: spacing.sm,
                      backgroundColor: '#FFF9E6',
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: '#FFE799',
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>🪙</Text>
                    <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                      <Text style={{ fontWeight: '700', color: '#1a3a52', fontSize: 14 }}>Coin Drop Coming!</Text>
                      <Text style={{ color: '#2A5577', fontSize: 13 }}>
                        {upcomingDrop.coinsAmount} coins drop in {getTimeUntil(upcomingDrop.scheduledAt)}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Store Quick Info */}
                {d.isDynamic && d.storeData && (
                  <StoreQuickInfoCard
                    storeName={d.storeData.name || d.storeData.title || d.productData.title}
                    description={d.storeData.description}
                    isVerified={(d.storeData as DynamicStoreData).isVerified}
                    operationalInfo={d.storeData.operationalInfo}
                    location={
                      d.storeData.location && typeof d.storeData.location === 'object'
                        ? {
                            address: (d.storeData.location as LocationData).address,
                            city: (d.storeData.location as LocationData).city,
                            state: (d.storeData.location as LocationData).state,
                            coordinates: (d.storeData.location as LocationData).coordinates
                              ? {
                                  lat:
                                    (d.storeData.location as LocationData).coordinates?.lat ??
                                    (d.storeData.location as LocationData).coordinates?.[1],
                                  lng:
                                    (d.storeData.location as LocationData).coordinates?.lng ??
                                    (d.storeData.location as LocationData).coordinates?.[0],
                                }
                              : undefined,
                          }
                        : undefined
                    }
                  />
                )}

                {/* Book a Table */}
                {d.isDynamic && d.storeData && (
                  <BookTableCard
                    storeId={d.currentStoreId}
                    storeName={d.currentStoreName || ''}
                    storeCategory={d.storeData.category || ''}
                    onPress={(sId, sName) =>
                      router.push(
                        `/MainCategory/food-dining/book-table?storeId=${sId}&storeName=${encodeURIComponent(sName)}`,
                      )
                    }
                  />
                )}

                {/* Store Offers Preview */}
                {d.isDynamic && d.storeData && (
                  <StoreOffersBuilder
                    storeData={d.storeData as DynamicStoreData}
                    storeId={d.currentStoreId}
                    storeName={d.currentStoreName || ''}
                    onViewAll={() =>
                      router.push({
                        pathname: '/CardOffersPage',
                        params: { storeId: d.currentStoreId, storeName: d.currentStoreName },
                      } as Href)
                    }
                    onApplyOffer={(offer) =>
                      router.push({
                        pathname: '/pay-in-store',
                        params: { storeId: d.currentStoreId, offerId: offer.id },
                      } as Href)
                    }
                  />
                )}

                {/* User Loyalty Card */}
                {d.isDynamic && d.storeData && d.userVisitsData && (
                  <UserLoyaltyCard
                    visitsCompleted={d.userVisitsData.visitsCompleted}
                    totalVisitsRequired={d.userVisitsData.totalVisitsRequired}
                    nextReward={d.userVisitsData.nextReward}
                    rewardIcon="cafe"
                    onViewDetails={() =>
                      router.push({
                        pathname: '/loyalty',
                        params: { storeId: d.currentStoreId, storeName: d.currentStoreName },
                      } as Href)
                    }
                  />
                )}

                {/* Merchant Loyalty Card — tier, multiplier, and progress visualization */}
                {d.isDynamic && d.storeData && d.userVisitsData && (
                  <MerchantLoyaltyCard
                    merchantName={d.currentStoreName ?? ''}
                    merchantLogo={d.currentStoreLogo || undefined}
                    tier={'bronze' as TierName}
                    visitCount={d.userVisitsData.visitsCompleted}
                    multiplier={1}
                    progress={Math.min(
                      d.userVisitsData.visitsCompleted / Math.max(d.userVisitsData.totalVisitsRequired, 1),
                      1,
                    )}
                    nextTierAt={d.userVisitsData.totalVisitsRequired}
                  />
                )}

                {/* Payment Methods Card */}
                {d.isDynamic && d.storeData && d.fullStoreDataRef.current?.paymentSettings && (
                  <PaymentMethodsCard
                    acceptPromoCoins={(d.storeData as DynamicStoreData).paymentSettings?.acceptPromoCoins !== false}
                    acceptBrandedCoins={true}
                    acceptRezCoins={(d.storeData as DynamicStoreData).paymentSettings?.acceptRezCoins !== false}
                    acceptUPI={(d.storeData as DynamicStoreData).paymentSettings?.acceptUPI !== false}
                    acceptCards={(d.storeData as DynamicStoreData).paymentSettings?.acceptCards !== false}
                    acceptPayLater={(d.storeData as DynamicStoreData).paymentSettings?.acceptPayLater === true}
                  />
                )}

                {/* Tab Navigation */}
                <View
                  ref={tabsContainerRef}
                  style={styles.tabsContainer}
                  onLayout={(e) => {
                    tabsPositionY.current = e.nativeEvent.layout.y + e.nativeEvent.layout.height;
                    tabsPositionMeasured.current = true;
                  }}
                >
                  <TabNavigation {...tabNavProps} />
                </View>

                {/* Tab Content */}
                {d.activeTab === 'menu' && (
                  <MenuTabContent
                    productData={d.productData}
                    storeData={d.storeData}
                    isDynamic={d.isDynamic}
                    isFavorited={d.isFavorited}
                    onFavoritedChange={d.setIsFavorited}
                    sectionCardStyle={styles.sectionCard}
                  />
                )}

                {d.activeTab === 'reviews' && (
                  <ReviewsTabContent
                    storeName={d.currentStoreName || ''}
                    averageRating={d.avgRating}
                    totalReviews={d.totalReviewCount}
                    ratingBreakdown={d.reviewRatingBreakdown}
                    reviews={d.storeReviews}
                    reviewsLoading={d.reviewsLoading}
                    canReview={d.canReview}
                    ugcContent={d.ugcContent}
                    ugcLoading={d.ugcLoading}
                    onWriteReview={d.openWriteReviewModal}
                    onReviewLike={d.handleReviewLike}
                    onReviewReport={d.handleReviewReport}
                    onReviewHelpful={d.handleReviewHelpful}
                    sectionCardStyle={styles.sectionCard}
                  />
                )}

                {d.activeTab === 'photos' && (
                  <PhotosTabContent
                    storeId={d.productData.storeId}
                    storeIdParam={d.storeIdParam}
                    onViewAllPress={d.handleViewAllPress}
                    onImagePress={d.handleImagePress}
                    sectionCardStyle={styles.sectionCard}
                  />
                )}

                {d.activeTab === 'about' && (
                  <AboutTabContent
                    storeId={d.productData.storeId}
                    storeCategory={d.isDynamic && d.storeData ? d.storeData.category : undefined}
                    isDynamic={d.isDynamic}
                    sectionCardStyle={styles.sectionCard}
                  />
                )}

                {/* Always-visible sections */}
                <AlwaysVisibleSections
                  storeId={d.productData.storeId}
                  storeData={d.storeData}
                  isDynamic={d.isDynamic}
                  productLocation={d.productData.location}
                  sectionCardStyle={styles.sectionCard}
                />
              </>
            )}
          </View>
        </Animated.ScrollView>

        {/* Sticky Tab Navigation */}
        <Animated.View
          style={[
            styles.stickyTabsContainer,
            stickyHeaderAnimStyle,
            {
              pointerEvents: showStickyTabs ? 'auto' : 'none',
            },
          ]}
        >
          <View style={styles.stickyTabsInner}>
            <TabNavigation {...tabNavProps} compact />
          </View>
        </Animated.View>

        {/* Error Toast */}
        {d.error && (
          <View style={styles.errorToast}>
            <Pressable onPress={() => d.setError(null)}>
              <View style={styles.errorInner}>
                <View style={styles.errorDot} />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.errorText}>{d.error}</Text>
                </View>
              </View>
            </Pressable>
          </View>
        )}

        {/* Modals */}
        <StoreModals
          showAboutModal={d.showAboutModal}
          onCloseAboutModal={d.handleCloseAboutModal}
          aboutModalData={aboutModalData}
          showDealsModal={d.showDealsModal}
          onCloseDealsModal={d.handleCloseDealsModal}
          storeId={d.currentStoreId}
          showReviewModal={d.showReviewModal}
          onCloseReviewModal={d.handleCloseReviewModal}
          storeName={d.currentStoreName || ''}
          reviewStoreId={d.reviewStoreId || d.productData.storeId}
          averageRating={d.avgRating}
          totalReviews={d.totalReviewCount}
          ratingBreakdown={d.reviewRatingBreakdown}
          reviews={d.storeReviews}
          onLikeReview={d.handleReviewLike}
          onReportReview={d.handleReviewReport}
          onHelpfulReview={d.handleReviewHelpful}
          onWriteReview={d.canReview !== false ? d.handleWriteReview : undefined}
          ugcContent={d.ugcContent}
          ugcLoading={d.ugcLoading}
          showWriteReviewModal={d.showWriteReviewModal}
          onCloseWriteReviewModal={d.handleCloseWriteReviewModal}
          writeReviewStoreId={d.reviewStoreId || d.productData.storeId}
          writeReviewStoreName={d.currentStoreName || ''}
          onReviewSubmitted={d.handleReviewSubmitted}
        />

        {/* Bottom Action Bar */}
        <StoreBottomActionBar
          storeId={d.currentStoreId}
          storeName={d.currentStoreName || ''}
          storePhone={(d.storeData as DynamicStoreData)?.contact?.phone || (d.storeData as DynamicStoreData)?.phone}
          storeCategory={d.storeData?.category || d.productData.category}
          onScanPayEarn={() =>
            router.push({
              pathname: '/pay-in-store/enter-amount',
              params: { storeId: d.currentStoreId, storeName: d.currentStoreName || '', storeLogo: d.currentStoreLogo },
            })
          }
          onOrderFood={handleOrderFood}
          onBookTable={handleBookTable}
          onCallStore={handleCallStore}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

export default withErrorBoundary(MainStorePage, 'Store Page');
