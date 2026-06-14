import axios from 'axios';
import { Booking, BookingStatus, PaymentStatus } from '../models/Payment';
import { logger } from '../config/logger';
import { v4 as uuidv4 } from 'uuid';

export class PaymentService {
  private razorpayUrl = process.env.REZ_PAYMENT_URL || 'http://localhost:4001';

  async createBooking(userId: string, propertyId: string, amount: number, currency: string, brokerId?: string): Promise<any> {
    const booking = new Booking({
      bookingId: 'BK' + Date.now() + uuidv4().substring(0, 4).toUpperCase(),
      userId,
      propertyId,
      brokerId,
      amount,
      currency,
      status: BookingStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING
    });
    await booking.save();

    // Create Razorpay order via RABTUL Payment
    try {
      const orderRes = await axios.post(`${this.razorpayUrl}/api/payments/create-order`, {
        amount,
        currency,
        bookingId: booking.bookingId
      }, {
        headers: { 'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN }
      });

      booking.razorpayOrderId = orderRes.data.data.orderId;
      await booking.save();
    } catch (err) {
      logger.error('Razorpay order creation failed', { bookingId: booking.bookingId, error: err });
    }

    return booking;
  }

  async verifyPayment(bookingId: string, razorpayPaymentId: string): Promise<any> {
    const booking = await Booking.findOne({ bookingId });
    if (!booking) throw new Error('Booking not found');

    booking.razorpayPaymentId = razorpayPaymentId;
    booking.paymentStatus = PaymentStatus.COMPLETED;
    booking.paidAt = new Date();
    booking.status = BookingStatus.CONFIRMED;
    await booking.save();

    return booking;
  }

  async cancelBooking(bookingId: string): Promise<any> {
    const booking = await Booking.findOne({ bookingId });
    if (!booking) throw new Error('Booking not found');

    booking.status = BookingStatus.CANCELLED;
    booking.cancelledAt = new Date();

    if (booking.paymentStatus === PaymentStatus.COMPLETED) {
      // Initiate refund
      try {
        const refundRes = await axios.post(`${this.razorpayUrl}/api/payments/refund`, {
          paymentId: booking.razorpayPaymentId,
          amount: booking.amount
        }, {
          headers: { 'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN }
        });
        booking.refundId = refundRes.data.data.refundId;
        booking.refundAmount = booking.amount;
        booking.paymentStatus = PaymentStatus.REFUNDED;
      } catch (err) {
        logger.error('Refund failed', { bookingId, error: err });
      }
    }

    await booking.save();
    return booking;
  }

  async getBooking(bookingId: string): Promise<any> {
    return Booking.findOne({ bookingId, deletedAt: null });
  }

  async getUserBookings(userId: string): Promise<any[]> {
    return Booking.find({ userId, deletedAt: null }).sort({ createdAt: -1 }).lean();
  }

  async getPropertyBookings(propertyId: string): Promise<any[]> {
    return Booking.find({ propertyId, deletedAt: null }).sort({ createdAt: -1 }).lean();
  }
}

export const paymentService = new PaymentService();
