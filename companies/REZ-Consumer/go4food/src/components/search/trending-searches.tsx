"use client";

import { TrendingUp } from "lucide-react";
import Link from "next/link";
import { TRENDING_SEARCHES } from "@shared/constants";

export function TrendingSearches() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-orange-500" />
        <h3 className="font-semibold">Trending Searches</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {TRENDING_SEARCHES.map((search) => (
          <Link
            key={search}
            href={`/search?q=${encodeURIComponent(search)}`}
            className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm hover:border-orange-300 hover:bg-orange-50 transition-colors"
          >
            {search}
          </Link>
        ))}
      </div>
    </div>
  );
}
