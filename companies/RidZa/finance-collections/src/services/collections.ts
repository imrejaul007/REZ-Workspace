import { v4 as uuidv4 } from 'uuid';
import { Receivable, FollowUp, AgingBucketData, AgingBucket, PaymentChannel, IReceivable, IFollowUp } from '../models/Receivable';

/**
 * Calculate days overdue for a receivable
 */
function getDaysOverdue(dueDate: Date): number {
  const now = new Date();
  const diffMs = now.getTime() - dueDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Determine aging bucket based on days overdue
 */
function getAgingBucket(daysOverdue: number): AgingBucket {
  if (daysOverdue <= 0) return AgingBucket.CURRENT;
  if (daysOverdue <= 30) return AgingBucket.OVERDUE_1_30;
  if (daysOverdue <= 60) return AgingBucket.OVERDUE_31_60;
  if (daysOverdue <= 90) return AgingBucket.OVERDUE_61_90;
  return AgingBucket.OVERDUE_91_PLUS;
}

/**
 * Calculate AR aging analysis by time buckets for a tenant
 */
export async function calculateAgingReport(tenantId: string): Promise<{
  summary: {
    totalReceivables: number;
    totalAmount: number;
    totalOverdue: number;
    oldestDueDate: Date | null;
  };
  buckets: AgingBucketData[];
  generatedAt: Date;
}> {
  const receivables = await Receivable.find({ tenantId }).lean();

  const buckets: Record<AgingBucket, AgingBucketData> = {
    [AgingBucket.CURRENT]: {
      bucket: AgingBucket.CURRENT,
      label: 'Current (Not Yet Due)',
      minDays: -Infinity,
      maxDays: 0,
      totalAmount: 0,
      count: 0,
      receivables: [],
    },
    [AgingBucket.OVERDUE_1_30]: {
      bucket: AgingBucket.OVERDUE_1_30,
      label: '1-30 Days Overdue',
      minDays: 1,
      maxDays: 30,
      totalAmount: 0,
      count: 0,
      receivables: [],
    },
    [AgingBucket.OVERDUE_31_60]: {
      bucket: AgingBucket.OVERDUE_31_60,
      label: '31-60 Days Overdue',
      minDays: 31,
      maxDays: 60,
      totalAmount: 0,
      count: 0,
      receivables: [],
    },
    [AgingBucket.OVERDUE_61_90]: {
      bucket: AgingBucket.OVERDUE_61_90,
      label: '61-90 Days Overdue',
      minDays: 61,
      maxDays: 90,
      totalAmount: 0,
      count: 0,
      receivables: [],
    },
    [AgingBucket.OVERDUE_91_PLUS]: {
      bucket: AgingBucket.OVERDUE_91_PLUS,
      label: '91+ Days Overdue',
      minDays: 91,
      maxDays: null,
      totalAmount: 0,
      count: 0,
      receivables: [],
    },
  };

  let totalAmount = 0;
  let totalOverdue = 0;
  let oldestDueDate: Date | null = null;

  for (const receivable of receivables) {
    const outstandingAmount = receivable.amount - (receivable.paidAmount || 0);
    totalAmount += outstandingAmount;

    const daysOverdue = getDaysOverdue(receivable.dueDate);
    const bucket = getAgingBucket(daysOverdue);

    if (daysOverdue > 0) {
      totalOverdue += outstandingAmount;
      if (!oldestDueDate || receivable.dueDate < oldestDueDate) {
        oldestDueDate = receivable.dueDate;
      }
    }

    buckets[bucket].totalAmount += outstandingAmount;
    buckets[bucket].count += 1;
    buckets[bucket].receivables.push({
      receivableId: receivable.receivableId,
      customerName: receivable.customerName,
      amount: outstandingAmount,
      daysOverdue,
      dueDate: receivable.dueDate,
    });
  }

  return {
    summary: {
      totalReceivables: receivables.length,
      totalAmount,
      totalOverdue,
      oldestDueDate,
    },
    buckets: Object.values(buckets),
    generatedAt: new Date(),
  };
}

/**
 * Calculate next follow-up date based on aging bucket
 */
function calculateNextFollowUpDate(lastFollowUpDate: Date | null, bucket: AgingBucket): Date {
  const baseDays: Record<AgingBucket, number> = {
    [AgingBucket.CURRENT]: 30,
    [AgingBucket.OVERDUE_1_30]: 7,
    [AgingBucket.OVERDUE_31_60]: 3,
    [AgingBucket.OVERDUE_61_90]: 1,
    [AgingBucket.OVERDUE_91_PLUS]: 1,
  };

  const daysToAdd = baseDays[bucket];
  const baseDate = lastFollowUpDate || new Date();

  return new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
}

/**
 * Get receivables due for follow-up
 */
export async function getDueForFollowUp(tenantId: string): Promise<IReceivable[]> {
  const now = new Date();

  return Receivable.find({
    tenantId,
    status: { $ne: 'paid' },
    $or: [
      { nextFollowUpDate: { $lte: now } },
      {
        nextFollowUpDate: { $exists: false },
        dueDate: { $lte: now },
      },
    ],
  }).lean();
}

/**
 * Generate payment reminder message based on aging bucket
 */
export function generateReminderMessage(receivable: IReceivable, bucket: AgingBucket): string {
  const customerName = receivable.customerName.split(' ')[0];
  const amount = receivable.amount.toFixed(2);
  const currency = receivable.currency;
  const daysOverdue = getDaysOverdue(receivable.dueDate);

  const templates: Record<AgingBucket, string> = {
    [AgingBucket.CURRENT]: `Hi ${customerName}, this is a friendly reminder that invoice #${receivable.invoiceNumber} for ${currency} ${amount} is due in ${Math.abs(daysOverdue)} days. Thank you!`,

    [AgingBucket.OVERDUE_1_30]: `Hi ${customerName}, a gentle reminder that invoice #${receivable.invoiceNumber} for ${currency} ${amount} was due ${Math.abs(daysOverdue)} days ago. Please arrange payment at your earliest convenience.`,

    [AgingBucket.OVERDUE_31_60]: `Hi ${customerName}, we haven't received payment for invoice #${receivable.invoiceNumber} (${currency} ${amount}) which is ${daysOverdue} days overdue. Please contact us to resolve this matter.`,

    [AgingBucket.OVERDUE_61_90]: `Hi ${customerName}, this is an urgent follow-up regarding invoice #${receivable.invoiceNumber} for ${currency} ${amount}, now ${daysOverdue} days overdue. Please contact us immediately to arrange payment.`,

    [AgingBucket.OVERDUE_91_PLUS]: `Hi ${customerName}, your account for invoice #${receivable.invoiceNumber} (${currency} ${amount}) is ${daysOverdue} days overdue. This matter may be escalated if payment is not received promptly. Please contact us urgently.`,
  };

  return templates[bucket];
}

/**
 * Schedule a follow-up for a receivable
 */
export async function scheduleFollowUp(
  tenantId: string,
  receivableId: string,
  channel: PaymentChannel,
  message: string,
  scheduledDate?: Date
): Promise<IFollowUp> {
  const receivable = await Receivable.findOne({ tenantId, receivableId });

  if (!receivable) {
    throw new Error(`Receivable ${receivableId} not found`);
  }

  // Determine bucket and calculate next follow-up
  const daysOverdue = getDaysOverdue(receivable.dueDate);
  const bucket = getAgingBucket(daysOverdue);
  const followUpDate = scheduledDate || calculateNextFollowUpDate(receivable.lastFollowUpDate || null, bucket);

  // Create follow-up record
  const followUp = new FollowUp({
    followUpId: `FU-${uuidv4()}`,
    receivableId,
    tenantId,
    channel,
    message,
    scheduledDate: followUpDate,
    status: 'scheduled',
  });

  await followUp.save();

  // Update receivable
  receivable.followUpCount += 1;
  receivable.lastFollowUpDate = new Date();
  receivable.nextFollowUpDate = calculateNextFollowUpDate(receivable.lastFollowUpDate, bucket);
  receivable.status = 'overdue';
  await receivable.save();

  return followUp;
}

/**
 * Get follow-up history for a receivable
 */
export async function getFollowUpHistory(receivableId: string): Promise<IFollowUp[]> {
  return FollowUp.find({ receivableId })
    .sort({ scheduledDate: -1 })
    .lean();
}

/**
 * Mark follow-up as sent
 */
export async function markFollowUpSent(followUpId: string): Promise<void> {
  await FollowUp.updateOne(
    { followUpId },
    {
      $set: {
        status: 'sent',
        sentDate: new Date(),
      },
    }
  );
}

/**
 * Mark follow-up as failed
 */
export async function markFollowUpFailed(followUpId: string, reason?: string): Promise<void> {
  await FollowUp.updateOne(
    { followUpId },
    {
      $set: {
        status: 'failed',
        notes: reason,
      },
    }
  );
}

/**
 * Generate batch reminders for all overdue receivables
 */
export async function generateBatchReminders(
  tenantId: string,
  channel: PaymentChannel = PaymentChannel.EMAIL
): Promise<{
  reminders: Array<{
    receivableId: string;
    customerName: string;
    customerContact: string | undefined;
    message: string;
    scheduledDate: Date;
  }>;
  summary: {
    total: number;
    byBucket: Record<AgingBucket, number>;
  };
}> {
  const overdueReceivables = await Receivable.find({
    tenantId,
    status: { $ne: 'paid' },
    dueDate: { $lte: new Date() },
  }).lean();

  const reminders: Array<{
    receivableId: string;
    customerName: string;
    customerContact: string | undefined;
    message: string;
    scheduledDate: Date;
  }> = [];

  const byBucket: Record<AgingBucket, number> = {
    [AgingBucket.CURRENT]: 0,
    [AgingBucket.OVERDUE_1_30]: 0,
    [AgingBucket.OVERDUE_31_60]: 0,
    [AgingBucket.OVERDUE_61_90]: 0,
    [AgingBucket.OVERDUE_91_PLUS]: 0,
  };

  for (const receivable of overdueReceivables) {
    const daysOverdue = getDaysOverdue(receivable.dueDate);
    const bucket = getAgingBucket(daysOverdue);
    const message = generateReminderMessage(receivable as IReceivable, bucket);
    const scheduledDate = calculateNextFollowUpDate(null, bucket);

    const customerContact = channel === PaymentChannel.EMAIL
      ? receivable.customerEmail
      : receivable.customerPhone;

    if (customerContact) {
      reminders.push({
        receivableId: receivable.receivableId,
        customerName: receivable.customerName,
        customerContact,
        message,
        scheduledDate,
      });

      byBucket[bucket] += 1;
    }
  }

  return {
    reminders,
    summary: {
      total: reminders.length,
      byBucket,
    },
  };
}

/**
 * Record payment received
 */
export async function recordPayment(
  receivableId: string,
  amount: number,
  paymentDate: Date = new Date()
): Promise<IReceivable> {
  const receivable = await Receivable.findOne({ receivableId });

  if (!receivable) {
    throw new Error(`Receivable ${receivableId} not found`);
  }

  receivable.paidAmount += amount;

  if (receivable.paidAmount >= receivable.amount) {
    receivable.status = 'paid';
    receivable.nextFollowUpDate = undefined;
  } else if (receivable.paidAmount > 0) {
    receivable.status = 'partial';
  }

  await receivable.save();
  return receivable;
}

export default {
  calculateAgingReport,
  getDueForFollowUp,
  generateReminderMessage,
  scheduleFollowUp,
  getFollowUpHistory,
  markFollowUpSent,
  markFollowUpFailed,
  generateBatchReminders,
  recordPayment,
};