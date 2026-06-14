'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  CheckCircle,
  ArrowRight,
  Mail,
  Lock,
  Shield,
  Home,
  Calendar,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ResetConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || 'user@example.com';
  const timestamp = new Date().toLocaleString();

  const securityTips = [
    {
      icon: Lock,
      title: 'Use a Strong Password',
      description: 'Include uppercase, lowercase, numbers, and special characters'
    },
    {
      icon: Shield,
      title: 'Enable Two-Factor Authentication',
      description: 'Add an extra layer of security to your account'
    },
    {
      icon: Clock,
      title: 'Regular Updates',
      description: 'Update your password regularly for better security'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-background to-green-50 dark:from-green-950/20 dark:via-background dark:to-green-950/20 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-full">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-green-700 dark:text-green-400">
                Password Reset Successful!
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                Your password has been successfully updated
              </p>
            </CardHeader>
            
            <CardContent className="p-6 space-y-6">
              {/* Success Details */}
              <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-green-800 dark:text-green-200 mb-1">
                      Account Updated
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                      Password reset confirmation sent to: <strong>{email}</strong>
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-green-600 dark:text-green-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{timestamp}</span>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200">
                        Verified
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Tips */}
              <div>
                <h3 className="font-medium mb-4 flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <span>Security Best Practices</span>
                </h3>
                <div className="grid gap-4">
                  {securityTips.map((tip, index) => {
                    const Icon = tip.icon;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-start space-x-3 p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm mb-1">{tip.title}</h4>
                          <p className="text-xs text-muted-foreground">{tip.description}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                <Button
                  onClick={() => router.push('/auth/login')}
                  className="flex items-center space-x-2"
                >
                  <span>Sign In Now</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => router.push('/')}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Home className="h-4 w-4" />
                  <span>Back to Home</span>
                </Button>
              </div>

              {/* Additional Info */}
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">Your Account is Secure</p>
                    <p className="text-xs">
                      If you didn't request this password reset, please contact our support team immediately. 
                      All password changes are logged for security purposes.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
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