'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Send, Calculator, Truck, Clock, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useToast } from '@/hooks/use-toast';

export default function B2BQuotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const productName = searchParams.get('product') || '';
  const productPrice = searchParams.get('price') || '';

  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    quantity: '',
    deliveryAddress: '',
    deliveryDate: '',
    specialRequirements: '',
    businessType: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Quote Request Submitted!",
        description: "We'll get back to you within 24 hours with a customized quote.",
        variant: "success"
      });
      setIsSubmitting(false);
      router.push('/marketplace');
    }, 2000);
  };

  const estimatedTotal = productPrice && formData.quantity
    ? (parseFloat(productPrice) * parseInt(formData.quantity || '1')).toFixed(2)
    : '0.00';

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">B2B Quote Request</h1>
              <p className="text-gray-600 dark:text-gray-300">Get a customized quote for bulk orders</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quote Form */}
            <div className="lg:col-span-2">
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Quote Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Product Info */}
                    {productName && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Requested Product</h3>
                        <p className="text-blue-700 dark:text-blue-300">{productName}</p>
                        {productPrice && (
                          <p className="text-sm text-blue-600 dark:text-blue-400">Base Price: ${productPrice}</p>
                        )}
                      </div>
                    )}

                    {/* Company Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="companyName">Company Name *</Label>
                        <Input
                          id="companyName"
                          value={formData.companyName}
                          onChange={(e) => handleInputChange('companyName', e.target.value)}
                          placeholder="Your Company Name"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="businessType">Business Type *</Label>
                        <Select value={formData.businessType} onValueChange={(value) => handleInputChange('businessType', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select business type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="restaurant">Restaurant</SelectItem>
                            <SelectItem value="hotel">Hotel</SelectItem>
                            <SelectItem value="catering">Catering Service</SelectItem>
                            <SelectItem value="retail">Retail Store</SelectItem>
                            <SelectItem value="distributor">Distributor</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="contactPerson">Contact Person *</Label>
                        <Input
                          id="contactPerson"
                          value={formData.contactPerson}
                          onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                          placeholder="Full Name"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="business@company.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="+1 (555) 123-4567"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="quantity">Quantity Needed *</Label>
                        <Input
                          id="quantity"
                          type="number"
                          value={formData.quantity}
                          onChange={(e) => handleInputChange('quantity', e.target.value)}
                          placeholder="100"
                          min="1"
                          required
                        />
                      </div>
                    </div>

                    {/* Delivery Information */}
                    <div>
                      <Label htmlFor="deliveryAddress">Delivery Address *</Label>
                      <Textarea
                        id="deliveryAddress"
                        value={formData.deliveryAddress}
                        onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                        placeholder="Full delivery address including city, state, and ZIP"
                        required
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="deliveryDate">Preferred Delivery Date</Label>
                      <Input
                        id="deliveryDate"
                        type="date"
                        value={formData.deliveryDate}
                        onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="specialRequirements">Special Requirements</Label>
                      <Textarea
                        id="specialRequirements"
                        value={formData.specialRequirements}
                        onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                        placeholder="Any special requirements, certifications needed, or additional information..."
                        rows={4}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={isSubmitting}
                      size="lg"
                    >
                      {isSubmitting ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="mr-2"
                        >
                          <Calculator className="h-4 w-4" />
                        </motion.div>
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      {isSubmitting ? 'Submitting Quote Request...' : 'Submit Quote Request'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Quote Summary */}
            <div className="space-y-6">
              {/* Estimated Cost */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-green-600" />
                    Estimated Cost
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Base Price:</span>
                      <span className="font-medium">${productPrice || '0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">Quantity:</span>
                      <span className="font-medium">{formData.quantity || '1'}</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between">
                        <span className="font-semibold">Estimated Total:</span>
                        <span className="text-lg font-bold text-green-600">${estimatedTotal}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        *Final price may vary based on quantity discounts and special requirements
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Benefits */}
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle>B2B Benefits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Truck className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Free Delivery</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">On orders over $500</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium">24h Response</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Quick quote turnaround</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Building2 className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Volume Discounts</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Better prices for larger orders</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}