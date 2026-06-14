import React, { useState } from 'react';
import { Building2, MapPin, Phone, Mail, Clock } from 'lucide-react';

interface BasicInfoData {
  storeName: string;
  storeType: 'retail' | 'restaurant' | 'grocery' | 'pharmacy';
  phone: string;
  email: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
}

interface BasicInfoProps {
  initialData?: BasicInfoData;
  onSubmit: (data: BasicInfoData) => void;
  onSkip?: () => void;
  isLoading?: boolean;
}

export const BasicInfo: React.FC<BasicInfoProps> = ({
  initialData,
  onSubmit,
  onSkip,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<BasicInfoData>({
    storeName: initialData?.storeName || '',
    storeType: initialData?.storeType || 'retail',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    street: initialData?.street || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    pincode: initialData?.pincode || '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof BasicInfoData, string>>>({});

  const storeTypes = [
    { value: 'retail', label: 'Retail Store', icon: Building2 },
    { value: 'grocery', label: 'Grocery Store', icon: Building2 },
    { value: 'pharmacy', label: 'Pharmacy', icon: Building2 },
    { value: 'restaurant', label: 'Restaurant', icon: Building2 },
  ];

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof BasicInfoData, string>> = {};

    if (!formData.storeName.trim()) {
      newErrors.storeName = 'Store name is required';
    } else if (formData.storeName.length < 3) {
      newErrors.storeName = 'Store name must be at least 3 characters';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[+]?[0-9]{10,13}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Invalid phone number format';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.street.trim()) {
      newErrors.street = 'Street address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^[0-9]{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Pincode must be 6 digits';
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof BasicInfoData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
        <p className="text-gray-600 mt-2">Tell us about your store</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Store Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Store Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              name="storeName"
              value={formData.storeName}
              onChange={handleChange}
              placeholder="Enter your store name"
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.storeName ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isLoading}
            />
          </div>
          {errors.storeName && (
            <p className="mt-1 text-sm text-red-500">{errors.storeName}</p>
          )}
        </div>

        {/* Store Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Store Type <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {storeTypes.map(type => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, storeType: type.value as BasicInfoData['storeType'] }))}
                  className={`p-4 border rounded-lg text-center transition-all ${
                    formData.storeType === type.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isLoading}
                >
                  <Icon className="w-6 h-6 mx-auto mb-2" />
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 98765 43210"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
              />
            </div>
            {errors.phone && (
              <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="store@example.com"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Store Address
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleChange}
                placeholder="123 Main Street, Building Name"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.street ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
              />
              {errors.street && (
                <p className="mt-1 text-sm text-red-500">{errors.street}</p>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Mumbai"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.city ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isLoading}
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-500">{errors.city}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Maharashtra"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.state ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isLoading}
                />
                {errors.state && (
                  <p className="mt-1 text-sm text-red-500">{errors.state}</p>
                )}
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pincode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="400001"
                  maxLength={6}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.pincode ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isLoading}
                />
                {errors.pincode && (
                  <p className="mt-1 text-sm text-red-500">{errors.pincode}</p>
                )}
              </div>
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

export default BasicInfo;
