'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  Star, 
  ShoppingCart, 
  Plus, 
  Minus,
  MapPin,
  Truck,
  Shield,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  MessageSquare,
  Package,
  Award,
  TrendingUp,
  Users,
  Calendar,
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface ProductDetailsType {
  id: string;
  name: string;
  description: string;
  fullDescription: string;
  price: number;
  originalPrice?: number;
  unit: string;
  minOrderQuantity: number;
  maxOrderQuantity: number;
  inStock: boolean;
  stockQuantity: number;
  images: string[];
  vendor: {
    id: string;
    name: string;
    rating: number;
    totalReviews: number;
    verified: boolean;
    location: string;
    phone: string;
    email: string;
    responseTime: string;
    memberSince: string;
    totalProducts: number;
  };
  ratings: {
    average: number;
    count: number;
    breakdown: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
  };
  tags: string[];
  category: string;
  subCategory: string;
  discount?: {
    percentage: number;
    validUntil: string;
  };
  delivery: {
    freeShipping: boolean;
    estimatedDays: string;
    shippingCost: number;
    availableLocations: string[];
  };
  specifications: {
    [key: string]: string;
  };
  nutritionalInfo?: {
    [key: string]: string;
  };
  certifications: string[];
  relatedProducts: string[];
}

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Mock product data - in real app this would come from API
  const product: ProductDetailsType = {
    id: params.id as string,
    name: 'Premium Basmati Rice',
    description: 'High-quality, aromatic basmati rice perfect for restaurants and bulk cooking.',
    fullDescription: 'Our Premium Basmati Rice is sourced directly from the finest farms in India. This long-grain rice is known for its distinctive aroma, fluffy texture, and exceptional quality. Perfect for restaurants, hotels, and catering businesses that demand consistency and excellence in their rice dishes. Each grain is carefully selected and processed to maintain its natural fragrance and nutritional value.',
    price: 45.99,
    originalPrice: 52.99,
    unit: 'kg',
    minOrderQuantity: 5,
    maxOrderQuantity: 500,
    inStock: true,
    stockQuantity: 2500,
    images: ['/api/placeholder/600/600', '/api/placeholder/600/600', '/api/placeholder/600/600'],
    vendor: {
      id: 'vendor-1',
      name: 'Fresh Ingredients Co.',
      rating: 4.8,
      totalReviews: 245,
      verified: true,
      location: 'Mumbai, Maharashtra',
      phone: '+91-9876543210',
      email: 'sales@freshingredients.com',
      responseTime: 'Within 2 hours',
      memberSince: 'March 2020',
      totalProducts: 156
    },
    ratings: {
      average: 4.7,
      count: 189,
      breakdown: {
        5: 120,
        4: 45,
        3: 18,
        2: 4,
        1: 2
      }
    },
    tags: ['Premium Quality', 'Restaurant Grade', 'Bulk Available', 'Fast Delivery'],
    category: 'Grains & Cereals',
    subCategory: 'Rice',
    discount: {
      percentage: 13,
      validUntil: '2024-12-31'
    },
    delivery: {
      freeShipping: true,
      estimatedDays: '2-3 days',
      shippingCost: 0,
      availableLocations: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata']
    },
    specifications: {
      'Origin': 'Basmati Himalayas, India',
      'Grain Length': '6.5-7.5mm',
      'Moisture': '12% max',
      'Broken Grains': '2% max',
      'Shelf Life': '24 months',
      'Storage': 'Cool, dry place',
      'Packaging': '25kg, 50kg bags available'
    },
    nutritionalInfo: {
      'Calories': '365 per 100g',
      'Protein': '7.5g',
      'Carbohydrates': '78g',
      'Fat': '0.9g',
      'Fiber': '2.3g'
    },
    certifications: ['ISO 9001:2015', 'FSSAI Certified', 'Organic India', 'Export Quality'],
    relatedProducts: ['product-2', 'product-3', 'product-4']
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = selectedQuantity + change;
    if (newQuantity >= product.minOrderQuantity && newQuantity <= product.maxOrderQuantity) {
      setSelectedQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    router.push('/cart');
  };

  const handleBuyNow = () => {
    router.push('/cart?checkout=true');
  };

  const handleContactVendor = () => {
    router.push(`/vendor/${product.vendor.id}`);
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const calculateSavings = () => {
    if (product.originalPrice) {
      return ((product.originalPrice - product.price) / product.originalPrice * 100).toFixed(0);
    }
    return 0;
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Breadcrumb & Back Button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Link href="/marketplace">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Marketplace
              </Button>
            </Link>
            <span className="text-muted-foreground">/ {product.category} / {product.subCategory}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" onClick={() => setIsWishlisted(!isWishlisted)}>
              <Heart className={`h-4 w-4 mr-2 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
              {isWishlisted ? 'Saved' : 'Save'}
            </Button>
            <Button variant="ghost">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl overflow-hidden">
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-32 w-32 text-muted-foreground" />
              </div>
            </div>
            <div className="flex space-x-2">
              {product.images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`w-20 h-20 rounded-lg bg-muted flex items-center justify-center border-2 ${
                    selectedImageIndex === index ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <Package className="h-8 w-8 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                {product.vendor.verified && (
                  <Badge className="bg-green-500 text-white">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified Vendor
                  </Badge>
                )}
                {product.discount && (
                  <Badge className="bg-red-500 text-white">
                    {product.discount.percentage}% OFF
                  </Badge>
                )}
                <Badge variant="secondary">{product.category}</Badge>
              </div>
              
              <h1 className="text-3xl font-bold text-foreground mb-2">{product.name}</h1>
              <p className="text-lg text-muted-foreground mb-4">{product.description}</p>

              <div className="flex items-center space-x-4 mb-4">
                {renderStarRating(product.ratings.average)}
                <span className="text-sm font-medium">{product.ratings.average}</span>
                <span className="text-sm text-muted-foreground">
                  ({product.ratings.count} reviews)
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-baseline space-x-3">
                <span className="text-4xl font-bold text-foreground">
                  ₹{product.price.toFixed(2)}
                </span>
                {product.originalPrice && (
                  <>
                    <span className="text-xl text-muted-foreground line-through">
                      ₹{product.originalPrice.toFixed(2)}
                    </span>
                    <span className="text-lg font-medium text-green-600">
                      Save {calculateSavings()}%
                    </span>
                  </>
                )}
                <span className="text-sm text-muted-foreground">per {product.unit}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Min. order: {product.minOrderQuantity} {product.unit} • 
                Max. order: {product.maxOrderQuantity} {product.unit}
              </p>
            </div>

            {/* Stock & Availability */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Badge variant={product.inStock ? "secondary" : "destructive"}>
                  {product.inStock ? '✅ In Stock' : '❌ Out of Stock'}
                </Badge>
                {product.inStock && (
                  <span className="text-sm text-muted-foreground">
                    {product.stockQuantity} {product.unit} available
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Truck className="h-4 w-4 text-primary" />
                  <span>{product.delivery.estimatedDays} delivery</span>
                </div>
                {product.delivery.freeShipping && (
                  <div className="flex items-center space-x-1">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="text-green-600 font-medium">Free Shipping</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quantity Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Quantity</Label>
              <div className="flex items-center space-x-4">
                <div className="flex items-center border border-border rounded-lg">
                  <Button 
                    variant="ghost" 
                    
                    onClick={() => handleQuantityChange(-product.minOrderQuantity)}
                    disabled={selectedQuantity <= product.minOrderQuantity}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    value={selectedQuantity}
                    onChange={(e) => setSelectedQuantity(parseInt(e.target.value) || 1)}
                    className="w-20 text-center border-none focus:ring-0"
                  />
                  <Button 
                    variant="ghost" 
                    
                    onClick={() => handleQuantityChange(product.minOrderQuantity)}
                    disabled={selectedQuantity >= product.maxOrderQuantity}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <span className="text-sm text-muted-foreground">
                  Total: ₹{(product.price * selectedQuantity).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <div className="flex space-x-3">
                <Button 
                  onClick={handleBuyNow}
                  size="lg"
                  className="flex-1 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                  disabled={!product.inStock}
                >
                  Buy Now
                </Button>
                <Button 
                  onClick={handleAddToCart}
                  variant="outline" 
                  size="lg"
                  className="flex-1"
                  disabled={!product.inStock}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
              </div>
              
              <Button 
                onClick={handleContactVendor}
                variant="outline" 
                size="lg"
                className="w-full"
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                Contact Vendor
              </Button>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <Card>
          <CardHeader>
            <div className="flex space-x-6">
              {['overview', 'specifications', 'reviews', 'vendor'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-sm font-medium capitalize pb-2 border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </CardHeader>
          
          <CardContent>
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Product Description</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {product.fullDescription}
                  </p>
                </div>
                
                {product.nutritionalInfo && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Nutritional Information</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(product.nutritionalInfo).map(([key, value]) => (
                        <div key={key} className="text-sm">
                          <span className="font-medium">{key}: </span>
                          <span className="text-muted-foreground">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Certifications</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.certifications.map((cert, index) => (
                      <Badge key={index} variant="outline" className="text-green-700 border-green-200">
                        <Award className="h-3 w-3 mr-1" />
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'specifications' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Technical Specifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="font-medium">{key}</span>
                      <span className="text-muted-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Customer Reviews</h3>
                  <Button variant="outline">
                    Write a Review
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <div className="text-center p-6 bg-muted/50 rounded-lg">
                      <div className="text-4xl font-bold mb-2">{product.ratings.average}</div>
                      {renderStarRating(product.ratings.average)}
                      <div className="text-sm text-muted-foreground mt-2">
                        Based on {product.ratings.count} reviews
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {Object.entries(product.ratings.breakdown).reverse().map(([rating, count]) => (
                      <div key={rating} className="flex items-center space-x-3">
                        <span className="text-sm w-8">{rating}★</span>
                        <div className="flex-1 h-2 bg-muted rounded-full">
                          <div 
                            className="h-2 bg-yellow-400 rounded-full"
                            style={{ width: `${(count / product.ratings.count) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-8">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'vendor' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Vendor Information</h3>
                  <Button onClick={handleContactVendor}>
                    View Full Profile
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{product.vendor.name}</h4>
                          <div className="flex items-center space-x-1">
                            {renderStarRating(product.vendor.rating)}
                            <span className="text-sm text-muted-foreground">
                              ({product.vendor.totalReviews})
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{product.vendor.location}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Member since {product.vendor.memberSince}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <span>{product.vendor.totalProducts} products</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>Responds {product.vendor.responseTime}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <h4 className="font-semibold mb-4">Contact Information</h4>
                      <div className="space-y-3">
                        <Button variant="outline" className="w-full justify-start">
                          <Phone className="h-4 w-4 mr-2" />
                          {product.vendor.phone}
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Mail className="h-4 w-4 mr-2" />
                          {product.vendor.email}
                        </Button>
                        <Button className="w-full">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Send Message
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}