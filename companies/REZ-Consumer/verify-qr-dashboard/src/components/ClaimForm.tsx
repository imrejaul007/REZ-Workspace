'use client';

import { useState } from 'react';
import { Warranty } from '@/services/api';

interface ClaimFormProps {
  warranties: Warranty[];
  selectedWarranty: Warranty | null;
  onSelectWarranty: (warranty: Warranty | null) => void;
  onSubmit: (data: {
    warrantyId: string;
    type: 'repair' | 'replacement' | 'refund';
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
  }) => Promise<void>;
  onCancel: () => void;
}

export default function ClaimForm({
  warranties,
  selectedWarranty,
  onSelectWarranty,
  onSubmit,
  onCancel,
}: ClaimFormProps) {
  const [type, setType] = useState<'repair' | 'replacement' | 'refund'>('repair');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedWarranty) {
      newErrors.warranty = 'Please select a warranty';
    }

    if (!description.trim()) {
      newErrors.description = 'Please describe the issue';
    } else if (description.trim().length < 20) {
      newErrors.description = 'Please provide more details (at least 20 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate() || !selectedWarranty) return;

    setSubmitting(true);
    try {
      await onSubmit({
        warrantyId: selectedWarranty.id,
        type,
        description,
        priority,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit claim');
    } finally {
      setSubmitting(false);
    }
  };

  const claimTypes = [
    {
      value: 'repair',
      label: 'Repair',
      description: 'Fix a defective component or part',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      value: 'replacement',
      label: 'Replacement',
      description: 'Replace the entire product',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
    },
    {
      value: 'refund',
      label: 'Refund',
      description: 'Request a full or partial refund',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      ),
    },
  ];

  const priorities = [
    { value: 'low', label: 'Low', description: 'Minor issue, no rush' },
    { value: 'medium', label: 'Medium', description: 'Moderate impact' },
    { value: 'high', label: 'High', description: 'Significant impact' },
    { value: 'urgent', label: 'Urgent', description: 'Critical, needs immediate attention' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Warranty Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Warranty <span className="text-red-500">*</span>
        </label>
        {warranties.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              No active warranties available for claims. Please ensure your warranty is active.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {warranties.map((warranty) => (
              <button
                key={warranty.id}
                type="button"
                onClick={() => onSelectWarranty(warranty)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedWarranty?.id === warranty.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{warranty.productName}</p>
                    <p className="text-sm text-gray-500">{warranty.brand}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{warranty.qrCode}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Expires: {new Date(warranty.warrantyEndDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
        {errors.warranty && (
          <p className="mt-1 text-sm text-red-600">{errors.warranty}</p>
        )}
      </div>

      {/* Claim Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Claim Type <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {claimTypes.map((claimType) => (
            <button
              key={claimType.value}
              type="button"
              onClick={() => setType(claimType.value as typeof type)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                type === claimType.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={type === claimType.value ? 'text-primary-600' : 'text-gray-400'}>
                  {claimType.icon}
                </span>
                <span className="font-medium">{claimType.label}</span>
              </div>
              <p className="text-xs text-gray-500">{claimType.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Priority */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Priority <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {priorities.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPriority(p.value as typeof priority)}
              className={`p-2 rounded-lg border text-center transition-colors ${
                priority === p.value
                  ? p.value === 'urgent'
                    ? 'border-red-500 bg-red-50'
                    : p.value === 'high'
                    ? 'border-orange-500 bg-orange-50'
                    : p.value === 'medium'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-500 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className={`text-sm font-medium ${
                priority === p.value
                  ? p.value === 'urgent'
                    ? 'text-red-700'
                    : p.value === 'high'
                    ? 'text-orange-700'
                    : p.value === 'medium'
                    ? 'text-blue-700'
                    : 'text-gray-700'
                  : 'text-gray-600'
              }`}>
                {p.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Issue Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Please describe the issue in detail. Include when the problem started, unknown error messages, and how it affects your use of the product..."
          rows={4}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        <div className="flex justify-between mt-1">
          {errors.description ? (
            <p className="text-sm text-red-600">{errors.description}</p>
          ) : (
            <p className="text-sm text-gray-400">Minimum 20 characters</p>
          )}
          <p className="text-sm text-gray-400">{description.length} characters</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Submit Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || warranties.length === 0}
          className="flex-1 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Submitting...
            </span>
          ) : (
            'Submit Claim'
          )}
        </button>
      </div>
    </form>
  );
}
