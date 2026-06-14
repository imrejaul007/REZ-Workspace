'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from '../login/page.module.css';

export default function SignupPage() {
  const [step, setStep] = useState<'basic' | 'verify' | 'complete'>('basic');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    college: '',
    course: '',
    year: '',
  });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setStep('verify');
    setLoading(false);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setStep('complete');
    setLoading(false);
  };

  const handleGoogleSignup = () => {
    window.location.href = '/api/auth/google';
  };

  const handleLinkedInSignup = () => {
    window.location.href = '/api/auth/linkedin';
  };

  if (step === 'verify') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.logo}>
            <span>🎓</span>
            <h1>Verify Email</h1>
          </div>

          <p className={styles.subtitle}>
            We sent a verification code to {formData.email}
          </p>

          <form onSubmit={handleVerifyOTP} className={styles.form}>
            <div className={styles.inputGroup}>
              <label>Enter OTP</label>
              <input
                type="text"
                placeholder="6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className={styles.otpInput}
                autoFocus
              />
            </div>
            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
            <button type="button" className={styles.link} onClick={() => setStep('basic')}>
              Use different email
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.logo}>
            <span>✅</span>
            <h1>Account Created!</h1>
          </div>

          <p className={styles.subtitle}>
            Welcome to Insight Campus, {formData.name}!
          </p>

          <div style={{ marginTop: 24 }}>
            <div style={{ background: '#f0fdf4', padding: 16, borderRadius: 8, marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>What you can do:</h3>
              <ul style={{ fontSize: 14, paddingLeft: 20, color: '#374151' }}>
                <li>Browse 500+ courses</li>
                <li>Build your resume with AI</li>
                <li>Connect with mentors</li>
                <li>Apply for scholarships</li>
              </ul>
            </div>
            <Link href="/dashboard">
              <button className={styles.btn} style={{ width: '100%' }}>
                Go to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <span>🎓</span>
          <h1>Insight Campus</h1>
        </div>

        <p className={styles.subtitle}>
          Create your student account
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <button
            onClick={handleGoogleSignup}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              background: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: 14
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>
          <button
            onClick={handleLinkedInSignup}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              background: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: 14
            }}
          >
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

        <form onSubmit={handleSendOTP} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="your.email@college.edu"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Phone Number</label>
            <div className={styles.phoneInput}>
              <span className={styles.code}>+91</span>
              <input
                type="tel"
                name="phone"
                placeholder="Phone number"
                value={formData.phone}
                onChange={handleInputChange}
                maxLength={10}
                required
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>College / University</label>
            <input
              type="text"
              name="college"
              placeholder="e.g., IIT Delhi"
              value={formData.college}
              onChange={handleInputChange}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className={styles.inputGroup}>
              <label>Course</label>
              <select name="course" value={formData.course} onChange={handleInputChange} required>
                <option value="">Select</option>
                <option value="btech">B.Tech</option>
                <option value="mtech">M.Tech</option>
                <option value="bba">BBA</option>
                <option value="mba">MBA</option>
                <option value="bca">BCA</option>
                <option value="mca">MCA</option>
                <option value="bsc">B.Sc</option>
                <option value="msc">M.Sc</option>
                <option value="bcom">B.Com</option>
                <option value="mcom">M.Com</option>
                <option value="ba">B.A</option>
                <option value="ma">M.A</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label>Year</label>
              <select name="year" value={formData.year} onChange={handleInputChange} required>
                <option value="">Select</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
                <option value="5">5th Year</option>
                <option value="passout">Passed Out</option>
              </select>
            </div>
          </div>

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className={styles.footer}>
          Already have an account? <Link href="/auth/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
