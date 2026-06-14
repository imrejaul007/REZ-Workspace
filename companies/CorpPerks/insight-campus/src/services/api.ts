/**
 * API Service - Connects to Talent Platform
 */

const TALENT_API = process.env.NEXT_PUBLIC_TALENT_API || 'http://localhost:4020';

export interface Job {
  _id: string;
  title: string;
  description: string;
  skills: string[];
  type: 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance';
  location: {
    city: string;
    remote: boolean;
    hybrid: boolean;
  };
  salary?: {
    min: number;
    max: number;
    period: string;
  };
  employer: {
    id: string;
    name: string;
    logo?: string;
    type: string;
    verified: boolean;
  };
  postedAt: string;
  applications: number;
  matchScore?: number;
}

export interface Application {
  _id: string;
  jobId: string;
  status: string;
  appliedAt: string;
  overallScore?: number;
}

export interface CandidateProfile {
  userId: string;
  stats: {
    totalApplications: number;
    pending: number;
    interviews: number;
    offers: number;
    hired: number;
  };
  applications: Application[];
}

// ─── Jobs API ──────────────────────────────────────────────────────────────────

export async function getJobs(filters?: {
  type?: string;
  city?: string;
  remote?: boolean;
  skills?: string[];
}): Promise<{ jobs: Job[]; total: number }> {
  const params = new URLSearchParams();
  if (filters?.type) params.set('type', filters.type);
  if (filters?.city) params.set('city', filters.city);
  if (filters?.remote) params.set('remote', 'true');
  if (filters?.skills?.length) params.set('skills', filters.skills.join(','));

  const response = await fetch(`${TALENT_API}/api/jobs?${params}`);
  const data = await response.json();
  return data.data || { jobs: [], total: 0 };
}

export async function getRecommendedJobs(candidateId: string): Promise<{
  jobs: Job[];
  personalized: boolean;
}> {
  const response = await fetch(
    `${TALENT_API}/api/jobs/recommended?candidateId=${candidateId}&limit=10`
  );
  const data = await response.json();
  return data.data || { jobs: [], personalized: false };
}

export async function getJob(id: string): Promise<Job | null> {
  const response = await fetch(`${TALENT_API}/api/jobs/${id}`);
  const data = await response.json();
  return data.data || null;
}

// ─── Applications API ──────────────────────────────────────────────────────────

export async function applyForJob(
  jobId: string,
  candidateId: string,
  coverLetter?: string
): Promise<{ success: boolean; applicationId?: string; error?: string }> {
  const response = await fetch(`${TALENT_API}/api/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId, candidateId, coverLetter }),
  });

  const data = await response.json();

  if (data.success) {
    return { success: true, applicationId: data.data._id };
  }
  return { success: false, error: data.error };
}

export async function getMyApplications(
  candidateId: string
): Promise<Application[]> {
  const response = await fetch(
    `${TALENT_API}/api/candidates/${candidateId}/applications`
  );
  const data = await response.json();
  return data.data?.applications || [];
}

export async function getCandidateProfile(
  userId: string
): Promise<CandidateProfile | null> {
  const response = await fetch(
    `${TALENT_API}/api/candidates/${userId}/profile`
  );
  const data = await response.json();
  return data.data || null;
}

// ─── Skill Types ──────────────────────────────────────────────────────────────

export const JOB_TYPES = [
  { value: 'internship', label: 'Internship' },
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
];

export const POPULAR_SKILLS = [
  'React',
  'Node.js',
  'Python',
  'JavaScript',
  'TypeScript',
  'MongoDB',
  'PostgreSQL',
  'AWS',
  'Docker',
  'Machine Learning',
  'Data Science',
  'UI/UX Design',
  'Flutter',
  'React Native',
  'Go',
  'Rust',
];
