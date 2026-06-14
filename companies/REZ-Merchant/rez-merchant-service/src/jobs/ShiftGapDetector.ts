/**
 * ShiftGapDetector
 *
 * Scans StaffShift records for unfilled shifts starting 24-72 hours from now.
 * Groups gaps by role/position and returns a structured ShiftGap array.
 * No queue dependencies — plain async function suitable for polling.
 */

import { StaffShift } from '../models/StaffShift';

export interface ShiftGap {
  merchantId: string;
  storeId: string;
  role: string;
  date: string; // ISO date string YYYY-MM-DD
  count: number;
  urgency: 'high' | 'medium';
}

/**
 * Detect shift gaps for a given merchant.
 *
 * A gap is unknown shift slot that has no assigned staffId within the
 * 24-to-72-hour lookahead window. Shifts starting in < 24 h are "high"
 * urgency; 24-72 h is "medium".
 *
 * The StaffShift model uses strict:false so we query flexibly.
 */
export async function detectShiftGaps(merchantId: string): Promise<ShiftGap[]> {
  const now = new Date();
  const windowStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 72 * 60 * 60 * 1000);

  // Also include shifts starting in < 24 h (urgent gaps)
  const urgentStart = now;

  const raw = await StaffShift.find({
    merchantId,
    // Combine both $or conditions into a single $and so there is no duplicate key
    $and: [
      {
        $or: [
          // shifts stored with an explicit shiftDate field
          { shiftDate: { $gte: urgentStart, $lte: windowEnd } },
          // shifts derived from weekStartDate + day index
          { weekStartDate: { $gte: new Date(urgentStart.toISOString().split('T')[0]), $lte: windowEnd } },
        ],
      },
      {
        // unfilled: staffId absent, null, or explicitly marked unassigned
        $or: [{ staffId: { $exists: false } }, { staffId: null }, { unassigned: true }],
      },
    ],
  }).lean() as unknown[];

  if (!raw.length) {
    return [];
  }

  // Group by storeId + role + date
  const gapMap = new Map<string, ShiftGap>();

  for (const doc of raw) {
    const storeId: string = doc.storeId ?? 'unknown';
    const role: string = doc.role ?? doc.position ?? 'General';
    const shiftDate: string = resolveShiftDate(doc);
    const shiftDateTime = new Date(shiftDate);

    const urgency: 'high' | 'medium' =
      shiftDateTime.getTime() < windowStart.getTime() ? 'high' : 'medium';

    const key = `${storeId}::${role}::${shiftDate}`;

    if (gapMap.has(key)) {
      const existing = gapMap.get(key)!;
      existing.count += 1;
      // Escalate urgency if any slot in the group is high
      if (urgency === 'high') existing.urgency = 'high';
    } else {
      gapMap.set(key, { merchantId, storeId, role, date: shiftDate, count: 1, urgency });
    }
  }

  return Array.from(gapMap.values());
}

/**
 * Resolve a YYYY-MM-DD date string from a StaffShift document.
 * The model is schema-less, so we try multiple field conventions.
 */
function resolveShiftDate(doc): string {
  if (doc.shiftDate) {
    return new Date(doc.shiftDate).toISOString().split('T')[0];
  }
  if (doc.weekStartDate && typeof doc.dayIndex === 'number') {
    const base = new Date(doc.weekStartDate);
    base.setDate(base.getDate() + doc.dayIndex);
    return base.toISOString().split('T')[0];
  }
  if (doc.weekStartDate) {
    return new Date(doc.weekStartDate).toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
}
