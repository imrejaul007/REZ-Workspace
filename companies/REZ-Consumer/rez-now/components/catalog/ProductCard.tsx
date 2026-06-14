'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils/cn';
import { CatalogItem } from '@/lib/types';
import VariantSelector from './VariantSelector';
import Button from '@/components/ui/Button';

interface ProductCardProps {
  item: CatalogItem;
  onAddToCart: (item: CatalogItem, qty: number, variants: Record<string, string>) => void;
}

export default function ProductCard({ item, onAddToCart }: ProductCardProps) {
  const [qty, setQty] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    item.variants?.forEach((g) => {
      const first = g.options.find((o) => o.inStock);
      if (first) initial[g.name] = first.value;
    });
    return initial;
  });
  const [showVariants, setShowVariants] = useState(false);

  const hasVariants = item.variants && item.variants.length > 0;

  function computePrice() {
    let price = item.basePrice;
    item.variants?.forEach((g) => {
      const opt = g.options.find((o) => o.value === selectedVariants[g.name]);
      if (opt) price += opt.priceModifier;
    });
    return price;
  }

  const effectivePrice = computePrice();
  const inStock = (item.stock ?? 0) > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
      {/* Image */}
      {item.images?.[0] ? (
        <div className="relative aspect-square bg-gray-100">
          <Image
            src={item.images[0]}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 50vw, 33vw"
            className="object-cover"
          />
          {item.savings && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              Save ₹{item.savings / 100}
            </div>
          )}
          {!inStock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white font-bold text-sm">Out of Stock</span>
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-square bg-gray-100 flex items-center justify-center">
          <span className="text-gray-400 text-4xl">📦</span>
        </div>
      )}

      <div className="p-3 space-y-2">
        {/* Name + price */}
        <div>
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{item.name}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-bold text-gray-900">₹{effectivePrice / 100}</span>
            {item.mrp && item.mrp > effectivePrice && (
              <span className="text-xs text-gray-400 line-through">{item.formattedMrp}</span>
            )}
          </div>
        </div>

        {/* Stock badge */}
        {item.stock !== undefined && (
          <p
            className={cn(
              'text-xs font-medium',
              item.stock === 0
                ? 'text-red-500'
                : item.stock <= 3
                  ? 'text-orange-500'
                  : 'text-green-600',
            )}
          >
            {item.stock === 0
              ? 'Out of stock'
              : item.stock <= 3
                ? `Only ${item.stock} left`
                : 'In stock'}
          </p>
        )}

        {/* Variant toggles */}
        {hasVariants && (
          <button
            onClick={() => setShowVariants((v) => !v)}
            className="text-xs text-indigo-600 font-medium hover:underline"
          >
            {showVariants ? 'Hide' : 'Choose'} {item.variants!.map((g) => g.name).join(', ')}
          </button>
        )}

        {/* Variant selectors */}
        {showVariants && hasVariants && (
          <div className="space-y-3 pt-1">
            {item.variants!.map((group) => (
              <VariantSelector
                key={group.name}
                group={group}
                selected={selectedVariants}
                onChange={(name, value) =>
                  setSelectedVariants((prev) => ({ ...prev, [name]: value }))
                }
              />
            ))}
          </div>
        )}

        {/* Bulk pricing */}
        {item.bulkPricing && item.bulkPricing.length > 0 && (
          <div className="bg-green-50 rounded-lg px-2 py-1">
            <p className="text-xs text-green-700 font-medium">
              Buy {item.bulkPricing[0].minQty}+ at ₹{item.bulkPricing[0].pricePerUnit / 100} each
            </p>
          </div>
        )}

        {/* Add to cart */}
        <div className="flex items-center gap-2 pt-1">
          <div className="flex items-center border border-gray-200 rounded-lg">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              aria-label="Decrease quantity"
              className="px-2 py-1 text-gray-600 hover:text-gray-900"
            >
              −
            </button>
            <span className="px-2 text-sm font-medium" aria-label={`Quantity: ${qty}`}>{qty}</span>
            <button
              onClick={() => setQty((q) => q + 1)}
              aria-label="Increase quantity"
              className="px-2 py-1 text-gray-600 hover:text-gray-900"
            >
              +
            </button>
          </div>
          <Button
            size="sm"
            className="flex-1"
            disabled={!inStock}
            onClick={() => onAddToCart(item, qty, selectedVariants)}
          >
            {inStock ? 'Add' : 'Out of Stock'}
          </Button>
        </div>
      </div>
    </div>
  );
}
