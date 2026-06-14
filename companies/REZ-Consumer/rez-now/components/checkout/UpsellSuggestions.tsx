'use client';

import { useState, useEffect, useMemo } from 'react';
import { MenuItem, CartItem } from '@/lib/types';
import { formatINR } from '@/lib/utils/currency';
import { cn } from '@/lib/utils/cn';
import Button from '@/components/ui/Button';

interface UpsellSuggestion {
  item: MenuItem;
  type: 'side' | 'beverage' | 'dessert' | 'add_on' | 'upgrade';
  triggerItem?: string;
  discount?: number;
  message: string;
}

interface UpsellSuggestionsProps {
  cartItems: CartItem[];
  menuItems: MenuItem[];
  onAddItem: (item: MenuItem, quantity?: number) => void;
  onDismiss?: () => void;
  maxSuggestions?: number;
}

export default function UpsellSuggestions({
  cartItems,
  menuItems,
  onAddItem,
  onDismiss,
  maxSuggestions = 3,
}: UpsellSuggestionsProps) {
  const [dismissed, setDismissed] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState<Set<string>>(new Set());

  // Analyze cart to generate upsell suggestions
  const suggestions = useMemo(() => {
    if (dismissed) return [];

    const cartItemIds = cartItems.map((c) => c.itemId);
    const suggestions: UpsellSuggestion[] = [];

    // Side dish suggestions (if main course ordered)
    const hasMainCourse = cartItems.some((item) =>
      item.name.toLowerCase().includes('biryani') ||
      item.name.toLowerCase().includes('curry') ||
      item.name.toLowerCase().includes('rice') ||
      item.name.toLowerCase().includes('roti') ||
      item.name.toLowerCase().includes('naan')
    );

    if (hasMainCourse) {
      const sides = menuItems.filter((item) =>
        item.name.toLowerCase().includes('fries') ||
        item.name.toLowerCase().includes('salad') ||
        item.name.toLowerCase().includes('raita') ||
        item.name.toLowerCase().includes('papad')
      );
      sides.slice(0, 2).forEach((item) => {
        if (!cartItemIds.includes(item.id)) {
          suggestions.push({
            item,
            type: 'side',
            message: 'Perfect with your meal',
          });
        }
      });
    }

    // Beverage suggestions (always good)
    const hasBeverage = cartItems.some((item) =>
      item.name.toLowerCase().includes('tea') ||
      item.name.toLowerCase().includes('coffee') ||
      item.name.toLowerCase().includes('drink') ||
      item.name.toLowerCase().includes('juice')
    );

    if (!hasBeverage) {
      const beverages = menuItems.filter((item) =>
        item.name.toLowerCase().includes('lassi') ||
        item.name.toLowerCase().includes('butter milk') ||
        item.name.toLowerCase().includes('juice') ||
        item.name.toLowerCase().includes('soda') ||
        item.name.toLowerCase().includes('water')
      );
      beverages.slice(0, 2).forEach((item) => {
        if (!cartItemIds.includes(item.id)) {
          suggestions.push({
            item,
            type: 'beverage',
            message: 'Refreshing choice',
          });
        }
      });
    }

    // Dessert suggestions (after main course)
    if (hasMainCourse) {
      const desserts = menuItems.filter((item) =>
        item.name.toLowerCase().includes('ice cream') ||
        item.name.toLowerCase().includes('gulab') ||
        item.name.toLowerCase().includes('rasmalai') ||
        item.name.toLowerCase().includes('kheer') ||
        item.name.toLowerCase().includes('cake')
      );
      desserts.slice(0, 2).forEach((item) => {
        if (!cartItemIds.includes(item.id)) {
          suggestions.push({
            item,
            type: 'dessert',
            message: 'Sweet ending',
          });
        }
      });
    }

    // Upgrade suggestions (larger portion)
    cartItems.forEach((cartItem) => {
      const menuItem = menuItems.find((m) => m.id === cartItem.itemId);
      if (menuItem?.portionSizes && menuItem.portionSizes.length > 0) {
        const largerPortion = menuItem.portionSizes.find((p) => p.priceModifier > 0);
        if (largerPortion) {
          suggestions.push({
            item: menuItem,
            type: 'upgrade',
            triggerItem: cartItem.itemId,
            message: `Upgrade to ${largerPortion.label}`,
            discount: 10,
          });
        }
      }
    });

    // Complementary add-ons based on specific items
    const itemNames = cartItems.map((c) => c.name.toLowerCase());

    if (itemNames.some((n) => n.includes('pizza'))) {
      const addOns = menuItems.filter((item) =>
        item.name.toLowerCase().includes('garlic bread') ||
        item.name.toLowerCase().includes('cheese') ||
        item.name.toLowerCase().includes('dip')
      );
      addOns.slice(0, 1).forEach((item) => {
        if (!cartItemIds.includes(item.id)) {
          suggestions.push({
            item,
            type: 'add_on',
            message: 'Great with pizza',
          });
        }
      });
    }

    if (itemNames.some((n) => n.includes('burger'))) {
      const addOns = menuItems.filter((item) =>
        item.name.toLowerCase().includes('fries') ||
        item.name.toLowerCase().includes('shake')
      );
      addOns.slice(0, 2).forEach((item) => {
        if (!cartItemIds.includes(item.id)) {
          suggestions.push({
            item,
            type: 'side',
            message: 'Classic combo',
          });
        }
      });
    }

    return suggestions.slice(0, maxSuggestions);
  }, [cartItems, menuItems, dismissed, maxSuggestions]);

  const handleAddItem = (item: MenuItem) => {
    onAddItem(item, 1);
    setRecentlyAdded((prev) => new Set([...prev, item.id]));

    // Remove from suggestions after short delay
    setTimeout(() => {
      setRecentlyAdded((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }, 2000);
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (suggestions.length === 0 || dismissed) {
    return null;
  }

  const getTypeIcon = (type: UpsellSuggestion['type']) => {
    switch (type) {
      case 'side':
        return '🍟';
      case 'beverage':
        return '🥤';
      case 'dessert':
        return '🍰';
      case 'add_on':
        return '➕';
      case 'upgrade':
        return '⬆️';
      default:
        return '✨';
    }
  };

  const getTypeLabel = (type: UpsellSuggestion['type']) => {
    switch (type) {
      case 'side':
        return 'Side';
      case 'beverage':
        return 'Beverage';
      case 'dessert':
        return 'Dessert';
      case 'add_on':
        return 'Add-on';
      case 'upgrade':
        return 'Upgrade';
      default:
        return 'Suggestion';
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-xl px-4 py-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">💡</span>
          <h3 className="text-sm font-bold text-gray-900">Add to your order</h3>
        </div>
        <button
          onClick={handleDismiss}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Dismiss
        </button>
      </div>

      {/* Suggestions */}
      <div className="space-y-2">
        {suggestions.map((suggestion) => {
          const isAdded = recentlyAdded.has(suggestion.item.id);
          return (
            <div
              key={suggestion.item.id}
              className={cn(
                'bg-white rounded-lg px-3 py-3 flex items-center gap-3 transition-all',
                isAdded && 'bg-green-50 border border-green-200',
              )}
            >
              {/* Item image/icon */}
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                {suggestion.item.image ? (
                  <img
                    src={suggestion.item.image}
                    alt={suggestion.item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl">{getTypeIcon(suggestion.type)}</span>
                )}
              </div>

              {/* Item details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.item.name}
                  </p>
                  <span className="shrink-0 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                    {getTypeLabel(suggestion.type)}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{suggestion.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-semibold text-gray-900">
                    {formatINR(suggestion.item.price)}
                  </span>
                  {suggestion.discount && (
                    <span className="text-xs text-green-600 font-medium">
                      {suggestion.discount}% off
                    </span>
                  )}
                </div>
              </div>

              {/* Add button */}
              <button
                onClick={() => handleAddItem(suggestion.item)}
                disabled={isAdded}
                className={cn(
                  'shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  isAdded
                    ? 'bg-green-100 text-green-700 cursor-default'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700',
                )}
              >
                {isAdded ? '✓ Added' : 'Add'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Savings message */}
      {suggestions.length >= 2 && (
        <p className="text-xs text-center text-amber-700">
          Complete your meal for better value!
        </p>
      )}
    </div>
  );
}

// Compact inline upsell for cart page
export function CompactUpsell({
  item,
  onAdd,
}: {
  item: MenuItem;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center gap-3 bg-amber-50 rounded-lg px-3 py-2">
      <span className="text-sm">Add {item.name} for</span>
      <span className="text-sm font-semibold text-gray-900">{formatINR(item.price)}</span>
      <button
        onClick={onAdd}
        className="ml-auto px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded-full hover:bg-indigo-700 transition-colors"
      >
        + Add
      </button>
    </div>
  );
}

// Quick add buttons for common items
export function QuickAddButtons({
  items,
  onAdd,
}: {
  items: MenuItem[];
  onAdd: (item: MenuItem) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onAdd(item)}
          className="shrink-0 flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-full text-sm hover:border-indigo-300 hover:shadow-sm transition-all"
        >
          {item.image && (
            <img
              src={item.image}
              alt={item.name}
              className="w-6 h-6 rounded-full object-cover"
            />
          )}
          <span className="font-medium text-gray-700">{item.name}</span>
          <span className="text-gray-500">{formatINR(item.price)}</span>
        </button>
      ))}
    </div>
  );
}
