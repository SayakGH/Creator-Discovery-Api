import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const mockBrand = {
  id: 'brand-uuid-1',
  email: 'test@example.com',
  password: 'hashed-password',
  createdAt: new Date(),
};

const mockPrismaService = {
  brand: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new brand and return brand details', async () => {
      mockPrismaService.brand.findUnique.mockResolvedValue(null);
      mockPrismaService.brand.create.mockResolvedValue(mockBrand);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockPrismaService.brand.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(mockPrismaService.brand.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          password: 'hashed-password',
        },
      });
      expect(result).toEqual({
        id: mockBrand.id,
        email: mockBrand.email,
        createdAt: mockBrand.createdAt,
      });
    });

    it('should throw ConflictException if email already registered', async () => {
      mockPrismaService.brand.findUnique.mockResolvedValue(mockBrand);

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(new ConflictException('Email already registered'));
    });
  });

  describe('login', () => {
    it('should return an access token on valid credentials', async () => {
      mockPrismaService.brand.findUnique.mockResolvedValue(mockBrand);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockPrismaService.brand.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockBrand.id,
        email: mockBrand.email,
      });
      expect(result).toEqual({ access_token: 'mock-jwt-token' });
    });

    it('should throw UnauthorizedException if brand not found', async () => {
      mockPrismaService.brand.findUnique.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      mockPrismaService.brand.findUnique.mockResolvedValue(mockBrand);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));
    });
  });
});
