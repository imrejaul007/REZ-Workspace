'use client';

import React, { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Mail, RefreshCw, CheckCircle2 } from 'lucide-react';
import { authApi } from '@/lib/api/auth-api';
import { useAuth } from '@/lib/auth/auth-provider';
import { toast } from 'react-hot-toast';

interface EmailVerificationAlertProps {
  className?: string;
}

export function EmailVerificationAlert({ className }: EmailVerificationAlertProps) {
  const { user } = useAuth();
  const [isResending, setIsResending] = useState(false);

  // Don't show if user is already verified
  if (!user || user.isVerified) {
    return null;
  }

  const resendVerificationEmail = async () => {
    setIsResending(true);
    
    try {
      const response = await authApi.resendVerificationEmail();
      
      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success('Verification email sent! Please check your inbox.');
      }
    } catch (error) {
      toast.error('Failed to resend verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <span className="font-medium">Email not verified</span>
          <p className="text-sm mt-1">
            Please verify your email address ({user.email}) to access all features.
          </p>
        </div>
        <Button
          variant="outline"
          
          onClick={resendVerificationEmail}
          disabled={isResending}
          className="ml-4"
        >
          {isResending ? (
            <>
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="h-3 w-3 mr-1" />
              Resend Email
            </>
          )}
        </Button>
      </AlertDescription>
    </Alert>
  );
}

// Success message component for when verification is complete
export function EmailVerificationSuccess() {
  const { user } = useAuth();

  if (!user || !user.isVerified) {
    return null;
  }

  return (
    <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
      <CheckCircle2 className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-800 dark:text-green-200">
        <span className="font-medium">Email verified successfully!</span>
        <p className="text-sm mt-1">
          Your email address has been verified and your account is fully active.
        </p>
      </AlertDescription>
    </Alert>
  );
}