import { PriceType } from 'src/shared/enums/price.enums';

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PaginationDto } from 'src/shared/dto/pagination.dto';

/**
 * PriceQueryDto
 * =================
 * Data Transfer Object for querying Price records
 *
 * All fields are optional - supports partial matching and range queries
 * Extends PaginationDto for pagination support
 */
export class PriceQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search by name, code, or identifier (supports partial matching)',
    example: 'search term',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  searchText?: string;

  @ApiPropertyOptional({ type: String, description: 'Business identifier for price' })
  @IsOptional()
  @IsString()
  priceId?: string;

  @ApiPropertyOptional({ type: String, description: 'Array of Reference IDs' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'Supports operators: gt, gte, lt, lte',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({
    enum: PriceType,
    description: 'Filter by type',
    default: PriceType.STANDARD,
  })
  @IsOptional()
  @IsEnum(PriceType)
  type?: PriceType;
}
