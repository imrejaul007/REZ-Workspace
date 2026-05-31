export declare class WhatsAppIntegration {
    private accessToken;
    private phoneNumberId;
    private apiVersion;
    constructor();
    private get client();
    /**
     * Send text message
     */
    sendText(to: string, body: string): Promise<string>;
    /**
     * Send image
     */
    sendImage(to: string, imageUrl: string, caption?: string): Promise<string>;
    /**
     * Send interactive buttons
     */
    sendButtons(to: string, body: string, buttons: Array<{
        id: string;
        title: string;
    }>, header?: string): Promise<string>;
    /**
     * Send product list (for shopping)
     */
    sendProductList(to: string, header: string, body: string, catalogId: string): Promise<string>;
    /**
     * Send checkout message with order summary
     */
    sendCheckoutSummary(to: string, order: {
        orderNumber: string;
        items: Array<{
            name: string;
            quantity: number;
            price: number;
        }>;
        total: number;
        paymentLink?: string;
    }): Promise<string>;
    /**
     * Send order confirmation
     */
    sendOrderConfirmation(to: string, order: {
        orderNumber: string;
        total: number;
        estimatedDelivery?: string;
    }): Promise<string>;
    /**
     * Send delivery update
     */
    sendDeliveryUpdate(to: string, update: {
        orderNumber: string;
        status: string;
        message: string;
        trackingUrl?: string;
    }): Promise<string>;
    /**
     * Send payment reminder for abandoned cart
     */
    sendAbandonedCartReminder(to: string, cart: {
        items: Array<{
            name: string;
            price: number;
        }>;
        total: number;
        checkoutUrl: string;
    }): Promise<string>;
    /**
     * Send interactive catalog
     */
    sendCatalog(to: string, products: Array<{
        id: string;
        name: string;
        price: number;
        imageUrl: string;
    }>, catalogId: string): Promise<string>;
}
export declare const whatsAppIntegration: WhatsAppIntegration;
