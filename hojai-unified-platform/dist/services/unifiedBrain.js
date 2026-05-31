const INTENT_PATTERNS = [
    // Order intents
    {
        patterns: [
            /order\s*(?:status|details|info)/i,
            /where('?s|\s+is)\s+my\s+order/i,
            /track\s*(?:my)?\s*order/i,
            /order\s*#?(\w+-\d+)/i
        ],
        intent: 'order_status',
        examples: ['track my order', 'where is my order', 'order status'],
        action: { type: 'show_order' }
    },
    {
        patterns: [
            /place\s*(?:an)?\s*order/i,
            /want\s+to\s+(?:order|buy|get)/i,
            /can\s+i\s+order/i,
            /order\s+(.+)/i
        ],
        intent: 'place_order',
        examples: ['I want to order pizza', 'place an order', 'buy some food'],
        action: { type: 'create_order' }
    },
    {
        patterns: [
            /cancel\s*(?:my)?\s*order/i,
            /want\s+to\s+cancel/i
        ],
        intent: 'cancel_order',
        examples: ['cancel my order', 'I want to cancel']
    },
    // Product intents
    {
        patterns: [
            /show\s+(?:me\s+)?(?:the\s+)?(?:menu|products|items)/i,
            /what\s+(?:do\s+you\s+have|is\s+available)/i,
            /browse/i,
            /catalog/i
        ],
        intent: 'show_products',
        examples: ['show me the menu', 'what products do you have'],
        action: { type: 'show_products' }
    },
    {
        patterns: [
            /add\s+(.+)\s+to\s+(?:my\s+)?cart/i,
            /i\s+want\s+(.+)/i,
            /get\s+(.+)/i,
            /order\s+(.+)/i
        ],
        intent: 'add_to_cart',
        examples: ['add pizza to cart', 'I want a burger', 'get some pasta'],
        action: { type: 'add_to_cart' }
    },
    // Support intents
    {
        patterns: [
            /help(?:\s+me)?/i,
            /support/i,
            /need\s+assistance/i,
            /can('?t|t\s+find)/i
        ],
        intent: 'request_help',
        examples: ['I need help', 'support', 'need assistance']
    },
    {
        patterns: [
            /file?\s*(?:a)?\s*complaint/i,
            /raise?\s*(?:a)?\s*(?:ticket|issue|request)/i,
            /report\s+(?:a\s+)?(?:problem|issue)/i,
            /not\s+happy/i
        ],
        intent: 'create_ticket',
        examples: ['I want to file a complaint', 'raise a ticket', 'report an issue'],
        action: { type: 'create_ticket' }
    },
    {
        patterns: [
            /refund/i,
            /money\s+back/i,
            /return/i
        ],
        intent: 'request_refund',
        examples: ['I want a refund', 'money back', 'return my order']
    },
    // Cart/Checkout intents
    {
        patterns: [
            /checkout/i,
            /place\s+order/i,
            /confirm\s+order/i,
            /pay(?:\s+now)?/i,
            /proceed(?:\s+to)?\s*(?:checkout|payment)/i
        ],
        intent: 'checkout',
        examples: ['checkout', 'place order', 'pay now'],
        action: { type: 'create_order' }
    },
    {
        patterns: [
            /view\s+(?:my\s+)?cart/i,
            /what('?s|\s+is)\s+in\s+(?:my\s+)?cart/i,
            /my\s+cart/i
        ],
        intent: 'view_cart',
        examples: ['view my cart', 'what is in my cart'],
        action: { type: 'show_products' }
    },
    // Greetings
    {
        patterns: [
            /^(?:hi|hello|hey|greetings)/i,
            /good\s+(?:morning|afternoon|evening)/i
        ],
        intent: 'greeting',
        examples: ['hi', 'hello', 'hey']
    },
    {
        patterns: [
            /thanks?(?:\s+you)?|thank\s+you/i,
            /appreciate/i
        ],
        intent: 'thanks',
        examples: ['thanks', 'thank you']
    },
    {
        patterns: [
            /bye|goodbye|see\s+you|take\s+care/i
        ],
        intent: 'farewell',
        examples: ['bye', 'goodbye']
    },
    // General
    {
        patterns: [
            /who\s+are\s+you/i,
            /what\s+are\s+you/i,
            /about/i
        ],
        intent: 'about',
        examples: ['who are you', 'what are you']
    }
];
// ============================================================================
// RESPONSE TEMPLATES
// ============================================================================
const RESPONSE_TEMPLATES = {
    greeting: [
        "Hello! Welcome to HOJAI. How can I help you today?",
        "Hi there! I'm here to help. What can I assist you with?",
        "Hey! Good to hear from you. What would you like to do?"
    ],
    order_status: [
        "I can help you check your order status. What's your order number?",
        "Let me look up your order. Could you provide your order number?",
        "I'll help you track your order. Please share your order number."
    ],
    show_products: [
        "Here are our products:",
        "Here's what we have available:",
        "Take a look at our current selection:"
    ],
    add_to_cart: [
        "I've added that to your cart.",
        "Done! Your item has been added.",
        "Added to your cart. Would you like to checkout or add more items?"
    ],
    checkout: [
        "Let's proceed to checkout. Here's your order summary:",
        "Your order is ready. Let me show you the checkout details:",
        "Here's what we're processing:"
    ],
    request_help: [
        "I'll be happy to help! What seems to be the issue?",
        "Of course! Please tell me more about what you need.",
        "I'm here to help. What would you like assistance with?"
    ],
    create_ticket: [
        "I understand. Let me create a support ticket for you. Please describe your issue.",
        "I'll help you raise a ticket. What would you like us to know?",
        "I'll document this for our team. Please provide details about your concern."
    ],
    request_refund: [
        "I understand you'd like a refund. I can help process that. Could you provide your order number?",
        "Let me assist with your refund request. What's your order number?",
        "I'll look into the refund for you. Please share your order details."
    ],
    thanks: [
        "You're welcome! Is there anything else I can help with?",
        "Happy to help! Let me know if you need anything else.",
        "Anytime! Feel free to reach out if you have more questions."
    ],
    farewell: [
        "Take care! Looking forward to helping you again.",
        "Goodbye! Have a great day!",
        "See you soon! Don't hesitate to reach out if you need anything."
    ],
    about: [
        "I'm HOJAI, your unified assistant for WhatsApp, support, and commerce. I can help you with orders, products, and customer service.",
        "HOJAI is an AI-powered platform that combines chat, support tickets, and e-commerce into one seamless experience."
    ],
    default: [
        "I understand. Let me help you with that.",
        "Got it. Here's what I found:",
        "No problem. Let me assist you with that."
    ]
};
// ============================================================================
// UNIFIED BRAIN SERVICE
// ============================================================================
class UnifiedBrain {
    initialized = false;
    async initialize() {
        if (this.initialized)
            return;
        console.log('[UnifiedBrain] Initialized');
        this.initialized = true;
    }
    /**
     * Process incoming message and generate AI response
     */
    async processMessage(message, context) {
        const { intent, confidence, entities } = this.recognizeIntent(message, context);
        const response = this.generateResponse(intent, message, context, entities);
        return {
            intent,
            confidence,
            entities,
            response
        };
    }
    /**
     * Recognize intent from message
     */
    recognizeIntent(message, context) {
        const normalizedMessage = message.toLowerCase().trim();
        // Check patterns in order of priority
        for (const pattern of INTENT_PATTERNS) {
            for (const regex of pattern.patterns) {
                const match = normalizedMessage.match(regex);
                if (match) {
                    // Extract entities from match groups
                    const entities = {};
                    if (match[1]) {
                        // First capture group - usually the main entity
                        entities.entity = match[1].trim();
                    }
                    if (match[2]) {
                        entities.entity2 = match[2].trim();
                    }
                    // Add any context-based entities
                    entities.channel = context.channel;
                    entities.timestamp = new Date().toISOString();
                    return {
                        intent: pattern.intent,
                        confidence: 0.85,
                        entities
                    };
                }
            }
        }
        // Fallback: analyze conversation context
        const contextIntent = this.analyzeContext(context);
        if (contextIntent) {
            return contextIntent;
        }
        // Default fallback
        return {
            intent: 'unknown',
            confidence: 0.3,
            entities: { originalMessage: message }
        };
    }
    /**
     * Analyze conversation context to determine intent
     */
    analyzeContext(context) {
        // If no recent messages, can't determine from context
        if (context.recentMessages.length === 0) {
            return null;
        }
        const lastMessage = context.recentMessages[context.recentMessages.length - 1];
        // If user was shown products, next message might be about adding to cart
        if (lastMessage.content.includes('menu') || lastMessage.content.includes('products')) {
            return {
                intent: 'add_to_cart',
                confidence: 0.5,
                entities: { inferredFromContext: true }
            };
        }
        return null;
    }
    /**
     * Generate response based on intent
     */
    generateResponse(intent, message, context, entities) {
        const templates = RESPONSE_TEMPLATES[intent] || RESPONSE_TEMPLATES.default;
        const responseText = templates[Math.floor(Math.random() * templates.length)];
        // Determine action if any
        const pattern = INTENT_PATTERNS.find(p => p.intent === intent);
        let action;
        if (pattern?.action) {
            action = {
                type: pattern.action.type,
                data: pattern.action.extractData?.(message, context) || entities
            };
        }
        return {
            message: responseText,
            action,
            context: {
                intent,
                entities,
                confidence: 0.85
            }
        };
    }
    /**
     * Generate context-aware suggestions
     */
    getSuggestions(context) {
        const suggestions = [];
        // Always available
        suggestions.push('View products');
        suggestions.push('Track order');
        suggestions.push('Contact support');
        // Context-based suggestions
        if (context.recentMessages.length > 0) {
            const lastIntent = this.getLastIntent(context);
            switch (lastIntent) {
                case 'greeting':
                    suggestions.unshift('Browse products');
                    suggestions.unshift('Track my order');
                    break;
                case 'add_to_cart':
                    suggestions.unshift('Checkout');
                    suggestions.unshift('Add more items');
                    break;
                case 'checkout':
                    suggestions.unshift('Pay now');
                    suggestions.unshift('Add items');
                    break;
                case 'create_ticket':
                    suggestions.unshift('View my tickets');
                    break;
            }
        }
        return suggestions.slice(0, 4);
    }
    /**
     * Get last recognized intent from context
     */
    getLastIntent(context) {
        // Look through recent messages for assistant responses with context
        for (let i = context.recentMessages.length - 1; i >= 0; i--) {
            const msg = context.recentMessages[i];
            if (msg.role === 'assistant') {
                // This is simplified - in production, you'd store intent in metadata
                if (msg.content.includes('menu') || msg.content.includes('products')) {
                    return 'show_products';
                }
            }
        }
        return null;
    }
    /**
     * Route to appropriate handler based on intent
     */
    async routeToHandler(intent) {
        switch (intent.intent) {
            case 'order_status':
                return { handler: 'orderService', data: intent.entities };
            case 'place_order':
            case 'add_to_cart':
            case 'checkout':
                return { handler: 'commerceService', data: intent.entities };
            case 'create_ticket':
            case 'request_refund':
                return { handler: 'supportService', data: intent.entities };
            case 'show_products':
                return { handler: 'catalogService', data: intent.entities };
            case 'request_help':
                return { handler: 'humanHandoff', data: {} };
            default:
                return null;
        }
    }
    /**
     * Generate conversation summary for handoff
     */
    generateSummary(context) {
        const lines = [];
        lines.push(`Channel: ${context.channel}`);
        lines.push(`Customer ID: ${context.customerId}`);
        lines.push(`Conversation started: ${context.recentMessages[0]?.timestamp || 'N/A'}`);
        if (context.recentMessages.length > 0) {
            lines.push(`\nRecent conversation (${context.recentMessages.length} messages):`);
            context.recentMessages.slice(-5).forEach(msg => {
                lines.push(`[${msg.role}]: ${msg.content.slice(0, 100)}...`);
            });
        }
        return lines.join('\n');
    }
}
// ============================================================================
// EXPORT
// ============================================================================
export const unifiedBrain = new UnifiedBrain();
export default unifiedBrain;
//# sourceMappingURL=unifiedBrain.js.map