'use client';

import { useState } from 'react';

export default function WFHRequestPage() {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [formData, setFormData] = useState({
    address: '',
    reason: '',
    startDate: '',
    endDate: '',
    lat: 0,
    lng: 0,
  });
  const [submitted, setSubmitted] = useState(false);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(loc);
          setFormData({ ...formData, lat: loc.lat, lng: loc.lng });
        },
        (error) => alert('Could not get location: ' + error.message)
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Submit to HR for approval
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', padding: 24 }}>
        <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            background: 'white',
            padding: 48,
            borderRadius: 16,
          }}>
            <span style={{ fontSize: 64 }}>✅</span>
            <h2 style={{ marginTop: 16, fontSize: 24 }}>Request Submitted!</h2>
            <p style={{ color: '#6b7280', marginTop: 8 }}>
              HR will review your WFH request. You'll be notified once approved.
            </p>
            <div style={{
              marginTop: 24,
              padding: 16,
              background: '#f9fafb',
              borderRadius: 8,
              textAlign: 'left',
            }}>
              <p style={{ fontSize: 13, marginBottom: 8 }}>
                <strong>Location:</strong> {formData.address}
              </p>
              <p style={{ fontSize: 13, marginBottom: 8 }}>
                <strong>Dates:</strong> {formData.startDate} to {formData.endDate}
              </p>
              <p style={{ fontSize: 13 }}>
                <strong>Status:</strong> ⏳ Pending HR Approval
              </p>
            </div>
            <a href="/scan" style={{
              display: 'block',
              marginTop: 24,
              padding: 14,
              background: '#10b981',
              color: 'white',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 500,
            }}>
              ← Back to Attendance
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: 24 }}>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>🏠 Request Work From Home</h1>
        <p style={{ color: '#6b7280', marginBottom: 24 }}>
          Tell HR where you'll be working from. Once approved, this location will be your attendance location.
        </p>

        <form onSubmit={handleSubmit} style={{
          background: 'white',
          padding: 24,
          borderRadius: 12,
        }}>
          {/* Current Location */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: 8 }}>Your WFH Location</label>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={getCurrentLocation}
                style={{
                  padding: 12,
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                📍 Use Current Location
              </button>
              {currentLocation && (
                <div style={{
                  padding: 12,
                  background: '#dcfce7',
                  borderRadius: 8,
                  fontSize: 13,
                  color: '#15803d',
                }}>
                  ✓ {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                </div>
              )}
            </div>
          </div>

          {/* Address */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: 8 }}>Address</label>
            <input
              type="text"
              placeholder="Enter your WFH address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              style={{
                width: '100%',
                padding: 12,
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 14,
              }}
            />
          </div>

          {/* Reason */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: 8 }}>Reason</label>
            <select
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
              style={{
                width: '100%',
                padding: 12,
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                fontSize: 14,
              }}
            >
              <option value="">Select reason</option>
              <option value="personal">Personal</option>
              <option value="medical">Medical</option>
              <option value="family">Family emergency</option>
              <option value="weather">Weather/Transit</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 500, marginBottom: 8 }}>Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: 12,
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  fontSize: 14,
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 500, marginBottom: 8 }}>End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: 12,
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  fontSize: 14,
                }}
              />
            </div>
          </div>

          {/* Geofence */}
          <div style={{
            padding: 16,
            background: '#fef3c7',
            borderRadius: 8,
            marginBottom: 20,
          }}>
            <p style={{ fontSize: 13, color: '#92400e', margin: 0 }}>
              <strong>Note:</strong> Once approved, attendance will be tracked at this location.
              If you're outside this location, HR will be notified.
            </p>
          </div>

          <button
            type="submit"
            disabled={!currentLocation || !formData.address}
            style={{
              width: '100%',
              padding: 14,
              background: !currentLocation || !formData.address ? '#d1d5db' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontWeight: 500,
              cursor: !currentLocation || !formData.address ? 'not-allowed' : 'pointer',
            }}
          >
            Submit Request to HR
          </button>
        </form>

        <a href="/scan" style={{
          display: 'block',
          textAlign: 'center',
          marginTop: 16,
          color: '#6b7280',
          textDecoration: 'none',
        }}>
          ← Cancel
        </a>
      </div>
    </div>
  );
}
