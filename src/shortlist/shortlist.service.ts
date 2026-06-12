import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToShortlistDto } from './dto/add-to-shortlist.dto';

@Injectable()
export class ShortlistService {
  constructor(private prisma: PrismaService) {}

  async add(brandId: string, dto: AddToShortlistDto) {
    // Verify creator exists
    const creator = await this.prisma.creator.findUnique({
      where: { id: dto.creatorId },
    });
    if (!creator) {
      throw new NotFoundException('Creator not found');
    }

    // Check for duplicate
    const existing = await this.prisma.shortlist.findUnique({
      where: {
        brandId_creatorId: { brandId, creatorId: dto.creatorId },
      },
    });
    if (existing) {
      throw new BadRequestException('Creator already shortlisted');
    }

    return this.prisma.shortlist.create({
      data: { brandId, creatorId: dto.creatorId },
      include: { creator: true },
    });
  }

  async findAll(brandId: string) {
    const entries = await this.prisma.shortlist.findMany({
      where: { brandId },
      include: { creator: true },
      orderBy: { createdAt: 'desc' },
    });
    return entries.map((e) => e.creator);
  }

  async remove(brandId: string, creatorId: string) {
    const entry = await this.prisma.shortlist.findUnique({
      where: {
        brandId_creatorId: { brandId, creatorId },
      },
    });
    if (!entry) {
      throw new NotFoundException('Shortlist entry not found');
    }

    await this.prisma.shortlist.delete({
      where: { brandId_creatorId: { brandId, creatorId } },
    });

    return { message: 'Creator removed from shortlist' };
  }
}
