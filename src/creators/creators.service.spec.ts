import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { CreatorsService } from './creators.service';

const mockCreator = {
  id: 'uuid-1',
  name: 'Test Creator',
  platform: 'youtube',
  niche: 'tech',
  bio: 'A tech creator',
  followerCount: 100000,
  engagementRate: 5.0,
  audienceCountry: 'US',
  sampleContent: null,
  createdAt: new Date(),
};

const mockPrismaService = {
  creator: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
  },
};

describe('CreatorsService', () => {
  let service: CreatorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatorsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CreatorsService>(CreatorsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated results with correct meta', async () => {
      mockPrismaService.creator.findMany.mockResolvedValue([mockCreator]);
      mockPrismaService.creator.count.mockResolvedValue(50);

      const result = await service.findAll({ page: 2, limit: 10 });

      expect(result.meta).toEqual({
        total: 50,
        page: 2,
        limit: 10,
        totalPages: 5,
      });
      expect(result.data).toHaveLength(1);
      expect(mockPrismaService.creator.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
    });

    it('should apply keyword search filter with q param', async () => {
      mockPrismaService.creator.findMany.mockResolvedValue([]);
      mockPrismaService.creator.count.mockResolvedValue(0);

      await service.findAll({ q: 'fitness', page: 1, limit: 20 });

      expect(mockPrismaService.creator.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.objectContaining({ contains: 'fitness' }) }),
              expect.objectContaining({ bio: expect.objectContaining({ contains: 'fitness' }) }),
              expect.objectContaining({ niche: expect.objectContaining({ contains: 'fitness' }) }),
            ]),
          }),
        }),
      );
    });

    it('should compose niche, platform, and minFollowers filters', async () => {
      mockPrismaService.creator.findMany.mockResolvedValue([]);
      mockPrismaService.creator.count.mockResolvedValue(0);

      await service.findAll({
        niche: 'tech',
        platform: 'youtube',
        minFollowers: 10000,
        page: 1,
        limit: 20,
      });

      expect(mockPrismaService.creator.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            niche: 'tech',
            platform: 'youtube',
            followerCount: { gte: 10000 },
          }),
        }),
      );
    });

    it('should use default page and limit when not provided', async () => {
      mockPrismaService.creator.findMany.mockResolvedValue([]);
      mockPrismaService.creator.count.mockResolvedValue(0);

      await service.findAll({});

      expect(mockPrismaService.creator.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 20 }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a creator when found', async () => {
      mockPrismaService.creator.findUnique.mockResolvedValue(mockCreator);

      const result = await service.findOne('uuid-1');

      expect(result).toEqual(mockCreator);
      expect(mockPrismaService.creator.findUnique).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
    });

    it('should throw NotFoundException when creator not found', async () => {
      mockPrismaService.creator.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        new NotFoundException('Creator not found'),
      );
    });
  });
});
