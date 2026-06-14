'use client';

import React, { useState, useMemo } from 'react';

interface DataPoint {
  date: string;
  value: number;
  lowerBound?: number;
  upperBound?: number;
}

interface PredictiveChartProps {
  title: string;
  data: DataPoint[];
  type?: 'line' | 'area' | 'bar';
  unit?: string;
  showConfidence?: boolean;
  height?: number;
  showLegend?: boolean;
  onPointClick?: (point: DataPoint) => void;
}

export default function PredictiveChart({
  title,
  data,
  type = 'area',
  unit = '',
  showConfidence = true,
  height = 220,
  showLegend = true,
  onPointClick,
}: PredictiveChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const maxValue = Math.max(...data.map(d => d.upperBound || d.value));
    const minValue = Math.min(...data.map(d => d.lowerBound || d.value));
    const padding = (maxValue - minValue) * 0.15;
    const yMin = Math.max(0, minValue - padding);
    const yMax = maxValue + padding;

    const getY = (value: number) => {
      return height - ((value - yMin) / (yMax - yMin)) * height;
    };

    const getX = (index: number) => {
      return (index / (data.length - 1)) * 100;
    };

    const pathData = data
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)},${getY(d.value)}`)
      .join(' ');

    const areaPath = `${pathData} L ${getX(data.length - 1)},${height} L 0,${height} Z`;

    const upperBoundPath = data
      .filter(d => d.upperBound !== undefined)
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)},${getY(d.upperBound!)}`)
      .join(' ');

    const lowerBoundPath = data
      .filter(d => d.lowerBound !== undefined)
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)},${getY(d.lowerBound!)}`)
      .join(' ');

    return {
      maxValue,
      minValue,
      yMin,
      yMax,
      getY,
      getX,
      pathData,
      areaPath,
      upperBoundPath,
      lowerBoundPath,
    };
  }, [data, height]);

  const formatValue = (value: number) => {
    if (unit === '%') return `${value.toFixed(1)}${unit}`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return `${value}${unit ? ' ' + unit : ''}`;
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <div className="text-center">
            <span className="text-4xl">📊</span>
            <p className="text-gray-400 mt-2">No data available</p>
          </div>
        </div>
      </div>
    );
  }

  if (!chartData) return null;

  const { getY, getX, pathData, areaPath, upperBoundPath, lowerBoundPath } = chartData;
  const lastPoint = data[data.length - 1];
  const firstPoint = data[0];
  const valueChange = lastPoint.value - firstPoint.value;
  const percentChange = firstPoint.value !== 0 ? ((valueChange / firstPoint.value) * 100).toFixed(1) : '0';

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">Predicted trends with confidence intervals</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Change indicator */}
          <div className={`text-right px-3 py-1 rounded-lg ${
            valueChange >= 0
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            <span className="text-xs font-medium">
              {valueChange >= 0 ? '↑' : '↓'} {Math.abs(Number(percentChange))}%
            </span>
          </div>
          {/* Zoom toggle */}
          <button
            onClick={() => setIsZoomed(!isZoomed)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title={isZoomed ? 'Zoom out' : 'Zoom in'}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isZoomed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Current Value */}
      <div className="px-5 py-3 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-xs text-gray-500">Current Value</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-indigo-700">
                {formatValue(lastPoint.value)}
              </span>
              {unit && <span className="text-sm text-gray-500">{unit}</span>}
            </div>
          </div>
          {data[0].lowerBound && data[0].upperBound && (
            <div className="h-8 w-px bg-gray-300" />
          )}
          {data[0].lowerBound && data[0].upperBound && (
            <div>
              <span className="text-xs text-gray-500">Confidence Range</span>
              <div className="text-sm font-medium text-gray-600">
                {formatValue(lastPoint.lowerBound || 0)} - {formatValue(lastPoint.upperBound || 0)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="relative px-4 pt-2" style={{ height: isZoomed ? height + 60 : height }}>
        <svg
          width="100%"
          height={isZoomed ? height + 60 : height}
          viewBox={`0 0 100 ${isZoomed ? height + 60 : height}`}
          preserveAspectRatio="none"
          className="overflow-visible"
        >
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines */}
          <g className="text-gray-100">
            {[0, 25, 50, 75, 100].map((pct) => (
              <line
                key={pct}
                x1="0"
                y1={`${pct}%`}
                x2="100"
                y2={`${pct}%`}
                stroke="currentColor"
                strokeWidth="0.5"
                strokeDasharray="2,2"
              />
            ))}
          </g>

          {/* Confidence interval */}
          {showConfidence && data[0].lowerBound && (
            <>
              <path
                d={`${upperBoundPath} ${lowerBoundPath.split(' ').reverse().join(' ')}`}
                fill="#e0e7ff"
                opacity="0.4"
              />
              <path
                d={upperBoundPath}
                fill="none"
                stroke="#c7d2fe"
                strokeWidth="0.5"
                strokeDasharray="3,3"
              />
              <path
                d={lowerBoundPath}
                fill="none"
                stroke="#c7d2fe"
                strokeWidth="0.5"
                strokeDasharray="3,3"
              />
            </>
          )}

          {/* Area fill */}
          {type === 'area' && (
            <path
              d={areaPath}
              fill="url(#areaGradient)"
            />
          )}

          {/* Main line */}
          <path
            d={pathData}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
            className="transition-all duration-300"
          />

          {/* Data points */}
          {data.map((point, i) => (
            <circle
              key={i}
              cx={getX(i)}
              cy={getY(point.value)}
              r={hoveredIndex === i ? 4 : 2.5}
              fill="#6366f1"
              stroke="white"
              strokeWidth="1.5"
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => onPointClick?.(point)}
            />
          ))}

          {/* Hover tooltip line */}
          {hoveredIndex !== null && (
            <line
              x1={getX(hoveredIndex)}
              y1="0"
              x2={getX(hoveredIndex)}
              y2={height}
              stroke="#6366f1"
              strokeWidth="1"
              strokeDasharray="4,4"
              opacity="0.5"
            />
          )}
        </svg>

        {/* Hover tooltip */}
        {hoveredIndex !== null && (
          <div
            className="absolute bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl text-sm pointer-events-none z-10 transform -translate-x-1/2"
            style={{
              left: `${getX(hoveredIndex)}%`,
              top: `${Math.max(10, getY(data[hoveredIndex].value) - 60)}px`,
            }}
          >
            <div className="font-semibold">{formatValue(data[hoveredIndex].value)}</div>
            <div className="text-xs text-gray-400">{data[hoveredIndex].date}</div>
            {data[hoveredIndex].lowerBound && data[hoveredIndex].upperBound && (
              <div className="text-xs text-gray-400 mt-1">
                Range: {formatValue(data[hoveredIndex].lowerBound!)} - {formatValue(data[hoveredIndex].upperBound!)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* X-axis labels */}
      <div className="px-4 pb-2 flex justify-between text-xs text-gray-400">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>

      {/* Legend */}
      {showLegend && showConfidence && data[0].lowerBound && (
        <div className="px-5 pb-4 pt-2 border-t border-gray-100 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded" />
            <span className="text-xs text-gray-500">Predicted Value</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 border-t-2 border-dashed border-indigo-300" />
            <span className="text-xs text-gray-500">Confidence Interval</span>
          </div>
        </div>
      )}
    </div>
  );
}
