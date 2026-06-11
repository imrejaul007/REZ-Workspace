/**
 * WhatsApp AI Agent
 * NEIGHBORAI - Society Management AI Operating System
 * Port: 4924
 */

import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

export interface WhatsAppMessage {
  from: string;
  messageId: string;
  text?: string;
  type: 'text' | 'image' | 'document' | 'location';
}

export interface WhatsAppResponse {
  to: string;
  message: string;
  buttons?: { id: string; title: string }[];
  list?: { title: string; rows: { id: string; title: string; description?: string }[] };
}

class WhatsAppAI {
  private readonly greeting = 'Namaste! Welcome to NEIGHBORAI. Your society management assistant. How can I help you today?';

  private readonly menuOptions = [
    { id: '1', title: 'Visitor Pass' },
    { id: '2', title: 'Complaint' },
    { id: '3', title: 'Maintenance' },
    { id: '4', title: 'Events' },
  ];

  async processMessage(message: WhatsAppMessage): Promise<WhatsAppResponse> {
    const text = message.text?.toLowerCase().trim() || '';

    if (this.isGreeting(text)) {
      return this.sendMenu(message.from);
    }

    if (this.menuOptions.some(o => o.id === text)) {
      return this.handleOption(text, message.from);
    }

    if (text.includes('visitor') || text.includes('guest')) {
      return this.handleVisitor(message.from);
    }

    if (text.includes('complaint')) {
      return this.handleComplaint(message.from);
    }

    if (text.includes('maintenance') || text.includes('repair')) {
      return this.handleMaintenance(message.from);
    }

    if (text.includes('event')) {
      return this.handleEvents(message.from);
    }

    if (text.includes('bill') || text.includes('payment')) {
      return this.handleBilling(message.from);
    }

    return this.sendMenu(message.from);
  }

  private isGreeting(text: string): boolean {
    const greetings = ['hi', 'hello', 'namaste', 'hey', 'good morning', 'good afternoon', 'good evening'];
    return greetings.some(g => text.includes(g));
  }

  private sendMenu(to: string): WhatsAppResponse {
    return {
      to,
      message: `${this.greeting}\n\nPlease select an option:`,
      list: {
        title: 'Services',
        rows: this.menuOptions.map(o => ({
          id: o.id,
          title: o.title,
        })),
      },
    };
  }

  private handleOption(option: string, from: string): WhatsAppResponse {
    const handlers: Record<string, () => WhatsAppResponse> = {
      '1': () => this.handleVisitor(from),
      '2': () => this.handleComplaint(from),
      '3': () => this.handleMaintenance(from),
      '4': () => this.handleEvents(from),
    };

    return handlers[option]?.() || this.sendMenu(from);
  }

  private handleVisitor(from: string): WhatsAppResponse {
    return {
      to: from,
      message: '🏠 Visitor Pass\n\nTo register a visitor, please provide:\n1. Visitor Name\n2. Purpose (Delivery/Guest/Service)\n3. Your Flat Number\n\nExample: "Visitor: Rahul, Delivery, A-101"',
      buttons: [
        { id: 'register_visitor', title: 'Register Visitor' },
        { id: 'check_status', title: 'Check Visitor Status' },
      ],
    };
  }

  private handleComplaint(from: string): WhatsAppResponse {
    return {
      to: from,
      message: '📝 Complaint Registration\n\nTo register a complaint, please provide:\n1. Your Flat Number\n2. Category (Noise/Parking/Cleanliness/Maintenance)\n3. Description of the issue\n\nExample: "Complaint: A-101, Noise, Loud music after 10pm"',
      buttons: [
        { id: 'new_complaint', title: 'New Complaint' },
        { id: 'check_status', title: 'Check Status' },
      ],
    };
  }

  private handleMaintenance(from: string): WhatsAppResponse {
    return {
      to: from,
      message: '🔧 Maintenance Request\n\nTo request maintenance, please provide:\n1. Flat Number\n2. Issue Type (Plumbing/Electrical/Carpentry/Pest/AC)\n3. Description\n\nExample: "Maintenance: A-101, Plumbing, Tap leaking in bathroom"',
      buttons: [
        { id: 'new_request', title: 'New Request' },
        { id: 'track_request', title: 'Track Request' },
      ],
    };
  }

  private handleEvents(from: string): WhatsAppResponse {
    return {
      to: from,
      message: '🎉 Society Events\n\nStay updated with upcoming events!\n\nTo RSVP, reply with "RSVP EventName"\n\nCheck our website or resident app for the full event calendar.',
      buttons: [
        { id: 'upcoming', title: 'View Upcoming Events' },
        { id: 'rsvp', title: 'RSVP to Event' },
      ],
    };
  }

  private handleBilling(from: string): WhatsAppResponse {
    return {
      to: from,
      message: '💳 Billing Services\n\nFor billing inquiries:\n• View outstanding maintenance bills\n• Make payment\n• Request payment receipt\n\nPlease visit our resident portal or contact the billing department.',
      buttons: [
        { id: 'outstanding', title: 'Check Outstanding' },
        { id: 'payment_link', title: 'Get Payment Link' },
      ],
    };
  }

  async sendVisitorPass(to: string, visitorName: string, passCode: string, validUntil: string): Promise<WhatsAppResponse> {
    return {
      to,
      message: `✅ Visitor Pass Generated\n\nVisitor: ${visitorName}\nPass Code: ${passCode}\nValid Until: ${validUntil}\n\nPlease share this code with your visitor for gate entry.`,
    };
  }

  async sendComplaintConfirmation(to: string, complaintId: string, category: string): Promise<WhatsAppResponse> {
    return {
      to,
      message: `📝 Complaint Registered\n\nComplaint ID: ${complaintId}\nCategory: ${category}\n\nWe will address this issue shortly. You can track status using the complaint ID.`,
    };
  }
}

const whatsappAI = new WhatsAppAI();

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'neighborai-whatsapp-ai', port: 4924 });
});

app.post('/api/webhook', async (req: Request, res: Response) => {
  try {
    const { from, messageId, text, type } = req.body;
    const message: WhatsAppMessage = { from, messageId, text, type: type || 'text' };
    const response = await whatsappAI.processMessage(message);
    res.json({ success: true, ...response });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process message' });
  }
});

app.post('/api/visitor-pass', async (req: Request, res: Response) => {
  try {
    const { to, visitorName, passCode, validUntil } = req.body;
    const response = await whatsappAI.sendVisitorPass(to, visitorName, passCode, validUntil);
    res.json({ success: true, ...response });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send visitor pass' });
  }
});

app.post('/api/complaint-confirmation', async (req: Request, res: Response) => {
  try {
    const { to, complaintId, category } = req.body;
    const response = await whatsappAI.sendComplaintConfirmation(to, complaintId, category);
    res.json({ success: true, ...response });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send confirmation' });
  }
});

const PORT = 4924;
app.listen(PORT, () => {
  console.log(`💬 WhatsApp AI running on port ${PORT}`);
  console.log(`🏢 NEIGHBORAI - Society Management AI`);
});

export default app;