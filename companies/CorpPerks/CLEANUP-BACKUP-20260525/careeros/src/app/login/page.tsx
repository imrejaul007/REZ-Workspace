'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Demo login - just redirect to dashboard
    setTimeout(() => {
      router.push('/dashboard');
    }, 1000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <div className={styles.branding}>
          <div className={styles.logo}>CareerOS</div>
          <h1>Welcome back</h1>
          <p>Your AI-powered career acceleration platform</p>
        </div>

        <div className={styles.features}>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>📄</span>
            <div>
              <h3>AI Resume Builder</h3>
              <p>Create ATS-optimized resumes in minutes</p>
            </div>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>🎯</span>
            <div>
              <h3>Interview Coach</h3>
              <p>Practice with AI-powered mock interviews</p>
            </div>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>🌐</span>
            <div>
              <h3>Hyperlocal Marketplace</h3>
              <p>Connect with nearby skilled individuals</p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.formContainer}>
          <h2>Sign in to CareerOS</h2>

          <div className={styles.socialButtons}>
            <button className={styles.socialBtn}>
              <span>G</span>
              Continue with Google
            </button>
            <button className={styles.socialBtn}>
              <span>in</span>
              Continue with LinkedIn
            </button>
          </div>

          <div className={styles.divider}>
            <span>or sign in with email</span>
          </div>

          <form onSubmit={handleSubmit}>
            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.formGroup}>
              <label>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className={styles.formOptions}>
              <label className={styles.remember}>
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <Link href="/forgot-password" className={styles.forgot}>
                Forgot password?
              </Link>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className={styles.signup}>
            Don't have an account? <Link href="/signup">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
