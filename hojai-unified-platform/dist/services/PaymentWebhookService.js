import { OrderModel } from '../models';
import { whatsAppIntegration } from './WhatsAppIntegration';
export class PaymentWebhookService {
    /**
     * Handle Razorpay webhook
     */
    async handleRazorpayWebhook(data) {
        const { event } = data;
        const payment = data.payload.payment.entity;
        console.log(`[Payment] Event: ${event}, Payment: ${payment.id}`);
        switch (event) {
            case 'payment.captured':
                await this.handlePaymentSuccess(payment.order_id, payment.id);
                break;
            case 'payment.failed':
                await this.handlePaymentFailed(payment.order_id, payment.id);
                break;
        }
    }
    /**
     * Handle successful payment
     */
    async handlePaymentSuccess(orderId, paymentId) {
        const order = await OrderModel.findOne({ orderNumber: orderId });
        if (!order) {
            console.log(`[Payment] Order not found: ${orderId}`);
            return;
        }
        // Update order
        order.payment.status = 'paid';
        order.payment.transactionId = paymentId;
        order.status = 'confirmed';
        await order.save();
        // Send confirmation via WhatsApp
        if (order.customer.phone) {
            await this.sendOrderConfirmation(order);
        }
        console.log(`[Payment] Order confirmed: ${orderId}`);
    }
    /**
     * Handle failed payment
     */
    async handlePaymentFailed(orderId, paymentId) {
        const order = await OrderModel.findOne({ orderNumber: orderId });
        if (!order)
            return;
        order.payment.status = 'failed';
        order.status = 'cancelled';
        await order.save();
        // Notify customer
        if (order.customer.phone) {
            await whatsAppIntegration.sendText(order.customer.phone, `❌ Payment failed for order #${order.orderNumber}. Please try again or contact support.`);
        }
        console.log(`[Payment] Order cancelled: ${orderId}`);
    }
    /**
     * Send order confirmation
     */
    async sendOrderConfirmation(order) {
        const itemList = order.items
            .map((item) => `• ${item.name} x${item.quantity}`)
            .join('\n');
        let message = `✅ *Order Confirmed!*\n\n`;
        message += `📋 Order: #${order.orderNumber}\n`;
        message += `━━━━━━━━━━━━━━━\n`;
        message += `${itemList}\n`;
        message += `━━━━━━━━━━━━━━━\n`;
        message += `💰 Total: ₹${order.total}\n\n`;
        message += `Thank you for your order!`;
        await whatsAppIntegration.sendText(order.customer.phone, message);
    }
}
export const paymentWebhookService = new PaymentWebhookService();
//# sourceMappingURL=PaymentWebhookService.js.map