'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  SlidersHorizontal,
  Store,
  Briefcase,
  Users,
  MapPin,
  Star,
  Clock,
  CheckCircle2,
  Eye,
  Heart,
  MessageCircle,
  Package,
  User,
} from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'vendor' | 'product' | 'job' | 'community' | 'service' | 'supplier';
  title: string;
  description: string;
  category: string;
  location?: string;
  rating?: number;
  price?: string;
  verified?: boolean;
  image?: string;
  metadata?: Record<string, unknown>;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

const filterOptions = [
  { value: 'all', label: 'All Results' },
  { value: 'supplier', label: 'Suppliers' },
  { value: 'job', label: 'Jobs' },
  { value: 'product', label: 'Products' },
];

const sortOptions = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest First' },
];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams?.get('q') || '');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState('relevance');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const token = getAuthToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const collected: SearchResult[] = [];

      // Search jobs
      if (selectedFilter === 'all' || selectedFilter === 'job') {
        try {
          const jobsRes = await fetch(
            `${API_BASE}/jobs?search=${encodeURIComponent(searchQuery)}&status=OPEN`,
            { headers }
          );
          if (jobsRes.ok) {
            const data = await jobsRes.json();
            const jobs: unknown[] = Array.isArray(data) ? data : data.jobs || [];
            jobs.forEach(job => {
              collected.push({
                id: job.id,
                type: 'job',
                title: job.title,
                description: job.description || job.requirements || '',
                category: job.category || job.department || 'Restaurant Jobs',
                location: job.location || job.city,
                price: job.salaryMin && job.salaryMax ? `₹${job.salaryMin.toLocaleString()} - ₹${job.salaryMax.toLocaleString()}` : undefined,
                metadata: {
                  company: job.restaurantName || job.restaurant?.name,
                  type: job.type || job.employmentType,
                  posted: job.createdAt ? new Date(job.createdAt).toLocaleDateString() : undefined,
                },
              });
            });
          }
        } catch {
          // skip
        }
      }

      // Search marketplace suppliers
      if (selectedFilter === 'all' || selectedFilter === 'supplier') {
        try {
          const suppliersRes = await fetch(
            `${API_BASE}/marketplace/suppliers?search=${encodeURIComponent(searchQuery)}`,
            { headers }
          );
          if (suppliersRes.ok) {
            const data = await suppliersRes.json();
            const suppliers: unknown[] = Array.isArray(data) ? data : data.suppliers || [];
            suppliers.forEach(supplier => {
              collected.push({
                id: supplier.id,
                type: 'supplier',
                title: supplier.name,
                description: supplier.description || `Marketplace supplier - ${supplier.category}`,
                category: supplier.category,
                location: supplier.location,
                rating: supplier.rating,
                verified: supplier.verified || supplier.isVerified,
                metadata: {
                  products: supplier.productCount,
                  orders: supplier.totalOrders,
                },
              });
            });
          }
        } catch {
          // skip
        }
      }

      // Sort results
      if (selectedSort === 'rating') {
        collected.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      }

      setResults(collected);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [selectedFilter, selectedSort]);

  useEffect(() => {
    const q = searchParams?.get('q') || '';
    if (q) {
      setQuery(q);
      performSearch(q);
    }
  }, [searchParams, performSearch]);

  useEffect(() => {
    if (hasSearched && query.trim()) {
      performSearch(query);
    }
  }, [selectedFilter, selectedSort]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      performSearch(query);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'supplier': return <Store className="h-4 w-4" />;
      case 'product': return <Package className="h-4 w-4" />;
      case 'job': return <Briefcase className="h-4 w-4" />;
      case 'community': return <Users className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'supplier': return 'text-blue-600 bg-blue-50';
      case 'product': return 'text-green-600 bg-green-50';
      case 'job': return 'text-purple-600 bg-purple-50';
      case 'community': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const suggestedTerms = ['spices', 'head chef', 'kitchen equipment', 'restaurant manager', 'sous chef'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Header />
      <main className="container mx-auto px-4 py-8 lg:px-6">
        {/* Search Header */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search jobs, suppliers, products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-lg border border-input rounded-full bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button type="submit" className="absolute right-2 top-2">
              Search
            </Button>
          </form>

          {query && hasSearched && (
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2">Search Results for &quot;{query}&quot;</h1>
              <p className="text-muted-foreground">
                {loading ? 'Searching...' : `Found ${results.length} result${results.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filter:</span>
            </div>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-3 py-1 border border-input rounded-md bg-background text-sm"
            >
              {filterOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="text-sm font-medium">Sort:</span>
            </div>
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="px-3 py-1 border border-input rounded-md bg-background text-sm"
            >
              {sortOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary mx-auto mb-6" />
              <p className="text-gray-600 font-medium">Searching...</p>
            </div>
          ) : hasSearched && results.length > 0 ? (
            results.map((result) => (
              <Card
                key={result.id}
                className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-200/50"
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`w-16 h-16 rounded-xl ${getTypeColor(result.type)} flex items-center justify-center shadow-md`}>
                        {getTypeIcon(result.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold">{result.title}</h3>
                          {result.verified && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                        </div>
                        <Badge variant="outline" className={getTypeColor(result.type)}>
                          {result.type}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-3 line-clamp-2">{result.description}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="font-medium">{result.category}</span>
                        {result.location && (
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {result.location}
                          </span>
                        )}
                        {result.rating && (
                          <span className="flex items-center">
                            <Star className="h-3 w-3 mr-1 text-yellow-400 fill-current" />
                            {result.rating}
                          </span>
                        )}
                        {result.price && (
                          <span className="font-medium text-green-600">{result.price}</span>
                        )}
                      </div>
                      {result.type === 'job' && result.metadata && (
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          {result.metadata.company && <span>{result.metadata.company}</span>}
                          {result.metadata.type && <span className="capitalize">{result.metadata.type}</span>}
                          {result.metadata.posted && (
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {result.metadata.posted}
                            </span>
                          )}
                        </div>
                      )}
                      {result.type === 'supplier' && result.metadata && (
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          {result.metadata.products != null && <span>{result.metadata.products} products</span>}
                          {result.metadata.orders != null && <span>{result.metadata.orders} orders</span>}
                        </div>
                      )}
                      <div className="flex items-center space-x-3 mt-4">
                        <Button className="bg-gradient-to-r from-primary to-primary/80 text-white shadow-md hover:scale-105 transition-all duration-200">
                          {result.type === 'job' ? 'Apply Now' :
                           result.type === 'supplier' ? 'View Store' :
                           'View Details'}
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Heart className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : hasSearched && !loading ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground mb-4">
                No jobs or suppliers matched &quot;{query}&quot;. Try a different search term.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestedTerms.map(term => (
                  <Badge
                    key={term}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => { setQuery(term); router.push(`/search?q=${encodeURIComponent(term)}`); performSearch(term); }}
                  >
                    {term}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Start your search</h3>
              <p className="text-muted-foreground mb-4">
                Find jobs, suppliers, and marketplace products
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestedTerms.map(term => (
                  <Badge
                    key={term}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => { setQuery(term); router.push(`/search?q=${encodeURIComponent(term)}`); performSearch(term); }}
                  >
                    {term}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {results.length > 0 && !loading && (
          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              Load More Results
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
