'use client';

import { useState } from 'react';
import styles from './page.module.css';

export default function TalentAILogin() {
  const [step, setStep] = useState<'role' | 'phone'>('role');
  const [role, setRole] = useState('');

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <span>🎯</span>
          <h1>TalentAI</h1>
        </div>

        {step === 'role' ? (
          <div className={styles.roleSelect}>
            <p>Are you a Candidate or Employer?</p>
            <div className={styles.roles}>
              <button className={styles.roleCard} onClick={() => setRole('candidate')}>
                <span>👤</span>
                <h3>Candidate</h3>
                <p>Find jobs that fit me</p>
              </button>
              <button className={styles.roleCard} onClick={() => setRole('employer')}>
                <span>🏢</span>
                <h3>Employer</h3>
                <p>Post jobs, hire talent</p>
              </button>
            </div>
          </div>
        ) : (
          <form className={styles.form} onSubmit={() => window.location.href = role === 'candidate' ? '/dashboard' : '/employer'}>
            <h2>Enter your phone</h2>
            <p>We'll send you an OTP</p>
            <div className={styles.phoneInput}>
              <span>+91</span>
              <input type="tel" placeholder="Phone number" maxLength={10} />
            </div>
            <button type="submit" className={styles.btn}>Continue</button>
          </form>
        )}
      </div>
    </div>
  );
}
