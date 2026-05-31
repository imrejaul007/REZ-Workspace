import type { Merchant, Customer, MenuItem, Order, Booking, TimeSlot } from '../../hojai-merchant-bridge/src/types.js';
export interface AIContext {
    merchant: Merchant;
    customer?: Customer;
    menu: MenuItem[];
    orders: Order[];
    availability: {
        tables: any[];
        slots: TimeSlot[];
    };
    message: string;
    intent: string;
}
export declare class MerchantIntegration {
    /**
     * Get complete context for AI processing
     */
    getContext(merchantId: string, customerPhone: string): Promise<AIContext | null>;
    /**
     * Process order from WhatsApp
     */
    processOrder(params: {
        merchantId: string;
        customerPhone: string;
        items: {
            menuItemId: string;
            name: string;
            quantity: number;
            price: number;
        }[];
        type: 'delivery' | 'pickup' | 'dinein' | 'table';
        notes?: string;
    }): Promise<Order | null>;
    /**
     * Process booking from WhatsApp
     */
    processBooking(params: {
        merchantId: string;
        customerName: string;
        customerPhone: string;
        date: string;
        time: string;
        guests: number;
        type: 'salon' | 'restaurant' | 'clinic' | 'hotel';
        service?: string;
        notes?: string;
    }): Promise<Booking | null>;
    /**
     * Update order status
     */
    updateOrderStatus(orderId: string, status: Order['status']): Promise<boolean>;
    /**
     * Get available time slots
     */
    getAvailableSlots(merchantId: string, date: string, guests: number, type: string): Promise<TimeSlot[]>;
    /**
     * Search menu items
     */
    searchMenu(merchantId: string, query: string): Promise<MenuItem[]>;
    /**
     * Add loyalty points
     */
    addLoyaltyPoints(merchantId: string, customerId: string, points: number): Promise<boolean>;
    /**
     * Format order for WhatsApp message
     */
    formatOrderMessage(order: Order): string;
    /**
     * Format booking for WhatsApp message
     */
    formatBookingMessage(booking: Booking): string;
}
export declare const merchantIntegration: MerchantIntegration;
//# sourceMappingURL=merchantIntegration.d.ts.map