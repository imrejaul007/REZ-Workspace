/**
 * WhatsApp AI Agent
 * Handles WhatsApp conversations with customers across all industries
 */

import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { unifiedLeadService } from '../../services/unified-lead-service';
import { customer360Service } from '../../services/customer-360-service';
import { crossSellService } from '../../services/cross-sell-service';
import { hojaiCore, IndustryType } from '../../connectors/hojai-core';

export interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location';
  timestamp: Date;
  incoming: boolean;
}

export interface WhatsAppSession {
  id: string;
  phoneNumber: string;
  customerId?: string;
  customerName?: string;
  industry?: IndustryType;
  state: 'initial' | 'menu' | 'product-inquiry' | 'support' | 'appointment' | 'checkout' | 'resolved';
  messages: WhatsAppMessage[];
  context: Record<string, any>;
  createdAt: Date;
  lastActivity: Date;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
  category: 'marketing' | 'utility' | 'authentication';
  approved: boolean;
}

export interface WhatsAppCampaign {
  id: string;
  name: string;
  templateId: string;
  segments: string[];
  status: 'draft' | 'scheduled' | 'sending' | 'completed';
  sent: number;
  delivered: number;
  failed: number;
  scheduledFor?: Date;
}

class WhatsAppAIAgent {
  private agentName = 'WhatsApp AI';
  private agentId = 'whatsapp-ai-001';
  private port: number;
  private app: express.Application;
  private sessions: Map<string, WhatsAppSession> = new Map();
  private phoneToSession: Map<string, string> = new Map();
  private campaigns: Map<string, WhatsAppCampaign> = new Map();

  // WhatsApp message templates
  private templates: Map<string, WhatsAppTemplate> = new Map([
    ['welcome', {
      id: 'welcome',
      name: 'Welcome Message',
      content: 'Hello {{name}}! Welcome to HOJAI AI. How can I help you today?',
      variables: ['name'],
      category: 'utility',
      approved: true
    }],
    ['product-catalog', {
      id: 'product-catalog',
      name: 'Product Catalog',
      content: 'Here are our products:\n1. Waitron - Restaurant POS\n2. ShopFlow - Retail Platform\n3. StayBot - Hotel Management\n4. GlamAI - Salon Services\n5. FleetIQ - Fleet Management\n\nReply with a number for more details.',
      variables: [],
      category: 'marketing',
      approved: true
    }],
    ['appointment-confirm', {
      id: 'appointment-confirm',
      name: 'Appointment Confirmation',
      content: 'Your appointment has been confirmed for {{date}} at {{time}}. We look forward to seeing you!',
      variables: ['date', 'time'],
      category: 'utility',
      approved: true
    }],
    ['support-ticket', {
      id: 'support-ticket',
      name: 'Support Ticket Created',
      content: 'Your support ticket #{{ticketId}} has been created. Our team will respond within 24 hours.',
      variables: ['ticketId'],
      category: 'utility',
      approved: true
    }],
    ['cross-sell', {
      id: 'cross-sell',
      name: 'Cross-Sell Opportunity',
      content: 'Hi {{name}}! As a valued customer, we thought you might love our {{product}} service. Would you like to learn more?',
      variables: ['name', 'product'],
      category: 'marketing',
      approved: true
    }]
  ]);

  // Product information for inquiries
  private productInfo: Record<IndustryType, { name: string; description: string; features: string[] }> = {
    waitron: {
      name: 'Waitron',
      description: 'AI-powered restaurant POS and ordering system',
      features: ['Smart menu management', 'Table tracking', 'Kitchen display', 'Online ordering integration']
    },
    shopflow: {
      name: 'ShopFlow',
      description: 'Complete retail management platform',
      features: ['Inventory management', 'POS system', 'Customer loyalty', 'Multi-store support']
    },
    staybot: {
      name: 'StayBot',
      description: 'Modern hotel management system',
      features: ['Booking engine', 'Guest management', 'Housekeeping tracking', 'Revenue management']
    },
    carecode: {
      name: 'CareCode',
      description: 'Healthcare scheduling and patient management',
      features: ['Appointment scheduling', 'Patient records', 'Reminder system', 'Insurance integration']
    },
    glamai: {
      name: 'GlamAI',
      description: 'Salon and beauty services platform',
      features: ['Booking system', 'Service menu', 'Client management', 'Product inventory']
    },
    fitmind: {
      name: 'FitMind',
      description: 'Fitness and wellness management',
      features: ['Class scheduling', 'Membership management', 'Trainer portal', 'Progress tracking']
    },
    teammind: {
      name: 'TeamMind',
      description: 'Team collaboration and management',
      features: ['Task management', 'Communication hub', 'Performance tracking', 'Resource allocation']
    },
    ledgerai: {
      name: 'LedgerAI',
      description: 'Accounting and invoicing automation',
      features: ['Invoice generation', 'Expense tracking', 'Financial reports', 'Tax preparation']
    },
    fleetiq: {
      name: 'FleetIQ',
      description: 'Fleet management and tracking',
      features: ['GPS tracking', 'Maintenance scheduling', 'Driver management', 'Fuel monitoring']
    },
    propflow: {
      name: 'PropFlow',
      description: 'Property management and rentals',
      features: ['Tenant management', 'Rent collection', 'Maintenance requests', 'Lease tracking']
    },
    neighborai: {
      name: 'NeighborAI',
      description: 'Community and neighborhood platform',
      features: ['Announcements', 'Service directory', 'Event calendar', 'Community forum']
    },
    learniq: {
      name: 'LearnIQ',
      description: 'Learning management system',
      features: ['Course creation', 'Progress tracking', 'Assessments', 'Certificates']
    },
    tripmind: {
      name: 'TripMind',
      description: 'Travel planning and booking',
      features: ['Trip planning', 'Booking management', 'Travel guides', 'Expense tracking']
    },
    franchiseiq: {
      name: 'FranchiseIQ',
      description: 'Franchise management system',
      features: ['Multi-location support', 'Standardized operations', 'Performance analytics', 'Training portal']
    },
    prodflow: {
      name: 'ProdFlow',
      description: 'Production and manufacturing management',
      features: ['Production planning', 'Quality control', 'Inventory tracking', 'Supply chain management']
    }
  };

  constructor(port: number = 4982) {
    this.port = port;
    this.app = express();
    this.app.use(express.json());
    this.setupRoutes();
  }

  /**
   * Setup Express routes
   */
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        agent: this.agentName,
        agentId: this.agentId,
        activeSessions: this.sessions.size
      });
    });

    // Receive incoming webhook (WhatsApp format)
    this.app.post('/webhook', async (req: Request, res: Response) => {
      try {
        const { from, content, type } = req.body;

        if (!from) {
          return res.status(400).json({ error: 'Missing sender information' });
        }

        const response = await this.handleIncomingMessage({
          phoneNumber: from,
          content: content || '',
          messageType: type || 'text'
        });

        res.json({ response });
      } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Failed to process message' });
      }
    });

    // Send outbound message
    this.app.post('/send', async (req: Request, res: Response) => {
      try {
        const { phoneNumber, content, type, templateId } = req.body;

        if (!phoneNumber || !content) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const messageId = await this.sendMessage(phoneNumber, content, type || 'text', templateId);

        res.json({ success: true, messageId });
      } catch (error) {
        res.status(500).json({ error: 'Failed to send message' });
      }
    });

    // Start new session manually
    this.app.post('/session/start', async (req: Request, res: Response) => {
      try {
        const { phoneNumber, customerId } = req.body;
        const session = await this.createSession(phoneNumber, customerId);

        res.json({ session });
      } catch (error) {
        res.status(500).json({ error: 'Failed to create session' });
      }
    });

    // Get session by phone
    this.app.get('/session/:phone', (req: Request, res: Response) => {
      const sessionId = this.phoneToSession.get(req.params.phone);
      if (!sessionId) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const session = this.sessions.get(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      res.json(session);
    });

    // Get templates
    this.app.get('/templates', (req: Request, res: Response) => {
      res.json(Array.from(this.templates.values()));
    });

    // Create campaign
    this.app.post('/campaign', async (req: Request, res: Response) => {
      try {
        const { name, templateId, segments, scheduledFor } = req.body;

        const template = this.templates.get(templateId);
        if (!template) {
          return res.status(400).json({ error: 'Template not found' });
        }

        const campaign: WhatsAppCampaign = {
          id: uuidv4(),
          name,
          templateId,
          segments,
          status: scheduledFor ? 'scheduled' : 'draft',
          sent: 0,
          delivered: 0,
          failed: 0,
          scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined
        };

        this.campaigns.set(campaign.id, campaign);

        res.json({ campaign });
      } catch (error) {
        res.status(500).json({ error: 'Failed to create campaign' });
      }
    });

    // Send campaign
    this.app.post('/campaign/:id/send', async (req: Request, res: Response) => {
      try {
        const campaign = this.campaigns.get(req.params.id);
        if (!campaign) {
          return res.status(404).json({ error: 'Campaign not found' });
        }

        campaign.status = 'sending';

        // Simulate sending
        const sent = Math.floor(Math.random() * 100);
        campaign.sent = sent;
        campaign.delivered = Math.floor(sent * 0.95);
        campaign.failed = sent - campaign.delivered;
        campaign.status = 'completed';

        res.json({ campaign });
      } catch (error) {
        res.status(500).json({ error: 'Failed to send campaign' });
      }
    });

    // Get campaigns
    this.app.get('/campaigns', (req: Request, res: Response) => {
      res.json(Array.from(this.campaigns.values()));
    });

    // Get all sessions
    this.app.get('/sessions', (req: Request, res: Response) => {
      res.json(Array.from(this.sessions.values()));
    });

    // Get session statistics
    this.app.get('/stats', (req: Request, res: Response) => {
      const sessions = Array.from(this.sessions.values());
      const resolved = sessions.filter(s => s.state === 'resolved').length;
      const active = sessions.filter(s => s.state !== 'resolved').length;

      res.json({
        totalSessions: sessions.length,
        activeSessions: active,
        resolvedSessions: resolved,
        resolutionRate: sessions.length > 0 ? resolved / sessions.length : 0
      });
    });
  }

  /**
   * Create a new session
   */
  private async createSession(phoneNumber: string, customerId?: string): Promise<WhatsAppSession> {
    // Check for existing session
    const existingSessionId = this.phoneToSession.get(phoneNumber);
    if (existingSessionId) {
      const existing = this.sessions.get(existingSessionId);
      if (existing && existing.state !== 'resolved') {
        return existing;
      }
    }

    // Look up customer
    let customer: any;
    let customerName: string | undefined;
    let industry: IndustryType | undefined;

    if (customerId) {
      customer = await customer360Service.getCustomer(customerId);
    } else {
      customer = await customer360Service.getCustomerByPhone(phoneNumber);
    }

    if (customer) {
      customerName = customer.name;
      industry = customer.industries[0];
    }

    const session: WhatsAppSession = {
      id: uuidv4(),
      phoneNumber,
      customerId: customer?.id,
      customerName,
      industry,
      state: 'initial',
      messages: [],
      context: {},
      createdAt: new Date(),
      lastActivity: new Date()
    };

    this.sessions.set(session.id, session);
    this.phoneToSession.set(phoneNumber, session.id);

    return session;
  }

  /**
   * Handle incoming message
   */
  private async handleIncomingMessage(data: {
    phoneNumber: string;
    content: string;
    messageType: string;
  }): Promise<string> {
    const { phoneNumber, content, messageType } = data;
    const normalizedContent = content.trim().toLowerCase();

    // Get or create session
    let session = this.sessions.get(this.phoneToSession.get(phoneNumber) || '');

    if (!session) {
      session = await this.createSession(phoneNumber);
    }

    // Add incoming message to session
    session.messages.push({
      id: uuidv4(),
      from: phoneNumber,
      to: 'hojai-whatsapp',
      content,
      type: messageType as any,
      timestamp: new Date(),
      incoming: true
    });

    session.lastActivity = new Date();

    // Process message and generate response
    let response = await this.processMessage(session, normalizedContent);

    // Add outgoing message to session
    session.messages.push({
      id: uuidv4(),
      from: 'hojai-whatsapp',
      to: phoneNumber,
      content: response,
      type: 'text',
      timestamp: new Date(),
      incoming: false
    });

    return response;
  }

  /**
   * Process message based on session state
   */
  private async processMessage(session: WhatsAppSession, content: string): Promise<string> {
    // Handle commands
    if (content === 'menu' || content === 'main menu' || content === '0') {
      session.state = 'menu';
      return this.getMainMenu();
    }

    if (content === 'help' || content === '?') {
      return 'Available commands:\n- menu: Main menu\n- products: View products\n- support: Get help\n- appointment: Book appointment\n- quit: End conversation';
    }

    if (content === 'quit' || content === 'bye' || content === 'goodbye') {
      session.state = 'resolved';
      return 'Thank you for chatting with HOJAI AI! Have a great day!';
    }

    // State-based processing
    switch (session.state) {
      case 'initial':
        return await this.handleInitial(session, content);

      case 'menu':
        return await this.handleMenu(session, content);

      case 'product-inquiry':
        return await this.handleProductInquiry(session, content);

      case 'support':
        return await this.handleSupport(session, content);

      case 'appointment':
        return await this.handleAppointment(session, content);

      default:
        return await this.handleInitial(session, content);
    }
  }

  /**
   * Handle initial message
   */
  private async handleInitial(session: WhatsAppSession, content: string): Promise<string> {
    // Check for existing customer
    if (session.customerId) {
      session.state = 'menu';
      return `Welcome back, ${session.customerName || 'valued customer'}! How can I help you today?\n\n1. View Products\n2. Get Support\n3. Book Appointment\n4. Account Info`;
    }

    // New customer - offer welcome
    session.state = 'menu';

    return `Hello! Welcome to HOJAI AI - Your Business Partner.\n\nI can help you with:\n1. Learning about our 15 AI products\n2. Getting support\n3. Booking appointments\n4. Account information\n\nWhat would you like to do?`;
  }

  /**
   * Handle menu selection
   */
  private async handleMenu(session: WhatsAppSession, content: string): Promise<string> {
    switch (content) {
      case '1':
        session.state = 'product-inquiry';
        return this.getProductCatalog();

      case '2':
        session.state = 'support';
        return 'What do you need help with?\n1. Technical support\n2. Billing questions\n3. Account changes\n4. Return to menu';

      case '3':
        session.state = 'appointment';
        return 'Let me help you book an appointment. What service are you interested in? (Restaurant, Retail, Hotel, Salon, etc.)';

      case '4':
        if (session.customerId) {
          return `Your Account:\nName: ${session.customerName}\nIndustries: ${session.industry || 'None yet'}\nType 'menu' to return.`;
        }
        return 'Please provide your email or phone number to look up your account.';

      default:
        return this.getMainMenu();
    }
  }

  /**
   * Get main menu
   */
  private getMainMenu(): string {
    return 'Main Menu:\n1. View Products\n2. Get Support\n3. Book Appointment\n4. Account Info\n\nOr just type your question!';
  }

  /**
   * Handle product inquiry
   */
  private async handleProductInquiry(session: WhatsAppSession, content: string): Promise<string> {
    // Check if selecting a product
    const productMap: Record<string, IndustryType> = {
      '1': 'waitron',
      '2': 'shopflow',
      '3': 'staybot',
      '4': 'glamai',
      '5': 'fleetiq',
      '6': 'ledgerai',
      '7': 'propflow',
      '8': 'teammind',
      '9': 'learniq'
    };

    if (productMap[content]) {
      const industry = productMap[content];
      const info = this.productInfo[industry];

      // Store interest in context
      session.context['interestedProduct'] = industry;

      // Create lead
      await unifiedLeadService.addLead({
        name: session.customerName || 'WhatsApp Lead',
        email: '',
        phone: session.phoneNumber,
        source: 'whatsapp' as IndustryType,
        score: 60,
        status: 'new',
        industry: industry,
        crossIndustries: [],
        notes: `Product inquiry: ${info.name}`,
        conversionProbability: 0.4,
        tags: ['whatsapp', 'product-inquiry', industry]
      });

      return `${info.name}\n\n${info.description}\n\nFeatures:\n${info.features.map((f, i) => `${i + 1}. ${f}`).join('\n')}\n\nWould you like to schedule a demo? (yes/no)`;
    }

    if (content === 'yes' || content === 'y') {
      session.state = 'appointment';
      return 'Great! What type of business do you have? (Restaurant, Retail, Hotel, Salon, etc.)';
    }

    if (content === 'no' || content === 'n') {
      session.state = 'menu';
      return 'No problem! Is there anything else I can help you with?';
    }

    return this.getProductCatalog();
  }

  /**
   * Get product catalog
   */
  private getProductCatalog(): string {
    return `Our Products:\n\n1. Waitron - Restaurants\n2. ShopFlow - Retail\n3. StayBot - Hotels\n4. GlamAI - Salons\n5. FleetIQ - Fleet\n6. LedgerAI - Accounting\n7. PropFlow - Property\n8. TeamMind - Teams\n9. LearnIQ - Learning\n\nReply with a number for details, or type 'menu' to go back.`;
  }

  /**
   * Handle support request
   */
  private async handleSupport(session: WhatsAppSession, content: string): Promise<string> {
    switch (content) {
      case '1':
        return 'For technical support, please email support@hojai.ai or visit our help center at help.hojai.ai. What specific issue are you experiencing?';

      case '2':
        return 'For billing questions, please email billing@hojai.ai. You can also view your invoices in your account dashboard.';

      case '3':
        return 'For account changes, please visit your account settings or email accounts@hojai.ai.';

      case '4':
      case 'menu':
        session.state = 'menu';
        return this.getMainMenu();

      default:
        return 'What do you need help with?\n1. Technical support\n2. Billing questions\n3. Account changes\n4. Return to menu';
    }
  }

  /**
   * Handle appointment booking
   */
  private async handleAppointment(session: WhatsAppSession, content: string): Promise<string> {
    // Store industry preference
    const industries: IndustryType[] = ['waitron', 'shopflow', 'staybot', 'glamai'];
    for (const ind of industries) {
      if (content.toLowerCase().includes(ind) || content.toLowerCase().includes(this.productInfo[ind].name.toLowerCase())) {
        session.context['appointmentIndustry'] = ind;
        session.industry = ind;
      }
    }

    if (!session.context['appointmentDate']) {
      session.context['appointmentDate'] = content;
      return `I have you interested in ${session.context['appointmentIndustry'] || 'our services'}. What date works best for you?`;
    }

    if (!session.context['appointmentTime']) {
      session.context['appointmentTime'] = content;
      return 'What time works best? (Morning, Afternoon, or specific time)';
    }

    // Confirmation
    if (content.toLowerCase() === 'confirm' || content.toLowerCase() === 'yes') {
      // Create appointment lead
      await unifiedLeadService.addLead({
        name: session.customerName || 'WhatsApp Lead',
        email: '',
        phone: session.phoneNumber,
        source: 'whatsapp' as IndustryType,
        score: 70,
        status: 'qualified',
        industry: session.context['appointmentIndustry'] || 'waitron',
        crossIndustries: [],
        notes: `Appointment requested: ${session.context['appointmentDate']} ${session.context['appointmentTime']}`,
        conversionProbability: 0.7,
        tags: ['whatsapp', 'appointment', 'qualified']
      });

      session.state = 'resolved';
      return `Perfect! Your appointment has been requested for ${session.context['appointmentDate']} ${session.context['appointmentTime']}. A representative will confirm shortly. Thank you!`;
    }

    return 'Please confirm your appointment (yes/no) or type "menu" to go back.';
  }

  /**
   * Send outbound message
   */
  private async sendMessage(
    phoneNumber: string,
    content: string,
    type: string = 'text',
    templateId?: string
  ): Promise<string> {
    const messageId = uuidv4();

    // Get or create session
    let session = this.sessions.get(this.phoneToSession.get(phoneNumber) || '');

    if (!session) {
      session = await this.createSession(phoneNumber);
    }

    // Add to session
    session.messages.push({
      id: messageId,
      from: 'hojai-whatsapp',
      to: phoneNumber,
      content,
      type: type as any,
      timestamp: new Date(),
      incoming: false
    });

    session.lastActivity = new Date();

    // In production, this would use WhatsApp Business API
    console.log(`[${this.agentName}] Sending to ${phoneNumber}: ${content.substring(0, 50)}...`);

    return messageId;
  }

  /**
   * Send cross-sell message to customer
   */
  async sendCrossSellMessage(customerId: string, product: IndustryType): Promise<boolean> {
    const customer = await customer360Service.getCustomer(customerId);
    if (!customer || !customer.phone) return false;

    const productInfo = this.productInfo[product];
    if (!productInfo) return false;

    const template = this.templates.get('cross-sell');
    if (!template) return false;

    let content = template.content
      .replace('{{name}}', customer.name)
      .replace('{{product}}', productInfo.name);

    await this.sendMessage(customer.phone, content);
    return true;
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        console.log(`[${this.agentName}] WhatsApp Server running on port ${this.port}`);
        resolve();
      });
    });
  }

  /**
   * Get agent status
   */
  getStatus(): {
    agentId: string;
    name: string;
    ready: boolean;
    activeSessions: number;
    totalSessions: number;
  } {
    return {
      agentId: this.agentId,
      name: this.agentName,
      ready: true,
      activeSessions: this.sessions.size,
      totalSessions: this.sessions.size
    };
  }
}

export const whatsappAI = new WhatsAppAIAgent(4982);

// Start server if run directly
if (require.main === module) {
  whatsappAI.start().then(() => {
    console.log('WhatsApp AI Agent started on port 4982');
  });
}