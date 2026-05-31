"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketingAgent = exports.MarketingAgent = void 0;
const uuid_1 = require("uuid");
/**
 * Restaurant Marketing Agent
 * Composed by Restaurant Growth Consultant
 * Handles marketing campaigns, channel optimization, and promotional strategies
 */
class MarketingAgent {
    CHANNEL_BENCHMARKS = {
        instagram: { reach: 5000, engagement: 0.04, conversion: 0.02 },
        facebook: { reach: 3000, engagement: 0.02, conversion: 0.015 },
        whatsapp: { reach: 2000, engagement: 0.08, conversion: 0.05 },
        sms: { reach: 1000, engagement: 0.01, conversion: 0.03 },
        email: { reach: 1500, engagement: 0.15, conversion: 0.02 },
        google: { reach: 10000, engagement: 0.05, conversion: 0.08 },
        zomato: { reach: 8000, engagement: 0.06, conversion: 0.12 },
        swiggy: { reach: 8000, engagement: 0.06, conversion: 0.10 },
    };
    /**
     * Analyze marketing channels and recommend allocation
     */
    async analyzeChannels(currentSpend, performance) {
        const channels = [];
        // Analyze each channel
        for (const [channelName, spend] of currentSpend.entries()) {
            const perf = performance.get(channelName);
            const benchmark = this.CHANNEL_BENCHMARKS[channelName];
            if (benchmark) {
                const reach = perf?.impressions || benchmark.reach;
                const engagement = perf ? perf.conversions / Math.max(perf.impressions, 1) : benchmark.engagement;
                const conversionRate = perf ? perf.conversions / Math.max(perf.impressions, 1) : benchmark.conversion;
                const revenue = perf?.revenue || 0;
                const roi = spend > 0 ? revenue / spend : 0;
                channels.push({
                    id: (0, uuid_1.v4)(),
                    name: channelName,
                    type: this.getChannelType(channelName),
                    reach,
                    engagement,
                    conversionRate,
                    cost: spend,
                    roi,
                });
            }
        }
        return channels.sort((a, b) => b.roi - a.roi);
    }
    /**
     * Get channel type
     */
    getChannelType(channel) {
        const types = {
            instagram: 'social',
            facebook: 'social',
            whatsapp: 'social',
            sms: 'sms',
            email: 'email',
            google: 'social',
            zomato: 'offline',
            swiggy: 'offline',
        };
        return types[channel] || 'social';
    }
    /**
     * Recommend marketing budget allocation
     */
    async recommendAllocation(totalBudget, objectives) {
        const allocation = [];
        // Base allocation based on objectives
        const objectiveWeights = {
            awareness: 0.3,
            acquisition: 0.4,
            retention: 0.2,
            revenue: 0.1,
        };
        // Channel allocation based on objectives
        if (objectives.includes('awareness') || objectives.includes('acquisition')) {
            allocation.push({
                channel: 'Instagram',
                budget: totalBudget * 0.25,
                percent: 25,
                rationale: 'Best for visual storytelling and reaching new audiences',
            });
            allocation.push({
                channel: 'Google Ads',
                budget: totalBudget * 0.20,
                percent: 20,
                rationale: 'High intent traffic from search',
            });
        }
        if (objectives.includes('retention') || objectives.includes('revenue')) {
            allocation.push({
                channel: 'WhatsApp',
                budget: totalBudget * 0.20,
                percent: 20,
                rationale: 'Direct communication with existing customers',
            });
            allocation.push({
                channel: 'Email',
                budget: totalBudget * 0.15,
                percent: 15,
                rationale: 'Cost-effective retention channel',
            });
        }
        // Food delivery platforms
        if (objectives.includes('acquisition') || objectives.includes('revenue')) {
            allocation.push({
                channel: 'Zomato',
                budget: totalBudget * 0.10,
                percent: 10,
                rationale: 'Direct food ordering platform',
            });
            allocation.push({
                channel: 'Swiggy',
                budget: totalBudget * 0.10,
                percent: 10,
                rationale: 'Additional food ordering reach',
            });
        }
        return allocation;
    }
    /**
     * Create marketing campaigns
     */
    async createCampaigns(restaurantProfile, objectives) {
        const campaigns = [];
        // Awareness campaign
        if (objectives.includes('awareness')) {
            campaigns.push({
                id: (0, uuid_1.v4)(),
                name: `${restaurantProfile.name} - Taste the Difference`,
                channels: ['Instagram', 'Facebook', 'Google'],
                targetAudience: 'Food lovers in ' + restaurantProfile.location,
                objective: 'awareness',
                budget: 50000,
                expectedReach: 50000,
                expectedConversions: 500,
                timeline: '4 weeks',
            });
        }
        // Acquisition campaign
        if (objectives.includes('acquisition')) {
            campaigns.push({
                id: (0, uuid_1.v4)(),
                name: 'First Order Special - 20% Off',
                channels: ['Zomato', 'Swiggy', 'Google'],
                targetAudience: 'New customers in delivery radius',
                objective: 'acquisition',
                budget: 30000,
                expectedReach: 20000,
                expectedConversions: 400,
                timeline: '2 weeks',
            });
        }
        // Retention campaign
        if (objectives.includes('retention')) {
            campaigns.push({
                id: (0, uuid_1.v4)(),
                name: 'Loyalty Rewards Week',
                channels: ['WhatsApp', 'Email', 'SMS'],
                targetAudience: 'Existing customers',
                objective: 'retention',
                budget: 20000,
                expectedReach: 5000,
                expectedConversions: 500,
                timeline: '1 week',
            });
        }
        // Revenue campaign
        if (objectives.includes('revenue')) {
            campaigns.push({
                id: (0, uuid_1.v4)(),
                name: 'Weekend Brunch Special',
                channels: ['Instagram', 'WhatsApp'],
                targetAudience: 'Weekend diners, families',
                objective: 'revenue',
                budget: 15000,
                expectedReach: 10000,
                expectedConversions: 200,
                timeline: 'Ongoing weekends',
            });
        }
        // Special occasions
        campaigns.push({
            id: (0, uuid_1.v4)(),
            name: 'Festival Season Offers',
            channels: ['All'],
            targetAudience: 'All customer segments',
            objective: 'revenue',
            budget: 25000,
            expectedReach: 30000,
            expectedConversions: 600,
            timeline: 'Festival periods',
        });
        return campaigns;
    }
    /**
     * Generate content calendar
     */
    async generateContentCalendar(restaurantProfile, weeks = 4) {
        const calendar = [];
        const themes = [
            'Menu Highlights',
            'Behind the Scenes',
            'Customer Stories',
            'Chef Specials',
            'Community Connection',
        ];
        for (let week = 1; week <= weeks; week++) {
            const theme = themes[(week - 1) % themes.length];
            const content = [];
            // Daily content
            const contentTypes = [
                { day: 'Monday', type: 'Story', message: `Start your week with our ${restaurantProfile.cuisine[0]} specialties!` },
                { day: 'Tuesday', type: 'Post', message: 'Chef\'s special recipe reveal' },
                { day: 'Wednesday', type: 'Reel', message: 'Behind the scenes kitchen tour' },
                { day: 'Thursday', type: 'Story', message: 'Customer spotlight - see what they\'re saying!' },
                { day: 'Friday', type: 'Post', message: ' TGIF! Treat yourself to the weekend' },
                { day: 'Saturday', type: 'Reel', message: 'Weekend vibes at ' + restaurantProfile.name },
                { day: 'Sunday', type: 'Story', message: 'Family brunch - bring everyone!' },
            ];
            calendar.push({ week, theme, content: contentTypes });
        }
        return calendar;
    }
    /**
     * Calculate campaign effectiveness
     */
    calculateCampaignEffectiveness(campaign, actuals) {
        const reachScore = Math.min(100, (actuals.reach / campaign.expectedReach) * 100);
        const conversionScore = Math.min(100, (actuals.conversions / campaign.expectedConversions) * 100);
        const revenueScore = campaign.expectedReach > 0
            ? (actuals.revenue / (campaign.expectedConversions * 500)) * 100 // Assume ₹500 avg order
            : 0;
        return {
            reachScore: Math.round(reachScore),
            conversionScore: Math.round(conversionScore),
            revenueScore: Math.round(revenueScore),
            overall: Math.round((reachScore + conversionScore + revenueScore) / 3),
        };
    }
    /**
     * Optimize for next campaign
     */
    async optimizeNextCampaign(previousCampaigns) {
        // Calculate channel performance
        const channelPerformance = {};
        for (const campaign of previousCampaigns) {
            for (const channel of campaign.channels) {
                if (!channelPerformance[channel]) {
                    channelPerformance[channel] = { spend: 0, revenue: 0, conversions: 0 };
                }
                // Estimate spend allocation
                const channelSpend = campaign.revenue * 0.1 / campaign.channels.length;
                channelPerformance[channel].spend += channelSpend;
                channelPerformance[channel].revenue += campaign.revenue / campaign.channels.length;
                channelPerformance[channel].conversions += campaign.conversions / campaign.channels.length;
            }
        }
        // Generate recommendations
        const recommendations = [];
        for (const [channel, perf] of Object.entries(channelPerformance)) {
            const roi = perf.spend > 0 ? perf.revenue / perf.spend : 0;
            if (roi > 3) {
                recommendations.push({
                    channel,
                    adjustment: 'increase',
                    reason: `Strong ROI of ${roi.toFixed(1)}x - scale up`,
                });
            }
            else if (roi < 1.5) {
                recommendations.push({
                    channel,
                    adjustment: 'decrease',
                    reason: `Low ROI of ${roi.toFixed(1)}x - optimize or reduce`,
                });
            }
            else {
                recommendations.push({
                    channel,
                    adjustment: 'maintain',
                    reason: `Healthy ROI of ${roi.toFixed(1)}x - maintain current allocation`,
                });
            }
        }
        return recommendations;
    }
}
exports.MarketingAgent = MarketingAgent;
exports.marketingAgent = new MarketingAgent();
//# sourceMappingURL=marketingAgent.js.map