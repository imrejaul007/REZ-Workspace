// ==========================================
// AI Agents Service - Agent Service
// Core business logic for AI agents
// ==========================================

import { v4 as uuidv4 } from 'uuid';
import {
  Agent,
  AgentId,
  AgentResponse,
  AgentAction,
  Conversation,
  ConversationContext,
  Message,
  AgentConfig,
  ChatRequest,
  AGENTS,
  DailyInsight,
  WeeklyDigest,
} from '../types';
import { logger } from '../utils/logger';

// ==========================================
// In-Memory Storage (Replace with Redis/DB in production)
// ==========================================

const conversations: Map<string, Conversation> = new Map();
const agentConfigs: Map<string, AgentConfig> = new Map();

// ==========================================
// Agent Service Class
// ==========================================

export class AgentService {
  /**
   * Get all available agents
   */
  static getAllAgents(): Agent[] {
    logger.info('Fetching all agents');
    return Object.values(AGENTS);
  }

  /**
   * Get agent by ID
   */
  static getAgentById(agentId: AgentId): Agent | undefined {
    logger.info(`Fetching agent: ${agentId}`);
    return AGENTS[agentId];
  }

  /**
   * Get agent status
   */
  static getAgentStatus(agentId: AgentId): Agent['status'] {
    const agent = AGENTS[agentId];
    return agent?.status || 'offline';
  }

  /**
   * Process chat message and generate response
   */
  static async processChat(
    userId: string,
    agentId: AgentId,
    request: ChatRequest
  ): Promise<AgentResponse> {
    logger.info(`Processing chat for user ${userId} with agent ${agentId}`);

    const agent = AGENTS[agentId];
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Get or create conversation
    const conversationId = `${userId}-${agentId}`;
    let conversation = conversations.get(conversationId);

    if (!conversation) {
      conversation = this.createConversation(userId, agentId, request.context);
      conversations.set(conversationId, conversation);
    }

    // Add user message
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: request.message,
      timestamp: new Date().toISOString(),
    };
    conversation.messages.push(userMessage);

    // Generate AI response
    const response = await this.generateResponse(agent, request, conversation);

    // Add assistant message
    const assistantMessage: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: response.response,
      timestamp: response.timestamp,
      metadata: {
        suggestions: response.suggestions,
        actions: response.actions,
      },
    };
    conversation.messages.push(assistantMessage);

    // Update conversation
    conversation.lastMessageAt = response.timestamp;
    conversation.messageCount = conversation.messages.length;
    conversation.updatedAt = response.timestamp;

    conversations.set(conversationId, conversation);

    return response;
  }

  /**
   * Create new conversation
   */
  static createConversation(
    userId: string,
    agentId: AgentId,
    context?: Partial<ConversationContext>
  ): Conversation {
    const agent = AGENTS[agentId];
    return {
      id: uuidv4(),
      userId,
      agentId,
      messages: [],
      context: {
        employeeId: context?.employeeId,
        employeeName: context?.employeeName,
        department: context?.department,
        designation: context?.designation,
        tenure: context?.tenure,
        skills: context?.skills || [],
        projects: context?.projects || [],
        salary: context?.salary,
        benefits: context?.benefits || [],
        leaveBalance: context?.leaveBalance,
        performance: context?.performance,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
      messageCount: 0,
      isActive: true,
    };
  }

  /**
   * Generate AI response based on agent and context
   */
  private static async generateResponse(
    agent: Agent,
    request: ChatRequest,
    conversation: Conversation
  ): Promise<AgentResponse> {
    // In production, this would call an LLM API (OpenAI, Anthropic, etc.)
    // For now, we generate contextual responses based on rules

    const message = request.message.toLowerCase();
    const context = conversation.context;

    let response: string;
    let suggestions: string[] = agent.suggestions;
    let actions: AgentAction[] = [];

    // Agent-specific response generation
    switch (agent.id) {
      case 'career-coach':
        response = this.generateCareerCoachResponse(message, context);
        actions = this.generateCareerActions(message, context);
        break;

      case 'productivity-advisor':
        response = this.generateProductivityResponse(message, context);
        actions = this.generateProductivityActions(message);
        break;

      case 'learning-coach':
        response = this.generateLearningCoachResponse(message, context);
        actions = this.generateLearningActions(message, context);
        break;

      case 'financial-advisor':
        response = this.generateFinancialAdvisorResponse(message, context);
        actions = this.generateFinancialActions(message, context);
        break;

      case 'benefits-assistant':
        response = this.generateBenefitsResponse(message, context);
        actions = this.generateBenefitsActions(message);
        break;

      case 'hr-assistant':
        response = this.generateHRResponse(message, context);
        actions = this.generateHRActions(message, context);
        break;

      default:
        response = agent.welcomeMessage;
    }

    return {
      agentId: agent.id,
      response,
      suggestions,
      actions,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Career Coach Response Generation
   */
  private static generateCareerCoachResponse(
    message: string,
    context: ConversationContext
  ): string {
    if (message.includes('promotion') || message.includes('ready')) {
      const readiness = context.performance?.score || 75;
      if (readiness >= 80) {
        return `Based on your performance score of ${readiness}%, you're well-positioned for a promotion! Here are some key areas to focus on:\n\n1. **Leadership Impact** - Take on mentoring responsibilities\n2. **Strategic Thinking** - Contribute to team planning\n3. **Cross-functional Collaboration** - Work with other departments\n\nWould you like me to create a personalized promotion roadmap for you?`;
      }
      return `Your current performance score is ${readiness}%. Here's what I recommend to improve your promotion readiness:\n\n1. **Track your wins** - Document key achievements\n2. **Seek feedback** - Ask your manager for specific areas to improve\n3. **Skill development** - Focus on skills required for the next level\n\nWould you like me to analyze your skill gaps?`;
    }

    if (message.includes('skill') || message.includes('gap')) {
      const skills = context.skills || [];
      return `Based on your profile, you have these skills: ${skills.join(', ') || 'not yet updated'}.\n\nTo identify skill gaps, I recommend:\n1. Reviewing the job description for your target role\n2. Comparing required skills with your current skills\n3. Creating a learning plan for critical gaps\n\nWould you like me to suggest courses for common skill gaps?`;
    }

    if (message.includes('career') || message.includes('path')) {
      return `Here's a potential career path based on your experience:\n\n**Short-term (0-1 years)**\n- Master current role responsibilities\n- Build cross-functional relationships\n- Take on stretch projects\n\n**Medium-term (1-3 years)**\n- Lead a small team or project\n- Develop strategic thinking skills\n- Build industry expertise\n\n**Long-term (3-5 years)**\n- Senior leadership role\n- Strategic planning and execution\n- Mentorship and team building\n\nShall I create a more detailed development plan for you?`;
    }

    return agentPrompts.careerCoach.welcome;
  }

  private static generateCareerActions(
    message: string,
    context: ConversationContext
  ): AgentAction[] {
    const actions: AgentAction[] = [];

    if (message.includes('promotion')) {
      actions.push({
        type: 'navigate',
        label: 'View Career Progress',
        data: { screen: 'career-progress' },
      });
    }

    if (message.includes('skill') || message.includes('learn')) {
      actions.push({
        type: 'navigate',
        label: 'View Skill Gaps',
        data: { screen: 'skill-gap' },
      });
    }

    return actions;
  }

  /**
   * Productivity Advisor Response Generation
   */
  private static generateProductivityResponse(
    message: string,
    context: ConversationContext
  ): string {
    if (message.includes('focus') || message.includes('concentrate')) {
      return `Great question about focus! Here are my top tips:\n\n**Morning Focus Block (9-11 AM)**\n- Start with your most important task\n- No meetings during this time\n- Turn off notifications\n\n**Pomodoro Technique**\n- Work for 25 minutes\n- Take a 5-minute break\n- After 4 cycles, take a longer break\n\n**Environment Tips**\n- Keep your desk clean\n- Use noise-canceling headphones\n- Natural light helps\n\nWould you like me to create a personalized focus schedule for you?`;
    }

    if (message.includes('week') || message.includes('plan')) {
      return `Here's how to plan your week for maximum productivity:\n\n**Sunday Planning (30 mins)**\n1. Review last week's accomplishments\n2. Identify 3-5 key goals for this week\n3. Schedule time blocks for each goal\n\n**Daily Rhythm**\n- 9-11 AM: Deep work (no meetings)\n- 11 AM-12 PM: Meetings and collaboration\n- 12-1 PM: Lunch and walking\n- 1-3 PM: Afternoon work block\n- 3-4 PM: Admin and emails\n- 4-5 PM: Plan for tomorrow\n\nShall I help you create a weekly plan?`;
    }

    if (message.includes('meeting') || message.includes('time waste')) {
      return `Meeting fatigue is real! Here are tips to reclaim your time:\n\n**Before Accepting a Meeting**\n- Ask: "What's the agenda?"\n- Ask: "Can this be an email?"\n- Ask: "Do I need to be there?"\n\n**During Meetings**\n- Start and end on time\n- Stand up meetings for short updates\n- Take notes on action items only\n\n**After Meetings**\n- Send summary to attendees\n- Track action items\n- Schedule follow-ups immediately\n\nWould you like me to analyze your meeting patterns?`;
    }

    return `Hello! I'm here to help you boost your productivity. I can analyze your work patterns, suggest optimal focus times, and help you manage your time better.\n\nWhat aspect of productivity would you like to work on?`;
  }

  private static generateProductivityActions(message: string): AgentAction[] {
    const actions: AgentAction[] = [];

    if (message.includes('focus') || message.includes('plan')) {
      actions.push({
        type: 'calculate',
        label: 'Calculate Focus Time',
        data: { type: 'focus_schedule' },
      });
    }

    actions.push({
      type: 'navigate',
      label: 'View Productivity Stats',
      data: { screen: 'productivity' },
    });

    return actions;
  }

  /**
   * Learning Coach Response Generation
   */
  private static generateLearningCoachResponse(
    message: string,
    context: ConversationContext
  ): string {
    if (message.includes('skill') || message.includes('learn')) {
      const skills = context.skills || [];
      return `Based on your current skills (${skills.join(', ') || 'not updated yet'}), here are recommended areas to learn:\n\n**High-Impact Skills for Your Role**\n1. Data Analysis - Essential for decision making\n2. Communication - Key for leadership\n3. Project Management - Cross-functional value\n\n**Recommended Learning Paths**\n- **Beginner**: Start with fundamentals\n- **Intermediate**: Apply in real projects\n- **Advanced**: Mentor others\n\nWould you like me to create a personalized learning plan?`;
    }

    if (message.includes('course') || message.includes('recommend')) {
      return `Here are my top course recommendations:\n\n**Leadership & Management**\n- "People Management" by Harvard Online\n- "Leadership Fundamentals" on Coursera\n\n**Technical Skills**\n- "Data-Driven Decision Making" on edX\n- "Project Management Professional" on PMI\n\n**Communication**\n- "Business Communication" on LinkedIn Learning\n- "Presentation Skills" workshop\n\nShall I find courses matching your specific skill gaps?`;
    }

    if (message.includes('certification') || message.includes('cert')) {
      return `Certifications can boost your career! Here are recommended certifications:\n\n**In-Demand Certifications**\n1. PMP - Project Management\n2. Scrum Master - Agile methodology\n3. AWS/Azure - Cloud computing\n4. Data Science - Analytics\n\n**Company-Sponsored Programs**\n- Talk to your manager about budget allocation\n- Some companies match LinkedIn Learning subscriptions\n\nWould you like guidance on a specific certification path?`;
    }

    return `Hi! I'm your Learning Coach. I can help you:\n- Identify skill gaps\n- Find the best learning resources\n- Create personalized learning paths\n- Track your learning progress\n\nWhat would you like to learn about?`;
  }

  private static generateLearningActions(
    message: string,
    context: ConversationContext
  ): AgentAction[] {
    const actions: AgentAction[] = [];

    actions.push({
      type: 'navigate',
      label: 'Browse Courses',
      data: { screen: 'courses' },
    });

    if (message.includes('skill') || message.includes('gap')) {
      actions.push({
        type: 'navigate',
        label: 'View Skill Gap Analysis',
        data: { screen: 'skill-gap' },
      });
    }

    return actions;
  }

  /**
   * Financial Advisor Response Generation
   */
  private static generateFinancialAdvisorResponse(
    message: string,
    context: ConversationContext
  ): string {
    if (message.includes('tax') || message.includes('save')) {
      return `Great question about tax savings! Here are strategies:\n\n**Tax-Saving Investments (Section 80C)**\n- PPF - ₹1.5 lakh limit\n- ELSS Mutual Funds - ₹1.5 lakh limit\n- Life Insurance Premium\n- Home Loan Principal\n\n**Health & Insurance (Section 80D)**\n- Health insurance: ₹25,000-₹100,000\n- Preventive health checkup: ₹5,000\n\n**Other Sections**\n- 80CCD(1B): NPS - ₹50,000 extra\n- HRA: Rent receipts\n- LTA: Leave travel allowance\n\nWould you like me to calculate your potential tax savings?`;
    }

    if (message.includes('invest') || message.includes('mutual fund')) {
      return `Here's a framework for investment allocation:\n\n**Emergency Fund (Priority #1)**\n- 3-6 months of expenses\n- Keep in savings account or liquid fund\n\n**Debt Repayment**\n- Clear high-interest debt first\n- Consider prepaying home loan\n\n**Investment Allocation by Age**\n- **Under 30**: 80% equity, 20% debt\n- **30-40**: 60% equity, 40% debt\n- **40-50**: 40% equity, 60% debt\n\n**Suggested Instruments**\n- Equity: Index funds, blue-chip stocks\n- Debt: PPF, FDs, bonds\n- Gold: 5-10% max\n\n*Please consult a certified financial planner for personalized advice.*`;
    }

    if (message.includes('salary') || message.includes('structure')) {
      const salary = context.salary || 0;
      return `Your salary structure breakdown could be:\n\n**Typical Components**\n- Basic: 40-50% of CTC\n- HRA: 40-50% of Basic\n- Allowances: 10-20% of CTC\n- Provident Fund: 12% of Basic\n\n**Optimize Your Salary**\n1. Opt for HRA declaration if renting\n2. Claim LTA for travel expenses\n3. Invest in NPS for tax benefit\n4. Get health insurance separately\n\nYour approximate in-hand would be:\n- ₹${((salary * 0.7) / 12).toLocaleString('en-IN')}/month (assuming ₹${salary?.toLocaleString('en-IN') || '0'}/year)\n\nShall I create a salary optimization plan?`;
    }

    return `Hello! I'm your Financial Advisor. I can help you with:\n- Understanding your salary structure\n- Tax-saving strategies\n- Investment planning\n- Budgeting tips\n\n*Note: Always consult a certified financial planner for major financial decisions.*\n\nWhat would you like to discuss?`;
  }

  private static generateFinancialActions(
    message: string,
    context: ConversationContext
  ): AgentAction[] {
    const actions: AgentAction[] = [];

    if (message.includes('tax') || message.includes('save')) {
      actions.push({
        type: 'calculate',
        label: 'Calculate Tax Savings',
        data: { type: 'tax_calculator' },
      });
    }

    actions.push({
      type: 'navigate',
      label: 'View Financial Health',
      data: { screen: 'financial-health' },
    });

    return actions;
  }

  /**
   * Benefits Assistant Response Generation
   */
  private static generateBenefitsResponse(
    message: string,
    context: ConversationContext
  ): string {
    if (message.includes('what') || message.includes('have')) {
      const benefits = context.benefits || [];
      return `Here are your available benefits:\n\n**Health & Wellness**\n- Health Insurance (Family coverage)\n- Dental & Vision\n- Mental Health Support (EAP)\n\n**Financial**\n- Life Insurance\n- Accidental Insurance\n- Retirement Plan (PF)\n\n**Lifestyle**\n- Meal Coupons\n- Travel Allowance\n- Learning & Development Budget\n\n**Family**\n- Parental Leave\n- Childcare Support\n- Family Days\n\nYour enrolled benefits: ${benefits.join(', ') || 'Check your profile for details'}\n\nWould you like to explore any specific benefit category?`;
    }

    if (message.includes('health') || message.includes('insurance')) {
      return `Here's what you need to know about your health benefits:\n\n**Coverage**\n- Base plan: ₹3 lakhs\n- Floater: ₹5 lakhs (family)\n\n**In-Network**\n- Cashless hospitalization at network hospitals\n- Preventive health checkups covered\n\n**Claims Process**\n1. Visit in-network hospital\n2. Show your employee ID\n3. Hospital coordinates with insurer\n4. No payment required (cashless)\n\n**Out-of-Network**\n- Pay first, claim later\n- Submit documents within 30 days\n- Reimbursement within 15 working days\n\nNeed help with a specific claim?`;
    }

    if (message.includes('claim')) {
      return `Here's how to file a benefits claim:\n\n**Steps to Claim**\n1. Log into the benefits portal\n2. Select "File a Claim"\n3. Choose benefit type\n4. Upload required documents\n5. Submit and track status\n\n**Documents Needed**\n- Original bills/receipts\n- Doctor's prescription\n- Investigation reports\n- Claim form (signed)\n\n**Timeline**\n- Cashless: At admission\n- Reimbursement: Within 30 days\n\nWould you like me to walk you through a specific claim process?`;
    }

    return `Hi! I'm your Benefits Assistant. I can help you:\n- Understand your benefits package\n- Choose the right plans\n- File claims\n- Maximize your benefits value\n\nWhat would you like help with?`;
  }

  private static generateBenefitsActions(message: string): AgentAction[] {
    const actions: AgentAction[] = [];

    actions.push({
      type: 'show_benefit',
      label: 'View My Benefits',
      data: { type: 'all' },
    });

    if (message.includes('claim')) {
      actions.push({
        type: 'navigate',
        label: 'File a Claim',
        data: { screen: 'claim' },
      });
    }

    return actions;
  }

  /**
   * HR Assistant Response Generation
   */
  private static generateHRResponse(
    message: string,
    context: ConversationContext
  ): string {
    if (message.includes('leave') || message.includes('balance')) {
      const balance = context.leaveBalance || { sick: 0, casual: 0, earned: 0 };
      return `Here's your leave balance:\n\n**Available Leaves**\n- Sick Leave: ${balance.sick} days\n- Casual Leave: ${balance.casual} days\n- Earned/Privilege: ${balance.earned} days\n\n**How to Apply**\n1. Go to Work > Leave\n2. Click "Apply for Leave"\n3. Select leave type and dates\n4. Add reason and submit\n\n**Leave Rules**\n- Sick leave: Max 12 days/year (carry forward)\n- Casual leave: Max 8 days/year (no carry forward)\n- Earned leave: Encashment on resignation\n\nWould you like me to help you apply for leave?`;
    }

    if (message.includes('attendance') || message.includes('check')) {
      return `Here's everything about attendance:\n\n**Check-in Methods**\n1. GPS Location (Recommended)\n2. QR Code Scan\n3. Manual Entry (WFH)\n\n**Working Hours**\n- Start: By 10:00 AM\n- Core hours: 10 AM - 4 PM\n- Flex time available\n\n**Late & Absent**\n- Late by 10 min: OK (grace)\n- Late by 30+ min: Marked late\n- 3 late = 1 absent\n\n**WFH Policy**\n- Check-in required when WFH\n- Update availability in calendar\n- Manager approval not required\n\nNeed help with attendance?`;
    }

    if (message.includes('holiday') || message.includes('calendar')) {
      return `Here are the upcoming holidays:\n\n**May 2026**\n- May 15: Buddha Purnima\n\n**June 2026**\n- June 7: Eid-ul-Fitr\n- June 15: Bhagat Singh Martyrdom Day\n\n**July 2026**\n- July 13: Eid al-Adha\n\n**Note**: Holidays may vary by state. Check with HR for regional holidays.\n\nWould you like me to add holidays to your calendar?`;
    }

    if (message.includes('contact') || message.includes('escalat')) {
      return `Here's who to contact for different issues:\n\n**For Leave & Attendance**\n- Your direct manager\n- HR Helpdesk: hr@company.com\n\n**For Benefits & Claims**\n- Benefits Team: benefits@company.com\n- Insurance Provider: 1800-XXX-XXXX\n\n**For Technical Issues**\n- IT Support: it@company.com\n- Helpdesk: Ext. 1234\n\n**For Grievances**\n- HR Manager\n- Skip-level meeting\n- Anonymous portal\n\nShall I help you draft an email to the right person?`;
    }

    return `Hi! I'm your HR Assistant. I can help you with:\n- Leave policies and requests\n- Attendance rules\n- Company holidays\n- HR escalations\n- Policy clarifications\n\nWhat would you like to know?`;
  }

  private static generateHRActions(
    message: string,
    context: ConversationContext
  ): AgentAction[] {
    const actions: AgentAction[] = [];

    if (message.includes('leave') || message.includes('balance')) {
      actions.push({
        type: 'navigate',
        label: 'View Leave Balance',
        data: { screen: 'leave' },
      });
    }

    if (message.includes('holiday') || message.includes('calendar')) {
      actions.push({
        type: 'notify',
        label: 'Add to Calendar',
        data: { type: 'holidays' },
      });
    }

    return actions;
  }

  /**
   * Get user conversations
   */
  static getConversations(userId: string): Conversation[] {
    const userConversations: Conversation[] = [];
    conversations.forEach((conv) => {
      if (conv.userId === userId) {
        userConversations.push(conv);
      }
    });
    return userConversations.sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  }

  /**
   * Get specific conversation
   */
  static getConversation(userId: string, conversationId: string): Conversation | undefined {
    const conversation = conversations.get(conversationId);
    if (conversation && conversation.userId === userId) {
      return conversation;
    }
    return undefined;
  }

  /**
   * Configure agent for user
   */
  static configureAgent(
    userId: string,
    agentId: AgentId,
    config: Partial<AgentConfig>
  ): AgentConfig {
    const key = `${userId}-${agentId}`;
    const existing = agentConfigs.get(key);

    const newConfig: AgentConfig = {
      userId,
      agentId,
      preferences: config.preferences || existing?.preferences || {},
      customInstructions: config.customInstructions || existing?.customInstructions,
      enabled: config.enabled !== undefined ? config.enabled : existing?.enabled ?? true,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    agentConfigs.set(key, newConfig);
    logger.info(`Configured agent ${agentId} for user ${userId}`);

    return newConfig;
  }

  /**
   * Get agent configuration
   */
  static getAgentConfig(userId: string, agentId: AgentId): AgentConfig | undefined {
    return agentConfigs.get(`${userId}-${agentId}`);
  }

  /**
   * Generate daily insights for user
   */
  static generateDailyInsights(userId: string, context: ConversationContext): DailyInsight[] {
    const insights: DailyInsight[] = [];
    const today = new Date().toISOString().split('T')[0];

    // Productivity insight
    insights.push({
      id: uuidv4(),
      userId,
      date: today,
      type: 'productivity',
      title: 'Focus Time Available',
      description: 'You have 2 hours of uninterrupted focus time recommended today.',
      score: 85,
      trend: 'stable',
      recommendations: [
        'Schedule your most important task for morning',
        'Block 9-11 AM for deep work',
        'Limit meetings to afternoon',
      ],
      priority: 'medium',
    });

    // Learning insight
    insights.push({
      id: uuidv4(),
      userId,
      date: today,
      type: 'learning',
      title: 'Learning Opportunity',
      description: 'New course recommendations based on your career goals.',
      recommendations: [
        'Check out "Leadership Fundamentals"',
        'Explore data analytics basics',
        'Consider a communication workshop',
      ],
      priority: 'low',
    });

    // Wellness insight
    insights.push({
      id: uuidv4(),
      userId,
      date: today,
      type: 'wellness',
      title: 'Take a Break',
      description: 'Remember to take short breaks to stay fresh and productive.',
      recommendations: [
        'Try the 20-20-20 rule for eye health',
        'Take a 5-minute walk every hour',
        'Stay hydrated throughout the day',
      ],
      priority: 'low',
    });

    return insights;
  }

  /**
   * Generate weekly digest
   */
  static generateWeeklyDigest(userId: string): WeeklyDigest {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    return {
      userId,
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      summary: {
        productivity: 78,
        learning: 65,
        wellness: 72,
        careerProgress: 58,
      },
      highlights: [
        'Completed 8 of 10 planned tasks',
        'Attended 12 meetings (5 were optional)',
        'Learned 2 new skills',
        'Maintained good work-life balance',
      ],
      insights: this.generateDailyInsights(userId, {}),
      upcomingGoals: [
        'Complete project milestone',
        'Schedule 1:1 with manager',
        'Review career development plan',
      ],
    };
  }
}

// ==========================================
// Agent-specific prompts
// ==========================================

const agentPrompts = {
  careerCoach: {
    welcome: "Hi! I'm your Career Coach. I can help you plan your career growth, identify skill gaps, and prepare for your next promotion. What would you like to work on?",
  },
  productivityAdvisor: {
    welcome: "Hey! I'm your Productivity Advisor. I can help you manage your time better, stay focused, and achieve more with less stress. Ready to boost your productivity?",
  },
  learningCoach: {
    welcome: "Welcome! I'm your Learning Coach. I can help you identify what to learn next, find the best resources, and create a learning plan that actually works. What skills do you want to develop?",
  },
  financialAdvisor: {
    welcome: "Hi there! I'm your Financial Advisor. I can help you understand your salary better, find tax savings, and make smart money decisions. What financial topic interests you?",
  },
  benefitsAssistant: {
    welcome: "Hello! I'm your Benefits Assistant. I can help you understand your benefits, choose the right plans, and guide you through claims. Which benefits would you like to explore?",
  },
  hrAssistant: {
    welcome: "Hi! I'm your HR Assistant. I can answer questions about leave policies, attendance, company rules, and more. What would you like to know?",
  },
};

export default AgentService;
