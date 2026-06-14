'use client';

import { useState, useCallback, useMemo } from 'react';
import { logger } from '@/lib/utils/logger';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface ChargeItem {
  id: string;
  description: string;
  quantity: number;
  unitPricePaise: number;
  totalPaise: number;
  date: string;
  category: string;
}

interface SplitParticipant {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  assignedCharges: string[]; // charge IDs
  assignedAmountPaise: number;
  paidAmountPaise: number;
  status: 'pending' | 'partial' | 'settled';
  shareLink?: string;
}

interface SplitFolio {
  id: string;
  bookingId: string;
  totalAmountPaise: number;
  participants: SplitParticipant[];
  status: 'active' | 'completed';
  createdAt: string;
}

interface SplitFolioProps {
  bookingId: string;
  guestName: string;
  roomNumber: string;
  charges: ChargeItem[];
  totalAmountPaise: number;
  onSplitCreated?: (split: SplitFolio) => void;
  onSettleComplete?: (participantId: string) => void;
}

// ─── Constants ──────────────────────────────────────────────────────────────────

function formatPrice(paise: number): string {
  if (paise === 0) return '₹0';
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function SplitFolio({
  bookingId,
  guestName,
  roomNumber,
  charges,
  totalAmountPaise,
  onSplitCreated,
  onSettleComplete,
}: SplitFolioProps) {
  const [split, setSplit] = useState<SplitFolio | null>(null);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [newParticipant, setNewParticipant] = useState({ name: '', email: '', phone: '' });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCharges, setSelectedCharges] = useState<Set<string>>(new Set());
  const [assigningTo, setAssigningTo] = useState<string | null>(null);

  // Calculate totals
  const totals = useMemo(() => {
    const selectedTotal = charges
      .filter(c => selectedCharges.has(c.id))
      .reduce((sum, c) => sum + c.totalPaise, 0);
    const unselectedTotal = charges
      .filter(c => !selectedCharges.has(c.id))
      .reduce((sum, c) => sum + c.totalPaise, 0);
    return { selectedTotal, unselectedTotal, grandTotal: totalAmountPaise };
  }, [charges, selectedCharges, totalAmountPaise]);

  // Create split
  const handleCreateSplit = useCallback(async () => {
    setProcessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/checkout/room-checkout/${bookingId}/split`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_split',
          participants: [
            { name: guestName, assignedCharges: Array.from(selectedCharges) },
          ],
        }),
      });

      const data = await response.json();
      if (data.success) {
        const newSplit: SplitFolio = {
          id: data.data.splitId,
          bookingId,
          totalAmountPaise,
          participants: data.data.participants,
          status: 'active',
          createdAt: new Date().toISOString(),
        };
        setSplit(newSplit);
        onSplitCreated?.(newSplit);
      } else {
        // Create locally for demo
        const localSplit: SplitFolio = {
          id: `split-${Date.now()}`,
          bookingId,
          totalAmountPaise,
          participants: [
            {
              id: `participant-${Date.now()}`,
              name: guestName,
              assignedCharges: Array.from(selectedCharges),
              assignedAmountPaise: totals.selectedTotal,
              paidAmountPaise: 0,
              status: 'pending',
            },
          ],
          status: 'active',
          createdAt: new Date().toISOString(),
        };
        setSplit(localSplit);
        onSplitCreated?.(localSplit);
      }
    } catch (err) {
      logger.error('Create split error:', { error: err });
      // Create locally for demo
      const localSplit: SplitFolio = {
        id: `split-${Date.now()}`,
        bookingId,
        totalAmountPaise,
        participants: [
          {
            id: `participant-${Date.now()}`,
            name: guestName,
            assignedCharges: Array.from(selectedCharges),
            assignedAmountPaise: totals.selectedTotal,
            paidAmountPaise: 0,
            status: 'pending',
          },
        ],
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      setSplit(localSplit);
      onSplitCreated?.(localSplit);
    } finally {
      setProcessing(false);
    }
  }, [bookingId, guestName, totalAmountPaise, selectedCharges, totals, onSplitCreated]);

  // Add participant
  const handleAddParticipant = useCallback(() => {
    if (!newParticipant.name.trim()) return;

    const participant: SplitParticipant = {
      id: `participant-${Date.now()}`,
      name: newParticipant.name,
      email: newParticipant.email,
      phone: newParticipant.phone,
      assignedCharges: [],
      assignedAmountPaise: 0,
      paidAmountPaise: 0,
      status: 'pending',
    };

    setSplit(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        participants: [...prev.participants, participant],
      };
    });

    setNewParticipant({ name: '', email: '', phone: '' });
    setShowAddParticipant(false);
  }, [newParticipant]);

  // Toggle charge selection
  const toggleCharge = useCallback((chargeId: string) => {
    setSelectedCharges(prev => {
      const next = new Set(prev);
      if (next.has(chargeId)) {
        next.delete(chargeId);
      } else {
        next.add(chargeId);
      }
      return next;
    });
  }, []);

  // Assign charges to participant
  const assignChargesToParticipant = useCallback(async (participantId: string) => {
    const chargeIds = Array.from(selectedCharges);
    const chargeTotal = charges
      .filter(c => selectedCharges.has(c.id))
      .reduce((sum, c) => sum + c.totalPaise, 0);

    setSplit(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        participants: prev.participants.map(p => {
          if (p.id === participantId) {
            return {
              ...p,
              assignedCharges: [...new Set([...p.assignedCharges, ...chargeIds])],
              assignedAmountPaise: p.assignedAmountPaise + chargeTotal,
              status: p.paidAmountPaise > 0 ? 'partial' : 'pending',
            };
          }
          return p;
        }),
      };
    });

    // Clear selected charges
    setSelectedCharges(new Set());
    setAssigningTo(null);
  }, [selectedCharges, charges]);

  // Generate share link for participant
  const generateShareLink = useCallback(async (participantId: string) => {
    if (!split) return;
    const participant = split.participants.find(p => p.id === participantId);
    if (!participant) return;

    const shareLink = `${window.location.origin}/split/${split.id}?participant=${participantId}`;

    setSplit(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        participants: prev.participants.map(p =>
          p.id === participantId ? { ...p, shareLink } : p
        ),
      };
    });

    // Copy to clipboard
    await navigator.clipboard.writeText(shareLink);
  }, [split]);

  // Mark as settled
  const handleSettle = useCallback(async (participantId: string, amountPaise: number) => {
    setProcessing(true);
    try {
      await fetch(`/api/checkout/room-checkout/${bookingId}/split`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'settle',
          splitId: split?.id,
          participantId,
          amountPaise,
        }),
      });

      setSplit(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          participants: prev.participants.map(p =>
            p.id === participantId
              ? {
                  ...p,
                  paidAmountPaise: p.paidAmountPaise + amountPaise,
                  status: p.assignedAmountPaise <= p.paidAmountPaise + amountPaise ? 'settled' : 'partial',
                }
              : p
          ),
        };
      });

      onSettleComplete?.(participantId);
    } catch (err) {
      logger.error('Settle error:', { error: err });
    } finally {
      setProcessing(false);
    }
  }, [bookingId, split?.id, onSettleComplete]);

  // Remove participant
  const removeParticipant = useCallback((participantId: string) => {
    setSplit(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        participants: prev.participants.filter(p => p.id !== participantId),
      };
    });
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-5">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
          </svg>
          Split Folio
        </h2>
        <p className="text-purple-100 text-sm mt-1">
          Share expenses with travel companions
        </p>
      </div>

      {/* Split Overview */}
      {split ? (
        <div className="p-4 space-y-4">
          {/* Participants */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Participants ({split.participants.length})</h3>
              <button
                onClick={() => setShowAddParticipant(true)}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                + Add Person
              </button>
            </div>

            <div className="space-y-3">
              {split.participants.map((participant) => (
                <div
                  key={participant.id}
                  className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{participant.name}</p>
                      {participant.email && (
                        <p className="text-sm text-gray-500">{participant.email}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-indigo-600">{formatPrice(participant.assignedAmountPaise)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        participant.status === 'settled'
                          ? 'bg-green-100 text-green-700'
                          : participant.status === 'partial'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {participant.status}
                      </span>
                    </div>
                  </div>

                  {/* Assigned charges */}
                  {participant.assignedCharges.length > 0 && (
                    <div className="text-sm text-gray-600 mb-2">
                      {participant.assignedCharges.length} charge(s) assigned
                    </div>
                  )}

                  {/* Progress bar */}
                  {participant.assignedAmountPaise > 0 && (
                    <div className="mb-3">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            participant.status === 'settled'
                              ? 'bg-green-500'
                              : participant.status === 'partial'
                              ? 'bg-yellow-500'
                              : 'bg-indigo-500'
                          }`}
                          style={{
                            width: `${Math.min(100, (participant.paidAmountPaise / participant.assignedAmountPaise) * 100)}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Paid: {formatPrice(participant.paidAmountPaise)} / {formatPrice(participant.assignedAmountPaise)}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {participant.shareLink ? (
                      <button
                        onClick={() => navigator.clipboard.writeText(participant.shareLink!)}
                        className="flex-1 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        Copy Link
                      </button>
                    ) : (
                      <button
                        onClick={() => generateShareLink(participant.id)}
                        className="flex-1 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        Generate Link
                      </button>
                    )}

                    {participant.status !== 'settled' && (
                      <button
                        onClick={() => handleSettle(participant.id, participant.assignedAmountPaise - participant.paidAmountPaise)}
                        disabled={processing}
                        className="flex-1 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        Mark Paid
                      </button>
                    )}

                    {split.participants.length > 1 && (
                      <button
                        onClick={() => removeParticipant(participant.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Total Amount</span>
              <span className="font-medium">{formatPrice(split.totalAmountPaise)}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Assigned</span>
              <span className="font-medium text-indigo-600">
                {formatPrice(split.participants.reduce((sum, p) => sum + p.assignedAmountPaise, 0))}
              </span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Collected</span>
              <span className="font-medium text-green-600">
                {formatPrice(split.participants.reduce((sum, p) => sum + p.paidAmountPaise, 0))}
              </span>
            </div>
            <div className="flex justify-between font-bold mt-2 pt-2 border-t border-gray-200">
              <span>Remaining</span>
              <span className="text-red-600">
                {formatPrice(
                  split.totalAmountPaise -
                    split.participants.reduce((sum, p) => sum + p.paidAmountPaise, 0)
                )}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Charge Selection */}
          <div className="p-4 space-y-3">
            <h3 className="font-semibold text-gray-900">Select Charges to Split</h3>

            {charges.map((charge) => (
              <label
                key={charge.id}
                className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                  selectedCharges.has(charge.id)
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedCharges.has(charge.id)}
                    onChange={() => toggleCharge(charge.id)}
                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{charge.description}</p>
                    <p className="text-sm text-gray-500">{charge.category}</p>
                  </div>
                </div>
                <span className="font-medium text-gray-900">{formatPrice(charge.totalPaise)}</span>
              </label>
            ))}

            {/* Totals */}
            <div className="border-t border-gray-200 pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Selected</span>
                <span className="font-medium">{formatPrice(totals.selectedTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Unselected</span>
                <span className="font-medium">{formatPrice(totals.unselectedTotal)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="text-indigo-600">{formatPrice(totals.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Create Split Button */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleCreateSplit}
              disabled={processing || selectedCharges.size === 0}
              className="w-full py-4 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {processing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                  </svg>
                  Start Splitting ({selectedCharges.size} charges)
                </>
              )}
            </button>
          </div>
        </>
      )}

      {/* Add Participant Modal */}
      {showAddParticipant && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddParticipant(false)} />
          <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Participant</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={newParticipant.name}
                  onChange={(e) => setNewParticipant(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter name"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
                <input
                  type="email"
                  value={newParticipant.email}
                  onChange={(e) => setNewParticipant(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                <input
                  type="tel"
                  value={newParticipant.phone}
                  onChange={(e) => setNewParticipant(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddParticipant(false)}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddParticipant}
                disabled={!newParticipant.name.trim()}
                className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SplitFolio;
