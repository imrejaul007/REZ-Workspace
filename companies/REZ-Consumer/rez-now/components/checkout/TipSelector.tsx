'use client';

import { useState, useEffect } from 'react';
import { formatINR } from '@/lib/utils/currency';
import { cn } from '@/lib/utils/cn';

interface StaffMember {
  id: string;
  name: string;
  role?: string;
  avatar?: string;
}

interface TipSelectorProps {
  subtotal: number; // in paise
  onTipChange: (tipAmount: number, tipPercent: number, staffId?: string) => void;
  staffMembers?: StaffMember[];
  defaultPercent?: number;
}

const TIP_PERCENTS = [0, 10, 15, 18, 20, 25];

export default function TipSelector({
  subtotal,
  onTipChange,
  staffMembers = [],
  defaultPercent = 15,
}: TipSelectorProps) {
  const [selectedPercent, setSelectedPercent] = useState(defaultPercent);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedStaffId, setSelectedStaffId] = useState<string | undefined>();
  const [showCustomInput, setShowCustomInput] = useState(false);

  const tipAmount = Math.round(subtotal * (selectedPercent / 100));
  const customTipAmount = Math.round(parseFloat(customAmount || '0') * 100);
  const currentTip = showCustomInput ? customTipAmount : tipAmount;
  const currentPercent = showCustomInput
    ? Math.round((customTipAmount / subtotal) * 100)
    : selectedPercent;

  useEffect(() => {
    onTipChange(currentTip, currentPercent, selectedStaffId);
  }, [currentTip, currentPercent, selectedStaffId, onTipChange]);

  const handlePercentSelect = (percent: number) => {
    setSelectedPercent(percent);
    setShowCustomInput(false);
    setCustomAmount('');
  };

  const handleCustomToggle = () => {
    setShowCustomInput(!showCustomInput);
    if (!showCustomInput) {
      // Switch to custom mode, keep the current custom amount
      setCustomAmount((currentTip / 100).toFixed(0));
    }
  };

  // Suggested tip based on average order
  const suggestedTips = [
    { percent: 10, label: 'Low', suitable: 'Quick service' },
    { percent: 15, label: 'Standard', suitable: 'Good service' },
    { percent: 20, label: 'Generous', suitable: 'Excellent service' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">Add a Tip</h3>
        {currentTip > 0 && (
          <span className="text-lg font-bold text-indigo-600">
            {formatINR(currentTip)}
          </span>
        )}
      </div>

      {/* Quick percent options */}
      <div className="flex gap-2">
        {TIP_PERCENTS.map((percent) => (
          <button
            key={percent}
            onClick={() => handlePercentSelect(percent)}
            disabled={showCustomInput}
            aria-pressed={selectedPercent === percent && !showCustomInput}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2',
              selectedPercent === percent && !showCustomInput
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-gray-200 text-gray-600 hover:border-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            {percent === 0 ? 'None' : `${percent}%`}
          </button>
        ))}
        <button
          onClick={handleCustomToggle}
          className={cn(
            'px-3 py-2.5 rounded-xl text-sm font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2',
            showCustomInput
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'border-gray-200 text-gray-600 hover:border-indigo-300',
          )}
        >
          Custom
        </button>
      </div>

      {/* Custom amount input */}
      {showCustomInput && (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
          <input
            type="number"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="0"
            min={0}
            step={10}
            className="w-full pl-8 pr-4 py-3 rounded-xl border border-indigo-200 bg-white text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 text-center text-lg"
          />
          {customTipAmount > 0 && subtotal > 0 && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-indigo-600">
              {currentPercent}% of bill
            </span>
          )}
        </div>
      )}

      {/* Tip suggestions with context */}
      <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-2">
        <p className="text-xs text-gray-500 font-medium">Suggested tips</p>
        <div className="flex gap-2">
          {suggestedTips.map((suggestion) => {
            const amount = Math.round(subtotal * (suggestion.percent / 100));
            const isSelected = selectedPercent === suggestion.percent && !showCustomInput;
            return (
              <button
                key={suggestion.percent}
                onClick={() => handlePercentSelect(suggestion.percent)}
                disabled={showCustomInput}
                className={cn(
                  'flex-1 py-2 rounded-lg text-center transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400',
                  isSelected
                    ? 'bg-white shadow-sm border-2 border-indigo-400'
                    : 'bg-transparent hover:bg-white/50',
                )}
              >
                <p className="text-sm font-semibold text-gray-900">{formatINR(amount)}</p>
                <p className="text-xs text-gray-500">{suggestion.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Staff selection */}
      {staffMembers.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 font-medium">Tip to specific staff</p>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            <button
              onClick={() => setSelectedStaffId(undefined)}
              className={cn(
                'shrink-0 px-3 py-2 rounded-full text-sm font-medium border transition-all',
                selectedStaffId === undefined
                  ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400',
              )}
            >
              No preference
            </button>
            {staffMembers.map((staff) => (
              <button
                key={staff.id}
                onClick={() => setSelectedStaffId(staff.id)}
                className={cn(
                  'shrink-0 px-3 py-2 rounded-full text-sm font-medium border transition-all flex items-center gap-2',
                  selectedStaffId === staff.id
                    ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400',
                )}
              >
                {staff.avatar ? (
                  <img
                    src={staff.avatar}
                    alt={staff.name}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-indigo-200 flex items-center justify-center text-xs text-indigo-700 font-medium">
                    {staff.name.charAt(0)}
                  </span>
                )}
                {staff.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tip breakdown */}
      {currentTip > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Tip amount</span>
          <span className="font-semibold text-gray-900">{formatINR(currentTip)}</span>
        </div>
      )}

      {/* Tip message */}
      {currentTip > 0 && (
        <p className="text-xs text-gray-500 text-center">
          Your tip goes directly to the staff{selectedStaffId ? ` (${staffMembers.find(s => s.id === selectedStaffId)?.name})` : ''}
        </p>
      )}
    </div>
  );
}

// Staff tip assignment component for order review
export function TipBreakdown({
  subtotal,
  tipPercent,
  tipAmount,
  staffName,
}: {
  subtotal: number;
  tipPercent: number;
  tipAmount: number;
  staffName?: string;
}) {
  return (
    <div className="bg-green-50 rounded-lg px-3 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-green-600">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
        <span className="text-sm text-green-800">
          Tip to {staffName || 'staff'}
        </span>
      </div>
      <span className="text-sm font-semibold text-green-800">
        {formatINR(tipAmount)} ({tipPercent}%)
      </span>
    </div>
  );
}
