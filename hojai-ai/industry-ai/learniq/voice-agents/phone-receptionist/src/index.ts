/**
 * Phone Receptionist Voice Agent
 * LEARNIQ - Education AI Operating System
 * Port: 4934
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
  action: 'menu' | 'admission' | 'courses' | 'support' | 'transfer';
  data?: Record<string, unknown>;
}

class PhoneReceptionist {
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

    if (lower.includes('admission') || lower.includes('enroll') || lower.includes('join')) {
      return {
        message: 'I can help you with admissions. Are you interested in a specific course?',
        action: 'admission'
      };
    }

    if (lower.includes('course') || lower.includes('class') || lower.includes('study')) {
      return {
        message: 'We offer courses in various subjects. Which field are you interested in?',
        action: 'courses'
      };
    }

    if (lower.includes('tutor') || lower.includes('teacher') || lower.includes('help')) {
      return {
        message: 'Our tutoring services are available for all subjects. Let me transfer you to academic support.',
        action: 'support'
      };
    }

    return {
      message: "Thank you for calling LEARNIQ. How may I assist you with your education needs?",
      action: 'menu'
    };
  }

  private routeByDigit(digits: string): CallResponse {
    const digitMap: Record<string, CallResponse> = {
      '1': {
        message: 'You selected admissions. Please stay on the line for our admissions counselor.',
        action: 'admission',
        data: { topic: 'admissions' }
      },
      '2': {
        message: 'You selected course information. We offer courses in Science, Commerce, Humanities, and Technology.',
        action: 'courses',
        data: { topic: 'course-info' }
      },
      '3': {
        message: 'Connecting you to academic support. How can we help you?',
        action: 'support'
      },
      '4': {
        message: 'For technical support with our learning platform, please visit learniq.example.com/support.',
        action: 'menu'
      },
      '0': {
        message: 'Redirecting to main menu.',
        action: 'menu'
      }
    };

    return digitMap[digits] || {
      message: "I didn't understand. Press 1 for admissions, 2 for courses, 3 for support.",
      action: 'menu'
    };
  }

  generateGreeting(): string {
    const hour = new Date().getHours();
    let greeting = 'Good morning';

    if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
    else if (hour >= 17) greeting = 'Good evening';

    return `${greeting}! Welcome to LEARNIQ, your education partner. How may I help you today?`;
  }
}

const receptionist = new PhoneReceptionist();

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'learniq-phone-receptionist', port: 4934 });
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

const PORT = 4934;
app.listen(PORT, () => {
  console.log(`📞 Phone Receptionist running on port ${PORT}`);
  console.log(`🎓 LEARNIQ - Education AI Operating System`);
});

export default app;