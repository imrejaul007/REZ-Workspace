'use client';

import clsx from 'clsx';
import { format } from 'date-fns';

interface DealListProps {
  deals: Array<{
    id: string;
    name: string;
    company: string;
    value: number;
    stage: string;
    score: number;
    priority: string;
    closeDate: string;
    nextAction?: string;
  }>;
}

export default function DealList({ deals }: DealListProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">All Deals</h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search deals..."
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option>All Stages</option>
              <option>Qualification</option>
              <option>Discovery</option>
              <option>Proposal</option>
              <option>Negotiation</option>
            </select>
          </div>
        </div>
      </div>

      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deal</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Close Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {deals.map((deal) => (
            <tr key={deal.id} className="hover:bg-gray-50 cursor-pointer">
              <td className="px-6 py-4">
                <p className="font-medium text-gray-900">{deal.name}</p>
                {deal.nextAction && (
                  <p className="text-xs text-gray-500 mt-1">{deal.nextAction}</p>
                )}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">{deal.company}</td>
              <td className="px-6 py-4 font-medium text-gray-900">${deal.value.toLocaleString()}</td>
              <td className="px-6 py-4">
                <span className={clsx(
                  'px-2 py-1 text-xs rounded-full',
                  deal.stage === 'Closed Won' ? 'bg-green-100 text-green-700' :
                  deal.stage === 'Negotiation' ? 'bg-purple-100 text-purple-700' :
                  deal.stage === 'Proposal' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                )}>
                  {deal.stage}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={clsx(
                        'h-full rounded-full',
                        deal.score >= 70 ? 'bg-green-500' :
                        deal.score >= 40 ? 'bg-amber-500' : 'bg-red-500'
                      )}
                      style={{ width: `${deal.score}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">{deal.score}%</span>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {format(new Date(deal.closeDate), 'MMM d, yyyy')}
              </td>
              <td className="px-6 py-4">
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
