'use client';

import { useState } from 'react';
import { cancelOrder } from '@/lib/api/cancellation';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

const CANCEL_REASONS = [
  { value: 'mind', label: 'Changed my mind' },
  { value: 'mistake', label: 'Ordered by mistake' },
  { value: 'slow', label: 'Taking too long' },
  { value: 'other', label: 'Other' },
] as const;

type CancelReasonKey = (typeof CANCEL_REASONS)[number]['value'];

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  onCancelled: (refundInitiated: boolean) => void;
}

export default function CancelOrderModal({
  isOpen,
  onClose,
  orderNumber,
  onCancelled,
}: CancelOrderModalProps) {
  const [selectedReason, setSelectedReason] = useState<CancelReasonKey>('mind');
  const [otherText, setOtherText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // NW-MED-035: Require otherText when reason is 'other' — disable submit until filled.
  const canConfirm = selectedReason !== 'other' || otherText.trim().length > 0;

  function buildReason(): string {
    if (selectedReason === 'other') {
      // NW-MED-035: otherText is guaranteed non-empty here since canConfirm gates submission.
      return otherText.trim();
    }
    return CANCEL_REASONS.find((r) => r.value === selectedReason)?.label ?? selectedReason;
  }

  async function handleConfirm() {
    if (!canConfirm || submitting) return;
    setError('');
    setSubmitting(true);
    try {
      const { refundInitiated } = await cancelOrder(orderNumber, buildReason());
      onCancelled(refundInitiated);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not cancel order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    if (submitting) return;
    setError('');
    onClose();
  }

  return (
    <Modal open={isOpen} onClose={handleClose} title="Cancel this order?">
      <div className="space-y-4">
        {/* Reason selector */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Reason</p>
          <div className="space-y-2">
            {CANCEL_REASONS.map(({ value, label }) => (
              <label key={value} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="cancelReason"
                  value={value}
                  checked={selectedReason === value}
                  onChange={() => setSelectedReason(value)}
                  className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Freetext for "Other" — NW-MED-035: now required, not optional */}
        {selectedReason === 'other' && (
          <>
            <textarea
              rows={3}
              placeholder="Please describe your reason (required)..."
              value={otherText}
              onChange={(e) => setOtherText(e.target.value.slice(0, 200))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              required
            />
            {!canConfirm && otherText.trim().length === 0 && (
              <p className="text-xs text-red-500">Please enter a reason before cancelling.</p>
            )}
          </>
        )}

        {/* Inline error */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="ghost" fullWidth onClick={handleClose} disabled={submitting}>
            Keep Order
          </Button>
          <Button variant="danger" fullWidth loading={submitting} onClick={handleConfirm} disabled={!canConfirm}>
            Yes, Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
