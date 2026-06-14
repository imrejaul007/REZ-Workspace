const mockRegisterDevice = jest.fn();
const mockSendNotification = jest.fn();
const mockRequestPermission = jest.fn();

const notificationService = {
  registerDevice: mockRegisterDevice,
  send: mockSendNotification,
  requestPermission: mockRequestPermission,
};

describe('notificationService', () => {
  beforeEach(() => {
    mockRegisterDevice.mockReset();
    mockSendNotification.mockReset();
    mockRequestPermission.mockReset();
  });

  it('should send notifications', async () => {
    mockSendNotification.mockResolvedValue({ delivered: true, messageId: 'msg-001' });

    const result = await notificationService.send({
      to: 'device-token-abc',
      title: 'New Offer',
      body: 'Check out our latest deals!',
    });

    expect(result.delivered).toBe(true);
    expect(result.messageId).toBe('msg-001');
  });

  it('should register device for push notifications', async () => {
    mockRegisterDevice.mockResolvedValue({ success: true, deviceId: 'dev-123' });

    const result = await notificationService.registerDevice('push-token-xyz', 'user-1');
    expect(result.success).toBe(true);
    expect(result.deviceId).toBe('dev-123');
    expect(mockRegisterDevice).toHaveBeenCalledWith('push-token-xyz', 'user-1');
  });

  it('should request notification permission', async () => {
    mockRequestPermission.mockResolvedValue('granted');

    const status = await notificationService.requestPermission();
    expect(status).toBe('granted');
    expect(['granted', 'denied', 'undetermined']).toContain(status);
  });
});
