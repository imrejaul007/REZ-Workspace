'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  AlertCircle, 
  Mail, 
  Loader2, 
  ArrowRight,
  RefreshCw 
} from 'lucide-react';
import { authApi } from '@/lib/api/auth-api';
import { useAuth } from '@/lib/auth/auth-provider';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else {
      setVerificationStatus('error');
      setMessage('Invalid verification link');
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await authApi.verifyEmail(verificationToken);
      
      if (response.error) {
        if (response.error.includes('expired')) {
          setVerificationStatus('expired');
          setMessage('Verification link has expired');
        } else {
          setVerificationStatus('error');
          setMessage(response.error);
        }
      } else {
        setVerificationStatus('success');
        setMessage(response.data?.message || 'Email verified successfully!');
        
        // Redirect after successful verification
        setTimeout(() => {
          if (user) {
            const dashboardMap = {
              admin: '/admin/dashboard',
              restaurant: '/restaurant/dashboard',
              employee: '/employee/dashboard',
              vendor: '/vendor/dashboard'
            };
            router.push(dashboardMap[user.role] || '/dashboard');
          } else {
            router.push('/auth/login');
          }
        }, 3000);
      }
    } catch (error) {
      setVerificationStatus('error');
      setMessage('Verification failed. Please try again.');
    }
  };

  const resendVerificationEmail = async () => {
    if (!user) {
      setMessage('Please log in to resend verification email');
      return;
    }

    setIsResending(true);
    
    try {
      const response = await authApi.resendVerificationEmail();
      
      if (response.error) {
        setMessage(response.error);
      } else {
        setMessage('Verification email sent! Please check your inbox.');
      }
    } catch (error) {
      setMessage('Failed to resend verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    switch (verificationStatus) {
      case 'loading':
        return (
          <>
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-primary/10 rounded-full">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              </div>
            </div>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Verifying Email</CardTitle>
              <CardDescription>
                Please wait while we verify your email address...
              </CardDescription>
            </CardHeader>
          </>
        );

      case 'success':
        return (
          <>
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-green-100 dark:bg-green-900 rounded-full">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-green-600">Email Verified!</CardTitle>
              <CardDescription>
                Your email has been successfully verified. You will be redirected shortly.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Alert className="mb-4">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
              <p className="text-sm text-muted-foreground">
                Redirecting you to your dashboard...
              </p>
            </CardContent>
          </>
        );

      case 'expired':
        return (
          <>
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-orange-100 dark:bg-orange-900 rounded-full">
                <AlertCircle className="h-12 w-12 text-orange-600" />
              </div>
            </div>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-orange-600">Link Expired</CardTitle>
              <CardDescription>
                Your verification link has expired. Request a new one below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
              
              {user ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Click the button below to receive a new verification email at{' '}
                    <strong>{user.email}</strong>
                  </p>
                  
                  <Button
                    onClick={resendVerificationEmail}
                    disabled={isResending}
                    className="w-full"
                    size="lg"
                  >
                    {isResending ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Sending...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="h-4 w-4" />
                        <span>Resend Verification Email</span>
                      </div>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Please log in to resend the verification email.
                  </p>
                  
                  <Button
                    onClick={() => router.push('/auth/login')}
                    className="w-full"
                    size="lg"
                  >
                    <div className="flex items-center space-x-2">
                      <ArrowRight className="h-4 w-4" />
                      <span>Go to Login</span>
                    </div>
                  </Button>
                </div>
              )}
            </CardContent>
          </>
        );

      case 'error':
      default:
        return (
          <>
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-red-100 dark:bg-red-900 rounded-full">
                <AlertCircle className="h-12 w-12 text-red-600" />
              </div>
            </div>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-red-600">Verification Failed</CardTitle>
              <CardDescription>
                There was an issue verifying your email address.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 gap-3">
                {user && (
                  <Button
                    onClick={resendVerificationEmail}
                    disabled={isResending}
                    variant="outline"
                    size="lg"
                  >
                    {isResending ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Sending...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <span>Resend Verification</span>
                      </div>
                    )}
                  </Button>
                )}
                
                <Button
                  onClick={() => router.push('/auth/login')}
                  size="lg"
                >
                  <div className="flex items-center space-x-2">
                    <ArrowRight className="h-4 w-4" />
                    <span>Back to Login</span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        {renderContent()}
      </Card>
    </div>
  );
}