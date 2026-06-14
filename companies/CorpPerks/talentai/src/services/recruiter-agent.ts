/**
 * Recruiter AI Agent - Port 4011
 * Source, screen, schedule candidates
 */

import express from 'express';
import cors from 'cors';
import { z } from 'zod';

const app = express();
app.use(cors());
app.use(express.json());

// Schemas
const CandidateSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  skills: z.array(z.string()),
  experience: z.number(),
  source: z.enum(['linkedin', 'referral', 'portal', 'direct']),
});

const ScreeningRequestSchema = z.object({
  candidateId: z.string(),
  jobId: z.string(),
  resume: z.string().optional(),
});

// In-memory store
const candidates: Map<string, any> = new Map();
const jobs: Map<string, any> = new Map();

// Initialize sample jobs
jobs.set('job_1', { id: 'job_1', title: 'Senior Engineer', skills: ['React', 'Node', 'TypeScript'], salary: '25-35L' });
jobs.set('job_2', { id: 'job_2', title: 'Product Manager', skills: ['Strategy', 'Analytics', 'Agile'], salary: '20-28L' });

// Routes

// Health
app.get('/health', (_, res) => res.json({ status: 'ok', agent: 'recruiter', port: 4011 }));

// Get candidates
app.get('/candidates', (_, res) => {
  res.json({ candidates: Array.from(candidates.values()) });
});

// Add candidate
app.post('/candidates', async (req, res) => {
  try {
    const data = CandidateSchema.parse(req.body);
    const id = `cand_${Date.now()}`;
    const candidate = { ...data, id, createdAt: new Date() };
    candidates.set(id, candidate);
    res.json({ candidate });
  } catch (err) {
    res.status(400).json({ error: 'Invalid data', details: err });
  }
});

// Screen candidate
app.post('/screen', async (req, res) => {
  try {
    const { candidateId, jobId } = ScreeningRequestSchema.parse(req.body);
    const candidate = candidates.get(candidateId);
    const job = jobs.get(jobId);

    if (!candidate || !job) {
      return res.status(404).json({ error: 'Candidate or job not found' });
    }

    // AI screening logic
    const matchedSkills = candidate.skills.filter((s: string) =>
      job.skills.some((js: string) => js.toLowerCase().includes(s.toLowerCase()))
    );
    const matchScore = Math.round((matchedSkills.length / job.skills.length) * 100);
    const experienceMatch = candidate.experience >= 3;

    const recommendation = matchScore >= 60 && experienceMatch ? 'proceed' : matchScore >= 40 ? 'review' : 'reject';

    res.json({
      candidateId,
      jobId,
      matchScore,
      matchedSkills,
      experienceMatch,
      recommendation,
      feedback: `Matched ${matchedSkills.length}/${job.skills.length} skills. ${experienceMatch ? 'Experience requirement met.' : 'May need more experience.'}`,
    });
  } catch (err) {
    res.status(400).json({ error: 'Invalid request', details: err });
  }
});

// Schedule interview
app.post('/schedule', async (req, res) => {
  const { candidateId, jobId, type } = req.body;

  if (!candidateId || !jobId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const slots = [
    { date: '2026-06-01', time: '10:00 AM' },
    { date: '2026-06-01', time: '2:00 PM' },
    { date: '2026-06-02', time: '11:00 AM' },
  ];

  res.json({
    candidateId,
    jobId,
    type: type || 'technical',
    suggestedSlots: slots,
    calendarLink: `https://cal.com/talentos/interview?cand=${candidateId}`,
  });
});

// Jobs
app.get('/jobs', (_, res) => {
  res.json({ jobs: Array.from(jobs.values()) });
});

app.post('/jobs', (req, res) => {
  const { title, skills, salary } = req.body;
  const id = `job_${Date.now()}`;
  const job = { id, title, skills: skills.split(',').map((s: string) => s.trim()), salary };
  jobs.set(id, job);
  res.json({ job });
});

const PORT = 4011;
app.listen(PORT, () => logger.info(`Recruiter Agent running on port ${PORT}`));
