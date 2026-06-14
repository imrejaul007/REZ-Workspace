const { Test } = require('@nestjs/testing');

describe('Auth Basic JavaScript Test', () => {
  it('should be defined', () => {
    expect(1 + 1).toBe(2);
  });

  it('should verify test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.MOCK_DATABASE).toBe('true');
  });

  it('should create NestJS testing module', async () => {
    const module = await Test.createTestingModule({
      providers: [
        {
          provide: 'TEST_SERVICE',
          useValue: { test: 'value' },
        },
      ],
    }).compile();

    const testService = module.get('TEST_SERVICE');
    expect(testService).toBeDefined();
    expect(testService.test).toBe('value');
  });
});