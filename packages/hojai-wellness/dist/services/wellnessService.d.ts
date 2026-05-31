/**
 * Hojai Wellness - Service
 *
 * Emotional wellness, mood tracking, cosmic guidance
 */
import type { WellnessScore, MoodState, CosmicState, WellnessCheckIn, CosmicReading, MindfulnessSession } from '../types/index.js';
export declare class WellnessService {
    private apiKey;
    constructor(apiKey: string);
    private getHeaders;
    checkIn(data: WellnessCheckIn): Promise<{
        success: boolean;
        mood: MoodState;
        cosmic: CosmicState;
        affirmation: string;
        insight: string;
    }>;
    getCosmicContext(userId: string): Promise<{
        cosmic: CosmicState;
        dailyReading: CosmicReading;
        insights: string[];
    }>;
    getWellnessScore(userId: string): Promise<WellnessScore>;
    getDomainGuidance(userId: string, domain: string): Promise<{
        domain: string;
        guidance: string;
        practicalSteps: string[];
        symbolic: string;
    }>;
    getHumanContext(userId: string): Promise<Record<string, unknown>>;
    recordMindfulnessSession(session: MindfulnessSession): Promise<{
        success: boolean;
        message: string;
    }>;
    recordJournal(entry: JournalEntry): Promise<{
        success: boolean;
        insight: string;
    }>;
    private getEmotionalTone;
    private estimateSocialEnergy;
    private getAffirmation;
    private getInsight;
    private detectThemes;
}
export declare function createWellnessService(apiKey: string): WellnessService;
