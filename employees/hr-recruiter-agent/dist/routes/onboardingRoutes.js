"use strict";
/**
 * HR Recruiter Agent - Onboarding Routes
 * Onboarding workflow management endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setOnboardingStorage = void 0;
const express_1 = require("express");
const onboardingManager_1 = require("../services/onboardingManager");
const schemas_1 = require("../schemas");
const router = (0, express_1.Router)();
// In-memory storage
const onboardings = new Map();
const candidates = new Map();
const jobs = new Map();
/**
 * POST /api/onboarding/start
 * Start onboarding workflow
 */
router.post('/start', async (req, res) => {
    try {
        const validatedData = schemas_1.StartOnboardingSchema.parse(req.body);
        // Get candidate
        const candidate = candidates.get(validatedData.candidateId);
        if (!candidate) {
            const response = {
                success: false,
                error: {
                    code: 'CANDIDATE_NOT_FOUND',
                    message: 'Candidate not found',
                },
            };
            return res.status(404).json(response);
        }
        // Get job
        const job = jobs.get(validatedData.jobId);
        if (!job) {
            const response = {
                success: false,
                error: {
                    code: 'JOB_NOT_FOUND',
                    message: 'Job not found',
                },
            };
            return res.status(404).json(response);
        }
        // Start onboarding
        const onboarding = onboardingManager_1.onboardingManager.startOnboarding(candidate, job, {
            startDate: validatedData.startDate,
            targetCompletionDate: validatedData.targetCompletionDate,
            managerId: validatedData.managerId,
            managerName: 'Manager', // Would come from user service
            buddyId: validatedData.buddyId,
            buddyName: validatedData.buddyId ? 'Buddy' : undefined,
            templateId: validatedData.templateId,
            customChecklists: validatedData.customChecklists,
        });
        onboardings.set(onboarding.id, onboarding);
        // Update candidate status
        candidate.status = schemas_1.CandidateStatus.HIRED;
        candidates.set(candidate.id, candidate);
        const response = {
            success: true,
            data: onboarding,
        };
        res.status(201).json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: {
                code: 'START_ERROR',
                message: error instanceof Error ? error.message : 'Failed to start onboarding',
            },
        };
        res.status(400).json(response);
    }
});
/**
 * GET /api/onboarding
 * List onboarding workflows
 */
router.get('/', async (req, res) => {
    try {
        const { candidateId, jobId, status, page = '1', limit = '20' } = req.query;
        let filteredOnboardings = Array.from(onboardings.values());
        // Apply filters
        if (candidateId) {
            filteredOnboardings = filteredOnboardings.filter(o => o.candidateId === candidateId);
        }
        if (jobId) {
            filteredOnboardings = filteredOnboardings.filter(o => o.jobId === jobId);
        }
        if (status) {
            filteredOnboardings = filteredOnboardings.filter(o => o.status === status);
        }
        // Sort by creation date
        filteredOnboardings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        // Paginate
        const total = filteredOnboardings.length;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const startIndex = (pageNum - 1) * limitNum;
        const paginatedOnboardings = filteredOnboardings.slice(startIndex, startIndex + limitNum);
        const response = {
            success: true,
            data: paginatedOnboardings,
            meta: {
                page: pageNum,
                limit: limitNum,
                total,
                hasMore: startIndex + limitNum < total,
            },
        };
        res.status(200).json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: {
                code: 'LIST_ERROR',
                message: error instanceof Error ? error.message : 'Failed to list onboarding workflows',
            },
        };
        res.status(400).json(response);
    }
});
/**
 * GET /api/onboarding/:id
 * Get onboarding by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const onboarding = onboardings.get(id);
        if (!onboarding) {
            const response = {
                success: false,
                error: {
                    code: 'ONBOARDING_NOT_FOUND',
                    message: 'Onboarding workflow not found',
                },
            };
            return res.status(404).json(response);
        }
        const response = {
            success: true,
            data: onboarding,
        };
        res.status(200).json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: {
                code: 'GET_ERROR',
                message: error instanceof Error ? error.message : 'Failed to get onboarding',
            },
        };
        res.status(400).json(response);
    }
});
/**
 * PUT /api/onboarding/:id
 * Update onboarding
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const existingOnboarding = onboardings.get(id);
        if (!existingOnboarding) {
            const response = {
                success: false,
                error: {
                    code: 'ONBOARDING_NOT_FOUND',
                    message: 'Onboarding workflow not found',
                },
            };
            return res.status(404).json(response);
        }
        const validatedData = schemas_1.UpdateOnboardingSchema.parse(req.body);
        // Apply updates
        if (validatedData.status) {
            existingOnboarding.status = validatedData.status;
            onboardingManager_1.onboardingManager.updateStatus(existingOnboarding);
        }
        if (validatedData.targetCompletionDate) {
            existingOnboarding.targetCompletionDate = validatedData.targetCompletionDate;
        }
        if (validatedData.managerId) {
            existingOnboarding.managerId = validatedData.managerId;
        }
        if (validatedData.buddyId !== undefined) {
            existingOnboarding.buddyId = validatedData.buddyId;
        }
        if (validatedData.notes) {
            existingOnboarding.notes = validatedData.notes;
        }
        existingOnboarding.updatedAt = new Date().toISOString();
        onboardings.set(id, existingOnboarding);
        const response = {
            success: true,
            data: existingOnboarding,
        };
        res.status(200).json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: {
                code: 'UPDATE_ERROR',
                message: error instanceof Error ? error.message : 'Failed to update onboarding',
            },
        };
        res.status(400).json(response);
    }
});
/**
 * POST /api/onboarding/:id/checklist
 * Complete a checklist item
 */
router.post('/:id/checklist', async (req, res) => {
    try {
        const { id } = req.params;
        const { checklistId, completedAt } = req.body;
        if (!checklistId) {
            const response = {
                success: false,
                error: {
                    code: 'MISSING_CHECKLIST_ID',
                    message: 'checklistId is required',
                },
            };
            return res.status(400).json(response);
        }
        const onboarding = onboardings.get(id);
        if (!onboarding) {
            const response = {
                success: false,
                error: {
                    code: 'ONBOARDING_NOT_FOUND',
                    message: 'Onboarding workflow not found',
                },
            };
            return res.status(404).json(response);
        }
        const completedItem = onboardingManager_1.onboardingManager.completeChecklistItem(onboarding, checklistId, completedAt);
        onboardings.set(id, onboarding);
        const response = {
            success: true,
            data: completedItem,
        };
        res.status(200).json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: {
                code: 'CHECKLIST_ERROR',
                message: error instanceof Error ? error.message : 'Failed to complete checklist item',
            },
        };
        res.status(400).json(response);
    }
});
/**
 * POST /api/onboarding/:id/checklist/skip
 * Skip a checklist item
 */
router.post('/:id/checklist/skip', async (req, res) => {
    try {
        const { id } = req.params;
        const { checklistId } = req.body;
        if (!checklistId) {
            const response = {
                success: false,
                error: {
                    code: 'MISSING_CHECKLIST_ID',
                    message: 'checklistId is required',
                },
            };
            return res.status(400).json(response);
        }
        const onboarding = onboardings.get(id);
        if (!onboarding) {
            const response = {
                success: false,
                error: {
                    code: 'ONBOARDING_NOT_FOUND',
                    message: 'Onboarding workflow not found',
                },
            };
            return res.status(404).json(response);
        }
        const skippedItem = onboardingManager_1.onboardingManager.skipChecklistItem(onboarding, checklistId);
        onboardings.set(id, onboarding);
        const response = {
            success: true,
            data: skippedItem,
        };
        res.status(200).json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: {
                code: 'SKIP_ERROR',
                message: error instanceof Error ? error.message : 'Failed to skip checklist item',
            },
        };
        res.status(400).json(response);
    }
});
/**
 * PUT /api/onboarding/:id/document/:docId
 * Update document status
 */
router.put('/:id/document/:docId', async (req, res) => {
    try {
        const { id, docId } = req.params;
        const { status, fileUrl } = req.body;
        const onboarding = onboardings.get(id);
        if (!onboarding) {
            const response = {
                success: false,
                error: {
                    code: 'ONBOARDING_NOT_FOUND',
                    message: 'Onboarding workflow not found',
                },
            };
            return res.status(404).json(response);
        }
        const updatedDoc = onboardingManager_1.onboardingManager.updateDocumentStatus(onboarding, docId, status, fileUrl);
        onboardings.set(id, onboarding);
        const response = {
            success: true,
            data: updatedDoc,
        };
        res.status(200).json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: {
                code: 'DOCUMENT_ERROR',
                message: error instanceof Error ? error.message : 'Failed to update document',
            },
        };
        res.status(400).json(response);
    }
});
/**
 * PUT /api/onboarding/:id/equipment/:equipId
 * Update equipment status
 */
router.put('/:id/equipment/:equipId', async (req, res) => {
    try {
        const { id, equipId } = req.params;
        const { status, trackingNumber } = req.body;
        const onboarding = onboardings.get(id);
        if (!onboarding) {
            const response = {
                success: false,
                error: {
                    code: 'ONBOARDING_NOT_FOUND',
                    message: 'Onboarding workflow not found',
                },
            };
            return res.status(404).json(response);
        }
        const updatedEquipment = onboardingManager_1.onboardingManager.updateEquipmentStatus(onboarding, equipId, status, trackingNumber);
        onboardings.set(id, onboarding);
        const response = {
            success: true,
            data: updatedEquipment,
        };
        res.status(200).json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: {
                code: 'EQUIPMENT_ERROR',
                message: error instanceof Error ? error.message : 'Failed to update equipment',
            },
        };
        res.status(400).json(response);
    }
});
/**
 * PUT /api/onboarding/:id/training/:trainingId
 * Update training progress
 */
router.put('/:id/training/:trainingId', async (req, res) => {
    try {
        const { id, trainingId } = req.params;
        const { progress, status } = req.body;
        if (typeof progress !== 'number') {
            const response = {
                success: false,
                error: {
                    code: 'INVALID_PROGRESS',
                    message: 'progress must be a number',
                },
            };
            return res.status(400).json(response);
        }
        const onboarding = onboardings.get(id);
        if (!onboarding) {
            const response = {
                success: false,
                error: {
                    code: 'ONBOARDING_NOT_FOUND',
                    message: 'Onboarding workflow not found',
                },
            };
            return res.status(404).json(response);
        }
        const updatedTraining = onboardingManager_1.onboardingManager.updateTrainingProgress(onboarding, trainingId, progress, status);
        onboardings.set(id, onboarding);
        const response = {
            success: true,
            data: updatedTraining,
        };
        res.status(200).json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: {
                code: 'TRAINING_ERROR',
                message: error instanceof Error ? error.message : 'Failed to update training',
            },
        };
        res.status(400).json(response);
    }
});
/**
 * POST /api/onboarding/:id/feedback
 * Submit onboarding feedback
 */
router.post('/:id/feedback', async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = schemas_1.SubmitOnboardingFeedbackSchema.parse(req.body);
        const onboarding = onboardings.get(id);
        if (!onboarding) {
            const response = {
                success: false,
                error: {
                    code: 'ONBOARDING_NOT_FOUND',
                    message: 'Onboarding workflow not found',
                },
            };
            return res.status(404).json(response);
        }
        const feedback = onboardingManager_1.onboardingManager.submitFeedback(onboarding, {
            ...validatedData,
            submittedBy: req.headers['x-user-id']?.toString() || 'system',
            submittedByName: 'Employee',
        });
        onboardings.set(id, onboarding);
        const response = {
            success: true,
            data: feedback,
        };
        res.status(201).json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: {
                code: 'FEEDBACK_ERROR',
                message: error instanceof Error ? error.message : 'Failed to submit feedback',
            },
        };
        res.status(400).json(response);
    }
});
/**
 * GET /api/onboarding/:id/summary
 * Get onboarding summary
 */
router.get('/:id/summary', async (req, res) => {
    try {
        const { id } = req.params;
        const onboarding = onboardings.get(id);
        if (!onboarding) {
            const response = {
                success: false,
                error: {
                    code: 'ONBOARDING_NOT_FOUND',
                    message: 'Onboarding workflow not found',
                },
            };
            return res.status(404).json(response);
        }
        const summary = onboardingManager_1.onboardingManager.getOnboardingSummary(onboarding);
        const response = {
            success: true,
            data: summary,
        };
        res.status(200).json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: {
                code: 'SUMMARY_ERROR',
                message: error instanceof Error ? error.message : 'Failed to get summary',
            },
        };
        res.status(400).json(response);
    }
});
/**
 * GET /api/onboarding/:id/checklists
 * Get checklists by category
 */
router.get('/:id/checklists', async (req, res) => {
    try {
        const { id } = req.params;
        const { category } = req.query;
        const onboarding = onboardings.get(id);
        if (!onboarding) {
            const response = {
                success: false,
                error: {
                    code: 'ONBOARDING_NOT_FOUND',
                    message: 'Onboarding workflow not found',
                },
            };
            return res.status(404).json(response);
        }
        const checklists = onboardingManager_1.onboardingManager.getChecklistsByCategory(onboarding, category);
        const response = {
            success: true,
            data: checklists,
        };
        res.status(200).json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: {
                code: 'CHECKLISTS_ERROR',
                message: error instanceof Error ? error.message : 'Failed to get checklists',
            },
        };
        res.status(400).json(response);
    }
});
/**
 * GET /api/onboarding/:id/pending
 * Get pending items count
 */
router.get('/:id/pending', async (req, res) => {
    try {
        const { id } = req.params;
        const onboarding = onboardings.get(id);
        if (!onboarding) {
            const response = {
                success: false,
                error: {
                    code: 'ONBOARDING_NOT_FOUND',
                    message: 'Onboarding workflow not found',
                },
            };
            return res.status(404).json(response);
        }
        const pending = onboardingManager_1.onboardingManager.getPendingItemsCount(onboarding);
        const response = {
            success: true,
            data: pending,
        };
        res.status(200).json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: {
                code: 'PENDING_ERROR',
                message: error instanceof Error ? error.message : 'Failed to get pending items',
            },
        };
        res.status(400).json(response);
    }
});
/**
 * GET /api/onboarding/templates
 * Get onboarding templates
 */
router.get('/templates', async (req, res) => {
    try {
        const templates = onboardingManager_1.onboardingManager.getTemplates();
        const response = {
            success: true,
            data: templates,
        };
        res.status(200).json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: {
                code: 'TEMPLATES_ERROR',
                message: error instanceof Error ? error.message : 'Failed to get templates',
            },
        };
        res.status(400).json(response);
    }
});
// Export storage setters
const setOnboardingStorage = (key, value) => {
    if (key === 'candidates') {
        Object.assign(candidates, value);
    }
    else if (key === 'jobs') {
        Object.assign(jobs, value);
    }
};
exports.setOnboardingStorage = setOnboardingStorage;
exports.default = router;
//# sourceMappingURL=onboardingRoutes.js.map