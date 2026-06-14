'use client';

import { useState } from 'react';
import { ModuleType, ModuleInfo } from '@/types';
import { clsx } from 'clsx';
import { Check, X, Sparkles, Settings, Users, ShoppingCart } from 'lucide-react';

interface ModuleToggleProps {
  module: ModuleInfo;
  isEnabled: boolean;
  isAvailable: boolean;
  onToggle: (moduleId: ModuleType, enabled: boolean) => void;
  loading?: boolean;
}

export default function ModuleToggle({
  module,
  isEnabled,
  isAvailable,
  onToggle,
  loading = false
}: ModuleToggleProps) {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    if (!isAvailable || isToggling) return;
    setIsToggling(true);
    try {
      await onToggle(module.id, !isEnabled);
    } finally {
      setIsToggling(false);
    }
  };

  const categoryColors = {
    core: 'bg-red-100 text-red-700',
    operations: 'bg-blue-100 text-blue-700',
    customer: 'bg-green-100 text-green-700',
    management: 'bg-purple-100 text-purple-700'
  };

  const categoryIcons = {
    core: Sparkles,
    operations: Settings,
    customer: Users,
    management: ShoppingCart
  };

  const CategoryIcon = categoryIcons[module.category];

  return (
    <div
      className={clsx(
        'flex items-center gap-4 p-4 rounded-xl border transition-all duration-200',
        isEnabled
          ? 'bg-primary-50 border-primary-200'
          : isAvailable
          ? 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          : 'bg-gray-50 border-gray-100 opacity-60'
      )}
    >
      {/* Icon */}
      <div
        className={clsx(
          'w-12 h-12 rounded-xl flex items-center justify-center text-2xl',
          isEnabled ? 'bg-primary-100' : 'bg-gray-100'
        )}
      >
        {module.icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-gray-900">{module.name}</h4>
          <span
            className={clsx(
              'px-2 py-0.5 text-xs rounded-full capitalize flex items-center gap-1',
              categoryColors[module.category]
            )}
          >
            <CategoryIcon className="w-3 h-3" />
            {module.category}
          </span>
        </div>
        <p className="text-sm text-gray-500 line-clamp-2">{module.description}</p>
      </div>

      {/* Toggle */}
      <div className="flex items-center gap-3">
        {!isAvailable && (
          <span className="text-xs text-gray-400">Not available for this industry</span>
        )}
        <button
          onClick={handleToggle}
          disabled={!isAvailable || isToggling || loading}
          className={clsx(
            'relative w-12 h-6 rounded-full transition-colors duration-200',
            isEnabled
              ? 'bg-primary-600'
              : isAvailable
              ? 'bg-gray-300 hover:bg-gray-400'
              : 'bg-gray-200 cursor-not-allowed',
            (isToggling || loading) && 'opacity-70'
          )}
        >
          <span
            className={clsx(
              'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200',
              isEnabled ? 'translate-x-7' : 'translate-x-1'
            )}
          />
        </button>
      </div>

      {/* Status Indicator */}
      {isEnabled && (
        <div className="flex items-center gap-1 text-primary-600">
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">Active</span>
        </div>
      )}
    </div>
  );
}
