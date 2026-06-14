'use client';

import React from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow';

interface ConditionalEdgeData {
  label?: string;
  condition?: string;
}

const ConditionalEdge: React.FC<EdgeProps<ConditionalEdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const label = data?.label || data?.condition || 'Yes';

  return (
    <>
      {/* Background path for better click area */}
      <path
        id={`${id}-bg`}
        className="react-flow__edge-path hover:stroke-indigo-400 transition-colors"
        d={edgePath}
        strokeWidth={selected ? 4 : 8}
        stroke="transparent"
        fill="none"
      />

      {/* Main edge path */}
      <path
        id={id}
        className={`react-flow__edge-path transition-colors ${
          selected ? 'stroke-indigo-400' : 'stroke-indigo-500'
        }`}
        d={edgePath}
        strokeWidth={selected ? 3 : 2}
        fill="none"
        markerEnd="url(#arrowclosed)"
      />

      {/* Animated dots for selected edges */}
      {selected && (
        <path
          className="stroke-indigo-300"
          d={edgePath}
          strokeWidth={3}
          fill="none"
          strokeDasharray="5,5"
          style={{
            animation: 'dash 0.5s linear infinite',
          }}
        />
      )}

      {/* Label */}
      {label && (
        <EdgeLabelRenderer>
          <div
            className="absolute pointer-events-all"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            <div
              className={`
                px-2 py-1 rounded-full text-xs font-medium
                ${selected ? 'bg-indigo-500 text-white' : 'bg-gray-700 text-gray-200'}
                border border-gray-600
              `}
            >
              {label}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}

      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -10;
          }
        }
      `}</style>
    </>
  );
};

export default ConditionalEdge;