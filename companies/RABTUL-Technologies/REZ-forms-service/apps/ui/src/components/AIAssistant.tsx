'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Send, Loader2, X, MessageSquare, Zap } from 'lucide-react';

interface AIAssistantProps {
  onClose: () => void;
  onGenerate: (prompt: string) => void;
}

const SUGGESTIONS = [
  { icon: '📞', label: 'Contact Form', prompt: 'Create a contact form for my business with name, email, phone, and message fields' },
  { icon: '⭐', label: 'Feedback Form', prompt: 'Create a customer feedback form with star rating, what they liked, and suggestions' },
  { icon: '📅', label: 'Event RSVP', prompt: 'Create an event registration form with name, email, number of attendees, and dietary requirements' },
  { icon: '💼', label: 'Job Application', prompt: 'Create a job application form with name, email, phone, resume upload, and cover letter' },
  { icon: '🏥', label: 'Patient Intake', prompt: 'Create a healthcare intake form with patient info, medical history, and symptoms' },
  { icon: '🛒', label: 'Order Form', prompt: 'Create a product order form with customer details, address, and payment method' },
];

export function AIAssistant({ onClose, onGenerate }: AIAssistantProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<number | null>(null);

  const handleGenerate = async (text?: string) => {
    const finalPrompt = text || prompt;
    if (!finalPrompt.trim()) return;

    setIsGenerating(true);
    setSelectedSuggestion(null);

    try {
      await onGenerate(finalPrompt);
      onClose();
    } catch (error) {
      console.error('Failed to generate:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl w-full max-w-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">AI Form Builder</h2>
              <p className="text-sm text-gray-500">Describe your form in plain English</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Suggestions */}
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Try one of these templates
            </p>
            <div className="grid grid-cols-2 gap-2">
              {SUGGESTIONS.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedSuggestion(index);
                    setPrompt(suggestion.prompt);
                  }}
                  className={`p-3 text-left border rounded-xl transition-all ${
                    selectedSuggestion === index
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{suggestion.icon}</span>
                  <span className="block text-sm font-medium text-gray-900 mt-1">
                    {suggestion.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: Create a contact form for my salon with name, email, phone, preferred service, and appointment date"
              className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
            />
            <button
              onClick={() => handleGenerate()}
              disabled={!prompt.trim() || isGenerating}
              className="absolute bottom-3 right-3 w-10 h-10 bg-purple-600 text-white rounded-lg flex items-center justify-center hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Examples */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-2">💡 Tips for better results:</p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Mention the industry (e.g., "for a restaurant", "for a medical clinic")</li>
              <li>• Specify required fields</li>
              <li>• Include specific question types if needed</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 rounded-b-2xl border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <MessageSquare className="w-4 h-4" />
            Powered by HOJAI AI
          </div>
          <button
            onClick={() => handleGenerate()}
            disabled={!prompt.trim() || isGenerating}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Generate Form
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}