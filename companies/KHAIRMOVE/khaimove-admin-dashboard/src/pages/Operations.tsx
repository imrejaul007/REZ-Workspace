import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { MapPin, Navigation, AlertCircle, CheckCircle, Clock } from 'lucide-react';

// Types
interface Driver {
  id: string;
  name: string;
  vehicle: string;
  plate: string;
  lat: number;
  lng: number;
  status: 'online' | 'busy' | 'offline';
  rating: number;
}

interface Ride {
  id: string;
  pickup: string;
  drop: string;
  driver: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed';
  eta: string;
}

interface Alert {
  type: 'warning' | 'info' | 'success';
  message: string;
  time: string;
}

export default function Operations() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'map' | 'rides' | 'alerts'>('map');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  // Authentication check
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  // Fetch operations data
  useEffect(() => {
    const fetchOperationsData = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
      const API_BASE = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:4600';
      
      try {
        setLoading(true);
        
        // Fetch drivers
        const driversRes = await fetch(`${API_BASE}/api/drivers`, {
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` }),
            'Content-Type': 'application/json',
          },
        });
        
        // Fetch active rides
        const ridesRes = await fetch(`${API_BASE}/api/rides/active`, {
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` }),
            'Content-Type': 'application/json',
          },
        });
        
        // Fetch alerts
        const alertsRes = await fetch(`${API_BASE}/api/alerts`, {
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` }),
            'Content-Type': 'application/json',
          },
        });

        if (driversRes.ok) {
          const driversData = await driversRes.json();
          setDrivers(driversData.data || driversData);
        } else {
          // Fallback mock data
          setDrivers([
            { id: 'D001', name: 'Rajesh Kumar', vehicle: 'Maruti Swift', plate: 'KA 01 AB 1234', lat: 12.9716, lng: 77.5946, status: 'online', rating: 4.8 },
            { id: 'D002', name: 'Ahmed Khan', vehicle: 'Hyundai i20', plate: 'KA 05 CD 5678', lat: 12.9750, lng: 77.6000, status: 'busy', rating: 4.6 },
            { id: 'D003', name: 'Priya Sharma', vehicle: 'Honda City', plate: 'KA 09 EF 9012', lat: 12.9680, lng: 77.5880, status: 'online', rating: 4.9 },
            { id: 'D004', name: 'Vikram Singh', vehicle: 'Toyota Innova', plate: 'KA 03 GH 3456', lat: 12.9800, lng: 77.6100, status: 'offline', rating: 4.5 },
          ]);
        }

        if (ridesRes.ok) {
          const ridesData = await ridesRes.json();
          setRides(ridesData.data || ridesData);
        } else {
          // Fallback mock data
          setRides([
            { id: 'R001', pickup: 'MG Road', drop: 'Koramangala', driver: 'Rajesh Kumar', status: 'in_progress', eta: '5 min' },
            { id: 'R002', pickup: 'Indiranagar', drop: 'Whitefield', driver: 'Ahmed Khan', status: 'accepted', eta: '8 min' },
            { id: 'R003', pickup: 'HSR Layout', drop: 'Electronic City', driver: 'Priya Sharma', status: 'in_progress', eta: '12 min' },
          ]);
        }

        if (alertsRes.ok) {
          const alertsData = await alertsRes.json();
          setAlerts(alertsData.data || alertsData);
        } else {
          // Fallback mock data
          setAlerts([
            { type: 'warning', message: 'High demand detected in Koramangala area', time: '2 min ago' },
            { type: 'info', message: 'New driver onboarded: Sneha Reddy', time: '15 min ago' },
            { type: 'success', message: 'All systems operational', time: '30 min ago' },
          ]);
        }
      } catch (err) {
        console.error('Failed to fetch operations data:', err);
        // Set fallback mock data on error
        setDrivers([
          { id: 'D001', name: 'Rajesh Kumar', vehicle: 'Maruti Swift', plate: 'KA 01 AB 1234', lat: 12.9716, lng: 77.5946, status: 'online', rating: 4.8 },
          { id: 'D002', name: 'Ahmed Khan', vehicle: 'Hyundai i20', plate: 'KA 05 CD 5678', lat: 12.9750, lng: 77.6000, status: 'busy', rating: 4.6 },
          { id: 'D003', name: 'Priya Sharma', vehicle: 'Honda City', plate: 'KA 09 EF 9012', lat: 12.9680, lng: 77.5880, status: 'online', rating: 4.9 },
          { id: 'D004', name: 'Vikram Singh', vehicle: 'Toyota Innova', plate: 'KA 03 GH 3456', lat: 12.9800, lng: 77.6100, status: 'offline', rating: 4.5 },
        ]);
        setRides([
          { id: 'R001', pickup: 'MG Road', drop: 'Koramangala', driver: 'Rajesh Kumar', status: 'in_progress', eta: '5 min' },
          { id: 'R002', pickup: 'Indiranagar', drop: 'Whitefield', driver: 'Ahmed Khan', status: 'accepted', eta: '8 min' },
          { id: 'R003', pickup: 'HSR Layout', drop: 'Electronic City', driver: 'Priya Sharma', status: 'in_progress', eta: '12 min' },
        ]);
        setAlerts([
          { type: 'warning', message: 'High demand detected in Koramangala area', time: '2 min ago' },
          { type: 'info', message: 'New driver onboarded: Sneha Reddy', time: '15 min ago' },
          { type: 'success', message: 'All systems operational', time: '30 min ago' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchOperationsData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchOperationsData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Operations Center</h1>
              <p className="text-sm text-gray-500">Real-time monitoring and control</p>
            </div>
            <div className="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-green-700">Live</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-6">
            {[
              { id: 'map', label: 'Driver Map', icon: MapPin },
              { id: 'rides', label: 'Active Rides', icon: Navigation },
              { id: 'alerts', label: 'Alerts', icon: AlertCircle },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'map' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Placeholder */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 h-96">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Driver Locations</h2>
              <div className="h-80 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Live Map View</p>
                  <p className="text-sm text-gray-400 mt-2">{drivers.length} drivers on map</p>
                </div>
              </div>
            </div>

            {/* Driver List */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Nearby Drivers</h2>
              <div className="space-y-4">
                {drivers.map((driver) => (
                  <div key={driver.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                        {driver.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{driver.name}</p>
                        <p className="text-sm text-gray-500">{driver.vehicle}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                        driver.status === 'online' ? 'bg-green-100 text-green-700' :
                        driver.status === 'busy' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {driver.status}
                      </span>
                      <p className="text-sm text-gray-500 mt-1">⭐ {driver.rating}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rides' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Active Rides</h2>
            </div>
            <div className="divide-y">
              {rides.map((ride) => (
                <div key={ride.id} className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      ride.status === 'in_progress' ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      <Navigation className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Ride #{ride.id}</p>
                      <p className="text-sm text-gray-500">{ride.pickup} → {ride.drop}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{ride.driver}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">ETA: {ride.eta}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-4">
            {alerts.map((alert, index) => (
              <div key={index} className={`bg-white rounded-xl shadow-sm p-6 flex items-center gap-4 border-l-4 ${
                alert.type === 'warning' ? 'border-yellow-500' :
                alert.type === 'success' ? 'border-green-500' :
                'border-blue-500'
              }`}>
                {alert.type === 'warning' ? (
                  <AlertCircle className="w-6 h-6 text-yellow-500" />
                ) : alert.type === 'success' ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-blue-500" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{alert.message}</p>
                  <p className="text-sm text-gray-500">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
