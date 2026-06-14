/**
 * REZ Inbox - Email Parser Service
 * Parses emails and extracts structured data
 */

import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { EmailMessage, ExtractedData, MessageCategory } from '../types/index';
import { logger } from '../utils/logger';

interface ParseRequest {
  emailId: string;
  from: string;
  subject: string;
  body: string;
  attachments?: any[];
  timestamp?: string;
}

// Category patterns for email classification
const CATEGORY_PATTERNS = {
  travel: [
    /flight|airline|booking|pnr|ticket/i,
    /check-in|baggage|boarding/i,
    /hotel|reservation|booking/i,
    /uber|ola|lyft|taxi/i,
  ],
  food: [
    /swiggy|zomato|dominos|pizza|burger/i,
    /order|delivery|restaurant/i,
    /food|dinner|lunch|breakfast/i,
  ],
  invoice: [
    /invoice|bill|receipt|tax invoice/i,
    /payment due|amount payable/i,
    /gst|tax invoice/i,
  ],
  subscription: [
    /netflix|spotify|amazon prime|disney/i,
    /subscription|renewal|plan/i,
    /monthly|yearly|membership/i,
  ],
  banking: [
    /transaction|transfer|neft|imps|upi/i,
    /bank|account|balance/i,
    /debit|credit|card/i,
  ],
  social: [
    /linkedin|twitter|facebook|instagram/i,
    /notification|update|mention/i,
  ],
  promotion: [
    /offer|discount|sale|promo/i,
    /deal|save|extra|free/i,
  ],
};

class EmailParserService {
  /**
   * Parse email and extract structured data
   */
  async parse(request: ParseRequest): Promise<EmailMessage> {
    const { emailId, from, subject, body, attachments, timestamp } = request;

    // Classify email
    const category = this.classifyEmail(subject, body);

    // Extract data based on category
    const extractedData = this.extractData(category, subject, body);

    // Create message
    const message: EmailMessage = {
      id: emailId || uuidv4(),
      userId: 'default', // Will be set from auth
      from,
      fromName: this.extractName(from),
      to: '',
      subject,
      body,
      date: timestamp || new Date().toISOString(),
      category,
      extractedData,
      status: 'unread',
      isStarred: false,
      isImportant: this.isImportant(subject, body),
      attachments: (attachments || []).map((a: any) => ({
        id: uuidv4(),
        filename: a.filename,
        contentType: a.contentType,
        size: a.size,
        url: a.url,
        thumbnailUrl: a.thumbnailUrl,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    logger.info('Email parsed', {
      id: message.id,
      category: message.category,
      from: message.fromName,
    });

    return message;
  }

  /**
   * Classify email into category
   */
  private classifyEmail(subject: string, body: string): MessageCategory {
    const content = `${subject} ${body}`.toLowerCase();

    for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          return category as MessageCategory;
        }
      }
    }

    return 'other';
  }

  /**
   * Extract structured data from email
   */
  private extractData(category: MessageCategory, subject: string, body: string): ExtractedData {
    const extractors: Record<MessageCategory, () => ExtractedData> = {
      travel: () => this.extractTravelData(subject, body),
      food: () => this.extractFoodData(subject, body),
      invoice: () => this.extractInvoiceData(subject, body),
      subscription: () => this.extractSubscriptionData(subject, body),
      banking: () => ({}),
      social: () => ({}),
      promotion: () => ({}),
      other: () => ({}),
    };

    return extractors[category]?.() || {};
  }

  private extractTravelData(subject: string, body: string): ExtractedData {
    const data: ExtractedData = {};

    // Flight detection
    if (/flight|airline|pnr|boarding/i.test(subject + body)) {
      const pnrMatch = body.match(/PNR[:\s]*([A-Z0-9]{6,10})/i);
      const flightMatch = body.match(/flight[:\s]*([A-Z]{2}[0-9]{2,4})/i);
      const dateMatch = body.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);

      data.flightDetails = {
        airline: 'Unknown',
        flightNumber: flightMatch?.[1] || '',
        from: 'Unknown',
        to: 'Unknown',
        departureTime: dateMatch?.[1] || '',
        arrivalTime: '',
        passengerName: 'Passenger',
        pnr: pnrMatch?.[1],
      };
    }

    // Hotel detection
    if (/hotel|reservation|check-in/i.test(subject + body)) {
      const checkInMatch = body.match(/check[\s-]?in[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
      const checkOutMatch = body.match(/check[\s-]?out[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);

      data.hotelDetails = {
        hotelName: 'Hotel',
        address: '',
        checkIn: checkInMatch?.[1] || '',
        checkOut: checkOutMatch?.[1] || '',
        roomType: 'Standard',
        guestName: 'Guest',
        bookingRef: '',
      };
    }

    return data;
  }

  private extractFoodData(subject: string, body: string): ExtractedData {
    const orderMatch = body.match(/order[_\s]?(?:id|number)?[:\s]*([A-Z0-9]{6,})/i);
    const totalMatch = body.match(/(?:total|amount|grand total)[:\s]*₹?\s*([\d,]+\.?\d*)/i);

    return {
      orderDetails: {
        restaurantName: this.extractRestaurantName(subject),
        orderId: orderMatch?.[1] || '',
        items: [],
        total: parseFloat(totalMatch?.[1]?.replace(/,/g, '') || '0'),
      },
    };
  }

  private extractInvoiceData(subject: string, body: string): ExtractedData {
    const invoiceMatch = body.match(/invoice[:\s#]*([A-Z0-9\-]+)/i);
    const amountMatch = body.match(/(?:total|amount|grand total|payable)[:\s]*₹?\s*([\d,]+\.?\d*)/i);
    const dateMatch = body.match(/date[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);

    return {
      invoiceDetails: {
        invoiceNumber: invoiceMatch?.[1] || '',
        invoiceDate: dateMatch?.[1] || format(new Date(), 'dd/MM/yyyy'),
        amount: parseFloat(amountMatch?.[1]?.replace(/,/g, '') || '0'),
        items: [],
        vendorName: this.extractVendorName(subject),
      },
    };
  }

  private extractSubscriptionData(subject: string, body: string): ExtractedData {
    const amountMatch = body.match(/₹\s*([\d,]+\.?\d*)\s*(?:per|\/)/i);

    return {
      subscriptionDetails: {
        serviceName: this.extractServiceName(subject),
        plan: 'Standard',
        amount: parseFloat(amountMatch?.[1]?.replace(/,/g, '') || '0'),
        billingCycle: /year|annual/i.test(body) ? 'yearly' : 'monthly',
        nextBillingDate: '',
      },
    };
  }

  private extractName(from: string): string {
    const match = from.match(/^"?([^"<]+)"?\s*</);
    return match?.[1]?.trim() || from;
  }

  private extractRestaurantName(subject: string): string {
    const matches = subject.match(/(?:from|order from)[:\s]*([A-Za-z\s]+?)(?:\s+order|\s+delivery|\s*$)/i);
    return matches?.[1]?.trim() || 'Restaurant';
  }

  private extractVendorName(subject: string): string {
    const match = subject.match(/from[:\s]*([A-Za-z\s]+?)(?:\s+invoice|\s+bill|\s*$)/i);
    return match?.[1]?.trim() || 'Vendor';
  }

  private extractServiceName(subject: string): string {
    const services = ['Netflix', 'Spotify', 'Amazon Prime', 'Disney+', 'Hotstar', 'YouTube'];
    return services.find(s => subject.toLowerCase().includes(s.toLowerCase())) || 'Service';
  }

  private isImportant(subject: string, body: string): boolean {
    const patterns = [
      /urgent|important|asap/i,
      /deadline|action required/i,
      /confirm|approve/i,
    ];
    return patterns.some(p => p.test(subject) || p.test(body));
  }
}

export const emailParser = new EmailParserService();
