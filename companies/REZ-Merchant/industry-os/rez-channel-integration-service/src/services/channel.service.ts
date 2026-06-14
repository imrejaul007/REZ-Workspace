/**
 * Channel Integration Service - Business Logic
 */

import { v4 as uuidv4 } from 'uuid';
import {
  ChannelId,
  ChannelConnection,
  ConnectionStatus,
  RoomMapping,
  RatePlan,
  SyncLog,
  SyncType,
  NormalizedBooking,
  InventoryEntry,
  ChannelAnalytics,
  ChannelRevenue,
  ChannelCredentials,
} from '../models/channel.model.js';
import { CHANNEL_CONFIGS } from '../config/index.js';

// Re-export for use in routes
export { CHANNEL_CONFIGS } from '../config/index.js';

// In-memory stores
const connections = new Map<string, ChannelConnection>();
const roomMappings = new Map<string, RoomMapping>();
const ratePlans = new Map<string, RatePlan>();
const syncLogs = new Map<string, SyncLog>();
const bookings = new Map<string, NormalizedBooking>();

/**
 * Generate unique IDs
 */
function generateId(prefix: string): string {
  return `${prefix}-${uuidv4().slice(0, 8).toUpperCase()}`;
}

/**
 * Calculate commission for a booking
 */
export function calculateCommission(amount: number, channelId: ChannelId): number {
  const config = CHANNEL_CONFIGS[channelId];
  if (!config) return 0;
  return amount * config.commissionRate;
}

/**
 * Calculate net rate after commission
 */
export function calculateNetRate(baseRate: number, channelId: ChannelId): number {
  return baseRate - calculateCommission(baseRate, channelId);
}

// ============ Connection Management ============

export function createConnection(
  hotelId: string,
  channelId: ChannelId,
  credentials: ChannelCredentials
): ChannelConnection {
  const connection: ChannelConnection = {
    id: generateId('CONN'),
    hotelId,
    channelId,
    status: 'pending',
    credentials,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  connections.set(connection.id, connection);
  return connection;
}

export function getConnection(connectionId: string): ChannelConnection | undefined {
  return connections.get(connectionId);
}

export function getConnectionByHotelAndChannel(hotelId: string, channelId: ChannelId): ChannelConnection | undefined {
  return Array.from(connections.values()).find(
    c => c.hotelId === hotelId && c.channelId === channelId
  );
}

export function getConnectionsByHotel(hotelId: string): ChannelConnection[] {
  return Array.from(connections.values()).filter(c => c.hotelId === hotelId);
}

export function updateConnectionStatus(
  connectionId: string,
  status: ConnectionStatus,
  error?: string
): ChannelConnection | undefined {
  const connection = connections.get(connectionId);
  if (!connection) return undefined;

  connection.status = status;
  connection.lastError = error;
  connection.updatedAt = new Date();
  connections.set(connectionId, connection);
  return connection;
}

export function updateConnectionLastSync(connectionId: string): ChannelConnection | undefined {
  const connection = connections.get(connectionId);
  if (!connection) return undefined;

  connection.lastSync = new Date();
  connection.lastError = undefined;
  connection.updatedAt = new Date();
  connections.set(connectionId, connection);
  return connection;
}

export function deleteConnection(connectionId: string): boolean {
  return connections.delete(connectionId);
}

// ============ Room Mapping Management ============

export function createRoomMapping(
  hotelId: string,
  channelId: ChannelId,
  internalRoomId: string,
  channelRoomId: string,
  channelRoomName: string
): RoomMapping {
  const mapping: RoomMapping = {
    id: generateId('MAP'),
    hotelId,
    channelId,
    internalRoomId,
    channelRoomId,
    channelRoomName,
    isActive: true,
    createdAt: new Date(),
  };
  roomMappings.set(mapping.id, mapping);
  return mapping;
}

export function getRoomMapping(mappingId: string): RoomMapping | undefined {
  return roomMappings.get(mappingId);
}

export function getRoomMappingsByHotel(hotelId: string): RoomMapping[] {
  return Array.from(roomMappings.values()).filter(m => m.hotelId === hotelId);
}

export function getRoomMappingsByChannel(connectionId: string): RoomMapping[] {
  const connection = connections.get(connectionId);
  if (!connection) return [];
  return Array.from(roomMappings.values()).filter(
    m => m.hotelId === connection.hotelId && m.channelId === connection.channelId
  );
}

export function getRoomMappingsByInternalRoom(hotelId: string, internalRoomId: string): RoomMapping[] {
  return Array.from(roomMappings.values()).filter(
    m => m.hotelId === hotelId && m.internalRoomId === internalRoomId
  );
}

export function toggleRoomMapping(mappingId: string, isActive: boolean): RoomMapping | undefined {
  const mapping = roomMappings.get(mappingId);
  if (!mapping) return undefined;
  mapping.isActive = isActive;
  roomMappings.set(mappingId, mapping);
  return mapping;
}

// ============ Rate Plan Management ============

export function createRatePlan(
  hotelId: string,
  roomId: string,
  channelId: ChannelId,
  ratePlanId: string,
  rateName: string,
  baseRate: number,
  currency: string,
  restrictions?: Partial<RatePlan['restrictions']>
): RatePlan {
  const ratePlan: RatePlan = {
    id: generateId('RP'),
    hotelId,
    roomId,
    channelId,
    ratePlanId,
    rateName,
    baseRate,
    currency,
    restrictions: {
      minStay: restrictions?.minStay ?? 1,
      maxStay: restrictions?.maxStay ?? 14,
      closedToArrival: restrictions?.closedToArrival ?? false,
      closedToDeparture: restrictions?.closedToDeparture ?? false,
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  ratePlans.set(ratePlan.id, ratePlan);
  return ratePlan;
}

export function getRatePlan(ratePlanId: string): RatePlan | undefined {
  return ratePlans.get(ratePlanId);
}

export function getRatePlansByHotel(hotelId: string): RatePlan[] {
  return Array.from(ratePlans.values()).filter(rp => rp.hotelId === hotelId);
}

export function getRatePlansByChannel(hotelId: string, channelId: ChannelId): RatePlan[] {
  return Array.from(ratePlans.values()).filter(
    rp => rp.hotelId === hotelId && rp.channelId === channelId
  );
}

export function updateRatePlan(
  ratePlanId: string,
  updates: Partial<Pick<RatePlan, 'baseRate' | 'restrictions' | 'isActive'>>
): RatePlan | undefined {
  const ratePlan = ratePlans.get(ratePlanId);
  if (!ratePlan) return undefined;

  if (updates.baseRate !== undefined) ratePlan.baseRate = updates.baseRate;
  if (updates.restrictions) {
    ratePlan.restrictions = { ...ratePlan.restrictions, ...updates.restrictions };
  }
  if (updates.isActive !== undefined) ratePlan.isActive = updates.isActive;
  ratePlan.updatedAt = new Date();

  ratePlans.set(ratePlanId, ratePlan);
  return ratePlan;
}

// ============ Sync Log Management ============

export function createSyncLog(
  hotelId: string,
  channelId: ChannelId,
  syncType: SyncType
): SyncLog {
  const log: SyncLog = {
    id: generateId('SYNC'),
    hotelId,
    channelId,
    syncType,
    status: 'pending',
    startedAt: new Date(),
    createdAt: new Date(),
  };
  syncLogs.set(log.id, log);
  return log;
}

export function getSyncLog(logId: string): SyncLog | undefined {
  return syncLogs.get(logId);
}

export function getSyncLogsByHotel(hotelId: string): SyncLog[] {
  return Array.from(syncLogs.values())
    .filter(l => l.hotelId === hotelId)
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
}

export function getSyncLogsByChannel(hotelId: string, channelId: ChannelId): SyncLog[] {
  return Array.from(syncLogs.values())
    .filter(l => l.hotelId === hotelId && l.channelId === channelId)
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
}

export function updateSyncLog(
  logId: string,
  updates: Partial<Pick<SyncLog, 'status' | 'completedAt' | 'duration' | 'totalRecords' | 'syncedRecords' | 'failedRecords' | 'errors'>>
): SyncLog | undefined {
  const log = syncLogs.get(logId);
  if (!log) return undefined;

  if (updates.status) log.status = updates.status;
  if (updates.completedAt) log.completedAt = updates.completedAt;
  if (updates.duration) log.duration = updates.duration;
  if (updates.totalRecords !== undefined) log.totalRecords = updates.totalRecords;
  if (updates.syncedRecords !== undefined) log.syncedRecords = updates.syncedRecords;
  if (updates.failedRecords !== undefined) log.failedRecords = updates.failedRecords;
  if (updates.errors) log.errors = updates.errors;

  syncLogs.set(logId, log);
  return log;
}

// ============ Booking Management ============

export function normalizeBooking(
  booking: Record<string, unknown>,
  channelId: ChannelId
): NormalizedBooking {
  const getField = (fields: string[]): unknown => {
    for (const field of fields) {
      const value = booking[field];
      if (value !== undefined && value !== null) return value;
    }
    return undefined;
  };

  return {
    channelBookingId: String(getField(['id', 'reservation_id', 'confirmation', 'booking_id']) || ''),
    channel: channelId,
    guestName: String(getField(['guest_name', 'guestName', 'name', 'guest']) || 'Unknown'),
    guestEmail: getField(['guest_email', 'email', 'email_address']) as string | undefined,
    guestPhone: getField(['phone', 'guest_phone', 'phone_number']) as string | undefined,
    checkinDate: new Date(getField(['checkin', 'check_in', 'arrival', 'checkIn']) as string || Date.now()),
    checkoutDate: new Date(getField(['checkout', 'check_out', 'departure', 'checkOut']) as string || Date.now()),
    totalAmount: Number(getField(['amount', 'total', 'price', 'total_amount']) || 0),
    currency: String(getField(['currency']) || 'INR'),
    roomId: String(getField(['room_id', 'roomId', 'room']) || ''),
    guestCount: Number(getField(['guests', 'guest_count', 'adults']) || 1),
    specialRequests: getField(['requests', 'special_requests', 'notes']) as string | undefined,
    status: (getField(['status']) as NormalizedBooking['status']) || 'confirmed',
    rawData: booking,
  };
}

export function createBooking(booking: NormalizedBooking): NormalizedBooking {
  const id = generateId('BKG');
  const fullBooking = { ...booking, channelBookingId: booking.channelBookingId || id };
  bookings.set(fullBooking.channelBookingId, fullBooking);
  return fullBooking;
}

export function getBooking(channelBookingId: string): NormalizedBooking | undefined {
  return bookings.get(channelBookingId);
}

export function getBookingsByHotel(hotelId: string): NormalizedBooking[] {
  const hotelConnections = getConnectionsByHotel(hotelId);
  const channelIds = hotelConnections.map(c => c.channelId);
  return Array.from(bookings.values()).filter(b => channelIds.includes(b.channel));
}

export function getBookingsByChannel(_hotelId: string, channelId: ChannelId): NormalizedBooking[] {
  return Array.from(bookings.values()).filter(b => b.channel === channelId);
}

export function updateBookingStatus(
  channelBookingId: string,
  status: NormalizedBooking['status']
): NormalizedBooking | undefined {
  const booking = bookings.get(channelBookingId);
  if (!booking) return undefined;
  booking.status = status;
  bookings.set(channelBookingId, booking);
  return booking;
}

// ============ Inventory Formatting ============

export function formatInventoryForChannel(
  inventory: InventoryEntry[],
  channelId: ChannelId
): Record<string, unknown>[] {
  switch (channelId) {
    case 'booking_com':
      return inventory.map(inv => ({
        room_id: inv.roomId,
        date: inv.date,
        availability: inv.available,
        price: inv.price,
      }));
    case 'makemytrip':
      return inventory.map(inv => ({
        room_type_id: inv.roomId,
        date: inv.date,
        available_count: inv.available,
        rate: inv.price,
      }));
    case 'goibibo':
      return inventory.map(inv => ({
        room_id: inv.roomId,
        stay_date: inv.date,
        inventory: inv.available,
        rate: inv.price,
      }));
    case 'expedia':
      return inventory.map(inv => ({
        roomTypeId: inv.roomId,
        date: inv.date,
        totalInventoryCount: inv.available,
        rateAmount: inv.price,
      }));
    default:
      return inventory.map(inv => ({
        roomId: inv.roomId,
        date: inv.date,
        available: inv.available,
        price: inv.price,
      }));
  }
}

// ============ API Request Building ============

export function buildChannelHeaders(credentials: ChannelCredentials, channelId: ChannelId): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  switch (channelId) {
    case 'makemytrip':
      if (credentials.apiKey) headers['Authorization'] = `Bearer ${credentials.apiKey}`;
      if (credentials.partnerId) headers['X-Partner-Id'] = credentials.partnerId;
      break;
    case 'expedia':
      if (credentials.apiKey) headers['Authorization'] = `Bearer ${credentials.apiKey}`;
      break;
    case 'goibibo':
      if (credentials.clientId) headers['X-Client-Id'] = credentials.clientId;
      if (credentials.clientSecret) headers['X-Client-Secret'] = credentials.clientSecret;
      break;
    case 'airbnb':
      if (credentials.accessToken) headers['Authorization'] = `Bearer ${credentials.accessToken}`;
      break;
    case 'google_hotel':
      if (credentials.apiKey) headers['Authorization'] = `Bearer ${credentials.apiKey}`;
      break;
  }

  return headers;
}

export function buildBookingComXML(data: {
  username: string;
  password: string;
  hotelId: string;
  action: string;
  payload: Record<string, unknown>;
}): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>';
  xml += `<${data.action}>`;
  xml += `<Username>${data.username}</Username>`;
  xml += `<Password>${data.password}</Password>`;
  xml += `<HotelId>${data.hotelId}</HotelId>`;
  for (const [key, value] of Object.entries(data.payload)) {
    xml += `<${key}>${value}</${key}>`;
  }
  xml += `</${data.action}>`;
  return xml;
}

// ============ Analytics ============

export function getChannelAnalytics(
  hotelId: string,
  channelId: ChannelId,
  period: number = 30
): ChannelAnalytics {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - period);

  const channelBookings = getBookingsByChannel(hotelId, channelId)
    .filter(b => b.checkinDate >= cutoffDate);

  const totalRevenue = channelBookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const commissionPaid = calculateCommission(totalRevenue, channelId);

  // Calculate ADR (Average Daily Rate)
  const avgDailyRate = channelBookings.length > 0
    ? totalRevenue / channelBookings.length
    : 0;

  // Calculate estimated occupancy (simplified)
  const occupancyRate = Math.min(100, (channelBookings.length / period) * 100);

  return {
    channelId,
    period: `${period} days`,
    totalBookings: channelBookings.length,
    totalRevenue,
    netRevenue: totalRevenue - commissionPaid,
    avgDailyRate: Math.round(avgDailyRate),
    occupancyRate: Math.round(occupancyRate * 10) / 10,
    commissionPaid,
    conversionRate: 0, // Would need views data
    views: 0, // Would need views data
  };
}

export function getRevenueByChannel(hotelId: string): ChannelRevenue[] {
  const hotelConnections = getConnectionsByHotel(hotelId);
  const revenues: ChannelRevenue[] = [];

  for (const conn of hotelConnections) {
    const channelBookings = getBookingsByChannel(hotelId, conn.channelId);
    const totalRevenue = channelBookings.reduce((sum, b) => sum + b.totalAmount, 0);

    revenues.push({
      channelId: conn.channelId,
      revenue: totalRevenue,
      bookings: channelBookings.length,
      avgBookingValue: channelBookings.length > 0 ? totalRevenue / channelBookings.length : 0,
    });
  }

  return revenues.sort((a, b) => b.revenue - a.revenue);
}

export function getTotalRevenue(hotelId: string): {
  total: number;
  byChannel: ChannelRevenue[];
  netAfterCommission: number;
} {
  const byChannel = getRevenueByChannel(hotelId);
  const total = byChannel.reduce((sum, r) => sum + r.revenue, 0);
  const netAfterCommission = byChannel.reduce((sum, r) => {
    return sum + r.revenue - calculateCommission(r.revenue, r.channelId);
  }, 0);

  return { total, byChannel, netAfterCommission };
}

// ============ Utility Functions ============

export function getSupportedChannels(): Array<{ id: ChannelId; name: string; commissionRate: number }> {
  return Object.entries(CHANNEL_CONFIGS).map(([id, config]) => ({
    id: id as ChannelId,
    name: config.name,
    commissionRate: config.commissionRate,
  }));
}

export function isChannelSupported(channelId: string): channelId is ChannelId {
  return channelId in CHANNEL_CONFIGS;
}

// Reset store for testing
export function resetStore(): void {
  connections.clear();
  roomMappings.clear();
  ratePlans.clear();
  syncLogs.clear();
  bookings.clear();
}
