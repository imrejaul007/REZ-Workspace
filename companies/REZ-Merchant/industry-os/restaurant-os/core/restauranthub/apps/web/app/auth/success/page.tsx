'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Mail, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function AuthSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'registration';
  const email = searchParams.get('email') || 'user@example.com';

  const messages = {
    registration: {
      title: 'Welcome to RestoPapa!',
      description: 'Your account has been created successfully.',
      nextStep: 'Please check your email to verify your account.'
    },
    verification: {
      title: 'Email Verified!',
      description: 'Your email has been successfully verified.',
      nextStep: 'You can now access all features of RestoPapa.'
    },
    password_reset: {
      title: 'Password Updated!',
      description: 'Your password has been successfully changed.',
      nextStep: 'You can now log in with your new password.'
    }
  };

  const message = messages[type as keyof typeof messages] || messages.registration;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {message.title}
            </h1>
            <p className="text-gray-600 mb-4">
              {message.description}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              {message.nextStep}
            </p>

            {type === 'registration' && (
              <div className="bg-blue-50 p-4 rounded-lg mb-6 text-left">
                <div className="flex items-center mb-2">
                  <Mail className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-900">Verification email sent</span>
                </div>
                <p className="text-xs text-blue-700">
                  We sent a verification link to <strong>{email}</strong>
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Button 
                onClick={() => router.push('/dashboard')}
                className="w-full"
              >
                Continue to Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              
              {type === 'registration' && (
                <Button 
                  variant="outline"
                  onClick={() => router.push('/auth/login')}
                  className="w-full"
                >
                  Sign In Instead
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}