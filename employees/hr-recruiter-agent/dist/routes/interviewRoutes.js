"use strict";
/**
 * HR Recruiter Agent - Interview Routes
 * Interview scheduling and management endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.setInterviewStorage = void 0;
const express_1 = require("express");
const interviewScheduler_1 = require("../services/interviewScheduler");
const schemas_1 = require("../schemas");
const router = (0, express_1.Router)();
// In-memory storage
const interviews = new Map();
const candidates = new Map();
const jobs = new Map();
/**
 * POST /api/interviews/schedule
 * Schedule an interview
 */
router.post('/schedule', async (req, res) => {
    try {
        const validatedData = schemas_1.ScheduleInterviewSchema.parse(req.body);
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
        // Schedule interview
        const interview = interviewScheduler_1.interviewScheduler.scheduleInterview(candidate, job, validatedData, req.headers['x-user-id']?.toString() || 'system');
        interviews.set(interview.id, interview);
        // Update candidate status
        candidate.status = schemas_1.CandidateStatus.INTERVIEWING;
        candidates.set(candidate.id, candidate);
        const response = {
            success: true,
            data: interview,
        };
        res.status(201).json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: {
                code: 'SCHEDULE_ERROR',
                message: error instanceof Error ? error.message : 'Failed to schedule interview',
            },
        };
        res.status(400).json(response);
    }
});
/**
 * GET /api/interviews
 * List interviews with filtering
 */
router.get('/', async (req, res) => {
    try {
        const queryParams = {
            ...req.query,
            page: req.query.page ? parseInt(req.query.page) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : undefined,
        };
        const query = schemas_1.InterviewQuerySchema.parse(queryParams);
        let filteredInterviews = Array.from(interviews.values());
        // Apply filters
        if (query.candidateId) {
            filteredInterviews = filteredInterviews.filter(i => i.candidateId === query.candidateId);
        }
        if (query.jobId) {
            filteredInterviews = filteredInterviews.filter(i => i.jobId === query.jobId);
        }
        if (query.status && query.status.length > 0) {
            filteredInterviews = filteredInterviews.filter(i => query.status.includes(i.status));
        }
        if (query.interviewerId) {
            filteredInterviews = filteredInterviews.filter(i => i.interviewers.some(interviewer => interviewer.interviewerId === query.interviewerId));
        }
        if (query.fromDate) {
            const fromDate = new Date(query.fromDate);
            filteredInterviews = filteredInterviews.filter(i => new Date(i.scheduledAt) >= fromDate);
        }
        if (query.toDate) {
            const toDate = new Date(query.toDate);
            filteredInterviews = filteredInterviews.filter(i => new Date(i.scheduledAt) <= toDate);
        }
        // Sort by scheduled time
        filteredInterviews.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
        // Paginate
        const total = filteredInterviews.length;
        const page = query.page;
        const limit = query.limit;
        const startIndex = (page - 1) * limit;
        const paginatedInterviews = filteredInterviews.slice(startIndex, startIndex + limit);
        const response = {
            success: true,
            data: paginatedInterviews,
            meta: {
                page,
                limit,
                total,
                hasMore: startIndex + limit < total,
            },
        };
        res.status(200).json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: {
                code: 'LIST_ERROR',
                message: error instanceof Error ? error.message : 'Failed to list interviews',
            },
        };
        res.status(400).json(response);
    }
});
/**
 * GET /api/interviews/:id
 * Get interview by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const interview = interviews.get(id);
        if (!interview) {
            const response = {
                success: false,
                error: {
                    code: 'INTERVIEW_NOT_FOUND',
                    message: 'Interview not found',
                },
            };
            return res.status(404).json(response);
        }
        const response = {
            success: true,
            data: interview,
        };
        res.status(200).json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: {
                code: 'GET_ERROR',
                message: error instanceof Error ? error.message : 'Failed to get interview',
            },
        };
        res.status(400).json(response);
    }
});
/**
 * PUT /api/interviews/:id
 * Update interview
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const existingInterview = interviews.get(id);
        if (!existingInterview) {
            const response = {
                success: false,
                error: {
                    code: 'INTERVIEW_NOT_FOUND',
                    message: 'Interview not found',
                },
            };
            return res.status(404).json(response);
        }
        const validatedData = schemas_1.UpdateInterviewSchema.parse(req.body);
        let updatedInterview = existingInterview;
        if (validatedData.scheduledAt) {
            updatedInterview = interviewScheduler_1.interviewScheduler.rescheduleInterview(existingInterview, validatedData.scheduledAt);
        }
        if (validatedData.status) {
            switch (validatedData.status) {
                case schemas_1.InterviewStatus.CONFIRMED:
                    updatedInterview = interviewScheduler_1.interviewScheduler.confirmInterview(updatedInterview);
                    break;
                case schemas_1.InterviewStatus.COMPLETED:
                    updatedInterview = interviewScheduler_1.interviewScheduler.completeInterview(updatedInterview);
                    break;
                case schemas_1.InterviewStatus.CANCELLED:
                    updatedInterview = interviewScheduler_1.interviewScheduler.cancelInterview(updatedInterview, validatedData.notes || '');
                    break;
                case schemas_1.InterviewStatus.NO_SHOW:
                    updatedInterview = interviewScheduler_1.interviewScheduler.markNoShow(updatedInterview);
                    break;
                default:
                    updatedInterview.status = validatedData.status;
            }
            updatedInterview.updatedAt = new Date().toISOString();
        }
        if (validatedData.duration) {
            updatedInterview.duration = validatedData.duration;
        }
        if (validatedData.location) {
            updatedInterview.location = validatedData.location;
        }
        if (validatedData.meetingLink) {
            updatedInterview.meetingLink = validatedData.meetingLink;
        }
        if (validatedData.notes) {
            updatedInterview.notes = validatedData.notes;
        }
        interviews.set(id, updatedInterview);
        const response = {
            success: true,
            data: updatedInterview,
        };
        res.status(200).json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: {
                code: 'UPDATE_ERROR',
                message: error instanceof Error ? error.message : 'Failed to update interview',
            },
        };
        res.status(400).json(response);
    }
});
/**
 * POST /api/interviews/:id/feedback
 * Submit interview feedback
 */
router.post('/:id/feedback', async (req, res) => {
    try {
        const { id } = req.params;
        const interview = interviews.get(id);
        if (!interview) {
            const response = {
                success: false,
                error: {
                    code: 'INTERVIEW_NOT_FOUND',
                    message: 'Interview not found',
                },
            };
            return res.status(404).json(response);
        }
        const validatedData = schemas_1.SubmitFeedbackSchema.parse(req.body);
        validatedData.interviewId = id; // Ensure ID matches
        const feedback = interviewScheduler_1.interviewScheduler.submitFeedback(interview, {
            interviewerId: validatedData.interviewerId,
            interviewerName: interview.interviewers.find(i => i.interviewerId === validatedData.interviewerId)?.interviewerName || 'Unknown',
            technicalSkills: validatedData.technicalSkills,
            communication: validatedData.communication,
            problemSolving: validatedData.problemSolving,
            cultureFit: validatedData.cultureFit,
            overallScore: validatedData.overallScore,
            strengths: validatedData.strengths,
            concerns: validatedData.concerns,
            recommendation: validatedData.recommendation,
            notes: validatedData.notes,
        });
        interviews.set(id, interview);
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
 * GET /api/interviews/:id/summary
 * Get interview summary with aggregated feedback
 */
router.get('/:id/summary', async (req, res) => {
    try {
        const { id } = req.params;
        const interview = interviews.get(id);
        if (!interview) {
            const response = {
                success: false,
                error: {
                    code: 'INTERVIEW_NOT_FOUND',
                    message: 'Interview not found',
                },
            };
            return res.status(404).json(response);
        }
        const summary = interviewScheduler_1.interviewScheduler.getInterviewSummary(interview);
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
 * GET /api/interviews/:id/recommendation
 * Get hiring recommendation based on all interviews
 */
router.get('/:id/recommendation', async (req, res) => {
    try {
        const { id } = req.params;
        const interview = interviews.get(id);
        if (!interview) {
            const response = {
                success: false,
                error: {
                    code: 'INTERVIEW_NOT_FOUND',
                    message: 'Interview not found',
                },
            };
            return res.status(404).json(response);
        }
        // Get all interviews for this candidate
        const candidateInterviews = Array.from(interviews.values()).filter(i => i.candidateId === interview.candidateId);
        const recommendation = interviewScheduler_1.interviewScheduler.getHiringRecommendation(candidateInterviews);
        const response = {
            success: true,
            data: recommendation,
        };
        res.status(200).json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: {
                code: 'RECOMMENDATION_ERROR',
                message: error instanceof Error ? error.message : 'Failed to get recommendation',
            },
        };
        res.status(400).json(response);
    }
});
/**
 * POST /api/interviews/series
 * Create interview series for a candidate
 */
router.post('/series', async (req, res) => {
    try {
        const { candidateId, jobId } = req.body;
        if (!candidateId || !jobId) {
            const response = {
                success: false,
                error: {
                    code: 'MISSING_FIELDS',
                    message: 'candidateId and jobId are required',
                },
            };
            return res.status(400).json(response);
        }
        const candidate = candidates.get(candidateId);
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
        const job = jobs.get(jobId);
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
        const interviewSeries = interviewScheduler_1.interviewScheduler.createInterviewSeries(candidate, job, req.headers['x-user-id']?.toString() || 'system');
        for (const interview of interviewSeries) {
            interviews.set(interview.id, interview);
        }
        // Update candidate status
        candidate.status = schemas_1.CandidateStatus.INTERVIEWING;
        candidates.set(candidate.id, candidate);
        const response = {
            success: true,
            data: interviewSeries,
            meta: {
                total: interviewSeries.length,
            },
        };
        res.status(201).json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: {
                code: 'SERIES_ERROR',
                message: error instanceof Error ? error.message : 'Failed to create interview series',
            },
        };
        res.status(400).json(response);
    }
});
/**
 * GET /api/interviews/available-slots
 * Find available interview slots
 */
router.get('/available-slots', async (req, res) => {
    try {
        const { interviewerIds, date, duration, count } = req.query;
        if (!interviewerIds || !date) {
            const response = {
                success: false,
                error: {
                    code: 'MISSING_FIELDS',
                    message: 'interviewerIds and date are required',
                },
            };
            return res.status(400).json(response);
        }
        const ids = interviewerIds.split(',');
        const slots = interviewScheduler_1.interviewScheduler.findAvailableSlots(ids, new Date(date), parseInt(duration) || 60, parseInt(count) || 5);
        const response = {
            success: true,
            data: slots,
        };
        res.status(200).json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: {
                code: 'SLOTS_ERROR',
                message: error instanceof Error ? error.message : 'Failed to find available slots',
            },
        };
        res.status(400).json(response);
    }
});
// Export storage access for other routes
const setInterviewStorage = (key, value) => {
    if (key === 'candidates') {
        Object.assign(candidates, value);
    }
    else if (key === 'jobs') {
        Object.assign(jobs, value);
    }
};
exports.setInterviewStorage = setInterviewStorage;
exports.default = router;
//# sourceMappingURL=interviewRoutes.js.map