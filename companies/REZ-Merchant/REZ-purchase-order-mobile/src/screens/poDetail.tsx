import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format, parseISO, isValid, differenceInDays } from 'date-fns';
import { usePOStore } from '../contexts/store';
import { purchaseOrderApi } from '../services/api';
import { StatusBadge, LoadingSpinner, ConfirmModal, SectionHeader } from '../components/common';
import { RootStackParamList, PurchaseOrder, POItem, DeliveryPhoto } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'PODetail'>;

export const PODetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { poId } = route.params;

  const {
    currentPO,
    fetchPurchaseOrder,
    updatePurchaseOrder,
    isLoading,
    isRefreshing,
    isOnline,
  } = usePOStore();

  const [activeTab, setActiveTab] = useState<'details' | 'items' | 'delivery' | 'history'>('details');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    fetchPurchaseOrder(poId);
  }, [poId, fetchPurchaseOrder]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return '-';
      return format(date, 'MMM dd, yyyy');
    } catch {
      return '-';
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return '-';
      return format(date, 'MMM dd, yyyy hh:mm a');
    } catch {
      return '-';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDaysUntilDelivery = () => {
    if (!currentPO?.expectedDeliveryDate) return null;
    const days = differenceInDays(parseISO(currentPO.expectedDeliveryDate), new Date());
    if (days < 0) return { text: `${Math.abs(days)} days overdue`, type: 'overdue' as const };
    if (days === 0) return { text: 'Due today', type: 'today' as const };
    return { text: `${days} days left`, type: 'upcoming' as const };
  };

  const handleApprove = useCallback(async () => {
    if (!currentPO) return;
    const response = await purchaseOrderApi.approvePurchaseOrder({
      poId: currentPO.id,
      action: 'approve',
    });
    if (response.success && response.data) {
      updatePurchaseOrder(currentPO.id, response.data);
    }
    setShowApproveModal(false);
  }, [currentPO, updatePurchaseOrder]);

  const handleReject = useCallback(async () => {
    if (!currentPO || !rejectionReason.trim()) return;
    const response = await purchaseOrderApi.approvePurchaseOrder({
      poId: currentPO.id,
      action: 'reject',
      reason: rejectionReason,
    });
    if (response.success && response.data) {
      updatePurchaseOrder(currentPO.id, response.data);
    }
    setShowRejectModal(false);
    setRejectionReason('');
  }, [currentPO, rejectionReason, updatePurchaseOrder]);

  const handleCancel = useCallback(async () => {
    if (!currentPO || !cancelReason.trim()) return;
    const response = await purchaseOrderApi.cancelPurchaseOrder(currentPO.id, cancelReason);
    if (response.success && response.data) {
      updatePurchaseOrder(currentPO.id, response.data);
    }
    setShowCancelModal(false);
    setCancelReason('');
  }, [currentPO, cancelReason, updatePurchaseOrder]);

  const handleSend = useCallback(async () => {
    if (!currentPO) return;
    const response = await purchaseOrderApi.sendPurchaseOrder(currentPO.id);
    if (response.success && response.data) {
      updatePurchaseOrder(currentPO.id, response.data);
      Alert.alert('Success', 'Purchase order sent to supplier');
    }
  }, [currentPO, updatePurchaseOrder]);

  const handleCall = useCallback(() => {
    if (currentPO?.supplier?.phone) {
      Linking.openURL(`tel:${currentPO.supplier.phone}`);
    }
  }, [currentPO]);

  const handleEmail = useCallback(() => {
    if (currentPO?.supplier?.email) {
      Linking.openURL(`mailto:${currentPO.supplier.email}`);
    }
  }, [currentPO]);

  const handleAddPhoto = useCallback(() => {
    navigation.navigate('Camera', { poId: currentPO!.id, type: 'delivery' });
  }, [navigation, currentPO]);

  const deliveryInfo = getDaysUntilDelivery();

  if (isLoading && !currentPO) {
    return <LoadingSpinner fullScreen message="Loading purchase order..." />;
  }

  if (!currentPO) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#F44336" />
        <Text style={styles.errorTitle}>Purchase Order Not Found</Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{currentPO.poNumber}</Text>
          <StatusBadge status={currentPO.status} type="po" size="medium" />
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <MaterialCommunityIcons name="dots-vertical" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Delivery Status Banner */}
      {currentPO.status === 'in_transit' && deliveryInfo && (
        <View
          style={[
            styles.deliveryBanner,
            {
              backgroundColor:
                deliveryInfo.type === 'overdue'
                  ? '#FFEBEE'
                  : deliveryInfo.type === 'today'
                  ? '#FFF3E0'
                  : '#E8F5E9',
            },
          ]}
        >
          <MaterialCommunityIcons
            name={
              deliveryInfo.type === 'overdue'
                ? 'alert'
                : deliveryInfo.type === 'today'
                ? 'clock-outline'
                : 'truck-delivery'
            }
            size={20}
            color={
              deliveryInfo.type === 'overdue'
                ? '#F44336'
                : deliveryInfo.type === 'today'
                ? '#FF9800'
                : '#4CAF50'
            }
          />
          <Text
            style={[
              styles.deliveryBannerText,
              {
                color:
                  deliveryInfo.type === 'overdue'
                    ? '#C62828'
                    : deliveryInfo.type === 'today'
                    ? '#E65100'
                    : '#2E7D32',
              },
            ]}
          >
            {deliveryInfo.text}
          </Text>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['details', 'items', 'delivery', 'history'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchPurchaseOrder(poId)}
            colors={['#2196F3']}
            tintColor="#2196F3"
          />
        }
      >
        {/* Details Tab */}
        {activeTab === 'details' && (
          <View style={styles.content}>
            {/* Supplier Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Supplier</Text>
                {currentPO.supplier?.isVerified && (
                  <View style={styles.verifiedBadge}>
                    <MaterialCommunityIcons name="check-decagram" size={14} color="#4CAF50" />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.supplierRow}
                onPress={() =>
                  currentPO.supplier?.id &&
                  navigation.navigate('SupplierSearch', {})
                }
              >
                <View style={styles.supplierInfo}>
                  <Text style={styles.supplierName}>{currentPO.supplier?.name || 'Unknown'}</Text>
                  <Text style={styles.supplierAddress}>
                    {currentPO.supplier?.city}, {currentPO.supplier?.state}
                  </Text>
                </View>
                <View style={styles.supplierActions}>
                  {currentPO.supplier?.phone && (
                    <TouchableOpacity style={styles.supplierAction} onPress={handleCall}>
                      <MaterialCommunityIcons name="phone" size={20} color="#4CAF50" />
                    </TouchableOpacity>
                  )}
                  {currentPO.supplier?.email && (
                    <TouchableOpacity style={styles.supplierAction} onPress={handleEmail}>
                      <MaterialCommunityIcons name="email" size={20} color="#2196F3" />
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
              {currentPO.supplier?.rating && (
                <View style={styles.ratingRow}>
                  <MaterialCommunityIcons name="star" size={16} color="#FFC107" />
                  <Text style={styles.ratingText}>
                    {currentPO.supplier.rating.toFixed(1)} ({currentPO.supplier.totalOrders} orders)
                  </Text>
                </View>
              )}
            </View>

            {/* Order Summary */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Order Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Created</Text>
                <Text style={styles.summaryValue}>{formatDateTime(currentPO.createdAt)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Expected Delivery</Text>
                <Text style={styles.summaryValue}>
                  {formatDate(currentPO.expectedDeliveryDate) || '-'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Priority</Text>
                <View
                  style={[
                    styles.priorityBadge,
                    {
                      backgroundColor:
                        currentPO.priority === 'urgent'
                          ? '#F44336'
                          : currentPO.priority === 'high'
                          ? '#FF9800'
                          : currentPO.priority === 'medium'
                          ? '#FFC107'
                          : '#4CAF50',
                    },
                  ]}
                >
                  <Text style={styles.priorityText}>{currentPO.priority?.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Payment Status</Text>
                <StatusBadge status={currentPO.paymentStatus} type="payment" />
              </View>
            </View>

            {/* Financial Summary */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Financial Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{formatCurrency(currentPO.subtotal)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
                  -{formatCurrency(currentPO.totalDiscount)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax</Text>
                <Text style={styles.summaryValue}>{formatCurrency(currentPO.totalTax)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shipping</Text>
                <Text style={styles.summaryValue}>{formatCurrency(currentPO.shippingCost)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Grand Total</Text>
                <Text style={styles.totalValue}>{formatCurrency(currentPO.grandTotal)}</Text>
              </View>
            </View>

            {/* Notes */}
            {currentPO.notes && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Notes</Text>
                <Text style={styles.notesText}>{currentPO.notes}</Text>
              </View>
            )}

            {/* Tags */}
            {currentPO.tags && currentPO.tags.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Tags</Text>
                <View style={styles.tagsContainer}>
                  {currentPO.tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Items Tab */}
        {activeTab === 'items' && (
          <View style={styles.content}>
            {currentPO.items?.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.productName}</Text>
                    <Text style={styles.itemSku}>SKU: {item.sku}</Text>
                  </View>
                  <View style={styles.itemStatus}>
                    <StatusBadge
                      status={item.status === 'fulfilled' ? 'delivered' : 'pending_approval'}
                      type="po"
                      size="small"
                    />
                  </View>
                </View>
                <View style={styles.itemDetails}>
                  <View style={styles.itemDetail}>
                    <Text style={styles.itemDetailLabel}>Quantity</Text>
                    <Text style={styles.itemDetailValue}>
                      {item.quantity} {item.unit}
                    </Text>
                  </View>
                  <View style={styles.itemDetail}>
                    <Text style={styles.itemDetailLabel}>Unit Price</Text>
                    <Text style={styles.itemDetailValue}>{formatCurrency(item.unitPrice)}</Text>
                  </View>
                  <View style={styles.itemDetail}>
                    <Text style={styles.itemDetailLabel}>Total</Text>
                    <Text style={styles.itemDetailValueBold}>{formatCurrency(item.total)}</Text>
                  </View>
                </View>
                {item.deliveredQuantity > 0 && (
                  <View style={styles.deliveryProgress}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${(item.deliveredQuantity / item.quantity) * 100}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {item.deliveredQuantity}/{item.quantity} delivered
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Delivery Tab */}
        {activeTab === 'delivery' && (
          <View style={styles.content}>
            {/* Delivery Address */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Delivery Address</Text>
              <View style={styles.addressRow}>
                <MaterialCommunityIcons name="map-marker" size={20} color="#666" />
                <View style={styles.addressInfo}>
                  <Text style={styles.addressText}>{currentPO.deliveryAddress?.line1}</Text>
                  {currentPO.deliveryAddress?.line2 && (
                    <Text style={styles.addressText}>{currentPO.deliveryAddress.line2}</Text>
                  )}
                  <Text style={styles.addressText}>
                    {currentPO.deliveryAddress?.city}, {currentPO.deliveryAddress?.state}{' '}
                    {currentPO.deliveryAddress?.pincode}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.directionsButton}>
                <MaterialCommunityIcons name="directions" size={18} color="#2196F3" />
                <Text style={styles.directionsText}>Get Directions</Text>
              </TouchableOpacity>
            </View>

            {/* Delivery Photos */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Delivery Photos</Text>
                <TouchableOpacity style={styles.addPhotoButton} onPress={handleAddPhoto}>
                  <MaterialCommunityIcons name="camera-plus" size={18} color="#2196F3" />
                  <Text style={styles.addPhotoText}>Add Photo</Text>
                </TouchableOpacity>
              </View>
              {currentPO.deliveryAttempts?.length === 0 ? (
                <View style={styles.emptyPhotos}>
                  <MaterialCommunityIcons name="image-off-outline" size={48} color="#CCC" />
                  <Text style={styles.emptyPhotosText}>No delivery photos yet</Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {currentPO.deliveryAttempts?.flatMap((attempt) =>
                    attempt.photos.map((photo) => (
                      <TouchableOpacity key={photo.id} style={styles.photoThumbnail}>
                        <Image
                          source={{ uri: photo.uri }}
                          style={styles.photoImage}
                          resizeMode="cover"
                        />
                        <View style={styles.photoOverlay}>
                          <MaterialCommunityIcons
                            name={
                              photo.type === 'delivery'
                                ? 'package-variant'
                                : photo.type === 'damage'
                                ? 'alert'
                                : 'check'
                            }
                            size={20}
                            color="#FFF"
                          />
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              )}
            </View>

            {/* Delivery Attempts */}
            {currentPO.deliveryAttempts?.map((attempt) => (
              <View key={attempt.id} style={styles.card}>
                <Text style={styles.cardTitle}>Delivery Attempt</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Date</Text>
                  <Text style={styles.summaryValue}>{formatDateTime(attempt.attemptedAt)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Delivered By</Text>
                  <Text style={styles.summaryValue}>{attempt.deliveredBy}</Text>
                </View>
                {attempt.receivedBy && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Received By</Text>
                    <Text style={styles.summaryValue}>{attempt.receivedBy}</Text>
                  </View>
                )}
                {attempt.notes && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Notes</Text>
                    <Text style={styles.summaryValue}>{attempt.notes}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <View style={styles.content}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Timeline</Text>
              <View style={styles.timeline}>
                <View style={styles.timelineItem}>
                  <View style={[styles.timelineDot, { backgroundColor: '#4CAF50' }]} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>Purchase Order Created</Text>
                    <Text style={styles.timelineDate}>{formatDateTime(currentPO.createdAt)}</Text>
                  </View>
                </View>
                {currentPO.approvedAt && (
                  <View style={styles.timelineItem}>
                    <View style={[styles.timelineDot, { backgroundColor: '#4CAF50' }]} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineTitle}>Approved by {currentPO.approvedBy}</Text>
                      <Text style={styles.timelineDate}>{formatDateTime(currentPO.approvedAt)}</Text>
                    </View>
                  </View>
                )}
                {currentPO.rejectedAt && (
                  <View style={styles.timelineItem}>
                    <View style={[styles.timelineDot, { backgroundColor: '#F44336' }]} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineTitle}>Rejected by {currentPO.rejectedBy}</Text>
                      <Text style={styles.timelineDate}>{formatDateTime(currentPO.rejectedAt)}</Text>
                      {currentPO.rejectionReason && (
                        <Text style={styles.timelineNote}>Reason: {currentPO.rejectionReason}</Text>
                      )}
                    </View>
                  </View>
                )}
                {currentPO.actualDeliveryDate && (
                  <View style={styles.timelineItem}>
                    <View style={[styles.timelineDot, { backgroundColor: '#4CAF50' }]} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineTitle}>Delivered</Text>
                      <Text style={styles.timelineDate}>
                        {formatDateTime(currentPO.actualDeliveryDate)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.actionBar, { paddingBottom: insets.bottom + 16 }]}>
        {currentPO.status === 'pending_approval' && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => setShowRejectModal(true)}
            >
              <MaterialCommunityIcons name="close" size={20} color="#F44336" />
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => setShowApproveModal(true)}
            >
              <MaterialCommunityIcons name="check" size={20} color="#4CAF50" />
              <Text style={styles.approveButtonText}>Approve</Text>
            </TouchableOpacity>
          </>
        )}
        {currentPO.status === 'approved' && (
          <TouchableOpacity
            style={[styles.fullWidthButton, styles.sendButton]}
            onPress={handleSend}
          >
            <MaterialCommunityIcons name="send" size={20} color="#FFF" />
            <Text style={styles.sendButtonText}>Send to Supplier</Text>
          </TouchableOpacity>
        )}
        {['draft', 'sent', 'acknowledged'].includes(currentPO.status) && (
          <TouchableOpacity
            style={[styles.fullWidthButton, styles.cancelButton]}
            onPress={() => setShowCancelModal(true)}
          >
            <MaterialCommunityIcons name="cancel" size={20} color="#F44336" />
            <Text style={styles.cancelButtonText}>Cancel Order</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modals */}
      <ConfirmModal
        visible={showApproveModal}
        title="Approve Purchase Order"
        message={`Are you sure you want to approve ${currentPO.poNumber}? This will allow the order to proceed.`}
        confirmLabel="Approve"
        confirmColor="#4CAF50"
        onConfirm={handleApprove}
        onCancel={() => setShowApproveModal(false)}
      />

      <ConfirmModal
        visible={showRejectModal}
        title="Reject Purchase Order"
        message={`Please provide a reason for rejecting ${currentPO.poNumber}`}
        confirmLabel="Reject"
        confirmColor="#F44336"
        onConfirm={handleReject}
        onCancel={() => setShowRejectModal(false)}
      />

      <ConfirmModal
        visible={showCancelModal}
        title="Cancel Purchase Order"
        message={`Are you sure you want to cancel ${currentPO.poNumber}?`}
        confirmLabel="Cancel Order"
        confirmColor="#F44336"
        onConfirm={handleCancel}
        onCancel={() => setShowCancelModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  moreButton: {
    padding: 8,
    marginRight: -8,
  },
  deliveryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  deliveryBannerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#2196F3',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  supplierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  supplierInfo: {
    flex: 1,
  },
  supplierName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  supplierAddress: {
    fontSize: 13,
    color: '#666',
  },
  supplierActions: {
    flexDirection: 'row',
    gap: 8,
  },
  supplierAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingText: {
    fontSize: 13,
    color: '#666',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: '600',
  },
  totalRow: {
    borderBottomWidth: 0,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#1A1A1A',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    color: '#666',
  },
  itemCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  itemSku: {
    fontSize: 12,
    color: '#999',
  },
  itemStatus: {},
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemDetail: {
    alignItems: 'center',
  },
  itemDetailLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  itemDetailValue: {
    fontSize: 14,
    color: '#666',
  },
  itemDetailValueBold: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  deliveryProgress: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  addressRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  addressInfo: {
    flex: 1,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  directionsText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addPhotoText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  emptyPhotos: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyPhotosText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  photoThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 4,
    alignItems: 'center',
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  timelineDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  timelineNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
  },
  approveButton: {
    backgroundColor: '#E8F5E9',
  },
  approveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#FFEBEE',
  },
  rejectButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F44336',
  },
  fullWidthButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
  },
  sendButton: {
    backgroundColor: '#2196F3',
  },
  sendButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  cancelButton: {
    backgroundColor: '#FFEBEE',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F44336',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PODetailScreen;
