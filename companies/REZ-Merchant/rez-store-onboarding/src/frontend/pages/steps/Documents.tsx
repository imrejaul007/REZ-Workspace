import React, { useState } from 'react';
import { FileText, Shield, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import FileUpload from '../../components/FileUpload';

interface DocumentsData {
  gst: File | null;
  pan: File | null;
  addressProof: File | null;
  gstNumber: string;
}

interface DocumentsProps {
  initialData?: Partial<DocumentsData>;
  onSubmit: (data: DocumentsData) => void;
  onSkip?: () => void;
  isLoading?: boolean;
}

export const Documents: React.FC<DocumentsProps> = ({
  initialData,
  onSubmit,
  onSkip,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<DocumentsData>({
    gst: initialData?.gst || null,
    pan: initialData?.pan || null,
    addressProof: initialData?.addressProof || null,
    gstNumber: initialData?.gstNumber || '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof DocumentsData, string>>>({});

  const documentTypes = [
    {
      id: 'gst' as const,
      name: 'GST Certificate',
      description: 'Certificate of GST registration',
      icon: FileText,
      required: true,
    },
    {
      id: 'pan' as const,
      name: 'PAN Card',
      description: 'Business or individual PAN card',
      icon: Shield,
      required: true,
    },
    {
      id: 'addressProof' as const,
      name: 'Address Proof',
      description: 'Electricity bill, rent agreement, or utility bill',
      icon: FileText,
      required: true,
    },
  ];

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof DocumentsData, string>> = {};

    if (formData.gst) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(formData.gst.type)) {
        newErrors.gst = 'Please upload PDF, JPG, or PNG file';
      }
    }

    if (!formData.gstNumber.trim()) {
      newErrors.gstNumber = 'GST Number is required';
    } else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstNumber)) {
      newErrors.gstNumber = 'Invalid GST Number format';
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

  const handleFileChange = (field: keyof DocumentsData) => (file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleGstNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setFormData(prev => ({ ...prev, gstNumber: value }));
    if (errors.gstNumber) {
      setErrors(prev => ({ ...prev, gstNumber: undefined }));
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
        <p className="text-gray-600 mt-2">
          Upload the required documents for verification
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex items-start gap-3">
        <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-blue-800 font-medium">
            Document Verification
          </p>
          <p className="text-sm text-blue-700 mt-1">
            Documents are usually verified within 24-48 hours. You can continue
            with other steps while verification is in progress.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* GST Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            GST Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="gstNumber"
            value={formData.gstNumber}
            onChange={handleGstNumberChange}
            placeholder="Enter 15-digit GST Number (e.g., 27AABCU9603R1ZM)"
            maxLength={15}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono tracking-wider ${
              errors.gstNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            disabled={isLoading}
          />
          {errors.gstNumber && (
            <p className="mt-1 text-sm text-red-500">{errors.gstNumber}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Format: 27AABCU9603R1ZM (2 digits + 10 chars + 1 char + 1 char + 1 char)
          </p>
        </div>

        {/* Document Uploads */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Upload Documents</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {documentTypes.map(doc => {
              const Icon = doc.icon;
              const file = formData[doc.id];

              return (
                <div
                  key={doc.id}
                  className="border border-gray-200 rounded-lg p-4 bg-white"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {doc.name}
                        {doc.required && <span className="text-red-500 ml-1">*</span>}
                      </h4>
                      <p className="text-xs text-gray-500">{doc.description}</p>
                    </div>
                  </div>

                  <FileUpload
                    label=""
                    accept=".pdf,.jpg,.jpeg,.png"
                    maxSize={10}
                    value={file}
                    onChange={handleFileChange(doc.id)}
                    error={errors[doc.id]}
                    disabled={isLoading}
                  />

                  {file && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>Uploaded</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Document Status Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Document Verification Status</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <span>Pending</span>
              </div>
              <span className="text-gray-500">Awaiting upload</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-400" />
                <span>Under Review</span>
              </div>
              <span className="text-gray-500">Within 24-48 hours</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span>Verified</span>
              </div>
              <span className="text-gray-500">Documents approved</span>
            </div>
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
                Uploading...
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

export default Documents;
