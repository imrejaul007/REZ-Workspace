/**
 * Config Tests
 */

import { config } from '../config';
import { logger } from '../config/logger';

describe('Config', () => {
  describe('config object', () => {
    it('should have port defined', () => {
      expect(config.port).toBeDefined();
      expect(typeof config.port).toBe('number');
    });

    it('should have nodeEnv defined', () => {
      expect(config.nodeEnv).toBeDefined();
      expect(typeof config.nodeEnv).toBe('string');
    });

    it('should have mongodb.uri defined', () => {
      expect(config.mongodb).toBeDefined();
      expect(config.mongodb.uri).toBeDefined();
      expect(typeof config.mongodb.uri).toBe('string');
    });

    it('should have hojai.staybotUrl defined', () => {
      expect(config.hojai).toBeDefined();
      expect(config.hojai.staybotUrl).toBeDefined();
    });

    it('should have rez.authUrl defined', () => {
      expect(config.rez).toBeDefined();
      expect(config.rez.authUrl).toBeDefined();
    });

    it('should have logging.level defined', () => {
      expect(config.logging).toBeDefined();
      expect(config.logging.level).toBeDefined();
    });
  });

  describe('logger', () => {
    it('should have debug method', () => {
      expect(typeof logger.debug).toBe('function');
    });

    it('should have info method', () => {
      expect(typeof logger.info).toBe('function');
    });

    it('should have warn method', () => {
      expect(typeof logger.warn).toBe('function');
    });

    it('should have error method', () => {
      expect(typeof logger.error).toBe('function');
    });

    it('should log info messages without throwing', () => {
      expect(() => logger.info('Test message')).not.toThrow();
    });

    it('should log info with metadata', () => {
      expect(() => logger.info('Test message', { key: 'value' })).not.toThrow();
    });

    it('should log error messages', () => {
      expect(() => logger.error('Error message')).not.toThrow();
    });

    it('should log warn messages', () => {
      expect(() => logger.warn('Warning message')).not.toThrow();
    });

    it('should log debug messages', () => {
      expect(() => logger.debug('Debug message')).not.toThrow();
    });
  });
});