'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Flame,
  ShoppingCart,
  Eye,
  Heart,
  TrendingUp,
  Package,
  Star,
  Timer,
  Zap,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useFlashDeals, FlashDeal, TimeRemaining } from '@/lib/flash-deals';
import { formatCurrency, cn } from '@/lib/utils';
import { useWishlist, convertToWishlistItem } from '@/lib/wishlist';
import { useToast } from '@/hooks/use-toast';

interface FlashDealsSectionProps {
  showHeader?: boolean;
  maxDeals?: number;
  featured?: boolean;
  onViewDeal?: (deal: FlashDeal) => void;
  onAddToCart?: (deal: FlashDeal, quantity: number) => void;
}

interface CountdownTimerProps {
  endTime: string;
  onExpire?: () => void;
}

function CountdownTimer({ endTime, onExpire }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({ 
    days: 0, hours: 0, minutes: 0, seconds: 0, total: 0, expired: false 
  });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    const calculateTime = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const total = end - now;

      if (total <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0, expired: true });
        if (onExpire) onExpire();
        return;
      }

      const days = Math.floor(total / (1000 * 60 * 60 * 24));
      const hours = Math.floor((total % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((total % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((total % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds, total, expired: false });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);

    return () => clearInterval(timer);
  }, [endTime, onExpire, isClient]);

  if (timeRemaining.expired) {
    return (
      <div className="flex items-center space-x-1 text-red-500 text-sm">
        <Timer className="h-4 w-4" />
        <span className="font-medium">Expired</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Clock className="h-4 w-4 text-orange-500" />
      <div className="flex space-x-1 text-sm font-mono">
        {timeRemaining.days > 0 && (
          <div className="bg-red-600 text-white px-1.5 py-0.5 rounded text-xs">
            {timeRemaining.days}d
          </div>
        )}
        <div className="bg-red-600 text-white px-1.5 py-0.5 rounded text-xs">
          {timeRemaining.hours.toString().padStart(2, '0')}h
        </div>
        <div className="bg-red-600 text-white px-1.5 py-0.5 rounded text-xs">
          {timeRemaining.minutes.toString().padStart(2, '0')}m
        </div>
        <div className="bg-red-600 text-white px-1.5 py-0.5 rounded text-xs">
          {timeRemaining.seconds.toString().padStart(2, '0')}s
        </div>
      </div>
    </div>
  );
}

function FlashDealCard({ 
  deal, 
  onViewDeal, 
  onAddToCart 
}: { 
  deal: FlashDeal; 
  onViewDeal?: (deal: FlashDeal) => void;
  onAddToCart?: (deal: FlashDeal, quantity: number) => void;
}) {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { getDealProgress, hasLowStock, isDealEndingSoon } = useFlashDeals();
  const { toast } = useToast();
  
  const progress = getDealProgress(deal);
  const lowStock = hasLowStock(deal);
  const endingSoon = isDealEndingSoon(deal.endTime);
  const inWishlist = isInWishlist(deal.productId, 'product');

  const handleToggleWishlist = () => {
    const wishlistItem = convertToWishlistItem({
      id: deal.productId,
      name: deal.productName,
      price: deal.discountPrice,
      images: deal.productImage ? [deal.productImage] : [],
      vendor: { id: deal.vendorId, name: deal.vendorName },
      category: deal.category,
      unit: deal.unit
    }, 'product');
    
    const isAdded = toggleWishlist(wishlistItem);
    toast({
      title: isAdded ? "Added to Wishlist" : "Removed from Wishlist",
      description: `${deal.productName} ${isAdded ? 'added to' : 'removed from'} your wishlist.`,
    });
  };

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(deal, deal.minOrderQuantity);
    }
    toast({
      title: "Added to Cart",
      description: `${deal.productName} has been added to your cart.`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <Card className="h-full hover:shadow-lg transition-all duration-300 border-2 border-red-100 hover:border-red-200 group">
        {/* Flash Sale Badge */}
        <div className="absolute -top-2 -left-2 z-10">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
            <Flame className="h-3 w-3" />
            <span>FLASH SALE</span>
          </div>
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleToggleWishlist}
          className="absolute top-3 right-3 p-2 rounded-full bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-50"
        >
          <Heart className={cn("h-4 w-4", inWishlist ? "fill-red-500 text-red-500" : "text-gray-400")} />
        </button>

        {/* Product Image */}
        <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-t-lg relative overflow-hidden">
          <Package className="h-12 w-12 text-gray-400" />
          
          {/* Discount Percentage */}
          <div className="absolute top-2 left-2">
            <Badge className="bg-red-500 text-white font-bold">
              {deal.discountPercentage}% OFF
            </Badge>
          </div>

          {/* Status Badges */}
          <div className="absolute top-2 right-2 space-y-1">
            {endingSoon && (
              <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200 text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Ending Soon
              </Badge>
            )}
            {lowStock && (
              <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                Low Stock
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Product Info */}
            <div>
              <h3 className="font-semibold text-foreground line-clamp-2 mb-1">
                {deal.productName}
              </h3>
              <p className="text-sm text-muted-foreground">
                by {deal.vendorName}
              </p>
              <Badge variant="outline" className="text-xs mt-1">
                {deal.category}
              </Badge>
            </div>

            {/* Pricing */}
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-foreground">
                  {formatCurrency(deal.discountPrice)}
                </span>
                <span className="text-sm text-muted-foreground line-through">
                  {formatCurrency(deal.originalPrice)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                per {deal.unit} • Min order: {deal.minOrderQuantity} {deal.unit}
              </p>
            </div>

            {/* Stock Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Stock</span>
                <span className="font-medium">
                  {deal.remainingQuantity} of {deal.totalQuantity} left
                </span>
              </div>
              <Progress
                value={progress}
                className={cn(
                  "h-2",
                  lowStock ? "[&>div]:bg-red-500" : progress > 70 ? "[&>div]:bg-orange-500" : "[&>div]:bg-green-500"
                )}
              />
            </div>

            {/* Countdown Timer */}
            <div className="flex items-center justify-center p-3 bg-red-50 rounded-lg">
              <CountdownTimer endTime={deal.endTime} />
            </div>

            {/* Condition/Description */}
            {deal.metadata?.condition && (
              <div className="text-center">
                <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
                  {deal.metadata.condition}
                </Badge>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-2">
              <Button 
                 
                variant="outline" 
                className="flex-1"
                onClick={() => onViewDeal && onViewDeal(deal)}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              <Button 
                 
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={handleAddToCart}
                disabled={deal.remainingQuantity === 0}
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                {deal.remainingQuantity === 0 ? 'Sold Out' : 'Add to Cart'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function FlashDealsSection({
  showHeader = true,
  maxDeals,
  featured = false,
  onViewDeal,
  onAddToCart
}: FlashDealsSectionProps) {
  const { 
    activeDeals, 
    featuredDeals, 
    getStats, 
    refreshDeals 
  } = useFlashDeals();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const deals = featured ? featuredDeals : activeDeals;
  const displayDeals = maxDeals ? deals.slice(0, maxDeals) : deals;
  const stats = getStats();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    refreshDeals();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? displayDeals.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === displayDeals.length - 1 ? 0 : prev + 1));
  };

  if (displayDeals.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg">
                <Flame className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Flash Deals</h2>
                <p className="text-sm text-muted-foreground">
                  Limited time offers with amazing discounts
                </p>
              </div>
            </div>
            
            {/* Stats */}
            <div className="hidden md:flex items-center space-x-4 ml-6">
              <div className="flex items-center space-x-1 text-sm">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">Avg</span>
                <span className="font-semibold">{stats.avgDiscount}% OFF</span>
              </div>
              {stats.endingSoon > 0 && (
                <div className="flex items-center space-x-1 text-sm">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="text-muted-foreground">{stats.endingSoon} ending soon</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
            
            {displayDeals.length > 1 && (
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  
                  onClick={handlePrevious}
                  className="px-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  
                  onClick={handleNext}
                  className="px-2"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Flash Deals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence mode="wait">
          {displayDeals.map((deal, index) => (
            <motion.div
              key={deal.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.1 }}
            >
              <FlashDealCard
                deal={deal}
                onViewDeal={onViewDeal}
                onAddToCart={onAddToCart}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Next Refresh Info */}
      {showHeader && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            New deals refresh every 6 hours • Next update: {' '}
            <span className="font-medium">
              {new Date(stats.nextRefresh).toLocaleTimeString()}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}