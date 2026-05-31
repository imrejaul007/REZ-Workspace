"use strict";
/**
 * HR Recruiter Agent - Candidate Qualifier Service
 * Comprehensive candidate qualification with multi-criteria assessment
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.candidateQualifier = exports.CandidateQualifier = void 0;
const types_1 = require("../types");
class CandidateQualifier {
    config;
    // Industry salary benchmarks (INR - Annual)
    salaryBenchmarks = new Map([
        ['Software Engineer', [
                { jobTitle: 'Software Engineer', location: 'India', experienceLevel: types_1.ExperienceLevel.JUNIOR, currency: types_1.SalaryCurrency.INR, salaryRange: { min: 300000, median: 500000, max: 800000 }, percentiles: { p10: 300000, p25: 400000, p50: 500000, p75: 650000, p90: 800000 }, byEmploymentType: {}, dataSource: 'Industry Survey 2024', dataDate: '2024-01', sampleSize: 5000 },
                { jobTitle: 'Software Engineer', location: 'India', experienceLevel: types_1.ExperienceLevel.MIDDLE, currency: types_1.SalaryCurrency.INR, salaryRange: { min: 600000, median: 1000000, max: 1500000 }, percentiles: { p10: 600000, p25: 800000, p50: 1000000, p75: 1200000, p90: 1500000 }, byEmploymentType: {}, dataSource: 'Industry Survey 2024', dataDate: '2024-01', sampleSize: 8000 },
                { jobTitle: 'Software Engineer', location: 'India', experienceLevel: types_1.ExperienceLevel.SENIOR, currency: types_1.SalaryCurrency.INR, salaryRange: { min: 1200000, median: 1800000, max: 3000000 }, percentiles: { p10: 1200000, p25: 1500000, p50: 1800000, p75: 2200000, p90: 3000000 }, byEmploymentType: {}, dataSource: 'Industry Survey 2024', dataDate: '2024-01', sampleSize: 6000 },
            ]],
        ['Product Manager', [
                { jobTitle: 'Product Manager', location: 'India', experienceLevel: types_1.ExperienceLevel.MIDDLE, currency: types_1.SalaryCurrency.INR, salaryRange: { min: 1200000, median: 1800000, max: 2800000 }, percentiles: { p10: 1200000, p25: 1500000, p50: 1800000, p75: 2200000, p90: 2800000 }, byEmploymentType: {}, dataSource: 'Industry Survey 2024', dataDate: '2024-01', sampleSize: 3000 },
                { jobTitle: 'Product Manager', location: 'India', experienceLevel: types_1.ExperienceLevel.SENIOR, currency: types_1.SalaryCurrency.INR, salaryRange: { min: 2500000, median: 3500000, max: 5000000 }, percentiles: { p10: 2500000, p25: 3000000, p50: 3500000, p75: 4000000, p90: 5000000 }, byEmploymentType: {}, dataSource: 'Industry Survey 2024', dataDate: '2024-01', sampleSize: 2000 },
            ]],
        ['Data Scientist', [
                { jobTitle: 'Data Scientist', location: 'India', experienceLevel: types_1.ExperienceLevel.JUNIOR, currency: types_1.SalaryCurrency.INR, salaryRange: { min: 500000, median: 700000, max: 1000000 }, percentiles: { p10: 500000, p25: 600000, p50: 700000, p75: 850000, p90: 1000000 }, byEmploymentType: {}, dataSource: 'Industry Survey 2024', dataDate: '2024-01', sampleSize: 2500 },
                { jobTitle: 'Data Scientist', location: 'India', experienceLevel: types_1.ExperienceLevel.MIDDLE, currency: types_1.SalaryCurrency.INR, salaryRange: { min: 900000, median: 1400000, max: 2000000 }, percentiles: { p10: 900000, p25: 1100000, p50: 1400000, p75: 1700000, p90: 2000000 }, byEmploymentType: {}, dataSource: 'Industry Survey 2024', dataDate: '2024-01', sampleSize: 3500 },
            ]],
        ['Designer', [
                { jobTitle: 'Designer', location: 'India', experienceLevel: types_1.ExperienceLevel.JUNIOR, currency: types_1.SalaryCurrency.INR, salaryRange: { min: 250000, median: 400000, max: 600000 }, percentiles: { p10: 250000, p25: 300000, p50: 400000, p75: 500000, p90: 600000 }, byEmploymentType: {}, dataSource: 'Industry Survey 2024', dataDate: '2024-01', sampleSize: 2000 },
                { jobTitle: 'Designer', location: 'India', experienceLevel: types_1.ExperienceLevel.MIDDLE, currency: types_1.SalaryCurrency.INR, salaryRange: { min: 500000, median: 800000, max: 1200000 }, percentiles: { p10: 500000, p25: 600000, p50: 800000, p75: 1000000, p90: 1200000 }, byEmploymentType: {}, dataSource: 'Industry Survey 2024', dataDate: '2024-01', sampleSize: 2500 },
            ]],
        ['Marketing Manager', [
                { jobTitle: 'Marketing Manager', location: 'India', experienceLevel: types_1.ExperienceLevel.MIDDLE, currency: types_1.SalaryCurrency.INR, salaryRange: { min: 600000, median: 1000000, max: 1500000 }, percentiles: { p10: 600000, p25: 800000, p50: 1000000, p75: 1200000, p90: 1500000 }, byEmploymentType: {}, dataSource: 'Industry Survey 2024', dataDate: '2024-01', sampleSize: 3000 },
                { jobTitle: 'Marketing Manager', location: 'India', experienceLevel: types_1.ExperienceLevel.SENIOR, currency: types_1.SalaryCurrency.INR, salaryRange: { min: 1200000, median: 1800000, max: 2800000 }, percentiles: { p10: 1200000, p25: 1500000, p50: 1800000, p75: 2200000, p90: 2800000 }, byEmploymentType: {}, dataSource: 'Industry Survey 2024', dataDate: '2024-01', sampleSize: 2000 },
            ]],
    ]);
    constructor(config) {
        this.config = {
            defaultMinQualificationScore: 60,
            salaryBenchmarkingEnabled: true,
            ...config,
        };
    }
    /**
     * Qualify a candidate against criteria
     */
    qualifyCandidate(candidate, criteria, screeningResult, qualifiedBy = 'system') {
        const effectiveCriteria = {
            minQualificationScore: this.config.defaultMinQualificationScore,
            ...criteria,
        };
        // Calculate individual scores
        const experienceScore = this.calculateExperienceScore(candidate);
        const skillsMatchScore = this.calculateSkillsMatchScore(candidate, effectiveCriteria);
        const cultureFitScore = this.calculateCultureFitScore(candidate);
        // Overall qualification score (weighted)
        const qualificationScore = Math.round(experienceScore * 0.35 +
            skillsMatchScore * 0.40 +
            cultureFitScore * 0.25);
        // Check if basic requirements are met
        const meetsBasicRequirements = this.checkBasicRequirements(candidate, effectiveCriteria);
        const meetsPreferredRequirements = this.checkPreferredRequirements(candidate, effectiveCriteria);
        // Identify strengths, weaknesses, and gaps
        const strengths = this.identifyStrengths(candidate, experienceScore, skillsMatchScore, cultureFitScore);
        const weaknesses = this.identifyWeaknesses(candidate, effectiveCriteria);
        const gaps = this.identifyGaps(candidate, effectiveCriteria);
        // Determine qualification status
        const qualificationStatus = this.determineQualificationStatus(qualificationScore, meetsBasicRequirements, meetsPreferredRequirements);
        // Salary analysis
        const expectedVsMarketSalary = this.analyzeSalaryExpectation(candidate);
        return {
            candidateId: candidate.id,
            meetsBasicRequirements,
            meetsPreferredRequirements,
            qualificationScore,
            experienceScore,
            skillsMatchScore,
            cultureFitScore,
            strengths,
            weaknesses,
            gaps,
            educationVerified: false,
            employmentVerified: false,
            referencesChecked: false,
            qualificationStatus,
            qualificationReason: this.generateQualificationReason(qualificationStatus, qualificationScore, strengths, weaknesses),
            expectedVsMarketSalary,
            qualifiedAt: new Date().toISOString(),
            qualifiedBy,
        };
    }
    /**
     * Calculate experience score
     */
    calculateExperienceScore(candidate) {
        if (!candidate.experience.length)
            return 30;
        let totalYears = 0;
        const currentYear = new Date().getFullYear();
        for (const exp of candidate.experience) {
            if (exp.current) {
                const startYear = this.parseYear(exp.startDate);
                totalYears += currentYear - startYear;
            }
            else if (exp.endDate) {
                totalYears += this.parseYear(exp.endDate) - this.parseYear(exp.startDate);
            }
        }
        // Score based on years of experience
        if (totalYears >= 15)
            return 95;
        if (totalYears >= 10)
            return 85;
        if (totalYears >= 7)
            return 75;
        if (totalYears >= 5)
            return 65;
        if (totalYears >= 3)
            return 55;
        if (totalYears >= 1)
            return 45;
        return 35;
    }
    /**
     * Parse year from date string
     */
    parseYear(dateStr) {
        const year = parseInt(dateStr);
        if (!isNaN(year))
            return year;
        const match = dateStr.match(/\d{4}/);
        return match ? parseInt(match[0]) : new Date().getFullYear() - 1;
    }
    /**
     * Calculate skills match score
     */
    calculateSkillsMatchScore(candidate, criteria) {
        const candidateSkills = candidate.skills.map(s => s.name.toLowerCase());
        // If no required skills, score based on overall skill count
        if (!criteria.requiredSkills?.length) {
            return candidate.skills.length >= 8 ? 85 :
                candidate.skills.length >= 5 ? 70 :
                    candidate.skills.length >= 3 ? 55 : 40;
        }
        // Calculate match percentage
        const matchedRequired = criteria.requiredSkills.filter(skill => candidateSkills.some(cs => cs.includes(skill.toLowerCase()) || skill.toLowerCase().includes(cs))).length;
        let score = (matchedRequired / criteria.requiredSkills.length) * 100;
        // Bonus for preferred skills
        if (criteria.preferredSkills?.length) {
            const matchedPreferred = criteria.preferredSkills.filter(skill => candidateSkills.some(cs => cs.includes(skill.toLowerCase()) || skill.toLowerCase().includes(cs))).length;
            const preferredBonus = (matchedPreferred / criteria.preferredSkills.length) * 15;
            score = Math.min(100, score + preferredBonus);
        }
        // Certification bonus
        if (candidate.certifications.length > 0) {
            score = Math.min(100, score + candidate.certifications.length * 3);
        }
        return Math.round(score);
    }
    /**
     * Calculate culture fit score
     */
    calculateCultureFitScore(candidate) {
        let score = 50;
        // Communication skills indicator (from summary)
        if (candidate.summary) {
            const text = candidate.summary.toLowerCase();
            const communicationIndicators = ['communication', 'collaboration', 'team', 'leadership', 'stakeholder'];
            const found = communicationIndicators.filter(ind => text.includes(ind)).length;
            score += found * 8;
        }
        // Adaptability (multiple companies)
        if (candidate.experience.length >= 3)
            score += 10;
        else if (candidate.experience.length >= 2)
            score += 5;
        // Career progression indicator
        const titles = candidate.experience.map(e => e.title.toLowerCase());
        const hasProgressed = this.checkCareerProgression(titles);
        if (hasProgressed)
            score += 10;
        // Continuous learning (certifications, education)
        if (candidate.certifications.length >= 2)
            score += 10;
        else if (candidate.certifications.length >= 1)
            score += 5;
        // Location preference flexibility
        if (!candidate.contact.location || candidate.contact.location.toLowerCase().includes('flexible')) {
            score += 5;
        }
        return Math.min(100, score);
    }
    /**
     * Check career progression
     */
    checkCareerProgression(titles) {
        const seniority = ['junior', 'associate', 'senior', 'lead', 'manager', 'director', 'head', 'vp'];
        const seniorityScores = titles.map(t => seniority.findIndex(s => t.includes(s))).filter(s => s >= 0);
        if (seniorityScores.length < 2)
            return false;
        for (let i = 1; i < seniorityScores.length; i++) {
            if (seniorityScores[i] > seniorityScores[i - 1]) {
                return true;
            }
        }
        return false;
    }
    /**
     * Check basic requirements
     */
    checkBasicRequirements(candidate, criteria) {
        // Check minimum experience
        if (criteria.minExperienceYears) {
            const totalYears = this.calculateTotalYears(candidate.experience);
            if (totalYears < criteria.minExperienceYears)
                return false;
        }
        // Check required skills
        if (criteria.requiredSkills?.length) {
            const candidateSkills = candidate.skills.map(s => s.name.toLowerCase());
            const hasAllRequired = criteria.requiredSkills.every(skill => candidateSkills.some(cs => cs.includes(skill.toLowerCase())));
            if (!hasAllRequired)
                return false;
        }
        // Check certifications
        if (criteria.certificationsRequired?.length) {
            const candidateCerts = candidate.certifications.map(c => c.name.toLowerCase());
            const hasAllCerts = criteria.certificationsRequired.every(cert => candidateCerts.some(cc => cc.includes(cert.toLowerCase())));
            if (!hasAllCerts)
                return false;
        }
        // Check salary expectation
        if (criteria.maxSalaryExpectation && candidate.salaryExpectation) {
            if (candidate.salaryExpectation.min > criteria.maxSalaryExpectation)
                return false;
        }
        return true;
    }
    /**
     * Check preferred requirements
     */
    checkPreferredRequirements(candidate, criteria) {
        // Check preferred skills
        if (criteria.preferredSkills?.length) {
            const candidateSkills = candidate.skills.map(s => s.name.toLowerCase());
            const matchedPreferred = criteria.preferredSkills.filter(skill => candidateSkills.some(cs => cs.includes(skill.toLowerCase()))).length;
            // At least 50% of preferred skills should match
            if (matchedPreferred < criteria.preferredSkills.length * 0.5)
                return false;
        }
        // Check education level
        if (criteria.educationLevel) {
            const hasEducation = candidate.education.some(e => e.degree.toLowerCase().includes(criteria.educationLevel.toLowerCase()));
            if (!hasEducation)
                return false;
        }
        return true;
    }
    /**
     * Calculate total years of experience
     */
    calculateTotalYears(experience) {
        const currentYear = new Date().getFullYear();
        let total = 0;
        for (const exp of experience) {
            if (exp.current) {
                total += currentYear - this.parseYear(exp.startDate);
            }
            else if (exp.endDate) {
                total += this.parseYear(exp.endDate) - this.parseYear(exp.startDate);
            }
        }
        return total;
    }
    /**
     * Identify candidate strengths
     */
    identifyStrengths(candidate, experienceScore, skillsMatchScore, cultureFitScore) {
        const strengths = [];
        // Strong experience
        if (experienceScore >= 75) {
            strengths.push(`${this.calculateTotalYears(candidate.experience)}+ years of relevant experience`);
        }
        // Strong skills match
        if (skillsMatchScore >= 80) {
            strengths.push('Excellent skill alignment with requirements');
        }
        // Technical certifications
        if (candidate.certifications.length >= 3) {
            strengths.push(`${candidate.certifications.length} professional certifications`);
        }
        // Leadership experience
        const hasLeadership = candidate.experience.some(exp => /lead|manager|director|head|principal/i.test(exp.title));
        if (hasLeadership) {
            strengths.push('Demonstrated leadership experience');
        }
        // Education
        if (candidate.education.some(e => /master|mba|ph\.?d/i.test(e.degree))) {
            strengths.push('Advanced educational background');
        }
        // Diverse skills
        if (candidate.skills.length >= 10) {
            strengths.push(`Broad skill set with ${candidate.skills.length} competencies`);
        }
        // Culture fit indicators
        if (cultureFitScore >= 70) {
            strengths.push('Strong cultural alignment indicators');
        }
        // Quick availability
        if (candidate.noticePeriod === 'Immediate' || candidate.noticePeriod === '15 days') {
            strengths.push('Immediate or short notice period available');
        }
        return strengths;
    }
    /**
     * Identify candidate weaknesses
     */
    identifyWeaknesses(candidate, criteria) {
        const weaknesses = [];
        // Missing required skills
        if (criteria.requiredSkills?.length) {
            const candidateSkills = candidate.skills.map(s => s.name.toLowerCase());
            const missing = criteria.requiredSkills.filter(skill => !candidateSkills.some(cs => cs.includes(skill.toLowerCase())));
            if (missing.length > 0) {
                weaknesses.push(`Missing ${missing.length} required skills: ${missing.slice(0, 3).join(', ')}`);
            }
        }
        // Long notice period
        if (candidate.noticePeriod && !['Immediate', '15 days', '30 days'].some(np => candidate.noticePeriod.includes(np))) {
            weaknesses.push(`Long notice period: ${candidate.noticePeriod}`);
        }
        // No certifications
        if (candidate.certifications.length === 0 && criteria.requiredSkills?.some(s => /cloud|aws|azure|gcp|certified|security/i.test(s))) {
            weaknesses.push('No professional certifications');
        }
        // Salary expectations mismatch
        if (candidate.salaryExpectation && criteria.maxSalaryExpectation) {
            if (candidate.salaryExpectation.min > criteria.maxSalaryExpectation * 1.2) {
                weaknesses.push('Salary expectations significantly above budget');
            }
        }
        // Limited experience
        const totalYears = this.calculateTotalYears(candidate.experience);
        if (criteria.minExperienceYears && totalYears < criteria.minExperienceYears) {
            weaknesses.push(`${criteria.minExperienceYears - totalYears} years below required experience`);
        }
        return weaknesses;
    }
    /**
     * Identify gaps between candidate and job requirements
     */
    identifyGaps(candidate, criteria) {
        const gaps = [];
        // Skills gaps
        if (criteria.requiredSkills?.length) {
            const candidateSkills = candidate.skills.map(s => s.name.toLowerCase());
            const missingSkills = criteria.requiredSkills.filter(skill => !candidateSkills.some(cs => cs.includes(skill.toLowerCase())));
            for (const skill of missingSkills.slice(0, 5)) {
                gaps.push(`Skill gap: ${skill}`);
            }
        }
        // Experience gaps
        if (criteria.minExperienceYears) {
            const totalYears = this.calculateTotalYears(candidate.experience);
            if (totalYears < criteria.minExperienceYears) {
                gaps.push(`Experience gap: ${criteria.minExperienceYears - totalYears} years below minimum`);
            }
        }
        // Certification gaps
        if (criteria.certificationsRequired?.length) {
            const candidateCerts = candidate.certifications.map(c => c.name.toLowerCase());
            const missingCerts = criteria.certificationsRequired.filter(cert => !candidateCerts.some(cc => cc.includes(cert.toLowerCase())));
            for (const cert of missingCerts.slice(0, 3)) {
                gaps.push(`Certification gap: ${cert}`);
            }
        }
        return gaps;
    }
    /**
     * Determine qualification status
     */
    determineQualificationStatus(qualificationScore, meetsBasic, meetsPreferred) {
        if (!meetsBasic)
            return 'not_qualified';
        if (qualificationScore >= 80 && meetsPreferred) {
            return 'highly_qualified';
        }
        if (qualificationScore >= 70 && meetsBasic) {
            return 'qualified';
        }
        return 'marginally_qualified';
    }
    /**
     * Generate qualification reason
     */
    generateQualificationReason(status, score, strengths, weaknesses) {
        switch (status) {
            case 'highly_qualified':
                return `Highly Qualified (${score}%). ${strengths.slice(0, 2).join('. ')}. Strong candidate with excellent alignment to requirements.`;
            case 'qualified':
                return `Qualified (${score}%). ${strengths[0] || 'Meets requirements'}. ${weaknesses.length > 0 ? 'Minor areas for development.' : ''}`;
            case 'marginally_qualified':
                return `Marginally Qualified (${score}%). ${weaknesses.slice(0, 2).join('. ')} Consider for positions with lower requirements or training programs.`;
            case 'not_qualified':
                return `Not Qualified (${score}%). ${weaknesses.length > 0 ? weaknesses.slice(0, 2).join('. ') : 'Does not meet minimum requirements.'}`;
        }
    }
    /**
     * Analyze salary expectation against market
     */
    analyzeSalaryExpectation(candidate) {
        if (!candidate.salaryExpectation || !this.config.salaryBenchmarkingEnabled) {
            return undefined;
        }
        // Try to find matching benchmark based on candidate's most recent title
        const latestTitle = candidate.experience[0]?.title || 'General';
        const benchmarks = this.salaryBenchmarks.get(latestTitle) ||
            this.salaryBenchmarks.get('Software Engineer') ||
            [];
        if (benchmarks.length === 0)
            return undefined;
        const totalYears = this.calculateTotalYears(candidate.experience);
        const relevantBenchmark = benchmarks.find(b => (totalYears >= 0 && totalYears < 3 && b.experienceLevel === types_1.ExperienceLevel.JUNIOR) ||
            (totalYears >= 3 && totalYears < 7 && b.experienceLevel === types_1.ExperienceLevel.MIDDLE) ||
            (totalYears >= 7 && b.experienceLevel === types_1.ExperienceLevel.SENIOR)) || benchmarks[0];
        const expected = candidate.salaryExpectation.min;
        const marketMedian = relevantBenchmark.percentiles.p50;
        // Calculate percentile
        let percentile = 50;
        if (expected > relevantBenchmark.percentiles.p90)
            percentile = 95;
        else if (expected > relevantBenchmark.percentiles.p75)
            percentile = 85;
        else if (expected > relevantBenchmark.percentiles.p50)
            percentile = 65;
        else if (expected > relevantBenchmark.percentiles.p25)
            percentile = 35;
        else
            percentile = 15;
        return {
            expected,
            marketMedian,
            percentile,
        };
    }
    /**
     * Get salary benchmark
     */
    getSalaryBenchmark(jobTitle, location, experienceLevel, currency = types_1.SalaryCurrency.INR) {
        const benchmarks = this.salaryBenchmarks.get(jobTitle);
        if (!benchmarks) {
            // Try to find a similar role
            for (const [, bms] of this.salaryBenchmarks) {
                const found = bms.find(b => b.experienceLevel === experienceLevel);
                if (found)
                    return this.convertCurrency(found, currency);
            }
            return null;
        }
        const benchmark = benchmarks.find(b => b.experienceLevel === experienceLevel);
        if (!benchmark)
            return null;
        return this.convertCurrency(benchmark, currency);
    }
    /**
     * Convert salary benchmark currency
     */
    convertCurrency(benchmark, targetCurrency) {
        if (benchmark.currency === targetCurrency)
            return benchmark;
        // Approximate conversion rates (as of 2024)
        const conversionRates = {
            [types_1.SalaryCurrency.INR]: 1,
            [types_1.SalaryCurrency.USD]: 83,
            [types_1.SalaryCurrency.EUR]: 90,
            [types_1.SalaryCurrency.GBP]: 105,
        };
        const rate = conversionRates[targetCurrency];
        const inrRate = conversionRates[benchmark.currency];
        const factor = rate / inrRate;
        return {
            ...benchmark,
            currency: targetCurrency,
            salaryRange: {
                min: Math.round(benchmark.salaryRange.min * factor),
                median: Math.round(benchmark.salaryRange.median * factor),
                max: Math.round(benchmark.salaryRange.max * factor),
            },
            percentiles: {
                p10: Math.round(benchmark.percentiles.p10 * factor),
                p25: Math.round(benchmark.percentiles.p25 * factor),
                p50: Math.round(benchmark.percentiles.p50 * factor),
                p75: Math.round(benchmark.percentiles.p75 * factor),
                p90: Math.round(benchmark.percentiles.p90 * factor),
            },
        };
    }
    /**
     * Batch qualify candidates
     */
    qualifyCandidates(candidates, criteria, screeningResults) {
        return candidates.map(candidate => {
            const screeningResult = screeningResults?.get(candidate.id);
            return this.qualifyCandidate(candidate, criteria, screeningResult);
        }).sort((a, b) => b.qualificationScore - a.qualificationScore);
    }
}
exports.CandidateQualifier = CandidateQualifier;
exports.candidateQualifier = new CandidateQualifier();
//# sourceMappingURL=candidateQualifier.js.map