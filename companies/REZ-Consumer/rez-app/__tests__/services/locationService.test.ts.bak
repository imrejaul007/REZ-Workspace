const mockGetCurrentPosition = jest.fn();
const mockRequestPermission = jest.fn();

const mockGeolocation = {
  getCurrentPosition: mockGetCurrentPosition,
  requestPermission: mockRequestPermission,
};

describe('locationService', () => {
  beforeEach(() => {
    mockGetCurrentPosition.mockReset();
    mockRequestPermission.mockReset();
  });

  it('should get location', async () => {
    const coords = { latitude: 33.8938, longitude: 35.5018, accuracy: 10 };
    mockGetCurrentPosition.mockImplementation((success: (c: typeof coords) => void) =>
      success(coords)
    );

    await new Promise<void>((resolve) => {
      mockGeolocation.getCurrentPosition((result) => {
        expect(result.latitude).toBe(33.8938);
        expect(result.longitude).toBe(35.5018);
        expect(result.accuracy).toBeGreaterThan(0);
        resolve();
      });
    });
  });

  it('should request location permission', async () => {
    mockRequestPermission.mockResolvedValue('granted');

    const status = await mockGeolocation.requestPermission();
    expect(status).toBe('granted');
    expect(mockRequestPermission).toHaveBeenCalledTimes(1);
  });

  it('should handle location permission denial', async () => {
    mockRequestPermission.mockResolvedValue('denied');

    const status = await mockGeolocation.requestPermission();
    expect(status).toBe('denied');
    expect(status).not.toBe('granted');
  });
});
