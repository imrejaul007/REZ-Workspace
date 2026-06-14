// @ts-nocheck
import { create, SetState, GetState } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import {
  ProfileContextType,
  ProfileCompletionStatus,
  User,
  ProfileMenuItem,
  UserPreferences,
} from '@/types/profile.types';
import profileApi from '@/services/profileApi';
import { errorLogger } from '@/services/errorLogger';

interface ProfileStoreState extends ProfileContextType {}

type StoreSet = SetState<ProfileStoreState>;
type StoreGet = GetState<ProfileStoreState>;

export const useProfileStore = create<ProfileStoreState>()(
  persist(
    (set: StoreSet, get: StoreGet) => ({
      user: null,
      isLoading: false,
      error: null,
      completionStatus: null,
      isModalVisible: false,

      refreshCompletionStatus: async () => {
        try {
          const response = await profileApi.getProfileCompletion();
          if (response.success && response.data) {
            set({ completionStatus: response.data });
          }
        } catch (err) {
          errorLogger.logApiError('profileStore:refreshCompletionStatus', err, '/api/profile/completion', 500);
        }
      },

      showModal: () => {
        set({ isModalVisible: true });
      },

      hideModal: () => {
        set({ isModalVisible: false });
      },

      updateUser: async (_userData: Partial<User>) => {
        // Stub — the real implementation lives in ProfileProvider which uses
        // AuthContext for auth-dependent profile updates.
        // The store fallback only prevents crashes when used outside the provider.
      },

      updatePreferences: async (_preferences: Partial<UserPreferences>) => {
        // Stub — requires AuthContext
      },

      logout: async () => {
        // Stub — requires AuthContext
        router.replace('/sign-in');
      },

      navigateToScreen: (route: string, params?) => {
        try {
          if (params) {
            router.push({ pathname: route as unknown, params });
          } else {
            router.push(route as unknown);
          }
        } catch (err) {
          errorLogger.error('profileStore:navigateToScreen', err);
          router.push('/');
        }
      },
    }),
    {
      name: 'rez-profile-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state: ProfileStoreState) => ({
        // Only persist user data, not loading states or modal visibility
        user: state.user,
        completionStatus: state.completionStatus,
      }),
    }
  )
);
