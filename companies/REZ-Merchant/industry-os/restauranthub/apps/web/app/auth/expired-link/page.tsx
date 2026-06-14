'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Mail,
  Clock,
  Shield,
  Home,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import toast from 'react-hot-toast';

export default function ExpiredLinkPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'reset'; // reset, verify, invite
  const email = searchParams.get('email') || '';

  const handleResendLink = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success(`New ${getLinkTypeText()} link sent to your email`);
    } catch (error) {
      toast.error('Failed to send new link. Please try again.');
    }
  };

  const getLinkTypeText = () => {
    switch (type) {
      case 'verify':
        return 'email verification';
      case 'invite':
        return 'invitation';
      case 'reset':
      default:
        return 'password reset';
    }
  };

  const getRedirectPath = () => {
    switch (type) {
      case 'verify':
        return '/auth/signup';
      case 'invite':
        return '/auth/signup';
      case 'reset':
      default:
        return '/auth/forgot-password';
    }
  };

  const commonIssues = [
    {
      icon: Clock,
      title: 'Link Expired',
      description: 'Security links expire after 24 hours for your protection'
    },
    {
      icon: Mail,
      title: 'Already Used',
      description: 'Links can only be used once for security reasons'
    },
    {
      icon: AlertTriangle,
      title: 'Invalid Format',
      description: 'The link may have been corrupted during copy/paste'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-background to-red-50 dark:from-orange-950/20 dark:via-background dark:to-red-950/20 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                  <AlertTriangle className="h-12 w-12 text-orange-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-orange-700 dark:text-orange-400">
                Link Expired or Invalid
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                The {getLinkTypeText()} link you clicked is no longer valid
              </p>
            </CardHeader>
            
            <CardContent className="p-6 space-y-6">
              {/* Error Details */}
              <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/10">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800 dark:text-orange-200">
                  This {getLinkTypeText()} link has expired or has already been used. 
                  For security reasons, these links are only valid for 24 hours.
                </AlertDescription>
              </Alert>

              {/* Common Issues */}
              <div>
                <h3 className="font-medium mb-4 flex items-center space-x-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  <span>Common Causes</span>
                </h3>
                <div className="grid gap-3">
                  {commonIssues.map((issue, index) => {
                    const Icon = issue.icon;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-start space-x-3 p-3 border border-border rounded-lg"
                      >
                        <div className="p-2 bg-muted rounded-lg">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm mb-1">{issue.title}</h4>
                          <p className="text-xs text-muted-foreground">{issue.description}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                <Button
                  onClick={handleResendLink}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Request New Link</span>
                </Button>
                <Button
                  onClick={() => router.push(getRedirectPath())}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Start Over</span>
                </Button>
              </div>

              {/* Alternative Actions */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-sm mb-3">Alternative Options</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    onClick={() => router.push('/auth/login')}
                    variant="ghost"
                    
                    className="justify-start"
                  >
                    Try signing in instead
                  </Button>
                  <Button
                    onClick={() => router.push('/')}
                    variant="ghost"
                    
                    className="justify-start"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Back to homepage
                  </Button>
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">Security First</p>
                    <p className="text-xs">
                      Links expire automatically to protect your account. If you continue to have issues, 
                      please contact our support team for assistance.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground mb-2">
            Still having trouble? We're here to help.
          </p>
          <div className="flex justify-center space-x-4">
            <a 
              href="mailto:support@restauranthub.com" 
              className="text-primary hover:underline text-sm"
            >
              Email Support
            </a>
            <span className="text-muted-foreground">•</span>
            <a 
              href="/support" 
              className="text-primary hover:underline text-sm"
            >
              Help Center
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}