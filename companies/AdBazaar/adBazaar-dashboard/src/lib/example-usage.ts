/**
 * Integration Usage Examples
 *
 * This file demonstrates how to use the REZ Media service integrations
 * in the AdBazaar dashboard.
 */

import { useAICampaignBuilder, useAnalytics, useSocialIntegration } from './index';
import type { CampaignRequest, CreativeRequest } from './types/ai-campaign';

// ============================================
// AI Campaign Builder Examples
// ============================================

export async function aiCampaignExamples() {
  const ai = useAICampaignBuilder();

  // Example 1: Generate a campaign from natural language
  const campaignRequest: CampaignRequest = {
    goal: 'Get more lunch customers for my restaurant in Mumbai',
    merchantType: 'restaurant',
    location: 'Mumbai',
    budget: 25000,
    preferChannels: ['broadcast', 'dooh'],
  };

  const campaignResult = await ai.generateCampaign(campaignRequest);
  if (campaignResult.success && campaignResult.data) {
    logger.info('Generated campaign:', campaignResult.data.name);
    logger.info('Budget allocation:', campaignResult.data.budget);
    logger.info('AI reasoning:', campaignResult.data.aiReasoning);
  }

  // Example 2: Generate creative copy
  const creativeRequest: CreativeRequest = {
    goal: 'Promote weekend brunch special',
    merchantType: 'restaurant',
    product: 'Weekend Brunch',
  };

  const creativeResult = await ai.generateCreative(creativeRequest);
  if (creativeResult.success && creativeResult.data) {
    logger.info('Headline:', creativeResult.data.headline);
    logger.info('Body:', creativeResult.data.body);
    logger.info('CTA:', creativeResult.data.cta);
  }

  // Example 3: Get channel recommendations
  const recommendations = await ai.getRecommendations('Increase weekend dinner sales', 30000);
  if (recommendations.success && recommendations.data) {
    logger.info('Recommended channels:', recommendations.data.channels);
    logger.info('Estimated reach:', recommendations.data.estimated.reach);
  }

  // Example 4: Optimize existing campaign
  const optimizeResult = await ai.optimizeCampaign('camp_123', {
    impressions: 50000,
    clicks: 1500,
    conversions: 75,
  });
  if (optimizeResult.success && optimizeResult.data) {
    logger.info('Optimization suggestions:', optimizeResult.data.suggestions);
    logger.info('Potential lift:', optimizeResult.data.potentialLift);
  }

  // Example 5: Get campaign templates
  const templates = await ai.getTemplates('restaurant');
  if (templates.success && templates.data) {
    logger.info('Restaurant templates:', templates.data);
  }
}

// ============================================
// Analytics Examples
// ============================================

export async function analyticsExamples() {
  const { mediaAnalytics, realtimeDashboard, analyticsService } = useAnalytics();

  // Example 1: Get real-time dashboard data
  const dashboardData = await analyticsService.getDashboardData();
  logger.info('Total impressions:', dashboardData.liveMetrics?.totalImpressions);
  logger.info('Active campaigns:', dashboardData.liveMetrics?.activeCampaigns);
  logger.info('Alerts:', dashboardData.alerts.length);

  // Example 2: Get campaign-specific performance
  const performance = await analyticsService.getCampaignPerformance('camp_001');
  if (performance.liveMetrics) {
    logger.info('Live CTR:', performance.liveMetrics.ctr);
    logger.info('Live ROI:', performance.liveMetrics.roi);
  }

  // Example 3: Get aggregated metrics
  const aggregated = await realtimeDashboard.getAggregatedMetrics();
  if (aggregated.success && aggregated.data) {
    logger.info('Avg CTR:', aggregated.data.avgCTR.toFixed(2) + '%');
    logger.info('Avg CPC:', '₹' + aggregated.data.avgCPC.toFixed(2));
    logger.info('Budget utilization:', aggregated.data.budgetUtilization.toFixed(1) + '%');
  }

  // Example 4: Get active alerts
  const alerts = await realtimeDashboard.getAlerts();
  if (alerts.success && alerts.data) {
    const critical = alerts.data.critical;
    const high = alerts.data.high;
    logger.info(`Critical: ${critical}, High: ${high}`);
    alerts.data.alerts.forEach((alert) => {
      logger.info(`[${alert.severity.toUpperCase()}] ${alert.message}`);
    });
  }

  // Example 5: Get revenue report
  const revenue = await mediaAnalytics.getRevenueReport();
  if (revenue.success && revenue.data) {
    logger.info('Total revenue:', '₹' + revenue.data.revenue.total);
    logger.info('Ad revenue:', '₹' + revenue.data.revenue.ads);
    logger.info('DOOH revenue:', '₹' + revenue.data.revenue.dooh);
  }

  // Example 6: Track ad events
  await mediaAnalytics.trackImpression('camp_001', 'user_123', 'feed');
  await mediaAnalytics.trackClick('camp_001', 'user_123', 'imp_456');
  await mediaAnalytics.trackConversion('camp_001', 'user_123');

  // Example 7: Get DOOH analytics
  const dooh = await mediaAnalytics.getDOOHAnalytics('restaurant');
  if (dooh.success && dooh.data) {
    logger.info('Restaurant DOOH placements:', dooh.data.byType.restaurant);
    logger.info('Total DOOH impressions:', dooh.data.summary.totalImpressions);
  }

  // Example 8: WebSocket subscription for real-time updates
  realtimeDashboard.connectWebSocket((event, data) => {
    logger.info('Event:', event);
    logger.info('Data:', data);
  });

  // Subscribe to specific events
  const unsubscribeMetrics = realtimeDashboard.subscribe('metrics:refreshed', (data) => {
    logger.info('Metrics updated:', data);
  });

  const unsubscribeAlerts = realtimeDashboard.subscribe('alert:triggered', (data) => {
    logger.info('New alert:', data);
  });

  // Cleanup when done
  // unsubscribeMetrics();
  // unsubscribeAlerts();
  // realtimeDashboard.disconnect();
}

// ============================================
// Social & Gamification Examples
// ============================================

export async function socialExamples() {
  const { instagram, gamification } = useSocialIntegration();

  // Example 1: Get conversations
  const conversations = await instagram.getConversations({ status: 'active', limit: 20 });
  if (conversations.success && conversations.data) {
    conversations.data.conversations.forEach((conv) => {
      logger.info(`[${conv.threadId}] ${conv.lastMessagePreview}`);
    });
  }

  // Example 2: Send a message
  const sendResult = await instagram.sendMessage('instagram_user_123', 'Thanks for reaching out!');
  if (sendResult.success && sendResult.data) {
    logger.info('Message sent:', sendResult.data.messageId);
  }

  // Example 3: Get pending comments for review
  const pendingComments = await instagram.getPendingComments('media_123');
  if (pendingComments.success && pendingComments.data) {
    pendingComments.data.comments.forEach((comment) => {
      logger.info(`[${comment.username}]: ${comment.text}`);
      logger.info(`Intent: ${comment.intent}, Sentiment: ${comment.sentiment}`);
    });
  }

  // Example 4: Reply to a comment
  const replyResult = await instagram.replyToComment('comment_123', 'Thanks for your feedback!');
  if (replyResult.success) {
    logger.info('Reply sent:', replyResult.data?.replyId);
  }

  // Example 5: Hide spam comment
  await instagram.hideComment('spam_comment_123', 'Spam content');

  // Example 6: Escalate support comment
  await instagram.escalateComment('support_comment_123', 'Customer complaint', 'support_team');

  // Example 7: Get comment analytics
  const commentAnalytics = await instagram.getCommentAnalytics('media_123');
  if (commentAnalytics.success && commentAnalytics.data) {
    logger.info('Total comments:', commentAnalytics.data.total);
    logger.info('By intent:', commentAnalytics.data.byIntent);
    logger.info('By sentiment:', commentAnalytics.data.bySentiment);
  }

  // Example 8: Get comments by sentiment
  const negativeComments = await instagram.getCommentsBySentiment('negative', 10);
  if (negativeComments.success && negativeComments.data) {
    negativeComments.data.forEach((comment) => {
      logger.info(`Negative feedback: ${comment.text}`);
    });
  }

  // Example 9: Get comments by purchase intent
  const purchaseComments = await instagram.getCommentsByIntent('purchase', 10);
  if (purchaseComments.success && purchaseComments.data) {
    purchaseComments.data.forEach((comment) => {
      logger.info(`Purchase intent: ${comment.text}`);
    });
  }

  // Example 10: User linking - Create link session
  const linkSession = await instagram.createLinkSession({
    instagramUserId: 'instagram_123',
    username: 'customer_handle',
    email: 'customer@example.com',
    source: 'ad_campaign',
  });
  if (linkSession.success && linkSession.data) {
    logger.info('Verification code:', linkSession.data.verificationCode);
  }

  // ============================================
  // Gamification Examples
  // ============================================

  // Example 11: Get user achievements
  const achievements = await gamification.getAchievements('user_123');
  if (achievements.success && achievements.data) {
    logger.info('Earned achievements:', achievements.data.earned.length);
    logger.info('Locked achievements:', achievements.data.locked.length);
  }

  // Example 12: Get user streak
  const streak = await gamification.getStreak('user_123');
  if (streak.success && streak.data) {
    logger.info('Current streak:', streak.data.currentStreak);
    logger.info('Longest streak:', streak.data.longestStreak);
    logger.info('Streak active:', streak.data.streakActive);
  }

  // Example 13: Get leaderboard
  const leaderboard = await gamification.getLeaderboard();
  if (leaderboard.success && leaderboard.data) {
    logger.info('Top users:', leaderboard.data.entries);
  }

  // Example 14: Get rewards summary
  const rewardsSummary = await gamification.getRewardsSummary('user_123');
  if (rewardsSummary.success && rewardsSummary.data) {
    logger.info('User tier:', rewardsSummary.data.profile.currentTier);
    logger.info('Total coins:', rewardsSummary.data.totals.coins);
    logger.info('XP:', rewardsSummary.data.profile.xp);
  }

  // Example 15: Get available challenges
  const availableRewards = await gamification.getAvailableRewards('user_123');
  if (availableRewards.success && availableRewards.data) {
    availableRewards.data.challenges.forEach((challenge: { description?: string; progress?: number; target?: number }) => {
      logger.info(`${challenge.description}: ${challenge.progress}/${challenge.target}`);
    });
  }
}

// ============================================
// Health Check Example
// ============================================

export async function checkAllServicesHealth() {
  const ai = useAICampaignBuilder();
  const { healthCheck: analyticsHealth } = useAnalytics();
  const { healthCheck: socialHealth } = useSocialIntegration();

  const [aiHealth, analytics, social] = await Promise.all([
    ai.healthCheck(),
    analyticsHealth(),
    socialHealth(),
  ]);

  logger.info('AI Campaign Builder:', aiHealth ? 'Healthy' : 'Down');
  logger.info('Media Analytics:', analytics.mediaAnalytics ? 'Healthy' : 'Down');
  logger.info('Realtime Dashboard:', analytics.realtimeDashboard ? 'Healthy' : 'Down');
  logger.info('Instagram Bridge:', social.instagram ? 'Healthy' : 'Down');
  logger.info('Gamification:', social.gamification ? 'Healthy' : 'Down');
}

// ============================================
// React Component Example
// ============================================

/*
import { useState, useEffect } from 'react';
import { useAICampaignBuilder, useAnalytics, useSocialIntegration } from '@/lib';

export function CampaignBuilderWidget() {
  const [goal, setGoal] = useState('');
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ai = useAICampaignBuilder();

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    const result = await ai.generateCampaign({
      goal,
      merchantType: 'restaurant',
      budget: 20000,
    });

    if (result.success) {
      setCampaign(result.data);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div>
      <input
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        placeholder="Describe your campaign goal..."
      />
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Campaign'}
      </button>

      {error && <div className="error">{error}</div>}

      {campaign && (
        <div className="campaign-result">
          <h2>{campaign.name}</h2>
          <p>{campaign.description}</p>
          <div>Budget: ₹{campaign.budget.total}</div>
          <div>Est. Reach: {campaign.estimated.reach.toLocaleString()}</div>
        </div>
      )}
    </div>
  );
}

export function LiveMetricsWidget() {
  const { analyticsService } = useAnalytics();
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      const data = await analyticsService.getDashboardData();
      setMetrics(data.liveMetrics);
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30s

    return () => clearInterval(interval);
  }, []);

  if (!metrics) return <div>Loading...</div>;

  return (
    <div>
      <h2>Live Metrics</h2>
      <div>Impressions: {metrics.totalImpressions.toLocaleString()}</div>
      <div>Clicks: {metrics.totalClicks.toLocaleString()}</div>
      <div>Conversions: {metrics.totalConversions.toLocaleString()}</div>
      <div>Active Campaigns: {metrics.activeCampaigns}</div>
    </div>
  );
}

export function SocialMetricsWidget() {
  const { instagram } = useSocialIntegration();
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    instagram.getCommentAnalytics().then((result) => {
      if (result.success) setAnalytics(result.data);
    });
  }, []);

  if (!analytics) return <div>Loading...</div>;

  return (
    <div>
      <h2>Instagram Metrics</h2>
      <div>Total Comments: {analytics.total}</div>
      <div>Pending Review: {analytics.pending}</div>
      <div>Purchase Intent: {analytics.byIntent.purchase || 0}</div>
      <div>Positive: {analytics.bySentiment.positive || 0}</div>
      <div>Negative: {analytics.bySentiment.negative || 0}</div>
    </div>
  );
}
*/
