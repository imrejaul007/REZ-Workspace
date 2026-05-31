/**
 * HR Recruiter Agent - Resume Screener Service
 * AI-powered resume screening with ATS scoring and keyword matching
 */
import type { Resume, ScreeningCriteria, ScreeningResult, JobRequirement } from '../types';
interface ResumeScreenerConfig {
    minSkillsMatch: number;
    minAtsScore: number;
    autoRejectThreshold: number;
    autoApproveThreshold: number;
}
export declare class ResumeScreener {
    private config;
    constructor(config?: Partial<ResumeScreenerConfig>);
    /**
     * Parse raw resume text into structured data
     */
    parseResume(resumeText: string, candidateId: string, fileName?: string): Resume;
    /**
     * Extract structured data from resume text using NLP-like patterns
     */
    private extractResumeData;
    /**
     * Extract candidate name from resume
     */
    private extractName;
    /**
     * Extract skills from resume text
     */
    private extractSkills;
    /**
     * Normalize skill names for consistency
     */
    private normalizeSkillName;
    /**
     * Extract work experience from resume text
     */
    private extractExperience;
    /**
     * Extract company names from experience text
     */
    private extractCompanies;
    /**
     * Extract education from resume text
     */
    private extractEducation;
    /**
     * Extract summary/objective from resume
     */
    private extractSummary;
    /**
     * Screen a resume against criteria
     */
    screenResume(resume: Resume, criteria?: ScreeningCriteria, screenedBy?: string): ScreeningResult;
    /**
     * Screen multiple resumes and rank them
     */
    screenResumes(resumes: Resume[], criteria: ScreeningCriteria): ScreeningResult[];
    /**
     * Calculate skills match score
     */
    private calculateSkillsScore;
    /**
     * Calculate experience score
     */
    private calculateExperienceScore;
    /**
     * Calculate education score
     */
    private calculateEducationScore;
    /**
     * Calculate culture fit score based on resume content
     */
    private calculateCultureFitScore;
    /**
     * Calculate ATS (Applicant Tracking System) score
     */
    private calculateAtsScore;
    /**
     * Calculate keyword matches
     */
    private calculateKeywordMatches;
    /**
     * Identify candidate strengths
     */
    private identifyStrengths;
    /**
     * Identify concerns in the resume
     */
    private identifyConcerns;
    /**
     * Check for career gaps
     */
    private hasCareerGaps;
    /**
     * Make screening recommendation
     */
    private makeRecommendation;
    /**
     * Generate recommendation reason
     */
    private generateRecommendationReason;
    /**
     * Match resume skills against job requirements
     */
    matchAgainstJobRequirements(resume: Resume, requirements: JobRequirement[]): {
        matchedRequirements: string[];
        missingRequirements: string[];
        matchScore: number;
    };
}
export declare const resumeScreener: ResumeScreener;
export {};
//# sourceMappingURL=resumeScreener.d.ts.map