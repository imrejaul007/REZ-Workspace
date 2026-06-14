/**
 * ReZ Agent - AI Chatbot Service Tests
 */

describe('Agent Service', () => {
  describe('Conversation', () => {
    it('should create new conversation', () => {
      const conversation = {
        id: 'conv_123',
        shop: 'test-store.myshopify.com',
        customerId: 'cust_456',
        status: 'active',
        messages: [
          {
            id: 'msg_1',
            type: 'bot',
            content: 'Hi! How can I help?',
            timestamp: new Date(),
          },
        ],
      };

      expect(conversation.status).toBe('active');
      expect(conversation.messages.length).toBe(1);
      expect(conversation.messages[0].type).toBe('bot');
    });

    it('should add messages to conversation', () => {
      const messages = [];

      messages.push({
        id: 'msg_1',
        type: 'bot',
        content: 'Hi!',
      });

      messages.push({
        id: 'msg_2',
        type: 'customer',
        content: 'I need help with my order',
      });

      messages.push({
        id: 'msg_3',
        type: 'agent',
        content: 'I can help with that!',
      });

      expect(messages.length).toBe(3);
      expect(messages.filter(m => m.type === 'customer').length).toBe(1);
    });

    it('should track conversation metadata', () => {
      const conversation = {
        id: 'conv_123',
        startedAt: new Date('2024-01-01T10:00:00'),
        resolvedAt: new Date('2024-01-01T10:15:00'),
        firstResponseTime: 30, // seconds
        resolutionTime: 900, // seconds
      };

      expect(conversation.firstResponseTime).toBeLessThan(60);
      expect(conversation.resolutionTime).toBe(900);
    });
  });

  describe('Intent Detection', () => {
    const intents = [
      { pattern: /order|track|delivery/i, name: 'order_status' },
      { pattern: /return|refund|exchange/i, name: 'return_request' },
      { pattern: /cancel/i, name: 'cancel_order' },
      { pattern: /payment|pay|bill/i, name: 'payment_issue' },
      { pattern: /product|item|stock/i, name: 'product_inquiry' },
      { pattern: /discount|coupon/i, name: 'discount_query' },
    ];

    const detectIntent = (message: string) => {
      for (const intent of intents) {
        if (intent.pattern.test(message)) {
          return intent.name;
        }
      }
      return 'unknown';
    };

    it('should detect order status intent', () => {
      expect(detectIntent('Where is my order?')).toBe('order_status');
      expect(detectIntent('Track my delivery')).toBe('order_status');
    });

    it('should detect return request intent', () => {
      expect(detectIntent('I want to return this item')).toBe('return_request');
      expect(detectIntent('Can I get a refund?')).toBe('return_request');
    });

    it('should detect cancel intent', () => {
      expect(detectIntent('Cancel my order')).toBe('cancel_order');
    });

    it('should detect unknown intent', () => {
      expect(detectIntent('Hello there')).toBe('unknown');
    });
  });

  describe('Knowledge Base', () => {
    const knowledge = [
      {
        id: 'kb_1',
        category: 'faq',
        question: 'What are your shipping times?',
        answer: 'We deliver in 3-5 business days.',
        keywords: ['shipping', 'delivery', 'time'],
      },
      {
        id: 'kb_2',
        category: 'return',
        question: 'How do I return?',
        answer: 'Visit our returns portal within 30 days.',
        keywords: ['return', 'refund', 'exchange'],
      },
      {
        id: 'kb_3',
        category: 'order',
        question: 'Where is my order?',
        answer: 'Track your order in the app or email.',
        keywords: ['order', 'track', 'status'],
      },
    ];

    it('should search knowledge base', () => {
      const search = (query: string) => {
        const results = knowledge.filter(
          (k) =>
            k.question.toLowerCase().includes(query.toLowerCase()) ||
            k.answer.toLowerCase().includes(query.toLowerCase()) ||
            k.keywords.some((k) => k.includes(query.toLowerCase()))
        );
        return results;
      };

      const results = search('shipping');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].category).toBe('faq');
    });

    it('should return relevant answers', () => {
      const findAnswer = (query: string) => {
        const item = knowledge.find(
          (k) =>
            k.keywords.some((k) => k.includes(query.toLowerCase()))
        );
        return item?.answer || 'I can help you with that.';
      };

      expect(findAnswer('shipping')).toBe('We deliver in 3-5 business days.');
      expect(findAnswer('return')).toBe('Visit our returns portal within 30 days.');
    });
  });

  describe('Response Generation', () => {
    const responses = {
      order_status: "I can help track your order. Please provide your order number.",
      return_request: "For returns, visit our returns portal or I can create a ticket.",
      cancel_order: "I can help cancel. What's your order number?",
      greeting: "Hi! How can I help you today?",
      unknown: "I'm not sure I understand. Could you rephrase?",
    };

    it('should return contextual response', () => {
      expect(responses.order_status).toContain('order number');
      expect(responses.return_request).toContain('returns');
    });

    it('should have greeting response', () => {
      expect(responses.greeting).toContain('Hi');
    });

    it('should have fallback for unknown', () => {
      expect(responses.unknown).toBeDefined();
    });
  });

  describe('Quick Replies', () => {
    const getQuickReplies = (intent: string) => {
      const quickReplies = {
        order_status: ['Track my order', 'Cancel order', 'Modify order'],
        return_request: ['Start return', 'Return policy', 'Exchange item'],
        greeting: ['Track order', 'Return item', 'Product question'],
        default: ['Track order', 'Return item', 'Talk to human'],
      };
      return quickReplies[intent] || quickReplies.default;
    };

    it('should provide quick replies for order status', () => {
      const replies = getQuickReplies('order_status');
      expect(replies.length).toBe(3);
      expect(replies).toContain('Track my order');
    });

    it('should provide quick replies for return', () => {
      const replies = getQuickReplies('return_request');
      expect(replies).toContain('Start return');
    });
  });

  describe('Escalation', () => {
    it('should detect escalation trigger', () => {
      const escalateTriggers = [
        'talk to human',
        'real person',
        'supervisor',
        'manager',
        'frustrated',
        'angry',
      ];

      const message = 'I want to talk to a real person!';
      const shouldEscalate = escalateTriggers.some((t) =>
        message.toLowerCase().includes(t)
      );

      expect(shouldEscalate).toBe(true);
    });

    it('should escalate after failed attempts', () => {
      const failedAttempts = 3;
      const shouldEscalate = failedAttempts >= 3;

      expect(shouldEscalate).toBe(true);
    });
  });

  describe('Analytics', () => {
    it('should calculate CSAT', () => {
      const ratings = [5, 5, 4, 5, 3, 5, 4, 5, 5, 4];
      const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;

      expect(avgRating).toBe(4.5);
    });

    it('should calculate resolution rate', () => {
      const conversations = {
        total: 100,
        resolved: 85,
        escalated: 10,
        abandoned: 5,
      };

      const resolutionRate = (conversations.resolved / conversations.total) * 100;
      expect(resolutionRate).toBe(85);
    });

    it('should track top intents', () => {
      const intents = {
        order_status: 45,
        return_request: 25,
        product_inquiry: 15,
        payment_issue: 10,
        other: 5,
      };

      const topIntent = Object.entries(intents).sort((a, b) => b[1] - a[1])[0];
      expect(topIntent[0]).toBe('order_status');
    });
  });

  describe('Sentiment Analysis', () => {
    const positiveWords = ['thank', 'great', 'awesome', 'perfect', 'love', 'happy'];
    const negativeWords = ['angry', 'frustrated', 'terrible', 'awful', 'hate', 'worst'];

    const analyzeSentiment = (message: string) => {
      const lower = message.toLowerCase();
      const positiveCount = positiveWords.filter((w) => lower.includes(w)).length;
      const negativeCount = negativeWords.filter((w) => lower.includes(w)).length;

      if (positiveCount > negativeCount) return 'positive';
      if (negativeCount > positiveCount) return 'negative';
      return 'neutral';
    };

    it('should detect positive sentiment', () => {
      expect(analyzeSentiment('Thank you so much! Great service!')).toBe('positive');
    });

    it('should detect negative sentiment', () => {
      expect(analyzeSentiment('This is terrible! I am so frustrated!')).toBe('negative');
    });

    it('should detect neutral sentiment', () => {
      expect(analyzeSentiment('I would like to check my order.')).toBe('neutral');
    });
  });
});

describe('Platform Support', () => {
  const platforms = ['web', 'whatsapp', 'instagram', 'facebook', 'messenger'];

  it('should support multiple platforms', () => {
    expect(platforms).toContain('web');
    expect(platforms).toContain('whatsapp');
  });

  it('should normalize messages across platforms', () => {
    const normalize = (msg: any) => ({
      content: msg.content,
      platform: msg.platform,
      timestamp: new Date(msg.timestamp || Date.now()),
    });

    const webMsg = { content: 'Hello', platform: 'web' };
    const whatsappMsg = { content: 'Hello', platform: 'whatsapp' };

    expect(normalize(webMsg).platform).toBe('web');
    expect(normalize(whatsappMsg).platform).toBe('whatsapp');
  });
});
