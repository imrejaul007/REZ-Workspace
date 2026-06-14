import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('AuthService Simple Test', () => {
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(jwtService).toBeDefined();
    expect(configService).toBeDefined();
  });

  it('should mock JWT service correctly', () => {
    mockJwtService.sign.mockReturnValue('mock-token');
    const token = jwtService.sign({ test: 'payload' });
    expect(token).toBe('mock-token');
    expect(mockJwtService.sign).toHaveBeenCalledWith({ test: 'payload' });
  });

  it('should mock config service correctly', () => {
    mockConfigService.get.mockReturnValue('mock-secret');
    const secret = configService.get('JWT_SECRET');
    expect(secret).toBe('mock-secret');
    expect(mockConfigService.get).toHaveBeenCalledWith('JWT_SECRET');
  });
});