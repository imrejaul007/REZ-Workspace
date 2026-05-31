import type { Booking, TimeSlot } from './types.js';
export interface CreateBookingInput {
    merchantId: string;
    customerId?: string;
    customerName: string;
    customerPhone: string;
    date: string;
    time: string;
    guests: number;
    type: 'salon' | 'restaurant' | 'clinic' | 'hotel';
    service?: string;
    notes?: string;
}
export declare class BookingBridgeService {
    private baseUrl;
    private token;
    constructor(baseUrl?: string, token?: string);
    private headers;
    /**
     * Create booking
     */
    create(input: CreateBookingInput): Promise<Booking | null>;
    /**
     * Get booking by ID
     */
    get(bookingId: string): Promise<Booking | null>;
    /**
     * Update booking
     */
    update(bookingId: string, updates: Partial<Booking>): Promise<boolean>;
    /**
     * Cancel booking
     */
    cancel(bookingId: string): Promise<boolean>;
    /**
     * Get available time slots
     */
    getAvailableSlots(merchantId: string, date: string, guests: number, type: string): Promise<TimeSlot[]>;
    /**
     * Get bookings by merchant
     */
    getByMerchant(merchantId: string, date?: string): Promise<Booking[]>;
    /**
     * Get bookings by customer
     */
    getByCustomer(customerId: string): Promise<Booking[]>;
    /**
     * Confirm booking
     */
    confirm(bookingId: string): Promise<boolean>;
    /**
     * Send reminder
     */
    sendReminder(bookingId: string): Promise<boolean>;
    private transformBooking;
    private generateTimeSlots;
}
export declare const bookingBridge: BookingBridgeService;
//# sourceMappingURL=bookingService.d.ts.map