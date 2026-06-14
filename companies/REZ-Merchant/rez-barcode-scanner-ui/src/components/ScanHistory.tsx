import React, { useState, useCallback } from 'react';
import { Scan, Product } from '../types';
import { formatBarcodeDisplay, formatDisplayNames } from '../utils/formats';

export interface ScanHistoryProps {
  scans: Scan[];
  onRescan: (barcode: string) => void;
  onDelete?: (scanId: string) => void;
  onClear?: () => void;
  maxDisplay?: number;
  showProductInfo?: boolean;
  showTimestamp?: boolean;
  groupByDate?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

interface GroupedScans {
  date: string;
  scans: Scan[];
}

const ScanHistory: React.FC<ScanHistoryProps> = ({
  scans,
  onRescan,
  onDelete,
  onClear,
  maxDisplay = 50,
  showProductInfo = true,
  showTimestamp = true,
  groupByDate = false,
  className = '',
  style,
}) => {
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter scans
  const filteredScans = scans
    .filter((scan) => {
      if (filter === 'success' && !scan.success) return false;
      if (filter === 'failed' && scan.success) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          scan.barcode.toLowerCase().includes(query) ||
          scan.product?.name.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .slice(0, maxDisplay);

  // Group scans by date if enabled
  const groupedScans: GroupedScans[] = React.useMemo(() => {
    if (!groupByDate) return [];

    const groups = new Map<string, Scan[]>();
    filteredScans.forEach((scan) => {
      const date = scan.timestamp.toLocaleDateString();
      if (!groups.has(date)) {
        groups.set(date, []);
      }
      groups.get(date)!.push(scan);
    });

    return Array.from(groups.entries()).map(([date, scans]) => ({
      date,
      scans,
    }));
  }, [filteredScans, groupByDate]);

  const handleDelete = useCallback(
    (scanId: string) => {
      onDelete?.(scanId);
    },
    [onDelete]
  );

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderScanItem = (scan: Scan) => (
    <div
      key={scan.id}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        backgroundColor: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: '10px',
        marginBottom: '8px',
      }}
    >
      {/* Status indicator */}
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: scan.success ? '#4CAF50' : '#f44336',
          flexShrink: 0,
        }}
      />

      {/* Scan info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: '0 0 2px',
            fontSize: '15px',
            fontWeight: 600,
            color: '#212121',
            fontFamily: 'monospace',
          }}
        >
          {formatBarcodeDisplay(scan.barcode)}
        </p>
        {showProductInfo && scan.product && (
          <p
            style={{
              margin: '0 0 2px',
              fontSize: '13px',
              color: '#616161',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {scan.product.name}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 6px',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              color: '#757575',
            }}
          >
            {formatDisplayNames[scan.format]}
          </span>
          {showTimestamp && (
            <span
              style={{
                fontSize: '11px',
                color: '#9e9e9e',
              }}
            >
              {getRelativeTime(scan.timestamp)}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {/* Rescan button */}
        <button
          onClick={() => onRescan(scan.barcode)}
          style={{
            width: '36px',
            height: '36px',
            border: 'none',
            backgroundColor: '#e8f5e9',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Rescan"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#4CAF50"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>

        {/* Delete button */}
        {onDelete && (
          <button
            onClick={() => handleDelete(scan.id)}
            style={{
              width: '36px',
              height: '36px',
              border: 'none',
              backgroundColor: '#ffebee',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Remove"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#f44336"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className={`scan-history ${className}`} style={style}>
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <h3
          style={{
            margin: '0 0 12px',
            fontSize: '18px',
            fontWeight: 600,
            color: '#212121',
          }}
        >
          Scan History
          <span
            style={{
              marginLeft: '8px',
              fontSize: '14px',
              fontWeight: 400,
              color: '#9e9e9e',
            }}
          >
            ({filteredScans.length})
          </span>
        </h3>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#9e9e9e"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search barcodes or products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['all', 'success', 'failed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 12px',
                border: 'none',
                backgroundColor: filter === f ? '#4CAF50' : '#f5f5f5',
                color: filter === f ? '#fff' : '#616161',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {f}
            </button>
          ))}

          {/* Clear all button */}
          {onClear && filteredScans.length > 0 && (
            <button
              onClick={onClear}
              style={{
                marginLeft: 'auto',
                padding: '6px 12px',
                border: '1px solid #e0e0e0',
                backgroundColor: '#fff',
                color: '#616161',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Scan list */}
      {filteredScans.length === 0 ? (
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            backgroundColor: '#fafafa',
            borderRadius: '12px',
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#bdbdbd"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginBottom: '12px' }}
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
          <p style={{ margin: 0, fontSize: '14px', color: '#9e9e9e' }}>
            {searchQuery ? 'No matching scans found' : 'No scan history yet'}
          </p>
        </div>
      ) : groupByDate ? (
        /* Grouped by date */
        <div>
          {groupedScans.map((group) => (
            <div key={group.date} style={{ marginBottom: '16px' }}>
              <h4
                style={{
                  margin: '0 0 8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#757575',
                  textTransform: 'uppercase',
                }}
              >
                {group.date}
              </h4>
              {group.scans.map(renderScanItem)}
            </div>
          ))}
        </div>
      ) : (
        /* Flat list */
        filteredScans.map(renderScanItem)
      )}

      {/* Load more indicator */}
      {scans.length > maxDisplay && filteredScans.length < scans.length && (
        <p
          style={{
            marginTop: '12px',
            textAlign: 'center',
            fontSize: '13px',
            color: '#9e9e9e',
          }}
        >
          Showing {filteredScans.length} of {scans.length} scans
        </p>
      )}
    </div>
  );
};

export default ScanHistory;
