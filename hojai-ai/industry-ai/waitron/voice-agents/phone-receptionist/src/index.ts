/**
 * Phone Receptionist - Voice Agent for Restaurant
 * Part of WAITRON - Restaurant AI Operating System
 */

export interface CallRequest {
  from: string;
  callId: string;
  digits?: string;
  transcription?: string;
}

export interface CallResponse {
  message: string;
  action: 'menu' | 'reservation' | 'order' | 'transfer' | 'voicemail';
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
  private readonly language: string = 'en';

  constructor() {
    this.initializeIVRFlows();
  }

  private initializeIVRFlows(): void {
    // Main menu
    this.ivrFlows.set('main', {
      id: 'main',
      name: 'Main Menu',
      prompt: 'Welcome to [Restaurant Name]. Press 1 for reservations, 2 for menu inquiry, 3 to place an order, 4 to speak with staff.',
      options: [
        { digit: '1', action: 'reservation', label: 'Reservations' },
        { digit: '2', action: 'menu', label: 'Menu Inquiry' },
        { digit: '3', action: 'order', label: 'Place Order' },
        { digit: '4', action: 'transfer', label: 'Speak to Staff' },
        { digit: '0', action: 'repeat', label: 'Repeat Menu' }
      ]
    });

    // Reservation flow
    this.ivrFlows.set('reservation', {
      id: 'reservation',
      name: 'Reservations',
      prompt: 'To book a table, please visit our website or stay on the line for staff assistance. Press 1 to hear our hours, 2 for directions.',
      options: [
        { digit: '1', action: 'hours', label: 'Hours' },
        { digit: '2', action: 'directions', label: 'Directions' },
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
        message: 'Hello! Welcome to our restaurant. Please listen to our menu and press the corresponding number.',
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
        message: 'I can help you with a reservation. How many guests and what date/time?',
        action: 'reservation'
      };
    }

    if (lowerTranscription.includes('menu') || lowerTranscription.includes('food')) {
      return {
        message: 'We serve Indian, Chinese, and Continental cuisine. Would you like me to send our menu via WhatsApp?',
        action: 'menu'
      };
    }

    if (lowerTranscription.includes('order')) {
      return {
        message: 'You can place orders through our app or website. Would you like me to transfer you to staff?',
        action: 'order'
      };
    }

    if (lowerTranscription.includes('speak') || lowerTranscription.includes('human')) {
      return {
        message: 'Transferring you to our staff. Please hold.',
        action: 'transfer'
      };
    }

    return {
      message: "I'm here to help! You can ask about reservations, our menu, or place orders.",
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
        message: 'Our hours are 11 AM to 11 PM daily. Would you like to book a table?',
        action: 'reservation',
        data: { topic: 'hours' }
      },
      '2': {
        message: 'Our popular dishes include Butter Chicken, Biryani, and Paneer Tikka. Should I send our full menu via WhatsApp?',
        action: 'menu',
        data: { topic: 'popular_items' }
      },
      '3': {
        message: 'You can place orders through our website or app. Press 0 to speak with staff for phone orders.',
        action: 'order',
        data: { topic: 'ordering' }
      },
      '4': {
        message: 'Transferring you to our staff. Please hold.',
        action: 'transfer'
      },
      '0': {
        message: 'Redirecting to main menu.',
        action: 'menu',
        data: { flowId: 'main' }
      }
    };

    return digitMap[digits] || {
      message: "I didn't understand. Press 1 for reservations, 2 for menu, 3 for orders, or 4 to speak with staff.",
      action: 'menu'
    };
  }

  /**
   * Generate greeting
   */
  generateGreeting(): string {
    const hour = new Date().getHours();
    let greeting = 'Namaste';

    if (hour < 12) greeting = 'Good morning';
    else if (hour < 17) greeting = 'Good afternoon';
    else greeting = 'Good evening';

    return `${greeting}! Welcome to our restaurant. How may I assist you today?`;
  }

  /**
   * Generate closing
   */
  generateClosing(): string {
    return 'Thank you for calling! Have a great day. Goodbye!';
  }
}

export default PhoneReceptionist;
