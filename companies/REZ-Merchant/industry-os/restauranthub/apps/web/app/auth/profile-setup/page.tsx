'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Upload,
  Camera,
  User,
  Building2,
  MapPin,
  Phone,
  Globe,
  FileText,
  Clock,
  Star,
  CheckCircle,
  AlertCircle,
  Loader2,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

// Schema for different role types
const baseSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  profilePicture: z.string().optional(),
});

const restaurantSchema = baseSchema.extend({
  restaurantName: z.string().min(2, 'Restaurant name is required'),
  cuisine: z.string().min(1, 'Cuisine type is required'),
  address: z.string().min(10, 'Complete address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zipCode: z.string().min(5, 'ZIP code is required'),
  website: z.string().url('Valid website URL is required').optional().or(z.literal('')),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  seatingCapacity: z.number().min(1, 'Seating capacity is required'),
  operatingHours: z.object({
    monday: z.object({ open: z.string(), close: z.string() }),
    tuesday: z.object({ open: z.string(), close: z.string() }),
    wednesday: z.object({ open: z.string(), close: z.string() }),
    thursday: z.object({ open: z.string(), close: z.string() }),
    friday: z.object({ open: z.string(), close: z.string() }),
    saturday: z.object({ open: z.string(), close: z.string() }),
    sunday: z.object({ open: z.string(), close: z.string() }),
  })
});

const employeeSchema = baseSchema.extend({
  experience: z.string().min(1, 'Experience level is required'),
  skills: z.array(z.string()).min(1, 'At least one skill is required'),
  certifications: z.array(z.string()).optional(),
  availability: z.object({
    fullTime: z.boolean(),
    partTime: z.boolean(),
    weekends: z.boolean(),
    evenings: z.boolean(),
  }),
  expectedSalary: z.string().min(1, 'Expected salary range is required'),
  resume: z.string().optional(),
});

const vendorSchema = baseSchema.extend({
  companyName: z.string().min(2, 'Company name is required'),
  businessType: z.string().min(1, 'Business type is required'),
  products: z.array(z.string()).min(1, 'At least one product category is required'),
  address: z.string().min(10, 'Complete address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zipCode: z.string().min(5, 'ZIP code is required'),
  website: z.string().url('Valid website URL is required').optional().or(z.literal('')),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  minimumOrder: z.string().min(1, 'Minimum order amount is required'),
  deliveryRadius: z.string().min(1, 'Delivery radius is required'),
});

const userSchema = baseSchema.extend({
  preferences: z.object({
    cuisines: z.array(z.string()).optional(),
    dietaryRestrictions: z.array(z.string()).optional(),
  }),
  address: z.string().min(10, 'Address is required for delivery'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zipCode: z.string().min(5, 'ZIP code is required'),
});

interface Step {
  id: number;
  title: string;
  description: string;
  icon;
}

const getStepsForRole = (role: string): Step[] => {
  const baseSteps = [
    { id: 1, title: 'Personal Info', description: 'Basic personal information', icon: User },
    { id: 2, title: 'Profile Photo', description: 'Upload your profile picture', icon: Camera },
  ];

  switch (role) {
    case 'restaurant':
      return [
        ...baseSteps,
        { id: 3, title: 'Restaurant Details', description: 'Restaurant information', icon: Building2 },
        { id: 4, title: 'Location & Hours', description: 'Address and operating hours', icon: MapPin },
        { id: 5, title: 'Review & Complete', description: 'Review your information', icon: CheckCircle },
      ];
    case 'employee':
      return [
        ...baseSteps,
        { id: 3, title: 'Experience & Skills', description: 'Your professional background', icon: Star },
        { id: 4, title: 'Availability', description: 'Work preferences', icon: Clock },
        { id: 5, title: 'Review & Complete', description: 'Review your information', icon: CheckCircle },
      ];
    case 'vendor':
      return [
        ...baseSteps,
        { id: 3, title: 'Business Details', description: 'Company information', icon: Building2 },
        { id: 4, title: 'Products & Services', description: 'What you offer', icon: Package },
        { id: 5, title: 'Review & Complete', description: 'Review your information', icon: CheckCircle },
      ];
    default:
      return [
        ...baseSteps,
        { id: 3, title: 'Preferences', description: 'Your food preferences', icon: Star },
        { id: 4, title: 'Review & Complete', description: 'Review your information', icon: CheckCircle },
      ];
  }
};

const cuisineTypes = [
  'Italian', 'Chinese', 'Indian', 'Mexican', 'Thai', 'Japanese', 'American', 'French',
  'Mediterranean', 'Greek', 'Korean', 'Vietnamese', 'Middle Eastern', 'Fusion'
];

const skillOptions = [
  'Food Preparation', 'Customer Service', 'Cash Handling', 'Kitchen Management',
  'Inventory Management', 'Food Safety', 'Wine Service', 'Bartending',
  'Team Leadership', 'Menu Planning', 'Cost Control', 'Training & Development'
];

const productCategories = [
  'Fresh Produce', 'Meat & Poultry', 'Seafood', 'Dairy Products', 'Beverages',
  'Dry Goods', 'Spices & Seasonings', 'Kitchen Equipment', 'Packaging Materials',
  'Cleaning Supplies', 'Uniforms', 'Technology Solutions'
];

export default function ProfileSetupPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<unknown>({});
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'user';

  const steps = getStepsForRole(role);
  const maxSteps = steps.length;

  // Get appropriate schema based on role
  const getSchema = () => {
    switch (role) {
      case 'restaurant': return restaurantSchema;
      case 'employee': return employeeSchema;
      case 'vendor': return vendorSchema;
      default: return userSchema;
    }
  };

  const form = useForm({
    resolver: zodResolver(getSchema()),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      ...getDefaultValues()
    }
  });

  function getDefaultValues() {
    switch (role) {
      case 'restaurant':
        return {
          restaurantName: '',
          cuisine: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          website: '',
          description: '',
          seatingCapacity: 20,
          operatingHours: {
            monday: { open: '09:00', close: '22:00' },
            tuesday: { open: '09:00', close: '22:00' },
            wednesday: { open: '09:00', close: '22:00' },
            thursday: { open: '09:00', close: '22:00' },
            friday: { open: '09:00', close: '23:00' },
            saturday: { open: '09:00', close: '23:00' },
            sunday: { open: '10:00', close: '21:00' },
          }
        };
      case 'employee':
        return {
          experience: '',
          skills: [],
          certifications: [],
          availability: {
            fullTime: false,
            partTime: false,
            weekends: false,
            evenings: false,
          },
          expectedSalary: '',
          resume: '',
        };
      case 'vendor':
        return {
          companyName: '',
          businessType: '',
          products: [],
          address: '',
          city: '',
          state: '',
          zipCode: '',
          website: '',
          description: '',
          minimumOrder: '',
          deliveryRadius: '',
        };
      default:
        return {
          preferences: {
            cuisines: [],
            dietaryRestrictions: [],
          },
          address: '',
          city: '',
          state: '',
          zipCode: '',
        };
    }
  }

  const nextStep = () => {
    if (currentStep < maxSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Profile setup completed successfully!');
      
      // Navigate to appropriate dashboard based on role
      const dashboardRoutes = {
        restaurant: '/restaurant/dashboard',
        employee: '/employee/dashboard',
        vendor: '/vendor/dashboard',
        admin: '/admin/dashboard',
        user: '/dashboard'
      };
      
      router.push(dashboardRoutes[role as keyof typeof dashboardRoutes] || '/dashboard');
    } catch (error) {
      toast.error('Failed to complete profile setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">First Name</label>
                <Input
                  {...form.register('firstName')}
                  placeholder="Enter your first name"
                />
                {form.formState.errors.firstName && (
                  <p className="text-destructive text-sm mt-1">
                    {form.formState.errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Last Name</label>
                <Input
                  {...form.register('lastName')}
                  placeholder="Enter your last name"
                />
                {form.formState.errors.lastName && (
                  <p className="text-destructive text-sm mt-1">
                    {form.formState.errors.lastName.message}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <Input
                {...form.register('phone')}
                placeholder="Enter your phone number"
                type="tel"
              />
              {form.formState.errors.phone && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-32 h-32 bg-muted rounded-full flex items-center justify-center border-2 border-dashed border-border">
                  <Camera className="h-8 w-8 text-muted-foreground" />
                </div>
                <Button
                  type="button"
                  
                  className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0"
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Upload Profile Picture</h3>
              <p className="text-muted-foreground text-sm">
                Add a professional photo to help others recognize you
              </p>
            </div>
            <Button type="button" variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Choose Photo
            </Button>
          </div>
        );

      case 3:
        if (role === 'restaurant') {
          return (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Restaurant Name</label>
                <Input
                  {...form.register('restaurantName')}
                  placeholder="Enter restaurant name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Cuisine Type</label>
                <Select onValueChange={(value) => form.setValue('cuisine', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select cuisine type" />
                  </SelectTrigger>
                  <SelectContent>
                    {cuisineTypes.map((cuisine) => (
                      <SelectItem key={cuisine} value={cuisine.toLowerCase()}>
                        {cuisine}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  {...form.register('description')}
                  placeholder="Describe your restaurant..."
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Seating Capacity</label>
                <Input
                  {...form.register('seatingCapacity', { valueAsNumber: true })}
                  type="number"
                  placeholder="Number of seats"
                />
              </div>
            </div>
          );
        }
        
        if (role === 'employee') {
          return (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Experience Level</label>
                <Select onValueChange={(value) => form.setValue('experience', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry Level (0-1 years)</SelectItem>
                    <SelectItem value="junior">Junior (1-3 years)</SelectItem>
                    <SelectItem value="mid">Mid Level (3-5 years)</SelectItem>
                    <SelectItem value="senior">Senior (5+ years)</SelectItem>
                    <SelectItem value="expert">Expert (10+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Skills</label>
                <div className="grid grid-cols-2 gap-2">
                  {skillOptions.map((skill) => (
                    <label key={skill} className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">{skill}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          );
        }

        if (role === 'vendor') {
          return (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Company Name</label>
                <Input
                  {...form.register('companyName')}
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Business Type</label>
                <Select onValueChange={(value) => form.setValue('businessType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="distributor">Distributor</SelectItem>
                    <SelectItem value="manufacturer">Manufacturer</SelectItem>
                    <SelectItem value="wholesaler">Wholesaler</SelectItem>
                    <SelectItem value="retailer">Retailer</SelectItem>
                    <SelectItem value="service">Service Provider</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  {...form.register('description')}
                  placeholder="Describe your business..."
                  rows={4}
                />
              </div>
            </div>
          );
        }

        // User preferences
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Favorite Cuisines</label>
              <div className="grid grid-cols-2 gap-2">
                {cuisineTypes.map((cuisine) => (
                  <label key={cuisine} className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">{cuisine}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Dietary Restrictions</label>
              <div className="grid grid-cols-2 gap-2">
                {['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Kosher', 'Nut-Free'].map((restriction) => (
                  <label key={restriction} className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">{restriction}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        if (role === 'restaurant') {
          return (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Address</label>
                  <Input
                    {...form.register('address')}
                    placeholder="Street address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">City</label>
                  <Input
                    {...form.register('city')}
                    placeholder="City"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">State</label>
                  <Input
                    {...form.register('state')}
                    placeholder="State"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">ZIP Code</label>
                  <Input
                    {...form.register('zipCode')}
                    placeholder="ZIP Code"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Website (Optional)</label>
                <Input
                  {...form.register('website')}
                  placeholder="https://your-website.com"
                  type="url"
                />
              </div>
            </div>
          );
        }

        if (role === 'employee') {
          return (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Availability</label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span>Full-time positions</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span>Part-time positions</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span>Weekend shifts</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span>Evening shifts</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Expected Salary Range</label>
                <Select onValueChange={(value) => form.setValue('expectedSalary', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select salary range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15-20">$15-20 per hour</SelectItem>
                    <SelectItem value="20-25">$20-25 per hour</SelectItem>
                    <SelectItem value="25-30">$25-30 per hour</SelectItem>
                    <SelectItem value="30-35">$30-35 per hour</SelectItem>
                    <SelectItem value="35+">$35+ per hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        }

        // Address for user
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Address</label>
                <Input
                  {...form.register('address')}
                  placeholder="Street address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">City</label>
                <Input
                  {...form.register('city')}
                  placeholder="City"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">State</label>
                <Input
                  {...form.register('state')}
                  placeholder="State"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">ZIP Code</label>
                <Input
                  {...form.register('zipCode')}
                  placeholder="ZIP Code"
                />
              </div>
            </div>
          </div>
        );

      case maxSteps:
        return (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Almost Done!</h3>
              <p className="text-muted-foreground">
                Review your information and complete your profile setup.
              </p>
            </div>
            <div className="bg-muted p-4 rounded-lg text-left">
              <h4 className="font-medium mb-2">Profile Summary:</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Name: {form.watch('firstName')} {form.watch('lastName')}</p>
                <p>Phone: {form.watch('phone')}</p>
                {role === 'restaurant' && (
                  <p>Restaurant: {form.watch('restaurantName')}</p>
                )}
                {role === 'vendor' && (
                  <p>Company: {form.watch('companyName')}</p>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Complete Your Profile</h1>
          <p className="text-muted-foreground">
            Let's set up your {role} profile to get you started
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={cn(
                    'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                    isCompleted 
                      ? 'bg-primary border-primary text-primary-foreground'
                      : isCurrent
                      ? 'border-primary text-primary'
                      : 'border-muted-foreground text-muted-foreground'
                  )}>
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      'h-0.5 w-12 lg:w-20 mx-2 transition-colors',
                      isCompleted ? 'bg-primary' : 'bg-muted'
                    )} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold">{steps[currentStep - 1]?.title}</h2>
            <p className="text-muted-foreground text-sm">{steps[currentStep - 1]?.description}</p>
          </div>
        </div>

        {/* Main Content */}
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderStepContent()}
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                <div className="text-sm text-muted-foreground">
                  Step {currentStep} of {maxSteps}
                </div>

                {currentStep === maxSteps ? (
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Completing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span>Complete Setup</span>
                        <CheckCircle className="h-4 w-4" />
                      </div>
                    )}
                  </Button>
                ) : (
                  <Button type="button" onClick={nextStep}>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Need help? Contact our support team at{' '}
            <a href="mailto:support@restauranthub.com" className="text-primary hover:underline">
              support@restauranthub.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}