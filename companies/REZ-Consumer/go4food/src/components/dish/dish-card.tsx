"use client";

import Image from "next/image";
import Link from "next/link";
import { Flame, Leaf } from "lucide-react";
import { Dish } from "@shared/types";
import { cn } from "@/lib/utils";

interface DishCardProps {
  dish: Dish;
  compact?: boolean;
}

export function DishCard({ dish, compact = false }: DishCardProps) {
  if (compact) {
    return (
      <Link
        href={`/dish/${dish.slug}`}
        className="group flex items-center gap-3 p-3 bg-white rounded-lg border hover:shadow-md transition-all"
      >
        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
          <Image
            src={dish.images[0] || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200"}
            alt={dish.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate group-hover:text-orange-600 transition-colors">
            {dish.name}
          </h4>
          <p className="text-xs text-gray-500 truncate">
            {dish.cuisine?.name || "Various cuisines"}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/dish/${dish.slug}`}
      className="group block bg-white rounded-xl border overflow-hidden hover:shadow-lg hover:border-orange-200 transition-all"
    >
      {/* Image */}
      <div className="relative h-40 overflow-hidden">
        <Image
          src={dish.images[0] || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"}
          alt={dish.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {dish.dietaryTags.includes("vegetarian") ? (
          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
            <Leaf className="w-3 h-3" />
            Veg
          </div>
        ) : (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
            <Flame className="w-3 h-3" />
            Non-Veg
          </div>
        )}
        {dish.nutrition && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {dish.nutrition.calories} cal
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold group-hover:text-orange-600 transition-colors">
          {dish.name}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {dish.cuisine?.name}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-3">
          {dish.dietaryTags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
            >
              {tag}
            </span>
          ))}
          {dish.allergens.length > 0 && (
            <span className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-full">
              ⚠️ {dish.allergens[0]}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <span>{dish.viewCount.toLocaleString()} views</span>
          {dish.avgPrice && <span>From ₹{dish.avgPrice}</span>}
        </div>
      </div>
    </Link>
  );
}
