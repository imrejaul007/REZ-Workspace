import { v4 as uuidv4 } from 'uuid';
import { MessageModel, ConversationModel, AgentModel, CartModel, OrderModel, CampaignModel, TemplateModel } from '../models';
import { commerceIntegration } from './CommerceIntegration';
import { whatsAppIntegration } from './WhatsAppIntegration';
export class PlatformService {
    // ============ MESSAGES ============
    async handleIncomingMessage(data) {
        let conversation = await this.getOrCreateConversation({
            tenantId: data.tenantId,
            channel: data.channel,
            customerId: data.from.id,
            customerName: data.from.name,
            customerPhone: data.from.phone
        });
        const message = new MessageModel({
            messageId: uuidv4(),
            tenantId: data.tenantId,
            channel: data.channel,
            direction: 'inbound',
            type: data.type,
            from: data.from,
            to: { id: 'system', name: 'System' },
            content: data.content,
            status: 'delivered',
            timestamp: new Date()
        });
        await message.save();
        conversation.lastMessage = data.content.text || `[${data.type}]`;
        conversation.lastMessageAt = new Date();
        conversation.messageCount++;
        await conversation.save();
        return conversation;
    }
    async sendMessage(data) {
        const messageId = uuidv4();
        if (data.channel === 'whatsapp' && data.to.phone) {
            try {
                await this.sendWhatsAppMessage(data.to.phone, data.type, data.content);
            }
            catch (error) {
                console.error('WhatsApp send failed:', error);
            }
        }
        const message = new MessageModel({
            messageId,
            tenantId: data.tenantId,
            channel: data.channel,
            direction: 'outbound',
            type: data.type,
            from: { id: 'system', name: 'System' },
            to: data.to,
            content: data.content,
            status: 'sent',
            timestamp: new Date()
        });
        await message.save();
        return message;
    }
    async sendWhatsAppMessage(phone, type, content) {
        switch (type) {
            case 'text':
                await whatsAppIntegration.sendText(phone, content.text);
                break;
            case 'image':
                await whatsAppIntegration.sendImage(phone, content.mediaUrl, content.caption);
                break;
            case 'buttons':
                await whatsAppIntegration.sendButtons(phone, content.text, content.buttons, content.header);
                break;
            default:
                await whatsAppIntegration.sendText(phone, content.text || '');
        }
    }
    // ============ CONVERSATIONS ============
    async getOrCreateConversation(data) {
        let conversation = await ConversationModel.findOne({
            tenantId: data.tenantId,
            'customer.id': data.customerId,
            channel: data.channel,
            state: { $in: ['active', 'assigned'] }
        });
        if (!conversation) {
            conversation = new ConversationModel({
                conversationId: uuidv4(),
                tenantId: data.tenantId,
                channel: data.channel,
                state: 'active',
                customer: {
                    id: data.customerId,
                    name: data.customerName,
                    phone: data.customerPhone,
                    tier: 'standard'
                },
                messageCount: 0,
                priority: 'normal'
            });
            await conversation.save();
        }
        return conversation;
    }
    async getConversations(tenantId, options = {}) {
        const query = { tenantId };
        if (options.state)
            query.state = options.state;
        if (options.channel)
            query.channel = options.channel;
        if (options.agentId)
            query.assignedAgentId = options.agentId;
        const limit = options.limit || 50;
        const offset = options.offset || 0;
        const [conversations, total] = await Promise.all([
            ConversationModel.find(query).sort({ priority: -1, lastMessageAt: -1 }).skip(offset).limit(limit),
            ConversationModel.countDocuments(query)
        ]);
        return { conversations, total };
    }
    async assignConversation(conversationId, agentId, agentName) {
        await ConversationModel.findOneAndUpdate({ conversationId }, {
            assignedAgentId: agentId,
            assignedAgentName: agentName,
            state: 'assigned'
        });
    }
    async resolveConversation(conversationId) {
        await ConversationModel.findOneAndUpdate({ conversationId }, { state: 'resolved' });
    }
    // ============ AGENTS ============
    async createAgent(data) {
        const agent = new AgentModel({
            agentId: uuidv4(),
            ...data,
            status: 'offline',
            maxConcurrentChats: 5,
            channels: data.channels || ['whatsapp'],
            stats: {
                totalConversations: 0,
                resolvedToday: 0,
                avgResponseTime: 0,
                avgResolutionTime: 0
            }
        });
        await agent.save();
        return agent;
    }
    async getAgents(tenantId, status) {
        const query = { tenantId };
        if (status)
            query.status = status;
        return AgentModel.find(query);
    }
    async setAgentStatus(agentId, status) {
        await AgentModel.findOneAndUpdate({ agentId }, { status, 'stats.lastActiveAt': new Date() });
    }
    // ============ CART & COMMERCE ============
    async createCart(data) {
        const subtotal = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const cart = new CartModel({
            cartId: uuidv4(),
            ...data,
            subtotal,
            discount: 0,
            total: subtotal,
            status: 'active'
        });
        await cart.save();
        return cart;
    }
    async getCart(cartId) {
        return CartModel.findOne({ cartId });
    }
    async addToCart(cartId, item) {
        const cart = await CartModel.findOne({ cartId });
        if (!cart)
            return null;
        const existingItem = cart.items.find(i => i.productId === item.productId);
        if (existingItem) {
            existingItem.quantity += item.quantity;
        }
        else {
            cart.items.push(item);
        }
        cart.subtotal = cart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        cart.total = cart.subtotal - cart.discount;
        await cart.save();
        return cart;
    }
    async checkout(cartId, data) {
        const cart = await CartModel.findOne({ cartId });
        if (!cart)
            throw new Error('Cart not found');
        const orderResult = await commerceIntegration.createOrder({
            customerId: cart.customer.id,
            customerPhone: cart.customer.phone,
            customerName: cart.customer.name,
            items: cart.items.map(item => ({
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity
            })),
            deliveryAddress: data.deliveryAddress,
            paymentMethod: data.paymentMethod,
            channel: 'whatsapp'
        });
        const order = new OrderModel({
            orderId: orderResult.orderId,
            tenantId: cart.tenantId,
            orderNumber: orderResult.orderNumber,
            customer: cart.customer,
            items: cart.items.map(item => ({
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                total: item.price * item.quantity
            })),
            subtotal: cart.subtotal,
            tax: 0,
            deliveryFee: 0,
            discount: cart.discount,
            total: cart.total,
            payment: {
                method: data.paymentMethod,
                status: 'pending'
            },
            channel: 'whatsapp',
            status: 'pending'
        });
        await order.save();
        cart.status = 'checkout';
        await cart.save();
        return order;
    }
    async initiatePayment(orderId, customerPhone) {
        const order = await OrderModel.findOne({ orderId });
        if (!order)
            throw new Error('Order not found');
        if (order.payment.method === 'cod') {
            order.payment.status = 'paid';
            order.status = 'confirmed';
            await order.save();
            return { order };
        }
        const payment = await commerceIntegration.createPaymentLink({
            amount: order.total,
            customerPhone,
            description: `Order #${order.orderNumber}`,
            orderId: order.orderNumber
        });
        order.payment.transactionId = payment.paymentId;
        await order.save();
        return { order, paymentLink: payment.paymentLink };
    }
    // ============ CAMPAIGNS ============
    async createCampaign(data) {
        const campaign = new CampaignModel({
            campaignId: uuidv4(),
            ...data,
            status: data.scheduledAt ? 'scheduled' : 'draft',
            stats: {
                sent: 0,
                delivered: 0,
                opened: 0,
                clicked: 0,
                converted: 0,
                failed: 0,
                unsubscribed: 0
            }
        });
        await campaign.save();
        return campaign;
    }
    async startCampaign(campaignId) {
        await CampaignModel.findOneAndUpdate({ campaignId }, { status: 'sending', startedAt: new Date() });
    }
    // ============ TEMPLATES ============
    async createTemplate(data) {
        const template = new TemplateModel({
            templateId: uuidv4(),
            ...data,
            approvalStatus: 'pending',
            status: 'active'
        });
        await template.save();
        return template;
    }
    // ============ ANALYTICS ============
    async getAnalytics(tenantId) {
        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const [totalConversations, activeConversations, resolvedToday, totalOrders, ordersToday, totalRevenue] = await Promise.all([
            ConversationModel.countDocuments({ tenantId }),
            ConversationModel.countDocuments({ tenantId, state: { $in: ['active', 'assigned'] } }),
            ConversationModel.countDocuments({ tenantId, state: 'resolved', updatedAt: { $gte: startOfDay } }),
            OrderModel.countDocuments({ tenantId }),
            OrderModel.countDocuments({ tenantId, createdAt: { $gte: startOfDay } }),
            OrderModel.aggregate([
                { $match: { tenantId, 'payment.status': 'paid' } },
                { $group: { _id: null, total: { $sum: '$total' } } }
            ])
        ]);
        const byChannel = await ConversationModel.aggregate([
            { $match: { tenantId } },
            { $group: { _id: '$channel', count: { $sum: 1 } } }
        ]);
        const channelStats = {};
        for (const c of byChannel) {
            channelStats[c._id] = { conversations: c.count };
        }
        return {
            tenantId,
            period: { start: startOfDay, end: now },
            overview: {
                totalConversations,
                activeConversations,
                resolvedConversations: resolvedToday,
                avgResponseTime: 0,
                avgResolutionTime: 0
            },
            byChannel: channelStats,
            commerce: {
                ordersCreated: totalOrders,
                ordersCompleted: ordersToday,
                revenue: totalRevenue[0]?.total || 0,
                cartAbandonmentRate: 0,
                checkoutConversionRate: 0
            },
            campaigns: {
                sent: 0,
                delivered: 0,
                opened: 0,
                clicked: 0,
                converted: 0
            }
        };
    }
}
export const platformService = new PlatformService();
//# sourceMappingURL=PlatformService.js.map