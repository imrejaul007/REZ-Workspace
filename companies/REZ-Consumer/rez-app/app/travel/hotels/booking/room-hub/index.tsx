// @ts-nocheck
/**
 * Room Hub - Hotel QR Room Operating System
 * Route: /travel/hotels/booking/room-hub/[bookingId]
 *
 * Guests can access room services from their active booking:
 * - Housekeeping (room cleaning, towels, toiletries)
 * - Room Service (food & beverages)
 * - Laundry
 * - Transport
 * - Spa & Wellness
 * - Maintenance
 * - Concierge
 * - Chat with staff
 * - View service requests
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  TextInput,
  Modal,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { showToast } from '@/components/common/ToastManager';
import {
  getHotelBookingById,
  getRoomServiceMenu,
  getMyRoomServiceRequests,
  createRoomServiceRequest,
  getOrCreateChatThread,
  getChatThread,
  sendChatMessage,
  markChatRead,
  OtaBooking,
  RoomServiceMenu,
  RoomServiceRequest,
  RoomServiceItem,
  RoomServiceType,
  ChatThread,
  ChatMessage,
} from '@/services/hotelOtaApi';

const C = {
  bg: '#F8FAFC',
  white: '#FFFFFF',
  cyan: '#06B6D4',
  cyanDark: '#0891B2',
  navy: '#0F172A',
  slate: '#64748B',
  slate200: '#E2E8F0',
  green: '#16A34A',
  gold: '#F59E0B',
  red: '#EF4444',
  amber: '#F59E0B',
  orange: '#F97316',
  purple: '#8B5CF6',
  pink: '#EC4899',
};

const SERVICE_CATEGORIES = [
  { id: 'housekeeping', label: 'Housekeeping', icon: 'sparkles', color: '#3B82F6', bg: '#EFF6FF' },
  { id: 'room_service', label: 'Room Service', icon: 'restaurant', color: '#F97316', bg: '#FFF7ED' },
  { id: 'laundry', label: 'Laundry', icon: 'shirt', color: '#8B5CF6', bg: '#F5F3FF' },
  { id: 'maintenance', label: 'Maintenance', icon: 'build', color: '#EAB308', bg: '#FEFCE8' },
  { id: 'spa', label: 'Spa & Wellness', icon: 'spa', color: '#EC4899', bg: '#FDF2F8' },
  { id: 'transport', label: 'Transport', icon: 'car', color: '#6366F1', bg: '#EEF2FF' },
  { id: 'concierge', label: 'Concierge', icon: 'person', color: '#10B981', bg: '#ECFDF5' },
  { id: 'fitness', label: 'Fitness', icon: 'fitness', color: '#EF4444', bg: '#FEF2F2' },
] as const;

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  pending: { color: C.amber, bg: '#FEF3C7', label: 'Pending' },
  assigned: { color: C.cyan, bg: '#CFFAFE', label: 'Assigned' },
  in_progress: { color: C.orange, bg: '#FFEDD5', label: 'In Progress' },
  completed: { color: C.green, bg: '#DCFCE7', label: 'Completed' },
  cancelled: { color: C.red, bg: '#FEE2E2', label: 'Cancelled' },
};

function paise(p: number) {
  return `₹${Math.round(p / 100).toLocaleString()}`;
}

function ServiceCard({ service, onPress }: { service: (typeof SERVICE_CATEGORIES)[number]; onPress: () => void }) {
  return (
    <Pressable style={styles.serviceCard} onPress={onPress}>
      <View style={[styles.serviceIconWrap, { backgroundColor: service.bg }]}>
        <Ionicons name={service.icon as unknown} size={28} color={service.color} />
      </View>
      <Text style={styles.serviceLabel}>{service.label}</Text>
    </Pressable>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
      <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

export default function RoomHubScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();

  const [booking, setBooking] = useState<OtaBooking | null>(null);
  const [menu, setMenu] = useState<RoomServiceMenu | null>(null);
  const [requests, setRequests] = useState<RoomServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'services' | 'requests' | 'chat'>('services');

  // Cart state
  const [cartItems, setCartItems] = useState<{ item: RoomServiceItem; qty: number }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('room_service');
  const [showCart, setShowCart] = useState(false);
  const [specialRequest, setSpecialRequest] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Chat state
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const fetchData = useCallback(async () => {
    if (!bookingId) return;
    try {
      const [b, menuData, reqData] = await Promise.all([
        getHotelBookingById(bookingId),
        getRoomServiceMenu('default'),
        getMyRoomServiceRequests({ limit: 20 }),
      ]);
      setBooking(b);
      setMenu(menuData);
      setRequests(reqData.requests);
    } catch (e) {
      logger.error('Failed to load room hub data', e);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  const initChat = useCallback(async () => {
    if (!bookingId) return;
    try {
      const { threadId } = await getOrCreateChatThread({
        bookingId,
        roomId: 'default',
      });
      const chatData = await getChatThread(threadId);
      setThread(chatData.thread as unknown);
      setMessages(chatData.messages);
      markChatRead(threadId).catch(() => {});
    } catch (e) {
      logger.error('Failed to init chat', e);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (activeTab === 'chat') {
      initChat();
    }
  }, [activeTab, initChat]);

  const addToCart = (item: RoomServiceItem) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.item.id === item.id);
      if (existing) {
        return prev.map((i) => (i.item.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { item, qty: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.item.id === itemId);
      if (existing && existing.qty > 1) {
        return prev.map((i) => (i.item.id === itemId ? { ...i, qty: i.qty - 1 } : i));
      }
      return prev.filter((i) => i.item.id !== itemId);
    });
  };

  const cartTotal = cartItems.reduce((sum, i) => sum + i.item.price * i.qty, 0);
  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0);

  const handleQuickRequest = async (serviceType: RoomServiceType) => {
    if (!bookingId) return;
    setSubmitting(true);
    try {
      await createRoomServiceRequest({
        bookingId,
        roomId: 'default',
        serviceType,
        description: `Quick request via Room Hub`,
        priority: 'now',
      });
      showToast({ type: 'success', message: `${serviceType.replace('_', ' ')} request submitted!` });
      fetchData();
    } catch (e) {
      showToast({ type: 'error', message: e.message ?? 'Failed to submit request' });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!bookingId || cartItems.length === 0) return;
    setSubmitting(true);
    try {
      await createRoomServiceRequest({
        bookingId,
        roomId: 'default',
        serviceType: 'room_service',
        description: specialRequest || undefined,
        items: cartItems.map((i) => ({
          id: i.item.id,
          name: i.item.name,
          price: i.item.price,
          quantity: i.qty,
          category: i.item.category,
        })),
        priority: 'now',
      });
      setCartItems([]);
      setSpecialRequest('');
      setShowCart(false);
      showToast({ type: 'success', message: 'Order placed successfully!' });
      fetchData();
    } catch (e) {
      showToast({ type: 'error', message: e.message ?? 'Failed to place order' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !thread) return;
    setSendingMessage(true);
    const content = newMessage.trim();
    setNewMessage('');
    try {
      const msg = await sendChatMessage({ threadId: thread.id, content });
      setMessages((prev) => [...prev, msg]);
    } catch (e) {
      showToast({ type: 'error', message: 'Failed to send message' });
    } finally {
      setSendingMessage(false);
    }
  };

  const getMenuItems = () => {
    if (!menu) return [];
    const catMap: Record<string, keyof RoomServiceMenu> = {
      room_service: 'meals',
      housekeeping: 'housekeeping',
      laundry: 'laundry',
    };
    const key = catMap[selectedCategory] ?? 'snacks';
    return (menu as unknown)[key] ?? [];
  };

  if (loading) {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: C.bg }]}>
        <ActivityIndicator size="large" color={C.cyan} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={[styles.center, { flex: 1, backgroundColor: C.bg }]}>
        <Ionicons name="alert-circle-outline" size={48} color={C.slate} />
        <Text style={{ color: C.slate, marginTop: 12 }}>Booking not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <LinearGradient colors={[C.cyanDark, C.cyan]} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Room Services</Text>
          <Text style={styles.headerSubtitle}>{booking.hotelName}</Text>
        </View>
        {cartCount > 0 && (
          <Pressable style={styles.cartBtn} onPress={() => setShowCart(true)}>
            <Ionicons name="cart" size={22} color="#fff" />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          </Pressable>
        )}
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['services', 'requests', 'chat'] as const).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Ionicons
              name={tab === 'services' ? 'grid' : tab === 'requests' ? 'list' : 'chatbubble-ellipses'}
              size={18}
              color={activeTab === tab ? C.cyan : C.slate}
            />
            <Text style={[styles.tabText, activeTab === tab && { color: C.cyan, fontWeight: '700' }]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
      >
        {activeTab === 'services' && (
          <>
            {/* Quick Actions Grid */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Request Services</Text>
              <View style={styles.servicesGrid}>
                {SERVICE_CATEGORIES.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onPress={() => handleQuickRequest(service.id as RoomServiceType)}
                  />
                ))}
              </View>
            </View>

            {/* Room Service Menu */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Order Food & Drinks</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {['room_service', 'laundry'].map((cat) => {
                  const s = SERVICE_CATEGORIES.find((x) => x.id === cat);
                  return (
                    <Pressable
                      key={cat}
                      style={[
                        styles.categoryChip,
                        selectedCategory === cat && { backgroundColor: s?.bg, borderColor: s?.color },
                      ]}
                      onPress={() => setSelectedCategory(cat)}
                    >
                      <Text style={[styles.categoryChipText, selectedCategory === cat && { color: s?.color }]}>
                        {s?.label ?? cat}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={styles.menuItems}>
                {getMenuItems().map((item: RoomServiceItem) => {
                  const inCart = cartItems.find((i) => i.item.id === item.id);
                  return (
                    <View key={item.id} style={styles.menuItem}>
                      <View style={styles.menuItemInfo}>
                        <Text style={styles.menuItemName}>{item.name}</Text>
                        <Text style={styles.menuItemPrice}>{item.price === 0 ? 'Free' : paise(item.price)}</Text>
                      </View>
                      <View style={styles.menuItemActions}>
                        {inCart ? (
                          <View style={styles.qtyControl}>
                            <Pressable onPress={() => removeFromCart(item.id)} style={styles.qtyBtn}>
                              <Ionicons name="remove" size={16} color={C.cyan} />
                            </Pressable>
                            <Text style={styles.qtyText}>{inCart.qty}</Text>
                            <Pressable onPress={() => addToCart(item)} style={styles.qtyBtn}>
                              <Ionicons name="add" size={16} color={C.cyan} />
                            </Pressable>
                          </View>
                        ) : (
                          <Pressable style={styles.addBtn} onPress={() => addToCart(item)}>
                            <Ionicons name="add" size={16} color="#fff" />
                          </Pressable>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Special Request */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Special Request</Text>
              <TextInput
                style={styles.specialInput}
                placeholder="Describe unknown special request..."
                placeholderTextColor={C.slate}
                multiline
                numberOfLines={3}
                value={specialRequest}
                onChangeText={setSpecialRequest}
              />
            </View>
          </>
        )}

        {activeTab === 'requests' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Requests</Text>
            {requests.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={48} color={C.slate200} />
                <Text style={styles.emptyText}>No service requests yet</Text>
                <Text style={styles.emptySubtext}>Use the services tab to request housekeeping, food, and more.</Text>
              </View>
            ) : (
              requests.map((req) => {
                const cat = SERVICE_CATEGORIES.find((c) => c.id === req.serviceType);
                return (
                  <View key={req.id} style={styles.requestCard}>
                    <View style={styles.requestHeader}>
                      <View style={styles.requestIcon}>
                        <Ionicons name={(cat?.icon as unknown) ?? 'help-circle'} size={20} color={cat?.color ?? C.slate} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.requestTitle}>{req.serviceType.replace('_', ' ')}</Text>
                        <Text style={styles.requestTime}>{new Date(req.createdAt).toLocaleString()}</Text>
                      </View>
                      <StatusBadge status={req.status} />
                    </View>
                    {req.description && <Text style={styles.requestDesc}>{req.description}</Text>}
                    {req.items && req.items.length > 0 && (
                      <View style={styles.requestItems}>
                        {req.items.map((item, idx) => (
                          <Text key={idx} style={styles.requestItemText}>
                            {item.quantity}x {item.name}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        {activeTab === 'chat' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chat with Staff</Text>
            {!thread ? (
              <ActivityIndicator color={C.cyan} style={{ marginTop: 20 }} />
            ) : (
              <>
                <View style={styles.chatMessages}>
                  {messages.map((msg) => (
                    <View
                      key={msg.id}
                      style={[
                        styles.chatBubble,
                        msg.senderType === 'guest' ? styles.chatBubbleGuest : styles.chatBubbleStaff,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chatBubbleText,
                          msg.senderType === 'guest' ? styles.chatBubbleTextGuest : styles.chatBubbleTextStaff,
                        ]}
                      >
                        {msg.content}
                      </Text>
                      <Text style={styles.chatTime}>{new Date(msg.createdAt).toLocaleTimeString()}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.chatInput}>
                  <TextInput
                    style={styles.chatTextInput}
                    placeholder="Type a message..."
                    placeholderTextColor={C.slate}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    onSubmitEditing={handleSendMessage}
                  />
                  <Pressable
                    style={[styles.sendBtn, !newMessage.trim() && styles.sendBtnDisabled]}
                    onPress={handleSendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                  >
                    {sendingMessage ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons name="send" size={20} color="#fff" />
                    )}
                  </Pressable>
                </View>
              </>
            )}
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Cart Modal */}
      <Modal visible={showCart} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your Order</Text>
              <Pressable onPress={() => setShowCart(false)}>
                <Ionicons name="close" size={24} color={C.navy} />
              </Pressable>
            </View>

            {cartItems.length === 0 ? (
              <Text style={styles.emptyText}>Your cart is empty</Text>
            ) : (
              <>
                {cartItems.map(({ item, qty }) => (
                  <View key={item.id} style={styles.cartItem}>
                    <Text style={styles.cartItemName}>
                      {qty}x {item.name}
                    </Text>
                    <Text style={styles.cartItemPrice}>{paise(item.price * qty)}</Text>
                  </View>
                ))}
                <View style={styles.cartTotal}>
                  <Text style={styles.cartTotalLabel}>Total</Text>
                  <Text style={styles.cartTotalValue}>{paise(cartTotal)}</Text>
                </View>
                <Pressable
                  style={[styles.orderBtn, submitting && styles.orderBtnDisabled]}
                  onPress={handlePlaceOrder}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.orderBtnText}>Place Order • {paise(cartTotal)}</Text>
                  )}
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerContent: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  cartBtn: { padding: 8, position: 'relative' },
  cartBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: C.red,
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.slate200,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
  },
  tabActive: { borderBottomWidth: 2, borderBottomColor: C.cyan },
  tabText: { fontSize: 13, color: C.slate, fontWeight: '500' },
  content: { padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.navy, marginBottom: 14 },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  serviceCard: {
    width: '30%',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  serviceIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceLabel: { fontSize: 11, fontWeight: '600', color: C.navy, textAlign: 'center' },
  categoryScroll: { marginBottom: 12 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.slate200,
    marginRight: 8,
  },
  categoryChipText: { fontSize: 13, fontWeight: '500', color: C.slate },
  menuItems: { gap: 8 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  menuItemInfo: { flex: 1 },
  menuItemName: { fontSize: 14, fontWeight: '600', color: C.navy },
  menuItemPrice: { fontSize: 13, color: C.cyan, fontWeight: '600', marginTop: 2 },
  menuItemActions: { flexDirection: 'row', alignItems: 'center' },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.cyan,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    borderRadius: 16,
    paddingHorizontal: 8,
    gap: 8,
  },
  qtyBtn: { padding: 4 },
  qtyText: { fontSize: 14, fontWeight: '600', color: C.navy, minWidth: 20, textAlign: 'center' },
  specialInput: {
    backgroundColor: C.white,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: C.navy,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: C.slate, marginTop: 12, fontWeight: '500' },
  emptySubtext: { fontSize: 12, color: C.slate, marginTop: 4, textAlign: 'center' },
  requestCard: {
    backgroundColor: C.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  requestHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  requestIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestTitle: { fontSize: 14, fontWeight: '600', color: C.navy, textTransform: 'capitalize' },
  requestTime: { fontSize: 11, color: C.slate, marginTop: 2 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  requestDesc: { fontSize: 13, color: C.slate, marginTop: 10 },
  requestItems: { marginTop: 8, gap: 4 },
  requestItemText: { fontSize: 12, color: C.navy },
  chatMessages: { maxHeight: 400, marginBottom: 12 },
  chatBubble: {
    maxWidth: '80%',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  chatBubbleGuest: { alignSelf: 'flex-end', backgroundColor: C.cyan },
  chatBubbleStaff: { alignSelf: 'flex-start', backgroundColor: C.white },
  chatBubbleText: { fontSize: 14 },
  chatBubbleTextGuest: { color: '#fff' },
  chatBubbleTextStaff: { color: C.navy },
  chatTime: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  chatInput: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  chatTextInput: {
    flex: 1,
    backgroundColor: C.white,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: C.navy,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.cyan,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: C.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.navy },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.slate200,
  },
  cartItemName: { fontSize: 14, color: C.navy },
  cartItemPrice: { fontSize: 14, fontWeight: '600', color: C.navy },
  cartTotal: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, marginTop: 8 },
  cartTotalLabel: { fontSize: 16, fontWeight: '700', color: C.navy },
  cartTotalValue: { fontSize: 18, fontWeight: '800', color: C.cyan },
  orderBtn: {
    backgroundColor: C.cyan,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  orderBtnDisabled: { opacity: 0.6 },
  orderBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
