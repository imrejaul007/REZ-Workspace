'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Send,
  Paperclip,
  MoreHorizontal,
  Clock,
  User,
  Tag,
  Calendar,
  MessageSquare,
  Lock,
  Unlock,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  Copy,
  Mail,
} from 'lucide-react';
import {
  Card,
  Badge,
  StatusBadge,
  PriorityBadge,
  CategoryBadge,
  Avatar,
  Button,
  Select,
} from '@/components/ui';
import { tickets, cannedResponses, supportAgents } from '@/lib/mock-data';
import {
  formatRelativeTime,
  formatDateTime,
  getSlaStatus,
  getSlaTimeRemaining,
  cn,
} from '@/lib/utils';
import { TicketMessage, TicketStatus } from '@/types';

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const ticket = tickets.find((t) => t.id === ticketId);

  const [replyContent, setReplyContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [showCannedResponses, setShowCannedResponses] = useState(false);
  const [selectedCanned, setSelectedCanned] = useState<string>('');

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <AlertTriangle className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Ticket Not Found</h2>
        <p className="text-gray-500 mb-4">
          The ticket you are looking for does not exist.
        </p>
        <Link href="/tickets">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tickets
          </Button>
        </Link>
      </div>
    );
  }

  const slaStatus = getSlaStatus(ticket.slaDeadline);

  const handleSendReply = () => {
    if (!replyContent.trim()) return;
    logger.info('Sending reply:', { content: replyContent, isInternal });
    setReplyContent('');
    setIsInternal(false);
  };

  const handleCannedResponse = (content: string) => {
    setReplyContent(content);
    setSelectedCanned(content);
    setShowCannedResponses(false);
  };

  const handleStatusChange = (status: TicketStatus) => {
    logger.info('Changing status to:', status);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href="/tickets">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">{ticket.id}</h1>
              <StatusBadge status={ticket.status} size="md" />
              <PriorityBadge priority={ticket.priority} size="md" />
              {slaStatus === 'breached' && (
                <Badge variant="danger">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  SLA Breached
                </Badge>
              )}
            </div>
            <h2 className="text-lg text-gray-700 mt-1">{ticket.title}</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
          <Button variant="outline" size="sm">
            <Mail className="w-4 h-4 mr-2" />
            Email
          </Button>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket Details & Messages */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Details Card */}
          <Card>
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Description</h3>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-gray-700 leading-relaxed">{ticket.description}</p>

            {/* Tags */}
            {ticket.tags.length > 0 && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                <Tag className="w-4 h-4 text-gray-400" />
                {ticket.tags.map((tag) => (
                  <Badge key={tag} variant="default" size="sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </Card>

          {/* Messages */}
          <Card padding="none">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
              <p className="text-sm text-gray-500">
                {ticket.messages.length} message{ticket.messages.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto scrollbar-thin">
              {ticket.messages.map((message) => (
                <MessageItem key={message.id} message={message} />
              ))}
            </div>
          </Card>

          {/* Reply Box */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Reply</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant={isInternal ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setIsInternal(!isInternal)}
                >
                  {isInternal ? (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Internal
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4 mr-2" />
                      Public Reply
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Canned Responses */}
            <div className="mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCannedResponses(!showCannedResponses)}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Canned Responses
                <ChevronDown
                  className={cn(
                    'w-4 h-4 ml-2 transition-transform',
                    showCannedResponses && 'rotate-180'
                  )}
                />
              </Button>
              {showCannedResponses && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-2 gap-2">
                    {cannedResponses.slice(0, 6).map((canned) => (
                      <button
                        key={canned.id}
                        onClick={() => handleCannedResponse(canned.content)}
                        className="text-left p-2 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      >
                        <p className="text-sm font-medium text-gray-900">{canned.title}</p>
                        <p className="text-xs text-gray-500 font-mono">{canned.shortcut}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reply Input */}
            <div className="space-y-4">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={
                  isInternal
                    ? 'Write an internal note (only visible to support agents)...'
                    : 'Type your reply to the employee...'
                }
                rows={4}
                className={cn(
                  'w-full px-4 py-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors',
                  isInternal ? 'border-amber-300 bg-amber-50' : 'border-gray-300'
                )}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                </div>
                <Button onClick={handleSendReply} disabled={!replyContent.trim()}>
                  <Send className="w-4 h-4 mr-2" />
                  {isInternal ? 'Add Internal Note' : 'Send Reply'}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Actions */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Actions</h3>
            <div className="space-y-3">
              <Select
                label="Status"
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                options={[
                  { value: 'open', label: 'Open' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'resolved', label: 'Resolved' },
                  { value: 'closed', label: 'Closed' },
                ]}
              />
              <Select
                label="Priority"
                value={ticket.priority}
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                  { value: 'urgent', label: 'Urgent' },
                ]}
              />
              <Select
                label="Assigned To"
                value={ticket.assignedTo?.id || ''}
                options={[
                  { value: '', label: 'Unassigned' },
                  ...supportAgents.map((agent) => ({
                    value: agent.id,
                    label: agent.name,
                  })),
                ]}
              />
              <Button className="w-full" variant="primary">
                <CheckCircle className="w-4 h-4 mr-2" />
                Resolve Ticket
              </Button>
            </div>
          </Card>

          {/* SLA Info */}
          {ticket.slaDeadline && (
            <Card
              className={cn(
                slaStatus === 'breached' && 'border-red-200 bg-red-50',
                slaStatus === 'at_risk' && 'border-amber-200 bg-amber-50'
              )}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">SLA Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Deadline</span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDateTime(ticket.slaDeadline)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Time Remaining</span>
                  <Badge
                    variant={
                      slaStatus === 'breached'
                        ? 'danger'
                        : slaStatus === 'at_risk'
                        ? 'warning'
                        : 'success'
                    }
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    {getSlaTimeRemaining(ticket.slaDeadline)}
                  </Badge>
                </div>
              </div>
            </Card>
          )}

          {/* Employee Info */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee</h3>
            <div className="flex items-center gap-3">
              <Avatar name={ticket.employee.name} size="lg" />
              <div>
                <p className="font-medium text-gray-900">{ticket.employee.name}</p>
                <p className="text-sm text-gray-500">{ticket.employee.email}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <User className="w-4 h-4" />
                {ticket.employee.role}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Tag className="w-4 h-4" />
                {ticket.employee.department}
              </div>
            </div>
          </Card>

          {/* Ticket Info */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Category</span>
                <CategoryBadge category={ticket.category} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Created</span>
                <span className="text-gray-900">{formatRelativeTime(ticket.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Updated</span>
                <span className="text-gray-900">{formatRelativeTime(ticket.updatedAt)}</span>
              </div>
              {ticket.resolvedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Resolved</span>
                  <span className="text-gray-900">{formatRelativeTime(ticket.resolvedAt)}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Satisfaction Rating */}
          {ticket.satisfactionRating && (
            <Card className="bg-green-50 border-green-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Satisfaction</h3>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={cn(
                      'w-6 h-6',
                      star <= ticket.satisfactionRating! ? 'text-yellow-400' : 'text-gray-300'
                    )}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="ml-2 text-sm font-medium text-gray-700">
                  {ticket.satisfactionRating}/5
                </span>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageItem({ message }: { message: TicketMessage }) {
  const isEmployee = message.sender.id.startsWith('emp-');
  const isSystem = message.type === 'system';

  if (isSystem) {
    return (
      <div className="p-4 bg-gray-50 text-center">
        <p className="text-sm text-gray-500 italic">{message.content}</p>
        <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(message.createdAt)}</p>
      </div>
    );
  }

  return (
    <div className={cn('p-4', message.isInternal && 'bg-amber-50 border-l-4 border-amber-300')}>
      <div className="flex items-start gap-3">
        <Avatar
          name={message.sender.name}
          size="md"
          status={!isEmployee ? 'online' : undefined}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{message.sender.name}</span>
            {message.isInternal && (
              <Badge variant="warning" size="sm">
                <Lock className="w-3 h-3 mr-1" />
                Internal
              </Badge>
            )}
            <span className="text-xs text-gray-500">{formatRelativeTime(message.createdAt)}</span>
          </div>
          <p className="mt-1 text-gray-700">{message.content}</p>
          {message.attachments.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              {message.attachments.map((att) => (
                <a
                  key={att.id}
                  href={att.url}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  <Paperclip className="w-4 h-4" />
                  {att.name}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
