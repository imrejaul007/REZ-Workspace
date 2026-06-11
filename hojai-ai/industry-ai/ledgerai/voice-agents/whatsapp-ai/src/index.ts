/**
 * WhatsApp AI - WhatsApp Voice Agent for Finance
 * Part of LEDGERAI - Finance AI Operating System
 */

export interface WhatsAppMessage {
  from: string;
  type: 'text' | 'voice' | 'image' | 'document';
  content: string;
  messageId: string;
  timestamp: string;
}

export interface WhatsAppResponse {
  to: string;
  message: string;
  type: 'text' | 'image' | 'document' | 'interactive';
  quickReplies?: string[];
  mediaUrl?: string;
}

export class WhatsAppAI {
  private readonly menu: string = `
📊 *Finance AI Services*

*Quick Actions*
1️⃣ - View Invoices
2️⃣ - Payment Link
3️⃣ - Download Receipt
4️⃣ - Tax Calculator

*Categories*
• Invoice Management
• Payment Processing
• Financial Reports
• Tax Filing

How can I help?`;

  async handleMessage(message: WhatsAppMessage): Promise<WhatsAppResponse> {
    const { from, content, type } = message;
    const lowerContent = content.toLowerCase();

    if (type === 'voice') {
      return {
        to: from,
        message: '📝 I received your voice message! Let me help you with your finance query.',
        type: 'text',
        quickReplies: ['View Invoices', 'Payment Link', 'Contact Support']
      };
    }

    if (this.containsAny(lowerContent, ['invoice', 'bill', 'payment'])) {
      return this.handleInvoices(from);
    }

    if (this.containsAny(lowerContent, ['tax', 'gst', 'tds'])) {
      return this.handleTax(from);
    }

    if (this.containsAny(lowerContent, ['report', 'balance', 'profit', 'loss'])) {
      return this.handleReports(from);
    }

    if (this.containsAny(lowerContent, ['hi', 'hello', 'hey', 'help', 'menu'])) {
      return this.handleGreeting(from);
    }

    if (this.containsAny(lowerContent, ['statement', 'account'])) {
      return this.handleStatements(from);
    }

    return this.handleDefault(from);
  }

  private handleInvoices(from: string): WhatsAppResponse {
    return {
      to: from,
      message: `📄 *Invoice Management*

How can I help with invoices?

• View outstanding invoices
• Generate payment link
• Download invoice copy
• Check payment status

What would you like to do?`,
      type: 'text',
      quickReplies: ['View Outstanding', 'Payment Link', 'Invoice Copy']
    };
  }

  private handleTax(from: string): WhatsAppResponse {
    return {
      to: from,
      message: `🧮 *Tax Services*

I can help with:

• Income Tax calculation
• TDS deduction
• GST filing
• Tax saving tips

What do you need?`,
      type: 'text',
      quickReplies: ['Income Tax', 'TDS', 'GST Filing', 'Tax Calculator']
    };
  }

  private handleReports(from: string): WhatsAppResponse {
    return {
      to: from,
      message: `📊 *Financial Reports*

Available reports:

• Balance Sheet
• Income Statement (P&L)
• Cash Flow Statement
• Trial Balance

Which report would you like?`,
      type: 'text',
      quickReplies: ['Balance Sheet', 'P&L Statement', 'Cash Flow', 'Trial Balance']
    };
  }

  private handleGreeting(from: string): WhatsAppResponse {
    return {
      to: from,
      message: `👋 *Welcome to Finance AI!*

Your smart finance assistant.

I can help you with:
• 📄 Invoice management
• 💰 Payment processing
• 📊 Financial reports
• 🧮 Tax calculations

What would you like to do?`,
      type: 'text',
      quickReplies: ['View Invoices', 'Payment Link', 'Tax Help', 'Reports']
    };
  }

  private handleStatements(from: string): WhatsAppResponse {
    return {
      to: from,
      message: `📋 *Account Statement*

I can generate your account statement for any period.

Please specify:
• Start date
• End date
• Format (PDF/Excel)

Or reply with "last month" for last month's statement.`,
      type: 'text',
      quickReplies: ['This Month', 'Last Month', 'Last Quarter', 'Custom Range']
    };
  }

  private handleDefault(from: string): WhatsAppResponse {
    return {
      to: from,
      message: `🤔 I didn't understand that.

I can help you with:
• 📄 Invoice management
• 💰 Payment processing
• 📊 Financial reports
• 🧮 Tax calculations

What would you like to do?`,
      type: 'text',
      quickReplies: ['View Invoices', 'Payment Link', 'Tax Help', 'Reports']
    };
  }

  private containsAny(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }
}

export default WhatsAppAI;