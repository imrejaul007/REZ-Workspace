"use strict";
// ============================================
// HOJAI AI - Ad Copier Service
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.adCopier = exports.AdCopierService = void 0;
const models_1 = require("../models");
const types_1 = require("../types");
const logger_1 = require("../utils/logger");
class AdCopierService {
    config;
    constructor(config) {
        this.config = {
            maxHeadlines: config?.maxHeadlines || 10,
            maxDescriptions: config?.maxDescriptions || 5,
            defaultPlatform: config?.defaultPlatform || types_1.SocialPlatform.LINKEDIN
        };
    }
    /**
     * Generate ad copy based on product and requirements
     */
    async generateAdCopy(tenantId, params) {
        logger_1.logger.info('Generating ad copy', { tenantId, adType: params.adType, product: params.productName });
        const numHeadlines = Math.min(params.headlineOptions || 3, this.config.maxHeadlines);
        const numDescriptions = Math.min(params.descriptionOptions || 2, this.config.maxDescriptions);
        const platform = params.platform || this.config.defaultPlatform;
        // Generate headlines based on ad type
        const headlines = this.generateHeadlines(params.adType, params.productName, params.targetAudience, params.keywords, numHeadlines);
        // Generate descriptions
        const descriptions = this.generateDescriptions(params.adType, params.productName, params.productDescription, params.targetAudience, numDescriptions, platform);
        // Generate call-to-actions
        const callToActions = this.generateCTAs(params.adType, params.cta);
        // Generate body copy
        const body = this.generateBody(params.adType, params.productName, params.productDescription, params.targetAudience);
        // Store ad copy
        await models_1.AdCopy.create({
            tenantId,
            adType: params.adType,
            platform,
            productName: params.productName,
            productDescription: params.productDescription,
            targetAudience: params.targetAudience,
            headlines,
            descriptions,
            callToActions,
            body,
            keywords: params.keywords || []
        });
        return {
            headlines,
            descriptions,
            callToActions,
            body
        };
    }
    /**
     * Generate headlines based on ad type
     */
    generateHeadlines(adType, productName, targetAudience, keywords, count = 3) {
        const headlineTemplates = {
            [types_1.AdType.SEARCH]: [
                `${productName} - Official Site`,
                `Best ${productName} | Free Trial`,
                `${productName} - Compare Prices`,
                `Get ${productName} Today`,
                `${productName} Reviews & Ratings`
            ],
            [types_1.AdType.DISPLAY]: [
                `Discover ${productName}`,
                `Transform Your Business with ${productName}`,
                `The Future is ${productName}`,
                `Unlock Your Potential with ${productName}`,
                `${productName} - Game Changer`
            ],
            [types_1.AdType.SOCIAL]: [
                `Why ${productName} is Worth It`,
                `Why Smart Businesses Choose ${productName}`,
                `${productName} - The Smart Choice`,
                `Join Thousands Using ${productName}`,
                `${productName}: What You Need to Know`
            ],
            [types_1.AdType.VIDEO]: [
                `See ${productName} in Action`,
                `Watch: How ${productName} Works`,
                `${productName} Demo Video`,
                `30-Second ${productName} Overview`,
                `Experience ${productName}`
            ],
            [types_1.AdType.NATIVE]: [
                `I Tried ${productName} - Here's What Happened`,
                `${productName}: A Game-Changer`,
                `Why Everyone's Talking About ${productName}`,
                `The Truth About ${productName}`,
                `${productName} Changed Everything`
            ],
            [types_1.AdType.SEARCH_GENERATION]: [
                `${productName} Solutions`,
                `${productName} - Find What You Need`,
                `Shop ${productName} Online`,
                `${productName} - Browse & Compare`,
                `${productName} Near You`
            ]
        };
        let templates = headlineTemplates[adType] || headlineTemplates[types_1.AdType.DISPLAY];
        // Add audience-specific variations
        if (targetAudience) {
            templates = templates.map(t => {
                if (t.includes('Your') || t.includes('your')) {
                    return t.replace('Your', targetAudience);
                }
                return t;
            });
        }
        // Add keyword-based variations
        if (keywords && keywords.length > 0) {
            const keyword = keywords[0];
            templates.push(`${productName} for ${keyword}`);
            templates.push(`${keyword} Solution: ${productName}`);
        }
        // Shuffle and return requested count
        const shuffled = this.shuffleArray([...templates]);
        return shuffled.slice(0, count);
    }
    /**
     * Generate descriptions based on ad type and platform
     */
    generateDescriptions(adType, productName, productDescription, targetAudience, count = 2, platform) {
        const baseDescription = productDescription || `Discover how ${productName} can help you achieve your goals.`;
        const platformLimits = {
            'twitter': 80,
            'linkedin': 150,
            'facebook': 125,
            'instagram': 125,
            'youtube': 5000,
            'tiktok': 150,
            'threads': 150,
            'reddit': 300
        };
        const charLimit = platform ? (platformLimits[platform] || 150) : 150;
        const templates = {
            [types_1.AdType.SEARCH]: [
                `Get instant access to ${productName}. Start your free trial today and see results.`,
                `Join 10,000+ users choosing ${productName} for better results. Try free.`,
                `Professional ${productName} solution. Sign up now for exclusive pricing.`,
                `Trusted by industry leaders. Discover ${productName} today.`
            ],
            [types_1.AdType.DISPLAY]: [
                `${productName} helps you work smarter, not harder. Try it free today.`,
                `Transform your workflow with ${productName}. No credit card required.`,
                `${productName} - The all-in-one solution you've been looking for.`,
                `Simple, powerful, affordable. That's ${productName}.`
            ],
            [types_1.AdType.SOCIAL]: [
                baseDescription,
                `${productName} is changing the game. Here's what makes it different.`,
                `Don't take our word for it. See why ${productName} is trending.`,
                `The secret weapon successful teams use: ${productName}.`
            ],
            [types_1.AdType.VIDEO]: [
                `See how ${productName} works in this quick overview.`,
                `From setup to results in under 2 minutes with ${productName}.`,
                `Learn why ${productName} is the #1 choice for professionals.`,
                `Everything you need to know about ${productName} in one video.`
            ],
            [types_1.AdType.NATIVE]: [
                `We tested ${productName} for 30 days. Here's our honest review.`,
                `Is ${productName} worth the hype? We found out.`,
                `Why ${productName} might be exactly what you need.`,
                `The real story behind ${productName}.`
            ],
            [types_1.AdType.SEARCH_GENERATION]: [
                `Shop ${productName} - Best selection and prices.`,
                `Find ${productName} near you. Local and online options.`,
                `Compare ${productName} prices from top retailers.`
            ]
        };
        let descriptions = templates[adType] || templates[types_1.AdType.DISPLAY];
        // Truncate to platform limit
        descriptions = descriptions.map(d => {
            if (d.length > charLimit) {
                return d.substring(0, charLimit - 3) + '...';
            }
            return d;
        });
        const shuffled = this.shuffleArray([...descriptions]);
        return shuffled.slice(0, count);
    }
    /**
     * Generate call-to-action variations
     */
    generateCTAs(adType, customCTA) {
        const ctaTemplates = {
            [types_1.AdType.SEARCH]: [
                'Get Started Free',
                'Start Free Trial',
                'Get a Quote',
                'Learn More',
                'Shop Now'
            ],
            [types_1.AdType.DISPLAY]: [
                'Try It Free',
                'Get Started',
                'Learn More',
                'Sign Up Today',
                'Start Now'
            ],
            [types_1.AdType.SOCIAL]: [
                'Learn More',
                'See How It Works',
                'Get Started',
                'Join Now',
                'Try for Free'
            ],
            [types_1.AdType.VIDEO]: [
                'Watch Demo',
                'See More',
                'Try Free',
                'Get Started',
                'Learn More'
            ],
            [types_1.AdType.NATIVE]: [
                'Read More',
                'See Full Story',
                'Try It',
                'Learn More',
                'See Why'
            ],
            [types_1.AdType.SEARCH_GENERATION]: [
                'Shop Now',
                'Find Near You',
                'Compare Prices',
                'View Options',
                'See Results'
            ]
        };
        const ctas = customCTA
            ? [customCTA, ...ctaTemplates[adType] || ctaTemplates[types_1.AdType.DISPLAY]]
            : ctaTemplates[adType] || ctaTemplates[types_1.AdType.DISPLAY];
        return [...new Set(ctas)].slice(0, 5);
    }
    /**
     * Generate body copy
     */
    generateBody(adType, productName, productDescription, targetAudience) {
        const audience = targetAudience ? ` for ${targetAudience}` : '';
        const bodies = {
            [types_1.AdType.SEARCH]: `Discover ${productName}${audience}. Get started with a free trial today.`,
            [types_1.AdType.DISPLAY]: `${productName} delivers results that matter.

• Easy to use
• Powerful features
• Affordable pricing
• Trusted by thousands

Start your free trial today.`,
            [types_1.AdType.SOCIAL]: `What makes ${productName} different?

• Designed for real results
• Backed by customer success stories
• Continuously improving with updates
• Support when you need it

Try ${productName} free for 14 days.`,
            [types_1.AdType.VIDEO]: `In this video, you'll discover:
- How ${productName} works
- Real customer success stories
- Key features and benefits
- Getting started tips

Watch to learn more about ${productName}.`,
            [types_1.AdType.NATIVE]: `${productName} - Worth the Hype?

We spent 30 days testing ${productName}${audience}. Here's what we found.

The good, the bad, and whether it's worth your time.

Read our full review to decide for yourself.`,
            [types_1.AdType.SEARCH_GENERATION]: `${productName} available now.

Browse our full selection and find the perfect option for your needs.

Free shipping on orders over $50.`
        };
        return bodies[adType] || bodies[types_1.AdType.DISPLAY];
    }
    /**
     * Get ad copy by ID
     */
    async getAdCopy(tenantId, adCopyId) {
        const doc = await models_1.AdCopy.findOne({ _id: adCopyId, tenantId });
        if (!doc)
            return null;
        return this.mapToIAdCopy(doc);
    }
    /**
     * List ad copies
     */
    async listAdCopies(tenantId, filters) {
        const query = { tenantId };
        if (filters.adType)
            query.adType = filters.adType;
        if (filters.platform)
            query.platform = filters.platform;
        const [docs, total] = await Promise.all([
            models_1.AdCopy.find(query)
                .sort({ createdAt: -1 })
                .skip(filters.offset || 0)
                .limit(filters.limit || 20)
                .lean(),
            models_1.AdCopy.countDocuments(query)
        ]);
        return {
            items: docs.map(doc => this.mapToIAdCopy(doc)),
            total
        };
    }
    /**
     * Get A/B test variations
     */
    async generateABVariations(tenantId, params) {
        logger_1.logger.info('Generating A/B variations', { tenantId, product: params.productName });
        const numVariations = params.variations || 3;
        const variations = [];
        for (let i = 0; i < numVariations; i++) {
            const variation = await this.generateAdCopy(tenantId, {
                adType: params.adType,
                productName: params.productName,
                productDescription: params.productDescription,
                targetAudience: params.targetAudience,
                headlineOptions: 2,
                descriptionOptions: 1,
                cta: i === 0 ? 'Get Started' : i === 1 ? 'Try Free' : 'Learn More'
            });
            variations.push({
                variationId: `var_${Date.now()}_${i}`,
                headlines: variation.headlines,
                descriptions: variation.descriptions,
                callToActions: variation.callToActions
            });
        }
        return variations;
    }
    /**
     * Get platform-specific ad copy
     */
    async getPlatformAdCopy(tenantId, platform, adType) {
        const query = { tenantId, platform };
        if (adType)
            query.adType = adType;
        const docs = await models_1.AdCopy.find(query)
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();
        return docs.map(doc => this.mapToIAdCopy(doc));
    }
    /**
     * Duplicate ad copy for new platform
     */
    async duplicateAdCopy(tenantId, adCopyId, newPlatform) {
        const original = await models_1.AdCopy.findOne({ _id: adCopyId, tenantId });
        if (!original)
            return null;
        const duplicated = await models_1.AdCopy.create({
            tenantId,
            adType: original.adType,
            platform: newPlatform,
            productName: original.productName,
            productDescription: original.productDescription,
            targetAudience: original.targetAudience,
            headlines: original.headlines,
            descriptions: original.descriptions.map(d => {
                // Truncate for Twitter limit
                if (newPlatform === types_1.SocialPlatform.TWITTER && d.length > 80) {
                    return d.substring(0, 77) + '...';
                }
                return d;
            }),
            callToActions: original.callToActions,
            body: original.body,
            keywords: original.keywords
        });
        return this.mapToIAdCopy(duplicated);
    }
    /**
     * Shuffle array (Fisher-Yates)
     */
    shuffleArray(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
    /**
     * Map document to interface
     */
    mapToIAdCopy(doc) {
        return {
            id: doc._id?.toString() || '',
            tenantId: doc.tenantId || '',
            adType: doc.adType,
            platform: doc.platform,
            productName: doc.productName || '',
            productDescription: doc.productDescription,
            targetAudience: doc.targetAudience,
            headlines: doc.headlines || [],
            descriptions: doc.descriptions || [],
            callToActions: doc.callToActions || [],
            body: doc.body,
            displayUrl: doc.displayUrl,
            createdAt: doc.createdAt || new Date(),
            updatedAt: doc.updatedAt || new Date()
        };
    }
}
exports.AdCopierService = AdCopierService;
// Export singleton instance
exports.adCopier = new AdCopierService();
//# sourceMappingURL=adCopier.js.map