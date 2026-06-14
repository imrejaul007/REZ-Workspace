'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Calculator, FileText, Users, Calendar, Truck, Shield, AlertCircle, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface BulkProduct {
  id: string;
  name: string;
  description: string;
  unitPrice: number;
  minOrderQuantity: number;
  bulkDiscounts: {
    quantity: number;
    discount: number;
  }[];
  image: string;
  vendor: {
    id: string;
    name: string;
    businessType: string;
    minimumOrder: number;
  };
  availability: {
    inStock: boolean;
    leadTime: string;
    maxQuantity: number;
  };
  categories: string[];
  tags: string[];
}

interface BulkOrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customizations?: string;
}

const mockBulkProducts: Record<string, BulkProduct> = {
  '1': {
    id: '1',
    name: 'Corporate Catering Package',
    description: 'Complete catering solution for corporate events, meetings, and conferences. Includes appetizers, main courses, sides, and desserts.',
    unitPrice: 25.00,
    minOrderQuantity: 20,
    bulkDiscounts: [
      { quantity: 50, discount: 5 },
      { quantity: 100, discount: 10 },
      { quantity: 200, discount: 15 },
      { quantity: 500, discount: 20 }
    ],
    image: '🍽️',
    vendor: {
      id: 'corporate-catering',
      name: 'Corporate Catering Solutions',
      businessType: 'B2B Catering',
      minimumOrder: 500
    },
    availability: {
      inStock: true,
      leadTime: '48 hours',
      maxQuantity: 1000
    },
    categories: ['Catering', 'Corporate', 'Events'],
    tags: ['bulk', 'catering', 'corporate', 'events']
  },
  '2': {
    id: '2',
    name: 'Wholesale Pizza Supply',
    description: 'Bulk frozen pizzas for restaurants, cafeterias, and food service operations. Various sizes and toppings available.',
    unitPrice: 8.50,
    minOrderQuantity: 100,
    bulkDiscounts: [
      { quantity: 200, discount: 8 },
      { quantity: 500, discount: 15 },
      { quantity: 1000, discount: 22 }
    ],
    image: '🍕',
    vendor: {
      id: 'pizza-wholesale',
      name: 'Pizza Wholesale Co.',
      businessType: 'Food Distributor',
      minimumOrder: 850
    },
    availability: {
      inStock: true,
      leadTime: '5-7 business days',
      maxQuantity: 5000
    },
    categories: ['Wholesale', 'Pizza', 'Frozen Foods'],
    tags: ['wholesale', 'frozen', 'pizza', 'food-service']
  }
};

export default function BulkOrderPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const [product, setProduct] = useState<BulkProduct | null>(null);
  const [orderItems, setOrderItems] = useState<BulkOrderItem[]>([]);
  const [quantity, setQuantity] = useState(0);
  const [customizations, setCustomizations] = useState('');
  const [deliveryDate, setDeliveryDate] = useState<Date>();
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('net-30');
  const [requiresInvoice, setRequiresInvoice] = useState(true);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    const productId = params.id as string;
    const foundProduct = mockBulkProducts[productId];
    
    if (foundProduct) {
      setProduct(foundProduct);
      setQuantity(foundProduct.minOrderQuantity);
    } else {
      toast({
        title: "Product not found",
        description: "The requested bulk product could not be found.",
        variant: "error"
      });
      router.push('/marketplace');
    }
  }, [params.id, toast, router]);

  const calculateDiscount = (qty: number): number => {
    if (!product) return 0;
    
    let discount = 0;
    for (const tier of product.bulkDiscounts) {
      if (qty >= tier.quantity) {
        discount = tier.discount;
      }
    }
    return discount;
  };

  const calculateTotalPrice = (): number => {
    if (!product || quantity === 0) return 0;
    
    const basePrice = product.unitPrice * quantity;
    const discount = calculateDiscount(quantity);
    const discountAmount = (basePrice * discount) / 100;
    
    return basePrice - discountAmount;
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (!product) return;
    
    if (newQuantity < product.minOrderQuantity) {
      setQuantity(product.minOrderQuantity);
      toast({
        title: "Minimum quantity required",
        description: `Minimum order quantity is ${product.minOrderQuantity} units.`,
        variant: "error"
      });
    } else if (newQuantity > product.availability.maxQuantity) {
      setQuantity(product.availability.maxQuantity);
      toast({
        title: "Maximum quantity exceeded",
        description: `Maximum available quantity is ${product.availability.maxQuantity} units.`,
        variant: "error"
      });
    } else {
      setQuantity(newQuantity);
    }
  };

  const handleSubmitBulkOrder = () => {
    if (!product) return;
    
    if (!agreedToTerms) {
      toast({
        title: "Terms and conditions required",
        description: "Please agree to the bulk order terms and conditions.",
        variant: "error"
      });
      return;
    }

    if (!companyName || !contactPerson || !contactEmail || !deliveryAddress) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields.",
        variant: "error"
      });
      return;
    }

    if (calculateTotalPrice() < product.vendor.minimumOrder) {
      toast({
        title: "Minimum order value not met",
        description: `Minimum order value is $${product.vendor.minimumOrder}.`,
        variant: "error"
      });
      return;
    }

    toast({
      title: "Bulk order submitted!",
      description: "Your bulk order request has been submitted. We'll contact you within 24 hours with a detailed quote.",
    });

    // Redirect to confirmation page
    router.push('/marketplace/bulk/confirmation');
  };

  if (!product) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Loading bulk product...</h2>
            <p className="text-muted-foreground">Please wait while we fetch the product details.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const totalPrice = calculateTotalPrice();
  const discount = calculateDiscount(quantity);
  const discountAmount = (product.unitPrice * quantity * discount) / 100;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="text-sm text-muted-foreground">
            <span className="cursor-pointer hover:text-foreground" onClick={() => router.push('/marketplace')}>
              Marketplace
            </span>
            <span className="mx-2">›</span>
            <span>Bulk Orders</span>
            <span className="mx-2">›</span>
            <span>{product.name}</span>
          </div>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto">
            <Package className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Bulk Order Request</h1>
            <p className="text-muted-foreground mt-2">
              Request a custom quote for bulk quantities with volume discounts
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Product Details */}
            <Card>
              <CardHeader>
                <div className="flex items-start space-x-4">
                  <div className="text-6xl">{product.image}</div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl">{product.name}</CardTitle>
                    <p className="text-muted-foreground mt-2">{product.description}</p>
                    <div className="flex items-center space-x-4 mt-4">
                      <Badge>{product.vendor.businessType}</Badge>
                      <Badge variant="outline">Min. {product.minOrderQuantity} units</Badge>
                      <Badge variant="outline">Lead time: {product.availability.leadTime}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Vendor Information</h4>
                    <p className="text-sm text-muted-foreground">{product.vendor.name}</p>
                    <p className="text-xs text-muted-foreground">Minimum order: ${product.vendor.minimumOrder}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Availability</h4>
                    <p className="text-sm text-muted-foreground">
                      {product.availability.inStock ? 'In Stock' : 'Pre-order'}
                    </p>
                    <p className="text-xs text-muted-foreground">Max: {product.availability.maxQuantity} units</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quantity & Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Quantity & Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Quantity</label>
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      
                      onClick={() => handleQuantityChange(quantity - 10)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => e.target.value}
                      className="w-32 text-center"
                    />
                    <Button
                      variant="outline"
                      
                      onClick={() => handleQuantityChange(quantity + 10)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum: {product.minOrderQuantity} units
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Unit Price:</span>
                    <span className="font-semibold">${product.unitPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal ({quantity} units):</span>
                    <span>${(product.unitPrice * quantity).toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Volume Discount ({discount}%):</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total:</span>
                      <span>${totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Volume Discounts */}
                <div>
                  <h4 className="font-semibold mb-2">Volume Discounts</h4>
                  <div className="space-y-1">
                    {product.bulkDiscounts.map((tier) => (
                      <div
                        key={tier.quantity}
                        className={`text-sm flex justify-between p-2 rounded ${
                          quantity >= tier.quantity
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'text-muted-foreground'
                        }`}
                      >
                        <span>{tier.quantity}+ units:</span>
                        <span>{tier.discount}% OFF</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customizations */}
            <Card>
              <CardHeader>
                <CardTitle>Customizations & Special Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Describe unknown customizations, dietary requirements, or special requests..."
                  value={customizations}
                  onChange={(e) => setCustomizations(e.target.value)}
                  rows={4}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Order Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Company Name *</label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Contact Person *</label>
                  <Input
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Enter contact person name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Email *</label>
                  <Input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Phone</label>
                  <Input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Delivery Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="h-5 w-5 mr-2" />
                  Delivery Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Preferred Delivery Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <Calendar className="mr-2 h-4 w-4" />
                        {deliveryDate ? format(deliveryDate, 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={deliveryDate}
                        onSelect={setDeliveryDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground mt-1">
                    Lead time: {product.availability.leadTime}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Delivery Address *</label>
                  <Textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter full delivery address"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Special Instructions</label>
                  <Textarea
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="Loading dock info, delivery time preferences, etc."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Terms */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Payment Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Payment Terms</label>
                  <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="net-15">Net 15</SelectItem>
                      <SelectItem value="net-30">Net 30</SelectItem>
                      <SelectItem value="net-45">Net 45</SelectItem>
                      <SelectItem value="net-60">Net 60</SelectItem>
                      <SelectItem value="prepaid">Prepaid</SelectItem>
                      <SelectItem value="cod">Cash on Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="invoice"
                    checked={requiresInvoice}
                    onChange={(e) => setRequiresInvoice((e.target as HTMLInputElement).checked)}
                  />
                  <label htmlFor="invoice" className="text-sm">Requires formal invoice</label>
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Quantity:</span>
                  <span>{quantity} units</span>
                </div>
                <div className="flex justify-between">
                  <span>Unit Price:</span>
                  <span>${product.unitPrice.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Volume Discount:</span>
                    <span>{discount}% OFF</span>
                  </div>
                )}
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Estimated Total:</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
                {totalPrice < product.vendor.minimumOrder && (
                  <div className="flex items-center space-x-2 p-2 bg-yellow-50 rounded">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-yellow-700">
                      Minimum order: ${product.vendor.minimumOrder}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Terms & Submit */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms((e.target as HTMLInputElement).checked)}
                    />
                    <label htmlFor="terms" className="text-sm">
                      I agree to the bulk order terms and conditions, including minimum order requirements, payment terms, and delivery schedule.
                    </label>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    size="lg" 
                    onClick={handleSubmitBulkOrder}
                    disabled={!agreedToTerms || totalPrice < product.vendor.minimumOrder}
                  >
                    Submit Bulk Order Request
                  </Button>
                  
                  <p className="text-xs text-muted-foreground text-center">
                    This is a request for quote. Final pricing may vary based on your specific requirements.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}