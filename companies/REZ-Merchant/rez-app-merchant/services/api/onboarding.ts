/**
 * Onboarding API Service
 * Handles all onboarding-related API calls for the 5-step merchant onboarding wizard
 *
 * Features:
 * - Step-by-step form management
 * - Auto-save capability
 * - Document upload with progress tracking
 * - Validation helpers (GST, PAN, IFSC)
 * - Comprehensive error handling
 */

import { apiClient } from './client';
import { devLog, devWarn } from '../../utils/devLog';
import {
  OnboardingStatus,
  BusinessInfoStep,
  StoreDetailsStep,
  BankDetailsStep,
  DocumentsStep,
  ReviewSubmitStep,
  CompleteStepRequest,
  CompleteStepResponse,
  SubmitStepRequest,
  SubmitStepResponse,
  PreviousStepRequest,
  PreviousStepResponse,
  SubmitOnboardingRequest,
  SubmitOnboardingResponse,
  DocumentUploadRequest,
  DocumentUploadResponse,
  GetDocumentsResponse,
  DeleteDocumentRequest,
  DeleteDocumentResponse,
  GetOnboardingStatusResponse,
  ValidationResult,
  BankValidationResult,
} from '../../types/onboarding';

/**
 * OnboardingService handles all merchant onboarding processes
 */
class OnboardingService {
  private autoSaveInterval: ReturnType<typeof setInterval> | null = null;
  private autoSaveDelay: number = 30000; // 30 seconds

  /**
   * Get onboarding progress checklist.
   * Returns the current status plus a normalized `items` array for the
   * progress-checklist UI. Falls back to an empty items array when the
   * backend does not yet populate the checklist so the UI can use its
   * local defaults.
   */
  async getOnboardingProgress(): Promise<{
    status?: OnboardingStatus;
    items: Array<{
      id: string;
      title: string;
      description: string;
      completed: boolean;
      icon: string;
      actionRoute?: string;
      estimatedTime: string;
    }>;
  }> {
    try {
      const response = await apiClient.get<GetOnboardingStatusResponse['data']>(
        'merchant/onboarding/progress'
      );
      if (response.success && response.data) {
        const data = response.data as unknown as {
          status?: OnboardingStatus;
          items?: Array<{
            id: string;
            title: string;
            description: string;
            completed: boolean;
            icon: string;
            actionRoute?: string;
            estimatedTime: string;
          }>;
        };
        return { status: data.status, items: data.items ?? [] };
      }
      return { items: [] };
    } catch (error) {
      if (__DEV__) console.error('Get onboarding progress error:', error);
      return { items: [] };
    }
  }

  /**
   * Get current onboarding status
   */
  async getOnboardingStatus(): Promise<OnboardingStatus> {
    try {
      const response = await apiClient.get<OnboardingStatus>('merchant/onboarding/status');
      if (response.success && response.data) return response.data;
      throw new Error(response.error || 'Failed to get onboarding status');
    } catch (error) {
      if (__DEV__) console.error('Get onboarding status error:', error);
      throw new Error(error.message || 'Failed to get onboarding status');
    }
  }

  /**
   * Submit a step (saves data and validates before moving to next step)
   */
  async submitStep(
    stepNumber: number,
    stepData:
      | BusinessInfoStep
      | StoreDetailsStep
      | BankDetailsStep
      | DocumentsStep
      | ReviewSubmitStep,
    validateOnly: boolean = false
  ): Promise<SubmitStepResponse['data']> {
    try {
      devLog(`📝 Submitting step ${stepNumber}...`);

      let response: unknown = { success: true, data: {} };

      if (!validateOnly) {
        switch (stepNumber) {
          case 1:
            response = await apiClient.put<{}>('merchant/onboarding/profile', stepData);
            break;
          case 2:
            break;
          case 3:
            response = await apiClient.put<{}>('merchant/onboarding/bank-details', stepData);
            break;
          case 4:
            response = await apiClient.put<{}>('merchant/onboarding/documents', stepData);
            break;
          case 5:
            break;
        }
      }

      if (response.success) {
        return {
          currentStep: stepNumber,
          overallProgress: Math.min(stepNumber * 20, 100),
          nextStep: stepNumber < 5 ? stepNumber + 1 : undefined,
          isCompleted: true,
        };
      }
      throw new Error(response.error || 'Failed to submit step');
    } catch (error) {
      if (__DEV__) console.error(`❌ Submit step ${stepNumber} error:`, error);
      throw new Error(error.message || `Failed to submit step ${stepNumber}`);
    }
  }

  /**
   * Complete a step (saves data without validating)
   */
  async completeStep(
    stepNumber: number,
    stepData:
      | BusinessInfoStep
      | StoreDetailsStep
      | BankDetailsStep
      | DocumentsStep
      | ReviewSubmitStep
  ): Promise<CompleteStepResponse['data']> {
    try {
      devLog(`✔️ Marking step ${stepNumber} as complete...`);

      let response: unknown = { success: true, data: {} };

      // Map frontend steps to actual backend REST endpoints
      switch (stepNumber) {
        case 1:
          response = await apiClient.put<{}>('merchant/onboarding/profile', stepData);
          break;
        case 2:
          // StoreDetails is mapped to the Stores API, but we might just hold it until submit
          // If a store doesn't exist, we can't reliably PUT. Safest is to mock for auto-save
          break;
        case 3:
          response = await apiClient.put<{}>('merchant/onboarding/bank-details', stepData);
          break;
        case 4:
          // Documents upload happens directly via uploadDocument. This step is just validation
          response = await apiClient.put<{}>('merchant/onboarding/documents', stepData);
          break;
        case 5:
          // Review isn't saved until submitCompleteOnboarding
          break;
      }

      if (response.success) {
        return {
          currentStep: stepNumber,
          overallProgress: Math.min(stepNumber * 20, 100),
          isStepCompleted: true,
        };
      }

      throw new Error(response.error || 'Failed to complete step');
    } catch (error) {
      if (__DEV__) console.error(`❌ Complete step ${stepNumber} error:`, error);
      throw new Error(error.message || `Failed to complete step ${stepNumber}`);
    }
  }

  /**
   * Go to previous step
   */
  async goToPreviousStep(stepNumber: number): Promise<PreviousStepResponse['data']> {
    try {
      devLog(`⬅️ Going to previous step from ${stepNumber}...`);

      const response = await apiClient.post<PreviousStepResponse['data']>(
        `merchant/onboarding/step/${stepNumber}/previous`,
        { stepNumber } as PreviousStepRequest
      );
      if (response.success && response.data) return response.data;
      throw new Error(response.error || 'Failed to go to previous step');
    } catch (error) {
      if (__DEV__) console.error(`❌ Go to previous step error:`, error);
      throw new Error(error.message || 'Failed to go to previous step');
    }
  }

  /**
   * Submit the complete onboarding (all 5 steps)
   */
  async submitCompleteOnboarding(
    businessInfo: BusinessInfoStep,
    storeDetails: StoreDetailsStep,
    bankDetails: BankDetailsStep,
    documents: DocumentsStep,
    reviewSubmit: ReviewSubmitStep
  ): Promise<SubmitOnboardingResponse['data']> {
    try {
      devLog('🚀 Submitting complete onboarding...');

      const response = await apiClient.post<SubmitOnboardingResponse['data']>(
        'merchant/onboarding/submit',
        {
          finalData: { businessInfo, storeDetails, bankDetails, documents, reviewSubmit },
        } as SubmitOnboardingRequest
      );
      if (response.success && response.data) {
        this.stopAutoSave();
        return response.data;
      }
      throw new Error(response.error || 'Failed to submit onboarding');
    } catch (error) {
      if (__DEV__) console.error('❌ Submit onboarding error:', error);
      throw new Error(error.message || 'Failed to submit onboarding');
    }
  }

  /**
   * Upload a document
   */
  async uploadDocument(
    type:
      | 'pan_card'
      | 'aadhar'
      | 'gst_certificate'
      | 'bank_statement'
      | 'business_license'
      | 'utility_bill'
      | 'other',
    fileUri: string,
    expiryDate?: string,
    onProgress?: (progress: number) => void
  ): Promise<DocumentUploadResponse['data']> {
    try {
      devLog(`📤 Uploading ${type} document...`);

      // Create FormData for file upload
      const formData = new FormData();

      const fileToUpload = {
        uri: fileUri,
        type: this.getDocumentMimeType(type),
        name: `${type}_${Date.now()}.${this.getDocumentExtension(type)}`,
      };

      formData.append('document', fileToUpload as unknown);
      formData.append('type', type);

      if (expiryDate) {
        formData.append('expiryDate', expiryDate);
      }

      // Route through apiClient so the token-refresh interceptor handles 401s.
      // onUploadProgress is passed via AxiosRequestConfig to preserve progress tracking.
      const response = await apiClient.post<DocumentUploadResponse['data']>(
        'merchant/onboarding/documents/upload',
        formData,
        onProgress
          ? {
              onUploadProgress: (event) => {
                if (event.total) {
                  onProgress(Math.round((event.loaded / event.total) * 100));
                }
              },
            }
          : undefined
      );

      if (response.success && response.data) {
        return response.data;
      }
      throw new Error((response as unknown).message || 'Failed to upload document');
    } catch (error) {
      if (__DEV__) console.error(`❌ Upload ${type} document error:`, error);
      throw new Error(error.message || `Failed to upload ${type} document`);
    }
  }

  /**
   * Get all uploaded documents
   */
  async getDocuments(): Promise<GetDocumentsResponse['data']> {
    try {
      const response = await apiClient.get<GetDocumentsResponse['data']>(
        'merchant/onboarding/documents'
      );
      if (response.success && response.data) return response.data;
      throw new Error(response.error || 'Failed to get documents');
    } catch (error) {
      if (__DEV__) console.error('Get documents error:', error);
      throw new Error(error.message || 'Failed to get documents');
    }
  }

  /**
   * Delete a document by index
   */
  async deleteDocument(documentIndex: number): Promise<DeleteDocumentResponse['data']> {
    try {
      const response = await apiClient.delete<DeleteDocumentResponse['data']>(
        `merchant/onboarding/documents/${documentIndex}`,
        { data: { documentIndex } as DeleteDocumentRequest }
      );
      if (response.success && response.data) return response.data;
      throw new Error(response.error || 'Failed to delete document');
    } catch (error) {
      if (__DEV__) console.error('Delete document error:', error);
      throw new Error(error.message || 'Failed to delete document');
    }
  }

  /**
   * Validate GST Number
   */
  validateGSTNumber(gstNumber: string): ValidationResult {
    devLog('🔍 Validating GST number...');

    // GST number format: 2-digit state code + 10-digit PAN + 1-digit entity number + 1-digit checksum
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    if (!gstNumber) {
      return {
        isValid: false,
        errors: { gstNumber: 'GST number is required' },
      };
    }

    const cleanGST = gstNumber.toUpperCase().trim();

    if (!gstRegex.test(cleanGST)) {
      return {
        isValid: false,
        errors: { gstNumber: 'Invalid GST number format' },
        warnings: { gstNumber: 'GST should be 15 characters (numeric and uppercase letters)' },
      };
    }

    devLog('✅ GST number is valid');
    return {
      isValid: true,
      errors: {},
    };
  }

  /**
   * Validate PAN Number
   */
  validatePANNumber(panNumber: string): ValidationResult {
    devLog('🔍 Validating PAN number...');

    // PAN format: 5 letters + 4 digits + 1 letter
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

    if (!panNumber) {
      return {
        isValid: false,
        errors: { panNumber: 'PAN number is required' },
      };
    }

    const cleanPAN = panNumber.toUpperCase().trim();

    if (!panRegex.test(cleanPAN)) {
      return {
        isValid: false,
        errors: { panNumber: 'Invalid PAN number format' },
        warnings: { panNumber: 'PAN should be 10 characters (5 letters + 4 digits + 1 letter)' },
      };
    }

    devLog('✅ PAN number is valid');
    return {
      isValid: true,
      errors: {},
    };
  }

  /**
   * Validate IFSC Code
   */
  validateIFSCCode(ifscCode: string): ValidationResult {
    devLog('🔍 Validating IFSC code...');

    // IFSC format: 4 letters (bank code) + 0 + 6 characters (branch code)
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;

    if (!ifscCode) {
      return {
        isValid: false,
        errors: { ifscCode: 'IFSC code is required' },
      };
    }

    const cleanIFSC = ifscCode.toUpperCase().trim();

    if (!ifscRegex.test(cleanIFSC)) {
      return {
        isValid: false,
        errors: { ifscCode: 'Invalid IFSC code format' },
        warnings: { ifscCode: 'IFSC should be 11 characters (4 letters + 0 + 6 characters)' },
      };
    }

    devLog('✅ IFSC code is valid');
    return {
      isValid: true,
      errors: {},
    };
  }

  /**
   * Validate Account Number
   */
  validateAccountNumber(accountNumber: string, confirmAccountNumber: string): ValidationResult {
    devLog('🔍 Validating account number...');

    const errors: Record<string, string> = {};

    if (!accountNumber || accountNumber.trim().length === 0) {
      errors.accountNumber = 'Account number is required';
    } else if (accountNumber.length < 9 || accountNumber.length > 18) {
      errors.accountNumber = 'Account number should be 9-18 digits';
    } else if (!/^\d+$/.test(accountNumber)) {
      errors.accountNumber = 'Account number should contain only digits';
    }

    if (!confirmAccountNumber || confirmAccountNumber.trim().length === 0) {
      errors.confirmAccountNumber = 'Please confirm account number';
    } else if (accountNumber !== confirmAccountNumber) {
      errors.confirmAccountNumber = 'Account numbers do not match';
    }

    if (Object.keys(errors).length > 0) {
      devLog('❌ Account number validation failed:', errors);
      return {
        isValid: false,
        errors,
      };
    }

    devLog('✅ Account number is valid');
    return {
      isValid: true,
      errors: {},
    };
  }

  /**
   * Validate Bank Details
   */
  async validateBankDetails(
    accountNumber: string,
    ifscCode: string,
    panNumber: string,
    gstNumber?: string
  ): Promise<BankValidationResult> {
    devLog('🏦 Validating bank details...');

    const result: BankValidationResult = {
      ifscValid: this.validateIFSCCode(ifscCode).isValid,
      accountNumberValid: this.validateAccountNumber(accountNumber, accountNumber).isValid,
      panValid: this.validatePANNumber(panNumber).isValid,
      gstValid: gstNumber ? this.validateGSTNumber(gstNumber).isValid : true,
    };

    devLog('✅ Bank details validation result:', result);
    return result;
  }

  /**
   * Start auto-saving data
   */
  startAutoSave(
    stepNumber: number,
    stepData:
      | BusinessInfoStep
      | StoreDetailsStep
      | BankDetailsStep
      | DocumentsStep
      | ReviewSubmitStep,
    interval?: number
  ): void {
    devLog(`⏱️ Starting auto-save for step ${stepNumber}...`);

    if (this.autoSaveInterval) {
      this.stopAutoSave();
    }

    if (interval) {
      this.autoSaveDelay = interval;
    }

    this.autoSaveInterval = setInterval(async () => {
      try {
        await this.completeStep(stepNumber, stepData);
        devLog(`✅ Auto-saved step ${stepNumber}`);
      } catch (error) {
        devWarn(`⚠️ Auto-save failed for step ${stepNumber}:`, error);
      }
    }, this.autoSaveDelay);
  }

  /**
   * Stop auto-saving
   */
  stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
      devLog('⏹️ Auto-save stopped');
    }
  }

  /**
   * Validate Business Info Step
   */
  validateBusinessInfo(data: BusinessInfoStep): ValidationResult {
    devLog('🔍 Validating business info...');
    const errors: Record<string, string> = {};

    if (!data.businessName || data.businessName.trim().length === 0) {
      errors.businessName = 'Business name is required';
    }

    if (!data.ownerName || data.ownerName.trim().length === 0) {
      errors.ownerName = 'Owner name is required';
    }

    if (!data.ownerEmail || data.ownerEmail.trim().length === 0) {
      errors.ownerEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.ownerEmail)) {
      errors.ownerEmail = 'Invalid email format';
    }

    if (!data.ownerPhone || data.ownerPhone.trim().length === 0) {
      errors.ownerPhone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(data.ownerPhone.replace(/\D/g, ''))) {
      errors.ownerPhone = 'Phone number should be 10 digits';
    }

    if (!data.businessType) {
      errors.businessType = 'Business type is required';
    }

    if (!data.businessCategory) {
      errors.businessCategory = 'Business category is required';
    }

    if (data.yearsInBusiness < 0) {
      errors.yearsInBusiness = 'Years in business cannot be negative';
    }

    if (Object.keys(errors).length > 0) {
      devLog('❌ Business info validation failed:', errors);
      return { isValid: false, errors };
    }

    devLog('✅ Business info is valid');
    return { isValid: true, errors: {} };
  }

  /**
   * Validate Store Details Step
   */
  validateStoreDetails(data: StoreDetailsStep): ValidationResult {
    devLog('🔍 Validating store details...');
    const errors: Record<string, string> = {};

    if (!data.storeName || data.storeName.trim().length === 0) {
      errors.storeName = 'Store name is required';
    }

    if (!data.storeType) {
      errors.storeType = 'Store type is required';
    }

    if (!data.storeAddress.street) {
      errors.street = 'Street address is required';
    }

    if (!data.storeAddress.city) {
      errors.city = 'City is required';
    }

    if (!data.storeAddress.state) {
      errors.state = 'State is required';
    }

    if (!data.storeAddress.zipCode) {
      errors.zipCode = 'Zip code is required';
    } else if (!/^\d{5,6}$/.test(data.storeAddress.zipCode.replace(/\D/g, ''))) {
      errors.zipCode = 'Zip code should be 5-6 digits';
    }

    if (!data.storePhone) {
      errors.storePhone = 'Store phone is required';
    } else if (!/^\d{10}$/.test(data.storePhone.replace(/\D/g, ''))) {
      errors.storePhone = 'Phone number should be 10 digits';
    }

    if (Object.keys(errors).length > 0) {
      devLog('❌ Store details validation failed:', errors);
      return { isValid: false, errors };
    }

    devLog('✅ Store details are valid');
    return { isValid: true, errors: {} };
  }

  /**
   * Validate Bank Details Step
   */
  validateBankDetailsStep(data: BankDetailsStep): ValidationResult {
    devLog('🔍 Validating bank details...');
    const errors: Record<string, string> = {};

    if (!data.accountHolderName || data.accountHolderName.trim().length === 0) {
      errors.accountHolderName = 'Account holder name is required';
    }

    if (!data.accountNumber || data.accountNumber.trim().length === 0) {
      errors.accountNumber = 'Account number is required';
    }

    if (!data.bankName || data.bankName.trim().length === 0) {
      errors.bankName = 'Bank name is required';
    }

    if (!data.branchName || data.branchName.trim().length === 0) {
      errors.branchName = 'Branch name is required';
    }

    const ifscValidation = this.validateIFSCCode(data.ifscCode);
    if (!ifscValidation.isValid) {
      errors.ifscCode = ifscValidation.errors.ifscCode;
    }

    const panValidation = this.validatePANNumber(data.panNumber);
    if (!panValidation.isValid) {
      errors.panNumber = panValidation.errors.panNumber;
    }

    if (data.gstRegistered && data.gstNumber) {
      const gstValidation = this.validateGSTNumber(data.gstNumber);
      if (!gstValidation.isValid) {
        errors.gstNumber = gstValidation.errors.gstNumber;
      }
    }

    if (!data.accountType) {
      errors.accountType = 'Account type is required';
    }

    if (Object.keys(errors).length > 0) {
      devLog('❌ Bank details validation failed:', errors);
      return { isValid: false, errors };
    }

    devLog('✅ Bank details are valid');
    return { isValid: true, errors: {} };
  }

  /**
   * Validate Documents Step
   */
  validateDocuments(data: DocumentsStep): ValidationResult {
    devLog('🔍 Validating documents...');
    const errors: Record<string, string> = {};

    if (!data.documents || data.documents.length === 0) {
      errors.documents = 'At least one document is required';
    } else {
      // Check if all required documents are uploaded
      const requiredTypes = ['pan_card', 'aadhar'];
      const uploadedTypes = data.documents.map((d) => d.type);

      requiredTypes.forEach((type) => {
        if (!uploadedTypes.includes(type as unknown)) {
          errors[type] = `${type.replace('_', ' ')} document is required`;
        }
      });
    }

    if (Object.keys(errors).length > 0) {
      devLog('❌ Documents validation failed:', errors);
      return { isValid: false, errors };
    }

    devLog('✅ Documents are valid');
    return { isValid: true, errors: {} };
  }

  /**
   * Validate Review & Submit Step
   */
  validateReviewSubmit(data: ReviewSubmitStep): ValidationResult {
    devLog('🔍 Validating review & submit...');
    const errors: Record<string, string> = {};

    if (!data.agreedToTerms) {
      errors.agreedToTerms = 'You must agree to terms and conditions';
    }

    if (!data.agreedToPrivacy) {
      errors.agreedToPrivacy = 'You must agree to privacy policy';
    }

    if (!data.agreedToDataProcessing) {
      errors.agreedToDataProcessing = 'You must agree to data processing';
    }

    if (Object.keys(errors).length > 0) {
      devLog('❌ Review & submit validation failed:', errors);
      return { isValid: false, errors };
    }

    devLog('✅ Review & submit is valid');
    return { isValid: true, errors: {} };
  }

  /**
   * Helper: Get document MIME type
   */
  private getDocumentMimeType(type: string): string {
    const mimeTypes: Record<string, string> = {
      pan_card: 'image/jpeg',
      aadhar: 'image/jpeg',
      gst_certificate: 'application/pdf',
      bank_statement: 'application/pdf',
      business_license: 'application/pdf',
      utility_bill: 'image/jpeg',
      other: 'application/octet-stream',
    };
    return mimeTypes[type] || 'application/octet-stream';
  }

  /**
   * Helper: Get document file extension
   */
  private getDocumentExtension(type: string): string {
    const extensions: Record<string, string> = {
      pan_card: 'jpg',
      aadhar: 'jpg',
      gst_certificate: 'pdf',
      bank_statement: 'pdf',
      business_license: 'pdf',
      utility_bill: 'jpg',
      other: 'bin',
    };
    return extensions[type] || 'bin';
  }
}

// Create and export singleton instance
export const onboardingService = new OnboardingService();
export default onboardingService;
