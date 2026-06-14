import { SCTE35Service } from '../services/scte35.js';

describe('SCTE35Service', () => {
  let scte35Service: SCTE35Service;

  beforeEach(() => {
    scte35Service = new SCTE35Service();
  });

  describe('getSegmentationTypeName', () => {
    it('should return correct name for break start', () => {
      const name = scte35Service.getSegmentationTypeName(0x20);
      expect(name).toBe('Break Start');
    });

    it('should return correct name for break end', () => {
      const name = scte35Service.getSegmentationTypeName(0x50);
      expect(name).toBe('Break End');
    });

    it('should return correct name for program start', () => {
      const name = scte35Service.getSegmentationTypeName(0x40);
      expect(name).toBe('Program Start');
    });

    it('should return Unknown for invalid type', () => {
      const name = scte35Service.getSegmentationTypeName(0x99);
      expect(name).toBe('Unknown');
    });
  });

  describe('generateSCTE35SpliceInsert', () => {
    it('should generate valid SCTE-35 splice insert hex', () => {
      const hexData = scte35Service.generateSCTE35SpliceInsert(100, 30);

      expect(hexData).toBeDefined();
      expect(typeof hexData).toBe('string');
      expect(hexData.length).toBeGreaterThan(0);
      expect(hexData).toMatch(/^[0-9a-f]+$/i);
    });

    it('should generate hex with correct event ID', () => {
      const eventId = 12345;
      const hexData = scte35Service.generateSCTE35SpliceInsert(eventId, 15);

      const eventIdHex = eventId.toString(16).padStart(8, '0');
      expect(hexData).toContain(eventIdHex);
    });

    it('should handle different break durations', () => {
      const hex1 = scte35Service.generateSCTE35SpliceInsert(1, 15);
      const hex2 = scte35Service.generateSCTE35SpliceInsert(1, 30);
      const hex3 = scte35Service.generateSCTE35SpliceInsert(1, 60);

      expect(hex1).not.toBe(hex2);
      expect(hex2).not.toBe(hex3);
    });

    it('should respect spliceExecuteFlag', () => {
      const hexWithExecute = scte35Service.generateSCTE35SpliceInsert(1, 30, true);
      const hexWithoutExecute = scte35Service.generateSCTE35SpliceInsert(1, 30, false);

      expect(hexWithExecute).not.toBe(hexWithoutExecute);
    });
  });

  describe('parseSCTE35Message', () => {
    it('should parse valid hex data', () => {
      const hexData = scte35Service.generateSCTE35SpliceInsert(100, 30);

      const result = (scte35Service as unknown as { parseSCTE35Message: (hex: string) => unknown }).parseSCTE35Message(hexData);

      expect(result).toBeDefined();
    });

    it('should handle minimal hex data', () => {
      const minimalHex = 'fc00000000000000';
      const result = (scte35Service as unknown as { parseSCTE35Message: (hex: string) => unknown }).parseSCTE35Message(minimalHex);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('spliceEventType');
    });
  });
});