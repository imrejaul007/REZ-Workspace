/**
 * Concierge Service
 */

import { v4 as uuidv4 } from 'uuid';
import { ConciergeRequestModel } from '../models/ConciergeRequest';
import {
  Conversation,
  ConciergeRequest,
  CreateConversationInput,
  SendMessageInput,
  CreateRequestInput,
  AIResponse,
  ChatContext,
  RequestType,
} from '../types';

export class ConciergeService {
  /**
   * Create or get conversation
   */
  async getOrCreateConversation(input: CreateConversationInput): Promise<Conversation> {
    let conversation = await this.getActiveConversation(input.guestId);

    if (!conversation) {
      conversation = {
        id: uuidv4(),
        guestId: input.guestId,
        bookingId: input.bookingId,
        merchantId: input.merchantId,
        messages: [],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store in memory for now (in production, use MongoDB)
      this.conversations.set(conversation.id, conversation);

      if (input.initialMessage) {
        conversation.messages.push({
          role: 'guest',
          content: input.initialMessage,
          timestamp: new Date(),
        });
      }
    }

    return conversation;
  }

  /**
   * Get active conversation for guest
   */
  async getActiveConversation(guestId: string): Promise<Conversation | null> {
    for (const conv of this.conversations.values()) {
      if (conv.guestId === guestId && conv.status === 'active') {
        return conv;
      }
    }
    return null;
  }

  /**
   * Send message and get AI response
   */
  async sendMessage(input: SendMessageInput): Promise<{ conversation: Conversation; response: AIResponse }> {
    let conversation = input.conversationId
      ? this.conversations.get(input.conversationId)
      : await this.getActiveConversation(input.guestId);

    if (!conversation) {
      conversation = await this.getOrCreateConversation({
        guestId: input.guestId,
        bookingId: input.bookingId,
        merchantId: input.merchantId,
      });
    }

    // Add guest message
    conversation.messages.push({
      role: 'guest',
      content: input.message,
      timestamp: new Date(),
    });

    // Generate AI response
    const context: ChatContext = {
      guestId: input.guestId,
      bookingId: input.bookingId,
      ...input.context,
    };
    const response = this.generateAIResponse(input.message, context);

    // Add assistant message
    conversation.messages.push({
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      metadata: {
        suggestions: response.suggestions,
        sentiment: response.sentiment,
      },
    });

    conversation.updatedAt = new Date();
    this.conversations.set(conversation.id, conversation);

    return { conversation, response };
  }

  /**
   * Get conversation by ID
   */
  async getConversation(conversationId: string): Promise<Conversation | null> {
    return this.conversations.get(conversationId) || null;
  }

  /**
   * Get conversation by guest ID
   */
  async getConversationByGuest(guestId: string): Promise<Conversation | null> {
    return this.getActiveConversation(guestId);
  }

  /**
   * Generate AI response
   */
  private generateAIResponse(message: string, context: ChatContext): AIResponse {
    const lower = message.toLowerCase();

    // Check-in related
    if (lower.includes('check in') || lower.includes('checkin')) {
      return {
        content: 'Early check-in may be available depending on room availability. Standard check-in is at 2 PM. Would you like me to request early check-in for you?',
        suggestions: ['Request early check-in', 'What is the check-out time?', 'Upgrade my room'],
        sentiment: 'neutral',
        confidence: 0.95,
      };
    }

    // Check-out related
    if (lower.includes('check out') || lower.includes('checkout')) {
      return {
        content: 'Standard check-out is at 11 AM. Late check-out until 2 PM can be arranged for an additional 500 INR. Would you like me to request late check-out?',
        suggestions: ['Request late check-out', 'Store my luggage', 'Call a taxi'],
        sentiment: 'neutral',
        confidence: 0.95,
      };
    }

    // WiFi related
    if (lower.includes('wifi') || lower.includes('wi-fi') || lower.includes('internet')) {
      return {
        content: 'Our complimentary WiFi is available throughout the hotel. Network: HotelGuest_Free, Password: welcome123 or connect via your room number.',
        suggestions: ['Connect to WiFi', 'Business center hours', 'Print documents'],
        sentiment: 'positive',
        confidence: 0.98,
      };
    }

    // Restaurant/Food related
    if (lower.includes('restaurant') || lower.includes('food') || lower.includes('dining') || lower.includes('breakfast') || lower.includes('lunch') || lower.includes('dinner')) {
      return {
        content: 'Our multi-cuisine restaurant is open 24 hours. Breakfast: 6-10 AM, Lunch: 12-3 PM, Dinner: 7-10:30 PM. We also offer in-room dining 24/7. Would you like me to make a reservation?',
        suggestions: ['View menu', 'Order room service', 'Make a reservation', 'Book a table for tonight'],
        sentiment: 'positive',
        confidence: 0.95,
      };
    }

    // Room service
    if (lower.includes('room service') || lower.includes('minibar')) {
      return {
        content: 'Room service is available 24/7. Our menu includes local and international cuisine. Minimum order is 300 INR. How can I assist you with your order?',
        suggestions: ['Order room service', 'View menu', 'Minibar items'],
        sentiment: 'positive',
        confidence: 0.95,
      };
    }

    // Pool/Gym
    if (lower.includes('pool') || lower.includes('swim')) {
      return {
        content: 'Our rooftop pool is open from 6 AM to 9 PM. Towels are available poolside. The gym is open 24 hours with key card access.',
        suggestions: ['Gym hours', 'Spa appointments', 'Personal trainer'],
        sentiment: 'positive',
        confidence: 0.98,
      };
    }

    if (lower.includes('gym') || lower.includes('fitness')) {
      return {
        content: 'Our fully-equipped gym is open 24 hours. It features cardio machines, free weights, and resistance equipment. Personal trainers available on request.',
        suggestions: ['Book a trainer', 'Pool hours', 'Yoga classes'],
        sentiment: 'positive',
        confidence: 0.98,
      };
    }

    // Spa
    if (lower.includes('spa') || lower.includes('massage') || lower.includes('wellness')) {
      return {
        content: 'Our spa offers various treatments including Swedish massage, deep tissue, and Ayurvedic therapies. Open 10 AM - 8 PM. Would you like me to book an appointment?',
        suggestions: ['View spa menu', 'Book massage', 'Couple spa package'],
        sentiment: 'positive',
        confidence: 0.95,
      };
    }

    // Taxi/Transport
    if (lower.includes('taxi') || lower.includes('cab') || lower.includes('transport') || lower.includes('airport')) {
      return {
        content: 'I can arrange airport transfers or local transportation for you. Our airport shuttle runs every 2 hours. Would you like me to book a taxi?',
        suggestions: ['Book airport taxi', 'Schedule pickup', 'Local sightseeing tours'],
        sentiment: 'neutral',
        confidence: 0.95,
      };
    }

    // Sightseeing
    if (lower.includes('sightseeing') || lower.includes('tour') || lower.includes('attractions') || lower.includes('places to visit')) {
      return {
        content: 'We can arrange city tours and visits to popular attractions. Common requests include temple visits, local markets, and heritage sites. Would you like recommendations?',
        suggestions: ['Book city tour', 'Temple visits', 'Shopping recommendations'],
        sentiment: 'positive',
        confidence: 0.90,
      };
    }

    // Laundry
    if (lower.includes('laundry') || lower.includes('dry cleaning') || lower.includes('iron')) {
      return {
        content: 'Same-day laundry and dry cleaning service available. Drop-off at the concierge desk before 9 AM for same-day return. Express service available for additional charge.',
        suggestions: ['Schedule pickup', 'Express laundry', 'Ironing service'],
        sentiment: 'neutral',
        confidence: 0.95,
      };
    }

    // Doctor/Medical
    if (lower.includes('doctor') || lower.includes('medical') || lower.includes('pharmacy') || lower.includes('medicine')) {
      return {
        content: 'A doctor is available on-call 24/7. We also have partnerships with nearby pharmacies for quick delivery. How can I assist you?',
        suggestions: ['Call doctor', 'Order medicines', 'Nearest pharmacy'],
        sentiment: 'neutral',
        confidence: 0.90,
      };
    }

    // Complaint
    if (lower.includes('complaint') || lower.includes('problem') || lower.includes('issue') || lower.includes('broken')) {
      return {
        content: 'I\'m sorry to hear you\'re experiencing an issue. Let me note this down and ensure it gets addressed immediately. Could you please provide more details?',
        suggestions: ['Report issue', 'Talk to manager', 'Request room change'],
        sentiment: 'negative',
        confidence: 0.85,
      };
    }

    // Thank you / Positive feedback
    if (lower.includes('thank') || lower.includes('great') || lower.includes('excellent') || lower.includes('love')) {
      return {
        content: 'You\'re welcome! It\'s our pleasure to assist you. Please don\'t hesitate to reach out if you need anything else during your stay.',
        suggestions: ['Help with anything else?', 'Book spa appointment', 'Order dinner'],
        sentiment: 'positive',
        confidence: 0.98,
      };
    }

    // Help
    if (lower.includes('help') || lower.includes('assist')) {
      return {
        content: 'I can help you with hotel services, dining reservations, transportation, spa appointments, local information, and more. What would you like assistance with?',
        suggestions: ['Room service', 'Restaurant booking', 'Taxi booking', 'Spa appointment'],
        sentiment: 'positive',
        confidence: 0.95,
      };
    }

    // Default response
    return {
      content: 'Thank you for your message. I\'m your virtual concierge and I\'m here to help with any requests during your stay. Whether it\'s room service, reservations, local information, or anything else, just let me know!',
      suggestions: ['Restaurant hours', 'Book a taxi', 'Room service menu', 'Spa appointments'],
      sentiment: 'neutral',
      confidence: 0.80,
    };
  }

  /**
   * Create concierge request
   */
  async createRequest(input: CreateRequestInput): Promise<ConciergeRequest> {
    const request = new ConciergeRequestModel({
      id: uuidv4(),
      ...input,
      dueBy: input.dueBy ? new Date(input.dueBy) : undefined,
      status: 'pending',
    });

    await request.save();
    return request.toObject() as ConciergeRequest;
  }

  /**
   * Get requests with filters
   */
  async getRequests(
    filters: {
      merchantId?: string;
      guestId?: string;
      status?: string;
      requestType?: string;
    },
    pagination: { page: number; limit: number } = { page: 1, limit: 50 }
  ): Promise<{
    requests: ConciergeRequest[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const query: any = {};
    if (filters.merchantId) query.merchantId = filters.merchantId;
    if (filters.guestId) query.guestId = filters.guestId;
    if (filters.status) query.status = filters.status;
    if (filters.requestType) query.requestType = filters.requestType;

    const skip = (pagination.page - 1) * pagination.limit;

    const [requests, total] = await Promise.all([
      ConciergeRequestModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pagination.limit)
        .lean(),
      ConciergeRequestModel.countDocuments(query),
    ]);

    return {
      requests: requests as ConciergeRequest[],
      total,
      page: pagination.page,
      limit: pagination.limit,
      pages: Math.ceil(total / pagination.limit),
    };
  }

  /**
   * Get request by ID
   */
  async getRequestById(requestId: string): Promise<ConciergeRequest | null> {
    const request = await ConciergeRequestModel.findOne({ id: requestId }).lean();
    return request as ConciergeRequest | null;
  }

  /**
   * Update request
   */
  async updateRequest(
    requestId: string,
    updates: {
      status?: string;
      assignedTo?: string;
      notes?: string;
      priority?: string;
    }
  ): Promise<ConciergeRequest | null> {
    const updateData: any = { ...updates };
    if (updates.status === 'completed') {
      updateData.completedAt = new Date();
    }

    const request = await ConciergeRequestModel.findOneAndUpdate(
      { id: requestId },
      { $set: updateData },
      { new: true }
    ).lean();

    return request as ConciergeRequest | null;
  }

  /**
   * Assign request
   */
  async assignRequest(requestId: string, assignedTo: string): Promise<ConciergeRequest | null> {
    const request = await ConciergeRequestModel.findOneAndUpdate(
      { id: requestId },
      {
        $set: {
          assignedTo,
          status: 'assigned',
        },
      },
      { new: true }
    ).lean();

    return request as ConciergeRequest | null;
  }

  /**
   * Complete request
   */
  async completeRequest(requestId: string, notes?: string): Promise<ConciergeRequest | null> {
    const updateData: any = {
      status: 'completed',
      completedAt: new Date(),
    };
    if (notes) {
      updateData.notes = notes;
    }

    const request = await ConciergeRequestModel.findOneAndUpdate(
      { id: requestId },
      { $set: updateData },
      { new: true }
    ).lean();

    return request as ConciergeRequest | null;
  }

  /**
   * Get requests by booking
   */
  async getRequestsByBooking(bookingId: string): Promise<ConciergeRequest[]> {
    const requests = await ConciergeRequestModel.find({ bookingId })
      .sort({ createdAt: -1 })
      .lean();
    return requests as ConciergeRequest[];
  }

  /**
   * Get request statistics
   */
  async getRequestStats(merchantId: string): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    byType: Record<string, number>;
  }> {
    const requests = await ConciergeRequestModel.find({ merchantId }).lean();

    const stats = {
      total: requests.length,
      pending: 0,
      inProgress: 0,
      completed: 0,
      byType: {} as Record<string, number>,
    };

    requests.forEach((r: any) => {
      if (r.status === 'pending') stats.pending++;
      if (r.status === 'in_progress' || r.status === 'assigned') stats.inProgress++;
      if (r.status === 'completed') stats.completed++;

      if (!stats.byType[r.requestType]) stats.byType[r.requestType] = 0;
      stats.byType[r.requestType]++;
    });

    return stats;
  }

  // In-memory conversation store
  private conversations: Map<string, Conversation> = new Map();
}

export const conciergeService = new ConciergeService();
