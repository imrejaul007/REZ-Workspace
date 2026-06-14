/**
 * Analytics Dashboard
 *
 * Multi-touch attribution, cohort analysis, conversion funnels
 */

const { v4: uuidv4 } = require('uuid');

// In-memory analytics storage
const events = new Map();
const campaigns = new Map();
const conversions = new Map();
const cohorts = new Map();

// ============================================
// EVENT TRACKING
// ============================================

/**
 * Track any event
 */
function trackEvent(options = {}) {
  const {
    type,
    prospectId,
    campaignId,
    channel,
    metadata = {}
  } = options;

  const event = {
    id: uuidv4(),
    type,
    prospectId,
    campaignId,
    channel,
    timestamp: new Date().toISOString(),
    metadata
  };

  if (!events.has(type)) {
    events.set(type, []);
  }
  events.get(type).push(event);

  return event;
}

/**
 * Track conversion
 */
function trackConversion(options = {}) {
  const {
    prospectId,
    campaignId,
    source,
    value = 0,
    type = 'lead'
  } = options;

  const conversion = {
    id: uuidv4(),
    prospectId,
    campaignId,
    source,
    value,
    type,
    timestamp: new Date().toISOString(),
    touchpoints: []
  };

  conversions.set(conversion.id, conversion);

  // Update cohort
  const dateKey = new Date().toISOString().split('T')[0];
  if (!cohorts.has(dateKey)) {
    cohorts.set(dateKey, { conversions: 0, revenue: 0, touches: 0 });
  }
  const cohort = cohorts.get(dateKey);
  cohort.conversions++;
  cohort.revenue += value;

  return conversion;
}

/**
 * Link touchpoint to conversion
 */
function linkTouchpoint(conversionId, touchpoint) {
  const conversion = conversions.get(conversionId);
  if (!conversion) return null;

  conversion.touchpoints.push({
    ...touchpoint,
    linkedAt: new Date().toISOString()
  });

  return conversion;
}

// ============================================
// ATTRIBUTION MODELS
// ============================================

/**
 * Calculate attribution
 * Models: first-touch, last-touch, linear, time-decay, position-based
 */
function calculateAttribution(conversionId, model = 'linear') {
  const conversion = conversions.get(conversionId);
  if (!conversion || !conversion.touchpoints.length) return null;

  const touchpoints = conversion.touchpoints;
  let attribution = [];

  switch (model) {
    case 'first-touch':
      attribution = [{ ...touchpoints[0], credit: 100 }];
      break;

    case 'last-touch':
      attribution = [{ ...touchpoints[touchpoints.length - 1], credit: 100 }];
      break;

    case 'linear':
      const credit = 100 / touchpoints.length;
      attribution = touchpoints.map(t => ({ ...t, credit }));
      break;

    case 'time-decay':
      const decay = 0.7; // 7-day half-life
      let totalDecay = 0;
      const decays = touchpoints.map((t, i) => {
        const days = (Date.now() - new Date(t.timestamp).getTime()) / (1000 * 60 * 60 * 24);
        const d = Math.pow(decay, days / 7);
        totalDecay += d;
        return d;
      });
      attribution = touchpoints.map((t, i) => ({
        ...t,
        credit: (decays[i] / totalDecay) * 100
      }));
      break;

    case 'position-based':
      // 40% first, 40% last, 20% middle
      attribution = touchpoints.map((t, i) => {
        if (i === 0) return { ...t, credit: 40 };
        if (i === touchpoints.length - 1) return { ...t, credit: 40 };
        return { ...t, credit: 20 / Math.max(touchpoints.length - 2, 1) };
      });
      break;

    default:
      attribution = touchpoints.map(t => ({ ...t, credit: 100 / touchpoints.length }));
  }

  return {
    conversionId,
    model,
    attribution,
    totalCredit: attribution.reduce((sum, t) => sum + t.credit, 0)
  };
}

/**
 * Channel attribution summary
 */
function getChannelAttribution(timeRange = '30d') {
  const startDate = getStartDate(timeRange);
  const channelData = {};

  // Aggregate by channel
  for (const conversion of conversions.values()) {
    if (new Date(conversion.timestamp) < startDate) continue;

    const attribution = calculateAttribution(conversion.id, 'linear');
    if (!attribution) continue;

    for (const touch of attribution.attribution) {
      const channel = touch.channel || 'unknown';
      if (!channelData[channel]) {
        channelData[channel] = { conversions: 0, revenue: 0, touches: 0, credit: 0 };
      }
      channelData[channel].conversions++;
      channelData[channel].revenue += conversion.value;
      channelData[channel].credit += touch.credit;
      channelData[channel].touches++;
    }
  }

  // Calculate percentages
  const totalCredit = Object.values(channelData).reduce((sum, c) => sum + c.credit, 0);

  return Object.entries(channelData).map(([channel, data]) => ({
    channel,
    conversions: data.conversions,
    revenue: data.revenue,
    touches: data.touches,
    credit: Math.round(data.credit),
    percentage: totalCredit ? ((data.credit / totalCredit) * 100).toFixed(1) + '%' : '0%'
  })).sort((a, b) => b.credit - a.credit);
}

// ============================================
// CAMPAIGN ANALYTICS
// ============================================

/**
 * Track campaign performance
 */
function trackCampaign(campaignId, metrics) {
  if (!campaigns.has(campaignId)) {
    campaigns.set(campaignId, {
      id: campaignId,
      metrics: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        replied: 0,
        converted: 0,
        revenue: 0
      },
      timeline: []
    });
  }

  const campaign = campaigns.get(campaignId);
  Object.entries(metrics).forEach(([key, value]) => {
    if (typeof campaign.metrics[key] === 'number') {
      campaign.metrics[key] += value;
    }
  });

  return campaign;
}

/**
 * Get campaign analytics
 */
function getCampaignAnalytics(campaignId = null) {
  if (campaignId) {
    const campaign = campaigns.get(campaignId);
    if (!campaign) return null;

    const metrics = campaign.metrics;
    return {
      ...campaign,
      rates: {
        deliveryRate: metrics.sent ? ((metrics.delivered / metrics.sent) * 100).toFixed(1) + '%' : '0%',
        openRate: metrics.delivered ? ((metrics.opened / metrics.delivered) * 100).toFixed(1) + '%' : '0%',
        clickRate: metrics.opened ? ((metrics.clicked / metrics.opened) * 100).toFixed(1) + '%' : '0%',
        replyRate: metrics.sent ? ((metrics.replied / metrics.sent) * 100).toFixed(1) + '%' : '0%',
        conversionRate: metrics.sent ? ((metrics.converted / metrics.sent) * 100).toFixed(1) + '%' : '0%'
      },
      revenue: metrics.revenue,
      roi: metrics.sent ? (metrics.revenue / metrics.sent).toFixed(2) : 0
    };
  }

  // Aggregate all campaigns
  const aggregated = {
    totalSent: 0,
    totalDelivered: 0,
    totalOpened: 0,
    totalClicked: 0,
    totalReplied: 0,
    totalConverted: 0,
    totalRevenue: 0
  };

  for (const campaign of campaigns.values()) {
    aggregated.totalSent += campaign.metrics.sent;
    aggregated.totalDelivered += campaign.metrics.delivered;
    aggregated.totalOpened += campaign.metrics.opened;
    aggregated.totalClicked += campaign.metrics.clicked;
    aggregated.totalReplied += campaign.metrics.replied;
    aggregated.totalConverted += campaign.metrics.converted;
    aggregated.totalRevenue += campaign.metrics.revenue;
  }

  return {
    campaigns: campaigns.size,
    ...aggregated,
    rates: {
      deliveryRate: aggregated.totalSent ? ((aggregated.totalDelivered / aggregated.totalSent) * 100).toFixed(1) + '%' : '0%',
      openRate: aggregated.totalDelivered ? ((aggregated.totalOpened / aggregated.totalDelivered) * 100).toFixed(1) + '%' : '0%',
      clickRate: aggregated.totalOpened ? ((aggregated.totalClicked / aggregated.totalOpened) * 100).toFixed(1) + '%' : '0%',
      replyRate: aggregated.totalSent ? ((aggregated.totalReplied / aggregated.totalSent) * 100).toFixed(1) + '%' : '0%',
      conversionRate: aggregated.totalSent ? ((aggregated.totalConverted / aggregated.totalSent) * 100).toFixed(1) + '%' : '0%'
    },
    roi: aggregated.totalSent ? (aggregated.totalRevenue / aggregated.totalSent).toFixed(2) : 0
  };
}

// ============================================
// CONVERSION FUNNEL
// ============================================

/**
 * Get conversion funnel
 */
function getConversionFunnel(stages = null) {
  const defaultStages = [
    { name: 'Prospect', key: 'prospect' },
    { name: 'Contacted', key: 'contacted' },
    { name: 'Engaged', key: 'engaged' },
    { name: 'Qualified', key: 'qualified' },
    { name: 'Opportunity', key: 'opportunity' },
    { name: 'Customer', key: 'customer' }
  ];

  const funnel = stages || defaultStages;
  const counts = {};

  // Get counts from event tracking
  for (const stage of funnel) {
    const stageEvents = events.get(`stage_${stage.key}`) || [];
    counts[stage.key] = stageEvents.length;
  }

  // Calculate drop-off rates
  const funnelData = funnel.map((stage, i) => {
    const count = counts[stage.key] || 0;
    const prevCount = i > 0 ? (counts[funnel[i - 1].key] || 0) : count;
    const dropoff = prevCount > 0 ? ((1 - count / prevCount) * 100).toFixed(1) + '%' : '0%';

    return {
      ...stage,
      count,
      dropoff: i === 0 ? '-' : dropoff
    };
  });

  return funnelData;
}

/**
 * Get cohort report
 */
function getCohortReport(timeRange = '90d') {
  const startDate = getStartDate(timeRange);
  const report = [];

  for (const [date, data] of cohorts.entries()) {
    if (new Date(date) < startDate) continue;

    report.push({
      date,
      conversions: data.conversions,
      revenue: data.revenue,
      touches: data.touches,
      conversionRate: data.touches ? ((data.conversions / data.touches) * 100).toFixed(1) + '%' : '0%'
    });
  }

  return report.sort((a, b) => a.date.localeCompare(b.date));
}

// ============================================
// OVERALL DASHBOARD
// ============================================

/**
 * Get dashboard summary
 */
function getDashboardSummary() {
  // Prospect stats
  const db = require('./prospect-database');
  const prospectStats = db.getStats();

  // Campaign stats
  const campaignStats = getCampaignAnalytics();

  // Channel attribution
  const channelAttribution = getChannelAttribution();

  // Funnel
  const funnel = getConversionFunnel();

  // Recent activity
  const recentEvents = Array.from(events.values())
    .flat()
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 20);

  return {
    prospects: {
      total: prospectStats.total,
      enriched: prospectStats.enriched,
      byStatus: prospectStats.statusCounts,
      byTier: {
        A: prospectStats.scoreDistribution?.['76-100'] || 0,
        B: prospectStats.scoreDistribution?.['51-75'] || 0,
        C: prospectStats.scoreDistribution?.['26-50'] || 0,
        D: prospectStats.scoreDistribution?.['0-25'] || 0
      },
      avgScore: prospectStats.avgScore
    },
    campaigns: campaignStats,
    channels: channelAttribution.slice(0, 5),
    funnel,
    recentActivity: recentEvents.map(e => ({
      type: e.type,
      prospectId: e.prospectId,
      timestamp: e.timestamp
    })),
    generatedAt: new Date().toISOString()
  };
}

/**
 * Get timeline data for charts
 */
function getTimelineData(metric = 'conversions', range = '30d') {
  const startDate = getStartDate(range);
  const data = [];

  // Group events by day
  const byDay = {};

  for (const conversion of conversions.values()) {
    if (new Date(conversion.timestamp) < startDate) continue;
    const date = conversion.timestamp.split('T')[0];
    if (!byDay[date]) byDay[date] = { conversions: 0, revenue: 0 };
    byDay[date].conversions++;
    byDay[date].revenue += conversion.value;
  }

  // Also check events
  for (const [type, typeEvents] of events.entries()) {
    for (const event of typeEvents) {
      if (new Date(event.timestamp) < startDate) continue;
      const date = event.timestamp.split('T')[0];
      if (!byDay[date]) byDay[date] = { conversions: 0, revenue: 0 };
      if (metric === 'touches') {
        byDay[date][metric] = (byDay[date][metric] || 0) + 1;
      }
    }
  }

  // Convert to array
  for (const [date, stats] of Object.entries(byDay)) {
    data.push({
      date,
      [metric]: metric === 'conversions' ? stats.conversions : stats[metric] || 0,
      revenue: stats.revenue
    });
  }

  return data.sort((a, b) => a.date.localeCompare(b.date));
}

// ============================================
// UTILITIES
// ============================================

function getStartDate(range) {
  const days = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 }[range] || 30;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

module.exports = {
  // Tracking
  trackEvent,
  trackConversion,
  linkTouchpoint,

  // Attribution
  calculateAttribution,
  getChannelAttribution,

  // Campaigns
  trackCampaign,
  getCampaignAnalytics,

  // Funnels
  getConversionFunnel,
  getCohortReport,

  // Dashboard
  getDashboardSummary,
  getTimelineData,

  // Storage access
  events,
  campaigns,
  conversions,
  cohorts
};