import { v4 as uuidv4 } from 'uuid';
import { Negotiation, INegotiation, IParty, IOffer, ICounterOffer } from '../models/Negotiation';
import { logger } from '../utils/logger';
import { publishEvent } from './eventBus';

// ============================================
// TYPES
// ============================================

export interface CreateNegotiationDto {
  title: string;
  description?: string;
  type: 'rfq' | 'quote' | 'counter' | 'deal';
  buyer: Omit<IParty, 'id'>;
  seller?: Omit<IParty, 'id'>;
  product: {
    name: string;
    description?: string;
    quantity: number;
    unit: string;
    specifications?: Record<string, unknown>;
  };
  targetPrice?: number;
  currency?: string;
  terms?: string[];
  deadline?: Date;
  createdBy: string;
  tenantId: string;
}

export interface NegotiationQuery {
  tenantId: string;
  status?: string;
  type?: string;
  buyerId?: string;
  sellerId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ============================================
// NEGOTIATION SERVICE
// ============================================

export class NegotiationService {

  /**
   * Create a new negotiation
   */
  async create(dto: CreateNegotiationDto): Promise<INegotiation> {
    const negotiationId = `NEG-${uuidv4().substring(0, 8).toUpperCase()}`;

    const negotiation = new Negotiation({
      negotiationId,
      title: dto.title,
      description: dto.description,
      type: dto.type,
      status: 'initiated',
      buyer: { ...dto.buyer, id: uuidv4() },
      seller: dto.seller ? { ...dto.seller, id: uuidv4() } : undefined,
      product: dto.product,
      targetPrice: dto.targetPrice,
      currency: dto.currency || 'INR',
      terms: dto.terms || [],
      acceptedTerms: [],
      offerHistory: [],
      counterOffers: [],
      deadline: dto.deadline,
      startedAt: new Date(),
      createdBy: dto.createdBy,
      tenantId: dto.tenantId,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      },
      auditTrail: [{
        action: 'created',
        performedBy: dto.createdBy,
        performedAt: new Date(),
        details: 'Negotiation initiated'
      }]
    });

    await negotiation.save();

    logger.info('negotiation_created', {
      negotiationId,
      tenantId: dto.tenantId,
      type: dto.type
    });

    // Publish event
    await publishEvent('negotiation.created', {
      negotiationId,
      type: dto.type,
      buyer: dto.buyer.email,
      seller: dto.seller?.email,
      product: dto.product.name
    });

    return negotiation;
  }

  /**
   * Find negotiation by ID
   */
  async findById(negotiationId: string, tenantId: string): Promise<INegotiation | null> {
    return Negotiation.findOne({ negotiationId, tenantId });
  }

  /**
   * Find all negotiations with filters
   */
  async findAll(query: NegotiationQuery): Promise<{ negotiations: INegotiation[]; total: number }> {
    const { tenantId, status, type, buyerId, sellerId, search, page = 1, limit = 20 } = query;

    const filter: Record<string, unknown> = { tenantId };

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (buyerId) filter['buyer.id'] = buyerId;
    if (sellerId) filter['seller.id'] = sellerId;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'product.name': { $regex: search, $options: 'i' } },
        { negotiationId: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [negotiations, total] = await Promise.all([
      Negotiation.find(filter).sort({ startedAt: -1 }).skip(skip).limit(limit),
      Negotiation.countDocuments(filter)
    ]);

    return { negotiations, total };
  }

  /**
   * Send RFQ to sellers
   */
  async sendRFQ(negotiationId: string, tenantId: string, seller: Omit<IParty, 'id'>): Promise<INegotiation | null> {
    const negotiation = await Negotiation.findOne({ negotiationId, tenantId });
    if (!negotiation) return null;

    negotiation.seller = { ...seller, id: uuidv4() };
    negotiation.status = 'rfq_sent';
    negotiation.metadata.updatedAt = new Date();
    negotiation.metadata.version += 1;
    negotiation.auditTrail.push({
      action: 'rfq_sent',
      performedBy: 'system',
      performedAt: new Date(),
      details: `RFQ sent to ${seller.name}`
    });

    await negotiation.save();

    logger.info('rfq_sent', { negotiationId, seller: seller.email });

    await publishEvent('negotiation.rfq_sent', {
      negotiationId,
      seller: seller.email,
      product: negotiation.product.name
    });

    return negotiation;
  }

  /**
   * Submit quote
   */
  async submitQuote(
    negotiationId: string,
    tenantId: string,
    userId: string,
    offer: Omit<IOffer, 'id' | 'createdAt'>
  ): Promise<INegotiation | null> {
    const negotiation = await Negotiation.findOne({ negotiationId, tenantId });
    if (!negotiation) return null;

    const offerId = uuidv4();
    const newOffer: IOffer = {
      ...offer,
      id: offerId,
      createdAt: new Date()
    };

    negotiation.initialOffer = newOffer;
    negotiation.currentOffer = newOffer;
    negotiation.currentPrice = offer.amount;
    negotiation.offerHistory.push(newOffer);
    negotiation.status = 'quote_received';
    negotiation.metadata.updatedAt = new Date();
    negotiation.metadata.version += 1;
    negotiation.auditTrail.push({
      action: 'quote_received',
      performedBy: userId,
      performedAt: new Date(),
      details: `Quote received: ${offer.currency} ${offer.amount}`
    });

    await negotiation.save();

    logger.info('quote_received', {
      negotiationId,
      amount: offer.amount,
      currency: offer.currency
    });

    await publishEvent('negotiation.quote_received', {
      negotiationId,
      amount: offer.amount,
      currency: offer.currency
    });

    return negotiation;
  }

  /**
   * Submit counter offer
   */
  async submitCounterOffer(
    negotiationId: string,
    tenantId: string,
    userId: string,
    counterOffer: Omit<ICounterOffer, 'id' | 'createdAt'>
  ): Promise<INegotiation | null> {
    const negotiation = await Negotiation.findOne({ negotiationId, tenantId });
    if (!negotiation) return null;

    const offerId = uuidv4();
    const newCounterOffer: ICounterOffer = {
      ...counterOffer,
      id: offerId,
      createdAt: new Date()
    };

    negotiation.counterOffers.push(newCounterOffer);
    negotiation.currentOffer = {
      id: offerId,
      partyId: counterOffer.partyId,
      partyName: counterOffer.partyName,
      amount: counterOffer.amount,
      currency: counterOffer.currency,
      terms: counterOffer.terms,
      validUntil: counterOffer.validUntil,
      createdAt: new Date()
    };
    negotiation.currentPrice = counterOffer.amount;
    negotiation.status = 'negotiating';
    negotiation.metadata.updatedAt = new Date();
    negotiation.metadata.version += 1;
    negotiation.auditTrail.push({
      action: 'counter_offer',
      performedBy: userId,
      performedAt: new Date(),
      details: `Counter offer: ${counterOffer.currency} ${counterOffer.amount}`
    });

    await negotiation.save();

    logger.info('counter_offer_submitted', {
      negotiationId,
      amount: counterOffer.amount
    });

    await publishEvent('negotiation.counter_offer', {
      negotiationId,
      amount: counterOffer.amount,
      party: counterOffer.partyName
    });

    return negotiation;
  }

  /**
   * Accept negotiation (deal)
   */
  async accept(negotiationId: string, tenantId: string, userId: string): Promise<INegotiation | null> {
    const negotiation = await Negotiation.findOne({ negotiationId, tenantId });
    if (!negotiation) return null;

    negotiation.status = 'accepted';
    negotiation.completedAt = new Date();
    negotiation.acceptedTerms = negotiation.terms;
    negotiation.metadata.updatedAt = new Date();
    negotiation.metadata.version += 1;
    negotiation.auditTrail.push({
      action: 'accepted',
      performedBy: userId,
      performedAt: new Date(),
      details: `Deal accepted at ${negotiation.currentPrice} ${negotiation.currency}`
    });

    await negotiation.save();

    logger.info('negotiation_accepted', {
      negotiationId,
      finalPrice: negotiation.currentPrice
    });

    await publishEvent('negotiation.accepted', {
      negotiationId,
      finalPrice: negotiation.currentPrice,
      currency: negotiation.currency
    });

    return negotiation;
  }

  /**
   * Reject negotiation
   */
  async reject(negotiationId: string, tenantId: string, userId: string, reason?: string): Promise<INegotiation | null> {
    const negotiation = await Negotiation.findOne({ negotiationId, tenantId });
    if (!negotiation) return null;

    negotiation.status = 'rejected';
    negotiation.completedAt = new Date();
    negotiation.metadata.updatedAt = new Date();
    negotiation.metadata.version += 1;
    negotiation.auditTrail.push({
      action: 'rejected',
      performedBy: userId,
      performedAt: new Date(),
      details: reason || 'Negotiation rejected'
    });

    await negotiation.save();

    logger.info('negotiation_rejected', { negotiationId, reason });

    await publishEvent('negotiation.rejected', {
      negotiationId,
      reason
    });

    return negotiation;
  }

  /**
   * Cancel negotiation
   */
  async cancel(negotiationId: string, tenantId: string, userId: string): Promise<INegotiation | null> {
    const negotiation = await Negotiation.findOne({ negotiationId, tenantId });
    if (!negotiation) return null;

    negotiation.status = 'cancelled';
    negotiation.completedAt = new Date();
    negotiation.metadata.updatedAt = new Date();
    negotiation.metadata.version += 1;
    negotiation.auditTrail.push({
      action: 'cancelled',
      performedBy: userId,
      performedAt: new Date(),
      details: 'Negotiation cancelled'
    });

    await negotiation.save();

    logger.info('negotiation_cancelled', { negotiationId });

    await publishEvent('negotiation.cancelled', { negotiationId });

    return negotiation;
  }

  /**
   * Add terms to negotiation
   */
  async addTerms(negotiationId: string, tenantId: string, terms: string[]): Promise<INegotiation | null> {
    const negotiation = await Negotiation.findOne({ negotiationId, tenantId });
    if (!negotiation) return null;

    negotiation.terms = [...negotiation.terms, ...terms];
    negotiation.metadata.updatedAt = new Date();
    negotiation.metadata.version += 1;

    await negotiation.save();

    return negotiation;
  }

  /**
   * Get negotiation history
   */
  async getHistory(negotiationId: string, tenantId: string): Promise<INegotiation | null> {
    return Negotiation.findOne({ negotiationId, tenantId });
  }
}

export const negotiationService = new NegotiationService();
