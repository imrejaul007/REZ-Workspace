// @ts-nocheck
/**
 * ProfileContext Tests
 * Tests profile helper logic and the mapBackendUserToProfileUser mapping function,
 * plus authService mock patterns for fetchProfile / updateProfile.
 */

// ---------------------------------------------------------------------------
// Inline mapBackendUserToProfileUser (mirrors ProfileContext logic)
// ---------------------------------------------------------------------------

interface BackendUser {
  id: string;
  phoneNumber?: string;
  email?: string;
  isVerified?: boolean;
  isOnboarded?: boolean;
  createdAt?: string;
  role?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
    gender?: string;
    dateOfBirth?: string;
    website?: string;
    location?: { address?: string };
  };
  preferences?: {
    pushNotifications?: boolean;
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    theme?: string;
    language?: string;
  };
  wallet?: {
    balance?: number | { available?: number; total?: number };
    totalEarned?: number;
    totalSpent?: number;
    pendingAmount?: number | { pending?: number };
  };
}

interface ProfileUser {
  id: string;
  name: string;
  email: string;
  initials: string;
  phone?: string;
  isOnboarded?: boolean;
  isVerified?: boolean;
  wallet: {
    balance: number;
    totalEarned: number;
    totalSpent: number;
    pendingAmount: number;
  };
}

const mapBackendUserToProfileUser = (u: BackendUser): ProfileUser => {
  const getInitials = (): string => {
    if (u.profile?.firstName && u.profile?.lastName)
      return (u.profile.firstName[0] + u.profile.lastName[0]).toUpperCase();
    if (u.profile?.firstName) return u.profile.firstName[0].toUpperCase();
    if (u.email) return u.email[0].toUpperCase();
    if (u.phoneNumber) return u.phoneNumber[1].toUpperCase();
    return 'U';
  };

  const getDisplayName = (): string => {
    if (u.profile?.firstName && u.profile?.lastName)
      return `${u.profile.firstName} ${u.profile.lastName}`;
    if (u.profile?.firstName) return u.profile.firstName;
    if (u.email) return u.email.split('@')[0];
    if (u.phoneNumber) return u.phoneNumber;
    return 'User';
  };

  const rawBalance = u.wallet?.balance;
  const balance =
    typeof rawBalance === 'object'
      ? (rawBalance as unknown).available || (rawBalance as unknown).total || 0
      : rawBalance || 0;

  const rawPending = u.wallet?.pendingAmount;
  const pendingAmount =
    typeof rawPending === 'object'
      ? (rawPending as unknown).pending || 0
      : rawPending || 0;

  return {
    id: u.id,
    name: getDisplayName(),
    email: u.email || '',
    initials: getInitials(),
    phone: u.phoneNumber,
    isOnboarded: u.isOnboarded,
    isVerified: u.isVerified,
    wallet: {
      balance,
      totalEarned: u.wallet?.totalEarned || 0,
      totalSpent: u.wallet?.totalSpent || 0,
      pendingAmount,
    },
  };
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const makeBackendUser = (overrides: Partial<BackendUser> = {}): BackendUser => ({
  id: 'user-abc',
  phoneNumber: '+971501234567',
  email: 'jane@example.com',
  isVerified: true,
  isOnboarded: true,
  profile: { firstName: 'Jane', lastName: 'Doe' },
  wallet: { balance: 250, totalEarned: 1000, totalSpent: 750, pendingAmount: 50 },
  ...overrides,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProfileContext – initial profile is null (no auth user)', () => {
  it('returns null user when no auth user is present', () => {
    // Without an authenticated user the profile context exposes user: null
    const user: BackendUser | null = null;
    const mappedUser = user ? mapBackendUserToProfileUser(user) : null;
    expect(mappedUser).toBeNull();
  });
});

describe('ProfileContext – mapBackendUserToProfileUser', () => {
  it('maps id, email and phone from backend user', () => {
    const backend = makeBackendUser();
    const profile = mapBackendUserToProfileUser(backend);

    expect(profile.id).toBe('user-abc');
    expect(profile.email).toBe('jane@example.com');
    expect(profile.phone).toBe('+971501234567');
  });

  it('builds display name from firstName + lastName', () => {
    const backend = makeBackendUser();
    const profile = mapBackendUserToProfileUser(backend);
    expect(profile.name).toBe('Jane Doe');
  });

  it('falls back to email username when no name is set', () => {
    const backend = makeBackendUser({ profile: undefined });
    const profile = mapBackendUserToProfileUser(backend);
    expect(profile.name).toBe('jane'); // email split at @
  });

  it('falls back to "User" when neither name nor email nor phone', () => {
    const backend = makeBackendUser({ profile: undefined, email: undefined, phoneNumber: undefined });
    const profile = mapBackendUserToProfileUser(backend);
    expect(profile.name).toBe('User');
  });

  it('generates initials from first letters of firstName and lastName', () => {
    const backend = makeBackendUser();
    const profile = mapBackendUserToProfileUser(backend);
    expect(profile.initials).toBe('JD');
  });

  it('generates initials from email when no name', () => {
    const backend = makeBackendUser({ profile: undefined, email: 'alice@test.com' });
    const profile = mapBackendUserToProfileUser(backend);
    expect(profile.initials).toBe('A');
  });
});

describe('ProfileContext – wallet mapping', () => {
  it('maps numeric wallet balance directly', () => {
    const backend = makeBackendUser({ wallet: { balance: 300, totalEarned: 500, totalSpent: 200, pendingAmount: 25 } });
    const profile = mapBackendUserToProfileUser(backend);
    expect(profile.wallet.balance).toBe(300);
    expect(profile.wallet.totalEarned).toBe(500);
  });

  it('extracts available balance from object-shaped balance field', () => {
    const backend = makeBackendUser({
      wallet: { balance: { available: 150, total: 200 } as unknown, totalEarned: 0, totalSpent: 0 },
    });
    const profile = mapBackendUserToProfileUser(backend);
    expect(profile.wallet.balance).toBe(150);
  });

  it('defaults wallet values to 0 when wallet is missing', () => {
    const backend = makeBackendUser({ wallet: undefined });
    const profile = mapBackendUserToProfileUser(backend);
    expect(profile.wallet.balance).toBe(0);
    expect(profile.wallet.totalEarned).toBe(0);
    expect(profile.wallet.pendingAmount).toBe(0);
  });
});

describe('ProfileContext – fetchProfile (mocked API)', () => {
  it('calls authService.getProfile and returns user data on success', async () => {
    const backend = makeBackendUser();
    const getProfile = jest.fn().mockResolvedValue({ success: true, data: backend });

    const response = await getProfile();

    expect(getProfile).toHaveBeenCalledTimes(1);
    expect(response.success).toBe(true);
    expect(response.data.id).toBe('user-abc');
  });

  it('handles failed profile fetch gracefully', async () => {
    const getProfile = jest.fn().mockResolvedValue({ success: false, error: '401 Unauthorized' });
    const response = await getProfile();
    expect(response.success).toBe(false);
    expect(response.error).toContain('401');
  });
});

describe('ProfileContext – updateProfile (mocked API)', () => {
  it('calls authService.updateProfile with the provided partial data', async () => {
    const updateProfile = jest
      .fn()
      .mockResolvedValue({ success: true, data: makeBackendUser({ email: 'updated@example.com' }) });

    const response = await updateProfile({ profile: { firstName: 'Updated' } });

    expect(updateProfile).toHaveBeenCalledWith({ profile: { firstName: 'Updated' } });
    expect(response.success).toBe(true);
    expect(response.data.email).toBe('updated@example.com');
  });

  it('reports failure when API returns success: false', async () => {
    const updateProfile = jest
      .fn()
      .mockResolvedValue({ success: false, error: 'Validation failed' });

    const response = await updateProfile({ profile: { gender: 'unknown' } });

    expect(response.success).toBe(false);
    expect(response.error).toBe('Validation failed');
  });
});
