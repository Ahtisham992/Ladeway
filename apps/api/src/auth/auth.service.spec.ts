import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            $system: {
              user: {
                findUnique: jest.fn(),
              },
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without passwordHash if validation is successful', async () => {
      const mockUser = { id: 1, email: 'test@example.com', passwordHash: 'hashed-password', tenantId: 1 };
      (prisma.$system.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');
      expect(result).toEqual({ id: 1, email: 'test@example.com', tenantId: 1 });
      expect(prisma.$system.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashed-password');
    });

    it('should return null if user is not found', async () => {
      (prisma.$system.user.findUnique as jest.Mock).mockResolvedValue(null);
      
      const result = await service.validateUser('test@example.com', 'password');
      expect(result).toBeNull();
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should return null if password validation fails', async () => {
      const mockUser = { id: 1, email: 'test@example.com', passwordHash: 'hashed-password', tenantId: 1 };
      (prisma.$system.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrong-password');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return an access token for the given user payload', async () => {
      const mockUser = { id: 'usr_123', email: 'test@example.com', tenantId: 'ten_456', role: 'ADMIN' };
      
      const result = await service.login(mockUser);
      
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: 'test@example.com',
        sub: 'usr_123',
        tenantId: 'ten_456',
        role: 'ADMIN',
      });
      expect(result).toEqual({ access_token: 'mock-jwt-token' });
    });
  });
});
