/**
 * HR Recruiter Agent - Skills Matcher Service
 * AI-powered skills matching and gap analysis
 */
import type { Candidate, Job, SkillsAnalysis, CandidateJobMatch } from '../types';
interface SkillsMatcherConfig {
    weightExperience: number;
    weightCertifications: number;
    weightEndorsements: number;
    levelEquivalents: Record<string, number>;
}
export declare class SkillsMatcher {
    private config;
    private skillTaxonomy;
    private trainingRecommendations;
    private skillLevelScores;
    constructor(config?: Partial<SkillsMatcherConfig>);
    /**
     * Analyze skills for a candidate against job requirements
     */
    analyzeSkills(candidate: Candidate, job?: Job): SkillsAnalysis;
    /**
     * Match candidate skills against required skills
     */
    private matchSkills;
    /**
     * Check if two skills are related
     */
    private areSkillsRelated;
    /**
     * Calculate match percentage
     */
    private calculateMatchPercent;
    /**
     * Find missing skills
     */
    private findMissingSkills;
    /**
     * Calculate skill gaps
     */
    private calculateSkillGaps;
    /**
     * Get skill level score
     */
    private getSkillLevelScore;
    /**
     * Calculate skill coverage percentage
     */
    private calculateSkillCoverage;
    /**
     * Calculate skill relevance score
     */
    private calculateSkillRelevanceScore;
    /**
     * Get recommended trainings for missing skills
     */
    private getRecommendedTrainings;
    /**
     * Get training for a specific skill
     */
    private getTrainingForSkill;
    /**
     * Match candidate to job
     */
    matchCandidateToJob(candidate: Candidate, job: Job): CandidateJobMatch;
    /**
     * Calculate experience match score
     */
    private calculateExperienceMatch;
    /**
     * Calculate total years of experience
     */
    private calculateTotalYears;
    /**
     * Calculate culture match score
     */
    private calculateCultureMatch;
    /**
     * Calculate salary match score
     */
    private calculateSalaryMatch;
    /**
     * Make match recommendation
     */
    private makeMatchRecommendation;
    /**
     * Generate match reason
     */
    private generateMatchReason;
    /**
     * Rank candidates for a job
     */
    rankCandidatesForJob(candidates: Candidate[], job: Job): CandidateJobMatch[];
    /**
     * Find best matching jobs for a candidate
     */
    findBestMatchingJobs(candidate: Candidate, jobs: Job[]): CandidateJobMatch[];
    /**
     * Compare two candidates
     */
    compareCandidates(candidate1: Candidate, candidate2: Candidate, job?: Job): {
        overallWinner: 'candidate1' | 'candidate2' | 'tie';
        skillWinner: 'candidate1' | 'candidate2' | 'tie';
        experienceWinner: 'candidate1' | 'candidate2' | 'tie';
        comparison: {
            skillScores: {
                candidate1: number;
                candidate2: number;
            };
            experienceYears: {
                candidate1: number;
                candidate2: number;
            };
            certificationCounts: {
                candidate1: number;
                candidate2: number;
            };
        };
    };
    /**
     * Get skill suggestions based on job trends
     */
    getSkillSuggestions(jobTitle: string): string[];
}
export declare const skillsMatcher: SkillsMatcher;
export {};
//# sourceMappingURL=skillsMatcher.d.ts.map