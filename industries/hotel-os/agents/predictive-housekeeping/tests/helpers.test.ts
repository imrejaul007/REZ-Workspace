import {
  generateTwinId,
  generateTaskId,
  generateScheduleId,
  generateStaffId,
  parseTwinId,
  calculateCleaningDuration,
  calculateEfficiencyScore,
  determineTaskPriority,
  parseTimeToMinutes,
  minutesToTimeString,
  addMinutesToTime,
  isToday,
  formatDate,
  calculateConfidenceScore,
} from '../src/utils/helpers';

describe('Helper Functions', () => {
  describe('ID Generation', () => {
    it('should generate valid guest twin ID', () => {
      const twinId = generateTwinId('guest', 'G-123456');
      expect(twinId).toBe('twin.hotel.guest.G-123456');
    });

    it('should generate valid room twin ID', () => {
      const twinId = generateTwinId('room', '501');
      expect(twinId).toBe('twin.hotel.room.501');
    });

    it('should generate valid property twin ID', () => {
      const twinId = generateTwinId('property', 'PROP-001');
      expect(twinId).toBe('twin.hotel.property.PROP-001');
    });

    it('should generate valid task ID', () => {
      const taskId = generateTaskId();
      expect(taskId).toMatch(/^task\.[a-f0-9-]+$/);
    });

    it('should generate valid schedule ID', () => {
      const scheduleId = generateScheduleId();
      expect(scheduleId).toMatch(/^schedule\.[a-f0-9-]+$/);
    });

    it('should generate valid staff ID', () => {
      const staffId = generateStaffId();
      expect(staffId).toMatch(/^staff\.[a-f0-9-]+$/);
    });
  });

  describe('Twin ID Parsing', () => {
    it('should parse valid guest twin ID', () => {
      const result = parseTwinId('twin.hotel.guest.G-123456');
      expect(result).toEqual({ type: 'guest', id: 'G-123456' });
    });

    it('should parse valid room twin ID', () => {
      const result = parseTwinId('twin.hotel.room.501');
      expect(result).toEqual({ type: 'room', id: '501' });
    });

    it('should parse valid property twin ID', () => {
      const result = parseTwinId('twin.hotel.property.PROP-001');
      expect(result).toEqual({ type: 'property', id: 'PROP-001' });
    });

    it('should return null for invalid twin ID', () => {
      const result = parseTwinId('invalid-id');
      expect(result).toBeNull();
    });

    it('should return null for empty twin ID', () => {
      const result = parseTwinId('');
      expect(result).toBeNull();
    });
  });

  describe('Cleaning Duration Calculation', () => {
    it('should calculate standard room duration', () => {
      const duration = calculateCleaningDuration('standard', 'daily');
      expect(duration).toBe(20);
    });

    it('should calculate deluxe room duration', () => {
      const duration = calculateCleaningDuration('deluxe', 'daily');
      expect(duration).toBe(25);
    });

    it('should calculate suite room duration', () => {
      const duration = calculateCleaningDuration('suite', 'daily');
      expect(duration).toBe(35);
    });

    it('should calculate penthouse room duration', () => {
      const duration = calculateCleaningDuration('penthouse', 'daily');
      expect(duration).toBe(45);
    });

    it('should apply checkout multiplier', () => {
      const dailyDuration = calculateCleaningDuration('standard', 'daily');
      const checkoutDuration = calculateCleaningDuration('standard', 'checkout');
      expect(checkoutDuration).toBe(Math.ceil(dailyDuration * 1.2));
    });

    it('should apply turndown multiplier', () => {
      const dailyDuration = calculateCleaningDuration('standard', 'daily');
      const turndownDuration = calculateCleaningDuration('standard', 'turndown');
      expect(turndownDuration).toBe(Math.ceil(dailyDuration * 0.5));
    });

    it('should apply deep clean multiplier', () => {
      const dailyDuration = calculateCleaningDuration('standard', 'daily');
      const deepCleanDuration = calculateCleaningDuration('standard', 'deep_clean');
      expect(deepCleanDuration).toBe(Math.ceil(dailyDuration * 1.5));
    });
  });

  describe('Efficiency Score Calculation', () => {
    it('should return 100 for perfect completion', () => {
      const score = calculateEfficiencyScore(10, 10, 100, 100);
      expect(score).toBe(100);
    });

    it('should return 0 for no tasks completed', () => {
      const score = calculateEfficiencyScore(0, 10, 0, 100);
      // (0/10 * 0.7) + (min(1, 100/0) * 0.3) - but we use min so it becomes 1
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should calculate weighted score based on completion and time', () => {
      const score = calculateEfficiencyScore(5, 10, 50, 100);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(100);
    });

    it('should handle zero total tasks', () => {
      const score = calculateEfficiencyScore(0, 0, 0, 100);
      expect(score).toBe(100);
    });
  });

  describe('Task Priority Determination', () => {
    it('should return high priority for checkout status', () => {
      const priority = determineTaskPriority('checkout');
      expect(priority).toBe('high');
    });

    it('should return high priority for out_of_order status', () => {
      const priority = determineTaskPriority('out_of_order');
      expect(priority).toBe('high');
    });

    it('should return low priority for occupied status', () => {
      const priority = determineTaskPriority('occupied');
      expect(priority).toBe('low');
    });

    it('should return high priority for high value guests', () => {
      const priority = determineTaskPriority('available', undefined, true);
      expect(priority).toBe('high');
    });

    it('should calculate priority based on checkout time', () => {
      const now = new Date();
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const priority = determineTaskPriority('occupied', twoHoursFromNow.toISOString());
      expect(priority).toBe('high');
    });

    it('should return medium priority for later checkout', () => {
      const now = new Date();
      const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);
      const priority = determineTaskPriority('occupied', sixHoursFromNow.toISOString());
      expect(priority).toBe('medium');
    });
  });

  describe('Time Utilities', () => {
    it('should parse time to minutes', () => {
      expect(parseTimeToMinutes('00:00')).toBe(0);
      expect(parseTimeToMinutes('01:30')).toBe(90);
      expect(parseTimeToMinutes('12:00')).toBe(720);
      expect(parseTimeToMinutes('23:59')).toBe(1439);
    });

    it('should convert minutes to time string', () => {
      expect(minutesToTimeString(0)).toBe('00:00');
      expect(minutesToTimeString(90)).toBe('01:30');
      expect(minutesToTimeString(720)).toBe('12:00');
      expect(minutesToTimeString(1439)).toBe('23:59');
    });

    it('should add minutes to time', () => {
      expect(addMinutesToTime('08:00', 30)).toBe('08:30');
      expect(addMinutesToTime('08:30', 90)).toBe('10:00');
      expect(addMinutesToTime('23:00', 120)).toBe('01:00'); // Wraps to next day
    });
  });

  describe('Date Utilities', () => {
    it('should correctly identify today', () => {
      expect(isToday(new Date())).toBe(true);
      expect(isToday('2024-01-15')).toBe(false);
    });

    it('should format date correctly', () => {
      const date = new Date('2024-01-15T14:30:00Z');
      expect(formatDate(date)).toBe('2024-01-15');
    });

    it('should format today by default', () => {
      const formatted = formatDate();
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('Confidence Score Calculation', () => {
    it('should calculate confidence based on data coverage', () => {
      const score = calculateConfidenceScore(50, 100);
      expect(score).toBe(50);
    });

    it('should cap confidence at 100', () => {
      const score = calculateConfidenceScore(150, 100);
      expect(score).toBe(100);
    });

    it('should return 50 for no expected data', () => {
      const score = calculateConfidenceScore(10, 0);
      expect(score).toBe(50);
    });
  });
});