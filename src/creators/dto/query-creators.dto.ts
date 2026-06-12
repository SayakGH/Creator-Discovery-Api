import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class QueryCreatorsDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  niche?: string;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minFollowers?: number;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsIn(['followers', 'engagement'])
  sortBy?: 'followers' | 'engagement';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
