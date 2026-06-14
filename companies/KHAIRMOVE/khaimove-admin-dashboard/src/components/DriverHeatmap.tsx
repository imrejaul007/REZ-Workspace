import { logger } from '../../shared/logger';
// KHAIRMOVE Real-Time Driver Heatmap Component
// Uses REZ Location Intel for live demand visualization

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Circle, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ============================================
// TYPES
// ============================================

interface HotZone {
  id: string;
  lat: number;
  lng: number;
  intensity: number; // 0-1
  type: 'residential' | 'commercial' | 'transit' | 'entertainment';
  demandLevel: 'low' | 'medium' | 'high' | 'surge';
}

interface DriverLocation {
  driverId: string;
  lat: number;
  lng: number;
  status: 'online' | 'busy';
  vehicleType: 'bike' | 'auto' | 'cab' | 'suv';
  heading?: number;
}

interface DemandSignal {
  lat: number;
  lng: number;
  demandLevel: 'low' | 'medium' | 'high' | 'surge';
  activeDrivers: number;
  pendingRequests: number;
  waitTime: number;
  surgeMultiplier: number;
}

interface HeatmapProps {
  center?: [number, number];
  zoom?: number;
  showDrivers?: boolean;
  showHotspots?: boolean;
  showDemand?: boolean;
  onZoneClick?: (zone: HotZone) => void;
  apiBaseUrl?: string;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getDemandColor(level: string): string {
  switch (level) {
    case 'surge': return '#EF4444'; // Red
    case 'high': return '#F97316'; // Orange
    case 'medium': return '#EAB308'; // Yellow
    case 'low': return '#22C55E'; // Green
    default: return '#6B7280'; // Gray
  }
}

function getDemandOpacity(intensity: number): number {
  return 0.2 + (intensity * 0.4); // 0.2 to 0.6
}

function getSurgeLabel(multiplier: number): string {
  if (multiplier >= 1.5) return '🔥 SURGE';
  if (multiplier >= 1.25) return '⚡ High';
  if (multiplier >= 1.1) return '📈 Moderate';
  return '✅ Normal';
}

// ============================================
// MAP COMPONENT
// ============================================

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
}

function DriverMarkers({ drivers }: { drivers: DriverLocation[] }) {
  const map = useMap();

  return (
    <>
      {drivers.map((driver) => (
        <CircleMarker
          key={driver.driverId}
          center={[driver.lat, driver.lng]}
          radius={driver.status === 'online' ? 6 : 4}
          pathOptions={{
            color: driver.status === 'online' ? '#22C55E' : '#6B7280',
            fillColor: driver.status === 'online' ? '#22C55E' : '#6B7280',
            fillOpacity: 0.8,
            weight: 2,
          }}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-medium">Driver {driver.driverId.slice(0, 8)}</p>
              <p>Status: {driver.status}</p>
              <p>Vehicle: {driver.vehicleType}</p>
              {driver.heading !== undefined && (
                <p>Heading: {driver.heading}°</p>
              )}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
}

function HotZoneCircles({ zones, onClick }: { zones: HotZone[]; onClick?: (zone: HotZone) => void }) {
  return (
    <>
      {zones.map((zone) => (
        <Circle
          key={zone.id}
          center={[zone.lat, zone.lng]}
          radius={500 + zone.intensity * 1000} // 500m to 1500m radius
          pathOptions={{
            color: getDemandColor(zone.demandLevel),
            fillColor: getDemandColor(zone.demandLevel),
            fillOpacity: getDemandOpacity(zone.intensity),
            weight: 2,
            dashArray: zone.demandLevel === 'surge' ? '5, 5' : undefined,
          }}
          eventHandlers={{
            click: () => onClick?.(zone),
          }}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-medium capitalize">{zone.type} Zone</p>
              <p className="text-lg font-bold" style={{ color: getDemandColor(zone.demandLevel) }}>
                {zone.demandLevel.toUpperCase()}
              </p>
              <p>Intensity: {(zone.intensity * 100).toFixed(0)}%</p>
            </div>
          </Popup>
        </Circle>
      ))}
    </>
  );
}

function DemandGrid({ signals }: { signals: DemandSignal[] }) {
  return (
    <>
      {signals.map((signal, index) => (
        <Circle
          key={`demand-${index}`}
          center={[signal.lat, signal.lng]}
          radius={300}
          pathOptions={{
            color: getDemandColor(signal.demandLevel),
            fillColor: getDemandColor(signal.demandLevel),
            fillOpacity: 0.15,
            weight: 1,
          }}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-bold">{getSurgeLabel(signal.surgeMultiplier)}</p>
              <p>Drivers: {signal.activeDrivers}</p>
              <p>Pending: {signal.pendingRequests}</p>
              <p>Wait: ~{signal.waitTime} min</p>
              <p>Surge: {signal.surgeMultiplier.toFixed(1)}x</p>
            </div>
          </Popup>
        </Circle>
      ))}
    </>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function DriverHeatmap({
  center = [12.9716, 77.5946], // Bangalore
  zoom = 13,
  showDrivers = true,
  showHotspots = true,
  showDemand = true,
  onZoneClick,
  apiBaseUrl = 'http://localhost:4040',
}: HeatmapProps) {
  const [hotZones, setHotZones] = useState<HotZone[]>([]);
  const [drivers, setDrivers] = useState<DriverLocation[]>([]);
  const [demandSignals, setDemandSignals] = useState<DemandSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<HotZone | null>(null);

  // Fetch hot zones from REZ Location Intel
  const fetchHotZones = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/location/hot-zones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: center[0],
          lng: center[1],
          radius: 10,
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch hot zones');

      const data = await response.json();
      setHotZones(data.zones || []);
    } catch (err) {
      logger.warn('Hot zones fetch failed:', err);
      // Use mock data for demo
      setHotZones([
        { id: '1', lat: 12.9716, lng: 77.5946, intensity: 0.9, type: 'commercial', demandLevel: 'surge' },
        { id: '2', lat: 12.9350, lng: 77.6246, intensity: 0.7, type: 'residential', demandLevel: 'high' },
        { id: '3', lat: 12.9850, lng: 77.5646, intensity: 0.5, type: 'transit', demandLevel: 'medium' },
        { id: '4', lat: 12.9500, lng: 77.5546, intensity: 0.3, type: 'entertainment', demandLevel: 'low' },
      ]);
    }
  }, [apiBaseUrl]);

  // Fetch demand signals
  const fetchDemandSignals = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/demand/signals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: center[0],
          lng: center[1],
          radius: 5,
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch demand signals');

      const data = await response.json();
      setDemandSignals(data.signals || []);
    } catch (err) {
      logger.warn('Demand signals fetch failed:', err);
      // Use mock data for demo
      setDemandSignals([
        { lat: 12.9716, lng: 77.5946, demandLevel: 'high', activeDrivers: 45, pendingRequests: 23, waitTime: 4, surgeMultiplier: 1.3 },
        { lat: 12.9350, lng: 77.6246, demandLevel: 'surge', activeDrivers: 12, pendingRequests: 28, waitTime: 8, surgeMultiplier: 1.7 },
        { lat: 12.9850, lng: 77.5646, demandLevel: 'low', activeDrivers: 67, pendingRequests: 8, waitTime: 2, surgeMultiplier: 1.0 },
      ]);
    }
  }, [apiBaseUrl]);

  // Simulate driver locations (in production, this would come from WebSocket)
  useEffect(() => {
    const mockDrivers: DriverLocation[] = Array.from({ length: 30 }, (_, i) => ({
      driverId: `driver-${i.toString().padStart(3, '0')}`,
      lat: center[0] + (Math.random() - 0.5) * 0.05,
      lng: center[1] + (Math.random() - 0.5) * 0.05,
      status: Math.random() > 0.3 ? 'online' : 'busy',
      vehicleType: ['bike', 'auto', 'cab', 'suv'][Math.floor(Math.random() * 4)] as DriverLocation['vehicleType'],
      heading: Math.floor(Math.random() * 360),
    }));
    setDrivers(mockDrivers);
  }, [center]);

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      await Promise.all([
        fetchHotZones(),
        fetchDemandSignals(),
      ]);

      setLoading(false);
    };

    fetchData();

    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, [fetchHotZones, fetchDemandSignals]);

  const handleZoneClick = (zone: HotZone) => {
    setSelectedZone(zone);
    onZoneClick?.(zone);
  };

  // Calculate summary stats
  const totalDrivers = drivers.filter(d => d.status === 'online').length;
  const surgeZones = hotZones.filter(z => z.demandLevel === 'surge' || z.demandLevel === 'high').length;
  const avgSurge = demandSignals.length > 0
    ? demandSignals.reduce((sum, s) => sum + s.surgeMultiplier, 0) / demandSignals.length
    : 1;

  return (
    <div className="relative w-full h-full min-h-[500px]">
      {/* Stats Bar */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex gap-4 bg-white/95 backdrop-blur rounded-xl shadow-lg p-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
          <span className="font-medium">{totalDrivers}</span>
          <span className="text-gray-500">Online Drivers</span>
        </div>

        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${surgeZones > 0 ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`} />
          <span className="font-medium">{surgeZones}</span>
          <span className="text-gray-500">Hot Zones</span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`font-bold ${avgSurge > 1.2 ? 'text-red-500' : 'text-green-500'}`}>
            {avgSurge.toFixed(1)}x
          </span>
          <span className="text-gray-500">Avg Surge</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-gray-500">Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-xs text-gray-500">Med</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-xs text-gray-500">High</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-gray-500">Surge</span>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="absolute inset-0 z-[1001] bg-white/80 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-gray-500">Loading map data...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1001] bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => { setError(null); fetchHotZones(); }}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      )}

      {/* Map */}
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full rounded-xl"
        style={{ minHeight: '500px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController center={center} zoom={zoom} />

        {showHotspots && <HotZoneCircles zones={hotZones} onClick={handleZoneClick} />}
        {showDemand && <DemandGrid signals={demandSignals} />}
        {showDrivers && <DriverMarkers drivers={drivers} />}
      </MapContainer>

      {/* Selected Zone Panel */}
      {selectedZone && (
        <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-xl shadow-lg p-4 w-72">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold capitalize">{selectedZone.type} Zone</h3>
            <button
              onClick={() => setSelectedZone(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Demand Level</span>
              <span
                className="font-bold px-2 py-1 rounded text-white text-sm"
                style={{ backgroundColor: getDemandColor(selectedZone.demandLevel) }}
              >
                {selectedZone.demandLevel.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500">Intensity</span>
              <span className="font-medium">{(selectedZone.intensity * 100).toFixed(0)}%</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500">Location</span>
              <span className="font-medium text-sm">
                {selectedZone.lat.toFixed(4)}, {selectedZone.lng.toFixed(4)}
              </span>
            </div>
          </div>

          <button
            className="mt-4 w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            onClick={() => {
              // Dispatch recommendation
              logger.info('Dispatch to zone:', selectedZone);
            }}
          >
            Dispatch Drivers
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// USAGE EXAMPLE
// ============================================

/*
import DriverHeatmap from './components/DriverHeatmap';

function AdminDashboard() {
  const [selectedZone, setSelectedZone] = useState(null);

  return (
    <div className="h-[600px]">
      <DriverHeatmap
        center={[12.9716, 77.5946]}
        zoom={13}
        showDrivers={true}
        showHotspots={true}
        showDemand={true}
        onZoneClick={(zone) => logger.info('Zone clicked:', zone)}
        apiBaseUrl="http://localhost:4040"
      />
    </div>
  );
}
*/
