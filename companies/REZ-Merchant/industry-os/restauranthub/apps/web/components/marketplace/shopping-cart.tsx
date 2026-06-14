'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart as ShoppingCartIcon,
  X,
  Plus,
  Minus,
  Truck,
  Clock,
  MapPin,
  CreditCard,
  Package,
  Trash2,
  ArrowRight,
  Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, cn } from '@/lib/utils';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  unit: string;
  quantity: number;
  minOrderQuantity: number;
  image?: string;
  vendor: {
    id: string;
    name: string;
    location: string;
  };
  delivery: {
    estimatedDays: string;
    freeShipping: boolean;
    shippingCost?: number;
  };
}

interface ShoppingCartProps {
  items: CartItem[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onCheckout: () => void;
}

export default function ShoppingCart({
  items,
  isOpen,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}: ShoppingCartProps) {
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string>('');

  // Group items by vendor
  const itemsByVendor = items.reduce((acc, item) => {
    const vendorId = item.vendor.id;
    if (!acc[vendorId]) {
      acc[vendorId] = {
        vendor: item.vendor,
        items: [],
        subtotal: 0,
        shippingCost: 0
      };
    }
    acc[vendorId].items.push(item);
    acc[vendorId].subtotal += item.price * item.quantity;
    acc[vendorId].shippingCost += item.delivery.freeShipping ? 0 : (item.delivery.shippingCost || 50);
    return acc;
  }, {} as Record<string, {
    vendor: CartItem['vendor'];
    items: CartItem[];
    subtotal: number;
    shippingCost: number;
  }>);

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalShipping = Object.values(itemsByVendor).reduce((sum, vendor) => sum + vendor.shippingCost, 0);
  const promoDiscount = appliedPromo ? subtotal * 0.1 : 0; // 10% discount
  const taxes = (subtotal - promoDiscount) * 0.18; // 18% GST
  const total = subtotal + totalShipping - promoDiscount + taxes;

  const handleIncreaseQuantity = (item: CartItem) => {
    onUpdateQuantity(item.id, item.quantity + item.minOrderQuantity);
  };

  const handleDecreaseQuantity = (item: CartItem) => {
    if (item.quantity > item.minOrderQuantity) {
      onUpdateQuantity(item.id, item.quantity - item.minOrderQuantity);
    }
  };

  const handleApplyPromo = () => {
    if (promoCode.toUpperCase() === 'SAVE10') {
      setAppliedPromo(promoCode);
      setPromoCode('');
    } else {
      // Show error - invalid promo code
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />
        
        {/* Cart Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="absolute right-0 top-0 h-full w-full max-w-lg bg-background shadow-2xl"
        >
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center space-x-2">
                <ShoppingCartIcon className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Shopping Cart</h2>
                {items.length > 0 && (
                  <Badge variant="secondary">{items.length}</Badge>
                )}
              </div>
              <Button variant="ghost"  onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            {items.length === 0 ? (
              // Empty State
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <ShoppingCartIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Your cart is empty</h3>
                  <p className="text-muted-foreground mb-4">
                    Add some products to get started
                  </p>
                  <Button onClick={onClose}>
                    Continue Shopping
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {Object.values(itemsByVendor).map(({ vendor, items: vendorItems, subtotal: vendorSubtotal }) => (
                    <Card key={vendor.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4 text-primary" />
                          <CardTitle className="text-sm">{vendor.name}</CardTitle>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{vendor.location}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {vendorItems.map((item) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-start space-x-4"
                          >
                            {/* Product Image */}
                            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>

                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm line-clamp-2">{item.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {formatCurrency(item.price)} per {item.unit}
                              </p>
                              
                              {/* Delivery Info */}
                              <div className="flex items-center space-x-2 mt-1">
                                <div className="flex items-center space-x-1">
                                  <Truck className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    {item.delivery.estimatedDays}
                                  </span>
                                </div>
                                {item.delivery.freeShipping && (
                                  <Badge variant="outline" className="text-xs">
                                    Free Shipping
                                  </Badge>
                                )}
                              </div>

                              {/* Quantity Controls */}
                              <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center space-x-2">
                                  <Button
                                    
                                    variant="outline"
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleDecreaseQuantity(item)}
                                    disabled={item.quantity <= item.minOrderQuantity}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="text-sm font-medium w-8 text-center">
                                    {item.quantity}
                                  </span>
                                  <Button
                                    
                                    variant="outline"
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleIncreaseQuantity(item)}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-sm">
                                    {formatCurrency(item.price * item.quantity)}
                                  </span>
                                  <Button
                                    
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                    onClick={() => onRemoveItem(item.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                        
                        {/* Vendor Subtotal */}
                        <div className="pt-3 border-t border-border">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-medium">{formatCurrency(vendorSubtotal)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Promo Code */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Promo Code</span>
                      </div>
                      
                      {appliedPromo ? (
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-success-600 border-success-600">
                              {appliedPromo}
                            </Badge>
                            <span className="text-xs text-muted-foreground">10% discount applied</span>
                          </div>
                          <Button
                            
                            variant="ghost"
                            onClick={() => setAppliedPromo('')}
                            className="text-xs"
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 mt-2">
                          <input
                            type="text"
                            placeholder="Enter promo code"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                          <Button
                            
                            onClick={handleApplyPromo}
                            disabled={!promoCode.trim()}
                          >
                            Apply
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Footer - Order Summary & Checkout */}
                <div className="border-t border-border p-6 space-y-4">
                  {/* Order Summary */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    
                    {totalShipping > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span>{formatCurrency(totalShipping)}</span>
                      </div>
                    )}
                    
                    {promoDiscount > 0 && (
                      <div className="flex items-center justify-between text-sm text-success-600">
                        <span>Discount</span>
                        <span>-{formatCurrency(promoDiscount)}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">GST (18%)</span>
                      <span>{formatCurrency(taxes)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-base font-semibold pt-2 border-t border-border">
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <Button className="w-full" onClick={onCheckout}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Proceed to Checkout
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  
                  <Button variant="outline" className="w-full" onClick={onClose}>
                    Continue Shopping
                  </Button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}