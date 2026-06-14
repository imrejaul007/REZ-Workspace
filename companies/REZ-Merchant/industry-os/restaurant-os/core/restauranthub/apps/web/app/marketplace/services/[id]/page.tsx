'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, CreditCard, RefreshCw, Shield, Star, CheckCircle, Clock, Users, Zap, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface ServiceSubscription {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  category: string;
  provider: {
    id: string;
    name: string;
    rating: number;
    reviewCount: number;
    isVerified: boolean;
  };
  plans: {
    id: string;
    name: string;
    price: number;
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
    description: string;
    features: string[];
    maxUsers?: number;
    maxOrders?: number;
    includes: string[];
    isPopular?: boolean;
  }[];
  features: string[];
  benefits: string[];
  requirements: string[];
  cancellationPolicy: string;
  supportLevel: string;
  image: string;
  gallery: string[];
  testimonials: {
    id: string;
    user: string;
    rating: number;
    comment: string;
    plan: string;
  }[];
}

const mockServices: Record<string, ServiceSubscription> = {
  '1': {
    id: '1',
    name: 'Daily Fresh Meal Delivery',
    description: 'Fresh, healthy meals delivered daily to your office or home. Perfect for busy professionals.',
    longDescription: 'Transform your daily nutrition with our premium meal delivery service. Our expert chefs prepare fresh, balanced meals using locally-sourced ingredients. Each meal is designed by nutritionists to provide optimal health benefits while delivering exceptional taste.',
    category: 'Meal Delivery',
    provider: {
      id: 'fresh-daily',
      name: 'Fresh Daily Co.',
      rating: 4.8,
      reviewCount: 1247,
      isVerified: true
    },
    plans: [
      {
        id: 'basic',
        name: 'Basic Plan',
        price: 12.99,
        period: 'daily',
        description: 'One meal per day',
        features: ['1 meal per day', 'Standard delivery', 'Basic customization'],
        includes: ['Main course', 'Side dish', 'Beverage'],
        maxUsers: 1
      },
      {
        id: 'premium',
        name: 'Premium Plan',
        price: 19.99,
        period: 'daily',
        description: 'Two meals per day',
        features: ['2 meals per day', 'Priority delivery', 'Full customization', '24/7 support'],
        includes: ['Breakfast & lunch', 'Snacks', 'Beverages', 'Dessert'],
        maxUsers: 1,
        isPopular: true
      },
      {
        id: 'family',
        name: 'Family Plan',
        price: 35.99,
        period: 'daily',
        description: 'Meals for the whole family',
        features: ['Meals for 4 people', 'Family-size portions', 'Kid-friendly options', 'Weekend delivery'],
        includes: ['All meals', 'Family snacks', 'Special dietary options'],
        maxUsers: 4
      }
    ],
    features: [
      'Locally sourced ingredients',
      'Nutritionist-designed meals',
      'Customizable dietary preferences',
      'Eco-friendly packaging',
      'Real-time delivery tracking',
      'Mobile app included'
    ],
    benefits: [
      'Save 2+ hours daily on meal prep',
      'Maintain consistent healthy eating',
      'Reduce food waste by 80%',
      'Access to premium ingredients',
      'Professional nutritional guidance'
    ],
    requirements: [
      'Delivery address within service area',
      'Refrigeration available for deliveries',
      'Minimum 7-day commitment',
      'Valid payment method'
    ],
    cancellationPolicy: 'Cancel anytime with 48-hour notice. No cancellation fees.',
    supportLevel: '24/7 customer support via phone, chat, and email',
    image: '🥗',
    gallery: ['🍱', '🥙', '🍲', '🥤'],
    testimonials: [
      {
        id: '1',
        user: 'Sarah Johnson',
        rating: 5,
        comment: 'Incredible service! The meals are always fresh and delicious. Saved me so much time!',
        plan: 'Premium Plan'
      },
      {
        id: '2',
        user: 'Mike Chen',
        rating: 5,
        comment: 'Perfect for our busy family. Kids love the variety and we love the convenience.',
        plan: 'Family Plan'
      }
    ]
  },
  '2': {
    id: '2',
    name: 'Office Coffee & Snacks Service',
    description: 'Complete office pantry service with premium coffee, snacks, and beverages delivered weekly.',
    longDescription: 'Boost employee satisfaction and productivity with our comprehensive office pantry service. We provide premium coffee beans, healthy snacks, beverages, and office supplies delivered fresh every week.',
    category: 'Office Services',
    provider: {
      id: 'office-fresh',
      name: 'Office Fresh Solutions',
      rating: 4.9,
      reviewCount: 892,
      isVerified: true
    },
    plans: [
      {
        id: 'small-office',
        name: 'Small Office',
        price: 149.99,
        period: 'weekly',
        description: 'Perfect for teams of 10-25 people',
        features: ['Premium coffee beans', 'Healthy snacks', 'Basic beverages', 'Weekly delivery'],
        includes: ['2kg coffee beans', '20 snack items', '48 beverages', 'Coffee machine maintenance'],
        maxUsers: 25
      },
      {
        id: 'medium-office',
        name: 'Medium Office',
        price: 299.99,
        period: 'weekly',
        description: 'Ideal for teams of 25-50 people',
        features: ['Premium & specialty coffee', 'Diverse snack selection', 'Full beverage range', 'Bi-weekly delivery'],
        includes: ['4kg coffee beans', '40 snack items', '96 beverages', 'Tea selection', 'Fruit basket'],
        maxUsers: 50,
        isPopular: true
      },
      {
        id: 'large-office',
        name: 'Large Office',
        price: 599.99,
        period: 'weekly',
        description: 'Comprehensive solution for 50+ people',
        features: ['Full coffee bar setup', 'Gourmet snacks', 'Complete beverage station', 'Daily restocking'],
        includes: ['8kg coffee beans', '80+ snack items', '200+ beverages', 'Fresh fruit daily', 'Catered lunch options'],
        maxUsers: 100
      }
    ],
    features: [
      'Barista-quality coffee equipment',
      'Automatic inventory management',
      'Dietary restriction accommodations',
      'Sustainable packaging',
      'Usage analytics dashboard',
      'Emergency restocking'
    ],
    benefits: [
      'Improve employee satisfaction by 40%',
      'Reduce coffee break time waste',
      'Boost afternoon productivity',
      'Enhance office culture',
      'Cost savings vs individual purchases'
    ],
    requirements: [
      'Office space with kitchen/break room',
      'Power outlet for coffee equipment',
      'Minimum 3-month commitment',
      'Designated delivery contact'
    ],
    cancellationPolicy: '30-day notice required. Equipment rental fees may apply.',
    supportLevel: 'Business hours support with same-day emergency response',
    image: '☕',
    gallery: ['🍪', '🥨', '🧃', '📊'],
    testimonials: [
      {
        id: '3',
        user: 'David Park',
        rating: 5,
        comment: 'Our team productivity has noticeably improved since we started this service!',
        plan: 'Medium Office'
      }
    ]
  }
};

export default function ServiceSubscriptionPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const [service, setService] = useState<ServiceSubscription | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [autoRenewal, setAutoRenewal] = useState(true);
  const [customizations, setCustomizations] = useState('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    const serviceId = params.id as string;
    const foundService = mockServices[serviceId];
    
    if (foundService) {
      setService(foundService);
      if (foundService.plans.length > 0) {
        const popularPlan = foundService.plans.find(plan => plan.isPopular);
        setSelectedPlan(popularPlan?.id || foundService.plans[0].id);
      }
    } else {
      toast({
        title: "Service not found",
        description: "The requested service could not be found.",
        variant: "error"
      });
      router.push('/marketplace');
    }
  }, [params.id, toast, router]);

  const handleDietaryRestrictionToggle = (restriction: string) => {
    setDietaryRestrictions(prev => 
      prev.includes(restriction)
        ? prev.filter(r => r !== restriction)
        : [...prev, restriction]
    );
  };

  const getSelectedPlan = () => {
    return service?.plans.find(plan => plan.id === selectedPlan);
  };

  const calculatePrice = () => {
    const plan = getSelectedPlan();
    if (!plan) return 0;

    if (billingPeriod === 'yearly') {
      return plan.price * (plan.period === 'daily' ? 365 : plan.period === 'weekly' ? 52 : 12) * 0.85; // 15% discount for yearly
    }
    
    return plan.price * (plan.period === 'daily' ? 30 : plan.period === 'weekly' ? 4 : 1);
  };

  const handleSubscribe = () => {
    if (!service || !selectedPlan) return;
    
    if (!agreedToTerms) {
      toast({
        title: "Terms required",
        description: "Please agree to the terms and conditions.",
        variant: "error"
      });
      return;
    }

    toast({
      title: "Subscription activated!",
      description: `You've successfully subscribed to ${service.name}. Your first delivery will arrive within 2 business days.`,
    });

    router.push('/dashboard');
  };

  if (!service) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Loading service...</h2>
            <p className="text-muted-foreground">Please wait while we fetch the service details.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const selectedPlanData = getSelectedPlan();
  const monthlyPrice = calculatePrice();

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
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
            <span>Services</span>
            <span className="mx-2">›</span>
            <span>{service.name}</span>
          </div>
        </div>

        {/* Service Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto text-4xl">
            {service.image}
          </div>
          <div>
            <h1 className="text-4xl font-bold">{service.name}</h1>
            <p className="text-muted-foreground mt-2 text-lg max-w-2xl mx-auto">
              {service.description}
            </p>
            <div className="flex items-center justify-center space-x-4 mt-4">
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{service.provider.rating}</span>
                <span className="text-muted-foreground">({service.provider.reviewCount} reviews)</span>
              </div>
              {service.provider.isVerified && (
                <Badge className="bg-blue-500">
                  <Shield className="h-3 w-3 mr-1" />
                  Verified Provider
                </Badge>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Service Details */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="support">Support</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Card>
                  <CardContent className="pt-6 space-y-6">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">About This Service</h3>
                      <p className="text-muted-foreground">{service.longDescription}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Key Benefits</h4>
                        <ul className="space-y-2">
                          {service.benefits.map((benefit, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">Requirements</h4>
                        <ul className="space-y-2">
                          {service.requirements.map((requirement, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <div className="h-2 w-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                              <span className="text-sm text-muted-foreground">{requirement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {service.gallery.map((item, index) => (
                        <div key={index} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-4xl">
                          {item}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="features">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold text-lg mb-4">Service Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {service.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews">
                <div className="space-y-4">
                  {service.testimonials.map((testimonial) => (
                    <Card key={testimonial.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{testimonial.user}</h4>
                            <Badge variant="outline" className="text-xs mt-1">{testimonial.plan}</Badge>
                          </div>
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= testimonial.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-muted-foreground">{testimonial.comment}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="support">
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Support Level</h4>
                      <p className="text-muted-foreground">{service.supportLevel}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Cancellation Policy</h4>
                      <p className="text-muted-foreground">{service.cancellationPolicy}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Subscription Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Plan Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Choose Your Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {service.plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all relative ${
                      selectedPlan === plan.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    {plan.isPopular && (
                      <Badge className="absolute -top-2 left-4 bg-orange-500">Most Popular</Badge>
                    )}
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold">{plan.name}</h4>
                      <div className="text-right">
                        <div className="font-bold">${plan.price}</div>
                        <div className="text-xs text-muted-foreground">per {plan.period}</div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{plan.description}</p>
                    <div className="text-xs">
                      {plan.features.slice(0, 2).map((feature, index) => (
                        <div key={index} className="flex items-center space-x-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span>{feature}</span>
                        </div>
                      ))}
                      {plan.features.length > 2 && (
                        <div className="text-muted-foreground">+{plan.features.length - 2} more features</div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Billing Options */}
            <Card>
              <CardHeader>
                <CardTitle>Billing Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Select value={billingPeriod} onValueChange={(value: 'monthly' | 'yearly') => setBillingPeriod(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly Billing</SelectItem>
                      <SelectItem value="yearly">Yearly Billing (15% off)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Auto-renewal</label>
                    <p className="text-xs text-muted-foreground">Automatically renew subscription</p>
                  </div>
                  <Switch checked={autoRenewal} onChange={(e) => setAutoRenewal((e.target as HTMLInputElement).checked)} />
                </div>
              </CardContent>
            </Card>

            {/* Customizations */}
            <Card>
              <CardHeader>
                <CardTitle>Customizations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Special Requirements</label>
                  <Textarea
                    placeholder="Any special dietary requirements, preferences, or instructions..."
                    value={customizations}
                    onChange={(e) => setCustomizations(e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Dietary Restrictions</label>
                  <div className="space-y-2">
                    {['Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 'Nut-free'].map((restriction) => (
                      <div key={restriction} className="flex items-center space-x-2">
                        <Checkbox
                          id={restriction}
                          checked={dietaryRestrictions.includes(restriction)}
                          onCheckedChange={() => handleDietaryRestrictionToggle(restriction)}
                        />
                        <label htmlFor={restriction} className="text-sm">{restriction}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Delivery Instructions</label>
                  <Textarea
                    placeholder="Special delivery instructions, access codes, etc."
                    value={deliveryInstructions}
                    onChange={(e) => setDeliveryInstructions(e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedPlanData && (
                  <>
                    <div className="flex justify-between">
                      <span>Plan:</span>
                      <span className="font-medium">{selectedPlanData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Billing:</span>
                      <span className="capitalize">{billingPeriod}</span>
                    </div>
                    {billingPeriod === 'yearly' && (
                      <div className="flex justify-between text-green-600">
                        <span>Yearly Discount:</span>
                        <span>15% OFF</span>
                      </div>
                    )}
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total ({billingPeriod}):</span>
                        <span>${monthlyPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Subscribe */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms((e.target as HTMLInputElement).checked)}
                  />
                  <label htmlFor="terms" className="text-sm">
                    I agree to the service terms and conditions, including the cancellation policy and auto-renewal settings.
                  </label>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSubscribe}
                  disabled={!agreedToTerms || !selectedPlan}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Subscribe Now
                </Button>

                <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Shield className="h-3 w-3" />
                    <span>Secure payment</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RefreshCw className="h-3 w-3" />
                    <span>Cancel anytime</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}