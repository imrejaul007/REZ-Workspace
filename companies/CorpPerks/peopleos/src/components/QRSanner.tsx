'use client';

import { useState, useEffect, useRef } from 'react';

interface QRScanResult {
  type: string;
  employeeId?: string;
  locationId?: string;
  lat?: number;
  lng?: number;
  name?: string;
}

interface QRScannerProps {
  onScan: (result: QRScanResult) => void;
  onError?: (error: string) => void;
}

export default function QRScanner({ onScan, onError }: QRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    checkCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const checkCamera = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(d => d.kind === 'videoinput');
      setHasCamera(cameras.length > 0);
    } catch (err) {
      logger.warn('[QRScanner] Camera check failed:', err instanceof Error ? err.message : err);
      setHasCamera(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setScanning(true);
      setError(null);
      // Start scanning loop
      requestAnimationFrame(scanQRCode);
    } catch (err: any) {
      const message = err?.message || 'Unknown camera error';
      logger.error('[QRScanner] Camera access failed:', message);
      setError('Camera access denied. Please allow camera permission.');
      onError?.('Camera access denied');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const scanQRCode = async () => {
    if (!scanning || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(scanQRCode);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Use jsQR library if available, otherwise use a simple fallback
    // For production, add: import jsQR from 'jsqr';

    // Simulate QR detection for demo (in production, use jsQR library)
    // The actual QR scanning would look like:
    // const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    // const code = jsQR(imageData.data, canvas.width, canvas.height);
    // if (code) { handleDetection(code.data); }

    if (scanning) {
      requestAnimationFrame(scanQRCode);
    }
  };

  const handleDetection = (data: string) => {
    try {
      const decoded = atob(data);
      const qrData = JSON.parse(decoded);

      if (qrData.type === 'PEOPLEOS_ATTENDANCE') {
        onScan({
          type: 'employee',
          employeeId: qrData.employeeId,
          name: qrData.name,
        });
      } else if (qrData.type === 'PEOPLEOS_LOCATION') {
        onScan({
          type: 'location',
          locationId: qrData.locationId,
          name: qrData.name,
          lat: qrData.lat,
          lng: qrData.lng,
        });
      } else {
        onScan({
          type: 'unknown',
        });
      }
      stopCamera();
    } catch (err) {
      logger.error('[QRScanner] Invalid QR data:', err instanceof Error ? err.message : err);
      onError?.('Invalid QR code');
    }
  };

  return (
    <div className="qr-scanner">
      {scanning ? (
        <div className="scanner-active">
          <video
            ref={videoRef}
            style={{
              width: '100%',
              height: '300px',
              objectFit: 'cover',
              borderRadius: '12px',
            }}
            playsInline
            muted
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Scanning overlay */}
          <div className="scanner-overlay">
            <div className="scanner-frame" />
          </div>

          <button
            onClick={stopCamera}
            style={{
              marginTop: '16px',
              padding: '12px 24px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Stop Scanning
          </button>
        </div>
      ) : (
        <div className="scanner-inactive">
          {error ? (
            <div className="error-state">
              <span style={{ fontSize: '48px' }}>📷</span>
              <p style={{ color: '#ef4444' }}>{error}</p>
              <button onClick={startCamera} style={{
                padding: '12px 24px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}>
                Try Again
              </button>
            </div>
          ) : hasCamera ? (
            <div className="ready-state">
              <span style={{ fontSize: '48px' }}>📱</span>
              <p>Camera ready to scan</p>
              <button onClick={startCamera} style={{
                padding: '12px 24px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}>
                Start QR Scanner
              </button>
            </div>
          ) : (
            <div className="no-camera">
              <span style={{ fontSize: '48px' }}>❌</span>
              <p>No camera found</p>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>
                Please use a device with a camera
              </p>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .qr-scanner {
          text-align: center;
        }
        .scanner-active {
          position: relative;
        }
        .scanner-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
        .scanner-frame {
          width: 200px;
          height: 200px;
          border: 2px solid #10b981;
          border-radius: 12px;
          box-shadow: 0 0 0 9999px rgba(0,0,0,0.5);
        }
      `}</style>
    </div>
  );
}
