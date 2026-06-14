/**
 * WhatsApp Commerce Service
 * Inquiry handling, Auto-reply bot, Message management
 */

import { Conversation, Inquiry, AutoReply, InquiryStatus } from '../models/WhatsApp';
import { logger } from '../config/logger';
import axios from 'axios';

export class WhatsAppService {
  private whatsappApiUrl = process.env.WHATSAPP_API_URL || 'http://localhost:4202';

  /**
   * Handle incoming WhatsApp message
   */
  async handleIncomingMessage(phone: string, message: string, name?: string): Promise<any> {
    logger.info('WhatsApp message received', { phone, message: message.substring(0, 50) });

    // Find or create conversation
    let conversation = await Conversation.findOne({ phone, deletedAt: null });
    if (!conversation) {
      conversation = new Conversation({ phone, name, messageCount: 0, status: 'active' });
    }

    conversation.lastMessage = message;
    conversation.lastMessageAt = new Date();
    conversation.messageCount += 1;
    await conversation.save();

    // Create inquiry record
    const inquiry = new Inquiry({
      phone,
      name,
      message,
      source: 'whatsapp',
      status: InquiryStatus.NEW
    });
    await inquiry.save();

    // Auto-reply based on message content
    const autoReply = await this.getAutoReply(message);
    if (autoReply) {
      await this.sendMessage(phone, autoReply.response);
      inquiry.responses = [autoReply.response];
      inquiry.status = InquiryStatus.REPLIED;
      await inquiry.save();
    }

    return { conversation, inquiry, autoReply };
  }

  /**
   * Get matching auto-reply
   */
  async getAutoReply(message: string): Promise<any> {
    const lowerMessage = message.toLowerCase();

    // Check for keyword matches
    const autoReplies = await AutoReply.find({ active: true }).sort({ priority: -1 });

    for (const reply of autoReplies) {
      const keywords = reply.keyword.toLowerCase().split(',').map(k => k.trim());

      for (const keyword of keywords) {
        if (lowerMessage.includes(keyword)) {
          return reply;
        }
      }
    }

    // Default greeting if no match
    if (autoReplies.length === 0) {
      return {
        response: 'Hi! Thanks for reaching out to RisnaEstate. How can I help you today?',
        type: 'greeting'
      };
    }

    return null;
  }

  /**
   * Send WhatsApp message
   */
  async sendMessage(phone: string, message: string): Promise<void> {
    try {
      await axios.post(`${this.whatsappApiUrl}/api/send`, {
        to: phone,
        template: 'text',
        message
      }, {
        headers: { 'X-Internal-Token': process.env.INTERNAL_SERVICE_TOKEN }
      });
      logger.info('WhatsApp message sent', { phone });
    } catch (err) {
      logger.error('WhatsApp send failed', { phone, error: err });
    }
  }

  /**
   * Send property brochure
   */
  async sendBrochure(phone: string, propertyId: string): Promise<void> {
    const message = `🏠 Here's the property brochure you requested!\n\nView more: https://risnaestate.com/property/${propertyId}\n\nContact us for a site visit!`;
    await this.sendMessage(phone, message);
  }

  /**
   * Send site visit confirmation
   */
  async sendVisitConfirmation(phone: string, propertyName: string, date: string, time: string): Promise<void> {
    const message = `✅ Site visit confirmed!\n\nProperty: ${propertyName}\nDate: ${date}\nTime: ${time}\n\nOur representative will call you before the visit.`;
    await this.sendMessage(phone, message);
  }

  /**
   * Send ROI calculator results
   */
  async sendROICalculation(phone: string, propertyName: string, roi: number, rentalYield: number): Promise<void> {
    const message = `📊 Investment Analysis for ${propertyName}\n\nEstimated ROI: ${roi}%\nRental Yield: ${rentalYield}%\n\nThis looks like a great investment opportunity! Want to schedule a visit?`;
    await this.sendMessage(phone, message);
  }

  /**
   * Get conversation history
   */
  async getConversation(phone: string): Promise<any> {
    return Conversation.findOne({ phone, deletedAt: null });
  }

  /**
   * Get inquiries for broker
   */
  async getBrokerInquiries(brokerId: string): Promise<any[]> {
    return Inquiry.find({ brokerId, deletedAt: null }).sort({ createdAt: -1 });
  }

  /**
   * Get unassigned inquiries
   */
  async getUnassignedInquiries(): Promise<any[]> {
    return Inquiry.find({ brokerId: null, status: InquiryStatus.NEW, deletedAt: null }).sort({ createdAt: 1 });
  }

  /**
   * Assign inquiry to broker
   */
  async assignInquiry(inquiryId: string, brokerId: string): Promise<void> {
    await Inquiry.findByIdAndUpdate(inquiryId, { brokerId });
    await Conversation.findOneAndUpdate({ phone: (await Inquiry.findById(inquiryId))?.phone }, { assignedBrokerId: brokerId });
  }

  /**
   * Convert inquiry to lead
   */
  async convertInquiry(inquiryId: string): Promise<void> {
    await Inquiry.findByIdAndUpdate(inquiryId, {
      status: InquiryStatus.CONVERTED,
      convertedAt: new Date()
    });
  }

  /**
   * Set up auto-replies
   */
  async setupAutoReplies(): Promise<void> {
    const replies = [
      { keyword: 'hi,hello,hey,namaste', response: 'Namaste! Welcome to RisnaEstate! 🏠 How can I help you today?', type: 'greeting', priority: 10 },
      { keyword: 'property,apartment,villa,flat', response: 'We have amazing properties in Dubai & India! Would you like to see our featured listings?', type: 'property', priority: 8 },
      { keyword: 'visit,schedule,tour', response: "I'd love to schedule a site visit for you! Please share your preferred date and time.", type: 'visit', priority: 7 },
      { keyword: 'brochure,details,info', response: 'I can send you the property brochure. Which property are you interested in?', type: 'brochure', priority: 6 },
      { keyword: 'price,cost,rate,amount', response: 'Property prices vary based on location and type. What\'s your budget range?', type: 'price', priority: 5 },
      { keyword: 'dubai,uae,golden visa', response: 'Dubai properties are a great investment! We offer Golden Visa assistance too. 🇦🇪', type: 'custom', priority: 9 },
      { keyword: 'investment,roi,return', response: 'Dubai properties offer 6-8% rental yields. Want me to run an ROI calculation?', type: 'custom', priority: 8 }
    ];

    for (const reply of replies) {
      await AutoReply.findOneAndUpdate(
        { keyword: reply.keyword },
        reply,
        { upsert: true, new: true }
      );
    }

    logger.info('Auto-replies configured', { count: replies.length });
  }
}

export const whatsappService = new WhatsAppService();
