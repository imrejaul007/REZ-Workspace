/**
 * Restaurant Flow Adapters
 * Restaurant-specific business logic that orchestrates multiple services
 */

import { posService } from '../services/pos.client';
import { menuService } from '../services/menu.client';
import { kdsService } from '../services/kds.client';
import { staffService } from '../services/staff.client';
import { tableBookingService } from '../services/table-booking.client';
import { paymentService, walletService, notificationService } from '../services/rabtul.client';
import { invoiceService } from '../services/invoice.client';

// Custom error class for flow errors
export class FlowError extends Error {
  constructor(
    message: string,
    public readonly flow: string,
    public readonly step: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'FlowError';
  }
}

// Helper to safely execute service calls
async function safeExecute<T>(
  flow: string,
  step: string,
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error(`[${flow}] Step "${step}" failed:`, error);
    throw new FlowError(
      `Flow "${flow}" failed at step "${step}"`,
      flow,
      step,
      error
    );
  }
}

/**
 * Complete Dine-In Flow
 * 1. Create reservation
 * 2. Seat guest
 * 3. Create order
 * 4. Add items
 * 5. Process payment
 * 6. Generate invoice
 */
export const dineInFlow = {
  async startReservation(data: {
    customerName: string;
    customerPhone: string;
    partySize: number;
    date: string;
    time: string;
    restaurantId: string;
  }) {
    // 1. Create reservation
    const reservation = await safeExecute('dineInFlow', 'createReservation', () =>
      tableBookingService.createReservation({
        ...data,
        status: 'pending',
      })
    );

    // 2. Send confirmation SMS (non-fatal if fails)
    try {
      await notificationService.sendSMS({
        phone: data.customerPhone,
        message: `Booking confirmed for ${data.partySize} at ${data.time}. See you soon!`,
      });
    } catch (error) {
      console.warn('[dineInFlow] SMS confirmation failed:', error);
    }

    return reservation;
  },

  async seatGuest(reservationId: string, tableId: string) {
    // Update reservation status
    const reservation = await safeExecute('dineInFlow', 'updateReservation', () =>
      tableBookingService.updateReservation(reservationId, {
        status: 'seated',
        tableId,
      })
    );

    // Update table status
    await safeExecute('dineInFlow', 'updateTableStatus', () =>
      tableBookingService.updateTableStatus(tableId, 'occupied')
    );

    return reservation;
  },

  async createOrder(data: {
    restaurantId: string;
    tableId: string;
    customerId?: string;
    items: Array<{ itemId: string; quantity: number; price: number }>;
  }) {
    // Create POS order
    const order = await safeExecute('dineInFlow', 'createOrder', () =>
      posService.createOrder({
        restaurantId: data.restaurantId,
        tableId: data.tableId,
        customerId: data.customerId,
        items: data.items,
        type: 'dine-in',
      })
    );

    // Send to KDS
    await safeExecute('dineInFlow', 'sendToKDS', () =>
      kdsService.createOrder({
        orderId: order.id,
        restaurantId: data.restaurantId,
        items: data.items,
        priority: 'normal',
      })
    );

    return order;
  },

  async processPayment(orderId: string, paymentData: {
    method: 'card' | 'cash' | 'upi' | 'wallet';
    amount: number;
    customerId?: string;
    useWallet?: boolean;
  }) {
    // Use wallet if requested
    if (paymentData.useWallet && paymentData.customerId) {
      const walletResult = await safeExecute('dineInFlow', 'walletDeduct', () =>
        walletService.deductCoins(
          paymentData.customerId,
          paymentData.amount,
          `order-${orderId}`
        )
      );

      if (!walletResult?.success) {
        throw new FlowError(
          'Wallet deduction failed',
          'dineInFlow',
          'walletDeduct',
          walletResult
        );
      }
    }

    // Process payment
    const payment = await safeExecute('dineInFlow', 'createPayment', () =>
      paymentService.createOrder({
        orderId,
        amount: paymentData.amount,
        method: paymentData.method,
      })
    );

    // Update order status
    await safeExecute('dineInFlow', 'updateOrderStatus', () =>
      posService.updateOrderStatus(orderId, 'paid')
    );

    // Generate invoice
    const invoice = await safeExecute('dineInFlow', 'createInvoice', () =>
      invoiceService.createInvoice({
        orderId,
        customerId: paymentData.customerId,
      })
    );

    return { payment, invoice };
  },
};

/**
 * Quick Service Flow (Fast Food / QSR)
 */
export const quickServiceFlow = {
  async createQuickOrder(data: {
    restaurantId: string;
    items: Array<{ itemId: string; quantity: number; price: number }>;
    customerId?: string;
    type: 'counter' | 'takeaway' | 'delivery';
  }) {
    // Create order
    const order = await safeExecute('quickServiceFlow', 'createOrder', () =>
      posService.createOrder({
        ...data,
        type: data.type,
      })
    );

    // Send to KDS with HIGH priority for quick service
    await safeExecute('quickServiceFlow', 'sendToKDS', () =>
      kdsService.createOrder({
        orderId: order.id,
        restaurantId: data.restaurantId,
        items: data.items,
        priority: 'high',
      })
    );

    return order;
  },
};

/**
 * Table QR Ordering Flow
 */
export const qrOrderingFlow = {
  async startSession(data: {
    restaurantId: string;
    tableId: string;
  }) {
    // Get menu
    const menu = await safeExecute('qrOrderingFlow', 'getMenu', () =>
      menuService.getMenus({
        restaurantId: data.restaurantId,
        available: true,
      })
    );

    return {
      sessionId: `QR-${data.tableId}-${Date.now()}`,
      tableId: data.tableId,
      restaurantId: data.restaurantId,
      menu,
    };
  },

  async addToOrder(sessionId: string, item: unknown) {
    // This would typically go to a temporary cart
    // For now, create direct order
    return await safeExecute('qrOrderingFlow', 'addToOrder', () =>
      posService.addItem(sessionId, item)
    );
  },

  async submitOrder(data: {
    sessionId: string;
    restaurantId: string;
    tableId: string;
    items: unknown[];
    customerId?: string;
  }) {
    // Create order
    const order = await safeExecute('qrOrderingFlow', 'createOrder', () =>
      posService.createOrder({
        restaurantId: data.restaurantId,
        tableId: data.tableId,
        customerId: data.customerId,
        items: data.items,
        type: 'qr-order',
        source: 'qr-code',
      })
    );

    // Send to KDS
    await safeExecute('qrOrderingFlow', 'sendToKDS', () =>
      kdsService.createOrder({
        orderId: order.id,
        restaurantId: data.restaurantId,
        items: data.items,
        priority: 'normal',
      })
    );

    // Notify staff (non-fatal if fails)
    try {
      await notificationService.sendPush({
        userId: 'staff',
        title: 'New QR Order',
        body: `Table ${data.tableId} has a new order`,
      });
    } catch (error) {
      console.warn('[qrOrderingFlow] Staff notification failed:', error);
    }

    return order;
  },
};

/**
 * Reservation Flow
 */
export const reservationFlow = {
  async makeReservation(data: {
    restaurantId: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    partySize: number;
    date: string;
    time: string;
    specialRequests?: string;
    occasion?: string;
  }) {
    // Check availability
    const availability = await safeExecute('reservationFlow', 'checkAvailability', () =>
      tableBookingService.checkAvailability({
        restaurantId: data.restaurantId,
        date: data.date,
        time: data.time,
        partySize: data.partySize,
      })
    );

    if (availability.availableSlots === 0) {
      throw new FlowError(
        'No tables available for this time',
        'reservationFlow',
        'checkAvailability',
        { reason: 'no_slots' }
      );
    }

    // Create reservation
    const reservation = await safeExecute('reservationFlow', 'createReservation', () =>
      tableBookingService.createReservation({
        ...data,
        status: 'pending',
      })
    );

    // Send confirmation SMS (non-fatal)
    try {
      await notificationService.sendSMS({
        phone: data.customerPhone,
        message: `Hi ${data.customerName}! Your table for ${data.partySize} is confirmed for ${data.date} at ${data.time}. Reply CANCEL to cancel.`,
      });
    } catch (error) {
      console.warn('[reservationFlow] SMS confirmation failed:', error);
    }

    // Send email confirmation if provided (non-fatal)
    if (data.customerEmail) {
      try {
        await notificationService.sendEmail({
          to: data.customerEmail,
          subject: 'Booking Confirmation',
          body: `Your table for ${data.partySize} is confirmed for ${data.date} at ${data.time}.`,
        });
      } catch (error) {
        console.warn('[reservationFlow] Email confirmation failed:', error);
      }
    }

    return reservation;
  },

  async sendReminder(reservationId: string) {
    const reservation = await safeExecute('reservationFlow', 'getReservation', () =>
      tableBookingService.getReservation(reservationId)
    );

    try {
      await notificationService.sendSMS({
        phone: reservation.customerPhone,
        message: `Reminder: Your table at ${reservation.time} for ${reservation.partySize} is confirmed. See you soon!`,
      });
    } catch (error) {
      console.warn('[reservationFlow] Reminder SMS failed:', error);
      return { sent: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }

    return { sent: true };
  },
};

/**
 * Staff Scheduling Flow
 */
export const staffSchedulingFlow = {
  async createWeeklySchedule(data: {
    restaurantId: string;
    startDate: string;
    endDate: string;
    staffPreferences?: Record<string, unknown>;
  }) {
    // Get all staff
    const staff = await safeExecute('staffSchedulingFlow', 'getStaff', () =>
      staffService.getStaff({
        restaurantId: data.restaurantId,
        active: true,
      })
    );

    // Generate shifts for each staff
    const shifts = [];
    for (const member of staff) {
      const shift = await safeExecute('staffSchedulingFlow', 'createShift', () =>
        staffService.createShift({
          restaurantId: data.restaurantId,
          staffId: member.id,
          startDate: data.startDate,
          endDate: data.endDate,
          preferences: data.staffPreferences?.[member.id],
        })
      );
      shifts.push(shift);
    }

    return { shifts };
  },

  async checkIn(staffId: string, shiftId: string) {
    const attendance = await safeExecute('staffSchedulingFlow', 'checkIn', () =>
      staffService.checkIn({
        staffId,
        shiftId,
        timestamp: new Date(),
      })
    );

    return attendance;
  },

  async checkOut(staffId: string) {
    const attendance = await safeExecute('staffSchedulingFlow', 'checkOut', () =>
      staffService.checkOut({
        staffId,
        timestamp: new Date(),
      })
    );

    return attendance;
  },
};
