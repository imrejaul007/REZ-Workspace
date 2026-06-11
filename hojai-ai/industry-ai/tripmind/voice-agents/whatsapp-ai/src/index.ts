/**
 * WhatsApp AI Agent
 * TRIPMIND - Travel Agency AI Operating System
 * Port: 4941
 */

import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

export interface WhatsAppMessage {
  from: string;
  messageId: string;
  text?: string;
  type: 'text' | 'image' | 'document';
}

export interface WhatsAppResponse {
  to: string;
  message: string;
  buttons?: { id: string; title: string }[];
  list?: { title: string; rows: { id: string; title: string; description?: string }[] };
}

class WhatsAppAI {
  private readonly greeting = 'Namaste! Welcome to TRIPMIND. Your smart travel assistant. How can I help you today?';

  private readonly menuOptions = [
    { id: '1', title: 'Book Flight' },
    { id: '2', title: 'Book Hotel' },
    { id: '3', title: 'Holiday Packages' },
    { id: '4', title: 'My Bookings' },
  ];

  async processMessage(message: WhatsAppMessage): Promise<WhatsAppResponse> {
    const text = message.text?.toLowerCase().trim() || '';

    if (this.isGreeting(text)) {
      return this.sendMenu(message.from);
    }

    if (this.menuOptions.some(o => o.id === text)) {
      return this.handleOption(text, message.from);
    }

    if (text.includes('flight') || text.includes('fly')) {
      return this.handleFlights(message.from);
    }

    if (text.includes('hotel') || text.includes('stay') || text.includes('accommodation')) {
      return this.handleHotels(message.from);
    }

    if (text.includes('package') || text.includes('trip') || text.includes('holiday')) {
      return this.handlePackages(message.from);
    }

    if (text.includes('booking') || text.includes('reservation')) {
      return this.handleBookings(message.from);
    }

    return this.sendMenu(message.from);
  }

  private isGreeting(text: string): boolean {
    const greetings = ['hi', 'hello', 'namaste', 'hey', 'good morning', 'good evening'];
    return greetings.some(g => text.includes(g));
  }

  private sendMenu(to: string): WhatsAppResponse {
    return {
      to,
      message: `${this.greeting}\n\nPlease select an option:`,
      list: {
        title: 'Travel Services',
        rows: this.menuOptions.map(o => ({
          id: o.id,
          title: o.title,
        })),
      },
    };
  }

  private handleOption(option: string, from: string): WhatsAppResponse {
    const handlers: Record<string, () => WhatsAppResponse> = {
      '1': () => this.handleFlights(from),
      '2': () => this.handleHotels(from),
      '3': () => this.handlePackages(from),
      '4': () => this.handleBookings(from),
    };

    return handlers[option]?.() || this.sendMenu(from);
  }

  private handleFlights(from: string): WhatsAppResponse {
    return {
      to: from,
      message: '✈️ Flight Booking\n\nTo book a flight, please provide:\n1. From (City)\n2. To (City)\n3. Travel Date\n4. Number of Passengers\n\nExample: "Flight Mumbai to Dubai on 15 June for 2"',
      buttons: [
        { id: 'domestic', title: 'Domestic Flights' },
        { id: 'international', title: 'International Flights' },
      ],
    };
  }

  private handleHotels(from: string): WhatsAppResponse {
    return {
      to: from,
      message: '🏨 Hotel Booking\n\nTo book a hotel, please provide:\n1. City/Destination\n2. Check-in Date\n3. Check-out Date\n4. Number of Guests\n\nWe offer hotels across all major destinations!',
      buttons: [
        { id: 'budget', title: 'Budget Hotels' },
        { id: 'luxury', title: 'Luxury Hotels' },
        { id: 'resorts', title: 'Resorts' },
      ],
    };
  }

  private handlePackages(from: string): WhatsAppResponse {
    return {
      to: from,
      message: '🌴 Holiday Packages\n\nOur popular packages:\n• Dubai 4N/5D\n• Maldives 5N/6D\n• Thailand 5N/6D\n• Europe 10N/11D\n\nIncludes flights, hotel, transfers & sightseeing!',
      buttons: [
        { id: 'dubai', title: 'Dubai Package' },
        { id: 'maldives', title: 'Maldives Package' },
        { id: 'thailand', title: 'Thailand Package' },
      ],
    };
  }

  private handleBookings(from: string): WhatsAppResponse {
    return {
      to: from,
      message: '📋 My Bookings\n\nTo check your bookings:\n• Enter your booking reference\n• Or share your registered email\n\nYou can also view your bookings on our app!',
      buttons: [
        { id: 'check_booking', title: 'Check Booking' },
        { id: 'cancel', title: 'Cancel Booking' },
      ],
    };
  }

  async sendBookingConfirmation(to: string, details: {
    type: string;
    reference: string;
    date: string;
    destination: string;
    amount: number;
  }): Promise<WhatsAppResponse> {
    return {
      to,
      message: `✅ Booking Confirmed!\n\nType: ${details.type}\nReference: ${details.reference}\nDestination: ${details.destination}\nDate: ${details.date}\nAmount: ₹${details.amount.toLocaleString()}\n\nSafe travels! 🌏`,
    };
  }

  async sendItinerary(to: string, tripDetails: { destination: string; dates: string; highlights: string[] }): Promise<WhatsAppResponse> {
    return {
      to,
      message: `📜 Your Itinerary\n\nDestination: ${tripDetails.destination}\nDates: ${tripDetails.dates}\n\nHighlights:\n${tripDetails.highlights.map(h => `• ${h}`).join('\n')}\n\nFull itinerary sent to your email.`,
    };
  }
}

const whatsappAI = new WhatsAppAI();

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'tripmind-whatsapp-ai', port: 4941 });
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

app.post('/api/booking-confirmation', async (req: Request, res: Response) => {
  try {
    const { to, details } = req.body;
    const response = await whatsappAI.sendBookingConfirmation(to, details);
    res.json({ success: true, ...response });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send confirmation' });
  }
});

const PORT = 4941;
app.listen(PORT, () => {
  console.log(`💬 WhatsApp AI running on port ${PORT}`);
  console.log(`✈️ TRIPMIND - Travel Agency AI Operating System`);
});

export default app;