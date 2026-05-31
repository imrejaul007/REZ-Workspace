/**
 * HR Recruiter Agent - Onboarding Manager Service
 * Complete employee onboarding workflow management
 */
import { OnboardingWorkflow, OnboardingChecklist, OnboardingDocument, OnboardingStatus, EquipmentRequest, TrainingEnrollment, OnboardingFeedback, Candidate, Job } from '../types';
interface OnboardingManagerConfig {
    defaultDurationDays: number;
    autoSendDocuments: boolean;
    autoAssignBuddy: boolean;
}
interface OnboardingTemplate {
    id: string;
    name: string;
    description: string;
    checklists: Omit<OnboardingChecklist, 'id' | 'completedAt' | 'status'>[];
    documents: Omit<OnboardingDocument, 'id' | 'status' | 'fileUrl' | 'signedAt'>[];
    trainingPrograms: {
        trainingProgramId: string;
        name: string;
        description?: string;
        duration: number;
    }[];
}
export declare class OnboardingManager {
    private config;
    private templates;
    constructor(config?: Partial<OnboardingManagerConfig>);
    /**
     * Initialize default onboarding templates
     */
    private initializeDefaultTemplates;
    /**
     * Start onboarding workflow
     */
    startOnboarding(candidate: Candidate, job: Job, input: {
        startDate: string;
        targetCompletionDate?: string;
        managerId: string;
        managerName: string;
        buddyId?: string;
        buddyName?: string;
        templateId?: string;
        customChecklists?: {
            name: string;
            category: OnboardingChecklist['category'];
            description: string;
            assigneeId?: string;
            dueDate?: string;
            order: number;
        }[];
    }): OnboardingWorkflow;
    /**
     * Get appropriate template
     */
    private getTemplate;
    /**
     * Calculate target completion date
     */
    private calculateTargetDate;
    /**
     * Build checklists from template and custom input
     */
    private buildChecklists;
    /**
     * Build documents from template
     */
    private buildDocuments;
    /**
     * Calculate document due date based on relative date
     */
    private calculateDocumentDueDate;
    /**
     * Build training enrollments
     */
    private buildTrainingEnrollments;
    /**
     * Build equipment requests based on job
     */
    private buildEquipmentRequests;
    /**
     * Update onboarding status based on progress
     */
    updateStatus(onboarding: OnboardingWorkflow): void;
    /**
     * Calculate onboarding progress
     */
    private calculateProgress;
    /**
     * Determine current status
     */
    private determineStatus;
    /**
     * Complete a checklist item
     */
    completeChecklistItem(onboarding: OnboardingWorkflow, checklistId: string, completedAt?: string): OnboardingChecklist;
    /**
     * Skip a checklist item
     */
    skipChecklistItem(onboarding: OnboardingWorkflow, checklistId: string): OnboardingChecklist;
    /**
     * Update document status
     */
    updateDocumentStatus(onboarding: OnboardingWorkflow, documentId: string, status: OnboardingDocument['status'], fileUrl?: string): OnboardingDocument;
    /**
     * Update equipment status
     */
    updateEquipmentStatus(onboarding: OnboardingWorkflow, equipmentId: string, status: EquipmentRequest['status'], trackingNumber?: string): EquipmentRequest;
    /**
     * Update training progress
     */
    updateTrainingProgress(onboarding: OnboardingWorkflow, trainingId: string, progress: number, status?: TrainingEnrollment['status']): TrainingEnrollment;
    /**
     * Submit onboarding feedback
     */
    submitFeedback(onboarding: OnboardingWorkflow, feedback: Omit<OnboardingFeedback, 'submittedAt'>): OnboardingFeedback;
    /**
     * Get onboarding summary
     */
    getOnboardingSummary(onboarding: OnboardingWorkflow): {
        progress: number;
        status: OnboardingStatus;
        daysRemaining: number;
        overdueItems: {
            type: string;
            name: string;
            dueDate: string;
        }[];
        upcomingItems: {
            type: string;
            name: string;
            dueDate: string;
        }[];
        completedItems: {
            type: string;
            name: string;
            completedAt: string;
        }[];
        feedbackSummary?: {
            averageSatisfaction: number;
            submittedFeedback: number;
        };
    };
    /**
     * Get checklist by category
     */
    getChecklistsByCategory(onboarding: OnboardingWorkflow, category?: OnboardingChecklist['category']): OnboardingChecklist[];
    /**
     * Get pending items count
     */
    getPendingItemsCount(onboarding: OnboardingWorkflow): {
        documents: number;
        checklists: number;
        training: number;
        equipment: number;
        total: number;
    };
    /**
     * Create custom template
     */
    createTemplate(template: Omit<OnboardingTemplate, 'id'>): OnboardingTemplate;
    /**
     * Get all templates
     */
    getTemplates(): OnboardingTemplate[];
}
export declare const onboardingManager: OnboardingManager;
export {};
//# sourceMappingURL=onboardingManager.d.ts.map