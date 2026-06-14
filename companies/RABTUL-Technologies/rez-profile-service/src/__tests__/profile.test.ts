/**
 * Profile Service Tests
 * Tests for user profile management, preferences, and settings
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Types
interface Profile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  preferences: ProfilePreferences;
  createdAt: Date;
  updatedAt: Date;
}

interface ProfilePreferences {
  language: string;
  timezone: string;
  notifications: NotificationPrefs;
  privacy: PrivacyPrefs;
}

interface NotificationPrefs {
  email: boolean;
  push: boolean;
  sms: boolean;
  whatsapp: boolean;
}

interface PrivacyPrefs {
  showProfile: boolean;
  showEmail: boolean;
  showPhone: boolean;
  allowMessages: boolean;
}

// Profile validation
function validateProfile(profile: Partial<Profile>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!profile.firstName || profile.firstName.trim().length === 0) {
    errors.push('firstName is required');
  }
  if (profile.firstName && profile.firstName.length > 50) {
    errors.push('firstName must be less than 50 characters');
  }

  if (!profile.lastName || profile.lastName.trim().length === 0) {
    errors.push('lastName is required');
  }

  if (!profile.email || !isValidEmail(profile.email)) {
    errors.push('valid email is required');
  }

  if (profile.phone && !isValidPhone(profile.phone)) {
    errors.push('invalid phone format');
  }

  return { valid: errors.length === 0, errors };
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{9,14}$/;
  return phoneRegex.test(phone.replace(/[\s-()]/g, ''));
}

// Full name
function getFullName(profile: Profile): string {
  return `${profile.firstName} ${profile.lastName}`;
}

// Initials
function getInitials(profile: Profile): string {
  const first = profile.firstName.charAt(0).toUpperCase();
  const last = profile.lastName.charAt(0).toUpperCase();
  return `${first}${last}`;
}

// Search by name
function searchProfiles(profiles: Profile[], query: string): Profile[] {
  const q = query.toLowerCase();
  return profiles.filter(p =>
    p.firstName.toLowerCase().includes(q) ||
    p.lastName.toLowerCase().includes(q) ||
    p.email.toLowerCase().includes(q)
  );
}

describe('Profile Validation', () => {
  it('should validate complete profile', () => {
    const profile: Partial<Profile> = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    };

    const result = validateProfile(profile);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject missing firstName', () => {
    const profile: Partial<Profile> = {
      firstName: '',
      lastName: 'Doe',
      email: 'john@example.com'
    };

    const result = validateProfile(profile);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('firstName is required');
  });

  it('should reject missing lastName', () => {
    const profile: Partial<Profile> = {
      firstName: 'John',
      lastName: '',
      email: 'john@example.com'
    };

    const result = validateProfile(profile);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('lastName is required');
  });

  it('should reject invalid email', () => {
    const profile: Partial<Profile> = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'not-an-email'
    };

    const result = validateProfile(profile);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('valid email is required');
  });

  it('should reject invalid phone', () => {
    const profile: Partial<Profile> = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '123'
    };

    const result = validateProfile(profile);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('invalid phone format');
  });

  it('should accept valid Indian phone', () => {
    const profile: Partial<Profile> = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+919876543210'
    };

    const result = validateProfile(profile);
    expect(result.valid).toBe(true);
  });
});

describe('Email Validation', () => {
  it('should accept valid emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.co.in')).toBe(true);
    expect(isValidEmail('user+tag@example.org')).toBe(true);
  });

  it('should reject invalid emails', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
    expect(isValidEmail('user@')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});

describe('Phone Validation', () => {
  it('should accept valid Indian phone numbers', () => {
    expect(isValidPhone('+919876543210')).toBe(true);
    expect(isValidPhone('9876543210')).toBe(true);
    expect(isValidPhone('+1-234-567-8900')).toBe(true);
  });

  it('should reject invalid phone numbers', () => {
    expect(isValidPhone('123')).toBe(false);
    expect(isValidPhone('abcdefghij')).toBe(false);
    expect(isValidPhone('')).toBe(false);
  });
});

describe('Full Name', () => {
  it('should combine first and last name', () => {
    const profile: Profile = createMockProfile({ firstName: 'John', lastName: 'Doe' });
    expect(getFullName(profile)).toBe('John Doe');
  });

  it('should handle empty last name', () => {
    const profile: Profile = createMockProfile({ firstName: 'Madonna', lastName: '' });
    expect(getFullName(profile)).toBe('Madonna ');
  });
});

describe('Initials', () => {
  it('should return first letters capitalized', () => {
    const profile: Profile = createMockProfile({ firstName: 'john', lastName: 'doe' });
    expect(getInitials(profile)).toBe('JD');
  });

  it('should handle single name', () => {
    const profile: Profile = createMockProfile({ firstName: 'Madonna', lastName: '' });
    expect(getInitials(profile)).toBe('M');
  });
});

describe('Profile Search', () => {
  const profiles: Profile[] = [
    createMockProfile({ id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' }),
    createMockProfile({ id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' }),
    createMockProfile({ id: '3', firstName: 'John', lastName: 'Smith', email: 'johnsmith@example.com' }),
  ];

  it('should search by first name', () => {
    const results = searchProfiles(profiles, 'John');
    expect(results).toHaveLength(2);
  });

  it('should search by last name', () => {
    const results = searchProfiles(profiles, 'Smith');
    expect(results).toHaveLength(2);
  });

  it('should search by email', () => {
    const results = searchProfiles(profiles, 'jane@example.com');
    expect(results).toHaveLength(1);
    expect(results[0].firstName).toBe('Jane');
  });

  it('should be case insensitive', () => {
    const results = searchProfiles(profiles, 'JOHN');
    expect(results).toHaveLength(2);
  });

  it('should return empty for no matches', () => {
    const results = searchProfiles(profiles, 'xyz');
    expect(results).toHaveLength(0);
  });
});

describe('Privacy Settings', () => {
  it('should allow public profile by default', () => {
    const profile = createMockProfile({});
    expect(profile.preferences.privacy.showProfile).toBe(true);
    expect(profile.preferences.privacy.showEmail).toBe(false);
    expect(profile.preferences.privacy.allowMessages).toBe(true);
  });

  it('should allow hiding phone', () => {
    const profile = createMockProfile({});
    expect(profile.preferences.privacy.showPhone).toBe(false);
  });
});

describe('Notification Settings', () => {
  it('should enable all notifications by default', () => {
    const profile = createMockProfile({});
    expect(profile.preferences.notifications.email).toBe(true);
    expect(profile.preferences.notifications.push).toBe(true);
    expect(profile.preferences.notifications.sms).toBe(true);
    expect(profile.preferences.notifications.whatsapp).toBe(false);
  });
});

// Helper function
function createMockProfile(overrides: Partial<Profile>): Profile {
  return {
    id: overrides.id || 'default-id',
    userId: overrides.userId || 'user-123',
    firstName: overrides.firstName || 'John',
    lastName: overrides.lastName || 'Doe',
    email: overrides.email || 'john@example.com',
    phone: overrides.phone,
    avatar: overrides.avatar,
    bio: overrides.bio,
    preferences: overrides.preferences || {
      language: 'en',
      timezone: 'Asia/Kolkata',
      notifications: { email: true, push: true, sms: true, whatsapp: false },
      privacy: { showProfile: true, showEmail: false, showPhone: false, allowMessages: true }
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
}
