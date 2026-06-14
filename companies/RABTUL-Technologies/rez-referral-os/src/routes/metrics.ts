/**
 * Prometheus Metrics for REZ Referral OS
 */

import { Router, Request, Response } from 'express';
import { Referral, ReferralCode, CreatorProfile, Campaign, ReferralReward } from '../models';

const router = Router();

/**
 * GET /metrics
 * Prometheus-compatible metrics endpoint
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    // Collect metrics
    const [
      totalReferrals,
      qualifiedReferrals,
      totalReferralCodes,
      totalCreators,
      totalCampaigns,
      activeCampaigns,
      totalRewards,
    ] = await Promise.all([
      Referral.countDocuments(),
      Referral.countDocuments({ status: 'rewarded' }),
      ReferralCode.countDocuments(),
      CreatorProfile.countDocuments(),
      Campaign.countDocuments(),
      Campaign.countDocuments({ isActive: true }),
      ReferralReward.countDocuments(),
    ]);

    // Calculate conversion rate
    const conversionRate = totalReferrals > 0
      ? ((qualifiedReferrals / totalReferrals) * 100).toFixed(2)
      : '0.00';

    // Prometheus format
    const metrics = `
# HELP referral_total Total number of referrals
# TYPE referral_total gauge
referral_total ${totalReferrals}

# HELP referral_qualified Number of qualified referrals
# TYPE referral_qualified gauge
referral_qualified ${qualifiedReferrals}

# HELP referral_conversion_rate Conversion rate percentage
# TYPE referral_conversion_rate gauge
referral_conversion_rate ${conversionRate}

# HELP referral_codes_total Total referral codes
# TYPE referral_codes_total gauge
referral_codes_total ${totalReferralCodes}

# HELP creator_profiles_total Total creator profiles
# TYPE creator_profiles_total gauge
creator_profiles_total ${totalCreators}

# HELP campaigns_total Total campaigns
# TYPE campaigns_total gauge
campaigns_total ${totalCampaigns}

# HELP campaigns_active Active campaigns
# TYPE campaigns_active gauge
campaigns_active ${activeCampaigns}

# HELP rewards_total Total rewards issued
# TYPE rewards_total gauge
rewards_total ${totalRewards}

# HELP referrals_by_status Referral counts by status
# TYPE referrals_by_status gauge
referrals_by_status{status="pending"} ${await Referral.countDocuments({ status: 'pending' })}
referrals_by_status{status="registered"} ${await Referral.countDocuments({ status: 'registered' })}
referrals_by_status{status="qualified"} ${await Referral.countDocuments({ status: 'qualified' })}
referrals_by_status{status="rewarded"} ${await Referral.countDocuments({ status: 'rewarded' })}

# HELP creators_by_tier Creator counts by tier
# TYPE creators_by_tier gauge
creators_by_tier{tier="starter"} ${await CreatorProfile.countDocuments({ tier: 'starter' })}
creators_by_tier{tier="pro"} ${await CreatorProfile.countDocuments({ tier: 'pro' })}
creators_by_tier{tier="elite"} ${await CreatorProfile.countDocuments({ tier: 'elite' })}
creators_by_tier{tier="partner"} ${await CreatorProfile.countDocuments({ tier: 'partner' })}
creators_by_tier{tier="ambassador"} ${await CreatorProfile.countDocuments({ tier: 'ambassador' })}
`.trim();

    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    res.status(500).send('# Error collecting metrics\n');
  }
});

export default router;
