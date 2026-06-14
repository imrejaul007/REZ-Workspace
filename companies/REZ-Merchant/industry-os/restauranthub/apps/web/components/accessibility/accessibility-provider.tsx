'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useReducedMotion, useScreenReader } from '@/lib/accessibility/hooks';

interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  focusIndicator: 'default' | 'enhanced';
  screenReaderOptimized: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => void;
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  resetSettings: () => void;
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  reducedMotion: false,
  fontSize: 'medium',
  focusIndicator: 'default',
  screenReaderOptimized: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const { prefersReducedMotion } = useReducedMotion();
  const { announce } = useScreenReader();

  // Load settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('accessibility-settings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSettings({ ...defaultSettings, ...parsed });
        } catch (error) {
          console.warn('Failed to parse accessibility settings:', error);
        }
      }

      // Auto-detect reduced motion preference
      setSettings(prev => ({
        ...prev,
        reducedMotion: prefersReducedMotion,
      }));
    }
  }, [prefersReducedMotion]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessibility-settings', JSON.stringify(settings));
    }
  }, [settings]);

  // Apply settings to document
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    // High contrast mode
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Font size
    root.classList.remove('text-small', 'text-medium', 'text-large', 'text-extra-large');
    root.classList.add(`text-${settings.fontSize}`);

    // Focus indicator
    if (settings.focusIndicator === 'enhanced') {
      root.classList.add('enhanced-focus');
    } else {
      root.classList.remove('enhanced-focus');
    }

    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Screen reader optimization
    if (settings.screenReaderOptimized) {
      root.classList.add('screen-reader-optimized');
    } else {
      root.classList.remove('screen-reader-optimized');
    }
  }, [settings]);

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));

    // Announce changes to screen readers
    announce(`${key} setting changed to ${value}`);
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    announce('Accessibility settings have been reset to default');
  };

  const contextValue: AccessibilityContextType = {
    settings,
    updateSetting,
    announce,
    resetSettings,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

// Accessibility settings component
export function AccessibilitySettings() {
  const { settings, updateSetting, resetSettings } = useAccessibility();

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Accessibility Settings</h2>
        <p className="text-sm text-muted-foreground">
          Customize the interface to meet your accessibility needs.
        </p>
      </div>

      <div className="space-y-4">
        {/* High Contrast */}
        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="high-contrast" className="text-sm font-medium">
              High Contrast Mode
            </label>
            <p className="text-xs text-muted-foreground">
              Increases contrast for better visibility
            </p>
          </div>
          <input
            id="high-contrast"
            type="checkbox"
            checked={settings.highContrast}
            onChange={(e) => updateSetting('highContrast', e.target.checked)}
            className="h-4 w-4"
          />
        </div>

        {/* Font Size */}
        <div className="space-y-2">
          <label htmlFor="font-size" className="text-sm font-medium">
            Font Size
          </label>
          <select
            id="font-size"
            value={settings.fontSize}
            onChange={(e) => updateSetting('fontSize', e.target.value as AccessibilitySettings['fontSize'])}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="small">Small</option>
            <option value="medium">Medium (Default)</option>
            <option value="large">Large</option>
            <option value="extra-large">Extra Large</option>
          </select>
        </div>

        {/* Enhanced Focus */}
        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="enhanced-focus" className="text-sm font-medium">
              Enhanced Focus Indicators
            </label>
            <p className="text-xs text-muted-foreground">
              Makes focus indicators more visible for keyboard navigation
            </p>
          </div>
          <input
            id="enhanced-focus"
            type="checkbox"
            checked={settings.focusIndicator === 'enhanced'}
            onChange={(e) => updateSetting('focusIndicator', e.target.checked ? 'enhanced' : 'default')}
            className="h-4 w-4"
          />
        </div>

        {/* Reduced Motion */}
        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="reduced-motion" className="text-sm font-medium">
              Reduce Motion
            </label>
            <p className="text-xs text-muted-foreground">
              Minimizes animations and transitions
            </p>
          </div>
          <input
            id="reduced-motion"
            type="checkbox"
            checked={settings.reducedMotion}
            onChange={(e) => updateSetting('reducedMotion', e.target.checked)}
            className="h-4 w-4"
          />
        </div>

        {/* Screen Reader Optimization */}
        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="screen-reader" className="text-sm font-medium">
              Screen Reader Optimization
            </label>
            <p className="text-xs text-muted-foreground">
              Optimizes the interface for screen reader users
            </p>
          </div>
          <input
            id="screen-reader"
            type="checkbox"
            checked={settings.screenReaderOptimized}
            onChange={(e) => updateSetting('screenReaderOptimized', e.target.checked)}
            className="h-4 w-4"
          />
        </div>
      </div>

      <div className="pt-4 border-t">
        <button
          onClick={resetSettings}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Reset to Default Settings
        </button>
      </div>
    </div>
  );
}