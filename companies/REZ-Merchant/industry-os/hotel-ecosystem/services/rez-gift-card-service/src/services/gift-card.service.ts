import { v4 as uuidv4 } from 'uuid';

export interface GiftCard {
  cardId: string;
  cardNumber: string;
  pin: string;
  hotelId: string;
  type: 'fixed' | 'variable';
  initialValue: number;
  currentBalance: number;
  currency: string;
  status: 'active' | 'sold' | 'redeemed' | 'expired' | 'cancelled';
  purchasedBy?: string;
  purchasedAt?: Date;
  recipientEmail?: string;
  recipientName?: string;
  message?: string;
  validFrom: Date;
  validUntil: Date;
  transactionHistory: GiftCardTransaction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GiftCardTransaction {
  transactionId: string;
  type: 'load' | 'redeem' | 'refund' | 'expire';
  amount: number;
  balanceAfter: number;
  referenceType?: 'booking' | 'fnb' | 'spa' | 'other';
  referenceId?: string;
  description?: string;
  processedBy?: string;
  createdAt: Date;
}

export interface GiftCardSale {
  saleId: string;
  cardId: string;
  cardNumber: string;
  amount: number;
  currency: string;
  recipientName?: string;
  recipientEmail?: string;
  senderName: string;
  senderEmail: string;
  message?: string;
  paymentMethod: 'card' | 'upi' | 'cash';
  paymentReference?: string;
  status: 'pending' | 'completed' | 'refunded';
  createdAt: Date;
}

export class GiftCardService {
  private cards: Map<string, GiftCard> = new Map();
  private sales: Map<string, GiftCardSale> = new Map();

  // Generate card number (16 digits)
  private generateCardNumber(): string {
    const prefix = '6'; // REZ gift card prefix
    let number = prefix;
    for (let i = 0; i < 15; i++) {
      number += Math.floor(Math.random() * 10);
    }
    return number;
  }

  // Generate PIN (4 digits)
  private generatePIN(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  async createCard(
    hotelId: string,
    type: 'fixed' | 'variable',
    value: number,
    validFrom: Date = new Date(),
    validUntil?: Date
  ): Promise<GiftCard> {
    const cardId = uuidv4();
    const cardNumber = this.generateCardNumber();
    const pin = this.generatePIN();

    const defaultExpiry = new Date();
    defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1);

    const card: GiftCard = {
      cardId,
      cardNumber,
      pin,
      hotelId,
      type,
      initialValue: value,
      currentBalance: type === 'fixed' ? value : 0,
      currency: 'INR',
      status: 'active',
      validFrom,
      validUntil: validUntil || defaultExpiry,
      transactionHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.cards.set(cardId, card);
    return card;
  }

  async getCard(cardId: string): Promise<GiftCard | null>;
  async getCard(cardNumber: string, pin?: string): Promise<GiftCard | null>;
  async getCard(identifier: string, pin?: string): Promise<GiftCard | null> {
    let card: GiftCard | undefined;

    if (identifier.length === 16 && /^\d+$/.test(identifier)) {
      card = Array.from(this.cards.values()).find(c => c.cardNumber === identifier);
    } else {
      card = this.cards.get(identifier);
    }

    if (!card) return null;

    // Validate PIN if provided
    if (pin && card.pin !== pin) {
      return null;
    }

    return card;
  }

  async loadCard(cardId: string, amount: number, processedBy?: string): Promise<GiftCard> {
    const card = this.cards.get(cardId);
    if (!card) throw new Error('Gift card not found');
    if (card.status !== 'active' && card.status !== 'sold') {
      throw new Error('Card is not active');
    }

    const transactionId = uuidv4();
    card.currentBalance += amount;
    card.transactionHistory.push({
      transactionId,
      type: 'load',
      amount,
      balanceAfter: card.currentBalance,
      processedBy,
      createdAt: new Date(),
    });
    card.updatedAt = new Date();

    this.cards.set(cardId, card);
    return card;
  }

  async redeemCard(
    cardId: string,
    amount: number,
    referenceType: 'booking' | 'fnb' | 'spa' | 'other',
    referenceId?: string,
    processedBy?: string
  ): Promise<{ success: boolean; card: GiftCard; transaction: GiftCardTransaction }> {
    const card = this.cards.get(cardId);
    if (!card) throw new Error('Gift card not found');
    if (card.status !== 'active' && card.status !== 'sold') {
      throw new Error('Card is not active');
    }
    if (new Date() > card.validUntil) {
      card.status = 'expired';
      this.cards.set(cardId, card);
      throw new Error('Card has expired');
    }
    if (card.currentBalance < amount) {
      throw new Error(`Insufficient balance. Available: ₹${card.currentBalance}`);
    }

    const transactionId = uuidv4();
    card.currentBalance -= amount;
    const transaction: GiftCardTransaction = {
      transactionId,
      type: 'redeem',
      amount,
      balanceAfter: card.currentBalance,
      referenceType,
      referenceId,
      processedBy,
      createdAt: new Date(),
    };
    card.transactionHistory.push(transaction);
    card.updatedAt = new Date();

    if (card.currentBalance === 0 && card.type === 'fixed') {
      card.status = 'redeemed';
    }

    this.cards.set(cardId, card);
    return { success: true, card, transaction };
  }

  async sellCard(
    hotelId: string,
    amount: number,
    type: 'fixed' | 'variable',
    senderName: string,
    senderEmail: string,
    paymentMethod: 'card' | 'upi' | 'cash',
    recipientName?: string,
    recipientEmail?: string,
    message?: string
  ): Promise<{ sale: GiftCardSale; card: GiftCard }> {
    const card = await this.createCard(hotelId, type, amount);
    card.status = 'sold';
    card.purchasedBy = senderEmail;
    card.purchasedAt = new Date();
    card.recipientEmail = recipientEmail;
    card.recipientName = recipientName;
    card.message = message;

    if (type === 'variable') {
      await this.loadCard(card.cardId, amount, 'initial_purchase');
    }

    const saleId = uuidv4();
    const sale: GiftCardSale = {
      saleId,
      cardId: card.cardId,
      cardNumber: card.cardNumber,
      amount,
      currency: 'INR',
      recipientName,
      recipientEmail,
      senderName,
      senderEmail,
      message,
      paymentMethod,
      status: 'completed',
      createdAt: new Date(),
    };

    this.sales.set(saleId, sale);
    this.cards.set(card.cardId, card);

    return { sale, card };
  }

  async validateCard(cardNumber: string, pin: string): Promise<{
    valid: boolean;
    card?: GiftCard;
    error?: string;
  }> {
    const card = await this.getCard(cardNumber);

    if (!card) {
      return { valid: false, error: 'Invalid card number' };
    }

    if (card.pin !== pin) {
      return { valid: false, error: 'Invalid PIN' };
    }

    if (card.status === 'expired') {
      return { valid: false, error: 'Card has expired' };
    }

    if (card.status === 'cancelled') {
      return { valid: false, error: 'Card has been cancelled' };
    }

    if (new Date() > card.validUntil) {
      return { valid: false, error: 'Card has expired' };
    }

    return { valid: true, card };
  }

  async cancelCard(cardId: string): Promise<GiftCard> {
    const card = this.cards.get(cardId);
    if (!card) throw new Error('Gift card not found');

    card.status = 'cancelled';
    card.updatedAt = new Date();
    this.cards.set(cardId, card);

    return card;
  }

  async getCardBalance(cardNumber: string, pin: string): Promise<number> {
    const validation = await this.validateCard(cardNumber, pin);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    return validation.card!.currentBalance;
  }

  async getHotelCards(hotelId: string, status?: GiftCard['status']): Promise<GiftCard[]> {
    let cards = Array.from(this.cards.values()).filter(c => c.hotelId === hotelId);
    if (status) {
      cards = cards.filter(c => c.status === status);
    }
    return cards;
  }

  async getSalesReport(hotelId: string, startDate?: Date, endDate?: Date): Promise<{
    totalSales: number;
    totalValue: number;
    totalRedeemed: number;
    totalBalance: number;
    byDenomination: { amount: number; count: number }[];
  }> {
    let sales = Array.from(this.sales.values());

    if (startDate) {
      sales = sales.filter(s => s.createdAt >= startDate);
    }
    if (endDate) {
      sales = sales.filter(s => s.createdAt <= endDate);
    }

    const totalSales = sales.length;
    const totalValue = sales.reduce((sum, s) => sum + s.amount, 0);

    const cards = await this.getHotelCards(hotelId);
    const totalRedeemed = cards
      .filter(c => c.status === 'redeemed')
      .reduce((sum, c) => sum + c.initialValue, 0);
    const totalBalance = cards
      .filter(c => c.status === 'active' || c.status === 'sold')
      .reduce((sum, c) => sum + c.currentBalance, 0);

    // Group by denomination
    const byDenom = new Map<number, number>();
    sales.forEach(s => {
      byDenom.set(s.amount, (byDenom.get(s.amount) || 0) + 1);
    });
    const byDenomination = Array.from(byDenom.entries())
      .map(([amount, count]) => ({ amount, count }))
      .sort((a, b) => b.amount - a.amount);

    return { totalSales, totalValue, totalRedeemed, totalBalance, byDenomination };
  }
}
