/**
 * Store Entry Service
 * FreshMart 10AM Story: "Customer scans REZ QR at entrance → Shopping Twin activated"
 */

const { StoreEntry, CustomerSession } = require('../models/entry.model');

class StoreEntryService {

  /**
   * Record store entry via QR scan
   * FreshMart 10AM: "Customer scans REZ QR at entrance → Identity recognized"
   */
  async recordEntry(data) {
    const entry_id = `ENTRY-${Date.now().toString(36).toUpperCase()}`;
    const session_id = `SESS-${Date.now().toString(36).toUpperCase()}`;

    // Get customer profile from Shopping Twin
    const customerProfile = await this.getCustomerProfile(data.customer_id);

    // Create entry record
    const entry = new StoreEntry({
      entry_id,
      store_id: data.store_id,
      store_name: data.store_name,
      customer_id: data.customer_id,
      customer_name: customerProfile?.name,
      entry_method: data.entry_method || 'qr_scan',
      session_id,
      customer_profile: {
        loyalty_tier: customerProfile?.loyalty_tier,
        total_visits: customerProfile?.total_visits,
        last_visit: customerProfile?.last_visit,
        average_basket: customerProfile?.average_basket,
        favorite_categories: customerProfile?.favorite_categories
      },
      recognized_data: {
        loyalty: !!customerProfile?.loyalty_tier,
        karma: true,
        purchase_history: !!customerProfile?.total_visits,
        preferences: customerProfile?.favorite_categories?.length > 0
      }
    });

    await entry.save();

    // Create customer session
    const session = new CustomerSession({
      session_id,
      customer_id: data.customer_id,
      store_id: data.store_id,
      status: 'active'
    });
    await session.save();

    // Get personalized notifications
    const notifications = await this.getEntryNotifications(entry, customerProfile);

    return {
      entry,
      session,
      customerProfile,
      notifications
    };
  }

  /**
   * Get customer profile from Shopping Twin
   */
  async getCustomerProfile(customerId) {
    // In production, call Shopping Twin / Customer Twin service
    // Simulated response
    return {
      customer_id: customerId,
      name: 'Customer',
      loyalty_tier: 'Gold',
      total_visits: 45,
      last_visit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      average_basket: 850,
      favorite_categories: ['dairy', 'produce', 'snacks'],
      dietary_preferences: [],
      family_size: 3,
      has_baby: false
    };
  }

  /**
   * Get personalized notifications for entry
   */
  async getEntryNotifications(entry, customerProfile) {
    const notifications = [];

    // Welcome back notification
    notifications.push({
      type: 'welcome',
      title: `Welcome back!`,
      message: `Great to see you again. You have ${customerProfile.loyalty_tier} status.`,
      priority: 'normal'
    });

    // Favorite category promotion
    if (customerProfile.favorite_categories?.length > 0) {
      notifications.push({
        type: 'promotion',
        title: `${customerProfile.favorite_categories[0]} on sale!`,
        message: 'Your favorite category has special offers today.',
        priority: 'low'
      });
    }

    // Baby product reminder
    if (customerProfile.has_baby) {
      notifications.push({
        type: 'reminder',
        title: 'Baby wipes running low?',
        message: 'We have your usual baby products in stock.',
        priority: 'medium'
      });
    }

    // Low stock items from purchase history
    // In production, check purchase history and inventory
    notifications.push({
      type: 'reminder',
      title: 'Your usual items',
      message: 'Milk, Eggs, and Bread are stocked today.',
      priority: 'low'
    });

    return notifications;
  }

  /**
   * Record store exit
   */
  async recordExit(sessionId, exitData) {
    const session = await CustomerSession.findOne({ session_id: sessionId });
    if (!session) throw new Error('Session not found');

    session.exit_time = new Date();
    session.duration = Math.round((session.exit_time - session.entry_time) / 60000); // minutes
    session.status = exitData.status || 'completed';
    session.items_purchased = exitData.items || 0;
    session.total_spent = exitData.total_spent || 0;

    await session.save();

    // Update entry record
    await StoreEntry.findOneAndUpdate(
      { session_id: sessionId },
      {
        session_ended: session.exit_time,
        exit_method: exitData.exit_method,
        items_purchased: exitData.items,
        total_spent: exitData.total_spent
      }
    );

    return session;
  }

  /**
   * Get active session for customer
   */
  async getActiveSession(customerId) {
    return CustomerSession.findOne({
      customer_id: customerId,
      status: { $in: ['active', 'browsing'] }
    });
  }

  /**
   * Get store entry analytics
   */
  async getStoreAnalytics(storeId, date = new Date()) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [entries, sessions] = await Promise.all([
      StoreEntry.find({
        store_id: storeId,
        created_at: { $gte: startOfDay, $lte: endOfDay }
      }),
      CustomerSession.find({
        store_id: storeId,
        entry_time: { $gte: startOfDay, $lte: endOfDay }
      })
    ]);

    const completedSessions = sessions.filter(s => s.status === 'completed');
    const abandonedSessions = sessions.filter(s => s.status === 'abandoned');

    return {
      store_id: storeId,
      date: date.toISOString().split('T')[0],
      total_entries: entries.length,
      unique_customers: new Set(entries.map(e => e.customer_id)).size,
      total_sessions: sessions.length,
      completed_purchases: completedSessions.length,
      abandoned_sessions: abandonedSessions.length,
      conversion_rate: sessions.length > 0
        ? `${(completedSessions.length / sessions.length * 100).toFixed(1)}%`
        : '0%',
      average_dwell_time: sessions.length > 0
        ? `${Math.round(sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length)} min`
        : '0 min',
      average_basket: completedSessions.length > 0
        ? `₹${Math.round(completedSessions.reduce((sum, s) => sum + (s.cart_value || 0), 0) / completedSessions.length)}`
        : '₹0',
      total_revenue: completedSessions.reduce((sum, s) => sum + (s.cart_value || 0), 0)
    };
  }

  /**
   * Track product view during session
   */
  async trackProductView(sessionId, productData) {
    const session = await CustomerSession.findOne({ session_id: sessionId });
    if (!session) throw new Error('Session not found');

    session.products_viewed.push({
      sku: productData.sku,
      name: productData.name,
      category: productData.category,
      view_time: new Date(),
      added_to_cart: productData.added_to_cart || false
    });

    if (productData.added_to_cart && !session.cart_id) {
      session.cart_id = `CART-${Date.now().toString(36).toUpperCase()}`;
      session.status = 'browsing';

      // Update entry record
      await StoreEntry.findOneAndUpdate(
        { session_id: sessionId },
        { shopping_started: true, cart_created: true }
      );
    }

    await session.save();
    return session;
  }
}

module.exports = new StoreEntryService();
