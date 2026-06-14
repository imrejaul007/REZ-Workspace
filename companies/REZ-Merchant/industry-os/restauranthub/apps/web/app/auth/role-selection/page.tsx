'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  User, 
  Building2, 
  Users, 
  Package, 
  Shield,
  ArrowRight,
  CheckCircle,
  Star,
  Briefcase,
  ShoppingBag,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Role {
  id: 'user' | 'restaurant' | 'employee' | 'vendor' | 'admin';
  title: string;
  subtitle: string;
  description: string;
  icon;
  color: string;
  bgColor: string;
  features: string[];
  popular?: boolean;
  recommended?: boolean;
}

const roles: Role[] = [
  {
    id: 'restaurant',
    title: 'Restaurant Owner',
    subtitle: 'Manage your restaurant business',
    description: 'Complete restaurant management platform with staff hiring, inventory, and marketplace access.',
    icon: Building2,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    features: [
      'Hire and manage staff',
      'Menu & inventory management',
      'Order processing & POS',
      'Marketplace access',
      'Analytics & reports'
    ],
    popular: true
  },
  {
    id: 'employee',
    title: 'Job Seeker',
    subtitle: 'Find your next restaurant job',
    description: 'Discover restaurant jobs, build your profile, and connect with employers in the food industry.',
    icon: Users,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    features: [
      'Browse restaurant jobs',
      'Apply with one click',
      'Skills verification',
      'Training & certification',
      'Community networking'
    ],
    recommended: true
  },
  {
    id: 'vendor',
    title: 'Supplier/Vendor',
    subtitle: 'Supply restaurants with quality products',
    description: 'Connect with restaurants, manage orders, and grow your supplier business through our marketplace.',
    icon: Package,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    features: [
      'Product catalog management',
      'Order fulfillment',
      'Inventory tracking',
      'Payment processing',
      'Performance analytics'
    ]
  },
  {
    id: 'user',
    title: 'Customer',
    subtitle: 'Discover and order from restaurants',
    description: 'Browse restaurants, place orders, and enjoy seamless food delivery and pickup experiences.',
    icon: Star,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    features: [
      'Browse restaurants',
      'Place orders online',
      'Track deliveries',
      'Reviews & ratings',
      'Loyalty rewards'
    ]
  },
  {
    id: 'admin',
    title: 'Platform Admin',
    subtitle: 'Manage the entire platform',
    description: 'Full administrative access to manage users, restaurants, vendors, and platform operations.',
    icon: Shield,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
    features: [
      'User management',
      'Platform analytics',
      'Content moderation',
      'System configuration',
      'Compliance oversight'
    ]
  }
];

export default function RoleSelectionPage() {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');

  const handleContinue = async () => {
    if (!selectedRole) {
      toast.error('Please select your role to continue');
      return;
    }

    setIsLoading(true);

    try {
      // Store selected role in session/localStorage
      localStorage.setItem('selectedRole', selectedRole);
      
      // Navigate to signup with role pre-selected
      const signupUrl = new URL('/auth/signup', window.location.origin);
      signupUrl.searchParams.set('role', selectedRole);
      
      if (redirectTo) {
        signupUrl.searchParams.set('redirect', redirectTo);
      }

      router.push(signupUrl.toString());
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl lg:text-5xl font-bold text-foreground mb-4"
          >
            Welcome to{' '}
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              RestoPapa
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Choose your role to get started with the right features and experience tailored for you.
          </motion.p>
        </div>

        {/* Platform Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16"
        >
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg mx-auto mb-3">
              <Building2 className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-foreground">1,500+</p>
            <p className="text-sm text-muted-foreground">Restaurants</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg mx-auto mb-3">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-foreground">25,000+</p>
            <p className="text-sm text-muted-foreground">Job Seekers</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg mx-auto mb-3">
              <Package className="h-6 w-6 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-foreground">800+</p>
            <p className="text-sm text-muted-foreground">Suppliers</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg mx-auto mb-3">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-foreground">$50M+</p>
            <p className="text-sm text-muted-foreground">GMV Processed</p>
          </div>
        </motion.div>

        {/* Role Selection */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
        >
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;
            
            return (
              <motion.div
                key={role.id}
                variants={cardVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className={cn(
                    'relative cursor-pointer transition-all duration-300 hover:shadow-lg',
                    isSelected 
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                      : 'border-border hover:border-primary/30'
                  )}
                  onClick={() => setSelectedRole(role.id)}
                >
                  {/* Badges */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    {role.popular && (
                      <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        Popular
                      </div>
                    )}
                    {role.recommended && (
                      <div className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                        Recommended
                      </div>
                    )}
                  </div>

                  <CardContent className="p-6">
                    {/* Icon and Title */}
                    <div className="flex items-start space-x-4 mb-4">
                      <div className={cn(
                        'p-3 rounded-lg',
                        isSelected ? role.bgColor : 'bg-muted'
                      )}>
                        <Icon className={cn(
                          'h-6 w-6',
                          isSelected ? role.color : 'text-muted-foreground'
                        )} />
                      </div>
                      <div className="flex-1">
                        <h3 className={cn(
                          'font-semibold text-lg',
                          isSelected ? 'text-primary' : 'text-foreground'
                        )}>
                          {role.title}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {role.subtitle}
                        </p>
                      </div>
                      {isSelected && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-muted-foreground text-sm mb-6">
                      {role.description}
                    </p>

                    {/* Features */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-foreground">Key Features:</h4>
                      <ul className="space-y-1">
                        {role.features.map((feature, index) => (
                          <li key={index} className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Action Button */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <Button
            onClick={handleContinue}
            disabled={!selectedRole || isLoading}
            size="lg"
            className="px-8 py-3 text-lg"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Please wait...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>Continue as {selectedRole ? roles.find(r => r.id === selectedRole)?.title : 'Selected Role'}</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            )}
          </Button>
          
          <p className="text-sm text-muted-foreground mt-4">
            Already have an account?{' '}
            <button 
              onClick={() => router.push('/auth/login')}
              className="text-primary hover:text-primary/80 font-medium"
            >
              Sign in here
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}