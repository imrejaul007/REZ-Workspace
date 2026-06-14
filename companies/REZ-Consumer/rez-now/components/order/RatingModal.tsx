'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { rateOrder } from '@/lib/api/orders';
import { useUIStore } from '@/lib/store/uiStore';

interface RatingModalProps {
  open: boolean;
  orderNumber: string;
  onSuccess: () => void;
  onSkip: () => void;
}

const COMMENT_MAX = 300;

export default function RatingModal({
  open,
  orderNumber,
  onSuccess,
  onSkip,
}: RatingModalProps) {
  const { showToast } = useUIStore();
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedStar, setSelectedStar] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleClose() {
    if (submitting) return;
    onSkip();
  }

  async function handleSubmit() {
    if (selectedStar === 0) return;
    setSubmitting(true);
    try {
      await rateOrder(orderNumber, selectedStar, comment);
      showToast('Thanks for your feedback!', 'success');
      onSuccess();
    } catch (e: unknown) {
      showToast(
        e instanceof Error ? e.message : 'Could not submit rating. Please try again.',
        'error',
      );
    } finally {
      setSubmitting(false);
    }
  }

  const activeStar = hoveredStar || selectedStar;

  return (
    <Modal open={open} onClose={handleClose} title="Rate your experience">
      <div className="space-y-5">
        {/* Star picker */}
        <div
          className="flex justify-center gap-3"
          role="group"
          aria-label="Star rating"
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              aria-label={`${star} star${star !== 1 ? 's' : ''}`}
              aria-pressed={selectedStar === star}
              onClick={() => setSelectedStar(star)}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              className="text-4xl leading-none transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
            >
              {star <= activeStar ? '★' : '☆'}
            </button>
          ))}
        </div>

        {selectedStar > 0 && (
          <p className="text-center text-sm text-gray-500 -mt-2">
            {selectedStar === 1 && 'Very poor'}
            {selectedStar === 2 && 'Poor'}
            {selectedStar === 3 && 'Okay'}
            {selectedStar === 4 && 'Good'}
            {selectedStar === 5 && 'Excellent!'}
          </p>
        )}

        {/* Optional comment */}
        <div>
          <textarea
            rows={3}
            placeholder="What did you love or want improved? (optional)"
            value={comment}
            maxLength={COMMENT_MAX}
            onChange={(e) => setComment(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          <p className="text-right text-xs text-gray-400 mt-1">
            {comment.length}/{COMMENT_MAX}
          </p>
        </div>

        {/* Actions */}
        <Button
          fullWidth
          loading={submitting}
          disabled={selectedStar === 0}
          onClick={handleSubmit}
        >
          Submit rating
        </Button>

        <button
          type="button"
          onClick={handleClose}
          disabled={submitting}
          className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors py-1"
        >
          Skip
        </button>
      </div>
    </Modal>
  );
}
