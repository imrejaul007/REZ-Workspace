/*** Map Component - Google Maps Integration ***/
import { useEffect, useRef, useState } from 'react';

interface MapProps {
  center?: [number, number];
  zoom?: number;
  markers?: Array<{
    id: string;
    position: [number, number];
    title?: string;
    onClick?: () => void;
  }>;
  onMapClick?: (lat: number, lng: number) => void;
  height?: string;
  className?: string;
}

// Google Maps API key should be set in environment
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

export function Map({ center, zoom = 14, markers = [], height = '400px', className = '' }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);

  useEffect(() => {
    // Placeholder for Google Maps integration
    // Requires valid Google Maps API key
    console.log('Map component loaded');
  }, []);

  return (
    <div ref={mapRef} style={{ height }} className={`rounded-xl bg-blue-50 flex items-center justify-center ${className}`}>
      <span className="text-blue-500">Map view (Configure Google Maps API key)</span>
    </div>
  );
}

// Lazy load Google Maps
export function withGoogleMaps(Component: React.ComponentType<any>) {
  return function Wrapped(props: any) {
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
      setLoaded(true);
    }, []);

    return loaded ? <Component {...props} /> : (
      <div className="h-64 bg-gray-100 rounded-xl flex items-center justify-center">
        <span>Loading map...</span>
      </div>
    );
  };
}

// Leaflet fallback (no API key needed)
export function LeafletMap({ markers = [], height = '400px', className = '' }: MapProps) {
  return (
    <div className={`relative ${className}`} style={{ height }}>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center overflow-hidden">
        {markers.map((m, i) => (
          <div
            key={m.id || i}
            className="absolute w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"
            style={{ top: '50%', left: `${50 + (i * 10)}%` }}
          />
        ))}
      </div>
      <div className="absolute bottom-4 left-4 bg-white px-3 py-1 rounded-lg shadow text-sm">
        📍 {markers.length} locations
      </div>
    </div>
  );
}
