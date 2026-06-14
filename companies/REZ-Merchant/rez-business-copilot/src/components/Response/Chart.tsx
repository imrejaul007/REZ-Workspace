'use client';

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ChartConfig, ChartType } from '@/types/copilot';
import { Maximize2, Download } from 'lucide-react';

interface ChartProps {
  config: ChartConfig;
  className?: string;
}

const COLORS = [
  '#0ea5e9', // blue
  '#a855f7', // purple
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#6366f1', // indigo
  '#ec4899', // pink
  '#14b8a6', // teal
];

export function Chart({ config, className = '' }: ChartProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);

  const colors = config.colors || COLORS;

  const renderChart = () => {
    switch (config.type) {
      case 'line':
        return (
          <LineChart
            data={config.data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={(value) =>
                value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [
                value.toLocaleString(),
                config.yAxisLabel || 'Value',
              ]}
            />
            {config.data[0]?.previous !== undefined && (
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke={colors[0]}
              strokeWidth={2}
              dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
            {config.data[0]?.previous !== undefined && (
              <Line
                type="monotone"
                dataKey="previous"
                stroke={colors[1] || colors[0]}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: colors[1] || colors[0], strokeWidth: 2, r: 4 }}
              />
            )}
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart
            data={config.data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={(value) =>
                value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [value.toLocaleString(), 'Value']}
            />
            {config.data[0]?.previous !== undefined && (
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            )}
            <Bar
              dataKey="value"
              fill={colors[0]}
              radius={[4, 4, 0, 0]}
              maxBarSize={50}
            />
            {config.data[0]?.previous !== undefined && (
              <Bar
                dataKey="previous"
                fill={colors[1] || colors[0]}
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              />
            )}
          </BarChart>
        );

      case 'pie':
      case 'donut':
        return (
          <PieChart>
            <Pie
              data={config.data}
              cx="50%"
              cy="50%"
              innerRadius={config.type === 'donut' ? 60 : 0}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              label={({ label, percent }) =>
                `${label}: ${(percent * 100).toFixed(0)}%`
              }
              labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
            >
              {config.data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [value.toLocaleString(), 'Value']}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              formatter={(value) => value}
            />
          </PieChart>
        );

      case 'area':
        return (
          <LineChart
            data={config.data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              tickFormatter={(value) =>
                value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [
                value.toLocaleString(),
                config.yAxisLabel || 'Value',
              ]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={colors[0]}
              strokeWidth={2}
              fill={colors[0]}
              fillOpacity={0.2}
            />
          </LineChart>
        );

      default:
        return null;
    }
  };

  const ChartContent = () => (
    <ResponsiveContainer width="100%" height={300}>
      {renderChart()}
    </ResponsiveContainer>
  );

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${
        isExpanded ? 'fixed inset-4 z-50' : ''
      } ${className}`}
    >
      {/* Header */}
      {(config.title || config.type) && (
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div>
            {config.title && (
              <h4 className="text-sm font-medium text-gray-900">{config.title}</h4>
            )}
            {config.type && !config.title && (
              <h4 className="text-sm font-medium text-gray-900 capitalize">
                {config.type} Chart
              </h4>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTooltip(!showTooltip)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title={showTooltip ? 'Hide values' : 'Show values'}
            >
              <span className="text-xs">{showTooltip ? 'Hide' : 'Show'}</span>
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title={isExpanded ? 'Minimize' : 'Expand'}
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="p-4">
        <ChartContent />
      </div>

      {/* Expanded overlay */}
      {isExpanded && (
        <div
          className="absolute inset-0 bg-black/20"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
}

interface ChartGridProps {
  charts: ChartConfig[];
  className?: string;
}

export function ChartGrid({ charts, className = '' }: ChartGridProps) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 ${className}`}>
      {charts.map((chart, index) => (
        <Chart key={index} config={chart} />
      ))}
    </div>
  );
}