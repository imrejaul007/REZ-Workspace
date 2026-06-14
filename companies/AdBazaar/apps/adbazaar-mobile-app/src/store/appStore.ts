import { create } from 'zustand';
import { Post, Draft, CalendarEvent, AnalyticsData, Platform, QuickAction } from '../types';

interface AppState {
  // User & Auth
  isAuthenticated: boolean;
  user: { id: string; name: string; email: string; avatar?: string } | null;

  // Posts
  posts: Post[];
  currentDraft: Partial<Draft>;
  selectedPost: Post | null;

  // Calendar
  calendarEvents: CalendarEvent[];
  selectedDate: string;

  // Analytics
  analytics: AnalyticsData | null;
  analyticsPeriod: '7d' | '30d' | '90d';

  // Platforms
  connectedPlatforms: Platform[];

  // Quick Actions
  quickActions: QuickAction[];

  // Network
  isOnline: boolean;
  syncStatus: {
    lastSyncAt: string;
    pendingActions: number;
  };

  // Actions
  setAuthenticated: (value: boolean) => void;
  setUser: (user: AppState['user']) => void;
  setPosts: (posts: Post[]) => void;
  addPost: (post: Post) => void;
  updatePost: (id: string, data: Partial<Post>) => void;
  removePost: (id: string) => void;
  setCurrentDraft: (draft: Partial<Draft>) => void;
  clearDraft: () => void;
  setSelectedPost: (post: Post | null) => void;
  setCalendarEvents: (events: CalendarEvent[]) => void;
  addCalendarEvent: (event: CalendarEvent) => void;
  setSelectedDate: (date: string) => void;
  setAnalytics: (data: AnalyticsData) => void;
  setAnalyticsPeriod: (period: '7d' | '30d' | '90d') => void;
  setConnectedPlatforms: (platforms: Platform[]) => void;
  setIsOnline: (value: boolean) => void;
  setSyncStatus: (status: { lastSyncAt: string; pendingActions: number }) => void;
  initializeQuickActions: () => void;
}

const defaultQuickActions: QuickAction[] = [
  {
    id: 'create_post',
    icon: 'plus-circle',
    label: 'New Post',
    action: 'create_post',
    color: '#6366f1',
  },
  {
    id: 'schedule',
    icon: 'calendar-plus',
    label: 'Schedule',
    action: 'schedule',
    color: '#10b981',
  },
  {
    id: 'analytics',
    icon: 'bar-chart-2',
    label: 'Analytics',
    action: 'view_analytics',
    color: '#f59e0b',
  },
  {
    id: 'queue',
    icon: 'list',
    label: 'Queue',
    action: 'check_queue',
    color: '#8b5cf6',
  },
  {
    id: 'reply',
    icon: 'message-circle',
    label: 'Reply',
    action: 'reply',
    color: '#ec4899',
  },
];

export const useAppStore = create<AppState>((set) => ({
  // Initial State
  isAuthenticated: false,
  user: null,
  posts: [],
  currentDraft: {
    content: '',
    media: [],
    platforms: [],
    tags: [],
  },
  selectedPost: null,
  calendarEvents: [],
  selectedDate: new Date().toISOString().split('T')[0],
  analytics: null,
  analyticsPeriod: '30d',
  connectedPlatforms: [],
  quickActions: defaultQuickActions,
  isOnline: true,
  syncStatus: {
    lastSyncAt: new Date().toISOString(),
    pendingActions: 0,
  },

  // Actions
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  setUser: (user) => set({ user }),

  setPosts: (posts) => set({ posts }),
  addPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),
  updatePost: (id, data) =>
    set((state) => ({
      posts: state.posts.map((p) => (p.id === id ? { ...p, ...data } : p)),
    })),
  removePost: (id) =>
    set((state) => ({
      posts: state.posts.filter((p) => p.id !== id),
    })),

  setCurrentDraft: (draft) =>
    set((state) => ({
      currentDraft: { ...state.currentDraft, ...draft },
    })),
  clearDraft: () =>
    set({
      currentDraft: {
        content: '',
        media: [],
        platforms: [],
        tags: [],
      },
    }),
  setSelectedPost: (post) => set({ selectedPost: post }),

  setCalendarEvents: (events) => set({ calendarEvents: events }),
  addCalendarEvent: (event) =>
    set((state) => ({
      calendarEvents: [...state.calendarEvents, event],
    })),
  setSelectedDate: (date) => set({ selectedDate: date }),

  setAnalytics: (data) => set({ analytics: data }),
  setAnalyticsPeriod: (period) => set({ analyticsPeriod: period }),

  setConnectedPlatforms: (platforms) => set({ connectedPlatforms: platforms }),

  setIsOnline: (value) => set({ isOnline: value }),
  setSyncStatus: (status) => set({ syncStatus: status }),

  initializeQuickActions: () => set({ quickActions: defaultQuickActions }),
}));
