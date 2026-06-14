'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  Star,
  ShoppingCart,
  Eye,
  MapPin,
  Truck,
  CheckCircle,
  Package,
  Plus,
  Minus,
  Share2,
  Scale
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, cn } from '@/lib/utils';
import Image from 'next/image';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    unit: string;
    minOrderQuantity: number;
    inStock: boolean;
    images: string[];
    vendor: {
      id: string;
      name: string;
      rating: number;
      verified: boolean;
      location: string;
    };
    ratings: {
      average: number;
      count: number;
    };
    tags: string[];
    discount?: {
      percentage: number;
      validUntil: string;
    };
    delivery: {
      freeShipping: boolean;
      estimatedDays: string;
    };
  };
  onAddToCart?: (productId: string, quantity: number) => void;
  onToggleWishlist?: (productId: string) => void;
  onToggleComparison?: (product) => void;
  onViewDetails?: (product) => void;
  isInWishlist?: boolean;
  isInComparison?: boolean;
  cartQuantity?: number;
  variant?: 'default' | 'compact' | 'detailed';
}

export default function ProductCard({
  product,
  onAddToCart,
  onToggleWishlist,
  onToggleComparison,
  onViewDetails,
  isInWishlist = false,
  isInComparison = false,
  cartQuantity = 0,
  variant = 'default'
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(product.minOrderQuantity);

  const handleAddToCart = () => {
    onAddToCart?.(product.id, selectedQuantity);
  };

  const handleIncreaseQuantity = () => {
    setSelectedQuantity(prev => prev + product.minOrderQuantity);
  };

  const handleDecreaseQuantity = () => {
    setSelectedQuantity(prev => Math.max(product.minOrderQuantity, prev - product.minOrderQuantity));
  };

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-background border border-border rounded-lg p-4 hover:shadow-md transition-all duration-200"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground text-sm line-clamp-1">{product.name}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-lg font-bold text-foreground">
                {formatCurrency(product.price)}
              </span>
              <span className="text-xs text-muted-foreground">per {product.unit}</span>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-muted-foreground">
                {product.ratings.average} ({product.ratings.count})
              </span>
            </div>
          </div>
          
          <Button  onClick={handleAddToCart} disabled={!product.inStock}>
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-background border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
          <Package className="h-16 w-16 text-muted-foreground" />
        </div>
        
        {/* Overlay Actions */}
        <div className={cn(
          'absolute inset-0 bg-black/40 flex items-center justify-center space-x-2 transition-opacity',
          isHovered ? 'opacity-100' : 'opacity-0'
        )}>
          <Button 
             
            variant="secondary"
            onClick={() => onViewDetails?.(product)}
          >
            <Eye className="h-4 w-4 mr-1" />
            Quick View
          </Button>
          <Button  variant="secondary">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 space-y-1">
          {product.vendor.verified && (
            <Badge className="bg-success-500 text-white">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
          {product.discount && (
            <Badge className="bg-destructive text-white">
              {product.discount.percentage}% OFF
            </Badge>
          )}
          {product.delivery.freeShipping && (
            <Badge className="bg-blue-500 text-white">
              Free Shipping
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex flex-col space-y-1">
          {/* Wishlist Button */}
          <button
            onClick={() => onToggleWishlist?.(product.id)}
            className="p-2 rounded-full bg-white/90 hover:bg-white transition-colors shadow-sm"
          >
            <Heart 
              className={cn(
                "h-4 w-4 transition-colors",
                isInWishlist ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-red-500"
              )} 
            />
          </button>

          {/* Comparison Button */}
          <button
            onClick={() => onToggleComparison?.(product)}
            className="p-2 rounded-full bg-white/90 hover:bg-white transition-colors shadow-sm"
            disabled={!onToggleComparison}
          >
            <Scale 
              className={cn(
                "h-4 w-4 transition-colors",
                isInComparison ? "fill-blue-500 text-blue-500" : "text-muted-foreground hover:text-blue-500"
              )} 
            />
          </button>
        </div>

        {/* Stock Status */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-medium">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-foreground line-clamp-2 mb-1">{product.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        </div>

        {/* Rating */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{product.ratings.average}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            ({product.ratings.count} reviews)
          </span>
        </div>

        {/* Vendor */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground line-clamp-1">
              {product.vendor.name}, {product.vendor.location}
            </span>
          </div>
          {product.vendor.verified && (
            <CheckCircle className="h-3 w-3 text-success-500" />
          )}
        </div>

        {/* Price */}
        <div className="space-y-2">
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-bold text-foreground">
              {formatCurrency(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
            <span className="text-sm text-muted-foreground">per {product.unit}</span>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Min. order: {product.minOrderQuantity} {product.unit}
          </p>
        </div>

        {/* Delivery Info */}
        <div className="flex items-center space-x-2 text-sm">
          <Truck className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">{product.delivery.estimatedDays}</span>
          {product.delivery.freeShipping && (
            <span className="text-success-600 font-medium">Free Shipping</span>
          )}
        </div>

        {/* Tags */}
        {product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {product.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{product.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Add to Cart Section */}
        <div className="pt-2">
          {cartQuantity > 0 ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button 
                   
                  variant="outline"
                  onClick={handleDecreaseQuantity}
                  disabled={selectedQuantity <= product.minOrderQuantity}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="font-medium w-12 text-center">{selectedQuantity}</span>
                <Button 
                   
                  variant="outline"
                  onClick={handleIncreaseQuantity}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={handleAddToCart} disabled={!product.inStock}>
                Update Cart
              </Button>
            </div>
          ) : (
            <Button 
              className="w-full" 
              onClick={handleAddToCart}
              disabled={!product.inStock}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {product.inStock ? 'Add to Cart' : 'Out of Stock'}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}