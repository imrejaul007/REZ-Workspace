import { Injectable, Logger } from '@nestjs/common';

/**
 * Voice Assistant Service - Siri/Alexa-style
 * Features:
 * - Voice commands
 * - Natural language understanding
 * - Multi-language support
 * - Conversation flow
 */

export interface VoiceCommand {
  id: string;
  text: string;
  intent: VOICE_INTENT;
  entities: VoiceEntity[];
  confidence: number;
  language: string;
}

export enum VOICE_INTENT {
  BOOK_RIDE = 'book_ride',
  CANCEL_RIDE = 'cancel_ride',
  GET_ETA = 'get_eta',
  SHARE_RIDE = 'share_ride',
  CHECK_FARE = 'check_fare',
  FIND_DRIVER = 'find_driver',
  SOS = 'sos',
  HELP = 'help',
  BALANCE = 'balance',
  UNKNOWN = 'unknown',
}

export interface VoiceEntity {
  type: 'location' | 'vehicle' | 'time' | 'payment';
  value: string;
  confidence: number;
}

export interface ConversationContext {
  userId: string;
  lastIntent?: VOICE_INTENT;
  pendingConfirmation?: boolean;
  rideParams?: Partial<RideParams>;
}

export interface RideParams {
  pickup: string;
  drop: string;
  vehicleType: string;
  paymentMethod: string;
}

export interface VoiceResponse {
  text: string;
  suggestions?: string[];
  action?: string;
  deepLink?: string;
}

// Language patterns
const PATTERNS = {
  book_ride: [
    /book.*(auto|cab|bike|suv)/i,
    /i want.*(auto|cab|bike|suv)/i,
    /need.*(auto|cab|bike|suv)/i,
    /take.*(auto|cab|bike|suv)/i,
    /get.*(auto|cab|bike|suv)/i,
    /call.*(auto|cab|bike|suv)/i,
    /book/i,
    /ride/i,
  ],
  cancel_ride: [
    /cancel/i,
    /stop.*ride/i,
    /don't.*want/i,
    /never mind/i,
    /abort/i,
  ],
  get_eta: [
    /where.*(driver|auto|cab|bike)/i,
    /how (long|far|far away)/i,
    /eta/i,
    /arriving/i,
    /coming/i,
    /time/i,
  ],
  share_ride: [
    /share.*(ride|location|details)/i,
    /send.*(location|details)/i,
    /tell.*(family|friends|someone)/i,
  ],
  check_fare: [
    /how much/i,
    /price|cost|fare/i,
    /charge/i,
    /estimate/i,
  ],
  sos: [
    /help|emergency|sos|police/i,
    /not safe/i,
    /stranded/i,
    /danger/i,
  ],
  balance: [
    /balance|wallet|money/i,
    /how much.*(wallet|money)/i,
    /remaining/i,
  ],
};

@Injectable()
export class VoiceAssistantService {
  private readonly logger = new Logger(VoiceAssistantService.name);

  // Conversation contexts
  private contexts: Map<string, ConversationContext> = new Map();

  // Supported languages
  private readonly LANGUAGES = ['en', 'hi', 'kn', 'ta', 'te', 'ml'];

  // ===========================================
  // PROCESS VOICE COMMAND
  // ===========================================

  /**
   * Process voice command
   */
  async processCommand(
    userId: string,
    text: string,
    language: string = 'en'
  ): Promise<VoiceResponse> {
    // Get or create context
    let context = this.contexts.get(userId);
    if (!context) {
      context = { userId };
      this.contexts.set(userId, context);
    }

    // Parse intent
    const command = this.parseIntent(text);

    // Handle based on intent
    switch (command.intent) {
      case VOICE_INTENT.BOOK_RIDE:
        return this.handleBookRide(context, command);

      case VOICE_INTENT.CANCEL_RIDE:
        return this.handleCancelRide(context);

      case VOICE_INTENT.GET_ETA:
        return this.handleGetETA(context);

      case VOICE_INTENT.SHARE_RIDE:
        return this.handleShareRide(context);

      case VOICE_INTENT.CHECK_FARE:
        return this.handleCheckFare(context);

      case VOICE_INTENT.SOS:
        return this.handleSOS(context);

      case VOICE_INTENT.BALANCE:
        return this.handleBalance(context);

      case VOICE_INTENT.HELP:
        return this.handleHelp();

      default:
        return this.handleUnknown(text);
    }
  }

  // ===========================================
  // INTENT PARSING
  // ===========================================

  /**
   * Parse voice command into structured intent
   */
  private parseIntent(text: string): VoiceCommand {
    const normalized = text.toLowerCase().trim();

    // Check each intent pattern
    for (const [intent, patterns] of Object.entries(PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(normalized)) {
          return {
            id: `CMD_${Date.now()}`,
            text,
            intent: intent as VOICE_INTENT,
            entities: this.extractEntities(text),
            confidence: 0.9,
            language: 'en',
          };
        }
      }
    }

    return {
      id: `CMD_${Date.now()}`,
      text,
      intent: VOICE_INTENT.UNKNOWN,
      entities: [],
      confidence: 0,
      language: 'en',
    };
  }

  /**
   * Extract entities from text
   */
  private extractEntities(text: string): VoiceEntity[] {
    const entities: VoiceEntity[] = [];
    const normalized = text.toLowerCase();

    // Vehicle type
    const vehicles = ['auto', 'cab', 'bike', 'suv'];
    for (const vehicle of vehicles) {
      if (normalized.includes(vehicle)) {
        entities.push({
          type: 'vehicle',
          value: vehicle,
          confidence: 0.95,
        });
      }
    }

    // Payment method
    if (normalized.includes('cash')) {
      entities.push({
        type: 'payment',
        value: 'cash',
        confidence: 0.9,
      });
    }

    return entities;
  }

  // ===========================================
  // COMMAND HANDLERS
  // ===========================================

  private handleBookRide(
    context: ConversationContext,
    command: VoiceCommand
  ): VoiceResponse {
    // Extract vehicle type
    const vehicleEntity = command.entities.find(e => e.type === 'vehicle');
    const vehicleType = vehicleEntity?.value || 'cab';

    context.pendingConfirmation = true;
    context.lastIntent = VOICE_INTENT.BOOK_RIDE;
    context.rideParams = { vehicleType };

    return {
      text: `Sure! Booking a ${vehicleType} for you. What's your pickup location?`,
      suggestions: ['MG Road', 'Koramangala', 'Indiranagar', 'Whitefield'],
    };
  }

  private handleCancelRide(context: ConversationContext): VoiceResponse {
    context.lastIntent = VOICE_INTENT.CANCEL_RIDE;

    return {
      text: 'Cancelling your ride. You won\'t be charged.',
      action: 'cancel_ride',
    };
  }

  private handleGetETA(context: ConversationContext): VoiceResponse {
    return {
      text: 'Your driver is 5 minutes away. They\'re driving a white Swift Dzire.',
      suggestions: ['Share ride', 'Call driver'],
    };
  }

  private handleShareRide(context: ConversationContext): VoiceResponse {
    return {
      text: 'Sharing your ride details with your emergency contacts.',
      action: 'share_ride',
      deepLink: 'rezapp://ride/share',
    };
  }

  private handleCheckFare(context: ConversationContext): VoiceResponse {
    return {
      text: 'Estimated fare is ₹150. Want me to book?',
      suggestions: ['Yes, book it', 'Change pickup location'],
      action: 'confirm_booking',
    };
  }

  private handleSOS(context: ConversationContext): VoiceResponse {
    return {
      text: 'Calling emergency services and notifying your emergency contacts.',
      action: 'sos',
      deepLink: 'rezapp://sos',
    };
  }

  private handleBalance(context: ConversationContext): VoiceResponse {
    return {
      text: 'You have ₹500 in your ReZ Wallet.',
    };
  }

  private handleHelp(): VoiceResponse {
    return {
      text: 'I can help you book rides, check fares, share your ride, and more. Just say what you need!',
      suggestions: [
        'Book a cab',
        'Check my wallet balance',
        'Share my ride',
      ],
    };
  }

  private handleUnknown(text: string): VoiceResponse {
    return {
      text: `I didn't understand "${text}". Try saying "Book a cab" or "Check my fare"`,
      suggestions: [
        'Book a cab',
        'Book an auto',
        'Check fare',
      ],
    };
  }

  // ===========================================
  // CONFIRMATION HANDLER
  // ===========================================

  /**
   * Handle confirmation
   */
  async handleConfirmation(
    userId: string,
    response: string
  ): Promise<VoiceResponse> {
    const context = this.contexts.get(userId);
    if (!context) {
      return { text: 'Session expired. Please start again.' };
    }

    const normalized = response.toLowerCase();

    if (normalized.includes('yes') || normalized.includes('yeah') || normalized.includes('sure')) {
      return {
        text: 'Perfect! Looking for drivers near you...',
        action: 'confirm_booking',
      };
    }

    if (normalized.includes('no')) {
      context.pendingConfirmation = false;
      return { text: 'No problem. What else can I help you with?' };
    }

    // Treat as new command
    return this.processCommand(userId, response);
  }

  // ===========================================
  // MULTI-LANGUAGE
  // ===========================================

  /**
   * Detect language
   */
  detectLanguage(text: string): string {
    // Simple heuristic - check for Hindi script
    if (/[ऀ-ॿ]/.test(text)) {
      return 'hi';
    }
    if (/[ఀ-౿]/.test(text)) {
      return 'kn';
    }
    return 'en';
  }

  /**
   * Translate response
   */
  async translateResponse(
    text: string,
    targetLang: string
  ): Promise<string> {
    // In production, use translation API
    return text;
  }
}
