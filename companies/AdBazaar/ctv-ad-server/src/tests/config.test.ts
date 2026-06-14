import { config } from '../config/index.js';

describe('Config', () => {
  it('should have correct default port', () => {
    expect(config.port).toBe(4702);
  });

  it('should have MongoDB URI configured', () => {
    expect(config.mongodb.uri).toBeDefined();
    expect(config.mongodb.uri).toContain('ctv-ad-server');
  });

  it('should have Redis URL configured', () => {
    expect(config.redis.url).toBeDefined();
    expect(config.redis.url).toContain('redis');
  });

  it('should have JWT secret configured', () => {
    expect(config.jwt.secret).toBeDefined();
    expect(config.jwt.secret.length).toBeGreaterThan(10);
  });

  it('should have VAST version set', () => {
    expect(config.vast.version).toBe('4.2');
  });

  it('should have ad decision timeout configured', () => {
    expect(config.adDecision.timeout).toBe(100);
    expect(config.adDecision.defaultSkipOffset).toBe(5);
  });

  it('should have pacing configuration', () => {
    expect(config.pacing.checkInterval).toBe(60000);
    expect(config.pacing.defaultDailyPacingPercent).toBe(100);
  });

  it('should have frequency capping defaults', () => {
    expect(config.frequency.defaultWindowHours).toBe(24);
    expect(config.frequency.defaultMaxImpressions).toBe(4);
  });

  it('should have metrics configuration', () => {
    expect(config.metrics.enabled).toBe(true);
    expect(config.metrics.prefix).toBe('ctv_ad_server_');
  });

  it('should have node env configured', () => {
    expect(config.nodeEnv).toBeDefined();
    expect(['development', 'production', 'test']).toContain(config.nodeEnv);
  });
});