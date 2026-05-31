/**
 * HR Recruiter Agent - Candidate Qualifier Service
 * Comprehensive candidate qualification with multi-criteria assessment
 */
import { Candidate, QualificationResult, QualificationCriteria, ScreeningResult, SalaryCurrency, SalaryBenchmark, ExperienceLevel } from '../types';
interface CandidateQualifierConfig {
    defaultMinQualificationScore: number;
    salaryBenchmarkingEnabled: boolean;
}
export declare class CandidateQualifier {
    private config;
    private salaryBenchmarks;
    constructor(config?: Partial<CandidateQualifierConfig>);
    /**
     * Qualify a candidate against criteria
     */
    qualifyCandidate(candidate: Candidate, criteria?: QualificationCriteria, screeningResult?: ScreeningResult, qualifiedBy?: string): QualificationResult;
    /**
     * Calculate experience score
     */
    private calculateExperienceScore;
    /**
     * Parse year from date string
     */
    private parseYear;
    /**
     * Calculate skills match score
     */
    private calculateSkillsMatchScore;
    /**
     * Calculate culture fit score
     */
    private calculateCultureFitScore;
    /**
     * Check career progression
     */
    private checkCareerProgression;
    /**
     * Check basic requirements
     */
    private checkBasicRequirements;
    /**
     * Check preferred requirements
     */
    private checkPreferredRequirements;
    /**
     * Calculate total years of experience
     */
    private calculateTotalYears;
    /**
     * Identify candidate strengths
     */
    private identifyStrengths;
    /**
     * Identify candidate weaknesses
     */
    private identifyWeaknesses;
    /**
     * Identify gaps between candidate and job requirements
     */
    private identifyGaps;
    /**
     * Determine qualification status
     */
    private determineQualificationStatus;
    /**
     * Generate qualification reason
     */
    private generateQualificationReason;
    /**
     * Analyze salary expectation against market
     */
    private analyzeSalaryExpectation;
    /**
     * Get salary benchmark
     */
    getSalaryBenchmark(jobTitle: string, location: string, experienceLevel: ExperienceLevel, currency?: SalaryCurrency): SalaryBenchmark | null;
    /**
     * Convert salary benchmark currency
     */
    private convertCurrency;
    /**
     * Batch qualify candidates
     */
    qualifyCandidates(candidates: Candidate[], criteria?: QualificationCriteria, screeningResults?: Map<string, ScreeningResult>): QualificationResult[];
}
export declare const candidateQualifier: CandidateQualifier;
export {};
//# sourceMappingURL=candidateQualifier.d.ts.map