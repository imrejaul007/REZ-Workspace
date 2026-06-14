'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  CreditCard,
  MapPin,
  User,
  Phone,
  Mail,
  Calendar,
  Lock,
  Truck,
  Package,
  Receipt,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Clock,
  Shield,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useCart } from '@/lib/cart/cart-context';
import { useAuth } from '@/lib/auth/auth-provider';
import { cn } from '@/lib/utils';
import { ordersApi, CreateOrderData } from '@/lib/api/orders';
import { toast } from 'react-hot-toast';
import DeliverySlotSelector from '@/components/checkout/delivery-slot-selector';
import { DeliverySlot } from '@/lib/delivery-slots';

const checkoutSchema = z.object({
  delivery: z.object({
    type: z.enum(['standard', 'express', 'scheduled']),
    address: z.object({
      fullName: z.string().min(2, 'Full name is required'),
      phone: z.string().min(10, 'Valid phone number is required'),
      addressLine1: z.string().min(5, 'Address is required'),
      addressLine2: z.string().optional(),
      city: z.string().min(2, 'City is required'),
      state: z.string().min(2, 'State is required'),
      zipCode: z.string().min(6, 'Valid ZIP code is required'),
      landmarks: z.string().optional()
    }),
    scheduledDate: z.string().optional(),
    instructions: z.string().optional()
  }),
  payment: z.object({
    method: z.enum(['card', 'upi', 'wallet', 'cod']),
    card: z.object({
      number: z.string().optional(),
      expiryMonth: z.string().optional(),
      expiryYear: z.string().optional(),
      cvv: z.string().optional(),
      holderName: z.string().optional()
    }).optional(),
    upi: z.object({
      id: z.string().optional()
    }).optional()
  }),
  notes: z.string().optional(),
  terms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions')
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

const deliveryOptions = [
  {
    id: 'standard',
    name: 'Standard Delivery',
    description: 'Delivery within 2-3 business days',
    price: 50,
    icon: Truck,
    estimatedDays: '2-3 days'
  },
  {
    id: 'express',
    name: 'Express Delivery',
    description: 'Same day or next day delivery',
    price: 120,
    icon: Package,
    estimatedDays: '1 day'
  },
  {
    id: 'scheduled',
    name: 'Scheduled Delivery',
    description: 'Choose your preferred delivery date',
    price: 80,
    icon: Calendar,
    estimatedDays: 'Custom'
  }
];

const paymentMethods = [
  {
    id: 'card',
    name: 'Credit/Debit Card',
    description: 'Visa, MasterCard, RuPay',
    icon: CreditCard
  },
  {
    id: 'upi',
    name: 'UPI',
    description: 'GPay, PhonePe, Paytm',
    icon: Phone
  },
  {
    id: 'wallet',
    name: 'Digital Wallet',
    description: 'Paytm, PhonePe Wallet',
    icon: Receipt
  },
  {
    id: 'cod',
    name: 'Cash on Delivery',
    description: 'Pay when you receive',
    icon: Truck
  }
];

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { state: cartState, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedDeliverySlot, setSelectedDeliverySlot] = useState<DeliverySlot | null>(null);

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      delivery: {
        type: 'standard',
        address: {
          fullName: user?.profile?.firstName ? `${user.profile.firstName} ${user.profile.lastName}` : '',
          phone: '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: '',
          zipCode: '',
          landmarks: ''
        },
        scheduledDate: '',
        instructions: ''
      },
      payment: {
        method: 'card',
        card: {
          number: '',
          expiryMonth: '',
          expiryYear: '',
          cvv: '',
          holderName: ''
        },
        upi: {
          id: ''
        }
      },
      notes: '',
      terms: false
    }
  });

  // Load cart data from localStorage if cart context is empty
  const [cartData, setCartData] = useState(null);
  
  React.useEffect(() => {
    const storedCart = localStorage.getItem('checkoutCart');
    if (storedCart) {
      setCartData(JSON.parse(storedCart));
    }
  }, []);

  // Redirect if cart is empty
  if (cartState.items.length === 0 && !cartData) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto text-center py-12">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Your cart is empty
          </h2>
          <p className="text-muted-foreground mb-6">
            Add some items to your cart before proceeding to checkout
          </p>
          <Button onClick={() => router.push('/marketplace')}>
            Continue Shopping
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const selectedDeliveryOption = deliveryOptions.find(
    option => option.id === form.watch('delivery.type')
  );

  const selectedPaymentMethod = paymentMethods.find(
    method => method.id === form.watch('payment.method')
  );

  const calculateDeliveryPrice = () => {
    let basePrice = selectedDeliveryOption?.price || 0;
    
    // Add delivery slot price if scheduled delivery with selected slot
    if (selectedDeliveryOption?.id === 'scheduled' && selectedDeliverySlot) {
      basePrice = selectedDeliverySlot.price;
    }
    
    return basePrice;
  };

  // Use cartData if available, otherwise fallback to cartState
  const activeCartData = cartData || cartState;
  const displayItems = cartData ? cartData.items : cartState.items;
  const displayTotal = cartData ? cartData.totals.total : cartState.total;
  const displayTax = cartData ? cartData.totals.tax : cartState.tax;
  
  const finalTotal = displayTotal + displayTax + calculateDeliveryPrice();

  const handlePlaceOrder = async (data: CheckoutForm) => {
    setLoading(true);
    
    try {
      // Prepare order data for API
      const orderData: CreateOrderData = {
        type: 'DELIVERY',
        items: displayItems.map(item => ({
          productId: item.id,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity,
        })),
        subtotal: displayTotal,
        taxAmount: displayTax,
        deliveryFee: calculateDeliveryPrice(),
        discountAmount: cartData?.totals?.discount || 0,
        total: finalTotal,
        deliveryAddress: data.delivery.address,
        customerNotes: data.notes,
      };

      // Add vendor ID if available (get from first item)
      if (displayItems.length > 0) {
        // For marketplace orders, we'll need to get vendor info from items
        // For now, using a mock vendor ID - this should be extracted from cart items
        orderData.vendorId = 'vendor_001';
      }
      
      // Create order via API
      const createdOrder = await ordersApi.createOrder(orderData);
      
      console.log('Order created successfully:', createdOrder);
      toast.success('Order placed successfully!');
      
      // Clear cart and redirect
      clearCart();
      localStorage.removeItem('checkoutCart');
      router.push(`/orders/${createdOrder.id}?success=true`);
      
    } catch (error) {
      console.error('Order placement failed:', error);
      
      // Handle different error types
      if (error.response?.status === 401) {
        toast.error('Please log in to place an order');
        router.push('/auth/login');
      } else if (error.response?.status === 400) {
        toast.error(error.response.data.message || 'Invalid order data');
      } else {
        toast.error('Failed to place order. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      // Validate delivery form fields
      const deliveryData = form.getValues('delivery');
      
      // If scheduled delivery is selected, ensure a delivery slot is chosen
      if (deliveryData.type === 'scheduled' && !selectedDeliverySlot) {
        toast.error('Please select a delivery time slot for scheduled delivery');
        return;
      }

      // Basic form validation for required fields
      if (!deliveryData.address.fullName || !deliveryData.address.phone || 
          !deliveryData.address.addressLine1 || !deliveryData.address.city || 
          !deliveryData.address.state || !deliveryData.address.zipCode) {
        toast.error('Please fill in all required delivery address fields');
        return;
      }
    }
    
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Checkout</h1>
            <p className="text-muted-foreground">
              Review your order and complete the purchase
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Steps */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  {[
                    { num: 1, label: 'Delivery' },
                    { num: 2, label: 'Payment' },
                    { num: 3, label: 'Review' }
                  ].map((s, index) => (
                    <div key={s.num} className="flex items-center">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                          step >= s.num
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {s.num}
                      </div>
                      <span className="ml-2 text-sm font-medium">{s.label}</span>
                      {index < 2 && (
                        <div
                          className={cn(
                            'w-12 h-1 mx-4 rounded',
                            step > s.num ? 'bg-primary' : 'bg-muted'
                          )}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <form onSubmit={form.handleSubmit(handlePlaceOrder)} className="space-y-6">
              {/* Step 1: Delivery Information */}
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  {/* Delivery Options */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5" />
                        Delivery Options
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {deliveryOptions.map((option) => {
                        const Icon = option.icon;
                        const isSelected = form.watch('delivery.type') === option.id;
                        
                        return (
                          <label
                            key={option.id}
                            className={cn(
                              'flex items-center space-x-4 p-4 border rounded-lg cursor-pointer transition-colors',
                              isSelected
                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                : 'border-border hover:bg-accent/50'
                            )}
                          >
                            <input
                              {...form.register('delivery.type')}
                              type="radio"
                              value={option.id}
                              className="sr-only"
                            />
                            <div className={cn(
                              'p-2 rounded-lg',
                              isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            )}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-foreground">{option.name}</h3>
                                <div className="text-right">
                                  <p className="font-semibold text-foreground">
                                    {option.price === 0 ? 'FREE' : `₹${option.price}`}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{option.estimatedDays}</p>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground">{option.description}</p>
                            </div>
                          </label>
                        );
                      })}
                    </CardContent>
                  </Card>

                  {/* Delivery Address */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Delivery Address
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">
                            Full Name *
                          </label>
                          <input
                            {...form.register('delivery.address.fullName')}
                            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                          {form.formState.errors.delivery?.address?.fullName && (
                            <p className="text-sm text-destructive">
                              {form.formState.errors.delivery.address.fullName.message}
                            </p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">
                            Phone Number *
                          </label>
                          <input
                            {...form.register('delivery.address.phone')}
                            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                          {form.formState.errors.delivery?.address?.phone && (
                            <p className="text-sm text-destructive">
                              {form.formState.errors.delivery.address.phone.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Address Line 1 *
                        </label>
                        <input
                          {...form.register('delivery.address.addressLine1')}
                          placeholder="House/Flat number, Building name, Street"
                          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        {form.formState.errors.delivery?.address?.addressLine1 && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.delivery.address.addressLine1.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Address Line 2 (Optional)
                        </label>
                        <input
                          {...form.register('delivery.address.addressLine2')}
                          placeholder="Area, Colony, Locality"
                          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">
                            City *
                          </label>
                          <input
                            {...form.register('delivery.address.city')}
                            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">
                            State *
                          </label>
                          <select
                            {...form.register('delivery.address.state')}
                            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          >
                            <option value="">Select State</option>
                            <option value="Maharashtra">Maharashtra</option>
                            <option value="Delhi">Delhi</option>
                            <option value="Karnataka">Karnataka</option>
                            <option value="Tamil Nadu">Tamil Nadu</option>
                            <option value="Gujarat">Gujarat</option>
                          </select>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground">
                            PIN Code *
                          </label>
                          <input
                            {...form.register('delivery.address.zipCode')}
                            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          Delivery Instructions (Optional)
                        </label>
                        <textarea
                          {...form.register('delivery.instructions')}
                          rows={3}
                          placeholder="Any specific delivery instructions..."
                          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Delivery Slot Selection */}
                  {form.watch('delivery.type') === 'scheduled' && (
                    <DeliverySlotSelector
                      onSlotSelect={setSelectedDeliverySlot}
                      selectedSlot={selectedDeliverySlot}
                      userPostcode={form.watch('delivery.address.zipCode')}
                    />
                  )}
                </motion.div>
              )}

              {/* Step 2: Payment */}
              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Payment Method
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {paymentMethods.map((method) => {
                        const Icon = method.icon;
                        const isSelected = form.watch('payment.method') === method.id;
                        
                        return (
                          <label
                            key={method.id}
                            className={cn(
                              'flex items-center space-x-4 p-4 border rounded-lg cursor-pointer transition-colors',
                              isSelected
                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                : 'border-border hover:bg-accent/50'
                            )}
                          >
                            <input
                              {...form.register('payment.method')}
                              type="radio"
                              value={method.id}
                              className="sr-only"
                            />
                            <div className={cn(
                              'p-2 rounded-lg',
                              isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            )}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{method.name}</h3>
                              <p className="text-sm text-muted-foreground">{method.description}</p>
                            </div>
                          </label>
                        );
                      })}

                      {/* Card Details */}
                      {form.watch('payment.method') === 'card' && (
                        <div className="mt-4 p-4 border rounded-lg bg-muted/20">
                          <h4 className="font-medium mb-3">Card Details</h4>
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Card Number</label>
                              <input
                                {...form.register('payment.card.number')}
                                placeholder="1234 5678 9012 3456"
                                className="w-full px-3 py-2 border border-border rounded-md bg-background"
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Month</label>
                                <select
                                  {...form.register('payment.card.expiryMonth')}
                                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                                >
                                  <option value="">MM</option>
                                  {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                                      {String(i + 1).padStart(2, '0')}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Year</label>
                                <select
                                  {...form.register('payment.card.expiryYear')}
                                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                                >
                                  <option value="">YYYY</option>
                                  {Array.from({ length: 10 }, (_, i) => (
                                    <option key={i} value={String(new Date().getFullYear() + i)}>
                                      {new Date().getFullYear() + i}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">CVV</label>
                                <input
                                  {...form.register('payment.card.cvv')}
                                  placeholder="123"
                                  maxLength={4}
                                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* UPI Details */}
                      {form.watch('payment.method') === 'upi' && (
                        <div className="mt-4 p-4 border rounded-lg bg-muted/20">
                          <h4 className="font-medium mb-3">UPI Details</h4>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">UPI ID</label>
                            <input
                              {...form.register('payment.upi.id')}
                              placeholder="yourname@upi"
                              className="w-full px-3 py-2 border border-border rounded-md bg-background"
                            />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Step 3: Review */}
              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Order Review</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Delivery Summary */}
                      <div className="space-y-3">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          Delivery Information
                        </h4>
                        <div className="bg-muted/50 p-3 rounded-lg text-sm">
                          <p className="font-medium">{selectedDeliveryOption?.name}</p>
                          <p className="text-muted-foreground">{selectedDeliveryOption?.description}</p>
                        </div>
                      </div>

                      {/* Payment Summary */}
                      <div className="space-y-3">
                        <h4 className="font-semibold flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Payment Method
                        </h4>
                        <div className="bg-muted/50 p-3 rounded-lg text-sm">
                          <p className="font-medium">{selectedPaymentMethod?.name}</p>
                          <p className="text-muted-foreground">{selectedPaymentMethod?.description}</p>
                        </div>
                      </div>

                      {/* Terms */}
                      <div className="space-y-3">
                        <label className="flex items-start space-x-3">
                          <input
                            {...form.register('terms')}
                            type="checkbox"
                            className="rounded border-border mt-0.5"
                          />
                          <div className="text-sm">
                            <p className="text-foreground">
                              I agree to the <a href="#" className="text-primary hover:underline">Terms & Conditions</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                            </p>
                          </div>
                        </label>
                        {form.formState.errors.terms && (
                          <p className="text-sm text-destructive flex items-center space-x-1">
                            <AlertCircle className="h-4 w-4" />
                            <span>{form.formState.errors.terms.message}</span>
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={step === 1 ? () => router.back() : prevStep}
                >
                  {step === 1 ? 'Back to Cart' : 'Previous'}
                </Button>
                
                <div className="flex items-center space-x-3">
                  {step < 3 ? (
                    <Button type="button" onClick={nextStep}>
                      Next
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={loading || !form.watch('terms')}
                      className="px-8"
                    >
                      {loading ? (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Placing Order...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4" />
                          <span>Place Order</span>
                        </div>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Order Summary Sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-3">
                  {cartState.items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-muted rounded flex items-center justify-center flex-shrink-0">
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} × ₹{item.price}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        ₹{(item.quantity * item.price).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <hr />

                {/* Totals */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">₹{cartState.total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax (GST 18%)</span>
                    <span className="text-foreground">₹{cartState.tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="text-foreground">
                      {calculateDeliveryPrice() === 0 ? 'FREE' : `₹${calculateDeliveryPrice()}`}
                    </span>
                  </div>
                  <hr />
                  <div className="flex justify-between text-base font-semibold">
                    <span className="text-foreground">Total</span>
                    <span className="text-foreground">₹{finalTotal.toLocaleString()}</span>
                  </div>
                </div>

                {/* Security Note */}
                <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                  <Shield className="h-4 w-4 text-green-600" />
                  <p className="text-xs text-muted-foreground">
                    Your payment information is encrypted and secure
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