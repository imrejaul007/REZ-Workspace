/**
 * Phone Receptionist - Voice Agent for Hotel
 * Part of STAYBOT - Hotel AI Operating System
 */

export interface CallRequest {
  from: string;
  callId: string;
  digits?: string;
  transcription?: string;
}

export interface CallResponse {
  message: string;
  action: 'menu' | 'reservation' | 'room-service' | 'transfer' | 'voicemail' | 'checkout';
  data?: Record<string, unknown>;
}

export interface IVRFlow {
  id: string;
  name: string;
  prompt: string;
  options: { digit: string; action: string; label: string }[];
}

export class PhoneReceptionist {
  private readonly ivrFlows: Map<string, IVRFlow> = new Map();

  constructor() {
    this.initializeIVRFlows();
  }

  private initializeIVRFlows(): void {
    // Main menu
    this.ivrFlows.set('main', {
      id: 'main',
      name: 'Main Menu',
      prompt: 'Welcome to [Hotel Name]. Press 1 for reservations, 2 for room service, 3 for guest services, 4 to speak with an operator.',
      options: [
        { digit: '1', action: 'reservation', label: 'Reservations' },
        { digit: '2', action: 'room-service', label: 'Room Service' },
        { digit: '3', action: 'guest-services', label: 'Guest Services' },
        { digit: '4', action: 'transfer', label: 'Speak to Operator' },
        { digit: '0', action: 'repeat', label: 'Repeat Menu' }
      ]
    });

    // Reservation flow
    this.ivrFlows.set('reservation', {
      id: 'reservation',
      name: 'Reservations',
      prompt: 'For reservations, please visit our website or stay on the line. Press 1 for existing booking inquiries, 2 for new bookings.',
      options: [
        { digit: '1', action: 'inquiry', label: 'Booking Inquiry' },
        { digit: '2', action: 'new-booking', label: 'New Booking' },
        { digit: '0', action: 'main', label: 'Main Menu' }
      ]
    });

    // Room service flow
    this.ivrFlows.set('room-service', {
      id: 'room-service',
      name: 'Room Service',
      prompt: 'Room service menu. Press 1 for breakfast, 2 for lunch, 3 for dinner, 4 for beverages.',
      options: [
        { digit: '1', action: 'breakfast', label: 'Breakfast' },
        { digit: '2', action: 'lunch', label: 'Lunch' },
        { digit: '3', action: 'dinner', label: 'Dinner' },
        { digit: '4', action: 'beverages', label: 'Beverages' },
        { digit: '0', action: 'main', label: 'Main Menu' }
      ]
    });
  }

  /**
   * Handle incoming call
   */
  async handleCall(request: CallRequest): Promise<CallResponse> {
    const { from, digits } = request;

    // Greeting for first-time caller
    if (!digits) {
      return {
        message: 'Hello! Welcome to our hotel. How may I assist you today?',
        action: 'menu',
        data: { flowId: 'main' }
      };
    }

    // Route based on digit
    return this.routeByDigit(digits, from);
  }

  /**
   * Process voice input
   */
  async processVoice(transcription: string): Promise<CallResponse> {
    const lowerTranscription = transcription.toLowerCase();

    // Intent detection
    if (lowerTranscription.includes('book') || lowerTranscription.includes('reservation')) {
      return {
        message: 'I can help you with reservations. How many guests and what dates?',
        action: 'reservation'
      };
    }

    if (lowerTranscription.includes('room service') || lowerTranscription.includes('food')) {
      return {
        message: 'Our room service is available 24/7. Would you like me to send the menu to your room?',
        action: 'room-service'
      };
    }

    if (lowerTranscription.includes('checkout') || lowerTranscription.includes('check out')) {
      return {
        message: 'For express checkout, please press 1 or stay on the line for assistance.',
        action: 'checkout'
      };
    }

    if (lowerTranscription.includes('operator') || lowerTranscription.includes('speak') || lowerTranscription.includes('human')) {
      return {
        message: 'Transferring you to our guest services team. Please hold.',
        action: 'transfer'
      };
    }

    return {
      message: "I'm here to help! You can ask about reservations, room service, or guest services.",
      action: 'menu'
    };
  }

  /**
   * Get IVR flow
   */
  async getIVRFlow(flowId: string): Promise<IVRFlow | undefined> {
    return this.ivrFlows.get(flowId);
  }

  /**
   * Generate response based on digit
   */
  private async routeByDigit(digits: string, phone: string): Promise<CallResponse> {
    const digitMap: Record<string, CallResponse> = {
      '1': {
        message: 'Our front desk is available 24/7. For new reservations, visit our website. For existing bookings, please provide your confirmation code.',
        action: 'reservation',
        data: { topic: 'reservations' }
      },
      '2': {
        message: 'Room service is available. Our menu includes breakfast (6 AM - 10:30 AM), lunch (12 PM - 3 PM), and dinner (7 PM - 10:30 PM). What would you like to order?',
        action: 'room-service',
        data: { topic: 'room-service' }
      },
      '3': {
        message: 'Guest services include concierge, housekeeping, and transport assistance. How may I help you?',
        action: 'guest-services',
        data: { topic: 'guest-services' }
      },
      '4': {
        message: 'Transferring you to our guest services team. Please hold.',
        action: 'transfer'
      },
      '0': {
        message: 'Redirecting to main menu.',
        action: 'menu',
        data: { flowId: 'main' }
      }
    };

    return digitMap[digits] || {
      message: "I didn't understand. Press 1 for reservations, 2 for room service, 3 for guest services, or 4 to speak with an operator.",
      action: 'menu'
    };
  }

  /**
   * Generate greeting
   */
  generateGreeting(): string {
    const hour = new Date().getHours();
    let greeting = 'Good evening';

    if (hour < 12) greeting = 'Good morning';
    else if (hour < 17) greeting = 'Good afternoon';
    else greeting = 'Good evening';

    return `${greeting}! Welcome to our hotel. How may I assist you today?`;
  }

  /**
   * Generate closing
   */
  generateClosing(): string {
    return 'Thank you for calling! Have a wonderful stay. Goodbye!';
  }
}

export default PhoneReceptionist;