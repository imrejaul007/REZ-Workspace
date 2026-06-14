'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function LoginPage() {
  const [loginMethod, setLoginMethod] = useState<'otp' | 'password'>('otp');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'input' | 'otp-verify'>('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStep('otp-verify');
    } catch {
      setError('Failed to send OTP. Please try again.');
    }
    setLoading(false);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      window.location.href = '/dashboard';
    } catch {
      setError('Invalid OTP. Please try again.');
    }
    setLoading(false);
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      window.location.href = '/dashboard';
    } catch {
      setError('Invalid credentials. Please try again.');
    }
    setLoading(false);
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  const handleLinkedInLogin = () => {
    window.location.href = '/api/auth/linkedin';
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <span>🎓</span>
          <h1>Insight Campus</h1>
        </div>

        <p className={styles.subtitle}>
          Sign in to your student account
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <button
            onClick={() => { setLoginMethod('password'); setError(''); }}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: loginMethod === 'password' ? '#10b981' : '#f3f4f6',
              color: loginMethod === 'password' ? 'white' : '#374151',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: 14
            }}
          >
            Email / Password
          </button>
          <button
            onClick={() => { setLoginMethod('otp'); setError(''); }}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: loginMethod === 'otp' ? '#10b981' : '#f3f4f6',
              color: loginMethod === 'otp' ? 'white' : '#374151',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: 14
            }}
          >
            Phone OTP
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <button onClick={handleGoogleLogin} className={styles.socialBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>
          <button onClick={handleLinkedInLogin} className={styles.socialBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            LinkedIn
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
          <span style={{ padding: '0 16px', color: '#6b7280', fontSize: 14 }}>or</span>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
        </div>

        {error && (
          <div style={{ padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 14, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {loginMethod === 'password' ? (
          <form onSubmit={handlePasswordLogin} className={styles.form}>
            <div className={styles.inputGroup}>
              <label>Email</label>
              <input
                type="email"
                placeholder="your.email@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div style={{ textAlign: 'right', marginBottom: 16 }}>
              <Link href="/auth/forgot-password" style={{ fontSize: 14, color: '#10b981' }}>
                Forgot password?
              </Link>
            </div>
            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : step === 'input' ? (
          <form onSubmit={handleSendOTP} className={styles.form}>
            <div className={styles.inputGroup}>
              <label>Phone Number</label>
              <div className={styles.phoneInput}>
                <span className={styles.code}>+91</span>
                <input
                  type="tel"
                  placeholder="Enter phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={10}
                />
              </div>
            </div>
            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className={styles.form}>
            <div className={styles.inputGroup}>
              <label>Enter OTP</label>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className={styles.otpInput}
                autoFocus
              />
              <span style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                OTP sent to +91 {phone}
              </span>
            </div>
            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            <button type="button" className={styles.link} onClick={() => setStep('input')}>
              Change number
            </button>
            <button type="button" className={styles.link} onClick={() => {
              setStep('input');
              setOtp('');
            }}>
              Resend OTP
            </button>
          </form>
        )}

        <p className={styles.footer}>
          New here? <Link href="/auth/signup">Create account</Link>
        </p>
      </div>
    </div>
  );
}
