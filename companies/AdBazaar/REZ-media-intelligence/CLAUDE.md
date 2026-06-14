# REZ Media Intelligence

**Version:** 1.0.0
**Date:** June 2026
**Company:** AdBazaar
**Port:** 4223

## Overview
Connector service that bridges REZ Media platform to REZ Intelligence. Powers personalized marketing, ad optimization, and loyalty programs by providing RFM scoring, churn prediction, LTV prediction, segment analysis, and personalized content generation.

## Tech Stack
- Framework: Node.js (Library/Connector)
- HTTP: Axios
- External Services: REZ Intelligence API, REZ Loyalty API

## Key Features
1. **Customer Profiling** - RFM-based customer segmentation (Platinum/Gold/Silver/Bronze)
2. **Churn Prediction** - Predict customer churn risk (low/medium/high)
3. **LTV Prediction** - Predict lifetime value and expected months
4. **Campaign Targeting** - Target specific segments or customer IDs
5. **Personalized Content** - Generate personalized offers, emails, notifications
6. **DOOH Optimization** - Context-aware digital out-of-home ad optimization
7. **Tier Benefits** - Manage tier-specific benefits (cashback, free delivery, etc.)
8. **Re-engagement** - Trigger retention campaigns for at-risk customers

## Functions/Methods

| Function | Description |
|----------|-------------|
| getCustomerProfile | Get customer profile with segments and RFM tier |
| getCampaignTargets | Get campaign targeting (segments/customers) |
| generatePersonalizedContent | Generate personalized content by type |
| optimizeDOOHAd | Optimize DOOH ads based on context |
| getTierBenefits | Get benefits for a specific RFM tier |
| triggerReEngagement | Trigger re-engagement for at-risk customers |
| getBatchCustomerProfiles | Get profiles for multiple customers |
| getSegmentAnalysis | Get segment analysis |
| getContentRecommendations | Get content recommendations |
| mapRFMScore | Map RFM scores to tiers |
| healthCheck | Check service health |

## Environment Variables
- INTELLIGENCE_URL - REZ Intelligence API URL
- LOYALTY_URL - REZ Loyalty API URL
- INTERNAL_SERVICE_TOKEN - Service authentication token

## Related Services
- REZ Intelligence - AI/ML platform for intelligence
- REZ Loyalty - Loyalty program management
- REZ-marketing-service - Marketing automation
- REZ-engagement-platform - Engagement campaigns