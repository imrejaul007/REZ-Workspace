import { z } from 'zod';
export declare const BloodGroupSchema: z.ZodEnum<["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"]>;
export type BloodGroup = z.infer<typeof BloodGroupSchema>;
export declare const GenderSchema: z.ZodEnum<["male", "female", "other", "prefer-not-to-say"]>;
export type Gender = z.infer<typeof GenderSchema>;
export declare const RelationshipSchema: z.ZodEnum<["self", "father", "mother", "spouse", "child", "sibling", "other"]>;
export type Relationship = z.infer<typeof RelationshipSchema>;
export declare const AllergySeveritySchema: z.ZodEnum<["mild", "moderate", "severe", "life-threatening"]>;
export type AllergySeverity = z.infer<typeof AllergySeveritySchema>;
export declare const AllergyTypeSchema: z.ZodEnum<["food", "medication", "environmental", "other"]>;
export type AllergyType = z.infer<typeof AllergyTypeSchema>;
export declare const ConditionStatusSchema: z.ZodEnum<["active", "managed", "resolved"]>;
export type ConditionStatus = z.infer<typeof ConditionStatusSchema>;
export declare const LifestyleSchema: z.ZodObject<{
    smoking: z.ZodEnum<["never", "former", "current", "occasional"]>;
    alcohol: z.ZodEnum<["never", "occasional", "moderate", "heavy"]>;
    sleepHours: z.ZodNumber;
    waterIntake: z.ZodNumber;
    activityLevel: z.ZodEnum<["sedentary", "light", "moderate", "active", "very-active"]>;
    stressLevel: z.ZodEnum<["low", "moderate", "high", "very-high"]>;
    foodPreferences: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    smoking: "never" | "former" | "current" | "occasional";
    alcohol: "moderate" | "never" | "occasional" | "heavy";
    sleepHours: number;
    waterIntake: number;
    activityLevel: "moderate" | "active" | "sedentary" | "light" | "very-active";
    stressLevel: "moderate" | "low" | "high" | "very-high";
    foodPreferences: string[];
}, {
    smoking: "never" | "former" | "current" | "occasional";
    alcohol: "moderate" | "never" | "occasional" | "heavy";
    sleepHours: number;
    waterIntake: number;
    activityLevel: "moderate" | "active" | "sedentary" | "light" | "very-active";
    stressLevel: "moderate" | "low" | "high" | "very-high";
    foodPreferences: string[];
}>;
export type Lifestyle = z.infer<typeof LifestyleSchema>;
export declare const AllergySchema: z.ZodObject<{
    allergen: z.ZodString;
    type: z.ZodEnum<["food", "medication", "environmental", "other"]>;
    severity: z.ZodEnum<["mild", "moderate", "severe", "life-threatening"]>;
    notes: z.ZodOptional<z.ZodString>;
    diagnosedDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "other" | "food" | "medication" | "environmental";
    allergen: string;
    severity: "mild" | "moderate" | "severe" | "life-threatening";
    notes?: string | undefined;
    diagnosedDate?: string | undefined;
}, {
    type: "other" | "food" | "medication" | "environmental";
    allergen: string;
    severity: "mild" | "moderate" | "severe" | "life-threatening";
    notes?: string | undefined;
    diagnosedDate?: string | undefined;
}>;
export type Allergy = z.infer<typeof AllergySchema>;
export declare const ChronicConditionSchema: z.ZodObject<{
    name: z.ZodString;
    diagnosedDate: z.ZodString;
    status: z.ZodEnum<["active", "managed", "resolved"]>;
    medications: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    status: "active" | "managed" | "resolved";
    diagnosedDate: string;
    notes?: string | undefined;
    medications?: string[] | undefined;
}, {
    name: string;
    status: "active" | "managed" | "resolved";
    diagnosedDate: string;
    notes?: string | undefined;
    medications?: string[] | undefined;
}>;
export type ChronicCondition = z.infer<typeof ChronicConditionSchema>;
export declare const MedicationSchema: z.ZodObject<{
    name: z.ZodString;
    dosage: z.ZodString;
    frequency: z.ZodString;
    startDate: z.ZodString;
    endDate: z.ZodOptional<z.ZodString>;
    purpose: z.ZodOptional<z.ZodString>;
    prescribedBy: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    dosage: string;
    frequency: string;
    startDate: string;
    endDate?: string | undefined;
    purpose?: string | undefined;
    prescribedBy?: string | undefined;
}, {
    name: string;
    dosage: string;
    frequency: string;
    startDate: string;
    endDate?: string | undefined;
    purpose?: string | undefined;
    prescribedBy?: string | undefined;
}>;
export type Medication = z.infer<typeof MedicationSchema>;
export declare const VaccinationSchema: z.ZodObject<{
    name: z.ZodString;
    date: z.ZodString;
    nextDueDate: z.ZodOptional<z.ZodString>;
    provider: z.ZodOptional<z.ZodString>;
    lotNumber: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    date: string;
    nextDueDate?: string | undefined;
    provider?: string | undefined;
    lotNumber?: string | undefined;
}, {
    name: string;
    date: string;
    nextDueDate?: string | undefined;
    provider?: string | undefined;
    lotNumber?: string | undefined;
}>;
export type Vaccination = z.infer<typeof VaccinationSchema>;
export declare const FamilyHistoryItemSchema: z.ZodObject<{
    condition: z.ZodString;
    relation: z.ZodEnum<["father", "mother", "sibling", "grandparent", "maternal-grandparent", "paternal-grandparent"]>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    condition: string;
    relation: "father" | "mother" | "sibling" | "grandparent" | "maternal-grandparent" | "paternal-grandparent";
    notes?: string | undefined;
}, {
    condition: string;
    relation: "father" | "mother" | "sibling" | "grandparent" | "maternal-grandparent" | "paternal-grandparent";
    notes?: string | undefined;
}>;
export type FamilyHistoryItem = z.infer<typeof FamilyHistoryItemSchema>;
export declare const EmergencyContactSchema: z.ZodObject<{
    name: z.ZodString;
    relationship: z.ZodString;
    phone: z.ZodString;
    isPrimary: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    relationship: string;
    phone: string;
    isPrimary: boolean;
}, {
    name: string;
    relationship: string;
    phone: string;
    isPrimary?: boolean | undefined;
}>;
export type EmergencyContact = z.infer<typeof EmergencyContactSchema>;
export declare const HealthProfileSchema: z.ZodObject<{
    profileId: z.ZodString;
    name: z.ZodString;
    relationship: z.ZodEnum<["self", "father", "mother", "spouse", "child", "sibling", "other"]>;
    age: z.ZodOptional<z.ZodNumber>;
    gender: z.ZodEnum<["male", "female", "other", "prefer-not-to-say"]>;
    dateOfBirth: z.ZodOptional<z.ZodString>;
    bloodGroup: z.ZodOptional<z.ZodEnum<["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"]>>;
    isPrimary: z.ZodDefault<z.ZodBoolean>;
    isMinor: z.ZodDefault<z.ZodBoolean>;
    health: z.ZodDefault<z.ZodObject<{
        allergies: z.ZodDefault<z.ZodArray<z.ZodObject<{
            allergen: z.ZodString;
            type: z.ZodEnum<["food", "medication", "environmental", "other"]>;
            severity: z.ZodEnum<["mild", "moderate", "severe", "life-threatening"]>;
            notes: z.ZodOptional<z.ZodString>;
            diagnosedDate: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: "other" | "food" | "medication" | "environmental";
            allergen: string;
            severity: "mild" | "moderate" | "severe" | "life-threatening";
            notes?: string | undefined;
            diagnosedDate?: string | undefined;
        }, {
            type: "other" | "food" | "medication" | "environmental";
            allergen: string;
            severity: "mild" | "moderate" | "severe" | "life-threatening";
            notes?: string | undefined;
            diagnosedDate?: string | undefined;
        }>, "many">>;
        chronicConditions: z.ZodDefault<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            diagnosedDate: z.ZodString;
            status: z.ZodEnum<["active", "managed", "resolved"]>;
            medications: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            notes: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            status: "active" | "managed" | "resolved";
            diagnosedDate: string;
            notes?: string | undefined;
            medications?: string[] | undefined;
        }, {
            name: string;
            status: "active" | "managed" | "resolved";
            diagnosedDate: string;
            notes?: string | undefined;
            medications?: string[] | undefined;
        }>, "many">>;
        currentMedications: z.ZodDefault<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            dosage: z.ZodString;
            frequency: z.ZodString;
            startDate: z.ZodString;
            endDate: z.ZodOptional<z.ZodString>;
            purpose: z.ZodOptional<z.ZodString>;
            prescribedBy: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            dosage: string;
            frequency: string;
            startDate: string;
            endDate?: string | undefined;
            purpose?: string | undefined;
            prescribedBy?: string | undefined;
        }, {
            name: string;
            dosage: string;
            frequency: string;
            startDate: string;
            endDate?: string | undefined;
            purpose?: string | undefined;
            prescribedBy?: string | undefined;
        }>, "many">>;
        vaccinationHistory: z.ZodDefault<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            date: z.ZodString;
            nextDueDate: z.ZodOptional<z.ZodString>;
            provider: z.ZodOptional<z.ZodString>;
            lotNumber: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            date: string;
            nextDueDate?: string | undefined;
            provider?: string | undefined;
            lotNumber?: string | undefined;
        }, {
            name: string;
            date: string;
            nextDueDate?: string | undefined;
            provider?: string | undefined;
            lotNumber?: string | undefined;
        }>, "many">>;
        familyHistory: z.ZodDefault<z.ZodArray<z.ZodObject<{
            condition: z.ZodString;
            relation: z.ZodEnum<["father", "mother", "sibling", "grandparent", "maternal-grandparent", "paternal-grandparent"]>;
            notes: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            condition: string;
            relation: "father" | "mother" | "sibling" | "grandparent" | "maternal-grandparent" | "paternal-grandparent";
            notes?: string | undefined;
        }, {
            condition: string;
            relation: "father" | "mother" | "sibling" | "grandparent" | "maternal-grandparent" | "paternal-grandparent";
            notes?: string | undefined;
        }>, "many">>;
        pregnancyStatus: z.ZodOptional<z.ZodEnum<["none", "pregnant", "trying", "lactating"]>>;
        menstrualProfile: z.ZodOptional<z.ZodObject<{
            cycleLength: z.ZodNumber;
            periodLength: z.ZodNumber;
            lastPeriodStart: z.ZodOptional<z.ZodString>;
            symptoms: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            flowIntensity: z.ZodOptional<z.ZodEnum<["light", "medium", "heavy"]>>;
            pmsSymptoms: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            irregularCycles: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            symptoms: string[];
            cycleLength: number;
            periodLength: number;
            pmsSymptoms: string[];
            irregularCycles: boolean;
            lastPeriodStart?: string | undefined;
            flowIntensity?: "heavy" | "light" | "medium" | undefined;
        }, {
            cycleLength: number;
            periodLength: number;
            symptoms?: string[] | undefined;
            lastPeriodStart?: string | undefined;
            flowIntensity?: "heavy" | "light" | "medium" | undefined;
            pmsSymptoms?: string[] | undefined;
            irregularCycles?: boolean | undefined;
        }>>;
        lifestyle: z.ZodOptional<z.ZodObject<{
            smoking: z.ZodEnum<["never", "former", "current", "occasional"]>;
            alcohol: z.ZodEnum<["never", "occasional", "moderate", "heavy"]>;
            sleepHours: z.ZodNumber;
            waterIntake: z.ZodNumber;
            activityLevel: z.ZodEnum<["sedentary", "light", "moderate", "active", "very-active"]>;
            stressLevel: z.ZodEnum<["low", "moderate", "high", "very-high"]>;
            foodPreferences: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            smoking: "never" | "former" | "current" | "occasional";
            alcohol: "moderate" | "never" | "occasional" | "heavy";
            sleepHours: number;
            waterIntake: number;
            activityLevel: "moderate" | "active" | "sedentary" | "light" | "very-active";
            stressLevel: "moderate" | "low" | "high" | "very-high";
            foodPreferences: string[];
        }, {
            smoking: "never" | "former" | "current" | "occasional";
            alcohol: "moderate" | "never" | "occasional" | "heavy";
            sleepHours: number;
            waterIntake: number;
            activityLevel: "moderate" | "active" | "sedentary" | "light" | "very-active";
            stressLevel: "moderate" | "low" | "high" | "very-high";
            foodPreferences: string[];
        }>>;
    }, "strip", z.ZodTypeAny, {
        allergies: {
            type: "other" | "food" | "medication" | "environmental";
            allergen: string;
            severity: "mild" | "moderate" | "severe" | "life-threatening";
            notes?: string | undefined;
            diagnosedDate?: string | undefined;
        }[];
        chronicConditions: {
            name: string;
            status: "active" | "managed" | "resolved";
            diagnosedDate: string;
            notes?: string | undefined;
            medications?: string[] | undefined;
        }[];
        currentMedications: {
            name: string;
            dosage: string;
            frequency: string;
            startDate: string;
            endDate?: string | undefined;
            purpose?: string | undefined;
            prescribedBy?: string | undefined;
        }[];
        vaccinationHistory: {
            name: string;
            date: string;
            nextDueDate?: string | undefined;
            provider?: string | undefined;
            lotNumber?: string | undefined;
        }[];
        familyHistory: {
            condition: string;
            relation: "father" | "mother" | "sibling" | "grandparent" | "maternal-grandparent" | "paternal-grandparent";
            notes?: string | undefined;
        }[];
        pregnancyStatus?: "none" | "pregnant" | "trying" | "lactating" | undefined;
        menstrualProfile?: {
            symptoms: string[];
            cycleLength: number;
            periodLength: number;
            pmsSymptoms: string[];
            irregularCycles: boolean;
            lastPeriodStart?: string | undefined;
            flowIntensity?: "heavy" | "light" | "medium" | undefined;
        } | undefined;
        lifestyle?: {
            smoking: "never" | "former" | "current" | "occasional";
            alcohol: "moderate" | "never" | "occasional" | "heavy";
            sleepHours: number;
            waterIntake: number;
            activityLevel: "moderate" | "active" | "sedentary" | "light" | "very-active";
            stressLevel: "moderate" | "low" | "high" | "very-high";
            foodPreferences: string[];
        } | undefined;
    }, {
        allergies?: {
            type: "other" | "food" | "medication" | "environmental";
            allergen: string;
            severity: "mild" | "moderate" | "severe" | "life-threatening";
            notes?: string | undefined;
            diagnosedDate?: string | undefined;
        }[] | undefined;
        chronicConditions?: {
            name: string;
            status: "active" | "managed" | "resolved";
            diagnosedDate: string;
            notes?: string | undefined;
            medications?: string[] | undefined;
        }[] | undefined;
        currentMedications?: {
            name: string;
            dosage: string;
            frequency: string;
            startDate: string;
            endDate?: string | undefined;
            purpose?: string | undefined;
            prescribedBy?: string | undefined;
        }[] | undefined;
        vaccinationHistory?: {
            name: string;
            date: string;
            nextDueDate?: string | undefined;
            provider?: string | undefined;
            lotNumber?: string | undefined;
        }[] | undefined;
        familyHistory?: {
            condition: string;
            relation: "father" | "mother" | "sibling" | "grandparent" | "maternal-grandparent" | "paternal-grandparent";
            notes?: string | undefined;
        }[] | undefined;
        pregnancyStatus?: "none" | "pregnant" | "trying" | "lactating" | undefined;
        menstrualProfile?: {
            cycleLength: number;
            periodLength: number;
            symptoms?: string[] | undefined;
            lastPeriodStart?: string | undefined;
            flowIntensity?: "heavy" | "light" | "medium" | undefined;
            pmsSymptoms?: string[] | undefined;
            irregularCycles?: boolean | undefined;
        } | undefined;
        lifestyle?: {
            smoking: "never" | "former" | "current" | "occasional";
            alcohol: "moderate" | "never" | "occasional" | "heavy";
            sleepHours: number;
            waterIntake: number;
            activityLevel: "moderate" | "active" | "sedentary" | "light" | "very-active";
            stressLevel: "moderate" | "low" | "high" | "very-high";
            foodPreferences: string[];
        } | undefined;
    }>>;
    emergencyContacts: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        relationship: z.ZodString;
        phone: z.ZodString;
        isPrimary: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        relationship: string;
        phone: string;
        isPrimary: boolean;
    }, {
        name: string;
        relationship: string;
        phone: string;
        isPrimary?: boolean | undefined;
    }>, "many">>;
    wearableData: z.ZodOptional<z.ZodObject<{
        lastSync: z.ZodOptional<z.ZodString>;
        dataTypes: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        avgSteps: z.ZodOptional<z.ZodNumber>;
        avgHeartRate: z.ZodOptional<z.ZodNumber>;
        avgSleepHours: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        dataTypes: string[];
        lastSync?: string | undefined;
        avgSteps?: number | undefined;
        avgHeartRate?: number | undefined;
        avgSleepHours?: number | undefined;
    }, {
        lastSync?: string | undefined;
        dataTypes?: string[] | undefined;
        avgSteps?: number | undefined;
        avgHeartRate?: number | undefined;
        avgSleepHours?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    profileId: string;
    relationship: "other" | "self" | "father" | "mother" | "spouse" | "child" | "sibling";
    isPrimary: boolean;
    gender: "male" | "female" | "other" | "prefer-not-to-say";
    isMinor: boolean;
    health: {
        allergies: {
            type: "other" | "food" | "medication" | "environmental";
            allergen: string;
            severity: "mild" | "moderate" | "severe" | "life-threatening";
            notes?: string | undefined;
            diagnosedDate?: string | undefined;
        }[];
        chronicConditions: {
            name: string;
            status: "active" | "managed" | "resolved";
            diagnosedDate: string;
            notes?: string | undefined;
            medications?: string[] | undefined;
        }[];
        currentMedications: {
            name: string;
            dosage: string;
            frequency: string;
            startDate: string;
            endDate?: string | undefined;
            purpose?: string | undefined;
            prescribedBy?: string | undefined;
        }[];
        vaccinationHistory: {
            name: string;
            date: string;
            nextDueDate?: string | undefined;
            provider?: string | undefined;
            lotNumber?: string | undefined;
        }[];
        familyHistory: {
            condition: string;
            relation: "father" | "mother" | "sibling" | "grandparent" | "maternal-grandparent" | "paternal-grandparent";
            notes?: string | undefined;
        }[];
        pregnancyStatus?: "none" | "pregnant" | "trying" | "lactating" | undefined;
        menstrualProfile?: {
            symptoms: string[];
            cycleLength: number;
            periodLength: number;
            pmsSymptoms: string[];
            irregularCycles: boolean;
            lastPeriodStart?: string | undefined;
            flowIntensity?: "heavy" | "light" | "medium" | undefined;
        } | undefined;
        lifestyle?: {
            smoking: "never" | "former" | "current" | "occasional";
            alcohol: "moderate" | "never" | "occasional" | "heavy";
            sleepHours: number;
            waterIntake: number;
            activityLevel: "moderate" | "active" | "sedentary" | "light" | "very-active";
            stressLevel: "moderate" | "low" | "high" | "very-high";
            foodPreferences: string[];
        } | undefined;
    };
    emergencyContacts: {
        name: string;
        relationship: string;
        phone: string;
        isPrimary: boolean;
    }[];
    age?: number | undefined;
    dateOfBirth?: string | undefined;
    bloodGroup?: "unknown" | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | undefined;
    wearableData?: {
        dataTypes: string[];
        lastSync?: string | undefined;
        avgSteps?: number | undefined;
        avgHeartRate?: number | undefined;
        avgSleepHours?: number | undefined;
    } | undefined;
}, {
    name: string;
    profileId: string;
    relationship: "other" | "self" | "father" | "mother" | "spouse" | "child" | "sibling";
    gender: "male" | "female" | "other" | "prefer-not-to-say";
    isPrimary?: boolean | undefined;
    age?: number | undefined;
    dateOfBirth?: string | undefined;
    bloodGroup?: "unknown" | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | undefined;
    isMinor?: boolean | undefined;
    health?: {
        allergies?: {
            type: "other" | "food" | "medication" | "environmental";
            allergen: string;
            severity: "mild" | "moderate" | "severe" | "life-threatening";
            notes?: string | undefined;
            diagnosedDate?: string | undefined;
        }[] | undefined;
        chronicConditions?: {
            name: string;
            status: "active" | "managed" | "resolved";
            diagnosedDate: string;
            notes?: string | undefined;
            medications?: string[] | undefined;
        }[] | undefined;
        currentMedications?: {
            name: string;
            dosage: string;
            frequency: string;
            startDate: string;
            endDate?: string | undefined;
            purpose?: string | undefined;
            prescribedBy?: string | undefined;
        }[] | undefined;
        vaccinationHistory?: {
            name: string;
            date: string;
            nextDueDate?: string | undefined;
            provider?: string | undefined;
            lotNumber?: string | undefined;
        }[] | undefined;
        familyHistory?: {
            condition: string;
            relation: "father" | "mother" | "sibling" | "grandparent" | "maternal-grandparent" | "paternal-grandparent";
            notes?: string | undefined;
        }[] | undefined;
        pregnancyStatus?: "none" | "pregnant" | "trying" | "lactating" | undefined;
        menstrualProfile?: {
            cycleLength: number;
            periodLength: number;
            symptoms?: string[] | undefined;
            lastPeriodStart?: string | undefined;
            flowIntensity?: "heavy" | "light" | "medium" | undefined;
            pmsSymptoms?: string[] | undefined;
            irregularCycles?: boolean | undefined;
        } | undefined;
        lifestyle?: {
            smoking: "never" | "former" | "current" | "occasional";
            alcohol: "moderate" | "never" | "occasional" | "heavy";
            sleepHours: number;
            waterIntake: number;
            activityLevel: "moderate" | "active" | "sedentary" | "light" | "very-active";
            stressLevel: "moderate" | "low" | "high" | "very-high";
            foodPreferences: string[];
        } | undefined;
    } | undefined;
    emergencyContacts?: {
        name: string;
        relationship: string;
        phone: string;
        isPrimary?: boolean | undefined;
    }[] | undefined;
    wearableData?: {
        lastSync?: string | undefined;
        dataTypes?: string[] | undefined;
        avgSteps?: number | undefined;
        avgHeartRate?: number | undefined;
        avgSleepHours?: number | undefined;
    } | undefined;
}>;
export type HealthProfile = z.infer<typeof HealthProfileSchema>;
export declare const UserProfileSchema: z.ZodObject<{
    userId: z.ZodString;
    profiles: z.ZodArray<z.ZodObject<{
        profileId: z.ZodString;
        name: z.ZodString;
        relationship: z.ZodEnum<["self", "father", "mother", "spouse", "child", "sibling", "other"]>;
        age: z.ZodOptional<z.ZodNumber>;
        gender: z.ZodEnum<["male", "female", "other", "prefer-not-to-say"]>;
        dateOfBirth: z.ZodOptional<z.ZodString>;
        bloodGroup: z.ZodOptional<z.ZodEnum<["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"]>>;
        isPrimary: z.ZodDefault<z.ZodBoolean>;
        isMinor: z.ZodDefault<z.ZodBoolean>;
        health: z.ZodDefault<z.ZodObject<{
            allergies: z.ZodDefault<z.ZodArray<z.ZodObject<{
                allergen: z.ZodString;
                type: z.ZodEnum<["food", "medication", "environmental", "other"]>;
                severity: z.ZodEnum<["mild", "moderate", "severe", "life-threatening"]>;
                notes: z.ZodOptional<z.ZodString>;
                diagnosedDate: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                type: "other" | "food" | "medication" | "environmental";
                allergen: string;
                severity: "mild" | "moderate" | "severe" | "life-threatening";
                notes?: string | undefined;
                diagnosedDate?: string | undefined;
            }, {
                type: "other" | "food" | "medication" | "environmental";
                allergen: string;
                severity: "mild" | "moderate" | "severe" | "life-threatening";
                notes?: string | undefined;
                diagnosedDate?: string | undefined;
            }>, "many">>;
            chronicConditions: z.ZodDefault<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                diagnosedDate: z.ZodString;
                status: z.ZodEnum<["active", "managed", "resolved"]>;
                medications: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                notes: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                status: "active" | "managed" | "resolved";
                diagnosedDate: string;
                notes?: string | undefined;
                medications?: string[] | undefined;
            }, {
                name: string;
                status: "active" | "managed" | "resolved";
                diagnosedDate: string;
                notes?: string | undefined;
                medications?: string[] | undefined;
            }>, "many">>;
            currentMedications: z.ZodDefault<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                dosage: z.ZodString;
                frequency: z.ZodString;
                startDate: z.ZodString;
                endDate: z.ZodOptional<z.ZodString>;
                purpose: z.ZodOptional<z.ZodString>;
                prescribedBy: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                dosage: string;
                frequency: string;
                startDate: string;
                endDate?: string | undefined;
                purpose?: string | undefined;
                prescribedBy?: string | undefined;
            }, {
                name: string;
                dosage: string;
                frequency: string;
                startDate: string;
                endDate?: string | undefined;
                purpose?: string | undefined;
                prescribedBy?: string | undefined;
            }>, "many">>;
            vaccinationHistory: z.ZodDefault<z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                date: z.ZodString;
                nextDueDate: z.ZodOptional<z.ZodString>;
                provider: z.ZodOptional<z.ZodString>;
                lotNumber: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                date: string;
                nextDueDate?: string | undefined;
                provider?: string | undefined;
                lotNumber?: string | undefined;
            }, {
                name: string;
                date: string;
                nextDueDate?: string | undefined;
                provider?: string | undefined;
                lotNumber?: string | undefined;
            }>, "many">>;
            familyHistory: z.ZodDefault<z.ZodArray<z.ZodObject<{
                condition: z.ZodString;
                relation: z.ZodEnum<["father", "mother", "sibling", "grandparent", "maternal-grandparent", "paternal-grandparent"]>;
                notes: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                condition: string;
                relation: "father" | "mother" | "sibling" | "grandparent" | "maternal-grandparent" | "paternal-grandparent";
                notes?: string | undefined;
            }, {
                condition: string;
                relation: "father" | "mother" | "sibling" | "grandparent" | "maternal-grandparent" | "paternal-grandparent";
                notes?: string | undefined;
            }>, "many">>;
            pregnancyStatus: z.ZodOptional<z.ZodEnum<["none", "pregnant", "trying", "lactating"]>>;
            menstrualProfile: z.ZodOptional<z.ZodObject<{
                cycleLength: z.ZodNumber;
                periodLength: z.ZodNumber;
                lastPeriodStart: z.ZodOptional<z.ZodString>;
                symptoms: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
                flowIntensity: z.ZodOptional<z.ZodEnum<["light", "medium", "heavy"]>>;
                pmsSymptoms: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
                irregularCycles: z.ZodDefault<z.ZodBoolean>;
            }, "strip", z.ZodTypeAny, {
                symptoms: string[];
                cycleLength: number;
                periodLength: number;
                pmsSymptoms: string[];
                irregularCycles: boolean;
                lastPeriodStart?: string | undefined;
                flowIntensity?: "heavy" | "light" | "medium" | undefined;
            }, {
                cycleLength: number;
                periodLength: number;
                symptoms?: string[] | undefined;
                lastPeriodStart?: string | undefined;
                flowIntensity?: "heavy" | "light" | "medium" | undefined;
                pmsSymptoms?: string[] | undefined;
                irregularCycles?: boolean | undefined;
            }>>;
            lifestyle: z.ZodOptional<z.ZodObject<{
                smoking: z.ZodEnum<["never", "former", "current", "occasional"]>;
                alcohol: z.ZodEnum<["never", "occasional", "moderate", "heavy"]>;
                sleepHours: z.ZodNumber;
                waterIntake: z.ZodNumber;
                activityLevel: z.ZodEnum<["sedentary", "light", "moderate", "active", "very-active"]>;
                stressLevel: z.ZodEnum<["low", "moderate", "high", "very-high"]>;
                foodPreferences: z.ZodArray<z.ZodString, "many">;
            }, "strip", z.ZodTypeAny, {
                smoking: "never" | "former" | "current" | "occasional";
                alcohol: "moderate" | "never" | "occasional" | "heavy";
                sleepHours: number;
                waterIntake: number;
                activityLevel: "moderate" | "active" | "sedentary" | "light" | "very-active";
                stressLevel: "moderate" | "low" | "high" | "very-high";
                foodPreferences: string[];
            }, {
                smoking: "never" | "former" | "current" | "occasional";
                alcohol: "moderate" | "never" | "occasional" | "heavy";
                sleepHours: number;
                waterIntake: number;
                activityLevel: "moderate" | "active" | "sedentary" | "light" | "very-active";
                stressLevel: "moderate" | "low" | "high" | "very-high";
                foodPreferences: string[];
            }>>;
        }, "strip", z.ZodTypeAny, {
            allergies: {
                type: "other" | "food" | "medication" | "environmental";
                allergen: string;
                severity: "mild" | "moderate" | "severe" | "life-threatening";
                notes?: string | undefined;
                diagnosedDate?: string | undefined;
            }[];
            chronicConditions: {
                name: string;
                status: "active" | "managed" | "resolved";
                diagnosedDate: string;
                notes?: string | undefined;
                medications?: string[] | undefined;
            }[];
            currentMedications: {
                name: string;
                dosage: string;
                frequency: string;
                startDate: string;
                endDate?: string | undefined;
                purpose?: string | undefined;
                prescribedBy?: string | undefined;
            }[];
            vaccinationHistory: {
                name: string;
                date: string;
                nextDueDate?: string | undefined;
                provider?: string | undefined;
                lotNumber?: string | undefined;
            }[];
            familyHistory: {
                condition: string;
                relation: "father" | "mother" | "sibling" | "grandparent" | "maternal-grandparent" | "paternal-grandparent";
                notes?: string | undefined;
            }[];
            pregnancyStatus?: "none" | "pregnant" | "trying" | "lactating" | undefined;
            menstrualProfile?: {
                symptoms: string[];
                cycleLength: number;
                periodLength: number;
                pmsSymptoms: string[];
                irregularCycles: boolean;
                lastPeriodStart?: string | undefined;
                flowIntensity?: "heavy" | "light" | "medium" | undefined;
            } | undefined;
            lifestyle?: {
                smoking: "never" | "former" | "current" | "occasional";
                alcohol: "moderate" | "never" | "occasional" | "heavy";
                sleepHours: number;
                waterIntake: number;
                activityLevel: "moderate" | "active" | "sedentary" | "light" | "very-active";
                stressLevel: "moderate" | "low" | "high" | "very-high";
                foodPreferences: string[];
            } | undefined;
        }, {
            allergies?: {
                type: "other" | "food" | "medication" | "environmental";
                allergen: string;
                severity: "mild" | "moderate" | "severe" | "life-threatening";
                notes?: string | undefined;
                diagnosedDate?: string | undefined;
            }[] | undefined;
            chronicConditions?: {
                name: string;
                status: "active" | "managed" | "resolved";
                diagnosedDate: string;
                notes?: string | undefined;
                medications?: string[] | undefined;
            }[] | undefined;
            currentMedications?: {
                name: string;
                dosage: string;
                frequency: string;
                startDate: string;
                endDate?: string | undefined;
                purpose?: string | undefined;
                prescribedBy?: string | undefined;
            }[] | undefined;
            vaccinationHistory?: {
                name: string;
                date: string;
                nextDueDate?: string | undefined;
                provider?: string | undefined;
                lotNumber?: string | undefined;
            }[] | undefined;
            familyHistory?: {
                condition: string;
                relation: "father" | "mother" | "sibling" | "grandparent" | "maternal-grandparent" | "paternal-grandparent";
                notes?: string | undefined;
            }[] | undefined;
            pregnancyStatus?: "none" | "pregnant" | "trying" | "lactating" | undefined;
            menstrualProfile?: {
                cycleLength: number;
                periodLength: number;
                symptoms?: string[] | undefined;
                lastPeriodStart?: string | undefined;
                flowIntensity?: "heavy" | "light" | "medium" | undefined;
                pmsSymptoms?: string[] | undefined;
                irregularCycles?: boolean | undefined;
            } | undefined;
            lifestyle?: {
                smoking: "never" | "former" | "current" | "occasional";
                alcohol: "moderate" | "never" | "occasional" | "heavy";
                sleepHours: number;
                waterIntake: number;
                activityLevel: "moderate" | "active" | "sedentary" | "light" | "very-active";
                stressLevel: "moderate" | "low" | "high" | "very-high";
                foodPreferences: string[];
            } | undefined;
        }>>;
        emergencyContacts: z.ZodDefault<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            relationship: z.ZodString;
            phone: z.ZodString;
            isPrimary: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            relationship: string;
            phone: string;
            isPrimary: boolean;
        }, {
            name: string;
            relationship: string;
            phone: string;
            isPrimary?: boolean | undefined;
        }>, "many">>;
        wearableData: z.ZodOptional<z.ZodObject<{
            lastSync: z.ZodOptional<z.ZodString>;
            dataTypes: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            avgSteps: z.ZodOptional<z.ZodNumber>;
            avgHeartRate: z.ZodOptional<z.ZodNumber>;
            avgSleepHours: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            dataTypes: string[];
            lastSync?: string | undefined;
            avgSteps?: number | undefined;
            avgHeartRate?: number | undefined;
            avgSleepHours?: number | undefined;
        }, {
            lastSync?: string | undefined;
            dataTypes?: string[] | undefined;
            avgSteps?: number | undefined;
            avgHeartRate?: number | undefined;
            avgSleepHours?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        profileId: string;
        relationship: "other" | "self" | "father" | "mother" | "spouse" | "child" | "sibling";
        isPrimary: boolean;
        gender: "male" | "female" | "other" | "prefer-not-to-say";
        isMinor: boolean;
        health: {
            allergies: {
                type: "other" | "food" | "medication" | "environmental";
                allergen: string;
                severity: "mild" | "moderate" | "severe" | "life-threatening";
                notes?: string | undefined;
                diagnosedDate?: string | undefined;
            }[];
            chronicConditions: {
                name: string;
                status: "active" | "managed" | "resolved";
                diagnosedDate: string;
                notes?: string | undefined;
                medications?: string[] | undefined;
            }[];
            currentMedications: {
                name: string;
                dosage: string;
                frequency: string;
                startDate: string;
                endDate?: string | undefined;
                purpose?: string | undefined;
                prescribedBy?: string | undefined;
            }[];
            vaccinationHistory: {
                name: string;
                date: string;
                nextDueDate?: string | undefined;
                provider?: string | undefined;
                lotNumber?: string | undefined;
            }[];
            familyHistory: {
                condition: string;
                relation: "father" | "mother" | "sibling" | "grandparent" | "maternal-grandparent" | "paternal-grandparent";
                notes?: string | undefined;
            }[];
            pregnancyStatus?: "none" | "pregnant" | "trying" | "lactating" | undefined;
            menstrualProfile?: {
                symptoms: string[];
                cycleLength: number;
                periodLength: number;
                pmsSymptoms: string[];
                irregularCycles: boolean;
                lastPeriodStart?: string | undefined;
                flowIntensity?: "heavy" | "light" | "medium" | undefined;
            } | undefined;
            lifestyle?: {
                smoking: "never" | "former" | "current" | "occasional";
                alcohol: "moderate" | "never" | "occasional" | "heavy";
                sleepHours: number;
                waterIntake: number;
                activityLevel: "moderate" | "active" | "sedentary" | "light" | "very-active";
                stressLevel: "moderate" | "low" | "high" | "very-high";
                foodPreferences: string[];
            } | undefined;
        };
        emergencyContacts: {
            name: string;
            relationship: string;
            phone: string;
            isPrimary: boolean;
        }[];
        age?: number | undefined;
        dateOfBirth?: string | undefined;
        bloodGroup?: "unknown" | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | undefined;
        wearableData?: {
            dataTypes: string[];
            lastSync?: string | undefined;
            avgSteps?: number | undefined;
            avgHeartRate?: number | undefined;
            avgSleepHours?: number | undefined;
        } | undefined;
    }, {
        name: string;
        profileId: string;
        relationship: "other" | "self" | "father" | "mother" | "spouse" | "child" | "sibling";
        gender: "male" | "female" | "other" | "prefer-not-to-say";
        isPrimary?: boolean | undefined;
        age?: number | undefined;
        dateOfBirth?: string | undefined;
        bloodGroup?: "unknown" | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | undefined;
        isMinor?: boolean | undefined;
        health?: {
            allergies?: {
                type: "other" | "food" | "medication" | "environmental";
                allergen: string;
                severity: "mild" | "moderate" | "severe" | "life-threatening";
                notes?: string | undefined;
                diagnosedDate?: string | undefined;
            }[] | undefined;
            chronicConditions?: {
                name: string;
                status: "active" | "managed" | "resolved";
                diagnosedDate: string;
                notes?: string | undefined;
                medications?: string[] | undefined;
            }[] | undefined;
            currentMedications?: {
                name: string;
                dosage: string;
                frequency: string;
                startDate: string;
                endDate?: string | undefined;
                purpose?: string | undefined;
                prescribedBy?: string | undefined;
            }[] | undefined;
            vaccinationHistory?: {
                name: string;
                date: string;
                nextDueDate?: string | undefined;
                provider?: string | undefined;
                lotNumber?: string | undefined;
            }[] | undefined;
            familyHistory?: {
                condition: string;
                relation: "father" | "mother" | "sibling" | "grandparent" | "maternal-grandparent" | "paternal-grandparent";
                notes?: string | undefined;
            }[] | undefined;
            pregnancyStatus?: "none" | "pregnant" | "trying" | "lactating" | undefined;
            menstrualProfile?: {
                cycleLength: number;
                periodLength: number;
                symptoms?: string[] | undefined;
                lastPeriodStart?: string | undefined;
                flowIntensity?: "heavy" | "light" | "medium" | undefined;
                pmsSymptoms?: string[] | undefined;
                irregularCycles?: boolean | undefined;
            } | undefined;
            lifestyle?: {
                smoking: "never" | "former" | "current" | "occasional";
                alcohol: "moderate" | "never" | "occasional" | "heavy";
                sleepHours: number;
                waterIntake: number;
                activityLevel: "moderate" | "active" | "sedentary" | "light" | "very-active";
                stressLevel: "moderate" | "low" | "high" | "very-high";
                foodPreferences: string[];
            } | undefined;
        } | undefined;
        emergencyContacts?: {
            name: string;
            relationship: string;
            phone: string;
            isPrimary?: boolean | undefined;
        }[] | undefined;
        wearableData?: {
            lastSync?: string | undefined;
            dataTypes?: string[] | undefined;
            avgSteps?: number | undefined;
            avgHeartRate?: number | undefined;
            avgSleepHours?: number | undefined;
        } | undefined;
    }>, "many">;
    preferences: z.ZodDefault<z.ZodObject<{
        notifications: z.ZodDefault<z.ZodObject<{
            appointments: z.ZodDefault<z.ZodBoolean>;
            medications: z.ZodDefault<z.ZodBoolean>;
            reminders: z.ZodDefault<z.ZodBoolean>;
            reports: z.ZodDefault<z.ZodBoolean>;
            healthAlerts: z.ZodDefault<z.ZodBoolean>;
            wellnessTips: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            medications: boolean;
            appointments: boolean;
            reminders: boolean;
            reports: boolean;
            healthAlerts: boolean;
            wellnessTips: boolean;
        }, {
            medications?: boolean | undefined;
            appointments?: boolean | undefined;
            reminders?: boolean | undefined;
            reports?: boolean | undefined;
            healthAlerts?: boolean | undefined;
            wellnessTips?: boolean | undefined;
        }>>;
        privacyLevel: z.ZodDefault<z.ZodEnum<["strict", "balanced", "open"]>>;
        language: z.ZodDefault<z.ZodString>;
        timezone: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        notifications: {
            medications: boolean;
            appointments: boolean;
            reminders: boolean;
            reports: boolean;
            healthAlerts: boolean;
            wellnessTips: boolean;
        };
        privacyLevel: "strict" | "balanced" | "open";
        language: string;
        timezone: string;
    }, {
        notifications?: {
            medications?: boolean | undefined;
            appointments?: boolean | undefined;
            reminders?: boolean | undefined;
            reports?: boolean | undefined;
            healthAlerts?: boolean | undefined;
            wellnessTips?: boolean | undefined;
        } | undefined;
        privacyLevel?: "strict" | "balanced" | "open" | undefined;
        language?: string | undefined;
        timezone?: string | undefined;
    }>>;
    consent: z.ZodDefault<z.ZodObject<{
        version: z.ZodString;
        givenAt: z.ZodString;
        withdrawnAt: z.ZodOptional<z.ZodString>;
        anonymousAnalytics: z.ZodDefault<z.ZodBoolean>;
        researchParticipation: z.ZodDefault<z.ZodBoolean>;
        thirdPartySharing: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        version: string;
        givenAt: string;
        anonymousAnalytics: boolean;
        researchParticipation: boolean;
        thirdPartySharing: boolean;
        withdrawnAt?: string | undefined;
    }, {
        version: string;
        givenAt: string;
        withdrawnAt?: string | undefined;
        anonymousAnalytics?: boolean | undefined;
        researchParticipation?: boolean | undefined;
        thirdPartySharing?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    profiles: {
        name: string;
        profileId: string;
        relationship: "other" | "self" | "father" | "mother" | "spouse" | "child" | "sibling";
        isPrimary: boolean;
        gender: "male" | "female" | "other" | "prefer-not-to-say";
        isMinor: boolean;
        health: {
            allergies: {
                type: "other" | "food" | "medication" | "environmental";
                allergen: string;
                severity: "mild" | "moderate" | "severe" | "life-threatening";
                notes?: string | undefined;
                diagnosedDate?: string | undefined;
            }[];
            chronicConditions: {
                name: string;
                status: "active" | "managed" | "resolved";
                diagnosedDate: string;
                notes?: string | undefined;
                medications?: string[] | undefined;
            }[];
            currentMedications: {
                name: string;
                dosage: string;
                frequency: string;
                startDate: string;
                endDate?: string | undefined;
                purpose?: string | undefined;
                prescribedBy?: string | undefined;
            }[];
            vaccinationHistory: {
                name: string;
                date: string;
                nextDueDate?: string | undefined;
                provider?: string | undefined;
                lotNumber?: string | undefined;
            }[];
            familyHistory: {
                condition: string;
                relation: "father" | "mother" | "sibling" | "grandparent" | "maternal-grandparent" | "paternal-grandparent";
                notes?: string | undefined;
            }[];
            pregnancyStatus?: "none" | "pregnant" | "trying" | "lactating" | undefined;
            menstrualProfile?: {
                symptoms: string[];
                cycleLength: number;
                periodLength: number;
                pmsSymptoms: string[];
                irregularCycles: boolean;
                lastPeriodStart?: string | undefined;
                flowIntensity?: "heavy" | "light" | "medium" | undefined;
            } | undefined;
            lifestyle?: {
                smoking: "never" | "former" | "current" | "occasional";
                alcohol: "moderate" | "never" | "occasional" | "heavy";
                sleepHours: number;
                waterIntake: number;
                activityLevel: "moderate" | "active" | "sedentary" | "light" | "very-active";
                stressLevel: "moderate" | "low" | "high" | "very-high";
                foodPreferences: string[];
            } | undefined;
        };
        emergencyContacts: {
            name: string;
            relationship: string;
            phone: string;
            isPrimary: boolean;
        }[];
        age?: number | undefined;
        dateOfBirth?: string | undefined;
        bloodGroup?: "unknown" | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | undefined;
        wearableData?: {
            dataTypes: string[];
            lastSync?: string | undefined;
            avgSteps?: number | undefined;
            avgHeartRate?: number | undefined;
            avgSleepHours?: number | undefined;
        } | undefined;
    }[];
    preferences: {
        notifications: {
            medications: boolean;
            appointments: boolean;
            reminders: boolean;
            reports: boolean;
            healthAlerts: boolean;
            wellnessTips: boolean;
        };
        privacyLevel: "strict" | "balanced" | "open";
        language: string;
        timezone: string;
    };
    consent: {
        version: string;
        givenAt: string;
        anonymousAnalytics: boolean;
        researchParticipation: boolean;
        thirdPartySharing: boolean;
        withdrawnAt?: string | undefined;
    };
}, {
    userId: string;
    profiles: {
        name: string;
        profileId: string;
        relationship: "other" | "self" | "father" | "mother" | "spouse" | "child" | "sibling";
        gender: "male" | "female" | "other" | "prefer-not-to-say";
        isPrimary?: boolean | undefined;
        age?: number | undefined;
        dateOfBirth?: string | undefined;
        bloodGroup?: "unknown" | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | undefined;
        isMinor?: boolean | undefined;
        health?: {
            allergies?: {
                type: "other" | "food" | "medication" | "environmental";
                allergen: string;
                severity: "mild" | "moderate" | "severe" | "life-threatening";
                notes?: string | undefined;
                diagnosedDate?: string | undefined;
            }[] | undefined;
            chronicConditions?: {
                name: string;
                status: "active" | "managed" | "resolved";
                diagnosedDate: string;
                notes?: string | undefined;
                medications?: string[] | undefined;
            }[] | undefined;
            currentMedications?: {
                name: string;
                dosage: string;
                frequency: string;
                startDate: string;
                endDate?: string | undefined;
                purpose?: string | undefined;
                prescribedBy?: string | undefined;
            }[] | undefined;
            vaccinationHistory?: {
                name: string;
                date: string;
                nextDueDate?: string | undefined;
                provider?: string | undefined;
                lotNumber?: string | undefined;
            }[] | undefined;
            familyHistory?: {
                condition: string;
                relation: "father" | "mother" | "sibling" | "grandparent" | "maternal-grandparent" | "paternal-grandparent";
                notes?: string | undefined;
            }[] | undefined;
            pregnancyStatus?: "none" | "pregnant" | "trying" | "lactating" | undefined;
            menstrualProfile?: {
                cycleLength: number;
                periodLength: number;
                symptoms?: string[] | undefined;
                lastPeriodStart?: string | undefined;
                flowIntensity?: "heavy" | "light" | "medium" | undefined;
                pmsSymptoms?: string[] | undefined;
                irregularCycles?: boolean | undefined;
            } | undefined;
            lifestyle?: {
                smoking: "never" | "former" | "current" | "occasional";
                alcohol: "moderate" | "never" | "occasional" | "heavy";
                sleepHours: number;
                waterIntake: number;
                activityLevel: "moderate" | "active" | "sedentary" | "light" | "very-active";
                stressLevel: "moderate" | "low" | "high" | "very-high";
                foodPreferences: string[];
            } | undefined;
        } | undefined;
        emergencyContacts?: {
            name: string;
            relationship: string;
            phone: string;
            isPrimary?: boolean | undefined;
        }[] | undefined;
        wearableData?: {
            lastSync?: string | undefined;
            dataTypes?: string[] | undefined;
            avgSteps?: number | undefined;
            avgHeartRate?: number | undefined;
            avgSleepHours?: number | undefined;
        } | undefined;
    }[];
    preferences?: {
        notifications?: {
            medications?: boolean | undefined;
            appointments?: boolean | undefined;
            reminders?: boolean | undefined;
            reports?: boolean | undefined;
            healthAlerts?: boolean | undefined;
            wellnessTips?: boolean | undefined;
        } | undefined;
        privacyLevel?: "strict" | "balanced" | "open" | undefined;
        language?: string | undefined;
        timezone?: string | undefined;
    } | undefined;
    consent?: {
        version: string;
        givenAt: string;
        withdrawnAt?: string | undefined;
        anonymousAnalytics?: boolean | undefined;
        researchParticipation?: boolean | undefined;
        thirdPartySharing?: boolean | undefined;
    } | undefined;
}>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export declare const HealthDocumentTypeSchema: z.ZodEnum<["blood_report", "urine_report", "stool_report", "xray", "ct_scan", "mri", "ultrasound", "ecg", "echo", "prescription", "discharge_summary", "medical_certificate", "vaccination_certificate", "insurance_document", "lab_report", "pathology_report", "imaging_report", "doctor_notes", "other"]>;
export type HealthDocumentType = z.infer<typeof HealthDocumentTypeSchema>;
export declare const HealthCategorySchema: z.ZodEnum<["diabetes", "cardiac", "liver", "thyroid", "hormonal", "kidney", "blood", "womens_health", "preventive", "fitness", "nutrition", "respiratory", "digestive", "musculoskeletal", "neurological", "dermatological", "ophthalmic", "dental", "mental_health", "general"]>;
export type HealthCategory = z.infer<typeof HealthCategorySchema>;
export declare const BiomarkerStatusSchema: z.ZodEnum<["normal", "low", "high", "critical", "borderline"]>;
export type BiomarkerStatus = z.infer<typeof BiomarkerStatusSchema>;
export declare const BiomarkerTrendSchema: z.ZodEnum<["improving", "stable", "worsening", "fluctuating"]>;
export type BiomarkerTrend = z.infer<typeof BiomarkerTrendSchema>;
export declare const BiomarkerSchema: z.ZodObject<{
    name: z.ZodString;
    value: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    unit: z.ZodOptional<z.ZodString>;
    referenceRange: z.ZodDefault<z.ZodObject<{
        min: z.ZodOptional<z.ZodNumber>;
        max: z.ZodOptional<z.ZodNumber>;
        text: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        max?: number | undefined;
        min?: number | undefined;
        text?: string | undefined;
    }, {
        max?: number | undefined;
        min?: number | undefined;
        text?: string | undefined;
    }>>;
    status: z.ZodEnum<["normal", "low", "high", "critical", "borderline"]>;
    trend: z.ZodOptional<z.ZodEnum<["improving", "stable", "worsening", "fluctuating"]>>;
    historicalValues: z.ZodOptional<z.ZodArray<z.ZodObject<{
        value: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
        date: z.ZodString;
        sourceRecordId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        date: string;
        value: string | number;
        sourceRecordId: string;
    }, {
        date: string;
        value: string | number;
        sourceRecordId: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    status: "low" | "high" | "normal" | "critical" | "borderline";
    value: string | number;
    referenceRange: {
        max?: number | undefined;
        min?: number | undefined;
        text?: string | undefined;
    };
    unit?: string | undefined;
    trend?: "improving" | "stable" | "worsening" | "fluctuating" | undefined;
    historicalValues?: {
        date: string;
        value: string | number;
        sourceRecordId: string;
    }[] | undefined;
}, {
    name: string;
    status: "low" | "high" | "normal" | "critical" | "borderline";
    value: string | number;
    unit?: string | undefined;
    referenceRange?: {
        max?: number | undefined;
        min?: number | undefined;
        text?: string | undefined;
    } | undefined;
    trend?: "improving" | "stable" | "worsening" | "fluctuating" | undefined;
    historicalValues?: {
        date: string;
        value: string | number;
        sourceRecordId: string;
    }[] | undefined;
}>;
export type Biomarker = z.infer<typeof BiomarkerSchema>;
export declare const HealthRecordSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    profileId: z.ZodString;
    type: z.ZodEnum<["blood_report", "urine_report", "stool_report", "xray", "ct_scan", "mri", "ultrasound", "ecg", "echo", "prescription", "discharge_summary", "medical_certificate", "vaccination_certificate", "insurance_document", "lab_report", "pathology_report", "imaging_report", "doctor_notes", "other"]>;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    file: z.ZodObject<{
        url: z.ZodString;
        filename: z.ZodString;
        mimeType: z.ZodString;
        size: z.ZodNumber;
        storageKey: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        size: number;
        url: string;
        filename: string;
        mimeType: string;
        storageKey: string;
    }, {
        size: number;
        url: string;
        filename: string;
        mimeType: string;
        storageKey: string;
    }>;
    processing: z.ZodDefault<z.ZodObject<{
        status: z.ZodEnum<["pending", "processing", "completed", "failed"]>;
        ocrJobId: z.ZodOptional<z.ZodString>;
        ocrStatus: z.ZodOptional<z.ZodEnum<["pending", "processing", "completed", "failed"]>>;
        extractionStatus: z.ZodOptional<z.ZodEnum<["pending", "processing", "completed", "failed"]>>;
        error: z.ZodOptional<z.ZodString>;
        startedAt: z.ZodOptional<z.ZodString>;
        completedAt: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: "pending" | "completed" | "failed" | "processing";
        error?: string | undefined;
        ocrJobId?: string | undefined;
        ocrStatus?: "pending" | "completed" | "failed" | "processing" | undefined;
        extractionStatus?: "pending" | "completed" | "failed" | "processing" | undefined;
        startedAt?: string | undefined;
        completedAt?: string | undefined;
    }, {
        status: "pending" | "completed" | "failed" | "processing";
        error?: string | undefined;
        ocrJobId?: string | undefined;
        ocrStatus?: "pending" | "completed" | "failed" | "processing" | undefined;
        extractionStatus?: "pending" | "completed" | "failed" | "processing" | undefined;
        startedAt?: string | undefined;
        completedAt?: string | undefined;
    }>>;
    extracted: z.ZodOptional<z.ZodObject<{
        date: z.ZodOptional<z.ZodString>;
        doctorName: z.ZodOptional<z.ZodString>;
        hospitalName: z.ZodOptional<z.ZodString>;
        labName: z.ZodOptional<z.ZodString>;
        doctorRegistration: z.ZodOptional<z.ZodString>;
        biomarkers: z.ZodDefault<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            value: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
            unit: z.ZodOptional<z.ZodString>;
            referenceRange: z.ZodDefault<z.ZodObject<{
                min: z.ZodOptional<z.ZodNumber>;
                max: z.ZodOptional<z.ZodNumber>;
                text: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                max?: number | undefined;
                min?: number | undefined;
                text?: string | undefined;
            }, {
                max?: number | undefined;
                min?: number | undefined;
                text?: string | undefined;
            }>>;
            status: z.ZodEnum<["normal", "low", "high", "critical", "borderline"]>;
            trend: z.ZodOptional<z.ZodEnum<["improving", "stable", "worsening", "fluctuating"]>>;
            historicalValues: z.ZodOptional<z.ZodArray<z.ZodObject<{
                value: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
                date: z.ZodString;
                sourceRecordId: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                date: string;
                value: string | number;
                sourceRecordId: string;
            }, {
                date: string;
                value: string | number;
                sourceRecordId: string;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            status: "low" | "high" | "normal" | "critical" | "borderline";
            value: string | number;
            referenceRange: {
                max?: number | undefined;
                min?: number | undefined;
                text?: string | undefined;
            };
            unit?: string | undefined;
            trend?: "improving" | "stable" | "worsening" | "fluctuating" | undefined;
            historicalValues?: {
                date: string;
                value: string | number;
                sourceRecordId: string;
            }[] | undefined;
        }, {
            name: string;
            status: "low" | "high" | "normal" | "critical" | "borderline";
            value: string | number;
            unit?: string | undefined;
            referenceRange?: {
                max?: number | undefined;
                min?: number | undefined;
                text?: string | undefined;
            } | undefined;
            trend?: "improving" | "stable" | "worsening" | "fluctuating" | undefined;
            historicalValues?: {
                date: string;
                value: string | number;
                sourceRecordId: string;
            }[] | undefined;
        }>, "many">>;
        diagnosis: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        icdCodes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        medications: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            dosage: z.ZodOptional<z.ZodString>;
            frequency: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            dosage?: string | undefined;
            frequency?: string | undefined;
        }, {
            name: string;
            dosage?: string | undefined;
            frequency?: string | undefined;
        }>, "many">>;
        rawText: z.ZodOptional<z.ZodString>;
        ocrConfidence: z.ZodDefault<z.ZodNumber>;
        aiConfidence: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        biomarkers: {
            name: string;
            status: "low" | "high" | "normal" | "critical" | "borderline";
            value: string | number;
            referenceRange: {
                max?: number | undefined;
                min?: number | undefined;
                text?: string | undefined;
            };
            unit?: string | undefined;
            trend?: "improving" | "stable" | "worsening" | "fluctuating" | undefined;
            historicalValues?: {
                date: string;
                value: string | number;
                sourceRecordId: string;
            }[] | undefined;
        }[];
        ocrConfidence: number;
        aiConfidence: number;
        date?: string | undefined;
        medications?: {
            name: string;
            dosage?: string | undefined;
            frequency?: string | undefined;
        }[] | undefined;
        doctorName?: string | undefined;
        hospitalName?: string | undefined;
        labName?: string | undefined;
        doctorRegistration?: string | undefined;
        diagnosis?: string[] | undefined;
        icdCodes?: string[] | undefined;
        rawText?: string | undefined;
    }, {
        date?: string | undefined;
        medications?: {
            name: string;
            dosage?: string | undefined;
            frequency?: string | undefined;
        }[] | undefined;
        doctorName?: string | undefined;
        hospitalName?: string | undefined;
        labName?: string | undefined;
        doctorRegistration?: string | undefined;
        biomarkers?: {
            name: string;
            status: "low" | "high" | "normal" | "critical" | "borderline";
            value: string | number;
            unit?: string | undefined;
            referenceRange?: {
                max?: number | undefined;
                min?: number | undefined;
                text?: string | undefined;
            } | undefined;
            trend?: "improving" | "stable" | "worsening" | "fluctuating" | undefined;
            historicalValues?: {
                date: string;
                value: string | number;
                sourceRecordId: string;
            }[] | undefined;
        }[] | undefined;
        diagnosis?: string[] | undefined;
        icdCodes?: string[] | undefined;
        rawText?: string | undefined;
        ocrConfidence?: number | undefined;
        aiConfidence?: number | undefined;
    }>>;
    category: z.ZodOptional<z.ZodEnum<["diabetes", "cardiac", "liver", "thyroid", "hormonal", "kidney", "blood", "womens_health", "preventive", "fitness", "nutrition", "respiratory", "digestive", "musculoskeletal", "neurological", "dermatological", "ophthalmic", "dental", "mental_health", "general"]>>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    isAbnormal: z.ZodDefault<z.ZodBoolean>;
    hasFollowUpRequired: z.ZodDefault<z.ZodBoolean>;
    abnormalBiomarkers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    sharing: z.ZodDefault<z.ZodObject<{
        isShared: z.ZodDefault<z.ZodBoolean>;
        sharedWith: z.ZodDefault<z.ZodArray<z.ZodObject<{
            entityType: z.ZodEnum<["doctor", "lab", "hospital"]>;
            entityId: z.ZodString;
            sharedAt: z.ZodString;
            expiresAt: z.ZodOptional<z.ZodString>;
            consentId: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            entityType: "doctor" | "lab" | "hospital";
            entityId: string;
            sharedAt: string;
            expiresAt?: string | undefined;
            consentId?: string | undefined;
        }, {
            entityType: "doctor" | "lab" | "hospital";
            entityId: string;
            sharedAt: string;
            expiresAt?: string | undefined;
            consentId?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        isShared: boolean;
        sharedWith: {
            entityType: "doctor" | "lab" | "hospital";
            entityId: string;
            sharedAt: string;
            expiresAt?: string | undefined;
            consentId?: string | undefined;
        }[];
    }, {
        isShared?: boolean | undefined;
        sharedWith?: {
            entityType: "doctor" | "lab" | "hospital";
            entityId: string;
            sharedAt: string;
            expiresAt?: string | undefined;
            consentId?: string | undefined;
        }[] | undefined;
    }>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    createdBy: z.ZodString;
    lastAccessedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
    profileId: string;
    type: "other" | "blood_report" | "urine_report" | "stool_report" | "xray" | "ct_scan" | "mri" | "ultrasound" | "ecg" | "echo" | "prescription" | "discharge_summary" | "medical_certificate" | "vaccination_certificate" | "insurance_document" | "lab_report" | "pathology_report" | "imaging_report" | "doctor_notes";
    id: string;
    title: string;
    file: {
        size: number;
        url: string;
        filename: string;
        mimeType: string;
        storageKey: string;
    };
    processing: {
        status: "pending" | "completed" | "failed" | "processing";
        error?: string | undefined;
        ocrJobId?: string | undefined;
        ocrStatus?: "pending" | "completed" | "failed" | "processing" | undefined;
        extractionStatus?: "pending" | "completed" | "failed" | "processing" | undefined;
        startedAt?: string | undefined;
        completedAt?: string | undefined;
    };
    tags: string[];
    isAbnormal: boolean;
    hasFollowUpRequired: boolean;
    sharing: {
        isShared: boolean;
        sharedWith: {
            entityType: "doctor" | "lab" | "hospital";
            entityId: string;
            sharedAt: string;
            expiresAt?: string | undefined;
            consentId?: string | undefined;
        }[];
    };
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    lastAccessedAt: string;
    description?: string | undefined;
    extracted?: {
        biomarkers: {
            name: string;
            status: "low" | "high" | "normal" | "critical" | "borderline";
            value: string | number;
            referenceRange: {
                max?: number | undefined;
                min?: number | undefined;
                text?: string | undefined;
            };
            unit?: string | undefined;
            trend?: "improving" | "stable" | "worsening" | "fluctuating" | undefined;
            historicalValues?: {
                date: string;
                value: string | number;
                sourceRecordId: string;
            }[] | undefined;
        }[];
        ocrConfidence: number;
        aiConfidence: number;
        date?: string | undefined;
        medications?: {
            name: string;
            dosage?: string | undefined;
            frequency?: string | undefined;
        }[] | undefined;
        doctorName?: string | undefined;
        hospitalName?: string | undefined;
        labName?: string | undefined;
        doctorRegistration?: string | undefined;
        diagnosis?: string[] | undefined;
        icdCodes?: string[] | undefined;
        rawText?: string | undefined;
    } | undefined;
    category?: "diabetes" | "cardiac" | "liver" | "thyroid" | "hormonal" | "kidney" | "blood" | "womens_health" | "preventive" | "fitness" | "nutrition" | "respiratory" | "digestive" | "musculoskeletal" | "neurological" | "dermatological" | "ophthalmic" | "dental" | "mental_health" | "general" | undefined;
    abnormalBiomarkers?: string[] | undefined;
}, {
    userId: string;
    profileId: string;
    type: "other" | "blood_report" | "urine_report" | "stool_report" | "xray" | "ct_scan" | "mri" | "ultrasound" | "ecg" | "echo" | "prescription" | "discharge_summary" | "medical_certificate" | "vaccination_certificate" | "insurance_document" | "lab_report" | "pathology_report" | "imaging_report" | "doctor_notes";
    id: string;
    title: string;
    file: {
        size: number;
        url: string;
        filename: string;
        mimeType: string;
        storageKey: string;
    };
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    lastAccessedAt: string;
    description?: string | undefined;
    processing?: {
        status: "pending" | "completed" | "failed" | "processing";
        error?: string | undefined;
        ocrJobId?: string | undefined;
        ocrStatus?: "pending" | "completed" | "failed" | "processing" | undefined;
        extractionStatus?: "pending" | "completed" | "failed" | "processing" | undefined;
        startedAt?: string | undefined;
        completedAt?: string | undefined;
    } | undefined;
    extracted?: {
        date?: string | undefined;
        medications?: {
            name: string;
            dosage?: string | undefined;
            frequency?: string | undefined;
        }[] | undefined;
        doctorName?: string | undefined;
        hospitalName?: string | undefined;
        labName?: string | undefined;
        doctorRegistration?: string | undefined;
        biomarkers?: {
            name: string;
            status: "low" | "high" | "normal" | "critical" | "borderline";
            value: string | number;
            unit?: string | undefined;
            referenceRange?: {
                max?: number | undefined;
                min?: number | undefined;
                text?: string | undefined;
            } | undefined;
            trend?: "improving" | "stable" | "worsening" | "fluctuating" | undefined;
            historicalValues?: {
                date: string;
                value: string | number;
                sourceRecordId: string;
            }[] | undefined;
        }[] | undefined;
        diagnosis?: string[] | undefined;
        icdCodes?: string[] | undefined;
        rawText?: string | undefined;
        ocrConfidence?: number | undefined;
        aiConfidence?: number | undefined;
    } | undefined;
    category?: "diabetes" | "cardiac" | "liver" | "thyroid" | "hormonal" | "kidney" | "blood" | "womens_health" | "preventive" | "fitness" | "nutrition" | "respiratory" | "digestive" | "musculoskeletal" | "neurological" | "dermatological" | "ophthalmic" | "dental" | "mental_health" | "general" | undefined;
    tags?: string[] | undefined;
    isAbnormal?: boolean | undefined;
    hasFollowUpRequired?: boolean | undefined;
    abnormalBiomarkers?: string[] | undefined;
    sharing?: {
        isShared?: boolean | undefined;
        sharedWith?: {
            entityType: "doctor" | "lab" | "hospital";
            entityId: string;
            sharedAt: string;
            expiresAt?: string | undefined;
            consentId?: string | undefined;
        }[] | undefined;
    } | undefined;
}>;
export type HealthRecord = z.infer<typeof HealthRecordSchema>;
export declare const TimelineEventTypeSchema: z.ZodEnum<["record_uploaded", "appointment", "prescription", "vaccination", "surgery", "condition_diagnosed", "medication_started", "medication_stopped", "test_result", "symptom_reported", "wellness_activity", "checkup_reminder", "medication_reminder", "health_alert"]>;
export type TimelineEventType = z.infer<typeof TimelineEventTypeSchema>;
export declare const HealthTimelineEventSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    profileId: z.ZodString;
    date: z.ZodString;
    type: z.ZodEnum<["record_uploaded", "appointment", "prescription", "vaccination", "surgery", "condition_diagnosed", "medication_started", "medication_stopped", "test_result", "symptom_reported", "wellness_activity", "checkup_reminder", "medication_reminder", "health_alert"]>;
    category: z.ZodOptional<z.ZodEnum<["diabetes", "cardiac", "liver", "thyroid", "hormonal", "kidney", "blood", "womens_health", "preventive", "fitness", "nutrition", "respiratory", "digestive", "musculoskeletal", "neurological", "dermatological", "ophthalmic", "dental", "mental_health", "general"]>>;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    relatedRecordIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    relatedAppointmentId: z.ZodOptional<z.ZodString>;
    relatedDoctorId: z.ZodOptional<z.ZodString>;
    relatedLabId: z.ZodOptional<z.ZodString>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    insights: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["positive", "neutral", "concerning"]>;
        message: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "positive" | "neutral" | "concerning";
        message: string;
    }, {
        type: "positive" | "neutral" | "concerning";
        message: string;
    }>, "many">>;
    isRead: z.ZodDefault<z.ZodBoolean>;
    readAt: z.ZodOptional<z.ZodString>;
    isDismissed: z.ZodDefault<z.ZodBoolean>;
    dismissedAt: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
    profileId: string;
    type: "prescription" | "record_uploaded" | "appointment" | "vaccination" | "surgery" | "condition_diagnosed" | "medication_started" | "medication_stopped" | "test_result" | "symptom_reported" | "wellness_activity" | "checkup_reminder" | "medication_reminder" | "health_alert";
    date: string;
    id: string;
    title: string;
    createdAt: string;
    relatedRecordIds: string[];
    metadata: Record<string, unknown>;
    isRead: boolean;
    isDismissed: boolean;
    description?: string | undefined;
    category?: "diabetes" | "cardiac" | "liver" | "thyroid" | "hormonal" | "kidney" | "blood" | "womens_health" | "preventive" | "fitness" | "nutrition" | "respiratory" | "digestive" | "musculoskeletal" | "neurological" | "dermatological" | "ophthalmic" | "dental" | "mental_health" | "general" | undefined;
    relatedAppointmentId?: string | undefined;
    relatedDoctorId?: string | undefined;
    relatedLabId?: string | undefined;
    insights?: {
        type: "positive" | "neutral" | "concerning";
        message: string;
    }[] | undefined;
    readAt?: string | undefined;
    dismissedAt?: string | undefined;
}, {
    userId: string;
    profileId: string;
    type: "prescription" | "record_uploaded" | "appointment" | "vaccination" | "surgery" | "condition_diagnosed" | "medication_started" | "medication_stopped" | "test_result" | "symptom_reported" | "wellness_activity" | "checkup_reminder" | "medication_reminder" | "health_alert";
    date: string;
    id: string;
    title: string;
    createdAt: string;
    description?: string | undefined;
    category?: "diabetes" | "cardiac" | "liver" | "thyroid" | "hormonal" | "kidney" | "blood" | "womens_health" | "preventive" | "fitness" | "nutrition" | "respiratory" | "digestive" | "musculoskeletal" | "neurological" | "dermatological" | "ophthalmic" | "dental" | "mental_health" | "general" | undefined;
    relatedRecordIds?: string[] | undefined;
    relatedAppointmentId?: string | undefined;
    relatedDoctorId?: string | undefined;
    relatedLabId?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    insights?: {
        type: "positive" | "neutral" | "concerning";
        message: string;
    }[] | undefined;
    isRead?: boolean | undefined;
    readAt?: string | undefined;
    isDismissed?: boolean | undefined;
    dismissedAt?: string | undefined;
}>;
export type HealthTimelineEvent = z.infer<typeof HealthTimelineEventSchema>;
export declare const ProviderTypeSchema: z.ZodEnum<["doctor", "lab", "pharmacy", "wellness"]>;
export type ProviderType = z.infer<typeof ProviderTypeSchema>;
export declare const AppointmentTypeSchema: z.ZodEnum<["consultation", "follow_up", "diagnostic_test", "health_package", "teleconsult", "home_visit"]>;
export type AppointmentType = z.infer<typeof AppointmentTypeSchema>;
export declare const AppointmentStatusSchema: z.ZodEnum<["pending", "confirmed", "in_progress", "completed", "cancelled", "no_show"]>;
export type AppointmentStatus = z.infer<typeof AppointmentStatusSchema>;
export declare const AppointmentModeSchema: z.ZodEnum<["in_clinic", "teleconsult", "home_visit", "online"]>;
export type AppointmentMode = z.infer<typeof AppointmentModeSchema>;
export declare const AddressSchema: z.ZodObject<{
    line1: z.ZodString;
    line2: z.ZodString;
    city: z.ZodString;
    state: z.ZodString;
    pincode: z.ZodString;
    landmark: z.ZodString;
    coordinates: z.ZodObject<{
        lat: z.ZodNumber;
        lng: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        lat: number;
        lng: number;
    }, {
        lat: number;
        lng: number;
    }>;
}, "strip", z.ZodTypeAny, {
    line1: string;
    line2: string;
    city: string;
    state: string;
    pincode: string;
    landmark: string;
    coordinates: {
        lat: number;
        lng: number;
    };
}, {
    line1: string;
    line2: string;
    city: string;
    state: string;
    pincode: string;
    landmark: string;
    coordinates: {
        lat: number;
        lng: number;
    };
}>;
export type Address = z.infer<typeof AddressSchema>;
export declare const AppointmentSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    profileId: z.ZodString;
    providerType: z.ZodEnum<["doctor", "lab", "pharmacy", "wellness"]>;
    providerId: z.ZodString;
    providerDetails: z.ZodObject<{
        name: z.ZodString;
        specialization: z.ZodOptional<z.ZodString>;
        photo: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodObject<{
            line1: z.ZodString;
            line2: z.ZodString;
            city: z.ZodString;
            state: z.ZodString;
            pincode: z.ZodString;
            landmark: z.ZodString;
            coordinates: z.ZodObject<{
                lat: z.ZodNumber;
                lng: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                lat: number;
                lng: number;
            }, {
                lat: number;
                lng: number;
            }>;
        }, "strip", z.ZodTypeAny, {
            line1: string;
            line2: string;
            city: string;
            state: string;
            pincode: string;
            landmark: string;
            coordinates: {
                lat: number;
                lng: number;
            };
        }, {
            line1: string;
            line2: string;
            city: string;
            state: string;
            pincode: string;
            landmark: string;
            coordinates: {
                lat: number;
                lng: number;
            };
        }>>;
        phone: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        email?: string | undefined;
        phone?: string | undefined;
        specialization?: string | undefined;
        photo?: string | undefined;
        address?: {
            line1: string;
            line2: string;
            city: string;
            state: string;
            pincode: string;
            landmark: string;
            coordinates: {
                lat: number;
                lng: number;
            };
        } | undefined;
    }, {
        name: string;
        email?: string | undefined;
        phone?: string | undefined;
        specialization?: string | undefined;
        photo?: string | undefined;
        address?: {
            line1: string;
            line2: string;
            city: string;
            state: string;
            pincode: string;
            landmark: string;
            coordinates: {
                lat: number;
                lng: number;
            };
        } | undefined;
    }>;
    type: z.ZodEnum<["consultation", "follow_up", "diagnostic_test", "health_package", "teleconsult", "home_visit"]>;
    status: z.ZodEnum<["pending", "confirmed", "in_progress", "completed", "cancelled", "no_show"]>;
    mode: z.ZodEnum<["in_clinic", "teleconsult", "home_visit", "online"]>;
    schedule: z.ZodObject<{
        date: z.ZodString;
        startTime: z.ZodString;
        endTime: z.ZodOptional<z.ZodString>;
        timezone: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        date: string;
        timezone: string;
        startTime: string;
        endTime?: string | undefined;
    }, {
        date: string;
        startTime: string;
        timezone?: string | undefined;
        endTime?: string | undefined;
    }>;
    address: z.ZodOptional<z.ZodObject<{
        line1: z.ZodString;
        line2: z.ZodString;
        city: z.ZodString;
        state: z.ZodString;
        pincode: z.ZodString;
        landmark: z.ZodString;
        coordinates: z.ZodObject<{
            lat: z.ZodNumber;
            lng: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            lat: number;
            lng: number;
        }, {
            lat: number;
            lng: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        line1: string;
        line2: string;
        city: string;
        state: string;
        pincode: string;
        landmark: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    }, {
        line1: string;
        line2: string;
        city: string;
        state: string;
        pincode: string;
        landmark: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    }>>;
    meetingLink: z.ZodOptional<z.ZodString>;
    meetingId: z.ZodOptional<z.ZodString>;
    patientInfo: z.ZodOptional<z.ZodObject<{
        symptoms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        notes: z.ZodOptional<z.ZodString>;
        relatedRecordIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        symptoms?: string[] | undefined;
        notes?: string | undefined;
        relatedRecordIds?: string[] | undefined;
    }, {
        symptoms?: string[] | undefined;
        notes?: string | undefined;
        relatedRecordIds?: string[] | undefined;
    }>>;
    payment: z.ZodDefault<z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodDefault<z.ZodString>;
        status: z.ZodDefault<z.ZodEnum<["pending", "paid", "refunded", "failed"]>>;
        method: z.ZodOptional<z.ZodString>;
        transactionId: z.ZodOptional<z.ZodString>;
        refundId: z.ZodOptional<z.ZodString>;
        refundAmount: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        currency: string;
        status: "pending" | "failed" | "paid" | "refunded";
        amount: number;
        method?: string | undefined;
        transactionId?: string | undefined;
        refundId?: string | undefined;
        refundAmount?: number | undefined;
    }, {
        amount: number;
        currency?: string | undefined;
        method?: string | undefined;
        transactionId?: string | undefined;
        status?: "pending" | "failed" | "paid" | "refunded" | undefined;
        refundId?: string | undefined;
        refundAmount?: number | undefined;
    }>>;
    followUpAppointmentId: z.ZodOptional<z.ZodString>;
    previousAppointmentId: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    doctorNotes: z.ZodOptional<z.ZodString>;
    cancellationReason: z.ZodOptional<z.ZodString>;
    reminders: z.ZodDefault<z.ZodObject<{
        sent24h: z.ZodDefault<z.ZodBoolean>;
        sent1h: z.ZodDefault<z.ZodBoolean>;
        sent15m: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        sent24h: boolean;
        sent1h: boolean;
        sent15m: boolean;
    }, {
        sent24h?: boolean | undefined;
        sent1h?: boolean | undefined;
        sent15m?: boolean | undefined;
    }>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    createdBy: z.ZodString;
    cancelledAt: z.ZodOptional<z.ZodString>;
    completedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    profileId: string;
    type: "consultation" | "follow_up" | "diagnostic_test" | "health_package" | "teleconsult" | "home_visit";
    status: "pending" | "completed" | "confirmed" | "cancelled" | "in_progress" | "no_show";
    reminders: {
        sent24h: boolean;
        sent1h: boolean;
        sent15m: boolean;
    };
    id: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    providerType: "doctor" | "lab" | "pharmacy" | "wellness";
    providerId: string;
    providerDetails: {
        name: string;
        email?: string | undefined;
        phone?: string | undefined;
        specialization?: string | undefined;
        photo?: string | undefined;
        address?: {
            line1: string;
            line2: string;
            city: string;
            state: string;
            pincode: string;
            landmark: string;
            coordinates: {
                lat: number;
                lng: number;
            };
        } | undefined;
    };
    mode: "teleconsult" | "home_visit" | "in_clinic" | "online";
    schedule: {
        date: string;
        timezone: string;
        startTime: string;
        endTime?: string | undefined;
    };
    payment: {
        currency: string;
        status: "pending" | "failed" | "paid" | "refunded";
        amount: number;
        method?: string | undefined;
        transactionId?: string | undefined;
        refundId?: string | undefined;
        refundAmount?: number | undefined;
    };
    notes?: string | undefined;
    completedAt?: string | undefined;
    address?: {
        line1: string;
        line2: string;
        city: string;
        state: string;
        pincode: string;
        landmark: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    } | undefined;
    meetingLink?: string | undefined;
    meetingId?: string | undefined;
    patientInfo?: {
        symptoms?: string[] | undefined;
        notes?: string | undefined;
        relatedRecordIds?: string[] | undefined;
    } | undefined;
    followUpAppointmentId?: string | undefined;
    previousAppointmentId?: string | undefined;
    doctorNotes?: string | undefined;
    cancellationReason?: string | undefined;
    cancelledAt?: string | undefined;
}, {
    userId: string;
    profileId: string;
    type: "consultation" | "follow_up" | "diagnostic_test" | "health_package" | "teleconsult" | "home_visit";
    status: "pending" | "completed" | "confirmed" | "cancelled" | "in_progress" | "no_show";
    id: string;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    providerType: "doctor" | "lab" | "pharmacy" | "wellness";
    providerId: string;
    providerDetails: {
        name: string;
        email?: string | undefined;
        phone?: string | undefined;
        specialization?: string | undefined;
        photo?: string | undefined;
        address?: {
            line1: string;
            line2: string;
            city: string;
            state: string;
            pincode: string;
            landmark: string;
            coordinates: {
                lat: number;
                lng: number;
            };
        } | undefined;
    };
    mode: "teleconsult" | "home_visit" | "in_clinic" | "online";
    schedule: {
        date: string;
        startTime: string;
        timezone?: string | undefined;
        endTime?: string | undefined;
    };
    notes?: string | undefined;
    reminders?: {
        sent24h?: boolean | undefined;
        sent1h?: boolean | undefined;
        sent15m?: boolean | undefined;
    } | undefined;
    completedAt?: string | undefined;
    address?: {
        line1: string;
        line2: string;
        city: string;
        state: string;
        pincode: string;
        landmark: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    } | undefined;
    meetingLink?: string | undefined;
    meetingId?: string | undefined;
    patientInfo?: {
        symptoms?: string[] | undefined;
        notes?: string | undefined;
        relatedRecordIds?: string[] | undefined;
    } | undefined;
    payment?: {
        amount: number;
        currency?: string | undefined;
        method?: string | undefined;
        transactionId?: string | undefined;
        status?: "pending" | "failed" | "paid" | "refunded" | undefined;
        refundId?: string | undefined;
        refundAmount?: number | undefined;
    } | undefined;
    followUpAppointmentId?: string | undefined;
    previousAppointmentId?: string | undefined;
    doctorNotes?: string | undefined;
    cancellationReason?: string | undefined;
    cancelledAt?: string | undefined;
}>;
export type Appointment = z.infer<typeof AppointmentSchema>;
export declare const WellnessTypeSchema: z.ZodEnum<["cycle", "habit", "challenge", "score"]>;
export type WellnessType = z.infer<typeof WellnessTypeSchema>;
export declare const CycleEntryTypeSchema: z.ZodEnum<["period_start", "period_end", "spotting", "intercourse", "ovulation", "fertile_window", "symptom", "mood", "custom"]>;
export type CycleEntryType = z.infer<typeof CycleEntryTypeSchema>;
export declare const FlowIntensitySchema: z.ZodEnum<["light", "medium", "heavy"]>;
export type FlowIntensity = z.infer<typeof FlowIntensitySchema>;
export declare const MoodSchema: z.ZodEnum<["great", "good", "okay", "bad", "terrible"]>;
export type Mood = z.infer<typeof MoodSchema>;
export declare const CycleDataSchema: z.ZodObject<{
    cycleType: z.ZodEnum<["period_start", "period_end", "spotting", "intercourse", "ovulation", "fertile_window", "symptom", "mood", "custom"]>;
    flowIntensity: z.ZodOptional<z.ZodEnum<["light", "medium", "heavy"]>>;
    symptoms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    mood: z.ZodOptional<z.ZodEnum<["great", "good", "okay", "bad", "terrible"]>>;
    energy: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
    cervicalMucus: z.ZodOptional<z.ZodString>;
    temperature: z.ZodOptional<z.ZodNumber>;
    ovulationConfirmed: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    cycleType: "ovulation" | "custom" | "period_start" | "period_end" | "spotting" | "intercourse" | "fertile_window" | "symptom" | "mood";
    symptoms?: string[] | undefined;
    notes?: string | undefined;
    flowIntensity?: "heavy" | "light" | "medium" | undefined;
    mood?: "great" | "good" | "okay" | "bad" | "terrible" | undefined;
    energy?: number | undefined;
    cervicalMucus?: string | undefined;
    temperature?: number | undefined;
    ovulationConfirmed?: boolean | undefined;
}, {
    cycleType: "ovulation" | "custom" | "period_start" | "period_end" | "spotting" | "intercourse" | "fertile_window" | "symptom" | "mood";
    symptoms?: string[] | undefined;
    notes?: string | undefined;
    flowIntensity?: "heavy" | "light" | "medium" | undefined;
    mood?: "great" | "good" | "okay" | "bad" | "terrible" | undefined;
    energy?: number | undefined;
    cervicalMucus?: string | undefined;
    temperature?: number | undefined;
    ovulationConfirmed?: boolean | undefined;
}>;
export type CycleData = z.infer<typeof CycleDataSchema>;
export declare const HabitTypeSchema: z.ZodEnum<["water", "sleep", "steps", "workout", "meditation", "nutrition", "custom"]>;
export type HabitType = z.infer<typeof HabitTypeSchema>;
export declare const HabitDataSchema: z.ZodObject<{
    habitType: z.ZodEnum<["water", "sleep", "steps", "workout", "meditation", "nutrition", "custom"]>;
    value: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
    unit: z.ZodOptional<z.ZodString>;
    goal: z.ZodOptional<z.ZodNumber>;
    source: z.ZodDefault<z.ZodEnum<["manual", "wearable", "integration"]>>;
    notes: z.ZodOptional<z.ZodString>;
    completed: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    completed: boolean;
    value: string | number;
    habitType: "custom" | "nutrition" | "water" | "sleep" | "steps" | "workout" | "meditation";
    source: "manual" | "wearable" | "integration";
    unit?: string | undefined;
    notes?: string | undefined;
    goal?: number | undefined;
}, {
    value: string | number;
    habitType: "custom" | "nutrition" | "water" | "sleep" | "steps" | "workout" | "meditation";
    unit?: string | undefined;
    completed?: boolean | undefined;
    notes?: string | undefined;
    goal?: number | undefined;
    source?: "manual" | "wearable" | "integration" | undefined;
}>;
export type HabitData = z.infer<typeof HabitDataSchema>;
export declare const ChallengeDataSchema: z.ZodObject<{
    challengeId: z.ZodString;
    challengeName: z.ZodString;
    progress: z.ZodObject<{
        currentStreak: z.ZodDefault<z.ZodNumber>;
        longestStreak: z.ZodDefault<z.ZodNumber>;
        totalPoints: z.ZodDefault<z.ZodNumber>;
        completedDays: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        currentStreak: number;
        longestStreak: number;
        totalPoints: number;
        completedDays: number;
    }, {
        currentStreak?: number | undefined;
        longestStreak?: number | undefined;
        totalPoints?: number | undefined;
        completedDays?: number | undefined;
    }>;
    joinedAt: z.ZodString;
    completedAt: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<["active", "completed", "abandoned"]>>;
}, "strip", z.ZodTypeAny, {
    challengeId: string;
    status: "completed" | "active" | "abandoned";
    challengeName: string;
    progress: {
        currentStreak: number;
        longestStreak: number;
        totalPoints: number;
        completedDays: number;
    };
    joinedAt: string;
    completedAt?: string | undefined;
}, {
    challengeId: string;
    challengeName: string;
    progress: {
        currentStreak?: number | undefined;
        longestStreak?: number | undefined;
        totalPoints?: number | undefined;
        completedDays?: number | undefined;
    };
    joinedAt: string;
    status?: "completed" | "active" | "abandoned" | undefined;
    completedAt?: string | undefined;
}>;
export type ChallengeData = z.infer<typeof ChallengeDataSchema>;
export declare const ScoreDataSchema: z.ZodObject<{
    score: z.ZodNumber;
    grade: z.ZodString;
    components: z.ZodRecord<z.ZodString, z.ZodNumber>;
    trend: z.ZodEnum<["improving", "stable", "declining"]>;
    calculatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    trend: "improving" | "stable" | "declining";
    score: number;
    grade: string;
    components: Record<string, number>;
    calculatedAt: string;
}, {
    trend: "improving" | "stable" | "declining";
    score: number;
    grade: string;
    components: Record<string, number>;
    calculatedAt: string;
}>;
export type ScoreData = z.infer<typeof ScoreDataSchema>;
export declare const WellnessEntrySchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    profileId: z.ZodString;
    date: z.ZodString;
    type: z.ZodEnum<["cycle", "habit", "challenge", "score"]>;
    data: z.ZodUnion<[z.ZodObject<{
        cycleType: z.ZodEnum<["period_start", "period_end", "spotting", "intercourse", "ovulation", "fertile_window", "symptom", "mood", "custom"]>;
        flowIntensity: z.ZodOptional<z.ZodEnum<["light", "medium", "heavy"]>>;
        symptoms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        mood: z.ZodOptional<z.ZodEnum<["great", "good", "okay", "bad", "terrible"]>>;
        energy: z.ZodOptional<z.ZodNumber>;
        notes: z.ZodOptional<z.ZodString>;
        cervicalMucus: z.ZodOptional<z.ZodString>;
        temperature: z.ZodOptional<z.ZodNumber>;
        ovulationConfirmed: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        cycleType: "ovulation" | "custom" | "period_start" | "period_end" | "spotting" | "intercourse" | "fertile_window" | "symptom" | "mood";
        symptoms?: string[] | undefined;
        notes?: string | undefined;
        flowIntensity?: "heavy" | "light" | "medium" | undefined;
        mood?: "great" | "good" | "okay" | "bad" | "terrible" | undefined;
        energy?: number | undefined;
        cervicalMucus?: string | undefined;
        temperature?: number | undefined;
        ovulationConfirmed?: boolean | undefined;
    }, {
        cycleType: "ovulation" | "custom" | "period_start" | "period_end" | "spotting" | "intercourse" | "fertile_window" | "symptom" | "mood";
        symptoms?: string[] | undefined;
        notes?: string | undefined;
        flowIntensity?: "heavy" | "light" | "medium" | undefined;
        mood?: "great" | "good" | "okay" | "bad" | "terrible" | undefined;
        energy?: number | undefined;
        cervicalMucus?: string | undefined;
        temperature?: number | undefined;
        ovulationConfirmed?: boolean | undefined;
    }>, z.ZodObject<{
        habitType: z.ZodEnum<["water", "sleep", "steps", "workout", "meditation", "nutrition", "custom"]>;
        value: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
        unit: z.ZodOptional<z.ZodString>;
        goal: z.ZodOptional<z.ZodNumber>;
        source: z.ZodDefault<z.ZodEnum<["manual", "wearable", "integration"]>>;
        notes: z.ZodOptional<z.ZodString>;
        completed: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        completed: boolean;
        value: string | number;
        habitType: "custom" | "nutrition" | "water" | "sleep" | "steps" | "workout" | "meditation";
        source: "manual" | "wearable" | "integration";
        unit?: string | undefined;
        notes?: string | undefined;
        goal?: number | undefined;
    }, {
        value: string | number;
        habitType: "custom" | "nutrition" | "water" | "sleep" | "steps" | "workout" | "meditation";
        unit?: string | undefined;
        completed?: boolean | undefined;
        notes?: string | undefined;
        goal?: number | undefined;
        source?: "manual" | "wearable" | "integration" | undefined;
    }>, z.ZodObject<{
        challengeId: z.ZodString;
        challengeName: z.ZodString;
        progress: z.ZodObject<{
            currentStreak: z.ZodDefault<z.ZodNumber>;
            longestStreak: z.ZodDefault<z.ZodNumber>;
            totalPoints: z.ZodDefault<z.ZodNumber>;
            completedDays: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            currentStreak: number;
            longestStreak: number;
            totalPoints: number;
            completedDays: number;
        }, {
            currentStreak?: number | undefined;
            longestStreak?: number | undefined;
            totalPoints?: number | undefined;
            completedDays?: number | undefined;
        }>;
        joinedAt: z.ZodString;
        completedAt: z.ZodOptional<z.ZodString>;
        status: z.ZodDefault<z.ZodEnum<["active", "completed", "abandoned"]>>;
    }, "strip", z.ZodTypeAny, {
        challengeId: string;
        status: "completed" | "active" | "abandoned";
        challengeName: string;
        progress: {
            currentStreak: number;
            longestStreak: number;
            totalPoints: number;
            completedDays: number;
        };
        joinedAt: string;
        completedAt?: string | undefined;
    }, {
        challengeId: string;
        challengeName: string;
        progress: {
            currentStreak?: number | undefined;
            longestStreak?: number | undefined;
            totalPoints?: number | undefined;
            completedDays?: number | undefined;
        };
        joinedAt: string;
        status?: "completed" | "active" | "abandoned" | undefined;
        completedAt?: string | undefined;
    }>, z.ZodObject<{
        score: z.ZodNumber;
        grade: z.ZodString;
        components: z.ZodRecord<z.ZodString, z.ZodNumber>;
        trend: z.ZodEnum<["improving", "stable", "declining"]>;
        calculatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        trend: "improving" | "stable" | "declining";
        score: number;
        grade: string;
        components: Record<string, number>;
        calculatedAt: string;
    }, {
        trend: "improving" | "stable" | "declining";
        score: number;
        grade: string;
        components: Record<string, number>;
        calculatedAt: string;
    }>]>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
    profileId: string;
    type: "cycle" | "habit" | "challenge" | "score";
    date: string;
    data: {
        cycleType: "ovulation" | "custom" | "period_start" | "period_end" | "spotting" | "intercourse" | "fertile_window" | "symptom" | "mood";
        symptoms?: string[] | undefined;
        notes?: string | undefined;
        flowIntensity?: "heavy" | "light" | "medium" | undefined;
        mood?: "great" | "good" | "okay" | "bad" | "terrible" | undefined;
        energy?: number | undefined;
        cervicalMucus?: string | undefined;
        temperature?: number | undefined;
        ovulationConfirmed?: boolean | undefined;
    } | {
        completed: boolean;
        value: string | number;
        habitType: "custom" | "nutrition" | "water" | "sleep" | "steps" | "workout" | "meditation";
        source: "manual" | "wearable" | "integration";
        unit?: string | undefined;
        notes?: string | undefined;
        goal?: number | undefined;
    } | {
        challengeId: string;
        status: "completed" | "active" | "abandoned";
        challengeName: string;
        progress: {
            currentStreak: number;
            longestStreak: number;
            totalPoints: number;
            completedDays: number;
        };
        joinedAt: string;
        completedAt?: string | undefined;
    } | {
        trend: "improving" | "stable" | "declining";
        score: number;
        grade: string;
        components: Record<string, number>;
        calculatedAt: string;
    };
    id: string;
    createdAt: string;
    updatedAt: string;
}, {
    userId: string;
    profileId: string;
    type: "cycle" | "habit" | "challenge" | "score";
    date: string;
    data: {
        cycleType: "ovulation" | "custom" | "period_start" | "period_end" | "spotting" | "intercourse" | "fertile_window" | "symptom" | "mood";
        symptoms?: string[] | undefined;
        notes?: string | undefined;
        flowIntensity?: "heavy" | "light" | "medium" | undefined;
        mood?: "great" | "good" | "okay" | "bad" | "terrible" | undefined;
        energy?: number | undefined;
        cervicalMucus?: string | undefined;
        temperature?: number | undefined;
        ovulationConfirmed?: boolean | undefined;
    } | {
        value: string | number;
        habitType: "custom" | "nutrition" | "water" | "sleep" | "steps" | "workout" | "meditation";
        unit?: string | undefined;
        completed?: boolean | undefined;
        notes?: string | undefined;
        goal?: number | undefined;
        source?: "manual" | "wearable" | "integration" | undefined;
    } | {
        challengeId: string;
        challengeName: string;
        progress: {
            currentStreak?: number | undefined;
            longestStreak?: number | undefined;
            totalPoints?: number | undefined;
            completedDays?: number | undefined;
        };
        joinedAt: string;
        status?: "completed" | "active" | "abandoned" | undefined;
        completedAt?: string | undefined;
    } | {
        trend: "improving" | "stable" | "declining";
        score: number;
        grade: string;
        components: Record<string, number>;
        calculatedAt: string;
    };
    id: string;
    createdAt: string;
    updatedAt: string;
}>;
export type WellnessEntry = z.infer<typeof WellnessEntrySchema>;
export declare const RiskSignalTypeSchema: z.ZodEnum<["abnormal_biomarker", "recurring_deficiency", "trend_concern", "medication_adherence", "checkup_due", "vaccination_due", "lifestyle_risk", "symptom_pattern"]>;
export type RiskSignalType = z.infer<typeof RiskSignalTypeSchema>;
export declare const RiskSeveritySchema: z.ZodEnum<["info", "warning", "urgent"]>;
export type RiskSeverity = z.infer<typeof RiskSeveritySchema>;
export declare const RiskStatusSchema: z.ZodEnum<["active", "acknowledged", "dismissed", "resolved"]>;
export type RiskStatus = z.infer<typeof RiskStatusSchema>;
export declare const RecommendedActionTypeSchema: z.ZodEnum<["self_care", "consult_doctor", "urgent_care", "emergency"]>;
export type RecommendedActionType = z.infer<typeof RecommendedActionTypeSchema>;
export declare const HealthRiskSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    profileId: z.ZodString;
    signalType: z.ZodEnum<["abnormal_biomarker", "recurring_deficiency", "trend_concern", "medication_adherence", "checkup_due", "vaccination_due", "lifestyle_risk", "symptom_pattern"]>;
    severity: z.ZodEnum<["info", "warning", "urgent"]>;
    title: z.ZodString;
    description: z.ZodString;
    sourceRecordIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    sourceBiomarkers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    riskFactors: z.ZodOptional<z.ZodArray<z.ZodObject<{
        factor: z.ZodString;
        contribution: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        factor: string;
        contribution: number;
    }, {
        factor: string;
        contribution: number;
    }>, "many">>;
    recommendedAction: z.ZodObject<{
        type: z.ZodEnum<["self_care", "consult_doctor", "urgent_care", "emergency"]>;
        specialty: z.ZodOptional<z.ZodString>;
        description: z.ZodString;
        urgency: z.ZodOptional<z.ZodEnum<["low", "medium", "high"]>>;
    }, "strip", z.ZodTypeAny, {
        type: "self_care" | "consult_doctor" | "urgent_care" | "emergency";
        description: string;
        specialty?: string | undefined;
        urgency?: "low" | "high" | "medium" | undefined;
    }, {
        type: "self_care" | "consult_doctor" | "urgent_care" | "emergency";
        description: string;
        specialty?: string | undefined;
        urgency?: "low" | "high" | "medium" | undefined;
    }>;
    status: z.ZodEnum<["active", "acknowledged", "dismissed", "resolved"]>;
    dismissible: z.ZodDefault<z.ZodBoolean>;
    isRead: z.ZodDefault<z.ZodBoolean>;
    readAt: z.ZodOptional<z.ZodString>;
    acknowledgedAt: z.ZodOptional<z.ZodString>;
    dismissedAt: z.ZodOptional<z.ZodString>;
    dismissedReason: z.ZodOptional<z.ZodString>;
    resolvedAt: z.ZodOptional<z.ZodString>;
    resolution: z.ZodOptional<z.ZodString>;
    relatedAppointmentId: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    expiresAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    profileId: string;
    status: "active" | "resolved" | "acknowledged" | "dismissed";
    severity: "info" | "warning" | "urgent";
    id: string;
    title: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    isRead: boolean;
    signalType: "abnormal_biomarker" | "recurring_deficiency" | "trend_concern" | "medication_adherence" | "checkup_due" | "vaccination_due" | "lifestyle_risk" | "symptom_pattern";
    recommendedAction: {
        type: "self_care" | "consult_doctor" | "urgent_care" | "emergency";
        description: string;
        specialty?: string | undefined;
        urgency?: "low" | "high" | "medium" | undefined;
    };
    dismissible: boolean;
    expiresAt?: string | undefined;
    relatedAppointmentId?: string | undefined;
    readAt?: string | undefined;
    dismissedAt?: string | undefined;
    sourceRecordIds?: string[] | undefined;
    sourceBiomarkers?: string[] | undefined;
    riskFactors?: {
        factor: string;
        contribution: number;
    }[] | undefined;
    acknowledgedAt?: string | undefined;
    dismissedReason?: string | undefined;
    resolvedAt?: string | undefined;
    resolution?: string | undefined;
}, {
    userId: string;
    profileId: string;
    status: "active" | "resolved" | "acknowledged" | "dismissed";
    severity: "info" | "warning" | "urgent";
    id: string;
    title: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    signalType: "abnormal_biomarker" | "recurring_deficiency" | "trend_concern" | "medication_adherence" | "checkup_due" | "vaccination_due" | "lifestyle_risk" | "symptom_pattern";
    recommendedAction: {
        type: "self_care" | "consult_doctor" | "urgent_care" | "emergency";
        description: string;
        specialty?: string | undefined;
        urgency?: "low" | "high" | "medium" | undefined;
    };
    expiresAt?: string | undefined;
    relatedAppointmentId?: string | undefined;
    isRead?: boolean | undefined;
    readAt?: string | undefined;
    dismissedAt?: string | undefined;
    sourceRecordIds?: string[] | undefined;
    sourceBiomarkers?: string[] | undefined;
    riskFactors?: {
        factor: string;
        contribution: number;
    }[] | undefined;
    dismissible?: boolean | undefined;
    acknowledgedAt?: string | undefined;
    dismissedReason?: string | undefined;
    resolvedAt?: string | undefined;
    resolution?: string | undefined;
}>;
export type HealthRisk = z.infer<typeof HealthRiskSchema>;
export declare const UrgencyLevelSchema: z.ZodEnum<["self_care", "consult_doctor", "urgent_care", "emergency"]>;
export type UrgencyLevel = z.infer<typeof UrgencyLevelSchema>;
export declare const CopilotTaskSchema: z.ZodEnum<["explain_report", "track_biomarker", "compare_reports", "find_doctor", "book_appointment", "interpret_symptoms", "medication_reminder", "track_cycle", "health_score_insight", "preventive_checkup", "family_health", "general_health"]>;
export type CopilotTask = z.infer<typeof CopilotTaskSchema>;
export declare const SymptomInputSchema: z.ZodObject<{
    symptom: z.ZodString;
    duration: z.ZodOptional<z.ZodString>;
    severity: z.ZodOptional<z.ZodNumber>;
    location: z.ZodOptional<z.ZodString>;
    triggers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    associatedSymptoms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    symptom: string;
    duration?: string | undefined;
    severity?: number | undefined;
    location?: string | undefined;
    triggers?: string[] | undefined;
    associatedSymptoms?: string[] | undefined;
}, {
    symptom: string;
    duration?: string | undefined;
    severity?: number | undefined;
    location?: string | undefined;
    triggers?: string[] | undefined;
    associatedSymptoms?: string[] | undefined;
}>;
export type SymptomInput = z.infer<typeof SymptomInputSchema>;
export declare const HealthContextSchema: z.ZodObject<{
    allergies: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    chronicConditions: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    currentMedications: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    recentSymptoms: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    lastCheckup: z.ZodOptional<z.ZodString>;
    familyHistory: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    allergies: string[];
    chronicConditions: string[];
    currentMedications: string[];
    familyHistory: string[];
    recentSymptoms: string[];
    lastCheckup?: string | undefined;
}, {
    allergies?: string[] | undefined;
    chronicConditions?: string[] | undefined;
    currentMedications?: string[] | undefined;
    familyHistory?: string[] | undefined;
    recentSymptoms?: string[] | undefined;
    lastCheckup?: string | undefined;
}>;
export type HealthContext = z.infer<typeof HealthContextSchema>;
export declare const AIInterpretationSchema: z.ZodObject<{
    biomarker: z.ZodString;
    value: z.ZodString;
    status: z.ZodEnum<["normal", "low", "high", "critical", "borderline"]>;
    explanation: z.ZodObject<{
        whatItMeans: z.ZodString;
        whyItMatters: z.ZodString;
        possibleCauses: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        generalGuidance: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        whatItMeans: string;
        whyItMatters: string;
        generalGuidance: string;
        possibleCauses?: string[] | undefined;
    }, {
        whatItMeans: string;
        whyItMatters: string;
        generalGuidance: string;
        possibleCauses?: string[] | undefined;
    }>;
    confidence: z.ZodNumber;
    needsAttention: z.ZodBoolean;
    trend: z.ZodOptional<z.ZodEnum<["improving", "stable", "worsening", "fluctuating"]>>;
    recommendedAction: z.ZodOptional<z.ZodEnum<["none", "monitor", "consult_doctor"]>>;
}, "strip", z.ZodTypeAny, {
    status: "low" | "high" | "normal" | "critical" | "borderline";
    value: string;
    biomarker: string;
    explanation: {
        whatItMeans: string;
        whyItMatters: string;
        generalGuidance: string;
        possibleCauses?: string[] | undefined;
    };
    confidence: number;
    needsAttention: boolean;
    trend?: "improving" | "stable" | "worsening" | "fluctuating" | undefined;
    recommendedAction?: "none" | "consult_doctor" | "monitor" | undefined;
}, {
    status: "low" | "high" | "normal" | "critical" | "borderline";
    value: string;
    biomarker: string;
    explanation: {
        whatItMeans: string;
        whyItMatters: string;
        generalGuidance: string;
        possibleCauses?: string[] | undefined;
    };
    confidence: number;
    needsAttention: boolean;
    trend?: "improving" | "stable" | "worsening" | "fluctuating" | undefined;
    recommendedAction?: "none" | "consult_doctor" | "monitor" | undefined;
}>;
export type AIInterpretation = z.infer<typeof AIInterpretationSchema>;
export declare const AIReportInterpretationResponseSchema: z.ZodObject<{
    recordId: z.ZodString;
    interpretations: z.ZodArray<z.ZodObject<{
        biomarker: z.ZodString;
        value: z.ZodString;
        status: z.ZodEnum<["normal", "low", "high", "critical", "borderline"]>;
        explanation: z.ZodObject<{
            whatItMeans: z.ZodString;
            whyItMatters: z.ZodString;
            possibleCauses: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            generalGuidance: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            whatItMeans: string;
            whyItMatters: string;
            generalGuidance: string;
            possibleCauses?: string[] | undefined;
        }, {
            whatItMeans: string;
            whyItMatters: string;
            generalGuidance: string;
            possibleCauses?: string[] | undefined;
        }>;
        confidence: z.ZodNumber;
        needsAttention: z.ZodBoolean;
        trend: z.ZodOptional<z.ZodEnum<["improving", "stable", "worsening", "fluctuating"]>>;
        recommendedAction: z.ZodOptional<z.ZodEnum<["none", "monitor", "consult_doctor"]>>;
    }, "strip", z.ZodTypeAny, {
        status: "low" | "high" | "normal" | "critical" | "borderline";
        value: string;
        biomarker: string;
        explanation: {
            whatItMeans: string;
            whyItMatters: string;
            generalGuidance: string;
            possibleCauses?: string[] | undefined;
        };
        confidence: number;
        needsAttention: boolean;
        trend?: "improving" | "stable" | "worsening" | "fluctuating" | undefined;
        recommendedAction?: "none" | "consult_doctor" | "monitor" | undefined;
    }, {
        status: "low" | "high" | "normal" | "critical" | "borderline";
        value: string;
        biomarker: string;
        explanation: {
            whatItMeans: string;
            whyItMatters: string;
            generalGuidance: string;
            possibleCauses?: string[] | undefined;
        };
        confidence: number;
        needsAttention: boolean;
        trend?: "improving" | "stable" | "worsening" | "fluctuating" | undefined;
        recommendedAction?: "none" | "consult_doctor" | "monitor" | undefined;
    }>, "many">;
    overallAssessment: z.ZodObject<{
        summary: z.ZodString;
        needsDoctorConsult: z.ZodBoolean;
        urgency: z.ZodEnum<["low", "medium", "high"]>;
    }, "strip", z.ZodTypeAny, {
        urgency: "low" | "high" | "medium";
        summary: string;
        needsDoctorConsult: boolean;
    }, {
        urgency: "low" | "high" | "medium";
        summary: string;
        needsDoctorConsult: boolean;
    }>;
    safetySignals: z.ZodDefault<z.ZodArray<z.ZodObject<{
        indicator: z.ZodString;
        action: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        action: string;
        indicator: string;
    }, {
        action: string;
        indicator: string;
    }>, "many">>;
    trends: z.ZodOptional<z.ZodArray<z.ZodObject<{
        biomarker: z.ZodString;
        trend: z.ZodEnum<["improving", "stable", "worsening", "fluctuating"]>;
        values: z.ZodArray<z.ZodObject<{
            value: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
            date: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            date: string;
            value: string | number;
        }, {
            date: string;
            value: string | number;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        values: {
            date: string;
            value: string | number;
        }[];
        trend: "improving" | "stable" | "worsening" | "fluctuating";
        biomarker: string;
    }, {
        values: {
            date: string;
            value: string | number;
        }[];
        trend: "improving" | "stable" | "worsening" | "fluctuating";
        biomarker: string;
    }>, "many">>;
    disclaimer: z.ZodString;
    confidence: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    recordId: string;
    confidence: number;
    interpretations: {
        status: "low" | "high" | "normal" | "critical" | "borderline";
        value: string;
        biomarker: string;
        explanation: {
            whatItMeans: string;
            whyItMatters: string;
            generalGuidance: string;
            possibleCauses?: string[] | undefined;
        };
        confidence: number;
        needsAttention: boolean;
        trend?: "improving" | "stable" | "worsening" | "fluctuating" | undefined;
        recommendedAction?: "none" | "consult_doctor" | "monitor" | undefined;
    }[];
    overallAssessment: {
        urgency: "low" | "high" | "medium";
        summary: string;
        needsDoctorConsult: boolean;
    };
    safetySignals: {
        action: string;
        indicator: string;
    }[];
    disclaimer: string;
    trends?: {
        values: {
            date: string;
            value: string | number;
        }[];
        trend: "improving" | "stable" | "worsening" | "fluctuating";
        biomarker: string;
    }[] | undefined;
}, {
    recordId: string;
    confidence: number;
    interpretations: {
        status: "low" | "high" | "normal" | "critical" | "borderline";
        value: string;
        biomarker: string;
        explanation: {
            whatItMeans: string;
            whyItMatters: string;
            generalGuidance: string;
            possibleCauses?: string[] | undefined;
        };
        confidence: number;
        needsAttention: boolean;
        trend?: "improving" | "stable" | "worsening" | "fluctuating" | undefined;
        recommendedAction?: "none" | "consult_doctor" | "monitor" | undefined;
    }[];
    overallAssessment: {
        urgency: "low" | "high" | "medium";
        summary: string;
        needsDoctorConsult: boolean;
    };
    disclaimer: string;
    safetySignals?: {
        action: string;
        indicator: string;
    }[] | undefined;
    trends?: {
        values: {
            date: string;
            value: string | number;
        }[];
        trend: "improving" | "stable" | "worsening" | "fluctuating";
        biomarker: string;
    }[] | undefined;
}>;
export type AIReportInterpretationResponse = z.infer<typeof AIReportInterpretationResponseSchema>;
export declare const AISymptomAssessmentResponseSchema: z.ZodObject<{
    sessionId: z.ZodString;
    assessment: z.ZodObject<{
        urgency: z.ZodEnum<["self_care", "consult_doctor", "urgent_care", "emergency"]>;
        reasoning: z.ZodArray<z.ZodString, "many">;
        recommendedAction: z.ZodObject<{
            type: z.ZodEnum<["self_care", "consult_doctor", "urgent_care", "emergency"]>;
            description: z.ZodString;
            timeframe: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: "self_care" | "consult_doctor" | "urgent_care" | "emergency";
            description: string;
            timeframe?: string | undefined;
        }, {
            type: "self_care" | "consult_doctor" | "urgent_care" | "emergency";
            description: string;
            timeframe?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        recommendedAction: {
            type: "self_care" | "consult_doctor" | "urgent_care" | "emergency";
            description: string;
            timeframe?: string | undefined;
        };
        urgency: "self_care" | "consult_doctor" | "urgent_care" | "emergency";
        reasoning: string[];
    }, {
        recommendedAction: {
            type: "self_care" | "consult_doctor" | "urgent_care" | "emergency";
            description: string;
            timeframe?: string | undefined;
        };
        urgency: "self_care" | "consult_doctor" | "urgent_care" | "emergency";
        reasoning: string[];
    }>;
    routing: z.ZodOptional<z.ZodObject<{
        specialties: z.ZodDefault<z.ZodArray<z.ZodObject<{
            specialty: z.ZodString;
            relevanceScore: z.ZodNumber;
            reason: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            reason: string;
            specialty: string;
            relevanceScore: number;
        }, {
            reason: string;
            specialty: string;
            relevanceScore: number;
        }>, "many">>;
        tests: z.ZodDefault<z.ZodArray<z.ZodObject<{
            testName: z.ZodString;
            reason: z.ZodString;
            urgency: z.ZodEnum<["routine", "soon", "urgent"]>;
        }, "strip", z.ZodTypeAny, {
            reason: string;
            urgency: "urgent" | "routine" | "soon";
            testName: string;
        }, {
            reason: string;
            urgency: "urgent" | "routine" | "soon";
            testName: string;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        specialties: {
            reason: string;
            specialty: string;
            relevanceScore: number;
        }[];
        tests: {
            reason: string;
            urgency: "urgent" | "routine" | "soon";
            testName: string;
        }[];
    }, {
        specialties?: {
            reason: string;
            specialty: string;
            relevanceScore: number;
        }[] | undefined;
        tests?: {
            reason: string;
            urgency: "urgent" | "routine" | "soon";
            testName: string;
        }[] | undefined;
    }>>;
    selfCare: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    emergencyFlags: z.ZodBoolean;
    emergencySymptoms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    message: z.ZodString;
    confidence: z.ZodNumber;
    disclaimer: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message: string;
    confidence: number;
    disclaimer: string;
    sessionId: string;
    assessment: {
        recommendedAction: {
            type: "self_care" | "consult_doctor" | "urgent_care" | "emergency";
            description: string;
            timeframe?: string | undefined;
        };
        urgency: "self_care" | "consult_doctor" | "urgent_care" | "emergency";
        reasoning: string[];
    };
    emergencyFlags: boolean;
    routing?: {
        specialties: {
            reason: string;
            specialty: string;
            relevanceScore: number;
        }[];
        tests: {
            reason: string;
            urgency: "urgent" | "routine" | "soon";
            testName: string;
        }[];
    } | undefined;
    selfCare?: string[] | undefined;
    emergencySymptoms?: string[] | undefined;
}, {
    message: string;
    confidence: number;
    disclaimer: string;
    sessionId: string;
    assessment: {
        recommendedAction: {
            type: "self_care" | "consult_doctor" | "urgent_care" | "emergency";
            description: string;
            timeframe?: string | undefined;
        };
        urgency: "self_care" | "consult_doctor" | "urgent_care" | "emergency";
        reasoning: string[];
    };
    emergencyFlags: boolean;
    routing?: {
        specialties?: {
            reason: string;
            specialty: string;
            relevanceScore: number;
        }[] | undefined;
        tests?: {
            reason: string;
            urgency: "urgent" | "routine" | "soon";
            testName: string;
        }[] | undefined;
    } | undefined;
    selfCare?: string[] | undefined;
    emergencySymptoms?: string[] | undefined;
}>;
export type AISymptomAssessmentResponse = z.infer<typeof AISymptomAssessmentResponseSchema>;
export declare const DoctorSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    photo: z.ZodOptional<z.ZodString>;
    gender: z.ZodOptional<z.ZodEnum<["male", "female", "other", "prefer-not-to-say"]>>;
    credentials: z.ZodObject<{
        specializations: z.ZodArray<z.ZodString, "many">;
        qualifications: z.ZodArray<z.ZodString, "many">;
        yearsOfExperience: z.ZodNumber;
        languages: z.ZodArray<z.ZodString, "many">;
        registrationNumber: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        specializations: string[];
        qualifications: string[];
        yearsOfExperience: number;
        languages: string[];
        registrationNumber?: string | undefined;
    }, {
        specializations: string[];
        qualifications: string[];
        yearsOfExperience: number;
        languages: string[];
        registrationNumber?: string | undefined;
    }>;
    practice: z.ZodObject<{
        hospitalAffiliations: z.ZodArray<z.ZodString, "many">;
        clinicName: z.ZodOptional<z.ZodString>;
        clinicAddress: z.ZodOptional<z.ZodObject<{
            line1: z.ZodString;
            line2: z.ZodString;
            city: z.ZodString;
            state: z.ZodString;
            pincode: z.ZodString;
            landmark: z.ZodString;
            coordinates: z.ZodObject<{
                lat: z.ZodNumber;
                lng: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                lat: number;
                lng: number;
            }, {
                lat: number;
                lng: number;
            }>;
        }, "strip", z.ZodTypeAny, {
            line1: string;
            line2: string;
            city: string;
            state: string;
            pincode: string;
            landmark: string;
            coordinates: {
                lat: number;
                lng: number;
            };
        }, {
            line1: string;
            line2: string;
            city: string;
            state: string;
            pincode: string;
            landmark: string;
            coordinates: {
                lat: number;
                lng: number;
            };
        }>>;
        consultationFees: z.ZodObject<{
            inClinic: z.ZodOptional<z.ZodNumber>;
            teleconsult: z.ZodOptional<z.ZodNumber>;
            homeVisit: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            teleconsult?: number | undefined;
            inClinic?: number | undefined;
            homeVisit?: number | undefined;
        }, {
            teleconsult?: number | undefined;
            inClinic?: number | undefined;
            homeVisit?: number | undefined;
        }>;
        consultationModes: z.ZodArray<z.ZodEnum<["in_clinic", "teleconsult", "home_visit"]>, "many">;
    }, "strip", z.ZodTypeAny, {
        hospitalAffiliations: string[];
        consultationFees: {
            teleconsult?: number | undefined;
            inClinic?: number | undefined;
            homeVisit?: number | undefined;
        };
        consultationModes: ("teleconsult" | "home_visit" | "in_clinic")[];
        clinicName?: string | undefined;
        clinicAddress?: {
            line1: string;
            line2: string;
            city: string;
            state: string;
            pincode: string;
            landmark: string;
            coordinates: {
                lat: number;
                lng: number;
            };
        } | undefined;
    }, {
        hospitalAffiliations: string[];
        consultationFees: {
            teleconsult?: number | undefined;
            inClinic?: number | undefined;
            homeVisit?: number | undefined;
        };
        consultationModes: ("teleconsult" | "home_visit" | "in_clinic")[];
        clinicName?: string | undefined;
        clinicAddress?: {
            line1: string;
            line2: string;
            city: string;
            state: string;
            pincode: string;
            landmark: string;
            coordinates: {
                lat: number;
                lng: number;
            };
        } | undefined;
    }>;
    availability: z.ZodObject<{
        workingDays: z.ZodArray<z.ZodNumber, "many">;
        hours: z.ZodObject<{
            start: z.ZodString;
            end: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            end: string;
            start: string;
        }, {
            end: string;
            start: string;
        }>;
        slots: z.ZodOptional<z.ZodArray<z.ZodObject<{
            date: z.ZodString;
            times: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            date: string;
            times: string[];
        }, {
            date: string;
            times: string[];
        }>, "many">>;
        nextAvailable: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        workingDays: number[];
        hours: {
            end: string;
            start: string;
        };
        slots?: {
            date: string;
            times: string[];
        }[] | undefined;
        nextAvailable?: string | undefined;
    }, {
        workingDays: number[];
        hours: {
            end: string;
            start: string;
        };
        slots?: {
            date: string;
            times: string[];
        }[] | undefined;
        nextAvailable?: string | undefined;
    }>;
    ratings: z.ZodObject<{
        average: z.ZodNumber;
        totalReviews: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        average: number;
        totalReviews: number;
    }, {
        average: number;
        totalReviews: number;
    }>;
    insuranceAccepted: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    bio: z.ZodOptional<z.ZodString>;
    awards: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    publications: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    isVerified: z.ZodDefault<z.ZodBoolean>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    credentials: {
        specializations: string[];
        qualifications: string[];
        yearsOfExperience: number;
        languages: string[];
        registrationNumber?: string | undefined;
    };
    id: string;
    createdAt: string;
    updatedAt: string;
    practice: {
        hospitalAffiliations: string[];
        consultationFees: {
            teleconsult?: number | undefined;
            inClinic?: number | undefined;
            homeVisit?: number | undefined;
        };
        consultationModes: ("teleconsult" | "home_visit" | "in_clinic")[];
        clinicName?: string | undefined;
        clinicAddress?: {
            line1: string;
            line2: string;
            city: string;
            state: string;
            pincode: string;
            landmark: string;
            coordinates: {
                lat: number;
                lng: number;
            };
        } | undefined;
    };
    availability: {
        workingDays: number[];
        hours: {
            end: string;
            start: string;
        };
        slots?: {
            date: string;
            times: string[];
        }[] | undefined;
        nextAvailable?: string | undefined;
    };
    ratings: {
        average: number;
        totalReviews: number;
    };
    isVerified: boolean;
    isActive: boolean;
    gender?: "male" | "female" | "other" | "prefer-not-to-say" | undefined;
    photo?: string | undefined;
    insuranceAccepted?: string[] | undefined;
    bio?: string | undefined;
    awards?: string[] | undefined;
    publications?: string[] | undefined;
}, {
    name: string;
    credentials: {
        specializations: string[];
        qualifications: string[];
        yearsOfExperience: number;
        languages: string[];
        registrationNumber?: string | undefined;
    };
    id: string;
    createdAt: string;
    updatedAt: string;
    practice: {
        hospitalAffiliations: string[];
        consultationFees: {
            teleconsult?: number | undefined;
            inClinic?: number | undefined;
            homeVisit?: number | undefined;
        };
        consultationModes: ("teleconsult" | "home_visit" | "in_clinic")[];
        clinicName?: string | undefined;
        clinicAddress?: {
            line1: string;
            line2: string;
            city: string;
            state: string;
            pincode: string;
            landmark: string;
            coordinates: {
                lat: number;
                lng: number;
            };
        } | undefined;
    };
    availability: {
        workingDays: number[];
        hours: {
            end: string;
            start: string;
        };
        slots?: {
            date: string;
            times: string[];
        }[] | undefined;
        nextAvailable?: string | undefined;
    };
    ratings: {
        average: number;
        totalReviews: number;
    };
    gender?: "male" | "female" | "other" | "prefer-not-to-say" | undefined;
    photo?: string | undefined;
    insuranceAccepted?: string[] | undefined;
    bio?: string | undefined;
    awards?: string[] | undefined;
    publications?: string[] | undefined;
    isVerified?: boolean | undefined;
    isActive?: boolean | undefined;
}>;
export type Doctor = z.infer<typeof DoctorSchema>;
export declare const LabSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    logo: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<["chain", "independent", "hospital"]>;
    address: z.ZodObject<{
        line1: z.ZodString;
        line2: z.ZodString;
        city: z.ZodString;
        state: z.ZodString;
        pincode: z.ZodString;
        landmark: z.ZodString;
        coordinates: z.ZodObject<{
            lat: z.ZodNumber;
            lng: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            lat: number;
            lng: number;
        }, {
            lat: number;
            lng: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        line1: string;
        line2: string;
        city: string;
        state: string;
        pincode: string;
        landmark: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    }, {
        line1: string;
        line2: string;
        city: string;
        state: string;
        pincode: string;
        landmark: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    }>;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    website: z.ZodOptional<z.ZodString>;
    nablAccredited: z.ZodDefault<z.ZodBoolean>;
    certifications: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    services: z.ZodObject<{
        homeCollection: z.ZodDefault<z.ZodBoolean>;
        homeCollectionFee: z.ZodOptional<z.ZodNumber>;
        reportDelivery: z.ZodDefault<z.ZodEnum<["online", "physical", "both"]>>;
        emergencyTests: z.ZodDefault<z.ZodBoolean>;
        slotBasedAppointments: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        homeCollection: boolean;
        reportDelivery: "online" | "physical" | "both";
        emergencyTests: boolean;
        slotBasedAppointments: boolean;
        homeCollectionFee?: number | undefined;
    }, {
        homeCollection?: boolean | undefined;
        homeCollectionFee?: number | undefined;
        reportDelivery?: "online" | "physical" | "both" | undefined;
        emergencyTests?: boolean | undefined;
        slotBasedAppointments?: boolean | undefined;
    }>;
    operatingHours: z.ZodRecord<z.ZodString, z.ZodObject<{
        open: z.ZodString;
        close: z.ZodString;
        closed: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        close: string;
        open: string;
        closed: boolean;
    }, {
        close: string;
        open: string;
        closed?: boolean | undefined;
    }>>;
    ratings: z.ZodObject<{
        average: z.ZodNumber;
        totalReviews: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        average: number;
        totalReviews: number;
    }, {
        average: number;
        totalReviews: number;
    }>;
    tests: z.ZodOptional<z.ZodArray<z.ZodObject<{
        testId: z.ZodString;
        name: z.ZodString;
        category: z.ZodString;
        price: z.ZodNumber;
        discountedPrice: z.ZodOptional<z.ZodNumber>;
        turnaroundTime: z.ZodString;
        parameters: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        homeCollection: z.ZodOptional<z.ZodBoolean>;
        preparation: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        testId: string;
        category: string;
        price: number;
        turnaroundTime: string;
        homeCollection?: boolean | undefined;
        discountedPrice?: number | undefined;
        parameters?: string[] | undefined;
        preparation?: string[] | undefined;
    }, {
        name: string;
        testId: string;
        category: string;
        price: number;
        turnaroundTime: string;
        homeCollection?: boolean | undefined;
        discountedPrice?: number | undefined;
        parameters?: string[] | undefined;
        preparation?: string[] | undefined;
    }>, "many">>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    type: "hospital" | "chain" | "independent";
    id: string;
    createdAt: string;
    updatedAt: string;
    address: {
        line1: string;
        line2: string;
        city: string;
        state: string;
        pincode: string;
        landmark: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    };
    ratings: {
        average: number;
        totalReviews: number;
    };
    isActive: boolean;
    nablAccredited: boolean;
    services: {
        homeCollection: boolean;
        reportDelivery: "online" | "physical" | "both";
        emergencyTests: boolean;
        slotBasedAppointments: boolean;
        homeCollectionFee?: number | undefined;
    };
    operatingHours: Record<string, {
        close: string;
        open: string;
        closed: boolean;
    }>;
    email?: string | undefined;
    phone?: string | undefined;
    tests?: {
        name: string;
        testId: string;
        category: string;
        price: number;
        turnaroundTime: string;
        homeCollection?: boolean | undefined;
        discountedPrice?: number | undefined;
        parameters?: string[] | undefined;
        preparation?: string[] | undefined;
    }[] | undefined;
    logo?: string | undefined;
    website?: string | undefined;
    certifications?: string[] | undefined;
}, {
    name: string;
    type: "hospital" | "chain" | "independent";
    id: string;
    createdAt: string;
    updatedAt: string;
    address: {
        line1: string;
        line2: string;
        city: string;
        state: string;
        pincode: string;
        landmark: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    };
    ratings: {
        average: number;
        totalReviews: number;
    };
    services: {
        homeCollection?: boolean | undefined;
        homeCollectionFee?: number | undefined;
        reportDelivery?: "online" | "physical" | "both" | undefined;
        emergencyTests?: boolean | undefined;
        slotBasedAppointments?: boolean | undefined;
    };
    operatingHours: Record<string, {
        close: string;
        open: string;
        closed?: boolean | undefined;
    }>;
    email?: string | undefined;
    phone?: string | undefined;
    tests?: {
        name: string;
        testId: string;
        category: string;
        price: number;
        turnaroundTime: string;
        homeCollection?: boolean | undefined;
        discountedPrice?: number | undefined;
        parameters?: string[] | undefined;
        preparation?: string[] | undefined;
    }[] | undefined;
    isActive?: boolean | undefined;
    logo?: string | undefined;
    website?: string | undefined;
    nablAccredited?: boolean | undefined;
    certifications?: string[] | undefined;
}>;
export type Lab = z.infer<typeof LabSchema>;
export declare const MedicineSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    genericName: z.ZodOptional<z.ZodString>;
    manufacturer: z.ZodOptional<z.ZodString>;
    composition: z.ZodOptional<z.ZodString>;
    form: z.ZodEnum<["tablet", "capsule", "syrup", "injection", "ointment", "drops", "patch", "inhaler", "other"]>;
    strength: z.ZodOptional<z.ZodString>;
    pricing: z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodDefault<z.ZodString>;
        perUnit: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        currency: string;
        amount: number;
        perUnit?: number | undefined;
    }, {
        amount: number;
        currency?: string | undefined;
        perUnit?: number | undefined;
    }>;
    requiresPrescription: z.ZodDefault<z.ZodBoolean>;
    pharmacies: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        address: z.ZodObject<{
            line1: z.ZodString;
            line2: z.ZodString;
            city: z.ZodString;
            state: z.ZodString;
            pincode: z.ZodString;
            landmark: z.ZodString;
            coordinates: z.ZodObject<{
                lat: z.ZodNumber;
                lng: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                lat: number;
                lng: number;
            }, {
                lat: number;
                lng: number;
            }>;
        }, "strip", z.ZodTypeAny, {
            line1: string;
            line2: string;
            city: string;
            state: string;
            pincode: string;
            landmark: string;
            coordinates: {
                lat: number;
                lng: number;
            };
        }, {
            line1: string;
            line2: string;
            city: string;
            state: string;
            pincode: string;
            landmark: string;
            coordinates: {
                lat: number;
                lng: number;
            };
        }>;
        stock: z.ZodNumber;
        price: z.ZodNumber;
        deliveryTime: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        address: {
            line1: string;
            line2: string;
            city: string;
            state: string;
            pincode: string;
            landmark: string;
            coordinates: {
                lat: number;
                lng: number;
            };
        };
        price: number;
        stock: number;
        deliveryTime?: string | undefined;
    }, {
        name: string;
        id: string;
        address: {
            line1: string;
            line2: string;
            city: string;
            state: string;
            pincode: string;
            landmark: string;
            coordinates: {
                lat: number;
                lng: number;
            };
        };
        price: number;
        stock: number;
        deliveryTime?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    form: "other" | "tablet" | "capsule" | "syrup" | "injection" | "ointment" | "drops" | "patch" | "inhaler";
    pricing: {
        currency: string;
        amount: number;
        perUnit?: number | undefined;
    };
    requiresPrescription: boolean;
    genericName?: string | undefined;
    manufacturer?: string | undefined;
    composition?: string | undefined;
    strength?: string | undefined;
    pharmacies?: {
        name: string;
        id: string;
        address: {
            line1: string;
            line2: string;
            city: string;
            state: string;
            pincode: string;
            landmark: string;
            coordinates: {
                lat: number;
                lng: number;
            };
        };
        price: number;
        stock: number;
        deliveryTime?: string | undefined;
    }[] | undefined;
}, {
    name: string;
    id: string;
    form: "other" | "tablet" | "capsule" | "syrup" | "injection" | "ointment" | "drops" | "patch" | "inhaler";
    pricing: {
        amount: number;
        currency?: string | undefined;
        perUnit?: number | undefined;
    };
    genericName?: string | undefined;
    manufacturer?: string | undefined;
    composition?: string | undefined;
    strength?: string | undefined;
    requiresPrescription?: boolean | undefined;
    pharmacies?: {
        name: string;
        id: string;
        address: {
            line1: string;
            line2: string;
            city: string;
            state: string;
            pincode: string;
            landmark: string;
            coordinates: {
                lat: number;
                lng: number;
            };
        };
        price: number;
        stock: number;
        deliveryTime?: string | undefined;
    }[] | undefined;
}>;
export type Medicine = z.infer<typeof MedicineSchema>;
export declare const HealthScoreSchema: z.ZodObject<{
    userId: z.ZodString;
    profileId: z.ZodString;
    date: z.ZodString;
    overall: z.ZodObject<{
        score: z.ZodNumber;
        grade: z.ZodString;
        trend: z.ZodEnum<["improving", "stable", "declining"]>;
    }, "strip", z.ZodTypeAny, {
        trend: "improving" | "stable" | "declining";
        score: number;
        grade: string;
    }, {
        trend: "improving" | "stable" | "declining";
        score: number;
        grade: string;
    }>;
    components: z.ZodObject<{
        preventive: z.ZodObject<{
            score: z.ZodNumber;
            weight: z.ZodNumber;
            factors: z.ZodObject<{
                checkupRecency: z.ZodNumber;
                vaccinationStatus: z.ZodNumber;
                screeningCompletion: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                checkupRecency: number;
                vaccinationStatus: number;
                screeningCompletion: number;
            }, {
                checkupRecency: number;
                vaccinationStatus: number;
                screeningCompletion: number;
            }>;
        }, "strip", z.ZodTypeAny, {
            score: number;
            weight: number;
            factors: {
                checkupRecency: number;
                vaccinationStatus: number;
                screeningCompletion: number;
            };
        }, {
            score: number;
            weight: number;
            factors: {
                checkupRecency: number;
                vaccinationStatus: number;
                screeningCompletion: number;
            };
        }>;
        activity: z.ZodObject<{
            score: z.ZodNumber;
            weight: z.ZodNumber;
            factors: z.ZodObject<{
                dailyActivity: z.ZodNumber;
                workoutConsistency: z.ZodNumber;
                stepGoalAchievement: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                dailyActivity: number;
                workoutConsistency: number;
                stepGoalAchievement: number;
            }, {
                dailyActivity: number;
                workoutConsistency: number;
                stepGoalAchievement: number;
            }>;
        }, "strip", z.ZodTypeAny, {
            score: number;
            weight: number;
            factors: {
                dailyActivity: number;
                workoutConsistency: number;
                stepGoalAchievement: number;
            };
        }, {
            score: number;
            weight: number;
            factors: {
                dailyActivity: number;
                workoutConsistency: number;
                stepGoalAchievement: number;
            };
        }>;
        lifestyle: z.ZodObject<{
            score: z.ZodNumber;
            weight: z.ZodNumber;
            factors: z.ZodObject<{
                sleepQuality: z.ZodNumber;
                hydration: z.ZodNumber;
                stressManagement: z.ZodNumber;
                substanceAvoidance: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                sleepQuality: number;
                hydration: number;
                stressManagement: number;
                substanceAvoidance: number;
            }, {
                sleepQuality: number;
                hydration: number;
                stressManagement: number;
                substanceAvoidance: number;
            }>;
        }, "strip", z.ZodTypeAny, {
            score: number;
            weight: number;
            factors: {
                sleepQuality: number;
                hydration: number;
                stressManagement: number;
                substanceAvoidance: number;
            };
        }, {
            score: number;
            weight: number;
            factors: {
                sleepQuality: number;
                hydration: number;
                stressManagement: number;
                substanceAvoidance: number;
            };
        }>;
        biomarkers: z.ZodObject<{
            score: z.ZodNumber;
            weight: z.ZodNumber;
            factors: z.ZodObject<{
                normalRanges: z.ZodNumber;
                trendDirection: z.ZodNumber;
                deficiencyTracking: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                normalRanges: number;
                trendDirection: number;
                deficiencyTracking: number;
            }, {
                normalRanges: number;
                trendDirection: number;
                deficiencyTracking: number;
            }>;
        }, "strip", z.ZodTypeAny, {
            score: number;
            weight: number;
            factors: {
                normalRanges: number;
                trendDirection: number;
                deficiencyTracking: number;
            };
        }, {
            score: number;
            weight: number;
            factors: {
                normalRanges: number;
                trendDirection: number;
                deficiencyTracking: number;
            };
        }>;
        engagement: z.ZodObject<{
            score: z.ZodNumber;
            weight: z.ZodNumber;
            factors: z.ZodObject<{
                recordUploads: z.ZodNumber;
                healthCopilotUsage: z.ZodNumber;
                challengeParticipation: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                recordUploads: number;
                healthCopilotUsage: number;
                challengeParticipation: number;
            }, {
                recordUploads: number;
                healthCopilotUsage: number;
                challengeParticipation: number;
            }>;
        }, "strip", z.ZodTypeAny, {
            score: number;
            weight: number;
            factors: {
                recordUploads: number;
                healthCopilotUsage: number;
                challengeParticipation: number;
            };
        }, {
            score: number;
            weight: number;
            factors: {
                recordUploads: number;
                healthCopilotUsage: number;
                challengeParticipation: number;
            };
        }>;
    }, "strip", z.ZodTypeAny, {
        lifestyle: {
            score: number;
            weight: number;
            factors: {
                sleepQuality: number;
                hydration: number;
                stressManagement: number;
                substanceAvoidance: number;
            };
        };
        preventive: {
            score: number;
            weight: number;
            factors: {
                checkupRecency: number;
                vaccinationStatus: number;
                screeningCompletion: number;
            };
        };
        biomarkers: {
            score: number;
            weight: number;
            factors: {
                normalRanges: number;
                trendDirection: number;
                deficiencyTracking: number;
            };
        };
        activity: {
            score: number;
            weight: number;
            factors: {
                dailyActivity: number;
                workoutConsistency: number;
                stepGoalAchievement: number;
            };
        };
        engagement: {
            score: number;
            weight: number;
            factors: {
                recordUploads: number;
                healthCopilotUsage: number;
                challengeParticipation: number;
            };
        };
    }, {
        lifestyle: {
            score: number;
            weight: number;
            factors: {
                sleepQuality: number;
                hydration: number;
                stressManagement: number;
                substanceAvoidance: number;
            };
        };
        preventive: {
            score: number;
            weight: number;
            factors: {
                checkupRecency: number;
                vaccinationStatus: number;
                screeningCompletion: number;
            };
        };
        biomarkers: {
            score: number;
            weight: number;
            factors: {
                normalRanges: number;
                trendDirection: number;
                deficiencyTracking: number;
            };
        };
        activity: {
            score: number;
            weight: number;
            factors: {
                dailyActivity: number;
                workoutConsistency: number;
                stepGoalAchievement: number;
            };
        };
        engagement: {
            score: number;
            weight: number;
            factors: {
                recordUploads: number;
                healthCopilotUsage: number;
                challengeParticipation: number;
            };
        };
    }>;
    badges: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        earnedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        earnedAt: string;
    }, {
        name: string;
        id: string;
        earnedAt: string;
    }>, "many">>;
    streaks: z.ZodDefault<z.ZodObject<{
        habitStreak: z.ZodDefault<z.ZodNumber>;
        checkupStreak: z.ZodDefault<z.ZodNumber>;
        preventiveStreak: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        habitStreak: number;
        checkupStreak: number;
        preventiveStreak: number;
    }, {
        habitStreak?: number | undefined;
        checkupStreak?: number | undefined;
        preventiveStreak?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    profileId: string;
    date: string;
    components: {
        lifestyle: {
            score: number;
            weight: number;
            factors: {
                sleepQuality: number;
                hydration: number;
                stressManagement: number;
                substanceAvoidance: number;
            };
        };
        preventive: {
            score: number;
            weight: number;
            factors: {
                checkupRecency: number;
                vaccinationStatus: number;
                screeningCompletion: number;
            };
        };
        biomarkers: {
            score: number;
            weight: number;
            factors: {
                normalRanges: number;
                trendDirection: number;
                deficiencyTracking: number;
            };
        };
        activity: {
            score: number;
            weight: number;
            factors: {
                dailyActivity: number;
                workoutConsistency: number;
                stepGoalAchievement: number;
            };
        };
        engagement: {
            score: number;
            weight: number;
            factors: {
                recordUploads: number;
                healthCopilotUsage: number;
                challengeParticipation: number;
            };
        };
    };
    overall: {
        trend: "improving" | "stable" | "declining";
        score: number;
        grade: string;
    };
    badges: {
        name: string;
        id: string;
        earnedAt: string;
    }[];
    streaks: {
        habitStreak: number;
        checkupStreak: number;
        preventiveStreak: number;
    };
}, {
    userId: string;
    profileId: string;
    date: string;
    components: {
        lifestyle: {
            score: number;
            weight: number;
            factors: {
                sleepQuality: number;
                hydration: number;
                stressManagement: number;
                substanceAvoidance: number;
            };
        };
        preventive: {
            score: number;
            weight: number;
            factors: {
                checkupRecency: number;
                vaccinationStatus: number;
                screeningCompletion: number;
            };
        };
        biomarkers: {
            score: number;
            weight: number;
            factors: {
                normalRanges: number;
                trendDirection: number;
                deficiencyTracking: number;
            };
        };
        activity: {
            score: number;
            weight: number;
            factors: {
                dailyActivity: number;
                workoutConsistency: number;
                stepGoalAchievement: number;
            };
        };
        engagement: {
            score: number;
            weight: number;
            factors: {
                recordUploads: number;
                healthCopilotUsage: number;
                challengeParticipation: number;
            };
        };
    };
    overall: {
        trend: "improving" | "stable" | "declining";
        score: number;
        grade: string;
    };
    badges?: {
        name: string;
        id: string;
        earnedAt: string;
    }[] | undefined;
    streaks?: {
        habitStreak?: number | undefined;
        checkupStreak?: number | undefined;
        preventiveStreak?: number | undefined;
    } | undefined;
}>;
export type HealthScore = z.infer<typeof HealthScoreSchema>;
export declare const CorporateSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    industry: z.ZodString;
    employeeCount: z.ZodNumber;
    address: z.ZodObject<{
        line1: z.ZodString;
        line2: z.ZodString;
        city: z.ZodString;
        state: z.ZodString;
        pincode: z.ZodString;
        landmark: z.ZodString;
        coordinates: z.ZodObject<{
            lat: z.ZodNumber;
            lng: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            lat: number;
            lng: number;
        }, {
            lat: number;
            lng: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        line1: string;
        line2: string;
        city: string;
        state: string;
        pincode: string;
        landmark: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    }, {
        line1: string;
        line2: string;
        city: string;
        state: string;
        pincode: string;
        landmark: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    }>;
    contactPerson: z.ZodObject<{
        name: z.ZodString;
        email: z.ZodString;
        phone: z.ZodString;
        designation: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        email: string;
        phone: string;
        designation: string;
    }, {
        name: string;
        email: string;
        phone: string;
        designation: string;
    }>;
    subscription: z.ZodObject<{
        plan: z.ZodEnum<["basic", "standard", "premium", "enterprise"]>;
        startDate: z.ZodString;
        endDate: z.ZodString;
        features: z.ZodArray<z.ZodString, "many">;
        employeeLimit: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        startDate: string;
        endDate: string;
        plan: "basic" | "standard" | "premium" | "enterprise";
        features: string[];
        employeeLimit: number;
    }, {
        startDate: string;
        endDate: string;
        plan: "basic" | "standard" | "premium" | "enterprise";
        features: string[];
        employeeLimit: number;
    }>;
    settings: z.ZodObject<{
        allowAnonymousAggregates: z.ZodDefault<z.ZodBoolean>;
        requireConsent: z.ZodDefault<z.ZodBoolean>;
        notifyOnEnrollment: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        allowAnonymousAggregates: boolean;
        requireConsent: boolean;
        notifyOnEnrollment: boolean;
    }, {
        allowAnonymousAggregates?: boolean | undefined;
        requireConsent?: boolean | undefined;
        notifyOnEnrollment?: boolean | undefined;
    }>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    createdAt: string;
    updatedAt: string;
    address: {
        line1: string;
        line2: string;
        city: string;
        state: string;
        pincode: string;
        landmark: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    };
    isActive: boolean;
    industry: string;
    employeeCount: number;
    contactPerson: {
        name: string;
        email: string;
        phone: string;
        designation: string;
    };
    subscription: {
        startDate: string;
        endDate: string;
        plan: "basic" | "standard" | "premium" | "enterprise";
        features: string[];
        employeeLimit: number;
    };
    settings: {
        allowAnonymousAggregates: boolean;
        requireConsent: boolean;
        notifyOnEnrollment: boolean;
    };
}, {
    name: string;
    id: string;
    createdAt: string;
    updatedAt: string;
    address: {
        line1: string;
        line2: string;
        city: string;
        state: string;
        pincode: string;
        landmark: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    };
    industry: string;
    employeeCount: number;
    contactPerson: {
        name: string;
        email: string;
        phone: string;
        designation: string;
    };
    subscription: {
        startDate: string;
        endDate: string;
        plan: "basic" | "standard" | "premium" | "enterprise";
        features: string[];
        employeeLimit: number;
    };
    settings: {
        allowAnonymousAggregates?: boolean | undefined;
        requireConsent?: boolean | undefined;
        notifyOnEnrollment?: boolean | undefined;
    };
    isActive?: boolean | undefined;
}>;
export type Corporate = z.infer<typeof CorporateSchema>;
export declare const CorporateEmployeeSchema: z.ZodObject<{
    id: z.ZodString;
    corporateId: z.ZodString;
    userId: z.ZodString;
    employeeId: z.ZodString;
    department: z.ZodOptional<z.ZodString>;
    designation: z.ZodOptional<z.ZodString>;
    enrolledAt: z.ZodString;
    status: z.ZodEnum<["active", "inactive", "suspended"]>;
    wellnessBenefits: z.ZodArray<z.ZodObject<{
        type: z.ZodString;
        remaining: z.ZodNumber;
        total: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: string;
        remaining: number;
        total: number;
    }, {
        type: string;
        remaining: number;
        total: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    userId: string;
    corporateId: string;
    employeeId: string;
    status: "active" | "inactive" | "suspended";
    id: string;
    enrolledAt: string;
    wellnessBenefits: {
        type: string;
        remaining: number;
        total: number;
    }[];
    designation?: string | undefined;
    department?: string | undefined;
}, {
    userId: string;
    corporateId: string;
    employeeId: string;
    status: "active" | "inactive" | "suspended";
    id: string;
    enrolledAt: string;
    wellnessBenefits: {
        type: string;
        remaining: number;
        total: number;
    }[];
    designation?: string | undefined;
    department?: string | undefined;
}>;
export type CorporateEmployee = z.infer<typeof CorporateEmployeeSchema>;
export declare const ApiResponseSchema: <T extends z.ZodTypeAny>(dataSchema: T) => z.ZodObject<{
    success: z.ZodLiteral<true>;
    data: T;
    meta: z.ZodOptional<z.ZodObject<{
        pagination: z.ZodOptional<z.ZodObject<{
            page: z.ZodNumber;
            limit: z.ZodNumber;
            total: z.ZodNumber;
            totalPages: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            limit: number;
            total: number;
            page: number;
            totalPages: number;
        }, {
            limit: number;
            total: number;
            page: number;
            totalPages: number;
        }>>;
        requestId: z.ZodString;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        requestId: string;
        timestamp: string;
        pagination?: {
            limit: number;
            total: number;
            page: number;
            totalPages: number;
        } | undefined;
    }, {
        requestId: string;
        timestamp: string;
        pagination?: {
            limit: number;
            total: number;
            page: number;
            totalPages: number;
        } | undefined;
    }>>;
}, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    success: z.ZodLiteral<true>;
    data: T;
    meta: z.ZodOptional<z.ZodObject<{
        pagination: z.ZodOptional<z.ZodObject<{
            page: z.ZodNumber;
            limit: z.ZodNumber;
            total: z.ZodNumber;
            totalPages: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            limit: number;
            total: number;
            page: number;
            totalPages: number;
        }, {
            limit: number;
            total: number;
            page: number;
            totalPages: number;
        }>>;
        requestId: z.ZodString;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        requestId: string;
        timestamp: string;
        pagination?: {
            limit: number;
            total: number;
            page: number;
            totalPages: number;
        } | undefined;
    }, {
        requestId: string;
        timestamp: string;
        pagination?: {
            limit: number;
            total: number;
            page: number;
            totalPages: number;
        } | undefined;
    }>>;
}>, any> extends infer T_1 ? { [k in keyof T_1]: T_1[k]; } : never, z.baseObjectInputType<{
    success: z.ZodLiteral<true>;
    data: T;
    meta: z.ZodOptional<z.ZodObject<{
        pagination: z.ZodOptional<z.ZodObject<{
            page: z.ZodNumber;
            limit: z.ZodNumber;
            total: z.ZodNumber;
            totalPages: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            limit: number;
            total: number;
            page: number;
            totalPages: number;
        }, {
            limit: number;
            total: number;
            page: number;
            totalPages: number;
        }>>;
        requestId: z.ZodString;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        requestId: string;
        timestamp: string;
        pagination?: {
            limit: number;
            total: number;
            page: number;
            totalPages: number;
        } | undefined;
    }, {
        requestId: string;
        timestamp: string;
        pagination?: {
            limit: number;
            total: number;
            page: number;
            totalPages: number;
        } | undefined;
    }>>;
}> extends infer T_2 ? { [k_1 in keyof T_2]: T_2[k_1]; } : never>;
export declare const ApiErrorSchema: z.ZodObject<{
    success: z.ZodLiteral<false>;
    error: z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        requestId: z.ZodString;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        requestId: string;
        message: string;
        code: string;
        timestamp: string;
        details?: Record<string, unknown> | undefined;
    }, {
        requestId: string;
        message: string;
        code: string;
        timestamp: string;
        details?: Record<string, unknown> | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    error: {
        requestId: string;
        message: string;
        code: string;
        timestamp: string;
        details?: Record<string, unknown> | undefined;
    };
    success: false;
}, {
    error: {
        requestId: string;
        message: string;
        code: string;
        timestamp: string;
        details?: Record<string, unknown> | undefined;
    };
    success: false;
}>;
export type ApiResponse<T> = {
    success: true;
    data: T;
    meta?: {
        pagination?: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
        requestId: string;
        timestamp: string;
    };
};
export type ApiError = {
    success: false;
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
        requestId: string;
        timestamp: string;
    };
};
export declare const PaginationQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    sortOrder: "asc" | "desc";
    sortBy?: string | undefined;
}, {
    limit?: number | undefined;
    page?: number | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
export declare const PaginationMeta: (total: number, page: number, limit: number) => {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};
export * from './schemas';
