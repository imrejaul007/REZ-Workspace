import React from 'react';
import { Check, Circle, Loader2 } from 'lucide-react';
import { OnboardingStep } from '../services/api';

interface StepIndicatorProps {
  steps: OnboardingStep[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  showDescriptions?: boolean;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentStep,
  onStepClick,
  showDescriptions = true,
}) => {
  const getStepIcon = (step: OnboardingStep, index: number) => {
    if (step.status === 'completed') {
      return <Check className="w-5 h-5 text-white" />;
    }
    if (step.status === 'in_progress') {
      return <Loader2 className="w-5 h-5 text-white animate-spin" />;
    }
    if (step.status === 'skipped') {
      return <span className="text-white text-sm font-bold">S</span>;
    }
    return <span className="text-white text-sm font-bold">{index + 1}</span>;
  };

  const getStepClasses = (step: OnboardingStep, index: number) => {
    const baseClasses = 'flex items-center gap-3 transition-all';
    if (step.status === 'completed') {
      return `${baseClasses} cursor-pointer`;
    }
    if (step.status === 'in_progress') {
      return `${baseClasses} cursor-default`;
    }
    if (step.status === 'skipped' || step.status === 'pending') {
      return index < currentStep ? `${baseClasses} cursor-pointer opacity-75` : `${baseClasses} opacity-50`;
    }
    return baseClasses;
  };

  const getStepCircleClasses = (step: OnboardingStep) => {
    if (step.status === 'completed') {
      return 'w-8 h-8 rounded-full bg-green-500 flex items-center justify-center';
    }
    if (step.status === 'in_progress') {
      return 'w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center';
    }
    if (step.status === 'skipped') {
      return 'w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center';
    }
    return 'w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center';
  };

  return (
    <div className="w-full">
      {/* Desktop View */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div
              className={getStepClasses(step, index)}
              onClick={() => {
                if (
                  (step.status === 'completed' || index < currentStep) &&
                  onStepClick &&
                  step.status !== 'skipped'
                ) {
                  onStepClick(index);
                }
              }}
            >
              <div className={getStepCircleClasses(step)}>{getStepIcon(step, index)}</div>
              <div className="text-left">
                <p className={`text-sm font-medium ${step.status === 'in_progress' ? 'text-blue-600' : 'text-gray-700'}`}>
                  {step.name}
                </p>
                {showDescriptions && (
                  <p className="text-xs text-gray-500">{step.description}</p>
                )}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-4 rounded ${
                  index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Mobile View */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-sm font-medium text-blue-600">
            {steps[currentStep]?.name}
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 overflow-x-auto pb-2">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => onStepClick?.(index)}
              className={`flex-shrink-0 mx-1 ${getStepCircleClasses(step)}`}
            >
              {getStepIcon(step, index)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepIndicator;
