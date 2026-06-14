'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Plus,
  ChevronDown,
  Calendar,
  User,
  MoreHorizontal,
  Ticket as TicketIcon,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { Card, Badge, StatusBadge, PriorityBadge, CategoryBadge, Avatar, Button } from '@/components/ui';
import { tickets } from '@/lib/mock-data';
import {
  formatRelativeTime,
  getSlaStatus,
  getSlaTimeRemaining,
  cn,
  statusConfig,
  priorityConfig,
  categoryConfig,
} from '@/lib/utils';
import { TicketStatus, TicketPriority, TicketCategory } from '@/types';

export default function TicketsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSearch =
        searchQuery === '' ||
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.employee.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
      const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });
  }, [searchQuery, statusFilter, priorityFilter, categoryFilter]);

  const ticketCounts = useMemo(() => {
    return {
      all: tickets.length,
      open: tickets.filter((t) => t.status === 'open').length,
      in_progress: tickets.filter((t) => t.status === 'in_progress').length,
      pending: tickets.filter((t) => t.status === 'pending').length,
      resolved: tickets.filter((t) => t.status === 'resolved').length,
      closed: tickets.filter((t) => t.status === 'closed').length,
    };
  }, []);

  const statusTabs: { value: TicketStatus | 'all'; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: ticketCounts.all },
    { value: 'open', label: 'Open', count: ticketCounts.open },
    { value: 'in_progress', label: 'In Progress', count: ticketCounts.in_progress },
    { value: 'pending', label: 'Pending', count: ticketCounts.pending },
    { value: 'resolved', label: 'Resolved', count: ticketCounts.resolved },
    { value: 'closed', label: 'Closed', count: ticketCounts.closed },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
          <p className="text-gray-500 mt-1">
            Manage and track all support tickets
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Ticket
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
              statusFilter === tab.value
                ? 'bg-blue-100 text-blue-700'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            )}
          >
            {tab.label}
            <Badge
              variant={statusFilter === tab.value ? 'info' : 'default'}
              className="ml-2"
            >
              {tab.count}
            </Badge>
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <Card padding="sm">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets by ID, title, or employee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            <ChevronDown className={cn('w-4 h-4 ml-2 transition-transform', showFilters && 'rotate-180')} />
          </Button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as TicketPriority | 'all')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Priorities</option>
                {Object.entries(priorityConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as TicketCategory | 'all')}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {Object.entries(categoryConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setPriorityFilter('all');
                  setCategoryFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Tickets List */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Ticket
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  SLA
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTickets.map((ticket) => {
                const slaStatus = getSlaStatus(ticket.slaDeadline);
                return (
                  <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="block group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-500">{ticket.id}</span>
                          {ticket.satisfactionRating && (
                            <Badge variant="success" size="sm">
                              {ticket.satisfactionRating}/5
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors mt-1">
                          {ticket.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {ticket.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {ticket.tags.length > 2 && (
                            <span className="text-xs text-gray-400">
                              +{ticket.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={ticket.employee.name} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{ticket.employee.name}</p>
                          <p className="text-xs text-gray-500">{ticket.employee.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-6 py-4">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="px-6 py-4">
                      <CategoryBadge category={ticket.category} />
                    </td>
                    <td className="px-6 py-4">
                      {ticket.slaDeadline ? (
                        <Badge
                          variant={
                            slaStatus === 'breached'
                              ? 'danger'
                              : slaStatus === 'at_risk'
                              ? 'warning'
                              : 'success'
                          }
                          size="sm"
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          {getSlaTimeRemaining(ticket.slaDeadline)}
                        </Badge>
                      ) : (
                        <span className="text-sm text-gray-400">No SLA</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {formatRelativeTime(ticket.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/tickets/${ticket.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredTickets.length === 0 && (
          <div className="p-12 text-center">
            <TicketIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No tickets found</h3>
            <p className="text-gray-500">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first ticket to get started'}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
