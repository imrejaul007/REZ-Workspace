"use client";

import Link from "next/link";
import { CUISINE_LABELS } from "@shared/constants";

const POPULAR_CUISINES = [
  { id: "indian", emoji: "🇮🇳" },
  { id: "chinese", emoji: "🥡" },
  { id: "italian", emoji: "🍝" },
  { id: "mexican", emoji: "🌮" },
  { id: "japanese", emoji: "🍣" },
  { id: "thai", emoji: "🍜" },
  { id: "cafe", emoji: "☕" },
  { id: "desserts", emoji: "🍰" },
  { id: "fast-food", emoji: "🍔" },
  { id: "street-food", emoji: "🛒" },
  { id: "korean", emoji: "🥘" },
  { id: "middle-eastern", emoji: "🥙" },
];

export function CuisineGrid() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
      {POPULAR_CUISINES.map((cuisine) => (
        <Link
          key={cuisine.id}
          href={`/search?cuisine=${cuisine.id}`}
          className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all group"
        >
          <span className="text-3xl">{cuisine.emoji}</span>
          <span className="text-sm font-medium text-gray-700 group-hover:text-orange-600 text-center">
            {CUISINE_LABELS[cuisine.id]?.replace(/^[^\s]+\s/, "") || cuisine.id}
          </span>
        </Link>
      ))}
    </div>
  );
}
