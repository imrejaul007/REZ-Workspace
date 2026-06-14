import { Offer } from '../models';

/**
 * Offer/Coupon Service for QR Cloud
 */
export class OfferService {

  /**
   * Create a new offer
   */
  async createOffer(merchantId: string, data: {
    name: string;
    description?: string;
    type: 'percentage' | 'flat' | 'buy_x_get_y' | 'free_item';
    value: number;
    minOrderValue?: number;
    maxDiscount?: number;
    startDate: Date;
    endDate: Date;
    usageLimit?: number;
  }): Promise<any> {
    const offer = new Offer({
      merchantId,
      name: data.name,
      description: data.description,
      type: data.type,
      value: data.value,
      minOrderValue: data.minOrderValue || 0,
      maxDiscount: data.maxDiscount,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      usageLimit: data.usageLimit,
      isActive: true,
      usedCount: 0,
    });

    await offer.save();
    return offer;
  }

  /**
   * Get offers for merchant
   */
  async getOffers(merchantId: string): Promise<any[]> {
    return Offer.find({ merchantId, isActive: true }).sort({ createdAt: -1 });
  }

  /**
   * Get active offer for customer
   */
  async getActiveOffers(merchantId: string): Promise<any[]> {
    const now = new Date();
    return Offer.find({
      merchantId,
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    });
  }

  /**
   * Apply offer to order
   */
  async applyOffer(offerId: string, orderSubtotal: number): Promise<{
    applied: boolean;
    discount: number;
    message: string;
  }> {
    const offer = await Offer.findById(offerId);

    if (!offer) {
      return { applied: false, discount: 0, message: 'Offer not found' };
    }

    if (!offer.isActive) {
      return { applied: false, discount: 0, message: 'Offer is no longer active' };
    }

    const now = new Date();
    if (now < offer.startDate || now > offer.endDate) {
      return { applied: false, discount: 0, message: 'Offer has expired or not yet started' };
    }

    if (offer.usageLimit && offer.usedCount >= offer.usageLimit) {
      return { applied: false, discount: 0, message: 'Offer usage limit reached' };
    }

    if (orderSubtotal < (offer.minOrderValue || 0)) {
      return { applied: false, discount: 0, message: `Minimum order value ₹${offer.minOrderValue} required` };
    }

    // Calculate discount
    let discount = 0;

    switch (offer.type) {
      case 'percentage':
        discount = Math.min(
          (orderSubtotal * offer.value) / 100,
          offer.maxDiscount || Infinity
        );
        break;
      case 'flat':
        discount = Math.min(offer.value, orderSubtotal);
        break;
      case 'buy_x_get_y':
        // For buy X get Y, discount is calculated differently
        discount = offer.value; // This should be enhanced based on items
        break;
      case 'free_item':
        discount = offer.value; // Value represents price of free item
        break;
    }

    discount = Math.round(discount);

    return {
      applied: true,
      discount,
      message: `${offer.name} applied! You save ₹${discount}`,
    };
  }

  /**
   * Redeem offer (increment usage)
   */
  async redeemOffer(offerId: string): Promise<void> {
    await Offer.findByIdAndUpdate(offerId, { $inc: { usedCount: 1 } });
  }

  /**
   * Deactivate offer
   */
  async deactivateOffer(offerId: string): Promise<void> {
    await Offer.findByIdAndUpdate(offerId, { isActive: false });
  }

  /**
   * Delete offer
   */
  async deleteOffer(offerId: string): Promise<void> {
    await Offer.findByIdAndDelete(offerId);
  }
}

export const offerService = new OfferService();
