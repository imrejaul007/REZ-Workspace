// @ts-nocheck
import { withErrorBoundary } from '@/utils/withErrorBoundary';
// Saved Addresses Page
// Page for managing user's saved addresses, with Address History tab

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, RefreshControl, StatusBar, Platform, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import addressApi, { Address as ApiAddress, AddressCreate, AddressUpdate } from '@/services/addressApi';
import ordersService from '@/services/ordersApi';
import AddAddressModal from '@/components/account/AddAddressModal';
import EditAddressModal from '@/components/account/EditAddressModal';
import { platformAlertSimple, platformAlertDestructive } from '@/utils/platformAlert';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/DesignSystem';
import ScreenSkeleton from '@/components/common/ScreenSkeleton';
import ScreenError from '@/components/common/ScreenError';
import { colors } from '@/constants/theme';
import { useIsMounted } from '@/hooks/useIsMounted';

// Use same AddressType as API (uppercase)
type AddressType = 'HOME' | 'OFFICE' | 'OTHER';

interface Address {
  id: string;
  type: AddressType;
  title: string;
  phone?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  instructions?: string;
  createdAt: string;
  updatedAt: string;
}

// Represents a historical delivery address extracted from past orders
interface HistoryAddress {
  key: string; // deduplication key
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  name?: string;
  phone?: string;
  lastUsed?: string; // ISO date string from order.createdAt
}

type ActiveTab = 'saved' | 'history';

// Build a deduplication key from the address fields
function makeHistoryKey(addr: HistoryAddress): string {
  return [addr.addressLine1, addr.city, addr.state, addr.postalCode].join('|').toLowerCase().trim();
}

function SavedAddressesPage() {
  const isMounted = useIsMounted();
  const router = useRouter();

  // ─── Tab state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<ActiveTab>('saved');

  // ─── Saved addresses state ───────────────────────────────────────────────────
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  // ─── Address history state ────────────────────────────────────────────────────
  const [historyAddresses, setHistoryAddresses] = useState<HistoryAddress[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const historyFetchedRef = useRef(false);

  // ─── Fetch saved addresses ────────────────────────────────────────────────────
  const fetchAddresses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await addressApi.getUserAddresses();

      if (response.success && response.data) {
        const transformedAddresses: Address[] = response.data.map((addr: ApiAddress) => ({
          id: addr.id,
          type: addr.type as unknown as AddressType,
          title: addr.title,
          phone: addr.phone,
          addressLine1: addr.addressLine1,
          addressLine2: addr.addressLine2,
          city: addr.city,
          state: addr.state,
          postalCode: addr.postalCode,
          country: addr.country,
          isDefault: addr.isDefault,
          instructions: addr.instructions,
          createdAt: addr.createdAt,
          updatedAt: addr.updatedAt,
        }));

        if (isMounted()) {
          setAddresses(transformedAddresses);
        }
      } else {
        throw new Error(response.error || 'Failed to fetch addresses');
      }
    } catch (err) {
      if (isMounted()) {
        setError(err instanceof Error ? err.message : 'Failed to fetch addresses');
      }
    } finally {
      if (isMounted()) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [isMounted]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // ─── Fetch address history from past orders ────────────────────────────────
  const fetchAddressHistory = useCallback(async () => {
    if (historyFetchedRef.current) return;
    historyFetchedRef.current = true;

    try {
      setIsHistoryLoading(true);
      setHistoryError(null);

      const response = await ordersService.getOrders({ limit: 50 });

      if (!isMounted()) return;

      if (response.success && response.data) {
        const ordersData = response.data as unknown;
        const orderList = ordersData.orders ?? ordersData.data ?? (Array.isArray(ordersData) ? ordersData : []);

        const seen = new Set<string>();
        const history: HistoryAddress[] = [];

        for (const order of orderList) {
          const da = order?.delivery?.address;
          if (!da) continue;

          const candidate: HistoryAddress = {
            key: '',
            addressLine1: da.addressLine1 || da.street || da.line1 || '',
            addressLine2: da.addressLine2 || da.line2,
            city: da.city || '',
            state: da.state || da.province || '',
            postalCode: da.postalCode || da.pincode || da.zip || '',
            country: da.country,
            name: da.name,
            phone: da.phone,
            lastUsed: order.createdAt,
          };

          if (!candidate.addressLine1 || !candidate.city) continue;

          candidate.key = makeHistoryKey(candidate);

          if (!seen.has(candidate.key)) {
            seen.add(candidate.key);
            history.push(candidate);
          }
        }

        if (isMounted()) {
          setHistoryAddresses(history);
        }
      }
    } catch (err) {
      if (isMounted()) {
        setHistoryError(err instanceof Error ? err.message : 'Failed to load history');
      }
    } finally {
      if (isMounted()) {
        setIsHistoryLoading(false);
      }
    }
  }, [isMounted]);

  // Fetch history when tab switches to 'history'
  useEffect(() => {
    if (activeTab === 'history') {
      fetchAddressHistory();
    }
  }, [activeTab, fetchAddressHistory]);

  const handleClearHistory = useCallback(() => {
    platformAlertDestructive(
      'Clear History',
      'Remove all address history? This only clears the displayed list — your orders are not affected.',
      () => {
        historyFetchedRef.current = false; // allow re-fetch after clear
        if (isMounted()) {
          setHistoryAddresses([]);
        }
      },
    );
  }, [isMounted]);

  const handleSaveHistoryAddress = useCallback(
    async (hist: HistoryAddress) => {
      const newAddress: AddressCreate = {
        type: 'OTHER' as unknown,
        title: hist.name || hist.addressLine1.split(' ').slice(0, 3).join(' '),
        phone: hist.phone,
        addressLine1: hist.addressLine1,
        addressLine2: hist.addressLine2,
        city: hist.city,
        state: hist.state,
        postalCode: hist.postalCode,
        country: hist.country || 'India',
        isDefault: false,
      };

      try {
        const response = await addressApi.createAddress(newAddress);
        if (response.success && response.data) {
          const saved: Address = {
            id: response.data.id,
            type: (response.data.type as unknown as AddressType) || 'OTHER',
            title: response.data.title,
            phone: response.data.phone,
            addressLine1: response.data.addressLine1,
            addressLine2: response.data.addressLine2,
            city: response.data.city,
            state: response.data.state,
            postalCode: response.data.postalCode,
            country: response.data.country,
            isDefault: response.data.isDefault,
            instructions: response.data.instructions,
            createdAt: response.data.createdAt,
            updatedAt: response.data.updatedAt,
          };
          if (isMounted()) {
            setAddresses((prev) => [...prev, saved]);
          }
          platformAlertSimple('Saved', 'Address added to your saved addresses');
        } else {
          platformAlertSimple('Error', response.error || 'Failed to save address');
        }
      } catch {
        platformAlertSimple('Error', 'Failed to save address');
      }
    },
    [isMounted],
  );

  // ─── Saved address handlers ────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchAddresses();
  }, [fetchAddresses]);

  const handleBackPress = useCallback(() => {
    // eslint-disable-next-line no-unused-expressions
    router.canGoBack() ? router.back() : router.replace('/(tabs)');
  }, [router]);

  const handleAddAddress = useCallback(() => {
    setShowAddModal(true);
  }, []);

  const handleEditAddress = useCallback((address: Address) => {
    setSelectedAddress(address);
    setShowEditModal(true);
  }, []);

  const handleAddAddressSubmit = useCallback(
    async (addressData: AddressCreate): Promise<boolean> => {
      try {
        const response = await addressApi.createAddress(addressData);

        if (response.success && response.data) {
          const newAddress: Address = {
            id: response.data.id,
            type: response.data.type as unknown as AddressType,
            title: response.data.title,
            phone: response.data.phone,
            addressLine1: response.data.addressLine1,
            addressLine2: response.data.addressLine2,
            city: response.data.city,
            state: response.data.state,
            postalCode: response.data.postalCode,
            country: response.data.country,
            isDefault: response.data.isDefault,
            instructions: response.data.instructions,
            createdAt: response.data.createdAt,
            updatedAt: response.data.updatedAt,
          };

          if (isMounted()) {
            setAddresses((prev) => [...prev, newAddress]);
          }
          return true;
        }
        platformAlertSimple('Error', response.error || 'Failed to add address');
        return false;
      } catch {
        platformAlertSimple('Error', 'Failed to add address');
        return false;
      }
    },
    [isMounted],
  );

  const handleUpdateAddressSubmit = useCallback(
    async (id: string, updateData: AddressUpdate): Promise<boolean> => {
      try {
        const response = await addressApi.updateAddress(id, updateData);

        if (response.success && response.data) {
          if (isMounted()) {
            setAddresses((prev) =>
              prev.map((addr) =>
                addr.id === id
                  ? {
                      ...addr,
                      type: response.data!.type as unknown as AddressType,
                      title: response.data!.title,
                      phone: response.data!.phone,
                      addressLine1: response.data!.addressLine1,
                      addressLine2: response.data!.addressLine2,
                      city: response.data!.city,
                      state: response.data!.state,
                      postalCode: response.data!.postalCode,
                      country: response.data!.country,
                      isDefault: response.data!.isDefault,
                      instructions: response.data!.instructions,
                      updatedAt: response.data!.updatedAt,
                    }
                  : addr,
              ),
            );
          }
          return true;
        }
        platformAlertSimple('Error', response.error || 'Failed to update address');
        return false;
      } catch {
        platformAlertSimple('Error', 'Failed to update address');
        return false;
      }
    },
    [isMounted],
  );

  const handleDeleteAddress = useCallback(
    async (address: Address) => {
      platformAlertDestructive('Delete Address', `Are you sure you want to delete ${address.title}?`, async () => {
        try {
          const response = await addressApi.deleteAddress(address.id);

          if (response.success) {
            if (isMounted()) {
              setAddresses((prev) => prev.filter((addr) => addr.id !== address.id));
            }
            platformAlertSimple('Success', 'Address deleted successfully');
          } else {
            platformAlertSimple('Error', response.error || 'Failed to delete address');
          }
        } catch {
          platformAlertSimple('Error', 'Failed to delete address');
        }
      });
    },
    [isMounted],
  );

  const handleSetDefault = useCallback(
    async (address: Address) => {
      try {
        const response = await addressApi.setDefaultAddress(address.id);

        if (response.success) {
          if (isMounted()) {
            setAddresses((prev) =>
              prev.map((addr) => ({
                ...addr,
                isDefault: addr.id === address.id,
              })),
            );
          }
          platformAlertSimple('Success', `${address.title} is now your default address`);
        } else {
          platformAlertSimple('Error', response.error || 'Failed to set default address');
        }
      } catch {
        platformAlertSimple('Error', 'Failed to set default address');
      }
    },
    [isMounted],
  );

  // ─── Helpers ──────────────────────────────────────────────────────────────────
  const getAddressTypeIcon = (type: string) => {
    switch (type) {
      case 'HOME':
        return 'home-outline';
      case 'OFFICE':
        return 'business-outline';
      default:
        return 'location-outline';
    }
  };

  const getAddressTypeColor = (type: string) => {
    switch (type) {
      case 'HOME':
        return Colors.primary[500];
      case 'OFFICE':
        return colors.infoScale?.[400] ?? '#3B82F6';
      default:
        return colors.text.secondary;
    }
  };

  // ─── Renderers ────────────────────────────────────────────────────────────────
  const renderAddress = useCallback(
    ({ item: address }: { item: Address }) => {
      const fullAddress = `${address.addressLine1}, ${address.addressLine2 ? address.addressLine2 + ', ' : ''}${address.city}, ${address.state} ${address.postalCode}, ${address.country}`;
      const addressLabel = `${address.title}. ${fullAddress}${address.isDefault ? '. Default address' : ''}${address.instructions ? '. Instructions: ' + address.instructions : ''}`;

      return (
        <View style={styles.addressCard} accessibilityRole="summary" accessibilityLabel={addressLabel}>
          <View style={styles.addressHeader}>
            <View style={styles.addressTitleContainer}>
              <View style={[styles.typeIcon, { backgroundColor: getAddressTypeColor(address.type) }]}>
                <Ionicons name={getAddressTypeIcon(address.type)} size={16} color={colors.text.inverse} />
              </View>
              <View style={styles.addressTitleInfo}>
                <ThemedText style={styles.addressTitle}>{address.title}</ThemedText>
                {address.isDefault && (
                  <View style={styles.defaultBadge}>
                    <ThemedText style={styles.defaultText}>Default</ThemedText>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.addressActions}>
              <Pressable
                style={styles.actionButton}
                onPress={() => handleEditAddress(address)}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${address.title}`}
                accessibilityHint="Double tap to edit this address"
              >
                <Ionicons name="pencil-outline" size={18} color={colors.nileBlue} />
              </Pressable>
              <Pressable
                style={styles.actionButton}
                onPress={() => handleDeleteAddress(address)}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${address.title}`}
                accessibilityHint="Double tap to remove this address. This action requires confirmation"
              >
                <Ionicons name="trash-outline" size={18} color={Colors.error} />
              </Pressable>
            </View>
          </View>

          <View style={styles.addressDetails}>
            {address.phone && (
              <View style={styles.phoneContainer}>
                <Ionicons name="call-outline" size={14} color={colors.text.secondary} />
                <ThemedText style={styles.phoneText}>{address.phone}</ThemedText>
              </View>
            )}
            <ThemedText style={styles.addressLine}>{address.addressLine1}</ThemedText>
            {address.addressLine2 && <ThemedText style={styles.addressLine}>{address.addressLine2}</ThemedText>}
            <ThemedText style={styles.addressLine}>
              {address.city}, {address.state} {address.postalCode}
            </ThemedText>
            <ThemedText style={styles.addressLine}>{address.country}</ThemedText>

            {address.instructions && (
              <View style={styles.instructionsContainer}>
                <Ionicons name="information-circle-outline" size={16} color={colors.text.secondary} />
                <ThemedText style={styles.instructions}>{address.instructions}</ThemedText>
              </View>
            )}
          </View>

          {!address.isDefault && (
            <Pressable
              style={styles.setDefaultButton}
              onPress={() => handleSetDefault(address)}
              accessibilityRole="button"
              accessibilityLabel={`Set ${address.title} as default address`}
              accessibilityHint="Double tap to make this your default delivery address"
            >
              <ThemedText style={styles.setDefaultText}>Set as Default</ThemedText>
            </Pressable>
          )}
        </View>
      );
    },
    [handleEditAddress, handleDeleteAddress, handleSetDefault],
  );

  const renderHistoryItem = useCallback(
    ({ item }: { item: HistoryAddress }) => {
      const line2 = item.addressLine2 ? `, ${item.addressLine2}` : '';
      const label = `${item.addressLine1}${line2}, ${item.city}, ${item.state} ${item.postalCode}`;
      return (
        <View style={styles.historyCard}>
          <View style={styles.historyCardLeft}>
            <View style={[styles.typeIcon, { backgroundColor: colors.text.secondary }]}>
              <Ionicons name="time-outline" size={16} color={colors.text.inverse} />
            </View>
            <View style={styles.historyInfo}>
              {item.name && <ThemedText style={styles.historyName}>{item.name}</ThemedText>}
              <ThemedText style={styles.historyAddress}>{label}</ThemedText>
              {item.phone && <ThemedText style={styles.historyPhone}>{item.phone}</ThemedText>}
              {item.lastUsed && (
                <ThemedText style={styles.historyDate}>Used: {new Date(item.lastUsed).toLocaleDateString()}</ThemedText>
              )}
            </View>
          </View>
          <Pressable
            style={styles.saveHistoryButton}
            onPress={() => handleSaveHistoryAddress(item)}
            accessibilityRole="button"
            accessibilityLabel={`Save address ${label} to my addresses`}
            accessibilityHint="Double tap to add this address to your saved addresses"
          >
            <Ionicons name="bookmark-outline" size={16} color={colors.nileBlue} />
            <ThemedText style={styles.saveHistoryText}>Save</ThemedText>
          </Pressable>
        </View>
      );
    },
    [handleSaveHistoryAddress],
  );

  // ─── Header element (for skeleton / error screens) ────────────────────────
  const headerElement = (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.nileBlue} />
      <LinearGradient colors={[colors.nileBlue, Colors.secondary[500]]} style={styles.headerBg}>
        <View style={styles.headerContainer}>
          <Pressable style={styles.backButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={24} color={colors.text.inverse} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>My Addresses</ThemedText>
          <Pressable style={styles.addButton} onPress={handleAddAddress}>
            <Ionicons name="add" size={24} color={colors.text.inverse} />
          </Pressable>
        </View>
      </LinearGradient>
    </>
  );

  if (isLoading) {
    return <ScreenSkeleton variant="sections" header={headerElement} />;
  }

  if (error) {
    return (
      <ScreenError error={error} onRetry={handleRefresh} header={headerElement} onSecondaryAction={handleBackPress} />
    );
  }

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.nileBlue} />
      <LinearGradient colors={[colors.nileBlue, Colors.secondary[500]]} style={styles.headerBg}>
        <View style={styles.headerContainer}>
          <Pressable
            style={styles.backButton}
            onPress={handleBackPress}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityHint="Double tap to return to previous screen"
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.inverse} />
          </Pressable>
          <ThemedText style={styles.headerTitle} accessibilityRole="header">
            My Addresses
          </ThemedText>
          <Pressable
            style={styles.addButton}
            onPress={handleAddAddress}
            accessibilityRole="button"
            accessibilityLabel="Add new address"
            accessibilityHint="Double tap to add a new delivery address"
          >
            <Ionicons name="add" size={24} color={colors.text.inverse} />
          </Pressable>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabBar}>
          <Pressable
            style={[styles.tab, activeTab === 'saved' && styles.tabActive]}
            onPress={() => setActiveTab('saved')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'saved' }}
            accessibilityLabel="Saved Addresses tab"
          >
            <ThemedText style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>
              Saved Addresses
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'history' && styles.tabActive]}
            onPress={() => setActiveTab('history')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'history' }}
            accessibilityLabel="Address History tab"
          >
            <ThemedText style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
              Address History
            </ThemedText>
          </Pressable>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* ── Saved Addresses Tab ── */}
        {activeTab === 'saved' &&
          (addresses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="location-outline" size={80} color={colors.border.medium} />
              <ThemedText style={styles.emptyTitle}>No Addresses Saved</ThemedText>
              <ThemedText style={styles.emptyDescription}>Add your addresses to make checkout faster</ThemedText>
              <Pressable
                style={styles.addAddressButton}
                onPress={handleAddAddress}
                accessibilityRole="button"
                accessibilityLabel="Add your first address"
                accessibilityHint="Double tap to add a new delivery address"
              >
                <ThemedText style={styles.addAddressButtonText}>Add Address</ThemedText>
              </Pressable>
            </View>
          ) : (
            <FlashList
              data={addresses}
              renderItem={renderAddress}
              keyExtractor={(item) => item.id}
              refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.nileBlue} />
              }
              contentContainerStyle={styles.addressesContainer}
              showsVerticalScrollIndicator={false}
              estimatedItemSize={160}
            />
          ))}

        {/* ── Address History Tab ── */}
        {activeTab === 'history' &&
          (isHistoryLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.nileBlue} />
              <ThemedText style={styles.loadingText}>Loading address history...</ThemedText>
            </View>
          ) : historyError ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
              <ThemedText style={styles.errorTitle}>Failed to load history</ThemedText>
              <ThemedText style={styles.emptyDescription}>{historyError}</ThemedText>
              <Pressable
                style={styles.addAddressButton}
                onPress={() => {
                  historyFetchedRef.current = false;
                  fetchAddressHistory();
                }}
                accessibilityRole="button"
                accessibilityLabel="Retry loading history"
              >
                <ThemedText style={styles.addAddressButtonText}>Retry</ThemedText>
              </Pressable>
            </View>
          ) : historyAddresses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="time-outline" size={80} color={colors.border.medium} />
              <ThemedText style={styles.emptyTitle}>No Address History</ThemedText>
              <ThemedText style={styles.emptyDescription}>
                Delivery addresses from your past orders will appear here
              </ThemedText>
            </View>
          ) : (
            <FlashList
              data={historyAddresses}
              renderItem={renderHistoryItem}
              keyExtractor={(item) => item.key}
              contentContainerStyle={styles.addressesContainer}
              showsVerticalScrollIndicator={false}
              estimatedItemSize={110}
              ListHeaderComponent={
                <Pressable
                  style={styles.clearHistoryButton}
                  onPress={handleClearHistory}
                  accessibilityRole="button"
                  accessibilityLabel="Clear address history"
                >
                  <Ionicons name="trash-outline" size={16} color={Colors.error} />
                  <ThemedText style={styles.clearHistoryText}>Clear History</ThemedText>
                </Pressable>
              }
            />
          ))}
      </View>

      {/* Add Address Modal */}
      <AddAddressModal visible={showAddModal} onClose={() => setShowAddModal(false)} onAdd={handleAddAddressSubmit} />

      {/* Edit Address Modal */}
      <EditAddressModal
        visible={showEditModal}
        address={
          selectedAddress
            ? {
                ...selectedAddress,
                type: selectedAddress.type as unknown,
              }
            : null
        }
        onClose={() => {
          setShowEditModal(false);
          setSelectedAddress(null);
        }}
        onUpdate={handleUpdateAddressSubmit}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  headerBg: {
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 50,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: BorderRadius['2xl'],
    borderBottomRightRadius: BorderRadius['2xl'],
    ...Platform.select({
      ios: {
        shadowColor: colors.nileBlue,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0px 4px 5px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    color: colors.text.inverse,
    ...Typography.h3,
    fontWeight: 'bold',
  },
  addButton: {
    padding: Spacing.xs,
  },

  // ── Tab Bar ──────────────────────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.lg,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  tabActive: {
    backgroundColor: '#fff',
  },
  tabText: {
    ...Typography.label,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.nileBlue,
  },

  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  addressesContainer: {
    paddingBottom: 120,
  },

  // ── Saved Address Cards ────────────────────────────────────────────────────
  addressCard: {
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...Platform.select({
      ios: {
        shadowColor: colors.nileBlue,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
      },
    }),
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  addressTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  addressTitleInfo: {
    flex: 1,
  },
  addressTitle: {
    ...Typography.h4,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: Spacing.xs,
  },
  defaultBadge: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
  },
  defaultText: {
    ...Typography.overline,
    fontWeight: '600',
    color: colors.text.inverse,
    textTransform: undefined,
    letterSpacing: undefined,
  },
  addressActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.gray[100],
  },
  addressDetails: {
    marginBottom: Spacing.md,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  phoneText: {
    ...Typography.body,
    color: Colors.gray[600],
    marginLeft: 6,
    fontWeight: '500',
  },
  addressLine: {
    ...Typography.body,
    color: Colors.gray[600],
    marginBottom: 2,
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: colors.background.accent,
    borderRadius: BorderRadius.sm,
  },
  instructions: {
    ...Typography.bodySmall,
    color: colors.text.secondary,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  setDefaultButton: {
    backgroundColor: colors.nileBlue,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  setDefaultText: {
    color: colors.text.inverse,
    ...Typography.label,
  },

  // ── History Cards ──────────────────────────────────────────────────────────
  historyCard: {
    backgroundColor: colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
      web: { boxShadow: '0px 2px 6px rgba(0,0,0,0.06)' },
    }),
  },
  historyCardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: Spacing.md,
  },
  historyInfo: {
    flex: 1,
  },
  historyName: {
    ...Typography.label,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  historyAddress: {
    ...Typography.bodySmall,
    color: Colors.gray[600],
    marginBottom: 2,
  },
  historyPhone: {
    ...Typography.bodySmall,
    color: colors.text.secondary,
  },
  historyDate: {
    ...Typography.caption,
    color: colors.text.tertiary ?? colors.text.secondary,
    marginTop: 2,
  },
  saveHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: colors.nileBlue + '15',
    borderWidth: 1,
    borderColor: colors.nileBlue + '30',
  },
  saveHistoryText: {
    ...Typography.label,
    color: colors.nileBlue,
    fontWeight: '600',
  },
  clearHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'flex-end',
    marginBottom: Spacing.base,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  clearHistoryText: {
    ...Typography.label,
    color: Colors.error,
  },

  // ── Common empty / loading / error ─────────────────────────────────────────
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['3xl'],
  },
  emptyTitle: {
    ...Typography.h2,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    ...Typography.bodyLarge,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  errorTitle: {
    ...Typography.h3,
    fontWeight: 'bold',
    color: Colors.error,
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  addAddressButton: {
    backgroundColor: colors.nileBlue,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  addAddressButtonText: {
    color: colors.text.inverse,
    ...Typography.bodyLarge,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    ...Typography.bodyLarge,
    color: colors.text.secondary,
  },
});

export default withErrorBoundary(SavedAddressesPage, 'AccountAddresses');
