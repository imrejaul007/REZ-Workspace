'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  X,
  Plus,
  Minus,
  Trash2,
  Package,
  Truck,
  Receipt,
  CreditCard,
  MapPin,
  MessageSquare,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/lib/cart/cart-context';
import { useAuth } from '@/lib/auth/auth-provider';
import { cn } from '@/lib/utils';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout?: () => void;
}

export function CartSidebar({ isOpen, onClose, onCheckout }: CartSidebarProps) {
  const { state, updateQuantity, removeItem, updateNotes, clearCart } = useCart();
  const { user } = useAuth();
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  const toggleNotes = (itemId: string) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedNotes(newExpanded);
  };

  const handleCheckout = () => {
    if (!user) {
      // Redirect to login
      window.location.href = '/auth/login?redirect=/marketplace/checkout';
      return;
    }
    
    if (onCheckout) {
      onCheckout();
    } else {
      // Default checkout redirect
      window.location.href = '/marketplace/checkout';
    }
  };

  const groupedByVendor = state.items.reduce((groups, item) => {
    const vendorId = item.vendor.id;
    if (!groups[vendorId]) {
      groups[vendorId] = {
        vendor: item.vendor,
        items: []
      };
    }
    groups[vendorId].items.push(item);
    return groups;
  }, {} as Record<string, { vendor; items: unknown[] }>);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-background shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                  {state.itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {state.itemCount}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-semibold text-foreground">Shopping Cart</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {state.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Your cart is empty
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Add some items from the marketplace to get started
                  </p>
                  <Button onClick={onClose}>
                    Continue Shopping
                  </Button>
                </div>
              ) : (
                <div className="p-4 space-y-6">
                  {/* Items grouped by vendor */}
                  {Object.entries(groupedByVendor).map(([vendorId, group]) => (
                    <div key={vendorId} className="space-y-3">
                      {/* Vendor Header */}
                      <div className="flex items-center space-x-2 p-2 bg-muted/50 rounded-lg">
                        <Package className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm text-foreground">
                          {group.vendor.name}
                        </span>
                        {group.vendor.verified && (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        )}
                      </div>

                      {/* Vendor Items */}
                      <div className="space-y-3">
                        {group.items.map((item) => (
                          <Card key={item.id} className="p-3">
                            <div className="flex items-start space-x-3">
                              {/* Product Image */}
                              <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                                <Package className="h-6 w-6 text-muted-foreground" />
                              </div>

                              {/* Product Info */}
                              <div className="flex-1 space-y-2">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="font-medium text-sm text-foreground line-clamp-2">
                                      {item.name}
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                      ₹{item.price} per {item.unit}
                                    </p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-destructive hover:text-destructive"
                                    onClick={() => removeItem(item.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>

                                {/* Quantity Controls */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                      disabled={item.quantity <= item.minOrderQty}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="text-sm font-medium w-8 text-center">
                                      {item.quantity}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                      disabled={item.maxOrderQty && item.quantity >= item.maxOrderQty}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  <span className="text-sm font-semibold text-foreground">
                                    ₹{(item.price * item.quantity).toLocaleString()}
                                  </span>
                                </div>

                                {/* Min Order Quantity Notice */}
                                {item.minOrderQty > 1 && (
                                  <p className="text-xs text-muted-foreground">
                                    Min order: {item.minOrderQty} {item.unit}
                                  </p>
                                )}

                                {/* Notes */}
                                <div className="space-y-1">
                                  <Button
                                    variant="ghost"
                                    
                                    className="h-6 px-2 text-xs"
                                    onClick={() => toggleNotes(item.id)}
                                  >
                                    <MessageSquare className="h-3 w-3 mr-1" />
                                    {expandedNotes.has(item.id) ? 'Hide' : 'Add'} Notes
                                  </Button>
                                  
                                  {expandedNotes.has(item.id) && (
                                    <textarea
                                      placeholder="Special instructions for this item..."
                                      className="w-full text-xs p-2 border border-border rounded bg-background resize-none"
                                      rows={2}
                                      value={item.notes || ''}
                                      onChange={(e) => e.target.value}
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Clear Cart Button */}
                  {state.items.length > 0 && (
                    <Button
                      variant="outline"
                      
                      onClick={clearCart}
                      className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear Cart
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Footer - Order Summary & Checkout */}
            {state.items.length > 0 && (
              <div className="border-t p-4 space-y-4">
                {/* Order Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">₹{state.total.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (GST 18%)</span>
                    <span className="text-foreground">₹{state.tax.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center">
                      <Truck className="h-3 w-3 mr-1" />
                      Shipping
                    </span>
                    <span className="text-foreground">
                      {state.shipping === 0 ? (
                        <span className="text-green-600">FREE</span>
                      ) : (
                        `₹${state.shipping}`
                      )}
                    </span>
                  </div>
                  
                  {state.total < 500 && (
                    <p className="text-xs text-muted-foreground flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Add ₹{(500 - state.total).toLocaleString()} more for free shipping
                    </p>
                  )}
                  
                  <div className="flex justify-between text-base font-semibold pt-2 border-t">
                    <span className="text-foreground">Total</span>
                    <span className="text-foreground">₹{state.grandTotal.toLocaleString()}</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <Button
                  onClick={handleCheckout}
                  className="w-full"
                  size="lg"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Proceed to Checkout
                </Button>

                {/* Auth Notice */}
                {!user && (
                  <p className="text-xs text-muted-foreground text-center">
                    You'll be redirected to sign in before checkout
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}