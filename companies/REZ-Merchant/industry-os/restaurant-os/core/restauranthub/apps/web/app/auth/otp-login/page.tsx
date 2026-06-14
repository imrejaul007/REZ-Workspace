'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { 
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Mail,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Shield,
  Clock,
  Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const phoneSchema = z.object({
  countryCode: z.string().min(1, 'Country code is required'),
  phoneNumber: z.string().min(10, 'Valid phone number is required'),
});

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type PhoneForm = z.infer<typeof phoneSchema>;
type EmailForm = z.infer<typeof emailSchema>;

interface CountryCode {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
}

const countryCodes: CountryCode[] = [
  { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44' },
  { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49' },
  { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', dialCode: '+81' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', dialCode: '+82' },
  { code: 'CN', name: 'China', flag: '🇨🇳', dialCode: '+86' },
];

export default function OTPLoginPage() {
  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [contactInfo, setContactInfo] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');

  const phoneForm = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      countryCode: '+1',
      phoneNumber: ''
    }
  });

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: ''
    }
  });

  // Countdown timer for resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendOTP = async (data: PhoneForm | EmailForm) => {
    setIsLoading(true);

    try {
      const payload = method === 'phone'
        ? { phone: `${(data as PhoneForm).countryCode}${(data as PhoneForm).phoneNumber}`, type: 'phone' }
        : { email: (data as EmailForm).email, type: 'email' };

      const res = await fetch('/api/proxy/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to send OTP');

      if (method === 'phone') {
        const phoneData = data as PhoneForm;
        setContactInfo(`${phoneData.countryCode} ${phoneData.phoneNumber}`);
        toast.success(`OTP sent to ${phoneData.countryCode} ${phoneData.phoneNumber}`);
      } else {
        const emailData = data as EmailForm;
        setContactInfo(emailData.email);
        toast.success(`OTP sent to ${emailData.email}`);
      }

      setStep('verify');
      setCountdown(60);
    } catch (err) {
      toast.error(err?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const otp = otpCode.join('');

    if (otp.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/proxy/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ identifier: contactInfo, code: otp }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Invalid OTP code');

      toast.success('Successfully verified! Logging you in...');

      setTimeout(() => {
        const destination = redirectTo || '/dashboard';
        router.push(destination);
      }, 1000);
    } catch (err) {
      toast.error(err?.message || 'Verification failed');
      setOtpCode(['', '', '', '', '', '']);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setIsLoading(true);

    try {
      const res = await fetch('/api/proxy/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ identifier: contactInfo }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to resend OTP');

      toast.success(`New OTP sent to ${contactInfo}`);
      setCountdown(60);
      setOtpCode(['', '', '', '', '', '']);
    } catch (err) {
      toast.error(err?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newOTP = [...otpCode];
    newOTP[index] = value;
    setOtpCode(newOTP);
    
    // Auto-focus next input
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

  const renderInputStep = () => (
    <div className="space-y-6">
      {/* Method Selection */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
        <button
          onClick={() => setMethod('phone')}
          className={cn(
            'p-3 rounded-md transition-all text-sm font-medium',
            method === 'phone'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <div className="flex items-center justify-center space-x-2">
            <Smartphone className="h-4 w-4" />
            <span>Phone</span>
          </div>
        </button>
        <button
          onClick={() => setMethod('email')}
          className={cn(
            'p-3 rounded-md transition-all text-sm font-medium',
            method === 'email'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <div className="flex items-center justify-center space-x-2">
            <Mail className="h-4 w-4" />
            <span>Email</span>
          </div>
        </button>
      </div>

      {/* Phone Form */}
      {method === 'phone' && (
        <form onSubmit={phoneForm.handleSubmit(handleSendOTP)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Phone Number</label>
            <div className="flex space-x-2">
              <Select 
                value={phoneForm.watch('countryCode')}
                onValueChange={(value) => phoneForm.setValue('countryCode', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countryCodes.map((country) => (
                    <SelectItem key={country.code} value={country.dialCode}>
                      <div className="flex items-center space-x-2">
                        <span>{country.flag}</span>
                        <span>{country.dialCode}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex-1">
                <Input
                  {...phoneForm.register('phoneNumber')}
                  placeholder="Enter your phone number"
                  type="tel"
                />
              </div>
            </div>
            {phoneForm.formState.errors.phoneNumber && (
              <p className="text-destructive text-sm mt-1 flex items-center space-x-1">
                <AlertCircle className="h-4 w-4" />
                <span>{phoneForm.formState.errors.phoneNumber.message}</span>
              </p>
            )}
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Sending...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>Send OTP</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            )}
          </Button>
        </form>
      )}

      {/* Email Form */}
      {method === 'email' && (
        <form onSubmit={emailForm.handleSubmit(handleSendOTP)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email Address</label>
            <Input
              {...emailForm.register('email')}
              placeholder="Enter your email address"
              type="email"
            />
            {emailForm.formState.errors.email && (
              <p className="text-destructive text-sm mt-1 flex items-center space-x-1">
                <AlertCircle className="h-4 w-4" />
                <span>{emailForm.formState.errors.email.message}</span>
              </p>
            )}
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Sending...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>Send OTP</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            )}
          </Button>
        </form>
      )}

      {/* Alternative Methods */}
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
          <span>Password</span>
        </Button>
        <Button 
          onClick={() => router.push('/auth/social-login')}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <Shield className="h-4 w-4" />
          <span>Social</span>
        </Button>
      </div>
    </div>
  );

  const renderVerifyStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            {method === 'phone' ? (
              <Phone className="h-8 w-8 text-primary" />
            ) : (
              <Mail className="h-8 w-8 text-primary" />
            )}
          </div>
        </div>
        <h3 className="text-lg font-semibold mb-2">Verify Your {method === 'phone' ? 'Phone' : 'Email'}</h3>
        <p className="text-muted-foreground text-sm">
          We've sent a 6-digit verification code to
        </p>
        <p className="font-medium text-foreground">{contactInfo}</p>
      </div>

      {/* OTP Input */}
      <div>
        <label className="block text-sm font-medium mb-4 text-center">Enter Verification Code</label>
        <div className="flex space-x-2 justify-center">
          {otpCode.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => e.target.value}
              onKeyDown={(e) => handleOTPKeyDown(index, e)}
              className="w-12 h-12 text-center text-lg font-medium border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-2">
          Enter the 6-digit code sent to your {method}
        </p>
      </div>

      {/* Verify Button */}
      <Button 
        onClick={handleVerifyOTP} 
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
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">
          Didn't receive the code?
        </p>
        <Button
          onClick={handleResendOTP}
          disabled={countdown > 0 || isLoading}
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
        onClick={() => setStep('input')}
        variant="ghost"
        className="w-full"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Change {method === 'phone' ? 'Phone Number' : 'Email'}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome Back
          </h1>
          <p className="text-muted-foreground">
            Sign in with OTP verification
          </p>
        </div>

        {/* Main Card */}
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">
              {step === 'input' ? 'Enter Your Details' : 'Verify Code'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: step === 'verify' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {step === 'input' ? renderInputStep() : renderVerifyStep()}
            </motion.div>
          </CardContent>
        </Card>

        {/* Footer */}
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

      </div>
    </div>
  );
}