'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function ChangePassword() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const requirements = [
    { text: 'At least 8 characters', met: passwords.new.length >= 8 },
    { text: 'Contains uppercase letter', met: /[A-Z]/.test(passwords.new) },
    { text: 'Contains lowercase letter', met: /[a-z]/.test(passwords.new) },
    { text: 'Contains number', met: /\d/.test(passwords.new) },
    { text: 'Contains special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(passwords.new) }
  ];

  const passwordsMatch = passwords.new === passwords.confirm && passwords.confirm !== '';
  const allRequirementsMet = requirements.every(req => req.met);
  const canSubmit = passwords.current && allRequirementsMet && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push('/auth/success?type=password_reset');
    } catch (error) {
      console.error('Password change failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Change Password</h1>
            <p className="text-muted-foreground">Update your account password</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                Password Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="current-password">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwords.current}
                        onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                        className="pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => togglePasswordVisibility('current')}
                      >
                        {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwords.new}
                        onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                        className="pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => togglePasswordVisibility('new')}
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwords.confirm}
                        onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                        className={`pr-10 ${
                          passwords.confirm && !passwordsMatch ? 'border-red-500' : ''
                        }`}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => togglePasswordVisibility('confirm')}
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {passwords.confirm && !passwordsMatch && (
                      <p className="text-sm text-red-600 mt-1">Passwords do not match</p>
                    )}
                  </div>
                </div>

                {passwords.new && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">Password Requirements</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {requirements.map((requirement, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          {requirement.met ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                          <span className={`text-sm ${
                            requirement.met ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {requirement.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!canSubmit || loading}
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}