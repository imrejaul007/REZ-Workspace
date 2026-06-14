'use client';

import { useEffect, useRef, useState } from 'react';
import { MenuItem, MenuCustomization } from '@/lib/types';
import { formatINR } from '@/lib/utils/currency';
import { cn } from '@/lib/utils/cn';
import StoreImage from '@/components/ui/StoreImage';
import Button from '@/components/ui/Button';

interface CustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem;
  onAddToCart: (
    item: MenuItem,
    quantity: number,
    selectedCustomizations: Record<string, string[]>,
    customizationTotal: number,
  ) => void;
}

/** Returns total extra paise added by current selections */
function computeCustomizationTotal(
  customizations: MenuCustomization[],
  selected: Record<string, string[]>,
): number {
  let total = 0;
  for (const group of customizations) {
    const chosenIds = selected[group.id] ?? [];
    for (const optId of chosenIds) {
      const opt = group.options.find((o) => o.id === optId);
      if (opt) total += opt.priceAdd;
    }
  }
  return total;
}

/** Validates that all required groups and multi-select min counts are satisfied */
function validate(
  customizations: MenuCustomization[],
  selected: Record<string, string[]>,
): string | null {
  for (const group of customizations) {
    const chosenIds = selected[group.id] ?? [];
    if (group.required && chosenIds.length === 0) {
      return `Please select an option for "${group.name}"`;
    }
    if (group.type === 'multiple') {
      const min = group.minSelect ?? (group.required ? 1 : 0);
      const max = group.maxSelect ?? group.options.length;
      if (chosenIds.length < min) {
        return `Select at least ${min} option${min > 1 ? 's' : ''} for "${group.name}"`;
      }
      if (chosenIds.length > max) {
        return `Select at most ${max} option${max > 1 ? 's' : ''} for "${group.name}"`;
      }
    }
  }
  return null;
}

/** Build default selections: auto-select first option for required single-select groups */
function buildDefaultSelections(customizations: MenuCustomization[]): Record<string, string[]> {
  const defaults: Record<string, string[]> = {};
  for (const group of customizations) {
    if (group.type === 'single' && group.required && group.options.length > 0) {
      defaults[group.id] = [group.options[0].id];
    } else {
      defaults[group.id] = [];
    }
  }
  return defaults;
}

export default function CustomizationModal({
  isOpen,
  onClose,
  item,
  onAddToCart,
}: CustomizationModalProps) {
  const customizations = item.customizations ?? [];

  const [selected, setSelected] = useState<Record<string, string[]>>(() =>
    buildDefaultSelections(customizations),
  );
  const [quantity, setQuantity] = useState(1);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Reset state each time the modal opens (item may change)
  useEffect(() => {
    if (isOpen) {
      setSelected(buildDefaultSelections(customizations));
      setQuantity(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, item.id]);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const customizationTotal = computeCustomizationTotal(customizations, selected);
  const unitTotal = item.price + customizationTotal;
  const grandTotal = unitTotal * quantity;
  const validationError = validate(customizations, selected);

  function handleSingleSelect(groupId: string, optionId: string) {
    setSelected((prev) => ({ ...prev, [groupId]: [optionId] }));
  }

  function handleMultiSelect(groupId: string, optionId: string, group: MenuCustomization) {
    setSelected((prev) => {
      const current = prev[groupId] ?? [];
      if (current.includes(optionId)) {
        return { ...prev, [groupId]: current.filter((id) => id !== optionId) };
      }
      const max = group.maxSelect ?? group.options.length;
      if (current.length >= max) return prev; // silently block beyond max
      return { ...prev, [groupId]: [...current, optionId] };
    });
  }

  function handleSubmit() {
    if (validationError) return;
    onAddToCart(item, quantity, selected, customizationTotal);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customization-modal-title"
    >
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[90dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <h2 id="customization-modal-title" className="text-lg font-bold text-gray-900 truncate pr-4">{item.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 pb-4">
          {/* Item summary */}
          <div className="flex gap-3 mb-5">
            {item.image && (
              <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                <StoreImage src={item.image} alt={item.name} width={80} height={80} fill sizes="80px" className="object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900">{formatINR(item.price)}</p>
              {item.originalPrice && item.originalPrice > item.price && (
                <p className="text-xs text-gray-400 line-through">{formatINR(item.originalPrice)}</p>
              )}
              {item.description && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-3">{item.description}</p>
              )}
            </div>
          </div>

          {/* Customization groups */}
          <div className="space-y-5">
            {customizations.map((group) => {
              const chosenIds = selected[group.id] ?? [];
              const max = group.maxSelect ?? group.options.length;

              const groupLabelId = `group-label-${group.id}`;
              return (
                <fieldset
                  key={group.id}
                  role={group.type === 'single' ? 'radiogroup' : 'group'}
                  aria-labelledby={groupLabelId}
                  aria-required={group.required ? true : undefined}
                >
                  {/* Group header */}
                  <div className="flex items-center gap-2 mb-2.5">
                    <legend id={groupLabelId} className="text-sm font-bold text-gray-900">{group.name}</legend>
                    {group.required ? (
                      <span className="text-[10px] font-semibold uppercase tracking-wide bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">
                        Required
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold uppercase tracking-wide bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                        Optional
                      </span>
                    )}
                    {group.type === 'multiple' && (
                      <span className="text-xs text-gray-400 ml-auto">
                        {chosenIds.length}/{max}
                      </span>
                    )}
                  </div>

                  {/* Options */}
                  <div className="space-y-2">
                    {group.options.map((option) => {
                      const isChosen = chosenIds.includes(option.id);

                      if (group.type === 'single') {
                        return (
                          <label
                            key={option.id}
                            className={cn(
                              'flex items-center justify-between gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                              isChosen
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-gray-100 bg-gray-50 hover:border-gray-200',
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={cn(
                                'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                                isChosen ? 'border-indigo-600' : 'border-gray-300',
                              )}>
                                {isChosen && (
                                  <div className="w-2 h-2 rounded-full bg-indigo-600" />
                                )}
                              </div>
                              <span className="text-sm text-gray-800 truncate">{option.name}</span>
                            </div>
                            {option.priceAdd > 0 && (
                              <span className="text-sm font-semibold text-indigo-600 flex-shrink-0">
                                +{formatINR(option.priceAdd)}
                              </span>
                            )}
                            <input
                              type="radio"
                              name={group.id}
                              value={option.id}
                              checked={isChosen}
                              onChange={() => handleSingleSelect(group.id, option.id)}
                              className="sr-only"
                            />
                          </label>
                        );
                      }

                      // type === 'multiple'
                      const atMax = chosenIds.length >= max && !isChosen;
                      return (
                        <label
                          key={option.id}
                          className={cn(
                            'flex items-center justify-between gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                            isChosen
                              ? 'border-indigo-500 bg-indigo-50'
                              : atMax
                                ? 'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed'
                                : 'border-gray-100 bg-gray-50 hover:border-gray-200',
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={cn(
                              'w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0',
                              isChosen ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300',
                            )}>
                              {isChosen && (
                                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className="text-sm text-gray-800 truncate">{option.name}</span>
                          </div>
                          {option.priceAdd > 0 && (
                            <span className="text-sm font-semibold text-indigo-600 flex-shrink-0">
                              +{formatINR(option.priceAdd)}
                            </span>
                          )}
                          <input
                            type="checkbox"
                            checked={isChosen}
                            disabled={atMax}
                            onChange={() => handleMultiSelect(group.id, option.id, group)}
                            className="sr-only"
                          />
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              );
            })}
          </div>
        </div>

        {/* Footer: quantity + add button */}
        <div className="flex-shrink-0 px-5 pb-6 pt-3 border-t border-gray-100 space-y-3">
          {/* Quantity selector */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Quantity</span>
            <div className="flex items-center gap-3 bg-indigo-600 rounded-xl px-2 py-1">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-7 h-7 text-white font-bold text-xl flex items-center justify-center"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="text-white font-bold text-sm w-5 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                className="w-7 h-7 text-white font-bold text-xl flex items-center justify-center"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          {/* Validation hint */}
          {validationError && (
            <p role="alert" className="text-xs text-red-500 text-center">{validationError}</p>
          )}

          {/* Add to cart */}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!!validationError}
            onClick={handleSubmit}
          >
            Add to cart &mdash; {formatINR(grandTotal)}
          </Button>
        </div>
      </div>
    </div>
  );
}
