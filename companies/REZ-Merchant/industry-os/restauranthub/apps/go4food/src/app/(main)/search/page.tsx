"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SearchBar } from "@/components/search/search-bar";
import { SearchFilters } from "@/components/search/search-filters";
import { RestaurantCard } from "@/components/restaurant/restaurant-card";
import { DishCard } from "@/components/dish/dish-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CUISINE_LABELS, DIETARY_TAGS } from "@shared/constants";
import { Restaurant, Dish, SearchFilters as SearchFiltersType } from "@shared/types";

const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: "1",
    name: "Meghana's Biryani",
    slug: "meghanas-biryani",
    description: "Famous for Hyderabadi Dum Biryani",
    address: "Koramangala, Bangalore",
    city: "Bangalore",
    lat: 12.9352,
    lng: 77.6245,
    coverImage: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800",
    rating: 4.5,
    reviewCount: 2340,
    cuisines: ["Indian", "Biryani"],
    avgPrice: 350,
    isOpen: true,
    activeDeals: 2,
  },
  {
    id: "2",
    name: "Empire Restaurant",
    slug: "empire-restaurant",
    description: "North Indian & Biryani Specialist",
    address: "Indiranagar, Bangalore",
    city: "Bangalore",
    lat: 12.9784,
    lng: 77.6408,
    coverImage: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800",
    rating: 4.3,
    reviewCount: 1890,
    cuisines: ["North Indian", "Biryani"],
    avgPrice: 300,
    isOpen: true,
    activeDeals: 1,
  },
  {
    id: "3",
    name: "Truffles",
    slug: "truffles",
    description: "American Diner & Burgers",
    address: "Koramangala, Bangalore",
    city: "Bangalore",
    lat: 12.9350,
    lng: 77.6250,
    coverImage: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
    rating: 4.6,
    reviewCount: 3200,
    cuisines: ["American", "Burgers"],
    avgPrice: 450,
    isOpen: true,
    activeDeals: 0,
  },
];

const MOCK_DISHES: Dish[] = [
  {
    id: "1",
    name: "Chicken Biryani",
    slug: "chicken-biryani",
    description: "Aromatic rice layered with spiced chicken",
    cuisine: { id: "1", name: "Indian", slug: "indian" },
    allergens: [],
    dietaryTags: ["non-vegetarian"],
    ingredients: ["chicken", "basmati rice", "spices", "saffron"],
    similarDishes: ["mutton-biryani", "veg-biryani", "egg-biryani"],
    images: ["https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800"],
    viewCount: 15000,
    searchCount: 5000,
  },
  {
    id: "2",
    name: "Butter Chicken",
    slug: "butter-chicken",
    description: "Creamy tomato-based curry with tender chicken",
    cuisine: { id: "1", name: "North Indian", slug: "north-indian" },
    allergens: ["dairy"],
    dietaryTags: ["non-vegetarian"],
    ingredients: ["chicken", "tomato", "cream", "butter", "spices"],
    similarDishes: ["tandoori-chicken", "murgh-makhani"],
    images: ["https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800"],
    viewCount: 12000,
    searchCount: 4200,
  },
];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<"all" | "restaurants" | "dishes">("all");
  const [isLoading, setIsLoading] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [filters, setFilters] = useState<SearchFiltersType>({});

  useEffect(() => {
    // Simulate search API call
    setIsLoading(true);
    const timer = setTimeout(() => {
      if (initialQuery || query) {
        setRestaurants(MOCK_RESTAURANTS);
        setDishes(MOCK_DISHES);
      } else {
        setRestaurants([]);
        setDishes([]);
      }
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [initialQuery, query]);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-2xl">
              <SearchBar
                value={query}
                onChange={setQuery}
                onSearch={handleSearch}
                placeholder="Search for 'Biryani', 'Pizza', 'Cafe'..."
                autoFocus
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <div className="w-64 flex-shrink-0">
            <SearchFilters
              filters={filters}
              onChange={setFilters}
            />
          </div>

          {/* Results */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {query ? (
                  <>
                    Results for "<span className="text-orange-600">{query}</span>"
                    <span className="text-gray-500 font-normal ml-2">
                      ({restaurants.length + dishes.length} found)
                    </span>
                  </>
                ) : (
                  "Browse All"
                )}
              </h2>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList className="mb-6">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
                <TabsTrigger value="dishes">Dishes</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-8">
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                ) : restaurants.length === 0 && dishes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🍽️</div>
                    <h3 className="text-xl font-semibold mb-2">No results found</h3>
                    <p className="text-gray-500">
                      Try different keywords or remove filters
                    </p>
                  </div>
                ) : (
                  <>
                    {restaurants.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-4">Restaurants</h3>
                        <div className="space-y-4">
                          {restaurants.map((restaurant) => (
                            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                          ))}
                        </div>
                      </div>
                    )}
                    {dishes.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-4">Dishes</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {dishes.map((dish) => (
                            <DishCard key={dish.id} dish={dish} />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="restaurants">
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                ) : restaurants.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No restaurants found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {restaurants.map((restaurant) => (
                      <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="dishes">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-48 w-full" />
                    ))}
                  </div>
                ) : dishes.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No dishes found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dishes.map((dish) => (
                      <DishCard key={dish.id} dish={dish} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
