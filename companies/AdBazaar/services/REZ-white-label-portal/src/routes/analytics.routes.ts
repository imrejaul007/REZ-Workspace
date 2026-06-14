import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  CampaignPerformance,
  CampaignMetrics,
  DailyMetric,
  DemographicsData,
  DeviceBreakdown,
  LocationData,
  PortalAnalytics,
  AnalyticsOverview,
  CampaignPerformanceSummary,
  TrendData,
  TopPerformer,
  ReportFormat
} from '../types';
import { clientService } from '../services/client.service';
import logger from '../utils/logger';

const analyticsLogger = logger.child({ component: 'AnalyticsRoutes' });
const router = Router();

// In-memory storage for analytics data (replace with database in production)
const campaignPerformances: Map<string, CampaignPerformance> = new Map();

// ============== Helper Functions ==============

function generateMockMetrics(days: number): DailyMetric[] {
  const metrics: DailyMetric[] = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const impressions = Math.floor(Math.random() * 50000) + 10000;
    const clicks = Math.floor(impressions * (Math.random() * 0.05 + 0.02));
    const conversions = Math.floor(clicks * (Math.random() * 0.1 + 0.02));
    const spend = Math.random() * 500 + 100;
    const revenue = spend * (Math.random() * 3 + 1);
    
    metrics.push({
      date: date.toISOString().split('T')[0],
      impressions,
      clicks,
      conversions,
      spend,
      revenue,
    });
  }
  
  return metrics;
}

function generateMockCampaignPerformance(tenantId: string, clientId?: string): CampaignPerformance {
  const platforms = ['Google Ads', 'Facebook Ads', 'Instagram Ads', 'LinkedIn Ads', 'Twitter Ads'];
  const statuses = ['active', 'paused', 'completed'] as const;
  
  const impressions = Math.floor(Math.random() * 500000) + 50000;
  const clicks = Math.floor(impressions * (Math.random() * 0.05 + 0.02));
  const conversions = Math.floor(clicks * (Math.random() * 0.1 + 0.02));
  const budget = Math.random() * 10000 + 1000;
  const spent = budget * (Math.random() * 0.9 + 0.1);
  const revenue = spent * (Math.random() * 3 + 1);
  
  return {
    id: uuidv4(),
    clientId: clientId || uuidv4(),
    campaignId: uuidv4(),
    campaignName: `Campaign ${Math.floor(Math.random() * 1000)}`,
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    budget,
    spent,
    impressions,
    clicks,
    conversions,
    ctr: clicks / impressions * 100,
    cpc: spent / clicks,
    cpa: spent / conversions,
    roas: revenue / spent,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    platform: platforms[Math.floor(Math.random() * platforms.length)],
    metrics: {
      daily: generateMockMetrics(30),
      weekly: [],
      monthly: [],
      demographics: {
        age: { '18-24': 15, '25-34': 30, '35-44': 25, '45-54': 20, '55+': 10 },
        gender: { male: 55, female: 42, other: 3 },
      },
      devices: {
        desktop: 45,
        mobile: 48,
        tablet: 7,
      },
      locations: [
        { country: 'United States', impressions: 300000, clicks: 8000, conversions: 200 },
        { country: 'United Kingdom', impressions: 80000, clicks: 2000, conversions: 50 },
        { country: 'Canada', impressions: 50000, clicks: 1200, conversions: 30 },
        { country: 'Germany', impressions: 40000, clicks: 900, conversions: 25 },
        { country: 'Australia', impressions: 30000, clicks: 700, conversions: 20 },
      ],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// ============== Analytics Overview Routes ==============

// Get analytics overview for tenant/client
router.get('/:tenantId/overview', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const clientId = req.query.clientId as string | undefined;
    const period = req.query.period as string || '30d';
    
    // Calculate date range based on period
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const endDate = new Date();
    
    // Generate mock overview data
    const overview: AnalyticsOverview = {
      totalImpressions: Math.floor(Math.random() * 5000000) + 500000,
      totalClicks: Math.floor(Math.random() * 100000) + 10000,
      totalConversions: Math.floor(Math.random() * 5000) + 500,
      totalSpend: Math.random() * 50000 + 10000,
      totalRevenue: Math.random() * 150000 + 30000,
      averageCtr: Math.random() * 3 + 1,
      averageCpc: Math.random() * 2 + 0.5,
      averageCpa: Math.random() * 50 + 10,
      averageRoas: Math.random() * 3 + 1.5,
      impressionsChange: (Math.random() - 0.5) * 40,
      clicksChange: (Math.random() - 0.5) * 40,
      conversionsChange: (Math.random() - 0.5) * 40,
      spendChange: (Math.random() - 0.5) * 30,
      revenueChange: (Math.random() - 0.5) * 40,
    };
    
    res.json({
      success: true,
      data: {
        overview,
        period: { startDate, endDate, granularity: days <= 7 ? 'day' : days <= 30 ? 'day' : 'week' },
      },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    analyticsLogger.error('Failed to get analytics overview', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get analytics overview' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Get full analytics for tenant/client
router.get('/:tenantId', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const clientId = req.query.clientId as string | undefined;
    const period = req.query.period as string || '30d';
    
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const endDate = new Date();
    
    // Generate campaign performance summaries
    const campaignPerformance: CampaignPerformanceSummary[] = Array.from({ length: 5 }, () => {
      const impressions = Math.floor(Math.random() * 500000) + 50000;
      const clicks = Math.floor(impressions * 0.03);
      const conversions = Math.floor(clicks * 0.05);
      const spend = Math.random() * 10000 + 1000;
      const revenue = spend * 2.5;
      
      return {
        campaignId: uuidv4(),
        campaignName: `Campaign ${Math.floor(Math.random() * 1000)}`,
        platform: ['Google Ads', 'Facebook Ads', 'Instagram Ads'][Math.floor(Math.random() * 3)],
        impressions,
        clicks,
        conversions,
        spend,
        revenue,
        ctr: (clicks / impressions) * 100,
        cpc: spend / clicks,
        cpa: spend / conversions,
        roas: revenue / spend,
      };
    });
    
    // Generate trend data
    const trends: TrendData[] = generateMockMetrics(days).map(m => ({
      date: m.date,
      impressions: m.impressions,
      clicks: m.clicks,
      conversions: m.conversions,
      spend: m.spend,
      revenue: m.revenue,
    }));
    
    // Generate top performers
    const topPerformers: TopPerformer[] = [
      { type: 'campaign', id: uuidv4(), name: 'Top Performing Campaign 1', metric: 'roas', value: 4.5, change: 15.2 },
      { type: 'campaign', id: uuidv4(), name: 'Top Performing Campaign 2', metric: 'conversions', value: 523, change: 8.7 },
      { type: 'campaign', id: uuidv4(), name: 'Top Performing Campaign 3', metric: 'ctr', value: 5.2, change: -2.1 },
    ];
    
    const analytics: PortalAnalytics = {
      clientId: clientId || tenantId,
      period: { startDate, endDate, granularity: days <= 30 ? 'day' : 'week' },
      overview: {
        totalImpressions: campaignPerformance.reduce((sum, c) => sum + c.impressions, 0),
        totalClicks: campaignPerformance.reduce((sum, c) => sum + c.clicks, 0),
        totalConversions: campaignPerformance.reduce((sum, c) => sum + c.conversions, 0),
        totalSpend: campaignPerformance.reduce((sum, c) => sum + c.spend, 0),
        totalRevenue: campaignPerformance.reduce((sum, c) => sum + c.revenue, 0),
        averageCtr: campaignPerformance.reduce((sum, c) => sum + c.ctr, 0) / campaignPerformance.length,
        averageCpc: campaignPerformance.reduce((sum, c) => sum + c.cpc, 0) / campaignPerformance.length,
        averageCpa: campaignPerformance.reduce((sum, c) => sum + c.cpa, 0) / campaignPerformance.length,
        averageRoas: campaignPerformance.reduce((sum, c) => sum + c.roas, 0) / campaignPerformance.length,
        impressionsChange: (Math.random() - 0.5) * 40,
        clicksChange: (Math.random() - 0.5) * 40,
        conversionsChange: (Math.random() - 0.5) * 40,
        spendChange: (Math.random() - 0.5) * 30,
        revenueChange: (Math.random() - 0.5) * 40,
      },
      campaignPerformance,
      trends,
      topPerformers,
    };
    
    res.json({
      success: true,
      data: analytics,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    analyticsLogger.error('Failed to get analytics', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get analytics' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// ============== Campaign Performance Routes ==============

// Get campaigns for tenant/client
router.get('/:tenantId/campaigns', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const clientId = req.query.clientId as string | undefined;
    const status = req.query.status as string | undefined;
    const platform = req.query.platform as string | undefined;
    const limit = parseInt(req.query.limit as string) || 20;
    
    // Generate mock campaigns
    const campaigns: CampaignPerformance[] = Array.from({ length: limit }, () => 
      generateMockCampaignPerformance(tenantId, clientId)
    );
    
    // Apply filters
    let filtered = campaigns;
    if (status) {
      filtered = filtered.filter(c => c.status === status);
    }
    if (platform) {
      filtered = filtered.filter(c => c.platform === platform);
    }
    
    res.json({
      success: true,
      data: filtered,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    analyticsLogger.error('Failed to get campaigns', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get campaigns' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Get single campaign performance
router.get('/:tenantId/campaigns/:campaignId', async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    const campaign = campaignPerformances.get(campaignId) || generateMockCampaignPerformance(req.params.tenantId);
    
    res.json({
      success: true,
      data: campaign,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    analyticsLogger.error('Failed to get campaign performance', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get campaign performance' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Get campaign metrics
router.get('/:tenantId/campaigns/:campaignId/metrics', async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    const granularity = req.query.granularity as 'daily' | 'weekly' | 'monthly' || 'daily';
    const days = granularity === 'daily' ? 30 : granularity === 'weekly' ? 12 : 6;
    
    const metrics: DailyMetric[] = generateMockMetrics(days);
    
    res.json({
      success: true,
      data: { metrics, granularity },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    analyticsLogger.error('Failed to get campaign metrics', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get campaign metrics' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Get campaign demographics
router.get('/:tenantId/campaigns/:campaignId/demographics', async (req: Request, res: Response) => {
  try {
    const demographics: DemographicsData = {
      age: { '18-24': 15, '25-34': 30, '35-44': 25, '45-54': 20, '55+': 10 },
      gender: { male: 55, female: 42, other: 3 },
    };
    
    res.json({
      success: true,
      data: demographics,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    analyticsLogger.error('Failed to get demographics', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get demographics' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Get campaign devices breakdown
router.get('/:tenantId/campaigns/:campaignId/devices', async (req: Request, res: Response) => {
  try {
    const devices: DeviceBreakdown = {
      desktop: 45,
      mobile: 48,
      tablet: 7,
    };
    
    res.json({
      success: true,
      data: devices,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    analyticsLogger.error('Failed to get device breakdown', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get device breakdown' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// Get campaign locations
router.get('/:tenantId/campaigns/:campaignId/locations', async (req: Request, res: Response) => {
  try {
    const locations: LocationData[] = [
      { country: 'United States', impressions: 300000, clicks: 8000, conversions: 200 },
      { country: 'United Kingdom', impressions: 80000, clicks: 2000, conversions: 50 },
      { country: 'Canada', impressions: 50000, clicks: 1200, conversions: 30 },
      { country: 'Germany', impressions: 40000, clicks: 900, conversions: 25 },
      { country: 'Australia', impressions: 30000, clicks: 700, conversions: 20 },
    ];
    
    res.json({
      success: true,
      data: locations,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    analyticsLogger.error('Failed to get locations', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get locations' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// ============== Trend Routes ==============

// Get trends
router.get('/:tenantId/trends', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const clientId = req.query.clientId as string | undefined;
    const metrics = (req.query.metrics as string)?.split(',') || ['impressions', 'clicks', 'conversions', 'spend', 'revenue'];
    const period = req.query.period as string || '30d';
    
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 30;
    const trends: TrendData[] = generateMockMetrics(days).map(m => ({
      date: m.date,
      impressions: m.impressions,
      clicks: m.clicks,
      conversions: m.conversions,
      spend: m.spend,
      revenue: m.revenue,
    }));
    
    res.json({
      success: true,
      data: trends,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    analyticsLogger.error('Failed to get trends', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get trends' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// ============== Export Routes ==============

// Export analytics data
router.get('/:tenantId/export/:type', async (req: Request, res: Response) => {
  try {
    const { tenantId, type } = req.params;
    const format = req.query.format as ReportFormat || 'csv';
    const clientId = req.query.clientId as string | undefined;
    
    const campaigns = Array.from({ length: 5 }, () => generateMockCampaignPerformance(tenantId, clientId));
    
    let content: string;
    let contentType: string;
    let filename: string;
    
    switch (format) {
      case 'json':
        content = JSON.stringify({ campaigns, exportedAt: new Date().toISOString() }, null, 2);
        contentType = 'application/json';
        filename = `${type}-${tenantId}.json`;
        break;
      case 'html':
        content = `<!DOCTYPE html>
<html>
<head>
  <title>${type} Report</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 2rem; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f4f4f4; }
  </style>
</head>
<body>
  <h1>${type.charAt(0).toUpperCase() + type.slice(1)} Report</h1>
  <p>Generated: ${new Date().toLocaleDateString()}</p>
  <table>
    <thead>
      <tr>
        <th>Campaign</th><th>Platform</th><th>Impressions</th>
        <th>Clicks</th><th>CTR</th><th>Spend</th><th>ROAS</th>
      </tr>
    </thead>
    <tbody>
      ${campaigns.map(c => `<tr>
        <td>${c.campaignName}</td><td>${c.platform}</td>
        <td>${c.impressions}</td><td>${c.clicks}</td>
        <td>${c.ctr.toFixed(2)}%</td><td>$${c.spent.toFixed(2)}</td>
        <td>${c.roas.toFixed(2)}x</td>
      </tr>`).join('')}
    </tbody>
  </table>
</body>
</html>`;
        contentType = 'text/html';
        filename = `${type}-${tenantId}.html`;
        break;
      case 'csv':
      default:
        content = 'Campaign,Platform,Status,Impressions,Clicks,CTR,Spend,Revenue,ROAS\n' +
          campaigns.map(c => 
            `"${c.campaignName}","${c.platform}","${c.status}",${c.impressions},${c.clicks},${c.ctr.toFixed(2)}%,${c.spent.toFixed(2)},${(c.spent * c.roas).toFixed(2)},${c.roas.toFixed(2)}x`
          ).join('\n');
        contentType = 'text/csv';
        filename = `${type}-${tenantId}.csv`;
    }
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', contentType);
    res.send(content);
  } catch (error) {
    analyticsLogger.error('Failed to export analytics', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to export analytics' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// ============== Real-time Analytics Routes ==============

// Get real-time metrics
router.get('/:tenantId/realtime', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const clientId = req.query.clientId as string | undefined;
    
    // Simulated real-time data
    const realtime = {
      activeCampaigns: Math.floor(Math.random() * 10) + 5,
      currentImpressions: Math.floor(Math.random() * 10000),
      currentClicks: Math.floor(Math.random() * 500),
      currentConversions: Math.floor(Math.random() * 50),
      budgetUsed: Math.random() * 100,
      lastUpdated: new Date().toISOString(),
    };
    
    res.json({
      success: true,
      data: realtime,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    analyticsLogger.error('Failed to get realtime metrics', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get realtime metrics' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// ============== Comparison Routes ==============

// Compare periods
router.get('/:tenantId/compare', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const clientId = req.query.clientId as string | undefined;
    const period = req.query.period as string || '30d';
    const comparePeriod = req.query.compare as string || 'previous';
    
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 30;
    
    const current: AnalyticsOverview = {
      totalImpressions: Math.floor(Math.random() * 5000000) + 500000,
      totalClicks: Math.floor(Math.random() * 100000) + 10000,
      totalConversions: Math.floor(Math.random() * 5000) + 500,
      totalSpend: Math.random() * 50000 + 10000,
      totalRevenue: Math.random() * 150000 + 30000,
      averageCtr: Math.random() * 3 + 1,
      averageCpc: Math.random() * 2 + 0.5,
      averageCpa: Math.random() * 50 + 10,
      averageRoas: Math.random() * 3 + 1.5,
      impressionsChange: 0,
      clicksChange: 0,
      conversionsChange: 0,
      spendChange: 0,
      revenueChange: 0,
    };
    
    // Generate previous period data with some variation
    const previous: AnalyticsOverview = {
      totalImpressions: current.totalImpressions * (Math.random() * 0.3 + 0.7),
      totalClicks: current.totalClicks * (Math.random() * 0.3 + 0.7),
      totalConversions: current.totalConversions * (Math.random() * 0.3 + 0.7),
      totalSpend: current.totalSpend * (Math.random() * 0.3 + 0.7),
      totalRevenue: current.totalRevenue * (Math.random() * 0.3 + 0.7),
      averageCtr: current.averageCtr,
      averageCpc: current.averageCpc,
      averageCpa: current.averageCpa,
      averageRoas: current.averageRoas,
      impressionsChange: 0,
      clicksChange: 0,
      conversionsChange: 0,
      spendChange: 0,
      revenueChange: 0,
    };
    
    res.json({
      success: true,
      data: { current, previous },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    analyticsLogger.error('Failed to compare periods', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to compare periods' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// ============== Top Performers Routes ==============

// Get top performers
router.get('/:tenantId/top-performers', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const clientId = req.query.clientId as string | undefined;
    const metric = req.query.metric as string || 'roas';
    const limit = parseInt(req.query.limit as string) || 10;
    
    const topPerformers: TopPerformer[] = Array.from({ length: limit }, (_, i) => ({
      type: 'campaign',
      id: uuidv4(),
      name: `Top Campaign ${i + 1}`,
      metric,
      value: Math.random() * 5 + 1,
      change: (Math.random() - 0.5) * 50,
    }));
    
    // Sort by metric value
    topPerformers.sort((a, b) => b.value - a.value);
    
    res.json({
      success: true,
      data: topPerformers,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    analyticsLogger.error('Failed to get top performers', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get top performers' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

// ============== Platform Breakdown Routes ==============

// Get platform breakdown
router.get('/:tenantId/platforms', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;
    const clientId = req.query.clientId as string | undefined;
    
    const platforms = [
      { name: 'Google Ads', impressions: 1500000, clicks: 35000, conversions: 800, spend: 15000, revenue: 45000 },
      { name: 'Facebook Ads', impressions: 1200000, clicks: 28000, conversions: 600, spend: 12000, revenue: 36000 },
      { name: 'Instagram Ads', impressions: 800000, clicks: 22000, conversions: 450, spend: 8000, revenue: 24000 },
      { name: 'LinkedIn Ads', impressions: 300000, clicks: 5000, conversions: 150, spend: 6000, revenue: 18000 },
      { name: 'Twitter Ads', impressions: 200000, clicks: 4000, conversions: 100, spend: 4000, revenue: 12000 },
    ];
    
    res.json({
      success: true,
      data: platforms,
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  } catch (error) {
    analyticsLogger.error('Failed to get platform breakdown', { error });
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get platform breakdown' },
      meta: { requestId: req.headers['x-request-id'] as string || uuidv4(), timestamp: new Date() },
    });
  }
});

export default router;
