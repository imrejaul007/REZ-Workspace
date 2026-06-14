'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface IngredientBreakdownProps {
  ingredients?: string[];
  cookingMethod?: string | null;
  story?: string | null;
  className?: string;
}

export default function IngredientBreakdown({
  ingredients,
  cookingMethod,
  story,
  className,
}: IngredientBreakdownProps) {
  const [expanded, setExpanded] = useState(false);

  const hasIngredients = ingredients && ingredients.length > 0;
  const hasCookingMethod = !!cookingMethod;
  const hasStory = !!story;

  if (!hasIngredients && !hasCookingMethod && !hasStory) return null;

  return (
    <div className={cn('rounded-lg border border-gray-100 bg-white overflow-hidden', className)}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          <span className="text-base" aria-hidden="true">📋</span>
          <span className="text-sm font-semibold text-gray-800">Ingredients & Details</span>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={cn('w-4 h-4 text-gray-400 transition-transform', expanded && 'rotate-180')}
        >
          <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/>
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Story / Origin */}
          {hasStory && (
            <div className="bg-amber-50 rounded-lg p-3">
              <p className="text-xs font-medium text-amber-800 mb-1 flex items-center gap-1">
                <span aria-hidden="true">📜</span> Origin Story
              </p>
              <p className="text-sm text-gray-700">{story}</p>
            </div>
          )}

          {/* Cooking Method */}
          {hasCookingMethod && (
            <div className="flex items-center gap-2">
              <span className="text-sm">🔥</span>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cooking Method</span>
              <span className="text-sm font-medium text-gray-800">{cookingMethod}</span>
            </div>
          )}

          {/* Ingredients */}
          {hasIngredients && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <span aria-hidden="true">🥗</span>
                Key Ingredients
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ingredients.map((ingredient, index) => (
                  <span
                    key={`${ingredient}-${index}`}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full"
                  >
                    {ingredient}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
