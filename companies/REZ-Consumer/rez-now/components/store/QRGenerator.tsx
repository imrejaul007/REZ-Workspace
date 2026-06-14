'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { logger } from '@/lib/utils/logger';
import { useTrack } from '@/lib/analytics/events';
import StoreImage from '@/components/ui/StoreImage';
import QRCode from 'qrcode';

// ── Types ──────────────────────────────────────────────────────────────────────

interface QRGeneratorProps {
  storeSlug: string;
  storeLogo?: string | null;
  storeName: string;
  baseUrl?: string;
  defaultFormat?: 'png' | 'svg' | 'pdf';
  defaultSize?: number;
  accentColor?: string;
  className?: string;
}

type DownloadFormat = 'png' | 'svg' | 'pdf';
type QRColorType = 'default' | 'custom';

interface QRConfig {
  size: number;
  format: DownloadFormat;
  colorType: QRColorType;
  foregroundColor: string;
  backgroundColor: string;
  includeLogo: boolean;
  logoUrl?: string;
  margin: number;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
}

// ── QR Code generation using proper QR library ─────────────────────────────────

interface QRMatrixResult {
  matrix: boolean[][];
  version: number;
}

/**
 * Generate QR matrix using proper QR encoding library
 * Returns the matrix data for rendering
 */
async function generateQRMatrix(data: string, size: number): Promise<QRMatrixResult> {
  // Use qrcode library for proper QR encoding
  // The library handles version selection, error correction, encoding modes, etc.
  const canvas = document.createElement('canvas');

  await QRCode.toCanvas(canvas, data, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: size,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  const imageData = ctx.getImageData(0, 0, size, size);
  const matrix: boolean[][] = [];

  // Determine cell size by checking a portion of the QR code
  // QR codes have finder patterns that are 7 modules wide
  // We scan for the first black pixel to determine cell boundaries
  let cellSize = 1;
  const margin = 0;

  // Simple approach: determine cell size based on canvas size
  // QR codes are typically rendered at appropriate resolution
  // We'll use the raw pixel data with cellSize = 1 for maximum compatibility
  for (let y = 0; y < size; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      // Check if pixel is dark (black)
      const isDark = imageData.data[idx] < 128;
      row.push(isDark);
    }
    matrix.push(row);
  }

  // Estimate version based on size (approximate)
  // Version 1 = 21 modules, Version 2 = 25 modules, etc.
  const nonMarginModules = size - margin * 2;
  const version = Math.max(1, Math.min(40, Math.floor((nonMarginModules - 21) / 4) + 1));

  return { matrix, version };
}

/**
 * Generate QR code as SVG string using the qrcode library
 */
async function generateQRSVG(data: string, options: {
  size: number;
  foregroundColor: string;
  backgroundColor: string;
  margin: number;
}): Promise<string> {
  return await QRCode.toString(data, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: Math.floor(options.margin / (options.size / 25)),
    width: options.size,
    color: {
      dark: options.foregroundColor,
      light: options.backgroundColor
    }
  });
}

/**
 * Generate QR code as PNG Data URL using the qrcode library
 */
async function generateQRDataURL(data: string, options: {
  size: number;
  foregroundColor: string;
  backgroundColor: string;
  margin: number;
}): Promise<string> {
  return await QRCode.toDataURL(data, {
    errorCorrectionLevel: 'H',
    margin: Math.floor(options.margin / (options.size / 25)),
    width: options.size,
    color: {
      dark: options.foregroundColor,
      light: options.backgroundColor
    }
  });
}

// ── QR Canvas Component ────────────────────────────────────────────────────────

interface QRCanvasProps {
  data: string;
  size: number;
  foregroundColor: string;
  backgroundColor: string;
  includeLogo: boolean;
  logoUrl?: string;
  margin: number;
}

function QRCanvas({
  data,
  size,
  foregroundColor,
  backgroundColor,
  includeLogo,
  logoUrl,
  margin,
}: QRCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const generateQR = async () => {
      try {
        const dataUrl = await generateQRDataURL(data, {
          size,
          foregroundColor,
          backgroundColor,
          margin
        });
        if (mounted) {
          setQrDataUrl(dataUrl);
          setLoaded(true);
        }
      } catch (error) {
        logger.error('Failed to generate QR code:', { error });
      }
    };

    generateQR();

    return () => {
      mounted = false;
    };
  }, [data, size, foregroundColor, backgroundColor, margin]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {qrDataUrl ? (
        <img
          src={qrDataUrl}
          alt="QR Code"
          width={size}
          height={size}
          className="rounded-lg"
        />
      ) : (
        <div
          className="rounded-lg bg-gray-100 animate-pulse"
          style={{ width: size, height: size }}
        />
      )}
      {includeLogo && logoUrl && loaded && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-md overflow-hidden border-2 border-white shadow-md bg-white"
          style={{ width: size * 0.2, height: size * 0.2 }}
        >
          <StoreImage
            src={logoUrl}
            alt="Logo"
            fill
            className="object-contain p-0.5"
          />
        </div>
      )}
    </div>
  );
}

// ── Icons ────────────────────────────────────────────────────────────────────────

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={cn('w-5 h-5', className)} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={cn('w-5 h-5', className)} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={cn('w-5 h-5', className)} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function QRGenerator({
  storeSlug,
  storeLogo,
  storeName,
  baseUrl = 'https://rez.money',
  defaultFormat = 'png',
  defaultSize = 256,
  accentColor = '#4F46E5',
  className,
}: QRGeneratorProps) {
  const track = useTrack();
  const [config, setConfig] = useState<QRConfig>({
    size: defaultSize,
    format: defaultFormat,
    colorType: 'default',
    foregroundColor: accentColor,
    backgroundColor: '#FFFFFF',
    includeLogo: true,
    logoUrl: storeLogo || undefined,
    margin: 8,
    errorCorrectionLevel: 'H',
  });
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const qrUrl = `${baseUrl}/${storeSlug}`;

  const handleDownload = useCallback(async (format: DownloadFormat) => {
    setDownloading(true);
    track({
      event: 'qr_downloaded',
      storeSlug,
      properties: { format },
    });

    try {
      if (format === 'png') {
        // Generate PNG using qrcode library
        const dataUrl = await generateQRDataURL(qrUrl, {
          size: config.size,
          foregroundColor: config.foregroundColor,
          backgroundColor: config.backgroundColor,
          margin: config.margin
        });

        // Add logo overlay if enabled
        if (config.includeLogo && config.logoUrl) {
          const canvas = document.createElement('canvas');
          const img = new Image();
          const logoSize = config.size * 0.2;
          const logoX = (config.size - logoSize) / 2;
          const logoY = (config.size - logoSize) / 2;

          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
            img.crossOrigin = 'anonymous';
            img.src = config.logoUrl!;
          });

          canvas.width = config.size;
          canvas.height = config.size;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Could not get canvas context');

          // Draw base QR
          const qrImg = new Image();
          await new Promise<void>((resolve, reject) => {
            qrImg.onload = () => resolve();
            qrImg.onerror = reject;
            qrImg.src = dataUrl;
          });
          ctx.drawImage(qrImg, 0, 0);

          // White background for logo
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(logoX - 4, logoY - 4, logoSize + 8, logoSize + 8);

          // Draw logo
          ctx.drawImage(img, logoX, logoY, logoSize, logoSize);

          const finalDataUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = `${storeSlug}-qr.png`;
          link.href = finalDataUrl;
          link.click();
        } else {
          const link = document.createElement('a');
          link.download = `${storeSlug}-qr.png`;
          link.href = dataUrl;
          link.click();
        }
      } else if (format === 'svg') {
        // Generate SVG using qrcode library
        const svg = await generateQRSVG(qrUrl, {
          size: config.size,
          foregroundColor: config.foregroundColor,
          backgroundColor: config.backgroundColor,
          margin: config.margin
        });
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${storeSlug}-qr.svg`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      } else if (format === 'pdf') {
        // For PDF, download as PNG (qrcode library doesn't support PDF directly)
        const dataUrl = await generateQRDataURL(qrUrl, {
          size: config.size,
          foregroundColor: config.foregroundColor,
          backgroundColor: config.backgroundColor,
          margin: config.margin
        });
        const link = document.createElement('a');
        link.download = `${storeSlug}-qr.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (error) {
      logger.error('Error generating QR:', { error });
    } finally {
      setDownloading(false);
    }
  }, [config, qrUrl, storeSlug, track]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      track({
        event: 'qr_link_copied',
        storeSlug,
        properties: {},
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      logger.error('Error copying link:', { error });
    }
  }, [qrUrl, storeSlug, track]);

  const handleShare = useCallback(async () => {
    track({
      event: 'qr_shared',
      storeSlug,
      properties: {},
    });

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${storeName} QR Code`,
          text: `Scan to visit ${storeName} on REZ`,
          url: qrUrl,
        });
      } catch (error) {
        // User cancelled or error
      }
    } else {
      handleCopyLink();
    }
  }, [qrUrl, storeName, storeSlug, track, handleCopyLink]);

  return (
    <div className={cn('bg-white rounded-xl border border-gray-200', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">QR Code</h3>
        <p className="text-xs text-gray-500 mt-0.5">{storeName}</p>
      </div>

      {/* QR Preview */}
      <div className="p-4 flex justify-center">
        <QRCanvas
          data={qrUrl}
          size={config.size}
          foregroundColor={config.foregroundColor}
          backgroundColor={config.backgroundColor}
          includeLogo={config.includeLogo}
          logoUrl={config.logoUrl}
          margin={config.margin}
        />
      </div>

      {/* Download Buttons */}
      <div className="px-4 pb-4 space-y-3">
        {/* Format selection */}
        <div className="flex gap-2">
          {(['png', 'svg', 'pdf'] as DownloadFormat[]).map((format) => (
            <button
              key={format}
              onClick={() => setConfig((c) => ({ ...c, format }))}
              className={cn(
                'flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors',
                config.format === format
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {format.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Download button */}
        <button
          onClick={() => handleDownload(config.format)}
          disabled={downloading}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: accentColor }}
        >
          <DownloadIcon className="w-4 h-4" />
          <span>{downloading ? 'Generating...' : `Download ${config.format.toUpperCase()}`}</span>
        </button>

        {/* Secondary actions */}
        <div className="flex gap-2">
          <button
            onClick={handleCopyLink}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            <CopyIcon className="w-4 h-4" />
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
          >
            <ShareIcon className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Options */}
      <div className="px-4 pb-4">
        <div className="pt-3 border-t border-gray-100 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.includeLogo}
              onChange={(e) => setConfig((c) => ({ ...c, includeLogo: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-600">Include store logo</span>
          </label>

          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600 whitespace-nowrap">Size:</label>
            <input
              type="range"
              min={128}
              max={512}
              step={64}
              value={config.size}
              onChange={(e) => setConfig((c) => ({ ...c, size: Number(e.target.value) }))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm text-gray-600 w-12 text-right">{config.size}px</span>
          </div>
        </div>
      </div>
    </div>
  );
}
