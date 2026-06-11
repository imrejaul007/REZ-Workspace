/**
 * Phone Receptionist - Voice Agent for Finance
 * Part of LEDGERAI - Finance AI Operating System
 */

export interface CallRequest {
  from: string;
  callId: string;
  digits?: string;
  transcription?: string;
}

export interface CallResponse {
  message: string;
  action: 'menu' | 'invoices' | 'reports' | 'support' | 'accountant';
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
      prompt: 'Welcome to Finance AI. Press 1 for invoice inquiries, 2 for financial reports, 3 to speak with an accountant, 4 for tax assistance.',
      options: [
        { digit: '1', action: 'invoices', label: 'Invoice Inquiries' },
        { digit: '2', action: 'reports', label: 'Financial Reports' },
        { digit: '3', action: 'accountant', label: 'Speak to Accountant' },
        { digit: '4', action: 'tax', label: 'Tax Assistance' },
        { digit: '0', action: 'repeat', label: 'Repeat Menu' }
      ]
    });

    // Invoice flow
    this.ivrFlows.set('invoices', {
      id: 'invoices',
      name: 'Invoice Menu',
      prompt: 'Press 1 for invoice status, 2 for payment options, 3 to send invoice copy.',
      options: [
        { digit: '1', action: 'status', label: 'Invoice Status' },
        { digit: '2', action: 'payment', label: 'Payment Options' },
        { digit: '3', action: 'copy', label: 'Send Invoice Copy' },
        { digit: '0', action: 'main', label: 'Main Menu' }
      ]
    });
  }

  async handleCall(request: CallRequest): Promise<CallResponse> {
    const { from, digits } = request;

    if (!digits) {
      return {
        message: 'Hello! Welcome to Finance AI. How may I assist you today?',
        action: 'menu',
        data: { flowId: 'main' }
      };
    }

    return this.routeByDigit(digits, from);
  }

  async processVoice(transcription: string): Promise<CallResponse> {
    const lowerTranscription = transcription.toLowerCase();

    if (lowerTranscription.includes('invoice') || lowerTranscription.includes('bill')) {
      return { message: 'I can help with invoice inquiries. What is your invoice number?', action: 'invoices' };
    }

    if (lowerTranscription.includes('report') || lowerTranscription.includes('financial')) {
      return { message: 'I can generate financial reports. Which report do you need?', action: 'reports' };
    }

    if (lowerTranscription.includes('tax')) {
      return { message: 'I can help with tax calculations and filing. What do you need assistance with?', action: 'accountant' };
    }

    return { message: "I'm here to help with your finance inquiries.", action: 'menu' };
  }

  async getIVRFlow(flowId: string): Promise<IVRFlow | undefined> {
    return this.ivrFlows.get(flowId);
  }

  private async routeByDigit(digits: string, phone: string): Promise<CallResponse> {
    const digitMap: Record<string, CallResponse> = {
      '1': { message: 'For invoice inquiries, please provide your invoice number or customer name.', action: 'invoices', data: { topic: 'invoices' } },
      '2': { message: 'Financial reports available: Balance Sheet, Income Statement, Cash Flow. Which would you like?', action: 'reports', data: { topic: 'reports' } },
      '3': { message: 'Connecting you to our accountant. Please hold.', action: 'accountant' },
      '4': { message: 'Tax assistance: TDS, GST, Income Tax. What do you need help with?', action: 'accountant', data: { topic: 'tax' } },
      '0': { message: 'Redirecting to main menu.', action: 'menu', data: { flowId: 'main' } }
    };

    return digitMap[digits] || { message: "I didn't understand. Please try again.", action: 'menu' };
  }

  generateGreeting(): string {
    const hour = new Date().getHours();
    return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening' + '! Welcome to Finance AI.';
  }

  generateClosing(): string {
    return 'Thank you for calling Finance AI. Have a great day!';
  }
}

export default PhoneReceptionist;