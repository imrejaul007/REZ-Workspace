'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ChefHat, 
  Store, 
  Package, 
  Briefcase, 
  User,
  Mail,
  Lock,
  Phone,
  Building,
  MapPin,
  FileText,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-provider';
import { authApi } from '@/lib/api/auth';
import { SignUpRequest } from '@/types/auth';

interface SignupFormData {
  // Common fields
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  acceptTerms: boolean;
  
  // Role-specific fields
  role: 'restaurant' | 'vendor' | 'employee' | 'customer';
  
  // Restaurant fields
  restaurantName?: string;
  restaurantAddress?: string;
  restaurantCity?: string;
  restaurantState?: string;
  restaurantZip?: string;
  fssaiNumber?: string;
  gstNumber?: string;
  
  // Vendor fields
  businessName?: string;
  businessType?: string;
  businessAddress?: string;
  panNumber?: string;
  
  // Employee fields
  firstName?: string;
  lastName?: string;
  skills?: string;
  experience?: string;
  
  // Customer fields
  fullName?: string;
  deliveryAddress?: string;
}

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    acceptTerms: false,
    role: 'customer'
  });

  // Set role from URL params if provided
  useEffect(() => {
    const role = searchParams.get('role') as SignupFormData['role'] | null;
    if (role && ['restaurant', 'vendor', 'employee', 'customer'].includes(role)) {
      setFormData(prev => ({ ...prev, role }));
    }
  }, [searchParams]);

  const roleIcons = {
    restaurant: Store,
    vendor: Package,
    employee: Briefcase,
    customer: User
  };

  const roleDescriptions = {
    restaurant: 'Manage your restaurant, menu, orders, and grow your business',
    vendor: 'Supply products to restaurants and manage B2B transactions',
    employee: 'Find jobs, manage your profile, and grow your career',
    customer: 'Order food, track deliveries, and enjoy great dining'
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateStep1 = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword || !formData.phone) {
      setError('Please fill in all required fields');
      return false;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (!/^[0-9]{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }
    
    if (!formData.acceptTerms) {
      setError('Please accept the terms and conditions');
      return false;
    }
    
    return true;
  };

  const validateStep2 = () => {
    switch (formData.role) {
      case 'restaurant':
        if (!formData.restaurantName || !formData.restaurantAddress || !formData.restaurantCity) {
          setError('Please fill in all required restaurant details');
          return false;
        }
        break;
      case 'vendor':
        if (!formData.businessName || !formData.businessType || !formData.businessAddress) {
          setError('Please fill in all required business details');
          return false;
        }
        break;
      case 'employee':
        if (!formData.firstName || !formData.lastName) {
          setError('Please fill in your name');
          return false;
        }
        break;
      case 'customer':
        if (!formData.fullName) {
          setError('Please enter your full name');
          return false;
        }
        break;
    }
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep2()) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Prepare signup data
      const signupData = {
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone,
        acceptTerms: formData.acceptTerms,
        
        // Role-specific data
        ...(formData.role === 'restaurant' && {
          firstName: 'Restaurant',
          lastName: 'Owner',
          restaurantName: formData.restaurantName,
          restaurantAddress: formData.restaurantAddress,
          restaurantCity: formData.restaurantCity,
          restaurantState: formData.restaurantState,
          fssaiNumber: formData.fssaiNumber,
          gstNumber: formData.gstNumber,
        }),
        
        ...(formData.role === 'vendor' && {
          firstName: 'Vendor',
          lastName: 'Owner',
          businessName: formData.businessName,
          businessType: formData.businessType,
          businessAddress: formData.businessAddress,
          panNumber: formData.panNumber,
        }),
        
        ...(formData.role === 'employee' && {
          firstName: formData.firstName,
          lastName: formData.lastName,
          skills: formData.skills,
          experience: formData.experience,
        }),
        
        ...(formData.role === 'customer' && {
          firstName: formData.fullName?.split(' ')[0] || '',
          lastName: formData.fullName?.split(' ').slice(1).join(' ') || '',
          deliveryAddress: formData.deliveryAddress,
        }),
      };
      
      const result = await authApi.signUp(signupData as SignUpRequest);

      // Store tokens and redirect to dashboard
      if (result?.accessToken) {
        localStorage.setItem('accessToken', result.accessToken);
        if (result.refreshToken) {
          localStorage.setItem('refreshToken', result.refreshToken);
        }
      }

      const dashboardPaths: Record<string, string> = {
        restaurant: '/restaurant/dashboard',
        vendor: '/vendor/dashboard',
        employee: '/employee/dashboard',
        customer: '/dashboard',
      };
      router.push(dashboardPaths[formData.role] || '/dashboard');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Signup failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderRoleSpecificFields = () => {
    switch (formData.role) {
      case 'restaurant':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="restaurantName">Restaurant Name *</Label>
              <Input
                id="restaurantName"
                name="restaurantName"
                value={formData.restaurantName || ''}
                onChange={handleInputChange}
                placeholder="Enter your restaurant name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="restaurantAddress">Address *</Label>
              <Input
                id="restaurantAddress"
                name="restaurantAddress"
                value={formData.restaurantAddress || ''}
                onChange={handleInputChange}
                placeholder="Street address"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="restaurantCity">City *</Label>
                <Input
                  id="restaurantCity"
                  name="restaurantCity"
                  value={formData.restaurantCity || ''}
                  onChange={handleInputChange}
                  placeholder="City"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="restaurantState">State *</Label>
                <Input
                  id="restaurantState"
                  name="restaurantState"
                  value={formData.restaurantState || ''}
                  onChange={handleInputChange}
                  placeholder="State"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fssaiNumber">FSSAI License Number</Label>
              <Input
                id="fssaiNumber"
                name="fssaiNumber"
                value={formData.fssaiNumber || ''}
                onChange={handleInputChange}
                placeholder="14-digit FSSAI number (optional)"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gstNumber">GST Number</Label>
              <Input
                id="gstNumber"
                name="gstNumber"
                value={formData.gstNumber || ''}
                onChange={handleInputChange}
                placeholder="15-character GST number (optional)"
              />
            </div>
          </>
        );
        
      case 'vendor':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                name="businessName"
                value={formData.businessName || ''}
                onChange={handleInputChange}
                placeholder="Enter your business name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="businessType">Business Type *</Label>
              <Select 
                value={formData.businessType || ''} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, businessType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manufacturer">Manufacturer</SelectItem>
                  <SelectItem value="distributor">Distributor</SelectItem>
                  <SelectItem value="wholesaler">Wholesaler</SelectItem>
                  <SelectItem value="farmer">Farmer/Producer</SelectItem>
                  <SelectItem value="importer">Importer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="businessAddress">Business Address *</Label>
              <Input
                id="businessAddress"
                name="businessAddress"
                value={formData.businessAddress || ''}
                onChange={handleInputChange}
                placeholder="Complete business address"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="panNumber">PAN Number</Label>
              <Input
                id="panNumber"
                name="panNumber"
                value={formData.panNumber || ''}
                onChange={handleInputChange}
                placeholder="10-character PAN (optional)"
              />
            </div>
          </>
        );
        
      case 'employee':
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName || ''}
                  onChange={handleInputChange}
                  placeholder="First name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName || ''}
                  onChange={handleInputChange}
                  placeholder="Last name"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="skills">Skills</Label>
              <Input
                id="skills"
                name="skills"
                value={formData.skills || ''}
                onChange={handleInputChange}
                placeholder="e.g., Chef, Waiter, Manager"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="experience">Years of Experience</Label>
              <Select 
                value={formData.experience || ''} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, experience: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select experience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fresher">Fresher</SelectItem>
                  <SelectItem value="1-2">1-2 years</SelectItem>
                  <SelectItem value="3-5">3-5 years</SelectItem>
                  <SelectItem value="5-10">5-10 years</SelectItem>
                  <SelectItem value="10+">10+ years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
        
      case 'customer':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName || ''}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="deliveryAddress">Delivery Address</Label>
              <Input
                id="deliveryAddress"
                name="deliveryAddress"
                value={formData.deliveryAddress || ''}
                onChange={handleInputChange}
                placeholder="Default delivery address (optional)"
              />
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <ChefHat className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Create your RestoPapa account</CardTitle>
          <CardDescription>
            {step === 1 ? 'Choose your role and set up your account' : 'Complete your profile information'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                1
              </div>
              <div className={`w-24 h-1 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                2
              </div>
            </div>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 ? (
              <>
                {/* Role Selection */}
                <div className="space-y-2">
                  <Label>Select your role *</Label>
                  <Tabs value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                    <TabsList className="grid grid-cols-4 w-full">
                      <TabsTrigger value="restaurant">Restaurant</TabsTrigger>
                      <TabsTrigger value="vendor">Vendor</TabsTrigger>
                      <TabsTrigger value="employee">Employee</TabsTrigger>
                      <TabsTrigger value="customer">Customer</TabsTrigger>
                    </TabsList>
                    <TabsContent value={formData.role} className="mt-4">
                      <div className="flex items-start space-x-3 p-4 border rounded-lg bg-muted/50">
                        {React.createElement(roleIcons[formData.role], { className: "h-5 w-5 text-primary mt-0.5" })}
                        <p className="text-sm text-muted-foreground">
                          {roleDescriptions[formData.role]}
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
                
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-10"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>
                
                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="pl-10"
                      placeholder="9876543210"
                      required
                    />
                  </div>
                </div>
                
                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleInputChange}
                      className="pl-10 pr-10"
                      placeholder="Minimum 8 characters"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                
                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="pl-10 pr-10"
                      placeholder="Re-enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                
                {/* Terms */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.acceptTerms}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, acceptTerms: checked === true }))}
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I agree to the{' '}
                    <Link href="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
                
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full"
                  size="lg"
                >
                  Continue
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </>
            ) : (
              <>
                {/* Step 2: Role-specific fields */}
                {renderRoleSpecificFields()}
                
                <div className="flex space-x-4">
                  <Button
                    type="button"
                    onClick={() => setStep(1)}
                    variant="outline"
                    className="flex-1"
                    size="lg"
                  >
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Back
                  </Button>
                  
                  <Button
                    type="submit"
                    className="flex-1"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>Creating Account...</>
                    ) : (
                      <>
                        Complete Signup
                        <CheckCircle2 className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </form>
        </CardContent>
        
        <CardFooter className="text-center">
          <p className="text-sm text-muted-foreground w-full">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}