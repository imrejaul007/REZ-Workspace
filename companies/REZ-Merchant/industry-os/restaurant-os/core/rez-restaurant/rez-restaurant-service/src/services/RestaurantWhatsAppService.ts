/**
 * Restaurant WhatsApp Service
 *
 * Automated WhatsApp notifications for restaurant workflows
 * Based on Twilio WhatsApp Business API
 *
 * Features:
 * - Order notifications (confirmation, ready, delivered)
 * - Reservation reminders (2 hours, 30 minutes before)
 * - Marketing (birthday offers, special deals, re-engagement)
 * - Staff notifications (new orders, low stock)
 */

import twilio from 'twilio';
import { logger } from '../config/logger';
import { RESTAURANT_WHATSAPP_TEMPLATES, RestaurantTemplateType } from './whatsapp-templates';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface RestaurantOrder {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  restaurantName: string;
  branchName?: string;
  orderType: 'dine_in' | 'takeaway' | 'delivery';
  items: Array<{
    name: string;
    quantity: number;
    customizations?: string[];
  }>;
  itemCount: number;
  totalAmount: number;
  currency?: string;
  status: OrderStatus;
  deliveryAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  estimatedReadyTime?: Date;
  createdAt: Date;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled';

export interface RestaurantReservation {
  reservationId: string;
  confirmationNumber: string;
  guestName: string;
  guestPhone: string;
  restaurantName: string;
  branchName?: string;
  date: string;
  time: string;
  guestCount: number;
  tableNumber?: string;
  specialOccasion?: string;
  specialRequests?: string;
  status: ReservationStatus;
  createdAt: Date;
}

export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'seated'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface RestaurantCustomer {
  customerId: string;
  name: string;
  phone: string;
  email?: string;
  dateOfBirth?: Date;
  anniversary?: Date;
  segment: 'VIP' | 'REGULAR' | 'LAPSED' | 'NEW';
  loyaltyPoints?: number;
  lastVisitAt?: Date;
  lifetimeValue?: number;
  preferences?: {
    notificationsEnabled?: {
      whatsapp?: boolean;
      sms?: boolean;
      email?: boolean;
    };
    favoriteCuisines?: string[];
  };
}

export interface StaffNotification {
  staffPhone: string;
  staffName?: string;
  restaurantName: string;
  branchId: string;
  type: 'new_order' | 'low_stock' | 'review_received' | 'reservation_cancelled';
  message: string;
  priority: 'high' | 'normal' | 'low';
  metadata?: Record<string, unknown>;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  templateType?: RestaurantTemplateType;
  recipientPhone?: string;
  sentAt?: Date;
}

export interface WhatsAppLogEntry {
  id: string;
  templateType: RestaurantTemplateType;
  recipientPhone: string;
  recipientName?: string;
  status: 'sent' | 'failed' | 'delivered' | 'read';
  messageId?: string;
  error?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  deliveredAt?: Date;
}

// ============================================================================
// Constants
// ============================================================================

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM;
const WHATSAPP_LOG_RETENTION_DAYS = 90;

// 24-hour session rules (WhatsApp Business Policy)
const SESSION_VALID_HOURS = 24;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate secure log ID using crypto
 */
function generateLogId(): string {
  try {
    const { randomUUID } = require('crypto');
    return `LOG-${Date.now()}-${randomUUID().split('-')[0]}`;
  } catch {
    return `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }
}

/**
 * Format phone number for WhatsApp (E.164 format)
 */
function formatWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  // Already in E.164 format
  if (phone.startsWith('+')) {
    return phone;
  }

  // Indian numbers (10 digits)
  if (digits.length === 10) {
    return `+91${digits}`;
  }

  // Already has country code (12 digits starting with 91)
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }

  // International format without +
  if (digits.length >= 10) {
    return `+${digits}`;
  }

  return `+${digits}`;
}

/**
 * Validate phone number
 */
function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * Format currency amount
 */
function formatCurrency(amount: number, currency: string = 'INR'): string {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return formatter.format(amount);
}

/**
 * Format date for display
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format time for display
 */
function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

/**
 * Truncate text with ellipsis
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Sanitize input to prevent injection
 */
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ============================================================================
// In-Memory Log Store (Replace with proper database in production)
// ============================================================================

class WhatsAppLogStore {
  private logs: Map<string, WhatsAppLogEntry> = new Map();
  private retentionMs = WHATSAPP_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000;

  async add(entry: Omit<WhatsAppLogEntry, 'id' | 'createdAt'>): Promise<WhatsAppLogEntry> {
    const fullEntry: WhatsAppLogEntry = {
      ...entry,
      id: generateLogId(),
      createdAt: new Date(),
    };

    this.logs.set(fullEntry.id, fullEntry);
    this.cleanup();

    return fullEntry;
  }

  async updateStatus(logId: string, status: WhatsAppLogEntry['status'], messageId?: string): Promise<void> {
    const entry = this.logs.get(logId);
    if (entry) {
      entry.status = status;
      if (messageId) entry.messageId = messageId;
      if (status === 'delivered') entry.deliveredAt = new Date();
      this.logs.set(logId, entry);
    }
  }

  async findByRecipient(phone: string, limit = 50): Promise<WhatsAppLogEntry[]> {
    const results: WhatsAppLogEntry[] = [];
    for (const entry of this.logs.values()) {
      if (entry.recipientPhone === phone) {
        results.push(entry);
      }
      if (results.length >= limit) break;
    }
    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findByTemplate(templateType: RestaurantTemplateType, limit = 100): Promise<WhatsAppLogEntry[]> {
    const results: WhatsAppLogEntry[] = [];
    for (const entry of this.logs.values()) {
      if (entry.templateType === templateType) {
        results.push(entry);
      }
      if (results.length >= limit) break;
    }
    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getStats(templateType?: RestaurantTemplateType): Promise<{
    total: number;
    sent: number;
    failed: number;
    delivered: number;
    byTemplate: Record<string, number>;
  }> {
    let stats = { total: 0, sent: 0, failed: 0, delivered: 0, byTemplate: {} as Record<string, number> };

    for (const entry of this.logs.values()) {
      if (templateType && entry.templateType !== templateType) continue;

      stats.total++;
      if (entry.status === 'sent') stats.sent++;
      if (entry.status === 'failed') stats.failed++;
      if (entry.status === 'delivered' || entry.status === 'read') stats.delivered++;

      const key = entry.templateType;
      stats.byTemplate[key] = (stats.byTemplate[key] || 0) + 1;
    }

    return stats;
  }

  private cleanup(): void {
    const cutoff = Date.now() - this.retentionMs;
    for (const [id, entry] of this.logs.entries()) {
      if (entry.createdAt.getTime() < cutoff) {
        this.logs.delete(id);
      }
    }
  }
}

// ============================================================================
// Main Service Class
// ============================================================================

export class RestaurantWhatsAppService {
  private twilioClient: twilio.Twilio | null = null;
  private logStore: WhatsAppLogStore;
  private readonly CURRENCY = 'INR';

  constructor() {
    this.logStore = new WhatsAppLogStore();

    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      logger.info('[WhatsApp] Twilio client initialized');
    } else {
      logger.warn('[WhatsApp] Twilio credentials not configured - running in simulation mode');
    }
  }

  // =========================================================================
  // Order Notifications
  // =========================================================================

  /**
   * Send order confirmation to customer
   * Triggered when: Order is successfully placed
   */
  async sendOrderConfirmation(order: RestaurantOrder): Promise<WhatsAppSendResult> {
    const template = RESTAURANT_WHATSAPP_TEMPLATES.order_confirmation;

    // Build items summary
    const itemsSummary = order.items
      .slice(0, 3)
      .map((item) => `${item.quantity}x ${item.name}`)
      .join(', ');

    const additionalItems = order.itemCount > 3 ? ` +${order.itemCount - 3} more items` : '';

    const variables = {
      '{{1}}': sanitizeInput(order.customerName),
      '{{2}}': order.orderNumber,
      '{{3}}': `${itemsSummary}${additionalItems}`,
      '{{4}}': formatCurrency(order.totalAmount, order.currency || this.CURRENCY),
      '{{5}}': order.orderType === 'delivery' ? 'Estimated delivery: ' + this.formatETA(order) : `Pickup from: ${order.restaurantName}`,
    };

    const message = this.renderTemplate(template.body, variables);

    return this.sendWhatsAppMessage(
      order.customerPhone,
      message,
      'order_confirmation',
      { orderId: order.orderId, orderNumber: order.orderNumber }
    );
  }

  /**
   * Send order status update to customer
   * Triggered when: Order status changes (preparing, ready, etc.)
   */
  async sendOrderStatusUpdate(
    order: RestaurantOrder,
    previousStatus: OrderStatus,
    newStatus: OrderStatus
  ): Promise<WhatsAppSendResult> {
    let templateType: RestaurantTemplateType;
    let message: string;

    switch (newStatus) {
      case 'confirmed':
        templateType = 'order_confirmed';
        message = this.renderTemplate(RESTAURANT_WHATSAPP_TEMPLATES.order_confirmed.body, {
          '{{1}}': sanitizeInput(order.customerName),
          '{{2}}': order.orderNumber,
          '{{3}}': formatCurrency(order.totalAmount, order.currency || this.CURRENCY),
          '{{4}}': this.formatETA(order),
        });
        break;

      case 'preparing':
        templateType = 'order_preparing';
        message = this.renderTemplate(RESTAURANT_WHATSAPP_TEMPLATES.order_preparing.body, {
          '{{1}}': sanitizeInput(order.customerName),
          '{{2}}': order.orderNumber,
          '{{3}}': this.formatETA(order),
        });
        break;

      case 'ready':
        templateType = 'order_ready';
        if (order.orderType === 'takeaway') {
          message = this.renderTemplate(RESTAURANT_WHATSAPP_TEMPLATES.order_ready_takeaway.body, {
            '{{1}}': sanitizeInput(order.customerName),
            '{{2}}': order.orderNumber,
            '{{3}}': order.restaurantName,
          });
        } else if (order.orderType === 'delivery') {
          message = this.renderTemplate(RESTAURANT_WHATSAPP_TEMPLATES.order_out_for_delivery.body, {
            '{{1}}': sanitizeInput(order.customerName),
            '{{2}}': order.orderNumber,
            '{{3}}': order.restaurantName,
            '{{4}}': '15-20 mins',
          });
        } else {
          message = this.renderTemplate(RESTAURANT_WHATSAPP_TEMPLATES.order_ready_dinein.body, {
            '{{1}}': sanitizeInput(order.customerName),
            '{{2}}': order.orderNumber,
          });
        }
        break;

      case 'out_for_delivery':
        templateType = 'order_out_for_delivery';
        message = this.renderTemplate(RESTAURANT_WHATSAPP_TEMPLATES.order_out_for_delivery.body, {
          '{{1}}': sanitizeInput(order.customerName),
          '{{2}}': order.orderNumber,
          '{{3}}': order.restaurantName,
          '{{4}}': '15-20 mins',
        });
        break;

      case 'delivered':
        templateType = 'order_delivered';
        message = this.renderTemplate(RESTAURANT_WHATSAPP_TEMPLATES.order_delivered.body, {
          '{{1}}': sanitizeInput(order.customerName),
          '{{2}}': order.orderNumber,
          '{{3}}': order.restaurantName,
          '{{4}}': formatCurrency(order.totalAmount, order.currency || this.CURRENCY),
        });
        break;

      case 'cancelled':
        templateType = 'order_cancelled';
        message = this.renderTemplate(RESTAURANT_WHATSAPP_TEMPLATES.order_cancelled.body, {
          '{{1}}': sanitizeInput(order.customerName),
          '{{2}}': order.orderNumber,
          '{{3}}': formatCurrency(order.totalAmount, order.currency || this.CURRENCY),
        });
        break;

      default:
        return { success: false, error: `Unknown status: ${newStatus}` };
    }

    return this.sendWhatsAppMessage(
      order.customerPhone,
      message,
      templateType,
      { orderId: order.orderId, orderNumber: order.orderNumber, previousStatus, newStatus }
    );
  }

  /**
   * Send delivery tracking update
   */
  async sendDeliveryUpdate(
    order: RestaurantOrder,
    updateType: 'driver_assigned' | 'driver_arriving' | 'delivered'
  ): Promise<WhatsAppSendResult> {
    let message: string;
    const templateType: RestaurantTemplateType = `delivery_${updateType}` as RestaurantTemplateType;

    switch (updateType) {
      case 'driver_assigned':
        message = `🚴 *Driver Assigned*\n\nHi ${sanitizeInput(order.customerName)}, your order ${order.orderNumber} is on its way!\n\nDriver will reach you in approx. 30 mins.\n\nTrack your order in real-time!`;
        break;
      case 'driver_arriving':
        message = `📍 *Almost There!*\n\nHi ${sanitizeInput(order.customerName)},\n\nYour order ${order.orderNumber} from ${order.restaurantName} is arriving in 5 minutes!\n\nPlease be ready to receive.`;
        break;
      case 'delivered':
        message = this.renderTemplate(RESTAURANT_WHATSAPP_TEMPLATES.order_delivered.body, {
          '{{1}}': sanitizeInput(order.customerName),
          '{{2}}': order.orderNumber,
          '{{3}}': order.restaurantName,
          '{{4}}': formatCurrency(order.totalAmount, order.currency || this.CURRENCY),
        });
        break;
    }

    return this.sendWhatsAppMessage(
      order.customerPhone,
      message,
      templateType,
      { orderId: order.orderId, updateType }
    );
  }

  // =========================================================================
  // Reservation Reminders
  // =========================================================================

  /**
   * Send reservation reminder
   * Triggered: 2 hours and 30 minutes before reservation
   */
  async sendReservationReminder(
    reservation: RestaurantReservation,
    reminderType: '2_hours' | '30_minutes'
  ): Promise<WhatsAppSendResult> {
    const template = reminderType === '2_hours'
      ? RESTAURANT_WHATSAPP_TEMPLATES.reservation_reminder_2h
      : RESTAURANT_WHATSAPP_TEMPLATES.reservation_reminder_30m;

    const dateStr = formatDate(reservation.date);
    const timeStr = formatTime(reservation.time);

    const variables = {
      '{{1}}': sanitizeInput(reservation.guestName),
      '{{2}}': reservation.confirmationNumber,
      '{{3}}': dateStr,
      '{{4}}': timeStr,
      '{{5}}': reservation.guestCount.toString(),
      '{{6}}': reservation.restaurantName,
      '{{7}}': reservation.tableNumber ? `Table ${reservation.tableNumber}` : 'Your table',
    };

    const message = this.renderTemplate(template.body, variables);

    return this.sendWhatsAppMessage(
      reservation.guestPhone,
      message,
      reminderType === '2_hours' ? 'reservation_reminder_2h' : 'reservation_reminder_30m',
      { reservationId: reservation.reservationId, confirmationNumber: reservation.confirmationNumber }
    );
  }

  /**
   * Send reservation confirmation
   */
  async sendReservationConfirmation(reservation: RestaurantReservation): Promise<WhatsAppSendResult> {
    const template = RESTAURANT_WHATSAPP_TEMPLATES.reservation_confirmation;

    const dateStr = formatDate(reservation.date);
    const timeStr = formatTime(reservation.time);

    const variables = {
      '{{1}}': sanitizeInput(reservation.guestName),
      '{{2}}': reservation.confirmationNumber,
      '{{3}}': dateStr,
      '{{4}}': timeStr,
      '{{5}}': reservation.guestCount.toString(),
      '{{6}}': reservation.restaurantName,
      '{{7}}': reservation.tableNumber ? `Table ${reservation.tableNumber}` : 'Your table',
    };

    const message = this.renderTemplate(template.body, variables);

    return this.sendWhatsAppMessage(
      reservation.guestPhone,
      message,
      'reservation_confirmation',
      { reservationId: reservation.reservationId, confirmationNumber: reservation.confirmationNumber }
    );
  }

  /**
   * Send reservation cancellation notification
   */
  async sendReservationCancellation(
    reservation: RestaurantReservation,
    cancelledBy: 'restaurant' | 'customer'
  ): Promise<WhatsAppSendResult> {
    const template = RESTAURANT_WHATSAPP_TEMPLATES.reservation_cancelled;

    const dateStr = formatDate(reservation.date);
    const timeStr = formatTime(reservation.time);

    const variables = {
      '{{1}}': sanitizeInput(reservation.guestName),
      '{{2}}': reservation.confirmationNumber,
      '{{3}}': dateStr,
      '{{4}}': timeStr,
      '{{5}}': reservation.restaurantName,
    };

    const message = this.renderTemplate(template.body, variables);

    return this.sendWhatsAppMessage(
      reservation.guestPhone,
      message,
      'reservation_cancelled',
      { reservationId: reservation.reservationId, cancelledBy }
    );
  }

  // =========================================================================
  // Marketing & Campaigns
  // =========================================================================

  /**
   * Send birthday offer to customer
   */
  async sendBirthdayOffer(
    customer: RestaurantCustomer,
    offerCode: string,
    offerDetails: {
      discountPercent?: number;
      discountAmount?: number;
      freeItem?: string;
      validDays?: number;
    }
  ): Promise<WhatsAppSendResult> {
    const template = RESTAURANT_WHATSAPP_TEMPLATES.birthday_offer;

    let offerText = '';
    if (offerDetails.discountPercent) {
      offerText = `${offerDetails.discountPercent}% OFF`;
    } else if (offerDetails.discountAmount) {
      offerText = `₹${offerDetails.discountAmount} OFF`;
    } else if (offerDetails.freeItem) {
      offerText = `FREE ${offerDetails.freeItem}`;
    }

    const validDays = offerDetails.validDays || 7;

    const variables = {
      '{{1}}': sanitizeInput(customer.name),
      '{{2}}': offerText,
      '{{3}}': offerCode,
      '{{4}}': validDays.toString(),
      '{{5}}': customer.preferences?.favoriteCuisines?.[0] || 'our restaurant',
    };

    const message = this.renderTemplate(template.body, variables);

    return this.sendWhatsAppMessage(
      customer.phone,
      message,
      'birthday_offer',
      { customerId: customer.customerId, offerCode }
    );
  }

  /**
   * Send anniversary offer to customer
   */
  async sendAnniversaryOffer(
    customer: RestaurantCustomer,
    offerCode: string,
    yearsCount: number
  ): Promise<WhatsAppSendResult> {
    const template = RESTAURANT_WHATSAPP_TEMPLATES.anniversary_offer;

    const variables = {
      '{{1}}': sanitizeInput(customer.name),
      '{{2}}': yearsCount.toString(),
      '{{3}}': offerCode,
      '{{4}}': '7', // Valid for 7 days
      '{{5}}': customer.preferences?.favoriteCuisines?.[0] || 'our restaurant',
    };

    const message = this.renderTemplate(template.body, variables);

    return this.sendWhatsAppMessage(
      customer.phone,
      message,
      'anniversary_offer',
      { customerId: customer.customerId, offerCode, yearsCount }
    );
  }

  /**
   * Send re-engagement message to lapsed customers
   */
  async sendReengagement(
    customer: RestaurantCustomer,
    daysSinceLastVisit: number,
    offerCode?: string
  ): Promise<WhatsAppSendResult> {
    const template = RESTAURANT_WHATSAPP_TEMPLATES.reengagement;

    let messageBody = template.body;
    if (offerCode) {
      messageBody += `\n\nUse code *${offerCode}* for a special offer on your next visit!`;
    }

    const variables = {
      '{{1}}': sanitizeInput(customer.name),
      '{{2}}': daysSinceLastVisit.toString(),
      '{{3}}': customer.preferences?.favoriteCuisines?.[0] || 'our restaurant',
      '{{4}}': offerCode || '',
    };

    const message = this.renderTemplate(messageBody, variables);

    return this.sendWhatsAppMessage(
      customer.phone,
      message,
      'reengagement',
      { customerId: customer.customerId, daysSinceLastVisit, offerCode }
    );
  }

  /**
   * Send special deal/offer notification
   */
  async sendSpecialDeal(
    customer: RestaurantCustomer,
    deal: {
      title: string;
      description: string;
      offerCode: string;
      validUntil: Date;
      minOrder?: number;
    }
  ): Promise<WhatsAppSendResult> {
    const template = RESTAURANT_WHATSAPP_TEMPLATES.special_deal;

    const validUntil = deal.validUntil.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });

    const variables = {
      '{{1}}': sanitizeInput(customer.name),
      '{{2}}': deal.title,
      '{{3}}': truncate(sanitizeInput(deal.description), 100),
      '{{4}}': deal.offerCode,
      '{{5}}': validUntil,
      '{{6}}': deal.minOrder ? `Min order ₹${deal.minOrder}` : '',
    };

    const message = this.renderTemplate(template.body, variables);

    return this.sendWhatsAppMessage(
      customer.phone,
      message,
      'special_deal',
      { customerId: customer.customerId, offerCode: deal.offerCode }
    );
  }

  /**
   * Send loyalty points reminder
   */
  async sendLoyaltyReminder(
    customer: RestaurantCustomer,
    pointsToExpire: number,
    expiringDate: Date
  ): Promise<WhatsAppSendResult> {
    const template = RESTAURANT_WHATSAPP_TEMPLATES.loyalty_reminder;

    const expiringDateStr = expiringDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });

    const variables = {
      '{{1}}': sanitizeInput(customer.name),
      '{{2}}': pointsToExpire.toString(),
      '{{3}}': expiringDateStr,
      '{{4}}': (customer.loyaltyPoints || 0).toString(),
    };

    const message = this.renderTemplate(template.body, variables);

    return this.sendWhatsAppMessage(
      customer.phone,
      message,
      'loyalty_reminder',
      { customerId: customer.customerId, pointsToExpire }
    );
  }

  // =========================================================================
  // Staff Notifications
  // =========================================================================

  /**
   * Send new order alert to staff/manager
   */
  async sendNewOrderAlert(
    staffPhone: string,
    order: RestaurantOrder,
    priority: 'high' | 'normal' = 'normal'
  ): Promise<WhatsAppSendResult> {
    const itemsList = order.items
      .map((item) => `${item.quantity}x ${item.name}`)
      .join('\n• ');

    let message = `🔔 *NEW ORDER* #${order.orderNumber}\n\n`;
    message += `📋 Items:\n• ${itemsList}\n\n`;
    message += `💰 Total: ${formatCurrency(order.totalAmount, order.currency || this.CURRENCY)}\n`;
    message += `📱 Customer: ${order.customerName}\n`;

    if (order.orderType === 'delivery') {
      message += `🚚 *DELIVERY*\n`;
      if (order.deliveryAddress) {
        message += `📍 ${order.deliveryAddress.line1}, ${order.deliveryAddress.city}`;
      }
    } else if (order.orderType === 'takeaway') {
      message += `📦 *TAKEAWAY*`;
    } else {
      message += `🍽️ *DINE-IN*`;
    }

    message = `${priority === 'high' ? '⚠️' : ''}${message}`;

    return this.sendWhatsAppMessage(
      staffPhone,
      message,
      'staff_new_order',
      { orderId: order.orderId, orderNumber: order.orderNumber, priority },
      'staff'
    );
  }

  /**
   * Send low stock alert to owner/manager
   */
  async sendLowStockAlert(
    staffPhone: string,
    alert: {
      itemName: string;
      currentStock: number;
      threshold: number;
      branchName: string;
    }
  ): Promise<WhatsAppSendResult> {
    const message = `⚠️ *LOW STOCK ALERT*\n\n`;
    message += `📦 Item: ${sanitizeInput(alert.itemName)}\n`;
    message += `📊 Current Stock: ${alert.currentStock}\n`;
    message += `🔴 Threshold: ${alert.threshold}\n`;
    message += `🏪 Branch: ${alert.branchName}\n\n`;
    message += `Please restock immediately!`;

    return this.sendWhatsAppMessage(
      staffPhone,
      message,
      'staff_low_stock',
      { itemName: alert.itemName, currentStock: alert.currentStock },
      'staff'
    );
  }

  // =========================================================================
  // Core Message Sending
  // =========================================================================

  /**
   * Send WhatsApp message
   */
  async sendWhatsAppMessage(
    phone: string,
    message: string,
    templateType: RestaurantTemplateType,
    metadata?: Record<string, unknown>,
    category: 'customer' | 'staff' = 'customer'
  ): Promise<WhatsAppSendResult> {
    // Validate phone
    if (!isValidPhone(phone)) {
      const error = `Invalid phone number: ${phone}`;
      logger.error(`[WhatsApp] ${error}`);
      return { success: false, error };
    }

    const formattedPhone = formatWhatsAppPhone(phone);

    // Log the attempt
    const logEntry = await this.logStore.add({
      templateType,
      recipientPhone: formattedPhone,
      status: 'sent',
      metadata: { ...metadata, category },
    });

    // Check if Twilio is configured
    if (!this.twilioClient) {
      logger.info(`[WhatsApp SIMULATED] To: ${formattedPhone}`);
      logger.info(`[WhatsApp SIMULATED] Template: ${templateType}`);
      logger.info(`[WhatsApp SIMULATED] Message:\n${message}`);

      return {
        success: true,
        messageId: `sim-${Date.now()}`,
        templateType,
        recipientPhone: formattedPhone,
        sentAt: new Date(),
      };
    }

    try {
      const result = await this.twilioClient.messages.create({
        from: TWILIO_WHATSAPP_FROM,
        to: `whatsapp:${formattedPhone}`,
        body: message,
      });

      await this.logStore.updateStatus(logEntry.id, 'sent', result.sid);

      logger.info(`[WhatsApp] Message sent successfully`, {
        messageId: result.sid,
        templateType,
        to: formattedPhone,
      });

      return {
        success: true,
        messageId: result.sid,
        templateType,
        recipientPhone: formattedPhone,
        sentAt: new Date(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await this.logStore.updateStatus(logEntry.id, 'failed');

      logger.error(`[WhatsApp] Send failed`, {
        templateType,
        to: formattedPhone,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
        templateType,
        recipientPhone: formattedPhone,
      };
    }
  }

  // =========================================================================
  // Helper Methods
  // =========================================================================

  /**
   * Render template with variables
   */
  private renderTemplate(template: string, variables: Record<string, string>): string {
    let rendered = template;
    for (const [key, value] of Object.entries(variables)) {
      rendered = rendered.split(key).join(value);
    }
    return rendered;
  }

  /**
   * Format estimated time
   */
  private formatETA(order: RestaurantOrder): string {
    if (order.estimatedReadyTime) {
      const now = new Date();
      const diff = order.estimatedReadyTime.getTime() - now.getTime();
      const minutes = Math.max(0, Math.round(diff / 60000));
      return `${minutes} minutes`;
    }

    switch (order.orderType) {
      case 'delivery':
        return '30-45 minutes';
      case 'takeaway':
        return '15-20 minutes';
      case 'dine_in':
        return 'being prepared';
      default:
        return 'soon';
    }
  }

  // =========================================================================
  // Query & Stats Methods
  // =========================================================================

  /**
   * Get message history for a phone number
   */
  async getMessageHistory(phone: string, limit = 50): Promise<WhatsAppLogEntry[]> {
    return this.logStore.findByRecipient(formatWhatsAppPhone(phone), limit);
  }

  /**
   * Get statistics
   */
  async getStats(templateType?: RestaurantTemplateType): Promise<{
    total: number;
    sent: number;
    failed: number;
    delivered: number;
    deliveryRate: number;
    byTemplate: Record<string, number>;
  }> {
    const stats = await this.logStore.getStats(templateType);

    return {
      ...stats,
      deliveryRate: stats.total > 0 ? Math.round((stats.delivered / stats.total) * 100) : 0,
    };
  }

  /**
   * Check if customer has WhatsApp notifications enabled
   */
  hasNotificationsEnabled(
    customer: RestaurantCustomer,
    channel: 'whatsapp' | 'sms' | 'email'
  ): boolean {
    const enabled = customer.preferences?.notificationsEnabled;
    if (!enabled) return true; // Default to enabled
    return enabled[channel] ?? true;
  }

  /**
   * Check 24-hour session validity
   */
  isWithinSessionWindow(lastCustomerMessage?: Date): boolean {
    if (!lastCustomerMessage) return true;
    const hoursSince = (Date.now() - lastCustomerMessage.getTime()) / (1000 * 60 * 60);
    return hoursSince < SESSION_VALID_HOURS;
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const restaurantWhatsAppService = new RestaurantWhatsAppService();
export default RestaurantWhatsAppService;
