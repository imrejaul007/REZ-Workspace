import { z } from 'zod';
// ============ UNIFIED CHANNELS ============
export const ChannelEnum = z.enum([
    'whatsapp',
    'instagram',
    'sms',
    'email',
    'push',
    'webchat',
    'voice',
    'telegram',
    'rcs'
]);
// ============ MESSAGE ============
export const MessageSchema = z.object({
    id: z.string(),
    tenantId: z.string(),
    channel: ChannelEnum,
    direction: z.enum(['inbound', 'outbound', 'internal']),
    type: z.enum([
        'text',
        'image',
        'video',
        'audio',
        'document',
        'location',
        'contact',
        'sticker',
        'template',
        'interactive',
        'cart',
        'order',
        'payment'
    ]),
    from: z.object({
        id: z.string(),
        name: z.string(),
        phone: z.string().optional(),
        email: z.string().optional()
    }),
    to: z.object({
        id: z.string(),
        name: z.string(),
        phone: z.string().optional(),
        email: z.string().optional()
    }),
    content: z.object({
        text: z.string().optional(),
        mediaUrl: z.string().url().optional(),
        mediaType: z.string().optional(),
        caption: z.string().optional(),
        buttons: z.array(z.object({
            id: z.string(),
            title: z.string()
        })).optional()
    }),
    status: z.enum(['pending', 'sent', 'delivered', 'read', 'failed']).default('pending'),
    metadata: z.record(z.any()).optional(),
    timestamp: z.date(),
    createdAt: z.date(),
    updatedAt: z.date()
});
// ============ CONVERSATION ============
export const ConversationSchema = z.object({
    id: z.string(),
    tenantId: z.string(),
    channel: ChannelEnum,
    state: z.enum(['active', 'queued', 'assigned', 'resolved', 'closed']).default('active'),
    // Customer
    customer: z.object({
        id: z.string(),
        name: z.string(),
        phone: z.string().optional(),
        email: z.string().optional(),
        avatar: z.string().url().optional(),
        tier: z.enum(['standard', 'premium', 'vip']).default('standard')
    }),
    // Agent (human)
    assignedAgentId: z.string().optional(),
    assignedAgentName: z.string().optional(),
    team: z.string().optional(),
    // AI
    aiHandled: z.boolean().default(false),
    aiConfidence: z.number().min(0).max(1).optional(),
    unresolvedIntents: z.array(z.string()).optional(),
    // Context
    lastMessage: z.string().optional(),
    lastMessageAt: z.date().optional(),
    messageCount: z.number().default(0),
    // Tags
    tags: z.array(z.string()).optional(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
    // Commerce
    cartId: z.string().optional(),
    orderId: z.string().optional(),
    // Stats
    firstResponseTime: z.number().optional(),
    avgResponseTime: z.number().optional(),
    resolutionTime: z.number().optional(),
    createdAt: z.date(),
    updatedAt: z.date()
});
// ============ AGENT ============
export const AgentSchema = z.object({
    id: z.string(),
    tenantId: z.string(),
    userId: z.string(),
    name: z.string(),
    email: z.string().email(),
    avatar: z.string().url().optional(),
    role: z.enum(['agent', 'supervisor', 'admin']).default('agent'),
    status: z.enum(['online', 'busy', 'away', 'offline']).default('offline'),
    // Skills
    skills: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    maxConcurrentChats: z.number().default(5),
    // Stats
    stats: z.object({
        totalConversations: z.number().default(0),
        resolvedToday: z.number().default(0),
        avgResponseTime: z.number().default(0),
        avgResolutionTime: z.number().default(0),
        csat: z.number().min(0).max(5).optional(),
        lastActiveAt: z.date().optional()
    }).optional(),
    channels: z.array(ChannelEnum).default(['whatsapp']),
    createdAt: z.date(),
    updatedAt: z.date()
});
// ============ CART (WhatsApp Commerce) ============
export const CartSchema = z.object({
    id: z.string(),
    tenantId: z.string(),
    sessionId: z.string(),
    customer: z.object({
        id: z.string(),
        name: z.string(),
        phone: z.string()
    }),
    items: z.array(z.object({
        productId: z.string(),
        name: z.string(),
        price: z.number(),
        quantity: z.number().min(1),
        imageUrl: z.string().url().optional(),
        variant: z.string().optional()
    })),
    subtotal: z.number(),
    discount: z.number().default(0),
    total: z.number(),
    status: z.enum(['active', 'checkout', 'completed', 'abandoned']).default('active'),
    createdAt: z.date(),
    updatedAt: z.date()
});
// ============ ORDER ============
export const OrderSchema = z.object({
    id: z.string(),
    tenantId: z.string(),
    orderNumber: z.string(),
    customer: z.object({
        id: z.string(),
        name: z.string(),
        phone: z.string(),
        address: z.string().optional()
    }),
    items: z.array(z.object({
        productId: z.string(),
        name: z.string(),
        price: z.number(),
        quantity: z.number(),
        total: z.number()
    })),
    subtotal: z.number(),
    tax: z.number().default(0),
    deliveryFee: z.number().default(0),
    discount: z.number().default(0),
    total: z.number(),
    payment: z.object({
        method: z.enum(['upi', 'card', 'wallet', 'cod']),
        status: z.enum(['pending', 'paid', 'failed', 'refunded']),
        transactionId: z.string().optional()
    }),
    delivery: z.object({
        status: z.enum(['pending', 'confirmed', 'dispatched', 'delivered', 'failed']),
        estimatedTime: z.date().optional(),
        actualTime: z.date().optional()
    }).optional(),
    channel: ChannelEnum,
    conversationId: z.string().optional(),
    status: z.enum(['pending', 'confirmed', 'preparing', 'dispatched', 'delivered', 'cancelled']),
    createdAt: z.date(),
    updatedAt: z.date()
});
// ============ CAMPAIGN ============
export const CampaignSchema = z.object({
    id: z.string(),
    tenantId: z.string(),
    name: z.string(),
    description: z.string().optional(),
    channel: ChannelEnum,
    type: z.enum(['marketing', 'transactional', 'promotional', 'welcome', 'abandoned_cart']),
    content: z.object({
        templateId: z.string().optional(),
        subject: z.string().optional(),
        text: z.string(),
        mediaUrl: z.string().url().optional(),
        buttons: z.array(z.object({
            id: z.string(),
            title: z.string(),
            url: z.string().url().optional()
        })).optional()
    }),
    // Targeting
    segmentIds: z.array(z.string()).optional(),
    targetFilters: z.record(z.any()).optional(),
    estimatedReach: z.number().optional(),
    // Schedule
    scheduledAt: z.date().optional(),
    startedAt: z.date().optional(),
    completedAt: z.date().optional(),
    // Status
    status: z.enum(['draft', 'scheduled', 'sending', 'completed', 'paused', 'cancelled']).default('draft'),
    // A/B Test
    abTest: z.object({
        enabled: z.boolean().default(false),
        variantB: z.string().optional(),
        variantBRate: z.number().min(0).max(100).default(50)
    }).optional(),
    // Stats
    stats: z.object({
        sent: z.number().default(0),
        delivered: z.number().default(0),
        opened: z.number().default(0),
        clicked: z.number().default(0),
        converted: z.number().default(0),
        failed: z.number().default(0),
        unsubscribed: z.number().default(0)
    }),
    createdAt: z.date(),
    updatedAt: z.date()
});
// ============ TEMPLATE ============
export const TemplateSchema = z.object({
    id: z.string(),
    tenantId: z.string(),
    name: z.string(),
    channel: ChannelEnum,
    category: z.enum([
        'marketing',
        'transactional',
        'utility',
        'authentication',
        'marketing_template'
    ]),
    content: z.object({
        body: z.string(),
        header: z.string().optional(),
        footer: z.string().optional(),
        buttons: z.array(z.object({
            id: z.string(),
            type: z.enum(['url', 'phone', 'quick_reply']),
            title: z.string()
        })).optional(),
        variables: z.array(z.string()).optional()
    }),
    // WhatsApp specific
    whatsappCategory: z.string().optional(),
    whatsappTemplateId: z.string().optional(),
    approvalStatus: z.enum(['pending', 'approved', 'rejected']).default('pending'),
    status: z.enum(['active', 'inactive', 'archived']).default('active'),
    usageCount: z.number().default(0),
    lastUsedAt: z.date().optional(),
    createdAt: z.date(),
    updatedAt: z.date()
});
// ============ ANALYTICS ============
export const PlatformAnalyticsSchema = z.object({
    tenantId: z.string(),
    period: z.object({
        start: z.date(),
        end: z.date()
    }),
    overview: z.object({
        totalConversations: z.number(),
        activeConversations: z.number(),
        resolvedConversations: z.number(),
        avgResponseTime: z.number(),
        avgResolutionTime: z.number(),
        csat: z.number().optional()
    }),
    byChannel: z.record(ChannelEnum, z.object({
        conversations: z.number(),
        messages: z.number(),
        avgResponseTime: z.number()
    })),
    commerce: z.object({
        ordersCreated: z.number(),
        ordersCompleted: z.number(),
        revenue: z.number(),
        cartAbandonmentRate: z.number(),
        checkoutConversionRate: z.number()
    }),
    campaigns: z.object({
        sent: z.number(),
        delivered: z.number(),
        opened: z.number(),
        clicked: z.number(),
        converted: z.number()
    }),
    agents: z.object({
        total: z.number(),
        online: z.number(),
        busy: z.number(),
        avgHandlingTime: z.number()
    })
});
//# sourceMappingURL=index.js.map