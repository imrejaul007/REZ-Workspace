'use client';

import { ClientInvoice } from '@/types';
import { formatCurrency, formatDate, getStatusColor, cn } from '@/lib/utils';
import { FileText, Download, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface InvoiceCardProps {
  invoice: ClientInvoice;
  onDownload?: (invoice: ClientInvoice) => void;
}

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, color: 'text-amber-500' },
  paid: { label: 'Paid', icon: CheckCircle, color: 'text-green-500' },
  overdue: { label: 'Overdue', icon: AlertCircle, color: 'text-red-500' },
};

export default function InvoiceCard({ invoice, onDownload }: InvoiceCardProps) {
  const config = statusConfig[invoice.status];
  const StatusIcon = config.icon;
  const isOverdue = invoice.status === 'overdue';
  const daysUntilDue = Math.ceil(
    (new Date(invoice.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-card transition-all duration-300">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="text-xs font-medium text-slate-400">{invoice.invoiceNumber}</span>
            <h3 className="font-heading font-semibold text-slate-900 mt-1">
              {formatCurrency(invoice.amount, invoice.currency)}
            </h3>
          </div>
          <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full', config.color, 'bg-opacity-10')}>
            <StatusIcon className="w-4 h-4" />
            <span className={cn('text-xs font-medium', config.color)}>{config.label}</span>
          </div>
        </div>

        {/* Items Preview */}
        <div className="space-y-2 mb-4">
          {invoice.items.slice(0, 2).map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <span className="text-slate-600 truncate flex-1">{item.description}</span>
              <span className="text-slate-500 ml-4">{formatCurrency(item.total, invoice.currency)}</span>
            </div>
          ))}
          {invoice.items.length > 2 && (
            <p className="text-xs text-slate-400">+{invoice.items.length - 2} more items</p>
          )}
        </div>

        {/* Dates */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-slate-500">
              Due: <span className={cn('font-medium', isOverdue ? 'text-red-500' : 'text-slate-700')}>
                {formatDate(invoice.dueDate)}
              </span>
            </span>
          </div>
          {invoice.status === 'pending' && daysUntilDue > 0 && (
            <span className="text-xs text-slate-400">
              {daysUntilDue} days left
            </span>
          )}
          {invoice.status === 'paid' && invoice.paidDate && (
            <span className="text-xs text-green-600 font-medium">
              Paid on {formatDate(invoice.paidDate)}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
        <button
          onClick={() => onDownload?.(invoice)}
          className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>
        <button className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-700 transition-colors">
          <FileText className="w-4 h-4" />
          View Details
        </button>
      </div>
    </div>
  );
}
