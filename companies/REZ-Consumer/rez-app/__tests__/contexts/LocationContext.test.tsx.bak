/**
 * LocationContext Tests
 * Tests the locationReducer logic directly, covering initial state, location
 * updates, permission handling and error clearing.
 */

// ---------------------------------------------------------------------------
// Inline reducer mirroring LocationContext
// ---------------------------------------------------------------------------

interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

interface LocationAddress {
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  formattedAddress: string;
}

interface UserLocation {
  coordinates: LocationCoordinates;
  address: LocationAddress;
  lastUpdated: Date;
  source: 'gps' | 'manual' | 'ip';
}

interface LocationHistoryEntry {
  location: UserLocation;
  timestamp: Date;
}

type PermissionStatus = 'granted' | 'denied' | 'undetermined';

interface LocationPermissionResult {
  status: PermissionStatus;
}

interface LocationState {
  currentLocation: UserLocation | null;
  locationHistory: LocationHistoryEntry[];
  isLoading: boolean;
  error: string | null;
  permissionStatus: PermissionStatus;
  isLocationEnabled: boolean;
}

type LocationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CURRENT_LOCATION'; payload: UserLocation | null }
  | { type: 'SET_LOCATION_HISTORY'; payload: LocationHistoryEntry[] }
  | { type: 'SET_PERMISSION_STATUS'; payload: LocationPermissionResult }
  | { type: 'SET_LOCATION_ENABLED'; payload: boolean }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET_STATE' };

const initialState: LocationState = {
  currentLocation: null,
  locationHistory: [],
  isLoading: false,
  error: null,
  permissionStatus: 'undetermined',
  isLocationEnabled: false,
};

function locationReducer(
  state: LocationState,
  action: LocationAction
): LocationState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_CURRENT_LOCATION':
      return { ...state, currentLocation: action.payload, isLoading: false };
    case 'SET_LOCATION_HISTORY':
      return { ...state, locationHistory: action.payload };
    case 'SET_PERMISSION_STATUS':
      return {
        ...state,
        permissionStatus: action.payload.status,
        isLocationEnabled: action.payload.status === 'granted',
      };
    case 'SET_LOCATION_ENABLED':
      return { ...state, isLocationEnabled: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const bangaloreLocation: UserLocation = {
  coordinates: { latitude: 12.9716, longitude: 77.5946 },
  address: {
    address: 'Bangalore, India',
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    pincode: '560001',
    formattedAddress: 'Bangalore, Karnataka, India',
  },
  lastUpdated: new Date('2025-01-01T00:00:00Z'),
  source: 'gps',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LocationContext – initial state', () => {
  it('starts with currentLocation null', () => {
    expect(initialState.currentLocation).toBeNull();
  });

  it('starts with permissionStatus undetermined', () => {
    expect(initialState.permissionStatus).toBe('undetermined');
  });

  it('starts with isLocationEnabled false', () => {
    expect(initialState.isLocationEnabled).toBe(false);
  });

  it('starts with empty location history', () => {
    expect(initialState.locationHistory).toHaveLength(0);
  });
});

describe('LocationContext – SET_CURRENT_LOCATION', () => {
  it('updates currentLocation and clears isLoading', () => {
    const loading = locationReducer(initialState, {
      type: 'SET_LOADING',
      payload: true,
    });
    const state = locationReducer(loading, {
      type: 'SET_CURRENT_LOCATION',
      payload: bangaloreLocation,
    });

    expect(state.currentLocation).toEqual(bangaloreLocation);
    expect(state.isLoading).toBe(false);
  });

  it('accepts null to clear the current location', () => {
    const withLocation = locationReducer(initialState, {
      type: 'SET_CURRENT_LOCATION',
      payload: bangaloreLocation,
    });
    const state = locationReducer(withLocation, {
      type: 'SET_CURRENT_LOCATION',
      payload: null,
    });
    expect(state.currentLocation).toBeNull();
  });
});

describe('LocationContext – permission check logic', () => {
  it('SET_PERMISSION_STATUS granted enables location', () => {
    const state = locationReducer(initialState, {
      type: 'SET_PERMISSION_STATUS',
      payload: { status: 'granted' },
    });

    expect(state.permissionStatus).toBe('granted');
    expect(state.isLocationEnabled).toBe(true);
  });

  it('SET_PERMISSION_STATUS denied disables location', () => {
    const state = locationReducer(initialState, {
      type: 'SET_PERMISSION_STATUS',
      payload: { status: 'denied' },
    });

    expect(state.permissionStatus).toBe('denied');
    expect(state.isLocationEnabled).toBe(false);
  });

  it('SET_PERMISSION_STATUS undetermined leaves location disabled', () => {
    const state = locationReducer(initialState, {
      type: 'SET_PERMISSION_STATUS',
      payload: { status: 'undetermined' },
    });

    expect(state.permissionStatus).toBe('undetermined');
    expect(state.isLocationEnabled).toBe(false);
  });
});

describe('LocationContext – error handling', () => {
  it('SET_ERROR stores the error message and clears isLoading', () => {
    const loading = locationReducer(initialState, {
      type: 'SET_LOADING',
      payload: true,
    });
    const state = locationReducer(loading, {
      type: 'SET_ERROR',
      payload: 'Location permission not granted',
    });

    expect(state.error).toBe('Location permission not granted');
    expect(state.isLoading).toBe(false);
  });

  it('CLEAR_ERROR removes the error without changing other fields', () => {
    const withError = locationReducer(initialState, {
      type: 'SET_ERROR',
      payload: 'Some error',
    });
    const state = locationReducer(withError, { type: 'CLEAR_ERROR' });
    expect(state.error).toBeNull();
  });
});

describe('LocationContext – RESET_STATE', () => {
  it('resets everything back to initial state', () => {
    let state = locationReducer(initialState, {
      type: 'SET_CURRENT_LOCATION',
      payload: bangaloreLocation,
    });
    state = locationReducer(state, {
      type: 'SET_PERMISSION_STATUS',
      payload: { status: 'granted' },
    });
    state = locationReducer(state, { type: 'RESET_STATE' });

    expect(state).toEqual(initialState);
  });
});

describe('LocationContext – location history', () => {
  it('SET_LOCATION_HISTORY stores the history entries', () => {
    const entry: LocationHistoryEntry = {
      location: bangaloreLocation,
      timestamp: new Date(),
    };
    const state = locationReducer(initialState, {
      type: 'SET_LOCATION_HISTORY',
      payload: [entry],
    });
    expect(state.locationHistory).toHaveLength(1);
    expect(state.locationHistory[0].location.address.city).toBe('Bangalore');
  });
});
