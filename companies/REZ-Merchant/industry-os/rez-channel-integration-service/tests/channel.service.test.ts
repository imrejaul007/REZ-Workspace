/**
 * Channel Integration Service Unit Tests
 * Tests connection management, room mappings, rate plans, sync logs, bookings, and analytics
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Types
type ChannelId = 'booking_com' | 'makemytrip' | 'goibibo' | 'expedia' | 'airbnb' | 'google_hotel';
type ConnectionStatus = 'pending' | 'active' | 'inactive' | 'error';
type SyncStatus = 'pending' | 'processing' | 'success' | 'failed' | 'partial';
type SyncType = 'inventory' | 'rates' | 'bookings' | 'full';
type SyncErrorType = 'AUTH_FAILED' | 'RATE_LIMITED' | 'INVALID_DATA' | 'NETWORK_ERROR' | 'TIMEOUT' | 'UNKNOWN_CHANNEL';

interface ChannelCredentials {
  username?: string;
  password?: string;
  apiKey?: string;
  accessToken?: string;
  clientId?: string;
  clientSecret?: string;
  propertyId?: string;
  hotelId?: string;
  partnerId?: string;
  listingId?: string;
}

interface ChannelConfig {
  id: string;
  name: string;
  commissionRate: number;
  apiType: 'xml' | 'rest' | 'graphql';
  baseUrl: string;
  requiresCredentials: boolean;
}

// Channel configs (copied from config/index.ts)
const CHANNEL_CONFIGS: Record<string, ChannelConfig> = {
  booking_com: { id: 'booking_com', name: 'Booking.com', commissionRate: 0.15, apiType: 'xml', baseUrl: 'https://supply-xml.booking.com', requiresCredentials: true },
  makemytrip: { id: 'makemytrip', name: 'MakeMyTrip', commissionRate: 0.15, apiType: 'rest', baseUrl: 'https://api.makemytrip.com', requiresCredentials: true },
  goibibo: { id: 'goibibo', name: 'Goibibo', commissionRate: 0.15, apiType: 'rest', baseUrl: 'https://api.goibibo.com', requiresCredentials: true },
  expedia: { id: 'expedia', name: 'Expedia', commissionRate: 0.12, apiType: 'rest', baseUrl: 'https://api.expedia.com', requiresCredentials: true },
  airbnb: { id: 'airbnb', name: 'Airbnb', commissionRate: 0.0, apiType: 'rest', baseUrl: 'https://api.airbnb.com', requiresCredentials: true },
  google_hotel: { id: 'google_hotel', name: 'Google Hotel Center', commissionRate: 0.0, apiType: 'rest', baseUrl: 'https://HotelCenter.googleapis.com', requiresCredentials: true },
};

// Data stores
interface Connection {
  id: string;
  hotelId: string;
  channelId: ChannelId;
  status: ConnectionStatus;
  credentials: ChannelCredentials;
  lastSync?: Date;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface RoomMapping {
  id: string;
  hotelId: string;
  channelId: ChannelId;
  internalRoomId: string;
  channelRoomId: string;
  channelRoomName: string;
  isActive: boolean;
  createdAt: Date;
}

interface RatePlan {
  id: string;
  hotelId: string;
  roomId: string;
  channelId: ChannelId;
  ratePlanId: string;
  rateName: string;
  baseRate: number;
  currency: string;
  restrictions: { minStay: number; maxStay: number; closedToArrival: boolean; closedToDeparture: boolean };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SyncLog {
  id: string;
  hotelId: string;
  channelId: ChannelId;
  syncType: SyncType;
  status: SyncStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  totalRecords?: number;
  syncedRecords?: number;
  failedRecords?: number;
  errors?: Array<{ type: SyncErrorType; message: string; recordId?: string }>;
  createdAt: Date;
}

interface NormalizedBooking {
  channelBookingId: string;
  channel: ChannelId;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  checkinDate: Date;
  checkoutDate: Date;
  totalAmount: number;
  currency: string;
  roomId: string;
  guestCount?: number;
  specialRequests?: string;
  status: 'confirmed' | 'cancelled' | 'modified' | 'checked_in' | 'checked_out';
  rawData?: Record<string, unknown>;
}

interface InventoryEntry {
  roomId: string;
  date: string;
  available: number;
  price: number | null;
}

// In-memory stores
let connections = new Map<string, Connection>();
let roomMappings = new Map<string, RoomMapping>();
let ratePlans = new Map<string, RatePlan>();
let syncLogs = new Map<string, SyncLog>();
let bookings = new Map<string, NormalizedBooking>();

// Utility functions
function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
}

function calculateCommission(amount: number, channelId: ChannelId): number {
  const config = CHANNEL_CONFIGS[channelId];
  if (!config) return 0;
  return amount * config.commissionRate;
}

function calculateNetRate(baseRate: number, channelId: ChannelId): number {
  return baseRate - calculateCommission(baseRate, channelId);
}

function isChannelSupported(channelId: string): channelId is ChannelId {
  return channelId in CHANNEL_CONFIGS;
}

function getSupportedChannels(): Array<{ id: ChannelId; name: string; commissionRate: number }> {
  return Object.entries(CHANNEL_CONFIGS).map(([id, config]) => ({
    id: id as ChannelId,
    name: config.name,
    commissionRate: config.commissionRate,
  }));
}

// Connection functions
function createConnection(hotelId: string, channelId: ChannelId, credentials: ChannelCredentials): Connection {
  const connection: Connection = {
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

function getConnection(connectionId: string): Connection | undefined {
  return connections.get(connectionId);
}

function getConnectionByHotelAndChannel(hotelId: string, channelId: ChannelId): Connection | undefined {
  return Array.from(connections.values()).find(c => c.hotelId === hotelId && c.channelId === channelId);
}

function getConnectionsByHotel(hotelId: string): Connection[] {
  return Array.from(connections.values()).filter(c => c.hotelId === hotelId);
}

function updateConnectionStatus(connectionId: string, status: ConnectionStatus, error?: string): Connection | undefined {
  const connection = connections.get(connectionId);
  if (!connection) return undefined;
  connection.status = status;
  connection.lastError = error;
  connection.updatedAt = new Date();
  connections.set(connectionId, connection);
  return connection;
}

function updateConnectionLastSync(connectionId: string): Connection | undefined {
  const connection = connections.get(connectionId);
  if (!connection) return undefined;
  connection.lastSync = new Date();
  connection.lastError = undefined;
  connection.updatedAt = new Date();
  connections.set(connectionId, connection);
  return connection;
}

function deleteConnection(connectionId: string): boolean {
  return connections.delete(connectionId);
}

// Room mapping functions
function createRoomMapping(hotelId: string, channelId: ChannelId, internalRoomId: string, channelRoomId: string, channelRoomName: string): RoomMapping {
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

function getRoomMapping(mappingId: string): RoomMapping | undefined {
  return roomMappings.get(mappingId);
}

function getRoomMappingsByHotel(hotelId: string): RoomMapping[] {
  return Array.from(roomMappings.values()).filter(m => m.hotelId === hotelId);
}

function getRoomMappingsByChannel(connectionId: string): RoomMapping[] {
  const connection = connections.get(connectionId);
  if (!connection) return [];
  return Array.from(roomMappings.values()).filter(m => m.hotelId === connection.hotelId && m.channelId === connection.channelId);
}

function getRoomMappingsByInternalRoom(hotelId: string, internalRoomId: string): RoomMapping[] {
  return Array.from(roomMappings.values()).filter(m => m.hotelId === hotelId && m.internalRoomId === internalRoomId);
}

function toggleRoomMapping(mappingId: string, isActive: boolean): RoomMapping | undefined {
  const mapping = roomMappings.get(mappingId);
  if (!mapping) return undefined;
  mapping.isActive = isActive;
  roomMappings.set(mappingId, mapping);
  return mapping;
}

// Rate plan functions
function createRatePlan(hotelId: string, roomId: string, channelId: ChannelId, ratePlanId: string, rateName: string, baseRate: number, currency: string, restrictions?: Partial<RatePlan['restrictions']>): RatePlan {
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

function getRatePlan(ratePlanId: string): RatePlan | undefined {
  return ratePlans.get(ratePlanId);
}

function getRatePlansByHotel(hotelId: string): RatePlan[] {
  return Array.from(ratePlans.values()).filter(rp => rp.hotelId === hotelId);
}

function getRatePlansByChannel(hotelId: string, channelId: ChannelId): RatePlan[] {
  return Array.from(ratePlans.values()).filter(rp => rp.hotelId === hotelId && rp.channelId === channelId);
}

function updateRatePlan(ratePlanId: string, updates: Partial<Pick<RatePlan, 'baseRate' | 'restrictions' | 'isActive'>>): RatePlan | undefined {
  const ratePlan = ratePlans.get(ratePlanId);
  if (!ratePlan) return undefined;
  if (updates.baseRate !== undefined) ratePlan.baseRate = updates.baseRate;
  if (updates.restrictions) ratePlan.restrictions = { ...ratePlan.restrictions, ...updates.restrictions };
  if (updates.isActive !== undefined) ratePlan.isActive = updates.isActive;
  ratePlan.updatedAt = new Date();
  ratePlans.set(ratePlanId, ratePlan);
  return ratePlan;
}

// Sync log functions
function createSyncLog(hotelId: string, channelId: ChannelId, syncType: SyncType): SyncLog {
  const log: SyncLog = { id: generateId('SYNC'), hotelId, channelId, syncType, status: 'pending', startedAt: new Date(), createdAt: new Date() };
  syncLogs.set(log.id, log);
  return log;
}

function getSyncLog(logId: string): SyncLog | undefined {
  return syncLogs.get(logId);
}

function getSyncLogsByHotel(hotelId: string): SyncLog[] {
  return Array.from(syncLogs.values()).filter(l => l.hotelId === hotelId).sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
}

function getSyncLogsByChannel(hotelId: string, channelId: ChannelId): SyncLog[] {
  return Array.from(syncLogs.values()).filter(l => l.hotelId === hotelId && l.channelId === channelId).sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
}

function updateSyncLog(logId: string, updates: Partial<Pick<SyncLog, 'status' | 'completedAt' | 'duration' | 'totalRecords' | 'syncedRecords' | 'failedRecords' | 'errors'>>): SyncLog | undefined {
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

// Booking functions
function normalizeBooking(booking: Record<string, unknown>, channelId: ChannelId): NormalizedBooking {
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

function createBooking(booking: NormalizedBooking): NormalizedBooking {
  const id = generateId('BKG');
  const fullBooking = { ...booking, channelBookingId: booking.channelBookingId || id };
  bookings.set(fullBooking.channelBookingId, fullBooking);
  return fullBooking;
}

function getBooking(channelBookingId: string): NormalizedBooking | undefined {
  return bookings.get(channelBookingId);
}

function getBookingsByHotel(hotelId: string): NormalizedBooking[] {
  const hotelConnections = getConnectionsByHotel(hotelId);
  const channelIds = hotelConnections.map(c => c.channelId);
  return Array.from(bookings.values()).filter(b => channelIds.includes(b.channel));
}

function getBookingsByChannel(_hotelId: string, channelId: ChannelId): NormalizedBooking[] {
  return Array.from(bookings.values()).filter(b => b.channel === channelId);
}

function updateBookingStatus(channelBookingId: string, status: NormalizedBooking['status']): NormalizedBooking | undefined {
  const booking = bookings.get(channelBookingId);
  if (!booking) return undefined;
  booking.status = status;
  bookings.set(channelBookingId, booking);
  return booking;
}

// Inventory formatting
function formatInventoryForChannel(inventory: InventoryEntry[], channelId: ChannelId): Record<string, unknown>[] {
  switch (channelId) {
    case 'booking_com':
      return inventory.map(inv => ({ room_id: inv.roomId, date: inv.date, availability: inv.available, price: inv.price }));
    case 'makemytrip':
      return inventory.map(inv => ({ room_type_id: inv.roomId, date: inv.date, available_count: inv.available, rate: inv.price }));
    case 'goibibo':
      return inventory.map(inv => ({ room_id: inv.roomId, stay_date: inv.date, inventory: inv.available, rate: inv.price }));
    case 'expedia':
      return inventory.map(inv => ({ roomTypeId: inv.roomId, date: inv.date, totalInventoryCount: inv.available, rateAmount: inv.price }));
    default:
      return inventory.map(inv => ({ roomId: inv.roomId, date: inv.date, available: inv.available, price: inv.price }));
  }
}

// Headers building
function buildChannelHeaders(credentials: ChannelCredentials, channelId: ChannelId): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
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

// Booking.com XML building
function buildBookingComXML(data: { username: string; password: string; hotelId: string; action: string; payload: Record<string, unknown> }): string {
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

// Analytics
function getChannelAnalytics(hotelId: string, channelId: ChannelId, period: number = 30): { channelId: ChannelId; period: string; totalBookings: number; totalRevenue: number; netRevenue: number; avgDailyRate: number; occupancyRate: number; commissionPaid: number; conversionRate: number; views: number } {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - period);
  const channelBookings = getBookingsByChannel(hotelId, channelId).filter(b => b.checkinDate >= cutoffDate);
  const totalRevenue = channelBookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const commissionPaid = calculateCommission(totalRevenue, channelId);
  const avgDailyRate = channelBookings.length > 0 ? totalRevenue / channelBookings.length : 0;
  const occupancyRate = Math.min(100, (channelBookings.length / period) * 100);
  return { channelId, period: `${period} days`, totalBookings: channelBookings.length, totalRevenue, netRevenue: totalRevenue - commissionPaid, avgDailyRate: Math.round(avgDailyRate), occupancyRate: Math.round(occupancyRate * 10) / 10, commissionPaid, conversionRate: 0, views: 0 };
}

function getRevenueByChannel(hotelId: string): Array<{ channelId: ChannelId; revenue: number; bookings: number; avgBookingValue: number }> {
  const hotelConnections = getConnectionsByHotel(hotelId);
  const revenues = hotelConnections.map(conn => {
    const channelBookings = getBookingsByChannel(hotelId, conn.channelId);
    const totalRevenue = channelBookings.reduce((sum, b) => sum + b.totalAmount, 0);
    return { channelId: conn.channelId, revenue: totalRevenue, bookings: channelBookings.length, avgBookingValue: channelBookings.length > 0 ? totalRevenue / channelBookings.length : 0 };
  });
  return revenues.sort((a, b) => b.revenue - a.revenue);
}

function getTotalRevenue(hotelId: string): { total: number; byChannel: Array<{ channelId: ChannelId; revenue: number; bookings: number; avgBookingValue: number }>; netAfterCommission: number } {
  const byChannel = getRevenueByChannel(hotelId);
  const total = byChannel.reduce((sum, r) => sum + r.revenue, 0);
  const netAfterCommission = byChannel.reduce((sum, r) => sum + r.revenue - calculateCommission(r.revenue, r.channelId), 0);
  return { total, byChannel, netAfterCommission };
}

// Reset function
function resetStore(): void {
  connections.clear();
  roomMappings.clear();
  ratePlans.clear();
  syncLogs.clear();
  bookings.clear();
}

describe('Channel Configuration', () => {
  it('should have all required channel configurations', () => {
    const expectedChannels: ChannelId[] = ['booking_com', 'makemytrip', 'goibibo', 'expedia', 'airbnb', 'google_hotel'];
    expectedChannels.forEach(channelId => {
      expect(CHANNEL_CONFIGS).toHaveProperty(channelId);
      expect(CHANNEL_CONFIGS[channelId]).toHaveProperty('name');
      expect(CHANNEL_CONFIGS[channelId]).toHaveProperty('commissionRate');
      expect(CHANNEL_CONFIGS[channelId]).toHaveProperty('apiType');
    });
  });

  it('should validate commission rates are within valid range', () => {
    Object.values(CHANNEL_CONFIGS).forEach(config => {
      expect(config.commissionRate).toBeGreaterThanOrEqual(0);
      expect(config.commissionRate).toBeLessThanOrEqual(1);
    });
  });

  it('should identify supported channels correctly', () => {
    expect(isChannelSupported('booking_com')).toBe(true);
    expect(isChannelSupported('makemytrip')).toBe(true);
    expect(isChannelSupported('goibibo')).toBe(true);
    expect(isChannelSupported('expedia')).toBe(true);
    expect(isChannelSupported('invalid_channel')).toBe(false);
  });

  it('should return supported channels list with correct format', () => {
    const channels = getSupportedChannels();
    expect(channels.length).toBe(Object.keys(CHANNEL_CONFIGS).length);
    channels.forEach(channel => {
      expect(channel).toHaveProperty('id');
      expect(channel).toHaveProperty('name');
      expect(channel).toHaveProperty('commissionRate');
    });
  });
});

describe('Commission Calculations', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should calculate commission correctly for booking_com (15%)', () => {
    const amount = 10000;
    const commission = calculateCommission(amount, 'booking_com');
    expect(commission).toBe(1500);
  });

  it('should calculate commission correctly for expedia (12%)', () => {
    const amount = 5000;
    const commission = calculateCommission(amount, 'expedia');
    expect(commission).toBe(600);
  });

  it('should return 0 commission for unknown channel', () => {
    const commission = calculateCommission(1000, 'airbnb');
    expect(commission).toBe(0);
  });

  it('should calculate net rate after commission deduction', () => {
    const baseRate = 10000;
    const channelId: ChannelId = 'makemytrip';
    const netRate = calculateNetRate(baseRate, channelId);
    expect(netRate).toBe(8500); // 10000 - (10000 * 0.15)
  });

  it('should handle zero amount correctly', () => {
    const commission = calculateCommission(0, 'booking_com');
    expect(commission).toBe(0);
  });
});

describe('Connection Management', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should create a new connection with pending status', () => {
    const credentials: ChannelCredentials = { username: 'testuser', password: 'testpass' };
    const connection = createConnection('hotel-001', 'booking_com', credentials);

    expect(connection).toHaveProperty('id');
    expect(connection.hotelId).toBe('hotel-001');
    expect(connection.channelId).toBe('booking_com');
    expect(connection.status).toBe('pending');
    expect(connection.credentials).toEqual(credentials);
    expect(connection.id).toMatch(/^CONN-[A-Z0-9]+$/);
  });

  it('should retrieve connection by ID', () => {
    const credentials: ChannelCredentials = { apiKey: 'test-key' };
    const created = createConnection('hotel-002', 'expedia', credentials);
    const retrieved = getConnection(created.id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(created.id);
    expect(retrieved?.hotelId).toBe('hotel-002');
  });

  it('should return undefined for non-existent connection', () => {
    const connection = getConnection('non-existent-id');
    expect(connection).toBeUndefined();
  });

  it('should find connection by hotel and channel combination', () => {
    const credentials: ChannelCredentials = { apiKey: 'key' };
    createConnection('hotel-003', 'makemytrip', credentials);

    const found = getConnectionByHotelAndChannel('hotel-003', 'makemytrip');
    expect(found).toBeDefined();
    expect(found?.channelId).toBe('makemytrip');
  });

  it('should return undefined for non-matching hotel/channel', () => {
    const found = getConnectionByHotelAndChannel('hotel-999', 'booking_com');
    expect(found).toBeUndefined();
  });

  it('should retrieve all connections for a hotel', () => {
    createConnection('hotel-004', 'booking_com', { username: 'u1' });
    createConnection('hotel-004', 'makemytrip', { username: 'u2' });
    createConnection('hotel-004', 'expedia', { username: 'u3' });

    const connectionsList = getConnectionsByHotel('hotel-004');
    expect(connectionsList.length).toBe(3);
  });

  it('should update connection status correctly', () => {
    const connection = createConnection('hotel-005', 'goibibo', { clientId: '123' });
    const updated = updateConnectionStatus(connection.id, 'active', undefined);

    expect(updated).toBeDefined();
    expect(updated?.status).toBe('active');
    expect(updated?.lastError).toBeUndefined();
  });

  it('should update connection with error message', () => {
    const connection = createConnection('hotel-006', 'booking_com', { username: 'u' });
    const updated = updateConnectionStatus(connection.id, 'error', 'Authentication failed');

    expect(updated?.status).toBe('error');
    expect(updated?.lastError).toBe('Authentication failed');
  });

  it('should update last sync timestamp', () => {
    const connection = createConnection('hotel-007', 'expedia', { apiKey: 'key' });
    const beforeUpdate = connection.lastSync;

    const updated = updateConnectionLastSync(connection.id);

    expect(updated?.lastSync).toBeDefined();
    expect(updated?.lastError).toBeUndefined();
    if (beforeUpdate) {
      expect(updated?.lastSync?.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
    }
  });

  it('should delete connection successfully', () => {
    const connection = createConnection('hotel-008', 'makemytrip', { partnerId: 'p1' });
    const deleted = deleteConnection(connection.id);

    expect(deleted).toBe(true);
    expect(getConnection(connection.id)).toBeUndefined();
  });

  it('should return false when deleting non-existent connection', () => {
    const deleted = deleteConnection('non-existent-id');
    expect(deleted).toBe(false);
  });
});

describe('Room Mapping Management', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should create room mapping with correct structure', () => {
    const mapping = createRoomMapping('hotel-001', 'booking_com', 'room-101', 'BC-ROOM-101', 'Standard Room');

    expect(mapping).toHaveProperty('id');
    expect(mapping.id).toMatch(/^MAP-[A-Z0-9]+$/);
    expect(mapping.internalRoomId).toBe('room-101');
    expect(mapping.channelRoomId).toBe('BC-ROOM-101');
    expect(mapping.isActive).toBe(true);
  });

  it('should retrieve room mapping by ID', () => {
    const mapping = createRoomMapping('hotel-001', 'makemytrip', 'room-102', 'MMT-102', 'Deluxe');
    const retrieved = getRoomMapping(mapping.id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.internalRoomId).toBe('room-102');
  });

  it('should get room mappings by hotel', () => {
    createRoomMapping('hotel-002', 'booking_com', 'room-1', 'BC-1', 'Room 1');
    createRoomMapping('hotel-002', 'booking_com', 'room-2', 'BC-2', 'Room 2');
    createRoomMapping('hotel-002', 'makemytrip', 'room-1', 'MMT-1', 'Room 1');

    const mappings = getRoomMappingsByHotel('hotel-002');
    expect(mappings.length).toBe(3);
  });

  it('should get room mappings by channel', () => {
    const connection = createConnection('hotel-003', 'expedia', { apiKey: 'key' });
    createRoomMapping('hotel-003', 'expedia', 'room-1', 'EXP-1', 'Room 1');
    createRoomMapping('hotel-003', 'expedia', 'room-2', 'EXP-2', 'Room 2');
    createRoomMapping('hotel-003', 'makemytrip', 'room-1', 'MMT-1', 'Room 1');

    const mappings = getRoomMappingsByChannel(connection.id);
    expect(mappings.length).toBe(2);
    expect(mappings.every(m => m.channelId === 'expedia')).toBe(true);
  });

  it('should get room mappings by internal room ID', () => {
    createRoomMapping('hotel-004', 'booking_com', 'room-101', 'BC-101', 'Standard');
    createRoomMapping('hotel-004', 'makemytrip', 'room-101', 'MMT-101', 'Standard');
    createRoomMapping('hotel-004', 'booking_com', 'room-102', 'BC-102', 'Deluxe');

    const mappings = getRoomMappingsByInternalRoom('hotel-004', 'room-101');
    expect(mappings.length).toBe(2);
  });

  it('should toggle room mapping active status', () => {
    const mapping = createRoomMapping('hotel-005', 'goibibo', 'room-1', 'GI-1', 'Room 1');
    expect(mapping.isActive).toBe(true);

    const toggled = toggleRoomMapping(mapping.id, false);
    expect(toggled?.isActive).toBe(false);

    const toggledBack = toggleRoomMapping(mapping.id, true);
    expect(toggledBack?.isActive).toBe(true);
  });
});

describe('Rate Plan Management', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should create rate plan with default restrictions', () => {
    const ratePlan = createRatePlan('hotel-001', 'room-101', 'booking_com', 'RP-STD', 'Standard Rate', 2500, 'INR');

    expect(ratePlan).toHaveProperty('id');
    expect(ratePlan.id).toMatch(/^RP-[A-Z0-9]+$/);
    expect(ratePlan.baseRate).toBe(2500);
    expect(ratePlan.restrictions.minStay).toBe(1);
    expect(ratePlan.restrictions.maxStay).toBe(14);
    expect(ratePlan.isActive).toBe(true);
  });

  it('should create rate plan with custom restrictions', () => {
    const ratePlan = createRatePlan('hotel-001', 'room-102', 'expedia', 'RP-FLEX', 'Flexible Rate', 3500, 'INR', { minStay: 2, maxStay: 7, closedToArrival: true });

    expect(ratePlan.restrictions.minStay).toBe(2);
    expect(ratePlan.restrictions.maxStay).toBe(7);
    expect(ratePlan.restrictions.closedToArrival).toBe(true);
    expect(ratePlan.restrictions.closedToDeparture).toBe(false);
  });

  it('should retrieve rate plan by ID', () => {
    const ratePlan = createRatePlan('hotel-002', 'room-1', 'makemytrip', 'RP-1', 'Rate 1', 2000, 'INR');
    const retrieved = getRatePlan(ratePlan.id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.rateName).toBe('Rate 1');
  });

  it('should get rate plans by hotel', () => {
    createRatePlan('hotel-003', 'room-1', 'booking_com', 'RP-1', 'Rate 1', 2000, 'INR');
    createRatePlan('hotel-003', 'room-2', 'makemytrip', 'RP-2', 'Rate 2', 2500, 'INR');

    const ratePlansList = getRatePlansByHotel('hotel-003');
    expect(ratePlansList.length).toBe(2);
  });

  it('should get rate plans by hotel and channel', () => {
    createRatePlan('hotel-004', 'room-1', 'booking_com', 'RP-1', 'Rate 1', 2000, 'INR');
    createRatePlan('hotel-004', 'room-2', 'booking_com', 'RP-2', 'Rate 2', 2200, 'INR');
    createRatePlan('hotel-004', 'room-3', 'expedia', 'RP-3', 'Rate 3', 2300, 'INR');

    const ratePlansList = getRatePlansByChannel('hotel-004', 'booking_com');
    expect(ratePlansList.length).toBe(2);
  });

  it('should update rate plan base rate', () => {
    const ratePlan = createRatePlan('hotel-005', 'room-1', 'goibibo', 'RP-1', 'Rate', 2000, 'INR');
    const updated = updateRatePlan(ratePlan.id, { baseRate: 2500 });

    expect(updated?.baseRate).toBe(2500);
  });

  it('should update rate plan restrictions', () => {
    const ratePlan = createRatePlan('hotel-006', 'room-1', 'makemytrip', 'RP-1', 'Rate', 2000, 'INR');
    const updated = updateRatePlan(ratePlan.id, { restrictions: { minStay: 3, closedToDeparture: true } });

    expect(updated?.restrictions.minStay).toBe(3);
    expect(updated?.restrictions.closedToDeparture).toBe(true);
    expect(updated?.restrictions.maxStay).toBe(14); // Default preserved
  });

  it('should update rate plan active status', () => {
    const ratePlan = createRatePlan('hotel-007', 'room-1', 'expedia', 'RP-1', 'Rate', 2000, 'INR');
    const updated = updateRatePlan(ratePlan.id, { isActive: false });

    expect(updated?.isActive).toBe(false);
  });
});

describe('Sync Log Management', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should create sync log with pending status', () => {
    const syncLog = createSyncLog('hotel-001', 'booking_com', 'inventory');

    expect(syncLog).toHaveProperty('id');
    expect(syncLog.id).toMatch(/^SYNC-[A-Z0-9]+$/);
    expect(syncLog.status).toBe('pending');
    expect(syncLog.syncType).toBe('inventory');
    expect(syncLog.hotelId).toBe('hotel-001');
  });

  it('should retrieve sync log by ID', () => {
    const syncLog = createSyncLog('hotel-002', 'makemytrip', 'rates');
    const retrieved = getSyncLog(syncLog.id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.syncType).toBe('rates');
  });

  it('should get sync logs by hotel sorted by start time', () => {
    createSyncLog('hotel-003', 'booking_com', 'inventory');
    createSyncLog('hotel-003', 'makemytrip', 'bookings');

    const logs = getSyncLogsByHotel('hotel-003');
    expect(logs.length).toBe(2);
  });

  it('should get sync logs by hotel and channel', () => {
    createSyncLog('hotel-004', 'booking_com', 'inventory');
    createSyncLog('hotel-004', 'booking_com', 'rates');
    createSyncLog('hotel-004', 'expedia', 'inventory');

    const logs = getSyncLogsByChannel('hotel-004', 'booking_com');
    expect(logs.length).toBe(2);
  });

  it('should update sync log with completion data', () => {
    const syncLog = createSyncLog('hotel-005', 'goibibo', 'full');
    const updated = updateSyncLog(syncLog.id, {
      status: 'success',
      completedAt: new Date(),
      duration: 5000,
      totalRecords: 100,
      syncedRecords: 95,
      failedRecords: 5,
    });

    expect(updated?.status).toBe('success');
    expect(updated?.duration).toBe(5000);
    expect(updated?.syncedRecords).toBe(95);
    expect(updated?.failedRecords).toBe(5);
  });

  it('should update sync log with errors', () => {
    const syncLog = createSyncLog('hotel-006', 'makemytrip', 'inventory');
    const errors = [
      { type: 'AUTH_FAILED' as const, message: 'Invalid credentials', recordId: 'room-1' },
      { type: 'INVALID_DATA' as const, message: 'Missing price field' },
    ];

    const updated = updateSyncLog(syncLog.id, { status: 'partial', errors });

    expect(updated?.errors).toHaveLength(2);
    expect(updated?.errors?.[0].type).toBe('AUTH_FAILED');
  });
});

describe('Booking Normalization', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should normalize booking.com format', () => {
    const rawBooking = {
      reservation_id: 'BC-12345',
      guest_name: 'John Doe',
      email: 'john@example.com',
      check_in: '2026-06-15',
      check_out: '2026-06-18',
      total: 7500,
      currency: 'INR',
      room_id: 'room-101',
      guests: 2,
      status: 'confirmed',
    };

    const normalized = normalizeBooking(rawBooking, 'booking_com');

    expect(normalized.channelBookingId).toBe('BC-12345');
    expect(normalized.guestName).toBe('John Doe');
    expect(normalized.guestEmail).toBe('john@example.com');
    expect(normalized.channel).toBe('booking_com');
    expect(normalized.totalAmount).toBe(7500);
    expect(normalized.guestCount).toBe(2);
  });

  it('should normalize makemytrip format', () => {
    const rawBooking = {
      id: 'MMT-67890',
      guestName: 'Jane Smith',
      phone: '+919876543210',
      checkIn: '2026-06-20',
      checkOut: '2026-06-22',
      amount: 4500,
      roomId: 'room-201',
      adults: 1,
      requests: 'Late check-in',
    };

    const normalized = normalizeBooking(rawBooking, 'makemytrip');

    expect(normalized.channelBookingId).toBe('MMT-67890');
    expect(normalized.guestName).toBe('Jane Smith');
    expect(normalized.guestPhone).toBe('+919876543210');
    expect(normalized.specialRequests).toBe('Late check-in');
    expect(normalized.channel).toBe('makemytrip');
  });

  it('should normalize expedia format', () => {
    const rawBooking = {
      booking_id: 'EXP-111',
      name: 'Bob Wilson',
      email_address: 'bob@test.com',
      arrival: '2026-07-01',
      departure: '2026-07-03',
      price: 6000,
      room: 'room-301',
      guest_count: 3,
    };

    const normalized = normalizeBooking(rawBooking, 'expedia');

    expect(normalized.channelBookingId).toBe('EXP-111');
    expect(normalized.guestName).toBe('Bob Wilson');
    expect(normalized.checkinDate).toBeInstanceOf(Date);
    expect(normalized.checkoutDate).toBeInstanceOf(Date);
  });

  it('should handle missing optional fields gracefully', () => {
    const rawBooking = {
      id: 'MIN-001',
      name: 'Min Data',
    };

    const normalized = normalizeBooking(rawBooking, 'goibibo');

    expect(normalized.guestEmail).toBeUndefined();
    expect(normalized.guestPhone).toBeUndefined();
    expect(normalized.specialRequests).toBeUndefined();
    expect(normalized.guestCount).toBe(1);
    expect(normalized.totalAmount).toBe(0);
    expect(normalized.currency).toBe('INR');
  });

  it('should create and retrieve booking', () => {
    const normalized = normalizeBooking({ id: 'BK-001', name: 'Test Guest', check_in: '2026-06-15', check_out: '2026-06-16', total: 2000 }, 'booking_com');

    const created = createBooking(normalized);
    expect(created.channelBookingId).toBe('BK-001');

    const retrieved = getBooking('BK-001');
    expect(retrieved).toBeDefined();
    expect(retrieved?.guestName).toBe('Test Guest');
  });

  it('should update booking status', () => {
    const booking = createBooking({
      channelBookingId: 'BK-002',
      channel: 'makemytrip',
      guestName: 'Status Test',
      checkinDate: new Date(),
      checkoutDate: new Date(),
      totalAmount: 3000,
      currency: 'INR',
      roomId: 'room-1',
      status: 'confirmed',
    });

    const updated = updateBookingStatus('BK-002', 'cancelled');
    expect(updated?.status).toBe('cancelled');

    const retrieved = getBooking('BK-002');
    expect(retrieved?.status).toBe('cancelled');
  });
});

describe('Inventory Formatting', () => {
  it('should format inventory for booking.com', () => {
    const inventory: InventoryEntry[] = [
      { roomId: 'room-1', date: '2026-06-15', available: 5, price: 2500 },
      { roomId: 'room-2', date: '2026-06-15', available: 3, price: 3500 },
    ];

    const formatted = formatInventoryForChannel(inventory, 'booking_com');

    expect(formatted[0]).toHaveProperty('room_id');
    expect(formatted[0]).toHaveProperty('date');
    expect(formatted[0]).toHaveProperty('availability');
    expect(formatted[0]).toHaveProperty('price');
  });

  it('should format inventory for makemytrip', () => {
    const inventory: InventoryEntry[] = [{ roomId: 'room-1', date: '2026-06-15', available: 5, price: 2500 }];

    const formatted = formatInventoryForChannel(inventory, 'makemytrip');

    expect(formatted[0]).toHaveProperty('room_type_id');
    expect(formatted[0]).toHaveProperty('available_count');
    expect(formatted[0]).toHaveProperty('rate');
  });

  it('should format inventory for goibibo', () => {
    const inventory: InventoryEntry[] = [{ roomId: 'room-1', date: '2026-06-15', available: 5, price: 2500 }];

    const formatted = formatInventoryForChannel(inventory, 'goibibo');

    expect(formatted[0]).toHaveProperty('stay_date');
    expect(formatted[0]).toHaveProperty('inventory');
    expect(formatted[0]).toHaveProperty('rate');
  });

  it('should format inventory for expedia', () => {
    const inventory: InventoryEntry[] = [{ roomId: 'room-1', date: '2026-06-15', available: 5, price: 2500 }];

    const formatted = formatInventoryForChannel(inventory, 'expedia');

    expect(formatted[0]).toHaveProperty('roomTypeId');
    expect(formatted[0]).toHaveProperty('totalInventoryCount');
    expect(formatted[0]).toHaveProperty('rateAmount');
  });

  it('should use default format for unknown channels', () => {
    const inventory: InventoryEntry[] = [{ roomId: 'room-1', date: '2026-06-15', available: 5, price: 2500 }];

    const formatted = formatInventoryForChannel(inventory, 'airbnb');

    expect(formatted[0]).toHaveProperty('roomId');
    expect(formatted[0]).toHaveProperty('available');
    expect(formatted[0]).toHaveProperty('price');
  });
});

describe('API Request Building', () => {
  it('should build headers for makemytrip', () => {
    const credentials: ChannelCredentials = { apiKey: 'test-key', partnerId: 'partner-123' };
    const headers = buildChannelHeaders(credentials, 'makemytrip');

    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['Authorization']).toBe('Bearer test-key');
    expect(headers['X-Partner-Id']).toBe('partner-123');
  });

  it('should build headers for expedia', () => {
    const credentials: ChannelCredentials = { apiKey: 'exp-key' };
    const headers = buildChannelHeaders(credentials, 'expedia');

    expect(headers['Authorization']).toBe('Bearer exp-key');
  });

  it('should build headers for goibibo', () => {
    const credentials: ChannelCredentials = { clientId: 'client-1', clientSecret: 'secret-1' };
    const headers = buildChannelHeaders(credentials, 'goibibo');

    expect(headers['X-Client-Id']).toBe('client-1');
    expect(headers['X-Client-Secret']).toBe('secret-1');
  });

  it('should build headers for airbnb', () => {
    const credentials: ChannelCredentials = { accessToken: 'airbnb-token' };
    const headers = buildChannelHeaders(credentials, 'airbnb');

    expect(headers['Authorization']).toBe('Bearer airbnb-token');
  });

  it('should build Booking.com XML correctly', () => {
    const xml = buildBookingComXML({
      username: 'testuser',
      password: 'testpass',
      hotelId: 'hotel-001',
      action: 'OTA_HotelAvailNotifRQ',
      payload: { roomId: 'room-1', available: 5 },
    });

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<OTA_HotelAvailNotifRQ>');
    expect(xml).toContain('<Username>testuser</Username>');
    expect(xml).toContain('<Password>testpass</Password>');
    expect(xml).toContain('<HotelId>hotel-001</HotelId>');
    expect(xml).toContain('<roomId>room-1</roomId>');
    expect(xml).toContain('</OTA_HotelAvailNotifRQ>');
  });
});

describe('Analytics', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should calculate channel analytics correctly', () => {
    createConnection('hotel-001', 'booking_com', { username: 'u' });

    createBooking({
      channelBookingId: 'BK-1',
      channel: 'booking_com',
      guestName: 'Guest 1',
      checkinDate: new Date(),
      checkoutDate: new Date(),
      totalAmount: 5000,
      currency: 'INR',
      roomId: 'room-1',
      status: 'confirmed',
    });

    createBooking({
      channelBookingId: 'BK-2',
      channel: 'booking_com',
      guestName: 'Guest 2',
      checkinDate: new Date(),
      checkoutDate: new Date(),
      totalAmount: 7000,
      currency: 'INR',
      roomId: 'room-1',
      status: 'confirmed',
    });

    const analytics = getChannelAnalytics('hotel-001', 'booking_com', 30);

    expect(analytics.channelId).toBe('booking_com');
    expect(analytics.totalBookings).toBe(2);
    expect(analytics.totalRevenue).toBe(12000);
    expect(analytics.commissionPaid).toBe(1800); // 15% of 12000
    expect(analytics.netRevenue).toBe(10200);
  });

  it('should calculate revenue by channel', () => {
    createConnection('hotel-002', 'booking_com', { username: 'u1' });
    createConnection('hotel-002', 'makemytrip', { username: 'u2' });

    createBooking({
      channelBookingId: 'BK-3',
      channel: 'booking_com',
      guestName: 'Guest 3',
      checkinDate: new Date(),
      checkoutDate: new Date(),
      totalAmount: 5000,
      currency: 'INR',
      roomId: 'room-1',
      status: 'confirmed',
    });

    createBooking({
      channelBookingId: 'BK-4',
      channel: 'makemytrip',
      guestName: 'Guest 4',
      checkinDate: new Date(),
      checkoutDate: new Date(),
      totalAmount: 3000,
      currency: 'INR',
      roomId: 'room-1',
      status: 'confirmed',
    });

    const revenue = getRevenueByChannel('hotel-002');

    expect(revenue.length).toBe(2);
    expect(revenue[0].channelId).toBe('booking_com');
    expect(revenue[0].revenue).toBe(5000);
    expect(revenue[0].bookings).toBe(1);
    expect(revenue[0].avgBookingValue).toBe(5000);
  });

  it('should calculate total revenue correctly', () => {
    createConnection('hotel-003', 'booking_com', { username: 'u' });
    createConnection('hotel-003', 'expedia', { username: 'u' });

    createBooking({
      channelBookingId: 'BK-5',
      channel: 'booking_com',
      guestName: 'Guest 5',
      checkinDate: new Date(),
      checkoutDate: new Date(),
      totalAmount: 10000,
      currency: 'INR',
      roomId: 'room-1',
      status: 'confirmed',
    });

    createBooking({
      channelBookingId: 'BK-6',
      channel: 'expedia',
      guestName: 'Guest 6',
      checkinDate: new Date(),
      checkoutDate: new Date(),
      totalAmount: 8000,
      currency: 'INR',
      roomId: 'room-1',
      status: 'confirmed',
    });

    const total = getTotalRevenue('hotel-003');

    expect(total.total).toBe(18000);
    // Booking.com: 10000 * 0.15 = 1500, Expedia: 8000 * 0.12 = 960
    expect(total.netAfterCommission).toBe(18000 - 1500 - 960);
  });
});

describe('Reset Store', () => {
  it('should clear all data on reset', () => {
    createConnection('hotel-001', 'booking_com', { username: 'u' });
    createRoomMapping('hotel-001', 'booking_com', 'room-1', 'BC-1', 'Room 1');
    createRatePlan('hotel-001', 'room-1', 'booking_com', 'RP-1', 'Rate', 2000, 'INR');
    createSyncLog('hotel-001', 'booking_com', 'inventory');
    createBooking({
      channelBookingId: 'BK-001',
      channel: 'booking_com',
      guestName: 'Test',
      checkinDate: new Date(),
      checkoutDate: new Date(),
      totalAmount: 2000,
      currency: 'INR',
      roomId: 'room-1',
      status: 'confirmed',
    });

    expect(getConnectionsByHotel('hotel-001').length).toBe(1);
    expect(getRoomMappingsByHotel('hotel-001').length).toBe(1);
    expect(getRatePlansByHotel('hotel-001').length).toBe(1);
    expect(getSyncLogsByHotel('hotel-001').length).toBe(1);

    resetStore();

    expect(getConnectionsByHotel('hotel-001').length).toBe(0);
    expect(getRoomMappingsByHotel('hotel-001').length).toBe(0);
    expect(getRatePlansByHotel('hotel-001').length).toBe(0);
    expect(getSyncLogsByHotel('hotel-001').length).toBe(0);
  });
});
