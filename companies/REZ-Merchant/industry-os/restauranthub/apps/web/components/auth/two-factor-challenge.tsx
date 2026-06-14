'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Smartphone, 
  ArrowLeft,
  AlertCircle,
  Loader2,
  CheckCircle2
} from 'lucide-react';

interface TwoFactorChallengeProps {
  email: string;
  onSubmit: (token: string) => Promise<void>;
  onBack: () => void;
  loading?: boolean;
  error?: string;
}

export function TwoFactorChallenge({ 
  email, 
  onSubmit, 
  onBack, 
  loading = false, 
  error 
}: TwoFactorChallengeProps) {
  const [twoFactorToken, setTwoFactorToken] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (twoFactorToken.length !== 6) {
      return;
    }
    
    await onSubmit(twoFactorToken);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-primary/10 rounded-full">
            <Shield className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl">Two-Factor Authentication</CardTitle>
        <CardDescription>
          Enter the 6-digit code from your authenticator app to complete your login
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center text-sm text-muted-foreground">
          Signing in as: <strong>{email}</strong>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="twoFactorToken">Authentication Code</Label>
            <Input
              id="twoFactorToken"
              placeholder="Enter 6-digit code"
              value={twoFactorToken}
              onChange={(e) => e.target.value}
              maxLength={6}
              className="text-center text-lg font-mono tracking-widest"
              disabled={loading}
              autoComplete="one-time-code"
              autoFocus
            />
            <p className="text-xs text-muted-foreground text-center">
              Open your authenticator app and enter the 6-digit code
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || twoFactorToken.length !== 6}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Complete Login
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onBack}
              disabled={loading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Don't have access to your authenticator?{' '}
            <button className="text-primary hover:underline">
              Use backup code
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}