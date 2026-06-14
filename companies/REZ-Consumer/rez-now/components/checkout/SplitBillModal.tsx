'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { formatINR } from '@/lib/utils/currency';

interface SplitBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;    // in paise
  orderNumber: string;
  onSplitComplete: (perPersonAmount: number, numPeople: number) => void;
}

const MIN_PEOPLE = 2;
const MAX_PEOPLE = 10;

export default function SplitBillModal({
  isOpen,
  onClose,
  totalAmount,
  onSplitComplete,
}: SplitBillModalProps) {
  const [numPeople, setNumPeople] = useState(MIN_PEOPLE);

  const base = Math.floor(totalAmount / numPeople);
  const remainder = totalAmount - base * numPeople;
  // First person pays the remainder (could be 0)
  const firstPersonAmount = base + remainder;

  function decrement() {
    setNumPeople((n) => Math.max(MIN_PEOPLE, n - 1));
  }

  function increment() {
    setNumPeople((n) => Math.min(MAX_PEOPLE, n + 1));
  }

  function handleSplit() {
    // NW-MED-023: Guard against zero or negative amounts (could be manipulated via DevTools).
    if (totalAmount < 100) {
      return; // silently ignore — should never reach this if checkout guards are in place
    }
    onSplitComplete(firstPersonAmount, numPeople);
    onClose();
  }

  return (
    <Modal open={isOpen} onClose={onClose} title="Split the bill">
      <div className="space-y-5">
        {/* People stepper */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Number of people</span>
          <div className="flex items-center gap-3">
            <button
              onClick={decrement}
              disabled={numPeople <= MIN_PEOPLE}
              aria-label="Decrease people"
              className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
              </svg>
            </button>
            <span className="w-6 text-center text-lg font-bold text-gray-900">{numPeople}</span>
            <button
              onClick={increment}
              disabled={numPeople >= MAX_PEOPLE}
              aria-label="Increase people"
              className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Per-person amount — live update */}
        <div className="bg-indigo-50 rounded-xl px-4 py-4 text-center">
          <p className="text-sm text-indigo-600 font-medium mb-0.5">You pay</p>
          <p className="text-3xl font-extrabold text-indigo-700">{formatINR(firstPersonAmount)}</p>
          {remainder > 0 && (
            <p className="text-xs text-indigo-400 mt-1">Others pay {formatINR(base)} each</p>
          )}
        </div>

        {/* Breakdown */}
        <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1.5 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Total bill</span>
            <span className="font-semibold text-gray-900">{formatINR(totalAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Split between</span>
            <span className="font-semibold text-gray-900">{numPeople} people</span>
          </div>
          {remainder > 0 && (
            <div className="flex justify-between text-xs text-gray-400 pt-1 border-t border-gray-200">
              <span>First person pays (incl. {formatINR(remainder)} remainder)</span>
              <span>{formatINR(firstPersonAmount)}</span>
            </div>
          )}
        </div>

        {/* Note */}
        <p className="text-xs text-gray-400 text-center">
          Each person pays separately using their own payment method
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-1">
          <Button variant="primary" size="lg" fullWidth onClick={handleSplit}>
            Split equally
          </Button>
          <Button variant="ghost" size="lg" fullWidth onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
