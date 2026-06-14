import { apiClient, ApiResponse, PaginatedResponse } from './client';

export interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
  experience: 'ENTRY_LEVEL' | 'MID_LEVEL' | 'SENIOR_LEVEL';
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  location: string;
  isRemote: boolean;
  skills: string[];
  category: string;
  status: 'DRAFT' | 'OPEN' | 'CLOSED' | 'FILLED';
  applicationDeadline?: string;
  startDate?: string;
  restaurant: {
    id: string;
    name: string;
    address: string;
    rating: number;
  };
  postedBy: string;
  applicationCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobRequest {
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
  experience: 'ENTRY_LEVEL' | 'MID_LEVEL' | 'SENIOR_LEVEL';
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  location: string;
  isRemote: boolean;
  skills: string[];
  category: string;
  applicationDeadline?: string;
  startDate?: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  applicantId: string;
  status: 'PENDING' | 'REVIEWED' | 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED';
  coverLetter: string;
  resume?: string;
  expectedSalary?: number;
  availableFrom?: string;
  applicant: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    experience: string;
    skills: string[];
  };
  appliedAt: string;
  reviewedAt?: string;
  notes?: string;
}

export interface JobFilters {
  category?: string[];
  employmentType?: string[];
  experience?: string[];
  location?: string[];
  isRemote?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  skills?: string[];
  sortBy?: 'createdAt' | 'salary' | 'applicationCount';
  sortOrder?: 'asc' | 'desc';
}

export interface JobStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  applicationsByStatus: {
    pending: number;
    reviewed: number;
    shortlisted: number;
    accepted: number;
    rejected: number;
  };
  topCategories: Array<{
    category: string;
    count: number;
  }>;
  applicationTrend: Array<{
    date: string;
    applications: number;
  }>;
}

class JobsApi {
  async getJobs(
    filters?: JobFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<Job>> {
    const params = { ...filters, page, limit };
    return apiClient.getPaginated<Job>('/jobs', params);
  }

  async getJob(id: string): Promise<ApiResponse<Job>> {
    return apiClient.get<Job>(`/jobs/${id}`);
  }

  async createJob(data: CreateJobRequest): Promise<ApiResponse<Job>> {
    return apiClient.post<Job>('/jobs', data);
  }

  async updateJob(id: string, data: Partial<CreateJobRequest>): Promise<ApiResponse<Job>> {
    return apiClient.put<Job>(`/jobs/${id}`, data);
  }

  async deleteJob(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/jobs/${id}`);
  }

  async searchJobs(query: string, filters?: JobFilters): Promise<ApiResponse<Job[]>> {
    return apiClient.search<Job>('/jobs/search', query, filters);
  }

  async getMyJobs(
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<Job>> {
    return apiClient.getPaginated<Job>('/jobs/my-jobs', { page, limit });
  }

  async getRecommendedJobs(
    employeeId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<Job>> {
    return apiClient.getPaginated<Job>(`/jobs/recommended/${employeeId}`, { page, limit });
  }

  async applyToJob(jobId: string, applicationData: {
    coverLetter: string;
    resume?: File;
    expectedSalary?: number;
    availableFrom?: string;
  }): Promise<ApiResponse<JobApplication>> {
    const formData = new FormData();
    formData.append('coverLetter', applicationData.coverLetter);

    if (applicationData.resume) {
      formData.append('resume', applicationData.resume);
    }
    if (applicationData.expectedSalary) {
      formData.append('expectedSalary', applicationData.expectedSalary.toString());
    }
    if (applicationData.availableFrom) {
      formData.append('availableFrom', applicationData.availableFrom);
    }

    const response = await apiClient.post(`/jobs/${jobId}/apply`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async getJobApplications(
    jobId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<JobApplication>> {
    return apiClient.getPaginated<JobApplication>(`/jobs/${jobId}/applications`, { page, limit });
  }

  async updateApplicationStatus(
    jobId: string,
    applicationId: string,
    status: JobApplication['status'],
    notes?: string
  ): Promise<ApiResponse<JobApplication>> {
    return apiClient.patch<JobApplication>(
      `/jobs/${jobId}/applications/${applicationId}/status`,
      { status, notes }
    );
  }

  async getMyApplications(
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<JobApplication>> {
    return apiClient.getPaginated<JobApplication>('/jobs/my-applications', { page, limit });
  }

  async withdrawApplication(jobId: string, applicationId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/jobs/${jobId}/applications/${applicationId}`);
  }

  async getJobStats(restaurantId?: string): Promise<ApiResponse<JobStats>> {
    const endpoint = restaurantId ? `/jobs/stats/${restaurantId}` : '/jobs/stats';
    return apiClient.get<JobStats>(endpoint);
  }

  async toggleJobStatus(id: string, status: Job['status']): Promise<ApiResponse<Job>> {
    return apiClient.patch<Job>(`/jobs/${id}/status`, { status });
  }

  async getJobsByCategory(category: string): Promise<ApiResponse<Job[]>> {
    return apiClient.get<Job[]>('/jobs', { params: { category } });
  }

  async getJobsNearLocation(
    latitude: number,
    longitude: number,
    radius: number = 25
  ): Promise<ApiResponse<Job[]>> {
    const params = { lat: latitude, lng: longitude, radius };
    return apiClient.get<Job[]>('/jobs/nearby', { params });
  }

  async saveJob(jobId: string): Promise<ApiResponse<void>> {
    return apiClient.post(`/jobs/${jobId}/save`);
  }

  async unsaveJob(jobId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/jobs/${jobId}/save`);
  }

  async getSavedJobs(
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<Job>> {
    return apiClient.getPaginated<Job>('/jobs/saved', { page, limit });
  }

  async reportJob(jobId: string, reason: string, details?: string): Promise<ApiResponse<void>> {
    return apiClient.post(`/jobs/${jobId}/report`, { reason, details });
  }
}

export const jobsApi = new JobsApi();