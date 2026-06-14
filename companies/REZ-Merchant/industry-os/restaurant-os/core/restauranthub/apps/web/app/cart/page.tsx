'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowLeft, 
  CreditCard, 
  Truck, 
  Shield, 
  Clock,
  CheckCircle,
  Gift,
  MapPin
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  vendor: string;
  image: string;
  inStock: boolean;
  estimatedDelivery: string;
}

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: '1',
      name: 'Premium Basmati Rice',
      price: 45.99,
      quantity: 2,
      unit: 'kg',
      vendor: 'Fresh Ingredients Co.',
      image: '/api/placeholder/100/100',
      inStock: true,
      estimatedDelivery: '2-3 days'
    },
    {
      id: '2', 
      name: 'Organic Olive Oil',
      price: 28.50,
      quantity: 1,
      unit: 'bottle',
      vendor: 'Mediterranean Supplies',
      image: '/api/placeholder/100/100',
      inStock: true,
      estimatedDelivery: '1-2 days'
    }
  ]);

  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState('');

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeItem(id);
      return;
    }
    setCartItems(items => 
      items.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeItem = (id: string) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const applyPromoCode = () => {
    if (promoCode.toLowerCase() === 'save10') {
      setAppliedPromo('SAVE10 - 10% off');
      setPromoCode('');
    } else if (promoCode.toLowerCase() === 'freeship') {
      setAppliedPromo('FREESHIP - Free shipping');
      setPromoCode('');
    } else {
      alert('Invalid promo code');
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = appliedPromo.includes('10%') ? subtotal * 0.1 : 0;
  const shipping = appliedPromo.includes('Free') ? 0 : subtotal > 200 ? 0 : 15.99;
  const tax = (subtotal - discount) * 0.08;
  const total = subtotal - discount + shipping + tax;

  const handleCheckout = () => {
    // Store cart data for checkout page
    const cartData = {
      items: cartItems,
      totals: {
        subtotal,
        discount,
        shipping,
        tax,
        total
      },
      appliedPromo
    };
    localStorage.setItem('checkoutCart', JSON.stringify(cartData));
    router.push('/marketplace/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-16">
            <ShoppingCart className="h-24 w-24 text-muted-foreground mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
            <p className="text-lg text-muted-foreground mb-8">Add some products from our marketplace to get started!</p>
            <Link href="/marketplace">
              <Button size="lg" className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Shopping Cart</h1>
            <p className="text-muted-foreground mt-1">{cartItems.length} items in your cart</p>
          </div>
          <Link href="/marketplace">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue Shopping
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Cart Items
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">by {item.vendor}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={item.inStock ? "secondary" : "destructive"}>
                          {item.inStock ? '✅ In Stock' : '❌ Out of Stock'}
                        </Badge>
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          {item.estimatedDelivery}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center font-medium">{item.quantity}</span>
                      <Button 
                        variant="outline" 
                        
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">${item.price} per {item.unit}</p>
                    </div>

                    <Button 
                      variant="ghost" 
                      
                      onClick={() => removeItem(item.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Promo Code */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter promo code (try: SAVE10 or FREESHIP)"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                  />
                  <Button onClick={applyPromoCode} variant="outline">
                    <Gift className="h-4 w-4 mr-2" />
                    Apply
                  </Button>
                </div>
                {appliedPromo && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 text-sm">✅ {appliedPromo} applied!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <Button 
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                  size="lg"
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Proceed to Checkout
                </Button>

                <div className="space-y-3 pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4 text-green-600" />
                    Secure SSL encryption
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Truck className="h-4 w-4 text-blue-600" />
                    Free shipping on orders over $200
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    30-day money-back guarantee
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Delivery Info
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="address" className="text-sm font-medium">Delivery Address</Label>
                    <Input id="address" placeholder="Enter your delivery address" className="mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="city" className="text-sm font-medium">City</Label>
                      <Input id="city" placeholder="City" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="zip" className="text-sm font-medium">ZIP Code</Label>
                      <Input id="zip" placeholder="ZIP" className="mt-1" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Estimated delivery: <span className="font-medium">2-3 business days</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}