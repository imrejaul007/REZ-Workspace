/**
 * HR Recruiter Agent - Database Models & Storage
 * MongoDB-like in-memory storage with persistence support
 */
import type { Candidate, Job, Resume, InterviewSchedule, OnboardingWorkflow, ScreeningResult } from '../types';
interface QueryOptions<T> {
    filters?: Partial<Record<keyof T, any>>;
    sort?: {
        field: keyof T;
        order: 'asc' | 'desc';
    };
    page?: number;
    limit?: number;
}
interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}
declare abstract class BaseStorage<T extends {
    id: string;
}> {
    protected items: Map<string, T>;
    protected indexFields: (keyof T)[];
    constructor(indexFields?: (keyof T)[]);
    create(id: string, data: T): T;
    get(id: string): T | undefined;
    update(id: string, data: Partial<T>): T | undefined;
    delete(id: string): boolean;
    getAll(): T[];
    find(predicate: (item: T) => boolean): T[];
    query(options: QueryOptions<T>): PaginatedResult<T>;
    count(predicate?: (item: T) => boolean): number;
    clear(): void;
    serialize(): string;
    deserialize(data: string): void;
}
export declare class CandidateStorage extends BaseStorage<Candidate> {
    constructor();
    findByStatus(status: Candidate['status']): Candidate[];
    findByJob(jobId: string): Candidate[];
    findByTenant(tenantId: string): Candidate[];
    findBySkills(skills: string[]): Candidate[];
    search(query: string): Candidate[];
    withMinimumRating(rating: number): Candidate[];
}
export declare class JobStorage extends BaseStorage<Job> {
    constructor();
    findActive(): Job[];
    findByDepartment(department: string): Job[];
    findByLocation(location: string): Job[];
    findByHiringManager(managerId: string): Job[];
}
export declare class ResumeStorage extends BaseStorage<Resume> {
    constructor();
    findByCandidate(candidateId: string): Resume | undefined;
    findWithScreeningResult(): Resume[];
    findByRecommendation(recommendation: ScreeningResult['recommendation']): Resume[];
}
export declare class InterviewStorage extends BaseStorage<InterviewSchedule> {
    constructor();
    findByCandidate(candidateId: string): InterviewSchedule[];
    findByJob(jobId: string): InterviewSchedule[];
    findByStatus(status: InterviewSchedule['status']): InterviewSchedule[];
    findUpcoming(days?: number): InterviewSchedule[];
    findByDateRange(from: Date, to: Date): InterviewSchedule[];
    findByInterviewer(interviewerId: string): InterviewSchedule[];
}
export declare class OnboardingStorage extends BaseStorage<OnboardingWorkflow> {
    constructor();
    findByCandidate(candidateId: string): OnboardingWorkflow | undefined;
    findByJob(jobId: string): OnboardingWorkflow[];
    findByStatus(status: OnboardingWorkflow['status']): OnboardingWorkflow[];
    findByManager(managerId: string): OnboardingWorkflow[];
    findInProgress(): OnboardingWorkflow[];
    findCompleted(): OnboardingWorkflow[];
    findPendingDocuments(): OnboardingWorkflow[];
}
export declare class StorageRegistry {
    private static instance;
    private storage;
    private constructor();
    static getInstance(): StorageRegistry;
    get candidates(): CandidateStorage;
    get jobs(): JobStorage;
    get resumes(): ResumeStorage;
    get interviews(): InterviewStorage;
    get onboardings(): OnboardingStorage;
    serialize(): string;
    deserialize(data: string): void;
    clearAll(): void;
}
export declare const storage: StorageRegistry;
export {};
//# sourceMappingURL=storage.d.ts.map