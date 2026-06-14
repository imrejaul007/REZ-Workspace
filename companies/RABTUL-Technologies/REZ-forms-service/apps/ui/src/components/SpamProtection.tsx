'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Eye, EyeOff, Lock, AlertTriangle, Check, Zap } from 'lucide-react';

interface SpamSettings {
  enabled: boolean;
  captchaType: 'none' | 'simple' | 'recaptcha';
  honeypot: boolean;
  rateLimit: boolean;
  maxSubmissionsPerIP: number;
  timeLimit: number; // Minimum seconds between submissions
  blockEmails: string[]; // Block disposable email domains
  requireConsent: boolean;
}

interface SpamProtectionProps {
  settings: SpamSettings;
  onUpdate: (settings: SpamSettings) => void;
}

const DISPOSABLE_DOMAINS = [
  'tempmail.com', 'throwaway.com', 'guerrillamail.com', 'mailinator.com',
  '10minutemail.com', 'temp-mail.org', 'fakeinbox.com', 'trashmail.com',
];

export function SpamProtection({ settings, onUpdate }: SpamProtectionProps) {
  const [newBlockedDomain, setNewBlockedDomain] = useState('');

  const updateSetting = <K extends keyof SpamSettings>(key: K, value: SpamSettings[K]) => {
    onUpdate({ ...settings, [key]: value });
  };

  const addBlockedDomain = () => {
    if (newBlockedDomain && !settings.blockEmails.includes(newBlockedDomain)) {
      updateSetting('blockEmails', [...settings.blockEmails, newBlockedDomain]);
      setNewBlockedDomain('');
    }
  };

  const removeBlockedDomain = (domain: string) => {
    updateSetting('blockEmails', settings.blockEmails.filter(d => d !== domain));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Spam Protection
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Protect your forms from spam and abuse
        </p>
      </div>

      {/* Enable Toggle */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Enable Spam Protection</p>
              <p className="text-sm text-gray-500">Turn on all spam protection features</p>
            </div>
          </div>
          <button
            onClick={() => updateSetting('enabled', !settings.enabled)}
            className={`w-12 h-7 rounded-full transition-colors relative ${
              settings.enabled ? 'bg-green-500' : 'bg-gray-200'
            }`}
          >
            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              settings.enabled ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>

      {settings.enabled && (
        <>
          {/* CAPTCHA */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              CAPTCHA Verification
            </h4>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-purple-300 cursor-pointer">
                <input
                  type="radio"
                  name="captcha"
                  checked={settings.captchaType === 'none'}
                  onChange={() => updateSetting('captchaType', 'none')}
                  className="mt-1 text-purple-600"
                />
                <div>
                  <p className="font-medium text-gray-900">No CAPTCHA</p>
                  <p className="text-sm text-gray-500">No verification required</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-purple-300 cursor-pointer">
                <input
                  type="radio"
                  name="captcha"
                  checked={settings.captchaType === 'simple'}
                  onChange={() => updateSetting('captchaType', 'simple')}
                  className="mt-1 text-purple-600"
                />
                <div>
                  <p className="font-medium text-gray-900">Simple Math Challenge</p>
                  <p className="text-sm text-gray-500">Users solve a simple math problem (e.g., 5 + 3 = ?)</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-purple-300 cursor-pointer">
                <input
                  type="radio"
                  name="captcha"
                  checked={settings.captchaType === 'recaptcha'}
                  onChange={() => updateSetting('captchaType', 'recaptcha')}
                  className="mt-1 text-purple-600"
                />
                <div>
                  <p className="font-medium text-gray-900">reCAPTCHA (Recommended)</p>
                  <p className="text-sm text-gray-500">Google's advanced bot protection</p>
                  {settings.captchaType === 'recaptcha' && (
                    <input
                      type="text"
                      placeholder="reCAPTCHA Site Key"
                      className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Honeypot */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Honeypot Field
                </h4>
                <p className="text-sm text-gray-500">Hidden field that bots fill but humans don't see</p>
              </div>
              <button
                onClick={() => updateSetting('honeypot', !settings.honeypot)}
                className={`w-11 h-6 rounded-full transition-colors ${
                  settings.honeypot ? 'bg-purple-600' : 'bg-gray-200'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  settings.honeypot ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {settings.honeypot && (
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-purple-700">
                    A hidden "website" field will be added to your form. If it's filled, the submission is rejected as spam.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Rate Limiting */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Rate Limiting
                </h4>
                <p className="text-sm text-gray-500">Limit submissions per IP address</p>
              </div>
              <button
                onClick={() => updateSetting('rateLimit', !settings.rateLimit)}
                className={`w-11 h-6 rounded-full transition-colors ${
                  settings.rateLimit ? 'bg-purple-600' : 'bg-gray-200'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  settings.rateLimit ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {settings.rateLimit && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max submissions per IP
                  </label>
                  <input
                    type="number"
                    value={settings.maxSubmissionsPerIP}
                    onChange={(e) => updateSetting('maxSubmissionsPerIP', parseInt(e.target.value) || 1)}
                    min={1}
                    max={100}
                    className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Set to 1 to allow only one submission per IP</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum time between submissions (seconds)
                  </label>
                  <input
                    type="number"
                    value={settings.timeLimit}
                    onChange={(e) => updateSetting('timeLimit', parseInt(e.target.value) || 0)}
                    min={0}
                    max={3600}
                    className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Set to 0 to disable time-based limiting</p>
                </div>
              </div>
            )}
          </div>

          {/* Disposable Email Blocking */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <EyeOff className="w-4 h-4" />
              Block Disposable Emails
            </h4>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Add blocked email domain
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newBlockedDomain}
                  onChange={(e) => setNewBlockedDomain(e.target.value)}
                  placeholder="domain.com"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && addBlockedDomain()}
                />
                <button
                  onClick={addBlockedDomain}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {settings.blockEmails.map((domain) => (
                <span
                  key={domain}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded text-sm"
                >
                  {domain}
                  <button
                    onClick={() => removeBlockedDomain(domain)}
                    className="text-red-400 hover:text-red-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-2">Common disposable email domains:</p>
              <div className="flex flex-wrap gap-2">
                {DISPOSABLE_DOMAINS.slice(0, 5).map((domain) => (
                  <button
                    key={domain}
                    onClick={() => {
                      if (!settings.blockEmails.includes(domain)) {
                        updateSetting('blockEmails', [...settings.blockEmails, domain]);
                      }
                    }}
                    className="text-xs px-2 py-1 bg-white border border-gray-200 rounded hover:border-purple-300 hover:text-purple-600"
                  >
                    + {domain}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Consent Checkbox */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Require Consent</h4>
                <p className="text-sm text-gray-500">Show consent checkbox before submission</p>
              </div>
              <button
                onClick={() => updateSetting('requireConsent', !settings.requireConsent)}
                className={`w-11 h-6 rounded-full transition-colors ${
                  settings.requireConsent ? 'bg-purple-600' : 'bg-gray-200'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  settings.requireConsent ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {settings.requireConsent && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  Users must check a box confirming they agree to your terms before submitting.
                  Configure the consent text in your form settings.
                </p>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
            <h4 className="font-medium text-purple-900 mb-2">Protection Summary</h4>
            <ul className="space-y-1 text-sm text-purple-700">
              {settings.captchaType !== 'none' && (
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  {settings.captchaType === 'simple' ? 'Math challenge' : 'reCAPTCHA'} verification
                </li>
              )}
              {settings.honeypot && (
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Honeypot spam trap
                </li>
              )}
              {settings.rateLimit && (
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Max {settings.maxSubmissionsPerIP} submission{settings.maxSubmissionsPerIP > 1 ? 's' : ''} per IP
                </li>
              )}
              {settings.blockEmails.length > 0 && (
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  {settings.blockEmails.length} disposable email domain{settings.blockEmails.length > 1 ? 's' : ''} blocked
                </li>
              )}
              {settings.requireConsent && (
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Consent checkbox required
                </li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}