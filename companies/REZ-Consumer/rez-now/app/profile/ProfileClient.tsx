'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';
import { getProfile, updateProfile, UserProfile } from '@/lib/api/profile';
import { subscribeToPush } from '@/lib/push/webPush';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatMemberSince(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

function formatINR(paise: number): string {
  return (paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function getInitial(name: string): string {
  return (name.trim().charAt(0) || '?').toUpperCase();
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function PencilIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H8v-2.414a2 2 0 01.586-1.414z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 018 0v4" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
    </svg>
  );
}

// PersonIcon kept for potential future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _PersonIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path strokeLinecap="round" d="M4 20c0-4 3.582-7 8-7s8 3 8 7" />
    </svg>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="max-w-lg mx-auto px-4 py-8 animate-pulse space-y-6">
      <div className="flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-full bg-gray-200" />
        <div className="h-5 w-32 bg-gray-200 rounded" />
        <div className="h-4 w-24 bg-gray-100 rounded" />
      </div>
      <div className="h-10 bg-gray-100 rounded-xl" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ── Sign-out confirmation dialog ──────────────────────────────────────────────

interface SignOutDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
}

function SignOutDialog({ onConfirm, onCancel }: SignOutDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Sign Out</h2>
        <p className="text-sm text-gray-600 mb-6">Are you sure you want to sign out?</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProfileClient() {
  const router = useRouter();
  const { isLoggedIn, user, clearSession } = useAuthStore();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Name editing
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Sign-out dialog
  const [showSignOut, setShowSignOut] = useState(false);

  // Push notifications
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [subscribingPush, setSubscribingPush] = useState(false);

  // Language toggle: 'en' | 'hi'
  const [locale, setLocale] = useState<'en' | 'hi'>('en');

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/?login=1');
    }
  }, [isLoggedIn, router]);

  // Load profile
  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProfile();
      setProfile(data);
      setNameValue(data.name);
    } catch {
      setError('Could not load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadProfile();
    }
  }, [isLoggedIn, loadProfile]);

  // Check push subscription status
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => setPushSubscribed(!!sub))
        .catch(() => {});
    }
  }, []);

  // Detect initial locale from cookie
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
      if (match && (match[1] === 'en' || match[1] === 'hi')) {
        setLocale(match[1]);
      }
    }
  }, []);

  const handleSaveName = async () => {
    if (!profile || nameValue.trim() === profile.name) {
      setEditingName(false);
      return;
    }
    try {
      setSavingName(true);
      const updated = await updateProfile({ name: nameValue.trim() });
      setProfile(updated);
      setNameValue(updated.name);
      setEditingName(false);
    } catch {
      // Revert on failure
      setNameValue(profile.name);
      setEditingName(false);
    } finally {
      setSavingName(false);
    }
  };

  const handleTogglePush = async () => {
    if (pushSubscribed) return; // no unsubscribe flow needed for now
    try {
      setSubscribingPush(true);
      const sub = await subscribeToPush();
      if (sub) setPushSubscribed(true);
    } finally {
      setSubscribingPush(false);
    }
  };

  const handleToggleLocale = () => {
    const next = locale === 'en' ? 'hi' : 'en';
    setLocale(next);
    document.cookie = `NEXT_LOCALE=${next};path=/;max-age=31536000`;
    router.refresh();
  };

  const handleSignOut = () => {
    setShowSignOut(false);
    clearSession();
    router.replace('/');
  };

  if (!isLoggedIn) return null;

  if (loading) return <ProfileSkeleton />;

  if (error) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 text-sm mb-4">{error}</p>
        <button
          onClick={loadProfile}
          className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  const displayName = profile?.name || user?.name || '';
  const displayPhone = profile?.phone || user?.phone || '';

  return (
    <>
      {showSignOut && (
        <SignOutDialog onConfirm={handleSignOut} onCancel={() => setShowSignOut(false)} />
      )}

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 -ml-1 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-base font-bold text-gray-900">My Profile</h1>
        </header>

        <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
          {/* Avatar + name */}
          <div className="flex flex-col items-center gap-4">
            {profile?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt={displayName}
                className="w-20 h-20 rounded-full object-cover ring-4 ring-indigo-100"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold select-none ring-4 ring-indigo-100"
                aria-label={`Avatar for ${displayName}`}
              >
                {getInitial(displayName)}
              </div>
            )}

            {/* Editable name */}
            <div className="flex items-center gap-2">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') { setNameValue(profile?.name ?? ''); setEditingName(false); }
                    }}
                    className="text-lg font-bold text-gray-900 border-b-2 border-indigo-500 bg-transparent focus:outline-2 focus:outline-indigo-400 focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 rounded text-center w-44"
                    autoFocus
                    maxLength={80}
                    aria-label="Edit name"
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={savingName}
                    className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-semibold disabled:opacity-60 hover:bg-indigo-700 transition-colors"
                    aria-label="Save name"
                  >
                    {savingName ? '…' : 'Save'}
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-xl font-bold text-gray-900">{displayName || 'Your Name'}</span>
                  <button
                    onClick={() => setEditingName(true)}
                    className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                    aria-label="Edit name"
                  >
                    <PencilIcon />
                  </button>
                </>
              )}
            </div>

            {/* Stats row */}
            {profile && (
              <p className="text-sm text-gray-500 text-center">
                <span className="font-medium text-gray-700">{profile.totalOrders}</span>
                {profile.totalOrders === 1 ? ' order' : ' orders'}
                {' · '}
                <span className="font-medium text-gray-700">&#8377;{formatINR(profile.totalSpent)}</span> spent
                {' · '}
                Member since {formatMemberSince(profile.joinedAt)}
              </p>
            )}
          </div>

          {/* Phone (read-only) */}
          <div className="bg-white rounded-2xl px-4 py-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <LockIcon />
              <div>
                <p className="text-xs text-gray-400 leading-none mb-0.5">Phone</p>
                <p className="text-sm font-semibold text-gray-900">{displayPhone}</p>
              </div>
            </div>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Verified</span>
          </div>

          {/* Sections */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100">
            {/* My Orders */}
            <Link
              href="/orders"
              className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12h6M9 16h4" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-900">My Orders</span>
              </div>
              <ChevronRightIcon />
            </Link>

            {/* Push Notifications */}
            <button
              onClick={handleTogglePush}
              disabled={pushSubscribed || subscribingPush}
              className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors disabled:cursor-default"
              aria-label={pushSubscribed ? 'Push notifications enabled' : 'Enable push notifications'}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-900">Push Notifications</span>
              </div>
              <div className="flex items-center gap-2">
                {subscribingPush && (
                  <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                )}
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    pushSubscribed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {pushSubscribed ? 'On' : 'Off'}
                </span>
              </div>
            </button>

            {/* Language */}
            <button
              onClick={handleToggleLocale}
              className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
              aria-label={`Switch language to ${locale === 'en' ? 'Hindi' : 'English'}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-900">Language</span>
              </div>
              <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
                {locale === 'en' ? 'EN' : 'हिं'}
              </span>
            </button>

            {/* Sign Out */}
            <button
              onClick={() => setShowSignOut(true)}
              className="w-full flex items-center justify-between px-4 py-4 hover:bg-red-50 transition-colors"
              aria-label="Sign out"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-red-600">Sign Out</span>
              </div>
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
