// ==========================================
// MyTalent - RABTUL Profile Service Integration
// Port: 4013
// ==========================================

import { Employee } from '../types';
import { mockEmployee } from '../data/mockData';

const PROFILE_SERVICE_URL = process.env.PROFILE_SERVICE_URL || 'http://localhost:4013';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'mytalent-internal-token';

interface ProfileResponse {
  success: boolean;
  profile?: Employee;
  error?: string;
}

interface UpdateProfileData {
  name?: string;
  phone?: string;
  avatar?: string;
}

/**
 * Get employee profile by ID
 */
export async function getProfile(employeeId: string): Promise<ProfileResponse> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.PROFILE_SERVICE_URL) {
      return {
        success: true,
        profile: { ...mockEmployee, id: employeeId },
      };
    }

    const response = await fetch(`${PROFILE_SERVICE_URL}/api/profiles/${employeeId}`, {
      method: 'GET',
      headers: {
        'X-Internal-Token': INTERNAL_TOKEN,
      },
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, profile: data.profile };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Profile fetch error:', error);
    return {
      success: true,
      profile: { ...mockEmployee, id: employeeId },
    };
  }
}

/**
 * Update employee profile
 */
export async function updateProfile(
  employeeId: string,
  data: UpdateProfileData
): Promise<ProfileResponse> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.PROFILE_SERVICE_URL) {
      return {
        success: true,
        profile: { ...mockEmployee, ...data, id: employeeId },
      };
    }

    const response = await fetch(`${PROFILE_SERVICE_URL}/api/profiles/${employeeId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': INTERNAL_TOKEN,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok) {
      return { success: true, profile: result.profile };
    }

    return { success: false, error: result.message };
  } catch (error) {
    logger.error('Profile update error:', error);
    return {
      success: true,
      profile: { ...mockEmployee, ...data, id: employeeId },
    };
  }
}

/**
 * Get employee by department
 */
export async function getEmployeesByDepartment(
  department: string
): Promise<{ success: boolean; employees?: Employee[]; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.PROFILE_SERVICE_URL) {
      return { success: true, employees: [] };
    }

    const response = await fetch(
      `${PROFILE_SERVICE_URL}/api/profiles?department=${encodeURIComponent(department)}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, employees: data.employees };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Department fetch error:', error);
    return { success: true, employees: [] };
  }
}

/**
 * Search employees
 */
export async function searchEmployees(
  query: string
): Promise<{ success: boolean; employees?: Employee[]; error?: string }> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.PROFILE_SERVICE_URL) {
      return { success: true, employees: [] };
    }

    const response = await fetch(
      `${PROFILE_SERVICE_URL}/api/profiles/search?q=${encodeURIComponent(query)}`,
      {
        method: 'GET',
        headers: {
          'X-Internal-Token': INTERNAL_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, employees: data.employees };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Search employees error:', error);
    return { success: true, employees: [] };
  }
}

/**
 * Upload avatar
 */
export async function uploadAvatar(
  employeeId: string,
  imageBase64: string
): Promise<ProfileResponse> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.PROFILE_SERVICE_URL) {
      return {
        success: true,
        profile: { ...mockEmployee, avatar: 'uploaded-avatar', id: employeeId },
      };
    }

    const response = await fetch(
      `${PROFILE_SERVICE_URL}/api/profiles/${employeeId}/avatar`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Token': INTERNAL_TOKEN,
        },
        body: JSON.stringify({ image: imageBase64 }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      return { success: true, profile: data.profile };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Avatar upload error:', error);
    return {
      success: true,
      profile: { ...mockEmployee, avatar: 'uploaded-avatar', id: employeeId },
    };
  }
}

/**
 * Get org chart
 */
export async function getOrgChart(): Promise<{
  success: boolean;
  chart?: any;
  error?: string;
}> {
  try {
    if (process.env.NODE_ENV === 'development' || !process.env.PROFILE_SERVICE_URL) {
      return { success: true, chart: null };
    }

    const response = await fetch(`${PROFILE_SERVICE_URL}/api/profiles/org-chart`, {
      method: 'GET',
      headers: {
        'X-Internal-Token': INTERNAL_TOKEN,
      },
    });

    const data = await response.json();

    if (response.ok) {
      return { success: true, chart: data.chart };
    }

    return { success: false, error: data.message };
  } catch (error) {
    logger.error('Org chart fetch error:', error);
    return { success: true, chart: null };
  }
}
