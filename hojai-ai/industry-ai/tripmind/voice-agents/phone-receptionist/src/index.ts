/**
 * Phone Receptionist - Voice Agent for Travel Agency
 * Part of TRIPMIND - Travel Agency AI
 */

export interface CallRequest {
  from: string;
  callId: string;
  digits?: string;
  transcription?: string;
}

export interface CallResponse {
  message: string;
  action: 'menu' | 'booking' | 'inquiry' | 'support' | 'transfer' | 'voicemail';
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
      prompt: 'Welcome to TRIPMIND Travel. Press 1 to book a trip, 2 for destination information, 3 for booking status, 4 for visa inquiries, 5 for customer support, or 0 to speak with an agent.',
      options: [
        { digit: '1', action: 'booking', label: 'Book Trip' },
        { digit: '2', action: 'inquiry', label: 'Destination Info' },
        { digit: '3', action: 'status', label: 'Booking Status' },
        { digit: '4', action: 'visa', label: 'Visa Inquiries' },
        { digit: '5', action: 'support', label: 'Customer Support' },
        { digit: '0', action: 'transfer', label: 'Speak to Agent' }
      ]
    });

    // Booking flow
    this.ivrFlows.set('booking', {
      id: 'booking',
      name: 'Booking',
      prompt: 'To book a trip, please visit our website at tripmind.com or use our mobile app. Press 1 to hear our popular destinations, 2 for package deals, or 0 to speak with a travel consultant.',
      options: [
        { digit: '1', action: 'destinations', label: 'Popular Destinations' },
        { digit: '2', action: 'packages', label: 'Package Deals' },
        { digit: '0', action: 'transfer', label: 'Speak to Agent' }
      ]
    });

    // Visa flow
    this.ivrFlows.set('visa', {
      id: 'visa',
      name: 'Visa Inquiries',
      prompt: 'We assist with visa applications for multiple countries. Press 1 for Dubai visa, 2 for Thailand visa, 3 for Singapore visa, or stay on the line for other countries.',
      options: [
        { digit: '1', action: 'dubai_visa', label: 'Dubai Visa' },
        { digit: '2', action: 'thailand_visa', label: 'Thailand Visa' },
        { digit: '3', action: 'singapore_visa', label: 'Singapore Visa' }
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
        message: 'Namaste! Welcome to TRIPMIND Travel. Your journey begins here. Please listen to the menu and press the corresponding number.',
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
    if (lowerTranscription.includes('book') || lowerTranscription.includes('trip') || lowerTranscription.includes('travel')) {
      return {
        message: 'I can help you book your dream vacation! Tell me your destination, travel dates, and number of travelers.',
        action: 'booking'
      };
    }

    if (lowerTranscription.includes('visa') || lowerTranscription.includes('passport')) {
      return {
        message: 'We provide visa assistance for Dubai, Thailand, Singapore, and many more countries. Which country are you planning to visit?',
        action: 'visa'
      };
    }

    if (lowerTranscription.includes('cancel') || lowerTranscription.includes('refund')) {
      return {
        message: 'I understand you need to modify or cancel your booking. Let me connect you with our customer support team.',
        action: 'support'
      };
    }

    if (lowerTranscription.includes('status') || lowerTranscription.includes('track') || lowerTranscription.includes('booking')) {
      return {
        message: 'I can help you check your booking status. Please provide your booking reference number.',
        action: 'status'
      };
    }

    if (lowerTranscription.includes('agent') || lowerTranscription.includes('human') || lowerTranscription.includes('speak')) {
      return {
        message: 'Transferring you to our travel consultant. Please hold.',
        action: 'transfer'
      };
    }

    if (lowerTranscription.includes('destination') || lowerTranscription.includes('goa') || lowerTranscription.includes('kerala')) {
      return {
        message: 'We have amazing packages for Goa, Kerala, Dubai, and more! Would you like me to share our popular destinations?',
        action: 'inquiry'
      };
    }

    return {
      message: "I'm here to help with your travel needs! You can ask about booking trips, visa requirements, or destination information.",
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
        message: 'Great choice! We offer packages to Goa, Kerala, Dubai, Singapore, Thailand and more. Visit our website or app to book, or stay on the line for a consultant.',
        action: 'booking',
        data: { topic: 'booking' }
      },
      '2': {
        message: 'Popular destinations this season: Goa beaches, Kerala backwaters, Dubai shopping, Singapore family fun. Which interests you?',
        action: 'inquiry',
        data: { topic: 'destinations' }
      },
      '3': {
        message: 'Please provide your booking reference number to check your booking status. You can also check status on our website or app.',
        action: 'status',
        data: { topic: 'check_status' }
      },
      '4': {
        message: 'We assist with visa applications for Dubai, Thailand, Singapore, and many countries. Processing time is 3-7 working days. Stay on for visa assistance.',
        action: 'visa',
        data: { topic: 'visa_info' }
      },
      '5': {
        message: 'Our customer support team can help with modifications, cancellations, refunds, and general inquiries. Connecting you now.',
        action: 'support'
      },
      '0': {
        message: 'Transferring you to our travel consultant. Your call is important to us.',
        action: 'transfer'
      }
    };

    return digitMap[digits] || {
      message: "I didn't understand. Press 1 to book, 2 for destinations, 3 for booking status, 4 for visa, or 5 for support.",
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

    return `${greeting}! Welcome to TRIPMIND Travel. Where would you like to go today?`;
  }

  /**
   * Generate closing
   */
  generateClosing(): string {
    return 'Thank you for calling TRIPMIND Travel! Have a wonderful journey. Goodbye!';
  }
}

export default PhoneReceptionist;