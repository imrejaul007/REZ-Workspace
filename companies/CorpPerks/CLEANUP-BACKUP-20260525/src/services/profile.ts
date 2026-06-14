/**
 * REZ Profile & Career Graph Service Client
 * Connects to RABTUL Profile Service and REZ Intelligence
 */

const PROFILE_SERVICE = process.env.PROFILE_SERVICE_URL || 'https://rez-profile-service.onrender.com';
const CAREER_GRAPH = process.env.CAREER_GRAPH_URL || 'https://rez-universal-user-graph.onrender.com';

// ─── Profile Types ──────────────────────────────────────────────────────────────

export interface Profile {
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  primaryPersona: string;
  secondaryPersonas: string[];
  activePersona: string;
}

export interface StudentExtension {
  college?: string;
  collegeId?: string;
  eduEmail?: string;
  degree?: string;
  branch?: string;
  yearOfGraduation?: number;
  skills?: string[];
  certifications?: string[];
}

export interface EmployeeExtension {
  company?: string;
  companyId?: string;
  department?: string;
  role?: string;
  joiningDate?: string;
}

export interface CareerProfile {
  education: Education[];
  experience: Experience[];
  skills: Skill[];
  certifications: Certification[];
  internships: Internship[];
  summary?: string;
}

// ─── Profile Service ──────────────────────────────────────────────────────────────

export async function getProfile(token: string): Promise<Profile | null> {
  try {
    const response = await fetch(`${PROFILE_SERVICE}/api/personas/profile`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.data;
  } catch (error) {
    logger.error('Profile fetch error:', error);
    return null;
  }
}

export async function getStudentExtension(token: string): Promise<StudentExtension | null> {
  try {
    const response = await fetch(`${PROFILE_SERVICE}/api/personas/profile`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.data?.studentExtension || null;
  } catch (error) {
    return null;
  }
}

export async function getEmployeeExtension(token: string): Promise<EmployeeExtension | null> {
  try {
    const response = await fetch(`${PROFILE_SERVICE}/api/personas/profile`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.data?.employeeExtension || null;
  } catch (error) {
    return null;
  }
}

export async function updateProfile(
  token: string,
  updates: Partial<Profile>
): Promise<boolean> {
  try {
    const response = await fetch(`${PROFILE_SERVICE}/api/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}

// ─── Career Graph Service ────────────────────────────────────────────────────────

export async function getCareerProfile(token: string, userId: string): Promise<CareerProfile | null> {
  try {
    const response = await fetch(`${CAREER_GRAPH}/api/career/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.data?.careerProfile || null;
  } catch (error) {
    return null;
  }
}

export async function addSkill(
  token: string,
  userId: string,
  skill: { name: string; level?: string }
): Promise<boolean> {
  try {
    const response = await fetch(`${CAREER_GRAPH}/api/career/${userId}/skills`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(skill),
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}

export async function addEducation(
  token: string,
  userId: string,
  education: Education
): Promise<boolean> {
  try {
    const response = await fetch(`${CAREER_GRAPH}/api/career/${userId}/education`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(education),
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}

export async function addExperience(
  token: string,
  userId: string,
  experience: Experience
): Promise<boolean> {
  try {
    const response = await fetch(`${CAREER_GRAPH}/api/career/${userId}/experience`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(experience),
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}

export async function getCareerAnalytics(
  token: string,
  userId: string
): Promise<CareerAnalytics | null> {
  try {
    const response = await fetch(`${CAREER_GRAPH}/api/career/${userId}/analytics`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.data;
  } catch (error) {
    return null;
  }
}

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface Education {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  grade?: string;
}

export interface Experience {
  company: string;
  title: string;
  type: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  description?: string;
  skills?: string[];
}

export interface Skill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  endorsements?: number;
}

export interface Certification {
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialUrl?: string;
}

export interface Internship {
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  stipend?: number;
  offer?: 'pre_conversion' | 'conversion' | 'rejected' | 'pending';
}

export interface CareerAnalytics {
  totalExperience: number;
  skillCount: number;
  certificationCount: number;
  internshipCount: number;
  educationLevel: string;
  topSkills: string[];
  careerProgress: 'early' | 'mid' | 'senior';
}
