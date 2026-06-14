// expo-modules-core is mocked by the jest-expo preset (jest-expo/src/preset/setup.js).
// Do NOT re-mock it here — the preset's mock handles requireNativeModule and
// requireOptionalNativeModule properly, including the ExpoAsset/ExpoHaptics modules.

// Mock expo-secure-store — it uses expo-modules-core which tries to load native modules.
// Mock it before expo-secure-store is imported anywhere.
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
  __esModule: true,
}));

// Mock expo-haptics — its expo-asset dependency chain tries to load native modules
// (EXNativeModulesProxy) which throws in jest. We mock it early to block that chain.
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy', Rigid: 'rigid', Soft: 'soft' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
  SelectionFeedbackType: { Default: 'default' },
  __esModule: true,
}));

// Mock react-native/Libraries/Components/Pressable/Pressable — RN jest preset
// doesn't include it, causing "type is invalid: got undefined" in all component tests.
// Also mock its transitive dependencies to break the import chain.

// NOTE: react-native is mocked at top level above (with StyleSheet.flatten + Pressable).
// Internal path mocks are NOT needed — babel transforms paths so they don't intercept.

// Mock apiClient singleton — must be here (before walletApi loads) to avoid
// "apiClient_1.default.get is not a function" due to module evaluation order.
// apiClient is captured at walletApi.ts import time; this ensures the mock is
// registered before walletApi.ts loads and captures the reference.
// Include ALL methods used by services that depend on apiClient (eventsApi, etc.)
const mockApiClientGet = jest.fn();
const mockApiClientPost = jest.fn();
const mockApiClientPut = jest.fn();
const mockApiClientDelete = jest.fn();
const mockApiClientPatch = jest.fn();
const mockApiClientSetAuthToken = jest.fn();
const mockApiClientGetAuthToken = jest.fn(() => null);
const mockApiClientGetBaseURL = jest.fn(() => 'http://localhost');
const mockApiClientSetBaseURL = jest.fn();
const mockApiClientGetRegion = jest.fn(() => 'in');
const mockApiClientSetRegion = jest.fn();
const mockApiClientSetRefreshTokenCallback = jest.fn();
const mockApiClientSetLogoutCallback = jest.fn();
const mockApiClientSetMaintenanceCallback = jest.fn();
const mockApiClientSetAppUpdateCallback = jest.fn();
const mockApiClientSetSlowRequestCallback = jest.fn();
const mockApiClientSetCurrentAppVersion = jest.fn();
const mockApiClientGetDeduplicationStats = jest.fn(() => ({ size: 0, keys: [] }));
const mockApiClientResetDeduplicator = jest.fn();
const mockApiClientCancelAllRequests = jest.fn();

jest.mock('@/services/apiClient', () => {
  let _authToken: string | null = null;
  return {
    __esModule: true,
    default: {
      get: mockApiClientGet,
      post: mockApiClientPost,
      put: mockApiClientPut,
      patch: mockApiClientPatch,
      delete: mockApiClientDelete,
      setAuthToken: mockApiClientSetAuthToken.mockImplementation((token: string | null) => { _authToken = token; }),
      getAuthToken: () => _authToken,
      getBaseURL: mockApiClientGetBaseURL,
      setBaseURL: mockApiClientSetBaseURL,
      getRegion: mockApiClientGetRegion,
      setRegion: mockApiClientSetRegion,
      setRefreshTokenCallback: mockApiClientSetRefreshTokenCallback,
      setLogoutCallback: mockApiClientSetLogoutCallback,
      setMaintenanceCallback: mockApiClientSetMaintenanceCallback,
      setAppUpdateCallback: mockApiClientSetAppUpdateCallback,
      setSlowRequestCallback: mockApiClientSetSlowRequestCallback,
      setCurrentAppVersion: mockApiClientSetCurrentAppVersion,
      getDeduplicationStats: mockApiClientGetDeduplicationStats,
      resetDeduplicator: mockApiClientResetDeduplicator,
      cancelAllRequests: mockApiClientCancelAllRequests,
      uploadFile: jest.fn(),
      setTag: jest.fn(),
    },
    setRegionGetter: jest.fn(),
    API_TIMEOUTS: {
      DEFAULT: 8000,
      UPLOAD: 30000,
      LONG_RUNNING: 15000,
      PAYMENT: 20000,
      BILL_FETCH: 12000,
      AUTH: 60000,
    },
  };
});

// Expose mocks globally so individual test files can configure them
global.__mockApiClient = {
  get: mockApiClientGet,
  post: mockApiClientPost,
  put: mockApiClientPut,
  patch: mockApiClientPatch,
  delete: mockApiClientDelete,
  setAuthToken: mockApiClientSetAuthToken,
};

// Mock serviceBookingApi used by booking-flows.test.tsx
jest.mock('@/services/serviceBookingApi', () => ({
  __esModule: true,
  default: {
    createBooking: jest.fn(),
    getBookingById: jest.fn(),
    getAvailableSlots: jest.fn(),
    cancelBooking: jest.fn(),
    getBookings: jest.fn(),
  },
}));

// Mock expo-constants before any module loads (prevents NativeModules.EXDevLauncher crash in Node env)
jest.mock('expo-constants', () => ({
  default: {
    manifest: {},
    expoConfig: { extra: {} },
    sessionId: 'test-session-id',
    platform: 'ios',
    releaseId: 'test-release-id',
    version: '1.0.0',
    name: null,
    slug: null,
    runningSimulator: false,
    systemFonts: [],
    linkedRouter: false,
    design: { name: 'default' },
    appOwnership: 'expo',
    __unsafeNoWarnManifest: null,
    __unsafeNoWarnManifest2: null,
  },
  AppOwnership: { EXPO: 'expo', STANDALONE: 'standalone', ADHOC: 'adhoc', INVALID: null },
  ExecutionEnvironment: { BARE: 'bare', STANDALONE: 'standalone', UNKNOWN: 'unknown' },
  UserInterfaceIdiom: { PHONEPAD: 'phonepad', TABLETPAD: 'tabletpad', UNKNOWN: 'unknown' },
}));

// Import Jest Native matchers for @testing-library/react-native
import '@testing-library/jest-native/extend-expect';

// ============================================
// Mock AsyncStorage with actual storage implementation
// ============================================
const storage = new Map();

const mockAsyncStorage = {
  setItem: jest.fn((key, value) => {
    storage.set(key, value);
    return Promise.resolve();
  }),
  getItem: jest.fn((key) => Promise.resolve(storage.get(key) || null)),
  removeItem: jest.fn((key) => {
    storage.delete(key);
    return Promise.resolve();
  }),
  multiSet: jest.fn((pairs) => {
    pairs.forEach(([key, value]) => storage.set(key, value));
    return Promise.resolve();
  }),
  multiGet: jest.fn((keys) =>
    Promise.resolve(keys.map(key => [key, storage.get(key) || null]))
  ),
  multiRemove: jest.fn((keys) => {
    keys.forEach(key => storage.delete(key));
    return Promise.resolve();
  }),
  clear: jest.fn(() => {
    storage.clear();
    return Promise.resolve();
  }),
  getAllKeys: jest.fn(() => Promise.resolve(Array.from(storage.keys()))),
};

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: mockAsyncStorage,
}));

// ============================================
// Mock Expo Clipboard
// ============================================
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(() => Promise.resolve()),
  getStringAsync: jest.fn(() => Promise.resolve('')),
  hasStringAsync: jest.fn(() => Promise.resolve(false)),
  setString: jest.fn(),
  getString: jest.fn(() => ''),
}));

// ============================================
// Mock NativeSettingsManager before react-native
// ============================================
jest.mock('react-native/Libraries/Settings/NativeSettingsManager', () => ({
  __esModule: true,
  default: {
    getConstants: jest.fn(() => ({ settings: {} })),
    setValues: jest.fn(),
    deleteValues: jest.fn(),
  },
}));

// ============================================
// Mock React Native modules
// ============================================
// NOTE: RN 0.79 uses TurboModules (DevMenu, etc.) that are unavailable in a
// Node test environment. Calling jest.requireActual('react-native') or
// jest.requireMock('react-native') inside a jest.mock('react-native') factory
// causes either an Invariant Violation or infinite recursion.
// The jest-expo preset provides a complete react-native mock — we rely on that
// and patch individual sub-APIs where tests need specific behavior.
jest.mock('react-native/Libraries/Share/Share', () => ({
  share: jest.fn(() =>
    Promise.resolve({ action: 'sharedAction', activityType: null })
  ),
  sharedAction: 'sharedAction',
  dismissedAction: 'dismissedAction',
}));

jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

// ============================================
// Mock Expo Router
// ============================================
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
  usePathname: jest.fn(() => '/'),
  useSegments: jest.fn(() => []),
  Stack: {
    Screen: jest.fn(({ children }) => children),
  },
  Link: jest.fn(({ children }) => children),
  Redirect: jest.fn(() => null),
}));

// ============================================
// Mock Expo Linear Gradient
// ============================================
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: jest.fn(({ children }) => children),
}));

// ============================================
// Mock Expo Image
// ============================================
jest.mock('expo-image', () => ({
  Image: 'Image',
}));

// ============================================
// Mock Expo Vector Icons
// ============================================
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialIcons: 'MaterialIcons',
  FontAwesome: 'FontAwesome',
  Feather: 'Feather',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

// ============================================
// Mock Expo Status Bar
// ============================================
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

// ============================================
// Mock Expo Font
// ============================================
jest.mock('expo-font', () => ({
  loadAsync: jest.fn(() => Promise.resolve()),
  isLoaded: jest.fn(() => true),
}));

// ============================================
// Mock Expo Splash Screen
// ============================================
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

// ============================================
// Mock Expo Linking
// ============================================
jest.mock('expo-linking', () => ({
  createURL: jest.fn((path) => `exp://localhost:8081/${path}`),
  openURL: jest.fn(() => Promise.resolve()),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
  getInitialURL: jest.fn(() => Promise.resolve(null)),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// ============================================
// Mock NetInfo
// ============================================
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() =>
    Promise.resolve({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    })
  ),
  addEventListener: jest.fn(() => jest.fn()),
}));

// ============================================
// Mock Socket.io Client
// ============================================
jest.mock('socket.io-client', () => {
  const mockSocket = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    connected: true,
  };
  return {
    io: jest.fn(() => mockSocket),
  };
});

// ============================================
// Mock Expo Camera
// ============================================
jest.mock('expo-camera', () => ({
  Camera: {
    requestCameraPermissionsAsync: jest.fn(() =>
      Promise.resolve({ status: 'granted' })
    ),
    getCameraPermissionsAsync: jest.fn(() =>
      Promise.resolve({ status: 'granted' })
    ),
  },
}));

// ============================================
// Mock Expo Location
// ============================================
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  getForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({
      coords: {
        latitude: 28.7041,
        longitude: 77.1025,
        accuracy: 10,
      },
    })
  ),
}));

// ============================================
// Mock Expo Notifications
// ============================================
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  requestPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  getExpoPushTokenAsync: jest.fn(() =>
    Promise.resolve({ data: 'ExponentPushToken[test]' })
  ),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

// ============================================
// Mock Stripe React Native
// ============================================
jest.mock('@stripe/stripe-react-native', () => ({
  StripeProvider: jest.fn(({ children }) => children),
  CardField: jest.fn(() => null),
  useStripe: jest.fn(() => ({
    confirmPayment: jest.fn(() => Promise.resolve({ paymentIntent: {} })),
    createPaymentMethod: jest.fn(() => Promise.resolve({ paymentMethod: {} })),
  })),
}));

// ============================================
// Mock Reanimated
// ============================================
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// ============================================
// Mock Gesture Handler
// ============================================
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    FlatList: View,
    gestureHandlerRootHOC: jest.fn((Component) => Component),
    Directions: {},
  };
});

// ============================================
// Mock React Navigation
// ============================================
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
  useFocusEffect: jest.fn(),
}));

// ============================================
// Mock react-native at TOP LEVEL — critical for @testing-library/react-native
// @testing-library/react-native does require("react-native") and accesses
// StyleSheet.flatten and Pressable. The jest-expo preset mocks sub-modules
// (react-native/Libraries/...) separately, so we delegate to those for
// components while providing missing exports (StyleSheet.flatten) here.
// We use moduleNameMapper override AFTER the preset's mocks are set up,
// so we carefully merge to avoid breaking the preset's sub-module setup.
// ============================================
jest.mock('react-native', () => {
  const React = require('react');
  // Delegate to jest-expo preset's sub-module mocks for components
  // by using jest.requireActual — but ONLY for the sub-modules that
  // the preset already mocked. We provide fallbacks for everything else.
  return {
    __esModule: true,
    default: {},
    // StyleSheet.flatten is NOT provided by jest-expo preset — provide it here.
    // This is the ROOT CAUSE of ALL component test failures.
    StyleSheet: {
      create: (styles) => styles,
      flatten: (style) => {
        if (Array.isArray(style)) {
          return Object.assign({}, ...style.filter(Boolean));
        }
        return style || {};
      },
      compose: (a, b) => [a, b],
      absoluteFill: {},
      absoluteFillObject: {},
      hairlineWidth: 1,
    },
    // useColorScheme is used by many components — must match the preset's
    // mock (react-native/Libraries/Utilities/useColorScheme returns a fn)
    useColorScheme: jest.fn(() => 'light'),
    // Delegate all components to the preset's sub-module mocks
    // by falling back to mockComponent
    View: React.forwardRef((props, ref) => React.createElement('View', { ...props, ref })),
    Text: React.forwardRef((props, ref) => React.createElement('Text', { ...props, ref })),
    Image: React.forwardRef((props, ref) => React.createElement('Image', { ...props, ref })),
    ScrollView: React.forwardRef((props, ref) => React.createElement('ScrollView', { ...props, ref })),
    TextInput: React.forwardRef((props, ref) => React.createElement('TextInput', { ...props, ref })),
    TouchableOpacity: React.forwardRef((props, ref) => React.createElement('TouchableOpacity', { ...props, ref })),
    TouchableHighlight: React.forwardRef((props, ref) => React.createElement('TouchableHighlight', { ...props, ref })),
    TouchableWithoutFeedback: React.forwardRef((props, ref) => React.createElement('TouchableWithoutFeedback', { ...props, ref })),
    Switch: React.forwardRef((props, ref) => React.createElement('Switch', { ...props, ref })),
    ActivityIndicator: React.forwardRef((props, ref) => React.createElement('ActivityIndicator', { ...props, ref })),
    Modal: React.forwardRef((props, ref) => React.createElement('Modal', { ...props, ref })),
    FlatList: React.forwardRef((props, ref) => React.createElement('FlatList', { ...props, ref })),
    SectionList: React.forwardRef((props, ref) => React.createElement('SectionList', { ...props, ref })),
    RefreshControl: React.forwardRef((props, ref) => React.createElement('RefreshControl', { ...props, ref })),
    KeyboardAvoidingView: React.forwardRef((props, ref) => React.createElement('KeyboardAvoidingView', { ...props, ref })),
    SafeAreaView: React.forwardRef((props, ref) => React.createElement('SafeAreaView', { ...props, ref })),
    StatusBar: React.forwardRef((props, ref) => React.createElement('StatusBar', { ...props, ref })),
    Pressable: React.forwardRef((props, ref) => React.createElement('View', { ...props, ref })),
    Keyboard: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dismiss: jest.fn(),
    },
    Platform: { OS: 'ios', select: (obj) => obj.ios || obj.default },
    Dimensions: {
      get: () => ({ width: 375, height: 812, fontScale: 1 }),
      addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    },
    PixelRatio: {
      get: () => 2,
      roundToNearestPixel: (n) => n,
    },
    Linking: {
      openURL: jest.fn(),
      canOpenURL: jest.fn(() => Promise.resolve(true)),
      getInitialURL: jest.fn(() => Promise.resolve(null)),
    },
    Alert: { alert: jest.fn() },
    Share: { share: jest.fn(() => Promise.resolve({ action: 'sharedAction' })) },
    AppState: {
      addEventListener: jest.fn(() => ({ remove: jest.fn() })),
      removeEventListener: jest.fn(),
      currentState: 'active',
    },
    BackHandler: {
      addEventListener: jest.fn(() => ({ remove: jest.fn() })),
      exitApp: jest.fn(),
    },
    PermissionsAndroid: {
      check: jest.fn(() => Promise.resolve('granted')),
      request: jest.fn(() => Promise.resolve('granted')),
      RESULTS: { GRANTED: 'granted', DENIED: 'denied' },
    },
    Vibration: { vibrate: jest.fn(), cancel: jest.fn() },
    I18nManager: {
      allowRTL: jest.fn(),
      forceRTL: jest.fn(),
      getConstants: () => ({ isRTL: false, doLeftAndRightSwapInRTL: true }),
    },
    DevSettings: { reload: jest.fn(), addMenuItem: jest.fn() },
    AccessibilityInfo: {
      isScreenReaderEnabled: jest.fn(() => Promise.resolve(false)),
      addEventListener: jest.fn(() => ({ remove: jest.fn() })),
      announceForAccessibility: jest.fn(),
      setAccessibilityFocus: jest.fn(),
    },
    UIManager: {
      getViewManagerConfig: jest.fn(() => ({})),
      dispatchViewManagerCommand: jest.fn(),
      measure: jest.fn(),
      measureInWindow: jest.fn(),
      findViewInstanceHandle: jest.fn(),
    },
    findNodeHandle: jest.fn(),
    ActionSheetIOS: { showActionSheetWithOptions: jest.fn() },
    Clipboard: { getString: jest.fn(() => Promise.resolve('')), setString: jest.fn() },
    Appearance: {
      getColorScheme: () => 'light',
      addChangeListener: jest.fn(() => ({ remove: jest.fn() })),
    },
    NativeEventEmitter: jest.fn(),
    NativeModules: {},
    TurboModuleRegistry: {
      get: jest.fn(() => undefined),
      getEnforcing: jest.fn(() => undefined),
    },
    processColor: jest.fn(),
    requireNativeComponent: jest.fn((name) =>
      React.forwardRef((props, ref) => React.createElement(name, { ...props, ref }))
    ),
    unstable_batchedUpdates: jest.fn((fn) => fn()),
    unstable_enableLogBox: jest.fn(),
    Animated: {
      Value: jest.fn(() => ({ setValue: jest.fn(), interpolate: jest.fn() })),
      View: React.forwardRef((props, ref) => React.createElement('Animated.View', { ...props, ref })),
      Text: React.forwardRef((props, ref) => React.createElement('Animated.Text', { ...props, ref })),
      Image: React.forwardRef((props, ref) => React.createElement('Animated.Image', { ...props, ref })),
      ScrollView: React.forwardRef((props, ref) => React.createElement('Animated.ScrollView', { ...props, ref })),
      timing: jest.fn(() => ({ start: jest.fn() })),
      spring: jest.fn(() => ({ start: jest.fn() })),
      loop: jest.fn(),
      decay: jest.fn(() => ({ start: jest.fn() })),
      add: jest.fn(),
      subtract: jest.fn(),
      divide: jest.fn(),
      multiply: jest.fn(),
      modulo: jest.fn(),
      diff: jest.fn(),
      diffClamp: jest.fn(),
      clamp: jest.fn(),
      eq: jest.fn(),
      neq: jest.fn(),
      set: jest.fn(),
      cond: jest.fn(),
      event: jest.fn(() => jest.fn()),
      interpolate: jest.fn(),
      Extrapolate: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },
      runOnUI: jest.fn((fn) => fn),
      createAnimatedComponent: jest.fn((component) => component),
    },
    useWindowDimensions: jest.fn(() => ({ width: 375, height: 812, fontScale: 1, scale: 2 })),
  };
}, { virtual: true });

// ============================================
// Silence the warning: Animated: `useNativeDriver` is not supported
// ============================================
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// ============================================
// Mock React Native EventEmitter
// ============================================
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

// ============================================
// Global test timeout
// ============================================
jest.setTimeout(10000);

// ============================================
// Console error/warning suppression for known issues
// ============================================
const originalError = console.error;
const originalWarn = console.warn;

console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render') ||
      args[0].includes('Not implemented: HTMLFormElement'))
  ) {
    return;
  }
  originalError.call(console, ...args);
};

console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('componentWillReceiveProps') ||
      args[0].includes('componentWillMount'))
  ) {
    return;
  }
  originalWarn.call(console, ...args);
};

// ============================================
// Clear all mocks after each test
// ============================================
afterEach(() => {
  jest.clearAllMocks();
  storage.clear();
});

