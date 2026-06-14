'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Loader2,
  User,
  Building2,
  Users,
  Package,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/auth-provider';
import { TwoFactorChallenge } from '@/components/auth/two-factor-challenge';

const API_BASE = '/api/proxy';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'restaurant', 'employee', 'vendor'], {
    required_error: 'Please select your role'
  }),
  rememberMe: z.boolean().optional()
});

type LoginForm = z.infer<typeof loginSchema>;

interface DemoAccount {
  role: 'admin' | 'restaurant' | 'employee' | 'vendor';
  email: string;
  password: string;
  name: string;
  description: string;
  icon;
  color: string;
  bgColor: string;
}

const DEMO_PASSWORD = 'RestoPapa@123';

const demoAccounts: DemoAccount[] = [
  {
    role: 'admin',
    email: 'admin@restopapa.dev',
    password: DEMO_PASSWORD,
    name: 'Platform Admin',
    description: 'Full platform access with user management',
    icon: User,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900'
  },
  {
    role: 'restaurant',
    email: 'restaurant@restopapa.dev',
    password: DEMO_PASSWORD,
    name: 'Restaurant Owner',
    description: 'Manage staff, orders, and marketplace',
    icon: Building2,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900'
  },
  {
    role: 'employee',
    email: 'employee@restopapa.dev',
    password: DEMO_PASSWORD,
    name: 'Job Seeker',
    description: 'Search jobs and manage applications',
    icon: Users,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900'
  },
  {
    role: 'vendor',
    email: 'vendor@restopapa.dev',
    password: DEMO_PASSWORD,
    name: 'Supplier/Vendor',
    description: 'Manage inventory and process orders',
    icon: Package,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900'
  }
];

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);
  const [loginData, setLoginData] = useState<LoginForm | null>(null);
  const [showRezModal, setShowRezModal] = useState(false);
  const [rezToken, setRezToken] = useState('');
  const [rezLoading, setRezLoading] = useState(false);
  const [rezError, setRezError] = useState('');
  const { login, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  });

  const onSubmit = async (data: LoginForm) => {
    setLoginError('');

    try {
      await login(data.email, data.password, data.role);
      
      // Login function handles redirect, but check for custom redirect
      if (redirectTo && !redirectTo.includes('/auth/')) {
        router.push(redirectTo);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      
      // Check if error is related to 2FA requirement
      if (message.includes('2FA') || message.includes('two-factor') || message.includes('authentication required')) {
        setLoginData(data);
        setNeedsTwoFactor(true);
      } else {
        setLoginError(message);
      }
    }
  };

  const handleTwoFactorSubmit = async (twoFactorToken: string) => {
    if (!loginData) return;

    try {
      await login(loginData.email, loginData.password, loginData.role, twoFactorToken);
      
      // Login successful, redirect
      if (redirectTo && !redirectTo.includes('/auth/')) {
        router.push(redirectTo);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '2FA verification failed. Please try again.';
      setLoginError(message);
    }
  };

  const handleBackToLogin = () => {
    setNeedsTwoFactor(false);
    setLoginData(null);
    setLoginError('');
  };

  const handleRezLogin = async () => {
    if (!rezToken.trim()) return;
    setRezLoading(true);
    setRezError('');
    try {
      const res = await fetch(`${API_BASE}/auth/rez-bridge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ rezToken: rezToken.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'REZ authentication failed');
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
      }
      setShowRezModal(false);
      router.push('/restaurant/dashboard');
    } catch (err: unknown) {
      setRezError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setRezLoading(false);
    }
  };

  const fillDemoCredentials = (account: DemoAccount) => {
    form.setValue('email', account.email);
    form.setValue('password', account.password);
    form.setValue('role', account.role);
    setSelectedRole(account.role);
    setLoginError('');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4" role="main">
      {needsTwoFactor ? (
        <TwoFactorChallenge
          email={loginData?.email || ''}
          onSubmit={handleTwoFactorSubmit}
          onBack={handleBackToLogin}
          loading={isLoading}
          error={loginError}
        />
      ) : (
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

        {/* Left Side - Branding */}
        <section className="text-center lg:text-left" aria-labelledby="branding-title">
          <header className="mb-8">
            <h1 id="branding-title" className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Welcome to
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent block">
                RestoPapa
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg" role="doc-subtitle">
              The all-in-one platform connecting restaurants, employees, and suppliers in the food industry.
            </p>
          </header>

          {/* Features */}
          <div className="space-y-4 mb-8" role="list" aria-label="Platform features">
            <div className="flex items-center space-x-3" role="listitem">
              <CheckCircle className="h-5 w-5 text-success-500" aria-hidden="true" />
              <span className="text-muted-foreground">Streamlined hiring process</span>
            </div>
            <div className="flex items-center space-x-3" role="listitem">
              <CheckCircle className="h-5 w-5 text-success-500" aria-hidden="true" />
              <span className="text-muted-foreground">Integrated marketplace</span>
            </div>
            <div className="flex items-center space-x-3" role="listitem">
              <CheckCircle className="h-5 w-5 text-success-500" aria-hidden="true" />
              <span className="text-muted-foreground">Real-time collaboration</span>
            </div>
          </div>
        </section>

        {/* Right Side - Login Form */}
        <section aria-labelledby="login-title">
          <Card className="shadow-2xl border-0">
            <CardHeader className="text-center pb-6">
              <CardTitle id="login-title" className="text-2xl font-bold">Sign In</CardTitle>
              <CardDescription>
                Choose your role and enter your credentials
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Role Selection */}
              <fieldset className="space-y-3">
                <legend className="text-sm font-medium text-foreground">Select Your Role</legend>
                <div
                  className="grid grid-cols-2 gap-3"
                  role="radiogroup"
                  aria-labelledby="role-legend"
                  aria-required="true"
                >
                  {demoAccounts.map((account) => {
                    const Icon = account.icon;
                    const isSelected = selectedRole === account.role;

                    return (
                      <button
                        key={account.role}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        aria-describedby={`role-${account.role}-description`}
                        onClick={() => {
                          setSelectedRole(account.role);
                          form.setValue('role', account.role);
                        }}
                        className={cn(
                          'p-3 border rounded-lg transition-all text-left hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                          isSelected
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                            : 'border-border'
                        )}
                      >
                        <div className="flex items-center space-x-2">
                          <div className={cn(
                            'p-1.5 rounded',
                            isSelected ? account.bgColor : 'bg-muted'
                          )}>
                            <Icon
                              className={cn(
                                'h-4 w-4',
                                isSelected ? account.color : 'text-muted-foreground'
                              )}
                              aria-hidden="true"
                            />
                          </div>
                          <span className={cn(
                            'font-medium text-sm',
                            isSelected ? 'text-primary' : 'text-foreground'
                          )}>
                            {account.name}
                          </span>
                        </div>
                        <span
                          id={`role-${account.role}-description`}
                          className="sr-only"
                        >
                          {account.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {form.formState.errors.role && (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="text-sm text-destructive flex items-center space-x-1"
                  >
                    <AlertCircle className="h-4 w-4" aria-hidden="true" />
                    <span>{form.formState.errors.role.message}</span>
                  </div>
                )}
              </fieldset>

              {/* Login Form */}
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
                {/* Email Input */}
                <div className="space-y-2">
                  <label
                    htmlFor="email-input"
                    className="text-sm font-medium text-foreground"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <input
                      {...form.register('email')}
                      id="email-input"
                      type="email"
                      autoComplete="email"
                      placeholder="Enter your email"
                      aria-invalid={!!form.formState.errors.email}
                      aria-describedby={form.formState.errors.email ? 'email-error' : undefined}
                      className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  {form.formState.errors.email && (
                    <div
                      id="email-error"
                      role="alert"
                      aria-live="polite"
                      className="text-sm text-destructive flex items-center space-x-1"
                    >
                      <AlertCircle className="h-4 w-4" aria-hidden="true" />
                      <span>{form.formState.errors.email.message}</span>
                    </div>
                  )}
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <label
                    htmlFor="password-input"
                    className="text-sm font-medium text-foreground"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <input
                      {...form.register('password')}
                      id="password-input"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      aria-invalid={!!form.formState.errors.password}
                      aria-describedby={`${form.formState.errors.password ? 'password-error' : ''} password-toggle-description`.trim()}
                      className="w-full pl-10 pr-12 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-describedby="password-toggle-description"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                    <span id="password-toggle-description" className="sr-only">
                      Toggle password visibility
                    </span>
                  </div>
                  {form.formState.errors.password && (
                    <div
                      id="password-error"
                      role="alert"
                      aria-live="polite"
                      className="text-sm text-destructive flex items-center space-x-1"
                    >
                      <AlertCircle className="h-4 w-4" aria-hidden="true" />
                      <span>{form.formState.errors.password.message}</span>
                    </div>
                  )}
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      {...form.register('rememberMe')}
                      id="remember-me"
                      type="checkbox"
                      className="rounded border-border focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    />
                    <span className="text-sm text-muted-foreground">Remember me</span>
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-primary hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Error Message */}
                {loginError && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
                  >
                    <p className="text-sm text-destructive flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4" aria-hidden="true" />
                      <span>{loginError}</span>
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  aria-describedby={isLoading ? 'loading-status' : undefined}
                  className="w-full py-2.5 font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      <span>Signing in...</span>
                      <span id="loading-status" className="sr-only">
                        Please wait, signing you in
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <span>Sign In</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </div>
                  )}
                </Button>
              </form>

              {/* Demo Accounts */}
              <section className="space-y-3" aria-labelledby="demo-accounts-title">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span
                      id="demo-accounts-title"
                      className="bg-background px-2 text-muted-foreground"
                    >
                      Quick Access Demo Accounts
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2" role="list" aria-labelledby="demo-accounts-title">
                  {demoAccounts.map((account) => {
                    const Icon = account.icon;
                    const isSelected = selectedRole === account.role;

                    return (
                      <button
                        key={account.role}
                        type="button"
                        role="listitem"
                        onClick={() => fillDemoCredentials(account)}
                        aria-label={`Fill demo credentials for ${account.name}`}
                        className={cn(
                          'flex items-center justify-between p-3 border rounded-lg transition-colors text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-accent/50'
                        )}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-1.5 rounded ${account.bgColor}`} aria-hidden="true">
                            <Icon className={`h-4 w-4 ${account.color}`} aria-hidden="true" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{account.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{account.email}</p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                          {isSelected ? '✓ filled' : 'click to use'}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-center text-muted-foreground">Password: <span className="font-mono">RestoPapa@123</span></p>
              </section>

              {/* REZ Merchant SSO */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { setShowRezModal(true); setRezError(''); setRezToken(''); }}
                className="flex items-center justify-center space-x-2 w-full py-2.5 px-4 border border-orange-300 rounded-lg bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/30 dark:border-orange-800 dark:hover:bg-orange-950/50 transition-colors text-sm font-medium text-orange-700 dark:text-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              >
                <span className="text-orange-500 font-bold text-base">₹</span>
                <span>Sign in with REZ Merchant Account</span>
              </button>

              {/* REZ Token Modal */}
              {showRezModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowRezModal(false)}>
                  <div className="bg-background rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold">Sign in with REZ</h2>
                      <button onClick={() => setShowRezModal(false)} className="text-muted-foreground hover:text-foreground">
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Copy your JWT from the REZ Merchant app (Settings → Developer → API Token) and paste it below.
                    </p>
                    <textarea
                      value={rezToken}
                      onChange={e => setRezToken(e.target.value)}
                      placeholder="Paste your REZ JWT token here…"
                      rows={4}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    {rezError && (
                      <p className="text-sm text-destructive flex items-center space-x-1">
                        <AlertCircle className="h-4 w-4" />
                        <span>{rezError}</span>
                      </p>
                    )}
                    <Button
                      onClick={handleRezLogin}
                      disabled={rezLoading || !rezToken.trim()}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      {rezLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {rezLoading ? 'Verifying…' : 'Authenticate with REZ'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Sign Up Link */}
              <nav className="text-center" role="navigation" aria-label="Account registration">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <Link
                    href="/auth/signup"
                    className="text-primary hover:text-primary/80 font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded underline-offset-4 hover:underline"
                  >
                    Sign up here
                  </Link>
                </p>
              </nav>
            </CardContent>
          </Card>
        </section>
        </div>
      )}
    </main>
  );
}