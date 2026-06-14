import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { jobsApi } from '@/lib/api/jobs';
import { EnhancedJob, PaginatedResponse, SearchFilters } from '@/types/api';
import { toast } from 'react-hot-toast';

// Query keys for jobs
export const jobsKeys = {
  all: ['jobs'] as const,
  lists: () => [...jobsKeys.all, 'list'] as const,
  list: (filters?: SearchFilters) => [...jobsKeys.lists(), filters] as const,
  details: () => [...jobsKeys.all, 'detail'] as const,
  detail: (id: string) => [...jobsKeys.details(), id] as const,
  search: (query: string) => [...jobsKeys.all, 'search', query] as const,
  stats: () => [...jobsKeys.all, 'stats'] as const,
  recommendations: (userId: string) => [...jobsKeys.all, 'recommendations', userId] as const,
  saved: () => [...jobsKeys.all, 'saved'] as const,
  applications: () => [...jobsKeys.all, 'applications'] as const,
  myJobs: () => [...jobsKeys.all, 'myJobs'] as const,
};

// Enhanced hooks with better error handling and loading states
export function useJobs(filters?: SearchFilters, page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: jobsKeys.list({ ...filters, page, limit }),
    queryFn: () => jobsApi.getJobs(filters, page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as unknown).status;
        if (status >= 400 && status < 500) return false;
      }
      return failureCount < 3;
    },
    onError: (error) => {
      console.error('Failed to fetch jobs:', error);
      toast.error('Failed to load jobs. Please try again.');
    },
    keepPreviousData: true,
    refetchOnWindowFocus: false,
  });
}

export function useInfiniteJobs(filters?: SearchFilters, limit: number = 20) {
  return useInfiniteQuery({
    queryKey: jobsKeys.list(filters),
    queryFn: ({ pageParam = 1 }) => jobsApi.getJobs(filters, pageParam, limit),
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    retry: 2,
    onError: (error) => {
      console.error('Failed to fetch infinite jobs:', error);
      toast.error('Failed to load more jobs.');
    },
  });
}

export function useJob(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: jobsKeys.detail(id),
    queryFn: () => jobsApi.getJob(id),
    enabled: enabled && !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    onError: (error) => {
      console.error('Failed to fetch job details:', error);
      toast.error('Failed to load job details.');
    },
  });
}

export function useJobSearch(query: string, filters?: SearchFilters, enabled: boolean = true) {
  return useQuery({
    queryKey: jobsKeys.search(query),
    queryFn: () => jobsApi.searchJobs(query, filters),
    enabled: enabled && query.trim().length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    onError: (error) => {
      console.error('Failed to search jobs:', error);
      toast.error('Search failed. Please try again.');
    },
  });
}

export function useJobStats(restaurantId?: string) {
  return useQuery({
    queryKey: jobsKeys.stats(),
    queryFn: () => jobsApi.getJobStats(restaurantId),
    staleTime: 15 * 60 * 1000, // 15 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    onError: (error) => {
      console.error('Failed to fetch job stats:', error);
    },
  });
}

export function useMyJobs(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: [...jobsKeys.myJobs(), page, limit],
    queryFn: () => jobsApi.getMyJobs(page, limit),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    retry: 2,
    onError: (error) => {
      console.error('Failed to fetch my jobs:', error);
      toast.error('Failed to load your jobs.');
    },
  });
}

export function useSavedJobs(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: [...jobsKeys.saved(), page, limit],
    queryFn: () => jobsApi.getSavedJobs(page, limit),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    retry: 2,
    onError: (error) => {
      console.error('Failed to fetch saved jobs:', error);
      toast.error('Failed to load saved jobs.');
    },
  });
}

export function useMyApplications(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: [...jobsKeys.applications(), page, limit],
    queryFn: () => jobsApi.getMyApplications(page, limit),
    staleTime: 2 * 60 * 1000, // More frequent updates for applications
    cacheTime: 5 * 60 * 1000,
    retry: 2,
    onError: (error) => {
      console.error('Failed to fetch applications:', error);
      toast.error('Failed to load your applications.');
    },
  });
}

// Mutations with optimistic updates
export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: jobsApi.createJob,
    onSuccess: (newJob) => {
      // Invalidate job lists to show the new job
      queryClient.invalidateQueries(jobsKeys.lists());
      queryClient.invalidateQueries(jobsKeys.myJobs());
      queryClient.invalidateQueries(jobsKeys.stats());

      toast.success('Job posted successfully!');
    },
    onError: (error) => {
      console.error('Failed to create job:', error);
      toast.error('Failed to post job. Please try again.');
    },
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => jobsApi.updateJob(id, data),
    onSuccess: (updatedJob, { id }) => {
      // Update the specific job in cache
      queryClient.setQueryData(jobsKeys.detail(id), updatedJob);

      // Invalidate related queries
      queryClient.invalidateQueries(jobsKeys.lists());
      queryClient.invalidateQueries(jobsKeys.myJobs());

      toast.success('Job updated successfully!');
    },
    onError: (error) => {
      console.error('Failed to update job:', error);
      toast.error('Failed to update job. Please try again.');
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: jobsApi.deleteJob,
    onSuccess: (_, deletedJobId) => {
      // Remove from cache
      queryClient.removeQueries(jobsKeys.detail(deletedJobId));

      // Invalidate lists
      queryClient.invalidateQueries(jobsKeys.lists());
      queryClient.invalidateQueries(jobsKeys.myJobs());
      queryClient.invalidateQueries(jobsKeys.stats());

      toast.success('Job deleted successfully!');
    },
    onError: (error) => {
      console.error('Failed to delete job:', error);
      toast.error('Failed to delete job. Please try again.');
    },
  });
}

export function useApplyToJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, applicationData }: { jobId: string; applicationData: unknown }) =>
      jobsApi.applyToJob(jobId, applicationData),
    onSuccess: (application, { jobId }) => {
      // Invalidate applications list
      queryClient.invalidateQueries(jobsKeys.applications());

      // Update job application count optimistically
      queryClient.setQueryData(jobsKeys.detail(jobId), (oldData) => {
        if (oldData) {
          return {
            ...oldData,
            data: {
              ...oldData.data,
              applicationCount: (oldData.data.applicationCount || 0) + 1,
            },
          };
        }
        return oldData;
      });

      toast.success('Application submitted successfully!');
    },
    onError: (error) => {
      console.error('Failed to apply to job:', error);
      toast.error('Failed to submit application. Please try again.');
    },
  });
}

export function useSaveJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: jobsApi.saveJob,
    onMutate: async (jobId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries(jobsKeys.detail(jobId));

      // Snapshot the previous value
      const previousJob = queryClient.getQueryData(jobsKeys.detail(jobId));

      // Optimistically update the job
      queryClient.setQueryData(jobsKeys.detail(jobId), (old) => {
        if (old) {
          return {
            ...old,
            data: {
              ...old.data,
              saved: true,
            },
          };
        }
        return old;
      });

      return { previousJob };
    },
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries(jobsKeys.saved());
      toast.success('Job saved!');
    },
    onError: (error, jobId, context) => {
      // Revert optimistic update
      if (context?.previousJob) {
        queryClient.setQueryData(jobsKeys.detail(jobId), context.previousJob);
      }
      console.error('Failed to save job:', error);
      toast.error('Failed to save job. Please try again.');
    },
    onSettled: (_, __, jobId) => {
      queryClient.invalidateQueries(jobsKeys.detail(jobId));
    },
  });
}

export function useUnsaveJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: jobsApi.unsaveJob,
    onMutate: async (jobId) => {
      await queryClient.cancelQueries(jobsKeys.detail(jobId));
      const previousJob = queryClient.getQueryData(jobsKeys.detail(jobId));

      queryClient.setQueryData(jobsKeys.detail(jobId), (old) => {
        if (old) {
          return {
            ...old,
            data: {
              ...old.data,
              saved: false,
            },
          };
        }
        return old;
      });

      return { previousJob };
    },
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries(jobsKeys.saved());
      toast.success('Job removed from saved!');
    },
    onError: (error, jobId, context) => {
      if (context?.previousJob) {
        queryClient.setQueryData(jobsKeys.detail(jobId), context.previousJob);
      }
      console.error('Failed to unsave job:', error);
      toast.error('Failed to remove job. Please try again.');
    },
    onSettled: (_, __, jobId) => {
      queryClient.invalidateQueries(jobsKeys.detail(jobId));
    },
  });
}

export function useToggleJobStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: unknown }) =>
      jobsApi.toggleJobStatus(id, status),
    onSuccess: (updatedJob, { id }) => {
      queryClient.setQueryData(jobsKeys.detail(id), updatedJob);
      queryClient.invalidateQueries(jobsKeys.lists());
      queryClient.invalidateQueries(jobsKeys.myJobs());
      queryClient.invalidateQueries(jobsKeys.stats());

      toast.success('Job status updated successfully!');
    },
    onError: (error) => {
      console.error('Failed to update job status:', error);
      toast.error('Failed to update job status. Please try again.');
    },
  });
}

// Utility hooks
export function usePrefetchJob(id: string) {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: jobsKeys.detail(id),
      queryFn: () => jobsApi.getJob(id),
      staleTime: 10 * 60 * 1000,
    });
  };
}

export function useJobCache() {
  const queryClient = useQueryClient();

  return {
    getJob: (id: string) => queryClient.getQueryData(jobsKeys.detail(id)),
    setJob: (id: string, data) => queryClient.setQueryData(jobsKeys.detail(id), data),
    invalidateJob: (id: string) => queryClient.invalidateQueries(jobsKeys.detail(id)),
    invalidateAllJobs: () => queryClient.invalidateQueries(jobsKeys.all),
    clearJobCache: () => queryClient.clear(),
  };
}