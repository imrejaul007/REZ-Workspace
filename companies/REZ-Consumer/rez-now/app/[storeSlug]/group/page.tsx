'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { GroupSession, GroupMember, SharedItem } from '@/lib/types';
import { useUIStore } from '@/lib/store/uiStore';
import { formatINR } from '@/lib/utils/currency';
import { cn } from '@/lib/utils/cn';
import StoreImage from '@/components/ui/StoreImage';

interface GroupPageProps {
  params: Promise<{
    storeSlug: string;
    code?: string;
  }>;
}

export default function GroupPage({ params }: GroupPageProps) {
  const router = useRouter();
  const { storeSlug, code } = useParams();
  const showToast = useUIStore((s) => s.showToast);

  const [session, setSession] = useState<GroupSession | null>(null);
  const [myMemberId, setMyMemberId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState(code ? String(code).toUpperCase() : '');
  const [memberName, setMemberName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');

  // Fetch session by code
  const fetchSession = useCallback(async (sessionCode: string) => {
    try {
      const response = await fetch(`/api/group/${sessionCode}`);
      if (response.ok) {
        const data = await response.json();
        setSession(data);
        return data;
      } else if (response.status === 404) {
        setError('Session not found or expired');
        return null;
      }
    } catch {
      setError('Failed to load session');
    }
    return null;
  }, []);

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      if (code) {
        await fetchSession(String(code));
      }
      setIsLoading(false);
    }
    init();
  }, [code, fetchSession]);

  // Create new session
  const handleCreate = async () => {
    if (!newSessionName.trim()) {
      showToast('Please enter your name', 'error');
      return;
    }

    try {
      const response = await fetch('/api/group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeSlug,
          hostName: newSessionName.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create session');
      }

      const data = await response.json();
      setSession(data);
      setMyMemberId(data.hostId);
      setShowCreateModal(false);
      router.replace(`/group/${data.code}`);
      showToast('Group created! Share the code with friends', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create session', 'error');
    }
  };

  // Join existing session
  const handleJoin = async () => {
    if (!joinCode.trim() || joinCode.length !== 6) {
      showToast('Please enter a valid 6-character code', 'error');
      return;
    }
    if (!memberName.trim()) {
      showToast('Please enter your name', 'error');
      return;
    }

    try {
      const response = await fetch(`/api/group/${joinCode.toUpperCase()}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeSlug,
          memberName: memberName.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to join session');
      }

      const data = await response.json();
      setSession(data);
      setMyMemberId(data.members[data.members.length - 1]?.id || null);
      setShowJoinModal(false);
      router.replace(`/group/${data.code}`);
      showToast('Joined group successfully!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to join session', 'error');
    }
  };

  // Leave session
  const handleLeave = async () => {
    if (!session) return;

    try {
      await fetch(`/api/group/${session.code}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: myMemberId }),
      });

      setSession(null);
      setMyMemberId(null);
      router.replace(`/group`);
      showToast('Left the group', 'info');
    } catch {
      showToast('Failed to leave group', 'error');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // No active session - show create/join options
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-md mx-auto space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Group Ordering</h1>
            <p className="text-gray-600">
              Order together with friends, share items, and split the bill easily.
            </p>
          </div>

          {/* Options */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full py-4 px-6 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create a Group
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-sm text-gray-500">or</span>
              </div>
            </div>

            <button
              onClick={() => setShowJoinModal(true)}
              className="w-full py-4 px-6 bg-white border-2 border-indigo-600 text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Join with Code
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-600 text-center">{error}</p>
            </div>
          )}

          {/* Back to menu */}
          <Link
            href={`/${storeSlug}`}
            className="block text-center text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Back to Menu
          </Link>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowCreateModal(false)} />
            <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Group</h3>
              <input
                type="text"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Join Modal */}
        {showJoinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowJoinModal(false)} />
            <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Join Group</h3>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="Enter 6-digit code"
                className="w-full px-4 py-3 text-center text-xl tracking-widest border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                maxLength={6}
                autoFocus
              />
              <input
                type="text"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 mt-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoin}
                  disabled={joinCode.length !== 6 || !memberName.trim()}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Active session view
  const isHost = session.hostId === myMemberId;
  const myMember = session.members.find((m) => m.id === myMemberId);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm opacity-90">Share this code</p>
              <p className="text-xs opacity-75">Friends can join using this code</p>
            </div>
            {isHost && (
              <span className="text-xs bg-white/20 px-3 py-1 rounded-full">Host</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-4xl font-bold tracking-widest">{session.code}</span>
            <button
              onClick={() => navigator.clipboard.writeText(session.code)}
              className="p-3 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Store Info */}
        <Link
          href={`/${session.storeSlug}`}
          className="block bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow"
        >
          <div className="flex items-center gap-3">
            {session.storeName && (
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900">{session.storeName}</p>
              {session.tableNumber && (
                <p className="text-sm text-gray-500">Table {session.tableNumber}</p>
              )}
            </div>
          </div>
        </Link>

        {/* Members */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Members ({session.members.length})</h3>
            <span className="text-sm text-gray-500">
              {session.members.length} joined
            </span>
          </div>
          <div className="space-y-3">
            {session.members.map((member) => (
              <div key={member.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-white font-medium',
                    member.isHost ? 'bg-indigo-600' : 'bg-gray-400'
                  )}>
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {member.name}
                      {member.id === myMemberId && (
                        <span className="text-xs text-indigo-600 ml-1">(You)</span>
                      )}
                      {member.isHost && (
                        <span className="text-xs text-indigo-600 ml-1">(Host)</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {member.items.length} item{member.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <span className="font-medium text-gray-900">{formatINR(member.totalAmount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Shared Items */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Shared Items ({session.items.length})</h3>
          </div>
          {session.items.length === 0 ? (
            <p className="text-center text-gray-500 py-6">
              No shared items yet. Add items from the menu to share!
            </p>
          ) : (
            <div className="space-y-2">
              {session.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">
                      <span className="text-gray-500 mr-2">x{item.quantity}</span>
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500">Added by {item.addedByName}</p>
                  </div>
                  <span className="font-medium">{formatINR(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Your Total</span>
            <span className="text-xl font-bold text-gray-900">{formatINR(myMember?.totalAmount || 0)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Group Total</span>
            <span className="text-xl font-bold text-indigo-600">{formatINR(session.totalAmount)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href={`/${session.storeSlug}`}
            className="block w-full py-3 px-4 bg-indigo-600 text-white text-center rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            Add Items from Menu
          </Link>
          <button
            onClick={handleLeave}
            className="w-full py-3 px-4 border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors"
          >
            Leave Group
          </button>
        </div>

        {/* Back link */}
        <Link
          href={`/${session.storeSlug}`}
          className="block text-center text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Back to Menu
        </Link>
      </div>
    </div>
  );
}
