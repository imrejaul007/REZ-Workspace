'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, X, Filter } from 'lucide-react';
import { MarketplaceFilter } from '@/types/marketplace';
import { vendorCategories, serviceTypes, orderTypes } from '@/data/marketplace-data';

interface MarketplaceFiltersProps {
  filters: MarketplaceFilter;
  onFiltersChange: (filters: MarketplaceFilter) => void;
  onClearFilters: () => void;
  activeTab: 'vendors' | 'products' | 'restaurants';
}

export function MarketplaceFilters({ 
  filters, 
  onFiltersChange, 
  onClearFilters, 
  activeTab 
}: MarketplaceFiltersProps) {
  const [priceRange, setPriceRange] = React.useState([
    filters.priceRange?.min || 0,
    filters.priceRange?.max || 10000
  ]);

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, searchQuery: value });
  };

  const handleCategoryChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      category: value === 'all' ? undefined : value as unknown 
    });
  };

  const handleServiceTypeChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      serviceType: value === 'all' ? undefined : value as unknown 
    });
  };

  const handleOrderTypeChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      orderType: value === 'all' ? undefined : value as unknown 
    });
  };

  const handleLocationChange = (value: string) => {
    onFiltersChange({ ...filters, location: value });
  };

  const handleRatingChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      rating: value === 'all' ? undefined : parseFloat(value) 
    });
  };

  const handlePriceRangeChange = (values: number[]) => {
    setPriceRange(values);
    onFiltersChange({ 
      ...filters, 
      priceRange: { min: values[0], max: values[1] } 
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.category) count++;
    if (filters.serviceType) count++;
    if (filters.orderType) count++;
    if (filters.location) count++;
    if (filters.rating) count++;
    if (filters.priceRange) count++;
    if (filters.searchQuery) count++;
    return count;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary">
                {getActiveFilterCount()}
              </Badge>
            )}
          </CardTitle>
          {getActiveFilterCount() > 0 && (
            <Button variant="outline"  onClick={onClearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <div>
          <Label htmlFor="search" className="text-sm font-medium">
            Search
          </Label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              id="search"
              placeholder="Search vendors, products, services..."
              value={filters.searchQuery || ''}
              onChange={(e) => e.target.value}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category Filter */}
        {(activeTab === 'vendors' || activeTab === 'products') && (
          <div>
            <Label className="text-sm font-medium">
              Category
            </Label>
            <Select
              value={filters.category || 'all'}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {vendorCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Service Type Filter */}
        {activeTab === 'vendors' && (
          <div>
            <Label className="text-sm font-medium">
              Service Type
            </Label>
            <Select
              value={filters.serviceType || 'all'}
              onValueChange={handleServiceTypeChange}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select service type" />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map((service) => (
                  <SelectItem key={service.value} value={service.value}>
                    {service.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Order Type Filter */}
        {activeTab === 'products' && (
          <div>
            <Label className="text-sm font-medium">
              Order Type
            </Label>
            <Select
              value={filters.orderType || 'all'}
              onValueChange={handleOrderTypeChange}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select order type" />
              </SelectTrigger>
              <SelectContent>
                {orderTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Location Filter */}
        <div>
          <Label htmlFor="location" className="text-sm font-medium">
            Location
          </Label>
          <Input
            id="location"
            placeholder="Enter city or area"
            value={filters.location || ''}
            onChange={(e) => e.target.value}
            className="mt-1"
          />
        </div>

        {/* Rating Filter */}
        {(activeTab === 'vendors' || activeTab === 'products') && (
          <div>
            <Label className="text-sm font-medium">
              Minimum Rating
            </Label>
            <Select
              value={filters.rating?.toString() || 'all'}
              onValueChange={handleRatingChange}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="4.5">4.5+ Stars</SelectItem>
                <SelectItem value="4.0">4.0+ Stars</SelectItem>
                <SelectItem value="3.5">3.5+ Stars</SelectItem>
                <SelectItem value="3.0">3.0+ Stars</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Price Range Filter - Temporarily disabled */}
        {false && (
          <div>
            <Label className="text-sm font-medium">
              Price Range
            </Label>
            <div className="mt-2 space-y-2">
              <div className="text-sm text-muted-foreground">
                Price range filter will be available soon
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {getActiveFilterCount() > 0 && (
          <div>
            <Label className="text-sm font-medium">
              Active Filters
            </Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {filters.category && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Category: {vendorCategories.find(c => c.value === filters.category)?.label}
                  <button
                    onClick={() => onFiltersChange({ ...filters, category: undefined })}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.serviceType && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Service: {serviceTypes.find(s => s.value === filters.serviceType)?.label}
                  <button
                    onClick={() => onFiltersChange({ ...filters, serviceType: undefined })}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.orderType && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Order: {orderTypes.find(t => t.value === filters.orderType)?.label}
                  <button
                    onClick={() => onFiltersChange({ ...filters, orderType: undefined })}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.location && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Location: {filters.location}
                  <button
                    onClick={() => onFiltersChange({ ...filters, location: undefined })}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.rating && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {filters.rating}+ Stars
                  <button
                    onClick={() => onFiltersChange({ ...filters, rating: undefined })}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}