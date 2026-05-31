/**
 * Hojai Wellness - Service
 *
 * Emotional wellness, mood tracking, cosmic guidance
 */
import axios from 'axios';
// Service URLs
const WELLNESS_SERVICE = process.env.WELLNESS_SERVICE_URL || 'http://localhost:4160';
const COSMIC_SERVICE = process.env.COSMIC_SERVICE_URL || 'http://localhost:4163';
const HUMAN_CONTEXT = process.env.HUMAN_CONTEXT_URL || 'http://localhost:4162';
export class WellnessService {
    apiKey;
    constructor(apiKey) {
        this.apiKey = apiKey;
    }
    getHeaders() {
        return { 'X-API-Key': this.apiKey };
    }
    // Mood Check-In
    async checkIn(data) {
        try {
            const response = await axios.post(`${COSMIC_SERVICE}/api/mood/checkin`, {
                userId: data.userId,
                mood: data.mood,
                energy: data.energy * 20, // 1-5 to 20-100
            }, { headers: this.getHeaders() });
            const cosmic = response.data.cosmicInterpretation;
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
                affirmation: response.data.cosmicInterpretation?.practical || this.getAffirmation(data.mood),
                insight: response.data.cosmicInterpretation?.interpretation || 'Trust the process',
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
    // Get Cosmic Context
    async getCosmicContext(userId) {
        try {
            const response = await axios.get(`${COSMIC_SERVICE}/api/cosmic/${userId}`, { headers: this.getHeaders() });
            return {
                cosmic: response.data.cosmic,
                dailyReading: {
                    dailyTheme: response.data.dailyReading?.primaryTheme || 'Balance',
                    affirmation: response.data.dailyReading?.affirmation || 'Be present',
                    guidance: response.data.council?.consensus || 'Trust yourself',
                    agents: response.data.council?.agents || ['mystic', 'healer'],
                    timingAdvice: 'Follow your inner guidance',
                },
                insights: response.data.suggestedActions || [],
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
                dailyReading: {
                    dailyTheme: 'Balance',
                    affirmation: 'You are exactly where you need to be',
                    guidance: 'Trust the journey',
                    agents: ['mystic', 'healer'],
                    timingAdvice: 'Now is the perfect time',
                },
                insights: ['Take a moment to breathe', 'Be present with yourself'],
            };
        }
    }
    // Get Wellness Score
    async getWellnessScore(userId) {
        try {
            const response = await axios.get(`${WELLNESS_SERVICE}/api/wellness/${userId}`, { headers: this.getHeaders() });
            return response.data.wellness?.scores || {
                overall: 70,
                mental: 70,
                emotional: 70,
                social: 70,
                purpose: 70,
                growth: 70,
            };
        }
        catch {
            return {
                overall: 70,
                mental: 70,
                emotional: 70,
                social: 70,
                purpose: 70,
                growth: 70,
            };
        }
    }
    // Get Domain Guidance
    async getDomainGuidance(userId, domain) {
        try {
            const response = await axios.get(`${COSMIC_SERVICE}/api/guidance/${userId}/${domain}`, { headers: this.getHeaders() });
            return {
                domain,
                guidance: response.data.guidance?.guidance || 'Trust your path',
                practicalSteps: response.data.guidance?.practicalSteps || ['Breathe', 'Be present'],
                symbolic: response.data.guidance?.symbolic || 'Growth takes time',
            };
        }
        catch {
            return {
                domain,
                guidance: 'Follow your intuition',
                practicalSteps: ['Take one step at a time', 'Be patient with yourself'],
                symbolic: 'Every journey is unique',
            };
        }
    }
    // Get Human Context (for internal use)
    async getHumanContext(userId) {
        try {
            const response = await axios.post(`${HUMAN_CONTEXT}/api/context`, { userId, includeCosmic: true }, { headers: this.getHeaders() });
            return response.data;
        }
        catch {
            return {};
        }
    }
    // Mindfulness Session
    async recordMindfulnessSession(session) {
        // In production, this would store the session
        return {
            success: true,
            message: `Mindfulness session (${session.type}, ${session.duration}min) recorded`,
        };
    }
    // Journal Entry
    async recordJournal(entry) {
        // In production, this would store and potentially analyze the entry
        const themes = this.detectThemes(entry.reflection);
        return {
            success: true,
            insight: themes.length > 0
                ? `Your reflections often center on ${themes.join(' and ')}`
                : 'Your reflections show thoughtful self-awareness',
        };
    }
    // Private helpers
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
            radiant: 90,
            bright: 80,
            balanced: 60,
            clouded: 40,
            stormy: 30,
            peaceful: 50,
            restless: 70,
            tired: 30,
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
    detectThemes(text) {
        const themeKeywords = {
            relationships: ['love', 'family', 'friend', 'connection', 'together'],
            career: ['work', 'career', 'goals', 'success', 'ambition'],
            growth: ['learn', 'grow', 'change', 'improve', 'evolve'],
            health: ['health', 'body', 'energy', 'wellness', 'exercise'],
            spirituality: ['peace', 'meaning', 'purpose', 'soul', 'spirit'],
        };
        const lowerText = text.toLowerCase();
        const themes = [];
        for (const [theme, keywords] of Object.entries(themeKeywords)) {
            if (keywords.some(k => lowerText.includes(k))) {
                themes.push(theme);
            }
        }
        return themes;
    }
}
// Factory function
export function createWellnessService(apiKey) {
    return new WellnessService(apiKey);
}
