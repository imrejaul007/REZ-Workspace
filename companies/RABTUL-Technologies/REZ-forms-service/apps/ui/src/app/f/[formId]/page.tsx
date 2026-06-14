'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, Star, Upload, Loader2, AlertCircle,
  ArrowRight, ArrowLeft, FileText, Shield
} from 'lucide-react';

interface Form {
  id: string;
  title: string;
  description?: string;
  fields: Field[];
  settings: {
    showProgressBar: boolean;
    showQuestionNumbers: boolean;
    confirmationMessage: string;
    requireCorpID: boolean;
  };
  branding: {
    primaryColor: string;
    backgroundColor: string;
    hidePoweredBy: boolean;
  };
  published: boolean;
}

interface Field {
  id: string;
  type: string;
  question: string;
  description?: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export default function PublicFormPage() {
  const params = useParams();
  const formId = params.formId as string;

  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchForm();
  }, [formId]);

  const fetchForm = async () => {
    try {
      const res = await fetch(`/api/forms/${formId}`);
      if (!res.ok) throw new Error('Form not found');
      const data = await res.json();
      setForm(data);
    } catch (err) {
      setError('Form not found or unavailable');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (fieldId: string, value: any) => {
    setAnswers({ ...answers, [fieldId]: value });
  };

  const nextStep = () => {
    if (form && currentStep < form.fields.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    if (!form) return false;
    const field = form.fields[currentStep];
    if (!field.required) return true;
    const answer = answers[field.id];
    if (Array.isArray(answer)) return answer.length > 0;
    return !!answer;
  };

  const handleSubmit = async () => {
    if (!form) return;
    setSubmitting(true);

    try {
      const formattedAnswers = form.fields.map(field => ({
        fieldId: field.id,
        value: answers[field.id] || null,
        type: field.type,
      }));

      const res = await fetch(`/api/submissions/${form.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: formattedAnswers }),
      });

      if (!res.ok) throw new Error('Failed to submit');
      setSubmitted(true);
    } catch (err) {
      alert('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Form not found</h1>
          <p className="text-gray-500">This form may have been removed or is not available.</p>
        </div>
      </div>
    );
  }

  if (!form.published) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Form not published</h1>
          <p className="text-gray-500">This form is not accepting responses yet.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank you!</h2>
          <p className="text-gray-500">{form.settings.confirmationMessage || 'Your response has been recorded.'}</p>
        </motion.div>
      </div>
    );
  }

  const currentField = form.fields[currentStep];
  const progress = ((currentStep + 1) / form.fields.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div
        className="py-12 px-4"
        style={{ backgroundColor: form.branding.primaryColor }}
      >
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-white">{form.title}</h1>
          {form.description && (
            <p className="text-white/80 mt-3 text-lg">{form.description}</p>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {form.settings.showProgressBar && (
        <div className="h-1 bg-gray-200">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-purple-600 transition-all duration-300"
          />
        </div>
      )}

      {/* Form Content */}
      <div className="max-w-xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentField.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            {/* Question Number */}
            {form.settings.showQuestionNumbers && (
              <div className="text-sm text-gray-400 mb-2">
                Question {currentStep + 1} of {form.fields.length}
              </div>
            )}

            {/* Question */}
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {currentField.question}
              {currentField.required && <span className="text-red-500 ml-1">*</span>}
            </h2>

            {currentField.description && (
              <p className="text-gray-500 mb-4">{currentField.description}</p>
            )}

            {/* Input Fields */}
            <div className="mt-6">
              {/* Short Text */}
              {currentField.type === 'short_text' && (
                <input
                  type="text"
                  placeholder={currentField.placeholder || 'Type your answer here...'}
                  value={answers[currentField.id] || ''}
                  onChange={(e) => handleAnswer(currentField.id, e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-lg"
                  autoFocus
                />
              )}

              {/* Long Text */}
              {currentField.type === 'long_text' && (
                <textarea
                  placeholder={currentField.placeholder || 'Type your answer here...'}
                  value={answers[currentField.id] || ''}
                  onChange={(e) => handleAnswer(currentField.id, e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-lg resize-none"
                  rows={4}
                  autoFocus
                />
              )}

              {/* Email */}
              {currentField.type === 'email' && (
                <input
                  type="email"
                  placeholder={currentField.placeholder || 'email@example.com'}
                  value={answers[currentField.id] || ''}
                  onChange={(e) => handleAnswer(currentField.id, e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-lg"
                  autoFocus
                />
              )}

              {/* Phone */}
              {currentField.type === 'phone' && (
                <input
                  type="tel"
                  placeholder={currentField.placeholder || '+91 98765 43210'}
                  value={answers[currentField.id] || ''}
                  onChange={(e) => handleAnswer(currentField.id, e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-lg"
                  autoFocus
                />
              )}

              {/* Number */}
              {currentField.type === 'number' && (
                <input
                  type="number"
                  placeholder={currentField.placeholder || '0'}
                  value={answers[currentField.id] || ''}
                  onChange={(e) => handleAnswer(currentField.id, e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-lg"
                  autoFocus
                />
              )}

              {/* Date */}
              {currentField.type === 'date' && (
                <input
                  type="date"
                  value={answers[currentField.id] || ''}
                  onChange={(e) => handleAnswer(currentField.id, e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-lg"
                  autoFocus
                />
              )}

              {/* Time */}
              {currentField.type === 'time' && (
                <input
                  type="time"
                  value={answers[currentField.id] || ''}
                  onChange={(e) => handleAnswer(currentField.id, e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-lg"
                  autoFocus
                />
              )}

              {/* URL */}
              {currentField.type === 'url' && (
                <input
                  type="url"
                  placeholder={currentField.placeholder || 'https://example.com'}
                  value={answers[currentField.id] || ''}
                  onChange={(e) => handleAnswer(currentField.id, e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-lg"
                  autoFocus
                />
              )}

              {/* Multiple Choice */}
              {currentField.type === 'multiple_choice' && (
                <div className="space-y-3">
                  {currentField.options?.map((option, i) => (
                    <button
                      key={i}
                      onClick={() => handleAnswer(currentField.id, option)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                        answers[currentField.id] === option
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        answers[currentField.id] === option
                          ? 'border-purple-500 bg-purple-500'
                          : 'border-gray-300'
                      }`}>
                        {answers[currentField.id] === option && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <span className="text-lg font-medium">{option}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Dropdown */}
              {currentField.type === 'dropdown' && (
                <select
                  value={answers[currentField.id] || ''}
                  onChange={(e) => handleAnswer(currentField.id, e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-lg bg-white"
                  autoFocus
                >
                  <option value="">Select an option...</option>
                  {currentField.options?.map((option, i) => (
                    <option key={i} value={option}>{option}</option>
                  ))}
                </select>
              )}

              {/* Checkbox */}
              {currentField.type === 'checkbox' && (
                <div className="space-y-3">
                  {currentField.options?.map((option, i) => {
                    const selected = answers[currentField.id] || [];
                    const isSelected = selected.includes(option);
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          const updated = isSelected
                            ? selected.filter((v: string) => v !== option)
                            : [...selected, option];
                          handleAnswer(currentField.id, updated);
                        }}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                          isSelected
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected
                            ? 'border-purple-500 bg-purple-500'
                            : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-lg font-medium">{option}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Yes/No */}
              {currentField.type === 'yes_no' && (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleAnswer(currentField.id, 'Yes')}
                    className={`py-4 rounded-xl font-medium text-lg transition-all ${
                      answers[currentField.id] === 'Yes'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => handleAnswer(currentField.id, 'No')}
                    className={`py-4 rounded-xl font-medium text-lg transition-all ${
                      answers[currentField.id] === 'No'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    No
                  </button>
                </div>
              )}

              {/* Rating */}
              {currentField.type === 'rating' && (
                <div className="flex justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleAnswer(currentField.id, star)}
                      className="text-5xl transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-12 h-12 ${
                          (answers[currentField.id] || 0) >= star
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Scale */}
              {currentField.type === 'scale' && (
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleAnswer(currentField.id, num)}
                      className={`w-10 h-10 rounded-lg font-medium transition-all ${
                        answers[currentField.id] === num
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-purple-100'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              )}

              {/* File Upload */}
              {currentField.type === 'file_upload' && (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-400 transition-colors cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">Click to upload or drag and drop</p>
                  <p className="text-sm text-gray-400 mt-1">PNG, JPG, PDF up to 10MB</p>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              {currentStep === form.fields.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={!canProceed() || submitting}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit
                      <CheckCircle className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      {!form.branding.hidePoweredBy && (
        <div className="text-center py-6 text-sm text-gray-400">
          Powered by <span className="font-medium text-purple-600">REZ Forms</span>
        </div>
      )}
    </div>
  );
}