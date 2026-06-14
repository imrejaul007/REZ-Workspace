// @ts-nocheck
/**
 * useFollowSystem Hook
 * Manages follow/unfollow functionality with optimistic updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useIsAuthenticated, useAuthLoading } from '@/stores/selectors';
import * as followApi from '@/services/followApi';
import type { FollowUser, FollowStatus, FollowCounts, FollowRequest } from '@/services/followApi';

interface UseFollowSystemOptions {
  userId?: string;
  onFollowChange?: (userId: string, isFollowing: boolean) => void;
  onFollowersChange?: (count: number) => void;
}

interface FollowSystemState {
  isFollowing: boolean;
  isFollower: boolean;
  isMutual: boolean;
  followersCount: number;
  followingCount: number;
  mutualCount: number;
  isLoading: boolean;
  error: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
}
interface FollowStatusData {
  isFollowing: boolean;
  isFollower: boolean;
  isMutual: boolean;
}
interface FollowersData { followers: import('@/services/followApi').FollowUser[]; pagination: Pagination; }
interface FollowingData { following: import('@/services/followApi').FollowUser[]; pagination: Pagination; }
interface MutualsData { mutuals: import('@/services/followApi').FollowUser[]; pagination: Pagination; }
interface SuggestionsData { suggestions: import('@/services/followApi').FollowUser[]; }
interface FollowRequestsData { requests: import('@/services/followApi').FollowRequest[]; }
interface FollowSearchData { users: import('@/services/followApi').FollowUser[]; pagination: Pagination; }

export function useFollowSystem(targetUserId?: string, options: UseFollowSystemOptions = {}) {
  const isAuthenticated = useIsAuthenticated();
  const authLoading = useAuthLoading();
  const [state, setState] = useState<FollowSystemState>({
    isFollowing: false,
    isFollower: false,
    isMutual: false,
    followersCount: 0,
    followingCount: 0,
    mutualCount: 0,
    isLoading: false,
    error: null,
  });

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const [suggestions, setSuggestions] = useState<FollowUser[]>([]);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [mutuals, setMutuals] = useState<FollowUser[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FollowRequest[]>([]);

  // Load follow status
  const loadFollowStatus = useCallback(async () => {
    if (!targetUserId) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const [statusResponse, countsResponse] = await Promise.all([
        followApi.checkFollowStatus(targetUserId),
        followApi.getFollowCounts(targetUserId),
      ]);

      if (statusResponse.success && countsResponse.success) {
        if (isMountedRef.current) {
          setState(prev => ({
            ...prev,
            isFollowing: (statusResponse.data as FollowStatusData).isFollowing,
            isFollower: (statusResponse.data as FollowStatusData).isFollower,
            isMutual: (statusResponse.data as FollowStatusData).isMutual,
            followersCount: (countsResponse.data as FollowCounts).followersCount,
            followingCount: (countsResponse.data as FollowCounts).followingCount,
            mutualCount: (countsResponse.data as FollowCounts).mutualCount,
            isLoading: false,
          }));
        }
      }
    } catch (error) {
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message || 'Failed to load follow status',
        }));
      }
    }
  }, [targetUserId]);

  // Load follow status on mount
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    if (targetUserId) {
      loadFollowStatus();
    }
  }, [targetUserId, loadFollowStatus, authLoading, isAuthenticated]);

  // Follow user with optimistic update
  const follow = useCallback(async (userId: string) => {
    try {
      // Optimistic update
      setState(prev => ({
        ...prev,
        isFollowing: true,
        followingCount: prev.followingCount + 1,
      }));

      const response: unknown = await followApi.followUser(userId);

      if (response.success) {
        if (isMountedRef.current) {
          setState(prev => ({
            ...prev,
            followersCount: (response.data as FollowStatus).followersCount,
            followingCount: (response.data as FollowStatus).followingCount,
          }));
        }

        // Trigger callback
        if (options.onFollowChange) {
          options.onFollowChange(userId, true);
        }
        if (options.onFollowersChange) {
          options.onFollowersChange((response.data as FollowStatus).followersCount);
        }

        return true;
      }
      return false;
    } catch (error) {
      // Revert optimistic update
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          isFollowing: false,
          followingCount: Math.max(0, prev.followingCount - 1),
          error: error.message || 'Failed to follow user',
        }));
      }
      return false;
    }
  }, [options]);

  // Unfollow user with optimistic update
  const unfollow = useCallback(async (userId: string) => {
    try {
      // Optimistic update
      setState(prev => ({
        ...prev,
        isFollowing: false,
        followingCount: Math.max(0, prev.followingCount - 1),
      }));

      const response: unknown = await followApi.unfollowUser(userId);

      if (response.success) {
        if (isMountedRef.current) {
          setState(prev => ({
            ...prev,
            followersCount: (response.data as FollowStatus).followersCount,
            followingCount: (response.data as FollowStatus).followingCount,
          }));
        }

        // Trigger callback
        if (options.onFollowChange) {
          options.onFollowChange(userId, false);
        }
        if (options.onFollowersChange) {
          options.onFollowersChange((response.data as FollowStatus).followersCount);
        }

        return true;
      }
      return false;
    } catch (error) {
      // Revert optimistic update
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          isFollowing: true,
          followingCount: prev.followingCount + 1,
          error: error.message || 'Failed to unfollow user',
        }));
      }
      return false;
    }
  }, [options]);

  // Toggle follow/unfollow
  const toggleFollow = useCallback(async (userId: string) => {
    if (state.isFollowing) {
      return await unfollow(userId);
    } else {
      return await follow(userId);
    }
  }, [state.isFollowing, follow, unfollow]);

  // Load follow suggestions
  const loadSuggestions = useCallback(async (limit: number = 10) => {
    try {
      const response: unknown = await followApi.getFollowSuggestions(limit);
      if (response.success) {
        setSuggestions((response.data as SuggestionsData).suggestions || []);
      }
    } catch (error) {
      // silently handle
    }
  }, []);

  // Load followers list
  const loadFollowers = useCallback(async (userId: string, page: number = 1) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const response: unknown = await followApi.getFollowers(userId, page, 50);

      if (response.success) {
        if (page === 1) {
          setFollowers((response.data as FollowersData).followers || []);
        } else {
          setFollowers(prev => [...prev, ...((response.data as FollowersData).followers || [])]);
        }
        if (isMountedRef.current) setState(prev => ({ ...prev, isLoading: false }));
        return (response.data as FollowersData).pagination;
      }

      if (isMountedRef.current) setState(prev => ({ ...prev, isLoading: false }));
      return null;
    } catch (error) {
      if (isMountedRef.current) setState(prev => ({ ...prev, isLoading: false, error: error.message }));
      return null;
    }
  }, []);

  // Load following list
  const loadFollowing = useCallback(async (userId: string, page: number = 1) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const response: unknown = await followApi.getFollowing(userId, page, 50);

      if (response.success) {
        if (page === 1) {
          setFollowing((response.data as FollowingData).following || []);
        } else {
          setFollowing(prev => [...prev, ...((response.data as FollowingData).following || [])]);
        }
        if (isMountedRef.current) setState(prev => ({ ...prev, isLoading: false }));
        return (response.data as FollowersData).pagination;
      }

      if (isMountedRef.current) setState(prev => ({ ...prev, isLoading: false }));
      return null;
    } catch (error) {
      if (isMountedRef.current) setState(prev => ({ ...prev, isLoading: false, error: error.message }));
      return null;
    }
  }, []);

  // Load mutual followers
  const loadMutuals = useCallback(async (userId: string, page: number = 1) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const response: unknown = await followApi.getMutualFollowers(userId, page, 50);

      if (response.success) {
        if (page === 1) {
          setMutuals((response.data as MutualsData).mutuals || []);
        } else {
          setMutuals(prev => [...prev, ...((response.data as MutualsData).mutuals || [])]);
        }
        if (isMountedRef.current) setState(prev => ({ ...prev, isLoading: false }));
        return (response.data as FollowersData).pagination;
      }

      if (isMountedRef.current) setState(prev => ({ ...prev, isLoading: false }));
      return null;
    } catch (error) {
      if (isMountedRef.current) setState(prev => ({ ...prev, isLoading: false, error: error.message }));
      return null;
    }
  }, []);

  // Load pending follow requests
  const loadPendingRequests = useCallback(async () => {
    try {
      const response: unknown = await followApi.getPendingFollowRequests();
      if (response.success) {
        setPendingRequests((response.data as FollowRequestsData).requests || []);
      }
    } catch (error) {
      // silently handle
    }
  }, []);

  // Accept follow request
  const acceptRequest = useCallback(async (requestId: string) => {
    try {
      const response: unknown = await followApi.acceptFollowRequest(requestId);
      if (response.success) {
        // Remove from pending
        setPendingRequests(prev => prev.filter(req => req._id !== requestId));
        // Reload counts
        if (targetUserId) {
          loadFollowStatus();
        }
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }, [targetUserId, loadFollowStatus]);

  // Reject follow request
  const rejectRequest = useCallback(async (requestId: string) => {
    try {
      const response: unknown = await followApi.rejectFollowRequest(requestId);
      if (response.success) {
        // Remove from pending
        setPendingRequests(prev => prev.filter(req => req._id !== requestId));
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }, []);

  // Remove follower
  const removeFollower = useCallback(async (userId: string) => {
    try {
      const response: unknown = await followApi.removeFollower(userId);
      if (response.success) {
        // Remove from followers list
        setFollowers(prev => prev.filter(user => user._id !== userId));
        // Update count
        setState(prev => ({
          ...prev,
          followersCount: Math.max(0, prev.followersCount - 1),
        }));
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }, []);

  // Search users
  const searchUsers = useCallback(async (query: string, page: number = 1) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const response: unknown = await followApi.searchUsers(query, page, 20);

      if (isMountedRef.current) setState(prev => ({ ...prev, isLoading: false }));

      if (response.success) {
        return {
          users: (response.data as FollowSearchData).users || [],
          pagination: (response.data as FollowSearchData).pagination,
        };
      }
      return null;
    } catch (error) {
      if (isMountedRef.current) setState(prev => ({ ...prev, isLoading: false, error: error.message }));
      return null;
    }
  }, []);

  return {
    // State
    ...state,
    suggestions,
    followers,
    following,
    mutuals,
    pendingRequests,

    // Actions
    follow,
    unfollow,
    toggleFollow,
    loadFollowStatus,
    loadSuggestions,
    loadFollowers,
    loadFollowing,
    loadMutuals,
    loadPendingRequests,
    acceptRequest,
    rejectRequest,
    removeFollower,
    searchUsers,
  };
}

export default useFollowSystem;
