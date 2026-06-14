import { useApi, usePaginatedApi, useMutation, useInfiniteApi } from './useApi';
import { jobsApi, Job, CreateJobRequest, JobFilters, JobApplication } from '../api/jobs';

// Get jobs with pagination
export function useJobs(
  filters?: JobFilters,
  page: number = 1,
  limit: number = 20
) {
  return usePaginatedApi(
    (p, l) => jobsApi.getJobs(filters, p, l),
    limit
  );
}

// Get infinite scroll jobs
export function useInfiniteJobs(filters?: JobFilters, limit: number = 20) {
  return useInfiniteApi(
    (page, limit) => jobsApi.getJobs(filters, page, limit),
    limit
  );
}

// Get single job
export function useJob(id: string) {
  return useApi(() => jobsApi.getJob(id), {
    immediate: !!id,
  });
}

// Get my jobs (for restaurant owners)
export function useMyJobs(page: number = 1, limit: number = 20) {
  return usePaginatedApi(
    (p, l) => jobsApi.getMyJobs(p, l),
    limit
  );
}

// Get recommended jobs
export function useRecommendedJobs(
  employeeId: string,
  page: number = 1,
  limit: number = 10
) {
  return usePaginatedApi(
    (p, l) => jobsApi.getRecommendedJobs(employeeId, p, l),
    limit,
    { immediate: !!employeeId }
  );
}

// Get job applications
export function useJobApplications(
  jobId: string,
  page: number = 1,
  limit: number = 20
) {
  return usePaginatedApi(
    (p, l) => jobsApi.getJobApplications(jobId, p, l),
    limit,
    { immediate: !!jobId }
  );
}

// Get my applications (for job seekers)
export function useMyApplications(page: number = 1, limit: number = 20) {
  return usePaginatedApi(
    (p, l) => jobsApi.getMyApplications(p, l),
    limit
  );
}

// Search jobs
export function useJobSearch(query: string, filters?: JobFilters) {
  return useApi(
    () => jobsApi.searchJobs(query, filters),
    { immediate: !!query.trim() }
  );
}

// Get jobs by category
export function useJobsByCategory(category: string) {
  return useApi(
    () => jobsApi.getJobsByCategory(category),
    { immediate: !!category }
  );
}

// Get nearby jobs
export function useNearbyJobs(
  latitude?: number,
  longitude?: number,
  radius: number = 25
) {
  return useApi(
    () => jobsApi.getJobsNearLocation(latitude!, longitude!, radius),
    { immediate: !!(latitude && longitude) }
  );
}

// Get saved jobs
export function useSavedJobs(page: number = 1, limit: number = 20) {
  return usePaginatedApi(
    (p, l) => jobsApi.getSavedJobs(p, l),
    limit
  );
}

// Get job statistics
export function useJobStats(restaurantId?: string) {
  return useApi(() => jobsApi.getJobStats(restaurantId));
}

// Mutations
export function useCreateJob(options?: {
  onSuccess?: (job: Job) => void;
  onError?: (error: string) => void;
}) {
  return useMutation(
    (data: CreateJobRequest) => jobsApi.createJob(data),
    options
  );
}

export function useUpdateJob(options?: {
  onSuccess?: (job: Job) => void;
  onError?: (error: string) => void;
}) {
  return useMutation(
    ({ id, data }: { id: string; data: Partial<CreateJobRequest> }) =>
      jobsApi.updateJob(id, data),
    options
  );
}

export function useDeleteJob(options?: {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}) {
  return useMutation(
    (id: string) => jobsApi.deleteJob(id),
    options
  );
}

export function useApplyToJob(options?: {
  onSuccess?: (application: JobApplication) => void;
  onError?: (error: string) => void;
}) {
  return useMutation(
    ({
      jobId,
      applicationData,
    }: {
      jobId: string;
      applicationData: {
        coverLetter: string;
        resume?: File;
        expectedSalary?: number;
        availableFrom?: string;
      };
    }) => jobsApi.applyToJob(jobId, applicationData),
    options
  );
}

export function useUpdateApplicationStatus(options?: {
  onSuccess?: (application: JobApplication) => void;
  onError?: (error: string) => void;
}) {
  return useMutation(
    ({
      jobId,
      applicationId,
      status,
      notes,
    }: {
      jobId: string;
      applicationId: string;
      status: JobApplication['status'];
      notes?: string;
    }) => jobsApi.updateApplicationStatus(jobId, applicationId, status, notes),
    options
  );
}

export function useWithdrawApplication(options?: {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}) {
  return useMutation(
    ({ jobId, applicationId }: { jobId: string; applicationId: string }) =>
      jobsApi.withdrawApplication(jobId, applicationId),
    options
  );
}

export function useToggleJobStatus(options?: {
  onSuccess?: (job: Job) => void;
  onError?: (error: string) => void;
}) {
  return useMutation(
    ({ id, status }: { id: string; status: Job['status'] }) =>
      jobsApi.toggleJobStatus(id, status),
    options
  );
}

export function useSaveJob(options?: {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}) {
  return useMutation(
    (jobId: string) => jobsApi.saveJob(jobId),
    options
  );
}

export function useUnsaveJob(options?: {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}) {
  return useMutation(
    (jobId: string) => jobsApi.unsaveJob(jobId),
    options
  );
}

export function useReportJob(options?: {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}) {
  return useMutation(
    ({ jobId, reason, details }: { jobId: string; reason: string; details?: string }) =>
      jobsApi.reportJob(jobId, reason, details),
    options
  );
}