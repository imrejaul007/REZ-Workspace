'use client';

/**
 * Thermal Printer Hook (R6 Feature B)
 *
 * Provides Web Bluetooth ESC/POS printing with browser-print fallback.
 *
 * Usage:
 *   const { device, isConnected, discoverPrinter, print, status } = useThermalPrinter();
 *
 * Browser requirements:
 *   - Chrome/Edge 85+ for Web Bluetooth
 *   - HTTPS required for Bluetooth
 *   - Falls back to window.print() on desktop or unsupported browsers
 */

import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'rez-printer-id';

// ── Web Bluetooth API Types ──────────────────────────────────────────────────
// These types are browser-only and not included in the default TypeScript lib.
// Declared here to avoid installing @types/web-bluetooth.
declare global {
   
  type BluetoothServiceUUID = number | string;
   
  type BluetoothCharacteristicUUID = number | string;
   
  type BluetoothDescriptorUUID = number | string;

  interface BluetoothDevice {
    readonly id: string;
    readonly name?: string;
    readonly gatt?: BluetoothRemoteGATTServer;
    readonly watchingAdvertisements: boolean;
    watchAdvertisements(options?: { signal?: AbortSignal }): Promise<void>;
    addEventListener(type: 'gattserverdisconnected', listener: EventListener): void;
    removeEventListener(type: 'gattserverdisconnected', listener: EventListener): void;
  }

  interface BluetoothRemoteGATTServer {
    readonly device: BluetoothDevice;
    readonly connected: boolean;
    connect(): Promise<BluetoothRemoteGATTService>;
    disconnect(): void;
  }

  interface BluetoothRemoteGATTService {
    readonly device: BluetoothDevice;
    readonly uuid: string;
    readonly isPrimary: boolean;
    getCharacteristic(characteristic: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic>;
    getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>;
    getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
    getPrimaryServices(service?: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService[]>;
  }

  interface BluetoothRemoteGATTCharacteristic {
    readonly service: BluetoothRemoteGATTService;
    readonly uuid: string;
    readonly properties: BluetoothCharacteristicProperties;
    getDescriptor(descriptor: BluetoothDescriptorUUID): Promise<BluetoothRemoteGATTDescriptor>;
    getDescriptors(): Promise<BluetoothRemoteGATTDescriptor[]>;
    readValue(): Promise<DataView>;
    writeValue(value: BufferSource): Promise<void>;
    writeValueWithResponse(value: BufferSource): Promise<void>;
    writeValueWithoutResponse(value: BufferSource): Promise<void>;
    startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
    addEventListener(type: 'characteristicvaluechanged', listener: EventListener): void;
    removeEventListener(type: 'characteristicvaluechanged', listener: EventListener): void;
  }

  interface BluetoothRemoteGATTDescriptor {
    readonly characteristic: BluetoothRemoteGATTCharacteristic;
    readonly uuid: string;
    readonly value: DataView;
    readValue(): Promise<DataView>;
    writeValue(value: BufferSource): Promise<void>;
  }

  interface BluetoothCharacteristicProperties {
    readonly broadcast: boolean;
    readonly read: boolean;
    readonly writeWithoutResponse: boolean;
    readonly write: boolean;
    readonly notify: boolean;
    readonly indicate: boolean;
    readonly authenticatedSignedWrites: boolean;
    readonly reliableWrite: boolean;
    readonly writableAuxiliaries: boolean;
  }

  interface Bluetooth {
    getAvailability(): Promise<boolean>;
    getDevices(): Promise<BluetoothDevice[]>;
    requestDevice(options?: {
      filters?: Array<{ services?: BluetoothServiceUUID[]; name?: string; namePrefix?: string }>;
      optionalServices?: BluetoothServiceUUID[];
      acceptAllDevices?: boolean;
    }): Promise<BluetoothDevice>;
  }

  interface Navigator {
    readonly bluetooth?: Bluetooth;
  }
}

// ── Types ────────────────────────────────────────────────────────────────────

interface ThermalPrinterState {
  device: BluetoothDevice | null;
  char: BluetoothRemoteGATTCharacteristic | null;
  isConnected: boolean;
  status: 'idle' | 'discovering' | 'connecting' | 'printing' | 'error';
  errorMessage: string | null;
}

interface UseThermalPrinterReturn {
  /** The connected Bluetooth device, or null */
  device: BluetoothDevice | null;
  /** True when actively connected to a printer */
  isConnected: boolean;
  /** Human-readable status */
  status: ThermalPrinterState['status'];
  /** Error message if status is 'error' */
  errorMessage: string | null;
  /** Discover and connect to a Bluetooth ESC/POS printer */
  discoverPrinter: () => Promise<boolean>;
  /** Disconnect from the current printer */
  disconnect: () => void;
  /** Send raw ESC/POS bytes to the connected printer */
  print: (data: Uint8Array) => Promise<boolean>;
  /** Print a receipt with browser print dialog fallback */
  printReceipt: (receipt: Uint8Array) => Promise<boolean>;
  /** Whether Web Bluetooth is available in this browser */
  isBluetoothAvailable: boolean;
}

// ── ESC/POS service UUIDs ────────────────────────────────────────────────────

// Standard ESC/POS Bluetooth Serial Port Profile (SPP) or custom
const ESCPOS_SERVICE_UUID = '0000ff00-0000-1000-8000-00805f9b34fb';
const ESCPOS_WRITE_UUID = '0000ff01-0000-1000-8000-00805f9b34fb';

// Common ESC/POS printer service UUIDs
const KNOWN_PRINTER_SERVICES = [
  '0000ff00-0000-1000-8000-00805f9b34fb', // Generic ESC/POS
  '00001101-0000-1000-8000-00805f9b34fb', // Serial Port Profile (SPP)
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // HP printers
  '6a136f00-c486-11e0-9573-000378107c06', // Star Micronics
];

// ── Hook ────────────────────────────────────────────────────────────────────

export function useThermalPrinter(): UseThermalPrinterReturn {
  const [state, setState] = useState<ThermalPrinterState>({
    device: null,
    char: null,
    isConnected: false,
    status: 'idle',
    errorMessage: null,
  });

  const deviceRef = useRef<BluetoothDevice | null>(null);
  const charRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);

  /** Whether Web Bluetooth API is available */
  const isBluetoothAvailable =
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    'bluetooth' in navigator;

  /**
   * Disconnect from the current Bluetooth device.
   */
  const disconnect = useCallback(() => {
    if (deviceRef.current?.gatt?.connected) {
      deviceRef.current.gatt.disconnect();
    }
    deviceRef.current = null;
    charRef.current = null;
    setState((s) => ({
      ...s,
      device: null,
      char: null,
      isConnected: false,
      status: 'idle',
      errorMessage: null,
    }));
  }, []);

  /**
   * Connect to a specific Bluetooth device.
   */
  const connectToDevice = useCallback(async (device: BluetoothDevice): Promise<boolean> => {
    setState((s) => ({ ...s, status: 'connecting', errorMessage: null }));

    try {
      const server = await device.gatt!.connect();
      // Try to get the primary service — fallback to the first available service
      let service: BluetoothRemoteGATTService;
      try {
        service = await server.getPrimaryService(ESCPOS_SERVICE_UUID);
      } catch {
        // Fallback: try to get any service that has a writable characteristic
        const services = await server.getPrimaryServices();
        service = services[0];
      }

      // Get the write characteristic
      let characteristic: BluetoothRemoteGATTCharacteristic;
      try {
        characteristic = await service.getCharacteristic(ESCPOS_WRITE_UUID);
      } catch {
        // Fallback: use the first writable characteristic
        const characteristics = await service.getCharacteristics();
        characteristic = characteristics.find((c: BluetoothRemoteGATTCharacteristic) => c.properties.write || c.properties.writeWithoutResponse) ?? characteristics[0];
      }

      deviceRef.current = device;
      charRef.current = characteristic;

      // Remember this device ID
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, device.id);
      }

      // Listen for disconnect
      device.addEventListener('gattserverdisconnected', () => {
        deviceRef.current = null;
        charRef.current = null;
        setState((s) => ({
          ...s,
          isConnected: false,
          status: 'idle',
          errorMessage: 'Printer disconnected',
        }));
      });

      setState((s) => ({
        ...s,
        device,
        char: characteristic,
        isConnected: true,
        status: 'idle',
      }));

      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      setState((s) => ({
        ...s,
        status: 'error',
        errorMessage: msg,
      }));
      return false;
    }
  }, []);

  /**
   * Attempt to silently reconnect to a previously used printer.
   * Uses navigator.bluetooth.getDevices() which returns previously authorised devices
   * without showing a picker UI.
   */
  useEffect(() => {
    if (!isBluetoothAvailable) return;
    if (typeof localStorage === 'undefined') return;

    const savedId = localStorage.getItem(STORAGE_KEY);
    if (!savedId) return;

    // Use getDevices() for silent reconnection (no picker)
    if (navigator.bluetooth && 'getDevices' in navigator.bluetooth) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- async Bluetooth reconnect sets derived state; non-cascading
      setState((s) => ({ ...s, status: 'connecting' }));

      navigator.bluetooth!.getDevices().then((devices: BluetoothDevice[]) => {
        const savedDevice = devices.find((d) => d.id === savedId);
        if (savedDevice && savedDevice.gatt) {
          connectToDevice(savedDevice).catch(() => {
            setState((s) => ({ ...s, status: 'idle' }));
          });
        }
      }).catch(() => {
        // Silent failure — user can manually discover
        setState((s) => ({ ...s, status: 'idle' }));
      });
    }
  }, [isBluetoothAvailable, connectToDevice]);

  /**
   * Open the Bluetooth device picker and connect to a printer.
   */
  const discoverPrinter = useCallback(async (): Promise<boolean> => {
    if (!isBluetoothAvailable) {
      setState((s) => ({
        ...s,
        status: 'error',
        errorMessage: 'Web Bluetooth is not available in this browser. Use Chrome or Edge.',
      }));
      return false;
    }

    setState((s) => ({ ...s, status: 'discovering', errorMessage: null }));

    try {
      const device = await navigator.bluetooth!.requestDevice({
        filters: [{ services: [ESCPOS_SERVICE_UUID] }],
        optionalServices: KNOWN_PRINTER_SERVICES,
        acceptAllDevices: true,
      });

      return await connectToDevice(device);
    } catch (err: unknown) {
      const errName = (err as { name?: string }).name;
      if (errName === 'NotFoundError' || errName === 'AbortError') {
        // User cancelled — not an error
        setState((s) => ({ ...s, status: 'idle' }));
        return false;
      }
      const msg = err instanceof Error ? err.message : 'Discovery failed';
      setState((s) => ({ ...s, status: 'error', errorMessage: msg }));
      return false;
    }
  }, [isBluetoothAvailable, connectToDevice]);

  /**
   * Send raw ESC/POS bytes to the connected printer.
   * Splits into chunks of <= 512 bytes per BLE write operation.
   */
  const print = useCallback(
    async (data: Uint8Array): Promise<boolean> => {
      if (!charRef.current || !deviceRef.current?.gatt?.connected) {
        setState((s) => ({
          ...s,
          status: 'error',
          errorMessage: 'No printer connected',
        }));
        return false;
      }

      setState((s) => ({ ...s, status: 'printing' }));

      try {
        const CHUNK_SIZE = 512;
        for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) {
          const chunk = data.slice(offset, offset + CHUNK_SIZE);
          await charRef.current.writeValue(chunk);
          // Small delay between chunks for BLE
          await new Promise((r) => setTimeout(r, 10));
        }

        setState((s) => ({ ...s, status: 'idle' }));
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Print failed';
        setState((s) => ({ ...s, status: 'error', errorMessage: msg }));
        return false;
      }
    },
    [],
  );

  /**
   * Print a receipt: try Bluetooth first, fall back to browser print dialog.
   */
  const printReceipt = useCallback(
    async (receipt: Uint8Array): Promise<boolean> => {
      // Try Bluetooth first
      if (charRef.current && deviceRef.current?.gatt?.connected) {
        const success = await print(receipt);
        if (success) return true;
      }

      // Fall back to browser print
      if (typeof window !== 'undefined') {
        // NW-MED-021: Do NOT render raw ESC/POS bytes as text — String.fromCharCode on binary
        // data produces garbled output. Instead, show a plain-text fallback message.
        const printWindow = window.open('', '_blank', 'width=300,height=600');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head><title>Print Receipt</title></head>
              <style>
                @page { margin: 5mm; size: 58mm auto; }
                body { font-family: monospace; font-size: 11px; width: 58mm; margin: 0; padding: 0; }
              </style>
              <body onload="window.print(); window.close();">
                <pre>Please use a Bluetooth thermal printer for receipts.</pre>
              </body>
            </html>
          `);
          printWindow.document.close();
          return true;
        }
      }

      setState((s) => ({
        ...s,
        status: 'error',
        errorMessage: 'No printer connected and print window blocked',
      }));
      return false;
    },
    [print],
  );

  return {
    device: state.device,
    isConnected: state.isConnected,
    status: state.status,
    errorMessage: state.errorMessage,
    discoverPrinter,
    disconnect,
    print,
    printReceipt,
    isBluetoothAvailable,
  };
}
