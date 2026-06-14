'use client';

import React, { useState, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  MapPin,
  Store,
  Star,
  Heart,
  Share2,
  Eye,
  ShoppingCart,
  Package,
  Truck,
  Clock,
  Phone,
  Mail,
  Globe,
  Award,
  Shield,
  TrendingUp,
  Grid3X3,
  List,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  RefreshCw,
  Plus,
  Bookmark,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import {
  LoadingSpinner,
  SupplierCardSkeleton,
  ErrorState,
  EmptyState,
  ProgressiveLoading,
  InlineLoading,
} from '@/components/ui/loading-states';
import {
  useSuppliers,
  useMarketplaceSearch,
  useMarketplaceCategories,
  useFeaturedSuppliers,
  useAddToFavorites,
  useRemoveFromFavorites,
  useContactSupplier,
} from '@/lib/hooks/useEnhancedMarketplace';
import { SearchFilters, EnhancedSupplier } from '@/types/api';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/lib/hooks/use-debounce';


interface SupplierCardProps {
  supplier;
  onContact: (id: string) => void;
  onFavorite: (id: string, isFavorited: boolean) => void;
  onShare: (id: string) => void;
  onView: (id: string) => void;
  isFavorited?: boolean;
  viewMode?: 'grid' | 'list';
}

function SupplierCard({
  supplier,
  onContact,
  onFavorite,
  onShare,
  onView,
  isFavorited = false,
  viewMode = 'grid',
}: SupplierCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavorite(supplier.id, isFavorited);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare(supplier.id);
  };

  const handleContactClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onContact(supplier.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="cursor-pointer"
      onClick={() => onView(supplier.id)}
    >
      <Card className="h-full transition-all duration-200 hover:shadow-md border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center">
                  <Store className="h-6 w-6 text-primary" />
                </div>
                {supplier.verified && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <Shield className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-foreground truncate">
                    {supplier.name}
                  </h3>
                  {supplier.premium && (
                    <Badge variant="secondary" className="text-xs">
                      <Award className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>

                <div className="flex items-center space-x-1 mt-1">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'h-3 w-3',
                          i < Math.floor(supplier.rating.overall)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-muted-foreground'
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {supplier.rating.overall} ({supplier.rating.reviewCount})
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleFavoriteClick}
                className="h-8 w-8 p-0"
              >
                <Heart
                  className={cn(
                    'h-4 w-4 transition-colors',
                    isFavorited
                      ? 'text-red-500 fill-red-500'
                      : 'text-muted-foreground hover:text-red-500'
                  )}
                />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={handleShareClick}
                className="h-8 w-8 p-0"
              >
                <Share2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-4">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {supplier.description}
          </p>

          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <MapPin className="h-3 w-3" />
              <span>{supplier.location.city}, {supplier.location.state}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Package className="h-3 w-3" />
              <span>{supplier.stats.totalProducts} products</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-xs text-green-600">
              <Clock className="h-3 w-3" />
              <span>Responds in {supplier.stats.responseTime}h</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {supplier.tags.slice(0, 3).map((tag: string) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {supplier.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{supplier.tags.length - 3}
              </Badge>
            )}
          </div>

          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center space-x-2 pt-2 border-t"
              >
                <Button
                  size="sm"
                  onClick={handleContactClick}
                  className="flex-1"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Contact
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onView(supplier.id)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function EnhancedMarketplacePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State management
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [locationFilter, setLocationFilter] = useState(searchParams.get('location') || '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
  const [ratingFilter, setRatingFilter] = useState(Number(searchParams.get('rating')) || 0);
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get('verified') === 'true');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'relevance');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Debounce search to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const debouncedLocation = useDebounce(locationFilter, 300);

  // Build filters object
  const filters: SearchFilters = useMemo(() => {
    const baseFilters: SearchFilters = {
      sortBy: sortBy === 'relevance' ? undefined : sortBy,
      sortOrder: 'desc',
    };

    if (categoryFilter) {
      baseFilters.category = [categoryFilter];
    }

    if (ratingFilter > 0) {
      baseFilters.rating = ratingFilter;
    }

    if (locationFilter) {
      baseFilters.location = locationFilter;
    }

    return baseFilters;
  }, [categoryFilter, ratingFilter, locationFilter, sortBy]);

  // API hooks
  const {
    data: suppliersData,
    isLoading: suppliersLoading,
    error: suppliersError,
    refetch: refetchSuppliers,
  } = useSuppliers(filters, 1, 20);

  const {
    data: searchResults,
    isLoading: searchLoading,
    error: searchError,
  } = useMarketplaceSearch(
    debouncedSearchTerm,
    { ...filters, location: debouncedLocation },
    !!debouncedSearchTerm
  );

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
  } = useMarketplaceCategories();

  const {
    data: featuredData,
    isLoading: featuredLoading,
  } = useFeaturedSuppliers();

  // Mutations
  const addToFavoritesMutation = useAddToFavorites();
  const removeFromFavoritesMutation = useRemoveFromFavorites();
  const contactSupplierMutation = useContactSupplier();

  // Determine which data to display
  const displayData = debouncedSearchTerm ? searchResults : suppliersData;
  const isLoading = debouncedSearchTerm ? searchLoading : suppliersLoading;
  const error = debouncedSearchTerm ? searchError : suppliersError;

  const suppliers = displayData?.data || [];
  const totalSuppliers = displayData?.total || 0;

  // Event handlers
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('q', term);
    } else {
      params.delete('q');
    }
    router.push(`/marketplace?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const handleLocationChange = useCallback((location: string) => {
    setLocationFilter(location);
    const params = new URLSearchParams(searchParams);
    if (location) {
      params.set('location', location);
    } else {
      params.delete('location');
    }
    router.push(`/marketplace?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const handleSupplierContact = useCallback(async (supplierId: string) => {
    try {
      // In a real app, this would open a contact form
      console.log('Contact supplier:', supplierId);
      // await contactSupplierMutation.mutateAsync({ supplierId, message: 'Interested in your products' });
    } catch (error) {
      console.error('Failed to contact supplier:', error);
    }
  }, []);

  const handleSupplierFavorite = useCallback(async (supplierId: string, isFavorited: boolean) => {
    try {
      if (isFavorited) {
        await removeFromFavoritesMutation.mutateAsync(supplierId);
      } else {
        await addToFavoritesMutation.mutateAsync(supplierId);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  }, [addToFavoritesMutation, removeFromFavoritesMutation]);

  const handleSupplierShare = useCallback((supplierId: string) => {
    const url = `${window.location.origin}/marketplace/suppliers/${supplierId}`;
    navigator.clipboard.writeText(url);
    // Toast handled by mutations
  }, []);

  const handleSupplierView = useCallback((supplierId: string) => {
    router.push(`/marketplace/suppliers/${supplierId}`);
  }, [router]);

  const clearAllFilters = useCallback(() => {
    setSearchTerm('');
    setLocationFilter('');
    setCategoryFilter('');
    setRatingFilter(0);
    setVerifiedOnly(false);
    router.push('/marketplace');
  }, [router]);

  // Filter options
  const sortOptions = [
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'distance', label: 'Nearest' },
    { value: 'name', label: 'Name A-Z' },
  ];

  const ratingOptions = [
    { value: 0, label: 'All Ratings' },
    { value: 4, label: '4+ Stars' },
    { value: 4.5, label: '4.5+ Stars' },
    { value: 5, label: '5 Stars Only' },
  ];

  const activeFiltersCount = [
    searchTerm,
    locationFilter,
    categoryFilter,
    ratingFilter > 0,
    verifiedOnly,
  ].filter(Boolean).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground mb-2">Marketplace</h1>
            <p className="text-muted-foreground">
              Discover trusted suppliers and premium products for your restaurant
            </p>

            {/* Quick Stats */}
            <div className="flex items-center space-x-6 mt-4">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {totalSuppliers.toLocaleString()}
                </span> suppliers
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">50+</span> categories
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">10K+</span> products
              </div>
            </div>
          </div>

          <Button onClick={() => router.push('/marketplace/become-supplier')}>
            <Plus className="h-4 w-4 mr-2" />
            Become a Supplier
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Main Search */}
              <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search suppliers, products, or services..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Location"
                    value={locationFilter}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    className="pl-10 w-48"
                  />
                </div>

                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    'px-4',
                    activeFiltersCount > 0 && 'border-primary bg-primary/10'
                  )}
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </div>

              {/* Quick Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-auto">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    <SelectItem value="spices">Spices & Seasonings</SelectItem>
                    <SelectItem value="vegetables">Fresh Vegetables</SelectItem>
                    <SelectItem value="meat">Meat & Poultry</SelectItem>
                    <SelectItem value="seafood">Seafood</SelectItem>
                    <SelectItem value="dairy">Dairy Products</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={ratingFilter.toString()} onValueChange={(value) => setRatingFilter(Number(value))}>
                  <SelectTrigger className="w-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ratingOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Active Filter Tags */}
                <AnimatePresence>
                  {searchTerm && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <Badge
                        variant="outline"
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => handleSearch('')}
                      >
                        "{searchTerm}"
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    </motion.div>
                  )}

                  {activeFiltersCount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="h-6 px-2 text-xs"
                      >
                        Clear all
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <ProgressiveLoading
              isLoading={isLoading}
              loadingComponent={<InlineLoading />}
            >
              <p className="text-muted-foreground">
                {totalSuppliers.toLocaleString()} supplier{totalSuppliers !== 1 ? 's' : ''} found
              </p>
            </ProgressiveLoading>
          </div>

          <div className="flex items-center space-x-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-auto">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchSuppliers()}
              disabled={isLoading}
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </Button>
          </div>
        </div>

        {/* Suppliers Grid */}
        <ProgressiveLoading
          isLoading={isLoading}
          error={error?.message || null}
          onRetry={refetchSuppliers}
          isEmpty={suppliers.length === 0}
          loadingComponent={
            <div className={cn(
              'grid gap-6',
              viewMode === 'grid'
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-1'
            )}>
              {Array.from({ length: 6 }).map((_, index) => (
                <SupplierCardSkeleton key={index} />
              ))}
            </div>
          }
          errorComponent={
            <ErrorState
              title="Failed to load suppliers"
              message={error?.message || 'Please try again later'}
              showRetry={true}
              onRetry={refetchSuppliers}
            />
          }
          emptyComponent={
            <EmptyState
              icon={<Store className="h-12 w-12 text-muted-foreground" />}
              title="No suppliers found"
              description="Try adjusting your search criteria or filters"
              action={{
                label: 'Clear all filters',
                onClick: clearAllFilters,
              }}
            />
          }
        >
          <div className={cn(
            'grid gap-6',
            viewMode === 'grid'
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              : 'grid-cols-1'
          )}>
            <AnimatePresence>
              {suppliers.map((supplier, index: number) => (
                <motion.div
                  key={supplier.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <SupplierCard
                    supplier={supplier}
                    onContact={handleSupplierContact}
                    onFavorite={handleSupplierFavorite}
                    onShare={handleSupplierShare}
                    onView={handleSupplierView}
                    isFavorited={false}
                    viewMode={viewMode}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ProgressiveLoading>
      </div>
    </DashboardLayout>
  );
}