'use client';

import { useState } from 'react';
import { authClient } from '@/lib/api/client';
import { useUIStore } from '@/lib/store/uiStore';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

const ISSUE_TYPES = [
  { value: 'item_missing_or_wrong', label: 'Item missing or wrong' },
  { value: 'poor_food_quality', label: 'Poor food quality' },
  { value: 'incorrect_charge', label: 'Incorrect charge' },
  { value: 'order_never_arrived', label: 'Order never arrived' },
  { value: 'other', label: 'Other' },
] as const;

type IssueType = (typeof ISSUE_TYPES)[number]['value'];

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  onDisputeSubmitted: () => void;
}

export default function DisputeModal({
  isOpen,
  onClose,
  orderNumber,
  onDisputeSubmitted,
}: DisputeModalProps) {
  const { showToast } = useUIStore();
  const [issueType, setIssueType] = useState<IssueType>('item_missing_or_wrong');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setError('');
    setSubmitting(true);
    try {
      const { data } = await authClient.post(
        `/api/web-ordering/orders/${orderNumber}/dispute`,
        { issueType, description }
      );
      if (!data.success) {
        throw new Error(data.message || 'Failed to submit report');
      }
      showToast("Report submitted. We'll get back to you.", 'success');
      onDisputeSubmitted();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
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
    <Modal open={isOpen} onClose={handleClose} title="Report an issue">
      <div className="space-y-4">
        {/* Issue type selector */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">What went wrong?</p>
          <div className="space-y-2">
            {ISSUE_TYPES.map(({ value, label }) => (
              <label
                key={value}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <input
                  type="radio"
                  name="issueType"
                  value={value}
                  checked={issueType === value}
                  onChange={() => setIssueType(value)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Description textarea */}
        <div>
          <textarea
            rows={3}
            placeholder="Tell us what happened..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        {/* Inline error */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="ghost" fullWidth onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button fullWidth loading={submitting} onClick={handleSubmit}>
            Submit report
          </Button>
        </div>
      </div>
    </Modal>
  );
}
