'use client';

import clsx from 'clsx';

interface PipelineKanbanProps {
  stages: Array<{
    name: string;
    deals: number;
    value: number;
    color: string;
  }>;
}

export default function PipelineKanban({ stages }: PipelineKanbanProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Pipeline View</h2>
        <div className="flex gap-3">
          <select className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm">
            <option>All Pipelines</option>
          </select>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            Add Deal
          </button>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div
            key={stage.name}
            className="flex-shrink-0 w-80 bg-gray-100 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <h3 className="font-medium">{stage.name}</h3>
              </div>
              <span className="text-sm text-gray-500">{stage.deals} deals</span>
            </div>
            <div className="text-sm text-gray-500 mb-4">
              ${(stage.value / 1000).toFixed(0)}K
            </div>
            <div className="space-y-3">
              {stage.deals > 0 && (
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium text-sm">Sample Deal</p>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      Hot
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">Sample Company</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold">$25K</span>
                    <span className="text-xs text-gray-400">85%</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
