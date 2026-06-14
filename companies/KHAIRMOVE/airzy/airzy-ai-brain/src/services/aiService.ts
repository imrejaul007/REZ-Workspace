import mongoose, { Schema, Document, model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { ChatSession, ChatMessage, ChatRequest, ChatResponse, Recommendation } from '../types';
import { logger } from '../utils/logger';

interface IChatSession extends Omit<ChatSession, 'id'>, Document {}

const ChatMessageSchema = new Schema({
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  metadata: mongoose.Schema.Types.Mixed
}, { _id: true });

const ChatSessionSchema = new Schema({
  userId: { type: String, required: true, index: true },
  messages: [ChatMessageSchema],
  context: {
    preferences: mongoose.Schema.Types.Mixed,
    recentSearches: [String],
    upcomingTrips: [String]
  }
}, { timestamps: true });

export const ChatSessionModel = model<IChatSession>('ChatSession', ChatSessionSchema);

const travelIntentPatterns = [
  { pattern: /book.*flight|fly.*to|flight.*to/i, intent: 'flight_search' },
  { pattern: /hotel|stay|accommodation|room/i, intent: 'hotel_search' },
  { pattern: /lounge|rest.*area|wait/i, intent: 'lounge_search' },
  { pattern: /cab|taxi|transfer|airport.*pickup/i, intent: 'transfer_search' },
  { pattern: /itinerary|trip.*plan|schedule/i, intent: 'itinerary_view' },
  { pattern: /cancel|refund|change.*booking/i, intent: 'booking_management' }
];

const intentResponses: Record<string, string[]> = {
  flight_search: [
    'I can help you find flights! Where would you like to fly?',
    'Let me help you search for flights. What is your departure and destination?',
    'I\'ll search for available flights. Please provide your route and travel date.'
  ],
  hotel_search: [
    'Looking for hotel accommodations? I can help with that!',
    'I can find the best hotel deals for your trip. What are your dates?',
    'Let me search for hotels in your destination.'
  ],
  lounge_search: [
    'Want to relax in an airport lounge before your flight?',
    'I can help you find lounges at the airport. Which airport are you at?',
    'Premium lounge access is available. Would you like me to search for options?'
  ],
  transfer_search: [
    'Need airport transportation? I can arrange a cab for you.',
    'Let me find the best transfer options from the airport.',
    'I can help book airport transfers. What is your pickup location?'
  ],
  itinerary_view: [
    'Let me pull up your trip itinerary.',
    'I can show you your upcoming travel plans.',
    'Here are the details of your trip.'
  ],
  booking_management: [
    'I can help you manage your bookings. What would you like to do?',
    'Let me assist with your booking modification or cancellation.',
    'I can help you change or cancel your reservation.'
  ],
  greeting: [
    'Hello! I\'m your Airzy travel assistant. How can I help you today?',
    'Hi! Looking to book a flight, find a lounge, or plan a trip?',
    'Welcome to Airzy! How may I assist with your travel plans?'
  ],
  default: [
    'I\'m here to help with your travel needs. You can ask me about flights, hotels, lounges, and more.',
    'I can assist with booking flights, finding hotels, lounge access, and trip planning.',
    'Let me know what you need help with - I can search flights, book hotels, and more!'
  ]
};

export class AIService {
  async processMessage(request: ChatRequest, userId: string): Promise<ChatResponse> {
    logger.info('Processing AI message', { userId, message: request.message });

    let session = request.sessionId ? await ChatSessionModel.findById(request.sessionId) : null;

    if (!session) {
      session = new ChatSessionModel({ userId, messages: [], context: {} });
      await session.save();
    }

    const userMessage: ChatMessage = { id: uuidv4(), role: 'user', content: request.message, timestamp: new Date() };
    session.messages.push(userMessage as any);

    const intent = this.detectIntent(request.message);
    const responseText = this.generateResponse(intent, request.message);

    const assistantMessage: ChatMessage = { id: uuidv4(), role: 'assistant', content: responseText, timestamp: new Date() };
    session.messages.push(assistantMessage as any);

    if (request.context) {
      session.context = { ...session.context, ...request.context };
    }

    await session.save();

    const suggestions = this.getSuggestions(intent);

    return {
      message: responseText,
      sessionId: session._id.toString(),
      suggestions,
      confidence: 0.85
    };
  }

  private detectIntent(message: string): string {
    for (const { pattern, intent } of travelIntentPatterns) {
      if (pattern.test(message)) return intent;
    }
    if (/^(hi|hello|hey|help)/i.test(message)) return 'greeting';
    return 'default';
  }

  private generateResponse(intent: string, message: string): string {
    const responses = intentResponses[intent] || intentResponses.default;
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private getSuggestions(intent: string): string[] {
    const suggestionMap: Record<string, string[]> = {
      flight_search: ['Search Delhi to Mumbai flights', 'Search Bengaluru to Chennai flights', 'Book a business class flight'],
      hotel_search: ['Find hotels in Mumbai', 'Search luxury hotels in Delhi', 'Book a hotel near airport'],
      lounge_search: ['Find lounges in Delhi T3', 'Search airport lounges in Mumbai', 'Book lounge access'],
      transfer_search: ['Book airport cab', 'Schedule airport pickup', 'Find cab to airport'],
      default: ['Search flights', 'Find hotels', 'Book lounge', 'Plan a trip']
    };
    return suggestionMap[intent] || suggestionMap.default;
  }

  async getRecommendations(userId: string, type?: string): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [
      { id: uuidv4(), type: 'flight', title: 'Direct flights to Mumbai', description: 'Save time with non-stop flights from Delhi', score: 0.92, reason: 'Popular route with good prices' },
      { id: uuidv4(), type: 'lounge', title: 'Maharaja Lounge - Delhi T3', description: 'Premium lounge with spa and fine dining', score: 0.88, reason: 'Highly rated by travelers' },
      { id: uuidv4(), type: 'hotel', title: 'The Leela Palace, Mumbai', description: 'Luxury 5-star hotel near airport', score: 0.85, reason: 'Top-rated luxury property' }
    ];
    return type ? recommendations.filter(r => r.type === type) : recommendations;
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    const session = await ChatSessionModel.findById(sessionId);
    return session ? { id: session._id.toString(), userId: session.userId, messages: session.messages.map(m => ({ id: m._id?.toString() || uuidv4(), role: m.role, content: m.content, timestamp: m.timestamp })) as ChatMessage[], context: session.context as any, createdAt: session.createdAt, updatedAt: session.updatedAt } : null;
  }
}

export const aiService = new AIService();
export default aiService;