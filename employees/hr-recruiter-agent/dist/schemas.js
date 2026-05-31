"use strict";
/**
 * HR Recruiter Agent - Zod Validation Schemas
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetSalaryBenchmarkSchema = exports.AnalyzeSkillsSchema = exports.SubmitOnboardingFeedbackSchema = exports.CompleteChecklistItemSchema = exports.UpdateOnboardingSchema = exports.StartOnboardingSchema = exports.InterviewQuerySchema = exports.SubmitFeedbackSchema = exports.UpdateInterviewSchema = exports.ScheduleInterviewSchema = exports.MatchCandidatesSchema = exports.UpdateJobSchema = exports.CreateJobSchema = exports.JobRequirementSchema = exports.QualifyCandidateSchema = exports.QualificationCriteriaSchema = exports.ResumeParseSchema = exports.ScreenResumeSchema = exports.ScreeningCriteriaSchema = exports.CandidateQuerySchema = exports.UpdateCandidateSchema = exports.CreateCandidateSchema = exports.LanguageSchema = exports.CertificationSchema = exports.SkillSchema = exports.WorkExperienceSchema = exports.EducationSchema = exports.ContactInfoSchema = exports.SalaryCurrencySchema = exports.EmploymentTypeSchema = exports.ExperienceLevelSchema = exports.OnboardingStatusSchema = exports.InterviewStatusSchema = exports.InterviewTypeSchema = exports.CandidateStatusSchema = exports.SalaryCurrency = exports.EmploymentType = exports.ExperienceLevel = exports.OnboardingStatus = exports.InterviewStatus = exports.InterviewType = exports.CandidateStatus = void 0;
const zod_1 = require("zod");
const types_1 = require("./types");
// Re-export schemas for convenience
var types_2 = require("./types");
Object.defineProperty(exports, "CandidateStatus", { enumerable: true, get: function () { return types_2.CandidateStatus; } });
Object.defineProperty(exports, "InterviewType", { enumerable: true, get: function () { return types_2.InterviewType; } });
Object.defineProperty(exports, "InterviewStatus", { enumerable: true, get: function () { return types_2.InterviewStatus; } });
Object.defineProperty(exports, "OnboardingStatus", { enumerable: true, get: function () { return types_2.OnboardingStatus; } });
Object.defineProperty(exports, "ExperienceLevel", { enumerable: true, get: function () { return types_2.ExperienceLevel; } });
Object.defineProperty(exports, "EmploymentType", { enumerable: true, get: function () { return types_2.EmploymentType; } });
Object.defineProperty(exports, "SalaryCurrency", { enumerable: true, get: function () { return types_2.SalaryCurrency; } });
// ============================================
// ENUMS
// ============================================
exports.CandidateStatusSchema = zod_1.z.nativeEnum(types_1.CandidateStatus);
exports.InterviewTypeSchema = zod_1.z.nativeEnum(types_1.InterviewType);
exports.InterviewStatusSchema = zod_1.z.nativeEnum(types_1.InterviewStatus);
exports.OnboardingStatusSchema = zod_1.z.nativeEnum(types_1.OnboardingStatus);
exports.ExperienceLevelSchema = zod_1.z.nativeEnum(types_1.ExperienceLevel);
exports.EmploymentTypeSchema = zod_1.z.nativeEnum(types_1.EmploymentType);
exports.SalaryCurrencySchema = zod_1.z.nativeEnum(types_1.SalaryCurrency);
// ============================================
// CORE SCHEMAS
// ============================================
exports.ContactInfoSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().optional(),
    linkedin: zod_1.z.string().url().optional(),
    portfolio: zod_1.z.string().url().optional(),
    location: zod_1.z.string().optional(),
});
exports.EducationSchema = zod_1.z.object({
    degree: zod_1.z.string().min(1).max(200),
    field: zod_1.z.string().min(1).max(200),
    institution: zod_1.z.string().min(1).max(200),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    grade: zod_1.z.string().optional(),
    isVerified: zod_1.z.boolean().optional(),
});
exports.WorkExperienceSchema = zod_1.z.object({
    company: zod_1.z.string().min(1).max(200),
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().optional(),
    startDate: zod_1.z.string().min(1),
    endDate: zod_1.z.string().optional(),
    current: zod_1.z.boolean(),
    location: zod_1.z.string().optional(),
    salary: zod_1.z.object({
        amount: zod_1.z.number().positive(),
        currency: exports.SalaryCurrencySchema,
    }).optional(),
});
exports.SkillSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    level: zod_1.z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
    yearsOfExperience: zod_1.z.number().min(0).optional(),
    verified: zod_1.z.boolean().optional(),
    endorsements: zod_1.z.number().int().min(0).optional(),
});
exports.CertificationSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200),
    issuer: zod_1.z.string().min(1).max(200),
    dateObtained: zod_1.z.string(),
    expiryDate: zod_1.z.string().optional(),
    credentialId: zod_1.z.string().optional(),
    credentialUrl: zod_1.z.string().url().optional(),
});
exports.LanguageSchema = zod_1.z.object({
    language: zod_1.z.string().min(1).max(100),
    proficiency: zod_1.z.enum(['elementary', 'limited', 'professional', 'full_professional', 'native']),
});
// ============================================
// CANDIDATE SCHEMAS
// ============================================
exports.CreateCandidateSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(1).max(100),
    lastName: zod_1.z.string().min(1).max(100),
    contact: exports.ContactInfoSchema,
    headline: zod_1.z.string().max(200).optional(),
    summary: zod_1.z.string().max(2000).optional(),
    experience: zod_1.z.array(exports.WorkExperienceSchema).optional(),
    education: zod_1.z.array(exports.EducationSchema).optional(),
    skills: zod_1.z.array(exports.SkillSchema).optional(),
    certifications: zod_1.z.array(exports.CertificationSchema).optional(),
    languages: zod_1.z.array(exports.LanguageSchema).optional(),
    source: zod_1.z.string().optional(),
    referredBy: zod_1.z.string().optional(),
    jobId: zod_1.z.string().uuid().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    notes: zod_1.z.string().max(5000).optional(),
    rating: zod_1.z.number().min(1).max(5).optional(),
    salaryExpectation: zod_1.z.object({
        min: zod_1.z.number().positive(),
        max: zod_1.z.number().positive(),
        currency: exports.SalaryCurrencySchema,
    }).optional(),
    noticePeriod: zod_1.z.string().optional(),
    availableFrom: zod_1.z.string().optional(),
});
exports.UpdateCandidateSchema = exports.CreateCandidateSchema.partial().extend({
    status: exports.CandidateStatusSchema.optional(),
});
exports.CandidateQuerySchema = zod_1.z.object({
    status: zod_1.z.array(exports.CandidateStatusSchema).optional(),
    jobId: zod_1.z.string().uuid().optional(),
    source: zod_1.z.string().optional(),
    minRating: zod_1.z.number().min(1).max(5).optional(),
    skills: zod_1.z.array(zod_1.z.string()).optional(),
    experienceLevel: exports.ExperienceLevelSchema.optional(),
    page: zod_1.z.number().int().positive().default(1),
    limit: zod_1.z.number().int().min(1).max(100).default(20),
    sortBy: zod_1.z.enum(['createdAt', 'updatedAt', 'rating', 'firstName']).default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
// ============================================
// RESUME SCHEMAS
// ============================================
exports.ScreeningCriteriaSchema = zod_1.z.object({
    requiredSkills: zod_1.z.array(zod_1.z.string()).optional(),
    preferredSkills: zod_1.z.array(zod_1.z.string()).optional(),
    minYearsExperience: zod_1.z.number().min(0).optional(),
    maxYearsExperience: zod_1.z.number().min(0).optional(),
    educationRequirements: zod_1.z.array(zod_1.z.string()).optional(),
    certificationsRequired: zod_1.z.array(zod_1.z.string()).optional(),
    minSalary: zod_1.z.number().positive().optional(),
    maxSalary: zod_1.z.number().positive().optional(),
    noticePeriodMax: zod_1.z.string().optional(),
    visaSponsorship: zod_1.z.boolean().optional(),
});
exports.ScreenResumeSchema = zod_1.z.object({
    candidateId: zod_1.z.string().uuid(),
    resumeText: zod_1.z.string().min(1),
    criteria: exports.ScreeningCriteriaSchema.optional(),
});
exports.ResumeParseSchema = zod_1.z.object({
    candidateId: zod_1.z.string().uuid(),
    resumeText: zod_1.z.string().min(1),
    fileName: zod_1.z.string().optional(),
});
// ============================================
// QUALIFICATION SCHEMAS
// ============================================
exports.QualificationCriteriaSchema = zod_1.z.object({
    minQualificationScore: zod_1.z.number().min(0).max(100).default(60),
    minExperienceYears: zod_1.z.number().min(0).optional(),
    requiredSkills: zod_1.z.array(zod_1.z.string()).optional(),
    preferredSkills: zod_1.z.array(zod_1.z.string()).optional(),
    educationLevel: zod_1.z.string().optional(),
    certificationsRequired: zod_1.z.array(zod_1.z.string()).optional(),
    maxSalaryExpectation: zod_1.z.number().positive().optional(),
    noticePeriodMax: zod_1.z.string().optional(),
});
exports.QualifyCandidateSchema = zod_1.z.object({
    candidateId: zod_1.z.string().uuid(),
    jobId: zod_1.z.string().uuid().optional(),
    criteria: exports.QualificationCriteriaSchema.optional(),
});
// ============================================
// JOB SCHEMAS
// ============================================
exports.JobRequirementSchema = zod_1.z.object({
    skill: zod_1.z.string().min(1).max(100),
    required: zod_1.z.boolean().default(true),
    minYears: zod_1.z.number().min(0).optional(),
    priority: zod_1.z.enum(['must_have', 'should_have', 'nice_to_have']).default('must_have'),
});
exports.CreateJobSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200),
    department: zod_1.z.string().min(1).max(100),
    location: zod_1.z.string().min(1).max(200),
    employmentType: exports.EmploymentTypeSchema.default(types_1.EmploymentType.FULL_TIME),
    experienceLevel: exports.ExperienceLevelSchema,
    description: zod_1.z.string().min(1).max(5000),
    responsibilities: zod_1.z.array(zod_1.z.string()).min(1),
    requirements: zod_1.z.array(exports.JobRequirementSchema).min(1),
    preferredQualifications: zod_1.z.array(zod_1.z.string()).optional(),
    salary: zod_1.z.object({
        min: zod_1.z.number().positive(),
        max: zod_1.z.number().positive(),
        currency: exports.SalaryCurrencySchema,
        isNegotiable: zod_1.z.boolean().default(false),
    }).optional(),
    benefits: zod_1.z.array(zod_1.z.string()).optional(),
    workingHours: zod_1.z.string().optional(),
    remotePolicy: zod_1.z.enum(['onsite', 'hybrid', 'remote']).default('onsite'),
    interviewRounds: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        type: exports.InterviewTypeSchema,
        duration: zod_1.z.number().min(15).max(480),
        interviewers: zod_1.z.array(zod_1.z.string()),
        description: zod_1.z.string().optional(),
        order: zod_1.z.number().int().positive(),
    })).optional(),
});
exports.UpdateJobSchema = exports.CreateJobSchema.partial().extend({
    status: zod_1.z.enum(['draft', 'active', 'paused', 'closed']).optional(),
});
exports.MatchCandidatesSchema = zod_1.z.object({
    jobId: zod_1.z.string().uuid(),
    candidateIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
    filters: zod_1.z.object({
        minMatchScore: zod_1.z.number().min(0).max(100).optional(),
        status: zod_1.z.array(exports.CandidateStatusSchema).optional(),
    }).optional(),
});
// ============================================
// INTERVIEW SCHEMAS
// ============================================
exports.ScheduleInterviewSchema = zod_1.z.object({
    candidateId: zod_1.z.string().uuid(),
    jobId: zod_1.z.string().uuid(),
    interviewType: exports.InterviewTypeSchema,
    roundNumber: zod_1.z.number().int().positive().default(1),
    scheduledAt: zod_1.z.string().datetime(),
    duration: zod_1.z.number().min(15).max(480).default(60),
    timezone: zod_1.z.string().default('Asia/Kolkata'),
    location: zod_1.z.string().optional(),
    meetingLink: zod_1.z.string().url().optional(),
    interviewerIds: zod_1.z.array(zod_1.z.string().uuid()).min(1),
    notes: zod_1.z.string().max(1000).optional(),
});
exports.UpdateInterviewSchema = zod_1.z.object({
    scheduledAt: zod_1.z.string().datetime().optional(),
    duration: zod_1.z.number().min(15).max(480).optional(),
    location: zod_1.z.string().optional(),
    meetingLink: zod_1.z.string().url().optional(),
    status: exports.InterviewStatusSchema.optional(),
    notes: zod_1.z.string().max(1000).optional(),
});
exports.SubmitFeedbackSchema = zod_1.z.object({
    interviewId: zod_1.z.string().uuid(),
    interviewerId: zod_1.z.string().uuid(),
    technicalSkills: zod_1.z.number().min(1).max(5),
    communication: zod_1.z.number().min(1).max(5),
    problemSolving: zod_1.z.number().min(1).max(5),
    cultureFit: zod_1.z.number().min(1).max(5),
    overallScore: zod_1.z.number().min(1).max(5),
    strengths: zod_1.z.array(zod_1.z.string()).min(1),
    concerns: zod_1.z.array(zod_1.z.string()),
    recommendation: zod_1.z.enum(['strong_hire', 'hire', 'no_hire', 'strong_no_hire']),
    notes: zod_1.z.string().max(2000).optional(),
});
exports.InterviewQuerySchema = zod_1.z.object({
    candidateId: zod_1.z.string().uuid().optional(),
    jobId: zod_1.z.string().uuid().optional(),
    status: zod_1.z.array(exports.InterviewStatusSchema).optional(),
    interviewerId: zod_1.z.string().uuid().optional(),
    fromDate: zod_1.z.string().datetime().optional(),
    toDate: zod_1.z.string().datetime().optional(),
    page: zod_1.z.number().int().positive().default(1),
    limit: zod_1.z.number().int().min(1).max(100).default(20),
});
// ============================================
// ONBOARDING SCHEMAS
// ============================================
exports.StartOnboardingSchema = zod_1.z.object({
    candidateId: zod_1.z.string().uuid(),
    jobId: zod_1.z.string().uuid(),
    startDate: zod_1.z.string().datetime(),
    targetCompletionDate: zod_1.z.string().datetime().optional(),
    managerId: zod_1.z.string().uuid(),
    buddyId: zod_1.z.string().uuid().optional(),
    templateId: zod_1.z.string().uuid().optional(),
    customChecklists: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        category: zod_1.z.enum(['document', 'training', 'equipment', 'introduction', 'task']),
        description: zod_1.z.string(),
        assigneeId: zod_1.z.string().uuid().optional(),
        dueDate: zod_1.z.string().datetime().optional(),
        order: zod_1.z.number().int().positive(),
    })).optional(),
});
exports.UpdateOnboardingSchema = zod_1.z.object({
    status: exports.OnboardingStatusSchema.optional(),
    targetCompletionDate: zod_1.z.string().datetime().optional(),
    managerId: zod_1.z.string().uuid().optional(),
    buddyId: zod_1.z.string().uuid().optional(),
    notes: zod_1.z.string().max(5000).optional(),
});
exports.CompleteChecklistItemSchema = zod_1.z.object({
    onboardingId: zod_1.z.string().uuid(),
    checklistId: zod_1.z.string().uuid(),
    completedAt: zod_1.z.string().datetime().optional(),
});
exports.SubmitOnboardingFeedbackSchema = zod_1.z.object({
    onboardingId: zod_1.z.string().uuid(),
    type: zod_1.z.enum(['day1', 'week1', 'month1', '90day']),
    ratings: zod_1.z.object({
        onboardingQuality: zod_1.z.number().min(1).max(5),
        managerSupport: zod_1.z.number().min(1).max(5),
        clarityOfRole: zod_1.z.number().min(1).max(5),
        overallSatisfaction: zod_1.z.number().min(1).max(5),
    }),
    positiveAspects: zod_1.z.array(zod_1.z.string()),
    areasForImprovement: zod_1.z.array(zod_1.z.string()),
    comments: zod_1.z.string().max(2000).optional(),
});
// ============================================
// SKILLS & SALARY SCHEMAS
// ============================================
exports.AnalyzeSkillsSchema = zod_1.z.object({
    candidateId: zod_1.z.string().uuid(),
    jobId: zod_1.z.string().uuid().optional(),
});
exports.GetSalaryBenchmarkSchema = zod_1.z.object({
    jobTitle: zod_1.z.string().min(1),
    location: zod_1.z.string().min(1),
    experienceLevel: exports.ExperienceLevelSchema,
    currency: exports.SalaryCurrencySchema.default(types_1.SalaryCurrency.INR),
});
//# sourceMappingURL=schemas.js.map