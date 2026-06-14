'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import styles from './page.module.css';

export default function PeopleOSLogin() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);

    if (!result.success) {
      setError(result.error || 'Login failed');
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_REZ_AUTH_URL || 'https://rez-auth-service.onrender.com'}/api/auth/google?callback=${window.location.origin}/auth/callback`;
  };

  const handleMicrosoftLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_REZ_AUTH_URL || 'https://rez-auth-service.onrender.com'}/api/auth/microsoft?callback=${window.location.origin}/auth/callback`;
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <span>🧠</span>
          <h1>PeopleOS</h1>
        </div>

        <p className={styles.subtitle}>Sign in to manage your workforce</p>

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Business Email</label>
            <input
              type="email"
              placeholder="admin@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className={styles.forgot}>
            <a href="/auth/forgot-password">Forgot password?</a>
          </div>

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className={styles.divider}>
          <span>or continue with</span>
        </div>

        <div className={styles.social}>
          <button type="button" onClick={handleGoogleLogin} className={styles.socialBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>
          <button type="button" onClick={handleMicrosoftLogin} className={styles.socialBtn}>
            <svg width="18" height="18" viewBox="0 0 23 23">
              <path fill="#f25022" d="M1 1h10v10H1z"/>
              <path fill="#00a4ef" d="M1 12h10v10H1z"/>
              <path fill="#7fba00" d="M12 1h10v10H12z"/>
              <path fill="#ffb900" d="M12 12h10v10H12z"/>
            </svg>
            Microsoft
          </button>
        </div>

        <p className={styles.footer}>
          Don&apos;t have an account? <a href="/auth/signup">Get started</a>
        </p>
      </div>
    </div>
  );
}
