'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { focusUtils, keyboardUtils, screenReaderUtils, motionUtils } from './utils';

// Hook for managing focus trap
export function useFocusTrap(active: boolean = false) {
  const containerRef = useRef<HTMLElement>(null);
  const trapRef = useRef<{ activate: () => void; deactivate: () => void } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    trapRef.current = focusUtils.createFocusTrap(containerRef.current);

    if (active) {
      trapRef.current.activate();
    }

    return () => {
      if (trapRef.current) {
        trapRef.current.deactivate();
      }
    };
  }, [active]);

  return containerRef;
}

// Hook for managing keyboard navigation in lists
export function useKeyboardNavigation<T extends HTMLElement>(
  items: T[],
  options: {
    horizontal?: boolean;
    vertical?: boolean;
    wrap?: boolean;
    autoFocus?: boolean;
  } = {}
) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { horizontal = false, vertical = true, wrap = true, autoFocus = false } = options;

  useEffect(() => {
    if (autoFocus && items.length > 0 && items[currentIndex]) {
      items[currentIndex].focus();
    }
  }, [items, currentIndex, autoFocus]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const newIndex = keyboardUtils.handleArrowNavigation(
        event,
        items,
        currentIndex,
        {
          horizontal,
          vertical,
          wrap,
          onSelect: setCurrentIndex,
        }
      );
      setCurrentIndex(newIndex);
    },
    [items, currentIndex, horizontal, vertical, wrap]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    currentIndex,
    setCurrentIndex,
    handleKeyDown,
  };
}

// Hook for announcing messages to screen readers
export function useScreenReader() {
  const liveRegionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    liveRegionRef.current = screenReaderUtils.createLiveRegion();
    return () => {
      if (liveRegionRef.current && document.body.contains(liveRegionRef.current)) {
        document.body.removeChild(liveRegionRef.current);
      }
    };
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (liveRegionRef.current) {
      liveRegionRef.current.setAttribute('aria-live', priority);
      liveRegionRef.current.textContent = message;
    } else {
      screenReaderUtils.announce(message, priority);
    }
  }, []);

  return { announce };
}

// Hook for managing modal/dialog accessibility
export function useModal(isOpen: boolean) {
  const modalRef = useFocusTrap(isOpen);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Prevent body scroll
      document.body.style.overflow = 'hidden';

      // Add ESC key listener
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          // This should be handled by the parent component
          event.preventDefault();
        }
      };

      document.addEventListener('keydown', handleEscape);

      return () => {
        document.removeEventListener('keydown', handleEscape);

        // Restore body scroll
        document.body.style.overflow = '';

        // Restore focus to previous element
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [isOpen]);

  return modalRef;
}

// Hook for managing accordion accessibility
export function useAccordion(initialOpenItems: number[] = []) {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set(initialOpenItems));

  const toggleItem = useCallback((index: number) => {
    setOpenItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  const openItem = useCallback((index: number) => {
    setOpenItems(prev => new Set(prev).add(index));
  }, []);

  const closeItem = useCallback((index: number) => {
    setOpenItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  }, []);

  const isOpen = useCallback((index: number) => openItems.has(index), [openItems]);

  const getAccordionProps = useCallback((index: number) => ({
    'aria-expanded': isOpen(index),
    'aria-controls': `accordion-panel-${index}`,
    id: `accordion-button-${index}`,
  }), [isOpen]);

  const getPanelProps = useCallback((index: number) => ({
    'aria-labelledby': `accordion-button-${index}`,
    id: `accordion-panel-${index}`,
    hidden: !isOpen(index),
  }), [isOpen]);

  return {
    openItems,
    toggleItem,
    openItem,
    closeItem,
    isOpen,
    getAccordionProps,
    getPanelProps,
  };
}

// Hook for managing tabs accessibility
export function useTabs(defaultTab: number = 0) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const getTabProps = useCallback((index: number) => ({
    role: 'tab',
    'aria-selected': index === activeTab,
    'aria-controls': `tabpanel-${index}`,
    id: `tab-${index}`,
    tabIndex: index === activeTab ? 0 : -1,
  }), [activeTab]);

  const getTabPanelProps = useCallback((index: number) => ({
    role: 'tabpanel',
    'aria-labelledby': `tab-${index}`,
    id: `tabpanel-${index}`,
    hidden: index !== activeTab,
    tabIndex: 0,
  }), [activeTab]);

  const getTabListProps = useCallback(() => ({
    role: 'tablist',
  }), []);

  return {
    activeTab,
    setActiveTab,
    getTabProps,
    getTabPanelProps,
    getTabListProps,
  };
}

// Hook for managing combobox/select accessibility
export function useCombobox<T>(
  options: T[],
  getOptionLabel: (option: T) => string,
  onSelect?: (option: T) => void
) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [inputValue, setInputValue] = useState('');

  const filteredOptions = options.filter(option =>
    getOptionLabel(option).toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setSelectedIndex(prev =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (isOpen) {
          setSelectedIndex(prev =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
        }
        break;
      case 'Enter':
        event.preventDefault();
        if (isOpen && selectedIndex >= 0) {
          onSelect?.(filteredOptions[selectedIndex]);
          setIsOpen(false);
          setSelectedIndex(-1);
        }
        break;
      case 'Escape':
        event.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  }, [isOpen, selectedIndex, filteredOptions, onSelect]);

  const getComboboxProps = useCallback(() => ({
    role: 'combobox',
    'aria-expanded': isOpen,
    'aria-haspopup': 'listbox' as const,
    'aria-autocomplete': 'list' as const,
    'aria-controls': 'combobox-listbox',
    onKeyDown: handleKeyDown,
  }), [isOpen, handleKeyDown]);

  const getListboxProps = useCallback(() => ({
    role: 'listbox',
    id: 'combobox-listbox',
    'aria-label': 'Options',
  }), []);

  const getOptionProps = useCallback((index: number) => ({
    role: 'option',
    'aria-selected': index === selectedIndex,
    id: `option-${index}`,
  }), [selectedIndex]);

  return {
    isOpen,
    setIsOpen,
    selectedIndex,
    setSelectedIndex,
    inputValue,
    setInputValue,
    filteredOptions,
    getComboboxProps,
    getListboxProps,
    getOptionProps,
  };
}

// Hook for detecting reduced motion preference
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  const respectMotionPreference = useCallback(<T>(
    animationProps: T,
    reducedProps: Partial<T>
  ): T => {
    return motionUtils.respectReducedMotion(animationProps, reducedProps);
  }, [prefersReducedMotion]);

  return {
    prefersReducedMotion,
    respectMotionPreference,
  };
}

// Hook for managing form field accessibility
export function useFormField(name: string, options: {
  required?: boolean;
  validate?: (value: string) => string | null;
} = {}) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const { required = false, validate } = options;

  const fieldId = `field-${name}`;
  const errorId = `${fieldId}-error`;
  const helpId = `${fieldId}-help`;

  const handleChange = useCallback((newValue: string) => {
    setValue(newValue);
    if (touched && validate) {
      const errorMessage = validate(newValue);
      setError(errorMessage);
    }
  }, [touched, validate]);

  const handleBlur = useCallback(() => {
    setTouched(true);
    if (validate) {
      const errorMessage = validate(value);
      setError(errorMessage);
    }
  }, [validate, value]);

  const getFieldProps = useCallback(() => ({
    id: fieldId,
    name,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleChange(e.target.value),
    onBlur: handleBlur,
    'aria-required': required,
    'aria-invalid': !!error,
    'aria-describedby': error ? errorId : undefined,
  }), [fieldId, name, value, handleChange, handleBlur, required, error, errorId]);

  const getErrorProps = useCallback(() => ({
    id: errorId,
    role: 'alert',
    'aria-live': 'polite' as const,
  }), [errorId]);

  const getHelpProps = useCallback(() => ({
    id: helpId,
  }), [helpId]);

  return {
    value,
    error,
    touched,
    getFieldProps,
    getErrorProps,
    getHelpProps,
    handleChange,
    handleBlur,
    setValue,
    setError,
    setTouched,
  };
}