/**
 * Deep Linking Hook for Do App
 * Handles incoming URLs from: do:// and https://do.rez.money
 *
 * Supported Routes:
 * - do://chat -> Chat screen (default)
 * - do://wallet -> Wallet tab
 * - do://profile -> Profile tab
 * - do://explore -> Explore tab
 * - do://booking/[id] -> Booking detail
 * - do://settings -> Settings screen
 */

import { useEffect, useCallback } from 'react';
import { router, LinkIng } from 'expo-router';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

// Deep link path types
export type DeepLinkPath =
  | 'chat'
  | 'wallet'
  | 'profile'
  | 'explore'
  | 'settings'
  | { type: 'booking'; id: string };

// Parsed deep link result
export interface ParsedDeepLink {
  path: DeepLinkPath;
  params?: Record<string, string>;
  rawUrl: string;
}

// Deep link prefix patterns
const CUSTOM_SCHEME = 'do://';
const UNIVERSAL_LINK = 'https://do.rez.money';

/**
 * Parse a deep link URL into a structured path
 */
export function parseDeepLink(url: string): ParsedDeepLink | null {
  if (!url) return null;

  try {
    // Normalize URL
    let normalizedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith(CUSTOM_SCHEME)) {
      normalizedUrl = `${CUSTOM_SCHEME}${url}`;
    }

    const parsed = Linking.parse(normalizedUrl);
    const path = parsed.path ?? '';
    const queryParams = parsed.queryParams ?? {};

    // Map paths to app routes
    switch (path) {
      case '':
      case '/':
      case 'chat':
      case 'home':
        return {
          path: 'chat',
          params: queryParams as Record<string, string>,
          rawUrl: url,
        };

      case 'wallet':
        return {
          path: 'wallet',
          params: queryParams as Record<string, string>,
          rawUrl: url,
        };

      case 'profile':
        return {
          path: 'profile',
          params: queryParams as Record<string, string>,
          rawUrl: url,
        };

      case 'explore':
        return {
          path: 'explore',
          params: queryParams as Record<string, string>,
          rawUrl: url,
        };

      case 'settings':
        return {
          path: 'settings',
          params: queryParams as Record<string, string>,
          rawUrl: url,
        };

      // Booking detail: matches /booking/123 or booking?id=123
      case 'booking':
      case 'booking/': {
        const bookingId = (queryParams.id as string) || (path.split('/')[1]);
        if (bookingId) {
          return {
            path: { type: 'booking', id: bookingId },
            params: queryParams as Record<string, string>,
            rawUrl: url,
          };
        }
        break;
      }

      // Handle booking/123 format
      default:
        if (path.startsWith('booking/')) {
          const bookingId = path.split('/')[1];
          if (bookingId) {
            return {
              path: { type: 'booking', id: bookingId },
              params: queryParams as Record<string, string>,
              rawUrl: url,
            };
          }
        }
        break;
    }

    // Unknown path - return null for 404 handling
    console.warn('[DeepLinking] Unknown path:', path);
    return null;
  } catch (error) {
    console.error('[DeepLinking] Parse error:', error);
    return null;
  }
}

/**
 * Navigate to a deep link path
 */
export function navigateToDeepLink(parsed: ParsedDeepLink): void {
  const { path, params } = parsed;

  switch (path) {
    case 'chat':
      router.push('/(tabs)');
      break;

    case 'wallet':
      router.push('/(tabs)/wallet');
      break;

    case 'profile':
      router.push('/(tabs)/profile');
      break;

    case 'explore':
      router.push('/(tabs)/explore');
      break;

    case 'settings':
      router.push('/settings/notifications');
      break;

    default:
      if (typeof path === 'object' && path.type === 'booking') {
        router.push({
          pathname: '/booking/[id]',
          params: { id: path.id, ...params },
        });
      }
      break;
  }
}

/**
 * Create a deep link URL from a path
 */
export function createDeepLinkUrl(path: DeepLinkPath, params?: Record<string, string>): string {
  let url = `${CUSTOM_SCHEME}`;

  switch (path) {
    case 'chat':
      url += 'chat';
      break;
    case 'wallet':
      url += 'wallet';
      break;
    case 'profile':
      url += 'profile';
      break;
    case 'explore':
      url += 'explore';
      break;
    case 'settings':
      url += 'settings';
      break;
    default:
      if (typeof path === 'object' && path.type === 'booking') {
        url += `booking/${path.id}`;
      }
      break;
  }

  // Append query params
  if (params && Object.keys(params).length > 0) {
    const queryString = new URLSearchParams(params).toString();
    url += `?${queryString}`;
  }

  return url;
}

/**
 * Create a universal link URL
 */
export function createUniversalLinkUrl(path: DeepLinkPath, params?: Record<string, string>): string {
  let url = UNIVERSAL_LINK;

  switch (path) {
    case 'chat':
      url += '/chat';
      break;
    case 'wallet':
      url += '/wallet';
      break;
    case 'profile':
      url += '/profile';
      break;
    case 'explore':
      url += '/explore';
      break;
    case 'settings':
      url += '/settings';
      break;
    default:
      if (typeof path === 'object' && path.type === 'booking') {
        url += `/booking/${path.id}`;
      }
      break;
  }

  if (params && Object.keys(params).length > 0) {
    const queryString = new URLSearchParams(params).toString();
    url += `?${queryString}`;
  }

  return url;
}

/**
 * Deep linking configuration for Expo Router
 */
export const linkingConfig: Partial<LinkIng> = {
  enabled: true,
  prefixes: [CUSTOM_SCHEME, UNIVERSAL_LINK, Linking.createURL('/')],
  config: {
    screens: {
      // Tab screens
      '(tabs)': {
        screens: {
          index: 'chat',
          wallet: 'wallet',
          profile: 'profile',
          explore: 'explore',
        },
      },
      // Stack screens
      booking: {
        path: 'booking/:id',
        parse: {
          id: (id: string) => id,
        },
      },
      settings: {
        screens: {
          notifications: 'settings/notifications',
          addresses: 'settings/addresses',
          'edit-profile': 'settings/edit-profile',
        },
      },
      // Fallback for unmatched routes
      '*': 'chat',
    },
  },
};

/**
 * Hook to handle deep links
 * Call this in the root layout to enable deep linking
 */
export function useDeepLinking() {
  const handleDeepLink = useCallback((url: string | null) => {
    if (!url) return;

    console.log('[DeepLinking] Received URL:', url);

    const parsed = parseDeepLink(url);
    if (parsed) {
      console.log('[DeepLinking] Navigating to:', parsed.path);
      navigateToDeepLink(parsed);
    } else {
      console.warn('[DeepLinking] Invalid deep link, redirecting to home');
      router.push('/(tabs)');
    }
  }, []);

  useEffect(() => {
    // Handle URL when app is already open
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    // Check if app was opened from a deep link
    Linking.getInitialURL()
      .then((url) => {
        if (url) {
          handleDeepLink(url);
        }
      })
      .catch((error) => {
        console.error('[DeepLinking] Failed to get initial URL:', error);
      });

    return () => {
      subscription.remove();
    };
  }, [handleDeepLink]);

  return {
    parseDeepLink,
    navigateToDeepLink,
    createDeepLinkUrl,
    createUniversalLinkUrl,
  };
}

/**
 * Utility to check if a URL is a valid Do app deep link
 */
export function isDoAppDeepLink(url: string): boolean {
  return (
    url.startsWith(CUSTOM_SCHEME) ||
    url.startsWith(UNIVERSAL_LINK)
  );
}

/**
 * Supported deep link routes documentation
 */
export const SUPPORTED_DEEP_LINKS = {
  chat: {
    pattern: 'do://chat',
    description: 'Opens the chat screen',
    params: [],
  },
  wallet: {
    pattern: 'do://wallet',
    description: 'Opens the wallet tab',
    params: [],
  },
  profile: {
    pattern: 'do://profile',
    description: 'Opens the profile tab',
    params: [],
  },
  explore: {
    pattern: 'do://explore',
    description: 'Opens the explore tab',
    params: [],
  },
  booking: {
    pattern: 'do://booking/:id',
    description: 'Opens a specific booking detail',
    params: ['id (required)'],
  },
  settings: {
    pattern: 'do://settings',
    description: 'Opens settings',
    params: [],
  },
} as const;
