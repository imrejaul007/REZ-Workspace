import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Package, RefreshCw } from 'lucide-react';

interface TrackingMapProps {
  pickup: [number, number];
  delivery: [number, number];
  rider?: [number, number];
  isLive?: boolean;
}

export default function TrackingMap({
  pickup,
  delivery,
  rider,
  isLive = false,
}: TrackingMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [riderPosition, setRiderPosition] = useState(rider);
  const animationRef = useRef<number | null>(null);

  // Simulate rider movement when live
  useEffect(() => {
    if (isLive && rider) {
      const animate = () => {
        setRiderPosition((prev) => {
          if (!prev || !rider) return prev;
          // Move slightly towards destination
          const dx = (delivery[0] - prev[0]) * 0.02;
          const dy = (delivery[1] - prev[1]) * 0.02;
          return [prev[0] + dx, prev[1] + dy];
        });
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    } else if (rider) {
      setRiderPosition(rider);
    }
  }, [isLive, rider, delivery]);

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!riderPosition) return 0;
    const totalDistance = Math.sqrt(
      Math.pow(delivery[0] - pickup[0], 2) + Math.pow(delivery[1] - pickup[1], 2)
    );
    const traveledDistance = Math.sqrt(
      Math.pow(riderPosition[0] - pickup[0], 2) + Math.pow(riderPosition[1] - pickup[1], 2)
    );
    return Math.min(100, (traveledDistance / totalDistance) * 100);
  };

  const progress = calculateProgress();

  return (
    <div className="relative h-96 bg-gradient-to-br from-gray-100 to-gray-200">
      {/* Map placeholder - shows a stylized representation */}
      <div ref={mapContainerRef} className="absolute inset-0 overflow-hidden">
        {/* Grid pattern to simulate map */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 400 400"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="#d1d5db"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Route line from pickup to delivery */}
          <line
            x1={`${((pickup[0] + 90) / 0.4) * 400 / 400 * 100}%`}
            y1={`${((pickup[1] + 90) / 0.4) * 400 / 400 * 100}%`}
            x2={`${((delivery[0] + 90) / 0.4) * 400 / 400 * 100}%`}
            y2={`${((delivery[1] + 90) / 0.4) * 400 / 400 * 100}%`}
            stroke="#9ca3af"
            strokeWidth="3"
            strokeDasharray="8 4"
          />

          {/* Progress line overlay */}
          {riderPosition && (
            <line
              x1={`${((pickup[0] + 90) / 0.4) * 400 / 400 * 100}%`}
              y1={`${((pickup[1] + 90) / 0.4) * 400 / 400 * 100}%`}
              x2={`${((riderPosition[0] + 90) / 0.4) * 400 / 400 * 100}%`}
              y2={`${((riderPosition[1] + 90) / 0.4) * 400 / 400 * 100}%`}
              stroke="#3b82f6"
              strokeWidth="4"
              strokeLinecap="round"
            />
          )}
        </svg>

        {/* Pickup marker */}
        <div
          className="absolute p-2 bg-amber-100 rounded-lg shadow-lg transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${((pickup[0] + 90) / 0.4) * 100}%`,
            top: `${((pickup[1] + 90) / 0.4) * 100}%`,
          }}
        >
          <Package className="w-5 h-5 text-amber-600" />
        </div>

        {/* Delivery marker */}
        <div
          className="absolute p-2 bg-green-100 rounded-lg shadow-lg transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${((delivery[0] + 90) / 0.4) * 100}%`,
            top: `${((delivery[1] + 90) / 0.4) * 100}%`,
          }}
        >
          <MapPin className="w-5 h-5 text-green-600" />
        </div>

        {/* Rider marker with animation */}
        {riderPosition && (
          <div
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-100 ${
              isLive ? 'animate-pulse' : ''
            }`}
            style={{
              left: `${((riderPosition[0] + 90) / 0.4) * 100}%`,
              top: `${((riderPosition[1] + 90) / 0.4) * 100}%`,
            }}
          >
            <div className="relative">
              <div className="absolute -inset-3 bg-primary-200 rounded-full opacity-50 animate-ping" />
              <div className="relative p-2 bg-primary-600 rounded-full shadow-lg">
                <Navigation className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Map overlay info */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-sm text-gray-600">Pickup</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm text-gray-600">Delivery</span>
        </div>
        {rider && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary-500" />
            <span className="text-sm text-gray-600">Rider</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Delivery Progress</span>
          <span className="text-sm font-bold text-primary-600">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        {isLive && (
          <div className="flex items-center gap-2 mt-2 text-xs text-primary-600">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Live tracking active</span>
          </div>
        )}
      </div>
    </div>
  );
}
