import { v4 as uuidv4 } from 'uuid';
import { DealNegotiation, IDealNegotiation, IDealNegotiationDocument } from '../models/DealNegotiation';
import { Deal } from '../models/Deal';
import { logger } from '../utils/logger';

interface CreateNegotiationParams {
  party: 'buyer' | 'seller';
  partyId: string;
  price: {
    amount: number;
    currency?: string;
    model?: 'cpm' | 'cpc' | 'cpa' | 'cpv' | 'flat_rate';
  };
  impressions: {
    guaranteed: number;
    total: number;
  };
  message?: string;
  terms?: {
    pacing?: string;
    targeting?: any;
    restrictions?: any;
  };
}

export const negotiationService = {
  async createNegotiation(dealId: string, initialOffer: CreateNegotiationParams): Promise<IDealNegotiationDocument> {
    const negotiationId = uuidv4();
    const timestamp = new Date().toISOString();

    const negotiation = new DealNegotiation({
      dealId,
      status: 'pending',
      offers: [
        {
          id: uuidv4(),
          party: initialOffer.party,
          partyId: initialOffer.partyId,
          price: {
            amount: initialOffer.price.amount,
            currency: initialOffer.price.currency || 'USD',
            model: initialOffer.price.model || 'cpm',
          },
          impressions: initialOffer.impressions,
          terms: initialOffer.terms || {},
          message: initialOffer.message,
          timestamp,
        },
      ],
      counteroffers: [],
      currentRound: 1,
      maxRounds: 5,
      negotiationHistory: [
        {
          action: 'negotiation_started',
          party: initialOffer.party,
          details: { offerId: uuidv4(), price: initialOffer.price },
          timestamp,
        },
      ],
    });

    await negotiation.save();
    logger.info('Negotiation created', { dealId, negotiationId });
    return negotiation;
  },

  async getNegotiation(dealId: string): Promise<IDealNegotiationDocument | null> {
    return DealNegotiation.findOne({ dealId }).sort({ createdAt: -1 });
  },

  async getNegotiationsByDealId(dealId: string): Promise<IDealNegotiationDocument[]> {
    return DealNegotiation.find({ dealId }).sort({ createdAt: -1 });
  },

  async addOffer(
    dealId: string,
    offer: CreateNegotiationParams
  ): Promise<IDealNegotiationDocument | null> {
    const negotiation = await DealNegotiation.findOne({ dealId }).sort({ createdAt: -1 });
    if (!negotiation) return null;

    if (negotiation.status === 'accepted' || negotiation.status === 'rejected' || negotiation.status === 'expired') {
      throw new Error(`Cannot add offer to negotiation with status: ${negotiation.status}`);
    }

    if (negotiation.currentRound >= negotiation.maxRounds) {
      throw new Error('Maximum negotiation rounds reached');
    }

    const newOffer = {
      id: uuidv4(),
      party: offer.party,
      partyId: offer.partyId,
      price: {
        amount: offer.price.amount,
        currency: offer.price.currency || 'USD',
        model: offer.price.model || 'cpm',
      },
      impressions: offer.impressions,
      terms: offer.terms || {},
      message: offer.message,
      timestamp: new Date().toISOString(),
    };

    await negotiation.addOffer(newOffer);
    logger.info('Offer added to negotiation', { dealId, offerId: newOffer.id });
    return negotiation;
  },

  async createCounteroffer(
    dealId: string,
    originalOfferId: string,
    counteroffer: {
      party: 'buyer' | 'seller';
      partyId: string;
      changes: Record<string, any>;
      message?: string;
    }
  ): Promise<IDealNegotiationDocument | null> {
    const negotiation = await DealNegotiation.findOne({ dealId }).sort({ createdAt: -1 });
    if (!negotiation) return null;

    if (negotiation.status === 'accepted' || negotiation.status === 'rejected' || negotiation.status === 'expired') {
      throw new Error(`Cannot add counteroffer to negotiation with status: ${negotiation.status}`);
    }

    if (negotiation.currentRound >= negotiation.maxRounds) {
      throw new Error('Maximum negotiation rounds reached');
    }

    const newCounteroffer = {
      id: uuidv4(),
      originalOfferId,
      party: counteroffer.party,
      partyId: counteroffer.partyId,
      changes: counteroffer.changes,
      message: counteroffer.message,
      timestamp: new Date().toISOString(),
    };

    await negotiation.addCounteroffer(newCounteroffer);
    logger.info('Counteroffer created', { dealId, counterofferId: newCounteroffer.id });
    return negotiation;
  },

  async acceptNegotiation(dealId: string, acceptedTerms?: any): Promise<IDealNegotiationDocument | null> {
    const negotiation = await DealNegotiation.findOne({ dealId }).sort({ createdAt: -1 });
    if (!negotiation) return null;

    await negotiation.accept(acceptedTerms || negotiation.offers[negotiation.offers.length - 1]);

    // Update deal status
    await Deal.findOneAndUpdate({ dealId }, { status: 'pending' });

    logger.info('Negotiation accepted', { dealId });
    return negotiation;
  },

  async rejectNegotiation(dealId: string, reason: string): Promise<IDealNegotiationDocument | null> {
    const negotiation = await DealNegotiation.findOne({ dealId }).sort({ createdAt: -1 });
    if (!negotiation) return null;

    await negotiation.reject(reason);
    logger.info('Negotiation rejected', { dealId, reason });
    return negotiation;
  },

  async expireNegotiation(dealId: string): Promise<IDealNegotiationDocument | null> {
    const negotiation = await DealNegotiation.findOne({ dealId }).sort({ createdAt: -1 });
    if (!negotiation) return null;

    await negotiation.expire();
    logger.info('Negotiation expired', { dealId });
    return negotiation;
  },

  async withdrawNegotiation(dealId: string, partyId: string): Promise<IDealNegotiationDocument | null> {
    const negotiation = await DealNegotiation.findOne({ dealId }).sort({ createdAt: -1 });
    if (!negotiation) return null;

    negotiation.status = 'withdrawn';
    negotiation.negotiationHistory.push({
      action: 'negotiation_withdrawn',
      party: partyId,
      details: {},
      timestamp: new Date().toISOString(),
    });

    await negotiation.save();
    logger.info('Negotiation withdrawn', { dealId, partyId });
    return negotiation;
  },

  async getNegotiationHistory(dealId: string): Promise<IDealNegotiationDocument['negotiationHistory'] | null> {
    const negotiation = await DealNegotiation.findOne({ dealId }).sort({ createdAt: -1 });
    return negotiation?.negotiationHistory || null;
  },

  async getActiveNegotiations(): Promise<IDealNegotiationDocument[]> {
    return DealNegotiation.find({ status: { $in: ['pending', 'in_progress', 'countered'] } }).sort({
      createdAt: -1,
    });
  },

  async getNegotiationsByStatus(status: IDealNegotiation['status']): Promise<IDealNegotiationDocument[]> {
    return DealNegotiation.find({ status }).sort({ createdAt: -1 });
  },

  async getNegotiationStats(): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    accepted: number;
    rejected: number;
    expired: number;
    withdrawn: number;
  }> {
    const stats = await DealNegotiation.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      total: 0,
      pending: 0,
      inProgress: 0,
      accepted: 0,
      rejected: 0,
      expired: 0,
      withdrawn: 0,
    };

    stats.forEach((stat) => {
      switch (stat._id) {
        case 'pending':
          result.pending = stat.count;
          break;
        case 'in_progress':
          result.inProgress = stat.count;
          break;
        case 'accepted':
          result.accepted = stat.count;
          break;
        case 'rejected':
          result.rejected = stat.count;
          break;
        case 'expired':
          result.expired = stat.count;
          break;
        case 'withdrawn':
          result.withdrawn = stat.count;
          break;
      }
      result.total += stat.count;
    });

    return result;
  },

  async checkAndExpireNegotiations(): Promise<number> {
    const expired = await DealNegotiation.updateMany(
      {
        status: { $in: ['pending', 'in_progress', 'countered'] },
        deadline: { $lt: new Date() },
      },
      { $set: { status: 'expired' } }
    );

    if (expired.modifiedCount > 0) {
      logger.info('Expired negotiations updated', { count: expired.modifiedCount });
    }

    return expired.modifiedCount;
  },
};