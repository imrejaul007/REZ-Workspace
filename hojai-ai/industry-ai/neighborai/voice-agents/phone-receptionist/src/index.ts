/**
 * Phone Receptionist Voice Agent
 * NEIGHBORAI - Society Management AI Operating System
 * Port: 4923
 */

import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

export interface CallRequest {
  from: string;
  callId: string;
  digits?: string;
  transcription?: string;
}

export interface CallResponse {
  message: string;
  action: 'menu' | 'visitor' | 'complaint' | 'maintenance' | 'emergency' | 'transfer';
  data?: Record<string, unknown>;
}

export interface IVRFlow {
  id: string;
  name: string;
  prompt: string;
  options: { digit: string; action: string; label: string }[];
}

class PhoneReceptionist {
  private readonly ivrFlows: Map<string, IVRFlow> = new Map();

  constructor() {
    this.initializeIVRFlows();
  }

  private initializeIVRFlows(): void {
    this.ivrFlows.set('main', {
      id: 'main',
      name: 'Main Menu',
      prompt: 'Welcome to NEIGHBORAI Society Services. Press 1 for visitor management, 2 for complaints, 3 for maintenance, 4 for billing, 5 for emergency.',
      options: [
        { digit: '1', action: 'visitor', label: 'Visitor Management' },
        { digit: '2', action: 'complaint', label: 'Register Complaint' },
        { digit: '3', action: 'maintenance', label: 'Maintenance Request' },
        { digit: '4', action: 'billing', label: 'Billing Inquiry' },
        { digit: '5', action: 'emergency', label: 'Emergency' },
        { digit: '0', action: 'repeat', label: 'Repeat Menu' }
      ]
    });

    this.ivrFlows.set('visitor', {
      id: 'visitor',
      name: 'Visitor Menu',
      prompt: 'Press 1 to register a visitor, 2 to check visitor status, 3 to approve delivery.',
      options: [
        { digit: '1', action: 'register', label: 'Register Visitor' },
        { digit: '2', action: 'status', label: 'Check Status' },
        { digit: '3', action: 'delivery', label: 'Approve Delivery' },
        { digit: '0', action: 'main', label: 'Main Menu' }
      ]
    });
  }

  async handleCall(request: CallRequest): Promise<CallResponse> {
    const { from, digits } = request;

    if (!digits) {
      return {
        message: this.generateGreeting(),
        action: 'menu',
        data: { flowId: 'main' }
      };
    }

    return this.routeByDigit(digits);
  }

  async processVoice(transcription: string): Promise<CallResponse> {
    const lower = transcription.toLowerCase();

    if (lower.includes('visitor') || lower.includes('guest')) {
      return {
        message: 'I can help you manage visitors. Would you like to register a visitor or check visitor status?',
        action: 'visitor'
      };
    }

    if (lower.includes('complaint') || lower.includes('problem') || lower.includes('issue')) {
      return {
        message: 'I am here to help with your complaint. Please describe the issue and your flat number.',
        action: 'complaint'
      };
    }

    if (lower.includes('maintenance') || lower.includes('repair') || lower.includes('fix')) {
      return {
        message: 'For maintenance requests, please specify the type of issue and your flat number.',
        action: 'maintenance'
      };
    }

    if (lower.includes('emergency') || lower.includes('police') || lower.includes('ambulance')) {
      return {
        message: 'Transferring you to emergency services. Please hold.',
        action: 'emergency'
      };
    }

    return {
      message: "Thank you for calling NEIGHBORAI. How may I assist you with your society needs?",
      action: 'menu'
    };
  }

  async getIVRFlow(flowId: string): Promise<IVRFlow | undefined> {
    return this.ivrFlows.get(flowId);
  }

  private async routeByDigit(digits: string): Promise<CallResponse> {
    const digitMap: Record<string, CallResponse> = {
      '1': {
        message: 'You selected visitor management. Press 1 to register a visitor with name and flat number, or stay on the line for security desk.',
        action: 'visitor',
        data: { topic: 'visitor' }
      },
      '2': {
        message: 'You selected complaints. Please provide your flat number and describe the issue after the tone.',
        action: 'complaint',
        data: { topic: 'complaint' }
      },
      '3': {
        message: 'You selected maintenance. Please provide your flat number and describe the maintenance issue.',
        action: 'maintenance',
        data: { topic: 'maintenance' }
      },
      '4': {
        message: 'For billing inquiries, please visit our resident portal or stay on the line for billing department.',
        action: 'menu',
        data: { topic: 'billing' }
      },
      '5': {
        message: 'Connecting you to emergency services. Please stay on the line.',
        action: 'emergency'
      },
      '0': {
        message: 'Redirecting to main menu.',
        action: 'menu',
        data: { flowId: 'main' }
      }
    };

    return digitMap[digits] || {
      message: "I didn't understand. Press 1 for visitor, 2 for complaints, 3 for maintenance, 4 for billing, 5 for emergency.",
      action: 'menu'
    };
  }

  generateGreeting(): string {
    const hour = new Date().getHours();
    let greeting = 'Good morning';

    if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
    else if (hour >= 17) greeting = 'Good evening';

    return `${greeting}! Welcome to NEIGHBORAI, your society management assistant. How may I help you today?`;
  }

  generateClosing(): string {
    return 'Thank you for calling NEIGHBORAI. Have a wonderful day!';
  }
}

const receptionist = new PhoneReceptionist();

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'neighborai-phone-receptionist', port: 4923 });
});

app.post('/api/call', async (req: Request, res: Response) => {
  try {
    const response = await receptionist.handleCall(req.body);
    res.json({ success: true, ...response });
  } catch (error) {
    res.status(500).json({ error: 'Failed to handle call' });
  }
});

app.post('/api/voice', async (req: Request, res: Response) => {
  try {
    const { transcription } = req.body;
    const response = await receptionist.processVoice(transcription);
    res.json({ success: true, ...response });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process voice' });
  }
});

app.get('/api/ivr/:flowId', async (req: Request, res: Response) => {
  try {
    const flow = await receptionist.getIVRFlow(req.params.flowId);
    if (!flow) return res.status(404).json({ error: 'Flow not found' });
    res.json({ success: true, flow });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get IVR flow' });
  }
});

app.get('/api/greeting', (req: Request, res: Response) => {
  res.json({ success: true, message: receptionist.generateGreeting() });
});

const PORT = 4923;
app.listen(PORT, () => {
  console.log(`📞 Phone Receptionist running on port ${PORT}`);
  console.log(`🏢 NEIGHBORAI - Society Management AI`);
});

export default app;