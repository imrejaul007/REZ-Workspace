'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Mail, Clock, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AccountLocked() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason') || 'multiple_failed_attempts';
  const [emailSent, setEmailSent] = useState(false);

  const reasons = {
    multiple_failed_attempts: {
      title: 'Account Temporarily Locked',
      description: 'Your account has been locked due to multiple failed login attempts.',
      duration: '30 minutes',
      canUnlock: true
    },
    suspicious_activity: {
      title: 'Account Suspended',
      description: 'We detected suspicious activity on your account.',
      duration: 'Until reviewed',
      canUnlock: false
    },
    policy_violation: {
      title: 'Account Restricted',
      description: 'Your account has been restricted due to policy violations.',
      duration: 'Pending review',
      canUnlock: false
    }
  };

  const lockInfo = reasons[reason as keyof typeof reasons] || reasons.multiple_failed_attempts;

  const handleRequestUnlock = async () => {
    setEmailSent(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-900">
              {lockInfo.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription>
                {lockInfo.description}
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-sm">
                <Clock className="h-4 w-4 text-gray-500" />
                <div>
                  <span className="text-gray-600">Lock Duration: </span>
                  <span className="font-semibold">{lockInfo.duration}</span>
                </div>
              </div>

              {reason === 'multiple_failed_attempts' && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">What happened?</h3>
                  <p className="text-sm text-blue-800">
                    We detected multiple failed login attempts on your account. 
                    This security measure protects your account from unauthorized access.
                  </p>
                </div>
              )}

              {lockInfo.canUnlock && (
                <div className="space-y-3">
                  {!emailSent ? (
                    <Button 
                      onClick={handleRequestUnlock}
                      className="w-full"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Send Unlock Request
                    </Button>
                  ) : (
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <Mail className="h-5 w-5 text-green-600 mx-auto mb-2" />
                      <p className="text-sm text-green-800">
                        Unlock request sent! Check your email for instructions.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {!lockInfo.canUnlock && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-900 mb-2">Need help?</h3>
                  <p className="text-sm text-yellow-800 mb-3">
                    Please contact our support team for assistance with your account.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/support/create')}
                    className="w-full"
                  >
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                </div>
              )}
            </div>

            <div className="text-center">
              <Button 
                variant="ghost"
                onClick={() => router.push('/auth/login')}
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}