import { Item, ItemCategory, TaxCategory, ItemStatus } from '../models/Item';
import { Transaction, ITransactionItem, TransactionType, TransactionStatus } from '../models/Transaction';
import { Folio } from '../models/Folio';
import { logger } from '../config/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Spa Outlet Module
 * Handles spa-specific operations including:
 * - Treatment bookings
 * - Therapist assignments
 * - Package management
 * - Retail product sales
 */

export interface SpaBooking {
  bookingId: string;
  propertyId: string;
  outletId: string;
  guestId?: string;
  guestName: string;
  guestPhone?: string;
  roomNumber?: string;
  treatments: SpaTreatment[];
  therapistId?: string;
  therapistName?: string;
  bookingDate: Date;
  startTime: string;
  endTime: string;
  duration: number; // minutes
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  folioId?: string;
  transactionId?: string;
  createdAt: Date;
}

export interface SpaTreatment {
  treatmentId: string;
  treatmentName: string;
  duration: number; // minutes
  price: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
}

export interface SpaPackage {
  packageId: string;
  packageName: string;
  description: string;
  treatments: SpaTreatment[];
  totalDuration: number;
  packagePrice: number;
  taxAmount: number;
  totalAmount: number;
  validityDays: number;
}

export class SpaOutlet {
  private outletId: string;
  private propertyId: string;

  constructor(outletId: string, propertyId: string) {
    this.outletId = outletId;
    this.propertyId = propertyId;
  }

  /**
   * Get spa treatments/menu
   */
  async getTreatments(category?: string): Promise<unknown[]> {
    const query: Record<string, unknown> = {
      propertyId: this.propertyId,
      outletType: 'SPA',
      outletId: this.outletId,
      status: ItemStatus.ACTIVE,
      isAvailable: true,
    };

    if (category) {
      query.subCategory = category;
    }

    return Item.find(query);
  }

  /**
   * Get available time slots for a date
   */
  async getAvailableSlots(
    date: Date,
    duration: number,
    therapistId?: string
  ): Promise<Array<{ startTime: string; endTime: string; available: boolean }>> {
    // Get existing bookings for the date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingBookings = await Transaction.find({
      propertyId: this.propertyId,
      outletType: 'SPA',
      outletId: this.outletId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: TransactionStatus.CANCELLED },
    });

    // Generate time slots (9 AM to 8 PM, 30-min intervals)
    const slots: Array<{ startTime: string; endTime: string; available: boolean }> = [];
    const openingHour = 9;
    const closingHour = 20;

    for (let hour = openingHour; hour < closingHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const endMinutes = minute + duration;
        const endHour = hour + Math.floor(endMinutes / 60);
        const endMinute = endMinutes % 60;

        if (endHour > closingHour) continue;

        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

        // Check if slot conflicts with existing bookings
        const slotStart = hour * 60 + minute;
        const slotEnd = slotStart + duration;
        let available = true;

        for (const booking of existingBookings) {
          if (therapistId && booking.staffId !== therapistId) continue;

          const bookingStart = this.parseTimeToMinutes(booking.notes?.split('Duration: ')[1]?.split(' ')[0] || '60');
          const bookingEnd = bookingStart + (booking.items[0]?.notes ? parseInt(booking.items[0].notes) : 60);

          if (slotStart < bookingEnd && slotEnd > bookingStart) {
            available = false;
            break;
          }
        }

        slots.push({ startTime, endTime, available });
      }
    }

    return slots;
  }

  /**
   * Book a spa treatment
   */
  async bookTreatment(data: {
    guestId?: string;
    guestName: string;
    guestPhone?: string;
    roomNumber?: string;
    treatments: Array<{
      treatmentId: string;
      treatmentName: string;
      duration: number;
    }>;
    bookingDate: Date;
    startTime: string;
    therapistId?: string;
    therapistName?: string;
    folioId?: string;
    notes?: string;
    staffId?: string;
  }): Promise<SpaBooking> {
    const bookingId = `SPA-${uuidv4().substring(0, 10).toUpperCase()}`;

    // Calculate treatment totals
    const spaTreatments: SpaTreatment[] = [];
    let totalDuration = 0;

    for (const treatment of data.treatments) {
      const menuItem = await Item.findOne({ itemId: treatment.treatmentId });
      const price = menuItem?.basePrice || 0;
      const taxRate = menuItem ? this.getTaxRate(menuItem.taxCategory) : 18;
      const taxAmount = Math.round(price * taxRate) / 100;

      spaTreatments.push({
        treatmentId: treatment.treatmentId,
        treatmentName: treatment.treatmentName,
        duration: treatment.duration,
        price,
        taxRate,
        taxAmount,
        totalAmount: price + taxAmount,
      });

      totalDuration += treatment.duration;
    }

    const subtotal = spaTreatments.reduce((sum, t) => sum + t.price, 0);
    const taxAmount = spaTreatments.reduce((sum, t) => sum + t.taxAmount, 0);
    const totalAmount = subtotal + taxAmount;

    // Calculate end time
    const [startHour, startMinute] = data.startTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = startMinutes + totalDuration;
    const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;

    // Create transaction for the booking
    const transactionItems: ITransactionItem[] = spaTreatments.map((t) => ({
      itemId: t.treatmentId,
      itemName: t.treatmentName,
      category: ItemCategory.SPA_TREATMENT,
      quantity: 1,
      unitPrice: t.price,
      taxRate: t.taxRate,
      taxAmount: t.taxAmount,
      discountRate: 0,
      discountAmount: 0,
      totalAmount: t.totalAmount,
      notes: `Duration: ${t.duration} mins`,
    }));

    const transaction = new Transaction({
      transactionId: `TXN-${uuidv4().substring(0, 12).toUpperCase()}`,
      folioId: data.folioId,
      propertyId: this.propertyId,
      outletType: 'SPA',
      outletId: this.outletId,
      type: TransactionType.CHARGE,
      status: TransactionStatus.PENDING,
      items: transactionItems,
      subtotal,
      taxAmount,
      discountAmount: 0,
      totalAmount,
      guestId: data.guestId,
      guestName: data.guestName,
      roomNumber: data.roomNumber,
      staffId: data.therapistId,
      staffName: data.therapistName,
      notes: `Booking: ${bookingId}, Date: ${data.bookingDate.toISOString().split('T')[0]}, Time: ${data.startTime}-${endTime}, Duration: ${totalDuration} mins`,
    });

    await transaction.save();

    // Add to folio if specified
    if (data.folioId) {
      await Folio.findOneAndUpdate(
        { folioId: data.folioId },
        {
          $push: { transactions: transaction.transactionId },
          $inc: { totalAmount: totalAmount, taxAmount: taxAmount },
          $set: { netAmount: totalAmount },
        }
      );
    }

    logger.info('Spa treatment booked', {
      bookingId,
      transactionId: transaction.transactionId,
      guestName: data.guestName,
      totalAmount,
    });

    return {
      bookingId,
      propertyId: this.propertyId,
      outletId: this.outletId,
      guestId: data.guestId,
      guestName: data.guestName,
      guestPhone: data.guestPhone,
      roomNumber: data.roomNumber,
      treatments: spaTreatments,
      therapistId: data.therapistId,
      therapistName: data.therapistName,
      bookingDate: data.bookingDate,
      startTime: data.startTime,
      endTime,
      duration: totalDuration,
      subtotal,
      taxAmount,
      discountAmount: 0,
      totalAmount,
      status: 'CONFIRMED',
      notes: data.notes,
      folioId: data.folioId,
      transactionId: transaction.transactionId,
      createdAt: new Date(),
    };
  }

  /**
   * Complete a spa treatment
   */
  async completeTreatment(bookingId: string, staffId?: string): Promise<void> {
    const transaction = await Transaction.findOne({
      transactionId: bookingId.replace('SPA-', 'TXN-'),
    });

    if (!transaction) {
      throw new Error(`Booking not found: ${bookingId}`);
    }

    transaction.status = TransactionStatus.COMPLETED;
    transaction.completedAt = new Date();
    if (staffId) {
      transaction.staffId = staffId;
    }

    await transaction.save();

    logger.info('Spa treatment completed', { bookingId, transactionId: transaction.transactionId });
  }

  /**
   * Cancel a spa booking
   */
  async cancelBooking(bookingId: string, reason: string): Promise<void> {
    const transaction = await Transaction.findOne({
      transactionId: bookingId.replace('SPA-', 'TXN-'),
    });

    if (!transaction) {
      throw new Error(`Booking not found: ${bookingId}`);
    }

    if (transaction.status === TransactionStatus.COMPLETED) {
      throw new Error('Cannot cancel a completed booking');
    }

    transaction.status = TransactionStatus.CANCELLED;
    transaction.notes = transaction.notes
      ? `${transaction.notes}\nCancelled: ${reason}`
      : `Cancelled: ${reason}`;

    await transaction.save();

    logger.info('Spa booking cancelled', { bookingId, reason });
  }

  /**
   * Create a spa package
   */
  async createPackage(data: {
    packageName: string;
    description: string;
    treatmentIds: string[];
    packagePrice: number;
    validityDays: number;
  }): Promise<SpaPackage> {
    const treatments: SpaTreatment[] = [];
    let totalDuration = 0;

    for (const treatmentId of data.treatmentIds) {
      const menuItem = await Item.findOne({ itemId: treatmentId });
      if (menuItem) {
        const taxRate = this.getTaxRate(menuItem.taxCategory);
        const taxAmount = Math.round(menuItem.basePrice * taxRate) / 100;

        treatments.push({
          treatmentId: menuItem.itemId,
          treatmentName: menuItem.name,
          duration: menuItem.preparationTime || 60,
          price: menuItem.basePrice,
          taxRate,
          taxAmount,
          totalAmount: menuItem.basePrice + taxAmount,
        });

        totalDuration += menuItem.preparationTime || 60;
      }
    }

    const taxAmount = Math.round(data.packagePrice * 18) / 100;

    return {
      packageId: `PKG-${uuidv4().substring(0, 8).toUpperCase()}`,
      packageName: data.packageName,
      description: data.description,
      treatments,
      totalDuration,
      packagePrice: data.packagePrice,
      taxAmount,
      totalAmount: data.packagePrice + taxAmount,
      validityDays: data.validityDays,
    };
  }

  /**
   * Get therapist schedule
   */
  async getTherapistSchedule(therapistId: string, date: Date): Promise<unknown[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return Transaction.find({
      propertyId: this.propertyId,
      outletType: 'SPA',
      outletId: this.outletId,
      staffId: therapistId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: TransactionStatus.CANCELLED },
    }).sort({ createdAt: 1 });
  }

  /**
   * Get tax rate based on category
   */
  private getTaxRate(taxCategory: TaxCategory): number {
    const rates: Record<TaxCategory, number> = {
      [TaxCategory.GST_5]: 5,
      [TaxCategory.GST_12]: 12,
      [TaxCategory.GST_18]: 18,
      [TaxCategory.GST_28]: 28,
      [TaxCategory.EXEMPT]: 0,
      [TaxCategory.ZERO_RATED]: 0,
    };
    return rates[taxCategory] || 18;
  }

  /**
   * Parse time string to minutes
   */
  private parseTimeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

export default SpaOutlet;
