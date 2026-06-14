import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Check, Loader2, AlertCircle } from 'lucide-react';
import StepIndicator from '../components/StepIndicator';
import BasicInfo from './steps/BasicInfo';
import Documents from './steps/Documents';
import BankDetails from './steps/BankDetails';
import AddProducts from './steps/AddProducts';
import GenerateQR from './steps/GenerateQR';
import api, { OnboardingSteps, Store, CreateStoreRequest, POSConfig } from '../services/api';

interface OnboardingFlowProps {
  storeId?: string;
  merchantId: string;
  onComplete?: (store: Store) => void;
  onError?: (error: string) => void;
}

interface StepData {
  basic?: Record<string, unknown>;
  documents?: Record<string, unknown>;
  bank?: Record<string, unknown>;
  inventory?: { products: unknown[] };
  qr?: { qrCodes: unknown[] };
  payment?: Record<string, unknown>;
  staff?: Record<string, unknown>;
  settings?: Record<string, unknown>;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  storeId,
  merchantId,
  onComplete,
  onError,
}) => {
  const [store, setStore] = useState<Store | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingSteps | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepData, setStepData] = useState<StepData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize or load onboarding
  useEffect(() => {
    const initOnboarding = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (storeId) {
          // Load existing store and onboarding
          const [storeData, onboardingData] = await Promise.all([
            api.getStore(storeId),
            api.getOnboardingStatus(storeId),
          ]);
          setStore(storeData);
          setOnboarding(onboardingData);
          setCurrentStepIndex(onboardingData.currentStep);

          // Load existing step data
          const existingData: StepData = {};
          onboardingData.steps.forEach(step => {
            if (step.data) {
              existingData[step.id as keyof StepData] = step.data;
            }
          });
          setStepData(existingData);
        } else {
          // Create new store with onboarding
          const request: CreateStoreRequest = {
            merchantId,
            storeName: '',
            storeType: 'retail',
            address: {
              street: '',
              city: '',
              state: '',
              pincode: '',
              country: 'India',
            },
            phone: '',
            email: '',
          };
          const { store: newStore, onboarding: newOnboarding } = await api.createStore(request);
          setStore(newStore);
          setOnboarding(newOnboarding);
          setCurrentStepIndex(0);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initialize onboarding';
        setError(message);
        onError?.(message);
      } finally {
        setIsLoading(false);
      }
    };

    initOnboarding();
  }, [storeId, merchantId]);

  const handleStepComplete = async (stepId: string, data: Record<string, unknown>) => {
    if (!onboarding) return;

    setIsSaving(true);
    setError(null);

    try {
      // Save step data locally
      setStepData(prev => ({ ...prev, [stepId]: data }));

      // Save to server
      const updatedOnboarding = await api.completeStep(onboarding.steps[currentStepIndex].id === stepId
        ? onboarding.steps[currentStepIndex].id
        : stepId, stepId, data);

      setOnboarding(updatedOnboarding);

      // Move to next step if not last
      const currentIndex = updatedOnboarding.steps.findIndex(s => s.id === stepId);
      if (currentIndex < updatedOnboarding.steps.length - 1) {
        setCurrentStepIndex(currentIndex + 1);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save step';
      setError(message);
      onError?.(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = async () => {
    if (!onboarding) return;

    setIsSaving(true);
    setError(null);

    try {
      const updatedOnboarding = await api.skipStep(onboarding.steps[currentStepIndex].id);
      setOnboarding(updatedOnboarding);

      const currentIndex = updatedOnboarding.steps.findIndex(s => s.id === onboarding.steps[currentStepIndex].id);
      if (currentIndex < updatedOnboarding.steps.length - 1) {
        setCurrentStepIndex(currentIndex + 1);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to skip step';
      setError(message);
      onError?.(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoBack = async () => {
    if (!onboarding || currentStepIndex === 0) return;

    setIsSaving(true);
    setError(null);

    try {
      const updatedOnboarding = await api.goBack(onboarding.steps[currentStepIndex].id);
      setOnboarding(updatedOnboarding);
      setCurrentStepIndex(currentStepIndex - 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to go back';
      setError(message);
      onError?.(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStepClick = (index: number) => {
    if (!onboarding) return;
    // Only allow navigation to completed steps
    if (onboarding.steps[index].status === 'completed') {
      setCurrentStepIndex(index);
    }
  };

  const handleCompleteOnboarding = async () => {
    if (!onboarding || !store) return;

    setIsSaving(true);
    setError(null);

    try {
      // Setup POS configuration with settings data
      if (stepData.settings) {
        const posConfig: POSConfig = {
          defaultTaxRate: Number(stepData.settings.defaultTaxRate) || 18,
          currency: String(stepData.settings.currency) || 'INR',
          receiptFooter: String(stepData.settings.receiptFooter) || 'Thank you for shopping with us!',
          allowDiscounts: stepData.settings.allowDiscounts === 'true',
          maxDiscountPercent: Number(stepData.settings.maxDiscountPercent) || 50,
          staffPINRequired: true,
        };
        await api.setupPOS(store.id, posConfig);
      }

      // Complete onboarding
      await api.completeOnboarding(onboarding.steps[currentStepIndex].id);

      // Refresh store data
      const updatedStore = await api.getStore(store.id);
      onComplete?.(updatedStore);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete onboarding';
      setError(message);
      onError?.(message);
    } finally {
      setIsSaving(false);
    }
  };

  const renderStepContent = () => {
    if (!onboarding) return null;

    const currentStep = onboarding.steps[currentStepIndex];
    if (!currentStep) return null;

    const stepProps = {
      initialData: stepData[currentStep.id as keyof StepData],
      onSubmit: (data: Record<string, unknown>) => handleStepComplete(currentStep.id, data),
      onSkip: handleSkip,
      isLoading: isSaving,
    };

    switch (currentStep.id) {
      case 'basic':
        return (
          <BasicInfo
            initialData={stepData.basic as Parameters<typeof BasicInfo>[0]['initialData']}
            onSubmit={(data) => handleStepComplete('basic', data)}
            onSkip={handleSkip}
            isLoading={isSaving}
          />
        );
      case 'documents':
        return (
          <Documents
            initialData={stepData.documents as Parameters<typeof Documents>[0]['initialData']}
            onSubmit={(data) => handleStepComplete('documents', data)}
            onSkip={handleSkip}
            isLoading={isSaving}
          />
        );
      case 'bank':
        return (
          <BankDetails
            initialData={stepData.bank as Parameters<typeof BankDetails>[0]['initialData']}
            onSubmit={(data) => handleStepComplete('bank', data)}
            onSkip={handleSkip}
            isLoading={isSaving}
          />
        );
      case 'inventory':
        return store ? (
          <AddProducts
            storeId={store.id}
            initialData={stepData.inventory as Parameters<typeof AddProducts>[0]['initialData']}
            onSubmit={(data) => handleStepComplete('inventory', data)}
            onSkip={handleSkip}
            isLoading={isSaving}
            onImportProducts={async (products) => api.importProducts(store.id, products)}
          />
        ) : null;
      case 'qr':
        return store ? (
          <GenerateQR
            storeId={store.id}
            initialData={stepData.qr as Parameters<typeof GenerateQR>[0]['initialData']}
            onSubmit={(data) => handleStepComplete('qr', data)}
            onSkip={handleSkip}
            isLoading={isSaving}
          />
        ) : null;
      case 'payment':
        // Payment setup step (simplified)
        return (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Payment Setup</h2>
              <p className="text-gray-600 mt-2">Configure payment options</p>
            </div>
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800">UPI payments are enabled by default</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800">Card payments are enabled by default</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800">Cash payments are enabled by default</p>
              </div>
            </div>
            <div className="flex justify-between items-center pt-6 border-t">
              <button
                type="button"
                onClick={handleSkip}
                className="text-gray-600 hover:text-gray-800 font-medium"
                disabled={isSaving}
              >
                Skip for now
              </button>
              <button
                type="button"
                onClick={() => handleStepComplete('payment', { enabled: true })}
                disabled={isSaving}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSaving ? 'Saving...' : 'Continue'}
              </button>
            </div>
          </div>
        );
      case 'staff':
        // Staff step (simplified)
        return (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Add Staff</h2>
              <p className="text-gray-600 mt-2">Invite team members to your store</p>
            </div>
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-600 mb-4">Staff management will be available after onboarding</p>
            </div>
            <div className="flex justify-between items-center pt-6 border-t">
              <button
                type="button"
                onClick={handleSkip}
                className="text-gray-600 hover:text-gray-800 font-medium"
                disabled={isSaving}
              >
                Skip for now
              </button>
              <button
                type="button"
                onClick={() => handleStepComplete('staff', { skipped: true })}
                disabled={isSaving}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSaving ? 'Saving...' : 'Continue'}
              </button>
            </div>
          </div>
        );
      case 'settings':
        // Final settings step (simplified)
        return (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Final Settings</h2>
              <p className="text-gray-600 mt-2">Configure store settings</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Tax Rate (%)
                </label>
                <input
                  type="number"
                  defaultValue={18}
                  min={0}
                  max={100}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    // Will be captured in stepData
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  defaultValue="INR"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="INR">Indian Rupee (INR)</option>
                  <option value="USD">US Dollar (USD)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-between items-center pt-6 border-t">
              <button
                type="button"
                onClick={handleSkip}
                className="text-gray-600 hover:text-gray-800 font-medium"
                disabled={isSaving}
              >
                Skip for now
              </button>
              <button
                type="button"
                onClick={() => {
                  handleStepComplete('settings', {
                    defaultTaxRate: 18,
                    currency: 'INR',
                    allowDiscounts: true,
                    maxDiscountPercent: 50,
                    receiptFooter: 'Thank you for shopping with us!',
                  });
                }}
                disabled={isSaving}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isSaving ? 'Saving...' : 'Complete Onboarding'}
              </button>
            </div>
          </div>
        );
      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-600">Step content not available</p>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading onboarding...</p>
        </div>
      </div>
    );
  }

  if (error && !onboarding) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!onboarding || !store) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600">No onboarding data available</p>
      </div>
    );
  }

  const isLastStep = currentStepIndex === onboarding.steps.length - 1;
  const currentStep = onboarding.steps[currentStepIndex];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Store Onboarding
        </h1>
        {store.name && (
          <p className="text-gray-600">{store.name}</p>
        )}
      </div>

      {/* Step Indicator */}
      <div className="mb-8">
        <StepIndicator
          steps={onboarding.steps}
          currentStep={currentStepIndex}
          onStepClick={handleStepClick}
        />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        {renderStepContent()}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between mt-6">
        <button
          type="button"
          onClick={handleGoBack}
          disabled={currentStepIndex === 0 || isSaving}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </button>

        <div className="text-sm text-gray-500">
          Step {currentStepIndex + 1} of {onboarding.steps.length}
        </div>

        {isLastStep && currentStep.status !== 'completed' && (
          <button
            type="button"
            onClick={handleCompleteOnboarding}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Completing...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Complete Onboarding
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default OnboardingFlow;
