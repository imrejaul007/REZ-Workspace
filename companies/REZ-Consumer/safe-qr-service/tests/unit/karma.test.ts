import { karmaConfig, getKarmaLevel, calculateFoundPoints } from '../../src/config/karma';

describe('Karma Configuration', () => {
 describe('getKarmaLevel', () => {
   it('should return Newbie for 0 points', () => {
     const level = getKarmaLevel(0);
     expect(level.name).toBe('Newbie');
   });

   it('should return Active for 10 points', () => {
     const level = getKarmaLevel(10);
     expect(level.name).toBe('Active');
   });

   it('should return Contributor for 50 points', () => {
     const level = getKarmaLevel(50);
     expect(level.name).toBe('Contributor');
   });

   it('should return Helper for 200 points', () => {
     const level = getKarmaLevel(200);
     expect(level.name).toBe('Helper');
   });

   it('should return Guardian for 500 points', () => {
     const level = getKarmaLevel(500);
     expect(level.name).toBe('Guardian');
   });

   it('should return Hero for 1000 points', () => {
     const level = getKarmaLevel(1000);
     expect(level.name).toBe('Hero');
   });

   it('should return Legend for 5000 points', () => {
     const level = getKarmaLevel(5000);
     expect(level.name).toBe('Legend');
   });
 });

 describe('calculateFoundPoints', () => {
   it('should split points equally between helpers', () => {
     const points = calculateFoundPoints(2, {
       helper1: 50,
       helper2: 50,
     });

     expect(points.helper1).toBe(12); // 25 * 0.5 = 12.5 -> 12
     expect(points.helper2).toBe(12);
   });

   it('should calculate weighted points', () => {
     const points = calculateFoundPoints(3, {
       helper1: 60,
       helper2: 30,
       helper3: 10,
     });

     expect(points.helper1).toBe(15); // 25 * 0.6 = 15
     expect(points.helper2).toBe(7); // 25 * 0.3 = 7.5 -> 7
     expect(points.helper3).toBe(2); // 25 * 0.1 = 2.5 -> 2
   });
 });

 describe('karmaConfig', () => {
   it('should have correct earning values', () => {
     expect(karmaConfig.earned.receiveHelpMessage).toBe(5);
     expect(karmaConfig.earned.itemFoundWithHelp).toBe(25);
     expect(karmaConfig.earned.reportSuspicious).toBe(10);
     expect(karmaConfig.earned.emergencyAssist).toBe(50);
   });

   it('should have correct penalty values', () => {
     expect(karmaConfig.penalties.abusiveMessage).toBe(-20);
     expect(karmaConfig.penalties.spamReport).toBe(-30);
     expect(karmaConfig.penalties.falseEmergency).toBe(-100);
   });
 });
});
