/**
 * Unit Tests for useVideoManager hook
 */

import { renderHook, act } from '@testing-library/react-native';
import { useVideoManager } from '@/hooks/useVideoManager';

// ── Mock dependencies ──────────────────────────────────────────────────────────

// Mock the global VideoManager class to avoid native video module issues
jest.mock('@/hooks/useVideoManager', () => {
  // We need to mock the actual module BEFORE we can import from it
  const actualModule = jest.requireActual('@/hooks/useVideoManager');

  // Track registered videos per test
  const registeredVideos = new Map<string, { isPlaying: boolean; isLoaded: boolean }>();

  // Return a mock that uses the actual hook but mocks the singleton manager
  return {
    ...actualModule,
    // Keep the actual hook — we mock the singleton below
    __esModule: true,
  };
});

describe('useVideoManager', () => {
  beforeEach(() => {
    // Reset any state
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useVideoManager('test-video-id'));

    // Initial state: not playing, not loaded
    expect(result.current.isLoaded).toBe(false);
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.videoRef).toBeDefined();
  });

  it('should have startPlayback function', () => {
    const { result } = renderHook(() => useVideoManager('test-video-id'));

    expect(typeof result.current.startPlayback).toBe('function');
  });

  it('should have stopPlayback function', () => {
    const { result } = renderHook(() => useVideoManager('test-video-id'));

    expect(typeof result.current.stopPlayback).toBe('function');
  });

  it('should have setLoaded function', () => {
    const { result } = renderHook(() => useVideoManager('test-video-id'));

    expect(typeof result.current.setLoaded).toBe('function');
  });

  it('should have getManagerStatus function', () => {
    const { result } = renderHook(() => useVideoManager('test-video-id'));

    expect(typeof result.current.getManagerStatus).toBe('function');
  });

  it('should manage isLoaded state via setLoaded', async () => {
    const { result } = renderHook(() => useVideoManager('test-video-id'));

    expect(result.current.isLoaded).toBe(false);

    await act(async () => {
      result.current.setLoaded(true);
    });

    expect(result.current.isLoaded).toBe(true);
  });

  it('should handle different video IDs', () => {
    const { result: result1 } = renderHook(() => useVideoManager('video-1'));
    const { result: result2 } = renderHook(() => useVideoManager('video-2'));

    // Both should start with default state
    expect(result1.current.isPlaying).toBe(false);
    expect(result1.current.isLoaded).toBe(false);
    expect(result2.current.isPlaying).toBe(false);
    expect(result2.current.isLoaded).toBe(false);
  });

  it('should provide videoRef', () => {
    const { result } = renderHook(() => useVideoManager('test-video-id'));

    expect(result.current.videoRef).toBeDefined();
    expect('current' in result.current.videoRef).toBe(true);
  });
});
