'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  ChefHat,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Shield,
  X
} from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Password strength
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset.');
    }
  }, [token]);

  useEffect(() => {
    // Check password strength
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*]/.test(password)
    };
    
    setPasswordChecks(checks);
    
    const strength = Object.values(checks).filter(Boolean).length;
    setPasswordStrength(strength * 20);
  }, [password]);

  const getPasswordStrengthLabel = () => {
    if (passwordStrength <= 20) return { label: 'Very Weak', color: 'bg-red-500' };
    if (passwordStrength <= 40) return { label: 'Weak', color: 'bg-orange-500' };
    if (passwordStrength <= 60) return { label: 'Fair', color: 'bg-yellow-500' };
    if (passwordStrength <= 80) return { label: 'Good', color: 'bg-blue-500' };
    return { label: 'Strong', color: 'bg-green-500' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Invalid reset token');
      return;
    }
    
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (passwordStrength < 60) {
      setError('Please choose a stronger password');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, always succeed
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (err) {
      setError('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">Password Reset Successful!</CardTitle>
            <CardDescription>
              Your password has been successfully reset.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-6">
              You can now login with your new password. 
              Redirecting to login page...
            </p>
            
            <Progress value={100} className="mb-6" />
            
            <Link href="/auth/login">
              <Button className="w-full" size="lg" variant="default">
                Go to Login
              </Button>
            </Link>
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
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Reset your password</CardTitle>
          <CardDescription>
            Enter your new password below
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
            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  placeholder="Enter new password"
                  required
                  disabled={!token}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            {/* Password Strength Indicator */}
            {password && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Password strength:</span>
                  <span className="font-medium">{getPasswordStrengthLabel().label}</span>
                </div>
                <Progress value={passwordStrength} className={`h-2 ${getPasswordStrengthLabel().color}`} />
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center space-x-1">
                    {passwordChecks.length ? (
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    ) : (
                      <X className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span className={passwordChecks.length ? 'text-green-600' : 'text-muted-foreground'}>
                      8+ characters
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {passwordChecks.uppercase ? (
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    ) : (
                      <X className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span className={passwordChecks.uppercase ? 'text-green-600' : 'text-muted-foreground'}>
                      Uppercase letter
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {passwordChecks.lowercase ? (
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    ) : (
                      <X className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span className={passwordChecks.lowercase ? 'text-green-600' : 'text-muted-foreground'}>
                      Lowercase letter
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {passwordChecks.number ? (
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    ) : (
                      <X className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span className={passwordChecks.number ? 'text-green-600' : 'text-muted-foreground'}>
                      Number
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {passwordChecks.special ? (
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                    ) : (
                      <X className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span className={passwordChecks.special ? 'text-green-600' : 'text-muted-foreground'}>
                      Special character
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10"
                  placeholder="Confirm new password"
                  required
                  disabled={!token}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}
            </div>
            
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading || !token}
             variant="default">
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="text-center">
          <p className="text-sm text-muted-foreground w-full">
            Remember your password?{' '}
            <Link href="/auth/login" className="text-primary hover:underline font-medium">
              Back to Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}