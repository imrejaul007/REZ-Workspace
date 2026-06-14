'use client';

import { cn } from '@/lib/utils/cn';

export type DietaryFilterType = 'vegan' | 'gluten_free' | 'nut_free' | 'dairy_free' | 'halal' | 'kosher';

interface DietaryFilterProps {
  activeFilters: DietaryFilterType[];
  onToggle: (filter: DietaryFilterType) => void;
  className?: string;
}

const FILTERS: { id: DietaryFilterType; label: string; icon: string; color: string }[] = [
  { id: 'vegan', label: 'Vegan', icon: '🌱', color: 'green' },
  { id: 'gluten_free', label: 'Gluten-Free', icon: '🌾', color: 'amber' },
  { id: 'nut_free', label: 'Nut-Free', icon: '🥜', color: 'orange' },
  { id: 'dairy_free', label: 'Dairy-Free', icon: '🥛', color: 'blue' },
  { id: 'halal', label: 'Halal', icon: '☪️', color: 'emerald' },
  { id: 'kosher', label: 'Kosher', icon: '✡️', color: 'purple' },
];

const COLOR_CLASSES: Record<string, { active: string; inactive: string }> = {
  green: {
    active: 'bg-green-100 text-green-800 border-green-300',
    inactive: 'bg-white text-gray-600 border-gray-200 hover:border-green-300',
  },
  amber: {
    active: 'bg-amber-100 text-amber-800 border-amber-300',
    inactive: 'bg-white text-gray-600 border-gray-200 hover:border-amber-300',
  },
  orange: {
    active: 'bg-orange-100 text-orange-800 border-orange-300',
    inactive: 'bg-white text-gray-600 border-gray-200 hover:border-orange-300',
  },
  blue: {
    active: 'bg-blue-100 text-blue-800 border-blue-300',
    inactive: 'bg-white text-gray-600 border-gray-200 hover:border-blue-300',
  },
  emerald: {
    active: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    inactive: 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300',
  },
  purple: {
    active: 'bg-purple-100 text-purple-800 border-purple-300',
    inactive: 'bg-white text-gray-600 border-gray-200 hover:border-purple-300',
  },
};

export default function DietaryFilter({ activeFilters, onToggle, className }: DietaryFilterProps) {
  return (
    <div className={cn('flex flex-wrap gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100', className)}>
      <span className="text-xs font-medium text-gray-500 self-center mr-1">Dietary:</span>
      {FILTERS.map((filter) => {
        const isActive = activeFilters.includes(filter.id);
        const colors = COLOR_CLASSES[filter.color];
        return (
          <button
            key={filter.id}
            onClick={() => onToggle(filter.id)}
            aria-pressed={isActive}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
              'border transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500',
              isActive ? colors.active : colors.inactive
            )}
          >
            <span aria-hidden="true">{filter.icon}</span>
            <span>{filter.label}</span>
          </button>
        );
      })}
      {activeFilters.length > 0 && (
        <button
          onClick={() => activeFilters.forEach((f) => onToggle(f))}
          className="text-xs text-gray-400 hover:text-gray-600 self-center ml-auto underline underline-offset-2"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
