'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Palette, Check, Sliders, RotateCcw } from 'lucide-react';

interface Theme {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    background: string;
    text: string;
    accent: string;
  };
  borderRadius: string;
  fontFamily: string;
}

const THEMES: Theme[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean and simple',
    colors: {
      primary: '#000000',
      background: '#ffffff',
      text: '#1f2937',
      accent: '#6b7280',
    },
    borderRadius: '0px',
    fontFamily: 'system-ui',
  },
  {
    id: 'soft',
    name: 'Soft',
    description: 'Friendly and approachable',
    colors: {
      primary: '#8b5cf6',
      background: '#faf5ff',
      text: '#1f2937',
      accent: '#a78bfa',
    },
    borderRadius: '16px',
    fontFamily: 'system-ui',
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Strong visual impact',
    colors: {
      primary: '#ef4444',
      background: '#fef2f2',
      text: '#1f2937',
      accent: '#f87171',
    },
    borderRadius: '4px',
    fontFamily: 'system-ui',
  },
  {
    id: 'nature',
    name: 'Nature',
    description: 'Organic and calming',
    colors: {
      primary: '#059669',
      background: '#ecfdf5',
      text: '#1f2937',
      accent: '#34d399',
    },
    borderRadius: '24px',
    fontFamily: 'system-ui',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Professional and trustworthy',
    colors: {
      primary: '#0ea5e9',
      background: '#f0f9ff',
      text: '#1f2937',
      accent: '#38bdf8',
    },
    borderRadius: '8px',
    fontFamily: 'system-ui',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm and inviting',
    colors: {
      primary: '#f97316',
      background: '#fff7ed',
      text: '#1f2937',
      accent: '#fb923c',
    },
    borderRadius: '12px',
    fontFamily: 'system-ui',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Dark and elegant',
    colors: {
      primary: '#6366f1',
      background: '#0f172a',
      text: '#f1f5f9',
      accent: '#818cf8',
    },
    borderRadius: '8px',
    fontFamily: 'system-ui',
  },
  {
    id: 'luxury',
    name: 'Luxury',
    description: 'Premium and sophisticated',
    colors: {
      primary: '#1f2937',
      background: '#fefce8',
      text: '#1f2937',
      accent: '#ca8a04',
    },
    borderRadius: '2px',
    fontFamily: 'Georgia',
  },
  {
    id: 'playful',
    name: 'Playful',
    description: 'Fun and energetic',
    colors: {
      primary: '#ec4899',
      background: '#fdf2f8',
      text: '#1f2937',
      accent: '#f472b6',
    },
    borderRadius: '9999px',
    fontFamily: 'system-ui',
  },
  {
    id: 'corporate',
    name: 'Corporate',
    description: 'Professional and clean',
    colors: {
      primary: '#1e40af',
      background: '#eff6ff',
      text: '#1f2937',
      accent: '#3b82f6',
    },
    borderRadius: '4px',
    fontFamily: 'Arial',
  },
];

interface FormThemesProps {
  currentBranding: {
    primaryColor: string;
    backgroundColor: string;
    fontFamily?: string;
  };
  onApply: (branding: { primaryColor: string; backgroundColor: string; fontFamily?: string }) => void;
}

export function FormThemes({ currentBranding, onApply }: FormThemesProps) {
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [customColors, setCustomColors] = useState({
    primary: currentBranding.primaryColor,
    background: currentBranding.backgroundColor,
  });

  const applyTheme = (theme: Theme) => {
    setSelectedTheme(theme.id);
    setCustomColors({
      primary: theme.colors.primary,
      background: theme.colors.background,
    });
    onApply({
      primaryColor: theme.colors.primary,
      backgroundColor: theme.colors.background,
      fontFamily: theme.fontFamily,
    });
  };

  const resetToDefault = () => {
    setSelectedTheme(null);
    setCustomColors({
      primary: '#000000',
      background: '#ffffff',
    });
    onApply({
      primaryColor: '#000000',
      backgroundColor: '#ffffff',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Form Themes
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Choose a theme or customize colors
          </p>
        </div>
        <button
          onClick={resetToDefault}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      {/* Theme Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {THEMES.map((theme) => (
          <motion.button
            key={theme.id}
            onClick={() => applyTheme(theme)}
            className={`relative p-4 rounded-xl border-2 transition-all ${
              selectedTheme === theme.id
                ? 'border-purple-500 ring-2 ring-purple-100'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Theme Preview */}
            <div
              className="h-24 rounded-lg mb-3 relative overflow-hidden"
              style={{ backgroundColor: theme.colors.background }}
            >
              {/* Header */}
              <div
                className="h-8 w-full"
                style={{ backgroundColor: theme.colors.primary }}
              />
              {/* Content */}
              <div className="p-2 space-y-1">
                <div
                  className="h-2 rounded w-3/4"
                  style={{ backgroundColor: theme.colors.accent }}
                />
                <div
                  className="h-2 rounded w-1/2"
                  style={{ backgroundColor: theme.colors.accent, opacity: 0.5 }}
                />
              </div>
              {/* Check mark */}
              {selectedTheme === theme.id && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            {/* Theme Info */}
            <p className="font-medium text-gray-900 text-sm">{theme.name}</p>
            <p className="text-xs text-gray-500">{theme.description}</p>

            {/* Color dots */}
            <div className="flex items-center gap-1 mt-2">
              <div
                className="w-3 h-3 rounded-full border border-gray-200"
                style={{ backgroundColor: theme.colors.primary }}
              />
              <div
                className="w-3 h-3 rounded-full border border-gray-200"
                style={{ backgroundColor: theme.colors.background }}
              />
              <div
                className="w-3 h-3 rounded-full border border-gray-200"
                style={{ backgroundColor: theme.colors.accent }}
              />
            </div>
          </motion.button>
        ))}
      </div>

      {/* Custom Colors */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Sliders className="w-4 h-4" />
          Custom Colors
        </h4>

        <div className="grid grid-cols-2 gap-6">
          {/* Primary Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={customColors.primary}
                onChange={(e) => {
                  setCustomColors({ ...customColors, primary: e.target.value });
                  setSelectedTheme(null);
                }}
                className="w-12 h-12 rounded-lg border-2 border-gray-200 cursor-pointer"
              />
              <input
                type="text"
                value={customColors.primary}
                onChange={(e) => {
                  setCustomColors({ ...customColors, primary: e.target.value });
                  setSelectedTheme(null);
                }}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg font-mono text-sm"
              />
            </div>
          </div>

          {/* Background Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Background Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={customColors.background}
                onChange={(e) => {
                  setCustomColors({ ...customColors, background: e.target.value });
                  setSelectedTheme(null);
                }}
                className="w-12 h-12 rounded-lg border-2 border-gray-200 cursor-pointer"
              />
              <input
                type="text"
                value={customColors.background}
                onChange={(e) => {
                  setCustomColors({ ...customColors, background: e.target.value });
                  setSelectedTheme(null);
                }}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg font-mono text-sm"
              />
            </div>
          </div>
        </div>

        {/* Apply Button */}
        <button
          onClick={() => onApply({
            primaryColor: customColors.primary,
            backgroundColor: customColors.background,
          })}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
        >
          Apply Custom Colors
        </button>
      </div>

      {/* Preview */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="font-medium text-gray-900 mb-4">Preview</h4>
        <div
          className="rounded-xl overflow-hidden shadow-lg max-w-md"
          style={{ backgroundColor: customColors.background }}
        >
          {/* Header */}
          <div
            className="p-6"
            style={{ backgroundColor: customColors.primary }}
          >
            <h2 className="text-xl font-bold text-white">Form Title</h2>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: '#374151' }}
              >
                Your Name <span className="text-red-500">*</span>
              </label>
              <div
                className="w-full px-4 py-3 border-2 rounded-lg"
                style={{ borderColor: '#e5e7eb' }}
              >
                <span style={{ color: '#9ca3af' }}>Type your answer...</span>
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: '#374151' }}
              >
                Rating
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div
                    key={star}
                    className="w-10 h-10 rounded-full"
                    style={{
                      backgroundColor: star <= 4 ? '#fbbf24' : '#e5e7eb',
                    }}
                  />
                ))}
              </div>
            </div>

            <button
              className="w-full py-3 rounded-lg text-white font-medium"
              style={{ backgroundColor: customColors.primary }}
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}