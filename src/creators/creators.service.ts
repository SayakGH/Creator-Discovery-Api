import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryCreatorsDto } from './dto/query-creators.dto';

@Injectable()
export class CreatorsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryCreatorsDto) {
    const {
      q,
      niche,
      platform,
      minFollowers,
      country,
      sortBy,
      order = 'desc',
      page = 1,
      limit = 20,
    } = query;

    const where: Prisma.CreatorWhereInput = {};

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { bio: { contains: q, mode: 'insensitive' } },
        { niche: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (niche) {
      where.niche = niche;
    }

    if (platform) {
      where.platform = platform;
    }

    if (minFollowers !== undefined) {
      where.followerCount = { gte: minFollowers };
    }

    if (country) {
      where.audienceCountry = country;
    }

    const orderBy: Prisma.CreatorOrderByWithRelationInput = {};
    if (sortBy === 'followers') {
      orderBy.followerCount = order;
    } else if (sortBy === 'engagement') {
      orderBy.engagementRate = order;
    } else {
      orderBy.createdAt = 'desc';
    }

    const skip = (page - 1) * limit;
    const take = limit;

    const [data, total] = await Promise.all([
      this.prisma.creator.findMany({ where, orderBy, skip, take }),
      this.prisma.creator.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const creator = await this.prisma.creator.findUnique({ where: { id } });
    if (!creator) {
      throw new NotFoundException('Creator not found');
    }
    return creator;
  }
}
