import { parseQRPayload, createQRPayload, validateShortcode, getModeFromShortcode } from '../../src/shared/services/qrParser';

describe('QR Parser', () => {
 describe('parseQRPayload', () => {
   it('should parse valid JSON payload', () => {
     const payload = {
       v: 1,
       type: 'safe',
       mode: 'pet',
       id: 'pet_abc123',
       shortcode: 'REZP01',
     };

     const result = parseQRPayload(JSON.stringify(payload));
     expect(result.success).toBe(true);
     expect(result.payload).toEqual(payload);
   });

   it('should parse object payload', () => {
     const payload = {
       v: 1,
       type: 'safe',
       mode: 'device',
       id: 'dev_xyz789',
       shortcode: 'REZD42',
     };

     const result = parseQRPayload(payload);
     expect(result.success).toBe(true);
     expect(result.payload?.mode).toBe('device');
   });

   it('should reject invalid payload', () => {
     const payload = {
       v: 2,
       type: 'invalid',
     };

     const result = parseQRPayload(payload);
     expect(result.success).toBe(false);
     expect(result.error).toBeDefined();
   });
 });

 describe('createQRPayload', () => {
   it('should create valid payload', () => {
     const payload = createQRPayload('REZP01', 'pet_abc123', 'pet');
     expect(payload).toEqual({
       v: 1,
       type: 'safe',
       mode: 'pet',
       id: 'pet_abc123',
       shortcode: 'REZP01',
     });
   });
 });

 describe('validateShortcode', () => {
   it('should validate correct shortcodes', () => {
     expect(validateShortcode('REZP01')).toBe(true);
     expect(validateShortcode('REZD42')).toBe(true);
     expect(validateShortcode('REZM99')).toBe(true);
   });

   it('should reject invalid shortcodes', () => {
     expect(validateShortcode('short')).toBe(false);
     expect(validateShortcode('REZP')).toBe(false);
     expect(validateShortcode('123456')).toBe(false);
   });
 });

 describe('getModeFromShortcode', () => {
   it('should return correct mode', () => {
     expect(getModeFromShortcode('REZP01')).toBe('pet');
     expect(getModeFromShortcode('REZD42')).toBe('device');
     expect(getModeFromShortcode('REZM07')).toBe('medical');
   });

   it('should return null for unknown prefix', () => {
     expect(getModeFromShortcode('XXXX01')).toBeNull();
   });
 });
});
