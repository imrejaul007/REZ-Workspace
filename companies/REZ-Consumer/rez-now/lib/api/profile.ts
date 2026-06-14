import { authClient } from '@/lib/api/client';

export interface UserProfile {
  name: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
  totalOrders: number;
  totalSpent: number;
  joinedAt: string;
}

interface ProfileResponse {
  success: boolean;
  data: UserProfile;
}

export async function getProfile(): Promise<UserProfile> {
  const { data } = await authClient.get<ProfileResponse>('/api/web-ordering/profile');
  return data.data;
}

export async function updateProfile(payload: { name: string }): Promise<UserProfile> {
  const { data } = await authClient.patch<ProfileResponse>('/api/web-ordering/profile', payload);
  return data.data;
}
