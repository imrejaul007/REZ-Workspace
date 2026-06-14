'use client';

import { useState, useEffect } from 'react';

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string;
  location: string;
  type: 'office' | 'wfh';
  status: 'present' | 'outside';
}

interface Location {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  radius: number;
  type: 'office' | 'wfh';
}

export default function ScanPage() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'notifications'>('attendance');
  const [notifications, setNotifications] = useState<string[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);

  // Mock: Employee has office location AND approved WFH location
  const assignedLocations: Location[] = [
    { id: '1', name: 'Main Office', address: '123 Tech Park, Bangalore', lat: 12.9716, lng: 77.5946, radius: 100, type: 'office' },
    { id: '2', name: 'Home (WFH)', address: '456 MG Road, Bangalore', lat: 12.9350, lng: 77.6200, radius: 100, type: 'wfh' },
  ];

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationError(null);
      },
      (error) => setLocationError(error.message)
    );
  };

  const markAttendance = (location: Location) => {
    if (!currentLocation) {
      alert('Please enable location');
      return;
    }

    const distance = calculateDistance(currentLocation.lat, currentLocation.lng, location.lat, location.lng);
    const isWithin = distance <= location.radius;

    if (isWithin) {
      setTodayAttendance({
        id: '1',
        date: new Date().toLocaleDateString(),
        checkIn: new Date().toLocaleTimeString(),
        location: location.name,
        type: location.type,
        status: 'present',
      });
      setNotifications(prev => [`✅ Checked in at ${location.name}`, ...prev]);
    } else {
      // NOTIFY BOTH EMPLOYEE AND HR
      const alertMsg = `⚠️ You are ${Math.round(distance)}m away from ${location.name}. HR has been notified.`;
      setNotifications(prev => [alertMsg, ...prev]);

      // In production: API call to notify HR
      logger.info('NOTIFY HR: Employee outside location');
    }
  };

  // Check if employee left assigned location
  useEffect(() => {
    if (currentLocation && todayAttendance) {
      const assigned = assignedLocations.find(l => l.name === todayAttendance.location);
      if (assigned) {
        const distance = calculateDistance(currentLocation.lat, currentLocation.lng, assigned.lat, assigned.lng);
        if (distance > assigned.radius) {
          const alertMsg = `🚨 LEFT ${assigned.name}! You are ${Math.round(distance)}m outside. HR has been notified.`;
          setNotifications(prev => {
            if (!prev.includes(alertMsg)) {
              return [alertMsg, ...prev];
            }
            return prev;
          });
          // API call to notify HR
          logger.info('NOTIFY HR: Employee left assigned location');
        }
      }
    }
  }, [currentLocation, todayAttendance]);

  useEffect(() => {
    getLocation();
  }, []);

  const getStatusForLocation = (loc: Location) => {
    if (!currentLocation) return 'unknown';
    const distance = calculateDistance(currentLocation.lat, currentLocation.lng, loc.lat, loc.lng);
    return distance <= loc.radius ? 'within' : 'outside';
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div style={{ background: 'white', padding: '20px 24px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>🧠 PeopleOS</h1>
            <p style={{ color: '#6b7280', margin: 0, fontSize: 14 }}>Geo-Attendance</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 12, height: 12, borderRadius: '50%',
              background: currentLocation ? '#10b981' : '#9ca3af'
            }} />
            <span style={{ fontSize: 13, color: '#6b7280' }}>
              {currentLocation ? 'GPS Active' : 'Getting location...'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: 'white', padding: '0 24px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', gap: 24 }}>
          {(['attendance', 'notifications'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '16px 0',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid #10b981' : '2px solid transparent',
                color: activeTab === tab ? '#10b981' : '#6b7280',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {tab === 'attendance' ? '📍 Attendance' : `🔔 Notifications (${notifications.length})`}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 24 }}>
        {activeTab === 'attendance' && (
          <>
            {/* Current Status */}
            <div style={{
              padding: 20,
              background: currentLocation ? '#dcfce7' : '#fef3c7',
              borderRadius: 12,
              marginBottom: 24,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 32 }}>{currentLocation ? '📍' : '⏳'}</span>
                <div>
                  <p style={{ fontWeight: 600, margin: 0, color: currentLocation ? '#15803d' : '#b45309' }}>
                    {currentLocation ? 'Location detected' : 'Detecting location...'}
                  </p>
                  {currentLocation && (
                    <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>
                      {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Today's Attendance */}
            {todayAttendance && (
              <div style={{ background: 'white', borderRadius: 12, padding: 20, marginBottom: 24 }}>
                <h3 style={{ fontSize: 14, color: '#6b7280', marginBottom: 12 }}>TODAY'S ATTENDANCE</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: '#dcfce7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {todayAttendance.type === 'wfh' ? '🏠' : '🏢'}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, margin: 0 }}>{todayAttendance.location}</p>
                    <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
                      Checked in at {todayAttendance.checkIn}
                    </p>
                  </div>
                  <div style={{ marginLeft: 'auto' }}>
                    <span style={{
                      padding: '6px 12px',
                      background: '#dcfce7',
                      color: '#15803d',
                      borderRadius: 20,
                      fontSize: 13,
                      fontWeight: 500,
                    }}>
                      ✅ Present
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Assigned Locations */}
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Your Assigned Locations</h3>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
              You can mark attendance at any of these locations
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {assignedLocations.map(loc => {
                const status = getStatusForLocation(loc);
                return (
                  <div
                    key={loc.id}
                    style={{
                      background: 'white',
                      borderRadius: 12,
                      padding: 20,
                      border: `2px solid ${status === 'within' ? '#10b981' : status === 'outside' ? '#ef4444' : '#e5e7eb'}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: loc.type === 'wfh' ? '#f0fdf4' : '#eff6ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                      }}>
                        {loc.type === 'wfh' ? '🏠' : '🏢'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 600 }}>{loc.name}</span>
                          <span style={{
                            padding: '2px 8px',
                            background: loc.type === 'wfh' ? '#dcfce7' : '#dbeafe',
                            color: loc.type === 'wfh' ? '#15803d' : '#1d4ed8',
                            borderRadius: 10,
                            fontSize: 11,
                          }}>
                            {loc.type === 'wfh' ? 'WFH' : 'Office'}
                          </span>
                        </div>
                        <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>{loc.address}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          display: 'block',
                          padding: '4px 12px',
                          background: status === 'within' ? '#dcfce7' : status === 'outside' ? '#fef2f2' : '#f3f4f6',
                          color: status === 'within' ? '#15803d' : status === 'outside' ? '#dc2626' : '#6b7280',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 500,
                        }}>
                          {status === 'within' ? '✅ You\'re here' : status === 'outside' ? '📍 Outside' : '⏳ Detecting...'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => markAttendance(loc)}
                      disabled={!currentLocation || todayAttendance?.location === loc.name}
                      style={{
                        width: '100%',
                        padding: 12,
                        background: !currentLocation ? '#d1d5db' : todayAttendance?.location === loc.name ? '#d1d5db' : '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        fontWeight: 500,
                        cursor: !currentLocation || todayAttendance?.location === loc.name ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {todayAttendance?.location === loc.name ? '✓ Already Checked In' : !currentLocation ? 'Enable Location First' : `📍 Mark Attendance at ${loc.name}`}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Info */}
            <div style={{
              marginTop: 24,
              background: '#eff6ff',
              padding: 16,
              borderRadius: 12,
              borderLeft: '4px solid #3b82f6',
            }}>
              <p style={{ fontSize: 13, color: '#1e40af', margin: 0 }}>
                <strong>How it works:</strong> Mark attendance at any assigned location. If you leave the location after checking in, both you and HR will be notified.
              </p>
            </div>
          </>
        )}

        {activeTab === 'notifications' && (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Your Notifications</h3>
            {notifications.length === 0 ? (
              <div style={{ background: 'white', padding: 40, borderRadius: 12, textAlign: 'center' }}>
                <span style={{ fontSize: 48 }}>🔔</span>
                <p style={{ color: '#6b7280', marginTop: 12 }}>No notifications</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {notifications.map((notif, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'white',
                      padding: 16,
                      borderRadius: 12,
                      borderLeft: notif.includes('✅') ? '4px solid #10b981' : '4px solid #ef4444',
                    }}
                  >
                    <p style={{ fontWeight: notif.includes('✅') ? 500 : 600, margin: 0, color: notif.includes('✅') ? '#15803d' : '#dc2626' }}>
                      {notif}
                    </p>
                    <p style={{ fontSize: 12, color: '#9ca3af', margin: '4px 0 0' }}>
                      {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
