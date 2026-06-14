'use client';

import { useState, useCallback } from 'react';
import { useCartStore } from '@/lib/store/cartStore';
import { useUIStore } from '@/lib/store/uiStore';
import { cn } from '@/lib/utils/cn';
import Button from '@/components/ui/Button';
import { logger } from '@/lib/utils/logger';

interface OrderItem {
  name: string;
  qty: number;
  unitPrice: number;
  total: number;
}

interface OrderSuggestionProps {
  items: OrderItem[];
  storeSlug: string;
  onDismiss?: () => void;
}

function formatPrice(paise: number): string {
  return `Rs ${(paise / 100).toFixed(2)}`;
}

export default function OrderSuggestion({ items, storeSlug, onDismiss }: OrderSuggestionProps) {
  const addItem = useCartStore((s) => s.addItem);
  const setStore = useCartStore((s) => s.setStore);
  const showToast = useUIStore((s) => s.showToast);

  const [isAdding, setIsAdding] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const total = items.reduce((sum, item) => sum + item.total, 0);

  const handleAddToCart = useCallback(async () => {
    setIsAdding(true);
    try {
      // Ensure cart is set to this store (clears if switching)
      setStore(storeSlug);

      for (const item of items) {
        // Generate a stable itemId from the name for deduplication
        const itemId = item.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');

        addItem({
          itemId,
          name: item.name,
          price: item.unitPrice,
          basePrice: item.unitPrice,
          customizations: {},
          customizationTotal: 0,
          isVeg: true, // default; backend should ideally send this
        });
      }

      showToast(`${items.length} item${items.length !== 1 ? 's' : ''} added to cart`, 'success');
      setDismissed(true);
      onDismiss?.();
    } catch (err) {
      logger.error('[OrderSuggestion] Failed to add items', { error: err });
      showToast('Could not add items to cart. Try again.', 'error');
    } finally {
      setIsAdding(false);
    }
  }, [items, storeSlug, addItem, setStore, showToast, onDismiss]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    onDismiss?.();
  }, [onDismiss]);

  if (dismissed) return null;

  return (
    <div
      className="mt-2 border border-gray-200 rounded-xl overflow-hidden bg-gray-50"
      role="region"
      aria-label="Order suggestion"
    >
      {/* Header */}
      <div className="px-3 py-2 bg-indigo-50 border-b border-indigo-100">
        <p className="text-xs font-semibold text-indigo-700">Suggested Order</p>
      </div>

      {/* Item list */}
      <ul className="px-3 py-2 divide-y divide-gray-100" aria-label="Order items">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center justify-between py-1.5 text-xs">
            <span className="flex items-center gap-1.5 text-gray-700">
              <span className="w-4 h-4 rounded-sm border border-green-600 flex items-center justify-center flex-shrink-0">
                <span className="w-2 h-2 rounded-full bg-green-600" />
              </span>
              {item.name}
              <span className="text-gray-400">&times;{item.qty}</span>
            </span>
            <span className="text-gray-600 font-medium">{formatPrice(item.total)}</span>
          </li>
        ))}
      </ul>

      {/* Total */}
      <div className="px-3 py-2 bg-gray-100 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-700">Total</span>
        <span className="text-sm font-bold text-gray-900">{formatPrice(total)}</span>
      </div>

      {/* Actions */}
      <div className="px-3 py-2 flex gap-2">
        <Button
          variant="primary"
          size="sm"
          loading={isAdding}
          onClick={handleAddToCart}
          className="flex-1"
          aria-label="Add suggested items to cart"
        >
          Add to cart
        </Button>
        <button
          onClick={handleDismiss}
          disabled={isAdding}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500',
            'border border-gray-200 bg-white hover:bg-gray-50',
            'transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          aria-label="Dismiss order suggestion"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
