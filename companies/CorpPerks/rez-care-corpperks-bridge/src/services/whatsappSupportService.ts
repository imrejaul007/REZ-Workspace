import axios from 'axios';
import { WhatsAppSession, WhatsAppMessage, IWhatsAppSession, IWhatsAppMessage } from '../models/index.js';
import { generateSessionId, generateMessageId } from '../types/index.js';
import { NotFoundError } from '../middleware/errorHandler.js';

const REZ_WHATSAPP_SERVICE_URL = process.env.REZ_WHATSAPP_SERVICE_URL || 'http://localhost:4202';
const REZ_SUPPORT_COPILOT_URL = process.env.REZ_SUPPORT_COPILOT_URL || 'http://localhost:4033';

export class WhatsAppSupportService {
  /**
   * Start WhatsApp support session
   */
  async startSession(
    employeeId: string,
    employeeName: string,
    companyId: string,
    phoneNumber: string
  ): Promise<IWhatsAppSession> {
    // Check for existing active session
    const existing = await WhatsAppSession.findOne({
      employeeId,
      companyId,
      status: { $in: ['active', 'idle'] },
    });

    if (existing) {
      return existing;
    }

    const session = new WhatsAppSession({
      sessionId: generateSessionId(),
      employeeId,
      employeeName,
      companyId,
      phoneNumber,
      status: 'active',
      messageCount: 0,
    });

    await session.save();

    // Send welcome message
    await this.sendWelcomeMessage(session);

    return session;
  }

  /**
   * Send message in WhatsApp session
   */
  async sendMessage(
    sessionId: string,
    content: string,
    direction: 'inbound' | 'outbound'
  ): Promise<IWhatsAppMessage> {
    const session = await WhatsAppSession.findOne({ sessionId });
    if (!session) throw new NotFoundError('WhatsApp Session', sessionId);

    const message = new WhatsAppMessage({
      messageId: generateMessageId(),
      sessionId,
      direction,
      content,
      status: 'sent',
    });

    await message.save();

    // Update session
    session.lastMessageAt = new Date();
    session.messageCount += 1;
    await session.save();

    // If inbound, get AI response
    if (direction === 'inbound') {
      await this.processInboundMessage(session, content);
    }

    return message;
  }

  /**
   * Get session messages
   */
  async getSessionMessages(
    sessionId: string,
    options: { limit?: number; before?: Date } = {}
  ): Promise<IWhatsAppMessage[]> {
    const { limit = 50, before } = options;

    const filter: Record<string, unknown> = { sessionId };
    if (before) {
      filter.createdAt = { $lt: before };
    }

    return WhatsAppMessage.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean() as Promise<IWhatsAppMessage[]>;
  }

  /**
   * Get employee session
   */
  async getEmployeeSession(employeeId: string, companyId: string): Promise<IWhatsAppSession | null> {
    return WhatsAppSession.findOne({
      employeeId,
      companyId,
      status: { $in: ['active', 'idle'] },
    }).lean() as Promise<IWhatsAppSession | null>;
  }

  /**
   * Close session
   */
  async closeSession(sessionId: string): Promise<IWhatsAppSession> {
    const session = await WhatsAppSession.findOne({ sessionId });
    if (!session) throw new NotFoundError('WhatsApp Session', sessionId);

    session.status = 'closed';
    session.closedAt = new Date();
    await session.save();

    return session;
  }

  /**
   * Get session analytics
   */
  async getSessionAnalytics(
    companyId: string,
    options: { startDate?: Date; endDate?: Date } = {}
  ): Promise<{
    totalSessions: number;
    activeSessions: number;
    avgMessageCount: number;
    avgSessionDuration: number;
  }> {
    const filter: Record<string, unknown> = { companyId };
    if (options.startDate || options.endDate) {
      filter.createdAt = {};
      if (options.startDate) (filter.createdAt as Record<string, Date>).$gte = options.startDate;
      if (options.endDate) (filter.createdAt as Record<string, Date>).$lte = options.endDate;
    }

    const sessions = await WhatsAppSession.find(filter).lean();

    return {
      totalSessions: sessions.length,
      activeSessions: sessions.filter((s) => s.status === 'active').length,
      avgMessageCount:
        sessions.length > 0
          ? Math.round(sessions.reduce((sum, s) => sum + s.messageCount, 0) / sessions.length)
          : 0,
      avgSessionDuration: 0, // Would need closed sessions
    };
  }

  /**
   * Send welcome message
   */
  private async sendWelcomeMessage(session: InstanceType<typeof WhatsAppSession>): Promise<void> {
    const welcomeContent = `Hi ${session.employeeName}! Welcome to CorpPerks WhatsApp Support. How can I help you today?\n\nYou can ask about:\n- Benefits enrollment\n- Claims status\n- Policy questions\n- Technical support`;

    await this.sendMessage(session.sessionId, welcomeContent, 'outbound');
  }

  /**
   * Process inbound message with AI
   */
  private async processInboundMessage(
    session: InstanceType<typeof WhatsAppSession>,
    content: string
  ): Promise<void> {
    try {
      // Get AI response from Support Copilot
      const response = await axios.post(
        `${REZ_SUPPORT_COPILOT_URL}/api/copilot/chat`,
        {
          message: content,
          context: {
            employeeId: session.employeeId,
            employeeName: session.employeeName,
            companyId: session.companyId,
            source: 'whatsapp',
            domain: 'hr_benefits',
          },
        },
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN,
          },
        }
      );

      if (response.data.success && response.data.response) {
        await this.sendMessage(session.sessionId, response.data.response, 'outbound');
      }
    } catch (error) {
      logger.error('Support Copilot error:', error);
      // Send fallback message
      await this.sendMessage(
        session.sessionId,
        "Thanks for your message! An agent will get back to you shortly. In the meantime, you can also submit a ticket through the app.",
        'outbound'
      );
    }
  }

  /**
   * Get WhatsApp template messages
   */
  async getTemplateMessages(): Promise<Record<string, string>> {
    return {
      welcome: "Hi {{name}}! Welcome to CorpPerks WhatsApp Support.",
      benefits: "Here are the benefits available to you:\n{{benefits}}",
      claim_status: "Your claim #{{claimId}} is currently: {{status}}",
      ticket_created: "Your support ticket #{{ticketId}} has been created. We'll get back to you soon!",
      goodbye: "Thank you for contacting CorpPerks Support. Have a great day!",
      escalation: "I'll connect you with a specialist. Please hold.",
    };
  }
}

export const whatsappSupportService = new WhatsAppSupportService();
