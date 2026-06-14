'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  ArrowLeft,
  Mail,
  Phone,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

async function apiFetch(path: string, options?: RequestInit) {
  const base = typeof window !== 'undefined' ? '/api/proxy' : process.env.NEXT_PUBLIC_API_URL + '/api/v1';
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
  return data;
}

export default function OTPVerificationPage() {
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const phone = searchParams.get('phone') || '';
  const type = searchParams.get('type') || 'email';
  const purpose = searchParams.get('purpose') || 'signup';
  const identifier = type === 'email' ? email : phone;

  // Countdown timer
  useEffect(() => {
    const id = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const handleOTPChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newOTP = [...otpCode];
    newOTP[index] = value;
    setOtpCode(newOTP);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const navigateAfterSuccess = () => {
    if (purpose === 'signup') {
      router.push('/auth/profile-setup');
    } else if (purpose === 'reset') {
      router.push('/auth/reset-password');
    } else {
      router.push('/dashboard');
    }
  };

  const handleVerify = async () => {
    const code = otpCode.join('');

    if (code.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }

    if (!identifier) {
      toast.error('Missing identifier — cannot verify OTP');
      return;
    }

    setIsLoading(true);

    try {
      await apiFetch('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ identifier, code, purpose }),
      });
      toast.success('Verification successful!');
      setTimeout(navigateAfterSuccess, 1000);
    } catch (err) {
      toast.error(err?.message || 'Invalid verification code. Please try again.');
      setOtpCode(['', '', '', '', '', '']);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || !identifier) return;

    setIsLoading(true);
    try {
      await apiFetch('/auth/otp/send', {
        method: 'POST',
        body: JSON.stringify({ identifier, purpose }),
      });
      toast.success(`New verification code sent to your ${type}`);
      setCountdown(60);
      setOtpCode(['', '', '', '', '', '']);
    } catch (err) {
      toast.error(err?.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  {type === 'email' ? (
                    <Mail className="h-8 w-8 text-primary" />
                  ) : (
                    <Phone className="h-8 w-8 text-primary" />
                  )}
                </div>
              </div>
              <CardTitle className="text-2xl">Verify Your {type === 'email' ? 'Email' : 'Phone'}</CardTitle>
              <p className="text-muted-foreground text-sm mt-2">
                We have sent a 6-digit verification code to
              </p>
              <p className="font-medium text-foreground">
                {type === 'email' ? email : phone}
              </p>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* OTP Input */}
              <div>
                <label className="block text-sm font-medium mb-4 text-center">
                  Enter Verification Code
                </label>
                <div className="flex space-x-2 justify-center">
                  {otpCode.map((digit, index) => (
                    <input
                      key={`otp-${index}`}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOTPChange(index, e.target.value)}
                      onKeyDown={(e) => handleOTPKeyDown(index, e)}
                      className="w-12 h-12 text-center text-lg font-medium border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  ))}
                </div>
                <p className="text-center text-xs text-muted-foreground mt-2">
                  Enter the 6-digit code sent to your {type}
                </p>
              </div>

              {/* Verify Button */}
              <Button
                onClick={handleVerify}
                disabled={isLoading || otpCode.join('').length !== 6}
                className="w-full"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Verify Code</span>
                    <CheckCircle className="h-4 w-4" />
                  </div>
                )}
              </Button>

              {/* Resend */}
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  Did not receive the code?
                </p>
                <Button
                  onClick={handleResend}
                  disabled={countdown > 0 || isLoading || !identifier}
                  variant="outline"
                >
                  {countdown > 0 ? (
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>Resend in {countdown}s</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <RefreshCw className="h-4 w-4" />
                      <span>Resend Code</span>
                    </div>
                  )}
                </Button>
              </div>

              {/* Back Button */}
              <Button
                onClick={() => router.back()}
                variant="ghost"
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
