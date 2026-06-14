/**
 * REZ Media Intelligence Service
 *
 * Exports all public functions and types
 */

// Re-export all types and functions from mediaIntelligence
export {
  // Types
  RFMTier,
  ChurnRisk,
  CustomerProfile,
  RFMScore,
  ChurnPrediction,
  LTVPrediction,
  Segment,
  CampaignTargets,
  PersonalizedContent,
  ContentType,
  DOOHContext,
  OptimizedAd,
  TierBenefits,
  LoyaltyOffer,
  MediaIntelligenceError,
} from './services/mediaIntelligence';

// Re-export functions with full TypeScript signatures
export {
  getCustomerProfile,
  getCampaignTargets,
  generatePersonalizedContent,
  optimizeDOOHAd,
  getTierBenefits,
  triggerReEngagement,
  getBatchCustomerProfiles,
  getSegmentAnalysis,
  getContentRecommendations,
  healthCheck,
  mapRFMScore,
} from './services/mediaIntelligence';


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'rez-media-intelligence',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
