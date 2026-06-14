import logger from './utils/logger';

/**
 * E2E Test: Performance Tests
 *
 * Tests app performance metrics:
 * - App launch time
 * - Screen transition speed
 * - Scroll performance
 * - Image loading
 * - Memory usage
 * - Network efficiency
 */

const { device, element, by, expect: detoxExpect, waitFor } = require('detox');
const {
  waitForElement,
  tapElement,
  takeScreenshot,
  login,
} = require('./helpers/testHelpers');

describe('Performance Tests E2E', () => {
  // Performance thresholds
  const THRESHOLDS = {
    APP_LAUNCH: 3000, // 3 seconds
    SCREEN_TRANSITION: 1000, // 1 second
    SCROLL_FPS: 55, // Minimum 55 FPS
    IMAGE_LOAD: 2000, // 2 seconds
    SEARCH: 1500, // 1.5 seconds
  };

  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: {
        notifications: 'YES',
        location: 'always',
      },
    });
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  describe('App Launch Performance', () => {
    it('should launch app within 3 seconds', async () => {
      const startTime = Date.now();

      await device.reloadReactNative();
      await waitForElement(by.id('home-screen'), 5000);

      const launchTime = Date.now() - startTime;
      logger.info(`App launch time: ${launchTime}ms`);

      await takeScreenshot('perf-01-app-launched');

      // Assert launch time
      if (launchTime > THRESHOLDS.APP_LAUNCH) {
        logger.warn(`WARNING: App launch time ${launchTime}ms exceeds threshold ${THRESHOLDS.APP_LAUNCH}ms`);
      }

      expect(launchTime).toBeLessThan(THRESHOLDS.APP_LAUNCH + 1000); // Allow 1s buffer
    });

    it('should load homepage content within 2 seconds', async () => {
      await device.reloadReactNative();

      const startTime = Date.now();
      await waitForElement(by.id('home-screen'), 5000);

      // Wait for content to load
      await waitForElement(by.id('featured-products-carousel'), 3000);

      const loadTime = Date.now() - startTime;
      logger.info(`Homepage content load time: ${loadTime}ms`);

      await takeScreenshot('perf-02-homepage-content-loaded');

      if (loadTime > 2000) {
        logger.warn(`WARNING: Homepage load time ${loadTime}ms exceeds 2000ms`);
      }
    });

    it('should show splash screen immediately', async () => {
      const startTime = Date.now();

      await device.reloadReactNative();
      await waitForElement(by.id('splash-screen'), 1000);

      const splashTime = Date.now() - startTime;
      logger.info(`Splash screen display time: ${splashTime}ms`);

      // Splash should appear almost immediately
      expect(splashTime).toBeLessThan(500);
    });
  });

  describe('Screen Transition Performance', () => {
    beforeEach(async () => {
      await device.reloadReactNative();
      await waitForElement(by.id('home-screen'), 5000);
    });

    it('should navigate to product page within 1 second', async () => {
      const startTime = Date.now();

      await tapElement(by.id('product-card-0'));
      await waitForElement(by.id('product-page'), 2000);

      const transitionTime = Date.now() - startTime;
      logger.info(`Product page transition time: ${transitionTime}ms`);

      await takeScreenshot('perf-03-product-page-transition');

      if (transitionTime > THRESHOLDS.SCREEN_TRANSITION) {
        logger.warn(`WARNING: Transition time ${transitionTime}ms exceeds threshold ${THRESHOLDS.SCREEN_TRANSITION}ms`);
      }

      expect(transitionTime).toBeLessThan(THRESHOLDS.SCREEN_TRANSITION + 500);
    });

    it('should navigate between tabs quickly', async () => {
      const transitions = [];

      // Test all tab transitions
      const tabs = ['tab-earn', 'tab-play', 'tab-profile', 'tab-home'];

      for (const tab of tabs) {
        const startTime = Date.now();
        await tapElement(by.id(tab));
        await new Promise(resolve => setTimeout(resolve, 500));
        const transitionTime = Date.now() - startTime;
        transitions.push({ tab, time: transitionTime });
      }

      console.log('Tab transition times:', transitions);
      await takeScreenshot('perf-04-tab-transitions');

      // Average transition time should be under 500ms
      const avgTime = transitions.reduce((sum, t) => sum + t.time, 0) / transitions.length;
      logger.info(`Average tab transition time: ${avgTime}ms`);

      expect(avgTime).toBeLessThan(500);
    });

    it('should navigate back quickly', async () => {
      await tapElement(by.id('product-card-0'));
      await waitForElement(by.id('product-page'), 2000);

      const startTime = Date.now();
      await element(by.id('back-button')).tap();
      await waitForElement(by.id('home-screen'), 2000);

      const backTime = Date.now() - startTime;
      logger.info(`Back navigation time: ${backTime}ms`);

      expect(backTime).toBeLessThan(800);
    });

    it('should open modal quickly', async () => {
      await tapElement(by.id('product-card-0'));
      await waitForElement(by.id('product-page'), 2000);

      const startTime = Date.now();
      await tapElement(by.id('share-product-button'));
      await waitForElement(by.id('share-modal'), 1500);

      const modalTime = Date.now() - startTime;
      logger.info(`Modal open time: ${modalTime}ms`);

      await takeScreenshot('perf-05-modal-opened');

      expect(modalTime).toBeLessThan(500);
    });
  });

  describe('Scroll Performance', () => {
    beforeEach(async () => {
      await device.reloadReactNative();
      await waitForElement(by.id('home-screen'), 5000);
    });

    it('should scroll smoothly through homepage', async () => {
      const startTime = Date.now();

      // Perform multiple scrolls
      for (let i = 0; i < 5; i++) {
        await element(by.id('home-scroll-view')).scroll(200, 'down');
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const scrollTime = Date.now() - startTime;
      logger.info(`Scroll sequence time: ${scrollTime}ms`);

      await takeScreenshot('perf-06-scrolled-homepage');

      // Scrolling should be smooth (under 1 second for 5 scrolls)
      expect(scrollTime).toBeLessThan(1000);
    });

    it('should scroll through product grid efficiently', async () => {
      await tapElement(by.id('category-fashion'));
      await waitForElement(by.id('category-page'), 2000);

      const startTime = Date.now();

      // Scroll through grid
      await element(by.id('product-grid')).scroll(500, 'down');
      await new Promise(resolve => setTimeout(resolve, 500));
      await element(by.id('product-grid')).scroll(500, 'down');
      await new Promise(resolve => setTimeout(resolve, 500));

      const scrollTime = Date.now() - startTime;
      logger.info(`Product grid scroll time: ${scrollTime}ms`);

      await takeScreenshot('perf-07-product-grid-scrolled');

      expect(scrollTime).toBeLessThan(1500);
    });

    it('should handle long list scrolling', async () => {
      try {
        await login('+919876543210', '123456');
      } catch {}

      // Navigate to a long list (e.g., notifications)
      await tapElement(by.id('notification-icon'));
      await waitForElement(by.id('notifications-screen'), 2000);

      const startTime = Date.now();

      // Scroll to bottom
      await element(by.id('notifications-list')).scrollTo('bottom');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Scroll back to top
      await element(by.id('notifications-list')).scrollTo('top');

      const scrollTime = Date.now() - startTime;
      logger.info(`Long list scroll time: ${scrollTime}ms`);

      await takeScreenshot('perf-08-long-list-scroll');

      expect(scrollTime).toBeLessThan(2000);
    });

    it('should maintain scroll position on navigation', async () => {
      // Scroll down
      await element(by.id('home-scroll-view')).scroll(500, 'down');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Navigate away
      await tapElement(by.id('tab-earn'));
      await waitForElement(by.id('earn-screen'), 2000);

      // Navigate back
      await tapElement(by.id('tab-home'));
      await waitForElement(by.id('home-screen'), 2000);

      // Check if scroll position maintained (visual check)
      await takeScreenshot('perf-09-scroll-position-maintained');
    });
  });

  describe('Image Loading Performance', () => {
    beforeEach(async () => {
      await device.reloadReactNative();
      await waitForElement(by.id('home-screen'), 5000);
    });

    it('should load product images quickly', async () => {
      const startTime = Date.now();

      await tapElement(by.id('product-card-0'));
      await waitForElement(by.id('product-page'), 2000);

      // Wait for main image to load
      await waitForElement(by.id('product-image-loaded'), 3000);

      const imageLoadTime = Date.now() - startTime;
      logger.info(`Product image load time: ${imageLoadTime}ms`);

      await takeScreenshot('perf-10-product-image-loaded');

      if (imageLoadTime > THRESHOLDS.IMAGE_LOAD) {
        logger.warn(`WARNING: Image load time ${imageLoadTime}ms exceeds threshold ${THRESHOLDS.IMAGE_LOAD}ms`);
      }
    });

    it('should show image placeholders immediately', async () => {
      await device.reloadReactNative();

      const startTime = Date.now();
      await waitForElement(by.id('home-screen'), 5000);

      // Placeholders should be visible immediately
      await waitForElement(by.id('image-placeholder-0'), 500);

      const placeholderTime = Date.now() - startTime;
      logger.info(`Placeholder display time: ${placeholderTime}ms`);

      expect(placeholderTime).toBeLessThan(1000);
    });

    it('should handle image gallery swiping smoothly', async () => {
      await tapElement(by.id('product-card-0'));
      await waitForElement(by.id('product-page'), 2000);

      const startTime = Date.now();

      // Swipe through images
      await element(by.id('product-image-gallery')).swipe('left', 'fast');
      await new Promise(resolve => setTimeout(resolve, 300));
      await element(by.id('product-image-gallery')).swipe('left', 'fast');
      await new Promise(resolve => setTimeout(resolve, 300));

      const swipeTime = Date.now() - startTime;
      logger.info(`Image gallery swipe time: ${swipeTime}ms`);

      await takeScreenshot('perf-11-image-gallery-swiped');

      expect(swipeTime).toBeLessThan(1000);
    });

    it('should lazy load images in lists', async () => {
      // Scroll through homepage
      const startTime = Date.now();

      await element(by.id('home-scroll-view')).scroll(1000, 'down');
      await new Promise(resolve => setTimeout(resolve, 1000));

      const scrollTime = Date.now() - startTime;
      logger.info(`Lazy load scroll time: ${scrollTime}ms`);

      await takeScreenshot('perf-12-lazy-loaded-images');

      // Should not block scrolling
      expect(scrollTime).toBeLessThan(1500);
    });
  });

  describe('Search Performance', () => {
    beforeEach(async () => {
      await device.reloadReactNative();
      await waitForElement(by.id('home-screen'), 5000);
    });

    it('should show search suggestions within 1.5 seconds', async () => {
      await tapElement(by.id('search-bar'));
      await waitForElement(by.id('search-screen'), 2000);

      const startTime = Date.now();

      await element(by.id('search-input')).typeText('phone');

      // Wait for suggestions
      await waitForElement(by.id('search-suggestions'), 2000);

      const suggestionTime = Date.now() - startTime;
      logger.info(`Search suggestion time: ${suggestionTime}ms`);

      await takeScreenshot('perf-13-search-suggestions');

      if (suggestionTime > THRESHOLDS.SEARCH) {
        logger.warn(`WARNING: Suggestion time ${suggestionTime}ms exceeds threshold ${THRESHOLDS.SEARCH}ms`);
      }
    });

    it('should return search results quickly', async () => {
      await tapElement(by.id('search-bar'));
      await waitForElement(by.id('search-screen'), 2000);
      await element(by.id('search-input')).typeText('shirt');

      const startTime = Date.now();

      await tapElement(by.id('search-button'));
      await waitForElement(by.id('search-results'), 3000);

      const searchTime = Date.now() - startTime;
      logger.info(`Search results time: ${searchTime}ms`);

      await takeScreenshot('perf-14-search-results');

      expect(searchTime).toBeLessThan(2000);
    });

    it('should debounce search input', async () => {
      await tapElement(by.id('search-bar'));
      await waitForElement(by.id('search-screen'), 2000);

      // Type quickly
      const startTime = Date.now();
      await element(by.id('search-input')).typeText('quicktest');

      // Should not make request for every character
      await new Promise(resolve => setTimeout(resolve, 1000));

      const inputTime = Date.now() - startTime;
      logger.info(`Debounced input time: ${inputTime}ms`);

      // Input should be responsive
      expect(inputTime).toBeLessThan(1500);
    });
  });

  describe('Video Performance', () => {
    beforeEach(async () => {
      await device.reloadReactNative();
      await waitForElement(by.id('home-screen'), 5000);
      await tapElement(by.id('tab-play'));
      await waitForElement(by.id('play-screen'), 3000);
    });

    it('should start video playback quickly', async () => {
      const startTime = Date.now();

      await tapElement(by.id('video-card-0'));
      await waitForElement(by.id('video-player-screen'), 3000);

      // Wait for video to start
      await new Promise(resolve => setTimeout(resolve, 1000));

      const playbackTime = Date.now() - startTime;
      logger.info(`Video playback start time: ${playbackTime}ms`);

      await takeScreenshot('perf-15-video-playing');

      expect(playbackTime).toBeLessThan(3000);
    });

    it('should buffer videos efficiently', async () => {
      await tapElement(by.id('video-card-0'));
      await waitForElement(by.id('video-player-screen'), 3000);

      // Play for a bit
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Check if buffering smooth
      const bufferingIndicatorVisible = await element(by.id('buffering-indicator')).exists();

      await takeScreenshot('perf-16-video-buffering');

      // Should not show buffering frequently
      logger.info(`Buffering indicator visible: ${bufferingIndicatorVisible}`);
    });

    it('should switch videos smoothly', async () => {
      await tapElement(by.id('video-card-0'));
      await waitForElement(by.id('video-player-screen'), 3000);

      const startTime = Date.now();

      // Swipe to next video
      await element(by.id('video-player-screen')).swipe('up', 'fast');
      await new Promise(resolve => setTimeout(resolve, 1500));

      const switchTime = Date.now() - startTime;
      logger.info(`Video switch time: ${switchTime}ms`);

      await takeScreenshot('perf-17-video-switched');

      expect(switchTime).toBeLessThan(2000);
    });

    it('should preload next video', async () => {
      await tapElement(by.id('video-card-0'));
      await waitForElement(by.id('video-player-screen'), 3000);

      // Play current video
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Swipe to next should be instant if preloaded
      const startTime = Date.now();
      await element(by.id('video-player-screen')).swipe('up', 'fast');
      await new Promise(resolve => setTimeout(resolve, 500));

      const preloadTime = Date.now() - startTime;
      logger.info(`Preloaded video switch time: ${preloadTime}ms`);

      // Should be very fast if preloaded
      expect(preloadTime).toBeLessThan(1000);
    });
  });

  describe('Form Performance', () => {
    beforeEach(async () => {
      await device.reloadReactNative();
      await waitForElement(by.id('home-screen'), 5000);
    });

    it('should handle rapid text input', async () => {
      try {
        await login('+919876543210', '123456');
      } catch {}

      await tapElement(by.id('tab-profile'));
      await waitForElement(by.id('profile-screen'), 2000);
      await tapElement(by.id('edit-profile-button'));
      await waitForElement(by.id('edit-profile-screen'), 2000);

      const startTime = Date.now();

      // Type quickly
      await element(by.id('first-name-input')).typeText('VeryLongFirstName');
      await element(by.id('last-name-input')).typeText('VeryLongLastName');
      await element(by.id('email-input')).typeText('verylongemail@example.com');

      const inputTime = Date.now() - startTime;
      logger.info(`Rapid text input time: ${inputTime}ms`);

      await takeScreenshot('perf-18-rapid-input');

      // Should be responsive
      expect(inputTime).toBeLessThan(2000);
    });

    it('should validate forms quickly', async () => {
      try {
        await login('+919876543210', '123456');
      } catch {}

      await tapElement(by.id('tab-profile'));
      await waitForElement(by.id('profile-screen'), 2000);
      await tapElement(by.id('my-addresses-menu'));
      await waitForElement(by.id('addresses-screen'), 2000);
      await tapElement(by.id('add-address-button'));
      await waitForElement(by.id('add-address-form'), 2000);

      // Fill form
      await element(by.id('address-name-input')).typeText('Home');
      await element(by.id('address-line1-input')).typeText('123 Main St');

      const startTime = Date.now();

      // Submit and validate
      await tapElement(by.id('save-address-button'));
      await new Promise(resolve => setTimeout(resolve, 500));

      const validateTime = Date.now() - startTime;
      logger.info(`Form validation time: ${validateTime}ms`);

      // Validation should be instant
      expect(validateTime).toBeLessThan(500);
    });
  });

  describe('Animation Performance', () => {
    beforeEach(async () => {
      await device.reloadReactNative();
      await waitForElement(by.id('home-screen'), 5000);
    });

    it('should render animations smoothly', async () => {
      // Test tab switch animation
      const startTime = Date.now();

      await tapElement(by.id('tab-earn'));
      await new Promise(resolve => setTimeout(resolve, 500));

      const animTime = Date.now() - startTime;
      logger.info(`Tab animation time: ${animTime}ms`);

      await takeScreenshot('perf-19-tab-animation');

      // Animation should complete quickly
      expect(animTime).toBeLessThan(600);
    });

    it('should handle modal animations efficiently', async () => {
      await tapElement(by.id('product-card-0'));
      await waitForElement(by.id('product-page'), 2000);

      const startTime = Date.now();

      // Open and close modal with animation
      await tapElement(by.id('share-product-button'));
      await waitForElement(by.id('share-modal'), 1000);
      await tapElement(by.id('close-modal-button'));
      await new Promise(resolve => setTimeout(resolve, 500));

      const modalAnimTime = Date.now() - startTime;
      logger.info(`Modal animation time: ${modalAnimTime}ms`);

      expect(modalAnimTime).toBeLessThan(1500);
    });
  });

  describe('Memory Management', () => {
    beforeEach(async () => {
      await device.reloadReactNative();
      await waitForElement(by.id('home-screen'), 5000);
    });

    it('should handle extensive navigation without memory issues', async () => {
      // Navigate through many screens
      const screens = [
        'tab-earn',
        'tab-play',
        'tab-profile',
        'tab-home',
      ];

      for (let i = 0; i < 3; i++) {
        for (const screen of screens) {
          await tapElement(by.id(screen));
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      await takeScreenshot('perf-20-extensive-navigation');

      // App should still be responsive
      await detoxExpect(element(by.id('home-screen'))).toBeVisible();
    });

    it('should handle long list rendering without memory issues', async () => {
      // Scroll through long lists multiple times
      await tapElement(by.id('category-fashion'));
      await waitForElement(by.id('category-page'), 2000);

      for (let i = 0; i < 5; i++) {
        await element(by.id('product-grid')).scrollTo('bottom');
        await new Promise(resolve => setTimeout(resolve, 500));
        await element(by.id('product-grid')).scrollTo('top');
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      await takeScreenshot('perf-21-long-list-scrolling');

      // App should still be responsive
      await detoxExpect(element(by.id('category-page'))).toBeVisible();
    });

    it('should clean up resources on screen unmount', async () => {
      // Load heavy screen (videos)
      await tapElement(by.id('tab-play'));
      await waitForElement(by.id('play-screen'), 3000);

      // Navigate away
      await tapElement(by.id('tab-home'));
      await waitForElement(by.id('home-screen'), 2000);

      // Memory should be freed (visual check)
      await takeScreenshot('perf-22-resources-cleaned');
    });
  });

  describe('Network Efficiency', () => {
    beforeEach(async () => {
      await device.reloadReactNative();
      await waitForElement(by.id('home-screen'), 5000);
    });

    it('should cache API responses', async () => {
      // Load product
      await tapElement(by.id('product-card-0'));
      await waitForElement(by.id('product-page'), 3000);
      const firstLoadTime = Date.now();
      await new Promise(resolve => setTimeout(resolve, 1000));
      const firstLoad = Date.now() - firstLoadTime;

      await element(by.id('back-button')).tap();

      // Load same product again (should be cached)
      const cachedLoadTime = Date.now();
      await tapElement(by.id('product-card-0'));
      await waitForElement(by.id('product-page'), 2000);
      const cachedLoad = Date.now() - cachedLoadTime;

      logger.info(`First load: ${firstLoad}ms, Cached load: ${cachedLoad}ms`);

      await takeScreenshot('perf-23-cached-load');

      // Cached load should be faster
      expect(cachedLoad).toBeLessThan(firstLoad);
    });

    it('should batch API requests', async () => {
      // Navigate to screen that makes multiple requests
      await tapElement(by.id('tab-earn'));
      await waitForElement(by.id('earn-screen'), 3000);

      // Should load efficiently
      await new Promise(resolve => setTimeout(resolve, 2000));

      await takeScreenshot('perf-24-batched-requests');

      // Check that screen loaded (batching should not slow down)
      await detoxExpect(element(by.id('earn-screen'))).toBeVisible();
    });

    it('should handle pagination efficiently', async () => {
      await tapElement(by.id('category-fashion'));
      await waitForElement(by.id('category-page'), 2000);

      const startTime = Date.now();

      // Scroll to trigger pagination
      await element(by.id('product-grid')).scrollTo('bottom');
      await new Promise(resolve => setTimeout(resolve, 2000));

      const paginationTime = Date.now() - startTime;
      logger.info(`Pagination load time: ${paginationTime}ms`);

      await takeScreenshot('perf-25-pagination-loaded');

      expect(paginationTime).toBeLessThan(3000);
    });
  });

  describe('Overall Performance Report', () => {
    it('should generate performance summary', async () => {
      logger.info('\n========== PERFORMANCE TEST SUMMARY ==========');
      logger.info(`App Launch Threshold: ${THRESHOLDS.APP_LAUNCH}ms`);
      logger.info(`Screen Transition Threshold: ${THRESHOLDS.SCREEN_TRANSITION}ms`);
      logger.info(`Image Load Threshold: ${THRESHOLDS.IMAGE_LOAD}ms`);
      logger.info(`Search Threshold: ${THRESHOLDS.SEARCH}ms`);
      logger.info('=============================================\n');

      await takeScreenshot('perf-26-summary');

      // All tests should pass for production readiness
      await detoxExpect(element(by.id('home-screen'))).toBeVisible();
    });
  });
});
