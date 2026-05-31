/**
 * HR Recruiter Agent - Zod Validation Schemas
 */
import { z } from 'zod';
import { CandidateStatus, InterviewType, InterviewStatus, OnboardingStatus, ExperienceLevel, EmploymentType, SalaryCurrency } from './types';
export { CandidateStatus, InterviewType, InterviewStatus, OnboardingStatus, ExperienceLevel, EmploymentType, SalaryCurrency } from './types';
export declare const CandidateStatusSchema: z.ZodNativeEnum<typeof CandidateStatus>;
export declare const InterviewTypeSchema: z.ZodNativeEnum<typeof InterviewType>;
export declare const InterviewStatusSchema: z.ZodNativeEnum<typeof InterviewStatus>;
export declare const OnboardingStatusSchema: z.ZodNativeEnum<typeof OnboardingStatus>;
export declare const ExperienceLevelSchema: z.ZodNativeEnum<typeof ExperienceLevel>;
export declare const EmploymentTypeSchema: z.ZodNativeEnum<typeof EmploymentType>;
export declare const SalaryCurrencySchema: z.ZodNativeEnum<typeof SalaryCurrency>;
export declare const ContactInfoSchema: z.ZodObject<{
    email: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    linkedin: z.ZodOptional<z.ZodString>;
    portfolio: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    phone?: string | undefined;
    linkedin?: string | undefined;
    portfolio?: string | undefined;
    location?: string | undefined;
}, {
    email: string;
    phone?: string | undefined;
    linkedin?: string | undefined;
    portfolio?: string | undefined;
    location?: string | undefined;
}>;
export declare const EducationSchema: z.ZodObject<{
    degree: z.ZodString;
    field: z.ZodString;
    institution: z.ZodString;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    grade: z.ZodOptional<z.ZodString>;
    isVerified: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    degree: string;
    field: string;
    institution: string;
    startDate?: string | undefined;
    endDate?: string | undefined;
    grade?: string | undefined;
    isVerified?: boolean | undefined;
}, {
    degree: string;
    field: string;
    institution: string;
    startDate?: string | undefined;
    endDate?: string | undefined;
    grade?: string | undefined;
    isVerified?: boolean | undefined;
}>;
export declare const WorkExperienceSchema: z.ZodObject<{
    company: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    startDate: z.ZodString;
    endDate: z.ZodOptional<z.ZodString>;
    current: z.ZodBoolean;
    location: z.ZodOptional<z.ZodString>;
    salary: z.ZodOptional<z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodNativeEnum<typeof SalaryCurrency>;
    }, "strip", z.ZodTypeAny, {
        amount: number;
        currency: SalaryCurrency;
    }, {
        amount: number;
        currency: SalaryCurrency;
    }>>;
}, "strip", z.ZodTypeAny, {
    startDate: string;
    company: string;
    title: string;
    current: boolean;
    location?: string | undefined;
    endDate?: string | undefined;
    description?: string | undefined;
    salary?: {
        amount: number;
        currency: SalaryCurrency;
    } | undefined;
}, {
    startDate: string;
    company: string;
    title: string;
    current: boolean;
    location?: string | undefined;
    endDate?: string | undefined;
    description?: string | undefined;
    salary?: {
        amount: number;
        currency: SalaryCurrency;
    } | undefined;
}>;
export declare const SkillSchema: z.ZodObject<{
    name: z.ZodString;
    level: z.ZodEnum<["beginner", "intermediate", "advanced", "expert"]>;
    yearsOfExperience: z.ZodOptional<z.ZodNumber>;
    verified: z.ZodOptional<z.ZodBoolean>;
    endorsements: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    level: "beginner" | "intermediate" | "advanced" | "expert";
    yearsOfExperience?: number | undefined;
    verified?: boolean | undefined;
    endorsements?: number | undefined;
}, {
    name: string;
    level: "beginner" | "intermediate" | "advanced" | "expert";
    yearsOfExperience?: number | undefined;
    verified?: boolean | undefined;
    endorsements?: number | undefined;
}>;
export declare const CertificationSchema: z.ZodObject<{
    name: z.ZodString;
    issuer: z.ZodString;
    dateObtained: z.ZodString;
    expiryDate: z.ZodOptional<z.ZodString>;
    credentialId: z.ZodOptional<z.ZodString>;
    credentialUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    issuer: string;
    dateObtained: string;
    expiryDate?: string | undefined;
    credentialId?: string | undefined;
    credentialUrl?: string | undefined;
}, {
    name: string;
    issuer: string;
    dateObtained: string;
    expiryDate?: string | undefined;
    credentialId?: string | undefined;
    credentialUrl?: string | undefined;
}>;
export declare const LanguageSchema: z.ZodObject<{
    language: z.ZodString;
    proficiency: z.ZodEnum<["elementary", "limited", "professional", "full_professional", "native"]>;
}, "strip", z.ZodTypeAny, {
    language: string;
    proficiency: "elementary" | "limited" | "professional" | "full_professional" | "native";
}, {
    language: string;
    proficiency: "elementary" | "limited" | "professional" | "full_professional" | "native";
}>;
export declare const CreateCandidateSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    contact: z.ZodObject<{
        email: z.ZodString;
        phone: z.ZodOptional<z.ZodString>;
        linkedin: z.ZodOptional<z.ZodString>;
        portfolio: z.ZodOptional<z.ZodString>;
        location: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        email: string;
        phone?: string | undefined;
        linkedin?: string | undefined;
        portfolio?: string | undefined;
        location?: string | undefined;
    }, {
        email: string;
        phone?: string | undefined;
        linkedin?: string | undefined;
        portfolio?: string | undefined;
        location?: string | undefined;
    }>;
    headline: z.ZodOptional<z.ZodString>;
    summary: z.ZodOptional<z.ZodString>;
    experience: z.ZodOptional<z.ZodArray<z.ZodObject<{
        company: z.ZodString;
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        startDate: z.ZodString;
        endDate: z.ZodOptional<z.ZodString>;
        current: z.ZodBoolean;
        location: z.ZodOptional<z.ZodString>;
        salary: z.ZodOptional<z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodNativeEnum<typeof SalaryCurrency>;
        }, "strip", z.ZodTypeAny, {
            amount: number;
            currency: SalaryCurrency;
        }, {
            amount: number;
            currency: SalaryCurrency;
        }>>;
    }, "strip", z.ZodTypeAny, {
        startDate: string;
        company: string;
        title: string;
        current: boolean;
        location?: string | undefined;
        endDate?: string | undefined;
        description?: string | undefined;
        salary?: {
            amount: number;
            currency: SalaryCurrency;
        } | undefined;
    }, {
        startDate: string;
        company: string;
        title: string;
        current: boolean;
        location?: string | undefined;
        endDate?: string | undefined;
        description?: string | undefined;
        salary?: {
            amount: number;
            currency: SalaryCurrency;
        } | undefined;
    }>, "many">>;
    education: z.ZodOptional<z.ZodArray<z.ZodObject<{
        degree: z.ZodString;
        field: z.ZodString;
        institution: z.ZodString;
        startDate: z.ZodOptional<z.ZodString>;
        endDate: z.ZodOptional<z.ZodString>;
        grade: z.ZodOptional<z.ZodString>;
        isVerified: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        degree: string;
        field: string;
        institution: string;
        startDate?: string | undefined;
        endDate?: string | undefined;
        grade?: string | undefined;
        isVerified?: boolean | undefined;
    }, {
        degree: string;
        field: string;
        institution: string;
        startDate?: string | undefined;
        endDate?: string | undefined;
        grade?: string | undefined;
        isVerified?: boolean | undefined;
    }>, "many">>;
    skills: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        level: z.ZodEnum<["beginner", "intermediate", "advanced", "expert"]>;
        yearsOfExperience: z.ZodOptional<z.ZodNumber>;
        verified: z.ZodOptional<z.ZodBoolean>;
        endorsements: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        level: "beginner" | "intermediate" | "advanced" | "expert";
        yearsOfExperience?: number | undefined;
        verified?: boolean | undefined;
        endorsements?: number | undefined;
    }, {
        name: string;
        level: "beginner" | "intermediate" | "advanced" | "expert";
        yearsOfExperience?: number | undefined;
        verified?: boolean | undefined;
        endorsements?: number | undefined;
    }>, "many">>;
    certifications: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        issuer: z.ZodString;
        dateObtained: z.ZodString;
        expiryDate: z.ZodOptional<z.ZodString>;
        credentialId: z.ZodOptional<z.ZodString>;
        credentialUrl: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        issuer: string;
        dateObtained: string;
        expiryDate?: string | undefined;
        credentialId?: string | undefined;
        credentialUrl?: string | undefined;
    }, {
        name: string;
        issuer: string;
        dateObtained: string;
        expiryDate?: string | undefined;
        credentialId?: string | undefined;
        credentialUrl?: string | undefined;
    }>, "many">>;
    languages: z.ZodOptional<z.ZodArray<z.ZodObject<{
        language: z.ZodString;
        proficiency: z.ZodEnum<["elementary", "limited", "professional", "full_professional", "native"]>;
    }, "strip", z.ZodTypeAny, {
        language: string;
        proficiency: "elementary" | "limited" | "professional" | "full_professional" | "native";
    }, {
        language: string;
        proficiency: "elementary" | "limited" | "professional" | "full_professional" | "native";
    }>, "many">>;
    source: z.ZodOptional<z.ZodString>;
    referredBy: z.ZodOptional<z.ZodString>;
    jobId: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    notes: z.ZodOptional<z.ZodString>;
    rating: z.ZodOptional<z.ZodNumber>;
    salaryExpectation: z.ZodOptional<z.ZodObject<{
        min: z.ZodNumber;
        max: z.ZodNumber;
        currency: z.ZodNativeEnum<typeof SalaryCurrency>;
    }, "strip", z.ZodTypeAny, {
        currency: SalaryCurrency;
        min: number;
        max: number;
    }, {
        currency: SalaryCurrency;
        min: number;
        max: number;
    }>>;
    noticePeriod: z.ZodOptional<z.ZodString>;
    availableFrom: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    contact: {
        email: string;
        phone?: string | undefined;
        linkedin?: string | undefined;
        portfolio?: string | undefined;
        location?: string | undefined;
    };
    firstName: string;
    lastName: string;
    experience?: {
        startDate: string;
        company: string;
        title: string;
        current: boolean;
        location?: string | undefined;
        endDate?: string | undefined;
        description?: string | undefined;
        salary?: {
            amount: number;
            currency: SalaryCurrency;
        } | undefined;
    }[] | undefined;
    education?: {
        degree: string;
        field: string;
        institution: string;
        startDate?: string | undefined;
        endDate?: string | undefined;
        grade?: string | undefined;
        isVerified?: boolean | undefined;
    }[] | undefined;
    skills?: {
        name: string;
        level: "beginner" | "intermediate" | "advanced" | "expert";
        yearsOfExperience?: number | undefined;
        verified?: boolean | undefined;
        endorsements?: number | undefined;
    }[] | undefined;
    headline?: string | undefined;
    summary?: string | undefined;
    certifications?: {
        name: string;
        issuer: string;
        dateObtained: string;
        expiryDate?: string | undefined;
        credentialId?: string | undefined;
        credentialUrl?: string | undefined;
    }[] | undefined;
    languages?: {
        language: string;
        proficiency: "elementary" | "limited" | "professional" | "full_professional" | "native";
    }[] | undefined;
    source?: string | undefined;
    referredBy?: string | undefined;
    jobId?: string | undefined;
    tags?: string[] | undefined;
    notes?: string | undefined;
    rating?: number | undefined;
    salaryExpectation?: {
        currency: SalaryCurrency;
        min: number;
        max: number;
    } | undefined;
    noticePeriod?: string | undefined;
    availableFrom?: string | undefined;
}, {
    contact: {
        email: string;
        phone?: string | undefined;
        linkedin?: string | undefined;
        portfolio?: string | undefined;
        location?: string | undefined;
    };
    firstName: string;
    lastName: string;
    experience?: {
        startDate: string;
        company: string;
        title: string;
        current: boolean;
        location?: string | undefined;
        endDate?: string | undefined;
        description?: string | undefined;
        salary?: {
            amount: number;
            currency: SalaryCurrency;
        } | undefined;
    }[] | undefined;
    education?: {
        degree: string;
        field: string;
        institution: string;
        startDate?: string | undefined;
        endDate?: string | undefined;
        grade?: string | undefined;
        isVerified?: boolean | undefined;
    }[] | undefined;
    skills?: {
        name: string;
        level: "beginner" | "intermediate" | "advanced" | "expert";
        yearsOfExperience?: number | undefined;
        verified?: boolean | undefined;
        endorsements?: number | undefined;
    }[] | undefined;
    headline?: string | undefined;
    summary?: string | undefined;
    certifications?: {
        name: string;
        issuer: string;
        dateObtained: string;
        expiryDate?: string | undefined;
        credentialId?: string | undefined;
        credentialUrl?: string | undefined;
    }[] | undefined;
    languages?: {
        language: string;
        proficiency: "elementary" | "limited" | "professional" | "full_professional" | "native";
    }[] | undefined;
    source?: string | undefined;
    referredBy?: string | undefined;
    jobId?: string | undefined;
    tags?: string[] | undefined;
    notes?: string | undefined;
    rating?: number | undefined;
    salaryExpectation?: {
        currency: SalaryCurrency;
        min: number;
        max: number;
    } | undefined;
    noticePeriod?: string | undefined;
    availableFrom?: string | undefined;
}>;
export declare const UpdateCandidateSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    contact: z.ZodOptional<z.ZodObject<{
        email: z.ZodString;
        phone: z.ZodOptional<z.ZodString>;
        linkedin: z.ZodOptional<z.ZodString>;
        portfolio: z.ZodOptional<z.ZodString>;
        location: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        email: string;
        phone?: string | undefined;
        linkedin?: string | undefined;
        portfolio?: string | undefined;
        location?: string | undefined;
    }, {
        email: string;
        phone?: string | undefined;
        linkedin?: string | undefined;
        portfolio?: string | undefined;
        location?: string | undefined;
    }>>;
    headline: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    summary: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    experience: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        company: z.ZodString;
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        startDate: z.ZodString;
        endDate: z.ZodOptional<z.ZodString>;
        current: z.ZodBoolean;
        location: z.ZodOptional<z.ZodString>;
        salary: z.ZodOptional<z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodNativeEnum<typeof SalaryCurrency>;
        }, "strip", z.ZodTypeAny, {
            amount: number;
            currency: SalaryCurrency;
        }, {
            amount: number;
            currency: SalaryCurrency;
        }>>;
    }, "strip", z.ZodTypeAny, {
        startDate: string;
        company: string;
        title: string;
        current: boolean;
        location?: string | undefined;
        endDate?: string | undefined;
        description?: string | undefined;
        salary?: {
            amount: number;
            currency: SalaryCurrency;
        } | undefined;
    }, {
        startDate: string;
        company: string;
        title: string;
        current: boolean;
        location?: string | undefined;
        endDate?: string | undefined;
        description?: string | undefined;
        salary?: {
            amount: number;
            currency: SalaryCurrency;
        } | undefined;
    }>, "many">>>;
    education: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        degree: z.ZodString;
        field: z.ZodString;
        institution: z.ZodString;
        startDate: z.ZodOptional<z.ZodString>;
        endDate: z.ZodOptional<z.ZodString>;
        grade: z.ZodOptional<z.ZodString>;
        isVerified: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        degree: string;
        field: string;
        institution: string;
        startDate?: string | undefined;
        endDate?: string | undefined;
        grade?: string | undefined;
        isVerified?: boolean | undefined;
    }, {
        degree: string;
        field: string;
        institution: string;
        startDate?: string | undefined;
        endDate?: string | undefined;
        grade?: string | undefined;
        isVerified?: boolean | undefined;
    }>, "many">>>;
    skills: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        level: z.ZodEnum<["beginner", "intermediate", "advanced", "expert"]>;
        yearsOfExperience: z.ZodOptional<z.ZodNumber>;
        verified: z.ZodOptional<z.ZodBoolean>;
        endorsements: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        level: "beginner" | "intermediate" | "advanced" | "expert";
        yearsOfExperience?: number | undefined;
        verified?: boolean | undefined;
        endorsements?: number | undefined;
    }, {
        name: string;
        level: "beginner" | "intermediate" | "advanced" | "expert";
        yearsOfExperience?: number | undefined;
        verified?: boolean | undefined;
        endorsements?: number | undefined;
    }>, "many">>>;
    certifications: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        issuer: z.ZodString;
        dateObtained: z.ZodString;
        expiryDate: z.ZodOptional<z.ZodString>;
        credentialId: z.ZodOptional<z.ZodString>;
        credentialUrl: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        issuer: string;
        dateObtained: string;
        expiryDate?: string | undefined;
        credentialId?: string | undefined;
        credentialUrl?: string | undefined;
    }, {
        name: string;
        issuer: string;
        dateObtained: string;
        expiryDate?: string | undefined;
        credentialId?: string | undefined;
        credentialUrl?: string | undefined;
    }>, "many">>>;
    languages: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        language: z.ZodString;
        proficiency: z.ZodEnum<["elementary", "limited", "professional", "full_professional", "native"]>;
    }, "strip", z.ZodTypeAny, {
        language: string;
        proficiency: "elementary" | "limited" | "professional" | "full_professional" | "native";
    }, {
        language: string;
        proficiency: "elementary" | "limited" | "professional" | "full_professional" | "native";
    }>, "many">>>;
    source: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    referredBy: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    jobId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    tags: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    rating: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    salaryExpectation: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        min: z.ZodNumber;
        max: z.ZodNumber;
        currency: z.ZodNativeEnum<typeof SalaryCurrency>;
    }, "strip", z.ZodTypeAny, {
        currency: SalaryCurrency;
        min: number;
        max: number;
    }, {
        currency: SalaryCurrency;
        min: number;
        max: number;
    }>>>;
    noticePeriod: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    availableFrom: z.ZodOptional<z.ZodOptional<z.ZodString>>;
} & {
    status: z.ZodOptional<z.ZodNativeEnum<typeof CandidateStatus>>;
}, "strip", z.ZodTypeAny, {
    experience?: {
        startDate: string;
        company: string;
        title: string;
        current: boolean;
        location?: string | undefined;
        endDate?: string | undefined;
        description?: string | undefined;
        salary?: {
            amount: number;
            currency: SalaryCurrency;
        } | undefined;
    }[] | undefined;
    education?: {
        degree: string;
        field: string;
        institution: string;
        startDate?: string | undefined;
        endDate?: string | undefined;
        grade?: string | undefined;
        isVerified?: boolean | undefined;
    }[] | undefined;
    skills?: {
        name: string;
        level: "beginner" | "intermediate" | "advanced" | "expert";
        yearsOfExperience?: number | undefined;
        verified?: boolean | undefined;
        endorsements?: number | undefined;
    }[] | undefined;
    contact?: {
        email: string;
        phone?: string | undefined;
        linkedin?: string | undefined;
        portfolio?: string | undefined;
        location?: string | undefined;
    } | undefined;
    status?: CandidateStatus | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    headline?: string | undefined;
    summary?: string | undefined;
    certifications?: {
        name: string;
        issuer: string;
        dateObtained: string;
        expiryDate?: string | undefined;
        credentialId?: string | undefined;
        credentialUrl?: string | undefined;
    }[] | undefined;
    languages?: {
        language: string;
        proficiency: "elementary" | "limited" | "professional" | "full_professional" | "native";
    }[] | undefined;
    source?: string | undefined;
    referredBy?: string | undefined;
    jobId?: string | undefined;
    tags?: string[] | undefined;
    notes?: string | undefined;
    rating?: number | undefined;
    salaryExpectation?: {
        currency: SalaryCurrency;
        min: number;
        max: number;
    } | undefined;
    noticePeriod?: string | undefined;
    availableFrom?: string | undefined;
}, {
    experience?: {
        startDate: string;
        company: string;
        title: string;
        current: boolean;
        location?: string | undefined;
        endDate?: string | undefined;
        description?: string | undefined;
        salary?: {
            amount: number;
            currency: SalaryCurrency;
        } | undefined;
    }[] | undefined;
    education?: {
        degree: string;
        field: string;
        institution: string;
        startDate?: string | undefined;
        endDate?: string | undefined;
        grade?: string | undefined;
        isVerified?: boolean | undefined;
    }[] | undefined;
    skills?: {
        name: string;
        level: "beginner" | "intermediate" | "advanced" | "expert";
        yearsOfExperience?: number | undefined;
        verified?: boolean | undefined;
        endorsements?: number | undefined;
    }[] | undefined;
    contact?: {
        email: string;
        phone?: string | undefined;
        linkedin?: string | undefined;
        portfolio?: string | undefined;
        location?: string | undefined;
    } | undefined;
    status?: CandidateStatus | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    headline?: string | undefined;
    summary?: string | undefined;
    certifications?: {
        name: string;
        issuer: string;
        dateObtained: string;
        expiryDate?: string | undefined;
        credentialId?: string | undefined;
        credentialUrl?: string | undefined;
    }[] | undefined;
    languages?: {
        language: string;
        proficiency: "elementary" | "limited" | "professional" | "full_professional" | "native";
    }[] | undefined;
    source?: string | undefined;
    referredBy?: string | undefined;
    jobId?: string | undefined;
    tags?: string[] | undefined;
    notes?: string | undefined;
    rating?: number | undefined;
    salaryExpectation?: {
        currency: SalaryCurrency;
        min: number;
        max: number;
    } | undefined;
    noticePeriod?: string | undefined;
    availableFrom?: string | undefined;
}>;
export declare const CandidateQuerySchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodArray<z.ZodNativeEnum<typeof CandidateStatus>, "many">>;
    jobId: z.ZodOptional<z.ZodString>;
    source: z.ZodOptional<z.ZodString>;
    minRating: z.ZodOptional<z.ZodNumber>;
    skills: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    experienceLevel: z.ZodOptional<z.ZodNativeEnum<typeof ExperienceLevel>>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodDefault<z.ZodEnum<["createdAt", "updatedAt", "rating", "firstName"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortBy: "firstName" | "rating" | "createdAt" | "updatedAt";
    sortOrder: "asc" | "desc";
    skills?: string[] | undefined;
    status?: CandidateStatus[] | undefined;
    source?: string | undefined;
    jobId?: string | undefined;
    minRating?: number | undefined;
    experienceLevel?: ExperienceLevel | undefined;
}, {
    skills?: string[] | undefined;
    status?: CandidateStatus[] | undefined;
    source?: string | undefined;
    jobId?: string | undefined;
    minRating?: number | undefined;
    experienceLevel?: ExperienceLevel | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: "firstName" | "rating" | "createdAt" | "updatedAt" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export declare const ScreeningCriteriaSchema: z.ZodObject<{
    requiredSkills: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    preferredSkills: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    minYearsExperience: z.ZodOptional<z.ZodNumber>;
    maxYearsExperience: z.ZodOptional<z.ZodNumber>;
    educationRequirements: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    certificationsRequired: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    minSalary: z.ZodOptional<z.ZodNumber>;
    maxSalary: z.ZodOptional<z.ZodNumber>;
    noticePeriodMax: z.ZodOptional<z.ZodString>;
    visaSponsorship: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    requiredSkills?: string[] | undefined;
    preferredSkills?: string[] | undefined;
    minYearsExperience?: number | undefined;
    educationRequirements?: string[] | undefined;
    maxYearsExperience?: number | undefined;
    certificationsRequired?: string[] | undefined;
    minSalary?: number | undefined;
    maxSalary?: number | undefined;
    noticePeriodMax?: string | undefined;
    visaSponsorship?: boolean | undefined;
}, {
    requiredSkills?: string[] | undefined;
    preferredSkills?: string[] | undefined;
    minYearsExperience?: number | undefined;
    educationRequirements?: string[] | undefined;
    maxYearsExperience?: number | undefined;
    certificationsRequired?: string[] | undefined;
    minSalary?: number | undefined;
    maxSalary?: number | undefined;
    noticePeriodMax?: string | undefined;
    visaSponsorship?: boolean | undefined;
}>;
export declare const ScreenResumeSchema: z.ZodObject<{
    candidateId: z.ZodString;
    resumeText: z.ZodString;
    criteria: z.ZodOptional<z.ZodObject<{
        requiredSkills: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        preferredSkills: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        minYearsExperience: z.ZodOptional<z.ZodNumber>;
        maxYearsExperience: z.ZodOptional<z.ZodNumber>;
        educationRequirements: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        certificationsRequired: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        minSalary: z.ZodOptional<z.ZodNumber>;
        maxSalary: z.ZodOptional<z.ZodNumber>;
        noticePeriodMax: z.ZodOptional<z.ZodString>;
        visaSponsorship: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        requiredSkills?: string[] | undefined;
        preferredSkills?: string[] | undefined;
        minYearsExperience?: number | undefined;
        educationRequirements?: string[] | undefined;
        maxYearsExperience?: number | undefined;
        certificationsRequired?: string[] | undefined;
        minSalary?: number | undefined;
        maxSalary?: number | undefined;
        noticePeriodMax?: string | undefined;
        visaSponsorship?: boolean | undefined;
    }, {
        requiredSkills?: string[] | undefined;
        preferredSkills?: string[] | undefined;
        minYearsExperience?: number | undefined;
        educationRequirements?: string[] | undefined;
        maxYearsExperience?: number | undefined;
        certificationsRequired?: string[] | undefined;
        minSalary?: number | undefined;
        maxSalary?: number | undefined;
        noticePeriodMax?: string | undefined;
        visaSponsorship?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    candidateId: string;
    resumeText: string;
    criteria?: {
        requiredSkills?: string[] | undefined;
        preferredSkills?: string[] | undefined;
        minYearsExperience?: number | undefined;
        educationRequirements?: string[] | undefined;
        maxYearsExperience?: number | undefined;
        certificationsRequired?: string[] | undefined;
        minSalary?: number | undefined;
        maxSalary?: number | undefined;
        noticePeriodMax?: string | undefined;
        visaSponsorship?: boolean | undefined;
    } | undefined;
}, {
    candidateId: string;
    resumeText: string;
    criteria?: {
        requiredSkills?: string[] | undefined;
        preferredSkills?: string[] | undefined;
        minYearsExperience?: number | undefined;
        educationRequirements?: string[] | undefined;
        maxYearsExperience?: number | undefined;
        certificationsRequired?: string[] | undefined;
        minSalary?: number | undefined;
        maxSalary?: number | undefined;
        noticePeriodMax?: string | undefined;
        visaSponsorship?: boolean | undefined;
    } | undefined;
}>;
export declare const ResumeParseSchema: z.ZodObject<{
    candidateId: z.ZodString;
    resumeText: z.ZodString;
    fileName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    candidateId: string;
    resumeText: string;
    fileName?: string | undefined;
}, {
    candidateId: string;
    resumeText: string;
    fileName?: string | undefined;
}>;
export declare const QualificationCriteriaSchema: z.ZodObject<{
    minQualificationScore: z.ZodDefault<z.ZodNumber>;
    minExperienceYears: z.ZodOptional<z.ZodNumber>;
    requiredSkills: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    preferredSkills: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    educationLevel: z.ZodOptional<z.ZodString>;
    certificationsRequired: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    maxSalaryExpectation: z.ZodOptional<z.ZodNumber>;
    noticePeriodMax: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    minQualificationScore: number;
    requiredSkills?: string[] | undefined;
    preferredSkills?: string[] | undefined;
    certificationsRequired?: string[] | undefined;
    noticePeriodMax?: string | undefined;
    minExperienceYears?: number | undefined;
    educationLevel?: string | undefined;
    maxSalaryExpectation?: number | undefined;
}, {
    requiredSkills?: string[] | undefined;
    preferredSkills?: string[] | undefined;
    certificationsRequired?: string[] | undefined;
    noticePeriodMax?: string | undefined;
    minQualificationScore?: number | undefined;
    minExperienceYears?: number | undefined;
    educationLevel?: string | undefined;
    maxSalaryExpectation?: number | undefined;
}>;
export declare const QualifyCandidateSchema: z.ZodObject<{
    candidateId: z.ZodString;
    jobId: z.ZodOptional<z.ZodString>;
    criteria: z.ZodOptional<z.ZodObject<{
        minQualificationScore: z.ZodDefault<z.ZodNumber>;
        minExperienceYears: z.ZodOptional<z.ZodNumber>;
        requiredSkills: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        preferredSkills: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        educationLevel: z.ZodOptional<z.ZodString>;
        certificationsRequired: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        maxSalaryExpectation: z.ZodOptional<z.ZodNumber>;
        noticePeriodMax: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        minQualificationScore: number;
        requiredSkills?: string[] | undefined;
        preferredSkills?: string[] | undefined;
        certificationsRequired?: string[] | undefined;
        noticePeriodMax?: string | undefined;
        minExperienceYears?: number | undefined;
        educationLevel?: string | undefined;
        maxSalaryExpectation?: number | undefined;
    }, {
        requiredSkills?: string[] | undefined;
        preferredSkills?: string[] | undefined;
        certificationsRequired?: string[] | undefined;
        noticePeriodMax?: string | undefined;
        minQualificationScore?: number | undefined;
        minExperienceYears?: number | undefined;
        educationLevel?: string | undefined;
        maxSalaryExpectation?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    candidateId: string;
    jobId?: string | undefined;
    criteria?: {
        minQualificationScore: number;
        requiredSkills?: string[] | undefined;
        preferredSkills?: string[] | undefined;
        certificationsRequired?: string[] | undefined;
        noticePeriodMax?: string | undefined;
        minExperienceYears?: number | undefined;
        educationLevel?: string | undefined;
        maxSalaryExpectation?: number | undefined;
    } | undefined;
}, {
    candidateId: string;
    jobId?: string | undefined;
    criteria?: {
        requiredSkills?: string[] | undefined;
        preferredSkills?: string[] | undefined;
        certificationsRequired?: string[] | undefined;
        noticePeriodMax?: string | undefined;
        minQualificationScore?: number | undefined;
        minExperienceYears?: number | undefined;
        educationLevel?: string | undefined;
        maxSalaryExpectation?: number | undefined;
    } | undefined;
}>;
export declare const JobRequirementSchema: z.ZodObject<{
    skill: z.ZodString;
    required: z.ZodDefault<z.ZodBoolean>;
    minYears: z.ZodOptional<z.ZodNumber>;
    priority: z.ZodDefault<z.ZodEnum<["must_have", "should_have", "nice_to_have"]>>;
}, "strip", z.ZodTypeAny, {
    skill: string;
    required: boolean;
    priority: "must_have" | "should_have" | "nice_to_have";
    minYears?: number | undefined;
}, {
    skill: string;
    required?: boolean | undefined;
    minYears?: number | undefined;
    priority?: "must_have" | "should_have" | "nice_to_have" | undefined;
}>;
export declare const CreateJobSchema: z.ZodObject<{
    title: z.ZodString;
    department: z.ZodString;
    location: z.ZodString;
    employmentType: z.ZodDefault<z.ZodNativeEnum<typeof EmploymentType>>;
    experienceLevel: z.ZodNativeEnum<typeof ExperienceLevel>;
    description: z.ZodString;
    responsibilities: z.ZodArray<z.ZodString, "many">;
    requirements: z.ZodArray<z.ZodObject<{
        skill: z.ZodString;
        required: z.ZodDefault<z.ZodBoolean>;
        minYears: z.ZodOptional<z.ZodNumber>;
        priority: z.ZodDefault<z.ZodEnum<["must_have", "should_have", "nice_to_have"]>>;
    }, "strip", z.ZodTypeAny, {
        skill: string;
        required: boolean;
        priority: "must_have" | "should_have" | "nice_to_have";
        minYears?: number | undefined;
    }, {
        skill: string;
        required?: boolean | undefined;
        minYears?: number | undefined;
        priority?: "must_have" | "should_have" | "nice_to_have" | undefined;
    }>, "many">;
    preferredQualifications: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    salary: z.ZodOptional<z.ZodObject<{
        min: z.ZodNumber;
        max: z.ZodNumber;
        currency: z.ZodNativeEnum<typeof SalaryCurrency>;
        isNegotiable: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        currency: SalaryCurrency;
        min: number;
        max: number;
        isNegotiable: boolean;
    }, {
        currency: SalaryCurrency;
        min: number;
        max: number;
        isNegotiable?: boolean | undefined;
    }>>;
    benefits: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    workingHours: z.ZodOptional<z.ZodString>;
    remotePolicy: z.ZodDefault<z.ZodEnum<["onsite", "hybrid", "remote"]>>;
    interviewRounds: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodNativeEnum<typeof InterviewType>;
        duration: z.ZodNumber;
        interviewers: z.ZodArray<z.ZodString, "many">;
        description: z.ZodOptional<z.ZodString>;
        order: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: InterviewType;
        name: string;
        duration: number;
        interviewers: string[];
        order: number;
        description?: string | undefined;
    }, {
        type: InterviewType;
        name: string;
        duration: number;
        interviewers: string[];
        order: number;
        description?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    location: string;
    title: string;
    description: string;
    experienceLevel: ExperienceLevel;
    department: string;
    employmentType: EmploymentType;
    responsibilities: string[];
    requirements: {
        skill: string;
        required: boolean;
        priority: "must_have" | "should_have" | "nice_to_have";
        minYears?: number | undefined;
    }[];
    remotePolicy: "onsite" | "hybrid" | "remote";
    salary?: {
        currency: SalaryCurrency;
        min: number;
        max: number;
        isNegotiable: boolean;
    } | undefined;
    preferredQualifications?: string[] | undefined;
    benefits?: string[] | undefined;
    workingHours?: string | undefined;
    interviewRounds?: {
        type: InterviewType;
        name: string;
        duration: number;
        interviewers: string[];
        order: number;
        description?: string | undefined;
    }[] | undefined;
}, {
    location: string;
    title: string;
    description: string;
    experienceLevel: ExperienceLevel;
    department: string;
    responsibilities: string[];
    requirements: {
        skill: string;
        required?: boolean | undefined;
        minYears?: number | undefined;
        priority?: "must_have" | "should_have" | "nice_to_have" | undefined;
    }[];
    salary?: {
        currency: SalaryCurrency;
        min: number;
        max: number;
        isNegotiable?: boolean | undefined;
    } | undefined;
    employmentType?: EmploymentType | undefined;
    preferredQualifications?: string[] | undefined;
    benefits?: string[] | undefined;
    workingHours?: string | undefined;
    remotePolicy?: "onsite" | "hybrid" | "remote" | undefined;
    interviewRounds?: {
        type: InterviewType;
        name: string;
        duration: number;
        interviewers: string[];
        order: number;
        description?: string | undefined;
    }[] | undefined;
}>;
export declare const UpdateJobSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    department: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    employmentType: z.ZodOptional<z.ZodDefault<z.ZodNativeEnum<typeof EmploymentType>>>;
    experienceLevel: z.ZodOptional<z.ZodNativeEnum<typeof ExperienceLevel>>;
    description: z.ZodOptional<z.ZodString>;
    responsibilities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    requirements: z.ZodOptional<z.ZodArray<z.ZodObject<{
        skill: z.ZodString;
        required: z.ZodDefault<z.ZodBoolean>;
        minYears: z.ZodOptional<z.ZodNumber>;
        priority: z.ZodDefault<z.ZodEnum<["must_have", "should_have", "nice_to_have"]>>;
    }, "strip", z.ZodTypeAny, {
        skill: string;
        required: boolean;
        priority: "must_have" | "should_have" | "nice_to_have";
        minYears?: number | undefined;
    }, {
        skill: string;
        required?: boolean | undefined;
        minYears?: number | undefined;
        priority?: "must_have" | "should_have" | "nice_to_have" | undefined;
    }>, "many">>;
    preferredQualifications: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    salary: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        min: z.ZodNumber;
        max: z.ZodNumber;
        currency: z.ZodNativeEnum<typeof SalaryCurrency>;
        isNegotiable: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        currency: SalaryCurrency;
        min: number;
        max: number;
        isNegotiable: boolean;
    }, {
        currency: SalaryCurrency;
        min: number;
        max: number;
        isNegotiable?: boolean | undefined;
    }>>>;
    benefits: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    workingHours: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    remotePolicy: z.ZodOptional<z.ZodDefault<z.ZodEnum<["onsite", "hybrid", "remote"]>>>;
    interviewRounds: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodNativeEnum<typeof InterviewType>;
        duration: z.ZodNumber;
        interviewers: z.ZodArray<z.ZodString, "many">;
        description: z.ZodOptional<z.ZodString>;
        order: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: InterviewType;
        name: string;
        duration: number;
        interviewers: string[];
        order: number;
        description?: string | undefined;
    }, {
        type: InterviewType;
        name: string;
        duration: number;
        interviewers: string[];
        order: number;
        description?: string | undefined;
    }>, "many">>>;
} & {
    status: z.ZodOptional<z.ZodEnum<["draft", "active", "paused", "closed"]>>;
}, "strip", z.ZodTypeAny, {
    location?: string | undefined;
    status?: "draft" | "active" | "paused" | "closed" | undefined;
    title?: string | undefined;
    description?: string | undefined;
    salary?: {
        currency: SalaryCurrency;
        min: number;
        max: number;
        isNegotiable: boolean;
    } | undefined;
    experienceLevel?: ExperienceLevel | undefined;
    department?: string | undefined;
    employmentType?: EmploymentType | undefined;
    responsibilities?: string[] | undefined;
    requirements?: {
        skill: string;
        required: boolean;
        priority: "must_have" | "should_have" | "nice_to_have";
        minYears?: number | undefined;
    }[] | undefined;
    preferredQualifications?: string[] | undefined;
    benefits?: string[] | undefined;
    workingHours?: string | undefined;
    remotePolicy?: "onsite" | "hybrid" | "remote" | undefined;
    interviewRounds?: {
        type: InterviewType;
        name: string;
        duration: number;
        interviewers: string[];
        order: number;
        description?: string | undefined;
    }[] | undefined;
}, {
    location?: string | undefined;
    status?: "draft" | "active" | "paused" | "closed" | undefined;
    title?: string | undefined;
    description?: string | undefined;
    salary?: {
        currency: SalaryCurrency;
        min: number;
        max: number;
        isNegotiable?: boolean | undefined;
    } | undefined;
    experienceLevel?: ExperienceLevel | undefined;
    department?: string | undefined;
    employmentType?: EmploymentType | undefined;
    responsibilities?: string[] | undefined;
    requirements?: {
        skill: string;
        required?: boolean | undefined;
        minYears?: number | undefined;
        priority?: "must_have" | "should_have" | "nice_to_have" | undefined;
    }[] | undefined;
    preferredQualifications?: string[] | undefined;
    benefits?: string[] | undefined;
    workingHours?: string | undefined;
    remotePolicy?: "onsite" | "hybrid" | "remote" | undefined;
    interviewRounds?: {
        type: InterviewType;
        name: string;
        duration: number;
        interviewers: string[];
        order: number;
        description?: string | undefined;
    }[] | undefined;
}>;
export declare const MatchCandidatesSchema: z.ZodObject<{
    jobId: z.ZodString;
    candidateIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    filters: z.ZodOptional<z.ZodObject<{
        minMatchScore: z.ZodOptional<z.ZodNumber>;
        status: z.ZodOptional<z.ZodArray<z.ZodNativeEnum<typeof CandidateStatus>, "many">>;
    }, "strip", z.ZodTypeAny, {
        status?: CandidateStatus[] | undefined;
        minMatchScore?: number | undefined;
    }, {
        status?: CandidateStatus[] | undefined;
        minMatchScore?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    jobId: string;
    candidateIds?: string[] | undefined;
    filters?: {
        status?: CandidateStatus[] | undefined;
        minMatchScore?: number | undefined;
    } | undefined;
}, {
    jobId: string;
    candidateIds?: string[] | undefined;
    filters?: {
        status?: CandidateStatus[] | undefined;
        minMatchScore?: number | undefined;
    } | undefined;
}>;
export declare const ScheduleInterviewSchema: z.ZodObject<{
    candidateId: z.ZodString;
    jobId: z.ZodString;
    interviewType: z.ZodNativeEnum<typeof InterviewType>;
    roundNumber: z.ZodDefault<z.ZodNumber>;
    scheduledAt: z.ZodString;
    duration: z.ZodDefault<z.ZodNumber>;
    timezone: z.ZodDefault<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    meetingLink: z.ZodOptional<z.ZodString>;
    interviewerIds: z.ZodArray<z.ZodString, "many">;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    jobId: string;
    candidateId: string;
    duration: number;
    interviewType: InterviewType;
    roundNumber: number;
    scheduledAt: string;
    timezone: string;
    interviewerIds: string[];
    location?: string | undefined;
    notes?: string | undefined;
    meetingLink?: string | undefined;
}, {
    jobId: string;
    candidateId: string;
    interviewType: InterviewType;
    scheduledAt: string;
    interviewerIds: string[];
    location?: string | undefined;
    notes?: string | undefined;
    duration?: number | undefined;
    roundNumber?: number | undefined;
    timezone?: string | undefined;
    meetingLink?: string | undefined;
}>;
export declare const UpdateInterviewSchema: z.ZodObject<{
    scheduledAt: z.ZodOptional<z.ZodString>;
    duration: z.ZodOptional<z.ZodNumber>;
    location: z.ZodOptional<z.ZodString>;
    meetingLink: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodNativeEnum<typeof InterviewStatus>>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    location?: string | undefined;
    status?: InterviewStatus | undefined;
    notes?: string | undefined;
    duration?: number | undefined;
    scheduledAt?: string | undefined;
    meetingLink?: string | undefined;
}, {
    location?: string | undefined;
    status?: InterviewStatus | undefined;
    notes?: string | undefined;
    duration?: number | undefined;
    scheduledAt?: string | undefined;
    meetingLink?: string | undefined;
}>;
export declare const SubmitFeedbackSchema: z.ZodObject<{
    interviewId: z.ZodString;
    interviewerId: z.ZodString;
    technicalSkills: z.ZodNumber;
    communication: z.ZodNumber;
    problemSolving: z.ZodNumber;
    cultureFit: z.ZodNumber;
    overallScore: z.ZodNumber;
    strengths: z.ZodArray<z.ZodString, "many">;
    concerns: z.ZodArray<z.ZodString, "many">;
    recommendation: z.ZodEnum<["strong_hire", "hire", "no_hire", "strong_no_hire"]>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    communication: number;
    recommendation: "strong_hire" | "hire" | "no_hire" | "strong_no_hire";
    interviewId: string;
    interviewerId: string;
    technicalSkills: number;
    problemSolving: number;
    cultureFit: number;
    overallScore: number;
    strengths: string[];
    concerns: string[];
    notes?: string | undefined;
}, {
    communication: number;
    recommendation: "strong_hire" | "hire" | "no_hire" | "strong_no_hire";
    interviewId: string;
    interviewerId: string;
    technicalSkills: number;
    problemSolving: number;
    cultureFit: number;
    overallScore: number;
    strengths: string[];
    concerns: string[];
    notes?: string | undefined;
}>;
export declare const InterviewQuerySchema: z.ZodObject<{
    candidateId: z.ZodOptional<z.ZodString>;
    jobId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodArray<z.ZodNativeEnum<typeof InterviewStatus>, "many">>;
    interviewerId: z.ZodOptional<z.ZodString>;
    fromDate: z.ZodOptional<z.ZodString>;
    toDate: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    status?: InterviewStatus[] | undefined;
    jobId?: string | undefined;
    candidateId?: string | undefined;
    interviewerId?: string | undefined;
    fromDate?: string | undefined;
    toDate?: string | undefined;
}, {
    status?: InterviewStatus[] | undefined;
    jobId?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    candidateId?: string | undefined;
    interviewerId?: string | undefined;
    fromDate?: string | undefined;
    toDate?: string | undefined;
}>;
export declare const StartOnboardingSchema: z.ZodObject<{
    candidateId: z.ZodString;
    jobId: z.ZodString;
    startDate: z.ZodString;
    targetCompletionDate: z.ZodOptional<z.ZodString>;
    managerId: z.ZodString;
    buddyId: z.ZodOptional<z.ZodString>;
    templateId: z.ZodOptional<z.ZodString>;
    customChecklists: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        category: z.ZodEnum<["document", "training", "equipment", "introduction", "task"]>;
        description: z.ZodString;
        assigneeId: z.ZodOptional<z.ZodString>;
        dueDate: z.ZodOptional<z.ZodString>;
        order: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        description: string;
        name: string;
        order: number;
        category: "document" | "training" | "equipment" | "introduction" | "task";
        assigneeId?: string | undefined;
        dueDate?: string | undefined;
    }, {
        description: string;
        name: string;
        order: number;
        category: "document" | "training" | "equipment" | "introduction" | "task";
        assigneeId?: string | undefined;
        dueDate?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    startDate: string;
    jobId: string;
    candidateId: string;
    managerId: string;
    targetCompletionDate?: string | undefined;
    buddyId?: string | undefined;
    templateId?: string | undefined;
    customChecklists?: {
        description: string;
        name: string;
        order: number;
        category: "document" | "training" | "equipment" | "introduction" | "task";
        assigneeId?: string | undefined;
        dueDate?: string | undefined;
    }[] | undefined;
}, {
    startDate: string;
    jobId: string;
    candidateId: string;
    managerId: string;
    targetCompletionDate?: string | undefined;
    buddyId?: string | undefined;
    templateId?: string | undefined;
    customChecklists?: {
        description: string;
        name: string;
        order: number;
        category: "document" | "training" | "equipment" | "introduction" | "task";
        assigneeId?: string | undefined;
        dueDate?: string | undefined;
    }[] | undefined;
}>;
export declare const UpdateOnboardingSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodNativeEnum<typeof OnboardingStatus>>;
    targetCompletionDate: z.ZodOptional<z.ZodString>;
    managerId: z.ZodOptional<z.ZodString>;
    buddyId: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: OnboardingStatus | undefined;
    notes?: string | undefined;
    targetCompletionDate?: string | undefined;
    managerId?: string | undefined;
    buddyId?: string | undefined;
}, {
    status?: OnboardingStatus | undefined;
    notes?: string | undefined;
    targetCompletionDate?: string | undefined;
    managerId?: string | undefined;
    buddyId?: string | undefined;
}>;
export declare const CompleteChecklistItemSchema: z.ZodObject<{
    onboardingId: z.ZodString;
    checklistId: z.ZodString;
    completedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    onboardingId: string;
    checklistId: string;
    completedAt?: string | undefined;
}, {
    onboardingId: string;
    checklistId: string;
    completedAt?: string | undefined;
}>;
export declare const SubmitOnboardingFeedbackSchema: z.ZodObject<{
    onboardingId: z.ZodString;
    type: z.ZodEnum<["day1", "week1", "month1", "90day"]>;
    ratings: z.ZodObject<{
        onboardingQuality: z.ZodNumber;
        managerSupport: z.ZodNumber;
        clarityOfRole: z.ZodNumber;
        overallSatisfaction: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        onboardingQuality: number;
        managerSupport: number;
        clarityOfRole: number;
        overallSatisfaction: number;
    }, {
        onboardingQuality: number;
        managerSupport: number;
        clarityOfRole: number;
        overallSatisfaction: number;
    }>;
    positiveAspects: z.ZodArray<z.ZodString, "many">;
    areasForImprovement: z.ZodArray<z.ZodString, "many">;
    comments: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "day1" | "week1" | "month1" | "90day";
    onboardingId: string;
    ratings: {
        onboardingQuality: number;
        managerSupport: number;
        clarityOfRole: number;
        overallSatisfaction: number;
    };
    positiveAspects: string[];
    areasForImprovement: string[];
    comments?: string | undefined;
}, {
    type: "day1" | "week1" | "month1" | "90day";
    onboardingId: string;
    ratings: {
        onboardingQuality: number;
        managerSupport: number;
        clarityOfRole: number;
        overallSatisfaction: number;
    };
    positiveAspects: string[];
    areasForImprovement: string[];
    comments?: string | undefined;
}>;
export declare const AnalyzeSkillsSchema: z.ZodObject<{
    candidateId: z.ZodString;
    jobId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    candidateId: string;
    jobId?: string | undefined;
}, {
    candidateId: string;
    jobId?: string | undefined;
}>;
export declare const GetSalaryBenchmarkSchema: z.ZodObject<{
    jobTitle: z.ZodString;
    location: z.ZodString;
    experienceLevel: z.ZodNativeEnum<typeof ExperienceLevel>;
    currency: z.ZodDefault<z.ZodNativeEnum<typeof SalaryCurrency>>;
}, "strip", z.ZodTypeAny, {
    location: string;
    currency: SalaryCurrency;
    experienceLevel: ExperienceLevel;
    jobTitle: string;
}, {
    location: string;
    experienceLevel: ExperienceLevel;
    jobTitle: string;
    currency?: SalaryCurrency | undefined;
}>;
export type CreateCandidateInput = z.infer<typeof CreateCandidateSchema>;
export type UpdateCandidateInput = z.infer<typeof UpdateCandidateSchema>;
export type CandidateQueryInput = z.infer<typeof CandidateQuerySchema>;
export type ScreenResumeInput = z.infer<typeof ScreenResumeSchema>;
export type QualifyCandidateInput = z.infer<typeof QualifyCandidateSchema>;
export type CreateJobInput = z.infer<typeof CreateJobSchema>;
export type UpdateJobInput = z.infer<typeof UpdateJobSchema>;
export type MatchCandidatesInput = z.infer<typeof MatchCandidatesSchema>;
export type ScheduleInterviewInput = z.infer<typeof ScheduleInterviewSchema>;
export type UpdateInterviewInput = z.infer<typeof UpdateInterviewSchema>;
export type SubmitFeedbackInput = z.infer<typeof SubmitFeedbackSchema>;
export type InterviewQueryInput = z.infer<typeof InterviewQuerySchema>;
export type StartOnboardingInput = z.infer<typeof StartOnboardingSchema>;
export type UpdateOnboardingInput = z.infer<typeof UpdateOnboardingSchema>;
export type CompleteChecklistItemInput = z.infer<typeof CompleteChecklistItemSchema>;
export type SubmitOnboardingFeedbackInput = z.infer<typeof SubmitOnboardingFeedbackSchema>;
export type AnalyzeSkillsInput = z.infer<typeof AnalyzeSkillsSchema>;
export type GetSalaryBenchmarkInput = z.infer<typeof GetSalaryBenchmarkSchema>;
//# sourceMappingURL=schemas.d.ts.map