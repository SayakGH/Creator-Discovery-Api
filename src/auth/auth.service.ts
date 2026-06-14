import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.brand.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const brand = await this.prisma.brand.create({
      data: {
        email: dto.email,
        password: hashedPassword,
      },
    });

    return {
      id: brand.id,
      email: brand.email,
      createdAt: brand.createdAt,
    };
  }

  async login(dto: LoginDto): Promise<{ access_token: string }> {
    const brand = await this.prisma.brand.findUnique({
      where: { email: dto.email },
    });

    if (!brand) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(dto.password, brand.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: brand.id, email: brand.email };
    const access_token = this.jwtService.sign(payload);

    return { access_token };
  }
}
