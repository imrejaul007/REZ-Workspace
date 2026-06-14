'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  Mail,
  Chrome,
  Facebook,
  Github,
  Shield,
  Smartphone,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface SocialProvider {
  id: string;
  name: string;
  icon;
  color: string;
  bgColor: string;
  description: string;
  available: boolean;
}

const socialProviders: SocialProvider[] = [
  {
    id: 'google',
    name: 'Google',
    icon: Chrome,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
    description: 'Continue with your Google account',
    available: true
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    description: 'Continue with your Facebook account',
    available: true
  },
  {
    id: 'apple',
    name: 'Apple',
    icon: Shield,
    color: 'text-gray-900 dark:text-gray-100',
    bgColor: 'bg-gray-100 dark:bg-gray-800/20',
    description: 'Continue with your Apple ID',
    available: true
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: Github,
    color: 'text-gray-900 dark:text-gray-100',
    bgColor: 'bg-gray-100 dark:bg-gray-800/20',
    description: 'Continue with your GitHub account',
    available: false
  }
];

export default function SocialLoginPage() {
  const [isLoading, setIsLoading] = useState('');
  const [step, setStep] = useState<'providers' | 'processing' | 'success' | 'error'>('providers');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [error, setError] = useState<string>('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'user';
  const redirectTo = searchParams.get('redirect');

  const handleSocialLogin = async (providerId: string) => {
    setIsLoading(providerId);
    setSelectedProvider(providerId);
    setStep('processing');
    setError('');

    try {
      // Initiate OAuth flow via backend — opens provider's auth page
      const res = await fetch('/api/proxy/auth/social/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ provider: providerId, role, redirect: redirectTo }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'OAuth initiation failed');

      // Redirect to the OAuth provider's authorization URL
      if (json.authorizationUrl) {
        window.location.href = json.authorizationUrl;
      } else {
        throw new Error('No authorization URL received from server');
      }
    } catch (err) {
      const message = err?.message || 'Login failed';
      setError(message);
      setStep('error');
      toast.error(message);
    } finally {
      setIsLoading('');
    }
  };

  const handleRetry = () => {
    setStep('providers');
    setError('');
    setSelectedProvider('');
  };

  const handleBackToLogin = () => {
    router.push('/auth/login');
  };

  const renderProviders = () => (
    <div className="space-y-4">
      {socialProviders.map((provider) => {
        const Icon = provider.icon;
        const isDisabled = !provider.available || isLoading === provider.id;
        
        return (
          <motion.div
            key={provider.id}
            whileHover={{ scale: provider.available ? 1.02 : 1 }}
            whileTap={{ scale: provider.available ? 0.98 : 1 }}
          >
            <Button
              onClick={() => provider.available && handleSocialLogin(provider.id)}
              disabled={isDisabled}
              variant="outline"
              className={cn(
                'w-full p-4 h-auto border-2 transition-all duration-200',
                provider.available 
                  ? 'hover:border-primary/30 hover:bg-accent/50' 
                  : 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex items-center space-x-4 w-full">
                <div className={cn(
                  'p-2 rounded-lg',
                  provider.bgColor
                )}>
                  <Icon className={cn('h-6 w-6', provider.color)} />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-foreground">
                    Continue with {provider.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {provider.description}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {!provider.available && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      Coming Soon
                    </span>
                  )}
                  {provider.available && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </Button>
          </motion.div>
        );
      })}
    </div>
  );

  const renderProcessing = () => (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className={cn(
          'p-4 rounded-full',
          socialProviders.find(p => p.id === selectedProvider)?.bgColor
        )}>
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">
          Connecting to {socialProviders.find(p => p.id === selectedProvider)?.name}
        </h3>
        <p className="text-muted-foreground">
          Please complete the authentication in the popup window...
        </p>
      </div>
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">Security Notice</p>
            <p>We use industry-standard OAuth 2.0 for secure authentication. Your credentials are never stored on our servers.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/20">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Successfully Connected!</h3>
        <p className="text-muted-foreground">
          You've been successfully authenticated with {socialProviders.find(p => p.id === selectedProvider)?.name}.
          Redirecting you to your dashboard...
        </p>
      </div>
      <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Redirecting...</span>
      </div>
    </div>
  );

  const renderError = () => (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/20">
          <AlertCircle className="h-12 w-12 text-red-600" />
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Authentication Failed</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <div className="text-sm text-red-800 dark:text-red-200">
            <p className="font-medium mb-2">Common issues:</p>
            <ul className="text-left space-y-1 list-disc list-inside">
              <li>Pop-up was blocked by your browser</li>
              <li>Third-party cookies are disabled</li>
              <li>Network connectivity issues</li>
              <li>Account access restrictions</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={handleRetry} variant="outline">
          Try Again
        </Button>
        <Button onClick={handleBackToLogin}>
          Back to Login
        </Button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (step) {
      case 'processing':
        return renderProcessing();
      case 'success':
        return renderSuccess();
      case 'error':
        return renderError();
      default:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-2">Choose Your Preferred Method</h3>
              <p className="text-muted-foreground">
                Sign in quickly and securely with your existing social account
              </p>
            </div>
            
            {renderProviders()}
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={() => router.push('/auth/login')}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Mail className="h-4 w-4" />
                <span>Email</span>
              </Button>
              <Button 
                onClick={() => router.push('/auth/otp-login')}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Smartphone className="h-4 w-4" />
                <span>Phone</span>
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome to{' '}
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              RestoPapa
            </span>
          </h1>
          <p className="text-muted-foreground">
            Sign in to your {role} account
          </p>
        </div>

        {/* Main Card */}
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Social Sign In</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </CardContent>
        </Card>

        {/* Footer */}
        {step === 'providers' && (
          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <button 
                onClick={() => router.push('/auth/signup')}
                className="text-primary hover:text-primary/80 font-medium"
              >
                Sign up here
              </button>
            </p>
          </div>
        )}
        
        {/* Security Notice */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-start space-x-3">
            <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Privacy & Security</p>
              <p>Your data is protected with enterprise-grade security. We never share your information with third parties.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}