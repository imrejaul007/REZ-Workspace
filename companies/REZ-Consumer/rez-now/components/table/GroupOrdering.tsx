'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useCartStore } from '@/lib/store/cartStore';
import { useUIStore } from '@/lib/store/uiStore';
import { GroupSession, GroupMember, SharedItem, CartItem } from '@/lib/types';
import { formatINR } from '@/lib/utils/currency';
import { cn } from '@/lib/utils/cn';
import { logger } from '@/lib/utils/logger';

/**
 * Generate a secure random code using browser crypto API
 */
function generateSecureCode(length: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => chars[b % chars.length]).join('');
  }
  // Fallback for older browsers
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://api.rezapp.com';
const GROUP_CODE_LENGTH = 6;

interface GroupOrderingProps {
  storeSlug: string;
  storeId: string;
  tableNumber?: string;
  onSessionCreated?: (session: GroupSession) => void;
  onSessionJoined?: (session: GroupSession) => void;
}

interface GroupOrderingState {
  isLoading: boolean;
  error: string | null;
  session: GroupSession | null;
  myMemberId: string | null;
  isHost: boolean;
  joinCode: string;
  showJoinModal: boolean;
}

/**
 * GroupOrdering - Collaborative ordering system for friends dining together
 *
 * Features:
 * - Create group session with unique code
 * - Join existing sessions with code
 * - Share items across members
 * - Real-time sync with Socket.IO
 * - Split bill summary
 */
export default function GroupOrdering({
  storeSlug,
  storeId,
  tableNumber,
  onSessionCreated,
  onSessionJoined,
}: GroupOrderingProps) {
  const showToast = useUIStore((s) => s.showToast);
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);
  const setGroupOrderId = useCartStore((s) => s.setGroupOrderId);

  const [state, setState] = useState<GroupOrderingState>({
    isLoading: false,
    error: null,
    session: null,
    myMemberId: null,
    isHost: false,
    joinCode: '',
    showJoinModal: false,
  });

  const socketRef = useRef<Socket | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // Generate random group code using secure random
  const generateCode = useCallback(() => {
    return generateSecureCode(GROUP_CODE_LENGTH);
  }, []);

  // Connect to Socket.IO
  useEffect(() => {
    const socket = io(`${SOCKET_URL}/group`, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      logger.info('Connected to group socket');
    });

    socket.on('group:member:joined', (data: { member: GroupMember; session: GroupSession }) => {
      setState((prev) => ({
        ...prev,
        session: data.session,
      }));
      showToast(`${data.member.name} joined the group`, 'success');
    });

    socket.on('group:member:left', (data: { memberId: string; name: string; session: GroupSession }) => {
      setState((prev) => ({
        ...prev,
        session: data.session,
      }));
      showToast(`${data.name} left the group`, 'info');
    });

    socket.on('group:item:added', (data: { item: SharedItem; session: GroupSession }) => {
      setState((prev) => ({
        ...prev,
        session: data.session,
      }));
    });

    socket.on('group:item:removed', (data: { itemId: string; session: GroupSession }) => {
      setState((prev) => ({
        ...prev,
        session: data.session,
      }));
    });

    socket.on('group:session:updated', (data: GroupSession) => {
      setState((prev) => ({
        ...prev,
        session: data,
      }));
    });

    socket.on('group:error', (data: { message: string }) => {
      showToast(data.message, 'error');
      setState((prev) => ({ ...prev, isLoading: false }));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [showToast]);

  // Create new group session
  const createSession = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          storeSlug,
          tableNumber,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create session');
      }

      const data: GroupSession = await response.json();

      setState((prev) => ({
        ...prev,
        isLoading: false,
        session: data,
        myMemberId: data.hostId,
        isHost: true,
      }));

      setGroupOrderId(data.id);

      // Join the socket room
      socketRef.current?.emit('group:join', { sessionId: data.id, code: data.code });

      onSessionCreated?.(data);
      showToast(`Group created! Share code: ${data.code}`, 'success');
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to create session',
      }));
    }
  }, [storeId, storeSlug, tableNumber, onSessionCreated, setGroupOrderId, showToast]);

  // Join existing session
  const joinSession = useCallback(async () => {
    const code = state.joinCode.trim().toUpperCase();
    if (code.length !== GROUP_CODE_LENGTH) {
      setState((prev) => ({ ...prev, error: 'Invalid code. Please enter a 6-character code.' }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`/api/group/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          storeSlug,
          memberName: 'Guest',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to join session');
      }

      const data: GroupSession = await response.json();

      setState((prev) => ({
        ...prev,
        isLoading: false,
        session: data,
        myMemberId: data.members[data.members.length - 1]?.id || null,
        isHost: false,
        showJoinModal: false,
        joinCode: '',
      }));

      setGroupOrderId(data.id);

      // Join the socket room
      socketRef.current?.emit('group:join', { sessionId: data.id, code: data.code });

      onSessionJoined?.(data);
      showToast('Joined group successfully!', 'success');
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to join session',
      }));
    }
  }, [state.joinCode, storeId, storeSlug, onSessionJoined, setGroupOrderId, showToast]);

  // Leave session
  const leaveSession = useCallback(async () => {
    if (!state.session) return;

    try {
      await fetch(`/api/group/${state.session.code}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: state.myMemberId }),
      });

      setState((prev) => ({
        ...prev,
        session: null,
        myMemberId: null,
        isHost: false,
      }));

      setGroupOrderId(null);
      showToast('Left the group', 'info');
    } catch {
      showToast('Failed to leave group', 'error');
    }
  }, [state.session, state.myMemberId, setGroupOrderId, showToast]);

  // Add shared item
  const addSharedItem = useCallback(async (cartItem: CartItem) => {
    if (!state.session) return;

    try {
      const response = await fetch(`/api/group/${state.session.code}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: cartItem.itemId,
          name: cartItem.name,
          price: cartItem.price,
          quantity: cartItem.quantity,
          memberId: state.myMemberId,
          memberName: state.session.members.find((m) => m.id === state.myMemberId)?.name || 'Guest',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add item');
      }
    } catch {
      showToast('Failed to add shared item', 'error');
    }
  }, [state.session, state.myMemberId, showToast]);

  // Remove shared item
  const removeSharedItem = useCallback(async (itemId: string) => {
    if (!state.session) return;

    try {
      await fetch(`/api/group/${state.session.code}/items/${itemId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: state.myMemberId }),
      });
    } catch {
      showToast('Failed to remove item', 'error');
    }
  }, [state.session, state.myMemberId, showToast]);

  // Get split summary
  const getSplitSummary = useCallback(async () => {
    if (!state.session) return null;

    try {
      const response = await fetch(`/api/group/${state.session.code}/summary`);
      if (!response.ok) throw new Error('Failed to get summary');
      return await response.json();
    } catch {
      showToast('Failed to load summary', 'error');
      return null;
    }
  }, [state.session, showToast]);

  // Copy code to clipboard
  const copyCode = useCallback(() => {
    if (!state.session) return;
    navigator.clipboard.writeText(state.session.code);
    showToast('Code copied!', 'success');
  }, [state.session, showToast]);

  // If no active session, show create/join options
  if (!state.session) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Group Ordering</h3>
          <p className="text-sm text-gray-500 mb-4">
            Order together with friends! Create a group or join one to share items and split the bill.
          </p>

          <div className="space-y-3">
            <button
              onClick={createSession}
              disabled={state.isLoading}
              className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {state.isLoading ? 'Creating...' : 'Create Group'}
            </button>

            <button
              onClick={() => setState((prev) => ({ ...prev, showJoinModal: true }))}
              className="w-full py-3 px-4 bg-white border-2 border-indigo-600 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
            >
              Join with Code
            </button>
          </div>

          {state.error && (
            <p className="mt-3 text-sm text-red-600">{state.error}</p>
          )}
        </div>

        {/* Join Modal */}
        {state.showJoinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setState((prev) => ({ ...prev, showJoinModal: false }))} />
            <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Join Group</h3>
              <input
                type="text"
                value={state.joinCode}
                onChange={(e) => setState((prev) => ({ ...prev, joinCode: e.target.value.toUpperCase().slice(0, GROUP_CODE_LENGTH) }))}
                placeholder="Enter 6-digit code"
                className="w-full px-4 py-3 text-center text-xl tracking-widest border-2 border-gray-200 rounded-xl focus:outline-2 focus:outline-indigo-400 focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 uppercase"
                aria-label="Enter 6-digit group join code"
                maxLength={GROUP_CODE_LENGTH}
                autoFocus
              />
              {state.error && (
                <p className="mt-2 text-sm text-red-600">{state.error}</p>
              )}
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setState((prev) => ({ ...prev, showJoinModal: false, error: null }))}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={joinSession}
                  disabled={state.isLoading || state.joinCode.length !== GROUP_CODE_LENGTH}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {state.isLoading ? 'Joining...' : 'Join'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Active session view
  const myMember = state.session.members.find((m) => m.id === state.myMemberId);
  const myTotal = myMember?.totalAmount || 0;
  const itemCount = state.session.items.length;
  const memberCount = state.session.members.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium opacity-90">Group Code</span>
          {state.isHost && (
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Host</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold tracking-widest">{state.session.code}</span>
          <button
            onClick={copyCode}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            aria-label="Copy code"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
        <div className="mt-3 flex items-center gap-4 text-sm opacity-90">
          <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
          <span>{itemCount} shared item{itemCount !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Members */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h4 className="font-semibold text-gray-900 mb-3">Members</h4>
        <div className="space-y-2">
          {state.session.members.map((member) => (
            <div key={member.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium',
                  member.isHost ? 'bg-indigo-600' : 'bg-gray-400'
                )}>
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {member.name}
                    {member.isHost && <span className="text-xs text-indigo-600 ml-1">(Host)</span>}
                  </p>
                  <p className="text-xs text-gray-500">{member.items.length} item{member.items.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <span className="text-sm font-medium text-gray-900">{formatINR(member.totalAmount)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Shared Items */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h4 className="font-semibold text-gray-900 mb-3">Shared Items</h4>
        {state.session.items.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No shared items yet</p>
        ) : (
          <div className="space-y-2">
            {state.session.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">x{item.quantity}</span>
                  <span className="text-sm font-medium text-gray-900">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{formatINR(item.price * item.quantity)}</span>
                  {(state.isHost || item.addedBy === state.myMemberId) && (
                    <button
                      onClick={() => removeSharedItem(item.id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                      aria-label="Remove item"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Cart Items (for sharing) */}
      {items.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h4 className="font-semibold text-gray-900 mb-3">My Cart</h4>
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">x{item.quantity}</span>
                  <span className="text-sm font-medium text-gray-900">{item.name}</span>
                </div>
                <button
                  onClick={() => addSharedItem(item)}
                  className="px-3 py-1 text-xs bg-indigo-50 text-indigo-600 rounded-lg font-medium hover:bg-indigo-100"
                >
                  Share
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-600">Your Total</span>
          <span className="text-lg font-bold text-gray-900">{formatINR(myTotal)}</span>
        </div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-600">Group Total</span>
          <span className="text-lg font-bold text-indigo-600">{formatINR(state.session.totalAmount)}</span>
        </div>
        <button
          onClick={() => setShowSummary(true)}
          className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
        >
          View Split Details
        </button>
      </div>

      {/* Leave Button */}
      <button
        onClick={leaveSession}
        className="w-full py-2.5 border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50"
      >
        Leave Group
      </button>

      {/* Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowSummary(false)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Split Summary</h3>
            <SplitSummaryModal session={state.session} onClose={() => setShowSummary(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

// Split Summary Modal Component
function SplitSummaryModal({
  session,
  onClose,
}: {
  session: GroupSession;
  onClose: () => void;
}) {
  const total = session.totalAmount;
  const memberCount = session.members.length;
  const perPerson = Math.round(total / memberCount);

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Group Total</span>
          <span className="font-bold">{formatINR(total)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Split ({memberCount} ways)</span>
          <span className="font-bold text-indigo-600">{formatINR(perPerson)}/person</span>
        </div>
      </div>

      <div className="space-y-3">
        {session.members.map((member) => {
          const personalItems = session.items.filter((item) => item.addedBy === member.id);
          const sharedContribution = personalItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          const shareOfShared = total > 0 ? (sharedContribution / total) * perPerson : 0;

          return (
            <div key={member.id} className="border border-gray-100 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{member.name}</span>
                <span className="font-bold">{formatINR(member.totalAmount)}</span>
              </div>
              <p className="text-xs text-gray-500">
                {member.items.length} personal item{member.items.length !== 1 ? 's' : ''}
              </p>
            </div>
          );
        })}
      </div>

      <button
        onClick={onClose}
        className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
      >
        Close
      </button>
    </div>
  );
}
