"use strict";
/**
 * HR Recruiter Agent - Database Models & Storage
 * MongoDB-like in-memory storage with persistence support
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = exports.StorageRegistry = exports.OnboardingStorage = exports.InterviewStorage = exports.ResumeStorage = exports.JobStorage = exports.CandidateStorage = void 0;
// ============================================
// BASE STORAGE CLASS
// ============================================
class BaseStorage {
    items = new Map();
    indexFields = [];
    constructor(indexFields = []) {
        this.indexFields = indexFields;
    }
    // CRUD Operations
    create(id, data) {
        this.items.set(id, data);
        return data;
    }
    get(id) {
        return this.items.get(id);
    }
    update(id, data) {
        const existing = this.items.get(id);
        if (!existing)
            return undefined;
        const updated = { ...existing, ...data, id: existing.id };
        this.items.set(id, updated);
        return updated;
    }
    delete(id) {
        return this.items.delete(id);
    }
    getAll() {
        return Array.from(this.items.values());
    }
    find(predicate) {
        return Array.from(this.items.values()).filter(predicate);
    }
    query(options) {
        let results = Array.from(this.items.values());
        // Apply filters
        if (options.filters) {
            for (const [field, value] of Object.entries(options.filters)) {
                if (value !== undefined && value !== null) {
                    results = results.filter(item => {
                        const itemValue = item[field];
                        if (Array.isArray(value)) {
                            return value.includes(itemValue);
                        }
                        return itemValue === value;
                    });
                }
            }
        }
        // Apply sorting
        if (options.sort) {
            const { field, order } = options.sort;
            results.sort((a, b) => {
                const aVal = a[field];
                const bVal = b[field];
                if (aVal === bVal)
                    return 0;
                if (aVal === undefined)
                    return 1;
                if (bVal === undefined)
                    return -1;
                if (aVal === null)
                    return 1;
                if (bVal === null)
                    return -1;
                const comparison = aVal < bVal ? -1 : 1;
                return order === 'desc' ? -comparison : comparison;
            });
        }
        // Apply pagination
        const page = options.page || 1;
        const limit = options.limit || 20;
        const startIndex = (page - 1) * limit;
        const paginatedResults = results.slice(startIndex, startIndex + limit);
        return {
            data: paginatedResults,
            total: results.length,
            page,
            limit,
            hasMore: startIndex + limit < results.length,
        };
    }
    count(predicate) {
        if (!predicate)
            return this.items.size;
        return Array.from(this.items.values()).filter(predicate).length;
    }
    clear() {
        this.items.clear();
    }
    // Serialization for persistence
    serialize() {
        return JSON.stringify(Array.from(this.items.entries()));
    }
    deserialize(data) {
        try {
            const entries = JSON.parse(data);
            this.items = new Map(entries);
        }
        catch (error) {
            console.error('Failed to deserialize storage:', error);
        }
    }
}
// ============================================
// CANDIDATE STORAGE
// ============================================
class CandidateStorage extends BaseStorage {
    constructor() {
        super(['tenantId', 'status', 'jobId', 'source']);
    }
    findByStatus(status) {
        return this.find(c => c.status === status);
    }
    findByJob(jobId) {
        return this.find(c => c.jobId === jobId);
    }
    findByTenant(tenantId) {
        return this.find(c => c.tenantId === tenantId);
    }
    findBySkills(skills) {
        return this.find(c => c.skills.some(s => skills.includes(s.name)));
    }
    search(query) {
        const lowerQuery = query.toLowerCase();
        return this.find(c => c.firstName.toLowerCase().includes(lowerQuery) ||
            c.lastName.toLowerCase().includes(lowerQuery) ||
            c.contact.email.toLowerCase().includes(lowerQuery) ||
            (c.headline ? c.headline.toLowerCase().includes(lowerQuery) : false));
    }
    withMinimumRating(rating) {
        return this.find(c => (c.rating || 0) >= rating);
    }
}
exports.CandidateStorage = CandidateStorage;
// ============================================
// JOB STORAGE
// ============================================
class JobStorage extends BaseStorage {
    constructor() {
        super(['tenantId', 'status', 'department', 'location']);
    }
    findActive() {
        return this.find(j => j.status === 'active');
    }
    findByDepartment(department) {
        return this.find(j => j.department.toLowerCase().includes(department.toLowerCase()));
    }
    findByLocation(location) {
        return this.find(j => j.location.toLowerCase().includes(location.toLowerCase()));
    }
    findByHiringManager(managerId) {
        return this.find(j => j.hiringManagerId === managerId);
    }
}
exports.JobStorage = JobStorage;
// ============================================
// RESUME STORAGE
// ============================================
class ResumeStorage extends BaseStorage {
    constructor() {
        super(['candidateId']);
    }
    findByCandidate(candidateId) {
        return this.find(r => r.candidateId === candidateId)[0];
    }
    findWithScreeningResult() {
        return this.find(r => r.screeningResult !== undefined);
    }
    findByRecommendation(recommendation) {
        return this.find(r => r.screeningResult?.recommendation === recommendation);
    }
}
exports.ResumeStorage = ResumeStorage;
// ============================================
// INTERVIEW STORAGE
// ============================================
class InterviewStorage extends BaseStorage {
    constructor() {
        super(['candidateId', 'jobId', 'status']);
    }
    findByCandidate(candidateId) {
        return this.find(i => i.candidateId === candidateId);
    }
    findByJob(jobId) {
        return this.find(i => i.jobId === jobId);
    }
    findByStatus(status) {
        return this.find(i => i.status === status);
    }
    findUpcoming(days = 7) {
        const now = new Date();
        const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        return this.find(i => {
            const scheduledAt = new Date(i.scheduledAt);
            return scheduledAt >= now && scheduledAt <= future;
        });
    }
    findByDateRange(from, to) {
        return this.find(i => {
            const scheduledAt = new Date(i.scheduledAt);
            return scheduledAt >= from && scheduledAt <= to;
        });
    }
    findByInterviewer(interviewerId) {
        return this.find(i => i.interviewers.some(interviewer => interviewer.interviewerId === interviewerId));
    }
}
exports.InterviewStorage = InterviewStorage;
// ============================================
// ONBOARDING STORAGE
// ============================================
class OnboardingStorage extends BaseStorage {
    constructor() {
        super(['candidateId', 'jobId', 'status']);
    }
    findByCandidate(candidateId) {
        return this.find(o => o.candidateId === candidateId)[0];
    }
    findByJob(jobId) {
        return this.find(o => o.jobId === jobId);
    }
    findByStatus(status) {
        return this.find(o => o.status === status);
    }
    findByManager(managerId) {
        return this.find(o => o.managerId === managerId);
    }
    findInProgress() {
        return this.find(o => o.status !== 'completed' && o.status !== 'failed');
    }
    findCompleted() {
        return this.find(o => o.status === 'completed');
    }
    findPendingDocuments() {
        return this.find(o => o.documents.some(d => d.required && d.status === 'pending'));
    }
}
exports.OnboardingStorage = OnboardingStorage;
// ============================================
// STORAGE REGISTRY
// ============================================
class StorageRegistry {
    static instance;
    storage;
    constructor() {
        this.storage = {
            candidates: new CandidateStorage(),
            jobs: new JobStorage(),
            resumes: new ResumeStorage(),
            interviews: new InterviewStorage(),
            onboardings: new OnboardingStorage(),
        };
    }
    static getInstance() {
        if (!StorageRegistry.instance) {
            StorageRegistry.instance = new StorageRegistry();
        }
        return StorageRegistry.instance;
    }
    get candidates() {
        return this.storage.candidates;
    }
    get jobs() {
        return this.storage.jobs;
    }
    get resumes() {
        return this.storage.resumes;
    }
    get interviews() {
        return this.storage.interviews;
    }
    get onboardings() {
        return this.storage.onboardings;
    }
    // Serialization
    serialize() {
        return JSON.stringify({
            candidates: this.storage.candidates.serialize(),
            jobs: this.storage.jobs.serialize(),
            resumes: this.storage.resumes.serialize(),
            interviews: this.storage.interviews.serialize(),
            onboardings: this.storage.onboardings.serialize(),
        });
    }
    deserialize(data) {
        try {
            const parsed = JSON.parse(data);
            if (parsed.candidates)
                this.storage.candidates.deserialize(parsed.candidates);
            if (parsed.jobs)
                this.storage.jobs.deserialize(parsed.jobs);
            if (parsed.resumes)
                this.storage.resumes.deserialize(parsed.resumes);
            if (parsed.interviews)
                this.storage.interviews.deserialize(parsed.interviews);
            if (parsed.onboardings)
                this.storage.onboardings.deserialize(parsed.onboardings);
        }
        catch (error) {
            console.error('Failed to deserialize storage registry:', error);
        }
    }
    clearAll() {
        this.storage.candidates.clear();
        this.storage.jobs.clear();
        this.storage.resumes.clear();
        this.storage.interviews.clear();
        this.storage.onboardings.clear();
    }
}
exports.StorageRegistry = StorageRegistry;
// Export singleton instance
exports.storage = StorageRegistry.getInstance();
//# sourceMappingURL=storage.js.map