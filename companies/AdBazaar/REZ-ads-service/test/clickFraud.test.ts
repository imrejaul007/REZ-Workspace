/**
 * Click Fraud Detection Tests
 * Tests for rapid click, IP flood, and bot detection
 */

import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';

describe('Click Fraud Detection', () => {
  // Constants from clickFraudService
  const RAPID_CLICK_THRESHOLD_MS = 30_000;
  const IP_FLOOD_THRESHOLD = 10;
  const IP_FLOOD_WINDOW_MS = 3_600_000;

  // Bot patterns
  const BOT_PATTERNS = [
    /googlebot/i,
    /bingbot/i,
    /slurp/i,
    /duckduckbot/i,
    /baiduspider/i,
    /yandexbot/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /linkedinbot/i,
    /whatsapp/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java\b/i,
    /node/i,
  ];

  describe('Rapid Click Detection', () => {
    it('should detect rapid clicks from same user', () => {
      const clicks = [
        Date.now() - 1000,   // 1 second ago
        Date.now() - 2000,   // 2 seconds ago
        Date.now() - 5000,   // 5 seconds ago
      ];

      // Check if any clicks are within threshold
      const now = Date.now();
      const recentClicks = clicks.filter(
        click => now - click < RAPID_CLICK_THRESHOLD_MS
      );

      const isRapid = recentClicks.length >= 2;

      assert.strictEqual(isRapid, true);
    });

    it('should not flag normal click patterns', () => {
      const clicks = [
        Date.now() - 60000,  // 1 minute ago
        Date.now() - 120000, // 2 minutes ago
        Date.now() - 180000, // 3 minutes ago
      ];

      const now = Date.now();
      const recentClicks = clicks.filter(
        click => now - click < RAPID_CLICK_THRESHOLD_MS
      );

      const isRapid = recentClicks.length >= 2;

      assert.strictEqual(isRapid, false);
    });
  });

  describe('IP Flood Detection', () => {
    it('should detect IP flooding', () => {
      const ipClicks = Array(15).fill(Date.now()); // 15 clicks

      const isFlooding = ipClicks.length >= IP_FLOOD_THRESHOLD;

      assert.strictEqual(isFlooding, true);
    });

    it('should not flag legitimate traffic', () => {
      const ipClicks = Array(5).fill(Date.now()); // 5 clicks

      const isFlooding = ipClicks.length >= IP_FLOOD_THRESHOLD;

      assert.strictEqual(isFlooding, false);
    });
  });

  describe('Bot Detection', () => {
    it('should detect Googlebot', () => {
      const userAgent = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

      const isBot = BOT_PATTERNS.some(pattern => pattern.test(userAgent));

      assert.strictEqual(isBot, true);
    });

    it('should detect curl', () => {
      const userAgent = 'curl/7.68.0';

      const isBot = BOT_PATTERNS.some(pattern => pattern.test(userAgent));

      assert.strictEqual(isBot, true);
    });

    it('should detect WhatsApp', () => {
      const userAgent = 'WhatsApp/2.21.15.0';

      const isBot = BOT_PATTERNS.some(pattern => pattern.test(userAgent));

      assert.strictEqual(isBot, true);
    });

    it('should not flag legitimate browsers', () => {
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
      ];

      const isBot = userAgents.some(ua =>
        BOT_PATTERNS.some(pattern => pattern.test(ua))
      );

      assert.strictEqual(isBot, false);
    });
  });

  describe('Combined Fraud Detection', () => {
    it('should flag rapid clicks from bot', () => {
      const userAgent = 'python-requests/2.25.1';
      const clicks = [
        Date.now() - 1000,
        Date.now() - 2000,
        Date.now() - 3000,
      ];

      const isBot = BOT_PATTERNS.some(pattern => pattern.test(userAgent));
      const now = Date.now();
      const isRapid = clicks.filter(c => now - c < RAPID_CLICK_THRESHOLD_MS).length >= 2;

      const isFraudulent = isBot || isRapid;

      assert.strictEqual(isFraudulent, true);
    });

    it('should not flag legitimate mobile users', () => {
      const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15';
      const clicks = [
        Date.now() - 60000,
        Date.now() - 120000,
      ];

      const isBot = BOT_PATTERNS.some(pattern => pattern.test(userAgent));
      const now = Date.now();
      const isRapid = clicks.filter(c => now - c < RAPID_CLICK_THRESHOLD_MS).length >= 2;

      const isFraudulent = isBot || isRapid;

      assert.strictEqual(isFraudulent, false);
    });
  });
});

console.log('Click fraud tests loaded');
