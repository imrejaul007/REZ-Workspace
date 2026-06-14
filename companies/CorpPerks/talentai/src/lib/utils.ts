/**
 * Utility functions for TalentAI
 */

// ─── Formatting ──────────────────────────────────────────────

export function formatSalary(salary: { min: number; max: number; period: string } | undefined): string {
  if (!salary) return 'Not disclosed';

  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

  const formatLakh = (num: number) => {
    const lakhs = num / 100000;
    return `${lakhs.toFixed(1)} L`;
  };

  if (salary.period === 'month') {
    return `${formatter.format(salary.min)} - ${formatter.format(salary.max)}/mo`;
  }

  return `₹${formatLakh(salary.min)} - ${formatLakh(salary.max)} LPA`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

// ─── Validation ─────────────────────────────────────────────

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s-]{10,}$/;
  return phoneRegex.test(phone);
}

export function isStrongPassword(password: string): {
  valid: boolean;
  message?: string;
} {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain an uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain a lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain a number' };
  }
  return { valid: true };
}

// ─── Matching ────────────────────────────────────────────────

export function calculateMatchScore(
  candidateSkills: string[],
  requiredSkills: string[]
): number {
  if (requiredSkills.length === 0) return 100;

  const matched = candidateSkills.filter(skill =>
    requiredSkills.some(req =>
      skill.toLowerCase().includes(req.toLowerCase()) ||
      req.toLowerCase().includes(skill.toLowerCase())
    )
  ).length;

  return Math.round((matched / requiredSkills.length) * 100);
}

export function getMatchColor(score: number): string {
  if (score >= 90) return '#10b981'; // green
  if (score >= 75) return '#8b5cf6'; // purple
  if (score >= 50) return '#f59e0b'; // amber
  return '#6b7280'; // gray
}

// ─── Search & Filter ────────────────────────────────────────

export function searchJobs<T extends { title?: string; description?: string; skills?: string[] }>(
  jobs: T[],
  query: string
): T[] {
  if (!query) return jobs;

  const lowerQuery = query.toLowerCase();

  return jobs.filter(job => {
    const titleMatch = job.title?.toLowerCase().includes(lowerQuery);
    const descMatch = job.description?.toLowerCase().includes(lowerQuery);
    const skillMatch = job.skills?.some(skill =>
      skill.toLowerCase().includes(lowerQuery)
    );

    return titleMatch || descMatch || skillMatch;
  });
}

export function filterJobs<T extends { type?: string; location?: { city?: string; remote?: boolean } }>(
  jobs: T[],
  filters: {
    type?: string;
    city?: string;
    remote?: boolean;
  }
): T[] {
  return jobs.filter(job => {
    if (filters.type && job.type !== filters.type) return false;
    if (filters.city && !job.location?.city?.toLowerCase().includes(filters.city.toLowerCase())) return false;
    if (filters.remote && !job.location?.remote) return false;
    return true;
  });
}

// ─── UI Helpers ─────────────────────────────────────────────

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ─── Constants ──────────────────────────────────────────────

export const JOB_TYPES = [
  { value: 'full_time', label: 'Full Time', icon: '💼' },
  { value: 'part_time', label: 'Part Time', icon: '⏰' },
  { value: 'contract', label: 'Contract', icon: '📝' },
  { value: 'internship', label: 'Internship', icon: '🎓' },
  { value: 'freelance', label: 'Freelance', icon: '💻' },
];

export const APPLICATION_STATUSES = [
  { value: 'applied', label: 'Applied', color: '#6b7280' },
  { value: 'screening', label: 'Screening', color: '#f59e0b' },
  { value: 'interview', label: 'Interview', color: '#8b5cf6' },
  { value: 'offer', label: 'Offer', color: '#10b981' },
  { value: 'hired', label: 'Hired', color: '#059669' },
  { value: 'rejected', label: 'Rejected', color: '#dc2626' },
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
  'Kubernetes',
  'TensorFlow',
  'SQL',
  'GraphQL',
];

export const MAJOR_CITIES = [
  'Bangalore',
  'Hyderabad',
  'Mumbai',
  'Delhi NCR',
  'Chennai',
  'Pune',
  'Kolkata',
  'Ahmedabad',
  'Remote',
];
