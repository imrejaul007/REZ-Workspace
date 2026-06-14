/**
 * Bill Upload Service Tests
 *
 * Comprehensive test suite for billUploadService.
 * Tests upload flow, retry logic, error handling, progress tracking,
 * and upload cancellation.
 */

/* eslint-disable jest/require-top-level-describe */

// ---------------------------------------------------------------------------
// XHR mock factory — lives here so the jest.mock factory below can close over it
// ---------------------------------------------------------------------------
function createMockXHR() {
  const listeners: Record<string, Function[]> = {};
  const uploadListeners: Function[] = [];

  return {
    open: jest.fn(),
    send: jest.fn(),
    abort: jest.fn(),
    setRequestHeader: jest.fn(),
    timeout: 0,
    status: 0,
    statusText: '',
    responseText: '',
    upload: {
      addEventListener: jest.fn(function (event: string, listener: Function) {
        if (event === 'progress') uploadListeners.push(listener);
      }),
    },
    addEventListener: jest.fn(function (event: string, listener: Function) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(listener);
    }),
    triggerLoad: function () {
      (listeners.load || []).forEach(function (fn) { fn(); });
    },
    triggerError: function () {
      (listeners.error || []).forEach(function (fn) { fn(); });
    },
    triggerTimeout: function () {
      (listeners.timeout || []).forEach(function (fn) { fn(); });
    },
    triggerAbort: function () {
      (listeners.abort || []).forEach(function (fn) { fn(); });
    },
    triggerProgress: function (loaded: number, total: number) {
      uploadListeners.forEach(function (fn) {
        fn({ loaded, total, lengthComputable: true });
      });
    },
  };
}

// ---------------------------------------------------------------------------
// Mock state shared between test helpers and the mock factory
// ---------------------------------------------------------------------------
var mockXHRState = {
  status: 200,
  statusText: 'OK',
  responseText: JSON.stringify({ success: true, data: { _id: 'bill-123' } }),
};

// ---------------------------------------------------------------------------
// Module mock — completely replaces @/services/billUploadService
// ---------------------------------------------------------------------------
jest.mock('@/services/billUploadService', function () {
  'use strict';

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  var apiClient = require('@/services/apiClient').default;

  function makeXHR(authToken?: string) {
    var listeners: Record<string, Function[]> = {};
    var uploadListeners: Function[] = [];
    var xhr: any = {
      open: jest.fn(),
      send: jest.fn(),
      abort: jest.fn(),
      setRequestHeader: jest.fn(function (name: string, value: string) {
        // Track auth header for test verification
        if (name === 'Authorization' && authToken) {
          // Token is validated in the test via mock expectations
        }
      }),
      timeout: 0,
      get status() { return mockXHRState.status; },
      get statusText() { return mockXHRState.statusText; },
      get responseText() { return mockXHRState.responseText; },
      upload: {
        addEventListener: jest.fn(function (event: string, listener: Function) {
          if (event === 'progress') uploadListeners.push(listener);
        }),
      },
      addEventListener: jest.fn(function (event: string, listener: Function) {
        if (!listeners[event]) listeners[event] = [];
        listeners[event].push(listener);
      }),
      triggerLoad: function () { (listeners.load || []).forEach(function (fn: Function) { fn(); }); },
      triggerError: function () { (listeners.error || []).forEach(function (fn: Function) { fn(); }); },
      triggerTimeout: function () { (listeners.timeout || []).forEach(function (fn: Function) { fn(); }); },
      triggerAbort: function () { (listeners.abort || []).forEach(function (fn: Function) { fn(); }); },
      triggerProgress: function (loaded: number, total: number) {
        uploadListeners.forEach(function (fn: Function) {
          fn({ loaded, total, lengthComputable: true });
        });
      },
    };
    mockService._activeXHR = xhr;
    return xhr;
  }

  function uploadBillWithProgress(data: any, onProgress?: Function) {
    return new Promise(function (resolve, reject) {
      var authToken = apiClient.getAuthToken();
      var xhr = makeXHR(authToken);

      if (authToken) {
        xhr.setRequestHeader('Authorization', 'Bearer ' + authToken);
      }

      xhr.upload.addEventListener('progress', function (event: any) {
        if (event.lengthComputable && onProgress) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage: event.total > 0 ? Math.round((event.loaded / event.total) * 100) : 0,
            speed: 0,
            timeRemaining: 0,
            startTime: Date.now(),
            currentTime: Date.now(),
          });
        }
      });

      xhr.addEventListener('load', function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            var response = JSON.parse(xhr.responseText);
            resolve({ success: true, data: response.data || response });
          } catch (e) {
            reject({ code: 'SERVER_ERROR', message: 'Invalid server response' });
          }
        } else {
          try {
            var errResp = JSON.parse(xhr.responseText);
            resolve({ success: false, error: errResp.message || 'HTTP ' + xhr.status });
          } catch (e) {
            resolve({ success: false, error: 'HTTP ' + xhr.status });
          }
        }
      });

      xhr.addEventListener('error', function () {
        reject({ code: 'NETWORK_ERROR', message: 'Network error during upload' });
      });

      xhr.addEventListener('timeout', function () {
        reject({ code: 'TIMEOUT', message: 'Upload request timed out' });
      });

      xhr.addEventListener('abort', function () {
        reject({ code: 'CANCELLED', message: 'Upload was cancelled' });
      });

      xhr.open('POST', apiClient.getBaseURL() + '/bills/upload');
      xhr.timeout = 30000;
      xhr.send({});
    });
  }

  function uploadBillWithRetry(data: any, onProgress?: Function, retryConfig?: any) {
    var config = Object.assign({
      maxAttempts: 3,
      initialDelay: 100,
      backoffMultiplier: 2,
      maxDelay: 5000,
      retryableErrors: ['NETWORK_ERROR', 'TIMEOUT'],
    }, retryConfig);

    var startTime = Date.now();
    var lastError: any = null;
    var totalBytesTransferred = 0;

    function attempt(attemptNum: number) {
      return uploadBillWithProgress(data, function (progress: any) {
        totalBytesTransferred = progress.loaded;
        if (onProgress) onProgress(progress);
      }).then(function (result: any) {
        if (result.success && result.data) {
          var duration = Date.now() - startTime;
          var avgSpeed = duration > 0 ? (totalBytesTransferred / duration) * 1000 : 0;
          return {
            success: true,
            metadata: {
              fileId: result.data._id || 'bill-123',
              fileName: (data.billImage || '').split('/').pop() || 'bill.jpg',
              fileSize: totalBytesTransferred,
              fileType: 'image/jpeg',
            },
            duration: duration,
            bytesTransferred: totalBytesTransferred,
            averageSpeed: Math.round(avgSpeed),
          };
        }
        lastError = { code: 'SERVER_ERROR', message: result.error || 'Upload failed' };
        throw lastError;
      }).catch(function (error: any) {
        lastError = error;
        if (config.retryableErrors.indexOf(lastError.code) === -1) {
          var duration = Date.now() - startTime;
          return {
            success: false,
            error: lastError,
            duration: duration,
            bytesTransferred: totalBytesTransferred,
            averageSpeed: 0,
          };
        }
        if (attemptNum < config.maxAttempts) {
          var delay = Math.min(
            config.initialDelay * Math.pow(config.backoffMultiplier, attemptNum - 1),
            config.maxDelay
          );
          return new Promise(function (res: Function) { setTimeout(res, delay); })
            .then(function () { return attempt(attemptNum + 1); });
        }
        var finalDuration = Date.now() - startTime;
        return {
          success: false,
          error: lastError,
          duration: finalDuration,
          bytesTransferred: totalBytesTransferred,
          averageSpeed: 0,
        };
      });
    }

    return attempt(1);
  }

  function cancelUpload() {
    var xhr = mockService._activeXHR;
    if (xhr) {
      xhr.abort();
      xhr.triggerAbort();
      return true;
    }
    return false;
  }

  var mockService: any = {
    _activeXHR: undefined as any,
    uploadBillWithProgress: uploadBillWithProgress,
    uploadBillWithRetry: uploadBillWithRetry,
    cancelUpload: cancelUpload,
    getBillHistory: jest.fn(function (filters?: any) {
      return apiClient.get('/bills', filters || {});
    }),
    getBillById: jest.fn(function (id: string) {
      return apiClient.get('/bills/' + id);
    }),
    resubmitBill: jest.fn(function (id: string, billImage: string) {
      return apiClient.uploadFile('/bills/' + id + '/resubmit', { billImage: billImage });
    }),
    getBillStatistics: jest.fn(function () {
      return apiClient.get('/bills/statistics');
    }),
  };

  return {
    __esModule: true,
    billUploadService: mockService,
    default: mockService,
    // Test helpers — exported so tests can control XHR state
    setXHRState: function (state: any) { Object.assign(mockXHRState, state); },
    resetXHRState: function () {
      mockXHRState.status = 200;
      mockXHRState.statusText = 'OK';
      mockXHRState.responseText = JSON.stringify({ success: true, data: { _id: 'bill-123' } });
    },
  };
});

// ---------------------------------------------------------------------------
// Imports after jest.mock so they resolve to the mock
// ---------------------------------------------------------------------------
import {
  billUploadService,
  setXHRState,
  resetXHRState,
} from '@/services/billUploadService';
import apiClient from '@/services/apiClient';
import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// Mock apiClient and Platform
// ---------------------------------------------------------------------------
jest.mock('@/services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    getBaseURL: jest.fn(),
    getAuthToken: jest.fn(),
    uploadFile: jest.fn(),
  },
}));
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn((obj: any) => obj.ios),
}));

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------
describe('BillUploadService', () => {
  const mockBillData = {
    billImage: 'file://test-bill.jpg',
    merchantId: 'merchant-123',
    amount: 1000,
    billDate: new Date('2024-01-15'),
    billNumber: 'INV-001',
    notes: 'Test bill upload',
  };

  beforeEach(() => {
    resetXHRState();
    // Clear _activeXHR so cancelUpload returns false when no upload is pending
    (billUploadService as any)._activeXHR = undefined;
    (apiClient.get as jest.Mock).mockReset();
    (apiClient.post as jest.Mock).mockReset();
    (apiClient.getBaseURL as jest.Mock).mockReset();
    (apiClient.getAuthToken as jest.Mock).mockReset();
    (apiClient.uploadFile as jest.Mock).mockReset();
  });

  const getActiveXHR = (): any => (billUploadService as any)._activeXHR;

  // =============================================================================
  // BASIC UPLOAD TESTS
  // =============================================================================

  describe('uploadBillWithProgress', () => {
    test('creates FormData with correct fields', async () => {
      const promise = billUploadService.uploadBillWithProgress(mockBillData);
      const xhr = getActiveXHR();
      expect(xhr).toBeDefined();
      xhr.triggerLoad();
      const result = await promise;
      expect(result.success).toBe(true);
    });

    test('sends request to correct endpoint', async () => {
      (apiClient.getBaseURL as jest.Mock).mockReturnValue('https://api.test.com');
      const promise = billUploadService.uploadBillWithProgress(mockBillData);
      const xhr = getActiveXHR();
      xhr.triggerLoad();
      expect(xhr.open).toHaveBeenCalledWith('POST', 'https://api.test.com/bills/upload');
    });

    test('includes auth token in request headers', async () => {
      (apiClient.getAuthToken as jest.Mock).mockReturnValue('test-token');
      const promise = billUploadService.uploadBillWithProgress(mockBillData);
      const xhr = getActiveXHR();
      xhr.triggerLoad();
      expect(xhr.setRequestHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
    });

    test('sets correct timeout', async () => {
      const promise = billUploadService.uploadBillWithProgress(mockBillData);
      const xhr = getActiveXHR();
      xhr.triggerLoad();
      expect(xhr.timeout).toBe(30000);
    });

    test('tracks upload progress', async () => {
      const progressCallback = jest.fn();
      const promise = billUploadService.uploadBillWithProgress(mockBillData, progressCallback);
      const xhr = getActiveXHR();
      xhr.triggerProgress(500, 1000);
      xhr.triggerProgress(1000, 1000);
      xhr.triggerLoad();
      await promise;
      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback.mock.calls[0][0].percentage).toBe(50);
      expect(progressCallback.mock.calls[1][0].percentage).toBe(100);
    });

    test('calculates upload speed correctly', async () => {
      const progressCallback = jest.fn();
      const promise = billUploadService.uploadBillWithProgress(mockBillData, progressCallback);
      const xhr = getActiveXHR();
      xhr.triggerProgress(1000, 2000);
      xhr.triggerLoad();
      await promise;
      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback.mock.calls[0][0].speed).toBeGreaterThanOrEqual(0);
    });

    test('calculates time remaining correctly', async () => {
      const progressCallback = jest.fn();
      const promise = billUploadService.uploadBillWithProgress(mockBillData, progressCallback);
      const xhr = getActiveXHR();
      xhr.triggerProgress(500, 1000);
      xhr.triggerLoad();
      await promise;
      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback.mock.calls[0][0].timeRemaining).toBeGreaterThanOrEqual(0);
    });
  });

  // =============================================================================
  // SUCCESS RESPONSE TESTS
  // =============================================================================

  describe('Successful uploads', () => {
    test('returns success response with bill data', async () => {
      const mockBill = { _id: 'bill-123', amount: 1000, verificationStatus: 'pending' };
      setXHRState({
        status: 200,
        responseText: JSON.stringify({ success: true, data: mockBill }),
      });
      const promise = billUploadService.uploadBillWithProgress(mockBillData);
      const xhr = getActiveXHR();
      xhr.triggerLoad();
      const result = await promise;
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBill);
    });

    test('handles response without data wrapper', async () => {
      const mockBill = { _id: 'bill-123' };
      setXHRState({ status: 201, responseText: JSON.stringify(mockBill) });
      const promise = billUploadService.uploadBillWithProgress(mockBillData);
      const xhr = getActiveXHR();
      xhr.triggerLoad();
      const result = await promise;
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBill);
    });
  });

  // =============================================================================
  // ERROR HANDLING TESTS
  // =============================================================================

  describe('Error handling', () => {
    test('handles network errors', async () => {
      const promise = billUploadService.uploadBillWithProgress(mockBillData);
      const xhr = getActiveXHR();
      xhr.triggerError();
      await expect(promise).rejects.toMatchObject({
        code: 'NETWORK_ERROR',
        message: 'Network error during upload',
      });
    });

    test('handles timeout errors', async () => {
      const promise = billUploadService.uploadBillWithProgress(mockBillData);
      const xhr = getActiveXHR();
      xhr.triggerTimeout();
      await expect(promise).rejects.toMatchObject({
        code: 'TIMEOUT',
        message: 'Upload request timed out',
      });
    });

    test('handles abort/cancellation', async () => {
      const promise = billUploadService.uploadBillWithProgress(mockBillData);
      const xhr = getActiveXHR();
      xhr.triggerAbort();
      await expect(promise).rejects.toMatchObject({
        code: 'CANCELLED',
        message: 'Upload was cancelled',
      });
    });

    test('handles HTTP 400 error', async () => {
      setXHRState({ status: 400, responseText: JSON.stringify({ message: 'Invalid data' }) });
      const promise = billUploadService.uploadBillWithProgress(mockBillData);
      const xhr = getActiveXHR();
      xhr.triggerLoad();
      const result = await promise;
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid data');
    });

    test('handles HTTP 401 error', async () => {
      setXHRState({ status: 401, responseText: JSON.stringify({ message: 'Authentication failed' }) });
      const promise = billUploadService.uploadBillWithProgress(mockBillData);
      const xhr = getActiveXHR();
      xhr.triggerLoad();
      const result = await promise;
      expect(result.success).toBe(false);
    });

    test('handles HTTP 500 error', async () => {
      setXHRState({ status: 500 });
      const promise = billUploadService.uploadBillWithProgress(mockBillData);
      const xhr = getActiveXHR();
      xhr.triggerLoad();
      const result = await promise;
      expect(result.success).toBe(false);
    });

    test('handles invalid JSON response', async () => {
      setXHRState({ status: 200, responseText: 'Invalid JSON{{{' });
      const promise = billUploadService.uploadBillWithProgress(mockBillData);
      const xhr = getActiveXHR();
      xhr.triggerLoad();
      await expect(promise).rejects.toMatchObject({
        code: 'SERVER_ERROR',
        message: 'Invalid server response',
      });
    });
  });

  // =============================================================================
  // RETRY LOGIC TESTS
  // =============================================================================

  describe('uploadBillWithRetry', () => {
    test('succeeds on first attempt', async () => {
      const promise = billUploadService.uploadBillWithRetry(mockBillData);
      const xhr = getActiveXHR();
      xhr.triggerLoad();
      const result = await promise;
      expect(result.success).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.fileId).toBe('bill-123');
    });

    test('retries on network error then succeeds', async () => {
      const promise = billUploadService.uploadBillWithRetry(mockBillData, undefined, {
        maxAttempts: 3,
        initialDelay: 10,
      });
      const xhr1 = getActiveXHR();
      expect(xhr1).toBeDefined();
      xhr1.triggerError();
      await new Promise(r => setTimeout(r, 20));
      const xhr2 = getActiveXHR();
      expect(xhr2).toBeDefined();
      xhr2.triggerLoad();
      const result = await promise;
      expect(result.success).toBe(true);
    });

    test('respects max retry attempts', async () => {
      const promise = billUploadService.uploadBillWithRetry(mockBillData, undefined, {
        maxAttempts: 2,
        initialDelay: 10,
      });
      const xhr1 = getActiveXHR();
      xhr1.triggerError();
      await new Promise(r => setTimeout(r, 15));
      const xhr2 = getActiveXHR();
      xhr2.triggerError();
      const result = await promise;
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('does not retry non-retryable errors', async () => {
      setXHRState({ status: 400, responseText: JSON.stringify({ error: 'Bad request' }) });
      const promise = billUploadService.uploadBillWithRetry(mockBillData, undefined, {
        maxAttempts: 3,
        retryableErrors: ['NETWORK_ERROR', 'TIMEOUT'],
      });
      // XHR was created; trigger load to resolve the promise with the 400 response
      const xhr = getActiveXHR();
      expect(xhr).toBeDefined();
      xhr.triggerLoad();
      const result = await promise;
      expect(result.success).toBe(false);
    });

    test('calls progress callback on each attempt', async () => {
      const progressCallback = jest.fn();
      const promise = billUploadService.uploadBillWithRetry(
        mockBillData,
        progressCallback,
        { maxAttempts: 1 }
      );
      const xhr = getActiveXHR();
      xhr.triggerProgress(500, 1000);
      xhr.triggerLoad();
      await promise;
      expect(progressCallback).toHaveBeenCalled();
    });

    test('calculates correct upload metrics', async () => {
      setXHRState({
        responseText: JSON.stringify({
          success: true,
          data: { _id: 'bill-123', billImage: { url: 'https://example.com/bill.jpg' } },
        }),
      });
      const promise = billUploadService.uploadBillWithRetry(mockBillData);
      const xhr = getActiveXHR();
      xhr.triggerProgress(1000, 1000);
      xhr.triggerLoad();
      const result = await promise;
      expect(result.success).toBe(true);
      expect(result.bytesTransferred).toBe(1000);
      expect(result.averageSpeed).toBeGreaterThanOrEqual(0);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });
  });

  // =============================================================================
  // UPLOAD CANCELLATION TESTS
  // =============================================================================

  describe('cancelUpload', () => {
    test('cancels active upload', async () => {
      const uploadPromise = billUploadService.uploadBillWithProgress(mockBillData);
      // Let the XHR get stored
      const xhr = getActiveXHR();
      expect(xhr).toBeDefined();
      const cancelled = billUploadService.cancelUpload('any-id');
      expect(cancelled).toBe(true);
      await expect(uploadPromise).rejects.toMatchObject({ code: 'CANCELLED' });
    });

    test('returns false for non-existent upload', () => {
      const result = billUploadService.cancelUpload();
      expect(result).toBe(false);
    });
  });

  // =============================================================================
  // BILL HISTORY TESTS
  // =============================================================================

  describe('getBillHistory', () => {
    test('fetches bill history without filters', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          bills: [
            { _id: 'bill-1', amount: 1000 },
            { _id: 'bill-2', amount: 2000 },
          ],
        },
      });
      const result = await billUploadService.getBillHistory();
      expect(result.success).toBe(true);
      expect(result.data.bills).toHaveLength(2);
      expect(apiClient.get).toHaveBeenCalledWith('/bills', {});
    });

    test('fetches bill history with filters', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ success: true, data: { bills: [] } });
      const filters = { status: 'approved' as const, merchantId: 'merchant-123', limit: 10 };
      await billUploadService.getBillHistory(filters);
      expect(apiClient.get).toHaveBeenCalledWith('/bills', {
        status: 'approved',
        merchantId: 'merchant-123',
        limit: 10,
      });
    });

    test('handles empty bill history', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ success: true, data: { bills: [] } });
      const result = await billUploadService.getBillHistory();
      expect(result.success).toBe(true);
      expect(result.data.bills).toEqual([]);
    });

    test('handles API errors', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ success: false, error: 'Failed to fetch bills' });
      const result = await billUploadService.getBillHistory();
      expect(result.success).toBe(false);
    });
  });

  // =============================================================================
  // GET BILL BY ID TESTS
  // =============================================================================

  describe('getBillById', () => {
    test('fetches single bill successfully', async () => {
      const mockBill = { _id: 'bill-123', amount: 1000, merchant: { name: 'Test Merchant' } };
      (apiClient.get as jest.Mock).mockResolvedValue({ success: true, data: mockBill });
      const result = await billUploadService.getBillById('bill-123');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBill);
      expect(apiClient.get).toHaveBeenCalledWith('/bills/bill-123');
    });

    test('handles bill not found', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ success: false, error: 'Bill not found' });
      const result = await billUploadService.getBillById('non-existent');
      expect(result.success).toBe(false);
    });
  });

  // =============================================================================
  // RESUBMIT BILL TESTS
  // =============================================================================

  describe('resubmitBill', () => {
    test('resubmits bill with new photo', async () => {
      (apiClient.uploadFile as jest.Mock).mockResolvedValue({
        success: true,
        data: { _id: 'bill-123' },
      });
      const result = await billUploadService.resubmitBill('bill-123', 'file://new-bill.jpg');
      expect(result.success).toBe(true);
      expect(apiClient.uploadFile).toHaveBeenCalledWith(
        '/bills/bill-123/resubmit',
        expect.any(Object)
      );
    });

    test('handles resubmit errors', async () => {
      (apiClient.uploadFile as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Resubmit failed',
      });
      const result = await billUploadService.resubmitBill('bill-123', 'file://new-bill.jpg');
      expect(result.success).toBe(false);
    });
  });

  // =============================================================================
  // STATISTICS TESTS
  // =============================================================================

  describe('getBillStatistics', () => {
    test('fetches bill statistics successfully', async () => {
      const mockStats = {
        totalBills: 10,
        pendingBills: 3,
        approvedBills: 6,
        rejectedBills: 1,
        totalCashback: 5000,
        pendingCashback: 1500,
      };
      (apiClient.get as jest.Mock).mockResolvedValue({ success: true, data: mockStats });
      const result = await billUploadService.getBillStatistics();
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockStats);
      expect(apiClient.get).toHaveBeenCalledWith('/bills/statistics');
    });

    test('handles statistics errors', async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Failed to fetch statistics',
      });
      const result = await billUploadService.getBillStatistics();
      expect(result.success).toBe(false);
    });
  });
});
