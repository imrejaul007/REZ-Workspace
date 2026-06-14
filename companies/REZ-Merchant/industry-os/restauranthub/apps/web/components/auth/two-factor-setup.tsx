'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Smartphone, 
  QrCode, 
  Copy, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  Download,
  Loader2
} from 'lucide-react';
import { authApi } from '@/lib/api/auth-api';
import { toast } from 'react-hot-toast';

interface TwoFactorSetupProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

interface BackupCode {
  code: string;
  used: boolean;
}

export function TwoFactorSetup({ onClose, onSuccess }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'generate' | 'verify' | 'backup' | 'complete'>('generate');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [manualEntryKey, setManualEntryKey] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showManualEntry, setShowManualEntry] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [savedBackupCodes, setSavedBackupCodes] = useState<boolean>(false);

  useEffect(() => {
    generateSecret();
  }, []);

  const generateSecret = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await authApi.generate2FASecret();
      
      if (response.error) {
        setError(response.error);
        return;
      }

      if (response.data) {
        setQrCodeUrl(response.data.qrCodeUrl);
        setManualEntryKey(response.data.manualEntryKey);
        setStep('verify');
      }
    } catch (err) {
      setError('Failed to generate 2FA secret. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authApi.enable2FA(verificationCode);
      
      if (response.error) {
        setError(response.error);
        return;
      }

      if (response.data) {
        setBackupCodes(response.data.backupCodes);
        setStep('backup');
        toast.success('Two-factor authentication enabled successfully!');
      }
    } catch (err) {
      setError('Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedKey(false), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const downloadBackupCodes = () => {
    const content = `RestoPapa Two-Factor Authentication Backup Codes\n\nGenerated: ${new Date().toISOString()}\n\nIMPORTANT: Save these backup codes in a secure location.\nEach code can only be used once.\n\n${backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}\n\nIf you lose access to your authenticator app, you can use these codes to log in.\nAfter using a backup code, generate new ones from your security settings.`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'restauranthub-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setSavedBackupCodes(true);
    toast.success('Backup codes downloaded successfully!');
  };

  const completeSetup = () => {
    setStep('complete');
    if (onSuccess) {
      onSuccess();
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'generate':
        return (
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full w-16 h-16 mx-auto mb-4">
                {loading ? (
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                ) : (
                  <Shield className="h-8 w-8 text-blue-600" />
                )}
              </div>
              <h3 className="text-lg font-semibold mb-2">Setting up Two-Factor Authentication</h3>
              <p className="text-sm text-muted-foreground">
                {loading ? 'Generating your unique QR code...' : 'We\'re preparing your 2FA setup'}
              </p>
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        );

      case 'verify':
        return (
          <CardContent className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Scan QR Code</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Use your authenticator app to scan the QR code below
              </p>
            </div>

            {qrCodeUrl && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-lg border">
                    <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
                  </div>
                </div>

                <div className="text-center">
                  <Button
                    variant="outline"
                    
                    onClick={() => setShowManualEntry(!showManualEntry)}
                  >
                    {showManualEntry ? (
                      <>
                        <QrCode className="h-4 w-4 mr-2" />
                        Show QR Code
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Enter Key Manually
                      </>
                    )}
                  </Button>
                </div>

                {showManualEntry && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Manual Entry Key:</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        readOnly
                        value={manualEntryKey}
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="default"
                        onClick={() => copyToClipboard(manualEntryKey)}
                      >
                        {copiedKey ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label htmlFor="verification-code">Verification Code</Label>
                <Input
                  id="verification-code"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                  className="text-center text-lg font-mono tracking-widest"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={verifyAndEnable2FA}
                  disabled={loading || verificationCode.length !== 6}
                  className="flex-1"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Shield className="h-4 w-4 mr-2" />
                  )}
                  Enable 2FA
                </Button>
              </div>
            </div>
          </CardContent>
        );

      case 'backup':
        return (
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="p-4 bg-green-100 dark:bg-green-900 rounded-full w-16 h-16 mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Save Your Backup Codes</h3>
              <p className="text-sm text-muted-foreground">
                Store these codes in a safe place. You can use them to access your account if you lose your phone.
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Each backup code can only be used once. Save them securely!
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, index) => (
                  <div
                    key={index}
                    className="p-3 bg-muted rounded-lg font-mono text-sm text-center"
                  >
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={downloadBackupCodes}
                variant="outline"
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Backup Codes
              </Button>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="saved-codes"
                  checked={savedBackupCodes}
                  onChange={(e) => setSavedBackupCodes(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="saved-codes" className="text-sm">
                  I have safely stored my backup codes
                </label>
              </div>

              <Button
                onClick={completeSetup}
                disabled={!savedBackupCodes}
                className="w-full"
              >
                Complete Setup
              </Button>
            </div>
          </CardContent>
        );

      case 'complete':
        return (
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="p-4 bg-green-100 dark:bg-green-900 rounded-full w-16 h-16 mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Two-Factor Authentication Enabled!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your account is now protected with two-factor authentication.
              </p>
              
              <Badge variant="secondary" className="mb-4">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                2FA Active
              </Badge>
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                From now on, you'll need to enter a code from your authenticator app when logging in.
              </AlertDescription>
            </Alert>

            <Button onClick={onClose} className="w-full">
              Done
            </Button>
          </CardContent>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Smartphone className="h-5 w-5" />
          <span>Two-Factor Authentication</span>
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      {renderStep()}
    </Card>
  );
}