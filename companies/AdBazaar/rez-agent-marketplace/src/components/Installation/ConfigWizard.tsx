'use client';

import { useState } from 'react';
import { Check, ChevronRight, ChevronLeft, Building2, MapPin, Shield, GraduationCap } from 'lucide-react';
import { useMarketplaceStore } from '@/store/marketplaceStore';

const STEPS = [
  { id: 0, name: 'Business Details', icon: Building2 },
  { id: 1, name: 'Locations', icon: MapPin },
  { id: 2, name: 'Permissions', icon: Shield },
  { id: 3, name: 'Setup', icon: GraduationCap },
];

const PERMISSIONS = [
  { id: 'customer_data', label: 'Access customer data', description: 'View and manage customer information' },
  { id: 'transactions', label: 'Process transactions', description: 'Handle payments and refunds' },
  { id: 'inventory', label: 'Manage inventory', description: 'Track and update stock levels' },
  { id: 'reports', label: 'Generate reports', description: 'Create business analytics reports' },
  { id: 'notifications', label: 'Send notifications', description: 'Email and SMS customer communications' },
  { id: 'integrations', label: 'Access integrations', description: 'Connect with third-party services' },
];

export default function ConfigWizard() {
  const {
    installationConfig,
    updateInstallationConfig,
    installationStep,
    setInstallationStep,
    completeInstallation,
    cancelInstallation,
    selectedAgent,
  } = useMarketplaceStore();

  const [businessName, setBusinessName] = useState(installationConfig?.businessName || '');
  const [locations, setLocations] = useState<string[]>(installationConfig?.locations || []);
  const [newLocation, setNewLocation] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    installationConfig?.permissions || ['customer_data', 'notifications']
  );
  const [trainingComplete, setTrainingComplete] = useState(false);

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  const addLocation = () => {
    if (newLocation.trim()) {
      setLocations(prev => [...prev, newLocation.trim()]);
      setNewLocation('');
    }
  };

  const removeLocation = (index: number) => {
    setLocations(prev => prev.filter((_, i) => i !== index));
  };

  const canProceed = () => {
    switch (installationStep) {
      case 0:
        return businessName.trim().length > 0;
      case 1:
        return locations.length > 0;
      case 2:
        return selectedPermissions.length > 0;
      case 3:
        return trainingComplete;
      default:
        return true;
    }
  };

  const handleNext = () => {
    updateInstallationConfig({
      businessName,
      locations,
      permissions: selectedPermissions,
      trainingComplete,
    });

    if (installationStep < STEPS.length - 1) {
      setInstallationStep(installationStep + 1);
    } else {
      completeInstallation();
    }
  };

  const handleBack = () => {
    if (installationStep > 0) {
      setInstallationStep(installationStep - 1);
    }
  };

  if (!selectedAgent || !installationConfig) {
    return null;
  }

  const currentStep = STEPS[installationStep];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{selectedAgent.icon}</span>
              <div>
                <h1 className="text-lg font-bold">Install {selectedAgent.name}</h1>
                <p className="text-xs text-gray-500">Configuration Wizard</p>
              </div>
            </div>
            <button
              onClick={cancelInstallation}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index < installationStep;
              const isCurrent = index === installationStep;

              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isCurrent
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span className={`ml-3 text-sm font-medium hidden sm:block ${
                      isCurrent ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {step.name}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`w-16 sm:w-24 h-1 mx-4 rounded ${
                        index < installationStep ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {/* Step 1: Business Details */}
          {installationStep === 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Tell us about your business</h2>
              <p className="text-gray-600 mb-6">
                We'll customize {selectedAgent.name} for your specific needs.
              </p>

              <div className="space-y-6">
                <div>
                  <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Enter your business name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <h3 className="font-medium text-gray-900 mb-3">What to expect:</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5" />
                      Personalized configuration based on your industry
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5" />
                      Automatic integration with popular platforms
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5" />
                      Recommended settings for best performance
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Locations */}
          {installationStep === 1 && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Where will you use {selectedAgent.name}?</h2>
              <p className="text-gray-600 mb-6">
                Add the locations where you want to deploy this agent.
              </p>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addLocation()}
                    placeholder="Enter location name (e.g., Main Street Branch)"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <button
                    onClick={addLocation}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                </div>

                {locations.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      {locations.length} location{locations.length !== 1 ? 's' : ''} added
                    </h3>
                    <div className="space-y-2">
                      {locations.map((location, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-gray-400" />
                            <span className="font-medium">{location}</span>
                          </div>
                          <button
                            onClick={() => removeLocation(index)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {locations.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                    <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">Add at least one location</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Permissions */}
          {installationStep === 2 && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Set agent permissions</h2>
              <p className="text-gray-600 mb-6">
                Choose what {selectedAgent.name} can access and do on your behalf.
              </p>

              <div className="space-y-3">
                {PERMISSIONS.map((permission) => (
                  <label
                    key={permission.id}
                    className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedPermissions.includes(permission.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(permission.id)}
                      onChange={() => togglePermission(permission.id)}
                      className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{permission.label}</p>
                      <p className="text-sm text-gray-500">{permission.description}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-sm text-amber-800">
                  <strong>Tip:</strong> You can change permissions later in settings. Start with essential permissions and expand as needed.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Setup & Training */}
          {installationStep === 3 && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Final setup</h2>
              <p className="text-gray-600 mb-6">
                Complete the initial training to get the most out of your agent.
              </p>

              <div className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-medium mb-2">Configuration Summary</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Business:</dt>
                      <dd className="font-medium">{businessName}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Locations:</dt>
                      <dd className="font-medium">{locations.length} location{locations.length !== 1 ? 's' : ''}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Permissions:</dt>
                      <dd className="font-medium">{selectedPermissions.length} enabled</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Plan:</dt>
                      <dd className="font-medium">
                        {selectedAgent.pricingPlans.find(p => p.recommended)?.name || selectedAgent.pricingPlans[0]?.name}
                      </dd>
                    </div>
                  </dl>
                </div>

                <label className="flex items-start gap-4 p-4 rounded-xl border-2 border-blue-500 bg-blue-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={trainingComplete}
                    onChange={(e) => setTrainingComplete(e.target.checked)}
                    className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900">I've reviewed the configuration</p>
                    <p className="text-sm text-gray-500">
                      I understand the agent will have the permissions I've granted and will be active at the specified locations.
                    </p>
                  </div>
                </label>

                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <h3 className="font-medium text-green-800 mb-2">What happens next?</h3>
                  <ul className="space-y-1 text-sm text-green-700">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      Agent will be deployed to your selected locations
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      You'll receive a confirmation email with setup instructions
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      Initial training data will be processed (usually within 24 hours)
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={handleBack}
              disabled={installationStep === 0}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                installationStep === 0
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                canProceed()
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {installationStep === STEPS.length - 1 ? (
                <>
                  Complete Installation
                  <Check className="w-4 h-4" />
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
