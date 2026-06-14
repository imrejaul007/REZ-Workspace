// Auth Screen - Main entry point
import { useAuth } from '@/hooks/useAuth';
import PhoneInputScreen from '@/components/auth/PhoneInputScreen';
import OTPInputScreen from '@/components/auth/OTPInputScreen';
import { useState } from 'react';

export default function AuthScreen() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');

  const handlePhoneSubmit = (phoneNumber: string) => {
    setPhone(phoneNumber);
    setStep('otp');
  };

  const handleOTPVerified = () => {
    // Auth hook handles navigation
  };

  if (step === 'otp') {
    return (
      <OTPInputScreen
        phone={phone}
        onVerified={handleOTPVerified}
        onBack={() => setStep('phone')}
      />
    );
  }

  return <PhoneInputScreen onSubmit={handlePhoneSubmit} />;
}
