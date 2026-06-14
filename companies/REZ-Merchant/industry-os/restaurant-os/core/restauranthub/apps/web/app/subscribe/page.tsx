'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import toast from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Check, 
  Star, 
  Shield,
  Crown,
  Zap,
  Users,
  BarChart3,
  HeadphonesIcon,
  Globe,
  Smartphone,
  Clock,
  TrendingUp,
  Award,
  Lock,
  CreditCard,
  Gift,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Info,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: string[];
  limits: {
    restaurants: number | 'unlimited';
    orders: number | 'unlimited';
    analytics: boolean;
    support: '24/7' | 'business-hours' | 'email';
    integrations: number | 'unlimited';
    storage: string;
  };
  popular: boolean;
  trialDays: number;
  color: string;
}

interface SubscriptionForm {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  restaurantType: string;
  expectedOrders: string;
  currentSoftware: string;
  paymentMethod: 'card' | 'upi' | 'bank';
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  billingCycle: 'monthly' | 'yearly';
  acceptTerms: boolean;
  marketingEmails: boolean;
}

export default function SubscriptionPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string>('pro');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [currentStep, setCurrentStep] = useState<'plans' | 'details' | 'payment' | 'confirmation'>('plans');
  const [formData, setFormData] = useState<SubscriptionForm>({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    restaurantType: '',
    expectedOrders: '',
    currentSoftware: '',
    paymentMethod: 'card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    billingCycle: 'monthly',
    acceptTerms: false,
    marketingEmails: false
  });

  const plans: Plan[] = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Perfect for small restaurants just getting started',
      price: {
        monthly: 1499,
        yearly: 14990
      },
      features: [
        'Basic order management',
        'Menu management',
        'Customer database',
        'Basic analytics',
        'Email support',
        'Mobile app access',
        '50 orders per day',
        '1 restaurant location'
      ],
      limits: {
        restaurants: 1,
        orders: 1500,
        analytics: false,
        support: 'email',
        integrations: 2,
        storage: '1GB'
      },
      popular: false,
      trialDays: 14,
      color: 'bg-blue-500'
    },
    {
      id: 'pro',
      name: 'Professional',
      description: 'Most popular plan for growing restaurant businesses',
      price: {
        monthly: 4999,
        yearly: 49990
      },
      features: [
        'Advanced order management',
        'Multi-location support',
        'Advanced analytics & reports',
        'Inventory management',
        'Staff management',
        'Priority support',
        'API integrations',
        'Custom branding',
        'Unlimited orders',
        'Up to 5 restaurant locations'
      ],
      limits: {
        restaurants: 5,
        orders: 'unlimited',
        analytics: true,
        support: 'business-hours',
        integrations: 10,
        storage: '50GB'
      },
      popular: true,
      trialDays: 30,
      color: 'bg-primary'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Complete solution for restaurant chains and franchises',
      price: {
        monthly: 12999,
        yearly: 129990
      },
      features: [
        'Everything in Professional',
        'Unlimited restaurant locations',
        'Advanced franchise management',
        'Custom integrations',
        'Dedicated account manager',
        '24/7 priority support',
        'Custom reporting',
        'White-label solution',
        'Advanced security features',
        'Training & onboarding'
      ],
      limits: {
        restaurants: 'unlimited',
        orders: 'unlimited',
        analytics: true,
        support: '24/7',
        integrations: 'unlimited',
        storage: '500GB'
      },
      popular: false,
      trialDays: 30,
      color: 'bg-purple-600'
    }
  ];

  const selectedPlanData = plans.find(plan => plan.id === selectedPlan);

  const handlePlanSelection = (planId: string) => {
    setSelectedPlan(planId);
    setFormData({ ...formData, billingCycle });
  };

  const handleNextStep = () => {
    if (currentStep === 'plans') {
      setCurrentStep('details');
    } else if (currentStep === 'details') {
      setCurrentStep('payment');
    } else if (currentStep === 'payment') {
      setCurrentStep('confirmation');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === 'confirmation') {
      // Handle final subscription
      toast.success(
        `Welcome to RestoPapa!`,
        `Your ${selectedPlanData?.name} plan subscription has been activated! ${selectedPlanData?.trialDays} day free trial started. Redirecting to your dashboard...`
      );
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } else {
      handleNextStep();
    }
  };

  const calculateSavings = () => {
    if (!selectedPlanData) return 0;
    const monthlyTotal = selectedPlanData.price.monthly * 12;
    return monthlyTotal - selectedPlanData.price.yearly;
  };

  const renderPlanCard = (plan: Plan) => {
    const isSelected = selectedPlan === plan.id;
    const price = billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly;
    const pricePerMonth = billingCycle === 'yearly' ? plan.price.yearly / 12 : plan.price.monthly;

    return (
      <motion.div
        key={plan.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative cursor-pointer transition-all duration-300 ${
          isSelected ? 'scale-105' : 'hover:scale-102'
        }`}
        onClick={() => handlePlanSelection(plan.id)}
      >
        <Card className={`overflow-hidden border-2 ${
          isSelected ? 'border-primary shadow-xl' : 'border-border hover:border-primary/50'
        }`}>
          {plan.popular && (
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Badge className="bg-gradient-to-r from-primary to-blue-600 text-white px-4 py-1">
                <Star className="h-3 w-3 mr-1" />
                Most Popular
              </Badge>
            </div>
          )}
          
          <CardHeader className={`text-center text-white ${plan.color} pt-8`}>
            <CardTitle className="text-2xl">{plan.name}</CardTitle>
            <p className="text-sm opacity-90">{plan.description}</p>
            
            <div className="pt-4">
              <div className="text-4xl font-bold">
                ₹{price.toLocaleString()}
                <span className="text-base font-normal">
                  /{billingCycle}
                </span>
              </div>
              {billingCycle === 'yearly' && (
                <div className="text-sm opacity-90">
                  ₹{Math.round(pricePerMonth).toLocaleString()}/month
                </div>
              )}
              <div className="text-sm opacity-90 mt-2">
                {plan.trialDays} day free trial
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            
            <div className="space-y-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <div>📍 Restaurants: {plan.limits.restaurants}</div>
              <div>📦 Orders: {plan.limits.orders}</div>
              <div>📊 Analytics: {plan.limits.analytics ? 'Advanced' : 'Basic'}</div>
              <div>🎧 Support: {plan.limits.support}</div>
            </div>
            
            <Button
              size="default"
              className={`w-full mt-6 ${
                isSelected 
                  ? 'bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90' 
                  : 'bg-muted hover:bg-muted/80 text-foreground'
              }`}
            >
              {isSelected ? '✓ Selected' : 'Select Plan'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderStepIndicator = () => {
    const steps = [
      { id: 'plans', name: 'Choose Plan', icon: Crown },
      { id: 'details', name: 'Business Details', icon: Users },
      { id: 'payment', name: 'Payment', icon: CreditCard },
      { id: 'confirmation', name: 'Confirmation', icon: CheckCircle }
    ];

    return (
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep;
            const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
            const Icon = step.icon;
            
            return (
              <React.Fragment key={step.id}>
                <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                  isActive ? 'bg-primary text-white' : 
                  isCompleted ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
                }`}>
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{step.name}</span>
                </div>
                {index < steps.length - 1 && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            <Link href="/marketplace">
              <Button variant="ghost" size="default">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Marketplace
              </Button>
            </Link>
          </div>
        </div>

        {/* Hero Section */}
        {currentStep === 'plans' && (
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto"
            >
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent mb-6">
                Transform Your Restaurant Business
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Join thousands of successful restaurants using RestoPapa to streamline operations, 
                increase revenue, and delight customers.
              </p>
              <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Free trial included</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>No setup fees</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Plans Selection */}
        {currentStep === 'plans' && (
          <div className="space-y-8">
            {/* Billing Toggle */}
            <div className="flex justify-center mb-8">
              <div className="bg-muted p-1 rounded-lg">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-6 py-2 rounded-md transition-all ${
                    billingCycle === 'monthly' 
                      ? 'bg-background text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-6 py-2 rounded-md transition-all relative ${
                    billingCycle === 'yearly' 
                      ? 'bg-background text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Yearly
                  <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs">
                    Save 17%
                  </Badge>
                </button>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map(renderPlanCard)}
            </div>

            {/* Continue Button */}
            <div className="text-center pt-8">
              <Button 
                onClick={handleNextStep}
                size="lg"
                className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
              >
                Continue with {selectedPlanData?.name} Plan
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Business Details Form */}
        {currentStep === 'details' && (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Tell us about your business</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="businessName">Business/Restaurant Name</Label>
                      <Input
                        id="businessName"
                        value={formData.businessName}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="ownerName">Owner/Manager Name</Label>
                      <Input
                        id="ownerName"
                        value={formData.ownerName}
                        onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="restaurantType">Restaurant Type</Label>
                      <select
                        id="restaurantType"
                        value={formData.restaurantType}
                        onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background"
                        required
                      >
                        <option value="">Select type</option>
                        <option value="fine-dining">Fine Dining</option>
                        <option value="casual-dining">Casual Dining</option>
                        <option value="fast-food">Fast Food</option>
                        <option value="cafe">Cafe/Bakery</option>
                        <option value="cloud-kitchen">Cloud Kitchen</option>
                        <option value="bar">Bar/Pub</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="expectedOrders">Expected Daily Orders</Label>
                      <select
                        id="expectedOrders"
                        value={formData.expectedOrders}
                        onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background"
                        required
                      >
                        <option value="">Select range</option>
                        <option value="1-20">1-20 orders</option>
                        <option value="21-50">21-50 orders</option>
                        <option value="51-100">51-100 orders</option>
                        <option value="101-200">101-200 orders</option>
                        <option value="200+">200+ orders</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="currentSoftware">Current Software/System (if unknown)</Label>
                    <Input
                      id="currentSoftware"
                      value={formData.currentSoftware}
                      onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
                      placeholder="e.g., POS system, existing software, or manual"
                    />
                  </div>
                  
                  <div className="flex justify-center pt-4">
                    <Button type="submit" size="lg">
                      Continue to Payment
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payment Form */}
        {currentStep === 'payment' && (
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Payment Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <Label>Payment Method</Label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {[
                          { id: 'card', name: 'Credit/Debit Card', icon: CreditCard },
                          { id: 'upi', name: 'UPI', icon: Smartphone },
                          { id: 'bank', name: 'Net Banking', icon: Globe }
                        ].map(method => (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => setFormData({...formData, paymentMethod: method.id as unknown})}
                            className={`p-3 border rounded-lg text-sm flex flex-col items-center space-y-1 transition-all ${
                              formData.paymentMethod === method.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <method.icon className="h-5 w-5" />
                            <span>{method.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {formData.paymentMethod === 'card' && (
                      <>
                        <div>
                          <Label htmlFor="cardNumber">Card Number</Label>
                          <Input
                            id="cardNumber"
                            value={formData.cardNumber}
                            onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
                            placeholder="1234 5678 9012 3456"
                            required
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="expiryDate">Expiry Date</Label>
                            <Input
                              id="expiryDate"
                              value={formData.expiryDate}
                              onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
                              placeholder="MM/YY"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="cvv">CVV</Label>
                            <Input
                              id="cvv"
                              value={formData.cvv}
                              onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
                              placeholder="123"
                              required
                            />
                          </div>
                        </div>
                      </>
                    )}
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="acceptTerms"
                          checked={formData.acceptTerms}
                          onChange={(e) => setFormData({...formData, acceptTerms: (e.target as HTMLInputElement).checked})}
                          required
                        />
                        <Label htmlFor="acceptTerms" className="text-sm">
                          I accept the Terms of Service and Privacy Policy
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="marketingEmails"
                          checked={formData.marketingEmails}
                          onChange={(e) => setFormData({...formData, marketingEmails: (e.target as HTMLInputElement).checked})}
                        />
                        <Label htmlFor="marketingEmails" className="text-sm">
                          Send me updates and marketing emails
                        </Label>
                      </div>
                    </div>
                    
                    <Button
                      size="lg"
                      type="submit"
                      className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                      disabled={!formData.acceptTerms}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Start Free Trial
                    </Button>
                  </form>
                </CardContent>
              </Card>
              
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedPlanData && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{selectedPlanData.name} Plan</h3>
                          <p className="text-sm text-muted-foreground">{selectedPlanData.description}</p>
                        </div>
                        <Badge className={selectedPlanData.color.replace('bg-', 'bg-') + ' text-white'}>
                          {selectedPlanData.name}
                        </Badge>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Plan Price ({billingCycle})</span>
                          <span>₹{selectedPlanData.price[billingCycle].toLocaleString()}</span>
                        </div>
                        {billingCycle === 'yearly' && (
                          <div className="flex justify-between text-green-600">
                            <span>Yearly Discount</span>
                            <span>-₹{calculateSavings().toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Setup Fee</span>
                          <span className="line-through text-muted-foreground">₹2,999</span>
                        </div>
                        <div className="flex justify-between text-green-600">
                          <span>Setup Fee Waived</span>
                          <span>FREE</span>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span>₹{selectedPlanData.price[billingCycle].toLocaleString()}</span>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center space-x-2 text-blue-800 mb-2">
                          <Gift className="h-4 w-4" />
                          <span className="font-medium">Free Trial Included</span>
                        </div>
                        <p className="text-sm text-blue-700">
                          Start with {selectedPlanData.trialDays} days free trial. You won't be charged until the trial ends.
                        </p>
                      </div>
                      
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Cancel anytime</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>24/7 customer support</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Secure payment processing</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Confirmation */}
        {currentStep === 'confirmation' && (
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              
              <div>
                <h1 className="text-3xl font-bold mb-4">Welcome to RestoPapa!</h1>
                <p className="text-lg text-muted-foreground mb-6">
                  Your subscription has been successfully set up. You're ready to transform your restaurant business.
                </p>
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Plan:</span>
                      <span className="font-medium">{selectedPlanData?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Business:</span>
                      <span className="font-medium">{formData.businessName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Email:</span>
                      <span className="font-medium">{formData.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trial Period:</span>
                      <span className="font-medium">{selectedPlanData?.trialDays} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Next Billing:</span>
                      <span className="font-medium">
                        {new Date(Date.now() + (selectedPlanData?.trialDays || 0) * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">What's Next?</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="font-medium mb-2">📧 Check Your Email</div>
                    <div className="text-muted-foreground">Setup instructions and login details sent</div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="font-medium mb-2">🚀 Setup Your Restaurant</div>
                    <div className="text-muted-foreground">Configure menu, staff, and preferences</div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="font-medium mb-2">📱 Download Apps</div>
                    <div className="text-muted-foreground">Get mobile apps for on-the-go management</div>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleSubmit}
                size="lg"
                className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}