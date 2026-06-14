'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Smartphone, Copy, Check, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { authApi } from '@/lib/api/auth-api';

export default function Setup2FA() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [secretKey, setSecretKey] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch real TOTP secret from backend when entering step 2
  const handleProceedToScan = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authApi.generate2FASecret();
      if (res.error || !res.data) {
        setError(res.error || 'Failed to generate 2FA secret. Please try again.');
        return;
      }
      setSecretKey(res.data.manualEntryKey);
      setQrCodeUrl(res.data.qrCodeUrl);
      setStep(2);
    } catch {
      setError('Failed to generate 2FA secret. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secretKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      const res = await authApi.enable2FA(verificationCode);
      if (res.error || !res.data?.enabled) {
        setError('Invalid code. Please check your authenticator app and try again.');
        return;
      }
      setBackupCodes(res.data.backupCodes ?? []);
      setStep(3);
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    router.push('/settings?tab=security&2fa=enabled');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <Button
            variant="ghost"
            className="absolute top-4 left-4"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Set up Two-Factor Authentication</h1>
          <p className="text-gray-600 mt-2">
            Add an extra layer of security to your account
          </p>
        </motion.div>

        <div className="mb-6">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${step >= stepNumber 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div className={`
                    w-24 h-1 mx-4
                    ${step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Download App</span>
            <span>Scan QR Code</span>
            <span>Verify & Backup</span>
          </div>
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                {step === 1 && (
                  <>
                    <Smartphone className="h-5 w-5 mr-2" />
                    Step 1: Download Authenticator App
                  </>
                )}
                {step === 2 && (
                  <>
                    <QrCode className="h-5 w-5 mr-2" />
                    Step 2: Scan QR Code
                  </>
                )}
                {step === 3 && (
                  <>
                    <Shield className="h-5 w-5 mr-2" />
                    Step 3: Save Backup Codes
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {step === 1 && (
                <div className="space-y-6">
                  <p className="text-gray-600">
                    First, download an authenticator app on your phone. We recommend:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { name: 'Google Authenticator', platform: 'iOS & Android' },
                      { name: 'Authy', platform: 'iOS & Android' },
                      { name: '1Password', platform: 'iOS & Android' }
                    ].map((app) => (
                      <div key={app.name} className="p-4 border rounded-lg text-center">
                        <h3 className="font-semibold">{app.name}</h3>
                        <p className="text-sm text-gray-600">{app.platform}</p>
                      </div>
                    ))}
                  </div>
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  <Button onClick={handleProceedToScan} disabled={loading} className="w-full">
                    {loading ? 'Generating...' : 'I have installed an app'}
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="inline-block p-4 bg-white rounded-lg shadow-sm mb-4">
                      <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 mx-auto" />
                    </div>
                    <p className="text-gray-600 mb-4">
                      Scan this QR code with your authenticator app
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Or enter this key manually:</p>
                      <div className="flex items-center justify-center space-x-2">
                        <code className="bg-white px-3 py-2 rounded border font-mono text-sm">
                          {secretKey}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopySecret}
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Enter the 6-digit code from your app
                      </label>
                      <div className="flex space-x-2">
                        <Input
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          placeholder="123456"
                          maxLength={6}
                          className="text-center text-lg"
                        />
                        <Button
                          onClick={handleVerifyCode}
                          disabled={verificationCode.length !== 6 || loading}
                        >
                          {loading ? 'Verifying...' : 'Verify'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Save these backup codes in a safe place. You can use them to access your account if you lose your phone.
                    </AlertDescription>
                  </Alert>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {backupCodes.map((code, index) => (
                        <div key={index} className="bg-white p-2 rounded text-center font-mono text-sm">
                          {code}
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        const codesText = backupCodes.join('\n');
                        navigator.clipboard.writeText(codesText);
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy All Codes
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="saved-codes" className="rounded" />
                    <label htmlFor="saved-codes" className="text-sm text-gray-600">
                      I have saved these backup codes in a safe place
                    </label>
                  </div>

                  <Button onClick={handleComplete} className="w-full">
                    Complete Setup
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}