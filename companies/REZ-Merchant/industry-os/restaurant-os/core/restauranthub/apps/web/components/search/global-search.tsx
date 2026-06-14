'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Clock,
  TrendingUp,
  User,
  Building2,
  Package,
  Users,
  MessageSquare,
  ShoppingBag,
  Briefcase,
  MapPin,
  Star,
  Filter,
  ArrowRight,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-provider';

interface SearchResult {
  id: string;
  type: 'user' | 'restaurant' | 'product' | 'job' | 'post' | 'conversation' | 'order';
  title: string;
  description: string;
  subtitle?: string;
  image?: string;
  location?: string;
  rating?: number;
  verified?: boolean;
  price?: number;
  category?: string;
  matchType: 'exact' | 'partial' | 'fuzzy';
  relevanceScore: number;
}

interface GlobalSearchProps {
  placeholder?: string;
  showCategories?: boolean;
  showFilters?: boolean;
  onResultClick?: (result: SearchResult) => void;
  className?: string;
  variant?: 'default' | 'compact' | 'expanded';
}

const searchCategories = [
  { id: 'all', label: 'All', icon: Search },
  { id: 'users', label: 'People', icon: User },
  { id: 'restaurants', label: 'Restaurants', icon: Building2 },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'jobs', label: 'Jobs', icon: Briefcase },
  { id: 'posts', label: 'Posts', icon: MessageSquare },
  { id: 'orders', label: 'Orders', icon: ShoppingBag }
];

const trendingSearches = [
  'Organic produce suppliers',
  'Head chef positions',
  'Restaurant equipment',
  'Food safety training',
  'Menu design tips',
  'Inventory management',
  'Customer service',
  'Kitchen workflow'
];

const recentSearches = [
  'Sous chef jobs Mumbai',
  'Commercial kitchen equipment',
  'Restaurant insurance',
  'Food delivery partners'
];

export default function GlobalSearch({
  placeholder = "Search everything...",
  showCategories = true,
  showFilters = true,
  onResultClick,
  className,
  variant = 'default'
}: GlobalSearchProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock search results
  const mockResults: SearchResult[] = [
    {
      id: '1',
      type: 'restaurant',
      title: 'Spice Garden Restaurant',
      description: 'Premium Indian restaurant specializing in authentic regional cuisine',
      subtitle: 'Mumbai, Maharashtra',
      location: 'Mumbai, Maharashtra',
      rating: 4.8,
      verified: true,
      matchType: 'partial',
      relevanceScore: 95,
      category: 'Fine Dining'
    },
    {
      id: '2',
      type: 'job',
      title: 'Head Chef - Italian Cuisine',
      description: 'Leading restaurant chain looking for experienced Italian cuisine specialist',
      subtitle: 'Delhi • ₹80,000-₹120,000/month',
      location: 'New Delhi',
      matchType: 'exact',
      relevanceScore: 90,
      category: 'Full-time'
    },
    {
      id: '3',
      type: 'product',
      title: 'Commercial Stand Mixer - 20L',
      description: 'Heavy duty commercial mixer perfect for bakeries and restaurants',
      subtitle: 'Kitchen Equipment',
      price: 45000,
      rating: 4.6,
      matchType: 'fuzzy',
      relevanceScore: 85
    },
    {
      id: '4',
      type: 'user',
      title: 'Chef Rajesh Kumar',
      description: 'Executive Chef with 15+ years experience in fine dining',
      subtitle: 'Available for consulting',
      location: 'Bangalore',
      verified: true,
      matchType: 'partial',
      relevanceScore: 80
    },
    {
      id: '5',
      type: 'post',
      title: 'Best practices for kitchen hygiene during monsoon',
      description: 'Essential tips to maintain food safety and prevent contamination during rainy season',
      subtitle: '24 likes • 8 comments • 2 hours ago',
      matchType: 'fuzzy',
      relevanceScore: 75
    }
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    if (query.trim()) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        // Filter and sort mock results based on query
        const filtered = mockResults.filter(result =>
          result.title.toLowerCase().includes(query.toLowerCase()) ||
          result.description.toLowerCase().includes(query.toLowerCase()) ||
          result.subtitle?.toLowerCase().includes(query.toLowerCase())
        ).sort((a, b) => b.relevanceScore - a.relevanceScore);

        setResults(selectedCategory === 'all' ? filtered : filtered.filter(r => 
          selectedCategory === 'users' ? r.type === 'user' :
          selectedCategory === 'restaurants' ? r.type === 'restaurant' :
          selectedCategory === 'products' ? r.type === 'product' :
          selectedCategory === 'jobs' ? r.type === 'job' :
          selectedCategory === 'posts' ? r.type === 'post' :
          selectedCategory === 'orders' ? r.type === 'order' :
          true
        ));
        setIsSearching(false);
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setResults([]);
      setIsSearching(false);
    }
  }, [query, selectedCategory]);

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'user': return User;
      case 'restaurant': return Building2;
      case 'product': return Package;
      case 'job': return Briefcase;
      case 'post': return MessageSquare;
      case 'conversation': return Users;
      case 'order': return ShoppingBag;
      default: return Search;
    }
  };

  const getResultColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'user': return 'text-blue-600 bg-blue-100 dark:bg-blue-900';
      case 'restaurant': return 'text-green-600 bg-green-100 dark:bg-green-900';
      case 'product': return 'text-orange-600 bg-orange-100 dark:bg-orange-900';
      case 'job': return 'text-purple-600 bg-purple-100 dark:bg-purple-900';
      case 'post': return 'text-pink-600 bg-pink-100 dark:bg-pink-900';
      case 'conversation': return 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900';
      case 'order': return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900';
    }
  };

  const handleResultClick = (result: SearchResult) => {
    onResultClick?.(result);
    setIsOpen(false);
    setQuery('');
  };

  const handleTrendingClick = (search: string) => {
    setQuery(search);
    inputRef.current?.focus();
  };

  if (variant === 'compact') {
    return (
      <div className={cn('relative', className)} ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <AnimatePresence>
          {isOpen && (query || !query) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 z-50"
            >
              <Card className="shadow-xl max-h-96 overflow-hidden">
                <CardContent className="p-0">
                  {query && results.length > 0 ? (
                    <div className="max-h-96 overflow-y-auto">
                      {results.slice(0, 5).map((result) => {
                        const Icon = getResultIcon(result.type);

                        return (
                          <button
                            key={result.id}
                            onClick={() => handleResultClick(result)}
                            className="w-full flex items-center space-x-3 p-4 hover:bg-accent transition-colors text-left"
                          >
                            <div className={cn('p-2 rounded-lg', getResultColor(result.type))}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">{result.title}</p>
                              <p className="text-sm text-muted-foreground truncate">{result.description}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4">
                      <p className="text-sm text-muted-foreground mb-3">Popular searches</p>
                      <div className="space-y-2">
                        {trendingSearches.slice(0, 4).map((search, index) => (
                          <button
                            key={index}
                            onClick={() => handleTrendingClick(search)}
                            className="w-full text-left text-sm text-foreground hover:text-primary transition-colors"
                          >
                            {search}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)} ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-12 pr-12 py-3 border border-border rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-base"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-accent transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
        {showFilters && (
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="absolute right-12 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-accent transition-colors"
          >
            <Filter className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 p-4 border border-border rounded-xl bg-background"
          >
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Advanced Filters</p>
              <div className="grid grid-cols-2 gap-2">
                <select className="px-3 py-2 border border-border rounded-lg bg-background text-sm">
                  <option>All Locations</option>
                  <option>Mumbai</option>
                  <option>Delhi</option>
                  <option>Bangalore</option>
                  <option>Chennai</option>
                </select>
                <select className="px-3 py-2 border border-border rounded-lg bg-background text-sm">
                  <option>All Time</option>
                  <option>Last 24 hours</option>
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 z-50"
          >
            <Card className="shadow-xl max-h-[80vh] overflow-hidden">
              <CardContent className="p-0">
                {/* Categories */}
                {showCategories && (
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center space-x-2 overflow-x-auto scrollbar-thin">
                      {searchCategories.map((category) => {
                        const Icon = category.icon;
                        return (
                          <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={cn(
                              'flex items-center space-x-2 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors text-sm',
                              selectedCategory === category.id
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-accent text-muted-foreground'
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{category.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Search Results */}
                <div className="max-h-96 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Searching...</p>
                    </div>
                  ) : query && results.length > 0 ? (
                    <div className="divide-y divide-border">
                      {results.map((result) => {
                        const Icon = getResultIcon(result.type);

                        return (
                          <button
                            key={result.id}
                            onClick={() => handleResultClick(result)}
                            className="w-full flex items-start space-x-4 p-4 hover:bg-accent transition-colors text-left"
                          >
                            <div className={cn('p-2 rounded-lg flex-shrink-0', getResultColor(result.type))}>
                              <Icon className="h-5 w-5" />
                            </div>
                            
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-medium text-foreground line-clamp-1">
                                  {result.title}
                                </h3>
                                {result.verified && (
                                  <div className="w-1 h-1 bg-primary rounded-full" />
                                )}
                                <Badge variant="outline" className="text-xs capitalize">
                                  {result.type}
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {result.description}
                              </p>
                              
                              {result.subtitle && (
                                <p className="text-xs text-muted-foreground">
                                  {result.subtitle}
                                </p>
                              )}
                              
                              {/* Additional Info */}
                              <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                                {result.location && (
                                  <div className="flex items-center space-x-1">
                                    <MapPin className="h-3 w-3" />
                                    <span>{result.location}</span>
                                  </div>
                                )}
                                {result.rating && (
                                  <div className="flex items-center space-x-1">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span>{result.rating}</span>
                                  </div>
                                )}
                                {result.price && (
                                  <span className="font-medium">₹{result.price.toLocaleString()}</span>
                                )}
                              </div>
                            </div>
                            
                            <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                          </button>
                        );
                      })}
                    </div>
                  ) : query && results.length === 0 ? (
                    <div className="p-8 text-center">
                      <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="font-medium text-foreground mb-1">No results found</p>
                      <p className="text-sm text-muted-foreground">
                        Try different keywords or browse categories
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {/* Trending Searches */}
                      <div className="p-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          <p className="font-medium text-foreground">Trending Searches</p>
                        </div>
                        <div className="grid grid-cols-1 gap-1">
                          {trendingSearches.map((search, index) => (
                            <button
                              key={index}
                              onClick={() => handleTrendingClick(search)}
                              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent transition-colors text-left"
                            >
                              <Zap className="h-3 w-3 text-primary flex-shrink-0" />
                              <span className="text-sm text-foreground">{search}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Recent Searches */}
                      {recentSearches.length > 0 && (
                        <div className="p-4">
                          <div className="flex items-center space-x-2 mb-3">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <p className="font-medium text-foreground">Recent Searches</p>
                          </div>
                          <div className="space-y-1">
                            {recentSearches.map((search, index) => (
                              <button
                                key={index}
                                onClick={() => handleTrendingClick(search)}
                                className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-accent transition-colors text-left group"
                              >
                                <span className="text-sm text-muted-foreground group-hover:text-foreground">
                                  {search}
                                </span>
                                <X className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {query && results.length > 0 && (
                  <div className="p-4 border-t border-border bg-accent/50">
                    <Button variant="ghost"  className="w-full justify-center" size="default">
                      View all {results.length} results
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}