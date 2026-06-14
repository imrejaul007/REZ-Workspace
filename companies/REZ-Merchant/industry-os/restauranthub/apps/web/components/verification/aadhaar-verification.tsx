'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, XCircle, Shield, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VerificationBadge } from './verification-badge';
import { cn } from '@/lib/utils';

interface AadhaarVerificationProps {
  currentStatus?: {
    status: 'NOT_INITIATED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
    verificationId?: string;
    matchScore?: number;
    verifiedAt?: string;
    attempts?: number;
  };
  onInitiateVerification: (data: {
    aadhaarNumber: string;
    name: string;
    dateOfBirth?: string;
    address?: string;
    phone?: string;
  }) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export function AadhaarVerification({
  currentStatus = { status: 'NOT_INITIATED' },
  onInitiateVerification,
  isLoading = false,
  className
}: AadhaarVerificationProps) {
  const [showForm, setShowForm] = useState(false);
  const [showAadhaar, setShowAadhaar] = useState(false);
  const [formData, setFormData] = useState({
    aadhaarNumber: '',
    name: '',
    dateOfBirth: '',
    address: '',
    phone: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Aadhaar number validation (12 digits)
    if (!formData.aadhaarNumber) {
      newErrors.aadhaarNumber = 'Aadhaar number is required';
    } else if (!/^\d{12}$/.test(formData.aadhaarNumber.replace(/\s/g, ''))) {
      newErrors.aadhaarNumber = 'Aadhaar number must be 12 digits';
    }

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Date of birth validation (optional but format check if provided)
    if (formData.dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(formData.dateOfBirth)) {
      newErrors.dateOfBirth = 'Date must be in YYYY-MM-DD format';
    }

    // Phone validation (optional but format check if provided)
    if (formData.phone && !/^\+?[\d\s-]{10,15}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await onInitiateVerification({
        ...formData,
        aadhaarNumber: formData.aadhaarNumber.replace(/\s/g, '') // Remove spaces
      });
      setShowForm(false);
    } catch (error) {
      console.error('Verification failed:', error);
    }
  };

  const formatAadhaarNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Add spaces every 4 digits
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAadhaarNumber(e.target.value);
    if (formatted.replace(/\s/g, '').length <= 12) {
      setFormData(prev => ({ ...prev, aadhaarNumber: formatted }));
    }
  };

  const getStatusIcon = () => {
    switch (currentStatus.status) {
      case 'VERIFIED':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'PENDING':
        return <Clock className="h-6 w-6 text-yellow-600" />;
      case 'REJECTED':
        return <XCircle className="h-6 w-6 text-red-600" />;
      default:
        return <Shield className="h-6 w-6 text-gray-400" />;
    }
  };

  const getStatusMessage = () => {
    switch (currentStatus.status) {
      case 'VERIFIED':
        return {
          title: 'Aadhaar Verified Successfully',
          description: `Verified on ${currentStatus.verifiedAt ? new Date(currentStatus.verifiedAt).toLocaleDateString() : 'recently'}`,
          color: 'text-green-600'
        };
      case 'PENDING':
        return {
          title: 'Verification in Progress',
          description: 'Your Aadhaar verification is being processed. This may take a few minutes.',
          color: 'text-yellow-600'
        };
      case 'REJECTED':
        return {
          title: 'Verification Failed',
          description: 'Aadhaar verification failed. Please check your details and try again.',
          color: 'text-red-600'
        };
      default:
        return {
          title: 'Aadhaar Verification Required',
          description: 'Verify your Aadhaar to complete your profile and unlock job applications.',
          color: 'text-gray-600'
        };
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <CardTitle className="text-lg">{statusInfo.title}</CardTitle>
              <p className={cn('text-sm', statusInfo.color)}>{statusInfo.description}</p>
            </div>
          </div>
          <VerificationBadge status={currentStatus.status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Verification Details */}
        {currentStatus.status !== 'NOT_INITIATED' && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            {currentStatus.verificationId && (
              <div>
                <p className="text-xs text-muted-foreground">Verification ID</p>
                <p className="text-sm font-mono">{currentStatus.verificationId}</p>
              </div>
            )}
            {currentStatus.matchScore !== undefined && (
              <div>
                <p className="text-xs text-muted-foreground">Match Score</p>
                <p className="text-sm font-semibold">{currentStatus.matchScore}%</p>
              </div>
            )}
            {currentStatus.attempts !== undefined && (
              <div>
                <p className="text-xs text-muted-foreground">Attempts</p>
                <p className="text-sm">{currentStatus.attempts}/3</p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {currentStatus.status === 'NOT_INITIATED' || currentStatus.status === 'REJECTED' ? (
            <Button
              onClick={() => setShowForm(true)}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  {currentStatus.status === 'REJECTED' ? 'Retry Verification' : 'Start Verification'}
                </>
              )}
            </Button>
          ) : currentStatus.status === 'PENDING' ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-1">
              <Clock className="h-4 w-4" />
              Verification in progress... Please wait
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-green-600 flex-1">
              <CheckCircle className="h-4 w-4" />
              Aadhaar verified successfully
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800">
              <p className="font-medium mb-1">Secure Verification</p>
              <p>Your Aadhaar details are encrypted and used only for verification. We comply with all data protection regulations.</p>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Verification Form Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-background rounded-lg shadow-lg"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Aadhaar Verification</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                    ×
                  </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Aadhaar Number *
                    </label>
                    <div className="relative">
                      <input
                        type={showAadhaar ? 'text' : 'password'}
                        value={formData.aadhaarNumber}
                        onChange={handleAadhaarChange}
                        placeholder="1234 5678 9012"
                        className={cn(
                          'w-full px-3 py-2 pr-10 border rounded-lg bg-background font-mono',
                          errors.aadhaarNumber ? 'border-red-500' : 'border-border'
                        )}
                        maxLength={14} // 12 digits + 2 spaces
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAadhaar(!showAadhaar)}
                        className="absolute right-1 top-1 h-8 w-8 p-0"
                      >
                        {showAadhaar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.aadhaarNumber && (
                      <p className="text-red-500 text-xs mt-1">{errors.aadhaarNumber}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Full Name (as on Aadhaar) *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="John Doe"
                      className={cn(
                        'w-full px-3 py-2 border rounded-lg bg-background',
                        errors.name ? 'border-red-500' : 'border-border'
                      )}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Date of Birth (Optional)
                    </label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      className={cn(
                        'w-full px-3 py-2 border rounded-lg bg-background',
                        errors.dateOfBirth ? 'border-red-500' : 'border-border'
                      )}
                    />
                    {errors.dateOfBirth && (
                      <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+91 98765 43210"
                      className={cn(
                        'w-full px-3 py-2 border rounded-lg bg-background',
                        errors.phone ? 'border-red-500' : 'border-border'
                      )}
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                    )}
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-yellow-800">
                        <p className="font-medium mb-1">Important</p>
                        <p>Ensure all details match exactly with your Aadhaar card. Mismatched information will result in verification failure.</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                          Verifying...
                        </>
                      ) : (
                        'Verify Aadhaar'
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Card>
  );
}