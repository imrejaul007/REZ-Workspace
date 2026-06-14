import { create } from 'zustand';
import { SocketState } from '@/types/socket.types';

// ---------------------------------------------------------------------------
// Store holds ONLY connection state — the socket instance stays in Provider
// ---------------------------------------------------------------------------
export interface SocketStoreState {
  state: SocketState;
  isConnected: boolean;
  lastEvent: string | null;
  _setFromProvider: (state: SocketState) => void;
  _setLastEvent: (event: string) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
type StoreSet = (partial: Partial<SocketStoreState> | ((s: SocketStoreState) => Partial<SocketStoreState>), replace?: boolean) => void;
type StoreGet = () => SocketStoreState;

export const useSocketStore = create<SocketStoreState>((set: StoreSet) => ({
  state: {
    connected: false,
    reconnecting: false,
    error: null,
    lastConnected: null,
    reconnectAttempts: 0,
  },
  isConnected: false,
  lastEvent: null,

  _setFromProvider: (state: SocketState) => {
    set({ state, isConnected: state.connected });
  },

  _setLastEvent: (event: string) => {
    set({ lastEvent: event });
  },
}));
