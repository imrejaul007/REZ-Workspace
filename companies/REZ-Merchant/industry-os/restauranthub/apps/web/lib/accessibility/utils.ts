/**
 * Accessibility utility functions and constants
 * Following WCAG 2.1 AA guidelines
 */

// ARIA attributes helpers
export const aria = {
  // Common ARIA attributes
  label: (label: string) => ({ 'aria-label': label }),
  labelledby: (id: string) => ({ 'aria-labelledby': id }),
  describedby: (id: string) => ({ 'aria-describedby': id }),
  expanded: (expanded: boolean) => ({ 'aria-expanded': expanded }),
  selected: (selected: boolean) => ({ 'aria-selected': selected }),
  checked: (checked: boolean) => ({ 'aria-checked': checked }),
  disabled: (disabled: boolean) => ({ 'aria-disabled': disabled }),
  hidden: (hidden: boolean) => ({ 'aria-hidden': hidden }),
  live: (live: 'polite' | 'assertive' | 'off') => ({ 'aria-live': live }),
  current: (current: boolean | 'page' | 'step' | 'location' | 'date' | 'time') => ({ 'aria-current': current }),

  // Form-specific ARIA attributes
  required: (required: boolean) => ({ 'aria-required': required }),
  invalid: (invalid: boolean) => ({ 'aria-invalid': invalid }),
  autocomplete: (value: string) => ({ 'aria-autocomplete': value }),

  // Navigation ARIA attributes
  hasPopup: (type: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog') => ({ 'aria-haspopup': type }),
  controls: (id: string) => ({ 'aria-controls': id }),
  owns: (id: string) => ({ 'aria-owns': id }),

  // State ARIA attributes
  busy: (busy: boolean) => ({ 'aria-busy': busy }),
  pressed: (pressed: boolean) => ({ 'aria-pressed': pressed }),

  // Level and position ARIA attributes
  level: (level: number) => ({ 'aria-level': level }),
  setsize: (size: number) => ({ 'aria-setsize': size }),
  posinset: (position: number) => ({ 'aria-posinset': position }),
};

// Role helpers
export const role = {
  button: { role: 'button' },
  link: { role: 'link' },
  menu: { role: 'menu' },
  menuitem: { role: 'menuitem' },
  dialog: { role: 'dialog' },
  alertdialog: { role: 'alertdialog' },
  alert: { role: 'alert' },
  status: { role: 'status' },
  progressbar: { role: 'progressbar' },
  tab: { role: 'tab' },
  tabpanel: { role: 'tabpanel' },
  tablist: { role: 'tablist' },
  listbox: { role: 'listbox' },
  option: { role: 'option' },
  combobox: { role: 'combobox' },
  searchbox: { role: 'searchbox' },
  slider: { role: 'slider' },
  spinbutton: { role: 'spinbutton' },
  switch: { role: 'switch' },
  checkbox: { role: 'checkbox' },
  radio: { role: 'radio' },
  radiogroup: { role: 'radiogroup' },
  grid: { role: 'grid' },
  gridcell: { role: 'gridcell' },
  tree: { role: 'tree' },
  treeitem: { role: 'treeitem' },
  banner: { role: 'banner' },
  navigation: { role: 'navigation' },
  main: { role: 'main' },
  complementary: { role: 'complementary' },
  contentinfo: { role: 'contentinfo' },
  region: { role: 'region' },
  article: { role: 'article' },
  section: { role: 'section' },
  list: { role: 'list' },
  listitem: { role: 'listitem' },
  table: { role: 'table' },
  row: { role: 'row' },
  cell: { role: 'cell' },
  columnheader: { role: 'columnheader' },
  rowheader: { role: 'rowheader' },
};

// Focus management utilities
export const focusUtils = {
  // Get all focusable elements within a container
  getFocusableElements: (container: HTMLElement): HTMLElement[] => {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors));
  },

  // Focus the first focusable element
  focusFirst: (container: HTMLElement): void => {
    const focusableElements = focusUtils.getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  },

  // Focus the last focusable element
  focusLast: (container: HTMLElement): void => {
    const focusableElements = focusUtils.getFocusableElements(container);
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
    }
  },

  // Trap focus within a container
  trapFocus: (container: HTMLElement, event: KeyboardEvent): void => {
    if (event.key !== 'Tab') return;

    const focusableElements = focusUtils.getFocusableElements(container);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        lastElement.focus();
        event.preventDefault();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        firstElement.focus();
        event.preventDefault();
      }
    }
  },

  // Create a focus trap hook
  createFocusTrap: (container: HTMLElement) => {
    const handleKeyDown = (event: KeyboardEvent) => {
      focusUtils.trapFocus(container, event);
    };

    const activate = () => {
      focusUtils.focusFirst(container);
      document.addEventListener('keydown', handleKeyDown);
    };

    const deactivate = () => {
      document.removeEventListener('keydown', handleKeyDown);
    };

    return { activate, deactivate };
  },
};

// Keyboard navigation utilities
export const keyboardUtils = {
  // Common key codes
  keys: {
    ENTER: 'Enter',
    SPACE: ' ',
    ESCAPE: 'Escape',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    HOME: 'Home',
    END: 'End',
    PAGE_UP: 'PageUp',
    PAGE_DOWN: 'PageDown',
    TAB: 'Tab',
  },

  // Check if an element should handle a key event
  shouldHandleKey: (event: KeyboardEvent, keys: string[]): boolean => {
    return keys.includes(event.key);
  },

  // Handle arrow key navigation for lists
  handleArrowNavigation: (
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    options: {
      horizontal?: boolean;
      vertical?: boolean;
      wrap?: boolean;
      onSelect?: (index: number) => void;
    } = {}
  ): number => {
    const { horizontal = false, vertical = true, wrap = true, onSelect } = options;
    let nextIndex = currentIndex;

    switch (event.key) {
      case keyboardUtils.keys.ARROW_UP:
        if (vertical) {
          nextIndex = wrap && currentIndex === 0 ? items.length - 1 : Math.max(0, currentIndex - 1);
          event.preventDefault();
        }
        break;
      case keyboardUtils.keys.ARROW_DOWN:
        if (vertical) {
          nextIndex = wrap && currentIndex === items.length - 1 ? 0 : Math.min(items.length - 1, currentIndex + 1);
          event.preventDefault();
        }
        break;
      case keyboardUtils.keys.ARROW_LEFT:
        if (horizontal) {
          nextIndex = wrap && currentIndex === 0 ? items.length - 1 : Math.max(0, currentIndex - 1);
          event.preventDefault();
        }
        break;
      case keyboardUtils.keys.ARROW_RIGHT:
        if (horizontal) {
          nextIndex = wrap && currentIndex === items.length - 1 ? 0 : Math.min(items.length - 1, currentIndex + 1);
          event.preventDefault();
        }
        break;
      case keyboardUtils.keys.HOME:
        nextIndex = 0;
        event.preventDefault();
        break;
      case keyboardUtils.keys.END:
        nextIndex = items.length - 1;
        event.preventDefault();
        break;
    }

    if (nextIndex !== currentIndex && items[nextIndex]) {
      items[nextIndex].focus();
      onSelect?.(nextIndex);
    }

    return nextIndex;
  },
};

// Screen reader utilities
export const screenReaderUtils = {
  // Announce message to screen readers
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  },

  // Create a live region for announcements
  createLiveRegion: (priority: 'polite' | 'assertive' = 'polite'): HTMLElement => {
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);

    return liveRegion;
  },
};

// Color contrast utilities
export const contrastUtils = {
  // Calculate relative luminance
  getRelativeLuminance: (r: number, g: number, b: number): number => {
    const sRGB = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  },

  // Calculate contrast ratio between two colors
  getContrastRatio: (color1: [number, number, number], color2: [number, number, number]): number => {
    const lum1 = contrastUtils.getRelativeLuminance(...color1);
    const lum2 = contrastUtils.getRelativeLuminance(...color2);
    return (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
  },

  // Check if contrast ratio meets WCAG standards
  meetsContrastStandard: (ratio: number, level: 'AA' | 'AAA' = 'AA', size: 'normal' | 'large' = 'normal'): boolean => {
    if (level === 'AAA') {
      return size === 'large' ? ratio >= 4.5 : ratio >= 7;
    }
    return size === 'large' ? ratio >= 3 : ratio >= 4.5;
  },
};

// Motion utilities
export const motionUtils = {
  // Check if user prefers reduced motion
  prefersReducedMotion: (): boolean => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Respect reduced motion preference for animations
  respectReducedMotion: <T>(animationProps: T, reducedProps: Partial<T>): T => {
    if (motionUtils.prefersReducedMotion()) {
      return { ...animationProps, ...reducedProps };
    }
    return animationProps;
  },
};

// Form validation helpers
export const formUtils = {
  // Generate accessible form field IDs
  generateFieldId: (name: string, prefix = 'field'): {
    id: string;
    errorId: string;
    helpId: string;
  } => {
    const id = `${prefix}-${name}`;
    return {
      id,
      errorId: `${id}-error`,
      helpId: `${id}-help`,
    };
  },

  // Create accessible form field attributes
  createFieldAttributes: (
    name: string,
    options: {
      required?: boolean;
      invalid?: boolean;
      hasError?: boolean;
      hasHelp?: boolean;
      prefix?: string;
    } = {}
  ) => {
    const { required = false, invalid = false, hasError = false, hasHelp = false, prefix } = options;
    const { id, errorId, helpId } = formUtils.generateFieldId(name, prefix);

    const attributes: Record<string, unknown> = {
      id,
      name,
      ...aria.required(required),
      ...aria.invalid(invalid),
    };

    if (hasError || hasHelp) {
      const describedBy = [];
      if (hasError) describedBy.push(errorId);
      if (hasHelp) describedBy.push(helpId);
      Object.assign(attributes, aria.describedby(describedBy.join(' ')));
    }

    return {
      field: attributes,
      error: { id: errorId },
      help: { id: helpId },
    };
  },
};

// Export commonly used combinations
export const accessibleButton = (label: string, options: { pressed?: boolean; expanded?: boolean } = {}) => ({
  ...aria.label(label),
  ...role.button,
  tabIndex: 0,
  ...(options.pressed !== undefined && aria.pressed(options.pressed)),
  ...(options.expanded !== undefined && aria.expanded(options.expanded)),
});

export const accessibleLink = (label: string) => ({
  ...aria.label(label),
  ...role.link,
});

export const accessibleInput = (name: string, label: string, options: {
  required?: boolean;
  invalid?: boolean;
  type?: string;
} = {}) => {
  const { required = false, invalid = false, type = 'text' } = options;
  return {
    ...formUtils.createFieldAttributes(name, { required, invalid }).field,
    type,
    ...aria.label(label),
  };
};