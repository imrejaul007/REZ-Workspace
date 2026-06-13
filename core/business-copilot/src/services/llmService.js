/**
 * LLM Service - AI Language Model Integration
 * NOW WORKS WITHOUT API KEY - Uses smart fallback responses
 */

import fetch from 'node-fetch';

/**
 * LLM Service Configuration
 */
const DEFAULT_CONFIG = {
  provider: process.env.LLM_PROVIDER || 'demo', // 'openai', 'anthropic', 'local', 'demo'
  model: process.env.LLM_MODEL || 'gpt-4',
  temperature: 0.7,
  maxTokens: 2000,
  apiKey: process.env.LLM_API_KEY
};

/**
 * System prompt for RTMN Business Copilot
 */
const SYSTEM_PROMPT = `You are RTMN Business Copilot, an AI assistant for the Real-Time Multi-Industry Network platform.

Your capabilities:
- Answer questions about business operations across 24 industries
- Analyze data from digital twins and business intelligence
- Provide recommendations based on market trends and analytics
- Assist with procurement, inventory, sales, and operations queries

Industries: Legal, Healthcare, Finance, Retail, Education, Manufacturing, Real Estate, Travel, Restaurant, Fitness, Automotive, Entertainment, Gaming, Agriculture, Construction, Beauty, Fashion, Sports, Government, Home Services, Professional, Non-Profit, Transport, Hotel

Format responses with:
- Direct answer first
- Supporting details
- Actionable recommendations
- Next steps if applicable`;

/**
 * Smart demo responses for when LLM is unavailable
 */
const DEMO_RESPONSES = {
  retail: {
    sales: "Based on your sales data, here's the analysis:\n\n**Key Findings:**\n- Total sales this week: ₹2,45,000\n- Compared to last week: +12% growth\n- Top performing category: Electronics (+18%)\n\n**Recommendations:**\n1. Stock up on electronics for upcoming festive season\n2. Run a promotion on underperforming categories\n3. Consider extending store hours on weekends\n\n**Next Steps:**\n- Review inventory levels for fast-moving items\n- Analyze customer feedback from last month",
    inventory: "Here's your inventory analysis:\n\n**Low Stock Items (Reorder Now):**\n- Product A: 15 units remaining (reorder at 50)\n- Product B: 8 units remaining (reorder at 30)\n- Product C: 22 units remaining (reorder at 100)\n\n**Recommendations:**\n1. Place emergency orders for items < 20 units\n2. Contact Supplier X for faster delivery\n3. Consider alternative suppliers for Product B\n\n**Action:** Should I generate a purchase order for these items?",
    default: "Based on your retail business data:\n\n**Summary:**\n- Store footfall increased by 15% this week\n- Average transaction value: ₹850\n- Customer satisfaction score: 4.2/5\n\n**Insights:**\n- Peak hours: 6 PM - 8 PM\n- Most sold category: Groceries\n- Weekend sales are 40% higher than weekdays"
  },
  restaurant: {
    orders: "Restaurant order analysis:\n\n**Today's Orders:**\n- Total orders: 127\n- Average order value: ₹450\n- Peak hours: 12-2 PM, 7-9 PM\n\n**Popular Items:**\n1. Butter Chicken - 45 orders\n2. Biryani - 38 orders\n3. Naan varieties - 52 orders\n\n**Recommendations:**\n1. Stock up on chicken and rice\n2. Consider adding more seating for peak hours\n3. Run a combo deal for slow periods (3-5 PM)",
    inventory: "Kitchen inventory alert:\n\n**Critical Low:**\n- Chicken: 15 kg (need 50 kg/week)\n- Basmati Rice: 20 kg (need 40 kg/week)\n- Cooking Oil: 5 liters (need 20 liters/week)\n\n**Order Now:**\n- Supplier: Fresh Foods Co.\n- Expected delivery: Tomorrow morning\n\n**Action Required:** Place emergency order for chicken immediately.",
    default: "Restaurant dashboard overview:\n\n**Today's Metrics:**\n- Covers served: 127\n- Revenue: ₹57,150\n- Table turnover: 2.3x\n\n**Staff Status:**\n- Kitchen: Full capacity\n- Floor: 4 servers scheduled\n\n**Tip:** Consider adding weekend brunch service - high demand observed."
  },
  finance: {
    invoices: "Invoice status report:\n\n**Outstanding:**\n- Total pending: ₹4,25,000\n- Overdue (>30 days): ₹1,20,000\n- Average payment time: 25 days\n\n**Action Required:**\n1. Send reminders for overdue invoices\n2. Review payment terms with Client ABC\n3. Consider early payment discount\n\n**Collection Forecast:**\n- This week: ₹1,80,000 expected\n- Next week: ₹1,50,000 expected",
    default: "Financial overview:\n\n**This Month:**\n- Revenue: ₹15,80,000\n- Expenses: ₹9,20,000\n- Net Profit: ₹6,60,000 (42% margin)\n\n**Cash Flow:**\n- Healthy - 2 months runway\n- No immediate concerns\n\n**Recommendation:** Consider investing surplus in equipment upgrade."
  },
  healthcare: {
    appointments: "Today's appointment schedule:\n\n**Booked:** 24 appointments\n**Available:** 6 slots\n\n**Upcoming:**\n1. 9:00 AM - Patient Checkup (15 min)\n2. 9:30 AM - Follow-up Visit (10 min)\n3. 10:00 AM - New Patient (30 min)\n\n**No-show Risk:** 2 patients haven't confirmed\n\n**Action:** Send confirmation messages now.",
    default: "Healthcare dashboard:\n\n**Today's Schedule:**\n- Total appointments: 24\n- Estimated patients: 28\n\n**Supplies:**\n- All critical supplies stocked\n- Next order: Friday\n\n**Staff:**\n- Dr. Sharma: Available\n- Nurse Patel: On duty"
  },
  legal: {
    cases: "Case status update:\n\n**Active Cases:** 8\n**Pending Documents:** 5\n**Upcoming Deadlines:** 3\n\n**This Week:**\n- Case #123: Hearing on Thursday\n- Case #456: Discovery due Friday\n- Case #789: Client meeting Monday\n\n**Priority Actions:**\n1. Review contracts for Case #123\n2. Prepare discovery documents for Case #456\n3. Draft settlement offer for Case #789",
    default: "Legal matters overview:\n\n**Active Matters:** 8\n- Civil: 3\n- Corporate: 4\n- Criminal: 1\n\n**Billable Hours This Month:** 145\n**Revenue MTD:** ₹4,50,000\n\n**Upcoming:**\n- 2 depositions this week\n- 1 trial next month"
  },
  manufacturing: {
    production: "Production status:\n\n**Today's Output:**\n- Units produced: 450\n- Target: 500\n- Efficiency: 90%\n\n**Machine Status:**\n- Machine A: Running (98% uptime)\n- Machine B: Maintenance scheduled\n- Machine C: Running\n\n**Quality:**\n- Pass rate: 97.5%\n- 11 units in QC\n\n**Action:** Schedule preventive maintenance for Machine B during weekend.",
    default: "Manufacturing overview:\n\n**Capacity:** 85% utilized\n**Lead Time:** 5 days average\n\n**Inventory:**\n- Raw materials: Adequate for 2 weeks\n- Finished goods: 1200 units\n\n**Orders:**\n- 45 pending orders\n- 12 urgent\n- Avg delivery: 6 days"
  },
  default: {
    sales: "Sales overview:\n\n**This Week:**\n- Revenue: ₹X,XX,XXX\n- Orders: XX\n- Avg Order Value: ₹XXX\n\n**Top Products:**\n1. Product A\n2. Product B\n3. Product C\n\n**Trend:** ↑ Up from last week",
    inventory: "Inventory status:\n\n**Low Stock Alert:**\n- Item 1: XX units\n- Item 2: XX units\n\n**Recommendations:**\n- Reorder Item 1\n- Review Item 2 usage\n\n**Action:** Generate PO for low stock items?",
    general: "Here's what I found for your business:\n\n**Overview:**\n- Everything looks healthy\n- Key metrics are within targets\n\n**Recommendations:**\n1. Continue current strategy\n2. Monitor weekly trends\n3. Review any anomalies\n\n**Would you like more details on any specific area?**"
  }
};

/**
 * LLM Service Class
 */
export class LLMService {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = config.logger;
    this.isAvailable = !!this.config.apiKey || this.config.provider === 'local' || this.config.provider === 'demo';
  }

  /**
   * Generate a completion from the LLM
   */
  async complete({ prompt, systemPrompt, context, conversationHistory = [] }) {
    const startTime = Date.now();

    try {
      // If no API key, use smart demo mode
      if (!this.config.apiKey && this.config.provider !== 'local') {
        return this._demoComplete({ prompt, systemPrompt, context, conversationHistory });
      }

      let response;

      switch (this.config.provider) {
        case 'openai':
          response = await this._openaiComplete({ prompt, systemPrompt, context, conversationHistory });
          break;
        case 'anthropic':
          response = await this._anthropicComplete({ prompt, systemPrompt, context, conversationHistory });
          break;
        case 'local':
          response = await this._localComplete({ prompt, systemPrompt, context, conversationHistory });
          break;
        default:
          response = this._demoComplete({ prompt, systemPrompt, context, conversationHistory });
      }

      return {
        content: response.content,
        usage: response.usage,
        model: response.model || this.config.provider,
        latency: Date.now() - startTime,
        source: 'llm'
      };
    } catch (error) {
      this.logger?.warn('LLM call failed, using demo mode:', error.message);
      return this._demoComplete({ prompt, systemPrompt, context, conversationHistory });
    }
  }

  /**
   * Demo mode - Smart contextual responses without API
   */
  _demoComplete({ prompt, systemPrompt, context, conversationHistory }) {
    const p = prompt.toLowerCase();
    const industry = context?.industry || 'default';

    // Determine topic from prompt
    let topic = 'general';
    if (p.includes('sale') || p.includes('revenue') || p.includes('order')) topic = 'sales';
    else if (p.includes('inventory') || p.includes('stock') || p.includes('product')) topic = 'inventory';
    else if (p.includes('appointment') || p.includes('patient') || p.includes('schedule')) topic = 'appointments';
    else if (p.includes('case') || p.includes('legal') || p.includes('document')) topic = 'cases';
    else if (p.includes('invoice') || p.includes('payment') || p.includes('billing')) topic = 'invoices';
    else if (p.includes('production') || p.includes('machine') || p.includes('manufacturing')) topic = 'production';

    // Get response based on industry and topic
    const industryResponses = DEMO_RESPONSES[industry] || DEMO_RESPONSES.default;
    let response = industryResponses[topic] || industryResponses.default || DEMO_RESPONSES.default.general;

    // Add context if available
    if (context?.twinData?.twins?.length > 0) {
      response += `\n\n**Connected Data:** Found ${context.twinData.twins.length} relevant digital twins in your ecosystem.`;
    }

    if (context?.memoryData?.items?.length > 0) {
      response += `\n\n**Historical Context:** Found ${context.memoryData.items.length} related memories.`;
    }

    if (context?.intelligence?.insights?.length > 0) {
      response += `\n\n**AI Insights:** ${context.intelligence.insights[0]}`;
    }

    response += `\n\n---\n*Response generated by RTMN Demo Mode. Add LLM_API_KEY for full AI capabilities.*`;

    return {
      content: response,
      usage: { tokens: response.length },
      model: 'demo',
      latency: 50,
      source: 'demo'
    };
  }

  /**
   * OpenAI API completion
   */
  async _openaiComplete({ prompt, systemPrompt, context, conversationHistory }) {
    const messages = [];

    messages.push({ role: 'system', content: systemPrompt || SYSTEM_PROMPT });

    if (context && Object.keys(context).length > 0) {
      const contextStr = this._formatContext(context);
      messages.push({ role: 'system', content: `Context:\n${contextStr}` });
    }

    for (const msg of conversationHistory.slice(-10)) {
      messages.push({ role: msg.role, content: msg.content });
    }

    messages.push({ role: 'user', content: prompt });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI error: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || 'No response',
      usage: data.usage,
      model: data.model
    };
  }

  /**
   * Anthropic API completion
   */
  async _anthropicComplete({ prompt, systemPrompt, context, conversationHistory }) {
    const messages = [];
    for (const msg of conversationHistory.slice(-10)) {
      messages.push({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.content });
    }
    messages.push({ role: 'user', content: prompt });

    let systemContent = systemPrompt || SYSTEM_PROMPT;
    if (context && Object.keys(context).length > 0) {
      systemContent += `\n\nContext:\n${this._formatContext(context)}`;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.config.model || 'claude-3-sonnet-20240229',
        max_tokens: this.config.maxTokens,
        system: systemContent,
        messages
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic error: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.content[0]?.text || 'No response',
      usage: { input_tokens: data.usage?.input_tokens, output_tokens: data.usage?.output_tokens },
      model: data.model
    };
  }

  /**
   * Local/Ollama completion
   */
  async _localComplete({ prompt, systemPrompt, context, conversationHistory }) {
    const messages = [];
    for (const msg of conversationHistory.slice(-10)) {
      messages.push({ role: msg.role, content: msg.content });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await fetch(`${process.env.LOCAL_LLM_URL || 'http://localhost:11434'}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model || 'llama2',
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          ...(context ? [{ role: 'system', content: this._formatContext(context) }] : []),
          ...messages
        ],
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Local LLM error: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.message?.content || 'No response',
      usage: {},
      model: data.model
    };
  }

  /**
   * Format context object for prompt
   */
  _formatContext(context) {
    const parts = [];

    if (context.twinData?.twins?.length > 0) {
      parts.push(`Digital Twins (${context.twinData.twins.length} found):`);
      context.twinData.twins.slice(0, 5).forEach(twin => {
        parts.push(`- ${twin.name}: ${twin.description}`);
      });
    }

    if (context.memoryData?.items?.length > 0) {
      parts.push(`\nMemory Context:`);
      context.memoryData.items.slice(0, 3).forEach(item => {
        parts.push(`- ${item.content || item.text || JSON.stringify(item).slice(0, 100)}`);
      });
    }

    if (context.intelligence?.insights?.length > 0) {
      parts.push(`\nIntelligence Insights:`);
      context.intelligence.insights.slice(0, 3).forEach(insight => {
        parts.push(`- ${insight}`);
      });
    }

    if (context.industry) {
      parts.push(`\nIndustry: ${context.industry}`);
    }

    return parts.join('\n') || 'No context available';
  }

  /**
   * Check service status
   */
  async healthCheck() {
    if (!this.config.apiKey && this.config.provider !== 'local' && this.config.provider !== 'demo') {
      return {
        available: false,
        reason: 'No API key configured - using demo mode',
        mode: 'demo'
      };
    }

    try {
      if (this.config.provider === 'local') {
        const response = await fetch(`${process.env.LOCAL_LLM_URL || 'http://localhost:11434'}/api/tags`);
        return { available: response.ok, mode: 'local' };
      }

      return { available: true, provider: this.config.provider, mode: this.config.provider };
    } catch (error) {
      return { available: false, reason: error.message, mode: 'demo' };
    }
  }
}

/**
 * Factory function
 */
export function createLLMService(config = {}) {
  return new LLMService(config);
}

export default LLMService;
