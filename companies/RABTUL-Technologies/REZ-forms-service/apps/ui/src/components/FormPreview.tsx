'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, Monitor, Smartphone, RotateCcw, CheckCircle } from 'lucide-react';

interface Form {
  id: string;
  title: string;
  description?: string;
  fields: any[];
  branding: {
    primaryColor: string;
    backgroundColor: string;
    fontFamily?: string;
  };
}

interface FormPreviewProps {
  form: Form;
}

type DeviceType = 'desktop' | 'mobile';

export function FormPreview({ form }: FormPreviewProps) {
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);

  const previewWidth = device === 'mobile' ? '375px' : '100%';

  const resetPreview = () => {
    setAnswers({});
    setCurrentStep(0);
    setSubmitted(false);
  };

  const handleAnswer = (fieldId: string, value: any) => {
    setAnswers({ ...answers, [fieldId]: value });
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const nextStep = () => {
    if (currentStep < form.fields.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  if (submitted) {
    return (
      <div className="flex justify-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center py-16 max-w-md"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank you!</h2>
          <p className="text-gray-500 mb-6">Your response has been submitted successfully.</p>
          <button
            onClick={resetPreview}
            className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg mx-auto"
          >
            <RotateCcw className="w-4 h-4" />
            Submit another response
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      {/* Device Toggle */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={() => setDevice('desktop')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            device === 'desktop'
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Monitor className="w-4 h-4" />
          Desktop
        </button>
        <button
          onClick={() => setDevice('mobile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            device === 'mobile'
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          Mobile
        </button>
      </div>

      {/* Preview Container */}
      <div className="flex justify-center">
        <div
          className="bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300"
          style={{
            width: previewWidth,
            maxWidth: '100%',
          }}
        >
          {/* Form Header */}
          <div
            className="p-8 text-center"
            style={{ backgroundColor: form.branding?.primaryColor || '#000' }}
          >
            <h1 className="text-2xl font-bold text-white">{form.title}</h1>
            {form.description && (
              <p className="text-white/80 mt-2">{form.description}</p>
            )}
          </div>

          {/* Progress Bar */}
          <div className="h-1 bg-gray-100">
            <div
              className="h-full bg-purple-600 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / form.fields.length) * 100}%` }}
            />
          </div>

          {/* Form Fields */}
          <div className="p-8">
            {form.fields.map((field, index) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: index === currentStep ? 1 : 0.3,
                  y: 0,
                }}
                className={index === currentStep ? 'block' : 'hidden'}
              >
                <label className="block text-lg font-medium text-gray-900 mb-2">
                  {field.question}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {field.description && (
                  <p className="text-sm text-gray-500 mb-4">{field.description}</p>
                )}

                {/* Input based on field type */}
                <div className="mb-6">
                  {field.type === 'short_text' && (
                    <input
                      type="text"
                      placeholder={field.placeholder || 'Type here...'}
                      value={answers[field.id] || ''}
                      onChange={(e) => handleAnswer(field.id, e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  )}

                  {field.type === 'long_text' && (
                    <textarea
                      placeholder={field.placeholder || 'Type here...'}
                      value={answers[field.id] || ''}
                      onChange={(e) => handleAnswer(field.id, e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={4}
                    />
                  )}

                  {field.type === 'email' && (
                    <input
                      type="email"
                      placeholder={field.placeholder || 'email@example.com'}
                      value={answers[field.id] || ''}
                      onChange={(e) => handleAnswer(field.id, e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  )}

                  {field.type === 'phone' && (
                    <input
                      type="tel"
                      placeholder={field.placeholder || '+91 98765 43210'}
                      value={answers[field.id] || ''}
                      onChange={(e) => handleAnswer(field.id, e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  )}

                  {field.type === 'number' && (
                    <input
                      type="number"
                      placeholder={field.placeholder || '0'}
                      value={answers[field.id] || ''}
                      onChange={(e) => handleAnswer(field.id, e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  )}

                  {field.type === 'date' && (
                    <input
                      type="date"
                      value={answers[field.id] || ''}
                      onChange={(e) => handleAnswer(field.id, e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  )}

                  {field.type === 'multiple_choice' && (
                    <div className="space-y-2">
                      {field.options?.map((option: string, i: number) => (
                        <label
                          key={i}
                          className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-purple-300 has-[:checked]:border-purple-500 has-[:checked]:bg-purple-50"
                        >
                          <input
                            type="radio"
                            name={field.id}
                            value={option}
                            checked={answers[field.id] === option}
                            onChange={() => handleAnswer(field.id, option)}
                            className="w-4 h-4 text-purple-600"
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {field.type === 'dropdown' && (
                    <select
                      value={answers[field.id] || ''}
                      onChange={(e) => handleAnswer(field.id, e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select...</option>
                      {field.options?.map((option: string, i: number) => (
                        <option key={i} value={option}>{option}</option>
                      ))}
                    </select>
                  )}

                  {field.type === 'checkbox' && (
                    <div className="space-y-2">
                      {field.options?.map((option: string, i: number) => (
                        <label
                          key={i}
                          className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-purple-300"
                        >
                          <input
                            type="checkbox"
                            checked={(answers[field.id] || []).includes(option)}
                            onChange={(e) => {
                              const current = answers[field.id] || [];
                              const updated = e.target.checked
                                ? [...current, option]
                                : current.filter((v: string) => v !== option);
                              handleAnswer(field.id, updated);
                            }}
                            className="w-4 h-4 text-purple-600 rounded"
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {field.type === 'rating' && (
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleAnswer(field.id, star)}
                          className={`w-10 h-10 rounded-full transition-colors ${
                            (answers[field.id] || 0) >= star
                              ? 'bg-yellow-400 text-white'
                              : 'bg-gray-100 text-gray-400 hover:bg-yellow-100'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  )}

                  {field.type === 'yes_no' && (
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleAnswer(field.id, 'Yes')}
                        className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                          answers[field.id] === 'Yes'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => handleAnswer(field.id, 'No')}
                        className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                          answers[field.id] === 'No'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  )}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-6">
                  <button
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Back
                  </button>

                  <button
                    onClick={nextStep}
                    disabled={field.required && !answers[field.id]}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {currentStep === form.fields.length - 1 ? 'Submit' : 'Next →'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-gray-50 text-center text-sm text-gray-400">
            Powered by REZ Forms
          </div>
        </div>
      </div>
    </div>
  );
}