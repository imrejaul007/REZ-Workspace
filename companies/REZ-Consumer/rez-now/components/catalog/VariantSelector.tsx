'use client';

import { cn } from '@/lib/utils/cn';
import { VariantGroup } from '@/lib/types';

interface VariantSelectorProps {
  group: VariantGroup;
  selected: Record<string, string>; // { [groupName]: value }
  onChange: (groupName: string, value: string) => void;
}

export default function VariantSelector({ group, selected, onChange }: VariantSelectorProps) {
  const selectedOption = group.options.find((o) => o.value === selected[group.name]);

  if (group.type === 'color') {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">{group.name}</p>
        <div className="flex flex-wrap gap-2">
          {group.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange(group.name, opt.value)}
              disabled={!opt.inStock}
              title={`${opt.label}${opt.priceModifier ? ` (+₹${opt.priceModifier / 100})` : ''}`}
              aria-label={`${opt.label}${opt.priceModifier ? ` (+₹${opt.priceModifier / 100})` : ''}${!opt.inStock ? ', out of stock' : ''}`}
              className={cn(
                'w-11 h-11 rounded-full border-2 transition-all',
                selected[group.name] === opt.value
                  ? 'border-indigo-600 ring-2 ring-indigo-200'
                  : 'border-gray-200',
                !opt.inStock && 'opacity-30 cursor-not-allowed',
              )}
              style={{ backgroundColor: opt.color || '#ccc' }}
            />
          ))}
        </div>
        {selectedOption && selectedOption.priceModifier > 0 && (
          <p className="text-xs text-indigo-600">+₹{selectedOption.priceModifier / 100}</p>
        )}
      </div>
    );
  }

  if (group.type === 'size') {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">{group.name}</p>
        <div className="flex flex-wrap gap-2">
          {group.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange(group.name, opt.value)}
              disabled={!opt.inStock}
              className={cn(
                'px-3 py-1.5 rounded-lg border text-sm font-medium transition-all',
                selected[group.name] === opt.value
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300',
                !opt.inStock && 'opacity-40 cursor-not-allowed line-through',
              )}
            >
              {opt.label}
              {opt.priceModifier > 0 && (
                <span className="ml-1 text-xs">+₹{opt.priceModifier / 100}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Default: text/button variants
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">{group.name}</p>
      <div className="flex flex-wrap gap-2">
        {group.options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(group.name, opt.value)}
            disabled={!opt.inStock}
            className={cn(
              'px-3 py-1.5 rounded-lg border text-sm transition-all',
              selected[group.name] === opt.value
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold'
                : 'border-gray-200 text-gray-600 hover:border-gray-300',
              !opt.inStock && 'opacity-40 cursor-not-allowed',
            )}
          >
            {opt.label}
            {opt.priceModifier !== 0 && (
              <span className="ml-1 text-xs">
                {opt.priceModifier > 0
                  ? `+₹${opt.priceModifier / 100}`
                  : `-₹${Math.abs(opt.priceModifier) / 100}`}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
