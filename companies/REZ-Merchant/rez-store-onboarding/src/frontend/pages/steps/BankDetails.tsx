import React, { useState } from 'react';
import { Building, CreditCard, CheckCircle, Loader2 } from 'lucide-react';

interface BankDetailsData {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
}

interface BankDetailsProps {
  initialData?: BankDetailsData;
  onSubmit: (data: BankDetailsData) => void;
  onSkip?: () => void;
  isLoading?: boolean;
}

export const BankDetails: React.FC<BankDetailsProps> = ({
  initialData,
  onSubmit,
  onSkip,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<BankDetailsData>({
    accountHolderName: initialData?.accountHolderName || '',
    accountNumber: initialData?.accountNumber || '',
    ifscCode: initialData?.ifscCode || '',
    bankName: initialData?.bankName || '',
    branchName: initialData?.branchName || '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof BankDetailsData, string>>>({});
  const [showAccountHint, setShowAccountHint] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'verified'>('idle');

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof BankDetailsData, string>> = {};

    if (!formData.accountHolderName.trim()) {
      newErrors.accountHolderName = 'Account holder name is required';
    } else if (formData.accountHolderName.length < 3) {
      newErrors.accountHolderName = 'Name must be at least 3 characters';
    }

    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    } else if (!/^[0-9]{9,18}$/.test(formData.accountNumber)) {
      newErrors.accountNumber = 'Account number must be 9-18 digits';
    }

    if (!formData.ifscCode.trim()) {
      newErrors.ifscCode = 'IFSC code is required';
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode.toUpperCase())) {
      newErrors.ifscCode = 'Invalid IFSC code format';
    }

    if (!formData.bankName.trim()) {
      newErrors.bankName = 'Bank name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (name === 'ifscCode') {
      processedValue = value.toUpperCase();
    }

    if (name === 'accountNumber' || name === 'ifscCode') {
      processedValue = processedValue.replace(/[^0-9A-Za-z]/g, '');
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }));
    if (errors[name as keyof BankDetailsData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleVerifyAccount = async () => {
    if (!validateForm()) return;

    setIsVerifying(true);
    setVerificationStatus('verifying');

    // Simulate verification (replace with actual API call)
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsVerifying(false);
    setVerificationStatus('verified');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Bank Details</h2>
        <p className="text-gray-600 mt-2">
          Add your bank account for receiving settlements
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 flex items-start gap-3">
        <Building className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-green-800 font-medium">
            Secure Bank Account
          </p>
          <p className="text-sm text-green-700 mt-1">
            Your bank details are encrypted and stored securely. They are only used
            for settlement transfers.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account Holder Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Holder Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="accountHolderName"
            value={formData.accountHolderName}
            onChange={handleChange}
            placeholder="Enter account holder name as per bank records"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.accountHolderName ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          {errors.accountHolderName && (
            <p className="mt-1 text-sm text-red-500">{errors.accountHolderName}</p>
          )}
        </div>

        {/* Account Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showAccountHint ? 'text' : 'password'}
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleChange}
              placeholder="Enter your bank account number"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono tracking-wider ${
                errors.accountNumber ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowAccountHint(!showAccountHint)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showAccountHint ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.accountNumber && (
            <p className="mt-1 text-sm text-red-500">{errors.accountNumber}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Account number must be 9-18 digits
          </p>
        </div>

        {/* IFSC Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            IFSC Code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="ifscCode"
            value={formData.ifscCode}
            onChange={handleChange}
            placeholder="Enter IFSC code (e.g., SBIN0001234)"
            maxLength={11}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono tracking-wider ${
              errors.ifscCode ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          {errors.ifscCode && (
            <p className="mt-1 text-sm text-red-500">{errors.ifscCode}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            11-character code: 4 letters + 0 + 6 alphanumeric characters
          </p>
        </div>

        {/* Bank Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bank Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="bankName"
            value={formData.bankName}
            onChange={handleChange}
            placeholder="Enter bank name"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.bankName ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          {errors.bankName && (
            <p className="mt-1 text-sm text-red-500">{errors.bankName}</p>
          )}
        </div>

        {/* Branch Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Branch Name
          </label>
          <input
            type="text"
            name="branchName"
            value={formData.branchName}
            onChange={handleChange}
            placeholder="Enter branch name (optional)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          />
        </div>

        {/* Verify Account Button */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Verify Account</h4>
                <p className="text-sm text-gray-500">Verify account with test transaction</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleVerifyAccount}
              disabled={isVerifying || verificationStatus === 'verified'}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                verificationStatus === 'verified'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isVerifying ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </span>
              ) : verificationStatus === 'verified' ? (
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Verified
                </span>
              ) : (
                'Verify Now'
              )}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6 border-t">
          <button
            type="button"
            onClick={onSkip}
            className="text-gray-600 hover:text-gray-800 font-medium"
            disabled={isLoading}
          >
            Skip for now
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              'Continue'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BankDetails;
