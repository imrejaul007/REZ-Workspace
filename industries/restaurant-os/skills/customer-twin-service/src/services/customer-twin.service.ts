import { CustomerTwin } from '../models/customer-twin.model';
import {
  CreateCustomerTwinRequest,
  CreateCustomerTwinResponse,
  GetCustomerTwinResponse,
  UpdatePreferencesRequest,
  RecordVisitRequest,
  UpdateLoyaltyRequest,
  LoyaltyTier,
  ChurnRisk
} from '../schemas/customer-twin.schema';
import { logger } from '../utils/logger';
import { messageBroker } from '../utils/message-broker';

export class CustomerTwinService {
  async createCustomerTwin(request: CreateCustomerTwinRequest): Promise<CreateCustomerTwinResponse> {
    const twinId = `twin.restaurant.customer.${request.customerId}`;
    logger.info('Creating Customer Twin', { customerId: request.customerId });

    const existingTwin = await CustomerTwin.findByCustomerId(request.customerId);
    if (existingTwin) {
      throw new Error(`Customer Twin already exists for customerId: ${request.customerId}`);
    }

    const customerTwin = new CustomerTwin({
      twinId,
      customerId: request.customerId,
      profile: {
        name: request.name,
        phone: request.phone,
        email: request.email,
        firstVisit: new Date().toISOString()
      },
      visitHistory: [],
      loyalty: {
        currentTier: LoyaltyTier.BRONZE,
        pointsBalance: 0,
        lifetimePoints: 0,
        pointsValue: 0
      },
      sentiment: {
        avgRating: 0,
        feedbackCount: 0
      },
      lifetimeValue: {
        clv: 0,
        churnRisk: ChurnRisk.LOW
      }
    });

    await customerTwin.save();

    await messageBroker.publish('restaurant.customer.created', {
      twinId,
      customerId: request.customerId,
      twinOsEntityId: twinId,
      timestamp: new Date().toISOString()
    });

    return {
      twinId,
      customerId: request.customerId,
      twinOsEntityId: twinId,
      createdAt: customerTwin.createdAt.toISOString()
    };
  }

  async getCustomerTwin(customerId: string): Promise<GetCustomerTwinResponse> {
    logger.info('Fetching Customer Twin', { customerId });
    const customerTwin = await CustomerTwin.findByCustomerId(customerId);
    if (!customerTwin) {
      throw new Error(`Customer Twin not found for customerId: ${customerId}`);
    }
    return customerTwin.toJSON() as GetCustomerTwinResponse;
  }

  async updatePreferences(customerId: string, request: UpdatePreferencesRequest): Promise<void> {
    logger.info('Updating Customer Twin preferences', { customerId });
    const customerTwin = await CustomerTwin.findByCustomerId(customerId);
    if (!customerTwin) {
      throw new Error(`Customer Twin not found for customerId: ${customerId}`);
    }

    if (request.dietary) {
      customerTwin.preferences.dietary = request.dietary;
    }
    if (request.favoriteItems) {
      customerTwin.preferences.favoriteItems = request.favoriteItems;
    }
    if (request.preferredPayment) {
      customerTwin.preferences.preferredPayment = request.preferredPayment;
    }
    if (request.preferredOrderType) {
      customerTwin.preferences.preferredOrderType = request.preferredOrderType;
    }

    await customerTwin.save();
    await messageBroker.publish('restaurant.customer.preferences.updated', {
      twinId: customerTwin.twinId,
      customerId,
      timestamp: new Date().toISOString()
    });
  }

  async recordVisit(customerId: string, request: RecordVisitRequest): Promise<void> {
    logger.info('Recording customer visit', { customerId, restaurantId: request.restaurantId });
    const customerTwin = await CustomerTwin.findByCustomerId(customerId);
    if (!customerTwin) {
      throw new Error(`Customer Twin not found for customerId: ${customerId}`);
    }

    const existingVisit = customerTwin.visitHistory.find(v => v.restaurantId === request.restaurantId);
    if (existingVisit) {
      existingVisit.visitCount += 1;
      existingVisit.lastVisit = new Date().toISOString();
      existingVisit.avgOrderValue = ((existingVisit.avgOrderValue * (existingVisit.visitCount - 1)) + request.orderValue) / existingVisit.visitCount;
      if (request.items) {
        existingVisit.favoriteItems = [...new Set([...existingVisit.favoriteItems, ...request.items])].slice(0, 10);
      }
    } else {
      customerTwin.visitHistory.push({
        restaurantId: request.restaurantId,
        visitCount: 1,
        lastVisit: new Date().toISOString(),
        avgOrderValue: request.orderValue,
        favoriteItems: request.items || []
      });
    }

    // Update CLV
    customerTwin.lifetimeValue.clv = customerTwin.visitHistory.reduce((sum, v) => sum + (v.avgOrderValue * v.visitCount), 0);

    // Update churn risk
    const lastVisitDate = new Date(existingVisit?.lastVisit || customerTwin.profile.firstVisit || new Date());
    const daysSinceLastVisit = Math.floor((Date.now() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceLastVisit > 90) {
      customerTwin.lifetimeValue.churnRisk = ChurnRisk.HIGH;
    } else if (daysSinceLastVisit > 60) {
      customerTwin.lifetimeValue.churnRisk = ChurnRisk.MEDIUM;
    } else {
      customerTwin.lifetimeValue.churnRisk = ChurnRisk.LOW;
    }

    await customerTwin.save();
    await messageBroker.publish('restaurant.customer.visit.recorded', {
      twinId: customerTwin.twinId,
      customerId,
      restaurantId: request.restaurantId,
      timestamp: new Date().toISOString()
    });
  }

  async updateLoyalty(customerId: string, request: UpdateLoyaltyRequest): Promise<void> {
    logger.info('Updating customer loyalty', { customerId });
    const customerTwin = await CustomerTwin.findByCustomerId(customerId);
    if (!customerTwin) {
      throw new Error(`Customer Twin not found for customerId: ${customerId}`);
    }

    if (request.pointsEarned) {
      customerTwin.loyalty.pointsBalance += request.pointsEarned;
      customerTwin.loyalty.lifetimePoints += request.pointsEarned;
      customerTwin.loyalty.pointsValue = customerTwin.loyalty.pointsBalance / 100;
    }

    if (request.pointsRedeemed) {
      customerTwin.loyalty.pointsBalance = Math.max(0, customerTwin.loyalty.pointsBalance - request.pointsRedeemed);
      customerTwin.loyalty.pointsValue = customerTwin.loyalty.pointsBalance / 100;
    }

    if (request.tier) {
      customerTwin.loyalty.currentTier = request.tier;
    }

    await customerTwin.save();
    await messageBroker.publish('restaurant.customer.loyalty.updated', {
      twinId: customerTwin.twinId,
      customerId,
      loyalty: customerTwin.loyalty,
      timestamp: new Date().toISOString()
    });
  }

  async deleteCustomerTwin(customerId: string): Promise<void> {
    logger.info('Deleting Customer Twin', { customerId });
    const result = await CustomerTwin.deleteOne({ customerId });
    if (result.deletedCount === 0) {
      throw new Error(`Customer Twin not found for customerId: ${customerId}`);
    }
    await messageBroker.publish('restaurant.customer.deleted', { customerId, timestamp: new Date().toISOString() });
  }
}

export const customerTwinService = new CustomerTwinService();