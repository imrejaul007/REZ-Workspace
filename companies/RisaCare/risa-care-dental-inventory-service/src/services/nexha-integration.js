/**
 * Nexha Integration Service
 *
 * Connects dental inventory to Nexha ProcurementOS:
 * - Auto-create RFQ for low stock
 * - Compare quotes from suppliers
 * - Place orders
 * - Track deliveries
 */

const axios = require('axios');

const NEXHA_PROCUREMENT = process.env.NEXHA_PROCUREMENT || 'http://localhost:4320';

class NexhaIntegration {
  constructor() {
    this.client = axios.create({
      baseURL: NEXHA_PROCUREMENT,
      timeout: 30000
    });
  }

  /**
   * Create RFQ for dental supplies
   */
  async createRFQ(items, clinicId) {
    try {
      const response = await this.client.post('/api/rfq', {
        title: `Dental Supplies Order - ${clinicId}`,
        category: 'dental_supplies',
        items: items.map(item => ({
          sku: item.sku,
          name: item.name,
          quantity: item.reorderQuantity,
          specifications: { category: item.category }
        })),
        buyerId: clinicId,
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        paymentTerms: 'net_30'
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create RFQ:', error.message);
      return null;
    }
  }

  /**
   * Get quotes from suppliers
   */
  async getQuotes(rfqId) {
    try {
      const response = await this.client.get(`/api/rfq/${rfqId}/quotes`);
      return response.data;
    } catch (error) {
      console.error('Failed to get quotes:', error.message);
      return null;
    }
  }

  /**
   * Accept quote and create order
   */
  async createOrder(quoteId, items) {
    try {
      const response = await this.client.post('/api/orders', {
        quoteId,
        items,
        paymentMethod: 'wallet',
        deliveryAddress: items[0]?.deliveryAddress
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create order:', error.message);
      return null;
    }
  }

  /**
   * Track delivery
   */
  async trackDelivery(orderId) {
    try {
      const response = await this.client.get(`/api/orders/${orderId}/tracking`);
      return response.data;
    } catch (error) {
      console.error('Failed to track delivery:', error.message);
      return null;
    }
  }

  /**
   * Find dental suppliers
   */
  async findSuppliers(category) {
    try {
      const response = await this.client.get('/api/suppliers', {
        params: { category, rating: 4 }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to find suppliers:', error.message);
      return null;
    }
  }
}

async function triggerAutoReorder(item) {
  const nexha = new NexhaIntegration();

  // Create RFQ
  const rfq = await nexha.createRFQ([item], item.clinicId);

  if (rfq && rfq.id) {
    // Wait for quotes (in production, use webhooks)
    setTimeout(async () => {
      const quotes = await nexha.getQuotes(rfq.id);

      if (quotes && quotes.length > 0) {
        // Accept best quote
        const bestQuote = quotes.sort((a, b) => a.price - b.price)[0];
        const order = await nexha.createOrder(bestQuote.id, [item]);

        if (order) {
          console.log(`Order placed: ${order.id} for ${item.name}`);
        }
      }
    }, 5000); // 5 second delay for demo
  }
}

module.exports = {
  NexhaIntegration,
  triggerAutoReorder
};
