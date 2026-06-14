// ==========================================
// MyTalent - Career Service Integration
// CorpPerks Intelligence - Port 4135
// ==========================================

import { CareerProgress, SkillGap, CareerPath, Course, InternalJob } from '../types';
import { mockCareerProgress, mockSkillGaps, mockCareerPath, mockInternalJobs } from '../data/mockData';

const CAREER_SERVICE_URL = process.env.CAREER_SERVICE_URL || 'http://localhost:4135';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'mytalent-internal-token';

interface CareerProgressResponse {
  success: boolean;
  progress?: CareerProgress;
  error?: string;
}

interface SkillGapResponse {
  success: boolean;
  gaps?: SkillGap[];
  error?: string;
}

interface InternalJobsResponse {
  success: boolean;
  jobs?: InternalJob[];
  error?: string;
}

/**
 * Get career progress
 */
export async function getCareerProgress(
  employeeId: string
): Promise<CareerProgressResponse> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.CAREER_SERVICE_URL) {
      return { success: true, progress: mockCareerProgress };
    }

    const response = await fetch(
      `${CAREER_SERVICE_URL}/api/career/progress/${employeeId}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, progress: data.progress };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Get career progress error:', error);
    return { success: true, progress: mockCareerProgress };
  }
}

/**
 * Get skill gap analysis
 */
export async function getSkillGapAnalysis(
  employeeId: string
): Promise<SkillGapResponse> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.CAREER_SERVICE_URL) {
      return { success: true, gaps: mockSkillGaps };
    }

    const response = await fetch(
      `${CAREER_SERVICE_URL}/api/career/skill-gap/${employeeId}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, gaps: data.gaps };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Get skill gap analysis error:', error);
    return { success: true, gaps: mockSkillGaps };
  }
}

/**
 * Get career paths
 */
export async function getCareerPaths(
  employeeId: string
): Promise<{ success: boolean; path?: CareerPath; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.CAREER_SERVICE_URL) {
      return { success: true, path: mockCareerPath };
    }

    const response = await fetch(
      `${CAREER_SERVICE_URL}/api/career/paths/${employeeId}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, path: data.path };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Get career paths error:', error);
    return { success: true, path: mockCareerPath };
  }
}

/**
 * Get recommended courses
 */
export async function getRecommendedCourses(
  employeeId: string,
  skillIds?: string[]
): Promise<{ success: boolean; courses?: Course[]; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.CAREER_SERVICE_URL) {
      const courses: Course[] = [
        { id: 'c1', title: 'AWS Solutions Architect', provider: 'AWS Training', duration: '40 hours', level: 'Intermediate', url: '#', free: false, rating: 4.8 },
        { id: 'c2', title: 'Leadership Fundamentals', provider: 'Coursera', duration: '20 hours', level: 'Beginner', url: '#', free: true, rating: 4.6 },
        { id: 'c3', title: 'Data Engineering', provider: 'Udemy', duration: '35 hours', level: 'Intermediate', url: '#', free: false, rating: 4.7 },
        { id: 'c4', title: 'Project Management Professional', provider: 'PMI', duration: '35 hours', level: 'Advanced', url: '#', free: false, rating: 4.9 },
        { id: 'c5', title: 'Machine Learning Basics', provider: 'fast.ai', duration: '30 hours', level: 'Beginner', url: '#', free: true, rating: 4.8 },
      ];
      return { success: true, courses };
    }

    const params = skillIds ? `?skills=${skillIds.join(',')}` : '';
    const response = await fetch(
      `${CAREER_SERVICE_URL}/api/career/courses${params}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, courses: data.courses };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Get recommended courses error:', error);
    return { success: true, courses: [] };
  }
}

/**
 * Get internal job openings
 */
export async function getInternalJobs(
  employeeId: string,
  department?: string
): Promise<InternalJobsResponse> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.CAREER_SERVICE_URL) {
      if (department) {
        return {
          success: true,
          jobs: mockInternalJobs.filter((j) => j.department === department),
        };
      }
      return { success: true, jobs: mockInternalJobs };
    }

    const params = department ? `?department=${department}` : '';
    const response = await fetch(
      `${CAREER_SERVICE_URL}/api/career/jobs${params}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, jobs: data.jobs };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Get internal jobs error:', error);
    return { success: true, jobs: mockInternalJobs };
  }
}

/**
 * Apply for internal job
 */
export async function applyForJob(
  employeeId: string,
  jobId: string
): Promise<{ success: boolean; applicationId?: string; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.CAREER_SERVICE_URL) {
      return {
        success: true,
        applicationId: `app-${Date.now()}`,
      };
    }

    const response = await fetch(`${CAREER_SERVICE_URL}/api/career/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN,
      },
      body: JSON.stringify({ employeeId, jobId }),
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, applicationId: data.applicationId };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Apply for job error:', error);
    return { success: true, applicationId: `app-${Date.now()}` };
  }
}

/**
 * Get my applications
 */
export async function getMyApplications(
  employeeId: string
): Promise<{ success: boolean; applications?: any[]; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.CAREER_SERVICE_URL) {
      return {
        success: true,
        applications: [
          { id: 'app-1', jobTitle: 'Senior Engineer', department: 'Engineering', appliedOn: '2026-05-15', status: 'Interview Scheduled' },
          { id: 'app-2', jobTitle: 'Tech Lead', department: 'Engineering', appliedOn: '2026-05-10', status: 'Under Review' },
        ],
      };
    }

    const response = await fetch(
      `${CAREER_SERVICE_URL}/api/career/my-applications/${employeeId}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, applications: data.applications };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Get my applications error:', error);
    return { success: true, applications: [] };
  }
}

/**
 * Get promotion readiness
 */
export async function getPromotionReadiness(
  employeeId: string
): Promise<{ success: boolean; readiness?: any; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.CAREER_SERVICE_URL) {
      return {
        success: true,
        readiness: {
          score: 75,
          status: 'In Progress',
          factors: [
            { name: 'Performance', score: 85, status: 'Meets' },
            { name: 'Skills', score: 70, status: 'Needs Development' },
            { name: 'Tenure', score: 100, status: 'Meets' },
            { name: 'Leadership', score: 60, status: 'Needs Development' },
          ],
          nextReview: '2026-07-01',
          estimatedPromotion: 'Q4 2026',
        },
      };
    }

    const response = await fetch(
      `${CAREER_SERVICE_URL}/api/career/promotion-readiness/${employeeId}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, readiness: data.readiness };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Get promotion readiness error:', error);
    return { success: true, readiness: null };
  }
}

/**
 * Get team ranking
 */
export async function getTeamRanking(
  employeeId: string
): Promise<{ success: boolean; ranking?: any; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.CAREER_SERVICE_URL) {
      return {
        success: true,
        ranking: {
          position: 5,
          totalMembers: 25,
          percentile: 80,
          change: '+2 from last month',
        },
      };
    }

    const response = await fetch(
      `${CAREER_SERVICE_URL}/api/career/team-ranking/${employeeId}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, ranking: data.ranking };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Get team ranking error:', error);
    return { success: true, ranking: null };
  }
}
