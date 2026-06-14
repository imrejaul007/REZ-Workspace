/**
 * Bank Details Step (Optional)
 * Add bank account details for receiving payments
 */

import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOnboardingStore } from '@/stores/onboarding-v2';
import StepCard from '../../components/StepCard';
import FormField from '../../components/FormFields';
import SkipButton from '../../components/SkipButton';
import { Colors } from '@/constants/Colors';

export default function BankStep() {
  const router = useRouter();
  const { skipBankDetails } = useOnboardingStore();

  // Form state
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [accountType, setAccountType] = useState<'savings' | 'current'>('savings');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate IFSC and auto-fill bank details
  const validateIFSCCode = async (ifsc: string) => {
    if (ifsc.length !== 11) return;

    setIsVerifying(true);
    // Mock IFSC validation - in real app would call API
    setTimeout(() => {
      if (/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
        setBankName('State Bank of India');
        setBranchName('Main Branch');
        setIsVerified(true);
      }
      setIsVerifying(false);
    }, 1000);
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!accountHolderName.trim()) {
      newErrors.accountHolderName = 'Account holder name is required';
    }

    if (!accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    } else if (!/^\d{9,18}$/.test(accountNumber)) {
      newErrors.accountNumber = 'Enter valid account number (9-18 digits)';
    }

    if (accountNumber !== confirmAccountNumber) {
      newErrors.confirmAccountNumber = 'Account numbers do not match';
    }

    if (!ifscCode.trim()) {
      newErrors.ifscCode = 'IFSC code is required';
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
      newErrors.ifscCode = 'Invalid IFSC format (e.g., SBIN0001234)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) return;

    // Save to API
    // await onboardingV2Service.saveBankDetails({...});

    router.back();
  };

  // Handle skip
  const handleSkip = () => {
    skipBankDetails();
    router.back();
  };

  return (
    <StepCard
      title="Add Bank Details"
      subtitle="Required to receive payments into your account"
      onContinue={handleSave}
      continueLabel="Save Bank Details"
      footer={
        <SkipButton
          onSkip={handleSkip}
          label="Skip for now"
          reason="Can add from Settings"
        />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Ionicons name="shield-checkmark" size={22} color={Colors.light.success} />
          <View style={styles.securityContent}>
            <Text style={styles.securityTitle}>Secure & Encrypted</Text>
            <Text style={styles.securityText}>
              Your bank details are encrypted and stored securely
            </Text>
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.section}>
          <FormField
            label="Account Holder Name"
            icon="person-outline"
            placeholder="As per bank records"
            value={accountHolderName}
            onChangeText={setAccountHolderName}
            error={errors.accountHolderName}
            required
            autoCapitalize="words"
          />

          {/* Account Type */}
          <View style={styles.accountTypeRow}>
            <TouchableOpacity
              style={[styles.accountTypeButton, accountType === 'savings' && styles.accountTypeButtonSelected]}
              onPress={() => setAccountType('savings')}
            >
              <Ionicons
                name="wallet-outline"
                size={20}
                color={accountType === 'savings' ? Colors.light.primary : Colors.light.textSecondary}
              />
              <Text style={[styles.accountTypeText, accountType === 'savings' && styles.accountTypeTextSelected]}>
                Savings
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.accountTypeButton, accountType === 'current' && styles.accountTypeButtonSelected]}
              onPress={() => setAccountType('current')}
            >
              <Ionicons
                name="briefcase-outline"
                size={20}
                color={accountType === 'current' ? Colors.light.primary : Colors.light.textSecondary}
              />
              <Text style={[styles.accountTypeText, accountType === 'current' && styles.accountTypeTextSelected]}>
                Current
              </Text>
            </TouchableOpacity>
          </View>

          <FormField
            label="Account Number"
            icon="card-outline"
            placeholder="9-18 digit account number"
            value={accountNumber}
            onChangeText={setAccountNumber}
            error={errors.accountNumber}
            required
            keyboardType="numeric"
            secureTextEntry
          />

          <FormField
            label="Confirm Account Number"
            icon="card-outline"
            placeholder="Re-enter account number"
            value={confirmAccountNumber}
            onChangeText={setConfirmAccountNumber}
            error={errors.confirmAccountNumber}
            required
            keyboardType="numeric"
            secureTextEntry
          />

          <FormField
            label="IFSC Code"
            icon="business-outline"
            placeholder="SBIN0001234"
            value={ifscCode}
            onChangeText={(text) => {
              setIfscCode(text.toUpperCase());
              if (text.length === 11) {
                validateIFSCCode(text.toUpperCase());
              }
            }}
            error={errors.ifscCode}
            required
            autoCapitalize="characters"
            maxLength={11}
            helperText={
              isVerifying ? 'Verifying...' : isVerified ? 'Verified!' : '11 character code'
            }
          />

          <FormField
            label="Bank Name"
            icon="business-outline"
            placeholder="Auto-filled from IFSC"
            value={bankName}
            onChangeText={setBankName}
            editable={!isVerified}
          />

          <FormField
            label="Branch Name"
            icon="location-outline"
            placeholder="Main Branch"
            value={branchName}
            onChangeText={setBranchName}
          />
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={18} color={Colors.light.textSecondary} />
          <Text style={styles.infoText}>
            Payments will be credited to this account within 2-3 business days
          </Text>
        </View>
      </ScrollView>
    </StepCard>
  );
}

const styles = StyleSheet.create({
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: `${Colors.light.success}10`,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: `${Colors.light.success}25`,
  },
  securityContent: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.success,
    marginBottom: 2,
  },
  securityText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  section: {
    marginBottom: 16,
  },
  accountTypeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  accountTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.light.borderMedium,
    backgroundColor: Colors.light.background,
  },
  accountTypeButtonSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: `${Colors.light.primary}10`,
  },
  accountTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  accountTypeTextSelected: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 10,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
});
