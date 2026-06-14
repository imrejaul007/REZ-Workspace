'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Filter, Grid, List, Star, Heart, ShoppingCart, Clock, MapPin, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  image: string;
  vendor: {
    id: string;
    name: string;
    location: string;
    deliveryTime: string;
  };
  category: string;
  tags: string[];
  isPopular: boolean;
  inStock: boolean;
}

interface CategoryInfo {
  id: string;
  name: string;
  description: string;
  productCount: number;
  subcategories: string[];
}

const categoryData: Record<string, CategoryInfo> = {
  'pizza': {
    id: 'pizza',
    name: 'Pizza',
    description: 'Delicious pizzas from wood-fired to deep dish, featuring fresh ingredients and authentic flavors.',
    productCount: 127,
    subcategories: ['Margherita', 'Pepperoni', 'Vegetarian', 'Meat Lovers', 'Gourmet', 'Gluten Free']
  },
  'sushi': {
    id: 'sushi',
    name: 'Sushi & Japanese',
    description: 'Fresh sushi, sashimi, and traditional Japanese cuisine prepared by expert chefs.',
    productCount: 89,
    subcategories: ['Sushi Rolls', 'Sashimi', 'Nigiri', 'Bento Boxes', 'Ramen', 'Tempura']
  },
  'burger': {
    id: 'burger',
    name: 'Burgers',
    description: 'Gourmet burgers with premium ingredients, from classic to innovative creations.',
    productCount: 156,
    subcategories: ['Beef Burgers', 'Chicken Burgers', 'Veggie Burgers', 'Gourmet', 'Sliders', 'Breakfast']
  },
  'italian': {
    id: 'italian',
    name: 'Italian Cuisine',
    description: 'Authentic Italian dishes including pasta, risotto, and traditional favorites.',
    productCount: 203,
    subcategories: ['Pasta', 'Pizza', 'Risotto', 'Antipasti', 'Desserts', 'Wine']
  },
  'chinese': {
    id: 'chinese',
    name: 'Chinese Food',
    description: 'Traditional and modern Chinese cuisine with bold flavors and fresh ingredients.',
    productCount: 178,
    subcategories: ['Stir Fry', 'Dim Sum', 'Noodles', 'Rice Dishes', 'Soups', 'Dumplings']
  },
  'indian': {
    id: 'indian',
    name: 'Indian Cuisine',
    description: 'Aromatic spices and traditional cooking methods bring authentic Indian flavors.',
    productCount: 134,
    subcategories: ['Curry', 'Biryani', 'Tandoor', 'Vegetarian', 'Breads', 'Desserts']
  }
};

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Artisan Margherita Pizza',
    description: 'Wood-fired pizza with San Marzano tomatoes and fresh mozzarella',
    price: 18.99,
    originalPrice: 22.99,
    rating: 4.8,
    reviewCount: 342,
    image: '🍕',
    vendor: { id: 'bella-vista', name: 'Bella Vista Italian', location: 'Downtown', deliveryTime: '25-35 min' },
    category: 'pizza',
    tags: ['wood-fired', 'vegetarian', 'authentic'],
    isPopular: true,
    inStock: true
  },
  {
    id: '2',
    name: 'Pepperoni Supreme',
    description: 'Classic pepperoni pizza with extra cheese and Italian herbs',
    price: 21.99,
    rating: 4.6,
    reviewCount: 289,
    image: '🍕',
    vendor: { id: 'pizza-palace', name: 'Pizza Palace', location: 'Midtown', deliveryTime: '20-30 min' },
    category: 'pizza',
    tags: ['pepperoni', 'classic', 'popular'],
    isPopular: true,
    inStock: true
  },
  {
    id: '3',
    name: 'Truffle Mushroom Deluxe',
    description: 'Gourmet pizza with truffle oil, wild mushrooms, and arugula',
    price: 26.99,
    originalPrice: 29.99,
    rating: 4.9,
    reviewCount: 156,
    image: '🍕',
    vendor: { id: 'gourmet-slice', name: 'Gourmet Slice Co.', location: 'Uptown', deliveryTime: '30-40 min' },
    category: 'pizza',
    tags: ['truffle', 'gourmet', 'premium'],
    isPopular: false,
    inStock: true
  },
  {
    id: '4',
    name: 'Vegan Garden Special',
    description: 'Plant-based pizza with cashew cheese and fresh vegetables',
    price: 19.99,
    rating: 4.4,
    reviewCount: 98,
    image: '🍕',
    vendor: { id: 'green-slice', name: 'Green Slice', location: 'Eastside', deliveryTime: '35-45 min' },
    category: 'pizza',
    tags: ['vegan', 'healthy', 'vegetables'],
    isPopular: false,
    inStock: true
  },
  {
    id: '5',
    name: 'Meat Lovers Supreme',
    description: 'Loaded with pepperoni, sausage, bacon, and ham',
    price: 24.99,
    rating: 4.7,
    reviewCount: 234,
    image: '🍕',
    vendor: { id: 'meat-masters', name: 'Meat Masters Pizza', location: 'Westside', deliveryTime: '25-35 min' },
    category: 'pizza',
    tags: ['meat', 'hearty', 'protein'],
    isPopular: true,
    inStock: false
  },
  {
    id: '6',
    name: 'BBQ Chicken Ranch',
    description: 'BBQ sauce base with grilled chicken and ranch drizzle',
    price: 22.99,
    rating: 4.5,
    reviewCount: 167,
    image: '🍕',
    vendor: { id: 'bbq-barn', name: 'BBQ Barn Pizza', location: 'Southside', deliveryTime: '30-40 min' },
    category: 'pizza',
    tags: ['bbq', 'chicken', 'ranch'],
    isPopular: false,
    inStock: true
  }
];

export default function CategoryPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [category, setCategory] = useState<CategoryInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('popular');
  const [priceRange, setPriceRange] = useState([0, 50]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showOnlyInStock, setShowOnlyInStock] = useState(false);
  const [showOnlyPopular, setShowOnlyPopular] = useState(false);

  useEffect(() => {
    const categoryId = params.id as string;
    const foundCategory = categoryData[categoryId.toLowerCase()];
    
    if (foundCategory) {
      setCategory(foundCategory);
      // Filter products by category
      const categoryProducts = mockProducts.filter(p => p.category === categoryId.toLowerCase());
      setProducts(categoryProducts);
      setFilteredProducts(categoryProducts);
    } else {
      toast({
        title: "Category not found",
        description: "The requested category could not be found.",
        variant: "error"
      });
      router.push('/marketplace');
    }
  }, [params.id, toast, router]);

  useEffect(() => {
    let filtered = [...products];

    // Filter by subcategories
    if (selectedSubcategories.length > 0) {
      filtered = filtered.filter(product =>
        product.tags.some(tag => 
          selectedSubcategories.some(sub => 
            tag.toLowerCase().includes(sub.toLowerCase()) || 
            product.name.toLowerCase().includes(sub.toLowerCase())
          )
        )
      );
    }

    // Filter by price range
    filtered = filtered.filter(product => 
      product.price >= priceRange[0] && product.price <= priceRange[1]
    );

    // Filter by stock status
    if (showOnlyInStock) {
      filtered = filtered.filter(product => product.inStock);
    }

    // Filter by popularity
    if (showOnlyPopular) {
      filtered = filtered.filter(product => product.isPopular);
    }

    // Sort products
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'reviews':
        filtered.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case 'popular':
      default:
        filtered.sort((a, b) => {
          if (a.isPopular && !b.isPopular) return -1;
          if (!a.isPopular && b.isPopular) return 1;
          return b.rating - a.rating;
        });
        break;
    }

    setFilteredProducts(filtered);
  }, [products, selectedSubcategories, priceRange, showOnlyInStock, showOnlyPopular, sortBy]);

  const handleSubcategoryToggle = (subcategory: string) => {
    setSelectedSubcategories(prev => 
      prev.includes(subcategory) 
        ? prev.filter(s => s !== subcategory)
        : [...prev, subcategory]
    );
  };

  const handleProductClick = (productId: string) => {
    router.push(`/marketplace/product/${productId}`);
  };

  const handleAddToCart = (productId: string, productName: string) => {
    toast({
      title: "Added to cart!",
      description: `${productName} has been added to your cart.`
    });
  };

  const handleWishlist = (productId: string, productName: string) => {
    toast({
      title: "Added to wishlist!",
      description: `${productName} has been added to your wishlist.`
    });
  };

  if (!category) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Loading category...</h2>
            <p className="text-muted-foreground">Please wait while we fetch the category details.</p>
          </div>
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
            <span className="cursor-pointer hover:text-foreground" onClick={() => router.push('/marketplace')}>
              Marketplace
            </span>
            <span className="mx-2">›</span>
            <span>{category.name}</span>
          </div>
        </div>

        {/* Category Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div>
            <h1 className="text-3xl font-bold">{category.name}</h1>
            <p className="text-muted-foreground mt-2">{category.description}</p>
            <div className="flex items-center space-x-4 mt-4">
              <Badge variant="secondary">{category.productCount} items available</Badge>
              <Badge variant="outline">{filteredProducts.length} matching your filters</Badge>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="hidden lg:flex"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </div>

            <div className="flex items-center space-x-4">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="reviews">Most Reviews</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ 
              opacity: showFilters ? 1 : 0,
              x: showFilters ? 0 : -20,
              width: showFilters ? '300px' : '0px'
            }}
            className={`${showFilters ? 'block' : 'hidden lg:block'} space-y-6 overflow-hidden`}
          >
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Filters</h3>
              
              {/* Quick Filters */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="in-stock" 
                    checked={showOnlyInStock}
                    onChange={(e) => setShowOnlyInStock((e.target as HTMLInputElement).checked)}
                  />
                  <label htmlFor="in-stock" className="text-sm">In Stock Only</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="popular" 
                    checked={showOnlyPopular}
                    onChange={(e) => setShowOnlyPopular((e.target as HTMLInputElement).checked)}
                  />
                  <label htmlFor="popular" className="text-sm">Popular Items Only</label>
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-3 mb-6">
                <h4 className="font-medium">Price Range</h4>
                <div className="px-2">
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={50}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                </div>
              </div>

              {/* Subcategories */}
              <div className="space-y-3">
                <h4 className="font-medium">Subcategories</h4>
                <div className="space-y-2">
                  {category.subcategories.map((subcategory) => (
                    <div key={subcategory} className="flex items-center space-x-2">
                      <Checkbox
                        id={subcategory}
                        checked={selectedSubcategories.includes(subcategory)}
                        onCheckedChange={() => handleSubcategoryToggle(subcategory)}
                      />
                      <label htmlFor={subcategory} className="text-sm">{subcategory}</label>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Products Grid */}
          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <Card className="p-12 text-center">
                <h3 className="text-lg font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or search criteria
                </p>
                <Button onClick={() => {
                  setSelectedSubcategories([]);
                  setPriceRange([0, 50]);
                  setShowOnlyInStock(false);
                  setShowOnlyPopular(false);
                }}>
                  Clear All Filters
                </Button>
              </Card>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                className={
                  viewMode === 'grid' 
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                    : 'space-y-4'
                }
              >
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {viewMode === 'grid' ? (
                      <Card className="group cursor-pointer hover:shadow-lg transition-all duration-200">
                        <CardContent className="p-0">
                          <div onClick={() => handleProductClick(product.id)}>
                            {/* Product Image */}
                            <div className="aspect-square bg-gray-100 rounded-t-lg flex items-center justify-center text-6xl relative">
                              {product.image}
                              {!product.inStock && (
                                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-t-lg flex items-center justify-center">
                                  <Badge variant="destructive">Out of Stock</Badge>
                                </div>
                              )}
                              {product.isPopular && (
                                <Badge className="absolute top-2 left-2 bg-red-500">Popular</Badge>
                              )}
                              {product.originalPrice && (
                                <Badge className="absolute top-2 right-2 bg-green-500">
                                  {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                                </Badge>
                              )}
                            </div>

                            {/* Product Info */}
                            <div className="p-4">
                              <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                                {product.name}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                {product.description}
                              </p>
                              
                              <div className="flex items-center space-x-2 mb-3">
                                <div className="flex items-center space-x-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span className="text-sm font-medium">{product.rating}</span>
                                  <span className="text-sm text-muted-foreground">
                                    ({product.reviewCount})
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2 mb-3 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>{product.vendor.location}</span>
                                <Clock className="h-4 w-4" />
                                <span>{product.vendor.deliveryTime}</span>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xl font-bold">${product.price}</span>
                                  {product.originalPrice && (
                                    <span className="text-sm text-muted-foreground line-through">
                                      ${product.originalPrice}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="p-4 pt-0 flex items-center space-x-2">
                            <Button
                              className="flex-1"
                              onClick={() => handleAddToCart(product.id, product.name)}
                              disabled={!product.inStock}
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Add to Cart
                            </Button>
                            <Button
                              variant="outline"
                              
                              onClick={() => handleWishlist(product.id, product.name)}
                            >
                              <Heart className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="group cursor-pointer hover:shadow-lg transition-all duration-200">
                        <CardContent className="p-6">
                          <div className="flex space-x-6" onClick={() => handleProductClick(product.id)}>
                            <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center text-4xl flex-shrink-0 relative">
                              {product.image}
                              {!product.inStock && (
                                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                                  <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-start justify-between">
                                <h3 className="font-semibold text-xl group-hover:text-primary transition-colors">
                                  {product.name}
                                </h3>
                                <div className="flex items-center space-x-2">
                                  {product.isPopular && (
                                    <Badge className="bg-red-500">Popular</Badge>
                                  )}
                                  {product.originalPrice && (
                                    <Badge className="bg-green-500">
                                      {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              <p className="text-muted-foreground">
                                {product.description}
                              </p>
                              
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span className="font-medium">{product.rating}</span>
                                  <span className="text-muted-foreground">
                                    ({product.reviewCount} reviews)
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1 text-muted-foreground">
                                  <MapPin className="h-4 w-4" />
                                  <span>{product.vendor.location}</span>
                                </div>
                                <div className="flex items-center space-x-1 text-muted-foreground">
                                  <Clock className="h-4 w-4" />
                                  <span>{product.vendor.deliveryTime}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <span className="text-2xl font-bold">${product.price}</span>
                                  {product.originalPrice && (
                                    <span className="text-lg text-muted-foreground line-through">
                                      ${product.originalPrice}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    onClick={() => handleAddToCart(product.id, product.name)}
                                    disabled={!product.inStock}
                                  >
                                    <ShoppingCart className="h-4 w-4 mr-2" />
                                    Add to Cart
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => handleWishlist(product.id, product.name)}
                                  >
                                    <Heart className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}