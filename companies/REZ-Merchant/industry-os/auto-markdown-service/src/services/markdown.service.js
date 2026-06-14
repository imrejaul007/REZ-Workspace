/**
 * Auto Markdown Service
 * FreshMart 3PM Story: "Tomatoes Expiry Risk: 24 Hours → Quick Sale Campaign"
 */

const { ExpiringItem, MarkdownCampaign } = require('../models/markdown.model');

class MarkdownService {
  /**
   * Scan inventory for items approaching expiry
   * FreshMart 3PM: "Vegetable Twin notices tomatoes expiring"
   */
  async scanForExpiringItems(storeId, options = {}) {
    const {
      hoursThreshold = 72,  // Items expiring within 72 hours
      categories = ['produce', 'dairy', 'bakery', 'meat'],
      minStock = 1
    } = options;

    // In production, fetch from inventory service
    // For now, simulate finding expiring items
    const now = new Date();
    const threshold = new Date(now.getTime() + hoursThreshold * 60 * 60 * 1000);

    // This would be replaced with actual inventory query
    // const inventory = await inventoryService.getExpiringItems(storeId, threshold);

    return [];
  }

  /**
   * Create expiring item record and calculate markdown
   */
  async createExpiringItem(storeId, item) {
    const expiringItem = new ExpiringItem({
      store_id: storeId,
      product_sku: item.sku,
      product_name: item.name,
      category: item.category,
      current_stock: item.quantity,
      original_price: item.price,
      expiry_date: new Date(item.expiryDate)
    });

    // Calculate markdown based on hours remaining
    const markdown = expiringItem.calculateMarkdown();
    expiringItem.status = 'evaluating';

    await expiringItem.save();

    return {
      item: expiringItem,
      markdown,
      recommendation: this.getRecommendation(expiringItem)
    };
  }

  /**
   * Get recommendation for markdown decision
   */
  getRecommendation(item) {
    if (item.expiry_risk === 'critical' && item.current_stock > 10) {
      return {
        action: 'APPROVE',
        reason: 'Critical expiry with significant stock',
        urgency: 'high',
        markdown_suggested: `${item.markdown_percentage}% off`
      };
    } else if (item.expiry_risk === 'high' && item.current_stock > 20) {
      return {
        action: 'APPROVE',
        reason: 'High expiry risk with stock to move',
        urgency: 'medium',
        markdown_suggested: `${item.markdown_percentage}% off`
      };
    } else if (item.value_at_risk < 500) {
      return {
        action: 'SKIP',
        reason: 'Low value at risk - not worth campaign cost',
        urgency: 'low'
      };
    }
    return {
      action: 'REVIEW',
      reason: 'Review needed for final decision',
      urgency: 'medium'
    };
  }

  /**
   * Approve markdown and create AdBazaar campaign
   */
  async approveMarkdown(expiringItemId) {
    const item = await ExpiringItem.findById(expiringItemId);
    if (!item) throw new Error('Item not found');

    item.status = 'approved';
    item.approved_at = new Date();
    await item.save();

    // Create or add to campaign
    let campaign = await MarkdownCampaign.findOne({
      store_id: item.store_id,
      status: 'draft',
      ends_at: { $gt: new Date() }
    });

    if (!campaign) {
      campaign = new MarkdownCampaign({
        store_id: item.store_id,
        name: `Quick Sale - ${new Date().toLocaleDateString()}`,
        description: 'Fresh items at discount prices!',
        ends_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        source: 'automatic'
      });
      await campaign.save();
    }

    // Add item to campaign
    campaign.items.push({
      expiring_item_id: item._id,
      product_sku: item.product_sku,
      product_name: item.product_name,
      original_price: item.original_price,
      markdown_price: item.markdown_price,
      markdown_percentage: item.markdown_percentage,
      stock: item.current_stock
    });
    await campaign.save();

    item.status = 'published';
    item.campaign_id = campaign._id;
    await item.save();

    return { item, campaign };
  }

  /**
   * Launch AdBazaar campaign for markdown items
   * FreshMart 3PM: "AdBazaar launches promotion → BuzzLocal promotes nearby"
   */
  async launchAdBazaarCampaign(campaignId) {
    const campaign = await MarkdownCampaign.findById(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    // In production, call AdBazaar API
    // const adbazaarResponse = await adbazaarService.createCampaign({
    //   type: 'local_deal',
    //   location: campaign.store_id,
    //   items: campaign.items,
    //   duration: 24 * 60 * 60 // 24 hours
    // });

    // Simulated response
    const adbazaarCampaignId = `ADB-${Date.now()}`;

    campaign.adbazaar_campaign_id = adbazaarCampaignId;
    campaign.status = 'active';
    campaign.published_at = new Date();
    await campaign.save();

    // Update all items in campaign
    await ExpiringItem.updateMany(
      { campaign_id: campaign._id },
      { status: 'published', adbazaar_campaign_id: adbazaarCampaignId }
    );

    return {
      campaign,
      adbazaarCampaignId,
      message: 'Campaign launched on AdBazaar',
      notifications: this.generateNotifications(campaign)
    };
  }

  /**
   * Generate notifications for different channels
   */
  generateNotifications(campaign) {
    return {
      push: {
        title: '🎉 Quick Sale!',
        message: `${campaign.items.length} items at up to ${Math.max(...campaign.items.map(i => i.markdown_percentage))}% off!`,
        segments: ['nearby', 'regular_customers']
      },
      sms: {
        message: `FreshMart Quick Sale! ${campaign.items[0]?.product_name} @ ${campaign.items[0]?.markdown_percentage}% off. Visit store or order on REZ App.`,
        segments: ['opt_in_sms']
      },
      buzzlocal: {
        message: `🛒 Fresh items at discount prices at FreshMart! ${campaign.items.map(i => i.product_name).join(', ')}`,
        radius: 2000, // meters
        target: 'nearby_residents'
      }
    };
  }

  /**
   * Get dashboard summary for store
   */
  async getDashboardSummary(storeId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [expiringItems, activeCampaigns, todayStats] = await Promise.all([
      ExpiringItem.find({ store_id: storeId, status: { $in: ['detected', 'evaluating', 'approved', 'published'] } }),
      MarkdownCampaign.find({ store_id: storeId, status: 'active' }),
      MarkdownCampaign.find({
        store_id: storeId,
        published_at: { $gte: today }
      })
    ]);

    const totalValueAtRisk = expiringItems.reduce((sum, i) => sum + i.value_at_risk, 0);
    const totalRecovery = expiringItems.reduce((sum, i) => sum + i.potential_recovery, 0);

    return {
      expiringItems: {
        total: expiringItems.length,
        critical: expiringItems.filter(i => i.expiry_risk === 'critical').length,
        high: expiringItems.filter(i => i.expiry_risk === 'high').length,
        medium: expiringItems.filter(i => i.expiry_risk === 'medium').length,
        low: expiringItems.filter(i => i.expiry_risk === 'low').length
      },
      activeCampaigns: activeCampaigns.length,
      todayStats: {
        campaigns: todayStats.length,
        itemsIncluded: todayStats.reduce((sum, c) => sum + c.items.length, 0),
        potentialRecovery: todayStats.reduce((sum, c) => sum + c.total_recovery, 0)
      },
      financials: {
        valueAtRisk: totalValueAtRisk,
        potentialRecovery: totalRecovery,
        recoveryRate: totalValueAtRisk > 0 ? (totalRecovery / totalValueAtRisk * 100).toFixed(1) + '%' : '0%'
      },
      recommendations: this.generateRecommendations(expiringItems)
    };
  }

  /**
   * Generate actionable recommendations
   */
  generateRecommendations(expiringItems) {
    const recommendations = [];

    const criticalItems = expiringItems.filter(i => i.expiry_risk === 'critical');
    if (criticalItems.length > 0) {
      recommendations.push({
        priority: 'URGENT',
        action: 'Launch quick sale campaigns for critical items',
        items: criticalItems.map(i => i.product_name),
        potentialSavings: criticalItems.reduce((sum, i) => sum + i.value_at_risk, 0)
      });
    }

    const highValueItems = expiringItems
      .filter(i => i.value_at_risk > 5000)
      .sort((a, b) => b.value_at_risk - a.value_at_risk);

    if (highValueItems.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Prioritize high-value expiring items',
        items: highValueItems.slice(0, 3).map(i => i.product_name),
        potentialSavings: highValueItems[0]?.value_at_risk
      });
    }

    return recommendations;
  }
}

module.exports = new MarkdownService();
