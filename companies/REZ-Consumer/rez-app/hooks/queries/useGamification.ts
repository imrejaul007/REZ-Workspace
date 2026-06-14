// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import gamificationApi from '@/services/gamificationApi';

export function useCheckInRewards() {
  return useQuery({
    queryKey: queryKeys.gamification.checkIn(),
    queryFn: () => (gamificationApi as unknown).getCheckInRewards(),
  });
}

export function useStreak() {
  return useQuery({
    queryKey: queryKeys.gamification.streak(),
    queryFn: () => (gamificationApi as unknown).getStreakData(),
  });
}

export function useAchievements(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.gamification.achievements(filters),
    queryFn: () => (gamificationApi as unknown).getAchievements(filters),
  });
}

export function useSpinWheel() {
  return useQuery({
    queryKey: queryKeys.gamification.spinWheel(),
    queryFn: () => (gamificationApi as unknown).getSpinWheelData(),
  });
}

export function useChallenges() {
  return useQuery({
    queryKey: queryKeys.gamification.challenges(),
    queryFn: () => (gamificationApi as unknown).getChallenges(),
  });
}
