interface RazorpayWebhookPayload {
    event: string;
    payload: {
        payment: {
            entity: {
                id: string;
                order_id: string;
                amount: number;
                status: string;
                method: string;
            };
        };
    };
}
export declare class PaymentWebhookService {
    /**
     * Handle Razorpay webhook
     */
    handleRazorpayWebhook(data: RazorpayWebhookPayload): Promise<void>;
    /**
     * Handle successful payment
     */
    private handlePaymentSuccess;
    /**
     * Handle failed payment
     */
    private handlePaymentFailed;
    /**
     * Send order confirmation
     */
    private sendOrderConfirmation;
}
export declare const paymentWebhookService: PaymentWebhookService;
export {};
