'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ChefHat,
  Mail,
  ArrowLeft,
  Send,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { authApi } from '@/lib/api/auth';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await authApi.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>
              We've sent password reset instructions to:
            </CardDescription>
          </CardHeader>
          
          <CardContent className="text-center">
            <p className="font-medium text-lg mb-4">{email}</p>
            <p className="text-sm text-muted-foreground mb-6">
              Click the link in the email to reset your password. 
              If you don't see the email, check your spam folder.
            </p>
            
            <div className="space-y-4">
              <Button
                onClick={() => router.push('/auth/login')}
                className="w-full"
                size="lg"
              >
                Back to Login
              </Button>
              
              <Button
                onClick={() => {
                  setSubmitted(false);
                  setEmail('');
                }}
                variant="outline"
                className="w-full"
              >
                Try different email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <ChefHat className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Forgot your password?</CardTitle>
          <CardDescription>
            No worries! Enter your email and we'll send you reset instructions.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  className="pl-10"
                  placeholder="you@example.com"
                  required
                  autoFocus
                />
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>Sending...</>
              ) : (
                <>
                  Send Reset Email
                  <Send className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <Link href="/auth/login" className="w-full">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Login
            </Button>
          </Link>
          
          <p className="text-sm text-muted-foreground text-center">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}