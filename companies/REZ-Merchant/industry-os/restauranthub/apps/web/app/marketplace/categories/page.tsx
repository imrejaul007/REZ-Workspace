'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, X, Loader2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

interface MarketplaceCategory {
  id: string;
  name: string;
  icon?: string;
  productCount?: number;
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export default function CategoriesPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<MarketplaceCategory[]>('/marketplace/categories');
        setCategories(data ?? []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const filteredCategories = searchQuery.trim()
    ? categories.filter((cat) =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : categories;

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/marketplace/category/${categoryId}`);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.push('/marketplace')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Button>
          <div className="text-sm text-muted-foreground">
            <span
              className="cursor-pointer hover:text-foreground"
              onClick={() => router.push('/marketplace')}
            >
              Marketplace
            </span>
            <span className="mx-2">›</span>
            <span>Categories</span>
          </div>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div>
            <h1 className="text-4xl font-bold">Supplier Categories</h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Browse suppliers by category
            </p>
            {categories.length > 0 && (
              <div className="flex items-center justify-center mt-4">
                <Badge variant="secondary">{categories.length} categories</Badge>
              </div>
            )}
          </div>
        </motion.div>

        {/* Search */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Error state */}
        {error && (
          <Card className="p-8 text-center border-destructive">
            <p className="text-destructive font-medium mb-2">Failed to load categories</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </Card>
        )}

        {/* Empty state */}
        {!error && filteredCategories.length === 0 && (
          <Card className="p-12 text-center">
            <div className="flex justify-center mb-4">
              <Tag className="h-12 w-12 text-muted-foreground" />
            </div>
            {searchQuery ? (
              <>
                <h3 className="text-lg font-semibold mb-2">No categories found</h3>
                <p className="text-muted-foreground mb-4">
                  No categories match &quot;{searchQuery}&quot;. Try a different search term.
                </p>
                <Button onClick={() => setSearchQuery('')}>Clear Search</Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-2">No categories available</h3>
                <p className="text-muted-foreground">
                  Supplier categories will appear here once the marketplace catalogue is populated.
                </p>
              </>
            )}
          </Card>
        )}

        {/* Categories Grid */}
        {!error && filteredCategories.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredCategories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="group cursor-pointer hover:shadow-lg transition-all duration-200"
                  onClick={() => handleCategoryClick(category.id)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-3">
                      {category.icon ? (
                        <span className="text-3xl">{category.icon}</span>
                      ) : (
                        <div className="p-2 bg-muted rounded-lg">
                          <Tag className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {category.name}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {category.productCount != null && (
                      <p className="text-sm text-muted-foreground">
                        {category.productCount} supplier{category.productCount !== 1 ? 's' : ''}
                      </p>
                    )}
                    <Button className="w-full mt-4" variant="default">
                      Browse {category.name}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
