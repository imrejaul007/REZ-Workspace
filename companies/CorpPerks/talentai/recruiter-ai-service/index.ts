import { logger } from '../../shared/logger';
/**
 * MyTalent Recruiter AI Service
 * Port: 4001
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());

const PORT = process.env.PORT || 4001;

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'recruiter-ai', version: '1.0.0' });
});

// Types
interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experience: number;
  salary: number;
  location: string;
  notice: string;
  resume: string;
  status: 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
}

interface Job {
  id: string;
  title: string;
  department: string;
  requirements: string[];
  salary: { min: number; max: number; currency: string };
  location: string;
  type: 'fulltime' | 'parttime' | 'contract';
}

// Source Candidates
app.post('/api/recruiter/source', async (req, res) => {
  const { role, skills, location } = req.body;

  // Mock candidate database
  const candidates: Candidate[] = [
    { id: 'c1', name: 'Priya Sharma', email: 'priya@email.com', phone: '+919876543210', skills: ['React', 'Node.js', 'TypeScript'], experience: 4, salary: 1200000, location: 'Mumbai', notice: '30 days', resume: 'resume_1.pdf', status: 'new' },
    { id: 'c2', name: 'Rahul Kumar', email: 'rahul.k@email.com', phone: '+919876543211', skills: ['Python', 'ML', 'AI'], experience: 6, salary: 1800000, location: 'Bangalore', notice: '45 days', resume: 'resume_2.pdf', status: 'new' },
    { id: 'c3', name: 'Anita Patel', email: 'anita.p@email.com', phone: '+919876543212', skills: ['Marketing', 'SEO', 'Analytics'], experience: 3, salary: 800000, location: 'Delhi', notice: '15 days', resume: 'resume_3.pdf', status: 'new' },
    { id: 'c4', name: 'Vikram Singh', email: 'vikram.s@email.com', phone: '+919876543213', skills: ['Sales', 'B2B', 'Enterprise'], experience: 5, salary: 1500000, location: 'Pune', notice: '30 days', resume: 'resume_4.pdf', status: 'new' },
    { id: 'c5', name: 'Neha Gupta', email: 'neha.g@email.com', phone: '+919876543214', skills: ['Finance', 'Accounting', 'Tally'], experience: 4, salary: 900000, location: 'Chennai', notice: '60 days', resume: 'resume_5.pdf', status: 'new' }
  ];

  const matching = candidates.filter(c =>
    c.skills.some(s => s.toLowerCase().includes((skills || '').toLowerCase()) ||
    c.location.toLowerCase().includes((location || '').toLowerCase())
  );

  res.json({ candidates: matching, total: matching.length });
});

// Screen Resume
app.post('/api/recruiter/screen', (req, res) => {
  const { candidateId, jobRequirements } = req.body;

  const score = Math.floor(Math.random() * 40) + 60;

  res.json({
    candidateId,
    resumeScore: score,
    skills: ['Communication', 'Problem Solving', 'Teamwork'],
    redFlags: score < 70 ? ['Gap in employment' : null].filter(Boolean),
    recommendation: score >= 75 ? 'schedule_interview' : 'review_more'
  });
});

// Schedule Interview
app.post('/api/recruiter/interview', (req, res) => {
  const { candidateId, role } = req.body;

  res.json({
    interviewId: `INT-${Date.now()}`,
    candidateId,
    role,
    scheduledAt: new Date(Date.now() + 86400000 * 3).toISOString(),
    type: 'technical',
    duration: '60 mins',
    meetingLink: `https://meet.mytalent.ai/interview/${Date.now()}`
  });
});

// Job Match
app.post('/api/recruiter/match', (req, res) => {
  const { candidateId, skills } = req.body;

  const jobs = [
    { id: 'JOB001', title: 'Senior Developer', match: 92 },
    { id: 'JOB002', title: 'Tech Lead', match: 78 },
    { id: 'JOB003', title: 'Frontend Dev', match: 85 }
  ].filter(j => j.match > 70);

  res.json({ matches: jobs });
});

// Offer Generation
app.post('/api/recruiter/offer', (req, res) => {
  const { candidateId, role, salary } = req.body;

  res.json({
    offerId: `OFF-${Date.now()}`,
    candidateId,
    role,
    salary,
    joining: new Date(Date.now() + 86400000 * 14).toISOString(),
    status: 'pending_approval'
  });
});

app.listen(PORT, () => {
  logger.info(`MyTalent Recruiter AI running on port ${PORT}`);
});

export default app;
</parameter>
