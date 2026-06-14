"use client";

import { useState } from "react";
import { SearchFilters as SearchFiltersType } from "@shared/types";
import { CUISINE_LABELS, DIETARY_TAGS, PRICE_RANGES } from "@shared/constants";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onChange: (filters: SearchFiltersType) => void;
}

export function SearchFilters({ filters, onChange }: SearchFiltersProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(["cuisine", "dietary"]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const handleCuisineToggle = (cuisineId: string) => {
    const current = filters.cuisines || [];
    const updated = current.includes(cuisineId)
      ? current.filter((c) => c !== cuisineId)
      : [...current, cuisineId];
    onChange({ ...filters, cuisines: updated.length > 0 ? updated : undefined });
  };

  const handleDietaryToggle = (dietary: string) => {
    const current = filters.dietary || [];
    const updated = current.includes(dietary)
      ? current.filter((d) => d !== dietary)
      : [...current, dietary];
    onChange({ ...filters, dietary: updated.length > 0 ? updated : undefined });
  };

  const handlePriceChange = (range: [number, number] | undefined) => {
    onChange({ ...filters, priceRange: range });
  };

  const handleRatingChange = (rating: number | undefined) => {
    onChange({ ...filters, rating });
  };

  const clearAll = () => {
    onChange({});
  };

  const hasFilters =
    (filters.cuisines && filters.cuisines.length > 0) ||
    (filters.dietary && filters.dietary.length > 0) ||
    filters.priceRange ||
    filters.rating;

  return (
    <div className="bg-white rounded-xl border p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Filters</h3>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="text-sm text-orange-600 hover:text-orange-700"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Cuisine */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection("cuisine")}
          className="flex items-center justify-between w-full py-2 text-left"
        >
          <span className="font-medium">Cuisine</span>
          <ChevronDown
            className={cn(
              "w-4 h-4 transition-transform",
              expandedSections.includes("cuisine") && "rotate-180"
            )}
          />
        </button>
        {expandedSections.includes("cuisine") && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {Object.entries(CUISINE_LABELS).slice(0, 10).map(([id, label]) => (
              <label key={id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.cuisines?.includes(id) || false}
                  onChange={() => handleCuisineToggle(id)}
                  className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm">{label.replace(/^[^\s]+\s/, "")}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Dietary */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection("dietary")}
          className="flex items-center justify-between w-full py-2 text-left"
        >
          <span className="font-medium">Dietary</span>
          <ChevronDown
            className={cn(
              "w-4 h-4 transition-transform",
              expandedSections.includes("dietary") && "rotate-180"
            )}
          />
        </button>
        {expandedSections.includes("dietary") && (
          <div className="space-y-2">
            {Object.entries(DIETARY_TAGS).map(([id, label]) => (
              <label key={id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.dietary?.includes(id) || false}
                  onChange={() => handleDietaryToggle(id)}
                  className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm">{label.replace(/^[^\s]+\s/, "")}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Price Range */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection("price")}
          className="flex items-center justify-between w-full py-2 text-left"
        >
          <span className="font-medium">Price Range</span>
          <ChevronDown
            className={cn(
              "w-4 h-4 transition-transform",
              expandedSections.includes("price") && "rotate-180"
            )}
          />
        </button>
        {expandedSections.includes("price") && (
          <div className="space-y-2">
            {PRICE_RANGES.map((range) => {
              const isSelected =
                filters.priceRange?.[0] === range.min &&
                filters.priceRange?.[1] === range.max;
              return (
                <button
                  key={range.id}
                  onClick={() =>
                    handlePriceChange(isSelected ? undefined : [range.min, range.max as number])
                  }
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    isSelected
                      ? "bg-orange-100 text-orange-700"
                      : "hover:bg-gray-50"
                  )}
                >
                  {range.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Rating */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection("rating")}
          className="flex items-center justify-between w-full py-2 text-left"
        >
          <span className="font-medium">Rating</span>
          <ChevronDown
            className={cn(
              "w-4 h-4 transition-transform",
              expandedSections.includes("rating") && "rotate-180"
            )}
          />
        </button>
        {expandedSections.includes("rating") && (
          <div className="space-y-2">
            {[4.5, 4, 3.5, 3].map((rating) => (
              <button
                key={rating}
                onClick={() =>
                  handleRatingChange(filters.rating === rating ? undefined : rating)
                }
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors",
                  filters.rating === rating
                    ? "bg-orange-100 text-orange-700"
                    : "hover:bg-gray-50"
                )}
              >
                <span className="text-yellow-500">★</span>
                <span>{rating}+</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Open Now */}
      <div className="pt-4 border-t">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.isOpen || false}
            onChange={(e) => onChange({ ...filters, isOpen: e.target.checked || undefined })}
            className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
          />
          <span className="text-sm font-medium">Open Now</span>
        </label>
      </div>
    </div>
  );
}
