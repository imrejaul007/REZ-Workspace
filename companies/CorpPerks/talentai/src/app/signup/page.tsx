'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SignupPage() {
  const [role, setRole] = useState<'candidate' | 'employer' | null>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    company: '',
    jobTitle: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);
    window.location.href = role === 'employer' ? '/employer' : '/dashboard';
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0, background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            TalentAI
          </h1>
          <p style={{ color: '#6b7280', margin: '8px 0 0' }}>AI-Powered Talent Matching Platform</p>
        </div>

        <div style={{ background: 'white', padding: 32, borderRadius: 16, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          {!role && (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 24px', textAlign: 'center' }}>
                Join TalentAI
              </h2>
              <p style={{ color: '#6b7280', textAlign: 'center', marginBottom: 24 }}>
                I am a...
              </p>
              <div style={{ display: 'grid', gap: 12 }}>
                <button
                  onClick={() => setRole('candidate')}
                  style={{
                    padding: 20,
                    border: '2px solid #e5e7eb',
                    borderRadius: 12,
                    cursor: 'pointer',
                    textAlign: 'left',
                    background: 'white',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 8 }}>👤</div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Job Seeker / Candidate</div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>Find your dream job with AI matching</div>
                </button>
                <button
                  onClick={() => setRole('employer')}
                  style={{
                    padding: 20,
                    border: '2px solid #e5e7eb',
                    borderRadius: 12,
                    cursor: 'pointer',
                    textAlign: 'left',
                    background: 'white',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 8 }}>🏢</div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Employer / Recruiter</div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>Find top talent with AI-powered matching</div>
                </button>
              </div>
            </>
          )}

          {role && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                <button
                  onClick={() => { setRole(null); setStep(1); }}
                  style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}
                >
                  ←
                </button>
                <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>
                  {role === 'candidate' ? 'Create Candidate Account' : 'Create Employer Account'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 14 }}>
                    {role === 'candidate' ? 'Full Name' : 'Contact Person Name'}
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    style={{ width: '100%', padding: 12, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 14 }}>Email</label>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    style={{ width: '100%', padding: 12, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 14 }}>Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    style={{ width: '100%', padding: 12, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
                  />
                </div>

                {role === 'employer' && (
                  <>
                    <div>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 14 }}>Company Name</label>
                      <input
                        type="text"
                        placeholder="Acme Corp"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        required
                        style={{ width: '100%', padding: 12, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 14 }}>Job Title</label>
                      <input
                        type="text"
                        placeholder="HR Manager / Recruiter"
                        value={formData.jobTitle}
                        onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                        required
                        style={{ width: '100%', padding: 12, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
                      />
                    </div>
                  </>
                )}

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 14 }}>Password</label>
                  <input
                    type="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={8}
                    style={{ width: '100%', padding: 12, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: 14,
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: 16,
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#6b7280' }}>
                Already have an account?{' '}
                <Link href="/auth/login" style={{ color: '#8b5cf6', fontWeight: 500 }}>
                  Sign in
                </Link>
              </p>
            </>
          )}

          <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #e5e7eb' }}>
            <p style={{ textAlign: 'center', fontSize: 12, color: '#6b7280', margin: 0 }}>
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
