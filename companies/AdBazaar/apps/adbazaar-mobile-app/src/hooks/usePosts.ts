import { useState, useCallback, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { api } from '../services/api';
import { offline } from '../services/offline';
import { Post, Draft } from '../types';

export function usePosts() {
  const { posts, setPosts, addPost, updatePost, removePost, isOnline } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isOnline) {
        const data = await api.getPosts();
        setPosts(data);
        // Cache for offline
        await offline.cachePosts(data);
      } else {
        // Use cached posts
        const cached = await offline.getCachedPosts();
        setPosts(cached);
      }
    } catch (err: any) {
      setError(err.message);
      // Fall back to cache
      const cached = await offline.getCachedPosts();
      setPosts(cached);
    } finally {
      setIsLoading(false);
    }
  }, [isOnline, setPosts]);

  const createPost = useCallback(
    async (post: Partial<Post>): Promise<Post | null> => {
      setError(null);
      try {
        if (isOnline) {
          const newPost = await api.createPost(post);
          addPost(newPost);
          return newPost;
        } else {
          // Queue for later
          await offline.addToQueue({
            type: 'create_post',
            payload: post,
          });
          // Create local draft
          const localPost: Post = {
            id: `local_${Date.now()}`,
            ...post,
            status: 'draft',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as Post;
          addPost(localPost);
          return localPost;
        }
      } catch (err: any) {
        setError(err.message);
        return null;
      }
    },
    [isOnline, addPost]
  );

  const editPost = useCallback(
    async (id: string, data: Partial<Post>): Promise<Post | null> => {
      setError(null);
      try {
        if (isOnline) {
          const updated = await api.updatePost(id, data);
          updatePost(id, updated);
          return updated;
        } else {
          await offline.addToQueue({
            type: 'update_post',
            payload: { id, data },
          });
          updatePost(id, data);
          return posts.find((p) => p.id === id) || null;
        }
      } catch (err: any) {
        setError(err.message);
        return null;
      }
    },
    [isOnline, posts, updatePost]
  );

  const deletePost = useCallback(
    async (id: string): Promise<boolean> => {
      setError(null);
      try {
        if (isOnline) {
          await api.deletePost(id);
        } else {
          await offline.addToQueue({
            type: 'delete_post',
            payload: { id },
          });
        }
        removePost(id);
        return true;
      } catch (err: any) {
        setError(err.message);
        return false;
      }
    },
    [isOnline, removePost]
  );

  const schedulePost = useCallback(
    async (id: string, scheduledAt: string): Promise<Post | null> => {
      setError(null);
      try {
        const updated = await api.schedulePost(id, scheduledAt);
        updatePost(id, updated);
        return updated;
      } catch (err: any) {
        setError(err.message);
        return null;
      }
    },
    [updatePost]
  );

  const publishPost = useCallback(
    async (id: string): Promise<Post | null> => {
      setError(null);
      try {
        const updated = await api.publishPost(id);
        updatePost(id, updated);
        return updated;
      } catch (err: any) {
        setError(err.message);
        return null;
      }
    },
    [updatePost]
  );

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    posts,
    isLoading,
    error,
    fetchPosts,
    createPost,
    editPost,
    deletePost,
    schedulePost,
    publishPost,
  };
}
