/**
 * Unified SDK - Connect any app to Hojai + REZ Intelligence
 *
 * Features:
 * - Event tracking (commerce, health, mobility, travel)
 * - Emotional wellness (mood check-in, cosmic context)
 * - Identity management
 */
import axios from 'axios';
export class HojaiSDK {
    apiKey;
    baseUrl;
    cosmicUrl;
    debug;
    queue = [];
    flushing = false;
    constructor(config) {
        this.apiKey = config.apiKey;
        this.baseUrl = config.baseUrl || 'http://localhost:4570';
        this.cosmicUrl = process.env.COSMIC_SERVICE_URL || 'http://localhost:4163';
        this.debug = config.debug || false;
        // Flush queue on interval
        setInterval(() => this.flush(), 5000);
    }
    async emit(options) {
        const event = {
            ...options,
            timestamp: new Date().toISOString(),
            sdk: 'unified-v2'
        };
        if (this.debug) {
            console.log('[HojaiSDK] Emit:', event);
        }
        // Add to queue
        this.queue.push(event);
        // Flush immediately if queue is large
        if (this.queue.length >= 10) {
            await this.flush();
        }
    }
    async flush() {
        if (this.flushing || this.queue.length === 0)
            return;
        this.flushing = true;
        const batch = this.queue.splice(0, 50);
        try {
            await axios.post(`${this.baseUrl}/api/events/batch`, { events: batch }, {
                headers: { 'X-API-Key': this.apiKey }
            });
        }
        catch (e) {
            // Re-add failed events
            this.queue.unshift(...batch);
            console.error('[HojaiSDK] Batch failed, will retry');
        }
        this.flushing = false;
    }
    // ============================================
    // COMMERCE TRACKING
    // ============================================
    async trackCommerce(data) {
        return this.emit({ source: 'commerce', event: data.action, userId: data.userId, data: data });
    }
    async trackPurchase(data) {
        return this.emit({ source: 'commerce', event: 'purchase', userId: data.userId, data: data });
    }
    async trackCart(data) {
        return this.emit({ source: 'commerce', event: `cart_${data.action}`, userId: data.userId, data: data });
    }
    // ============================================
    // HEALTH & WELLNESS TRACKING
    // ============================================
    async trackHealth(data) {
        return this.emit({ source: 'health', event: 'metrics', userId: data.userId, data: data, privacy: 'sensitive' });
    }
    async trackFitness(data) {
        return this.emit({ source: 'fitness', event: data.activity, userId: data.userId, data: data });
    }
    async trackSleep(data) {
        return this.emit({ source: 'health', event: 'sleep', userId: data.userId, data: data, privacy: 'sensitive' });
    }
    // ============================================
    // EMOTIONAL WELLNESS (NEW)
    // ============================================
    /**
     * Record a mood check-in with cosmic interpretation
     */
    async wellnessCheckIn(data) {
        try {
            const response = await axios.post(`${this.cosmicUrl}/api/mood/checkin`, {
                userId: data.userId,
                mood: data.mood,
                energy: data.energy * 20, // 1-5 to 20-100
            }, { headers: { 'X-API-Key': this.apiKey } });
            return {
                success: true,
                mood: {
                    current: data.mood,
                    energy: data.energy * 20,
                    stress: 100 - (data.energy * 20),
                    socialEnergy: this.estimateSocialEnergy(data.mood),
                },
                cosmic: response.data.cosmicInterpretation || {
                    energyLevel: data.energy >= 4 ? 'high' : data.energy >= 2 ? 'medium' : 'low',
                    emotionalTone: this.getEmotionalTone(data.mood),
                    focusScore: data.energy >= 3 ? 75 : 50,
                    socialEnergy: this.estimateSocialEnergy(data.mood),
                },
                affirmation: response.data.affirmation || this.getAffirmation(data.mood),
                insight: response.data.cosmicInterpretation?.practical || this.getInsight(data.mood),
            };
        }
        catch {
            // Fallback to local interpretation
            return {
                success: true,
                mood: {
                    current: data.mood,
                    energy: data.energy * 20,
                    stress: 100 - (data.energy * 20),
                    socialEnergy: this.estimateSocialEnergy(data.mood),
                },
                cosmic: {
                    energyLevel: data.energy >= 4 ? 'high' : data.energy >= 2 ? 'medium' : 'low',
                    emotionalTone: this.getEmotionalTone(data.mood),
                    focusScore: data.energy >= 3 ? 75 : 50,
                    socialEnergy: this.estimateSocialEnergy(data.mood),
                },
                affirmation: this.getAffirmation(data.mood),
                insight: this.getInsight(data.mood),
            };
        }
    }
    /**
     * Get cosmic context for a user
     */
    async getCosmicContext(userId) {
        try {
            const response = await axios.get(`${this.cosmicUrl}/api/cosmic/${userId}`, { headers: { 'X-API-Key': this.apiKey } });
            return {
                cosmic: response.data.cosmic,
                dailyReading: response.data.dailyReading,
                suggestedActions: response.data.suggestedActions || [],
            };
        }
        catch {
            return {
                cosmic: {
                    energyLevel: 'medium',
                    emotionalTone: 'Balanced and steady',
                    focusScore: 70,
                    socialEnergy: 60,
                },
                suggestedActions: ['Take a moment to breathe', 'Be present with yourself'],
            };
        }
    }
    /**
     * Get domain-specific guidance
     */
    async getGuidance(userId, domain) {
        try {
            const response = await axios.get(`${this.cosmicUrl}/api/guidance/${userId}/${domain}`, { headers: { 'X-API-Key': this.apiKey } });
            return {
                guidance: response.data.guidance?.guidance || 'Trust your path',
                practicalSteps: response.data.guidance?.practicalSteps || ['Breathe', 'Be present'],
                symbolic: response.data.guidance?.symbolic || 'Growth takes time',
            };
        }
        catch {
            return {
                guidance: 'Follow your intuition',
                practicalSteps: ['Take one step at a time'],
                symbolic: 'Every journey is unique',
            };
        }
    }
    // ============================================
    // MOBILITY TRACKING
    // ============================================
    async trackMobility(data) {
        return this.emit({ source: 'mobility', event: data.rideType, userId: data.userId, data: data });
    }
    async trackTravel(data) {
        return this.emit({ source: 'travel', event: 'booking', userId: data.userId, data: data });
    }
    // ============================================
    // IDENTITY
    // ============================================
    async identify(userId, traits) {
        return this.emit({ source: 'identity', event: 'identify', userId, data: { traits } });
    }
    // ============================================
    // PRIVATE HELPERS
    // ============================================
    getEmotionalTone(mood) {
        const tones = {
            radiant: 'Radiant and expansive',
            bright: 'Warm and hopeful',
            balanced: 'Steady and centered',
            clouded: 'Contemplative and reflective',
            stormy: 'Intense and transformative',
            peaceful: 'Serene and content',
            restless: 'Eager and searching',
            tired: 'Quiet and introspective',
        };
        return tones[mood] || 'Balanced and steady';
    }
    estimateSocialEnergy(mood) {
        const energy = {
            radiant: 90, bright: 80, balanced: 60,
            clouded: 40, stormy: 30, peaceful: 50,
            restless: 70, tired: 30,
        };
        return energy[mood] || 50;
    }
    getAffirmation(mood) {
        const affirmations = {
            radiant: 'Your light illuminates the path for others',
            bright: 'Today brings opportunities aligned with your highest good',
            balanced: 'In equilibrium, all things become possible',
            clouded: 'Even clouds have silver linings - look for the gift',
            stormy: 'After every storm comes clarity',
            peaceful: 'This peace is a treasure - savor it',
            restless: 'The search is part of the journey',
            tired: 'Rest is not retreat - it is how growth happens',
        };
        return affirmations[mood] || 'You are exactly where you need to be';
    }
    getInsight(mood) {
        const insights = {
            radiant: 'This energy is meant to be shared wisely',
            bright: 'Act on positive impulses with care',
            balanced: 'This equilibrium is a strength',
            clouded: 'Clarity returns when you are ready',
            stormy: 'Breathe through - this too shall pass',
            peaceful: 'Share this calm energy gently with others',
            restless: 'Channel restlessness into curiosity',
            tired: 'Prioritize rest above productivity',
        };
        return insights[mood] || 'Trust the process';
    }
}
// Factory
export function createSDK(config) {
    return new HojaiSDK(config);
}
//# sourceMappingURL=index.js.map