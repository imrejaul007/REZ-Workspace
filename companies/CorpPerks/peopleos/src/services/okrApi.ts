/**
 * OKR Service for PeopleOS
 * Connects to OKR Service at port 4730
 */

// API Base URL
const OKR_API = process.env.OKR_SERVICE_URL || 'http://localhost:4730';
const REQUEST_TIMEOUT = 10000;

// ─── Types ─────────────────────────────────────────────────────────────────────────

export type ObjectiveType = 'company' | 'department' | 'individual';
export type ObjectiveStatus = 'draft' | 'active' | 'completed' | 'cancelled';
export type KeyResultStatus = 'on_track' | 'at_risk' | 'behind' | 'completed';

export interface KeyResult {
  _id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  weight: number;
  startValue: number;
  status: KeyResultStatus;
}

export interface Milestone {
  _id: string;
  title: string;
  deadline: string;
  completed: boolean;
  completedAt?: string;
}

export interface Objective {
  _id: string;
  title: string;
  description?: string;
  quarter: 1 | 2 | 3 | 4;
  year: number;
  ownerId: string;
  ownerName?: string;
  departmentId?: string;
  departmentName?: string;
  type: ObjectiveType;
  status: ObjectiveStatus;
  progress: number;
  keyResults: KeyResult[];
  milestones: Milestone[];
  createdAt: string;
  updatedAt: string;
}

export interface OKRDashboard {
  summary: {
    totalObjectives: number;
    companyObjectives: number;
    departmentObjectives: number;
    individualObjectives: number;
    currentQuarter: number;
    currentYear: number;
  };
  progress: {
    overallProgress: number;
    onTrack: number;
    atRisk: number;
    behind: number;
    completed: number;
  };
  keyResults: {
    total: number;
    onTrack: number;
    atRisk: number;
    behind: number;
  };
  recentObjectives: Objective[];
}

export interface CreateObjectiveInput {
  title: string;
  description?: string;
  quarter: 1 | 2 | 3 | 4;
  year: number;
  ownerId: string;
  ownerName?: string;
  departmentId?: string;
  departmentName?: string;
  type: ObjectiveType;
  status?: ObjectiveStatus;
  keyResults?: Array<{
    title: string;
    target: number;
    current?: number;
    unit: string;
    weight?: number;
    startValue?: number;
  }>;
}

export interface UpdateProgressInput {
  keyResultId: string;
  current: number;
  notes?: string;
}

// ─── Utility: Fetch with Timeout ─────────────────────────────────────────────────

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout after ${REQUEST_TIMEOUT}ms for ${url}`);
    }
    throw error;
  }
}

// ─── API Functions ───────────────────────────────────────────────────────────────

/**
 * Get OKR Dashboard
 */
export async function getOKRDashboard(params?: {
  ownerId?: string;
  departmentId?: string;
  quarter?: number;
  year?: number;
}): Promise<OKRDashboard | null> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.ownerId) searchParams.set('ownerId', params.ownerId);
    if (params?.departmentId) searchParams.set('departmentId', params.departmentId);
    if (params?.quarter) searchParams.set('quarter', String(params.quarter));
    if (params?.year) searchParams.set('year', String(params.year));

    const query = searchParams.toString();
    const url = `${OKR_API}/api/objectives/dashboard${query ? `?${query}` : ''}`;

    const response = await fetchWithTimeout(url, {
      headers: {
        'X-Internal-Token': process.env.OKR_SERVICE_TOKEN || '',
      },
    });

    if (!response.ok) {
      logger.error(`[OKR] getDashboard failed: HTTP ${response.status}`);
      return null;
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[OKR] getDashboard failed:', message);
    return null;
  }
}

/**
 * List Objectives
 */
export async function listObjectives(params?: {
  ownerId?: string;
  departmentId?: string;
  type?: ObjectiveType;
  status?: ObjectiveStatus;
  quarter?: number;
  year?: number;
  page?: number;
  limit?: number;
}): Promise<{ objectives: Objective[]; total: number; page: number; pages: number } | null> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.ownerId) searchParams.set('ownerId', params.ownerId);
    if (params?.departmentId) searchParams.set('departmentId', params.departmentId);
    if (params?.type) searchParams.set('type', params.type);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.quarter) searchParams.set('quarter', String(params.quarter));
    if (params?.year) searchParams.set('year', String(params.year));
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));

    const query = searchParams.toString();
    const response = await fetchWithTimeout(`${OKR_API}/api/objectives${query ? `?${query}` : ''}`, {
      headers: {
        'X-Internal-Token': process.env.OKR_SERVICE_TOKEN || '',
      },
    });

    if (!response.ok) {
      logger.error(`[OKR] listObjectives failed: HTTP ${response.status}`);
      return null;
    }

    const result = await response.json();
    return {
      objectives: result.data,
      total: result.pagination.total,
      page: result.pagination.page,
      pages: result.pagination.pages,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[OKR] listObjectives failed:', message);
    return null;
  }
}

/**
 * Get Company OKRs
 */
export async function getCompanyOKRs(quarter?: number, year?: number): Promise<{
  overallProgress: number;
  objectivesCount: number;
  objectives: Objective[];
} | null> {
  try {
    const searchParams = new URLSearchParams();
    if (quarter) searchParams.set('quarter', String(quarter));
    if (year) searchParams.set('year', String(year));

    const query = searchParams.toString();
    const response = await fetchWithTimeout(`${OKR_API}/api/objectives/company${query ? `?${query}` : ''}`, {
      headers: {
        'X-Internal-Token': process.env.OKR_SERVICE_TOKEN || '',
      },
    });

    if (!response.ok) {
      logger.error(`[OKR] getCompanyOKRs failed: HTTP ${response.status}`);
      return null;
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[OKR] getCompanyOKRs failed:', message);
    return null;
  }
}

/**
 * Get single objective
 */
export async function getObjective(id: string): Promise<Objective | null> {
  try {
    const response = await fetchWithTimeout(`${OKR_API}/api/objectives/${id}`, {
      headers: {
        'X-Internal-Token': process.env.OKR_SERVICE_TOKEN || '',
      },
    });

    if (!response.ok) {
      logger.error(`[OKR] getObjective failed: HTTP ${response.status}`);
      return null;
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[OKR] getObjective failed:', message);
    return null;
  }
}

/**
 * Create Objective
 */
export async function createObjective(data: CreateObjectiveInput): Promise<Objective | null> {
  try {
    const response = await fetchWithTimeout(`${OKR_API}/api/objectives`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': process.env.OKR_SERVICE_TOKEN || '',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      logger.error(`[OKR] createObjective failed: HTTP ${response.status}`);
      return null;
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[OKR] createObjective failed:', message);
    return null;
  }
}

/**
 * Update Objective
 */
export async function updateObjective(
  id: string,
  data: Partial<CreateObjectiveInput>
): Promise<Objective | null> {
  try {
    const response = await fetchWithTimeout(`${OKR_API}/api/objectives/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': process.env.OKR_SERVICE_TOKEN || '',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      logger.error(`[OKR] updateObjective failed: HTTP ${response.status}`);
      return null;
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[OKR] updateObjective failed:', message);
    return null;
  }
}

/**
 * Update Key Result Progress
 */
export async function updateProgress(id: string, data: UpdateProgressInput): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(`${OKR_API}/api/objectives/${id}/progress`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': process.env.OKR_SERVICE_TOKEN || '',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      logger.error(`[OKR] updateProgress failed: HTTP ${response.status}`);
      return false;
    }

    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[OKR] updateProgress failed:', message);
    return false;
  }
}

/**
 * Add Key Result to Objective
 */
export async function addKeyResult(
  objectiveId: string,
  data: {
    title: string;
    target: number;
    current?: number;
    unit: string;
    weight?: number;
    startValue?: number;
  }
): Promise<KeyResult | null> {
  try {
    const response = await fetchWithTimeout(`${OKR_API}/api/objectives/${objectiveId}/key-results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': process.env.OKR_SERVICE_TOKEN || '',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      logger.error(`[OKR] addKeyResult failed: HTTP ${response.status}`);
      return null;
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[OKR] addKeyResult failed:', message);
    return null;
  }
}

/**
 * Get objectives by owner
 */
export async function getObjectivesByOwner(
  ownerId: string,
  quarter?: number,
  year?: number
): Promise<Objective[]> {
  try {
    const searchParams = new URLSearchParams();
    if (quarter) searchParams.set('quarter', String(quarter));
    if (year) searchParams.set('year', String(year));

    const query = searchParams.toString();
    const response = await fetchWithTimeout(
      `${OKR_API}/api/objectives/owner/${ownerId}${query ? `?${query}` : ''}`,
      {
        headers: {
          'X-Internal-Token': process.env.OKR_SERVICE_TOKEN || '',
        },
      }
    );

    if (!response.ok) {
      logger.error(`[OKR] getObjectivesByOwner failed: HTTP ${response.status}`);
      return [];
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[OKR] getObjectivesByOwner failed:', message);
    return [];
  }
}

/**
 * Toggle milestone completion
 */
export async function toggleMilestone(
  objectiveId: string,
  milestoneId: string
): Promise<Milestone | null> {
  try {
    const response = await fetchWithTimeout(
      `${OKR_API}/api/objectives/${objectiveId}/milestones/${milestoneId}/toggle`,
      {
        method: 'PATCH',
        headers: {
          'X-Internal-Token': process.env.OKR_SERVICE_TOKEN || '',
        },
      }
    );

    if (!response.ok) {
      logger.error(`[OKR] toggleMilestone failed: HTTP ${response.status}`);
      return null;
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[OKR] toggleMilestone failed:', message);
    return null;
  }
}
