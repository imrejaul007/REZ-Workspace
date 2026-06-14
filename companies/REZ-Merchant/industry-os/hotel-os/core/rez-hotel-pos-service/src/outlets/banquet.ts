import { Item, ItemCategory, TaxCategory, ItemStatus } from '../models/Item';
import { Transaction, ITransactionItem, TransactionType, TransactionStatus } from '../models/Transaction';
import { Folio } from '../models/Folio';
import { logger } from '../config/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Banquet Outlet Module
 * Handles banquet-specific operations including:
 * - Event booking
 * - Menu planning
 * - Equipment rental
 * - Venue management
 * - Function billing
 */

export interface BanquetEvent {
  eventId: string;
  propertyId: string;
  outletId: string;
  eventName: string;
  eventType: 'WEDDING' | 'CORPORATE' | 'SOCIAL' | 'MEETING' | 'OTHER';
  guestCount: number;
  bookingDate: Date;
  startTime: string;
  endTime: string;
  venue: string;
  guestId?: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  companyName?: string;
  items: BanquetItem[];
  services: BanquetService[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: 'ENQUIRY' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  advancePaid: number;
  balanceAmount: number;
  notes?: string;
  folioId?: string;
  transactionId?: string;
  createdAt: Date;
}

export interface BanquetItem {
  itemId: string;
  itemName: string;
  category: 'FOOD' | 'BEVERAGE' | 'EQUIPMENT' | 'DECORATION';
  quantity: number;
  unitPrice: number;
  perUnit: boolean;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
}

export interface BanquetService {
  serviceId: string;
  serviceName: string;
  provider?: string;
  cost: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
}

export interface BanquetQuote {
  quoteId: string;
  eventType: string;
  guestCount: number;
  menuItems: Array<{
    itemName: string;
    quantity: number;
    pricePerPerson: number;
  }>;
  services: Array<{
    serviceName: string;
    cost: number;
  }>;
  venueCharge: number;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  validUntil: Date;
}

export class BanquetOutlet {
  private outletId: string;
  private propertyId: string;

  constructor(outletId: string, propertyId: string) {
    this.outletId = outletId;
    this.propertyId = propertyId;
  }

  /**
   * Get banquet menu items
   */
  async getMenu(category?: string): Promise<unknown[]> {
    const query: Record<string, unknown> = {
      propertyId: this.propertyId,
      outletType: 'BANQUET',
      outletId: this.outletId,
      status: ItemStatus.ACTIVE,
      isAvailable: true,
    };

    if (category) {
      query.category = category;
    }

    return Item.find(query);
  }

  /**
   * Generate a quote for an event
   */
  async generateQuote(data: {
    eventType: 'WEDDING' | 'CORPORATE' | 'SOCIAL' | 'MEETING' | 'OTHER';
    guestCount: number;
    menuItems: Array<{
      itemId: string;
      pricePerPerson: number;
    }>;
    services?: Array<{
      serviceName: string;
      cost: number;
    }>;
    venueCharge?: number;
  }): Promise<BanquetQuote> {
    const quoteId = `QUOTE-${uuidv4().substring(0, 10).toUpperCase()}`;

    const menuItems = await Promise.all(
      data.menuItems.map(async (item) => {
        const menuItem = await Item.findOne({ itemId: item.itemId });
        return {
          itemName: menuItem?.name || 'Unknown Item',
          quantity: data.guestCount,
          pricePerPerson: item.pricePerPerson,
        };
      })
    );

    const menuSubtotal = menuItems.reduce(
      (sum, item) => sum + item.quantity * item.pricePerPerson,
      0
    );

    const servicesTotal = (data.services || []).reduce((sum, s) => sum + s.cost, 0);
    const venueCharge = data.venueCharge || 0;
    const subtotal = menuSubtotal + servicesTotal + venueCharge;
    const taxAmount = Math.round(subtotal * 18) / 100; // Standard GST 18%
    const totalAmount = subtotal + taxAmount;

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30); // Valid for 30 days

    return {
      quoteId,
      eventType: data.eventType,
      guestCount: data.guestCount,
      menuItems,
      services: data.services || [],
      venueCharge,
      subtotal,
      taxAmount,
      totalAmount,
      validUntil,
    };
  }

  /**
   * Create a banquet event booking
   */
  async createBooking(data: {
    eventName: string;
    eventType: 'WEDDING' | 'CORPORATE' | 'SOCIAL' | 'MEETING' | 'OTHER';
    guestCount: number;
    bookingDate: Date;
    startTime: string;
    endTime: string;
    venue: string;
    guestId?: string;
    guestName: string;
    guestPhone: string;
    guestEmail?: string;
    companyName?: string;
    items: BanquetItem[];
    services: BanquetService[];
    advancePaid?: number;
    folioId?: string;
    notes?: string;
    staffId?: string;
  }): Promise<BanquetEvent> {
    const eventId = `BNQT-${uuidv4().substring(0, 10).toUpperCase()}`;

    // Calculate item totals
    const itemsWithTotals: BanquetItem[] = data.items.map((item) => {
      const quantity = item.perUnit ? item.quantity : item.quantity * data.guestCount;
      const subtotal = quantity * item.unitPrice;
      const taxAmount = Math.round(subtotal * item.taxRate) / 100;

      return {
        ...item,
        quantity,
        taxAmount,
        totalAmount: subtotal + taxAmount,
      };
    });

    // Calculate service totals
    const servicesWithTotals: BanquetService[] = data.services.map((service) => {
      const taxAmount = Math.round(service.cost * service.taxRate) / 100;
      return {
        ...service,
        taxAmount,
        totalAmount: service.cost + taxAmount,
      };
    });

    const itemsSubtotal = itemsWithTotals.reduce((sum, i) => sum + i.totalAmount, 0);
    const servicesSubtotal = servicesWithTotals.reduce((sum, s) => sum + s.totalAmount, 0);
    const subtotal = itemsSubtotal + servicesSubtotal;
    const taxAmount = itemsWithTotals.reduce((sum, i) => sum + i.taxAmount, 0) +
                      servicesWithTotals.reduce((sum, s) => sum + s.taxAmount, 0);
    const advancePaid = data.advancePaid || 0;
    const balanceAmount = subtotal - advancePaid;

    // Create transaction
    const transactionItems: ITransactionItem[] = [
      ...itemsWithTotals.map((item) => ({
        itemId: item.itemId,
        itemName: item.itemName,
        category: item.category as unknown as ItemCategory,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        taxAmount: item.taxAmount,
        discountRate: 0,
        discountAmount: 0,
        totalAmount: item.totalAmount,
      })),
    ];

    const transaction = new Transaction({
      transactionId: `TXN-${uuidv4().substring(0, 12).toUpperCase()}`,
      folioId: data.folioId,
      propertyId: this.propertyId,
      outletType: 'BANQUET',
      outletId: this.outletId,
      type: TransactionType.CHARGE,
      status: TransactionStatus.PENDING,
      items: transactionItems,
      subtotal,
      taxAmount,
      discountAmount: 0,
      totalAmount: subtotal,
      guestId: data.guestId,
      guestName: data.guestName,
      roomNumber: data.venue,
      staffId: data.staffId,
      notes: `Event: ${data.eventName}, Type: ${data.eventType}, Guests: ${data.guestCount}`,
      orderId: eventId,
    });

    await transaction.save();

    // Add to folio if specified
    if (data.folioId) {
      await Folio.findOneAndUpdate(
        { folioId: data.folioId },
        {
          $push: { transactions: transaction.transactionId },
          $inc: { totalAmount: subtotal, taxAmount: taxAmount },
          $set: { netAmount: subtotal },
        }
      );
    }

    logger.info('Banquet booking created', {
      eventId,
      transactionId: transaction.transactionId,
      eventName: data.eventName,
      totalAmount: subtotal,
    });

    return {
      eventId,
      propertyId: this.propertyId,
      outletId: this.outletId,
      eventName: data.eventName,
      eventType: data.eventType,
      guestCount: data.guestCount,
      bookingDate: data.bookingDate,
      startTime: data.startTime,
      endTime: data.endTime,
      venue: data.venue,
      guestId: data.guestId,
      guestName: data.guestName,
      guestPhone: data.guestPhone,
      guestEmail: data.guestEmail,
      companyName: data.companyName,
      items: itemsWithTotals,
      services: servicesWithTotals,
      subtotal,
      taxAmount,
      discountAmount: 0,
      totalAmount: subtotal,
      status: 'CONFIRMED',
      advancePaid,
      balanceAmount,
      notes: data.notes,
      folioId: data.folioId,
      transactionId: transaction.transactionId,
      createdAt: new Date(),
    };
  }

  /**
   * Record advance payment for an event
   */
  async recordAdvancePayment(data: {
    eventId: string;
    amount: number;
    paymentMethod: string;
    reference?: string;
    staffId?: string;
  }): Promise<{ advanceId: string; newBalance: number }> {
    const transaction = await Transaction.findOne({ orderId: data.eventId });
    if (!transaction) {
      throw new Error(`Event not found: ${data.eventId}`);
    }

    const advanceId = `ADV-${uuidv4().substring(0, 10).toUpperCase()}`;

    const advanceTransaction = new Transaction({
      transactionId: advanceId,
      folioId: transaction.folioId,
      propertyId: this.propertyId,
      outletType: 'BANQUET',
      outletId: this.outletId,
      type: TransactionType.PAYMENT,
      status: TransactionStatus.COMPLETED,
      items: [],
      subtotal: 0,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: data.amount,
      paymentMethod: data.paymentMethod as unknown,
      paymentReference: data.reference,
      guestId: transaction.guestId,
      guestName: transaction.guestName,
      staffId: data.staffId,
      notes: `Advance payment for event ${data.eventId}`,
      orderId: data.eventId,
      completedAt: new Date(),
    });

    await advanceTransaction.save();

    logger.info('Banquet advance payment recorded', {
      eventId: data.eventId,
      advanceId,
      amount: data.amount,
    });

    return {
      advanceId,
      newBalance: transaction.totalAmount - data.amount,
    };
  }

  /**
   * Update event status
   */
  async updateEventStatus(
    eventId: string,
    status: 'ENQUIRY' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  ): Promise<void> {
    const transaction = await Transaction.findOne({ orderId: eventId });
    if (!transaction) {
      throw new Error(`Event not found: ${eventId}`);
    }

    if (status === 'COMPLETED') {
      transaction.status = TransactionStatus.COMPLETED;
      transaction.completedAt = new Date();
    } else if (status === 'CANCELLED') {
      transaction.status = TransactionStatus.CANCELLED;
    }

    await transaction.save();

    logger.info('Banquet event status updated', { eventId, status });
  }

  /**
   * Add extra items/services to an event
   */
  async addExtras(
    eventId: string,
    extraItems: BanquetItem[],
    extraServices: BanquetService[],
    staffId?: string
  ): Promise<{ extraId: string; additionalAmount: number }> {
    const transaction = await Transaction.findOne({ orderId: eventId });
    if (!transaction) {
      throw new Error(`Event not found: ${eventId}`);
    }

    const extraId = `EXTRA-${uuidv4().substring(0, 10).toUpperCase()}`;

    const itemsWithTotals: BanquetItem[] = extraItems.map((item) => {
      const subtotal = item.quantity * item.unitPrice;
      const taxAmount = Math.round(subtotal * item.taxRate) / 100;
      return {
        ...item,
        taxAmount,
        totalAmount: subtotal + taxAmount,
      };
    });

    const servicesWithTotals: BanquetService[] = extraServices.map((service) => {
      const taxAmount = Math.round(service.cost * service.taxRate) / 100;
      return {
        ...service,
        taxAmount,
        totalAmount: service.cost + taxAmount,
      };
    });

    const additionalAmount =
      itemsWithTotals.reduce((sum, i) => sum + i.totalAmount, 0) +
      servicesWithTotals.reduce((sum, s) => sum + s.totalAmount, 0);

    // Create extra charges transaction
    const extraTransaction = new Transaction({
      transactionId: extraId,
      folioId: transaction.folioId,
      propertyId: this.propertyId,
      outletType: 'BANQUET',
      outletId: this.outletId,
      type: TransactionType.CHARGE,
      status: TransactionStatus.COMPLETED,
      items: itemsWithTotals.map((item) => ({
        itemId: item.itemId,
        itemName: item.itemName,
        category: item.category as unknown as ItemCategory,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        taxAmount: item.taxAmount,
        discountRate: 0,
        discountAmount: 0,
        totalAmount: item.totalAmount,
      })),
      subtotal: additionalAmount,
      taxAmount:
        itemsWithTotals.reduce((sum, i) => sum + i.taxAmount, 0) +
        servicesWithTotals.reduce((sum, s) => sum + s.taxAmount, 0),
      discountAmount: 0,
      totalAmount: additionalAmount,
      guestId: transaction.guestId,
      guestName: transaction.guestName,
      staffId,
      notes: `Extra charges for event ${eventId}`,
      orderId: eventId,
      completedAt: new Date(),
    });

    await extraTransaction.save();

    // Update original transaction total
    transaction.totalAmount += additionalAmount;
    await transaction.save();

    // Update folio if linked
    if (transaction.folioId) {
      await Folio.findOneAndUpdate(
        { folioId: transaction.folioId },
        {
          $push: { transactions: extraId },
          $inc: { totalAmount: additionalAmount },
        }
      );
    }

    logger.info('Banquet extras added', {
      eventId,
      extraId,
      additionalAmount,
    });

    return { extraId, additionalAmount };
  }

  /**
   * Get events by date range
   */
  async getEventsByDateRange(startDate: Date, endDate: Date): Promise<unknown[]> {
    const startOfPeriod = new Date(startDate);
    startOfPeriod.setHours(0, 0, 0, 0);

    const endOfPeriod = new Date(endDate);
    endOfPeriod.setHours(23, 59, 59, 999);

    return Transaction.find({
      propertyId: this.propertyId,
      outletType: 'BANQUET',
      outletId: this.outletId,
      createdAt: { $gte: startOfPeriod, $lte: endOfPeriod },
    }).sort({ createdAt: 1 });
  }

  /**
   * Get venue availability
   */
  async getVenueAvailability(
    venue: string,
    date: Date
  ): Promise<Array<{ timeSlot: string; available: boolean }>> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const events = await Transaction.find({
      propertyId: this.propertyId,
      outletType: 'BANQUET',
      roomNumber: venue,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: TransactionStatus.CANCELLED },
    });

    const slots: Array<{ timeSlot: string; available: boolean }> = [];

    // Generate time slots (7 AM to 11 PM)
    for (let hour = 7; hour <= 23; hour++) {
      const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
      let available = true;

      for (const event of events) {
        if (event.notes) {
          // Parse time from notes
          const timeMatch = event.notes.match(/Time: (\d{2}:\d{2})-(\d{2}:\d{2})/);
          if (timeMatch) {
            const eventStart = this.parseTimeToMinutes(timeMatch[1]);
            const eventEnd = this.parseTimeToMinutes(timeMatch[2]);
            const slotMinutes = hour * 60;

            if (slotMinutes >= eventStart && slotMinutes < eventEnd) {
              available = false;
              break;
            }
          }
        }
      }

      slots.push({ timeSlot, available });
    }

    return slots;
  }

  /**
   * Parse time string to minutes
   */
  private parseTimeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

export default BanquetOutlet;
