import axios from 'axios';
export class WhatsAppIntegration {
    accessToken;
    phoneNumberId;
    apiVersion;
    constructor() {
        this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
        this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
        this.apiVersion = process.env.WHATSAPP_API_VERSION || 'v18.0';
    }
    get client() {
        return axios.create({
            baseURL: `https://graph.facebook.com/${this.apiVersion}`,
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            }
        });
    }
    /**
     * Send text message
     */
    async sendText(to, body) {
        const response = await this.client.post(`/${this.phoneNumberId}/messages`, {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'text',
            text: { body }
        });
        return response.data.messages[0].id;
    }
    /**
     * Send image
     */
    async sendImage(to, imageUrl, caption) {
        const response = await this.client.post(`/${this.phoneNumberId}/messages`, {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'image',
            image: {
                link: imageUrl,
                caption
            }
        });
        return response.data.messages[0].id;
    }
    /**
     * Send interactive buttons
     */
    async sendButtons(to, body, buttons, header) {
        const payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'interactive',
            interactive: {
                type: 'button',
                body: { text: body },
                action: {
                    buttons: buttons.map(btn => ({
                        type: 'reply',
                        reply: { id: btn.id, title: btn.title }
                    }))
                }
            }
        };
        if (header) {
            payload.interactive.header = { type: 'text', text: header };
        }
        const response = await this.client.post(`/${this.phoneNumberId}/messages`, payload);
        return response.data.messages[0].id;
    }
    /**
     * Send product list (for shopping)
     */
    async sendProductList(to, header, body, catalogId) {
        const response = await this.client.post(`/${this.phoneNumberId}/messages`, {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'interactive',
            interactive: {
                type: 'product',
                header: { type: 'text', text: header },
                body: { text: body },
                footer: { text: 'Powered by REZ' },
                action: {
                    catalog_id: catalogId,
                    sections: [{
                            title: 'Products',
                            product_items: []
                        }]
                }
            }
        });
        return response.data.messages[0].id;
    }
    /**
     * Send checkout message with order summary
     */
    async sendCheckoutSummary(to, order) {
        const itemList = order.items
            .map(item => `• ${item.name} x${item.quantity} = ₹${item.price * item.quantity}`)
            .join('\n');
        let message = `📦 *Order #${order.orderNumber}*\n\n`;
        message += `${itemList}\n\n`;
        message += `━━━━━━━━━━━━━━━\n`;
        message += `*Total: ₹${order.total}*\n`;
        message += `━━━━━━━━━━━━━━━\n\n`;
        if (order.paymentLink) {
            message += `💳 Payment Link: ${order.paymentLink}`;
        }
        else {
            message += `Payment: Cash on Delivery`;
        }
        return this.sendText(to, message);
    }
    /**
     * Send order confirmation
     */
    async sendOrderConfirmation(to, order) {
        let message = `✅ *Order Confirmed!*\n\n`;
        message += `📋 Order: #${order.orderNumber}\n`;
        message += `💰 Total: ₹${order.total}\n\n`;
        if (order.estimatedDelivery) {
            message += `🚚 Estimated Delivery: ${order.estimatedDelivery}\n\n`;
        }
        message += `You'll receive updates on this number. Thank you for shopping with us!`;
        return this.sendText(to, message);
    }
    /**
     * Send delivery update
     */
    async sendDeliveryUpdate(to, update) {
        const statusEmoji = {
            'dispatched': '🚚',
            'out_for_delivery': '🏃',
            'delivered': '✅',
            'failed': '❌'
        };
        let message = `${statusEmoji[update.status] || '📦'} *Order Update*\n\n`;
        message += `📋 Order: #${update.orderNumber}\n`;
        message += `${update.message}\n\n`;
        if (update.trackingUrl) {
            message += `🔗 Track: ${update.trackingUrl}`;
        }
        return this.sendText(to, message);
    }
    /**
     * Send payment reminder for abandoned cart
     */
    async sendAbandonedCartReminder(to, cart) {
        const itemList = cart.items.map(item => `• ${item.name} - ₹${item.price}`).join('\n');
        let message = `🛒 *You left something behind!*\n\n`;
        message += `Your cart:\n${itemList}\n\n`;
        message += `━━━━━━━━━━━━━━━\n`;
        message += `*Cart Total: ₹${cart.total}*\n`;
        message += `━━━━━━━━━━━━━━━\n\n`;
        message += `Complete your order: ${cart.checkoutUrl}`;
        return this.sendText(to, message);
    }
    /**
     * Send interactive catalog
     */
    async sendCatalog(to, products, catalogId) {
        const sections = [{
                title: 'Shop Now',
                product_items: products.slice(0, 10).map(p => ({
                    retailer_set_item_id: p.id
                }))
            }];
        const response = await this.client.post(`/${this.phoneNumberId}/messages`, {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'interactive',
            interactive: {
                type: 'product_list',
                header: { type: 'text', text: '🛍️ Our Products' },
                body: { text: 'Browse and shop directly from our catalog' },
                footer: { text: 'Powered by REZ' },
                action: {
                    catalog_id: catalogId,
                    sections
                }
            }
        });
        return response.data.messages[0].id;
    }
}
export const whatsAppIntegration = new WhatsAppIntegration();
//# sourceMappingURL=WhatsAppIntegration.js.map