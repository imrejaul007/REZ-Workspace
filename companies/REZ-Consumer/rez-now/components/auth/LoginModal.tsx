'use client';

import { useState } from 'react';
import { useUIStore } from '@/lib/store/uiStore';
import { useAuthStore } from '@/lib/store/authStore';
import { sendOtp, verifyOtp, verifyPin } from '@/lib/api/auth';
import { publicClient } from '@/lib/api/client';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

type Step = 'phone' | 'otp' | 'pin';

const REZ_AUTH_URL = process.env.NEXT_PUBLIC_REZ_AUTH_URL || 'https://rez-auth-service.onrender.com';
const REZ_CLIENT_ID = process.env.NEXT_PUBLIC_REZ_OAUTH_CLIENT_ID || 'rez-now';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://now.rez.money';

/**
 * Initiates OAuth2 flow by redirecting to REZ Auth Service.
 * The auth service handles phone/OTP login and redirects back to /api/auth/callback.
 */
function initiateOAuth2(redirectTo = '/') {
  const state = btoa(JSON.stringify({ redirectTo, ts: Date.now() }));
  const callbackUrl = `${APP_URL}/api/auth/callback`;
  const authUrl = `${REZ_AUTH_URL}/oauth/authorize?` +
    new URLSearchParams({
      client_id: REZ_CLIENT_ID,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: 'profile wallet:read',
      state,
    }).toString();
  window.location.href = authUrl;
}

/** Fire-and-forget: record referral without blocking the login UX. */
async function recordReferral(newUserId: string): Promise<void> {
  const referralCode = typeof window !== 'undefined' ? localStorage.getItem('rez-ref') : null;
  if (!referralCode) return;
  try {
    await publicClient.post(
      '/api/web-ordering/referral',
      { referralCode, newUserId },
      { headers: { 'X-Requested-With': 'XMLHttpRequest' } },
    );
    localStorage.removeItem('rez-ref');
  } catch {
    // Non-critical — silently swallow; wallet service picks this up later
  }
}

export default function LoginModal() {
  const { loginModalOpen, loginModalCallback, closeLoginModal } = useUIStore();
  const setSession = useAuthStore((s) => s.setSession);
  const showToast = useUIStore((s) => s.showToast);

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);

  function reset() {
    setStep('phone');
    setPhone('');
    setOtp('');
    setPin('');
    setError('');
    setIsNewUser(false);
  }

  function handleClose() {
    reset();
    closeLoginModal();
  }

  async function handleSendOtp() {
    if (!phone || phone.length < 10) { setError('Enter a valid 10-digit phone number'); return; }
    setLoading(true); setError('');
    try {
      const result = await sendOtp(phone.replace(/\D/g, ''));
      setIsNewUser(result.isNewUser);
      if (result.hasPIN) setStep('pin');
      else setStep('otp');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (!otp || otp.length !== 6) { setError('Enter the 6-digit OTP'); return; }
    setLoading(true); setError('');
    try {
      const { tokens, user } = await verifyOtp(phone.replace(/\D/g, ''), otp);
      setSession(tokens.accessToken ?? '', tokens.refreshToken ?? '', user);
      showToast('Welcome to REZ Now!', 'success');
      // Record referral for brand-new users without blocking the login flow
      if (isNewUser) void recordReferral(user.id);
      reset();
      closeLoginModal();
      loginModalCallback?.();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyPin() {
    if (!pin || pin.length < 4) { setError('Enter your PIN'); return; }
    setLoading(true); setError('');
    try {
      const { tokens, user } = await verifyPin(phone.replace(/\D/g, ''), pin);
      setSession(tokens.accessToken ?? '', tokens.refreshToken ?? '', user);
      showToast('Welcome back!', 'success');
      reset();
      closeLoginModal();
      loginModalCallback?.();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Invalid PIN');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={loginModalOpen} onClose={handleClose} title="Login to continue">
      <div className="space-y-4">

        {/* Assertive live region announced immediately when errors appear */}
        <div
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          className={error ? 'text-xs text-red-600' : 'sr-only'}
          id="login-error"
        >
          {error || ''}
        </div>

        {step === 'phone' && (
          <>
            {/* OAuth2 "Continue with REZ" option */}
            <button
              onClick={() => initiateOAuth2()}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              aria-label="Continue with your REZ account"
            >
              {/* REZ wordmark icon */}
              <svg className="w-5 h-5 text-indigo-600 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
              </svg>
              Continue with REZ
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-gray-200 w-full" />
              <span className="absolute bg-white px-3 text-xs text-gray-400">or</span>
            </div>

            <p className="text-sm text-gray-500">Enter your phone number to continue</p>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
              <span
                id="phone-prefix"
                className="px-3 py-3 bg-gray-50 text-gray-600 text-sm border-r border-gray-200"
                aria-hidden="true"
              >
                +91
              </span>
              <label htmlFor="login-phone" className="sr-only">
                Mobile number
              </label>
              <input
                id="login-phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                aria-describedby={error ? 'login-error' : undefined}
                aria-invalid={error ? 'true' : undefined}
                aria-label="Mobile number (without country code)"
                className="flex-1 px-3 py-3 text-sm focus:outline-2 focus:outline-indigo-400 focus:ring-2 focus:ring-indigo-400 rounded-lg"
                autoFocus
              />
            </div>
            <Button fullWidth loading={loading} onClick={handleSendOtp}>
              Continue
            </Button>
          </>
        )}

        {step === 'otp' && (
          <>
            <p className="text-sm text-gray-500">OTP sent to +91 {phone}</p>
            <label htmlFor="login-otp" className="sr-only">
              One-time password
            </label>
            <input
              id="login-otp"
              type="tel"
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
              aria-describedby={error ? 'login-error' : undefined}
              aria-invalid={error ? 'true' : undefined}
              className="w-full px-4 py-3 text-lg text-center tracking-widest border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
            <Button fullWidth loading={loading} onClick={handleVerifyOtp}>
              Verify OTP
            </Button>
            <button
              className="w-full text-xs text-gray-600 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
              onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
            >
              &larr; Change number
            </button>
          </>
        )}

        {step === 'pin' && (
          <>
            <p className="text-sm text-gray-500">Enter your REZ PIN for +91 {phone}</p>
            <label htmlFor="login-pin" className="sr-only">
              REZ PIN
            </label>
            <input
              id="login-pin"
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && handleVerifyPin()}
              aria-describedby={error ? 'login-error' : undefined}
              aria-invalid={error ? 'true' : undefined}
              className="w-full px-4 py-3 text-lg text-center tracking-widest border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
            <Button fullWidth loading={loading} onClick={handleVerifyPin}>
              Login with PIN
            </Button>
            <button
              className="w-full text-xs text-gray-600 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
              onClick={async () => {
                setPin(''); setError(''); setLoading(true);
                try { await sendOtp(phone.replace(/\D/g, ''), '+91', 'sms'); setStep('otp'); }
                catch { setError('Failed to send OTP'); }
                finally { setLoading(false); }
              }}
            >
              Forgot PIN? Use OTP instead
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
