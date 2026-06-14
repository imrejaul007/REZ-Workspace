'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useRouter } from 'next/navigation';

export default function Cart() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: 'Margherita Pizza',
      restaurant: 'Bella Vista Italian',
      price: 18.99,
      quantity: 2,
      specialInstructions: 'Extra cheese, no basil',
      image: '🍕'
    },
    {
      id: 2,
      name: 'Caesar Salad',
      restaurant: 'Bella Vista Italian', 
      price: 12.99,
      quantity: 1,
      specialInstructions: '',
      image: '🥗'
    },
    {
      id: 3,
      name: 'Salmon Sushi Roll',
      restaurant: 'Tokyo Sushi Bar',
      price: 15.50,
      quantity: 3,
      specialInstructions: 'No wasabi',
      image: '🍣'
    }
  ]);

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity === 0) {
      setCartItems(prev => prev.filter(item => item.id !== id));
    } else {
      setCartItems(prev => prev.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08;
  const deliveryFee = 3.99;
  const total = subtotal + tax + deliveryFee;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Your Cart</h1>
            <p className="text-muted-foreground">{cartItems.length} items</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cartItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="text-4xl">{item.image}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-sm text-gray-600">{item.restaurant}</p>
                          <p className="text-lg font-semibold mt-1">${item.price.toFixed(2)}</p>
                          {item.specialInstructions && (
                            <p className="text-sm text-gray-600 mt-2">
                              Note: {item.specialInstructions}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            
                            onClick={() => updateQuantity(item.id, 0)}
                            className="text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
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
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>${deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => router.push('/marketplace/checkout')}
                  disabled={cartItems.length === 0}
                >
                  Proceed to Checkout
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}