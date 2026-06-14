import { Quote, IQuote, ILineItem } from '../models/Quote';
import { winstonLogger } from '../config/logger';

class QuoteService {
  private generateQuoteNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `QT-${year}${month}-${random}`;
  }

  private calculateLineItemTotal(item: ILineItem): number {
    const subtotal = item.quantity * item.unitPrice;
    const discountAmount = (subtotal * (item.discount || 0)) / 100;
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = (afterDiscount * (item.tax || 0)) / 100;
    return afterDiscount + taxAmount;
  }

  private calculateTotals(lineItems: ILineItem[], discountPercent?: number): {
    subtotal: number;
    discount: number;
    taxAmount: number;
    totalAmount: number;
  } {
    let subtotal = 0;
    lineItems.forEach(item => {
      const baseAmount = item.quantity * item.unitPrice;
      const discountAmount = (baseAmount * (item.discount || 0)) / 100;
      subtotal += baseAmount - discountAmount;
    });

    const discount = discountPercent || 0;
    const discountAmount = (subtotal * discount) / 100;
    const afterDiscount = subtotal - discountAmount;
    const taxRate = 18; // GST
    const taxAmount = (afterDiscount * taxRate) / 100;
    const totalAmount = afterDiscount + taxAmount;

    return { subtotal, discount: discountAmount, taxAmount, totalAmount };
  }

  async getAllQuotes(): Promise<IQuote[]> {
    try {
      return await Quote.find().sort({ createdAt: -1 });
    } catch (error) {
      winstonLogger.error('Error fetching quotes:', error);
      throw error;
    }
  }

  async getQuoteById(id: string): Promise<IQuote | null> {
    try {
      return await Quote.findById(id);
    } catch (error) {
      winstonLogger.error('Error fetching quote:', error);
      throw error;
    }
  }

  async getQuoteByNumber(quoteNumber: string): Promise<IQuote | null> {
    try {
      return await Quote.findOne({ quoteNumber });
    } catch (error) {
      winstonLogger.error('Error fetching quote by number:', error);
      throw error;
    }
  }

  async createQuote(data: Partial<IQuote>): Promise<IQuote> {
    try {
      const lineItems = data.lineItems?.map(item => ({
        ...item,
        total: this.calculateLineItemTotal(item)
      })) || [];

      const { subtotal, discount, taxAmount, totalAmount } = this.calculateTotals(
        lineItems,
        data.discount
      );

      const quote = new Quote({
        ...data,
        quoteNumber: this.generateQuoteNumber(),
        lineItems,
        subtotal,
        discount,
        taxAmount,
        totalAmount,
        status: 'draft'
      });

      await quote.save();
      winstonLogger.info(`Quote created: ${quote.quoteNumber}`);
      return quote;
    } catch (error) {
      winstonLogger.error('Error creating quote:', error);
      throw error;
    }
  }

  async updateQuote(id: string, data: Partial<IQuote>): Promise<IQuote | null> {
    try {
      const existingQuote = await Quote.findById(id);
      if (!existingQuote) return null;

      if (existingQuote.status === 'accepted' || existingQuote.status === 'rejected') {
        throw new Error('Cannot update a quote that has been accepted or rejected');
      }

      let lineItems = existingQuote.lineItems;
      let subtotal = existingQuote.subtotal;
      let discount = existingQuote.discount || 0;
      let taxAmount = existingQuote.taxAmount || 0;
      let totalAmount = existingQuote.totalAmount;

      if (data.lineItems) {
        lineItems = data.lineItems.map(item => ({
          ...item,
          total: this.calculateLineItemTotal(item)
        }));
        const totals = this.calculateTotals(lineItems, data.discount || 0);
        subtotal = totals.subtotal;
        discount = totals.discount;
        taxAmount = totals.taxAmount;
        totalAmount = totals.totalAmount;
      } else if (data.discount !== undefined) {
        const totals = this.calculateTotals(lineItems, data.discount);
        discount = totals.discount;
        taxAmount = totals.taxAmount;
        totalAmount = totals.totalAmount;
      }

      const updatedQuote = await Quote.findByIdAndUpdate(
        id,
        {
          ...data,
          lineItems,
          subtotal,
          discount,
          taxAmount,
          totalAmount
        },
        { new: true }
      );

      winstonLogger.info(`Quote updated: ${id}`);
      return updatedQuote;
    } catch (error) {
      winstonLogger.error('Error updating quote:', error);
      throw error;
    }
  }

  async acceptQuote(id: string, acceptedBy?: string): Promise<IQuote | null> {
    try {
      const quote = await Quote.findById(id);
      if (!quote) return null;

      if (quote.status !== 'draft' && quote.status !== 'sent') {
        throw new Error('Quote cannot be accepted in current status');
      }

      if (new Date() > quote.validUntil) {
        throw new Error('Quote has expired');
      }

      const updatedQuote = await Quote.findByIdAndUpdate(
        id,
        {
          status: 'accepted',
          acceptedAt: new Date(),
          acceptedBy: acceptedBy || 'customer'
        },
        { new: true }
      );

      winstonLogger.info(`Quote accepted: ${quote.quoteNumber}`);
      return updatedQuote;
    } catch (error) {
      winstonLogger.error('Error accepting quote:', error);
      throw error;
    }
  }

  async rejectQuote(id: string, reason?: string): Promise<IQuote | null> {
    try {
      const quote = await Quote.findById(id);
      if (!quote) return null;

      const updatedQuote = await Quote.findByIdAndUpdate(
        id,
        {
          status: 'rejected',
          rejectedAt: new Date(),
          rejectionReason: reason
        },
        { new: true }
      );

      winstonLogger.info(`Quote rejected: ${quote.quoteNumber}`);
      return updatedQuote;
    } catch (error) {
      winstonLogger.error('Error rejecting quote:', error);
      throw error;
    }
  }

  async sendQuote(id: string): Promise<IQuote | null> {
    try {
      const quote = await Quote.findByIdAndUpdate(
        id,
        { status: 'sent' },
        { new: true }
      );
      winstonLogger.info(`Quote sent: ${id}`);
      return quote;
    } catch (error) {
      winstonLogger.error('Error sending quote:', error);
      throw error;
    }
  }

  async markExpiredQuotes(): Promise<number> {
    try {
      const result = await Quote.updateMany(
        {
          status: { $in: ['draft', 'sent'] },
          validUntil: { $lt: new Date() }
        },
        { status: 'expired' }
      );
      winstonLogger.info(`Marked ${result.modifiedCount} quotes as expired`);
      return result.modifiedCount;
    } catch (error) {
      winstonLogger.error('Error marking expired quotes:', error);
      throw error;
    }
  }

  async getQuotesByCustomer(email: string): Promise<IQuote[]> {
    try {
      return await Quote.find({ customerEmail: email }).sort({ createdAt: -1 });
    } catch (error) {
      winstonLogger.error('Error fetching customer quotes:', error);
      throw error;
    }
  }

  async getQuotesByStatus(status: string): Promise<IQuote[]> {
    try {
      return await Quote.find({ status }).sort({ createdAt: -1 });
    } catch (error) {
      winstonLogger.error('Error fetching quotes by status:', error);
      throw error;
    }
  }
}

export const quoteService = new QuoteService();