'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scale,
  X,
  Star,
  ShoppingCart,
  Heart,
  Eye,
  Package,
  TrendingUp,
  Award,
  DollarSign,
  Download,
  Share2,
  Plus,
  Minus,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  Zap,
  Filter,
  ArrowUpDown,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { 
  useProductComparison, 
  ComparisonProduct, 
  convertToComparisonProduct 
} from '@/lib/product-comparison';
import { useWishlist, convertToWishlistItem } from '@/lib/wishlist';
import { formatCurrency, cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface ComparisonTableProps {
  products: ComparisonProduct[];
  onRemoveProduct: (productId: string) => void;
  onAddToCart: (product: ComparisonProduct) => void;
  onAddToWishlist: (product: ComparisonProduct) => void;
}

function ComparisonTable({ 
  products, 
  onRemoveProduct, 
  onAddToCart, 
  onAddToWishlist 
}: ComparisonTableProps) {
  const { isInWishlist } = useWishlist();
  const { getMatrix } = useProductComparison();
  const matrix = getMatrix();

  if (products.length === 0) {
    return null;
  }

  const renderComparisonValue = (value, type: 'price' | 'rating' | 'boolean' | 'text' = 'text') => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">—</span>;
    }

    switch (type) {
      case 'price':
        return <span className="font-semibold text-green-600">{formatCurrency(value)}</span>;
      case 'rating':
        return (
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{value}</span>
          </div>
        );
      case 'boolean':
        return value ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <XCircle className="h-5 w-5 text-red-500" />
        );
      default:
        return <span>{value}</span>;
    }
  };

  const getBestValue = (values: (number | null)[], isHigherBetter = false) => {
    const validValues = values.filter(v => v !== null) as number[];
    if (validValues.length === 0) return -1;
    
    const bestValue = isHigherBetter ? Math.max(...validValues) : Math.min(...validValues);
    return values.findIndex(v => v === bestValue);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <td className="w-48 p-4 font-medium text-muted-foreground border-b">
              Compare Products
            </td>
            {products.map((product) => (
              <td key={product.id} className="p-4 border-b min-w-64">
                <div className="relative">
                  {/* Remove Button */}
                  <button
                    onClick={() => onRemoveProduct(product.id)}
                    className="absolute -top-2 -right-2 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors z-10"
                  >
                    <X className="h-3 w-3" />
                  </button>

                  {/* Product Card */}
                  <div className="text-center space-y-3">
                    <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                      <Package className="h-12 w-12 text-gray-400" />
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-foreground line-clamp-2 mb-1">
                        {product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        by {product.vendorName}
                      </p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {product.category}
                      </Badge>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <Button 
                         
                        className="w-full"
                        onClick={() => onAddToCart(product)}
                        disabled={!product.inStock}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                      </Button>
                      <Button 
                         
                        variant="outline" 
                        className="w-full"
                        onClick={() => onAddToWishlist(product)}
                      >
                        <Heart className={cn(
                          "h-4 w-4 mr-2",
                          isInWishlist(product.id, 'product') && "fill-red-500 text-red-500"
                        )} />
                        Wishlist
                      </Button>
                    </div>
                  </div>
                </div>
              </td>
            ))}
          </tr>
        </thead>
        
        <tbody>
          {/* Price Comparison */}
          <tr className="border-b hover:bg-muted/50">
            <td className="p-4 font-medium">Price</td>
            {matrix.basicInfo.price.map((price, index) => {
              const isBest = getBestValue(matrix.basicInfo.price) === index;
              return (
                <td key={index} className={cn("p-4", isBest && "bg-green-50")}>
                  <div className="flex items-center space-x-2">
                    {renderComparisonValue(price, 'price')}
                    {isBest && <Award className="h-4 w-4 text-green-600" />}
                  </div>
                  {matrix.basicInfo.originalPrice[index] && (
                    <div className="text-sm text-muted-foreground line-through">
                      {formatCurrency(matrix.basicInfo.originalPrice[index])}
                    </div>
                  )}
                  {matrix.basicInfo.discount[index] && (
                    <Badge className="bg-red-500 text-white text-xs mt-1">
                      {matrix.basicInfo.discount[index]}% OFF
                    </Badge>
                  )}
                </td>
              );
            })}
          </tr>

          {/* Rating Comparison */}
          <tr className="border-b hover:bg-muted/50">
            <td className="p-4 font-medium">Rating</td>
            {matrix.basicInfo.rating.map((rating, index) => {
              const validRatings = matrix.basicInfo.rating.filter(r => r !== null) as number[];
              const isBest = validRatings.length > 0 && getBestValue(matrix.basicInfo.rating, true) === index;
              return (
                <td key={index} className={cn("p-4", isBest && "bg-yellow-50")}>
                  <div className="flex items-center space-x-2">
                    {renderComparisonValue(rating, 'rating')}
                    {isBest && <Award className="h-4 w-4 text-yellow-600" />}
                  </div>
                  {matrix.basicInfo.reviews[index] && (
                    <div className="text-sm text-muted-foreground">
                      {matrix.basicInfo.reviews[index]} reviews
                    </div>
                  )}
                </td>
              );
            })}
          </tr>

          {/* Stock Status */}
          <tr className="border-b hover:bg-muted/50">
            <td className="p-4 font-medium">Availability</td>
            {matrix.basicInfo.inStock.map((inStock, index) => (
              <td key={index} className="p-4">
                {renderComparisonValue(inStock, 'boolean')}
                <div className="text-sm text-muted-foreground mt-1">
                  {inStock ? 'In Stock' : 'Out of Stock'}
                </div>
              </td>
            ))}
          </tr>

          {/* Min Order Quantity */}
          <tr className="border-b hover:bg-muted/50">
            <td className="p-4 font-medium">Min Order</td>
            {matrix.basicInfo.minOrder.map((minOrder, index) => (
              <td key={index} className="p-4">
                {minOrder} {matrix.basicInfo.unit[index]}
              </td>
            ))}
          </tr>

          {/* Specifications */}
          {Object.entries(matrix.specifications).map(([specKey, specValues]) => (
            <tr key={specKey} className="border-b hover:bg-muted/50">
              <td className="p-4 font-medium capitalize">
                {specKey.replace(/([A-Z])/g, ' $1').trim()}
              </td>
              {specValues.map((value, index) => (
                <td key={index} className="p-4">
                  {renderComparisonValue(value)}
                </td>
              ))}
            </tr>
          ))}

          {/* Features */}
          <tr className="border-b hover:bg-muted/50">
            <td className="p-4 font-medium">Features</td>
            {matrix.features.map((features, index) => (
              <td key={index} className="p-4">
                <div className="space-y-1">
                  {features.length > 0 ? features.map((feature, featureIndex) => (
                    <Badge key={featureIndex} variant="secondary" className="text-xs mr-1 mb-1">
                      {feature}
                    </Badge>
                  )) : (
                    <span className="text-muted-foreground">None specified</span>
                  )}
                </div>
              </td>
            ))}
          </tr>

          {/* Nutrition Information */}
          {matrix.nutrition && (
            <>
              <tr className="border-b bg-muted/25">
                <td className="p-4 font-semibold text-primary" colSpan={products.length + 1}>
                  Nutrition Information (per 100g)
                </td>
              </tr>
              {Object.entries(matrix.nutrition).map(([nutrient, values]) => (
                <tr key={nutrient} className="border-b hover:bg-muted/50">
                  <td className="p-4 font-medium capitalize pl-8">
                    {nutrient} {nutrient === 'calories' ? '(kcal)' : '(g)'}
                  </td>
                  {values.map((value, index) => (
                    <td key={index} className="p-4">
                      {renderComparisonValue(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function ProductComparisonPage() {
  const {
    products,
    count,
    isFull,
    maxItems,
    removeFromComparison,
    clearAll,
    getAnalysis,
    getRecommendations,
    exportData
  } = useProductComparison();

  const { toggleWishlist } = useWishlist();
  const { toast } = useToast();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('comparison');
  const analysis = getAnalysis();
  const recommendations = getRecommendations();

  const handleRemoveProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (removeFromComparison(productId)) {
      toast({
        title: "Product Removed",
        description: `${product?.name} has been removed from comparison.`,
      });
    }
  };

  const handleAddToCart = (product: ComparisonProduct) => {
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleAddToWishlist = (product: ComparisonProduct) => {
    const wishlistItem = convertToWishlistItem({
      id: product.id,
      name: product.name,
      price: product.price,
      images: product.image ? [product.image] : [],
      vendor: { id: product.vendorId, name: product.vendorName },
      category: product.category,
      unit: product.unit
    }, 'product');
    
    const isAdded = toggleWishlist(wishlistItem);
    toast({
      title: isAdded ? "Added to Wishlist" : "Removed from Wishlist",
      description: `${product.name} ${isAdded ? 'added to' : 'removed from'} your wishlist.`,
    });
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all products from comparison?')) {
      clearAll();
      toast({
        title: "Comparison Cleared",
        description: "All products have been removed from comparison.",
      });
    }
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `product-comparison-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: "Your product comparison has been exported.",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center">
              <Scale className="h-8 w-8 text-primary mr-3" />
              Product Comparison
            </h1>
            <p className="mt-2 text-muted-foreground">
              Compare products side-by-side to make informed decisions
            </p>
          </div>
          
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <Button
              variant="outline"
              
              onClick={() => router.push('/marketplace')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Products
            </Button>
            
            {count > 0 && (
              <>
                <Button
                  variant="outline"
                  
                  onClick={handleExport}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                
                <Button
                  variant="outline"
                  
                  onClick={handleClearAll}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        {count > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Products</CardTitle>
                <div className="text-2xl font-bold">{count}/{maxItems}</div>
              </CardHeader>
            </Card>
            
            {analysis && (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Price Range</CardTitle>
                    <div className="text-lg font-bold">
                      {formatCurrency(analysis.priceRange.min)} - {formatCurrency(analysis.priceRange.max)}
                    </div>
                  </CardHeader>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
                    <div className="text-2xl font-bold text-blue-600">{analysis.diversity.categories}</div>
                  </CardHeader>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Vendors</CardTitle>
                    <div className="text-2xl font-bold text-purple-600">{analysis.diversity.vendors}</div>
                  </CardHeader>
                </Card>
              </>
            )}
          </div>
        )}

        {count === 0 ? (
          // Empty State
          <Card className="py-12">
            <CardContent className="text-center">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <Scale className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No products to compare</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Add products to your comparison from the marketplace to start comparing features, prices, and specifications.
              </p>
              <div className="flex justify-center space-x-3">
                <Button onClick={() => router.push('/marketplace')}>
                  <Package className="h-4 w-4 mr-2" />
                  Browse Products
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="comparison" className="flex items-center gap-2">
                  <Scale className="h-4 w-4" />
                  Compare
                </TabsTrigger>
                <TabsTrigger value="analysis" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analysis
                </TabsTrigger>
                <TabsTrigger value="recommendations" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Recommendations
                </TabsTrigger>
              </TabsList>

              {/* Comparison Table */}
              <TabsContent value="comparison" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Scale className="h-5 w-5" />
                      <span>Side-by-side Comparison</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ComparisonTable
                      products={products}
                      onRemoveProduct={handleRemoveProduct}
                      onAddToCart={handleAddToCart}
                      onAddToWishlist={handleAddToWishlist}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Analysis */}
              <TabsContent value="analysis" className="mt-6">
                {analysis && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <DollarSign className="h-5 w-5" />
                          <span>Price Analysis</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Cheapest</p>
                            <p className="font-semibold text-green-600">
                              {formatCurrency(analysis.priceRange.min)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Most Expensive</p>
                            <p className="font-semibold text-red-600">
                              {formatCurrency(analysis.priceRange.max)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Average Price</p>
                            <p className="font-semibold">
                              {formatCurrency(analysis.priceRange.average)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Price Difference</p>
                            <p className="font-semibold">
                              {formatCurrency(analysis.priceRange.max - analysis.priceRange.min)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Star className="h-5 w-5" />
                          <span>Rating Analysis</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {analysis.ratings.bestRated ? (
                          <div>
                            <p className="text-sm text-muted-foreground">Highest Rated</p>
                            <div className="flex items-center space-x-2">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-semibold">{analysis.ratings.bestRated.rating}/5</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No ratings available</p>
                        )}
                        
                        {analysis.ratings.averageRating && (
                          <div>
                            <p className="text-sm text-muted-foreground">Average Rating</p>
                            <div className="flex items-center space-x-2">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-semibold">
                                {analysis.ratings.averageRating.toFixed(1)}/5
                              </span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <TrendingUp className="h-5 w-5" />
                          <span>Diversity Analysis</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Categories</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {analysis.diversity.uniqueCategories.map(category => (
                              <Badge key={category} variant="secondary" className="text-xs">
                                {category}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-muted-foreground">Vendors</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {analysis.diversity.uniqueVendors.map(vendor => (
                              <Badge key={vendor} variant="outline" className="text-xs">
                                {vendor}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5" />
                          <span>Feature Analysis</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Total Unique Features: {analysis.features.totalUniqueFeatures}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Common Features: {analysis.features.commonFeaturesCount}
                          </p>
                        </div>
                        
                        {analysis.features.commonFeatures.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-foreground mb-2">
                              Features shared by all products:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {analysis.features.commonFeatures.map(feature => (
                                <Badge key={feature} className="text-xs bg-green-100 text-green-800">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              {/* Recommendations */}
              <TabsContent value="recommendations" className="mt-6">
                <div className="space-y-4">
                  {recommendations.length > 0 ? (
                    recommendations.map((rec) => {
                      const product = products.find(p => p.id === rec.productId);
                      if (!product) return null;

                      const getRecommendationIcon = (type: string) => {
                        switch (type) {
                          case 'best_value': return <Award className="h-5 w-5 text-blue-600" />;
                          case 'highest_rated': return <Star className="h-5 w-5 text-yellow-600" />;
                          case 'cheapest': return <DollarSign className="h-5 w-5 text-green-600" />;
                          case 'premium': return <Zap className="h-5 w-5 text-purple-600" />;
                          case 'most_features': return <Package className="h-5 w-5 text-orange-600" />;
                          default: return <Info className="h-5 w-5 text-gray-600" />;
                        }
                      };

                      const getRecommendationColor = (type: string) => {
                        switch (type) {
                          case 'best_value': return 'border-blue-200 bg-blue-50';
                          case 'highest_rated': return 'border-yellow-200 bg-yellow-50';
                          case 'cheapest': return 'border-green-200 bg-green-50';
                          case 'premium': return 'border-purple-200 bg-purple-50';
                          case 'most_features': return 'border-orange-200 bg-orange-50';
                          default: return 'border-gray-200 bg-gray-50';
                        }
                      };

                      return (
                        <Card key={rec.productId} className={cn("border-2", getRecommendationColor(rec.type))}>
                          <CardContent className="p-6">
                            <div className="flex items-start space-x-4">
                              <div className="p-3 rounded-full bg-white shadow-sm">
                                {getRecommendationIcon(rec.type)}
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h3 className="font-semibold text-foreground">{product.name}</h3>
                                  <Badge variant="secondary" className="text-xs">
                                    {rec.type.replace('_', ' ').toUpperCase()}
                                  </Badge>
                                </div>
                                
                                <p className="text-muted-foreground mb-3">{rec.reason}</p>
                                
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  <span>{formatCurrency(product.price)}</span>
                                  <span>by {product.vendorName}</span>
                                  {product.rating && (
                                    <div className="flex items-center space-x-1">
                                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                      <span>{product.rating}</span>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex space-x-2 mt-3">
                                  <Button  onClick={() => handleAddToCart(product)}>
                                    <ShoppingCart className="h-3 w-3 mr-1" />
                                    Add to Cart
                                  </Button>
                                  <Button  variant="outline" onClick={() => handleAddToWishlist(product)}>
                                    <Heart className="h-3 w-3 mr-1" />
                                    Wishlist
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-medium text-foreground mb-2">No recommendations available</h3>
                        <p className="text-muted-foreground">
                          Add more products with detailed information to get personalized recommendations.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}