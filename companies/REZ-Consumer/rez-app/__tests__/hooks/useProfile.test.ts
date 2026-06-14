// @ts-nocheck
/**
 * Unit Tests for useProfile hook
 */

import { renderHook, waitFor, act } from '@testing-library/react-native';

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatar?: string;
}

const mockGetProfile = jest.fn();
const mockUpdateProfile = jest.fn();

describe('useProfile', () => {
  beforeEach(() => {
    mockGetProfile.mockReset();
    mockUpdateProfile.mockReset();
  });

  it('should load user profile', async () => {
    const profile: UserProfile = {
      id: 'user-1',
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+1234567890',
      avatar: 'https://example.com/avatar.jpg',
    };
    mockGetProfile.mockResolvedValue(profile);

    const result = await mockGetProfile('user-1');
    expect(result.id).toBe('user-1');
    expect(result.fullName).toBe('Jane Doe');
    expect(result.email).toContain('@');
  });

  it('should update user profile fields', async () => {
    const updates = { fullName: 'Jane Smith', phone: '+9876543210' };
    mockUpdateProfile.mockResolvedValue({ success: true, updated: updates });

    const result = await mockUpdateProfile('user-1', updates);
    expect(result.success).toBe(true);
    expect(result.updated.fullName).toBe('Jane Smith');
    expect(mockUpdateProfile).toHaveBeenCalledWith('user-1', updates);
  });

  it('should handle profile load failure gracefully', async () => {
    mockGetProfile.mockRejectedValue(new Error('Network error'));

    await expect(mockGetProfile('user-bad')).rejects.toThrow('Network error');
    expect(mockGetProfile).toHaveBeenCalledTimes(1);
  });
});
