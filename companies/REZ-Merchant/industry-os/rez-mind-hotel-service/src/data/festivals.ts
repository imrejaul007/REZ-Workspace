/**
 * Festival Calendar Data
 *
 * Comprehensive calendar of Indian festivals, holidays, and events
 * for dynamic pricing adjustments. Covers 2024-2027.
 *
 * To add/update festivals:
 * 1. Add the festival to the appropriate year's array
 * 2. Use the format: { name, date: 'YYYY-MM-DD', type, impact }
 * 3. Impact: 0.0-1.0 (0.5 = moderate demand, 1.0 = peak demand)
 *
 * Festival Types:
 * - festival: Religious/cultural festivals
 * - holiday: Public/government holidays
 * - vacation: School/college vacation periods
 */

export interface FestivalEntry {
  name: string;
  date: string; // ISO format YYYY-MM-DD
  type: 'festival' | 'holiday' | 'vacation';
  impact: number; // 0-1, expected demand increase
  duration?: number; // Number of days (default: 1)
  region?: string; // Optional regional scope (e.g., 'Maharashtra', 'West Bengal')
}

// ─── Festival Calendar ────────────────────────────────────────────────────────

export const festivalCalendar: FestivalEntry[] = [
  // ═══════════════════════════════════════════════════════════════
  // 2024 FESTIVALS
  // ═══════════════════════════════════════════════════════════════

  // January
  {
    name: "New Year's Day",
    date: '2024-01-01',
    type: 'holiday',
    impact: 0.85,
  },
  {
    name: 'Makar Sankranti',
    date: '2024-01-15',
    type: 'festival',
    impact: 0.6,
    region: 'Pan-India',
  },
  {
    name: 'Republic Day',
    date: '2024-01-26',
    type: 'holiday',
    impact: 0.55,
  },

  // February
  {
    name: 'Vasant Panchami',
    date: '2024-02-14',
    type: 'festival',
    impact: 0.45,
  },
  {
    name: 'Mahashivratri',
    date: '2024-03-09',
    type: 'festival',
    impact: 0.5,
  },

  // March
  {
    name: 'Holi',
    date: '2024-03-25',
    type: 'festival',
    impact: 0.75,
    duration: 2,
  },
  {
    name: 'Good Friday',
    date: '2024-03-29',
    type: 'holiday',
    impact: 0.4,
  },

  // April
  {
    name: 'Eid-ul-Fitr',
    date: '2024-04-11',
    type: 'festival',
    impact: 0.8,
    duration: 2,
  },
  {
    name: 'Ram Navami',
    date: '2024-04-17',
    type: 'festival',
    impact: 0.55,
  },
  {
    name: 'Mahavir Jayanti',
    date: '2024-04-21',
    type: 'festival',
    impact: 0.4,
  },
  {
    name: 'Easter Sunday',
    date: '2024-03-31',
    type: 'festival',
    impact: 0.35,
  },

  // May
  {
    name: 'Buddha Purnima',
    date: '2024-05-23',
    type: 'festival',
    impact: 0.4,
  },
  {
    name: 'Summer Vacation Start',
    date: '2024-05-15',
    type: 'vacation',
    impact: 0.5,
    duration: 45,
    region: 'Schools',
  },

  // June
  {
    name: 'Eid-ul-Adha',
    date: '2024-06-17',
    type: 'festival',
    impact: 0.7,
    duration: 2,
  },

  // July
  {
    name: 'Bakri Eid',
    date: '2024-06-17',
    type: 'festival',
    impact: 0.65,
    duration: 2,
  },

  // August
  {
    name: 'Independence Day',
    date: '2024-08-15',
    type: 'holiday',
    impact: 0.7,
  },
  {
    name: 'Raksha Bandhan',
    date: '2024-08-09',
    type: 'festival',
    impact: 0.5,
  },
  {
    name: 'Janmashtami',
    date: '2024-08-26',
    type: 'festival',
    impact: 0.6,
  },
  {
    name: 'Ganesh Chaturthi',
    date: '2024-09-07',
    type: 'festival',
    impact: 0.75,
    duration: 10,
    region: 'Maharashtra',
  },
  {
    name: 'Onam',
    date: '2024-09-15',
    type: 'festival',
    impact: 0.8,
    duration: 5,
    region: 'Kerala',
  },

  // September
  {
    name: 'Ganesh Chaturthi',
    date: '2024-09-07',
    type: 'festival',
    impact: 0.7,
    region: 'Pan-India',
  },
  {
    name: 'Milad-un-Nabi',
    date: '2024-09-16',
    type: 'festival',
    impact: 0.6,
  },
  {
    name: 'Navratri Start',
    date: '2024-10-03',
    type: 'festival',
    impact: 0.75,
    duration: 9,
  },

  // October
  {
    name: 'Durga Puja',
    date: '2024-10-09',
    type: 'festival',
    impact: 0.85,
    duration: 5,
    region: 'West Bengal',
  },
  {
    name: 'Dussehra',
    date: '2024-10-12',
    type: 'festival',
    impact: 0.7,
    duration: 2,
  },
  {
    name: 'Mahatma Gandhi Jayanti',
    date: '2024-10-02',
    type: 'holiday',
    impact: 0.4,
  },
  {
    name: 'Diwali',
    date: '2024-11-01',
    type: 'festival',
    impact: 0.9,
    duration: 3,
  },
  {
    name: 'Bhai Dooj',
    date: '2024-11-03',
    type: 'festival',
    impact: 0.5,
  },

  // November
  {
    name: 'Guru Nanak Jayanti',
    date: '2024-11-15',
    type: 'festival',
    impact: 0.55,
  },

  // December
  {
    name: 'Christmas',
    date: '2024-12-25',
    type: 'holiday',
    impact: 0.75,
    duration: 2,
  },
  {
    name: "New Year's Eve",
    date: '2024-12-31',
    type: 'holiday',
    impact: 0.9,
  },
  {
    name: 'Winter Vacation Start',
    date: '2024-12-20',
    type: 'vacation',
    impact: 0.6,
    duration: 15,
    region: 'Schools',
  },

  // ═══════════════════════════════════════════════════════════════
  // 2025 FESTIVALS
  // ═══════════════════════════════════════════════════════════════

  // January
  {
    name: "New Year's Day",
    date: '2025-01-01',
    type: 'holiday',
    impact: 0.85,
  },
  {
    name: 'Makar Sankranti',
    date: '2025-01-14',
    type: 'festival',
    impact: 0.6,
  },
  {
    name: 'Republic Day',
    date: '2025-01-26',
    type: 'holiday',
    impact: 0.55,
  },

  // February
  {
    name: 'Vasant Panchami',
    date: '2025-02-12',
    type: 'festival',
    impact: 0.45,
  },
  {
    name: 'Mahashivratri',
    date: '2025-02-26',
    type: 'festival',
    impact: 0.5,
  },

  // March
  {
    name: 'Holi',
    date: '2025-03-14',
    type: 'festival',
    impact: 0.75,
    duration: 2,
  },
  {
    name: 'Good Friday',
    date: '2025-04-18',
    type: 'holiday',
    impact: 0.4,
  },

  // April
  {
    name: 'Eid-ul-Fitr',
    date: '2025-03-31',
    type: 'festival',
    impact: 0.8,
    duration: 2,
  },
  {
    name: 'Ram Navami',
    date: '2025-04-06',
    type: 'festival',
    impact: 0.55,
  },
  {
    name: 'Mahavir Jayanti',
    date: '2025-04-10',
    type: 'festival',
    impact: 0.4,
  },
  {
    name: 'Easter Sunday',
    date: '2025-04-20',
    type: 'festival',
    impact: 0.35,
  },

  // May
  {
    name: 'Buddha Purnima',
    date: '2025-05-12',
    type: 'festival',
    impact: 0.4,
  },
  {
    name: 'Summer Vacation Start',
    date: '2025-05-15',
    type: 'vacation',
    impact: 0.5,
    duration: 45,
    region: 'Schools',
  },

  // June
  {
    name: 'Eid-ul-Adha',
    date: '2025-06-06',
    type: 'festival',
    impact: 0.7,
    duration: 2,
  },

  // July
  {
    name: 'Bakri Eid',
    date: '2025-06-06',
    type: 'festival',
    impact: 0.65,
    duration: 2,
  },

  // August
  {
    name: 'Independence Day',
    date: '2025-08-15',
    type: 'holiday',
    impact: 0.7,
  },
  {
    name: 'Raksha Bandhan',
    date: '2025-08-09',
    type: 'festival',
    impact: 0.5,
  },
  {
    name: 'Janmashtami',
    date: '2025-08-16',
    type: 'festival',
    impact: 0.6,
  },

  // September
  {
    name: 'Ganesh Chaturthi',
    date: '2025-08-27',
    type: 'festival',
    impact: 0.75,
    duration: 10,
    region: 'Maharashtra',
  },
  {
    name: 'Ganesh Chaturthi',
    date: '2025-08-27',
    type: 'festival',
    impact: 0.7,
    region: 'Pan-India',
  },
  {
    name: 'Milad-un-Nabi',
    date: '2025-09-05',
    type: 'festival',
    impact: 0.6,
  },
  {
    name: 'Onam',
    date: '2025-09-05',
    type: 'festival',
    impact: 0.8,
    duration: 5,
    region: 'Kerala',
  },

  // October
  {
    name: 'Navratri Start',
    date: '2025-09-22',
    type: 'festival',
    impact: 0.75,
    duration: 9,
  },
  {
    name: 'Durga Puja',
    date: '2025-09-28',
    type: 'festival',
    impact: 0.85,
    duration: 5,
    region: 'West Bengal',
  },
  {
    name: 'Dussehra',
    date: '2025-10-01',
    type: 'festival',
    impact: 0.7,
    duration: 2,
  },
  {
    name: 'Mahatma Gandhi Jayanti',
    date: '2025-10-02',
    type: 'holiday',
    impact: 0.4,
  },
  {
    name: 'Diwali',
    date: '2025-10-20',
    type: 'festival',
    impact: 0.9,
    duration: 3,
  },
  {
    name: 'Bhai Dooj',
    date: '2025-10-22',
    type: 'festival',
    impact: 0.5,
  },

  // November
  {
    name: 'Guru Nanak Jayanti',
    date: '2025-11-05',
    type: 'festival',
    impact: 0.55,
  },

  // December
  {
    name: 'Christmas',
    date: '2025-12-25',
    type: 'holiday',
    impact: 0.75,
    duration: 2,
  },
  {
    name: "New Year's Eve",
    date: '2025-12-31',
    type: 'holiday',
    impact: 0.9,
  },
  {
    name: 'Winter Vacation Start',
    date: '2025-12-20',
    type: 'vacation',
    impact: 0.6,
    duration: 15,
    region: 'Schools',
  },

  // ═══════════════════════════════════════════════════════════════
  // 2026 FESTIVALS
  // ═══════════════════════════════════════════════════════════════

  // January
  {
    name: "New Year's Day",
    date: '2026-01-01',
    type: 'holiday',
    impact: 0.85,
  },
  {
    name: 'Makar Sankranti',
    date: '2026-01-14',
    type: 'festival',
    impact: 0.6,
  },
  {
    name: 'Republic Day',
    date: '2026-01-26',
    type: 'holiday',
    impact: 0.55,
  },

  // February
  {
    name: 'Vasant Panchami',
    date: '2026-02-01',
    type: 'festival',
    impact: 0.45,
  },
  {
    name: 'Mahashivratri',
    date: '2026-02-15',
    type: 'festival',
    impact: 0.5,
  },

  // March
  {
    name: 'Holi',
    date: '2026-03-03',
    type: 'festival',
    impact: 0.75,
    duration: 2,
  },
  {
    name: 'Good Friday',
    date: '2026-04-03',
    type: 'holiday',
    impact: 0.4,
  },

  // April
  {
    name: 'Eid-ul-Fitr',
    date: '2026-03-20',
    type: 'festival',
    impact: 0.8,
    duration: 2,
  },
  {
    name: 'Ram Navami',
    date: '2026-03-26',
    type: 'festival',
    impact: 0.55,
  },
  {
    name: 'Mahavir Jayanti',
    date: '2026-03-30',
    type: 'festival',
    impact: 0.4,
  },
  {
    name: 'Easter Sunday',
    date: '2026-04-05',
    type: 'festival',
    impact: 0.35,
  },

  // May
  {
    name: 'Buddha Purnima',
    date: '2026-05-01',
    type: 'festival',
    impact: 0.4,
  },
  {
    name: 'Summer Vacation Start',
    date: '2026-05-15',
    type: 'vacation',
    impact: 0.5,
    duration: 45,
    region: 'Schools',
  },

  // June
  {
    name: 'Eid-ul-Adha',
    date: '2026-05-27',
    type: 'festival',
    impact: 0.7,
    duration: 2,
  },

  // July
  {
    name: 'Bakri Eid',
    date: '2026-05-27',
    type: 'festival',
    impact: 0.65,
    duration: 2,
  },

  // August
  {
    name: 'Independence Day',
    date: '2026-08-15',
    type: 'holiday',
    impact: 0.7,
  },
  {
    name: 'Raksha Bandhan',
    date: '2026-08-19',
    type: 'festival',
    impact: 0.5,
  },
  {
    name: 'Janmashtami',
    date: '2026-08-26',
    type: 'festival',
    impact: 0.6,
  },

  // September
  {
    name: 'Ganesh Chaturthi',
    date: '2026-08-27',
    type: 'festival',
    impact: 0.75,
    duration: 10,
    region: 'Maharashtra',
  },
  {
    name: 'Ganesh Chaturthi',
    date: '2026-08-27',
    type: 'festival',
    impact: 0.7,
    region: 'Pan-India',
  },
  {
    name: 'Milad-un-Nabi',
    date: '2026-08-27',
    type: 'festival',
    impact: 0.6,
  },
  {
    name: 'Onam',
    date: '2026-09-07',
    type: 'festival',
    impact: 0.8,
    duration: 5,
    region: 'Kerala',
  },

  // October
  {
    name: 'Navratri Start',
    date: '2026-10-12',
    type: 'festival',
    impact: 0.75,
    duration: 9,
  },
  {
    name: 'Durga Puja',
    date: '2026-10-18',
    type: 'festival',
    impact: 0.85,
    duration: 5,
    region: 'West Bengal',
  },
  {
    name: 'Dussehra',
    date: '2026-10-21',
    type: 'festival',
    impact: 0.7,
    duration: 2,
  },
  {
    name: 'Mahatma Gandhi Jayanti',
    date: '2026-10-02',
    type: 'holiday',
    impact: 0.4,
  },
  {
    name: 'Diwali',
    date: '2026-11-09',
    type: 'festival',
    impact: 0.9,
    duration: 3,
  },
  {
    name: 'Bhai Dooj',
    date: '2026-11-11',
    type: 'festival',
    impact: 0.5,
  },

  // November
  {
    name: 'Guru Nanak Jayanti',
    date: '2026-11-04',
    type: 'festival',
    impact: 0.55,
  },

  // December
  {
    name: 'Christmas',
    date: '2026-12-25',
    type: 'holiday',
    impact: 0.75,
    duration: 2,
  },
  {
    name: "New Year's Eve",
    date: '2026-12-31',
    type: 'holiday',
    impact: 0.9,
  },
  {
    name: 'Winter Vacation Start',
    date: '2026-12-20',
    type: 'vacation',
    impact: 0.6,
    duration: 15,
    region: 'Schools',
  },

  // ═══════════════════════════════════════════════════════════════
  // 2027 FESTIVALS
  // ═══════════════════════════════════════════════════════════════

  // January
  {
    name: "New Year's Day",
    date: '2027-01-01',
    type: 'holiday',
    impact: 0.85,
  },
  {
    name: 'Makar Sankranti',
    date: '2027-01-14',
    type: 'festival',
    impact: 0.6,
  },
  {
    name: 'Republic Day',
    date: '2027-01-26',
    type: 'holiday',
    impact: 0.55,
  },

  // February
  {
    name: 'Vasant Panchami',
    date: '2027-01-22',
    type: 'festival',
    impact: 0.45,
  },
  {
    name: 'Mahashivratri',
    date: '2027-02-26',
    type: 'festival',
    impact: 0.5,
  },

  // March
  {
    name: 'Holi',
    date: '2027-02-22',
    type: 'festival',
    impact: 0.75,
    duration: 2,
  },
  {
    name: 'Holi (Day 2)',
    date: '2027-02-23',
    type: 'festival',
    impact: 0.6,
  },
  {
    name: 'Good Friday',
    date: '2027-03-26',
    type: 'holiday',
    impact: 0.4,
  },

  // April
  {
    name: 'Eid-ul-Fitr',
    date: '2027-04-10',
    type: 'festival',
    impact: 0.8,
    duration: 2,
  },
  {
    name: 'Ram Navami',
    date: '2027-04-15',
    type: 'festival',
    impact: 0.55,
  },
  {
    name: 'Mahavir Jayanti',
    date: '2027-04-19',
    type: 'festival',
    impact: 0.4,
  },
  {
    name: 'Easter Sunday',
    date: '2027-03-28',
    type: 'festival',
    impact: 0.35,
  },

  // May
  {
    name: 'Buddha Purnima',
    date: '2027-05-22',
    type: 'festival',
    impact: 0.4,
  },
  {
    name: 'Summer Vacation Start',
    date: '2027-05-15',
    type: 'vacation',
    impact: 0.5,
    duration: 45,
    region: 'Schools',
  },

  // June
  {
    name: 'Eid-ul-Adha',
    date: '2027-05-17',
    type: 'festival',
    impact: 0.7,
    duration: 2,
  },

  // July
  {
    name: 'Bakri Eid',
    date: '2027-05-17',
    type: 'festival',
    impact: 0.65,
    duration: 2,
  },

  // August
  {
    name: 'Independence Day',
    date: '2027-08-15',
    type: 'holiday',
    impact: 0.7,
  },
  {
    name: 'Raksha Bandhan',
    date: '2027-08-09',
    type: 'festival',
    impact: 0.5,
  },
  {
    name: 'Janmashtami',
    date: '2027-08-26',
    type: 'festival',
    impact: 0.6,
  },

  // September
  {
    name: 'Ganesh Chaturthi',
    date: '2027-08-27',
    type: 'festival',
    impact: 0.75,
    duration: 10,
    region: 'Maharashtra',
  },
  {
    name: 'Ganesh Chaturthi',
    date: '2027-08-27',
    type: 'festival',
    impact: 0.7,
    region: 'Pan-India',
  },
  {
    name: 'Milad-un-Nabi',
    date: '2027-09-16',
    type: 'festival',
    impact: 0.6,
  },
  {
    name: 'Onam',
    date: '2027-09-07',
    type: 'festival',
    impact: 0.8,
    duration: 5,
    region: 'Kerala',
  },

  // October
  {
    name: 'Navratri Start',
    date: '2027-10-01',
    type: 'festival',
    impact: 0.75,
    duration: 9,
  },
  {
    name: 'Durga Puja',
    date: '2027-10-07',
    type: 'festival',
    impact: 0.85,
    duration: 5,
    region: 'West Bengal',
  },
  {
    name: 'Dussehra',
    date: '2027-10-10',
    type: 'festival',
    impact: 0.7,
    duration: 2,
  },
  {
    name: 'Mahatma Gandhi Jayanti',
    date: '2027-10-02',
    type: 'holiday',
    impact: 0.4,
  },
  {
    name: 'Diwali',
    date: '2027-10-29',
    type: 'festival',
    impact: 0.9,
    duration: 3,
  },
  {
    name: 'Bhai Dooj',
    date: '2027-10-31',
    type: 'festival',
    impact: 0.5,
  },

  // November
  {
    name: 'Guru Nanak Jayanti',
    date: '2027-11-24',
    type: 'festival',
    impact: 0.55,
  },

  // December
  {
    name: 'Christmas',
    date: '2027-12-25',
    type: 'holiday',
    impact: 0.75,
    duration: 2,
  },
  {
    name: "New Year's Eve",
    date: '2027-12-31',
    type: 'holiday',
    impact: 0.9,
  },
  {
    name: 'Winter Vacation Start',
    date: '2027-12-20',
    type: 'vacation',
    impact: 0.6,
    duration: 15,
    region: 'Schools',
  },
];

// ─── Utility Functions ─────────────────────────────────────────────────────────

/**
 * Get festivals for a specific year
 */
export function getFestivalsByYear(year: number): FestivalEntry[] {
  return festivalCalendar.filter((f) => f.date.startsWith(String(year)));
}

/**
 * Get festivals within a date range
 */
export function getFestivalsInRange(startDate: Date, endDate: Date): FestivalEntry[] {
  const start = startDate.toISOString().split('T')[0];
  const end = endDate.toISOString().split('T')[0];

  return festivalCalendar.filter((f) => f.date >= start && f.date <= end);
}

/**
 * Get festival by exact date
 */
export function getFestivalByDate(date: Date): FestivalEntry | undefined {
  const dateStr = date.toISOString().split('T')[0];
  return festivalCalendar.find((f) => f.date === dateStr);
}

/**
 * Convert festival calendar to LocalEvent format for pricing engine
 */
export function toLocalEvents(): Array<{
  name: string;
  type: 'festival' | 'holiday' | 'vacation' | 'conference' | 'sports' | 'concert' | 'other';
  date: Date;
  impact: number;
}> {
  return festivalCalendar.map((f) => ({
    name: f.name,
    type: f.type as 'festival' | 'holiday' | 'vacation' | 'conference' | 'sports' | 'concert' | 'other',
    date: new Date(f.date),
    impact: f.impact,
  }));
}

/**
 * Get the year range covered by the festival calendar
 */
export function getCalendarYearRange(): { minYear: number; maxYear: number } {
  const years = festivalCalendar.map((f) => parseInt(f.date.split('-')[0]));
  return {
    minYear: Math.min(...years),
    maxYear: Math.max(...years),
  };
}

/**
 * Check if the calendar needs updating
 */
export function needsUpdate(): boolean {
  const { maxYear } = getCalendarYearRange();
  const currentYear = new Date().getFullYear();
  // Consider needs update if we're within 1 year of the end
  return maxYear <= currentYear + 1;
}
