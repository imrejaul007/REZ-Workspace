"use strict";
/**
 * HR Recruiter Agent - Resume Routes
 * Resume screening and parsing endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uuid_1 = require("uuid");
const resumeScreener_1 = require("../services/resumeScreener");
const schemas_1 = require("../schemas");
const types_1 = require("../types");
const router = (0, express_1.Router)();
// In-memory storage (replace with database in production)
const resumes = new Map();
const candidates = new Map();
/**
 * POST /api/resumes/parse
 * Parse resume text into structured data
 */
router.post('/parse', async (req, res) => {
    try {
        const validatedData = schemas_1.ResumeParseSchema.parse(req.body);
        // Get or create candidate
        let candidate = candidates.get(validatedData.candidateId);
        if (!candidate) {
            candidate = {
                id: validatedData.candidateId,
                tenantId: 'default',
                firstName: 'Unknown',
                lastName: 'Candidate',
                contact: { email: '' },
                status: types_1.CandidateStatus.NEW,
                experience: [],
                education: [],
                skills: [],
                certifications: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: 'system',
            };
            candidates.set(candidate.id, candidate);
        }
        // Parse resume
        const resume = resumeScreener_1.resumeScreener.parseResume(validatedData.resumeText, validatedData.candidateId, validatedData.fileName);
        resumes.set(resume.id, resume);
        // Update candidate with parsed data
        candidate.resumeId = resume.id;
        candidate.firstName = resume.parsedData.name.split(' ')[0] || candidate.firstName;
        candidate.lastName = resume.parsedData.name.split(' ').slice(1).join(' ') || candidate.lastName;
        if (resume.parsedData.email) {
            candidate.contact.email = resume.parsedData.email;
        }
        if (resume.parsedData.phone) {
            candidate.contact.phone = resume.parsedData.phone;
        }
        candidate.experience = resume.parsedData.experience;
        candidate.education = resume.parsedData.education;
        candidate.skills = resume.parsedData.skills.map(s => ({ name: s, level: 'intermediate' }));
        candidate.summary = resume.parsedData.summary;
        candidate.updatedAt = new Date().toISOString();
        const response = {
            success: true,
            data: resume,
        };
        res.status(201).json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: {
                code: 'PARSE_ERROR',
                message: error instanceof Error ? error.message : 'Failed to parse resume',
            },
        };
        res.status(400).json(response);
    }
});
/**
 * POST /api/resumes/screen
 * Screen a resume against criteria
 */
router.post('/screen', async (req, res) => {
    try {
        const validatedData = schemas_1.ScreenResumeSchema.parse(req.body);
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
        // Parse resume if not already parsed
        let resume = Array.from(resumes.values()).find(r => r.candidateId === validatedData.candidateId);
        if (!resume) {
            resume = resumeScreener_1.resumeScreener.parseResume(validatedData.resumeText, validatedData.candidateId);
            resumes.set(resume.id, resume);
        }
        // Screen resume
        const criteria = validatedData.criteria;
        const screeningResult = resumeScreener_1.resumeScreener.screenResume(resume, criteria, 'system');
        // Store screening result
        resume.screeningResult = screeningResult;
        resumes.set(resume.id, resume);
        // Update candidate status
        if (screeningResult.recommendation === 'strong_yes' || screeningResult.recommendation === 'yes') {
            candidate.status = types_1.CandidateStatus.QUALIFIED;
        }
        else if (screeningResult.recommendation === 'neutral') {
            candidate.status = types_1.CandidateStatus.SCREENING;
        }
        else {
            candidate.status = types_1.CandidateStatus.REJECTED;
        }
        candidate.updatedAt = new Date().toISOString();
        const response = {
            success: true,
            data: screeningResult,
        };
        res.status(200).json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: {
                code: 'SCREENING_ERROR',
                message: error instanceof Error ? error.message : 'Failed to screen resume',
            },
        };
        res.status(400).json(response);
    }
});
/**
 * POST /api/resumes/screen-batch
 * Screen multiple resumes
 */
router.post('/screen-batch', async (req, res) => {
    try {
        const { resumes: resumeTexts, criteria } = req.body;
        if (!Array.isArray(resumeTexts)) {
            const response = {
                success: false,
                error: {
                    code: 'INVALID_INPUT',
                    message: 'resumes must be an array',
                },
            };
            return res.status(400).json(response);
        }
        // Validate criteria
        let validatedCriteria;
        if (criteria) {
            validatedCriteria = schemas_1.ScreeningCriteriaSchema.parse(criteria);
        }
        // Parse all resumes
        const parsedResumes = [];
        for (const rt of resumeTexts) {
            const candidateId = (0, uuid_1.v4)();
            const resume = resumeScreener_1.resumeScreener.parseResume(rt.text, candidateId, rt.fileName);
            parsedResumes.push(resume);
            resumes.set(resume.id, resume);
        }
        // Screen all resumes
        const results = resumeScreener_1.resumeScreener.screenResumes(parsedResumes, validatedCriteria || {});
        // Store results
        for (const result of results) {
            const resume = resumes.get(result.resumeId);
            if (resume) {
                resume.screeningResult = result;
                resumes.set(resume.id, resume);
            }
        }
        const response = {
            success: true,
            data: results,
            meta: {
                total: results.length,
            },
        };
        res.status(200).json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: {
                code: 'BATCH_SCREENING_ERROR',
                message: error instanceof Error ? error.message : 'Failed to screen resumes',
            },
        };
        res.status(400).json(response);
    }
});
/**
 * GET /api/resumes/:id
 * Get resume by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const resume = resumes.get(id);
        if (!resume) {
            const response = {
                success: false,
                error: {
                    code: 'RESUME_NOT_FOUND',
                    message: 'Resume not found',
                },
            };
            return res.status(404).json(response);
        }
        const response = {
            success: true,
            data: resume,
        };
        res.status(200).json(response);
    }
    catch (error) {
        const response = {
            success: false,
            error: {
                code: 'GET_ERROR',
                message: error instanceof Error ? error.message : 'Failed to get resume',
            },
        };
        res.status(400).json(response);
    }
});
exports.default = router;
//# sourceMappingURL=resumeRoutes.js.map